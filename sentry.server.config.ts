// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { init, requestDataIntegration } from "@sentry/nextjs";
import { scrubSentryRequest } from "@/lib/sentry-privacy";

init({
  beforeSend: scrubSentryRequest,
  beforeSendTransaction: scrubSentryRequest,
  dsn: "https://11d246dde3158c661d0c1eb7dcbe0ce8@o4510940171141120.ingest.de.sentry.io/4510940179857488",
  enabled: process.env.NODE_ENV === "production",

  // Enable logs to be sent to Sentry
  enableLogs: true,
  integrations: [
    requestDataIntegration({
      include: {
        cookies: false,
        data: false,
        headers: false,
        ip: false,
        query_string: false,
      },
    }),
  ],

  // Keep credentials and private request content out of telemetry
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
});
