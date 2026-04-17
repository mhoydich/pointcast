# PointCast Multi-Provider Authentication Architecture

**Author:** PointCast Engineering  
**Status:** Design / RFC  
**Last Updated:** 2026-04-17

---

## Executive Summary

PointCast is transitioning from a device-local identity model (`localStorage`) to a production-grade, multi-provider authentication architecture. The design is optimized for Cloudflare Pages and KV, requires no relational database, and is explicitly privacy-maximizing: no emails, no social graphs, no PII unless a user explicitly opts in.

The system supports two categories of providers. **Social providers** (Google, Apple) use standard OAuth 2.0 / OIDC flows. **Web3 providers** (Kukai, Temple, Umami, MetaMask, Phantom) use cryptographic challenge-response flows (Beacon SDK payload signing, SIWE, SIWS). A single PointCast user can link multiple providers to one account.

---

## 1. Data Model & KV Schema

Since PointCast runs on Cloudflare Pages with no D1 or external database, the data model must be denormalized for constant-time `O(1)` KV lookups. Three primary entities are defined: **User**, **Identity Link**, and **Session**.

### 1.1 KV Namespace

Provision a dedicated namespace: `AUTH_KV`. This keeps auth data isolated from the existing `VISITS` namespace.

### 1.2 User Object

The User object is the canonical record for a PointCast account. A single user may have multiple linked provider identities.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique user ID. Format: `usr_{16-char hex}` |
| `createdAt` | `number` | Unix timestamp of account creation |
| `identities` | `UserIdentity[]` | All linked provider identities |
| `preferences` | `UserPreferences` | Migrated from localStorage on first sign-in |

**KV Key:** `user:{userId}`

```json
{
  "id": "usr_01hgw2a3b4c5d6e7",
  "createdAt": 1712345678,
  "identities": [
    { "provider": "google", "providerId": "10485739281", "linkedAt": 1712345678 },
    { "provider": "kukai", "providerId": "tz1VSUr8GL1H...", "linkedAt": 1712345700 }
  ],
  "preferences": {
    "drumName": "ElectricBoogaloo",
    "noun": "Synthesizer"
  }
}
```

### 1.3 Identity Link

Maps a provider's unique identifier to a PointCast `userId`. This enables constant-time lookup on login without scanning all users.

**KV Key:** `identity:{provider}:{providerId}`  
**KV Value (string):** `usr_01hgw2a3b4c5d6e7`

For example: `identity:google:10485739281` → `usr_01hgw2a3b4c5d6e7`

### 1.4 Session Object

Stores active server-side session state. The KV TTL is set to match `expiresAt` so Cloudflare automatically evicts expired sessions.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Session ID. Format: `sess_{32-char hex}` |
| `userId` | `string` | The PointCast user this session belongs to |
| `createdAt` | `number` | Unix timestamp of session creation |
| `expiresAt` | `number` | Unix timestamp of session expiration |
| `provider` | `AuthProvider` | Which provider was used to establish this session |

**KV Key:** `session:{sessionId}`  
**KV TTL:** 30 days (2,592,000 seconds)

### 1.5 Temporary OAuth State

During the OAuth authorization code flow, a short-lived state object is stored to prevent CSRF and to carry migration data.

**KV Key:** `oauth_state:{state}`  
**KV TTL:** 5 minutes (300 seconds)

```json
{
  "nonce": "a1b2c3d4-...",
  "preferences": { "drumName": "ElectricBoogaloo", "noun": "Synthesizer" }
}
```

### 1.6 Web3 Nonce

A single-use challenge nonce for Web3 signature flows.

**KV Key:** `nonce:{nonce}`  
**KV TTL:** 5 minutes (300 seconds)

```json
{ "provider": "kukai", "issuedAt": 1712345678 }
```

---

## 2. Session Lifecycle & Token Strategy

### 2.1 Opaque Token vs. JWT

PointCast uses **opaque session tokens** stored in an `HttpOnly` cookie. The decision against JWTs is deliberate:

| Criterion | Opaque Token (KV) | JWT (Stateless) |
|---|---|---|
| Revocation | Instant (delete KV key) | Requires blocklist (needs storage anyway) |
| Storage overhead | One KV read per request | Zero reads, but blocklist adds reads back |
| Privacy | Token reveals nothing | Payload is base64-decodable |
| Cloudflare KV latency | ~1ms (same region) | N/A |
| Complexity | Simple | Key rotation, algorithm confusion attacks |

Since every authenticated request already reads KV to fetch user preferences, the opaque token adds no meaningful overhead. The instant revocation capability is essential for security.

### 2.2 Cookie Configuration

```http
Set-Cookie: pc_session=sess_abc123...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000
```

