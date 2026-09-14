# Shwa voice gateway

Source for the existing `shwa-voice-gateway` Cloudflare Worker, now maintained in PointCast. This move does not create a new Worker, reset the trial, or copy an API key. The frontend calls the fixed external gateway with credentials omitted; PointCast account authentication stays on PointCast.

## Browser origins

Production accepts two exact origins:

- `SITE_ORIGIN=https://talk-to-shwa.mhoydich.chatgpt.site` keeps the original station working.
- `POINTCAST_ORIGIN=https://pointcast.xyz` permits the native `/shwa/` room.

PointCast's second setting is accepted only when it equals that exact HTTPS apex origin. No wildcard, `www`, alternate port, or Pages preview is allowed. Localhost is available only with `ENVIRONMENT=development`. Responses vary by Origin and never enable credentialed CORS. Cookies and incoming Authorization headers are not forwarded to OpenAI. Origin checks are a browser boundary, not proof of PointCast sign-in; the capped voice trial remains guest accessible.

## Preserved lifecycle and limits

Keep the deployed Worker name `shwa-voice-gateway`, DO binding/class `VOICE_SUPERVISOR` / `VoiceSupervisor`, migration `v1`, singleton name `public-voice-v1`, and storage key `voice-ledger-v1`. Renaming any state identity can create a fresh allowance instead of preserving the existing experiment.

The supervisor atomically counts each upstream creation attempt, including failures: ten total lifetime attempts, at most two unresolved sessions, and ten attempts per hashed network per rolling hour. The fixed experiment expires at `2026-09-18T00:00:00Z`. Each voice session targets closure within 120 seconds; upstream outages can delay confirmed closure, so the provider project budget remains the outer spending control. Ambiguous creation/closure halts intake; alarms retry known-session closure. Only `session.closed` confirms release of a reservation.

Each visitor receives an independent fixed `gpt-live-1` session with public-only instructions and `store:false`. The optional Responses reasoning backend is fixed to `gpt-5.6-luna`, low reasoning, 256 output tokens, and no tools. The browser event allowlist permits close/mute/unmute only. A supervising sideband must open before the answer SDP is returned. Requests use `redirect:manual` because the deployed Workers runtime rejects `error`.

Opaque per-call control tokens authenticate `/session/close`, `/notes`, `/image`, `/research`, and `/context`. Controls remain only in browser memory; only their hashes are persisted. Notes/images/research expire ten minutes after call creation. Context updates require a live call, at most 480 UTF-8 bytes, at least two seconds apart, and at most 30 attempts; the response confirms a provider acknowledgment or reports unconfirmed. No automatic paid retries.

The gateway stores quota/lifecycle metadata, not audio, transcripts, prompts, generated media, notes, raw IPs, or provider response bodies. This is an application behavior, not a claim about OpenAI account retention.

## Local verification

The shared bounded schemas live at `src/components/shwa/lib` in the PointCast root. Run from this directory:

```sh
npm ci
npm run types
npm run check
npm test
npm run dry-run
```

Tests mock all provider requests and cover origin isolation, no credential forwarding, shared quotas, sideband startup/closure, timeout/restart handling, input bounds, card schemas, research citations, and payment parsing. Passing them does not establish live audible speech or actual wallet settlement.

The gateway is deployed separately from PointCast Pages. Deploy only after reviewing the source, with the existing account and Worker identity. The existing `OPENAI_API_KEY` remains a Cloudflare secret; no secret setup is needed for this source move. Confirm both exact origins with status/preflight requests after deployment, then verify the native room in the browser. No paid call is needed for CORS verification.
