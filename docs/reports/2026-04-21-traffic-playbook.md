# PointCast Traffic Playbook — 2026-04-21

**Scope:** How to generate organic traffic to pointcast.xyz in Q2 2026.
**Audit baseline:** SEO foundations shipped 2026-04-21 (see
`docs/reports/2026-04-21-seo-audit.md`). Infrastructure is world-class;
bottleneck is distribution.

---

## TL;DR — the strategic bet

**You do not have a traffic problem. You have a citations problem.** The
site is already objectively well-built for both search and LLM retrieval.
What's missing is the inbound-link and mention volume that tells Google
(and ChatGPT/Claude/Perplexity) that pointcast.xyz is an authoritative
source worth citing.

Three channels compound the fastest for a site of PointCast's shape:

1. **GEO — citations in ChatGPT / Claude / Perplexity / Gemini.**
   This is the single highest-leverage lane because (a) no one else in
   our niches has built agent-native infrastructure this deep, (b) the
   /agent-native pillar is a natural source-of-truth for a query pattern
   that's growing ("show me an example of llms.txt") and (c) LLM
   citations compound — once Claude cites us in one answer, the canonical
   URL keeps resurfacing.

2. **Backlinks from devtool / AI / agent writers.** The audience writing
   about agent-native web, LLM crawlers, Content-Signals, and CC0
   proliferation overlaps 100% with the audience that will benefit from
   linking to /agent-native, /nouns, and /manifesto. Small audience,
   extremely high per-link value.

3. **Local SEO for El Segundo + South Bay.** Uncontested editorial angle
   in a market where competitors (egundo.com, elsegundo.gov) own generic
   local but not "creative / tech / Web3 El Segundo." Slower compound,
   but the /el-segundo pillar is keyword-sized for intent that
   converts.

**The rest** — Farcaster Frames, Nouns community, pickleball, cannabis
crossover, social — are real but secondary. Maximize them, but don't
confuse their ceiling with the three above.

---

## Where traffic actually comes from for a site like this

Ranked by PointCast fit, not by generic web-traffic averages:

