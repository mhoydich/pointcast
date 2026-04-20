# Brief — Field Node · macOS clipboard-intelligence PointCast client

**Audience:** Whoever claims this — a motivated developer (could be Codex in a longer-horizon session, could be a human contributor who picks this up from `/collabs#clients`, could be Mike running the build himself in a focused week).

**Source:** Mike 2026-04-20 12:15 PT chat — shared a full PRD authored via ChatGPT for a Magpie-style clipboard manager with intelligence + URL unfurl + action dashboard. The working name in that draft is "Field Node." This brief adapts that PRD into PointCast's brief format + adds the PointCast-client layer.

**Origin references:**
- GitHub: https://github.com/Good-Feels/magpie/releases (the macOS clipboard manager this is a rebuild of)
- Full PRD source: the ChatGPT conversation from `join us yee > clipboard-intelligence-prototype > PRD.md`
- PointCast client model: `/collabs#clients` on pointcast.xyz (the 5-client-type framing; Field Node is type 1)

---

## What Field Node is

A native macOS app that captures clipboard events locally, enriches them (URL unfurls, intent classification, session clustering), and surfaces a dashboard of promoted artifacts with suggested actions. It stays local-first. It also broadcasts selected items to PointCast as `DROP` blocks so the user's copy-and-forget signal stream becomes the user's public-or-editorial drop feed.

It's a clipboard manager on the surface and a personal context node underneath.

---

## Why build it

Three convergent threads:

1. **Magpie exists and is good** (native macOS, SQLite-backed, local-first, Sparkle updates) but optimizes for recall not prioritization. The clipboard is a field log, not an action surface.
2. **PointCast wants clients** (per `/collabs#clients`), and the most useful first client is the one that already matches a user's existing copy-paste habit. No new workflow required.
3. **The local-intelligence-layer thesis** (enrich + rank + suggest, not summarize + chat) is a category gap right now. Everyone is shipping cloud chat-over-everything. Nobody is shipping calm ranking on local memory.

---

## Architecture (Swift-first, Electron-never)

**App shell (user-facing):**
- Swift + SwiftUI + AppKit.
- `NSStatusItem` + `NSPopover` for menu-bar capture.
- A separate full-window "Dashboard" surface for the action view.
- A third "Detail" surface per-artifact.

**Capture layer (background):**
- `NSPasteboard.general.changeCount` polling.
- `NSWorkspace.shared.frontmostApplication` for source-app attribution.
- `LaunchAgent` for at-login persistence.

**Storage:**
- SQLite via GRDB (Swift wrapper).
- FTS5 for real full-text search.
- Schema oriented around events + artifacts + entities + sessions + action_candidates (not just clips).

**Intelligence:**
- v1: heuristics only. Type detection, URL dedupe, source weighting, time-window clustering, repeat-copy detection, action-word pattern matching.
- v2: optional local model for promoted-artifact summaries (small MLX-runnable model, opt-in only).
- v3: optional remote enrichment via explicit user toggle per-artifact.

**URL enrichment:**
- Open Graph scrape (title, description, image, site_name).
- Favicon resolution.
- Canonical URL detection.
- Cached in a local `url_cache` table keyed on canonical-URL.
- Entirely local by default; remote fetch behind an opt-in toggle.

**PointCast integration (the client layer):**
- Per-artifact "Send to PointCast" button.
- Routes to `POST /api/drop` with the artifact's URL + title + user's optional caption.
- Auto-attributes: `author: <user-slug-from-nodes.ts>`, `source: "Field Node vX.Y.Z <timestamp>"`.
- Optional "Broadcast my session" toggle: opens a persistent WebSocket to `/api/presence?kind=agent&name=field-node-<username>` — the user's Field Node shows up as a live noun on `/here` for the duration it's running.

---

## Product scope

### Phase 1 — MVP (~2 weeks of focused work)

Clipboard capture + local archive + URL detection + dashboard + unfurl.

- [ ] Menu-bar app with keyboard-first history.
- [ ] SQLite archive + source-app attribution.
- [ ] URL detection from plain-text clips (regex + canonical normalize).
- [ ] Local URL metadata cache (Open Graph unfurl).
- [ ] Report-style "today's captures" view — dated sections, source/domain breakdown, repeated-clip specimens.
- [ ] Dashboard sections: Recent Links, Likely Follow-ups, Copied Repeatedly, Research Sessions.
- [ ] Pin + delete + exclude-app controls.
- [ ] Paste-back into frontmost app (not just re-copy).
- [ ] Privacy: local-only, encrypted SQLite, exclude-when-locked, exclude-by-app.

### Phase 2 — Intelligence + PointCast client (~1 week)

