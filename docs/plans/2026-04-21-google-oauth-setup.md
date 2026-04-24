# Google OAuth setup — what Mike needs to do in Cloudflare dashboard

**Status as of 2026-04-21 10:20 PT:** code exists at `functions/api/auth/google/start.ts` + `functions/api/auth/google/callback.ts`, but `/api/auth/google/start` returns 404 on prod. Root cause: the redirect URI isn't matched at Google's end because environment variables aren't set in Cloudflare Pages.

## What Mike needs to do (one-time, ~10 min)

### 1. Google Cloud Console — create OAuth client

1. Go to https://console.cloud.google.com/apis/credentials
2. Pick (or create) a project — name suggestion: "PointCast Auth"
3. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
4. Application type: **Web application**
5. Name: `pointcast.xyz`
6. Authorized JavaScript origins:
   - `https://pointcast.xyz`
7. Authorized redirect URIs:
   - `https://pointcast.xyz/api/auth/google/callback`
8. Click Create
9. Copy the **Client ID** and **Client secret** — you'll need both in step 2.

### 2. Cloudflare Pages dashboard — set env vars

1. Go to https://dash.cloudflare.com/
2. Navigate to Workers & Pages → `pointcast` → Settings → Environment variables
3. Under **Production**, add three variables:

   | Variable name | Value |
   |---|---|
   | `GOOGLE_CLIENT_ID` | (paste from step 1.9) |
   | `GOOGLE_CLIENT_SECRET` | (paste from step 1.9) — set as **Encrypted** |
   | `GOOGLE_REDIRECT_URI` | `https://pointcast.xyz/api/auth/google/callback` |

4. Save. Cloudflare automatically redeploys with the new env vars.

### 3. Verify

Once the redeploy finishes (~30 seconds):

```bash
curl -I https://pointcast.xyz/api/auth/google/start
# Expected: HTTP 302 Location: https://accounts.google.com/o/oauth2/v2/auth?...
```

Or in a browser: click the **"↪ sign in with google"** chip in the HUD drawer. Should land on Google's consent screen, then come back to `/` with a `pc_session` cookie set.

## What happens after sign-in

- A `pc_session` cookie is set on pointcast.xyz (HttpOnly, Secure, SameSite=Lax)
- The HUD's "sign in with google" chip auto-hides (reads the cookie)
- The HUD's YOU panel label changes from "anon" to user's name
- `/auth` page shows "YOUR STATE: ✓ google"

## Security notes

- The CSRF `state` cookie is HttpOnly + signed — prevents session fixation
- `GOOGLE_CLIENT_SECRET` lives only in Cloudflare secrets storage, never in code
- Cookies are SameSite=Lax so cross-origin POSTs can't hijack
- `pc_session` is base64-encoded JSON (email + name + sub), NOT an id_token — Google's id_token is validated at callback time then discarded

## Follow-ups (out of scope for env setup)

- Sign-out endpoint at `/api/auth/logout` that clears `pc_session`
- Real Beacon (Tezos) wallet connect — the HUD chip currently just links to `/profile#wallet`
- Multi-provider (add GitHub, etc.) if the network grows beyond Mike
