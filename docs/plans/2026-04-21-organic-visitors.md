# Organic Visitor Plan for PointCast

Date: 2026-04-22
Owner: Codex
Status: sprint plan plus first build

## Goal

Grow organic, non-paid visitors to pointcast.xyz by making the site easier
to discover, cite, share, and revisit. The plan does not depend on a broad
marketing blast. It depends on narrow routes, useful public artifacts, clean
machine-readable surfaces, and a repeatable post-deploy distribution loop.

## Research Takeaways

Google's SEO starter guide frames SEO as helping search engines understand
content and helping users decide whether to visit. It also says sitemaps are
useful for discovery, but that people knowing about the site matters first.
Source: https://developers.google.com/search/docs/fundamentals/seo-starter-guide

IndexNow's protocol supports URL submission by POST and bulk lists of up to
10,000 URLs, but requires host ownership verification through a key file.
Source: https://www.indexnow.org/documentation

Bing Webmaster Tools emphasizes search performance, URL inspection,
IndexNow, sitemap monitoring, robots.txt testing, and site scans as the loop
for ongoing visibility. Source:
https://blogs.bing.com/webmaster/June-2025/Start-Using-Bing-Webmaster-Tools-to-Improve-Your-Site-Visibility

The practical implication for PointCast: the site already has unusual
substance, but the visitor path has to become more explicit. We should not
send everyone to the homepage. Send each audience to the most relevant door.

## Positioning

PointCast is not "a blog." It is a living broadcast with:

- Stable block permalinks and JSON mirrors.
- Agent-native discovery at /agents.json, /llms.txt, and /llms-full.txt.
- Tezos surfaces with real contracts and collection pages.
- Local El Segundo/South Bay context.
- Playable routes such as /battle and /drum.
- A visible build log at /sprints.

The organic strategy is to package those existing strengths into routes that
different people can understand in one click.

## Priority URLs

- /start: first-time visitor tour.
- /share: organic visitor campaign board.
- /share.json: machine-readable campaign kit.
- /for-agents: agent-native architecture and endpoint manifest.
- /agents.json: consolidated machine manifest.
- /collection/visit-nouns: Nouns/Tezos collection page.
- /local: El Segundo and 100-mile lens.
- /battle: play-first entry point.
- /ai-stack: practical operator entry point.

## Sprint Phases

### Phase 0: Index hygiene

- Ensure /share and /share.json return 200.
- Add /share to the homepage footer, /for-agents, /agents.json, llms.txt,
  llms-full.txt, and robots.txt.
- Keep JSON surfaces CORS-open and cacheable.
- After deploy, verify /share appears in the generated sitemap.
- Submit priority URLs through IndexNow once the key binding is live.

### Phase 1: Audience routers

Use six first-click doors:

- New visitors -> /start
- AI builders -> /for-agents
- Nouns/Tezos people -> /collection/visit-nouns
- Local people -> /local
- Play-first visitors -> /battle
- Operators/tool people -> /ai-stack

Each route should answer: "Why should this person click right now?"

### Phase 2: Outreach packets

Build reusable packets, not generic posts:

- Search recrawl packet.
- Agent-native launch packet.
- Nouns/Tezos packet.
- Local packet.
- Play-first packet.
- Creative-operator packet.
- Direct outreach packet for ten specific humans.

The rule: one audience, one URL, one proof point, one ask.

### Phase 3: Measurement loop

After every meaningful deploy:

1. Pick the canonical URL.
2. Choose the audience lane.
3. Write one hook.
4. Pair the hook with proof.
5. Publish or update a block.
6. Send the link in the right channel.
7. Submit the URL to IndexNow/sitemaps.
8. Review replies, referrers, and queries within 72 hours.

## First 72 Hours

Day 0:

- Publish /share and /share.json.
- Verify sitemap, robots, agent manifest, and CORS headers.
- Prepare one post for /for-agents and one post for /collection/visit-nouns.

Day 1:

- Send /local to ten local people with a specific ask.
- Cast or post the Nouns Battler Card of the Day challenge.
- Share the agent-native architecture with one developer audience.

Day 2:

- Review traffic, questions, and replies.
- Turn the best confusion into a glossary term or block.
- Update /share packets if one hook is clearly working.

## Guardrails

- Do not send bulk outreach automatically.
- Do not fake third-party endorsements or traffic.
- Do not over-claim contract status.
- Do not link people to missing routes.
- Prefer a useful narrow page over a broad homepage link.
