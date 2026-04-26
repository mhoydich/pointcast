# Tezos ecosystem outreach — pitch templates

One focused outreach drop targeting the Tezos-native discovery graph.
Goal: get pointcast.xyz / Visit Nouns / /tezos listed or spotlighted
on every Tezos-community surface that curates projects.

Status: draft. Use https://pointcast.xyz/collection/visit-nouns for
manual outreach today. References below to /tezos, /tezos.json, and
/tezos/how-to-mint are placeholders for the Tezos surface sprint and
should not be sent until those routes are live.

---

## Target #1 — Tezos Spotlight (spotlight.tezos.com)

**Who:** Tezos ecosystem editorial blog run by the Tezos Foundation.
Publishes case-study-style features on projects + communities.

**Angle:** CC0 Nouns proliferation on Tezos + agent-native dapp
architecture. Two stories in one piece: (a) the first active Nouns
derivative on Tezos in 2026, (b) a working reference for an
agent-native Tezos dapp (llms.txt + agents.json + stripped HTML
middleware integrated with Beacon + FA2).

**Send to:** submit via the contact form at spotlight.tezos.com
(or DM the editors on Farcaster / X).

**Subject:** `Visit Nouns — a Nouns-on-Tezos proliferation + agent-native dapp reference`

**Body:**
```
Hi,

I'm Mike Hoydich, operator of pointcast.xyz — a "living broadcast"
from El Segundo, California, built as a human-AI collaboration with
Claude (Anthropic) and Codex (OpenAI). Our Tezos footprint:

— Visit Nouns FA2: KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh (mainnet,
  originated 2026-04-17). Open-supply, CC0, every Nouns seed 0-1199
  mintable on demand for ~0.003 ꜩ. Second active Nouns-on-Tezos
  project after Teznouns (2023); first with an open-supply posture.

— Nouns Battler at /battle: deterministic turn-based fighter using
  the same Nouns seeds. No RNG, no server state — same seed produces
  the same fighter forever. Card of the Day rotates by UTC date.

— Prize Cast (pending origination, ghostnet sketch at /yield):
  PoolTogether-flavored no-loss savings pool funded by pooled
  baking yield. Weekly Sunday 18:00 UTC draw.

The pieces we think Tezos Spotlight readers would care about:

1. A CC0-native Nouns proliferation project on Tezos in 2026.
2. Agent-native architecture — Visit Nouns integrates with Beacon
   via Taquito, but the dapp also ships llms.txt + agents.json +
   Content-Signals + stripped-HTML middleware so LLM crawlers
   (ChatGPT, Claude, Perplexity) can cite the contract + mint flow
   without scraping. Writeup at /agent-native.
3. A Tezos wallet compatibility matrix (Kukai / Temple / Umami /
   Altme) documented at /tezos/how-to-mint.

Full surface map: https://pointcast.xyz/tezos.json.

Happy to provide screenshots, assets (CC0 OG cards + broadcast dish
mark), and a written piece we could co-author or contribute. If
there's a better angle for Spotlight, I'd love to hear it.

— Mike Hoydich
  pointcast.xyz · @mhoydich · hello@pointcast.xyz
```

---

## Target #2 — TzKT (tzkt.io / api.tzkt.io)

**Who:** Primary Tezos block explorer and indexer, maintained by
Baking Bad. Lists contracts + collections + metadata.

**Angle:** Contract-metadata verification + inclusion in curated
collection lists.

**Channel:** TzKT's contract alias registry; for inclusion email
hello@baking-bad.org with the contract address + collection name.

**Subject:** `Contract alias for Visit Nouns (KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh)`

**Body:**
```
Hi Baking Bad team,

Requesting a TzKT alias for our mainnet FA2 contract:

  Address: KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh
  Alias:   Visit Nouns (PointCast)
  Type:    FA2, open-supply NFT
  Origin:  2026-04-17
  Source:  github.com/mhoydich/pointcast/blob/main/contracts/visit_nouns_fa2.py

Collection page: https://pointcast.xyz/collection/visit-nouns
objkt mirror: https://objkt.com/collection/KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh

Contract metadata is TZIP-016 compliant; per-token TZIP-021.
Let me know if you need any additional verification — happy to
sign a message from the originator tz1 if useful.

— Mike Hoydich
```

---

## Target #3 — objkt (objkt.com)

**Who:** Primary Tezos NFT marketplace.

**Angle:** Curated collection feature + collection-page optimization.

**Channel:** objkt's collection owner tools + community Discord.

