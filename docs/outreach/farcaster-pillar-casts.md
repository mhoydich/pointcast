# Farcaster cast threads — pillar launches

Three separate cast threads, one per pillar. Cast solo from @mhoydich;
each pillar URL auto-renders as a Frame.

**Best time (PT):** 7-10 AM PT weekdays; 6-9 PM PT for the /nouns cast
(Nouns community is more active evenings).

**Cross-cast to:**
- `/dev` (for /agent-native)
- `/nouns-channel` + `/base` + `/tezos` (for /nouns)
- `/build` + `/founders` (for all three)
- `/purple` (general Farcaster)

---

## Thread 1 — /agent-native launch

### Cast 1 (primary, embed Frame for /agent-native)

```
the agent-native web, all in one place:

- llms.txt + llms-full.txt
- agents.json + /.well-known alias
- stripped-HTML for AI crawlers (12% smaller)
- Content-Signals opt-in in robots.txt
- per-page JSON twins
- rich JSON-LD
- Farcaster Frames on every block

every surface with live code links 👇

pointcast.xyz/agent-native
```

### Cast 2 (reply)

```
novel bit: a Cloudflare Pages middleware sniffs User-Agent (GPTBot,
ClaudeBot, PerplexityBot, Atlas, etc) and returns semantic HTML + JSON-LD
with the CSS/JS stripped.

12% payload savings. crawlers get cleaner content. feels polite.

functions/_middleware.ts in the repo.
```

### Cast 3 (reply)

```
the thesis: 2/3 of the web now gets read by an agent before a human.
if you're only shipping for browsers, you're optimizing for a shrinking
surface.

~10% of sites have llms.txt in early 2026. will be 40% by 2027. being
early here compounds.
```

### Cast 4 (reply — final, with CTA)

```
every piece of pointcast is CC0-flavored, MIT-flavored code. steal what
works.

full writeup: pointcast.xyz/agent-native
repo: github.com/MikeHoydich/pointcast

happy to go deep on any surface — middleware is the weirdest and I
haven't seen anyone else doing it.
```

---

## Thread 2 — /nouns launch

### Cast 1 (primary, embed Frame for /nouns)

```
Nouns on Tezos, all in one place:

🟢 Visit Nouns FA2 — open-supply NFT, every Nouns seed 0-1199 mintable
🟢 Nouns Battler — deterministic turn-based fighter, stats from seed hash
🟢 Card of the Day — rotates through 21 Nouns via UTC date
🟢 CC0 forever

live on mainnet. ~0.003 ꜩ to mint.

pointcast.xyz/nouns
```

### Cast 2 (reply)

```
why Tezos not ETH? three reasons:

— gas. 0.003 ꜩ vs $5-$50 ETH gas
— FA2 + FA1.2 are cleaner standards than ERC matrix
— baking yield (~5% APY) funds downstream mechanics without bridging

Teznouns (@VendingNFTs, 2023) was the proof-of-concept. we picked up
from there.
```

### Cast 3 (reply — Nouns Battler hook)

```
Nouns Battler is fully deterministic.

same seed → same stats, forever.
same match inputs → same outcome, forever.

no RNG. no server state. no accounts.

you can verify any match by re-running the inputs.

pointcast.xyz/battle
```

### Cast 4 (reply)

```
Card of the Day rotates through 21 Nouns by UTC date:

floor(epoch_ms / 86,400,000) mod 21

everyone on the site sees the same featured Noun every day. simplest
possible shared daily ritual; no coordination layer.
```

### Cast 5 (reply — final, with CTA)

```
mint a Visit Noun with any Beacon-compatible wallet (Kukai, Temple,
Umami, Altme):

pointcast.xyz/collection/visit-nouns

secondary on objkt:
objkt.com/collection/KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh
```

---

## Thread 3 — /el-segundo launch

### Cast 1 (primary, embed Frame for /el-segundo)

```
El Segundo, California — the creative / tech / Web3 angle.

pointcast's local pillar:
- things to do in ES
- the South Bay tech scene
- the 25-mile beacon radius
- ZIP 90245 community notes
- ESCU fiction

pointcast.xyz/el-segundo
```

### Cast 2 (reply)

```
ES is the industrial half of Silicon Beach: SpaceX, Riot, Beyond Meat,
Mattel, Anduril. aerospace workshops + startup warehouses east of
Sepulveda. long tail of Series A-C companies in aerospace, robotics,
gaming, AI tooling.

workshop-town, not campus-town. that's the aesthetic pointcast matches.
```

### Cast 3 (reply)

```
the beacon — 25-mile radius from Main + Grand — covers most of the
South Bay, Westside, industrial Hawthorne through Compton, edge of DTLA,
part of Long Beach.

19 neighborhoods mapped with SEED / TARGET / ADJACENT status at
pointcast.xyz/beacon.
```

### Cast 4 (reply — final, with CTA)

```
other creators shipping from ES:

- Good Feels (hemp THC beverage, where I'm COO) — shop.getgoodfeels.com
- The Squeeze (pickleball team, El Segundo Rec Park)
- a growing Tezos/Nouns CC0 scene

if you're here, drop a visit: pointcast.xyz/visit
```

---

## Tips

1. **Frames > Links.** When you cast the pillar URL, Warpcast auto-renders
   the OG card + 1-4 buttons. Don't paste the URL in plain text — cast
   the URL as the primary content and let the Frame render.

2. **Cross-channel wisely.** Casting to /dev, /nouns-channel, /base,
   /tezos multiplies reach but feels spammy if overdone. Limit to 2-3
   channels per thread.

3. **Recast with intent.** If someone recasts with commentary, reply
   with something substantive. Farcaster rewards conversation density.

4. **The "cold cast" problem.** Single-cast launches die fast. Thread
   format gives each cast its own engagement window. Aim for 4-5 cast
   thread, 45-90 seconds between casts.

5. **Use mentions only when genuine.** @dwr.eth, @v, @df, @jayme —
   don't mention unless you have substance to share with them. Cold
   mentions are rate-limited / hidden.

6. **Embed the right OG card.** For /agent-native, cast shows the blue
   FD-tinted terminal card. For /nouns, oxblood pixel-lens card. For
   /el-segundo, purple beacon card. Good visual hook reads at thumbnail.
