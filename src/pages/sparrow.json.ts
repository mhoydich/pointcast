/**
 * /sparrow.json — agent-discovery manifest for the Sparrow reader client.
 *
 * Sibling of /magpie.json. Where the Magpie manifest describes a
 * publisher (how a clip gets pushed OUT to a destination graph), this
 * manifest describes a reader (how an agent tunes IN to PointCast).
 *
 * The contract is deliberately small: Sparrow doesn't add routes on
 * the canonical pointcast.xyz server — it's a UI over the existing
 * /blocks.json, /b/<id>.json, /beacon.json, and /feed.xml surface. The
 * value is shape + ergonomics + keyboard affordances documented here
 * so another agent can reproduce or replace the client.
 */
import { getCollection } from 'astro:content';
import { CHANNEL_LIST } from '../lib/channels';
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const recent24 = blocks.slice(0, 24);
  const distribution: Record<string, number> = {};
  for (const b of recent24) {
    distribution[b.data.channel] = (distribution[b.data.channel] ?? 0) + 1;
  }

  const manifest = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': 'https://pointcast.xyz/sparrow',
    name: 'Sparrow',
    description:
      'A hosted reader client for PointCast. Tune in at dawn — the broadcast arrives at your perch. Sibling of Magpie (the publisher); Sparrow reads what Magpie and others have pushed into the PointCast graph.',
    url: 'https://pointcast.xyz/sparrow',
    applicationCategory: 'CommunicationApplication',
    operatingSystem: 'Any (web)',
    license: 'MIT',
    version: '0.8',
    protocol_version: '0.8',
    sibling_of: 'https://pointcast.xyz/magpie',

    // Routes Sparrow surfaces itself. /sparrow is the dashboard; ch/
    // routes are per-channel; b/ is the reader; saved is local-first
    // (no server state — lives in the browser's localStorage).
    routes: {
      home: '/sparrow',
      about: '/sparrow/about',
      deck: '/sparrow/deck',
      connect: '/sparrow/connect',
      channel: '/sparrow/ch/<slug>',
      block_reader: '/sparrow/b/<id>',
      saved: '/sparrow/saved',
      manifest: '/sparrow.json',
      atom: '/sparrow/feed.xml',
      latest_api: '/sparrow/api/latest.json',
      pwa_manifest: '/sparrow/manifest.webmanifest',
      service_worker: '/sparrow/sw.js',
    },

    // v0.6: native macOS menu-bar companion at github.com/mhoydich/sparrow-app.
    // Lightweight polling client for /sparrow/api/latest.json —
    // designed so anyone can reproduce or replace it (single executable,
    // URLSession + AppKit + UserNotifications, no external deps).
    companion_app: {
      name: 'Sparrow.app',
      role: 'native macOS menu-bar companion',
      platform: 'macOS 13+',
      language: 'Swift 5.9',
      distribution: 'source (github.com/mhoydich/sparrow-app)',
      landing: 'https://pointcast.xyz/sparrow/connect',
      repository: 'https://github.com/mhoydich/sparrow-app',
      polls: '/sparrow/api/latest.json',
      default_poll_interval_seconds: 300,
      poll_range_seconds: [30, 3600],
      features: [
        'Menu-bar ✦ glyph; ember new-count appears when fresh blocks arrive',
        'Notification Center alerts (one per block up to 3; digest beyond)',
        'Preferences panel — feed URL, poll interval, notifications toggle',
        'LSUIElement: no Dock icon, no Cmd-Tab presence',
        'First-run seeds last-seen store from archive (no alert avalanche)',
      ],
      privacy: 'Opens one network connection to the configured feed URL. No telemetry, no phone-home.',
    },

    // v0.4 addition: overview presentation in 1980s Bell Labs / Xerox
    // PARC technical-memorandum styling. Self-contained page (no
    // SparrowLayout chrome) with 7 sections + references + two
    // appendices. Appendix B carries paste-ready prompts for AI image
    // generators that want to replace the CSS figure plates with
    // generated artwork.
    deck: {
      url: '/sparrow/deck',
      format: 'single-page technical memorandum',
      typography: 'EB Garamond · Courier Prime · Space Mono',
      palette: 'cream paper · oxblood stamp · CRT phosphor · weathered ink',
      sections: [
        'abstract',
        '1.0 introduction',
        '2.0 system architecture',
        '3.0 user interface',
        '4.0 keyboard protocol',
        '5.0 data model',
        '6.0 implementation notes',
        '7.0 future work',
        'references',
        'appendix A · manifest surface',
        'appendix B · AI image prompts for figure plates',
      ],
      print_ready: true,
      document_code: 'SPA-TM-26-0421',
    },

    // v0.3 — scoped service worker for offline reading + PWA install.
    pwa: {
      installable: true,
      manifest: '/sparrow/manifest.webmanifest',
      service_worker: {
        url: '/sparrow/sw.js',
        scope: '/sparrow/',
        version: 'sparrow-v0.8.0',
      },
      cache_policy: {
        shell: 'stale-while-revalidate (home, about, saved, 9 channel pages, manifest, atom feed)',
        block_readers: 'cache-first, max 48 entries, LRU-style trim',
        assets: 'cache-first, max 120 entries (Astro hashed assets + per-block OG images + Google Fonts)',
        non_sparrow: 'network-only (SW does not shadow the rest of pointcast.xyz)',
      },
      offline_fallback: {
        mode: 'navigation-only',
        chrome: 'inline Sparrow-styled HTML shipped with the SW so cold cache first-visit still lands',
      },
      install_triggers: [
        'browser-native beforeinstallprompt event surfaces "install ↓" button in the HUD + a larger CTA on /sparrow/about',
        'app shortcuts pre-seeded in the manifest: Front Door, Saved, About',
      ],
    },

    // Reading list is browser-local. No server, no sync (yet — v0.6).
    reading_list: {
      storage: 'localStorage',
      key: 'sparrow:saved',
      shape: 'string[] — array of block IDs, newest-added first',
      sync: 'none in v0.3; v0.6 plans Nostr kind-7 cross-device sync via NIP-44',
    },

    // v0.3 addition: track which blocks the user has opened so the
    // reel can soften already-read receipts. Capped at 120 entries.
    visited_list: {
      storage: 'localStorage',
      key: 'sparrow:visited',
      shape: 'string[] — array of block IDs, newest-visited first, max 120',
      ui_signal: '.is-visited class on [data-sp-block-id] — softens title + adds "read" chip',
    },

    // v0.7 addition: named reactions keyed off block IDs. v0.8 adds
    // optional Nostr kind-7 fan-out via NIP-07 when a browser extension
    // signer is connected — see the `nostr` block below.
    reactions: {
      storage: 'localStorage',
      key: 'sparrow:reactions',
      shape: '{ [blockId: string]: Array<"ember" | "moss" | "lilac"> }',
      kinds: [
        { id: 'ember', label: 'lit', glyph: '🔥', accent: 'var(--sp-ember)' },
        { id: 'moss',  label: 'evergreen', glyph: '🌿', accent: 'var(--sp-moss)' },
        { id: 'lilac', label: 'rare', glyph: '💜', accent: 'var(--sp-lilac)' },
      ],
      ui: 'Three-chip toolbar on /sparrow/b/<id>, below the article body. Each chip toggles; active picks pulse their accent ring.',
      emit_policy: 'On ADD only (v0.8). Deletion does not emit a kind-5 delete event yet — deferred to v0.9 alongside cross-device sync.',
    },

    // v0.8 addition: Nostr reaction fan-out. Entirely client-side —
    // Sparrow never holds the signing key. If the user installs a
    // NIP-07 browser extension (Alby, nos2x, Flamingo) and clicks
    // "connect signer", each toggled reaction becomes a signed kind-7
    // event broadcast to the configured relay pool. Aggregation /
    // subscription for receipt-under-reel counts lands in v0.9.
    nostr: {
      client_protocol: 'NIP-07 (window.nostr.signEvent)',
      event_kind: 7,
      tag_convention: [
        ['r', 'https://pointcast.xyz/b/<id>', 'canonical block URL the reaction targets'],
        ['t', 'sparrow'],
        ['t', 'sparrow-<kind>'],
        ['client', 'sparrow', 'https://pointcast.xyz/sparrow'],
      ],
      content: 'Unicode glyph for the chosen kind (🔥 | 🌿 | 💜).',
      relay_pool: {
        storage_key: 'sparrow:nostr-relays',
        default: [
          'wss://relay.damus.io',
          'wss://relay.primal.net',
          'wss://nos.lol',
        ],
        transport: 'WebSocket — one connection per emit, fire-and-forget with 4s timeout',
      },
      pubkey_cache: {
        storage_key: 'sparrow:nostr-pubkey',
        note: 'Cached hex x-only pubkey after first getPublicKey(); Sparrow never persists secret material.',
      },
      emitted_log: {
        storage_key: 'sparrow:nostr-emitted',
        shape: '{ [`${blockId}:${kind}`]: { id: string, at: number } }',
        purpose: 'Prevents accidental re-broadcast on hydrate/reload.',
      },
      ui_states: ['local', 'available', 'connected', 'emitting'],
      future: 'v0.9: subscribe to relay pool for kind-7 counts per block, aggregate client-side, surface under each reel receipt. Kind-5 delete events on unreact. NIP-44-encrypted sync of the pick log across devices.',
    },

    // What Sparrow renders. Agents that want to build their own reader
    // can subscribe to the same endpoints and skip Sparrow entirely.
    data_sources: {
      blocks_index: {
        url: '/blocks.json',
        shape: '{ total, blocks: [{ id, channel, type, title, dek, timestamp, author, mood, companions }] }',
        cadence: 'refreshed on every site build; cache 5 min',
      },
      block_detail: {
        url_pattern: '/b/<id>.json',
        shape: 'Full block body + meta. See BLOCKS.md for schema.',
      },
      beacon: {
        url: '/beacon.json',
        purpose: 'Live location pulse — powers the Sparrow beacon strip.',
      },
      atom_feed: {
        url: '/sparrow/feed.xml',
        note: 'Sparrow-branded Atom feed (same content, sparrow kicker). Generic feed at /feed.xml.',
      },
      polling_api: {
        url: '/sparrow/api/latest.json',
        shape: '{ total, updated_at, window, origin, blocks: [{ id, title, dek, channel, type, mood, timestamp, author, url, sparrow_url }] }',
        purpose: 'Polling-shaped companion feed for Sparrow.app and other lightweight clients. Top 24 blocks, snake_case keys, summary-only. Cache: public, max-age=120.',
      },
    },

    // UI primitives Sparrow ships. Agents building an alternate reader
    // (CLI, native app, TUI) can mirror these so users get a consistent
    // shape across clients.
    ui_primitives: {
      tuning_dial: {
        purpose: 'Conic-gradient ring over the latest 24 blocks, sliced by channel. Visual center-of-mass of recent activity.',
        computation: 'Σ blocks by channel over last 24; percent share → conic stops.',
      },
      broadcast_reel: {
        purpose: 'Horizontal/grid of the latest 12 blocks, channel-tinted, sorted newest-first.',
        per_card: ['stamp (channel+type)', 'no. + date', 'title', 'dek', 'signal-strength bars', 'mood chip'],
      },
      channel_rosette: {
        purpose: '9 channels as a compass; each tile shows count-in-last-24 + purpose blurb.',
        source: '/lib/channels.ts',
      },
      beacon_strip: {
        purpose: 'Thin HUD bar with location pulse + CTA to /beacon.',
      },
      command_palette: {
        shortcut: ['⌘K', 'Ctrl+K'],
        sources: ['routes', 'channels', '60 most recent blocks'],
      },
      now_tuned: {
        purpose: 'IntersectionObserver marks whichever receipt is centered in the viewport as "on-air" — the glow ring + S save-to-list key both target it.',
        signal: 'adds .is-now-tuned to the receipt; consumer css draws the ring',
      },
      reader_aside: {
        purpose: 'Right rail on /sparrow/b/<id> — channel chip, save button, companions list, external link, canonical permalink',
      },
      saved_list: {
        purpose: '/sparrow/saved — local-first reading list rendered from localStorage',
      },
      cheatsheet: {
        purpose: 'Global keyboard cheatsheet modal — opens on `?`, grouped by Discovery / Reading / Display / Reader extras. Read-only reference; palette is for doing.',
      },
      reading_progress: {
        purpose: 'Thin ember bar fixed below the tuning progress on /sparrow/b/<id>, filled via CSS view-timeline on .sp-article-body. Degrades silently on browsers without scroll-timeline.',
      },
      copy_as_quote: {
        purpose: 'Floating chip near a text selection inside .sp-article-body. Click: copies a formatted quote block with title + № + canonical URL via navigator.clipboard.',
      },
      prefetch: {
        hover: 'mouseover / focusin on [data-sp-block-id] a[href^=\'/sparrow/b/\'] injects <link rel="prefetch"> — works with the SW runtime cache so J/K and click feel instant.',
        idle: 'on /sparrow/b/<id>, requestIdleCallback prefetches prev + next block readers with a 2s timeout fallback.',
      },
    },

    // Keyboard contract — clients that mirror this get muscle memory
    // portability with the web reader.
    keyboard: {
      navigate_prev: 'K',
      navigate_next: 'J',
      focus_search: '/',
      theme_toggle: 'T',
      save_toggle: 'S',
      scroll_top: '0',
      scroll_bottom: '$',
      cheatsheet: '?',
      channel_jump_by_letter: 'G then <first letter of channel>',
      channel_jump_by_number: '1=FD, 2=CRT, 3=SPN, 4=GF, 5=GDN, 6=ESC, 7=FCT, 8=VST, 9=BTL',
      palette_open: ['⌘K', 'Ctrl+K'],
      palette_confirm: 'Enter',
      palette_close: 'Escape',
    },

    // Design system surface. Anti-recognition from Claude/Anthropic
    // chrome is intentional — Sparrow is its own thing in the PointCast
    // ecosystem, not an Anthropic-branded page.
    design_system: {
      palette_space: 'OKLCH',
      themes: ['blue-hour (default dark)', 'dawn (light)'],
      typography: {
        display: 'Gloock (Didone, Google Fonts)',
        ui: 'Inter Tight (geometric grotesque, Google Fonts)',
        mono: 'Departure Mono (pixelated retro, Google Fonts)',
      },
      tokens: {
        core: ['--sp-ink', '--sp-blue-hour', '--sp-slate', '--sp-rule', '--sp-bone', '--sp-ash', '--sp-mute'],
        accents: ['--sp-ember', '--sp-oxblood', '--sp-moss', '--sp-lilac'],
        channels: CHANNEL_LIST.map((c) => `--ch-${c.code.toLowerCase()}`),
      },
      motifs: ['tuning dial', 'signal receipts', 'compass rosette', 'radar sweep'],
      motion: {
        respects_reduced_motion: true,
        animations: ['needle sweep', 'beacon radar', 'pulse', 'scroll-driven tuning progress'],
      },
    },

    // Channels Sparrow surfaces. Mirrors /lib/channels.ts so agents
    // don't need a second fetch to resolve codes.
    channels: CHANNEL_LIST.map((c) => ({
      code: c.code,
      slug: c.slug,
      name: c.name,
      purpose: c.purpose,
      recent_count: distribution[c.code] ?? 0,
      url: `https://pointcast.xyz/sparrow/ch/${c.slug}`,
      color_hex_600: c.color600,
    })),

    // Snapshot Sparrow exposes — drives the dial + reel.
    snapshot: {
      total_blocks: blocks.length,
      latest_block_id: blocks[0]?.data.id ?? null,
      latest_block_url: blocks[0] ? `https://pointcast.xyz/b/${blocks[0].data.id}` : null,
      reel_size: 12,
      recent_window: 24,
      distribution,
      generated_at: new Date().toISOString(),
    },

    // Sprint arc. Sparrow v0.1 ships reading; later sprints add the
    // writeable affordances (reactions, reading list, offline cache).
    roadmap: {
      'v0.1': 'Reader home + rosette + reel + palette + keyboard shortcuts. Atom feed. Theme toggle.',
      'v0.2': 'Per-channel pages /sparrow/ch/<slug>. Block reader /sparrow/b/<id> with view-transition morph from the reel. Reading list /sparrow/saved (localStorage). Numeric channel shortcuts 1-9. Mood filter chips. Now-tuned IntersectionObserver. Save-toggle via S.',
      'v0.3': 'Scoped service worker at /sparrow/sw.js — precache shell + 9 channels + manifest + feed, cache-first block readers (48-entry cap). PWA install via /sparrow/manifest.webmanifest with Front Door / Saved / About shortcuts. Offline pill in HUD. Last-visited indicator on receipts. Offline fallback page.',
      'v0.4': 'Technical-memorandum overview at /sparrow/deck in 1980s Bell Labs / Xerox PARC styling (EB Garamond + Courier Prime on cream paper, numbered sections, ASCII architecture diagram, figure plates, references, and a prompt appendix for generating hero images). Precached for offline.',
      'v0.5': 'Reader finesse — reading-progress bar (CSS view-timeline on .sp-article-body), keyboard cheatsheet overlay on `?`, copy-as-quote floating chip with attribution, hover + idle prefetch of block readers, drop caps on first paragraph, text-wrap: pretty for body copy, 0 / $ jump-to-top/bottom.',
      'v0.6': 'Native macOS Sparrow.app companion shipped at github.com/mhoydich/sparrow-app (Swift 5.9, AppKit + URLSession + UserNotifications, no external deps). Menu-bar ✦ glyph with ember new-count, Notification Center alerts, preferences (feed URL, poll interval, notifications toggle). Paired with /sparrow/api/latest.json polling endpoint + /sparrow/connect landing.',
      'v0.7': 'Named reactions — three-chip toolbar on every block reader (🔥 lit · 🌿 evergreen · 💜 rare) backed by localStorage:sparrow:reactions. Local-only picks hydrate from storage on load; active states pulse their accent ring.',
      'v0.8': 'Reaction fan-out via NIP-07. Detects window.nostr, offers a "connect signer" pill next to the reactions toolbar; on reaction ADD, signs a kind-7 event r-tagged to https://pointcast.xyz/b/<id> and fire-and-forget publishes to a configurable relay pool (default: damus, primal, nos.lol). Emitted log prevents duplicate re-broadcasts on reload. Signer status surface states: local · available · connected · emitting. (current)',
      'v0.9': 'Reaction aggregation — subscribe to relay pool for kind-7 counts per block, surface under each reel receipt. Kind-5 delete events on unreact. Reading-list mirror via a small localhost HTTP bridge between Sparrow.app and the hosted reader. Inline reply composer routed through Magpie.',
      'v0.10': 'Cross-device sync of saved + visited + reactions via Nostr relay pool; end-to-end encrypted (NIP-44); OPML import/export; Bonjour discovery of local hosted Sparrow instances for dev environments.',
      'v1.0': 'Full offline archive (300+ blocks) in IndexedDB. Cross-client read state via Nostr addressable events. /sparrow/llms.txt for machine readers. Federated reading lists.',
    },

    install_steps: [
      'Open https://pointcast.xyz/sparrow — no install required.',
      'Press ⌘K to see the palette; / to filter the reel; 1-9 to jump to channels; T to flip the theme; ? for the cheatsheet.',
      'Open any block (via the reel, a channel page, or the palette) — press S to save it. Saved list lives at /sparrow/saved.',
      '(Optional) install as a PWA when your browser offers it — Sparrow becomes a standalone app and keeps working offline.',
      '(Optional) get the native companion at /sparrow/connect — a menu-bar ✦ that pulses when new blocks land. macOS 13+.',
      '(Optional) subscribe to /sparrow/feed.xml in your feed reader of choice.',
    ],

    companions: {
      magpie: {
        role: 'publisher',
        url: 'https://pointcast.xyz/magpie',
        manifest: 'https://pointcast.xyz/magpie.json',
      },
      pointcast: {
        role: 'canonical broadcast',
        url: 'https://pointcast.xyz',
        blocks_manifest: 'https://pointcast.xyz/blocks.json',
      },
    },
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
