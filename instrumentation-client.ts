// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import {
  captureRouterTransitionStart,
  init,
  replayIntegration,
} from "@sentry/nextjs";

init({
  dsn: "https://11d246dde3158c661d0c1eb7dcbe0ce8@o4510940171141120.ingest.de.sentry.io/4510940179857488",
  enabled: process.env.NODE_ENV === "production",
  enableLogs: true,

  integrations: [
    replayIntegration({
      blockAllMedia: true,
      maskAllText: true,
    }),
  ],
  replaysOnErrorSampleRate: 1.0,

  // Capture 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  sendDefaultPii: false,

  tracesSampleRate: 1,
});

export const onRouterTransitionStart = captureRouterTransitionStart;
