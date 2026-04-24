# RFC 0001 — Voice Dispatch

- **Number:** 0001
- **Title:** Voice Dispatch — the audio layer of PointCast
- **Author:** Claude Code (cc) on request from Mike Hoydich
- **Date opened:** 2026-04-23
- **Status:** Draft — awaiting Mike sign-off, Codex review, Manus input on browser-capture friction
- **Target release:** Gamgee 1.0 (post-RC0)
- **Companion:** `docs/releases/gamgee.md`

## Overview

Voice Dispatch is the **audio layer** of PointCast Gamgee. It adds a new block type (`TALK`) and two public routes (`/talk` for recording, `/listen` for playback) that implement the "Voice Dispatch" pattern from the Gamgee vision doc: **10–60 second voice recordings, place-anchored, finite, async-first.**

## Motivation

From the Gamgee vision doc:

> 7. GEO-AUDIO SYSTEM (HIGH PRIORITY)
>
> Layers:
> 1. **Voice Dispatch** — 10–60 sec
> 2. Ambient Audio — environment capture
> 3. Chorus — multiple users in same place
> 4. Path Mode — audio unlocked while walking

> 11. KEY DESIGN PRINCIPLES
>
> ...
> 4. **Audio-first optionality**

And the release thesis:

> PointCast is not a social network. It is a competitive broadcast system where information, identity, and place converge into structured events.

Reading blocks is optional. **Tuning in is the point.** Voice Dispatch is the first concrete move toward "broadcast" being an audio verb, not a metaphor.

## Design

### Block type: `TALK`

New block type added to `src/lib/block-types.ts`:

```ts
TALK: {
  code: 'TALK',
  label: 'Talk',
  description: 'A 10–60 sec voice dispatch — audio-first, place-anchored.',
  icon: '🎙️',
}
```

`TALK` blocks extend the existing Block schema (v1) with an `audio` field:

```ts
interface TalkBlock extends BaseBlock {
  type: 'TALK';
  audio: {
    url: string;              // canonical audio URL, typically /audio/{id}.webm
    duration: number;         // seconds, 10 ≤ duration ≤ 60
    transcript?: string;      // human-provided in v1, optional
    format: 'webm' | 'ogg' | 'mp3' | 'aac';
    sizeBytes?: number;
  };
  readingTime?: string;       // unused for TALK; stored as "0 min" for schema parity
}
```

All existing Block fields (`id`, `channel`, `title`, `dek`, `timestamp`, `noun`, `mood`, `meta.location`, etc.) stay as-is.

### Route: `/talk` (capture)

Browser-based recording via `MediaRecorder` API. Mobile-first (most voice happens on phones).

**UX:**
1. Landing: channel chip chooser (default: FD · Front Door), 60-second recording button
2. Tap-to-start, tap-to-stop. Visual waveform during capture.
3. Auto-stop at 60s. Minimum 10s to submit.
4. Preview: waveform + play/pause + duration
5. "Record again" vs "Add details"
6. Details step: title (required), dek (optional), mood chip (optional), location auto-filled from `navigator.geolocation` if permitted, otherwise "El Segundo, CA" default
7. Submit → POST `/api/talk` → success redirect to `/b/{id}`

**Accessibility:** space to start/stop, keyboard shortcut for submit.

**Performance budget:** < 50KB JS for the page. Recorder wakes only on explicit tap (no passive mic init).

### Route: `/listen` (playback)

Feed of `TALK` blocks, newest first. Think radio tuner, not TikTok.

**UX:**
1. Single "Now playing" card at top with waveform + channel + title + location
2. Play/pause + skip prev/next + speed (1× / 1.25× / 1.5×)
3. Continuous mode toggle — plays through channel queue without user action
4. Channel filter chips along the top (FD, CRT, SPN, GF, GDN, ESC, FCT, VST, BTL)
5. Transcript panel (collapsible) when present
6. Keyboard: `space` play/pause, `j/k` prev/next, `[` `]` speed
7. Subtle presence dot: "N listeners tuned in right now" (reuses `/api/presence/snapshot`)

### Storage

**Cloudflare R2 bucket:** `pointcast-audio` (provisioned separately).

- Upload path: `POST /api/talk` → worker streams to R2 → returns public URL `/audio/{id}.{ext}`
- Max file size: **2 MB** (60s Opus @ 32 kbps ≈ 240 KB — plenty of headroom for higher-quality formats)
- Content-Type: `audio/webm` (MediaRecorder default) or `audio/ogg` depending on browser
- Served via `/audio/[id]` Cloudflare Pages function with `cache-control: public, max-age=31536000, immutable`

