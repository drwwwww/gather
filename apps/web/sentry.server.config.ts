// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://05697130ec271884d5c324727e5f8682@o4511904277594113.ingest.us.sentry.io/4511904468434944",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.2,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Privacy: no user identity, cookies or request/response bodies (form
  // contents, member data) leave the app — matches the privacy policy.
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
});
