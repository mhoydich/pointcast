# Directory + aggregator submission checklist

A one-shot outreach list. Work through top to bottom over 2-4 weeks;
track progress in the status column. Most of these are free, take
under 5 minutes each, and give a real backlink or editorial mention.

Priority tiers:
- **P0** — do first, high leverage, almost certain to land
- **P1** — do this week, good leverage
- **P2** — nice to have, do over 2-4 weeks

Status: `[ ]` → `[~]` (submitted) → `[✓]` (live backlink).

---

## P0 — Search engines + feed registries

- [ ] **Google Search Console** — verify pointcast.xyz, submit sitemap-index.xml. https://search.google.com/search-console
- [ ] **Bing Webmaster Tools** — verify + submit sitemap. https://www.bing.com/webmasters
- [ ] **Yandex Webmaster** — verify + submit sitemap. https://webmaster.yandex.com
- [ ] **IndexNow** — bind `INDEXNOW_KEY` as Cloudflare Pages env var + host `<key>.txt` at the root, then run `node scripts/indexnow-submit.mjs --priority`
- [ ] **DuckDuckGo** — automatic via Bing; no submission needed
- [ ] **Seznam** — automatic via IndexNow
- [ ] **Naver** — automatic via IndexNow

---

## P0 — llms.txt / agent-native directories

These are the highest-leverage for /agent-native. Most are GitHub awesome-list-style repos.

- [ ] **llmstxt.org** — contact the maintainers (Jeremy Howard) via GitHub; request listing on the examples page. https://github.com/AnswerDotAI/llms-txt
- [ ] **awesome-llms-txt** (various GH lists) — search `awesome-llms-txt` on GitHub and PR yourself into the top 3-5. At least 4-5 such lists exist as of 2026-04.
- [ ] **Fern's llms.txt platforms list** — https://buildwithfern.com/post/best-llms-txt-implementation-platforms-ai-discoverable-apis (comment + DM Fern team)
- [ ] **Mintlify llms.txt examples post** — ask them to add PointCast as an example. https://www.mintlify.com/blog/real-llms-txt-examples
- [ ] **Content-Signals / contentsignals.org** — if they maintain an examples list, submit there
- [ ] **awesome-agent-web / awesome-agent-native** — PR if exists; create if not (this is also a backlink magnet you could maintain)

---

## P0 — Web3 / CC0 / Nouns directories

For /nouns pillar.

- [ ] **nouns.center** — directory of nouns-proliferation projects. https://nouns.center
- [ ] **nouns.wtf proliferation page** — editorially curated; reach out via the Nouns Discord
- [ ] **Tezos Spotlight** — ecosystem feature blog. https://spotlight.tezos.com — pitch Visit Nouns as a CC0 proliferation case study
- [ ] **fxhash showcase** — if you have any generative seeds, tag #nouns #proliferation
- [ ] **objkt collection page** — Visit Nouns is already there; optimize the description + add "Nouns on Tezos" keyword
- [ ] **TzKT project list** — submit for the community-projects index
- [ ] **Teznouns Medium post** — reach out to @VendingNFTs with a pointer to /nouns for context
- [ ] **Ethereum-community Nouns directories** — even though we're on Tezos, /nouns explains the proliferation link; submit to cc0-art aggregators

---

## P1 — Developer / engineering directories

For /agent-native + general dev audience.

- [ ] **Hacker News Show HN** — see `hackernews-show-hn.md`
- [ ] **Lobsters** — see `lobsters-submission.md`
- [ ] **Dev.to** — see `devto-agent-native.md` (cross-post WITH CANONICAL set)
- [ ] **Indie Hackers launch post** — https://www.indiehackers.com/
- [ ] **Astro Showcase** — https://astro.build/showcase/ (submit via PR to astro-showcase GitHub)
- [ ] **Cloudflare Pages showcase** — https://pages.cloudflare.com/ (via contact form; takes months but free)
- [ ] **Built With Astro** / Built With Cloudflare aggregators
- [ ] **Hacker News "Ask HN"** — ask a substantive question that references the site (e.g., "Ask HN: is llms.txt actually moving the needle?"). Counts as second HN touch.
- [ ] **r/webdev** — post the Dev.to cross-post with commentary
- [ ] **r/astrojs** — Astro-specific implementation notes
- [ ] **r/selfhosted** — for the Cloudflare Pages + static-site angle

---

## P1 — AI / LLM / ML directories