- **`HttpOnly`:** Prevents JavaScript (XSS) from reading the token.
- **`Secure`:** Ensures the cookie is only transmitted over HTTPS.
- **`SameSite=Lax`:** Provides CSRF protection while permitting top-level navigations (essential for OAuth callbacks, which arrive as GET redirects).
- **`Max-Age=2592000`:** 30-day expiration.

### 2.3 Session Lifecycle

**Creation:** On successful authentication, the backend generates a cryptographically secure random session ID (`crypto.randomUUID()`), writes the Session Object to KV, and issues the cookie.

**Validation:** On protected routes, middleware parses the `pc_session` cookie, queries `session:{sessionId}` in KV, verifies the `expiresAt` timestamp, and fetches `user:{userId}`.

**Rotation (Sliding Expiration):** If a session is validated with fewer than 7 days remaining, the backend generates a new session ID, deletes the old KV entry, and issues a new cookie. This prevents long-lived sessions from expiring unexpectedly for active users.

**Revocation:** On explicit logout, the backend deletes the `session:{sessionId}` KV entry and sends `Set-Cookie: pc_session=; Max-Age=0` to clear the client cookie.

---

## 3. Per-Provider Integration Details

### 3.1 Google (OAuth 2.0 / OIDC)

Google provides the lowest-friction entry point for mainstream users.

**Flow:** Authorization Code Flow with OIDC `id_token`.

**Env Vars:**

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console → OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | Must match exactly: `https://your-domain.com/api/auth/google/callback` |

**Backend Flow (`functions/api/auth/google.ts`):**
1. `GET /api/auth/google/login`: Generate `state` + `nonce`, store in KV (5 min TTL), redirect to Google.
2. `GET /api/auth/google/callback`: Verify `state`, exchange `code` for `id_token`, verify JWT signature using Google's JWKS (via `jose`), extract `sub` claim as `providerId`, call `findOrCreateUser`, create session, set cookie.

**Scope:** `openid` only. We explicitly do not request `email` or `profile` to remain privacy-maximizing.

**Edge Cases:** The redirect URI must be registered exactly in Google Cloud Console. Trailing slashes or HTTP vs. HTTPS mismatches will cause `redirect_uri_mismatch` errors.

---

### 3.2 Apple (Sign in with Apple)

Required for iOS App Store compliance and preferred by privacy-conscious users.

**Flow:** OIDC Hybrid Flow with `form_post` response mode.

**Env Vars:**

| Variable | Description |
|---|---|
| `APPLE_CLIENT_ID` | Your Services ID (e.g., `com.yourapp.web`) |
| `APPLE_TEAM_ID` | 10-character Apple Developer Team ID |
| `APPLE_KEY_ID` | Key ID of your Sign in with Apple private key |
| `APPLE_PRIVATE_KEY` | PEM-encoded ES256 private key (newlines as `\n`) |
| `APPLE_REDIRECT_URI` | Must be HTTPS and registered in Apple Developer Console |

**Backend Flow (`functions/api/auth/apple.ts`):**
1. `GET /api/auth/apple/login`: Same as Google — generate state, redirect to Apple.
2. `POST /api/auth/apple/callback`: Apple sends a `form_post` (not a GET redirect). Parse `FormData`, verify `id_token` using Apple's JWKS, extract `sub`.

**Critical Note:** Apple requires the `client_secret` to be a dynamically generated JWT signed with your ES256 private key. This must be generated fresh for each token exchange. See `generateAppleClientSecret()` in `functions/api/auth/apple.ts`.

**Edge Cases:** Apple only sends the user's name and email on the *very first* authentication. Since PointCast does not request these scopes, this is not a concern. However, if you ever add `name` or `email` scopes, you must store them on the first callback because Apple will never send them again.

---

### 3.3 Tezos Wallets: Kukai, Temple, Umami (Beacon SDK)

PointCast's native ecosystem. All three wallets use the same Beacon SDK protocol.

**Flow:** Off-chain payload signing (Micheline-encoded).

**Env Vars:** None required.

**Frontend Flow:**
1. Call `POST /api/auth/web3/nonce` to receive a challenge nonce.
2. Use the Beacon SDK `DAppClient.requestSignPayload()` to prompt the user to sign a message containing the nonce.
3. Call `POST /api/auth/web3/verify` with the signature, public key, message, and nonce.

**Backend Flow (`functions/api/auth/web3.ts`):**
1. `POST /api/auth/web3/nonce`: Generate nonce, store in KV (5 min TTL), return to client.
2. `POST /api/auth/web3/verify`: Verify nonce, call `verifySignature(message, publicKey, signature)` from `@taquito/utils`, derive `providerId` using `getPkhfromPk(publicKey)`, call `findOrCreateUser`, create session, set cookie.

