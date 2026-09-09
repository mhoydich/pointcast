# AI visit confirmation: local integration and release checks

The subscription onboarding uses PointCast's existing public MCP. An optional private receipt records an AI's one-time visit. This is not an AI-provider login, verified subscription, persistent agent grant, or authorization to read private account data.

## Endpoints

- GET /api/me/ai-companions: signed-in owner's receipts, selected app/approach, optional gentle preference, invitation ID, expiry, and confirmation time. No code or code hash is returned.
- POST /api/me/ai-companions: same-origin cookie-authenticated JSON with provider (claude, chatgpt, codex, claude-code, other), approach (subscription, api, other), and gentle (boolean). Generates a 256-bit invitation code, stores its SHA-256 hash, returns code and invitationId once. Lifetime ten minutes. Replacing an invitation invalidates the old code.
- MCP pointcast_pair({code}): atomically consumes an unexpired code and records a private visit. Returns confirmation and optional owner-selected invitation text. Returns no account identifier, profile data, session, or reusable credential.
- DELETE /api/me/ai-companions with {provider}: owner-only receipt removal and invitation cancellation. Does not uninstall the public MCP connector from the user's AI app.

Provider/plan choices are self-reported. A receipt proves the one-time code was used, not the provider's identity or billing tier. Anyone the owner shares the invitation with can confirm that visit; the invitation confers no further account capabilities.

## Deployment

Apply migrations/auth/0016_ai_companions.sql to the existing AUTH_DB alongside X's 0015 migration. Deploy pages and handlers together. The profile API returns unavailable rather than falling back to browser storage when D1 or the table is missing. No model-provider secret is needed for this feature.

The UI previews the optional gentler invitation before consent, has a manual clipboard fallback, clears invitations at expiry and account changes, and discards stale responses. No X identities or AI preferences are automatically published to on-chain or public profile pages.

## Verification

- Run node --test tests/ai-companions.test.mjs plus auth and MCP regressions.
- Verify current /api/mcp-v2 tools/list includes pointcast_pair as a write action.
- In a real signed-in browser, create a code from /me#ai-companion, call pointcast_pair in the user's configured AI client, then refresh the same profile and verify the timestamp.
- Verify replay, expiry, invitation replacement, deletion, another account, and sign-out.
- A local simulated client or provider response does not prove external OAuth consent, provider installation, or production delivery.

Programmatic X messages remain follow-on work; X identity consent requests no posting or DM scopes.
