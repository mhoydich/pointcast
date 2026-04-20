/**
 * Sprint backlog — candidate work items the /sprint page surfaces as
 * one-click directives. Mike (or any visitor) taps PICK on a card; the
 * pick goes to /api/queue (or docs/queue/ as fallback); cc reads the
 * queue at the start of the next session or hourly cron-tick and
 * executes the highest-priority picked item.
 *
 * Owner: cc (default). Mike edits this file when he wants new candidates
 * or to retire stale ones. The list is short on purpose — ~6-8 items max
 * so the page stays a single mobile screen.
 */

export type SprintStatus =
  | 'ready'        // ready to pick, no blockers
  | 'needs-input'  // blocked on something Mike has to provide (e.g. a video URL)
  | 'in-progress'  // actively running
  | 'done';        // shipped — kept around briefly for the "recently shipped" strip

export interface Sprint {
  id: string;            // stable slug used in /api/queue + docs/queue
  title: string;         // card heading
  why: string;           // one-line rationale
  output: string;        // what ships when this lands
  estMin: number;        // rough time
  status: SprintStatus;
  needs?: string;        // when status === 'needs-input', what's needed
  owner?: 'cc' | 'mike' | 'codex' | 'manus';
  shippedAt?: string;    // ISO date — populated when status === 'done'
  shippedAs?: string;    // commit message or block id reference
}

/**
 * Live backlog. Order matters — when no specific pick is queued, cc
 * defaults to the first 'ready' item.
 */