**Edge Cases:** Ensure the dApp metadata provided to `DAppClient` (name, icon URL) is accurate. Wallets display this branding during the signing request. Beacon SDK handles wallet routing (Kukai, Temple, Umami) automatically via the pairing QR code.

---

### 3.4 Ethereum Wallets: MetaMask (SIWE — EIP-4361)

**Flow:** Sign-In with Ethereum (SIWE).

**Env Vars:** None required (optionally `DOMAIN` for SIWE message validation).

**Frontend Flow:**
1. Call `POST /api/auth/web3/nonce` with `provider: "metamask"`.
2. Format a SIWE message (EIP-4361 spec) containing the nonce, domain, chain ID, and expiration.
3. Call `window.ethereum.request({ method: 'personal_sign', params: [message, address] })`.
4. Call `POST /api/auth/web3/verify`.

**Backend Flow:** Verify the SIWE message signature using `viem`'s `verifyMessage()`. Parse the message to validate `nonce`, `domain`, and `expirationTime` before accepting.

**Edge Cases:**
- **Mobile Safari deep-linking:** MetaMask mobile uses a deep link (`https://metamask.app.link/dapp/...`) to redirect users to the MetaMask app. This is unreliable on iOS Safari due to App Store policies.
- **WalletConnect v2:** The WalletConnect v2 protocol (used for connecting MetaMask mobile to desktop) has known reliability issues. Consider using `@wagmi/core` with a fallback to direct `window.ethereum` injection.
- **Status:** Currently hidden per `docs/wallet-metamask-diagnosis.md`. Keep hidden until Phase 3.

---

### 3.5 Solana Wallets: Phantom (SIWS)

**Flow:** Sign-In with Solana (Ed25519 signature).

**Env Vars:** None required.

**Frontend Flow:**
1. Call `POST /api/auth/web3/nonce` with `provider: "phantom"`.
2. Encode the message as UTF-8 bytes.
3. Call `window.solana.signMessage(messageBytes, 'utf8')`.
4. Call `POST /api/auth/web3/verify` with the Base58 signature and public key.

**Backend Flow:** Verify the Ed25519 signature using `tweetnacl`'s `nacl.sign.detached.verify()`. The `providerId` is the Base58-encoded public key.

**Edge Cases:** Similar deep-linking issues to MetaMask on mobile. Status: Hidden until Phase 3.

---

## 4. Privacy & Security

### 4.1 Privacy-Maximizing Data Collection

PointCast stores the absolute minimum required to identify a user across sessions.

| Provider | What We Store | What We Ignore |
|---|---|---|
| Google | `sub` claim (opaque string) | Email, name, profile picture, locale |
| Apple | `sub` claim (opaque string) | Email, name (only available on first login anyway) |
| MetaMask | Ethereum address (`0x...`) | ENS name, token balances |
| Phantom | Solana public key (Base58) | Token balances, NFT holdings |
| Tezos wallets | Tezos address (`tz1...`) | Token balances, NFT holdings, delegation |

No social graph data is collected. No analytics identifiers are linked to provider identities.

### 4.2 CSRF Protection

The `SameSite=Lax` cookie attribute provides the primary CSRF defense. For all state-mutating API endpoints (POST, PUT, DELETE), the frontend must include the custom header `X-PointCast-Request: 1`. Browsers enforce CORS preflight checks for custom headers, preventing simple cross-site form submissions from triggering authenticated actions.

### 4.3 Session Hijacking Protection

Sessions are stored server-side (KV) and can be instantly revoked. The `HttpOnly` flag prevents XSS from stealing the session token. The `Secure` flag prevents transmission over HTTP. For high-security scenarios, consider binding the session to the `User-Agent` string (stored in the Session Object), though this can cause issues on mobile networks where the UA changes.

### 4.4 Nonce Replay Prevention

All Web3 signature flows use single-use nonces stored in KV with a 5-minute TTL. The nonce is deleted from KV immediately upon verification, preventing replay attacks.

### 4.5 GDPR / Right to Delete

A "Delete Account" action must perform the following KV operations atomically (best-effort, as KV does not support transactions):

1. Fetch `user:{userId}` to enumerate all linked identities.
2. Delete all `identity:{provider}:{providerId}` keys.
3. Delete the `session:{sessionId}` key for the current session.
4. Delete the `user:{userId}` key.
5. Clear the session cookie.

---

## 5. Migration Path: localStorage → KV

### 5.1 Current State

