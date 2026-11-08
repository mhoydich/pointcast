# Session JSON boundary — 2026-11-03

Base: `f46edb419ca7ef4fb7a2718d34902b0ec4268b85` (`main`).

## Finding and scope

Authenticated `GET /api/auth/session` serialized the internal `AuthSession`
record in both its ordinary response and the final-seven-days renewal branch.
That included the reusable `sessionToken`, despite issuing `pc_session` with
`HttpOnly; Secure; SameSite=Lax`. A script running on the signed-in origin
could therefore read a bearer credential from JSON. This is an authenticated
response exposure, not evidence of an unauthenticated session disclosure.

Reproduced independently with synthetic in-memory sessions only: the six new
normal/renewal tests failed against the original handler for KV, D1, and legacy
KV-to-D1 read-through. No production sessions, credentials, or tokens were
retrieved. No live provider sign-in was attempted.

## Change and compatibility

- Explicitly allowlist `session.userId` and `session.expiresAt` in both response
  branches. Keep `ok`, the user profile, and the renewal marker unchanged.
- Keep the bearer and authentication timestamp in the internal record. Renewal
  still uses the protected cookie, revokes the old session, and preserves the
  original authentication time.
- Document the JSON contract and explicitly type the public projection. A
  future internal session field must be deliberately added to that projection.
- Reviewed browser call sites in the auth client, session bridge, homepage,
  director desk, and Pond, plus static public JS/HTML. No browser use of the raw
  auth token was found; these clients use the user profile. The real
  `getSession()` client is exercised against the route in the new tests.

The active `~/pointcast` checkout contains unrelated auth work and was left
untouched. Work is isolated in the task workspace. The older account-profile
PR [#1287](https://github.com/mhoydich/pointcast/pull/1287) already contains this
same hardening among 39 changed files, with two KV tests. This draft extracts
that exact route change into a small prerequisite and adds the storage matrix
and client regressions. The matching route patch is deliberate, so the broader
profile PR can drop the hunk or inherit it after this lands. No feature work
from that PR is included here.

## Validation

- `node --test tests/auth-*.test.mjs tests/oauth-broadcast.test.mjs tests/super-auth.test.mjs tests/tezos-auth-singleton.test.mjs`: **84 pass**, including **11 new tests**.
- New coverage: normal and renewing GETs, exact public fields, future internal
  metadata, protected cookie flags, bounded renewal lifetime, old-token
  revocation, logout, original fresh-authentication age, missing/unknown/expired
  cookies, D1-only storage, KV fallback, migration, unbound storage, and browser
  profile restoration.
- D1 SQL runs against in-memory SQLite with a transactional D1-shaped adapter;
  KV uses an in-memory adapter. These do not establish Cloudflare-runtime or
  real-provider browser behavior.
- Scoped TypeScript checks passed with both the pinned Workers types and
  `@cloudflare/workers-types` **5.20261103.1**. The session route also bundles
  successfully with the installed esbuild.
- The whole-site `build:bare` result is recorded in the draft PR; it is separate
  from the directly tested Pages Function.

No merge, deploy, credential change, migration, or production access change
was performed. This is a narrow prerequisite for federation, not an
implementation of cross-site identity or voting.
