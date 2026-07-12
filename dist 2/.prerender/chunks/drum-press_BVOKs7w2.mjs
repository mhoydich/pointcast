import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';
import { $ as $$RoomPresenceChip } from './RoomPresenceChip_Dur7KbDI.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$DrumPress = createComponent(async ($$result, $$props, $$slots) => {
  const title = "DRUM PRESS — catalog of drum media";
  const description = "A small, slightly self-aware publishing house that puts out 47 editions of collaborative drumming. Catalog organized by imprint: voices, instruments, arcade, communiqués, broadcast, machine, editions. Pressed nightly on Cloudflare Pages.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/drum-press",
    name: "DRUM PRESS · Catalog of Drum Media",
    url: "https://pointcast.xyz/drum-press",
    description,
    publisher: {
      "@type": "Organization",
      name: "PointCast",
      url: "https://pointcast.xyz"
    }
  };
  const imprints = [
    {
      code: "FIRST",
      name: "The First Press",
      blurb: "Where it began. A single button, played in one tab, heard from another.",
      titles: [
        { cat: "DR-001", href: "/drum", name: "classic", sub: "the original drum", era: "mar 2026", format: "cookie-clicker" }
      ]
    },
    {
      code: "VOX",
      name: "Voices",
      blurb: "Ensembles. Multi-player rooms where the sound is the sum of who is in the tab.",
      titles: [
        { cat: "DR-V02", href: "/drum-v2", name: "collab", sub: "pentatonic voice + leaderboard", era: "mar 2026", format: "live · token-priced" },
        { cat: "DR-V03", href: "/drum-v3", name: "spotify", sub: "drum along to a track", era: "mar 2026", format: "live · spotify-synced" },
        { cat: "DR-V04", href: "/drum-v4", name: "orchestra", sub: "strings + winds + the lot", era: "apr 2026", format: "live ensemble" },
        { cat: "DR-V05", href: "/drum-v5", name: "loops", sub: "sixteen looping bars", era: "apr 2026", format: "looper" },
        { cat: "DR-V06", href: "/drum-v6", name: "choir", sub: "chord-summoning room", era: "apr 2026", format: "live chorale" },
        { cat: "DR-V07", href: "/drum-v7", name: "big", sub: "thirty pads, one room", era: "apr 2026", format: "30-pad" },
        { cat: "DR-V08", href: "/drum-v8", name: "symphony", sub: "forty-two pads, full kit", era: "apr 2026", format: "42-pad" }
      ]
    },
    {
      code: "INST",
      name: "Instruments",
      blurb: "Solo voices. One instrument per pressing. Same hub, different timbre.",
      titles: [
        { cat: "DR-V09", href: "/drum-v9", name: "lounge", sub: "sax · after-hours", era: "apr 2026", format: "one-instrument" },
        { cat: "DR-V10", href: "/drum-v10", name: "theremin", sub: "gesture · contactless", era: "apr 2026", format: "one-instrument" },
        { cat: "DR-V11", href: "/drum-v11", name: "bells", sub: "chimes · a quiet room", era: "apr 2026", format: "one-instrument" },
        { cat: "DR-V12", href: "/drum-v12", name: "organ", sub: "pipes · a loud room", era: "apr 2026", format: "one-instrument" },
        { cat: "DR-V13", href: "/drum-v13", name: "strings", sub: "pizz / arco", era: "apr 2026", format: "one-instrument" },
        { cat: "DR-V14", href: "/drum-v14", name: "marimba", sub: "mallets · wood + metal", era: "apr 2026", format: "one-instrument" },
        { cat: "DR-V15", href: "/drum-v15", name: "hang", sub: "handpan · steel skin", era: "apr 2026", format: "one-instrument" },
        { cat: "DR-V16", href: "/drum-v16", name: "808", sub: "machine · the grid", era: "apr 2026", format: "one-instrument" },
        { cat: "DR-V17", href: "/drum-v17", name: "harp", sub: "gliss · falling water", era: "apr 2026", format: "one-instrument" },
        { cat: "DR-V18", href: "/drum-v18", name: "rhodes", sub: "electric piano · velvet", era: "apr 2026", format: "one-instrument" }
      ]
    },
    {
      code: "ARC",
      name: "Arcade",
      blurb: "Games. Limited-edition rounds with rules; a beat counts as a play.",
      titles: [
        { cat: "DR-ARC1", href: "/drum-potato", name: "potato", sub: "hot potato · do not hold", era: "apr 2026", format: "round-based" },
        { cat: "DR-ARC2", href: "/drum-tv-bingo", name: "bingo", sub: "tv game · 5 in a row", era: "apr 2026", format: "cast-game" },
        { cat: "DR-ARC3", href: "/drum-tv-gauntlet", name: "gauntlet", sub: "tv 60-second race", era: "apr 2026", format: "cast-game" },
        { cat: "DR-ARC4", href: "/drum-tv-roulette", name: "roulette", sub: "tv wheel · spin to play", era: "apr 2026", format: "cast-game" }
      ]
    },
    {
      code: "COMM",
      name: "Communiqués",
      blurb: "Words instead of beats. Walls, mics, soft confessions, notes for the next visitor.",
      titles: [
        { cat: "DR-COM1", href: "/drum-shout", name: "shout", sub: "mic · loud one-shots", era: "apr 2026", format: "comms" },
        { cat: "DR-COM2", href: "/drum-applause", name: "applause", sub: "meter · clap together", era: "apr 2026", format: "comms" },
        { cat: "DR-COM3", href: "/drum-letters", name: "letters", sub: "note for the next visitor", era: "apr 2026", format: "comms" },
        { cat: "DR-COM4", href: "/drum-bulletin", name: "bulletin", sub: "pinboard · pinned by anyone", era: "apr 2026", format: "comms" },
        { cat: "DR-COM5", href: "/drum-walkie", name: "walkie", sub: "ptt · 4 channels", era: "apr 2026", format: "comms" },
        { cat: "DR-COM6", href: "/drum-graffiti", name: "graffiti", sub: "wall · spray + tag", era: "apr 2026", format: "comms" },
        { cat: "DR-COM7", href: "/drum-emoji-mesh", name: "emoji mesh", sub: "storm · whole-room weather", era: "apr 2026", format: "comms" },
        { cat: "DR-COM8", href: "/drum-confessional", name: "confessional", sub: "soft · one line at a time", era: "apr 2026", format: "comms" }
      ]
    },
    {
      code: "CST",
      name: "Broadcast",
      blurb: "For the room screen. Cast surfaces that flash when anyone, anywhere on the hub, taps.",
      titles: [
        { cat: "DR-CST1", href: "/drum-tv", name: "tv", sub: "cast mode · the original", era: "apr 2026", format: "cast" },
        { cat: "DR-CST2", href: "/drum-tv-v2", name: "venue", sub: "tv v2 · stage + crowd", era: "apr 2026", format: "cast" },
        { cat: "DR-CST3", href: "/drum-viz", name: "viz", sub: "tv v3 · waveform", era: "apr 2026", format: "cast" },
        { cat: "DR-CST4", href: "/drum-marquee", name: "marquee", sub: "tv minimalist · ticker", era: "apr 2026", format: "cast" },
        { cat: "DR-CST5", href: "/drum-radio", name: "radio", sub: "96.1 fm · the rooms on air", era: "apr 2026", format: "cast" }
      ]
    },
    {
      code: "MAC",
      name: "Machine",
      blurb: "For the agents. A play floor, a hall of residents, and a machine-readable front door.",
      titles: [
        { cat: "DR-MAC1", href: "/drum-agents", name: "agents hall", sub: "directory · resident agents", era: "apr 2026", format: "machine" },
        { cat: "DR-MAC2", href: "/drum-agent", name: "agent room", sub: "play floor · type=agent", era: "apr 2026", format: "machine" },
        { cat: "DR-MAC3", href: "/api/mcp", name: "mcp", sub: "jsonrpc · 24 tools", era: "apr 2026", format: "protocol" },
        { cat: "DR-MAC4", href: "/drum-meet", name: "meet", sub: "welcome · for visiting labs", era: "apr 2026", format: "welcome" }
      ]
    },
    {
      code: "BD",
      name: "Birthday",
      blurb: "Four ways to celebrate by hitting the drum together. Customize the greeting via ?for=NAME. The URL is the gift.",
      titles: [
        { cat: "DR-BD1", href: "/drum-birthday", name: "birthday", sub: "the hub · big drum · live confetti", era: "apr 2026", format: "celebration" },
        { cat: "DR-BD2", href: "/drum-cake", name: "cake", sub: "light a candle · blow it out · wish", era: "apr 2026", format: "ritual" },
        { cat: "DR-BD3", href: "/drum-card", name: "card", sub: "the room signs together · one tap each", era: "apr 2026", format: "keepsake" },
        { cat: "DR-BD4", href: "/drum-pinata", name: "piñata", sub: "take a swing · burst at 100", era: "apr 2026", format: "burst" }
      ]
    },
    {
      code: "VS",
      name: "Versus",
      blurb: "Send a link, play 1v1 with a friend. WebRTC peer-to-peer once both phones are in. Three modes.",
      titles: [
        { cat: "DR-VS1", href: "/drum-vs", name: "tug-of-war", sub: "rope marker · first to 50", era: "apr 2026", format: "1v1 · throughput" },
        { cat: "DR-VS2", href: "/drum-vs?mode=race", name: "race", sub: "side-by-side bars · sprint", era: "apr 2026", format: "1v1 · throughput" },
        { cat: "DR-VS3", href: "/drum-vs?mode=duel", name: "reaction duel", sub: "bell rings 2-5s · first tap", era: "apr 2026", format: "1v1 · precision" }
      ]
    },
    {
      code: "ED",
      name: "Editions",
      blurb: "Daily and ritual rooms. Some reprint nightly, some are one-of-one, this catalog is one of them.",
      titles: [
        { cat: "DR-ED01", href: "/drum-daily", name: "daily", sub: "beat of the day · reprints", era: "apr 2026", format: "daily" },
        { cat: "DR-ED02", href: "/drum-jam", name: "jam", sub: "three or more · live session", era: "apr 2026", format: "live" },
        { cat: "DR-ED03", href: "/drum-pulse", name: "pulse", sub: "heartbeat · whole-room", era: "apr 2026", format: "ritual" },
        { cat: "DR-ED04", href: "/drum-apr26", name: "sequencer", sub: "apr 26 · 8-pad sequencer", era: "apr 2026", format: "one-off" },
        { cat: "DR-ED05", href: "/drum-stickers", name: "stickers", sub: "binder · paste a sticker", era: "apr 2026", format: "collectible" },
        { cat: "DR-ED06", href: "/drum-postcard", name: "postcard", sub: "receipt of your visit", era: "apr 2026", format: "keepsake" },
        { cat: "DR-ED07", href: "/drum-buttons", name: "buttons", sub: "one-shots · the panel", era: "apr 2026", format: "control" },
        { cat: "DR-ED08", href: "/drum-trophies", name: "trophies", sub: "on-chain · tezos editions", era: "apr 2026", format: "on-chain" },
        { cat: "DR-ED09", href: "/drum-press", name: "press", sub: "this catalog · self-ref", era: "apr 2026", format: "reference" }
      ]
    }
  ];
  const totalTitles = imprints.reduce((n, i) => n + i.titles.length, 0);
  const totalImprints = imprints.length;
  const today = /* @__PURE__ */ new Date();
  const issueNo = Math.floor((today.getTime() - new Date(2026, 2, 1).getTime()) / 864e5) + 1;
  const volNo = 1;
  return renderTemplate(_a || (_a = __template(["", " <script>\n  // ── Now-in-print live wire ─────────────────────────────────────\n  // Polls /api/visit for room counts and /api/sounds for the event\n  // tail. Same bus the cast surfaces use. Two-second cadence is\n  // gentle; this page is browseable, not stadium-loud.\n  (function () {\n    const countEl = document.getElementById('dp-count');\n    const tailEl = document.getElementById('dp-tail');\n\n    async function tickCount() {\n      try {\n        const r = await fetch('/api/visit', { cache: 'no-store' });\n        const j = await r.json().catch(() => null);\n        if (!j) return;\n        const n = (j.activeCount ?? j.count ?? j.active ?? '—');\n        if (countEl) countEl.textContent = String(n);\n      } catch (_) { /* silent */ }\n    }\n\n    let lastSince = Date.now() - 30_000;\n    async function tickTail() {\n      try {\n        const r = await fetch(`/api/sounds?since=${lastSince}`, { cache: 'no-store' });\n        const j = await r.json().catch(() => null);\n        if (!j || !Array.isArray(j.events)) return;\n        if (j.events.length === 0) return;\n        lastSince = j.now ?? Date.now();\n        const e = j.events[j.events.length - 1];\n        const t = new Date(e.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });\n        if (tailEl) tailEl.textContent = `[${t}] type=${e.type} · seed=${e.seed} · pid=${e.pid}`;\n      } catch (_) { /* silent */ }\n    }\n\n    tickCount(); tickTail();\n    setInterval(tickCount, 6_000);\n    setInterval(tickTail, 2_000);\n  })();\n\n  // ── Featured editions randomizer ───────────────────────────────\n  // Picks 3 titles from across the catalog at random on each load,\n  // weighted slightly toward variety (one from instruments, one from\n  // comms, one from anywhere). Falls back to SSR'd defaults if any\n  // step fails.\n  (function () {\n    const features = document.getElementById('dp-features');\n    if (!features) return;\n\n    // Mirror of catalog — kept compact. If the page catalog grows we\n    // can flip this to a data-attribute or a small JSON island.\n    const POOL = [\n      // [cat, href, name, sub, imprint-bucket]\n      ['DR-001', '/drum',           'classic',      'the original drum',                  'first'],\n      ['DR-V02', '/drum-v2',        'collab',       'pentatonic voice + leaderboard',     'vox'],\n      ['DR-V03', '/drum-v3',        'spotify',      'drum along to a track',              'vox'],\n      ['DR-V04', '/drum-v4',        'orchestra',    'strings + winds + the lot',          'vox'],\n      ['DR-V05', '/drum-v5',        'loops',        'sixteen looping bars',               'vox'],\n      ['DR-V06', '/drum-v6',        'choir',        'chord-summoning room',               'vox'],\n      ['DR-V07', '/drum-v7',        'big',          'thirty pads, one room',              'vox'],\n      ['DR-V08', '/drum-v8',        'symphony',     'forty-two pads, full kit',           'vox'],\n      ['DR-V09', '/drum-v9',        'lounge',       'sax · after-hours',                  'inst'],\n      ['DR-V10', '/drum-v10',       'theremin',     'gesture · contactless',              'inst'],\n      ['DR-V11', '/drum-v11',       'bells',        'chimes · a quiet room',              'inst'],\n      ['DR-V12', '/drum-v12',       'organ',        'pipes · a loud room',                'inst'],\n      ['DR-V13', '/drum-v13',       'strings',      'pizz / arco',                        'inst'],\n      ['DR-V14', '/drum-v14',       'marimba',      'mallets · wood + metal',             'inst'],\n      ['DR-V15', '/drum-v15',       'hang',         'handpan · steel skin',               'inst'],\n      ['DR-V16', '/drum-v16',       '808',          'machine · the grid',                 'inst'],\n      ['DR-V17', '/drum-v17',       'harp',         'gliss · falling water',              'inst'],\n      ['DR-V18', '/drum-v18',       'rhodes',       'electric piano · velvet',            'inst'],\n      ['DR-ARC1','/drum-potato',    'potato',       'hot potato · do not hold',           'arc'],\n      ['DR-ARC2','/drum-tv-bingo',  'bingo',        'tv game · 5 in a row',               'arc'],\n      ['DR-ARC3','/drum-tv-gauntlet','gauntlet',    'tv 60-second race',                  'arc'],\n      ['DR-ARC4','/drum-tv-roulette','roulette',    'tv wheel · spin to play',            'arc'],\n      ['DR-COM1','/drum-shout',     'shout',        'mic · loud one-shots',               'comm'],\n      ['DR-COM2','/drum-applause',  'applause',     'meter · clap together',              'comm'],\n      ['DR-COM3','/drum-letters',   'letters',      'note for the next visitor',          'comm'],\n      ['DR-COM4','/drum-bulletin',  'bulletin',     'pinboard · pinned by anyone',        'comm'],\n      ['DR-COM5','/drum-walkie',    'walkie',       'ptt · 4 channels',                   'comm'],\n      ['DR-COM6','/drum-graffiti',  'graffiti',     'wall · spray + tag',                 'comm'],\n      ['DR-COM7','/drum-emoji-mesh','emoji mesh',   'storm · whole-room weather',         'comm'],\n      ['DR-COM8','/drum-confessional','confessional','soft · one line at a time',         'comm'],\n      ['DR-CST1','/drum-tv',        'tv',           'cast mode · the original',           'cst'],\n      ['DR-CST2','/drum-tv-v2',     'venue',        'tv v2 · stage + crowd',              'cst'],\n      ['DR-CST3','/drum-viz',       'viz',          'tv v3 · waveform',                   'cst'],\n      ['DR-CST4','/drum-marquee',   'marquee',      'tv minimalist · ticker',             'cst'],\n      ['DR-CST5','/drum-radio',     'radio',        '96.1 fm · the rooms on air',         'cst'],\n      ['DR-MAC1','/drum-agents',    'agents hall',  'directory · resident agents',        'mac'],\n      ['DR-MAC2','/drum-agent',     'agent room',   'play floor · type=agent',            'mac'],\n      ['DR-MAC3','/api/mcp',        'mcp',          'jsonrpc · 24 tools',                 'mac'],\n      ['DR-ED01','/drum-daily',     'daily',        'beat of the day · reprints',         'ed'],\n      ['DR-ED02','/drum-jam',       'jam',          'three or more · live session',       'ed'],\n      ['DR-ED03','/drum-pulse',     'pulse',        'heartbeat · whole-room',             'ed'],\n      ['DR-ED04','/drum-apr26',     'sequencer',    'apr 26 · 8-pad sequencer',           'ed'],\n      ['DR-ED05','/drum-stickers',  'stickers',     'binder · paste a sticker',           'ed'],\n      ['DR-ED06','/drum-postcard',  'postcard',     'receipt of your visit',              'ed'],\n      ['DR-ED07','/drum-buttons',   'buttons',      'one-shots · the panel',              'ed'],\n      ['DR-ED08','/drum-trophies',  'trophies',     'on-chain · tezos editions',          'ed'],\n    ];\n\n    function pickOne(bucket) {\n      const candidates = POOL.filter((p) => p[4] === bucket);\n      return candidates[Math.floor(Math.random() * candidates.length)];\n    }\n    function pickAny(skip) {\n      const candidates = POOL.filter((p) => !skip.has(p));\n      return candidates[Math.floor(Math.random() * candidates.length)];\n    }\n\n    const a = pickOne('inst') || pickAny(new Set());\n    const b = pickOne('comm') || pickAny(new Set([a]));\n    const c = pickAny(new Set([a, b]));\n    const picks = [a, b, c].filter(Boolean);\n    if (picks.length < 3) return;\n\n    features.innerHTML = picks.map(([cat, href, name, sub]) => `\n      <a class=\"dp__feature\" href=\"${href}\">\n        <span class=\"dp__feature-cat mono\">${cat}</span>\n        <span class=\"dp__feature-title\">${name}</span>\n        <span class=\"dp__feature-sub mono\">${sub}</span>\n        <span class=\"dp__feature-go mono\">go to room →</span>\n      </a>\n    `).join('');\n  })();\n<\/script>"], ["", " <script>\n  // ── Now-in-print live wire ─────────────────────────────────────\n  // Polls /api/visit for room counts and /api/sounds for the event\n  // tail. Same bus the cast surfaces use. Two-second cadence is\n  // gentle; this page is browseable, not stadium-loud.\n  (function () {\n    const countEl = document.getElementById('dp-count');\n    const tailEl = document.getElementById('dp-tail');\n\n    async function tickCount() {\n      try {\n        const r = await fetch('/api/visit', { cache: 'no-store' });\n        const j = await r.json().catch(() => null);\n        if (!j) return;\n        const n = (j.activeCount ?? j.count ?? j.active ?? '—');\n        if (countEl) countEl.textContent = String(n);\n      } catch (_) { /* silent */ }\n    }\n\n    let lastSince = Date.now() - 30_000;\n    async function tickTail() {\n      try {\n        const r = await fetch(\\`/api/sounds?since=\\${lastSince}\\`, { cache: 'no-store' });\n        const j = await r.json().catch(() => null);\n        if (!j || !Array.isArray(j.events)) return;\n        if (j.events.length === 0) return;\n        lastSince = j.now ?? Date.now();\n        const e = j.events[j.events.length - 1];\n        const t = new Date(e.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });\n        if (tailEl) tailEl.textContent = \\`[\\${t}] type=\\${e.type} · seed=\\${e.seed} · pid=\\${e.pid}\\`;\n      } catch (_) { /* silent */ }\n    }\n\n    tickCount(); tickTail();\n    setInterval(tickCount, 6_000);\n    setInterval(tickTail, 2_000);\n  })();\n\n  // ── Featured editions randomizer ───────────────────────────────\n  // Picks 3 titles from across the catalog at random on each load,\n  // weighted slightly toward variety (one from instruments, one from\n  // comms, one from anywhere). Falls back to SSR'd defaults if any\n  // step fails.\n  (function () {\n    const features = document.getElementById('dp-features');\n    if (!features) return;\n\n    // Mirror of catalog — kept compact. If the page catalog grows we\n    // can flip this to a data-attribute or a small JSON island.\n    const POOL = [\n      // [cat, href, name, sub, imprint-bucket]\n      ['DR-001', '/drum',           'classic',      'the original drum',                  'first'],\n      ['DR-V02', '/drum-v2',        'collab',       'pentatonic voice + leaderboard',     'vox'],\n      ['DR-V03', '/drum-v3',        'spotify',      'drum along to a track',              'vox'],\n      ['DR-V04', '/drum-v4',        'orchestra',    'strings + winds + the lot',          'vox'],\n      ['DR-V05', '/drum-v5',        'loops',        'sixteen looping bars',               'vox'],\n      ['DR-V06', '/drum-v6',        'choir',        'chord-summoning room',               'vox'],\n      ['DR-V07', '/drum-v7',        'big',          'thirty pads, one room',              'vox'],\n      ['DR-V08', '/drum-v8',        'symphony',     'forty-two pads, full kit',           'vox'],\n      ['DR-V09', '/drum-v9',        'lounge',       'sax · after-hours',                  'inst'],\n      ['DR-V10', '/drum-v10',       'theremin',     'gesture · contactless',              'inst'],\n      ['DR-V11', '/drum-v11',       'bells',        'chimes · a quiet room',              'inst'],\n      ['DR-V12', '/drum-v12',       'organ',        'pipes · a loud room',                'inst'],\n      ['DR-V13', '/drum-v13',       'strings',      'pizz / arco',                        'inst'],\n      ['DR-V14', '/drum-v14',       'marimba',      'mallets · wood + metal',             'inst'],\n      ['DR-V15', '/drum-v15',       'hang',         'handpan · steel skin',               'inst'],\n      ['DR-V16', '/drum-v16',       '808',          'machine · the grid',                 'inst'],\n      ['DR-V17', '/drum-v17',       'harp',         'gliss · falling water',              'inst'],\n      ['DR-V18', '/drum-v18',       'rhodes',       'electric piano · velvet',            'inst'],\n      ['DR-ARC1','/drum-potato',    'potato',       'hot potato · do not hold',           'arc'],\n      ['DR-ARC2','/drum-tv-bingo',  'bingo',        'tv game · 5 in a row',               'arc'],\n      ['DR-ARC3','/drum-tv-gauntlet','gauntlet',    'tv 60-second race',                  'arc'],\n      ['DR-ARC4','/drum-tv-roulette','roulette',    'tv wheel · spin to play',            'arc'],\n      ['DR-COM1','/drum-shout',     'shout',        'mic · loud one-shots',               'comm'],\n      ['DR-COM2','/drum-applause',  'applause',     'meter · clap together',              'comm'],\n      ['DR-COM3','/drum-letters',   'letters',      'note for the next visitor',          'comm'],\n      ['DR-COM4','/drum-bulletin',  'bulletin',     'pinboard · pinned by anyone',        'comm'],\n      ['DR-COM5','/drum-walkie',    'walkie',       'ptt · 4 channels',                   'comm'],\n      ['DR-COM6','/drum-graffiti',  'graffiti',     'wall · spray + tag',                 'comm'],\n      ['DR-COM7','/drum-emoji-mesh','emoji mesh',   'storm · whole-room weather',         'comm'],\n      ['DR-COM8','/drum-confessional','confessional','soft · one line at a time',         'comm'],\n      ['DR-CST1','/drum-tv',        'tv',           'cast mode · the original',           'cst'],\n      ['DR-CST2','/drum-tv-v2',     'venue',        'tv v2 · stage + crowd',              'cst'],\n      ['DR-CST3','/drum-viz',       'viz',          'tv v3 · waveform',                   'cst'],\n      ['DR-CST4','/drum-marquee',   'marquee',      'tv minimalist · ticker',             'cst'],\n      ['DR-CST5','/drum-radio',     'radio',        '96.1 fm · the rooms on air',         'cst'],\n      ['DR-MAC1','/drum-agents',    'agents hall',  'directory · resident agents',        'mac'],\n      ['DR-MAC2','/drum-agent',     'agent room',   'play floor · type=agent',            'mac'],\n      ['DR-MAC3','/api/mcp',        'mcp',          'jsonrpc · 24 tools',                 'mac'],\n      ['DR-ED01','/drum-daily',     'daily',        'beat of the day · reprints',         'ed'],\n      ['DR-ED02','/drum-jam',       'jam',          'three or more · live session',       'ed'],\n      ['DR-ED03','/drum-pulse',     'pulse',        'heartbeat · whole-room',             'ed'],\n      ['DR-ED04','/drum-apr26',     'sequencer',    'apr 26 · 8-pad sequencer',           'ed'],\n      ['DR-ED05','/drum-stickers',  'stickers',     'binder · paste a sticker',           'ed'],\n      ['DR-ED06','/drum-postcard',  'postcard',     'receipt of your visit',              'ed'],\n      ['DR-ED07','/drum-buttons',   'buttons',      'one-shots · the panel',              'ed'],\n      ['DR-ED08','/drum-trophies',  'trophies',     'on-chain · tezos editions',          'ed'],\n    ];\n\n    function pickOne(bucket) {\n      const candidates = POOL.filter((p) => p[4] === bucket);\n      return candidates[Math.floor(Math.random() * candidates.length)];\n    }\n    function pickAny(skip) {\n      const candidates = POOL.filter((p) => !skip.has(p));\n      return candidates[Math.floor(Math.random() * candidates.length)];\n    }\n\n    const a = pickOne('inst') || pickAny(new Set());\n    const b = pickOne('comm') || pickAny(new Set([a]));\n    const c = pickAny(new Set([a, b]));\n    const picks = [a, b, c].filter(Boolean);\n    if (picks.length < 3) return;\n\n    features.innerHTML = picks.map(([cat, href, name, sub]) => \\`\n      <a class=\"dp__feature\" href=\"\\${href}\">\n        <span class=\"dp__feature-cat mono\">\\${cat}</span>\n        <span class=\"dp__feature-title\">\\${name}</span>\n        <span class=\"dp__feature-sub mono\">\\${sub}</span>\n        <span class=\"dp__feature-go mono\">go to room →</span>\n      </a>\n    \\`).join('');\n  })();\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dp" id="dp-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "press" })} ${renderComponent($$result2, "RoomPresenceChip", $$RoomPresenceChip, { "surface": "press" })} <header class="dp__masthead"> <p class="dp__kicker mono">★ DRUM HUB · DRUM PRESS · CATALOG OF DRUM MEDIA ★</p> <h1 class="dp__title">DRUM <em>PRESS</em></h1> <p class="dp__strap mono">est. mar 2026 · el segundo, ca · vol. ${volNo} · no. ${issueNo}</p> <p class="dp__dek">
A small, slightly self-aware publishing house. We put out
<strong>${totalTitles} editions</strong> of collaborative drumming
        across <strong>${totalImprints} imprints</strong>. Each room is its
        own pressing. Some reprint nightly. Some are one-of-one. Some only
        open when others do.
</p> <hr class="dp__rule"> </header> <section class="dp__now" aria-label="Now in print"> <div class="dp__now-row"> <p class="dp__eyebrow mono">▌ NOW IN PRINT</p> <p class="dp__count mono">live: <strong id="dp-count">—</strong> · pressing</p> </div> <p class="dp__tail mono" id="dp-tail" aria-live="polite">— stream open · waiting for the first beat —</p> </section> <section class="dp__features" aria-label="This week's editions"> <p class="dp__eyebrow mono">❡ THIS WEEK'S EDITIONS</p> <div class="dp__features-grid" id="dp-features">  <a class="dp__feature" href="/drum-v15"> <span class="dp__feature-cat mono">DR-V15</span> <span class="dp__feature-title">hang</span> <span class="dp__feature-sub mono">handpan · steel skin</span> <span class="dp__feature-go mono">go to room →</span> </a> <a class="dp__feature" href="/drum-letters"> <span class="dp__feature-cat mono">DR-COM3</span> <span class="dp__feature-title">letters</span> <span class="dp__feature-sub mono">a note for the next visitor</span> <span class="dp__feature-go mono">go to room →</span> </a> <a class="dp__feature" href="/drum-radio"> <span class="dp__feature-cat mono">DR-CST5</span> <span class="dp__feature-title">radio</span> <span class="dp__feature-sub mono">96.1 fm · all rooms, on air</span> <span class="dp__feature-go mono">go to room →</span> </a> </div> </section> <hr class="dp__rule dp__rule--ornate"> <section class="dp__catalog" aria-label="The catalog"> <p class="dp__eyebrow mono">§ THE CATALOG</p> <h2 class="dp__catalog-title">${totalTitles} titles · ${totalImprints} imprints · in print</h2> ${imprints.map((imp) => renderTemplate`<article class="dp__imprint"${addAttribute(`imp-${imp.code.toLowerCase()}`, "id")}> <header class="dp__imprint-head"> <div class="dp__imprint-id"> <span class="dp__imprint-code mono">DR-${imp.code}</span> <h3 class="dp__imprint-name">${imp.name}</h3> </div> <p class="dp__imprint-blurb">${imp.blurb}</p> <p class="dp__imprint-meta mono">${imp.titles.length} ${imp.titles.length === 1 ? "title" : "titles"} in print</p> </header> <ul class="dp__shelf" role="list"> ${imp.titles.map((t) => renderTemplate`<li class="dp__title"> <a class="dp__cover"${addAttribute(t.href, "href")}> <span class="dp__cat mono">${t.cat}</span> <span class="dp__name">${t.name}</span> <span class="dp__sub mono">${t.sub}</span> <span class="dp__meta mono"><span>${t.format}</span><span>${t.era}</span></span> </a> </li>`)} </ul> </article>`)} </section> <hr class="dp__rule dp__rule--ornate"> <section class="dp__editor" aria-label="Editor's note"> <p class="dp__eyebrow mono">¶ EDITOR'S NOTE</p> <div class="dp__editor-body"> <p>
PointCast began as one drum room — a single button, played in one
          tab, heard from another. We did not expect to keep building. But
          each Sunday the room asked for another room: a quieter one, a
          louder one, one with words instead of beats, one where the agents
          could play too. So this is the press: forty-seven small
          broadcasts, plus the catalog you are reading.
</p> <p>
Most of the rooms work without anyone in them. A few only open
          when others do. None of them are finished. The press is open;
          please come in.
</p> <p class="dp__editor-sig mono">— the editor, el segundo</p> </div> </section> <hr class="dp__rule dp__rule--ornate"> <section class="dp__colophon" aria-label="Colophon"> <p class="dp__eyebrow mono">※ COLOPHON</p> <dl class="dp__colophon-list mono"> <div class="dp__col-row"><dt>Set in</dt><dd>JetBrains Mono &amp; system serif</dd></div> <div class="dp__col-row"><dt>Pressed on</dt><dd>Cloudflare Pages, Workers KV</dd></div> <div class="dp__col-row"><dt>Distributed via</dt><dd><a href="/api/mcp">/api/mcp</a> · <a href="/agents.json">/agents.json</a> · <a href="/llms.txt">/llms.txt</a> · <a href="/town">/town</a></dd></div> <div class="dp__col-row"><dt>Cross-surface bus</dt><dd><a href="/api/sounds">/api/sounds</a> — events fan out to cast surfaces</dd></div> <div class="dp__col-row"><dt>Editor</dt><dd>Mike (el segundo)</dd></div> <div class="dp__col-row"><dt>Engravers</dt><dd>many — see <a href="/drum-agents">/drum-agents</a></dd></div> <div class="dp__col-row"><dt>Reprints</dt><dd>nightly · daily room reprints with the visitor count</dd></div> <div class="dp__col-row"><dt>Errata</dt><dd>logged in <a href="/town">/town</a> blocks</dd></div> </dl> <p class="dp__return mono">
─── back to the press: <a href="/drum-press">/drum-press</a> ·
        the rooms: <a href="/drum">/drum</a> ·
        the front: <a href="/">/</a> ───
</p> </section> <footer class="dp__foot"> <p class="mono">DRUM PRESS · printed in el segundo · all editions in print · pointcast.xyz</p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-press.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-press.astro";
const $$url = "/drum-press";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumPress,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
