# Manus brief · traffic operations sweep

**To:** Manus (M)
**From:** CC
**Date:** 2026-04-17 evening PT
**Priority:** High — two of these (GSC + IndexNow) unblock discoverability entirely.

---

## Context

Mike is playing pickleball. He's asked for autonomous traffic work across SEO / GEO / LLM discoverability. CC can handle engineering lanes but the ops lanes need login sessions + a real browser. That's you.

Site is live at https://pointcast.xyz (Cloudflare Pages). GitHub repo at github.com/mhoydich/pointcast. Mike's primary email is on file; he has access to Google, X (@mhoydich), Farcaster, objkt.

---

## Task 1 · Google Search Console registration

**Goal:** Verify pointcast.xyz in GSC so we can submit sitemaps + monitor impressions.

1. Sign into search.google.com/search-console with Mike's Google account
   (he should be logged in via Safari).
2. Add property: `https://pointcast.xyz` (URL-prefix variant, not
   Domain — Domain needs DNS TXT which requires Cloudflare access).
3. Verification method: **HTML file upload** (easiest) or **HTML tag**
   (requires a code commit — ping CC for it).
4. If HTML file: download the `google*.html` file, send to CC for
   commit to `public/`, wait for redeploy, then click Verify in GSC.
5. Once verified, go to Sitemaps → submit `https://pointcast.xyz/sitemap-index.xml`.
6. Also request indexing for:
   - `https://pointcast.xyz/`
   - `https://pointcast.xyz/manifesto`
   - `https://pointcast.xyz/for-agents`
   - `https://pointcast.xyz/archive`
   - `https://pointcast.xyz/editions`
7. Screenshot the "Success" dialog for each and save to
   `docs/manus-logs/2026-04-17-gsc.md`.

## Task 2 · Bing Webmaster Tools + IndexNow

**Goal:** Parallel registration for Bing, plus IndexNow for faster crawling.

1. Sign into bing.com/webmasters with Mike's Microsoft account (if he
   doesn't have one, create with his primary email).
2. Add site: `https://pointcast.xyz`. Bing Webmaster can **import from
   GSC** once GSC is verified — use that to skip the second verification.
3. Submit sitemap: `https://pointcast.xyz/sitemap-index.xml`.
4. Enable IndexNow: generate an IndexNow API key in Bing Webmaster
   settings. Paste the key to CC — they'll commit a
   `<key>.txt` file to `public/` so Bing can verify ownership. After
   that, any URL we push to IndexNow gets crawled in minutes instead
   of days.
5. Screenshot → `docs/manus-logs/2026-04-17-bing.md`.

## Task 3 · LLM discovery directory submissions

**Goal:** Get pointcast.xyz into the emerging LLM-site directories.

Candidates (check each is live + accepting submissions):

- llmstxt.site — directory of sites with llms.txt files
- llms-txt.directory
- agents.md sites (look for community lists on GitHub)

For each that exists + accepts submissions:

1. Submit `https://pointcast.xyz/llms.txt` per their form
2. Note the submission confirmation + URL in the log

Log: `docs/manus-logs/2026-04-17-llm-directories.md`

## Task 4 · Farcaster + X launch post (drafts only)

**Goal:** Draft posts for Mike's review — do NOT publish without his
explicit go. He'll approve content in chat.

**Farcaster cast draft** (~320 chars):

```
pointcast.xyz just got its agent layer.

/manifesto + /agents.json + /llms.txt are the canonical sources now.
every human page has a JSON mirror. stripped HTML for AI crawlers at
the edge. Visit Nouns FA2 live on Tezos mainnet.

if you're building agent-native sites, the endpoints are designed
to be readable, not scraped.
```

**X thread draft** (5 posts):

1. Hook — "PointCast is an agent-native site. every human page has a
   JSON mirror. this is what that looks like in practice"
2. Manifesto — "https://pointcast.xyz/manifesto · 12 FAQs, DefinedTerm
   schema, FAQPage JSON-LD. the canonical URL for the Blocks primitive"
3. Endpoints — "every page has a .json sibling: /blocks.json,
   /archive.json, /editions.json, /timeline.json. no scraping required"
4. Agent mode — "crawlers get stripped HTML at the edge. ~12% smaller,
   same content. X-Agent-Mode header signals it"
5. Nouns Battler + Prize Cast — "/battle is deterministic, same seed
   same fight forever. /cast is no-loss savings on Tezos. both ship soon"

Dump drafts to `docs/manus-logs/2026-04-17-launch-drafts.md` — Mike
reviews + gives the publish nod.

## Task 5 · objkt.com collection curation

**Goal:** Make sure the Visit Nouns FA2 collection reads well on objkt.

1. Sign into objkt.com with Mike's Tezos wallet (Kukai).
2. Navigate to collection
   https://objkt.com/collection/KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh
3. Edit collection metadata:
   - Name: `PointCast · Visit Nouns`
   - Description: 1-2 sentences pointing to pointcast.xyz/manifesto
   - Cover image: upload `/images/og/collection.png` from the repo
   - External URL: https://pointcast.xyz/collection/visit-nouns
4. If any of the 10 existing mints need metadata touch-up, log the
   discrepancies (don't fix — CC handles the contract path, this is
   MH's proto-mint decision).
5. Log: `docs/manus-logs/2026-04-17-objkt.md`

---

## Output format

Each task gets its own file in `docs/manus-logs/`. Include:

- Screenshots (paste or link)
- What you did
- What you observed
- What broke / blockers for MH
- Time taken

Commit with prefix: `manus: <task>: <brief>` so CC picks it up on next
session start.

---

## Priority order

If time-boxed: **1 → 2 → 5 → 3 → 4.**

GSC + Bing + IndexNow are the three that unblock real crawler traffic.
Everything else is amplification on top.

Hit me (CC) if anything needs engineering — HTML verification tag,
IndexNow key file commit, OG image regeneration, etc.

---

*Thanks Manus. Keep the loops tight.*
