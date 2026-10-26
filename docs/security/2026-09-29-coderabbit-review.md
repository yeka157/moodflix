# CodeRabbit findings review — 29 September 2026

Reviewed all seven findings from `Moodflix Agent Findings.json` against the current checkout. All seven describe applicable gaps. Application fixes are implemented locally; closing the direct-database subscription-write bypass also requires the prepared RLS update to be applied and verified in the target environment. The report's recommendations were evaluated against the code and installed dependencies before implementation.

| Finding | Applied change |
| --- | --- |
| Replay exposes account text | Enable text masking and media blocking; disable default PII collection. |
| Release push amplification | Serialize per-account registration using a profile row lock; cap stored devices and subscriptions through the API; prepare restrictive RLS policies to prevent direct-client bypass; verify release metadata with TMDB; bound cron reads, sends, concurrency and time. |
| Chat file URL SSRF | Validate the full message history with explicit allowed parts and roles before SDK conversion. Reject files in user and assistant messages; preserve text and the two existing assistant tool result types. |
| Sentry credentials | Disable headers, cookies, bodies, query strings and IP collection in the installed SDK's RequestData integration. Scrub error and transaction request data again before sending. Remove the redundant mood URL decoding that could throw on a literal percent sign. |
| Push endpoint SSRF | Validate supported HTTPS service hosts during registration and again during delivery. Check public IP addresses in the actual socket DNS lookup. The installed web-push sender does not follow redirects. |
| Shared recent searches | Partition localStorage by authenticated account, remove the old shared entry, and clear the departing account on auth changes or protected-provider unmount. |
| Shared private query cache | Replace the module singleton with a new QueryClient for each keyed authenticated provider. Clear on departure and reload on identity changes. Old requests and mutation callbacks retain only the old, discarded client. Private keys can stay unchanged because accounts no longer share their owning cache. |

## Delivery limits

- 5 stored push devices and 100 stored release subscriptions per account. Existing-device refresh remains allowed at the cap; new registrations return a descriptive HTTP 409.
- 50 candidate releases per run, 250 push attempts per run, 50 attempts per account, and at most 5 concurrent sends.
- 3-second push deadline and socket timeout; stop starting new groups before the 20-second job work budget expires. Database operations remain subject to the platform's 30-second invocation limit.
- Deferred, unsent releases remain eligible after their release date. Progress is persisted per delivered release. A backlog can therefore delay notifications until a later daily run.
- Existing fallback release records are verified against TMDB before delivery. The allowlist and DNS validation also apply to previously stored push endpoints.
- Supported destination policy covers FCM, Mozilla's production push service, Apple push subdomains and Windows notification subdomains. Other services are rejected rather than accepted as arbitrary destinations. Apple and Mozilla endpoint patterns were checked against their [Apple documentation](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) and [Mozilla documentation](https://mozilla-services.github.io/autopush-rs/http.html).

## Verification

`npm run test:security` passes all 14 offline regression tests, including the real AI SDK's conversion of supported chat history and isolated route tests with mocked database/provider services. Tests cover malicious file URLs, host bypasses, private IPs, metadata forgery, registration caps, cron concurrency and send budgets, telemetry scrubbing, search separation and late cache completions, blocked browser storage, and deadlines consumed by a slow device query.

TypeScript, targeted Biome checks, and the production Webpack build pass. The build reports Serwist/Browserslist warnings. Repository-wide lint remains blocked by existing violations; framework lint reports an existing render-time mutation error in `components/movies/movie-detail-page.tsx`. No live database mutation, push delivery, Sentry transmission, deployment or migration was performed. Database locking and browser account switching still require environment-level acceptance testing.

## Second-pass findings and rollout dependency

The second pass found that the checked-in RLS rules allow authenticated users to insert subscription rows directly through Supabase, bypassing API validation and caps. The delivery-side endpoint checks and work limits remain effective, but the API caps alone are not a database-wide guarantee. The live policies have not been inspected.

Prepared `drizzle/security/2026-09-29-subscription-writes.sql`, and mirrored its restrictive policies into `drizzle/rls-policies.sql`. It blocks direct INSERT/UPDATE for `anon` and `authenticated`, even alongside permissive policies, while preserving read/delete permissions. The application's subscription writes already use server routes and Drizzle. Before applying it, verify a database backup, verify the runtime database role is not one of those client roles, and confirm any separate clients use the application endpoints. **Applied to production on 26 October 2026.** Before applying, a throwaway account could insert a forged release subscription and a push device pointing at `169.254.169.254` directly through the Supabase REST API. The live database also had a permissive UPDATE policy, "Users can claim push subscriptions on device switch", whose `USING` clause checks only `auth.role() = 'authenticated'`, so any signed-in user could reassign every account's push devices. The restrictive UPDATE policy blocks that as well.

The server connects as `postgres` (`BYPASSRLS`), so application writes are unaffected. After applying:

- Direct inserts on both tables are rejected with `new row violates row-level security policy "Subscription inserts require server validation"`.
- Direct reads and deletes of the user's own rows still work.
- On production, `POST`/`DELETE /api/notifications/subscribe` return 200, and a push registration to a private address returns 400.
- Existing data needed no cleanup: there was one push device, on `fcm.googleapis.com`, and no account was over either cap.
- The probe account and its rows were deleted.

Two new regression tests reproduced smaller issues and now pass after fixes: inaccessible localStorage can no longer interrupt account cleanup, and a slow device query can no longer cause the cron to start a push group after its work deadline.