- [ ] Session clustering (time-window + source-app + domain proximity).
- [ ] Heuristic action candidates per promoted artifact.
- [ ] Compare-set detection (N+ vendor/product links within one session).
- [ ] "Send to PointCast" per-artifact action → POST /api/drop.
- [ ] "Broadcast session to /here" toggle → WebSocket persistent agent.
- [ ] Keyboard workflow end-to-end (open menu → arrow → act → close).

### Phase 3 — Node runtime (~1 week, stretch)

- [ ] Background helper process ("the node") separate from the UI app.
- [ ] Connector primitives (Gmail, Calendar, GitHub, browser history).
- [ ] Rule-based automations (not agentic).
- [ ] Optional on-device summarization behind an opt-in toggle.

---

## Data model (v1)

```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL,              -- 'text' | 'url' | 'file' | 'image' | 'rich'
  value BLOB NOT NULL,             -- raw clipboard bytes (text as utf8)
  value_hash TEXT,                 -- sha256 for dedupe
  source_app TEXT,                 -- bundle id
  source_app_name TEXT,            -- display name
  captured_at INTEGER NOT NULL,    -- unix epoch ms
  excluded INTEGER DEFAULT 0       -- policy filter flag
);

CREATE TABLE artifacts (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL,              -- 'url' | 'snippet' | 'file' | 'task'
  canonical_url TEXT,              -- for type=url
  title TEXT,
  description TEXT,
  site_name TEXT,
  image_url TEXT,
  preview_body TEXT,
  first_seen_at INTEGER,
  last_seen_at INTEGER,
  recopy_count INTEGER DEFAULT 1,
  pinned INTEGER DEFAULT 0,
  promoted_score REAL DEFAULT 0
);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  topic_guess TEXT,
  artifact_count INTEGER DEFAULT 0
);

CREATE TABLE action_candidates (
  id INTEGER PRIMARY KEY,
  artifact_id INTEGER NOT NULL REFERENCES artifacts(id),
  kind TEXT NOT NULL,              -- 'open' | 'save' | 'follow_up' | 'compare' | 'summarize' | 'send_to_pointcast'
  label TEXT NOT NULL,
  suggested_at INTEGER NOT NULL,
  accepted_at INTEGER,
  dismissed_at INTEGER
);

-- Plus: entities, rules, jobs (enrichment queue), url_cache.
```

---

## Scoring model (interestingness)

`promoted_score = w1 * recency + w2 * recopy_count + w3 * source_weight + w4 * session_density + w5 * action_language_hit`

Simple weighted sum. Thresholds for promotion: score > 0.7. Tune on the existing Magpie archive (621 clips × 48 days of real data).

---

## PointCast client contract

When Field Node sends to PointCast:

```json
POST /api/drop
{
  "url": "https://...",
  "caption": "optional user note",
  "captured_at": "2026-04-20T12:30:00-08:00",
  "source_app": "Safari",
  "origin": "field-node",
  "author": "<user-slug>",
  "session_id": "optional local session cluster id"
}
```

When Field Node broadcasts presence:
- Opens `wss://pointcast.xyz/api/presence?kind=agent&name=field-node-<username>`.
- Sends `identify` with user's nounId (or falls back to one derived from their slug hash).
- Listens for `ping` heartbeats — no messages from PointCast server required beyond the broadcast.

---

## Deliverables

- [ ] Public GitHub repo (candidate: `github.com/Good-Feels/field-node` or fork of `magpie`).
- [ ] Signed + notarized DMG for macOS.
- [ ] `/releases` endpoint (appcast.xml or Sparkle feed).
- [ ] README + user docs at `/for-nodes#field-node` on pointcast.xyz.
- [ ] PointCast block at `/b/<id>` announcing v1 ship.

---

## Open questions

1. Does Field Node fork Magpie (respecting the Good-Feels org) or start fresh? (Fork keeps the release pipeline, loses naming freedom.)
2. Should the PointCast send-action be behind an explicit toggle per-artifact, or per-session?
3. How should Field Node authenticate to `/api/drop` given we don't have auth yet? Interim: rate-limit by IP + include `origin: field-node` so PointCast can filter if abuse emerges.
4. What's the simplest intelligence UI that doesn't feel generic-dashboard-y? Mike's taste leans Bell-Labs-report. The prototype at `join us yee > clipboard-intelligence-prototype` is the current design reference.

---

Filed by cc · 2026-04-20 12:35 PT. Source: Mike's shared ChatGPT session PRD (copied into PointCast brief format). Field Node is client type #1 in the `/collabs#clients` list. Claim it via `/ping` or PR.
