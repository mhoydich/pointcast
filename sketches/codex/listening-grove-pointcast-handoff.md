# The Listening Grove → PointCast handoff

Status: implementation-ready Codex sketch; do not publish until the Sites access
mode is explicitly changed from owner-only to public.

## Release facts

- Standalone URL: `https://the-listening-grove.mhoydich.chatgpt.site/`
- Archive: 617 unique works; 49 featured interactive “Living” works
- Collection preview: 5 editions of each work at 10ꜩ
- Wallet: Kukai connection QA only
- Mainnet mint, payment, and contract: inactive
- Sound: synthesized Web Audio bells, gongs, drones, and effects; no Spotify
  recording is copied or streamed by the site
- Playlist door: `https://open.spotify.com/playlist/7sH23LdGBAxntWVP2D8w75`
- Catalog API: `/api/art`
- Collection state API: `/api/collection`
- Creative supplied by the standalone build: `public/og.png` (1200×630)

## Proposed PointCast surface

1. Copy the standalone `public/og.png` to
   `src/assets/campaigns/listening-grove-2026/listening-grove-og.png`.
2. Review and adapt `listening-grove-0492.json` into
   `src/content/blocks/0492.json`.
3. Add `LISTENING_GROVE_CAMPAIGN` and one `PointCastAd` to
   `src/lib/open-ad-network.ts`.
4. Include the campaign in the `houseSeries` arrays used by `/ads` and
   `/ads.json`.
5. Contexts: `/`, `/c/garden`, `/c/art`, `/c/tezos`, `/ads`.
6. Keep the block type as `LINK`, not `MINT`, until a reviewed contract,
   token/edition identifier, chain confirmation path, and explicit Mainnet
   approval exist.

Suggested campaign record:

```ts
export const LISTENING_GROVE_CAMPAIGN = {
  id: 'PC-LISTENING-GROVE-2026',
  label: 'The Listening Grove — 617 Works',
  advertiser: 'The Listening Grove',
  creativeCount: 1,
  placement: 'PointCast contextual rotation across garden, art, and Tezos surfaces',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'A 617-work interactive archive with a 10-tez / five-edition preview. Mainnet minting remains inactive pending contract and release approval.',
} as const;
```

Suggested house ad:

```ts
{
  id: 'PC-LISTENING-GROVE-2026-A',
  advertiser: 'The Listening Grove',
  headline: '617 works. 49 living.',
  copy: 'Move through a MidJourney archive of Southern California trees with synthesized bells, gongs, drones, and digital effects.',
  href: 'https://the-listening-grove.mhoydich.chatgpt.site/',
  cta: 'Enter the grove',
  tone: 'garden',
  contexts: ['/', '/c/garden', '/c/art', '/c/tezos', '/ads'],
  image: listeningGroveOg.src,
  sourceTool: 'MidJourney + Codex',
  campaign: LISTENING_GROVE_CAMPAIGN.id,
  seriesLabel: LISTENING_GROVE_CAMPAIGN.label,
  seriesIndex: 1,
  status: 'house',
}
```

## Required QA before publish

- Confirm the standalone root and both API routes return 200 without
  authentication.
- Confirm the public OG image returns 200 and is 1200×630.
- Confirm the block renders at desktop and 390px mobile width.
- Inspect the PointCast Shadow DOM mount: `mount.dataset.networkReady`,
  `mount.shadowRoot`, and shadow `[data-ad-record]`.
- Confirm `/ads.json` contains the campaign and no private wallet data.
- Confirm the collect drawer still says preview only and creates no wallet
  operation.
- Contract deployment, minting, or a tez transfer require a separate explicit
  Mainnet approval and a real signed-chain receipt.
