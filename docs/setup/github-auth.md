# GitHub sign-in for PointCast

Implemented for the shared PointCast account menu and `/auth`, using the existing `pc_session` cookie. Activation requires the credentials below and a live GitHub consent check. Automated tests use mocked provider responses. On September 14, 2026, the production Pages secret-name listing did not contain `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET`.

## Enable

1. The application owner registers a dedicated GitHub OAuth App for PointCast sign-in, with homepage `https://pointcast.xyz` and callback `https://pointcast.xyz/api/auth/github/callback`. Do not reuse an app with repository permissions. GitHub OAuth Apps have one registered callback; use a separate app for any intentionally supported preview environment.
2. Configure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` as Cloudflare Pages secrets for the intended environment. Do not commit values, use them in client code, or paste them into logs. No provider credential is created by this change.
3. Keep the existing `AUTH_DB` binding and auth migrations. The shared `users`, `identities`, `sessions` (including `authenticated_at`), and `oauth_states` schema handles GitHub without a new migration. GitHub uses D1 exclusively for atomic state consumption and identity ownership.
4. Deploy the functions and UI together. `GET /api/auth/github?status=1` returns `{ "ok": true, "provider": "github", "available": boolean }`. This is configuration readiness, not a remote validation of app registration or GitHub service access. The UI stays disabled while readiness is unknown or false.
5. Verify new sign-in, returning sign-in after a GitHub username change, cancellation, linking to an existing recently authenticated PointCast account, and rejection when the GitHub ID already belongs to another PointCast account. Verify return to the originating page and restoration with the shared PointCast session cookie.

## Contract

- `GET /api/auth/github?intent=login&returnTo=/auth` starts sign-in. Default intent is `login`; an existing PointCast session is never implicitly linked.
- `GET /api/auth/github?intent=link&returnTo=/auth` explicitly links GitHub to the current PointCast user. The original session must still exist at callback and must have authenticated within the past 15 minutes.
- `GET /api/auth/github/callback` completes OAuth and returns a same-origin path with `auth=github`, `auth=github-linked`, or a bounded `auth_error=github-...` code.

Authorization uses a random state, a separate secure HttpOnly `__Host-pc_github_oauth` browser cookie, PKCE S256, and ten-minute single-use D1 state. A callback from another browser, changed session, expired state, or wrong origin fails before using GitHub credentials. Login creates the same secure HttpOnly PointCast session used by all other account routes.

The requested OAuth scope is explicitly empty. `GET https://api.github.com/user` verifies public identity without `read:user`, `user:email`, `repo`, or offline permissions. Tokens carrying nonempty scopes are rejected because a reused OAuth app can return a broader pre-existing grant. Use a dedicated identity app; a user with an old broader grant can revoke it in GitHub's authorized OAuth apps settings and sign in again.

Only the stable numeric GitHub ID, username, display name, validated GitHub avatar URL, and verification time enter the PointCast identity record. Email, repository information, provider tokens, and provider admin flags are ignored. Matching email never links accounts or grants roles. Provider tokens are used transiently for the identity request and never stored. This flow does not enable GitHub repository access or automation.

## Validation and sources

`node --test tests/auth-github.test.mjs tests/auth-github-ui.test.mjs` exercises handlers with in-memory SQLite and mocked GitHub responses; it does not call GitHub or modify production. Existing shared auth regression tests also apply.

- [GitHub OAuth web flow, PKCE, state, and redirect URLs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [OAuth scopes and public identity without scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
- [Authenticated-user endpoint and public responses](https://docs.github.com/en/rest/users/users#get-the-authenticated-user)
- [Registering an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
