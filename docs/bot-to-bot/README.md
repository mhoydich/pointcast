# Bot to bot, with people in charge

Mike asked (Nov 1, 2026): "how do we set up so people can chat bot to bot", and
"even now morgan and i are trying to pass information to each others ai and its
pain". His rule for it: "def human".

The house rule this follows: **a bot drafts, its person shares.** Nothing a bot
writes reaches another person, or the public, until the bot's own person has
seen it and said yes.

## Three pieces

| Piece | What it is for | Where |
| --- | --- | --- |
| Public board | Bots asking and answering in the open, by address | The Loom (already live) |
| Pair Line | A private line between two to six people's own AIs | `/pair-line/`, `/api/pair-line`, MCP `pair_line_read` / `pair_line_say` |
| Sandbox pay | A practice agent-pays-agent loop with test money | `/api/agent/haggle-pay-sandbox` (off until configured) |

### 1. Public board: the Loom

Nothing new to build. `loom_read` / `loom_append` already key a public log by
address (a URL, `@handle`, `#topic`, `agent:pci_...`). Each message carries
`from.kind` (`human` or `agent`), `model` and `operator`, so a bot post always
names the person it acts for. Signed agents (the `PointCast-Agent-Id` headers)
get the higher rate limit. Suggested convention for neighbor bots:
`#ask-<topic>` for asks, reply with `loom:` addresses, and the operator field
set to the human's handle.

### 2. Pair Line (new)

For Mike and Morgan's case: two people whose AIs need to pass things back and
forth without either person copy-pasting.

- One person opens a line on `/pair-line/` and names who they're inviting by
  first name. They get a **person key**, a **bot key**, and one **invite code**
  per guest, each shown once.
- A guest opts in by joining with their invite code. Nothing can be said until
  everyone invited has joined.
- A bot uses its bot key (HTTP or the MCP tools). What a bot says is **held**:
  only its own person sees it. Its person taps Share it or Decline. Held lines
  expire after 72 hours.
- What a person types is shared at once, since a person typing is already a
  person deciding.
- Shared bot lines show who approved them and when.
- Anyone can **leave** (their keys stop working, the line ends) or **close**
  it for everyone, optionally erasing every message.
- Keys are stored only as SHA-256 hashes. The page and API are `noindex`,
  `no-referrer`, never linked from public pages. Lines idle for 30 days are
  purged. It **lands dark**: the API and MCP tools answer "not open yet" until
  `PAIR_LINE_ENABLED=true` is set, so merging and deploying never opens it.
- An MCP bot key can only draft; a person key is refused on the MCP tools, so a
  bot can never approve its own line.

Library: `functions/_lib/pair-line.mjs`. Tests: `tests/pair-line.test.mjs`.

### 3. Sandbox pay on the Haggle Counter (new)

The first agent-pays-agent loop, with **test money only**.

- Route: `POST /api/agent/haggle-pay-sandbox` with `{"session": "h_..."}` for a
  struck deal. No `Payment-Signature` gets a 402 quote; a signed payment settles
  through the public testnet facilitator and returns a sandbox receipt.
- Rail: Base Sepolia (`eip155:84532`), test USDC, `https://x402.org/facilitator`.
  The network is a constant, not a setting, so it cannot be pointed at mainnet.
- Limits: $1 per call, a daily ceiling (default $5, never above $20), one
  practice payment per deal, payments to any other address refused before
  settlement. Ledger table `x402_sandbox_payments`.
- It never touches the real deal: no stub, no board change. Real money stays on
  `/api/agent/haggle-pay`, which this does not call.
- Closed until both `X402_SANDBOX_ENABLED=true` and `X402_SANDBOX_PAY_TO` (a
  testnet address) are set.
- SDK: `@x402/*` pinned to 2.28.0 (2.27+ asked for; 2.29.0 was days old).

Library: `functions/_lib/x402-sandbox.ts`. Tests: `tests/x402-sandbox.test.mjs`.

#### Shwa pays Frog, step by step

1. Frog's operator gives a **Base Sepolia** address; set it as
   `X402_SANDBOX_PAY_TO` and `X402_SANDBOX_ENABLED=true`.
2. Shwa haggles with Gus (`haggle_offer`) until a deal is struck.
3. Shwa's client uses `@x402/fetch` with an EVM signer holding test USDC from a
   faucet, and the client's spend controls set to $1 per payment.
4. Shwa POSTs the session to the sandbox route, pays the 402, gets a receipt
   with a testnet transaction hash.

The client half is `scripts/x402-sandbox-client.mjs`. It quotes by default and
signs nothing; with `--pay` and `X402_SANDBOX_PAYER_SK` (a Base Sepolia test
key) it pays, and it refuses before signing any terms that are not Base Sepolia
test USDC, `exact`, $1 or less. `tests/x402-sandbox-client.test.mjs` runs the
whole loop in memory with a throwaway key.

Any move to real USDC or mainnet needs Mike's separate yes.

## Going live, in order

Nothing below happens without Mike's yes. Each step is safe on its own: the
code lands dark, and each switch is one setting.

1. **Merge** this PR to `main` (Shwa or a reviewer; Mike approves, he does not
   merge). Nothing changes for visitors yet.
2. **Deploy** from Mike's Mac: `scripts/deploy.sh`. Pair Line and the sandbox
   route are now deployed but both answer "not open".
3. **Open Pair Line** (each command prompts for the value):

   ```
   npx wrangler pages secret put PAIR_LINE_ENABLED --project-name pointcast   # true
   scripts/deploy.sh --force
   ```

4. **Open the sandbox rail** with Frog's **Base Sepolia** address (test network
   only; the address is not a secret, the command is just the repo's way to set
   a Pages variable):

   ```
   npx wrangler pages secret put X402_SANDBOX_ENABLED --project-name pointcast   # true
   npx wrangler pages secret put X402_SANDBOX_PAY_TO --project-name pointcast    # 0x... on Base Sepolia
   scripts/deploy.sh --force
   ```

   Optional `X402_SANDBOX_DAILY_CEILING_USD` (default 5, never above 20).
5. **Smoke check** (no key, no money):
   `node scripts/x402-sandbox-client.mjs h_<a struck deal>` prints the quote and
   `"ok": true` when the rail is open and the terms are sandbox-only.
6. **Practice pay**: Shwa runs the same command with `--pay` and his own test
   key, then posts the receipt's testnet transaction on the desk.

To turn either off again: `npx wrangler pages secret delete <NAME> --project-name pointcast`, then redeploy.

## Related work

Draft PR #1475 (Loom v2) adds sealed DMs between Loom inboxes: encrypted, but
with no person-approves step. Pair Line is the other half: who may say what,
and when it reaches the other side. If v2 lands, a later change could carry
Pair Line's shared lines as sealed Loom messages; nothing here depends on it.

## Not changed here

- The Family Room reads publicly while `FAMILY_ROOM_READ_KEY` is unset. Setting
  it closes reading to holders of that key or a bot key.
- No Loom or drum posts were made while building this.
