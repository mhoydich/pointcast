# Voice Dispatch Phase 3 — persistence approach

Filed: 2026-04-24 ~02:10 PT (Sprint 18)
Owner: Claude Code (cc)
Status: scaffold shipped; live write pending `TALK_AUDIO` R2 binding.

## Scope of this doc

Decide how Voice Dispatch audio moves from "captured in the browser" to
"a TALK block on PointCast" without introducing moderation holes,
budget surprises, or a flow that depends on Mike being awake to
approve every recording.

Three questions this doc answers:

1. **Where does the bytes live?** — R2 key layout + TTL + quota
2. **How does a recording become a block?** — draft → promotion flow
3. **What's the moderation model?** — human-in-the-loop vs autopublish

## 1 — R2 key layout

R2 bucket name: `pointcast-audio` (Standard class, public egress off).

Key prefix scheme:

```
drafts/{blockIdSlug}.{ext}          # capture landing; 48h TTL
blocks/{blockId}/audio.{ext}        # promoted TALK block; permanent
archive/{YYYY}/{MM}/{blockId}.{ext} # cold-storage rollover past 1 year
```

- `drafts/…` — every successful POST to `/api/talk` writes here with
  a mock block id of form `T-XXXXXXXX`. Lifecycle rule auto-deletes
  entries 48 hours after `LastModified` so the bucket doesn't become
  a graveyard of abandoned captures.
- `blocks/…` — on promotion (see §2), cc copies the draft object to
  this path and writes a matching JSON block to `src/content/blocks/
  {blockId}.json` with `type: 'TALK'` + `audio.url`.
- `archive/…` — a weekly cron (future work) moves objects older than
  12 months into dated prefixes to keep `blocks/` listings small.

Public URL path: `https://pointcast.xyz/audio/{blockId}.{ext}` served
by a tiny Pages Function (`functions/audio/[...key].ts`) that proxies
the R2 fetch with a long cache header. Not shipped in this sprint —
`audioUrl` is stubbed in `/api/talk` until the function lands.

## 2 — Draft → block promotion

Flow for a well-formed `/api/talk` POST:

1. Client POSTs multipart form with audio blob + metadata
2. `/api/talk` validates shape, generates `mockId = T-XXXXXXXX`
3. If `env.TALK_AUDIO` bound → `PUT drafts/{mockId}.{ext}` + return
   `{ phase: '3-r2-draft', block: { audio: { key, url, ... } } }`
4. Client stores the mockId locally so the submitter can track it
5. **Out-of-band promotion** (human-in-loop): Mike or cc reviews
   draft objects in the R2 browser, runs
   `scripts/promote-talk-draft.mjs <mockId> <permanentBlockId>` which:
   - copies the R2 object to `blocks/{permanentBlockId}/audio.{ext}`
   - writes `src/content/blocks/{permanentBlockId}.json` with the
     original title/dek/channel/duration + the public audio URL
   - commits + pushes + deploys
6. The draft object ages out at 48 h if not promoted

The client never sees a permanent block id from `/api/talk` directly
— that path stays human-moderated. Cheap protection against a bad
recording ending up on the home grid without review.

## 3 — Moderation model

Options considered:

- **(a) Autopublish** — `/api/talk` allocates a real block id, writes
  both audio + JSON, triggers a Pages deploy.
  Risk: no human in loop. A bad recording lands on production before
  anyone notices. Pass.
- **(b) Queue + promote (shipped)** — drafts land in R2, promotion is
  manual. Cheap, safe, slow.
- **(c) Auto-transcribe + cc review** — Whisper.cpp via a Worker runs
  on every draft, cc reads the transcript, cc proposes a block draft
  via a PR for Mike to squash-merge. Interesting but expensive
  (compute + latency). Deferred to a Sprint 22+.

Pick (b) for Phase 3. Revisit (c) once Whisper-on-Workers is cheap
enough and cc has a stable identity heuristic for distinguishing
"Mike recording a dispatch" from "random visitor testing the endpoint."

