# X (Twitter) thread — /agent-native pillar

**Post from:** @mhoydich
**Best time (PT):** Tue/Wed 7:30-9:00 AM PT
**Thread length:** 7-9 tweets. Stop when the hook runs out; don't pad.

---

## Tweet 1 (hook — must stand alone)

```
Two-thirds of the web now gets read by an agent before a human.

if you're building for browsers, you're building for a shrinking
surface.

here's every agent-native surface I shipped on pointcast.xyz 👇
```

## Tweet 2

```
1/ /llms.txt

a curated Markdown index of your site for LLMs. proposed Sep 2024;
~10% of sites have adopted by early 2026.

Anthropic, Stripe, Cloudflare, Vercel, Perplexity all ship one.

cost: 15 min. payoff: LLM citations compound.
```

## Tweet 3

```
2/ /agents.json

JSON sibling of llms.txt — every endpoint, contract, schema in one
machine-readable file. aliased at /.well-known/agents.json (RFC 8615).

companion human page at /for-agents.
```

## Tweet 4

```
3/ stripped-HTML for AI crawlers

Cloudflare Pages middleware detects GPTBot, ClaudeBot, PerplexityBot,
Atlas, et al and returns semantic HTML + JSON-LD with the CSS/JS stripped.

12% payload savings on the home feed.

crawlers get clean content. feels polite.
```

## Tweet 5

```
4/ Content-Signals in robots.txt

IETF draft for explicit AI-training / search / AI-input preferences.

I opt IN on all three:
Content-Signal: ai-train=yes, search=yes, ai-input=yes

the explicit allowlist matters. default-deny is the biggest self-inflicted
SEO wound of 2026.
```

## Tweet 6

```
5/ JSON twins

every page that matters has a /path.json counterpart:
/b/{id} + /b/{id}.json
/c/{slug} + /c/{slug}.json + /c/{slug}.rss
/feed.json (JSON Feed 1.1) + /feed.xml (RSS 2.0)

agents don't scrape. humans don't write scrapers.
```

## Tweet 7

```
6/ rich JSON-LD

BlogPosting, SocialMediaPosting, Product, MusicRecording, FAQPage,
HowTo, Place, SiteNavigationElement.

one @graph, referenced by @id from every page.

drives Google rich results AND LLM entity extraction.
```

## Tweet 8

```
7/ Farcaster Frames on every block

every URL's share-unfurl IS the UI. 1-4 buttons, no tap-through needed.

the only distribution channel built for the agent era.
```

## Tweet 9 (close — CTA + canonical URL)

```
the full writeup with code links:
pointcast.xyz/agent-native

CC0 content, MIT code. steal what works.

repo: github.com/MikeHoydich/pointcast
```

---

## Tips

1. **Don't auto-thread with a tool.** Post one, read it back, post the
   next. Gives you a chance to fix typos and read the room.

2. **Tweet 1 is the whole post.** If tweet 1 doesn't stand alone as
   a hook, the rest won't get read.

3. **No hashtags except maybe 1.** X's algorithm doesn't care the way
   it used to. Hashtag spam looks amateur.

4. **Pin the thread** if engagement is real (>100 likes in first hour).

5. **Cross-post to Bluesky** verbatim. Bluesky audience over-indexes on
   devtool / design content; expect outsized engagement relative to
   follower count.

6. **Follow up 48h later** with a single tweet: "48h after posting this
   thread, here's what changed:" + screenshot of GSC / referral data.
   LinkedIn-style update, X-style brevity.
