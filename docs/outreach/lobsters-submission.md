# Lobsters submission — /agent-native pillar

**Post to:** https://lobste.rs/stories/new (requires invite; if uninvited,
DM a current Lobsters user on Mastodon / Bluesky for one)
**Target URL:** https://pointcast.xyz/agent-native
**Tags:** `ai`, `web`, `show`
**Best time (PT):** weekday mornings, 6:30-9:00 AM PT

---

## Title (85 chars max)

```
The agent-native web: llms.txt, agents.json, and stripped-HTML for AI crawlers
```

---

## Intro comment (mandatory on Lobsters for Show/AI posts; post immediately)

```
Author here. Lobsters-focused version of the HN post from a few days ago,
with more emphasis on the middleware pattern.

The novel bit is the Cloudflare Pages middleware that detects AI crawlers
by User-Agent (GPTBot, ClaudeBot, PerplexityBot, et al) and returns
stripped HTML — same semantic markup and JSON-LD, no CSS/JS/preloads.
~12% payload savings on the home feed, and the crawlers get cleaner
content to ingest. Code is in `functions/_middleware.ts` in the repo
(github.com/MikeHoydich/pointcast).

The rest of the surfaces (/llms.txt, /agents.json, per-page JSON twins,
Content-Signals opt-in, .well-known RFC 8615 paths, rich JSON-LD across
BlogPosting / FAQPage / HowTo / Place / SiteNavigationElement) are more
conventional — but shipping all of them together made the whole system
work better than any single piece does in isolation.

CC0-flavored content, MIT-flavored code. Happy to go deeper on any
piece.
```

---

## Lobsters-specific tips

- Lobsters is much more skeptical of "Show HN"-shaped posts than HN
  is. Don't oversell. Lead with the novel technical detail (the
  middleware), not the narrative.
- Use tags `ai` + `web` + `show`. Do NOT use `seo` — Lobsters has
  allergic reactions to SEO-tagged content. The audience cares about
  the engineering, not the marketing.
- Respond to every comment thread. Lobsters down-votes low-engagement
  submissions.
- Don't cross-post to HN within 7 days in either direction. Both
  communities notice.
