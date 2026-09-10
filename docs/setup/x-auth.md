# X sign-in and profile connection

Implemented locally on 2026-09-09. Enabling the feature requires the configuration and live checks below; a local test result does not demonstrate a working production X application.

## Enable

1. Use an X developer application with OAuth 2.0 enabled as a confidential Web App. Register `https://pointcast.xyz/api/auth/x/callback` exactly. Add a separate callback for each preview origin that is intentionally allowed to authenticate.
2. Configure `X_CLIENT_ID` and `X_CLIENT_SECRET` as Pages secrets in the intended environment. Never put their values in the repository, browser storage, or a user profile. Ensure the app's X API access permits the authenticated-user lookup.
3. Apply the existing auth migrations and `migrations/auth/0015_x_identity.sql` to `AUTH_DB`. The new partial unique index ensures each PointCast profile has at most one X account, including during concurrent callbacks.
4. Deploy the functions and UI together. `/api/auth/x?status=1` reports `available: false` until both secrets, D1, and the X identity index are present. Availability indicates local configuration readiness; it does not validate X account access or callback configuration remotely.
5. Verify real browser consent, new sign-in, linking from an existing profile, returning sign-in after an X handle change, cancellation, and disconnect with another sign-in method still attached. Also verify that an X account already owned by another PointCast profile cannot be linked.

## Contracts

- `GET /api/auth/x?status=1`: `{ok: true, provider: "x", available: boolean}`.
- `GET /api/auth/x?intent=login&returnTo=/me`: sign in using X. An existing PointCast session is not implicitly linked or merged.
- `GET /api/auth/x?intent=link&returnTo=/me`: explicitly link to the current PointCast profile. The original session must still be present at callback and have authenticated within the past 15 minutes.
- `GET /api/auth/x/callback`: registered OAuth callback; returns to a validated same-origin path with `auth=x` or `auth=x-linked`, or an `auth_error=x-...` code.
- `DELETE /api/auth/x`, JSON `{id: "stable-X-user-id"}`: disconnect the owned identity. Requires a same-origin browser request, a fresh session, and another non-X sign-in identity. It returns `{ok: true, removed: id}` or `{ok: false, reason}`.

The profile uses provider `x`, the stable numeric account ID, the verified-at timestamp, the current handle in `username`, name, and a validated X-hosted avatar URL. A typed handle or a manually entered profile URL does not establish ownership. Existing PointCast display names, roles, custom fields, and other identities are preserved.

## Consent boundary

The authorization uses PKCE S256 and requests `tweet.read users.read`, the scopes listed in X's endpoint mapping for `GET /2/users/me`. It requests no posting, DM, email, or offline access. The access token is used only for the authenticated-user lookup and is never stored in PointCast's database, browser response, or logs. No refresh token is requested.

Disconnect removes the PointCast identity link while preserving the other sign-in method and current PointCast session. It does not make a provider-side revocation request because no X token is retained. A user can also revoke PointCast in X's connected-app settings. Posting and programmatic conversations require a separate, explicitly authorized integration with additional scopes, delivery/reply tracking, and secure token storage; this sign-in flow does not enable them.

## Validation and references

`node --test tests/auth-x.test.mjs` runs the route handlers against an in-memory SQLite database using the real SQL migrations, transaction rollback, uniqueness checks, mocked X responses, and the Node equivalent of Workers' timing-safe comparison. It does not call X or alter live configuration.

- [X OAuth 2.0 authorization and PKCE](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code)
- [X confidential-client token exchange](https://docs.x.com/fundamentals/authentication/oauth-2-0/user-access-token)
- [X endpoint-to-scope mapping](https://docs.x.com/fundamentals/authentication/guides/v2-authentication-mapping)
- [Cloudflare D1 transactional batch behavior](https://developers.cloudflare.com/d1/worker-api/d1-database/)
