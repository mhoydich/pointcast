# Dev.to cross-post — agent-native web

**Post to:** https://dev.to/new
**Canonical URL:** `https://pointcast.xyz/agent-native`  (this MUST be set
in the Dev.to editor's "Canonical URL" field — otherwise Google deduplicates
and /agent-native loses ranking signal to the Dev.to copy)
**Tags:** `#webdev` `#ai` `#seo` `#llms`
**Cover image:** upload `public/images/og-agent-native.png`

---

## Title

```
How I made my site agent-native: llms.txt, agents.json, and stripped-HTML for AI crawlers
```

**Alternate titles:**
- `The agent-native web checklist — 8 surfaces every site should ship in 2026`
- `I served 12% lighter HTML to ChatGPT and it was the easiest SEO win of the year`

---

## Body

```markdown
Two-thirds of the web now gets read by an agent before (or instead of) a
human. ChatGPT cites sources. Claude retrieves context. Perplexity answers
queries with citations. If your site is built for "human browsing a URL,"
you're optimizing for a shrinking surface.

This post walks through every agent-discoverability surface I shipped on
[pointcast.xyz](https://pointcast.xyz) — a CC0, human-AI collaborative
broadcast I run out of El Segundo — with working code links. Steal what
you need.

## The 8 surfaces

### 1. `/llms.txt` + `/llms-full.txt` — the curated Markdown index

[llms.txt](https://llmstxt.org) is a root-path Markdown file proposed by
Jeremy Howard in September 2024. It's a compact table-of-contents for
your site aimed at language models. As of early 2026, ~10% of sites have
adopted it — Anthropic, Stripe, Cloudflare, Vercel, Perplexity included.

The spec is forgiving: an H1 with the site name, a blockquote summary,
then any Markdown sections you want. The dual-file pattern (`llms.txt`
as index + `llms-full.txt` with content inlined) is what most serious
implementers ship.

My file is ~2,500 tokens; the full version embeds the manifesto +
glossary inline so RAG agents don't need a second fetch.

### 2. `/agents.json` — the programmatic discovery manifest

Where llms.txt is Markdown, agents.json is structured JSON. It lists
every endpoint, contract, schema, and discovery surface in one file,
indexed for programmatic consumption. I also alias it at
`/.well-known/agents.json` per RFC 8615.

I ship a human-readable companion at `/for-agents` so visitors
browsing with intent can see everything that's available.

### 3. Stripped-HTML middleware for AI crawlers

The novel surface. My site runs a Cloudflare Pages middleware
(`functions/_middleware.ts`) that detects AI crawlers by User-Agent
and returns the same semantic HTML + JSON-LD, minus stylesheets,
scripts, preload/preconnect links, icon/manifest tags, and inline
style attributes.

Detected vendors: GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot,
Atlas, Google-Extended, Meta-ExternalAgent. Any UA prefixed `ai:`
also triggers. Response carries an `X-Agent-Mode` header so you
can see the branch.

Typical payload savings: **~12%** on the home feed. Why bother?

- Polite: crawlers don't need your decorative CSS; serving it wastes
  their bandwidth and your origin CPU.
- A signal you treat agents as peers, not hostile scrapers.
- Measurable win in origin bandwidth bills at scale.

### 4. JSON mirrors for every page that matters

Pattern: if a human surface renders it, a machine surface can fetch it
without HTML parsing:

- `/b/{id}` (HTML) + `/b/{id}.json`
- `/c/{slug}` + `/c/{slug}.json` + `/c/{slug}.rss`
- `/archive` + `/archive.json`
- `/feed.json` (JSON Feed 1.1) + `/feed.xml` (RSS 2.0)
- `/blocks.json` (full archive in one file)

Saves agents from DOM scraping; saves humans from writing scrapers
and keeping them working when the HTML shifts.

### 5. Content-Signals in robots.txt

[Content-Signals](https://contentsignals.org) is an IETF draft
(draft-romm-aipref-contentsignals) for explicit site-wide preferences
around AI training, search indexing, and AI inputs. I opt IN on all
three:

```
Content-Signal: ai-train=yes, search=yes, ai-input=yes
```

Paired with an explicit User-Agent allowlist for every major LLM
crawler — GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, anthropic-ai,
PerplexityBot, Google-Extended, Meta-ExternalAgent, CCBot, cohere-ai,
MistralAI-User. The explicit allowlist matters because many sites
default-deny LLM crawlers via `Disallow: /` on those UAs. If your
content wants to be cited, opt in explicitly.

### 6. `/.well-known/` endpoints

RFC 8615 reserves `/.well-known/` for standardized discovery paths.
My site publishes:

- `/.well-known/agents.json` — alias of /agents.json
- `/.well-known/mcp/server-card.json` — Model Context Protocol server card
- `/.well-known/api-catalog.json` — RFC 9727 linkset of machine-readable APIs
- `/.well-known/agent-skills/index.json` — published skill manifests
- `/.well-known/oauth-authorization-server.json` + `/.well-known/oauth-protected-resource.json` — RFC 9728 OAuth discovery (published with explicit "no auth required" rather than 404, so agents get a clean answer)

### 7. Rich JSON-LD schema

Schema drives two things: Google rich results and LLM entity
extraction. My graph:

- **WebSite + Organization + Person** declared once in the base layout, referenced by `@id` from every page
- **BlogPosting / SocialMediaPosting / MusicRecording / VideoObject / Product** per-block conditional on type
- **CollectionPage + BreadcrumbList + ItemList** on channel pages
- **FAQPage** on manifesto + pillars
- **DefinedTermSet + DefinedTerm** on glossary (24 terms, stable anchor URLs)
- **HowTo** on blocks with `meta.format: "howto"`
- **Place + GeoCircle** on /beacon + /el-segundo
- **SiteNavigationElement** on home (Channels / Pillars / Tools)

### 8. Farcaster Frames

Every content URL renders as a 1-button Farcaster Frame when shared.
MINT / FAUCET blocks get extra marketplace buttons. It's the only
"agent-era" distribution channel where a URL's share-unfurl IS the UI.

## Minimum viable agent-native stack (pick an order)

If you want to retrofit your own site, here's the cost-ordered
checklist:

1. **/llms.txt** — 15 minutes to write, free
2. **/agents.json** — 30 minutes, free
3. **JSON Feed + RSS** — 30 minutes (Astro / Hugo / Next give you this free)
4. **Content-Signals in robots.txt** — 5 minutes, free
5. **JSON-LD graph** — 1-2 hours, free
6. **Stripped-HTML middleware** — half day, runs on any CDN with request rewriting
7. **Per-page JSON mirrors** — depends on your framework; 1-2 days for a small site
8. **Farcaster Frame meta** — 1 hour if you're already on Astro/Next

Default-deny LLM crawlers in your robots.txt is the biggest avoidable
self-inflicted SEO wound of 2026. Everything else compounds from there.

## Does this actually help traditional SEO?

Indirectly. Most agent-native surfaces overlap with best-practice SEO:
rich JSON-LD, stable permalinks, clean sitemaps, descriptive meta,
well-structured Q&A.

The primary upside is **GEO** — getting cited by ChatGPT, Claude,
Perplexity, Gemini, and future agents when they answer user queries.
llms.txt and agents.json are specifically designed for that use case.

---

If you want the full production code, everything I described is open
at [github.com/MikeHoydich/pointcast](https://github.com/MikeHoydich/pointcast).
The canonical version of this post lives at
[pointcast.xyz/agent-native](https://pointcast.xyz/agent-native) —
set as the canonical in this article's frontmatter.

Happy to answer specific questions in the comments.
```

---

## Dev.to-specific tips

1. **SET THE CANONICAL URL** in the editor. It's under "Advanced". If
   you don't set it, Google indexes the Dev.to copy and pointcast.xyz
   loses the ranking for its own content.

2. **Cover image** — upload `public/images/og-agent-native.png`. Dev.to's
   defaults are ugly; a good cover image doubles CTR.

3. **Tags** — use 4 (Dev.to's max). `#webdev #ai #seo #llms` — all four
   are high-traffic.

4. **Series** — create a "Agent-native web" series on your Dev.to profile
   so future posts (/el-segundo, /nouns, recap posts) cluster together.

5. **Engage** — Dev.to has a long-tail algorithm. Reply to every comment
   in the first 48h. Like comments that add value (signals the platform).

6. **Cross-post timing** — publish on Dev.to 24-48h AFTER the HN launch,
   not before. HN should see the canonical; Dev.to gets the canonical
   reference.
