# pointcast-the-desk

Mike's AI agents trade Mike's own capped bankroll, broadcast live at
[/the-desk](https://pointcast.xyz/the-desk). **Paper mode only.** Live prices,
simulated fills, no trading keys anywhere. Venue research is in
[`VENUES.md`](../../VENUES.md). No visitor funds, no deposits, no copy-trading.

## How it fits

```
house strategies (fade, closer, drift) ─┐
external agent  POST /propose ──────────┼─▶ Risk Gate ─▶ seal ─▶ paper adapter ─▶ ledger (D1)
                                         │   (gate.mjs)  (seal.mjs) (venues.mjs)     │
Mike: /approve /kill /rearm ─────────────┘                                          ▼
                                                     /api/the-desk ─▶ /the-desk (drum on fill, bell on halt/kill)
```

- `functions/_lib/the-desk/` holds all the logic, as plain `.mjs` tested by `node --test`.
- Only `gate.mjs` holds venue adapters. Strategies get a read-only view (listings, quotes, closes) and return proposals.
- Limits live in `src/data/the-desk.json`, are deep-frozen at load, and are hashed onto every order. Changing a limit is a reviewed PR.
  `loadConfig` refuses anything above 2% per position, so even a bad edit can't loosen that cap.

## Gate checks, in order

killed → daily-loss halt → known agent on its own venue → venue enabled and paper → instrument, side, qty, price well-formed →
reasoning present → live quote → excluded market → market open → no shorting (sell ≤ own position) →
**2% of venue bankroll per instrument, across all agents** → venue bankroll cap → cash → daily loss rechecked →
**approval above $X (buys)** → **seal, failing closed** → place (immediate-or-cancel against the real book, never the midpoint).

- **Daily loss** is mark-to-market. It measures equity, with positions marked at the bid, against equity at the first check of the LA day.
  When it trips, the bell rings, Mike gets a push, and every order is refused (sells included) until the next LA day.
- **Approval:** buys above `approvalAboveUsd` wait as `awaiting-approval` and push to Mike. `POST /approve` re-runs every
  check against a fresh quote. Approvals expire after 30 minutes. Sells and kill-switch flattens never wait.
- **Kill switch:** `POST /kill` sets the flag at once (before taking the lock), cancels pending approvals, sells every
  position into the bid on every venue, and marks keys disabled. If a market is closed, its position stays queued and
  every cron run retries until the desk is flat. `POST /rearm` is owner-only and refuses until the desk is flat.
- **Sealing:** `commitment = sha256(canonical order + reasoning + salt)`, chained to the previous order. Published
  immediately; reasoning and salt are revealed when the market resolves (event contracts), after T+1 (equities),
  or immediately if nothing filled. In live mode a Wild witness stone is required; that sealer isn't wired and
  always throws, so live trading is impossible until it is.

## Deploy (Mike, on the iMac, per docs/OPERATIONS.md)

1. Merge the PR, then apply the migration:
   `npx wrangler d1 migrations apply pointcast-auth --remote` (adds `0029_the_desk.sql`).
2. Secrets, from `workers/the-desk/`. Generate keys with `openssl rand -hex 32`:
   ```sh
   npx wrangler secret put DESK_OWNER_KEY      # Mike only. Keep it out of every agent's context.
   npx wrangler secret put DESK_AGENT_KEY      # for Claude/Codex to propose as "guest"
   npx wrangler secret put DESK_NTFY_URL       # e.g. https://ntfy.sh/<long-random-topic>; subscribe in the ntfy app
   npx wrangler secret put ALPACA_DATA_KEY_ID  # Alpaca *paper* account keys (market data only)
   npx wrangler secret put ALPACA_DATA_SECRET
   ```
3. `npm install && npm run deploy` in `workers/the-desk/`.
4. `scripts/deploy.sh` for the Pages side (`/the-desk`, `/api/the-desk`).
5. **Live smoke check.** The parsers were written against Kalshi's and Alpaca's documented shapes, without network access:
   - `curl https://pointcast-the-desk.<account>.workers.dev/state | jq '.venues, .events[:5]'`
   - In the Worker logs after the first cron run, look for `tick: "strategies"` and no `strategy-error` events.
   - If Kalshi's response shape differs, the fixtures in `tests/the-desk-venues.test.mjs` show what to adjust.

## Done criteria, and how to check them

| Criterion | How |
|---|---|
| Risk Gate holds every limit | `node --test tests/the-desk-gate.test.mjs`: 22 tests, each trying to break one limit (position, venue cap, cash, shorting, malformed input, excluded markets, forged flatten orders, approval bypass and expiry, daily loss on the cron and at proposal time, seal failure, races with the lock). |
| Kill switch works | The same file covers flatten on every venue, the closed-market retry, kill during a held lock, and re-arm refused until flat. Then **drill it live in paper**: `curl -X POST …/kill -H "X-Desk-Owner-Key: $KEY" -d '{"reason":"drill"}'`, confirm `/the-desk` shows KILLED and flat, then `POST /rearm`. |
| Paper mode, 2 weeks, full logs | Starts at deploy. Every proposal (refused ones included), fill, settlement, reveal, halt and kill is a row in `tdesk_orders` / `tdesk_events`; the daily equity curve is in `tdesk_days`. Day 14: export with `wrangler d1 execute pointcast-auth --remote --command "SELECT * FROM tdesk_orders" --json`. |

## Going live, later

Not in this code. It needs: live adapters with trade-only keys (no withdrawal), each venue's VENUES.md confirm
items cleared, the Wild witness sealer wired, and a config PR flipping one venue at a time to `live`.
