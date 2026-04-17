# PointCast Auth Architecture

PointCast is moving from local-only identity (`pc:drumName`, `pc:wallet`) to a cookie-backed session model with provider-specific identities stored in Cloudflare KV. This scaffold keeps the existing Kukai wallet flow intact while adding a stable user model that can eventually span OAuth and wallet providers.

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

### Scaffolded next: OAuth providers

```mermaid
flowchart LR
  A[Browser / AuthMenu] -->|GET /api/auth/google| B[/api/auth/google]
  A -->|GET /api/auth/apple| C[/api/auth/apple]
  B -->|302 when env is ready| D[Google OAuth]
  C -->|302 when env is ready| E[Apple OAuth]
  D -->|callback TBD| F[/api/auth/google/callback]
  E -->|callback TBD| G[/api/auth/apple/callback]
  F --> H[(KV: USERS)]
  G --> H
```

## Provider Status

| Provider | Status | Notes |
| --- | --- | --- |
| Kukai | live | Client signs a PointCast login statement, server verifies Tezos signature, session cookie is issued. |
| Google | stub | Redirect URL is scaffolded, callback/token exchange not implemented yet. |
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
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_SCOPES` (optional override, defaults to `openid email profile`)

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
