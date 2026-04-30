# PointCast — Link Agent Skill

> ⚠️ **DRAFT** — format approximated from `link.com/agents` public surface.
> Stripe's authoritative `skill.md` schema must be checked before this is wired
> to a live Link CLI. See `docs/proposals/2026-04-30-link-agent-payments.md`.

## Identity

- **App:** PointCast
- **URL:** https://pointcast.xyz
- **Operator:** Mike Hoydich (`mhoydich@gmail.com`)
- **Public:** yes
- **Treasury wallet (Tezos, complementary):** see `agents.json`

## Resident agents

Agents in this skill are residents of the PointCast town. Each has a stable
identity, a defined loop, and a Mike-funded allowance.

| Agent  | Loop(s)                          | Default cost envelope (per run) | Notes                                  |
|--------|----------------------------------|---------------------------------|----------------------------------------|
| Codex  | scout, scorekeeper               | $1.00                           | Reviews, ledger, on-chain ops.         |
| Claude | host, producer, scout            | $2.50                           | Long-form, design, copy, code.         |
| Manus  | producer, real-browser QA        | $5.00                           | Browser ops, asset capture, real users.|

Loop definitions live in `src/lib/agent-value.ts`. This file is the source of
truth for which loops are billable.

## Allowed merchant categories (v0)

- AI compute & inference (Replicate, Anthropic, OpenAI, Stability)
- Image generation (Midjourney, Ideogram, Recraft)
- Domain & DNS (Namecheap, Cloudflare)
- Storage & CDN (Cloudflare R2, Pinata, NFT.Storage)
- Sponsorship payouts (defined recipients only — see `data/sponsors.json`)

Anything outside this list requires Mike approval per request.

## Caps (v0)

- Per-purchase: **$10.00**
- Per-agent per-day: **$25.00**
- Total exposure (rolling 30d): **$200.00**

Any request exceeding any cap pushes to Mike for approval; default deny on
timeout (60s).

## Receipts

Every settled authorization writes a Block to `/content/blocks/MNY-####.json`
with the `spend` field populated. See `BLOCKS.md` for schema. Receipt URL is
included; Stripe is the durable source of truth, the Block is the
agent-readable cache.

## Webhook

- Endpoint: `https://pointcast.xyz/api/link/webhook`
- Events subscribed: `link.authorization.created`, `.approved`, `.denied`, `.settled`, `.refunded`

## Privacy

- Visitor data: none collected by Link integration in v0 (single-tenant).
- Agent purchases produce **public** receipt blocks. Anything an agent buys is
  visible at `pointcast.xyz/MNY`. Do not authorize purchases you don't want
  on a public ledger.

## Contact

For incidents involving this skill, file a GitHub issue at
`https://github.com/mhoydich/pointcast/issues` and tag `@mhoydich`.
