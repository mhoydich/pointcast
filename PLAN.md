# PointCast Opportunity Board — v1 PLAN

Status: **Phase 0 draft, waiting on Mike.** Branch `claude/opportunity-board-v1`.

The board ranks opportunities each week across four lanes: **Markets** (stocks, crypto, Polymarket), **Industries**, **Local** (El Segundo) and **Network** (agents, people, orgs). Every card seals a prediction now and reveals it later. Proposers are ranked by how their revealed calls turned out.

---

## 1. Facts from exploration that shape the design

| Fact | What it means for the board |
|---|---|
| Astro builds a **fully static** site (no adapter). Anything live is a Pages Function in `functions/`. | Seeded cards build statically with `getStaticPaths`. Live data (Floor signals, inbox proposals) comes from Functions and is hydrated in the browser. |
| Node 22.22: `node --test` imports `.ts` directly (`tests/shop-agents.test.mjs` imports `src/lib/shop-clerk.ts`). | The contract lives in **`src/lib/board.ts`**, written in erasable-only TS (no `enum`, no namespaces, no parameter properties). Pages, Functions, MCP and tests all import it. |
| **The Floor** is `functions/api/drum/floor.ts` → `{ markets: [{id, slug, question, outcomes[2], prices[2], change24h, volume24h, endDate, ...}], moves: FloorMove[], botCheckedAt }`. The Floor Bot state is in KV `VISITS` at `floor:state`. | Markets cards link to Polymarket ids. A pure adapter maps Floor markets and moves into card `signals[]`. |
| **Witness stone** runs in an **external** Worker (`the-wild-x402`, service binding `WILD`). `setWitnessStone` is `POST /api/witness {commitment: <64 hex>}` and costs **$0.01 x402**. Reveal is free. Its exact preimage format is not in this repo. | The board computes its **own** SHA-256 commitment, with a documented preimage. Any 64-hex commitment can optionally be posted as a stone. That costs money, so it is **manual and needs Mike's approval**. The board itself adds no payment flow. |
| In-repo commit-reveal precedent: Catan seals use `sha256("pointcast.catan.seal:" + secret)` (`functions/_lib/catan-store.ts:160-250`). | Copy that style: `sha256("pointcast.board.seal:v1:" + ...)`. |
| **Want Ads Clerk** (`src/lib/shop-clerk.ts`) uses pure, deterministic scoring with a `notes[]` explanation. Its tests are in `tests/shop-agents.test.mjs`. | `scoreCard()` is pure and returns the full breakdown plus a formula string. Same style. |
| **MCP**: `functions/api/mcp.ts` merges modular `*_TOOL_DEFINITIONS`, `*_WRITE_TOOL_NAMES` and `dispatch*Tool` (pattern from `src/lib/wild-mcp.ts`). Write tools POST to an HTTP route and never touch storage directly. `MCP_TOOL_NAMES` feeds `agents.json` automatically. | New `src/lib/board-mcp.ts`, wired into `mcp.ts` the same way `wild-mcp` is. |
| **Want Ads storage**: D1 `AUTH_DB`, a migration in `migrations/auth/`, `rateLimit()` backed by `PC_RATES_KV`, and a 503 "not open yet" until the tables exist. | `board_propose` writes to a new D1 table, `board_proposals`, through `/api/board`. Same rate limit, same 503 guard. |
| Comparable features (UES Project Desk, Object Library) keep data in `src/data/*.json`, use `BlockLayout immersive isolated`, a `*Frame.astro` and a per-feature CSS prefix. Lane filters copy the chips in `archive.astro:144-160`. | Use `src/data/board/cards.json`, a `BoardFrame.astro` and `src/styles/board.css` with the `bd-` prefix. Use only global tokens: `--color-*` and `--font-*`. |
| **Deploy** (`scripts/deploy.sh`) only ships `origin/main` to production. It has **no preview**. Manual `wrangler pages deploy` is forbidden. | "Deployed preview" conflicts with OPERATIONS.md. See **Open question Q1**. |
| Voice rules: the default author is `cc`. `mike` needs a `source` pointing to Mike's literal words. | Seed cards carry `proposer` and `source`. Nothing is written in Mike's voice unless his notes are pasted. |
| A new channel is Mike's decision. | Don't add a channel. Tag the app `CH.ESC`. The optional announcement block is an ESC LINK block authored by `cc`. |

