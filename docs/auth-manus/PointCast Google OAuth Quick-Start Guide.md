# PointCast Google OAuth Quick-Start Guide

This guide provides the shortest path to getting Google OAuth working in PointCast using Cloudflare Pages Functions. By following these steps, you can have Google Sign-In operational tomorrow.

## 1. Provisioning Google Cloud Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "PointCast Auth").
3. Navigate to **APIs & Services > OAuth consent screen**.
   - Choose **External** user type.
   - Fill in the required App information (App name: PointCast, User support email, Developer contact information).
   - Click **Save and Continue**.
   - Under **Scopes**, you do not need to add any specific scopes. The default `openid` scope requested by our backend is sufficient for privacy-maximizing authentication.
   - Add your test email addresses under **Test users** while the app is in the "Testing" publishing status.
4. Navigate to **APIs & Services > Credentials**.
   - Click **Create Credentials > OAuth client ID**.
   - Select **Web application** as the Application type.
   - Name it (e.g., "PointCast Web Client").
   - Under **Authorized JavaScript origins**, add your local development URL (e.g., `http://localhost:4321`) and your production domain (e.g., `https://pointcast.app`).
   - Under **Authorized redirect URIs**, add the exact callback URLs:
     - `http://localhost:4321/api/auth/google/callback`
     - `https://pointcast.app/api/auth/google/callback`
   - Click **Create**.
5. Note your **Client ID** and **Client Secret**.

## 2. Cloudflare Pages Configuration

You need to provision a KV namespace and set the required environment variables.

### Create KV Namespace
Run this using the Wrangler CLI:
```bash
npx wrangler kv:namespace create AUTH_KV
npx wrangler kv:namespace create AUTH_KV --preview
```

Update your `wrangler.toml` (if you use one) or bind the namespace in the Cloudflare Dashboard under **Pages > PointCast > Settings > Functions > KV namespace bindings**.
- Variable name: `AUTH_KV`
- Namespace: Select the one you just created.

### Set Environment Variables
In the Cloudflare Dashboard under **Pages > PointCast > Settings > Environment variables**, add the following for both **Production** and **Preview** environments:

- `GOOGLE_CLIENT_ID`: (From step 1)
- `GOOGLE_CLIENT_SECRET`: (From step 1)
- `GOOGLE_REDIRECT_URI`: 
  - Production: `https://pointcast.app/api/auth/google/callback`
  - Preview: `http://localhost:4321/api/auth/google/callback` (or your specific preview URL)

## 3. Code Integration Steps

1. **Copy Files:** Ensure the following files from the design deliverables are in your project:
   - `src/lib/auth/types.ts`
   - `src/lib/auth/session.ts`
   - `functions/api/auth/google.ts`
   - `functions/api/auth/me.ts`
   - `src/components/AuthMenu.astro`

2. **Update AuthMenu:** Place the `<AuthMenu />` component in your main layout or header. It is designed to live alongside or replace the existing `WalletConnect.astro` button.

3. **Install Dependencies:** You will need a lightweight JWT library that runs on Cloudflare Workers to verify the Google `id_token` signature securely.
   ```bash
   npm install jose
   ```
   *Note: The current `google.ts` stub uses a temporary insecure decode method. You MUST uncomment the `jose` implementation block in `functions/api/auth/google.ts` before deploying to production.*

## 4. Phase Recommendations

Based on the current state of PointCast (Tezos-first, localStorage identity), here is the recommended rollout strategy:

### Phase 1 (This Week): Google + Kukai
- **Why:** Google is the lowest friction entry point for mainstream users, instantly expanding your addressable market beyond crypto-natives. Kukai maintains your existing Tezos user base without disruption.
- **Action:** Implement the Google OAuth flow detailed above. Adapt your existing Beacon SDK logic in `WalletConnect.astro` to call the new `/api/auth/web3/nonce` and `/api/auth/web3/verify` endpoints instead of just updating localStorage.

### Phase 2 (Next Month): Apple + Tezos Ecosystem (Temple/Umami)
- **Why:** "Sign in with Apple" is mandatory if you ever plan to wrap PointCast in a mobile app wrapper for the iOS App Store, and it appeals to privacy-conscious users. Adding Temple and Umami solidifies your Tezos commitment.
- **Action:** Implement `functions/api/auth/apple.ts`. It is slightly more complex than Google because it uses a `form_post` callback and requires generating a client secret JWT dynamically.

### Phase 3 (Future Evaluation): MetaMask + Phantom
- **Why:** Unless PointCast has specific cross-chain functionality (e.g., paying for drums in ETH or SOL), adding EVM and Solana wallets introduces significant UX confusion and technical debt (WalletConnect v2 is notoriously difficult to maintain on mobile web).
- **Action:** Keep MetaMask and Phantom hidden (as diagnosed in `docs/wallet-metamask-diagnosis.md`) until a clear product need arises. The architecture supports them via SIWE and SIWS when you are ready.

## Open Questions for Mike

1. **JWT Verification Library:** The architecture recommends `jose` because it is Edge-compatible (runs on Cloudflare Pages Functions). Are you comfortable adding this dependency?
2. **Local Storage Migration:** The current design automatically migrates `pc:drumName` and `pc:noun` to the server on the *first* sign-in. Do you want to prompt the user before doing this, or is silent migration acceptable?
3. **Session Expiration:** The design uses a 30-day rolling session. Is this appropriate for PointCast's security model, or do you prefer shorter sessions?
