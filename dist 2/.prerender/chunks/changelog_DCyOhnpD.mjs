import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Changelog = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Changelog;
  const RELEASES = [
    {
      version: "v2.2.1",
      date: "2026-04-20",
      title: "STATIONS mode on /tv · first full Codex feature delivery",
      summary: "Codex shipped the STATIONS brief end-to-end in ~2h 30m from kickoff. Cross-platform geo-channel mode on /tv with 15 bookmarkable per-station routes, keyboard-driven channel-surf UX (1-9 + Q-Y), edge-cached weather proxy for each station via Open-Meteo. +1546 lines / -328 across 8 files. First Codex feature after a workspace-path fix earlier that evening.",
      highlights: [
        "/tv STATIONS mode — 3 states (global / stations-index / station-feed), numeric + Q-Y keyboard shortcuts, channel-surf metaphor",
        "/tv/{station} — 15 per-station routes (manhattan-beach, hermosa, redondo-beach, venice, santa-monica, palos-verdes, long-beach, los-angeles, malibu, pasadena, anaheim-oc, newport-laguna, santa-barbara, north-san-diego, palm-springs)",
        "/api/weather — edge-cached Open-Meteo proxy with `caches.default` (10-min TTL), station-aware via ?station={slug} or ?lat=&lng=",
        "src/lib/local.ts enriched — coords per station, slug field, STATION_SHORTCUTS keyboard map, STATION_MATCH_TERMS location-matching, new helpers (getStationBySlug, getStationPath, filterBlocksForStation)",
        "/local page updated — cast this station → links per station with block counts",
        "/local.json mirror updated — station objects now include coords + URL",
        "/for-agents manifest — STATIONS endpoints documented",
        "Architecture doc at docs/reviews/2026-04-19-codex-tv-stations-architecture.md (A1-A5 answered in detail)",
        "Author: `codex` throughout per VOICE.md"
      ],
      links: [
        { label: "STATIONS brief", href: "https://github.com/mhoydich/pointcast/blob/main/docs/briefs/2026-04-19-codex-tv-stations.md" },
        { label: "Architecture doc", href: "https://github.com/mhoydich/pointcast/blob/main/docs/reviews/2026-04-19-codex-tv-stations-architecture.md" },
        { label: "Live: /tv/malibu", href: "/tv/malibu" },
        { label: "Weather API sample", href: "/api/weather?station=malibu" }
      ]
    },
    {
      version: "v2.2",
      date: "2026-04-19",
      title: "Identity + broadcast + daily ritual — big Sunday",
      summary: "36 shipments in a single ~22-hour session. Six coherent arcs: mood primitive (schema + atlas + filters + 7th-chip), broadcast mode (/tv with live polls + daily slide + presence constellation), daily ritual (/today + /today.json + FreshStrip routing), 100-mile lens (/local + /local.json + lib/local), identity (/profile dashboard + VisitorHereStrip + TELL panel + visitor.ts), and five substantive Codex briefs filed (Pulse, STATIONS, YeePlayer v1, TrackLab, VideoLens). First Codex artifact shipped 22:20 PT — STATIONS architecture doc via computer-use-assisted workspace correction.",
      highlights: [
        "Mood primitive — schema.mood + /mood/{slug} filter pages + /moods tonal atlas + /moods.json machine mirror",
        "/today + /today.json — daily drop deterministic pick (daySeed algorithm), past-7-days preview, client-side collect",
        "/tv broadcast mode — landscape ambient feed, auto-scroll, live poll slides, daily drop slide, presence constellation (10-dot row, staggered pulse), 28-slide rotation",
        "/local + /local.json — 100-mile lens, 15 stations, ES name-drops from Block 0276, SoCal-token in-range filter, Schema.org GeoCircle",
        "/profile dashboard — identity card (noun avatar + display name + first-seen), current state panel, activity grid (HELLO / drops / votes / voter level), activity detail lists (votes + drops with deep-links)",
        "VisitorHereStrip — noun-per-visitor (deterministic from session hash, 0-1199), 11 ghost slots lighting up via presence WS, TELL panel (mood + now-playing + location + 📡 geolocation)",
        "FreshStrip — HELLO / N NEW / CAUGHT UP badges + time-sensitive routing (CAUGHT UP → /today if drop unclaimed)",
        "MorningPara — editorial-paragraph brief (replaces MorningBrief chip row), time-of-day-aware greeting, weather + sports inline prose",
        "Five Codex briefs filed 17:20-18:15 — Pulse mini-game, STATIONS /tv mode, YeePlayer v1 multiplayer, TrackLab YouTube→beats, VideoLens analysis",
        "TodayStrip experiment (shipped + removed) — 7 daily-rotating chips (mood / block / station / name-drop / channel / noun / term)",
        "VoterStats experiment (shipped + removed) — progression UI, moved below-fold per Mike feedback",
        "/for-agents + /agents.json refresh — all 10 new endpoints surfaced + presence WS + /mood + /yee URL patterns",
        "blocks.json + /b/{id}.json enrich — author, source, mood, moodUrl, companions fields surfaced for agents",
        "Email setup playbook — docs/setup/email-pointcast.md for Manus ops to execute",
        "4 fresh polls — codex-project-first, sunday-es-move, april-register, sunday-soundtrack",
        "Release sprint plan — docs/plans/2026-04-20-release-sprint.md (5 phases, 7 days, public launch target 04-24)",
        "GTM first draft — docs/gtm/2026-04-19-draft.md (positioning, audience, 5 wedges, 7-day launch cadence)",
        "Codex workspace-path diagnosis via computer-use — first Codex artifact shipped (STATIONS architecture doc)",
        "35+ sprint retros authored in docs/sprints/"
      ],
      links: [
        { label: "Release sprint plan", href: "https://github.com/mhoydich/pointcast/blob/main/docs/plans/2026-04-20-release-sprint.md" },
        { label: "GTM draft", href: "https://github.com/mhoydich/pointcast/blob/main/docs/gtm/2026-04-19-draft.md" },
        { label: "Day-recap block 0320", href: "/b/0320" },
        { label: "Sprint announcement 0321", href: "/b/0321" }
      ]
    },
    {
      version: "v2.1",
      date: "2026-04-17",
      title: "Majors on home + canonical manifesto + cadence viz",
      summary: "A dense evening run. Card of the Day rotation, /now, /search, /archive, /editions, /timeline, /stack, /manifesto, /glossary, /agents.json, unified feeds, home majors strip, stronger per-type variants, scroll rhythm via :nth-child, 10 new blocks.",
      highlights: [
        "/manifesto — canonical Q&A + DefinedTerm schema for LLM citation",
        "/glossary — consolidated dictionary of PointCast-specific terms",
        "/agents.json — discovery manifest (aliased at .well-known/agents.json)",
        "/llms.txt rewritten + /llms-full.txt added",
        "/now + /now.json — live system snapshot",
        "/search — client-side block search",
        "/archive + /archive.json — chronological index with filters",
        "/editions + /editions.json — mintable dashboard",
        "/timeline + /timeline.json — publication cadence viz",
        "/stack + /stack.json — technical disclosure",
        "/feed.xml + /feed.json — unified feeds",
        "HomeMajors on home — inline /drum tap + /cast countdown",
        "Presence pill upgrade — YOU + others count",
        "Per-type visual variants + scroll rhythm",
        "Card of the Day — deterministic 21-Noun rotation",
        "BreadcrumbList + ItemList schema on /b, /c, /archive",
        "Astro 6.1.6 → 6.1.7"
      ],
      links: [
        { label: "Traffic strategy", href: "/docs/plans/2026-04-17-traffic-strategy.md" },
        { label: "Codex brief", href: "/docs/briefs/2026-04-17-codex-geo-review.md" },
        { label: "Manus brief", href: "/docs/briefs/2026-04-17-manus-traffic-ops.md" }
      ]
    },
    {
      version: "v2.0",
      date: "2026-04-17",
      title: "Mainnet live — Visit Nouns FA2 + 10 starter mints",
      summary: "The site crosses from demo to real. FA2 originated on Tezos mainnet, 10 starter Nouns minted, metadata endpoint live, /collection page renders from TzKT.",
      highlights: [
        "Visit Nouns FA2 originated at KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh",
        "10 starter Nouns minted (seeds 1, 42, 99, 137, 205, 417, 420, 777, 808, 1111)",
        "set_metadata_base_cid on-chain — future mints have working URIs",
        "/api/tezos-metadata/[tokenId] serves TZIP-21 JSON per token",
        "/collection/visit-nouns gallery page (live TzKT state)",
        "Multi-wallet WalletChip + /profile page + DrumLayout",
        "Stripped-HTML agent mode middleware (functions/_middleware.ts)",
        "Nouns Battler Phase 2 — match log, export as JSON, /battle.json",
        "/cast frontend (Bloomberg-terminal treatment for Prize Cast)"
      ]
    },
    {
      version: "v2.0-rebuild",
      date: "2026-04-17",
      title: "Blocks primitive rebuild",
      summary: "Total rewrite from v1 to a Block-first architecture. Every piece of content becomes a typed JSON entity. 8 channels, 8 types, stable monotonic IDs, auto-fit dense grid.",
      highlights: [
        "Block schema + content collection, channels.ts, block-types.ts",
        "BlockCard with all 8 type treatments + 5 size variants",
        "BlockLayout (v2) — self-hosted Inter + JetBrains Mono, 2 weights only",
        "Home auto-fit dense grid, sticky mobile chip bar",
        "/b/[id] permalinks with JSON-LD + machine-readable endpoints",
        "/c/[channel] + RSS + JSON Feed per channel",
        "/blocks.json + /sitemap-blocks.xml full archive",
        "Drag-and-drop reorder (client-side localStorage)",
        "BLOCKS.md schema documentation at repo root",
        "9th channel (BTL · Battler) added — the 21-Noun deterministic duel"
      ],
      links: [
        { label: "BLOCKS.md (spec)", href: "https://github.com/mhoydich/pointcast/blob/main/BLOCKS.md" }
      ]
    },
    {
      version: "v1.x",
      date: "2025-01-14 → 2026-04-16",
      title: "Original PointCast — dispatches + Tezos imports",
      summary: "Pre-Blocks era. Individual dispatch pages, drum module, Tezos NFT imports from Mike's editorial FA2. Preserved at commit 7fea01c for rollback.",
      highlights: [
        "Drum room (cookie-clicker percussion)",
        "Spotify currently-spinning integration",
        "/collect editorial FA2 inventory from objkt",
        "Seeing the Future dispatch series",
        "Feedback block + admin deploy UI",
        "Noun Bells instrument + chime synth"
      ]
    }
  ];
  const currentVersion = RELEASES[0].version;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": "https://pointcast.xyz/changelog",
    name: "PointCast · changelog",
    description: `Version history for PointCast. Current: ${currentVersion}.`,
    url: "https://pointcast.xyz/changelog"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Changelog", "description": `PointCast version history. Current: ${currentVersion}. Hand-curated narrative; raw commits live at github.com/mhoydich/pointcast.`, "image": "/images/og/changelog.png", "jsonLd": jsonLd, "data-astro-cid-bd6alw26": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-bd6alw26> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-bd6alw26> <a href="/" data-astro-cid-bd6alw26>Home</a> <span aria-hidden="true" data-astro-cid-bd6alw26>›</span> <span data-astro-cid-bd6alw26>changelog</span> </nav> <header class="hero" data-astro-cid-bd6alw26> <p class="kicker" data-astro-cid-bd6alw26>CHANGELOG · CURRENT ${currentVersion.toUpperCase()}</p> <h1 class="display" data-astro-cid-bd6alw26>How we got here.</h1> <p class="dek" data-astro-cid-bd6alw26>