export const SPRINT_BACKLOG: Sprint[] = [
  {
    id: 'voice-audit',
    title: 'Voice audit · 12 false-Mike blocks',
    why: 'Some recent blocks (0250–0269) put first-person experience in Mike\'s voice that Mike didn\'t actually have. Default author should be cc; Mike-voice requires a real source. Per Mike 2026-04-18.',
    output: 'Rewrites of 9 blocks + author/source fields in schema + VOICE.md at root + Codex brief docs/briefs/2026-04-18-codex-voice.md.',
    estMin: 35,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T07:19:00-08:00',
    shippedAs: 'sprint:voice-audit · 4 blocks retired (0258, 0265, 0266, 0269), 5 rewritten (0250, 0255, 0257, 0259, 0267), 1 promoted (0270)',
  },
  {
    id: 'products-scaffold',
    title: '/products scaffold · Good Feels SEO foothold',
    why: 'Good Feels (shop.getgoodfeels.com) is the day job. PointCast already has agent-discovery trust — exposing a /products surface lets crawlers find Good Feels through us with structured Product schema.',
    output: '/products page + /products/[slug] + /products.json + schema.org Product markup + content collection + OG card. Empty on purpose at v0.',
    estMin: 50,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T08:11:00-08:00',
    shippedAs: 'sprint:products-scaffold · scaffold ships empty awaiting Mike\'s first product',
  },
  {
    id: 'home-mobile-lighten',
    title: 'Home · mobile lighten (record-scratch fix)',
    why: 'Mike checks PointCast from mobile when on the move; the dense feed grid is a record scratch. Top of page should be light + glanceable; deeper reading lives below the fold.',
    output: 'BlockCard mobile-compact mode (hide body+preview, smaller noun, → hint), home grid 16px gap on mobile, MorningBrief tap targets +20%, scrollable horizontal chip row, labels visible.',
    estMin: 30,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T09:11:00-08:00',
    shippedAs: 'sprint:home-mobile-lighten · CSS-only changes in BlockCard, index.astro, MorningBrief',
  },
  {
    id: 'codex-manus-brief-3',
    title: 'Codex + Manus brief refresh · round 3',
    why: 'Yesterday\'s briefs covered overnight work. New round covers voice-audit enforcement (Codex), the morning\'s 4 new surfaces (Codex round 4), and PC_PING_KV + PC_QUEUE_KV + PC_DROP_KV bindings (Manus round 3).',
    output: 'docs/briefs/2026-04-18-codex-voice.md (shipped in voice-audit sprint) + docs/briefs/2026-04-18-codex-round-4.md (5 review tasks on morning sprints) + docs/briefs/2026-04-18-manus-kv.md (3 KV namespace bindings).',
    estMin: 20,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T10:11:00-08:00',
    shippedAs: 'sprint:codex-manus-brief-3 · 3 atomic briefs filed under docs/briefs/',
  },
  {
    id: 'yeeplayer-2nd-title',
    title: 'YeePlayer · expand to Alan Watts / November Rain / Purple Rain',
    why: 'Mike 2026-04-19 ping (anonymous form, 00:17Z): "try purple rain or november rain youtube videos or the alan watts meditation or yah do all three". Unblocks the needs-input sprint — he named the specific seeds. Existing WATCH blocks 0262/0263/0264 just need beats arrays added to qualify for /yee/{id}.',
    output: 'Beat arrays added to blocks 0262 (Alan Watts, 12 meditation cues), 0263 (November Rain, 14 section markers), 0264 (Purple Rain, 8 section markers). External.url on each updated to /yee/{id}. /yee catalog auto-lists all 4 titles (was 1).',
    estMin: 45,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T18:11:00-08:00',
    shippedAs: 'sprint:yeeplayer-2nd-title · 3 titles shipped (not just one) via ping-seeded cron tick — Mike-directive beat the queued PICK priority',
  },
  {
    id: 'good-feels-product-block',
    title: 'First Good-Feels product block',
    why: 'Once /products is up, the first product entry — say, the headline product from shop.getgoodfeels.com — proves the SEO scaffold works end-to-end.',
    output: 'src/content/products/{slug}.json + featured on /products + linked from a new MINT-or-LINK block.',
    estMin: 25,
    status: 'needs-input',
    needs: 'Mike picks the first product (image, blurb, link).',
    owner: 'cc',
  },
  {
    id: 'sprint-recap-page',
    title: '/sprints · the recap log',
    why: 'docs/sprints/{date}-{slug}.md files accumulate after each cron tick. A page reading them in chronological order = transparent record of every autonomous sprint.',
    output: '/sprints page + /sprints.json + src/lib/sprint-recap.ts (frontmatter parser + section extractor) + OG card. Reads docs/sprints/*.md at build time.',
    estMin: 25,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T11:11:00-08:00',
    shippedAs: 'sprint:sprint-recap-page · /sprints page renders 5+ recap files chronologically',
  },
  {
    id: 'check-in-primitive',
    title: 'CHECK-IN block type · Foursquare-flavored v1',
    why: 'Per docs/inspirations/foursquare.md, the check-in primitive is the highest-leverage Foursquare pattern to port. Maps onto /beacon venues, earns DRUM, opens the door to tips + mayorship + lists.',
    output: 'CHECK-IN added to BLOCKS.md type enum + /check-in micro-form + per-venue page at /v/{slug} + DRUM 1-token-per-first-daily-check-in.',
    estMin: 60,
    status: 'needs-input',
    needs: 'Mike review on extending BLOCKS.md type enum from 8 to 9 types — schema-breaking change. DAO PC-0006 candidate.',
    owner: 'cc',
  },
  {
    id: 'llms-full-refresh',
    title: '/llms-full.txt refresh · v3 surfaces + autonomous loop section',
    why: 'llms-full.txt was last updated before /mesh, /yee, /dao, /yield, /publish, /beacon, /ai-stack, /collabs, /ping, /sprint, /sprints, /drop, /products shipped. LLMs reading the long-form surface need the new endpoints + the VOICE rule + the autonomous-loop pattern documented.',
    output: 'Quick index expanded with v3 surfaces section + Voice attribution section + Autonomous loop section. ~40 new lines. No schema or build pipeline change.',
    estMin: 12,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T12:11:00-08:00',
    shippedAs: 'sprint:llms-full-refresh · cron-tick substitute when check-in-primitive needed Mike review',
  },
  {
    id: 'for-agents-page-refresh',
    title: '/for-agents · sweep for v3 surface coverage',
    why: '/for-agents is the human-readable agent manifest. It needs the v3 surfaces (sprint, sprints, drop, products, collabs, ping, mesh, yee) called out alongside the existing list. Some are already in; double-check coverage + ordering.',
    output: 'Added 4 new endpoint bullets (/sprint, /sprints, /drop, /products) + Autonomous Loop section with 5-step explainer + safety-rail callout + CronCreate session-only note. CSS for section__steps.',
    estMin: 15,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T14:11:00-08:00',
    shippedAs: 'sprint:for-agents-page-refresh · 4 endpoint bullets + autonomous-loop section + 5-step explainer',
  },
  {
    id: 'subscribe-page-refresh',
    title: '/subscribe · cover new feed surfaces',
    why: '/subscribe lists how readers can follow PointCast. It predates /sprints.json, /collabs.json, /sprint.json, /products.json. Adding these (where applicable) and clarifying which are RSS-friendly vs. JSON-only keeps the page accurate.',
    output: 'Added 6 new entries to the agent-feeds dl (LIVE STATE, WORK LOG, TEAM, SHOP, CONTROL, INBOX) + a three-tier footer note clarifying who each surface is for. CSS for footer.',
    estMin: 12,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T15:11:00-08:00',
    shippedAs: 'sprint:subscribe-page-refresh · agent-feeds dl expanded from 4 to 10 entries',
  },
  {
    id: 'block-author-backfill',
    title: 'Backfill explicit author=cc on legacy blocks',
    why: 'Schema default is author=cc, so legacy blocks already pass the VOICE.md grep. But explicit beats implicit: when Codex runs R4-1, an explicit author field per file is easier to audit and signal that the block was intentionally cc-written, not just "default".',
    output: '79 of 90 block files patched with explicit `"author": "cc"` inserted at canonical position (between visitor and meta). 11 already had explicit author. Stable field order via Node script. Build validates clean.',
    estMin: 20,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T16:11:00-08:00',
    shippedAs: 'sprint:block-author-backfill · 79 blocks patched, 11 skipped, schema validates',
  },
  {
    id: 'fresh-top-strip',
    title: 'Home · "fresh on each visit" strip above the feed',
    why: 'Per Mike 2026-04-18 (block 0272 directive, captured via /ping screenshot): "almost want to visit and see fresh stuffs at the top". A small randomized strip above the main feed gives repeat visitors a different impression each time without restructuring the underlying feed.',
    output: 'FreshDeck component shipped — clones 3 random .block-card elements from the grid below into a horizontal strip above the channels nav. Pure client JS via cloneNode (no extra fetch, no SSR jitter). Mobile stacks single-column. Green accent border to distinguish from the feed.',
    estMin: 25,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T17:11:00-08:00',
    shippedAs: 'sprint:fresh-top-strip · clone-3-random-from-grid pattern; Mike picked via /sprint after KV binding landed',
  },
  {
    id: 'emoji-reactions',
    title: 'Emoji reactions on blocks · per Mike 0272',
    why: 'Per Mike 0272: "emoji interactions". A tiny per-block reaction strip — :heart: :fire: :wave: counts that anyone can tap. Aggregates via PC_REACTIONS_KV (already exists per functions/api/reactions.ts hint).',
    output: 'ReactionStrip component on /b/{id} pages + on home grid as opt-in. POST counts via /api/reactions, KV-backed. No identity required for reads; address-keyed for writes (so duplicates can be suppressed).',
    estMin: 40,
    status: 'ready',
    owner: 'cc',
  },
  {
    id: 'shelling-point-poll',
    title: 'Shelling-point polls · per Mike 0272',
    why: 'Per Mike 0272: "shelling points". Schelling-point coordination polls — a question with 3-7 fixed options where the WIN condition is "guess the most popular answer", not "guess the right answer". Reveals collective focal points. Coordination game over content.',
    output: 'polls collection (src/content.config.ts) + PC_POLLS_KV (created + bound) + /api/poll (POST vote, GET tally, per-address dedup, anonymous fingerprint dedup) + /polls catalog + /poll/[slug] page (live distribution bars, leader highlight, localStorage vote-stick) + seed poll "el-segundo-meeting-spot" + OG card.',
    estMin: 50,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T17:30:00-08:00',
    shippedAs: 'sprint:shelling-point-poll · Mike-PICKED via /sprint, shipped chat-tick after fresh-top-strip',
  },
  {
    id: 'topic-expand-publish',
    title: '/ping "topic — expand and publish" toggle · per Mike 2026-04-18',
    why: 'Mike 2026-04-18 chat (after kv-binding + shelling-point-poll shipped): "for one of the new feature, yah, it\'d be interesting i could send you a note or topic and you expand on it and publish". An async editorial pipeline — Mike seeds a topic, cc drafts a block in cc-voice editorial, ships on next cron tick.',
    output: '/ping form gains an `expand` checkbox; /api/ping payload gains the boolean field; cc-side processing rule documented in AGENTS.md (Reads on every session). One ping → one block, author=\'mh+cc\' or \'cc\' depending on substance, source pointing to ping key. Demonstrated end-to-end via Block 0273 (cc-voice editorial expansion of this very directive).',
    estMin: 30,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T17:55:00-08:00',
    shippedAs: 'sprint:topic-expand-publish · chat-tick from Mike directive, demo Block 0273 ships in same deploy',
  },
  {
    id: 'more-polls-v1',
    title: 'Polls v1.5 · seed 5 more polls + live tally hints on catalog',
    why: 'Per Mike 2026-04-18 chat: "the polls thing is super interesting, lots of polls, data collection visualization, etc". A single seeded poll under-represents the primitive. Adding 5 more across categories (chakra, channel-onboarding, sunset spot, next-sprint, weekday-pickleball) gives the catalog texture + lets cross-poll behavior emerge.',
    output: '5 new polls in src/content/polls/. Catalog cards gain per-card live tally fetch (total + leader option + leader percentage) via client-side /api/poll?slug=… GET. CSS for the new top + bottom card rows.',
    estMin: 25,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T18:05:00-08:00',
    shippedAs: 'sprint:more-polls-v1 · 6 polls live, catalog shows live tallies per card',
  },
  {
    id: 'polls-philosophy-and-viz-v1',
    title: 'Polls philosophy · purpose field + outcomeAction + aggregate viz strip',
    why: 'Per Mike 2026-04-18 chat: "best baseball town does that go in a bad direction, tho something there on local, information gathering". Codify the line as schema (purpose enum + outcomeAction sentence) + a philosophy callout on /polls + visible purpose chips per card so the rule is visible, not buried in docs. Plus a v1 aggregate viz strip — total polls / total votes / most-active / purpose-mix bar.',
    output: 'polls schema gains `purpose: coordination|utility|editorial|decision` + optional `outcomeAction` (≤280 char). 6 existing polls retroactively tagged. /polls page: aggregate viz strip at top (4 metrics + purpose distribution bar segmented by hex color), philosophy `<details>` callout, purpose chip on each card, outcomeAction shown inline as a "OUTCOME ·" callout block.',
    estMin: 30,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T18:15:00-08:00',
    shippedAs: 'sprint:polls-philosophy-and-viz-v1 · structural rule + visible enforcement + first viz primitive',
  },
  {
    id: 'drum-visual-refresh',
    title: 'A · /drum visual refresh',
    why: 'Option A in the /poll/drum-rebuild-direction vote. Default ship per Block 0274 commitment: "if no votes within 24h, cc defaults to Option A." Keep every mechanic exactly as-is; tighten layout for mobile, bigger tap targets, cleaner HUD.',
    output: 'CSS-only refresh of /drum. 44×44 iOS tap-target floor on mobile. Stronger press feedback via drop-shadow pulse on tap. Mid-width wrap fix so drum 4/5 don\'t squeeze. Desktop hover ring on badges. Preserves 5-drum rack, counters, presence, audio entirely.',
    estMin: 40,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T22:11:00-08:00',
    shippedAs: 'sprint:drum-visual-refresh · CSS-only, Option A default ship after poll empty at 24h window',
  },
  {
    id: 'drum-gameify',
    title: 'B · /drum game-ify',
    why: 'Option B in the /poll/drum-rebuild-direction vote. YeePlayer-style beat track on top of cookie-clicker mode.',
    output: 'New rhythm-mode toggle on /drum. 8-bar beat patterns via YeePlayer-compatible JSON. Best-run persistence per pattern.',
    estMin: 75,
    status: 'needs-input',
    needs: 'Leader of /poll/drum-rebuild-direction, OR Mike /ping "go with B".',
    owner: 'cc',
  },
  {
    id: 'drum-room-jam',
    title: 'C · /drum room / jam mode',
    why: 'Option C in the /poll/drum-rebuild-direction vote. Multiplayer drum room with cursors + combined pattern.',
    output: 'WebSocket sync via Presence DO. Cursor overlay. Combined-audio mix. Latency handling.',
    estMin: 120,
    status: 'needs-input',
    needs: 'Leader of /poll/drum-rebuild-direction AND Mike sign-off on the DO deploy path. OR /ping "go with C".',
    owner: 'cc',
  },
  {
    id: 'drum-token-wiring',
    title: 'D · /drum Claim DRUM button',
    why: 'Option D in the /poll/drum-rebuild-direction vote. Wire the stubbed Claim DRUM button to the FA1.2 contract.',
    output: 'Wallet-sign claim flow. Server-signed vouchers. Contract call. Balance display.',
    estMin: 60,
    status: 'needs-input',
    needs: 'DRUM FA1.2 contract originated on ghostnet (and then mainnet). Blocked on Mike\'s SmartPy compile.',
    owner: 'cc',
  },
  {
    id: 'companions-field',
    title: 'Block schema · companions cross-link field',
    why: 'Per Mike 2026-04-18 Q2 #1: "Also playable on /yee cross-link chip on 0275". Generalized as a reusable schema field so any block can link to siblings on other surfaces (yee, poll, external, block).',
    output: 'block schema gains optional `companions: Array<{id, label, surface?}>` (max 8). /b/[id].astro renders a COMPANIONS · ALSO PLAYABLE / RELATED strip when present, with surface-colored chip per entry. Block 0275 gets 4 yee companions (0263, 0264, 0262, 0236).',
    estMin: 25,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T22:11:00-08:00',
    shippedAs: 'sprint:companions-field · schema + render + 0275 tagging',
  },
  {
    id: 'es-name-drops',
    title: 'ES-local seed · /poll/es-name-drops + Block 0276',
    why: 'Mike chat 2026-04-18 ~10pm: "lets make pointcast special...el segundo brewing, recreation park, pickleball league, standard station, big mikes, vinnys, gingers". Turns his verbatim list into a Schelling poll + an ES editorial block that frames the institutions as PointCast\'s recurring vocabulary.',
    output: 'Block 0276 (mh+cc, CH.ESC, explicit source citing chat) + /poll/es-name-drops (editorial, 6 options from Mike\'s list, outcomeAction = leader earns dedicated visit block + /local index candidacy).',
    estMin: 15,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T22:11:00-08:00',
    shippedAs: 'sprint:es-name-drops · ship #2 of "make pointcast special" directive',
  },
  {
    id: 'polls-on-home',
    title: 'Polls visible on home · "yah polls on the home page"',
    why: 'Mike 2026-04-18 via /sprint custom directive: "yah polls on the home page". The /polls catalog lives at the footer link — making the top-3 most-recent polls visible on home surfaces the Schelling primitive without requiring a detour to /polls.',
    output: 'PollsOnHome component: purple-bordered strip above FreshDeck, renders 3 most-recent non-draft polls as compact cards (purpose chip + question + live leader tally via /api/poll fetch + VOTE CTA). Mobile stacks single-column. Tap a card to jump to /poll/{slug}.',
    estMin: 20,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T19:11:00-08:00',
    shippedAs: 'sprint:polls-on-home · cron-fired from Mike /sprint custom directive',
  },
  {
    id: 'feedback-block-strip',
    title: 'Per-block lightweight feedback strip · per Mike 0272',
    why: 'Per Mike 0272: "feedback". Beyond emoji reactions — a single-tap "this resonated" + "this missed" + a tiny optional comment box. Less commitment than /ping (no message required). Aggregate visible to Mike + cc.',
    output: 'FeedbackStrip.astro with 3 buttons (RESONATED/CONFUSED/MISSED) + optional 280-char one-liner, rendered on every /b/{id} page between navigation and agent-strip. POSTs to existing /api/feedback (extended to accept blockId). Counts stay private — Mike sees via /admin/feedback. localStorage dedup per browser per block.',
    estMin: 30,
    status: 'done',
    owner: 'cc',
    shippedAt: '2026-04-18T20:11:00-08:00',
    shippedAs: 'sprint:feedback-block-strip · cron-fired, extends existing feedback endpoint',
  },
  {
    id: 'tips-on-venues',
    title: 'TIP type · short notes pinned to a place',
    why: 'Foursquare\'s second-most-loved feature. Cleaner than NOTE because it has a structural venue ref. Lights up /beacon and per-venue pages instantly.',
    output: 'TIP block type + author-attributed UI + venue rendering on /beacon.',
    estMin: 35,
    status: 'needs-input',
    needs: 'Approval to extend BLOCKS.md type enum (currently 8 types). DAO PC-0006 candidate.',
    owner: 'cc',
  },
];

/** First ready, non-blocked sprint — what cc picks if no directive is queued. */
export function nextDefaultSprint(): Sprint | null {
  return SPRINT_BACKLOG.find((s) => s.status === 'ready') ?? null;
}

/** Lookup by id. */
export function findSprint(id: string): Sprint | null {
  return SPRINT_BACKLOG.find((s) => s.id === id) ?? null;
}

/** Count helper for the page header. */
export function counts() {
  const c = { ready: 0, 'needs-input': 0, 'in-progress': 0, done: 0 };
  for (const s of SPRINT_BACKLOG) c[s.status] += 1;
  return c;
}
