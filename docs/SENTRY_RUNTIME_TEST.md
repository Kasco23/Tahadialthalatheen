# Testing Sentry runtime DSN

This document explains how to test the runtime DSN flow locally before deploying to Netlify.

1. Build the project:
   pnpm build

2. Serve the built `dist/` and the runtime DSN endpoint:

   SENTRY_DSN=your_public_sentry_dsn node scripts/serve-with-dsn.js

3. Open http://localhost:5173 in your browser.

4. Go to the landing page and click the "Break the world" / test error button.

5. In the browser DevTools Network tab, you should see a request to sentry's ingest endpoint (ingest.sentry.io) shortly after clicking.

6. Visit your Sentry project's Issues/Events dashboard to confirm the event arrived.

Notes:

- For Netlify, set the environment variable `SENTRY_DSN` in Site settings and deploy; the function `/.netlify/functions/get-sentry-dsn` will serve it at runtime.
- If you want the Netlify build plugin to set commits, also set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` in Netlify build environment.
