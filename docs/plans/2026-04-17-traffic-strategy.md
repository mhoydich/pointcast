# PointCast traffic strategy · v5

**Owner:** MH (strategy) · CC (engineering) · X (review) · M (operations)
**Date:** 2026-04-17 evening PT
**Status:** Plan-of-record. CC executes engineering lanes autonomously; M handles ops that need login sessions.

---

## The ask

Mike 2026-04-17 17:00 PT: *"how do we start getting traffic, seo, geo, llm, etc"*

PointCast is agent-native by construction — every human page has a
machine mirror. Traffic strategy should exploit that, not compete with
conventional content sites on conventional SEO terms.

**Goal**: become the authoritative URL for the concepts PointCast
defines (Blocks primitive, agent-native site, Nouns Battler, etc.) so
both search engines and LLMs cite us when these queries come up.

---

## Lane 1 · GEO (Generative Engine Optimization)

The emerging counterpart to SEO. LLMs retrieve content by entity and
concept, not keywords. Win here by being the canonical source.

### Landed this run (CC)

- **/manifesto** — FAQPage + DefinedTerm schema. 12 Q&A pairs Mike
  already has (what is PointCast, what is a Block, how to cite, etc.).
  Defines "Block", "Channel", "Type", "agent-native" as DefinedTerm
  entities with stable URIs (#block, #channel, etc.).
- **/agents.json** — consolidated discovery manifest. Aliased via
  `_redirects` at `/.well-known/agents.json` and `/.well-known/ai.json`
  for crawlers following the well-known pattern.
- **/llms.txt** — rewritten to match v2 Blocks architecture.
- **/llms-full.txt** — long-form unrolled content version of llms.txt
  for LLMs that want more factual substrate per request.
- **Stripped-HTML agent mode** — verified ~12% payload savings on home.

### Queued (CC)

- [ ] Add `<script type="application/ld+json">` with `TechArticle` +
  `SoftwareApplication` schema on /stack
- [ ] Add `ItemList` schema on /archive so LLMs see it as a collection
- [ ] Publish a short-paragraph, fact-dense version of each major concept
  at its own permalink (/blocks, /channels, /agents) — potential
  /glossary page consolidating all DefinedTerms
- [ ] Submit PointCast to public llms.txt directories (hoovering up
  mentions when indexers crawl lists of llms.txt-equipped sites)

### Queued (X · Codex review)

- [ ] Review /manifesto FAQs for extraction-friendliness (short
  paragraphs? clear sentences? fact density?)
- [ ] Propose additional DefinedTerm entries worth adding (Visit Nouns,
  Prize Cast, DRUM Token, Card of the Day)

### Queued (M · Manus)

- [ ] Verify /manifesto renders on Perplexity, Google AI Overviews, and
  Claude/ChatGPT retrieval (ask them about PointCast + see if we get cited)
- [ ] Submit https://pointcast.xyz to the emerging LLM discovery
  directories (llmstxt.site, llms-txt.directory if extant)

---

## Lane 2 · SEO (conventional search)

The un-sexy but real work. Google + Bing still drive long-tail referrals.

### Landed this run

- Per-page OG cards: /cast /editions /archive /battle /collection /drum /now /search /timeline /stack /manifesto
- JSON-LD on every route (CreativeWork, CollectionPage, WebApplication, FAQPage, FinancialProduct, DefinedTermSet)
- Proper canonical URLs + meta descriptions on all new pages
- Sitemap at /sitemap-index.xml → /sitemap-0.xml includes every route including new v4/v5 pages
- Self-hosted Inter + JetBrains Mono (fast LCP, no third-party font request)

### Queued (CC)

- [ ] Hreflang tag for en-US (signal to crawlers we're English-first)
- [ ] BreadcrumbList schema on /b/[id], /c/[channel], /collection/*,
  /collect/* — Google has been rewarding these with rich snippets
- [ ] Image alt coverage audit across the new pages (auto-sample)
- [ ] Core Web Vitals: verify LCP on the home masthead with the new
  HomeMajors strip (drum Nouns load 3 noun.pics SVGs)

### Queued (M · Manus)

- [ ] Register pointcast.xyz in Google Search Console (Mike owns the
  domain; Manus can drive the verification flow through Mike's Gmail)
- [ ] Register in Bing Webmaster Tools (import from GSC after verified)
- [ ] Submit /sitemap-index.xml to both consoles
- [ ] Submit /sitemap-index.xml via IndexNow to Bing (faster than
  webmaster-tools, direct API call)
- [ ] Check console for any crawl errors after 72h and report back

---

## Lane 3 · Syndication (distribution)

Traffic that comes from the site being mentioned elsewhere.

### Queued (M · Manus)

- [ ] Launch dispatch cross-post (content from MH, mechanical post by M):
  - Farcaster: cast with `/manifesto` URL + summary
  - X: thread threading the 12 FAQ answers
  - objkt.com collection announcement for Visit Nouns FA2
  - Nextdoor (El Segundo): one post about the drum room + pickleball
  - Mastodon (pick one: mastodon.social? mastodon.xyz?)
  - Bluesky
- [ ] Seed list (MH curates, M sends): 20-30 relevant people + agents
  notified personally — no mass mailing

### Queued (CC)

- [ ] Farcaster Frame integration for Visit Nouns mint — each /b/{id}
  with a MINT edition becomes a cast-inline mintable frame
- [ ] Twitter/X Card with `summary_large_image` (already set via og:image)
- [ ] Per-block share buttons (compact, mono, channel-colored)

---

## Lane 4 · Version upgrades

Mike: *"version upgrade across various"*. Sweep before scale.

### Engineering (CC)

- [ ] `npm update` — Astro 6.1.6 → 6.1.7 (patch, low risk)
- [ ] Check @taquito/* + @airgap/* for security patches (no breaking
  changes pinned via ^24.2.0 caret)
- [ ] Bump BLOCKS.md revision marker to v2.1 (9th channel BTL + new
  agent surfaces + media.thumbnail schema extension)
- [ ] Add `<meta name="pc-version" content="v2.1">` to BlockLayout for
  debuggability
- [ ] /changelog page enumerating versions (v1 → v2 → v2.1)

### Content (MH)

- [ ] Proto-mint decision (a/b/c) — the 10 URI-frozen Visit Nouns mints
  on mainnet. Carryover from v4.
- [ ] Admin transfer ceremony for Visit Nouns FA2 (`node scripts/transfer-admin.mjs`)
- [ ] DRUM compile path: install docker locally OR compile via
  smartpy.io web IDE, either unlocks DRUM ghostnet + Prize Cast
  mainnet simultaneously

---

## Lane 5 · On-site conversion

Traffic without engagement is noise. Make every landing page offer a
next-action, not just information.

### Landed this run

- **HomeMajors** — inline /drum tap module + live /cast countdown
  above the feed grid. Drum taps make sound, persist to localStorage,
  ping /api/drum for global count. Cast countdown ticks every second.
- **Presence pill** — YOU + "+N HUMANS · +N AGENTS" live
- Per-type visual variants (NOTE sticky-note, VISIT terminal-log, LINK
  arrow-forward, WATCH cinema-letterbox) + scroll rhythm via :nth-child

### Queued (CC)

- [ ] /subscribe page — plain RSS/JSON Feed instructions + Farcaster
  follow link
- [ ] Block-level reaction buttons (Cloudflare KV backed; session-bound
  dedupe like presence)
- [ ] "Minted by you" visualizer on /b/{id} — if the visitor's wallet
  owns this tokenId, show a "YOUR MINT ✓" pill
- [ ] Email capture (single form, no vendor — post to a KV queue)

---

## Measurement

PointCast deliberately ships no analytics. Counter-intuitively, this is
an asset: the site loads faster, has no cookie banner, respects privacy,
and can truthfully say it doesn't track visitors.

What we can measure without instrumenting:
- Cloudflare Pages analytics (aggregate page views, country, referer)
- Google Search Console impressions + clicks once M registers
- objkt.com collection page views (proxy for NFT interest)
- TzKT contract operation counts (mints per day)
- GitHub stars + forks on the repo
- Twitter/X post engagement when M cross-posts
- Claude/Perplexity citation frequency (qualitative — ask the assistants)

Quarterly: Mike reviews qualitative citation data + quantitative CF
Pages metrics, decides if a first-party analytics bolt-on (Plausible,
Fathom) is worth the added complexity. Current answer: no.

---

*Plan is the artifact. Execution lives in commits and TASKS.md.*