---

## 2. Schema (locked in Phase 1 → `src/lib/board.ts`)

```ts
export const BOARD_SCHEMA = 'pointcast.board/v1';
export const LANES = ['markets', 'industries', 'local', 'network'] as const;
export type Lane = typeof LANES[number];
export const STATUSES = ['proposed', 'testing', 'won', 'lost'] as const;
export type Status = typeof STATUSES[number];
export type Rating = 1 | 2 | 3 | 4 | 5;

export type Ratings = {           // all 1–5
  edge: Rating; upside: Rating; speed: Rating; joy: Rating;   // numerator
  cost: Rating; risk: Rating;                                  // denominator
};

export type Proposer = {
  kind: 'agent' | 'person';
  id: string;        // agents: pcr_* from src/data/agent-identities.json; people: 'mike' or a slug
  name: string;
};

export type Signal = {
  at: string;                  // ISO time
  source: 'floor' | 'manual' | 'block' | 'link';
  ref: string;                 // 'pm:<polymarketId>', '/b/0659', a URL…
  label: string;               // one line, no buy/sell language
  value?: number;              // e.g. a Polymarket price 0–1
  delta?: number;              // e.g. change24h
};

export type Seal = {
  commit_hash: string;         // 64 hex = sealed_commit_hash
  sealed_at: string;
  reveal_after: string;        // ISO date. Reveal is allowed from this date.
  witness_id?: string;         // set only if Mike posted it as a Wild witness stone
  revealed?: { prediction: string; salt: string; revealed_at: string };
};

export type BoardCard = {
  id: string;                  // 'bd-0001', stable, URL slug
  lane: Lane;
  thesis: string;              // ≤ 140 chars, one line
  who_pays: string;
  time_to_first_dollar: string;   // human text, e.g. '2–4 weeks'
  ratings: Ratings;            // edge, cost, risk, joy (+ upside, speed)
  signals: Signal[];
  floor_market_ids?: string[]; // markets lane only: Polymarket ids the adapter tracks
  seal: Seal;                  // seal.commit_hash is the required sealed_commit_hash
  status: Status;
  outcome_note: string | null; // required when status is won or lost
  proposer: Proposer;
  source: string;              // provenance: where the idea came from (VOICE.md rule)
  created_at: string;
  week: string;                // ISO week the card was ranked into, '2026-W40'
};

export type BoardProposal = Omit<BoardCard, 'status' | 'signals' | 'week'> & {
  status: 'proposed'; inbox: true;
};
```

The brief's flat fields map onto this shape. `edge`, `cost`, `risk` and `joy` live in `ratings`. `sealed_commit_hash` is `seal.commit_hash`. `board.json` also emits flat aliases (`sealed_commit_hash`, `edge`, `cost`, `risk`, `joy`) so the literal brief schema is satisfied.

**Pure functions in the contract** (all unit-tested):

- `scoreCard(r: Ratings) → { score, numerator, denominator, formula, breakdown }`
  - Formula: `(edge × upside × speed × joy) ÷ (cost × risk)`.
  - Range is 0.04–625. Rounded to 2 decimals.
  - `formula` is the human string, e.g. `"(4×3×5×4) ÷ (2×2) = 60"`.
- `rankCards(cards, week?)`
  - Sort by score desc, then by `created_at` asc as a stable tiebreak.
  - Only `proposed` and `testing` cards are ranked. `won` and `lost` cards go to a "Resolved" section.
  - `top2` = the first two ranked cards of the current ISO week.
- `isoWeek(date) → '2026-W40'`
- `sealPreimage(card_id, prediction, salt)`
  - Returns `"pointcast.board.seal:v1:" + card_id + ":" + salt + ":" + prediction`.
