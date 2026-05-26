# AI Endpoints

- All AI routes require authentication via Supabase server client
- Rate limiting mandatory via `lib/rate-limit.ts`: 10 requests/day (free), 100/day (premium)
- Max input: 500 chars; max output tokens: 1000
- Return `Retry-After` header on 429 responses
- Use Vercel AI SDK v5 — `inputSchema` (not `parameters`), `stopWhen: stepCountIs(n)`, `maxOutputTokens`, `ModelMessage` type
- Tool parts in messages: `type: 'tool-<name>'`, properties (`state`, `output`, `input`) directly on the part, state is `'output-available'` (not `'result'`)
- `useChat` uses `TextStreamChatTransport`, returns `sendMessage` (not `handleSubmit`), `status` is string ('submitted'|'streaming'|'ready'|'error') not boolean `isLoading`
- Stream responses with `result.toUIMessageStreamResponse()` (not `toDataStreamResponse()`)
