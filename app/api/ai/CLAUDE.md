# AI Endpoints

- **Authentication is mandatory** — every AI route must verify `supabase.auth.getUser()` and 401 on null.
- **Rate limiting is mandatory** via `lib/rate-limit.ts`:
  - Free tier: 10 requests/day per user
  - Premium tier: 100 requests/day
  - Return `Retry-After` header on 429 responses
- **Input limits:** max 500 chars per user message; reject longer w/ 400.
- **Output limits:** `maxOutputTokens: 1000` on the model call.

## Vercel AI SDK v5 quirks

- `inputSchema` (not `parameters`) in `tool()`
- `stopWhen: stepCountIs(n)` (not `maxSteps`)
- `maxOutputTokens` (not `maxTokens`)
- `ModelMessage` type for message arrays
- Tool parts in messages: `type: 'tool-<name>'` (e.g., `'tool-suggest_genres'`), with `state`, `output`, `input` directly on the part (no nested `toolInvocation`). State `'output-available'` (not `'result'`).
- `useChat` uses `TextStreamChatTransport` w/ `api` option, returns `sendMessage` (not `handleSubmit`), `status` is string (`'submitted'|'streaming'|'ready'|'error'`) not boolean `isLoading`.
- Stream responses with `result.toUIMessageStreamResponse()` (not `toDataStreamResponse()`).