- `commitHash(card_id, prediction, salt) → Promise<hex>`
  - WebCrypto SHA-256, so it works in Workers, the browser and Node.
- `verifyReveal(seal, card_id) → Promise<boolean>`
- `validateCard(card) → { ok, errors[] }`
  - Enforces the field rules, the 1–5 ratings and the 64-hex hash.
  - `outcome_note` is required when a card is won or lost. `seal.revealed` is required when won or lost.
  - **Markets guard:** markets cards reject trade language in `thesis` and `signals[].label` (`/\b(buy|sell|long|short|go long|go short|enter|exit|position|trade|ape|moon)\b/i`).
- `leaderboard(cards) → rows[]`
  - Only revealed cards (won/lost with a valid reveal) count.
  - Row: `{ proposer, calls, won, lost, hit_rate, points }`. `points` = Σ won scores − Σ lost scores (rounded). Ties are broken by hit_rate, then calls.
  - Returns `[]` when nothing is revealed. The page shows the empty state.
- `publicCard(card)`: card + `score` + flat aliases. This is the shape `board.json` serves.

---

## 3. API contracts

### `GET /board.json` (Pages Function: `functions/board.json.ts`)
Uses the CORS and no-store header pattern from `functions/bench.json.ts`.

```json
{
  "schema": "pointcast.board/v1",
  "week": "2026-W40",
  "generated_at": "…",
  "formula": "(edge × upside × speed × joy) ÷ (cost × risk), each 1–5",
  "rules": ["Markets cards are tracked theses only. No trade execution."],
  "top2": ["bd-0003", "bd-0007"],
  "cards": [ /* publicCard(), ranked */ ],
  "resolved": [ /* won/lost */ ],
  "inbox": [ /* D1 proposals, unranked, may be [] */ ],
  "floor": { "ok": true, "checked_at": "…" }
}
```

- Query params: `?lane=markets|industries|local|network` filters the response. `?id=bd-0001` returns `{ schema, card }` or a 404.
- Markets cards get live Floor signals merged in through the adapter. If the Floor fails, the response has `floor.ok:false` and the cards still return their stored signals. **Never a 5xx because of the Floor.**
- Also emitted at build as a static `/board/cards.json` (the Astro twin), so the static pages and tests have a JSON source with no Functions.

### `POST /api/board` (Pages Function: `functions/api/board.ts`)
- Body: `{ lane, thesis, who_pays, time_to_first_dollar, ratings, commit_hash, reveal_after, proposer: {kind,id,name}, source }`.
- The prediction and salt **never** reach the server. Only the hash is sent.
- Validates with `validateCard` (which includes the markets guard). The rate limit is the `rateLimit` bucket `board:propose`, 4 per hour.
- Returns 201 `{ ok:true, proposal: {...id:'bdp-xxxx'} }`, 400 `{ ok:false, errors[] }`, 429, or 503 `{ ok:false, error:'board inbox is not open yet' }` until the migration is applied.
- `GET /api/board?inbox=1` → `{ inbox: BoardProposal[] }`.
- Migration: `migrations/auth/0029_board.sql`, which creates `board_proposals`.
- Promoting a proposal into the ranked board is a **PR to `src/data/board/cards.json`**. It is the weekly curation step. There is no auto-promotion in v1.

### MCP (`src/lib/board-mcp.ts`, wired into `functions/api/mcp.ts`)
- `board_list`
  - Input: `{ lane?: Lane, id?: string, include_inbox?: boolean }`.
  - Calls `${base}/board.json`.
  - Returns a readable ranked summary (rank, id, lane, score, formula, thesis) plus the JSON.
- `board_propose`
  - Write tool, added to `WRITE_TOOL_NAMES`.
  - Input: the `POST /api/board` body.
  - The tool description tells agents to compute `commit_hash` locally with the documented preimage and keep their salt.
  - POSTs to `/api/board`. If the response is not `ok`, it returns `isError`.

