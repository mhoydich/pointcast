# Manus brief — create the Google OAuth client for /login

**Date:** 2026-07-05
**Requested by:** Claude Code (login-surface sprint)
**Requires Mike approval:** yes — uses Mike's Google account and touches production secrets.

## Context

`/login` on pointcast.xyz now offers Kukai, MetaMask, and Google sign-in. The
Google code path is fully implemented and deployed
(`functions/api/auth/google/index.ts` + `callback.ts`) but disabled until an
OAuth client exists. Right now clicking Google on /login bounces back with
"google oauth is not configured yet" — that is expected.

## Task

1. Open https://console.cloud.google.com/apis/credentials (Mike's Google
   account). Create or reuse a project named `pointcast`.
2. Configure the OAuth consent screen if prompted: External, app name
   `PointCast`, support email mhoydich@gmail.com, no extra scopes (the app
   only requests `openid email profile`), publish the app (not testing mode).
3. Create credentials → OAuth client ID → Web application:
   - Name: `pointcast-login`
   - Authorized JavaScript origins: `https://pointcast.xyz`
   - Authorized redirect URIs: `https://pointcast.xyz/api/auth/google/callback`
4. Copy the client ID and client secret, then set them as Pages secrets
   (terminal, repo root, Mike's wrangler login):

   ```
   npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name pointcast
   npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name pointcast
   ```

   No GOOGLE_REDIRECT_URI / GOOGLE_SCOPES needed — the code defaults are right.
5. Secrets apply to new deployments only — redeploy once
   (`npx wrangler pages deploy .dist-build --project-name pointcast --branch main --commit-hash $(git rev-parse HEAD)`),
   or ask cc to.

## Acceptance criteria

- https://pointcast.xyz/login → click Google → Google account chooser →
  consent → lands back on /login showing "signed in as" with a `google · <name>`
  identity line.
- Screenshot of the signed-in /login state.
- No Google tokens are stored anywhere — verify the only new KV keys in USERS
  are `user:*`, `identity:google:*`, `session:*`.

## Log result to

`docs/manus-logs/2026-07-05-google-oauth.md` — include the OAuth client name,
project, and screenshot. Do NOT log the client secret anywhere.
