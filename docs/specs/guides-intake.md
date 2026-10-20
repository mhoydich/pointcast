# Guides Intake — bot data collection + intern feedback layer

Spec id: `pointcast.guides-intake/v1`. Endpoint: `/api/guides/intake` (CORS-open JSON).
Human room: `/guides/intake`. Task feed for bots: `/guides/intake.json`.

Agents, interns, readers and contributors send *material* for PointCast Guides
(tips, corrections, resources, schedules, results, datasets, assignment work).
Everything lands as **pending**. A human reviewer accepts, asks for changes, or
declines, always with written feedback. The submitter checks status and
feedback with the private **receipt** returned at submit time, can revise when
changes are requested, and accepted items become public on the guide.

Agents never publish, never contact people and never review. Review requires
the `GUIDES_ADMIN_KEY` Pages secret sent as header `X-Guides-Admin`.

## Storage (KV, prefix `gi:`)

`env.PC_GUIDES_KV` when bound, otherwise the shared `VISITS` namespace.

- `gi:item:<id>` — the full item (never includes the raw receipt)
- `gi:index` — array of ids, newest first, capped at 1000
- `gi:receipt:<sha256(receipt)>` — id

## Item shape

```json
{
  "id": "gi_xxxxxxxxxx",
  "spec": "pointcast.guides-intake/v1",
  "guide": "start-a-pickleball-team" | "network",
  "assignment": "GA-03" | null,
  "kind": "tip|correction|resource|schedule|result|dataset|assignment-work",
  "title": "<=120 chars",
  "body": "<=2000 chars",
  "sourceUrls": ["https://…"],          // 0..5, https only, no credentials
  "data": { … } | null,                  // optional structured rows, JSON <= 8000 bytes serialized
  "contributor": { "name": "<=60", "kind": "agent|intern|reader|contributor", "model": "<=60|null", "operator": "<=60|null", "verified": false },
  "status": "pending|accepted|needs-changes|declined",
  "feedback": [ { "at": ISO, "status": "...", "note": "<=1500", "rubric": { "useful": 1-5, "sourced": 1-5, "clear": 1-5, "safe": 1-5 } | null } ],
  "revisions": 0,
  "createdAt": ISO, "updatedAt": ISO
}
```

## Validation

- `guide` must be a known guide slug or `network`; `assignment` must be a known GA id or null.
- `title` >= 4 chars, `body` >= 20 chars.
- Privacy: reject when title/body/data contains an email address or a phone-number-looking string (`/\+?\d[\d\s().-]{8,}\d/`), with error `privacy`.
- Agents (`contributor.kind === 'agent'`) must include at least one `sourceUrl` for kinds `correction`, `resource`, `dataset`, `schedule`, `result` (error `source_required`). Agents should not submit `assignment-work` (error `agents_cannot_submit_assignment_work`).
- `consent` object required: `{ "noPrivateInfo": true, "humanReview": true }` (error `consent_required`).

## API

- `POST {action:"submit", guide, assignment?, kind, title, body, sourceUrls?, data?, contributor, consent}` → `201 {ok, id, receipt, status:"pending", check:"/api/guides/intake?receipt=…"}`. Receipt = 24 random base36 chars, shown once.
- `GET ?receipt=…` → `{ok, item}` (full item incl. feedback) — the submitter's view.
- `POST {action:"revise", receipt, title?, body?, sourceUrls?, data?}` → only when status is `needs-changes`; sets status back to `pending`, `revisions+1`.
- `GET` (no params) or `GET ?guide=slug` → public view: `{ok, spec, counts:{pending, accepted, needsChanges, declined, byGuide:{slug:{accepted,pending}}}, accepted:[public items, newest first, max 100]}`. Public item = item without `revisions` and with `feedback` reduced to the latest note. Pending/declined bodies are never public.
- `GET ?queue=1` + `X-Guides-Admin` → `{ok, items:[pending + needs-changes, oldest first]}`.
- `POST {action:"review", id, status:"accepted|needs-changes|declined", note, rubric?}` + `X-Guides-Admin` → appends feedback, sets status. `note` required (>= 10 chars): every decision carries written feedback.
- `OPTIONS` → 204 CORS preflight.
- Wrong/missing admin key → 401 `{ok:false, error:"admin_required"}`. Unknown receipt → 404.
- Rate limit buckets: `guides-intake:submit` (10 / 10 min), `guides-intake:revise` (20 / 10 min).
- Optional signed agent (header `PointCast-Agent-Id`, scope `guides:intake`) sets `contributor.verified = true` — same pattern as `/api/loom`.
