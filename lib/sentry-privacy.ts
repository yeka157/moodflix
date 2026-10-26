import type { Event } from "@sentry/nextjs";

export function scrubSentryRequest<T extends Event>(event: T): T {
  if (event.request) {
    event.request.cookies = undefined;
    event.request.headers = undefined;
    event.request.data = undefined;
    event.request.query_string = undefined;
    if (event.request.url) {
      try {
        const url = new URL(event.request.url);
        url.username = "";
        url.password = "";
        url.search = "";
        url.hash = "";
        event.request.url = url.toString();
      } catch {
        event.request.url = undefined;
      }
    }
  }
  event.user = undefined;
  return event;
}