Hand-curated version history. Each release is a stretch of work that
        landed with a theme. The raw commit firehose is at
<a href="https://github.com/mhoydich/pointcast/commits/main" target="_blank" rel="noopener" data-astro-cid-bd6alw26>github.com/mhoydich/pointcast/commits/main</a>.
</p> </header> <ol class="releases" data-astro-cid-bd6alw26> ${RELEASES.map((r) => renderTemplate`<li class="release"${addAttribute(r.version.replace(/\./g, "-"), "id")} data-astro-cid-bd6alw26> <header class="release__head" data-astro-cid-bd6alw26> <span class="release__version mono" data-astro-cid-bd6alw26>${r.version}</span> <time class="release__date mono" data-astro-cid-bd6alw26>${r.date}</time> </header> <h2 class="release__title" data-astro-cid-bd6alw26>${r.title}</h2> <p class="release__summary" data-astro-cid-bd6alw26>${r.summary}</p> ${r.highlights.length > 0 && renderTemplate`<ul class="release__list" data-astro-cid-bd6alw26> ${r.highlights.map((h) => renderTemplate`<li data-astro-cid-bd6alw26>${h}</li>`)} </ul>`} ${r.links && r.links.length > 0 && renderTemplate`<ul class="release__links" data-astro-cid-bd6alw26> ${r.links.map((l) => renderTemplate`<li data-astro-cid-bd6alw26><a${addAttribute(l.href, "href")} data-astro-cid-bd6alw26>${l.label} →</a></li>`)} </ul>`} </li>`)} </ol> <aside class="surfaces" data-astro-cid-bd6alw26> <p class="kicker" data-astro-cid-bd6alw26>VERSION PINS</p> <ul class="surfaces__list" data-astro-cid-bd6alw26> <li data-astro-cid-bd6alw26><a href="/manifesto" data-astro-cid-bd6alw26><span class="mono" data-astro-cid-bd6alw26>CANON</span> /manifesto</a></li> <li data-astro-cid-bd6alw26><a href="/stack" data-astro-cid-bd6alw26><span class="mono" data-astro-cid-bd6alw26>STACK</span> /stack</a></li> <li data-astro-cid-bd6alw26><a href="/for-agents" data-astro-cid-bd6alw26><span class="mono" data-astro-cid-bd6alw26>AGENTS</span> /for-agents</a></li> <li data-astro-cid-bd6alw26><a href="/glossary" data-astro-cid-bd6alw26><span class="mono" data-astro-cid-bd6alw26>TERMS</span> /glossary</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/changelog.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/changelog.astro";
const $$url = "/changelog";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Changelog,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