**Send to:** community@objkt.com (or DM via their Discord).

**Subject:** `Visit Nouns — open-supply FA2 collection, ship with CC0 + Nouns proliferation angle`

**Body:**
```
Hi objkt team,

Our collection at objkt.com/collection/KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh
is Visit Nouns — an open-supply FA2 where each tokenId 0-1199 maps
to a Nouns seed. CC0 art, ~0.003 ꜩ mint fee, originated 2026-04-17.

Three asks:

1. Would you consider featuring Visit Nouns in a "Nouns-on-Tezos"
   editorial moment? We're the first active Nouns proliferation
   project in 2026 after Teznouns' 2023 precedent.

2. Can we verify as a creator-owned collection so the header shows
   our logo (broadcast dish SVG at pointcast.xyz/favicon.svg)?

3. For new collectors, is there a path to feature our mint CTA at
   pointcast.xyz/tezos/how-to-mint as the canonical onboarding
   flow alongside the objkt secondary listing?

Full surface map: https://pointcast.xyz/tezos.json.

— Mike Hoydich
```

---

## Target #4 — fxhash (fxhash.xyz)

**Who:** Tezos-native generative-art marketplace. Strong CC0 culture,
significant overlap with Nouns proliferation audience.

**Angle:** Shared CC0 posture; potential cross-linking or a Visit
Nouns-derivative generative drop on fxhash.

**Send to:** DM @ciphrd (founder) or community@fxhash.xyz.

**Subject:** `Visit Nouns × fxhash — cross-CC0 conversation`

**Body:**
```
Hi fxhash team,

We shipped Visit Nouns on Tezos mainnet last week —
KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh, open-supply FA2, CC0 art
from noun.pics. Context: pointcast.xyz/nouns.

The overlap with fxhash is obvious and I'd love to explore two
specific things:

1. A cross-linking moment — fxhash spotlight of Visit Nouns, our
   /fxhash page linking fxhash-native generative projects that cite
   Nouns or PointCast.

2. A Visit Nouns-derivative generative drop on fxhash — a procedural
   piece where each mint pulls a Visit Noun seed's traits and renders
   a new generative work from them. CC0 in and out.

Open to either / both / neither — curious what feels aligned on your
side.

— Mike Hoydich (pointcast.xyz · @mhoydich)
```

---

## Target #5 — Tezos Developer Portal / Taquito docs

**Who:** docs.tezos.com + tezostaquito.io maintainers.

**Angle:** Working-reference example of Beacon + Taquito + FA2 on
a production dapp, with public repo + step-by-step HowTo schema.

**Send to:** Tezos dev relations via hello@trili.tech or DM via
Farcaster /tezos channel.

**Subject:** `Working reference — Beacon + Taquito + FA2 mint flow (open source)`

**Body:**
```
Hi team,

I'd like to offer pointcast.xyz's Visit Nouns mint flow as a
working reference for the Tezos dev docs. Stack:

— SmartPy FA2 contract: contracts/visit_nouns_fa2.py
— Origination script: scripts/deploy-visit-nouns-mainnet.mjs
— Frontend mint (Taquito + Beacon SDK): src/lib/tezos.ts +
  src/components/MintButton.astro
— Step-by-step user guide with HowTo schema:
  pointcast.xyz/tezos/how-to-mint
— Wallet compatibility matrix: Kukai / Temple / Umami / Altme,
  documented in src/lib/tezos-ecosystem.ts

Repo: github.com/mhoydich/pointcast (MIT-flavored code, CC0
content). Happy to accept PRs that help us align with docs patterns,
or to contribute a walkthrough if useful.

— Mike Hoydich
```

---

## Tips

1. **Time these 7-14 days after the /tezos + /nouns pillar
   deploy** — give search engines a chance to index first so
   inbound backlinks compound into ranking rather than arriving
   before indexation.

2. **DM on Farcaster + email simultaneously** — Tezos ecosystem
   is Farcaster-heavy; a simultaneous email + cast tends to land
   faster than email alone.

3. **Don't duplicate contract addresses across pitches** — each
   pitch references the same KT1 but with a distinct angle for
   the recipient.

4. **Track outcomes in a sheet** — pitch date, response, live
   backlink, 30-day referral sessions. Iterate on the 2-3 templates
   that land, drop the rest.

5. **Don't ask for financial or treasury-grant help** in the
   initial pitch. These are editorial / discovery pitches. Grants
   are a separate conversation if the ecosystem relationship warms.