- [ ] **r/LocalLLaMA** — the agent-native angle lands here
- [ ] **r/OpenAI** + **r/ClaudeAI** + **r/PerplexityAI** — each will be skeptical of different framings; adapt the post
- [ ] **TLDR AI newsletter** — editor@tldr.tech, pitch /agent-native
- [ ] **Import AI (Jack Clark)** — jack@importai.net
- [ ] **Ben's Bites** — ben@bensbites.co
- [ ] **The Rundown AI** — hello@therundown.ai
- [ ] **Bytes (Cassidy Williams)** — via cassidoo.co contact
- [ ] **Latent Space podcast + newsletter** — swyx has an open submission form
- [ ] **Simon Willison's Weeknotes** — tag him on Bluesky/Mastodon with the /agent-native URL; he links projects he finds interesting
- [ ] **Every.to** — pitch an Agent-Native Web essay
- [ ] **Stratechery / Platforms newsletter** — probably too big, but the GEO angle could land

---

## P1 — Farcaster / Web3 social

- [ ] **Bouncy Bounty / Warpcast channels:**
  - /dev
  - /build
  - /founders
  - /nouns-channel (for /nouns)
  - /base (Nouns builders overlap)
  - /purple (general)
  - /tezos (small but aligned)
  - /agents (if active)
- [ ] **Bluesky** — post the X thread verbatim. Cross-post to #webdev, #ai starter packs
- [ ] **Mastodon (@mhoydich on mastodon.social or similar)** — same content
- [ ] **Zora** — if any of your generative art sits there, link back

---

## P1 — Cannabis / hemp crossover (Good Feels angle)

For /c/good-feels reach. Careful: most cannabis ad channels are
closed, but editorial aggregators are open.

- [ ] **Marijuana Moment** — press tips
- [ ] **Green Market Report** — press tips
- [ ] **Leafly news** — cannabis beverage trend coverage
- [ ] **Hemp Industry Daily**
- [ ] **Drinks International** — hemp THC beverage category
- [ ] **VinePair** — if the beverage angle leans "modern adult drink"

---

## P2 — Local / hyperlocal (El Segundo / South Bay)

For /el-segundo pillar. Small but compound-y.

- [ ] **El Segundo Patch** — patch.com/california/el-segundo
- [ ] **Nextdoor** — post in El Segundo + neighboring (Manhattan Beach, Hawthorne)
- [ ] **egundo.com** — email for inclusion in directories + events coverage
- [ ] **LAist** — South Bay tag pitches
- [ ] **LA Weekly** — El Segundo tech scene angle
- [ ] **The Beach Reporter** — local South Bay paper
- [ ] **El Segundo Chamber of Commerce** — local business directory
- [ ] **SoCalTech** — Silicon Beach startup directory
- [ ] **Built in LA** — tech ecosystem listing

---

## P2 — Pickleball directories (for /c/court)

- [ ] **Pickleball Forum** — pickleballforum.com
- [ ] **The Dink** (newsletter + site)
- [ ] **PaddleTek / Joola / CRBN communities** — if you've published paddle reviews, cross-link
- [ ] **Reddit r/pickleball**

---

## P2 — Design / typography / CC0 art

For the Sparrow / design-system side.

- [ ] **SiteInspire** — siteinspire.com (visual showcase)
- [ ] **Awwwards** — probably won't win but free submission
- [ ] **Minimal.gallery** — if the aesthetic fits
- [ ] **CSS Design Awards**
- [ ] **Are.na** — create a channel for pointcast's design notes
- [ ] **Typewolf** — typography-focused; Gloock + Inter Tight + Departure Mono is distinctive
- [ ] **Fonts in Use** — specific pages documented
- [ ] **DesignSystems.com gallery**

---

## P2 — RSS / feed aggregators

Low volume, high intent.

- [ ] **FeedsPub** — user-submitted RSS directory
- [ ] **Feedly** — suggest your feed to Feedly editors for "discover" placement
- [ ] **Inoreader** — same
- [ ] **RSSFeeds.com**

---

## Email outreach templates

See `email-outreach-templates.md` for the 3 base templates
(newsletter curator / blogger / podcast host) that you can adapt to
any of the above.

---

## Measurement

Track in a Google Sheet or Airtable. Columns:

| Site | URL | Pitch date | Response | Live link? | Referral sessions 30d | Notes |

Review weekly. Drop pitches that aren't landing after 3 non-responses.
Double down on channels that convert.