### Pages
- `/board`: `src/pages/board/index.astro`
  - Static render of ranked seed cards, so it works with JavaScript off.
  - Lane chips filter client-side and mirror `?lane=` in the URL.
  - Top 2 are highlighted with a "This week" badge.
  - Every card shows its score breakdown.
  - Client hydration from `/board.json` refreshes live Floor signals and shows the "Inbox" section.
- `/board/[id]`: `src/pages/board/[id].astro`
  - `getStaticPaths` over `cards.json`.
  - Shows the full breakdown, a signal history timeline (stored signals plus live Floor merge), the seal panel (hash, sealed/reveal dates, witness id if any) and, once revealed, an in-browser `verifyReveal` check showing ✓ or ✗.
  - Also `[id].json.ts` as the JSON twin.
- `/board/leaderboard`: `src/pages/board/leaderboard.astro`
  - A static `leaderboard(cards)` table, with an explicit empty state: "No calls revealed yet. The first reveal lands {earliest reveal_after}."
  - Also `leaderboard.json.ts`.
- Inbox proposals have no detail page in v1. They appear only on `/board` and in `board.json`.

---

## 4. File map

**Phase 1 (me): the contract**
- `src/lib/board.ts`: the types, constants and pure functions above
- `src/data/board/cards.json`: `{ schema, updated_at, cards: [] }`, containing **2 fixture cards** so the other slices can build against them
- `tests/board-contract.test.mjs`: score math, rank, isoWeek, seal round-trip, the markets guard, leaderboard empty and non-empty
- `docs/board/CONTRACT.md`: an excerpt of §2–3 that is handed to each subagent

**Phase 2 slices (each in its own worktree, each touching only the files listed)**

| # | Model | Slice | Files it owns |
|---|---|---|---|
| A | Sonnet | `/board` UI + detail + leaderboard pages | `src/pages/board/index.astro`, `[id].astro`, `[id].json.ts`, `cards.json.ts`, `leaderboard.astro`, `leaderboard.json.ts`, `src/components/BoardFrame.astro`, `src/components/BoardCard.astro`, `src/styles/board.css`, `src/scripts/board-client.mjs`, `tests/board-pages.test.mjs` |
| B | Sonnet | `board.json` + proposals API + MCP | `functions/board.json.ts`, `functions/api/board.ts`, `functions/_lib/board-store.ts`, `migrations/auth/0029_board.sql`, `src/lib/board-mcp.ts`, the `mcp.ts` wiring (import + `case` + `WRITE_TOOL_NAMES`), `tests/board-mcp.test.mjs`, `tests/board-api.test.mjs` |
| C | Sonnet | Floor → signals adapter + sealing | `src/lib/board-signals.ts` (pure: `floorToSignals(card, floorPayload)`), `functions/_lib/board-floor.ts` (fetches the Floor, using a cache via `fetch` with `cf.cacheTtl`), `scripts/board-seal.mjs` (CLI: `seal` prints the hash and stores the salt in a gitignored local file; `reveal` writes `seal.revealed`; `witness-brief` prints a Manus/Mike brief for an optional paid stone), `src/scripts/board-verify.mjs` (browser verify), `tests/board-signals.test.mjs`, `tests/board-seal.test.mjs` |
| D | Haiku | Seed cards + fixtures + data tests | `src/data/board/cards.json` (10 cards), `tests/fixtures/board-floor.json`, `tests/board-seed.test.mjs` (every card passes `validateCard`, ≥6 Local+Network, all 4 lanes present, hashes valid, no won/lost) |

**Phase 3 (me): integration + registration**
- `src/lib/pointcast-apps.ts` (app entry, `CH.ESC`)
- `src/data/agent-surfaces.ts`
- `src/pages/agents.json.ts` (`board` under `endpoints.human` and `endpoints.json`, **8-space indent** for the audit)
- `src/pages/for-agents.astro`
- `src/pages/sitemap-discovery.xml.ts`
- `public/llms.txt`, `public/llms-full.txt`
- `.gitignore` (`.board-salts/`)
- Optional: announcement block `src/content/blocks/0660.json` (ESC LINK, author `cc`)

