# PointCast Auth Architecture

PointCast is moving from local-only identity (`pc:drumName`, `pc:wallet`) to a cookie-backed session model with provider-specific identities stored in Cloudflare KV. This scaffold keeps the existing Kukai wallet flow intact while adding a stable user model that can eventually span OAuth and wallet providers.

`/auth` is the public Super Auth switchboard. It separates identity providers
from broadcaster integrations: Google names the operator, Spotify supplies a
sound signal, Shopify supplies a read-only catalog signal, and Tezos proves an
object or wallet relationship.

## KV Model

- `user:{userId}` -> `PointCastUser`
- `identity:{provider}:{providerId}` -> canonical `userId`
- `session:{sessionToken}` -> `AuthSession`

`PointCastUser` is the account-level object. Each linked provider becomes an `AuthIdentity`, so later disconnect/link flows can remove or add one provider without deleting the whole user.

## Data Flow

### Live today: Kukai / Tezos

```mermaid
flowchart LR
  A[Browser / AuthMenu] -->|Beacon permission + sign| B[Kukai / Beacon]
  A -->|POST address + pk + sig + message| C[/api/auth/tezos]
  C -->|verifySignature + getPkhfromPk| D[Tezos verification]
  C -->|read/write| E[(KV: USERS)]
  C -->|Set-Cookie pc_session| A
  A -->|GET /api/auth/session| F[/api/auth/session]
  F -->|read session + user| E
```

### Live: Google OAuth

```mermaid
flowchart LR
  A[Browser / AuthMenu] -->|GET /api/auth/google| B[/api/auth/google]
  A -->|GET /api/auth/apple| C[/api/auth/apple]
  B -->|state + nonce + 302| D[Google OAuth]
  C -->|302 when env is ready| E[Apple OAuth]
  D -->|verified OIDC callback| F[/api/auth/google/callback]
  E -->|callback TBD| G[/api/auth/apple/callback]
  F --> H[(KV: USERS)]
  G --> H
```

## Provider Status

| Provider | Status | Notes |
| --- | --- | --- |
| Kukai | live | Client signs a PointCast login statement, server verifies Tezos signature, session cookie is issued. |
| Google | live when secrets are bound | Short-lived state + nonce, verified Google ID token, linked PointCast identity, and HttpOnly session cookie. |
| Spotify | live when secrets are bound | Broadcaster-only now-playing integration with encrypted credentials and `user-read-currently-playing`. |
| Shopify | credential-gated | Broadcaster-only authorization-code flow with HMAC/state checks, encrypted expiring offline credentials, and `read_products` only. |
| Apple | stub | Redirect URL is scaffolded, client-secret JWT + callback not implemented yet. |
| MetaMask | stub | Client can request a signature and post SIWE-shaped payload; server returns `coming-soon`. |
| Phantom | stub | Client can request a signature and post SIWS-shaped payload; server returns `coming-soon`. |
| Temple | placeholder | Provider type reserved; no client/server flow yet. |
| Umami | placeholder | Provider type reserved; no client/server flow yet. |

## Environment And Bindings

### Required binding

- `USERS` KV namespace binding for all auth routes and session storage.

### Google

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `POINTCAST_BROADCAST_EMAIL` (verified Google account that may connect the live Spotify signal)

The registered callback is `https://pointcast.xyz/api/auth/google/callback`;
the requested scopes are fixed to `openid email profile`.

### Spotify broadcast

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_TOKEN_ENCRYPTION_KEY` (32 random bytes, base64url encoded)

The registered callback is `https://pointcast.xyz/api/spotify/callback`.

Spotify authorization is deliberately separate from PointCast identity. A
Google-authenticated user with the `broadcaster` role can grant the narrow
`user-read-currently-playing` scope. Refresh/access tokens are AES-GCM
encrypted before they enter KV. Public responses contain track title, artist,
artwork, link, and on-air state only—never account identity, device,
playback position, or history.

The public policy at `/privacy` documents the same boundary. The dashboard
exposes a broadcaster-only disconnect control that deletes both the encrypted
Spotify credentials and cached signal immediately.

### Shopify catalog

- `SHOPIFY_CLIENT_ID`
- `SHOPIFY_CLIENT_SECRET`
- `POINTCAST_INTEGRATION_ENCRYPTION_KEY` (32 random bytes, base64url encoded)

The registered callback is `https://pointcast.xyz/api/shopify/callback`.

Shopify authorization is a broadcaster integration, not a PointCast identity.
It starts only from an authenticated Google account with the `broadcaster`
role. The callback validates the short-lived PointCast state, signed state
cookie, strict `*.myshopify.com` shop domain, and Shopify HMAC before requesting
an expiring offline token. Access and refresh credentials are AES-GCM encrypted
before entering KV and are rotated through Shopify’s refresh-token grant.

The scope is fixed in code to only `read_products`, so an environment change
cannot silently broaden it. PointCast does not
request orders, customers, checkout, payments, or write permissions. Public
status discloses only whether a catalog signal is connected; the shop domain
and granted scopes are returned only to the broadcaster. The dashboard
disconnect control deletes the encrypted credential immediately.

### Apple

- `APPLE_CLIENT_ID`
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY`
- `APPLE_REDIRECT_URI`
- `APPLE_SCOPES` (optional override, defaults to `name email`)

## Privacy

- Store the minimum viable identity payload in KV: provider, provider-native id, display name, optional avatar, and verification timestamp.
- Keep the session token in an `HttpOnly` cookie so client JS does not need raw session secrets.
- Wallet addresses are treated as provider ids; no additional profile enrichment is stored yet.
- The identity map is provider-scoped, which makes single-provider disconnects straightforward when the unlink UI/API is added.
- Logging out clears the PointCast session cookie; wallet disconnect remains wallet-specific so existing Kukai behavior is not broken.
- Spotify and Shopify are revocable broadcaster integrations. Neither is used
  as a general PointCast login identity.
