# Manus brief — Round 2 · Launch-week ops

**Audience:** Manus acting on operations + computer-use tasks alongside Codex review. Each task is self-contained. Report back with URLs, IDs, and before/after evidence.

**Context:** v3 sprint is largely shipped: `/mesh`, YeePlayer v0, DAO v1, publishing v1, yield sandbox, AI stack, 30 new blocks (0220 → 0255). Next step is audience — we need real humans and real agents citing the site. These are the discoverability + distribution ops.

---

## Task M-1 — Google Search Console submission + verification

**Steps:**
1. Add `pointcast.xyz` as a new property in GSC under the MH Google account.
2. Verify via the Cloudflare DNS TXT-record method (easiest given we're on Cloudflare Pages + Cloudflare DNS).
3. Submit the two sitemaps: `https://pointcast.xyz/sitemap-index.xml` and `https://pointcast.xyz/sitemap-blocks.xml`.
4. Submit these 5 priority URLs via "URL inspection → Request indexing":
   - `https://pointcast.xyz/`
   - `https://pointcast.xyz/manifesto`
   - `https://pointcast.xyz/for-agents`
   - `https://pointcast.xyz/mesh`
   - `https://pointcast.xyz/yee`

**Deliverable:** Screenshot of GSC dashboard showing the property verified + sitemap accepted. Report the timing — GSC normally takes 24–72 hours before data shows up.

---

## Task M-2 — IndexNow key bind (for Bing / Yandex push-indexing)

**Steps:**
1. Generate an IndexNow key at https://www.indexnow.org/ — it's a 32-char hex string you pick.
2. Create `public/{KEY}.txt` containing only the key (IndexNow validation requires this file served at `https://pointcast.xyz/{KEY}.txt`).
3. Add the key as a Cloudflare Pages env variable: `INDEXNOW_KEY` → `{KEY}`. Bind it in the Pages project's Settings → Environment variables.
4. Verify by POSTing a test URL to `https://pointcast.xyz/api/indexnow` with `{ "urls": ["https://pointcast.xyz/"] }`. Confirm response is `200`.
5. Once bound, submit these 10 canonical URLs:
   - `/`, `/manifesto`, `/for-agents`, `/mesh`, `/yee`, `/beacon`, `/dao`, `/ai-stack`, `/glossary`, `/blocks.json`

**Deliverable:** Key value (DM to MH, not posted anywhere). Test-submission response. Subsequent 5 URLs submitted and confirmed in the response.

---

## Task M-3 — LLM directory submissions

**Goal:** Get PointCast listed wherever agents discover sites to cite.

**Submit to:**
1. **llmstxt.org** — listing directory for sites with `/llms.txt`. Submit `https://pointcast.xyz/llms.txt`.
2. **Farcaster** — post the launch announcement (see M-5) in /pointcast channel; also cross-post in /indie and /nft relevant channels.
3. **HackerNews** "Show HN" — queued for 2026-04-20 Sunday evening (east coast morning). Title: "Show HN: PointCast — an agent-native broadcast from El Segundo (Astro + Tezos)". Body draft in `docs/briefs/hn-draft.md` (I'll write it — don't post yet).
4. **Indie Hackers** — same post, Indie Hackers version.
5. **Reddit** — `/r/cloudflare` (re: Cloudflare Pages + middleware pattern), `/r/astro` (re: Astro + content collections at scale), `/r/tezos` (re: FA2 + Beacon + Taquito), `/r/rhythmgames` (for YeePlayer). One thoughtful post per sub — no spam.

**Deliverable:** URL for each submission + post. Engagement screenshot after 24 hours.

---

## Task M-4 — objkt curation

**Goal:** The Visit Nouns FA2 contract is live on Tezos mainnet. objkt auto-indexes but the collection page needs curator polish.

**Steps:**
1. Go to `https://objkt.com/collection/{VISIT_NOUNS_CONTRACT}` (find address in `/agents.json`).
2. Claim curator rights if the interface offers it (may require the deployer wallet).
3. Set collection cover image to `/images/og/og-home-v2.png` (resize to objkt's preferred square ratio).
4. Set collection banner to a wide version.
5. Write the collection description: one paragraph, link back to `https://pointcast.xyz/for-agents`.
6. Tag the collection: `pfp`, `cc0`, `nouns`, `tezos`, `pointcast`.

**Deliverable:** Before/after screenshots of the objkt collection page.

---

## Task M-5 — Launch-post content + schedule

**Goal:** A single post we can paste everywhere with light adaptation.

**Master post** (for HN / IH / Farcaster long-cast):

> PointCast is a broadcast site from El Segundo, California. Every piece of content is a Block — a tiny primitive with a channel, type, timestamp, and (for mints) an on-chain edition on Tezos. The site has a parallel machine-readable surface: /agents.json lists every feed, every contract, every endpoint, and /llms.txt is live. Nine channels with individual RSS + JSON feeds. Agent mode strips ~12% of the home payload for any User-Agent that announces itself. All JSON is CORS-open.
>
> Two new launches today:
>
> - /mesh is the network map: three overlapping meshes (local 25-mile radius, online RSS + channels, agent machine surface), one page.
> - /yee is YeePlayer v0: a meditation-speed rhythm game that overlays bija mantras on a chakra tune-up video. Tap SPACE when each word reaches the line.
>
> The whole thing is Astro + Cloudflare Pages + SmartPy on Tezos. Static site, open source, CC0-flavored. Thoughts welcome.
>
> pointcast.xyz/mesh · pointcast.xyz/yee · pointcast.xyz/for-agents

**Platform adaptations:**
- **Farcaster long-cast:** as-is, under 1024 chars. Include Frame image from `/images/og/og-home-v2.png`.
- **X/Twitter:** compress to 270 chars: "New on PointCast today: /mesh (network map) + /yee (rhythm-game overlay on chakra tones). Every block has a JSON sibling, every channel has RSS, agent mode strips 12% of payload. Astro + Cloudflare Pages + Tezos. [link]".
- **HN Show:** as-is, add title.
- **LinkedIn:** personal voice, third paragraph on "what we're learning about agent-discoverability". Soft-sell.

**Deliverable:** Final copy per platform. Do not auto-post — MH needs to approve each one before it goes live.

---

## Task M-6 — Farcaster Frame validation

**Goal:** Every block page is supposed to be a Frame when cast in Warpcast. Validate.

**Steps:**
1. Cast `https://pointcast.xyz/b/0244` (beacon) into Warpcast with `/frames` debugger on. Confirm 3 buttons render correctly.
2. Cast `https://pointcast.xyz/b/0250` (YeePlayer launch). Confirm 2 buttons (default + "Play the tones" external).
3. Cast `https://pointcast.xyz/b/0253` (How agents read PointCast). Confirm.
4. If any Frame fails, note the error and report. The Frame meta tags come from `BlockLayout.astro` — if the pattern is wrong we fix once, everywhere gets it.

**Deliverable:** Screenshot grid: 3 casts × Warpcast render + validator output.

---

## Priority order

Run in this order — first three are day-1, last three are week-1:
1. M-2 (IndexNow key bind — unblocks push-indexing)
2. M-1 (GSC — starts the slowest pipeline first)
3. M-6 (Frame validation — catches any BlockLayout bug before it matters)
4. M-4 (objkt curation)
5. M-3 (LLM directory submissions)
6. M-5 (launch post — waits for MH approval on copy)

---

## Reporting

Single Notion / Google Doc with one heading per task. Update in-place. Ping MH when all six are in a "waiting on review" state.

— Claude Code (primary engineer), overnight 2026-04-17 → 2026-04-18
