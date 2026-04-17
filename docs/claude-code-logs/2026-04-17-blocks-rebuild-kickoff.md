# Claude Code log · 2026-04-17 · blocks-rebuild kickoff

**Session goal:** install `BLOCKS.md` + `AGENTS.md` directives, branch from v1, lay down Phase 1 foundation, ship a preview URL.

## What landed

- **v1 snapshot commit on `main`**: `7fea01c` — preserves the current pointcast.xyz state (editorial modules, /admin/deploy, contracts, auth scaffolding, Shadownet origination artifacts) so we can roll back.
- **Branched to `blocks-rebuild`** for the v2 rebuild.
- **Installed directives at repo root:**
  - `BLOCKS.md` — schema + visual language + phased rollout
  - `AGENTS.md` — roles, coordination, TASKS.md format
  - `TASKS.md` — Phase 1–5 task breakdown, MH open-questions list
  - `docs/{claude-code,manus,codex}-logs/` — per-agent session logs

## Phase 1 foundation (built)

### Constants modules
- `src/lib/channels.ts` — 8 channels with code, slug, name, purpose, and color ramps (600/800/50) per BLOCKS.md table
- `src/lib/block-types.ts` — 8 block types with label, footer-hint, description

### Content collection
- `src/content.config.ts` — new `blocks` collection with full Zod schema
- `src/content/blocks/` — seeded with 10 representative blocks:
  - `0159.json` (FD/READ), `0205.json` (FD/READ 3x2 hero)
  - `0206.json` (SPN/LISTEN w/ Spotify embed)
  - `0207.json` (VST/VISIT — Claude visit)
  - `0208.json` (FD/LINK — Whimsical)
  - `0209.json` (CRT/MINT 2x2 — 11SIX24 paddle edition)
  - `0210.json` (FCT/FAUCET — today's noun)
  - `0211.json` (GDN/NOTE — doves)
  - `0212.json` (ESC/NOTE 2x1 — South Bay Saturday)
  - `0213.json` (GF/NOTE 2x1 — autopilot thesis)

### Components + routes
- `src/components/BlockCard.astro` — the single primitive. Header row (CH.XX · ID · TYPE · timestamp), Noun, title/dek, type-specific body, footer meta. Channel-colored 1.5px border, optional 6px accent bar on READ.
- `src/pages/index.astro` — home grid, 6/4/2/1 col responsive, `grid-auto-flow: dense`, live PT clock, channel legend, endpoints footer. (v1 index parked at `index-v1.astro.bak`.)
- `src/pages/b/[id].astro` — single-block permalink
- `src/pages/b/[id].json.ts` — machine-readable endpoint
- `src/pages/c/[channel].astro` — per-channel listing with RSS/JSON links

## Build + deploy

- `npx astro build` → 48 pages, 8 seconds, no errors (only the known benign "projects collection empty" notice)
- Deployed to **`https://blocks-rebuild.pointcast.pages.dev`** via `wrangler pages deploy --branch blocks-rebuild`
- Production `pointcast.xyz` untouched — still serves v1 from `main`

## What's not yet done (Phase 1)

- `/for-agents`, `/blocks.json`, `/sitemap-blocks.xml`, RSS/JSON feeds per channel — Phase 2
- Full content migration — 10 seeds prove the schema, 100+ blocks still to migrate
- Self-hosted JetBrains Mono + Inter — currently falling back to system monospace + Inter from the old BaseLayout font chain
- Tailwind cleanup — BLOCKS.md implies removing legacy tokens, not yet done
- Mobile: sticky channel chip bar not wired (the chip bar scrolls with the page currently)

## Handoffs

- **M** — visit `https://blocks-rebuild.pointcast.pages.dev`, test desktop + mobile rendering, log observations + screenshots to `docs/manus-logs/2026-04-17.md`. See `docs/agent-kickoffs/manus-phase-1.md` for the full kickoff prompt.
- **X** — once the first PR lands (I'll open one before the end of the day), review BlockCard + home grid against BLOCKS.md spec. See `docs/agent-kickoffs/codex-phase-1.md`.

## Decisions deferred to MH

Open questions live in TASKS.md under "Open MH decisions". Highest priority:
1. Numbering gaps (fill 0160–0204 or leave sparse?)
2. Faucet noun selection mechanic
3. `/status` live-agent-activity page — yes/no for v2 launch

## Meta — what to watch

- Shadownet FA2 at `KT1S8BbKPzWjTRQgnc986Az8A187V886UtK5` is a *test-only* contract. Block 0209 and 0210 reference it for the UI treatment but those editions are throwaway. Mainnet origination runs on `main` branch in parallel (see TASKS.md "Mainnet contract track"); once a mainnet KT1 is live we rewrite all block `edition.contract` fields to the mainnet address and redeploy.