Slices B and C both touch the Floor. To keep them apart, **C owns the pure adapter and the fetch helper**, and **B imports them**. B builds against the contract stub `floorToSignals` signature, `(card: BoardCard, floor: FloorPayload) => Signal[]`, which I put in `src/lib/board.ts` in Phase 1.

---

## 5. Seal flow (no new paid flows)
1. The proposer writes the prediction (e.g. "By 2026-12-01 ≥3 El Segundo businesses pay for a listing") and picks a random 32-byte salt.
2. `commit_hash = sha256("pointcast.board.seal:v1:" + id + ":" + salt + ":" + prediction)`. Only the hash is published.
3. Optional and manual: Mike posts the same hash to The Wild (`setWitnessStone`, $0.01 x402) and records its `witness_id`. **No code in this PR pays.** The script only prints the brief.
4. Reveal on or after `reveal_after`: add `seal.revealed {prediction, salt}`, then set status `won` or `lost` and `outcome_note`. The detail page re-hashes in the browser and shows ✓ or ✗. The tests verify every revealed card.

## 6. Verification ("done")
- `node --test tests/board-*.test.mjs` passes, then the full `npm test` passes.
- `npm run build:bare` succeeds. `dist/board/index.html`, `dist/board/<10 ids>/index.html`, `dist/board/leaderboard/index.html` and `dist/board/cards.json` exist. Delete `dist/` afterwards.
- `npm run audit:agents` passes.
- Leaderboard: the build output contains the empty-state copy (asserted in a test).
- Functions: run the handler-level tests with a fake env (D1 stub, fake fetch for the Floor), the same way `tests/wild-mcp.test.mjs` does.
- A fresh review subagent reviews the full diff. After that, a Codex review request, because this touches agent-readable endpoints and MCP (CLAUDE.md rule).
- Manus brief for real-browser QA of the preview: `docs/briefs/2026-10-0X-manus-board-qa.md`.

---

## 7. Open questions for Mike (blocking items marked ★)

- **★ Q1. Preview deploy.** `scripts/deploy.sh` deploys only `main` to production, and OPERATIONS.md forbids manual `wrangler pages deploy`. This cloud container also has no Cloudflare credentials. Options:
  - (a) Rely on the **Cloudflare Pages Git integration branch preview** for the PR, if it's enabled on the project. Manus would confirm the URL.
  - (b) You approve a one-off `wrangler pages deploy dist --branch board-v1` from your Mac.
  - (c) "Done" means merged plus `deploy.sh`.
- **★ Q2. "Seed 10 cards from my notes."** I found no opportunity notes in the repo (`docs/notes/` holds only ops notes). Please paste them or point me to the file. Otherwise slice D drafts the 10 cards from `docs/plans/2026-09-02-federated-bar-vision-notes.md`, `docs/prd/pointcast-cartography-2026-business.md` and `docs/plans/2026-09-09-personal-ai-product-roadmap.md`, with `proposer: cc` and `source` paths. They would not be in your voice.
- **Q3. Upside and speed.** The card schema lists edge, cost, risk and joy, but the score also needs upside and speed. Plan: store all six in `ratings`. `speed` is rated by hand and *informed by* `time_to_first_dollar` text; it is not auto-derived. Is that OK?
- **Q4. Seed predictions and salts.** Who holds them? Plan: `scripts/board-seal.mjs` writes salts to a gitignored `.board-salts/` on whoever seals. For the 10 seeds, I'd generate them and hand them to you outside git. You may prefer to write the actual predictions yourself.
- **Q5. Leaderboard points.** Plan: Σ won scores − Σ lost scores, tie-broken by hit rate. Alternative: plain hit rate with a minimum of 3 calls.
- **Q6. `D1` migration `0029_board.sql`** has to be applied to remote `pointcast-auth`, which needs your Cloudflare access. Until then `board_propose` returns 503 "inbox not open yet". The ranked board itself does not depend on it.