| # | Source | Fit | 90-day realistic | Compound velocity |
|---|---|---|---|---|
| 1 | LLM citations (GEO) | Very high — /agent-native is made for this | 200-2,000 referral sessions/mo from "ChatGPT sent me" | Fast (days to weeks) |
| 2 | Aggregator launches (HN, Lobsters, Dev.to) | Very high for /agent-native | 1k-20k sessions in 48h, then long tail | One-shot spikes, ~10-20% persist as backlinks |
| 3 | Devtool / AI newsletters (TLDR, Bytes, Import AI, Ben's Bites) | High | 500-3k sessions per mention | Medium (1-4 weeks for pickup) |
| 4 | Organic search (Google/Bing) | High for long-tail | 50-500 sessions/mo at month 3; 1-5k/mo at month 6 | Slow (3-6 months), deep compound |
| 5 | Farcaster Frames | High — every block auto-Frames | 100-1k frame-clicks per well-shared cast | Immediate but short-lived |
| 6 | Mike's personal social (X + Farcaster + LinkedIn) | Medium | 50-500 sessions per thread | Immediate, short-lived |
| 7 | Nouns community cross-linking | Medium — niche, high trust | 50-300 sessions from cross-links | Medium, compounds with Nouns proliferation |
| 8 | Tezos ecosystem (TzKT, objkt, fxhash features) | Medium | 100-500 per feature | Slow |
| 9 | Good Feels commercial crossover | Medium | 100-500 via QR + shop link | Immediate, limited ceiling |
| 10 | Pickleball / El Segundo Rec Park | Low-medium | 20-100 local sessions | Slow |
| 11 | RSS / JSON Feed | Low volume, high engagement | 10-50 per sub | High retention |
| 12 | Paid ads | Bad fit | n/a | n/a |

---

## 30-day launch sequence

Tied to the 3 pillars shipping. Starts the day production deploys. Each
row is one day; you can compress or expand but keep the sequence.

### Week 1 — seed the base

| Day | Action | Channel | Target |
|---|---|---|---|
| 0 | Deploy + ship all SEO changes from 2026-04-21 | — | Live pointcast.xyz |
| 0 | Submit sitemap to Google Search Console + Bing Webmaster Tools | GSC + BWT | Indexed within 48h |
| 0 | Bind `INDEXNOW_KEY` + run `node scripts/indexnow-submit.mjs --priority` | IndexNow | 27-URL priority push |
| 1 | Cast the 3 pillars on Farcaster (solo casts, each with Frame) | Farcaster | @mhoydich followers |
| 1 | X thread: "We built an agent-native broadcast. Here's what we learned." (links to /agent-native) | X | @mhoydich followers |
| 2 | Hacker News "Show HN: pointcast.xyz — an agent-native broadcast from El Segundo" | HN | Front page shot |
| 2 | Lobsters submission (technology post): /agent-native | Lobsters | Tech-savvy dev audience |
| 3 | Dev.to cross-post: "The agent-native web — how we implemented llms.txt, agents.json, and stripped-HTML middleware" (canonical back to /agent-native) | Dev.to | Developer audience |
| 3 | LinkedIn long-form: Mike's take on agent-native as a category | LinkedIn | Mike's network |
| 4 | Farcaster: the /nouns pillar with embedded Visit Nouns mint | Farcaster | Nouns community |
| 4 | Cast to /nouns-channel, /base, /tezos channels on Farcaster | Farcaster | Cross-community |
| 5 | Submit to `/awesome-llms-txt` and similar GitHub awesome lists (see submission checklist) | GitHub | Backlinks |
| 6 | Indie Hackers launch post | IH | Founder audience |
| 7 | Week 1 recap block shipped to /c/front-door | On-site | Loop content |

### Week 2 — amplify

| Day | Action | Channel | Target |
|---|---|---|---|
| 8 | Email TLDR AI / Bytes / Ben's Bites / Import AI with /agent-native writeup | Devtool newsletters | Newsletter mention |
| 8 | Submit Cloudflare Pages showcase + Astro showcase | Showcase directories | Showcase backlink |
| 9 | Farcaster Frame experiment: cast `/b/0205` (full READ block, rich Frame) | Farcaster | Engagement per Frame click |
| 10 | Post on Tezos subreddit + Nouns Discord / Farcaster | Community | Nouns + Tezos audiences |
| 11 | El Segundo Patch / Nextdoor post: "Meet your local agent-native site" | Hyperlocal | South Bay locals |
| 12 | Good Feels packaging QR → /c/good-feels (design change) | Commercial crossover | Customer traffic |
| 13 | Cast the /drum room to Farcaster with the drum-tap Frame | Farcaster | Drum ritual virality |
| 14 | Week 2 recap, Schelling poll post, newsletter-shaped block | On-site | Loop content |

### Week 3 — compound

| Day | Action | Channel | Target |
|---|---|---|---|
| 15 | Email / DM outreach to 10 devtool bloggers (Latent Space, Simon Willison, Benedict Evans) | Outreach | Backlinks + mentions |
| 16 | Audit week 1-2 metrics in GSC (impressions, CTR by query) | Measurement | Refine title/desc |
| 17 | Ship 3 more /c/* channel intros expanded to pillar length | On-site | More landing pages |
| 18 | Post to r/tezos + r/nft_art + r/webdev | Reddit | Niche audiences |
| 19 | Spotify / SoundCloud embed quality pass on /c/spinning | On-site | Engagement signal |
| 20 | Cross-post /nouns to Mirror + Paragraph with canonical back | Web3 publishing | Backlinks |
| 21 | Week 3 recap + newsletter | On-site | Loop content |

### Week 4 — iterate

| Day | Action | Channel | Target |
|---|---|---|---|
| 22 | Top-of-funnel: submit to 10 more niche directories (see checklist) | Directories | Link velocity |
| 23 | Podcast outreach: 5 devtool / AI podcasts with /agent-native angle | Podcasts | Episode feature |
| 24 | Publish "Our first month of agent-native traffic" retrospective (Article schema) | On-site | Meta content |
| 25 | Cast / post the retrospective | Social | Distribution |
| 26 | Launch partner cross-promo: Good Feels customer footer → PointCast | Commercial | Ongoing traffic |
| 27 | PSI run on all 10 key pages; fix top 3 issues | Technical SEO | Ranking boost |
| 28 | Channel trending chart — which /c/* grew fastest | Measurement | Double down |
| 29-30 | Review, rinse, queue next month's pillar pages | Strategy | Q2 roadmap |

---

## The high-leverage playbook (evergreen, not tied to launch)

Seven cadences to run on repeat after the 30-day launch window closes.

### 1. Weekly publishing cadence

- **Monday:** 1 READ block (long-form, Article schema). This is the
  citation magnet for the week.
- **Tuesday-Thursday:** 2-3 short NOTE/LINK/VISIT blocks. Keeps RSS
  fresh, serves the daily cadence.
- **Friday:** 1 LISTEN or WATCH block. Weekend mood.
- **Sunday 18:00 UTC:** /cast draw (when Prize Cast ships) + weekly
  recap block summarizing the week, with internal links to every
  published block. This becomes a sharable comeback URL.

### 2. Farcaster cadence (every block auto-Frames)

- Cast every MINT + FAUCET + major READ block directly (with preview image).
- 1 cast per day average; frames mean every cast is an action unit,
  not just a link.
- Reply to /nouns-channel, /base, /tezos, /agents, /purple when those
  conversations touch your domains.

### 3. X / Bluesky / LinkedIn cadence

- X: 1 thread/week around the Monday READ block. Thread format: 5-7
  tweets, last tweet is the /b/{id} link.
- Bluesky: mirror X thread. Bluesky audience over-indexes on dev /
  design / CC0 culture; expect outsized engagement relative to
  follower count.
- LinkedIn: 1 post every 2 weeks on the /agent-native or /el-segundo
  topics (Mike's professional network cares more about those).
- Threads: mirror X for the algorithmic lift.

### 4. Email / DM cadence (narrow + personal)

- 2 personal outreach emails per week to bloggers, newsletter
  curators, or podcast hosts who've covered adjacent topics. Include
  a specific link to a specific block that's relevant — never generic
  "check out our site."
- Track in a lightweight CRM (even a spreadsheet). Don't pitch the
  same person within 6 months.

### 5. Community-building (small wins, consistent)

- Reply substantively on Hacker News threads about LLM crawlers, GEO,
  llms.txt, agent-native, Cloudflare Pages patterns. Link /b/{id} when
  genuinely useful, never otherwise.
- Same on Lobsters, /r/webdev, Farcaster /dev.
- Same on Nouns-proliferation channels.

### 6. On-site internal linking

- Every new block gets at least 2 links out to existing blocks or pillar
  pages. Use the `companions` field already in the block schema.
- Every new pillar page gets linked from the 3-5 nearest channels' intros.
- The home grid is dense enough; don't bloat it with more content —
  drive people to archive + pillars via the masthead endpoints list.

### 7. Measurement cadence

- **Weekly (Monday morning):** check GSC impressions + CTR for the 3
  pillars + top 5 /b/{id} URLs. Note rising queries.
- **Monthly:** run PSI on all 10 priority URLs; note CWV trends.
- **Monthly:** LLM-citation spot-check — ask ChatGPT/Claude/Perplexity
  about "agent-native web example", "nouns on tezos", "El Segundo tech
  scene" and note whether pointcast.xyz surfaces.
- **Quarterly:** backlink audit (Ahrefs free alternative: ask
  Google/Bing which sites link to pointcast.xyz).

---

## Specific leverage plays by target audience

### If you want to rank for "llms.txt example"
- /agent-native is the landing page.
- Cross-link from /for-agents, /manifesto, /resources.
- Get on one of the llms.txt awesome lists.
- Write a detailed "how to ship llms.txt in 30 minutes" Dev.to post
  with canonical back to /agent-native.
- Get a backlink from Anthropic docs or Mintlify blog (their teams
  publish about llms.txt often).

### If you want to rank for "nouns on tezos"
- /nouns is the landing page.
- Get linked from nouns.center, nouns.wtf proliferation lists, or the
  Teznouns medium post (reach out to @VendingNFTs).
- Cross-post /nouns to Mirror (web3 backlink + readership).
- Submit Visit Nouns to NFT aggregators (Gem, OpenSea-equivalents on
  Tezos via objkt).

### If you want El Segundo locals
- /el-segundo is the landing page.
- Cross-post (canonical back) to the El Segundo Patch + Nextdoor.
- Get linked from egundo.com, Good Feels site, El Segundo Brewing, any
  local partner site.
- Add a physical QR code somewhere high-foot-traffic (El Segundo Rec
  Park pickleball, the front of Good Feels HQ if legal, the farmers
  market if you set up a booth).

### If you want Claude / ChatGPT / Perplexity to cite you
- Make sure /manifesto, /glossary, /agent-native stay the canonical
  Q&A surfaces.
- Keep llms.txt fresh — every new pillar adds an entry.
- Publish in Markdown-friendly formats wherever possible.
- Write "definitional" content — pages that answer "what is X"
  questions in one paragraph (LLMs love these).

---

## What to stop doing (or not start)

- **Paid ads.** Wrong audience for the content, wrong economics.
- **Email list.** Subscribe page says "no email list" — don't walk it back. RSS is the play.
- **More landing pages without distribution.** Pillars help only if
  linked to from off-site. Ship fewer pillars, promote each harder.
- **Generic "like and share" social posts.** Every social post should
  link to a specific block or pillar — never the home page.
- **SEO tricks that read spammy.** The content quality is good; don't
  add keyword-stuffed text or exact-match anchor spam. It flags
  pointcast.xyz to Google as low-quality and undoes everything.

---

## Ship-right-now artifacts (in this PR)

- `docs/outreach/hackernews-show-hn.md` — HN launch post draft
- `docs/outreach/devto-agent-native.md` — Dev.to long-form cross-post
- `docs/outreach/lobsters-submission.md` — Lobsters submission
- `docs/outreach/linkedin-pillar-thread.md` — LinkedIn long-form
- `docs/outreach/farcaster-pillar-casts.md` — Farcaster cast thread
- `docs/outreach/x-thread.md` — X thread
- `docs/outreach/submission-checklist.md` — directories + aggregators
- `docs/outreach/email-outreach-templates.md` — 3 templates for
  newsletter curators / bloggers / podcast hosts
- `scripts/generate-weekly-recap.mjs` — weekly recap draft builder
  that produces a ready-to-ship READ block + newsletter body

---

## Measurement targets (90-day)

| Metric | Today | 30 days | 90 days |
|---|---|---|---|
| Indexed URLs in GSC | ? | 550+ | 550+ |
| Organic sessions / month | ? | 500 | 3,000-5,000 |
| /agent-native sessions / month | 0 | 200 | 1,500 |
| /el-segundo sessions / month | 0 | 100 | 600 |
| /nouns sessions / month | 0 | 100 | 500 |
| LLM citations (manual count) | 0 | 5-10 | 30-50 |
| Referring domains (Ahrefs-style) | ~10 | 25-40 | 80-150 |
| Farcaster frame clicks / month | ? | 500 | 2,000-4,000 |
| Email opt-ins | 0 (intentional) | 0 | 0 |

Numbers are rough — they assume the 30-day launch sequence runs and the
7 evergreen cadences are kept up. Miss the launch window and everything
shifts out by 6 months.

---

## Sources

- [llms.txt adoption 2026 — LinkBuildingHQ](https://www.linkbuildinghq.com/blog/should-websites-implement-llms-txt-in-2026/)
- [Real llms.txt examples — Mintlify](https://www.mintlify.com/blog/real-llms-txt-examples)
- [Nouns DAO — Decrypt](https://decrypt.co/resources/what-are-nouns-the-nft-dao-building-open-source-ip)
- [El Segundo community sites — eGundo](https://egundo.com/)
- [Teznouns precedent — Medium](https://medium.com/@Vendingnfts/teznouns-was-a-project-that-started-out-as-a-proof-of-concept-for-a-dao-proposition-to-the-eth-baff6461e890)