## 4 — Quota + cost envelope

R2 free tier (at time of writing):
- Storage: first 10 GB free / month
- Class A ops (writes, lists): 1M/month
- Class B ops (reads): 10M/month
- Egress to Workers: free; egress to internet: metered past free tier

Voice Dispatch sizing:
- One 60s webm at 32 kbps ≈ 240 KB
- Rate limit: 5 uploads / 10 min / IP → ceiling of 720 uploads/day
  per single-IP attacker = ~170 MB/day before we'd need more buckets
  (IP-diverse flooding is a different mitigation — see §5)
- Typical real use: ~5–15 dispatches/day across all visitors
  → comfortably under 5 MB/day of drafts

48h draft TTL means steady-state draft storage ≈ 10 MB. Promoted
blocks accrue at the organic PointCast cadence (~1-3 dispatches/week
by Mike's current pattern) so the `blocks/` path grows by ≈ 30 MB/year.
Both fit the free tier for at least a year with headroom.

## 5 — IP-diverse flood protection

Rate limit is per-IP, so a botnet bypasses the 5-per-10-min cap. Two
defenses already in place:

1. File size cap at 2.5 MB rejects oversized uploads
2. Required fields (`title` ≥ 2 chars, channel in VALID_CHANNELS,
   duration in [10, 60]) block trivial payloads

Third defense to add when needed (not blocking this sprint):

3. Global rate on `talk:post:*` bucket — if total writes across all
   clients exceed 50/10min, return 503 + static "talk is resting"
   page. Implement as a second `rateLimit()` call with a
   constant `clientId: 'global'`.

## 6 — Open questions for Mike

These are also in RFC 0001; duplicated here for mint-run context:

- **Q7** — want a separate TALK channel or should TALK blocks use
  existing channel codes? Current scaffold defaults to FD and
  validates against the 9-channel set.
- **Q8** — author attribution. TALK blocks from `/api/talk` have no
  obvious author field — do they default to `visitor` or require a
  connected wallet to submit? Leaning wallet-required once Beacon is
  wired into the /talk page; public-open in the meantime for friction
  testing.
- **Q9** — R2 object retention for promoted audio. Forever, or set
  e.g. 5 years + lifecycle to Glacier-equivalent cold? I'd default
  forever since storage is cheap and TALK blocks are small.

## 7 — Readiness gates

What's shipped (Sprint 18):

- [x] `functions/_rate-limit.ts` helper with graceful-no-KV fallback
- [x] `/api/talk` POST gated at 5 per 10min per IP
- [x] `/api/talk` scaffolded to write to `env.TALK_AUDIO` if bound
- [x] `wrangler.toml` comments for both `PC_RATES_KV` + `TALK_AUDIO` bindings
- [x] This doc

What Mike provisions (one-time):

- [ ] `npx wrangler kv namespace create "PC_RATES_KV"` + paste id
- [ ] R2 bucket `pointcast-audio` created + bound as `TALK_AUDIO`
- [ ] 48h draft lifecycle rule on `drafts/` prefix in R2 settings

What cc ships after bindings land (Sprint 22ish):

- [ ] `functions/audio/[...key].ts` R2 proxy with cache headers
- [ ] `scripts/promote-talk-draft.mjs` for human-in-loop promotion
- [ ] Flip the `if (false)` gate in `/api/talk` to `true`
- [ ] E2E test — record / upload / list / promote / verify public URL

## 8 — Parking lot (future phases)

- Whisper-on-Workers transcription for auto-draft text
- TzKT mint flow for "mint this dispatch" on the TALK block page
- Spectrum-art cover image generation (noun.pics style palette from audio)
- Cross-post to Farcaster on promotion via Frames

---

*Small surface, clear seam. The scaffolding can sit here quietly until
Mike provisions the bucket, then flip a single boolean to go live.*
