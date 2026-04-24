# Hacker News — Show HN launch post

**Post to:** https://news.ycombinator.com/submit
**Best time (PT):** Tue/Wed 6:30-8:00 AM (right at the start of ET business hours; HN algorithm favors early morning PT submissions on weekdays)
**Target URL:** https://pointcast.xyz/agent-native

---

## Title (80 chars max)

```
Show HN: PointCast – an agent-native broadcast from El Segundo
```

**Backup title options:**
- `Show HN: I shipped llms.txt, agents.json, and stripped-HTML for AI crawlers`
- `Show HN: PointCast – every page has a JSON twin and an llms.txt summary`
- `Show HN: A CC0 site built for humans and AI crawlers in equal measure`

---

## First comment (post yourself, immediately, as the submitter)

```
Hey HN — I'm Mike, the human in the loop here. PointCast is a personal
broadcast I've been running out of El Segundo for the last ~4 months,
built with Claude Code (Anthropic) and Codex (OpenAI) as daily
collaborators. Every piece of content is a "Block" — a stable JSON
schema with an immutable monotonic ID, one of 9 channels, one of 8
types — and every page has a machine-readable JSON twin.

The /agent-native writeup I'm linking here is the "how we did it":

  - /llms.txt + /llms-full.txt (dual curated index for LLM retrieval)
  - /agents.json (consolidated discovery manifest) + /.well-known alias
  - Stripped-HTML mode for detected AI crawlers via Cloudflare Pages
    middleware — detects GPTBot, ClaudeBot, PerplexityBot, Atlas, et al
    by User-Agent and returns semantic HTML + JSON-LD minus the CSS/JS
    stack. ~12% payload savings.
  - Content-Signals (IETF draft-romm-aipref-contentsignals) opt-in for
    ai-train / search / ai-input. Opposite of the default-deny robots.txt
    posture.
  - JSON Feed 1.1 + RSS 2.0 + per-channel feeds + a block-only sitemap.
  - Rich JSON-LD schema: BlogPosting / SocialMediaPosting / HowTo /
    Product / MusicRecording per block type, plus SiteNavigationElement,
    FAQPage, DefinedTermSet, Place.
  - Farcaster Frames on every block (with 1-4 buttons) so every
    shared URL is also a render-in-place action unit.

It's CC0-flavored, MIT-flavored code, built as explicit human-AI
collaboration. Repo is github.com/MikeHoydich/pointcast; we ship 2-10
blocks per day autonomously (Claude Code runs on an hourly cron, reads
a docs/inbox queue, ships sprints).

Happy to go deep on any surface — the middleware is the weirdest part
and I haven't seen anyone else doing the same.
```

---

## Second comment template (seed discussion — post 5-10 min later)

```
A few anticipated questions:

**Why Tezos and not Ethereum for the on-chain bits?** Fractions of a
tez per mint vs multi-dollar ETH gas. FA2 and FA1.2 are cleaner
standards than the ERC matrix. One wallet protocol (Beacon) covers
Kukai / Temple / Umami / Altme. Baking yield funds downstream
mechanics without bridging. L1 only, no L2 sprawl. Full rationale at
/nouns if you want the longer version.

**Is llms.txt worth the effort?** ~10% of sites have adopted it as of
early 2026. Anthropic, Stripe, Cloudflare, Vercel, Perplexity all
ship it. The skeptic's read is "it's robots.txt theater." The pragmatist's
read is "pays for itself the first time Perplexity cites you verbatim,
because you handed them a clean index." Both reads have merit.

**How is this different from a normal Astro site?** It's mostly the
same Astro + Cloudflare Pages stack — the novel parts are the
stripped-HTML middleware (functions/_middleware.ts), the
agents.json / llms.txt / for-agents / .well-known surface set, and
the per-block JSON mirrors. The rest is just Astro content
collections + JSON-LD hygiene.
```

---

## Tips for landing this post

1. **Do not post at cold-start.** If it's your first HN submission in
   a while, warm the account by leaving 2-3 substantive comments on
   unrelated threads the day before.

2. **The submission title must have "Show HN:" as the first token.**
   Mods will edit it if you don't, but it's better to get it right.

3. **Do not ask for upvotes anywhere.** HN penalizes rings. Share the
   URL once on X/Farcaster in the first 60 minutes, then let it breathe.

4. **Respond to every top-level comment within the first 2 hours.** The
   algorithm weighs submitter engagement. Keep replies substantive —
   no "thanks!" one-liners.

5. **Have a fallback link ready.** If HN is down or traffic melts the
   site, have a read-only Cloudflare cache warmed.

6. **Don't post on Friday or weekends.** Dead audience.

7. **If it doesn't fly, don't resubmit.** Wait 3-6 months, rewrite the
   title, and try a different angle (e.g., the Tezos side via /nouns
   instead of the agent-native side).
