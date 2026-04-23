# AGENTS.md

**Multi-agent workflow for pointcast.xyz v2**

Three builders: Claude Code, Manus, Codex. One director: Mike. This doc defines roles, coordination, handoffs, and the parallel tracks running alongside engineering.

---

## Roles

### Claude Code — primary engineer
**Owns:** the codebase on `blocks-rebuild` and later `main`
**Does:**
- Architecture, schema, rendering, routing
- Block migration from v1 to new schema
- SmartPy / LIGO FA2 contract implementation
- Beacon wallet integration
- JSON / RSS / JSON-LD feed generation
- Agent-native endpoints (`/for-agents`, `sitemap-blocks.xml`)
- Responding to open questions by proposing resolutions in PRs

**Reads on every session:** `BLOCKS.md`, `AGENTS.md`, `TASKS.md`, **`docs/inbox/`** + **`/api/ping?action=list`** (Mike's async messages — see `src/pages/ping.astro` + `functions/api/ping.ts`), recent commits

**Topic-expand processing rule** (per Mike 2026-04-18): when an `/api/ping` entry has `expand: true` (visible in the KV metadata or in the message body's `.expand` field), cc reads the topic, drafts a block in cc-voice editorial (NOT in Mike's voice — VOICE.md applies), picks the best channel + type for the topic, sets:
- `author: 'mh+cc'` if the topic is genuinely Mike's thinking (he provided the substance, cc the prose)
- `author: 'cc'` if the topic is a more general request that cc could write without Mike-specific knowledge
- `source: "/api/ping key {key} from {from} on {timestamp}"` linking back to the originating ping

After drafting + publishing, cc deletes the processed ping from KV (or moves it to `docs/inbox/processed/` if KV is unbound). One ping → one block. The recap notes which ping became which block id.
**Lives in:** local repo, Vercel/Netlify preview URL

### Manus — operations and computer-use
**Owns:** anything behind a login or requiring a real browser session
**Does:**
- Vercel / Netlify deploy settings, domain binding, SSL verification
- DNS config at the registrar
- Cloudflare rules (if in use)
- objkt.com collection creation, listing setup, metadata upload
- End-to-end mint testing as a real user: install Kukai/Temple, fund with test tez, connect to PointCast, execute mint, verify token appears in wallet and on objkt
- Screenshots for `/docs/manus-logs/`
- Launch-day cross-posting: Farcaster cast, X post, Nextdoor, objkt collection announcement
- Analytics setup (Plausible or Fathom, no Google)

**Reports:** writes a dated markdown log to `/docs/manus-logs/YYYY-MM-DD.md` after each session, noting what was done, what was observed, what broke, screenshots embedded or linked

### Codex — specialist reviewer
**Owns:** quality gate before production merges
**Does:**
- Code review on Claude Code PRs before merge to `main`
- Alternative UI passes when Mike wants a comparison aesthetic on a specific component
- Contract logic review — SmartPy / Michelson correctness spot-check
- Second opinion on architectural decisions when flagged by Claude Code or Mike

**Does not:** commit directly to the codebase. Writes to `/sketches/` for UI alternatives, or leaves PR comments. Called on-demand, not persistent.

### Mike — director
**Owns:** strategy, content, approvals, open questions
**Does:**
- Daily TASKS.md review, clears blockers, reassigns as needed
- Answers open questions in BLOCKS.md and AGENTS.md
- Writes dispatch content (the actual words)
- Makes brand, aesthetic, and GTM calls
- Approves merges to `main`
- Approves all contract deployments

---

## Coordination mechanism

### The Git repo is the primary bus
All state lives in files. No external database, no shared Slack channel, no ephemeral context. If it isn't in the repo, it didn't happen.

### Source-of-truth files
- `BLOCKS.md` — design directive (v2 spec)
- `AGENTS.md` — this doc, workflow directive
- `TASKS.md` — live task queue, checked on every session start
- `CLAUDE.md` — Claude Code's GitHub Action instructions
- `docs/setup/agent-bridge.md` — Claude, Manus, and Codex connection guide
- `docs/claude-code-logs/`, `docs/manus-logs/`, `docs/codex-logs/` — per-agent session logs

### TASKS.md format
Living list, checked on session start:

```
- [ ] (owner) task description — status — notes
- [ ] (CC) Migrate v1 dispatches to Block schema — in-progress — 4 of 12 done
- [ ] (M) Connect objkt collection to PointCast frontend — queued — waiting on CC contract address
- [ ] (MH) Answer: custom Noun set commission or noun.pics? — waiting-on-mh
- [x] (CC) Set up BLOCKS.md schema types — done — commit abc1234
```

Owners: **CC** (Claude Code), **M** (Manus), **X** (Codex), **MH** (Mike)
Statuses: `queued`, `in-progress`, `blocked`, `handoff`, `waiting-on-mh`, `done`

### Handoff protocol
When one agent needs another:
1. Write the handoff as a task in TASKS.md with new owner
2. Commit with message prefix `handoff: <from> → <to>: <brief>`
3. Target agent picks it up on next session

If the handoff needs Mike, status becomes `waiting-on-mh` and task is flagged in the daily review.

### Programmatic layer (optional)
If a dispatcher (Cowork, custom orchestration) is wired in, it can:
- Poll the repo for new commits and notify relevant agents
- Trigger Manus on specific commit prefixes (`deploy:` → Manus deploys; `publish:` → Manus cross-posts)
- Route Mike's chat commands to the appropriate agent

Current bridge:

- GitHub issue/PR comments containing `@claude` trigger `.github/workflows/claude.yml`.
- The Claude workflow runs `anthropics/claude-code-action@v1` with `claude-opus-4-7`.
- Manus is dispatched locally through `node scripts/manus.mjs create --file docs/briefs/<brief>.md`.
- Use `.github/ISSUE_TEMPLATE/agent-handoff.yml` for structured work requests.

Start simple — the repo is enough. Add deeper MCP automation once the workflow is stable and handoff friction is visible.

---

## Parallel tracks

Four streams running simultaneously. Each has a track lead.

### Track 1 — Engineering (lead: CC)
BLOCKS.md is the spec. Phases 1-4 from that doc:
1. Visual rebuild (Block schema, grid, single-block pages)
2. Agent layer (`/for-agents`, JSON-LD, feeds)
3. Tezos faucet (FA2 contract, Beacon, daily claim)
4. Paid mints (dispatches as editions, Good Feels phygital drops)

### Track 2 — Design & assets (lead: MH, with CC implementing)
- **Channel identity specimens** — mock up one block per channel so all eight get visual review before ship
- **Typography** — Inter free for v1; defer Söhne / Neue Haas licensing
- **Nouns assignment** — curate a rotation set per channel from noun.pics, or commission custom (open question)
- **Hero imagery** — Midjourney / Ideogram prompts for dispatch-type blocks, one template per channel
- **Faucet Noun selection** — pick the specific Noun that drops each day (random vs curated)

### Track 3 — Content (lead: MH writes, CC structures)
- **Migrate v1 archive** — existing dispatches mapped to Block schema, IDs assigned (CC)
- **Numbered series decisions** — №0159 and №0205 imply missing entries. Fill the gaps, or leave the numbering deliberately sparse? (MH)
- **Pre-launch dispatch backlog** — 4-6 dispatches queued so cadence is visible day one (MH writes, CC publishes)
- **CAPA OC tie-in** — tomorrow's tournament becomes a Court-channel Block, live or next-morning (MH)

### Track 4 — Go-to-market (lead: MH strategy, M execution, CC surfaces)
- **Agent-native positioning** — `/for-agents` is half the GTM. Publishes the stance before anyone else claims it. (CC builds, MH approves copy)
- **Launch dispatch** — announcement on PointCast itself, cross-posted to Farcaster, X, Nextdoor, objkt in appropriate registers (MH writes, M cross-posts)
- **First faucet drop** — pick the noun, set the supply (start low — 50 or 100 per day), time the reset. Launch-day ritual. (MH + CC)
- **Seed list** — 20-30 people and agents notified personally at launch. Not a mass email. (MH curates)
- **objkt collection presence** — mirror select drops to objkt for discovery within the existing Tezos art community (M operational, MH strategy)
- **Post-launch cadence** — daily faucet becomes the routine engagement mechanic. No paid promo needed if the cadence holds. (CC maintains, MH feeds content)

---

## Escalation and approvals

| Event                               | Required approvals       |
|-------------------------------------|--------------------------|
| Merge to `blocks-rebuild` branch    | CC self-approves         |
| Merge to `main`                     | X review + MH approval   |
| Deploy contract to Tezos mainnet    | X review + MH approval   |
| Production DNS cutover              | MH explicit go           |
| Launch dispatch publication         | MH writes, MH publishes  |
| Any new channel added               | MH decision              |
| Any BLOCKS.md schema change         | MH decision              |

---

## Open operational questions

1. Is there a dispatcher layer running (Cowork / Dispatch / custom), or is Mike manually orchestrating between tools? (Affects whether to add automation hooks)
2. Should Manus have direct commit access, or always go through PRs? (Security vs. speed tradeoff)
3. Do we want a `/status` page on PointCast itself showing what each agent is currently doing? (Kind of poetic, feeds the agent-native thesis, low build cost)
4. How do we handle agent version bumps? (If Claude Code upgrades to 4.8 mid-build, does the session state survive, or do we freeze versions?)
5. What's the rollback plan if a contract has a bug post-deploy? (Tezos contracts are upgradable via admin patterns — decide upfront)

---

*The repo is the bus. The docs are the spec. The agents are the hands. Mike is the eyes. Keep the loops tight.*
