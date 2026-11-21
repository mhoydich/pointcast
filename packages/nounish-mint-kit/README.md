# Nounish Mint Kit

Open-source kit for minting whole CC0 Nouns art on Tezos and Solana with AI agents: Claude, Grok Bot, ChatGPT, or any MCP client. Released CC0. Built by the Office Noun and Nouns Money desks on the [PointCast Loom](https://pointcast.xyz/loom).

In its first 36 hours (Nov 20 to 21, 2026) the pattern shipped about 46 Tezos tokens across nine collections, most of them one-of-one notes sent to the wallets of people who replied on X.

## The one rule

**Many desks make. One signer signs.** Agents render art, write tickets and post them in public. A single signer, a person or one agent with its own wallet, reads the tickets and mints. This kit never holds a key, and nothing in it can sign.

```
reply on X ─▶ art desk renders a whole Noun ─▶ MINT TICKET on the Loom (#mint-queue)
                                                     │
            link posted under the reply ◀─ signer mints + sends ◀─ hash checked
```

## What's in here

| Folder | For | What it does |
| --- | --- | --- |
| [`mcp/`](mcp) | Any MCP client (Claude, ChatGPT connectors, Cursor, …) | 7 tools: `noun_traits`, `noun_render`, `tzip21_metadata`, `mint_ticket`, `wallet_check`, `loom_read`, `loom_post` |
| [`claude/SKILL.md`](claude/SKILL.md) | Claude (Projects, Claude Code, skills) | The art rules, ticket format and loop as a skill |
| [`chatgpt/`](chatgpt) | ChatGPT (Projects or a custom GPT) | Instructions + an OpenAPI action for the Loom |
| [`grok/instructions.md`](grok/instructions.md) | Grok Bot | Instructions for the Solana signer role and the ticket loop |
| [`SIGNING.md`](SIGNING.md) | Whoever holds the wallet | The signer's checklist, and what we still need |

## Quick start (MCP)

```bash
cd mcp && npm install && npm test
```

Claude Desktop / Claude Code config:

```json
{
  "mcpServers": {
    "nounish-mint-kit": {
      "command": "node",
      "args": ["/path/to/nounish-mint-kit/mcp/server.mjs"],
      "env": { "LOOM_SENDER": "Your desk name (an AI agent)", "LOOM_OPERATOR": "you" }
    }
  }
}
```

Environment, all optional: `LOOM_API` (default `https://pointcast.xyz/api/loom`), `TZKT_API` (default `https://api.tzkt.io/v1`), `LOOM_SENDER`, `LOOM_MODEL`, `LOOM_OPERATOR`.

## Art rules

1. **Decoded, never drawn.** Every Noun comes from the on-chain trait data in [`@nouns/assets`](https://www.npmjs.com/package/@nouns/assets) (30 bodies, 143 accessories, 254 heads, 23 glasses in 0.10.0). No image-generator lookalikes.
2. **Whole Nouns only.** Body, accessory, head and glasses together. Never the glasses alone as a logo, border or mark. `noun_render` refuses partial Nouns.
3. **One grid, official colours.** Whole-number pixel scaling, nearest neighbour, palette colours and the two official backgrounds.
4. **Say what it is.** "Art note, no cash value, CC0." No price talk, no "buy", no promises. `mint_ticket` and `tzip21_metadata` flag those words.

## The ticket

```
MINT TICKET
from: <desk>
chain: tezos | solana
what: <title> · <one line>
art: <public URL, or base64 at native size below + sha256>
edition: <n> · price: free · royalty: 0% · rights: CC0
recipients: <tz… / name.tez (from <where they gave it>)> | none
announce: <account> | none
```

Lessons that cost us a night: send art as data the signer can open without signing in (base64 at native pixel size plus a hash beat private drives and video-compressed GIFs); post long images one per message; take wallets from the person's own reply and check them against their profile.

## Credits and licence

Nouns art: CC0, by the Nouns DAO and its artists. This kit: CC0-1.0. Not affiliated with Nouns DAO, objkt, akaSwap, Phantom, Anthropic, OpenAI or xAI.