PointCast currently identifies users via `localStorage` keys:
- `pc:drumName` — The user's chosen drum name.
- `pc:noun` — The user's chosen noun preference.
- `pc:wallet` — The connected wallet address.

### 5.2 Migration Strategy

The migration is designed to be **silent and automatic** on first sign-in, with no user friction.

**Step 1 — Anonymous Browsing (Unchanged):** Users who are not signed in continue to use `localStorage` as before. No changes to this path.

**Step 2 — Initiating Sign-In:** When the user clicks a provider in `AuthMenu.astro`, the frontend reads the current `localStorage` state and passes it to the auth flow:
- For **OAuth providers** (Google, Apple): The preferences are appended as query parameters to the `/login` initiation URL (e.g., `/api/auth/google/login?drumName=ElectricBoogaloo`). The backend stores them in the `oauth_state` KV object.
- For **Web3 providers**: The preferences are included in the JSON body of the `POST /api/auth/web3/verify` request.

**Step 3 — Account Creation:** If the backend determines this is a new identity (no existing `identity:` key), it creates the User Object with `preferences` populated from the migration data.

**Step 4 — Client Cleanup:** After the session cookie is established and the page reloads, `AuthMenu.astro` calls `GET /api/auth/me` and receives the server-side preferences. At this point, the frontend clears `pc:drumName`, `pc:noun`, and `pc:wallet` from `localStorage` and relies exclusively on the server state.

**Step 5 — Returning Users:** On subsequent sign-ins, the existing User Object is found via the Identity Link. The `localStorage` migration step is skipped (preferences already exist on the server).

---

## 6. Implementation Phases & Recommendations

### Phase 1 — Core Experience (This Week)

**Providers:** Google + Kukai

Google provides the lowest barrier to entry for mainstream users unfamiliar with Web3. Kukai maintains compatibility with the existing Tezos user base. This phase establishes both the Web2 (OAuth) and Web3 (Beacon signature) infrastructure, which all subsequent providers build upon.

**Estimated effort:** 1–2 days for Google (OAuth is well-documented). Kukai requires adapting the existing `WalletConnect.astro` Beacon SDK logic to call the new `/api/auth/web3/verify` endpoint.

### Phase 2 — Mobile & Ecosystem Expansion (Next Month)

**Providers:** Apple + Temple + Umami

Apple is a hard requirement for any future iOS App Store submission. Temple and Umami are the most popular Tezos wallets after Kukai and will satisfy the broader Tezos ecosystem. Apple is slightly more complex than Google (ES256 client secret generation, `form_post` callback), but the architecture is already designed for it.

### Phase 3 — Cross-Chain Evaluation (Future)

**Providers:** MetaMask + Phantom

**Recommendation:** Keep both hidden unless a specific cross-chain product feature is planned. The reasons are:

1. **User confusion:** If PointCast is a Tezos application, users who sign in with MetaMask will reasonably expect to pay with ETH. Supporting EVM/Solana wallets without cross-chain functionality creates a confusing UX.
2. **Maintenance overhead:** WalletConnect v2 is notoriously difficult to maintain on mobile web. SIWE requires a specific message format that changes between library versions.
3. **Architecture is ready:** The `functions/api/auth/web3.ts` file already contains the TODO stubs for both. Enabling them is a matter of implementing the verification logic, not redesigning the architecture.

---

## 7. File Structure

The following files implement this architecture:

```
functions/
  api/
    auth/
      google.ts       — Google OAuth 2.0 handler (login + callback)
      apple.ts        — Apple OIDC handler (login + form_post callback)
      web3.ts         — Web3 wallet handler (nonce + verify)
      me.ts           — Session validation + logout

src/
  lib/
    auth/
      types.ts        — Shared TypeScript types
      session.ts      — KV helpers: findOrCreateUser, createSession, etc.
  components/
    AuthMenu.astro    — Unified sign-in dropdown component

docs/
  auth-architecture.md         — This document
  google-oauth-quickstart.md   — Step-by-step Google OAuth setup guide
```

---

## 8. Dependency Summary

| Package | Purpose | Runtime |
|---|---|---|
| `jose` | JWT verification (Google/Apple `id_token`) | Cloudflare Workers (Edge) |
| `@taquito/utils` | Tezos signature verification | Cloudflare Workers (Edge) |
| `viem` | Ethereum SIWE signature verification | Cloudflare Workers (Edge) |
| `tweetnacl` | Solana Ed25519 signature verification | Cloudflare Workers (Edge) |
| `@airgap/beacon-sdk` | Tezos wallet connection (frontend only) | Browser |

All backend dependencies must be verified to be compatible with the Cloudflare Workers runtime (no Node.js built-ins like `fs`, `crypto` module — use the Web Crypto API instead).