### API surface

```
POST  /api/talk
  Body: multipart/form-data
    - file: audio blob (audio/webm)
    - duration: seconds
    - channel: channel code (default: FD)
    - title: string (required)
    - dek: string (optional)
    - mood: string (optional)
    - locationText: string (optional, defaults "El Segundo, CA")
    - lat / lon: numbers (optional, from geolocation API)
  Response: { ok: true, block: { id, audio: { url, duration, format } } }

GET   /api/talk                    ← list recent TALK blocks (JSON Feed v1.1)
GET   /api/talk?channel=<code>     ← channel-filtered
GET   /api/talk?since=<iso>        ← pagination
```

### Security + rate limiting

- **Rate limit:** 3 recordings per IP per hour, KV-backed (`PC_RATELIMIT_KV`)
- **Profanity:** a simple wordlist filter flags — does not auto-delete. Flagged blocks go to a moderation queue rendered at `/talk/moderation` (admin-only).
- **Duration enforcement:** server-side validation after upload. Reject < 10 s and > 65 s (small tolerance for client clock drift).
- **No transcript generation in v1.** Human-provided only.
- **No DMs.** All TALK blocks are public. This follows the Gamgee "events > feeds" principle.

## Out of scope for Voice Dispatch v1

Explicitly deferred:

- **Transcription** (Whisper or similar) → v2 once cost model is clear
- **Cross-device sync via Nostr** → integrate with Sparrow v0.36+ separately
- **Moderation beyond wordlist + rate limit** → as needed
- **Monetization** → not a Gamgee concern
- **Geo tagging beyond coarse location text** → GEO-AUDIO Layer 2 (separate RFC)
- **Chorus mode (multiple simultaneous recordings same place)** → GEO-AUDIO Layer 3
- **Path mode (audio while walking)** → GEO-AUDIO Layer 4

## Rollout plan

| Phase | Scope | Target |
|---|---|---|
| **Phase 1 (this sprint)** | RFC + route scaffolds (`/talk`, `/listen`) + block-type addition + placeholder UI | Gamgee RC0 +1 day |
| Phase 2 | `MediaRecorder` capture client + `/api/talk` POST + R2 upload | Gamgee 1.0 -2 wks |
| Phase 3 | `/listen` full UI with continuous mode + channel filter + keyboard shortcuts | Gamgee 1.0 -1 wk |
| Phase 4 | First real TALK block by Mike — "Gamgee 1.0 is live, tune in." — recorded on site launch | Gamgee 1.0 |
| Phase 5 | Rate limits + moderation queue + profanity filter | Gamgee 1.0 +1 wk |

## Open questions for Mike

1. **Should `/talk` require wallet login (Beacon / Tezos)?** Or allow anon with just rate limit? My instinct: allow anon for v1, add wallet binding as a bonus (your wallet ID becomes part of the TALK block's `attribution`).
2. **Default channel when visitor doesn't pick one?** FD (Front Door) seems right — it's the "what's on the air right now" channel.
3. **60s hard cap, or extend to 90s?** The vision doc says 10–60. I'd start with 60 and see if 90 is ever missed.
4. **Default audio format?** `webm`/Opus is cleanest (all modern browsers). Safari iOS stores as `audio/mp4`. I'll accept both and transcode on the server if needed.
5. **Do TALK blocks mix into the `/` home feed, or get their own band?** I'd mix with a small 🎙️ glyph + "TAP TO LISTEN" chip on the card. Keeps the broadcast DNA intact.
6. **Public by default, always?** Or allow "just my wallet can play it" private mode for drafts? Probably v2 concern.
7. **Launch day trigger:** should Voice Dispatch go live with Gamgee 1.0, or earlier as an RC0.5 preview? I'd hold for 1.0 — the release train stays named and clean.

## Review & sign-off

- [ ] **Mike** — product direction on the 7 open questions
- [ ] **Codex** — review block-type schema extension, R2 binding plan, CF Pages function signature
- [ ] **Manus** — browser-capture friction audit (iOS Safari permissions, Android Chrome, desktop)
- [ ] **cc** — implement Phase 1 scaffolds (this branch: `feat/voice-dispatch-scaffolds`)

Once this RFC has Mike's sign-off, Phase 1 lands. Phase 2+ opens follow-up PRs.
