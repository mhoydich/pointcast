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
    version: '0.2',
    protocol_version: '0.2',
    sibling_of: 'https://pointcast.xyz/magpie',

    // Routes Sparrow surfaces itself. /sparrow is the dashboard; ch/
    // routes are per-channel; b/ is the reader; saved is local-first
    // (no server state — lives in the browser's localStorage).
    routes: {
      home: '/sparrow',
      channel: '/sparrow/ch/<slug>',
      block_reader: '/sparrow/b/<id>',
      saved: '/sparrow/saved',
      manifest: '/sparrow.json',
      atom: '/sparrow/feed.xml',
    },

    // Reading list is browser-local. No server, no sync (yet — v0.6).
    reading_list: {
      storage: 'localStorage',
      key: 'sparrow:saved',
      shape: 'string[] — array of block IDs, newest-added first',
      sync: 'none in v0.2; v0.6 plans Nostr kind 7 reactions',
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
    },

    // Keyboard contract — clients that mirror this get muscle memory
    // portability with the web reader.
    keyboard: {
      navigate_prev: 'K',
      navigate_next: 'J',
      focus_search: '/',
      theme_toggle: 'T',
      save_toggle: 'S',
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
      'v0.2': 'Per-channel pages /sparrow/ch/<slug>. Block reader /sparrow/b/<id> with view-transition morph from the reel. Reading list /sparrow/saved (localStorage). Numeric channel shortcuts 1-9. Mood filter chips. Now-tuned IntersectionObserver. Save-toggle via S. (current)',
      'v0.3': 'Offline cache via Service Worker — read last 24 blocks on the subway. Install as PWA. Last-visited indicator.',
      'v0.4': 'Native macOS Sparrow.app companion — menu bar dot that pulses when a new block lands; mirrors reading list over Bonjour to the web reader.',
      'v0.5': 'Reactions (Nostr kind 7 keyed off block ids). Inline Nouns-style reply composer that routes through Magpie.',
      'v0.6': 'Cross-device sync of the reading list via Nostr relay pool. End-to-end encrypted (NIP-44).',
    },

    install_steps: [
      'Open https://pointcast.xyz/sparrow — no install required.',
      'Press ⌘K to see the palette; / to filter the reel; 1-9 to jump to channels; T to flip the theme.',
      'Open any block (via the reel, a channel page, or the palette) — press S to save it. Saved list lives at /sparrow/saved.',
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
