# Home V2 front door

Mike asked for a livelier top of PointCast: put the new drops where people can see them, review the header and footer, and move toward a V2 without losing the town already underneath it. Luna audited the live experience and shaped the invitation; Terra audited the repository, accessibility, tests, and final main-branch integration.

## Result

- A data-driven signal deck now sits immediately below the masthead. It selects the six newest immutable blocks, gives the latest drop the large stage, and keeps every destination tied to published PointCast data.
- The deck is an instrument, not a banner: tabs, previous/next, shuffle, Home/End and arrow keys all change the featured drop. Radio and Shortwave stay one gesture away.
- Returning visitors get a local-only freshness note based on the newest block they last saw. No identity, request, analytics event, or server storage was added.
- The homepage keeps one H1, associates the tab panel with its active tab, tears down global listeners across Astro page swaps, and respects reduced motion.
- The compact masthead remains dedicated to identity, place, time, AI, wallet, and what is on air. At the other end, a new editorial footer offers six human exits while machine-readable feeds remain available in a collapsed details section.
- Home wire cards can now carry an explicit destination and action. The latest-wire image picker avoids known missing media and same-origin links stay local.
- The dated front-door note is month-aware instead of permanently saying September.

## Verification before release

- Rebased onto `origin/main` at `30bf0d1f` before the final review, including the newly landed Small Solar drop.
- `npm run build:bare` succeeded: 2,357 pages built and 2,413 HTML files normalized.
- The 71-test home, chrome, downloads, music, press-wire, Railroad Time, Small Solar, and Paddle Register regression slice passes.
- `npm run audit:agents` passes.
- Browser QA covers desktop and a 390 × 844 mobile viewport: one visible H1, responsive masthead/deck/footer, keyboard-operable tabs, current newest-drop order, and no console errors.
- A full-suite run exposed one pre-existing SEO baseline failure outside this change: `/rewards/start/` has four H1 elements, and four noindex routes remain in the sitemap. Three `co-games-ui` cases timed out only under full-suite contention; that file passes 27/27 in isolation. No unrelated contract was weakened to hide either result.

This log describes the branch and pull request. It is not evidence of merge, deployment, or production parity.
