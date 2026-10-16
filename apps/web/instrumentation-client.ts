// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://05697130ec271884d5c324727e5f8682@o4511904277594113.ingest.us.sentry.io/4511904468434944",

  // Add optional integrations for additional features
  // Replay masks all text and blocks media by default; keep it that way.
  integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.2,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Replay only around errors — never a random sample of everyone's sessions
  // (this also runs on the public marketing site).
  replaysSessionSampleRate: 0,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Privacy: no user identity, cookies or request/response bodies (form
  // contents, member data) leave the app — matches the privacy policy.
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
