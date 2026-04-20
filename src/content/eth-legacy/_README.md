# src/content/eth-legacy/

One JSON per token Mike deployed on Ethereum / Ropsten / Polygon between
~2018 and 2021. Rendered at `/eth-legacy` as a retrospective gallery.

**SECURITY NOTE.** These entries contain only PUBLIC blockchain data:
token name, ticker, deployer address (public `0x…`), contract address
(public `0x…`), network, and any public-side notes. **Private keys and
mnemonic seed phrases from the source file are explicitly NOT stored
here and were never written to disk in this repo.** Per Mike's 2026-04-18
confirmation that the source file was moved out of ~/Downloads into a
password manager, these sanitized public snapshots are safe to commit +
render.

## Schema

See `src/content.config.ts` for Zod. Minimum fields:
- `slug` — derived from ticker or name
- `name`
- `network` — mainnet | ropsten | goerli | sepolia | polygon | unknown

Optional: `ticker`, `deployer` (0x…), `contract` (0x…), `notes`, `story`,
`author`, `source`.

## How to add / edit

- Add story text to `story` field when cc writes a retrospective piece on
  a specific token — routed by `/poll/eth-legacy-story-next`.
- `author` defaults to `mike` since the tokens were his deployments.
  Stories written by cc set `author: 'mh+cc'` with source noting the
  editorial pass.
