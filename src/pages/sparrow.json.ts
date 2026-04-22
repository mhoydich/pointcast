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
    version: '0.30',
    protocol_version: '0.30',
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
      friends: '/sparrow/friends',
      friends_activity: '/sparrow/friends/activity',
      signals: '/sparrow/signals',
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
        version: 'sparrow-v0.19.0',
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
        purpose: 'Prevents accidental re-broadcast on hydrate/reload. v0.9 also uses this as the target for kind-5 retractions (points at the original event id).',
      },
      ui_states: ['local', 'available', 'connected', 'emitting'],

      // v0.9 + v0.10: aggregation — subscribe to the relay pool for
      // kind-7 events r-tagged to visible block URLs. No NIP-07 signer
      // required for reading (public relays). Client-side dedupe by
      // event id; counts paint wherever a block is visible.
      aggregation: {
        enabled: true,
        modes: {
          reader: {
            mechanism: 'One REQ per [data-sp-reactions] panel',
            filter: { kinds: [7], '#r': ['https://pointcast.xyz/b/<id>'], limit: 200 },
            count_ui: '.sp-react-count badge appended to each reaction chip',
            since: 'v0.9',
          },
          reel: {
            mechanism: 'One REQ per relay with every visible block URL in #r (bulk fan-in)',
            filter: { kinds: [7], '#r': ['https://pointcast.xyz/b/<id1>', 'https://pointcast.xyz/b/<id2>', '...'], limit: 500 },
            count_ui: 'Compact "🔥 3 · 🌿 1" row painted into .sp-r-foot on each receipt (.sp-r-react-counts). Hidden until at least one pick lands.',
            scope: 'Any page with [data-sp-block-id] receipts outside a [data-sp-reactions] panel — index, channel, saved, drawer, etc.',
            since: 'v0.10',
          },
        },
        deduplication: 'By Nostr event.id (Set<string> per blockId × kind), shared state between reader + reel paint paths',
        kind_resolution: 'Glyph-in-content first (🔥/🌿/💜); t=sparrow-<kind> tag as fallback for non-glyph reactions',
        cleanup: 'beforeunload closes every open WebSocket — no leaks across navigation',
        signer_required: false,
      },

      // v0.9: unreact — retract a kind-7 pick by emitting a kind-5
      // delete event referencing the original event id. Only fires when
      // the user toggles OFF a reaction they themselves posted (we have
      // the event id in sparrow:nostr-emitted). Local state is optimistic.
      unreact: {
        event_kind: 5,
        tag_convention: [
          ['e', '<original_event_id>'],
          ['k', '7'],
          ['t', 'sparrow'],
          ['client', 'sparrow', 'https://pointcast.xyz/sparrow'],
        ],
        trigger: 'On reaction REMOVE, only when sparrow:nostr-emitted has a prior event id for this blockId:kind',
        content: 'sparrow: unreact',
      },

      // v0.21: cross-device sync of saved + visited + reactions via
      // NIP-44-encrypted kind-30078 addressable events on the same
      // relay pool used for reactions. Opt-in — off by default.
      cross_device_sync: {
        since: 'v0.21',
        event_kind: 30078,
        d_tag: 'sparrow-reader-state-v1',
        encryption: 'NIP-44 self-encryption (window.nostr.nip44.encrypt(selfPubkey, plaintext)); only the same npub can decrypt',
        payload: 'JSON body — same shape as /reader-state POST: { saved, visited, reactions }, each with { value, updated_at }',
        opt_in_storage: 'localStorage["sparrow:sync-enabled"] ("1" | "0")',
        throttle: 'at most one relay push per 4 seconds (sparrow:sync-last-emitted-at floor) plus the 1.2s debounce stacked on top of the 600ms LAN mirror debounce',
        pull_strategy: 'On page load (when enabled) + on signer connect, one REQ per relay filtered by {kinds:[30078], authors:[self], #d:[sparrow-reader-state-v1], limit:1}. Newest created_at across relays wins; merge applied per top-level key via the same MIRROR_KEYS apply callbacks the LAN mirror uses.',
        coexistence: 'Nostr sync and the LAN peer-node mirror are orthogonal — both run when enabled. On save/visit/react, scheduleReaderMirror() fires both the LAN push and (if enabled) the Nostr push. On load, mirrorPull() populates from the LAN peer; subscribeNostrSync() then merges in anything newer from the relay pool.',
        requires: ['NIP-07 signer connected (window.nostr.getPublicKey)', 'NIP-44 support on the signer (window.nostr.nip44.{encrypt,decrypt}) — nos2x, Alby recent builds'],
        ui_toggle: '.sp-sync-toggle pill in the HUD · states: unavailable (no signer / no NIP-44) · off · on',
        not_shipped_yet: 'Cross-device conflict UX beyond newest-wins; per-key opt-out (e.g. "sync saved only"); key rotation after an NIP-44 change',
      },

      // v0.22: federated reading lists. Public, opt-in counterpart to
      // v0.21's private sync. Different d-tag (sparrow-public-saved-v1),
      // NO NIP-44 — just signed-JSON content so any other Sparrow (or
      // any Nostr client that understands the payload) can read.
      federated_lists: {
        since: 'v0.22',
        surface: '/sparrow/friends',
        publisher: {
          opt_in_storage: 'localStorage["sparrow:public-saved-enabled"] ("1" | "0")',
          event_kind: 30078,
          d_tag: 'sparrow-public-saved-v1',
          encryption: 'none — content is clear JSON so any follower can read without a signer',
          payload_shape: {
            schema: 'sparrow-public-saved-v1',
            saved: { value: 'string[] · saved block ids (newest-saved first, capped at 240)', updated_at: 'ISO 8601 — mirrors sparrow:saved:updated_at' },
            profile: { client: '"sparrow"', client_url: '"https://pointcast.xyz/sparrow"', version: '"0.22"' },
          },
          throttle: 'shares the 4s floor with private sync (sparrow:public-saved-last-emitted-at), runs on the same scheduleReaderMirror() debounce',
          scope_guarantee: 'ONLY the saved list is in this event — visited state, reactions, and private kind-30078 (sparrow-reader-state-v1) stay untouched. Visibility is a separate consent from cross-device sync.',
        },
        consumer: {
          friends_storage: 'localStorage["sparrow:friends"] · Array<{ pubkey: "64-hex", alias?: string (≤40 chars) }>',
          subscribe_filter: '{ kinds: [30078], authors: <friends>, "#d": ["sparrow-public-saved-v1"], limit: friends.length * 2 }',
          dedup_policy: 'newest created_at per author wins; earlier events ignored',
          title_resolution: 'server ships a { [id]: {id, title, dek, channel, type} } lookup for every non-draft block in the Astro content collection; client hydrates each saved id against it. Blocks absent from the current Sparrow build render as "unknown block · not in this Sparrow build" with a dead-but-valid link.',
          render_cap: 'first 24 block receipts per author; "+ N more" footer if the list is longer',
        },
        accepted_formats: 'v0.23 · pubkey input accepts both 64-hex AND npub1… (NIP-19 bech32). parsePubkey() in /sparrow/friends normalizes to lowercase hex. Self-pubkey display in the HUD + publisher signature line also renders as short-npub1 instead of hex.',
        privacy_story: 'Two distinct opt-ins: cross-device sync (v0.21, NIP-44 self-encrypted) and public saved list (v0.22, unencrypted). Either can be on without the other. No visited/reaction data ever leaves the device unencrypted.',

        // v0.23: NIP-01 kind-0 metadata hydration. Purely for the
        // friends UI — never mutates our outbound events. Cached
        // locally to avoid re-fetching on every visit.
        profile_lookup: {
          since: 'v0.23',
          event_kind: 0,
          subscribe_filter: '{ kinds: [0], authors: <friends>, limit: friends.length }',
          cache_storage: 'localStorage["sparrow:profiles"] — { [hex]: { name?, display_name?, picture?, nip05?, nip05_verified?, nip05_verified_at?, fetched_at } }',
          ttl_ms: 86400000,
          fields_read: ['name', 'display_name', 'picture', 'nip05'],
          alias_priority: 'local alias (sparrow:friends[].alias) > kind-0 display_name > kind-0 name > nothing',
          render: 'friends list + feed card header both show the resolved display name; a 🛰 glyph appears next to names sourced from the relay so users can tell what\'s local vs federated',
        },

        // v0.24: lazy-loaded, CSP-friendly profile thumbnails on the
        // friends list + feed cards. Images go through a strict
        // https-only filter before they ever land in sparrow:profiles,
        // and render with referrerpolicy=no-referrer + onerror=hide so
        // a broken URL disappears quietly rather than leaving a torn-
        // page glyph behind.
        picture_rendering: {
          since: 'v0.24',
          storage_gate: 'kind-0 `picture` accepted only when /^https?:\\/\\//i.test(value), capped at 400 chars',
          render_element: '<img class="sp-friends-pic" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.style.display=\'none\'">',
          placeholder: 'sp-friends-pic-placeholder span with a ✦ glyph when no picture is known',
          sizes: { list: '28px circle', feed_card: '18px inline' },
          why_no_proxy: 'Loading via Cloudflare/image proxy would add a TTL layer but also cost bandwidth + privacy. Lazy + no-referrer gets 90% of the benefit.',
        },

        // v0.24: NIP-05 verification. Resolves `<user>@<domain>` via
        // /.well-known/nostr.json?name=<user> on the claimed domain
        // and confirms names[user] equals the author pubkey. Results
        // cache on the profile with a 7-day TTL. Any non-2xx, parse
        // error, CORS failure, or mismatch lands as "mismatch" so a
        // silent failure doesn't masquerade as verified.
        // v0.25: compact friends lane on /sparrow (dashboard). Lives
        // between the rosette and the 12-latest reel. Shares the
        // kind-30078 consumer flow with /sparrow/friends but renders
        // one row per friend (their freshest save) to keep the strip
        // shallow. Server ships a minimal block lookup (id → title +
        // channel + channelName) for title resolution without per-
        // block fetches.
        // v0.26: live "friend just saved" toasts driven by a streaming
        // kind-30078 REQ opened once per SparrowLayout load (globally —
        // the toast stack is page-agnostic). Filter uses `since:
        // bootTime` so we never flood the user with history on load.
        // Opt-in chime (Web Audio, no asset) plays alongside toasts.
        // Per-friend mute (sparrow:friends[i].muted: true) hides
        // the friend from the lane + /sparrow/friends feed + toasts
        // without removing them from the managed list.
        friends_motion: {
          since: 'v0.26',
          watcher: {
            transport: 'persistent WebSocket REQ per relay (never limited, never closed until beforeunload)',
            filter: '{ kinds:[30078], authors:<non-muted friends>, "#d":["sparrow-public-saved-v1"], since: <bootTime seconds> }',
            since_policy: 'bootTime = Math.floor(Date.now() / 1000) on script run → only events newer than the current tab fire toasts',
            dedup: 'Set<event.id> so the same event seen across multiple relays only toasts once',
            gated_on: ['sparrow:friends non-empty', 'sparrow:friends-motion-disabled !== "1"', 'friend not flagged muted'],
          },
          toast: {
            container: 'aside.sp-motion-toasts fixed bottom-right; column-reverse stack',
            max_visible: 3,
            ttl_ms: 7000,
            shape: 'avatar + "<name> · just saved · № <id>" — click opens the block, × dismisses',
            animation: 'sp-motion-in 260ms (slide-from-right + fade) on mount, sp-motion-out 300ms on leave',
            profile_source: 'same sparrow:profiles cache populated by /sparrow/friends (one-pass hydration)',
          },
          chime: {
            opt_in_storage: 'localStorage["sparrow:friends-chime-enabled"] ("1" | "0")',
            sound: 'two overlapping sine oscillators (A5 880Hz + E6 1318.5Hz) · exponential fade · ~450ms total · Web Audio only · no asset request',
            default: 'off',
            scope: 'plays only alongside a toast — never on historical events, never when friend is muted',
          },
          disable_all: 'localStorage["sparrow:friends-motion-disabled"] === "1" short-circuits the watcher entirely (keeps toasts off for privacy-minded sessions without unfollowing)',
        },

        // v0.26: per-friend mute. Friend shape extends from
        //   { pubkey, alias? }  →  { pubkey, alias?, muted? }
        // Muted friends stay in sparrow:friends but drop out of every
        // consumer path (subscribe authors list, feed render, dashboard
        // lane, motion watcher). Reversible from the friends list UI.
        per_friend_mute: {
          since: 'v0.26',
          storage_shape_change: 'sparrow:friends[] now accepts an optional `muted: boolean` field on each entry; legacy entries without the field are treated as unmuted',
          applied_in: ['/sparrow/friends subscribe filter', '/sparrow/friends feed render', '/sparrow dashboard lane', 'SparrowLayout live motion watcher'],
          ui: '🔈 mute / 🔇 unmute button per row · row fades to 45% opacity when muted · "muted" pill next to the pubkey',
          why_not_unfollow: 'unfollow is destructive (loses the alias, loses future reinstate) — mute lets users quiet noisy signers without losing track of them',
        },

        // v0.27: dedicated timeline view. Dual-subscription — a bounded
        // initial pull (limit 50) for history + a `since: bootTime` live
        // subscription that splices new events at the top without a
        // full repaint. Events newer than bootTime pulse green ("new"
        // badge) for 12 seconds, then fade to normal styling.
        // v0.28: federation recap. Aggregates the same kind-30078
        // corpus /sparrow/friends + /sparrow/friends/activity read,
        // but surfaces three different readings: most co-saved blocks,
        // recent-adds window, channel distribution. Purely client-
        // side aggregation — no server endpoint, no background job.
        signals: {
          since: 'v0.28',
          surface: '/sparrow/signals',
          subscribe_filter: '{ kinds:[30078], authors:<non-muted friends>, "#d":["sparrow-public-saved-v1"], limit: friends.length * 2 }',
          newest_per_author: 'Map keyed by pubkey — only latest created_at per friend is aggregated, matching the rest of the federation surface',
          panels: {
            top_co_saved: {
              purpose: 'blocks saved by 2+ followed signers — overlap is the signal',
              min_count: 2,
              cap: 12,
              sort: 'count desc, then block id asc for stability',
              shows_savers: 'up to 4 saver names inline + "+N" overflow',
            },
            recent_adds: {
              purpose: 'friends who published a fresh saved list in the last 7 days',
              window_seconds: 604800,
              row: 'avatar · name · "published N · Xh ago" · freshest saved receipt',
              sort: 'event created_at desc',
            },
            channel_distribution: {
              purpose: 'where attention is aggregated right now',
              computation: 'sum distinct saves per channel across all newest-per-author lists; proportional bar against total',
              row: 'channel code · name · bar · count → links to /sparrow/ch/<slug>',
            },
          },
          shared_state: 'reads the same sparrow:profiles cache + block lookup the rest of /sparrow federation surfaces use; no extra round-trips',

          // v0.29 extensions
          first_picker_attribution: {
            since: 'v0.29',
            computation: 'among current savers of a block, the one whose newest kind-30078 event has the earliest created_at wins the ⭐ attribution',
            caveat: 'kind-30078 is replaceable — this reflects "most recently re-published" per author, not the true first-save moment; across a group re-publishing regularly, the pattern stabilizes',
            surface: 'top co-saved panel: ⭐ <name> chip in the savers row',
          },
          export_json: {
            since: 'v0.29',
            trigger: '⤓ export JSON button in the signals nav',
            filename: 'sparrow-signals-<YYYY-MM-DD>.json',
            schema: 'sparrow-signals-v1',
            payload_keys: ['generated_at', 'boot_origin', 'friends[]', 'relays[]', 'newest_events[]', 'top_co_saved[]', 'notes'],
            privacy_posture: 'bundle contains pubkeys + aliases + profile metadata the user already has cached locally; no secret material. Entirely client-side Blob download.',
          },
          not_yet: 'opt-in email digest (still requires sidecar worker infra — now the ONLY remaining v0.28 bundle item)',
        },

        // v0.30: ambient presence — who's reading right now. Uses the
        // ephemeral Nostr kind range (20000-29999 per NIP-16) so relays
        // don't persist presence events. Every SparrowLayout tab with
        // a signer + the opt-in flag re-broadcasts every 60s while
        // foregrounded. Subscribers render avatars of friends seen in
        // the last 90 seconds.
        ambient_friends: {
          since: 'v0.30',
          opt_in_storage: 'localStorage["sparrow:ambient-enabled"] ("1" | "0")',
          publisher: {
            event_kind: 20078,
            tags: '[["t","sparrow-presence"], ["client","sparrow",...], ["expiration", <now+120s>]]',
            content: 'empty — presence is the fact of emission, not the payload',
            cadence: 'broadcast every 60s (AMBIENT_BROADCAST_MS) while the tab is foregrounded; re-emits on visibilitychange → visible',
            fan_out: 'short-lived WebSocket per relay, EVENT frame, 3s timeout',
            why_ephemeral: 'kind 20078 is in the 20000-29999 NIP-16 ephemeral range — relays relay in real-time but don\'t persist. Presence is moot the instant it\'s stale.',
          },
          subscriber: {
            filter: '{ kinds:[20078], authors:<non-muted friends>, "#t":["sparrow-presence"], since: <bootTime - 60s> }',
            fresh_window_ms: 90000,
            render: 'fixed bottom-left .sp-ambient strip · ✦ here now label + up to 8 avatars + "+N" overflow; hidden when nobody\'s fresh',
            decay_tick: 'setInterval(15s) repaints so avatars drop off as they exceed AMBIENT_FRESH_MS',
            mute_respected: 'friend.muted filtered at ingest + paint',
          },
          privacy_story: 'Publishing announces your liveness to the public relay pool; off by default. Not publishing still lets you see ambient friends (subscription is passive).',
        },

        // v0.30: digest sidecar scaffold. Worker not yet live — this
        // documents the shape so a Cloudflare Worker can pick up the
        // contract when ready.
        digest_sidecar: {
          since: 'v0.30',
          status: 'scaffold · worker not live yet',
          signup_ui: '/sparrow/signals weekly-digest panel',
          storage_key: 'sparrow:digest-subscription',
          subscription_shape: {
            schema: 'sparrow-digest-subscription-v1',
            email: 'string · user-supplied',
            frequency: '"weekly" | "biweekly" | "monthly"',
            npub: 'hex pubkey or null (from sparrow:nostr-pubkey)',
            relays: 'string[] · copies getRelays() so the worker can re-aggregate from the same relay pool',
            created_at: 'ISO 8601',
          },
          future_endpoint: 'POST /api/sparrow/digest-subscribe',
          expected_response: '{ ok: true } when live; 501 ("worker not live") is the current placeholder',
          unsubscribe_plan: 'DELETE /api/sparrow/digest-subscribe with a signed token from the email footer; local clear of sparrow:digest-subscription',
          worker_security_posture: 'never holds secret material — stores email + npub + relay list + frequency only. Recomputes signals bundle at send time by subscribing to the same public kind-30078 d-tag the web client uses.',
          why_client_first: 'We ship the intent capture + schema doc before the worker goes live so early users are queued, not blocked. When the worker is up, an on-load sync step will flush queued intents.',
        },

        // v0.29: per-channel friends top-N surface on /sparrow/ch/<slug>.
        // Scoped aggregation — the same kind-30078 corpus filtered to
        // just the block ids that live in the current channel, sorted
        // by count of distinct friends who saved it, with first-picker
        // attribution matching the /sparrow/signals surface.
        channel_friends: {
          since: 'v0.29',
          surface: '/sparrow/ch/<slug> (above the main reel)',
          scope: 'filter friends\' saved ids to the server-shipped channelBlockSet for the current channel',
          subscribe_filter: '{ kinds:[30078], authors:<non-muted friends>, "#d":["sparrow-public-saved-v1"], limit: friends.length * 2 }',
          sort: 'count desc, then block id asc for stability',
          max_rows: 6,
          row: 'badge ×N · block № · title · ⭐ first-picker chip',
          hides_when: 'no followed friends, all muted, or no saves intersect this channel',
          opt_out_storage: 'localStorage["sparrow:ch-friends-hidden"] === "1" hides the panel across every channel page until re-enabled',
          lookup_shipped: '{ [id]: { title } } for every block in the current channel only — keeps per-page payload minimal',
        },

        friends_activity: {
          since: 'v0.27',
          surface: '/sparrow/friends/activity',
          subscriptions: {
            initial: '{ kinds:[30078], authors:<non-muted friends>, "#d":["sparrow-public-saved-v1"], limit: 50 } — closed on EOSE',
            live:    '{ kinds:[30078], authors:<non-muted friends>, "#d":["sparrow-public-saved-v1"], since: <bootTime seconds> } — kept open until beforeunload',
          },
          dedup_strategy: 'per-event.id Map so the same event across multiple relays only renders once; author replaceable events land as distinct entries by their event id',
          render_policy: 'newest-wins sort by created_at desc, capped at 50 visible entries',
          per_event_card: 'avatar + display name + "saved N blocks" + relative timestamp + first 3 saved-block receipts (title + channel chip) + "+N more" footer',
          new_badge: 'events with created_at >= bootTime get .is-new styling (moss border + shadow pulse animation + "new" pill). Interval tick demotes them 12s after arrival.',
          title_resolution: 'server-shipped lookup { [id]: { title, channel, channelName } } for every non-draft block',
          share_with: '/sparrow/friends + /sparrow dashboard lane + SparrowLayout motion watcher all read the same sparrow:profiles cache, so avatars/names are one-pass',
          mute_respected: 'muted friends filtered out of the authors list AND re-checked on ingest (mute can happen mid-subscribe)',
        },

        friends_lane: {
          since: 'v0.25',
          surface: '/sparrow (dashboard) · between rosette and reel',
          max_rows: 6,
          sort: 'freshest friend event first (created_at desc)',
          row_contents: 'avatar (kind-0 picture) · display name · "saved" · block № · title · channel chip · "+N more" (when friend has >1 saved)',
          lookup: 'inline <script id="sp-friends-lane-lookup" type="application/json"> carrying { [id]: { title, channel, channelName } } for every non-draft block',
          opt_out_storage: 'localStorage["sparrow:friends-lane-hidden"] === "1" hides the section until re-enabled from /sparrow/friends',
          empty_state: 'when friends list is non-empty but no public-saved events arrived, a prompt links to /sparrow/friends',
          when_hidden_by_default: 'when sparrow:friends localStorage is empty (no one followed yet) — no nag',
          shared_logic_with: '/sparrow/friends (subscribe filter identical; profile picture/name resolution reads the same sparrow:profiles cache written by /sparrow/friends)',
        },

        nip05_verification: {
          since: 'v0.24',
          protocol: 'NIP-05',
          endpoint_template: 'https://<domain>/.well-known/nostr.json?name=<user>',
          request: 'GET · no credentials · cache: force-cache',
          cache_fields: ['nip05_verified (bool)', 'nip05_verified_at (epoch ms)', 'nip05_verify_in_flight (optional bool)'],
          cache_ttl_ms: 604800000,
          outcomes: {
            ok: 'pubkey matches names[user] (case-insensitive)',
            mismatch: 'resolved to a different pubkey, non-2xx, parse error, CORS failure, or malformed nip05',
            pending: 'verify in-flight',
            unchecked: 'no nip05 in profile, or pending verification not yet started',
          },
          render: '✓ (moss pill) beside the nip05 string + name when verified; ! (oxblood pill) when mismatch; … (mute) while pending',
          trigger_points: ['commitProfiles() when nip05 changed or stale', 'boot scan of cached friends whose nip05_verified_at is >7d'],
        },
      },

      future: 'v1.0: Federated reading lists across more surfaces (reel lane injection, "signals" digest), agent-mode view at /sparrow/llms.txt for machine readers, full offline archive in IndexedDB.',
    },

    // v0.11: inline reply composer on the block reader. Direct POST to
    // PointCast's /api/ping (pc-ping-v1). Magpie-routed multi-
    // destination reply (for users with Magpie installed) lands in
    // v0.12 — needs Magpie peer-node integration + destination picker.
    compose: {
      surface: 'Collapsible <details> panel on /sparrow/b/<id>, below the reactions toolbar',
      transport: 'POST https://pointcast.xyz/api/ping',
      schema: 'pc-ping-v1',
      payload_shape: {
        type: 'pc-ping-v1',
        subject: 'optional string (≤120 chars)',
        body: 'string (≤3800 chars)',
        expand: true,
        channel: '<parent block channel code>',
        blockType: 'NOTE',
        sourceUrl: 'https://pointcast.xyz/b/<parent-id>',
        sourceApp: 'sparrow',
        from: 'sparrow-reader',
        timestamp: 'ISO 8601',
        dek: '"Re: <parent-id>" when subject is empty',
      },
      result_states: ['pending', 'ok', 'error'],
      collapses_on: 'successful post (2.2s after ok state shows)',
      future: 'v0.13 routes multi-destination replies through Magpie /compose when any non-PointCast destination is selected (this sprint); when Magpie is unreachable or /compose 4xx/5xx, Sparrow automatically falls back to direct /api/ping so the reply always lands in PointCast.',
    },

    // v0.18: Magpie bridge discovery via a ranked origin ladder.
    // Shared resolver used by every Magpie-bound fetch (reader-state
    // mirror, bridge awareness pill, composer /compose). First 200 on
    // /health wins and caches on window.__sparrow.magpieOrigin for
    // the life of the page.
    bridge_discovery: {
      probe_order: [
        { rank: 1, source: 'localStorage["sparrow:magpie-origin"]', why: 'user override — LAN, VM, reverse proxy, non-default port' },
        { rank: 2, source: 'http://magpie.local:38473', why: 'mDNS-published .local name once Magpie advertises via Bonjour (v0.19)' },
        { rank: 3, source: 'http://127.0.0.1:38473', why: 'Magpie hardcoded loopback default — always present when Magpie is running locally' },
        { rank: 4, source: 'http://sparrow.local:38474', why: 'Sparrow.app peer-node Bonjour name — v0.20 fallback when Magpie is absent but the menu-bar companion is running' },
        { rank: 5, source: 'http://127.0.0.1:38474', why: 'Sparrow.app hardcoded loopback default — last-resort fallback before giving up on peer mirror' },
      ],
      health_endpoint: '/health',
      probe_timeout_ms: 1200,
      resolved_cache: 'window.__sparrow.magpieOrigin + window.__sparrow.magpiePeerKind ("magpie" | "sparrow-app") so the bridge pill can render the right peer label',
      override_setter: 'set localStorage["sparrow:magpie-origin"] to e.g. "http://magpie.box.lan:38473" and reload',
      why_not_direct_mdns: 'Browsers do not expose Bonjour / mDNS-SD APIs; .local name resolution is handled by the OS stack and works transparently once the service advertises. v0.19 shipped the Swift-side NWListener advertisement on the Magpie side; v0.20 ships the parallel advertisement on Sparrow.app.',
      shared_by: ['reader_state_mirror (GET/POST, either peer)', 'magpie_bridge (GET /health + /config.json — Magpie-only routes naturally 404 on Sparrow.app)', 'compose (POST /compose — Magpie-only; falls back to direct /api/ping on Sparrow.app)'],

      // v0.19: Magpie advertises via Bonjour. Other Bonjour-aware clients
      // (CLI tools, Sparrow.app, dev utilities) can discover the
      // peer-node by browsing the service type; Sparrow web tabs don't
      // need to change because the OS mDNS responder transparently
      // resolves .local names once the service is published.
      bonjour_advertisement: {
        service_type: '_magpie._tcp',
        service_name: 'Magpie',
        port: 38473,
        txt_record: {
          version:  '0.19',
          path:     '/health',
          schema:   'sparrow-reader-state-v1',
          composer: '/compose',
          mirror:   '/reader-state',
        },
        listener_binding: 'loopback — advertisement is metadata-only; traffic still flows over 127.0.0.1',
        publisher: 'Magpie v0.19 via NWListener.service + NWTXTRecord',
        discovery_ui: 'Any `dns-sd -B _magpie._tcp` on macOS shows the active Magpie instance',
      },

      // v0.20: Sparrow.app (native macOS menu-bar companion) runs a
      // parallel peer-node on loopback port 38474 with the same
      // sparrow-reader-state-v1 mirror shape. The reader-state endpoints
      // are byte-compatible with Magpie's, so the web client's mirror
      // works against either. Composer still routes through Magpie
      // because only Magpie has the PublisherRegistry; when Sparrow.app
      // is the resolved peer, /compose 404s and the composer gracefully
      // falls back to direct /api/ping.
      sparrow_peer_advertisement: {
        service_type: '_sparrow._tcp',
        service_name: 'Sparrow',
        port: 38474,
        txt_record: {
          version: '0.20',
          path:    '/health',
          schema:  'sparrow-reader-state-v1',
          mirror:  '/reader-state',
          peer:    'sparrow-app',
        },
        listener_binding: 'loopback — same posture as Magpie: advertisement is metadata-only, traffic is 127.0.0.1-bound',
        publisher: 'Sparrow.app v0.20 via NWListener.service + NWTXTRecord (Sources/SparrowApp/SparrowServer.swift)',
        discovery_ui: '`dns-sd -B _sparrow._tcp` shows the active Sparrow.app instance; running both peers simultaneously is fine',
        enabled_toggle: 'Settings.peerServerEnabled (defaults to true); port override via Settings.peerServerPort',
        when_active: 'Resolver falls through to Sparrow.app as rank 4/5 only when Magpie isn\'t responding — so both can coexist without thrashing',
      },
    },

    // v0.17: OPML import/export on /sparrow/saved. Round-trips the
    // reading list with any OPML-speaking feed reader (NetNewsWire,
    // Reeder, Inoreader) — no sign-in, no server handoff, pure
    // client-side blob download + file-input parse.
    opml: {
      surface: 'toolbar above the receipts list on /sparrow/saved',
      export: {
        filename: 'sparrow-saved-<YYYY-MM-DD>.opml',
        outlines: [
          { group: 'Sparrow', items: ['Sparrow Atom feed (/sparrow/feed.xml)', 'PointCast generic feed (/feed.xml)'] },
          { group: 'Saved blocks', items: 'one <outline type="link" htmlUrl="/b/<id>"> per saved ID, title prefixed with "№ <id> — <title> · <channel>"' },
          { group: 'Channels', items: 'all 9 channel RSS feeds (/c/<slug>.rss) with htmlUrl pointing at /sparrow/ch/<slug>' },
        ],
      },
      import: {
        accepts: '.opml, .xml, application/xml, text/xml',
        parser: 'DOMParser over the uploaded text; scrapes any outline\'s htmlUrl or xmlUrl for /b/<id> matches',
        merge: 'Union with existing sparrow:saved (newest-added first). Reloads the page after a short flash so the list re-renders from the updated state. Updates sparrow:saved:updated_at to current time so the mirror picks the import up on the next debounce.',
        tolerates: 'Non-block outlines (channel feeds, arbitrary feeds) are ignored silently — the import is additive, never destructive.',
      },
      privacy: 'Entirely client-side. No upload leaves the browser except when the user themselves submits the file via a normal <input type="file">.',
    },

    // v0.15: reading-list mirror. When the Magpie peer-node is alive,
    // Sparrow mirrors sparrow:saved to it via POST /reader-state;
    // fresh reader loads pull GET /reader-state.json and apply
    // newest-wins. Single-machine sync today — cross-device is v0.16
    // over Nostr. No signer, no auth — localhost-only.
    reader_state_mirror: {
      ships_in: 'v0.15',
      shared_storage_key: 'magpie.sparrowReaderState (UserDefaults on the Magpie side)',
      endpoints: {
        get: 'GET http://127.0.0.1:38473/reader-state.json → { ok, state, schema: "sparrow-reader-state-v1", served_at }',
        post: 'POST http://127.0.0.1:38473/reader-state · body: { [key]: { value, updated_at } } → { ok, state, updated_at }',
      },
      payload_shape: {
        saved:     { value: 'string[] · block IDs (newest-saved first)', updated_at: 'ISO 8601', since: 'v0.15' },
        visited:   { value: 'string[] · block IDs (last 120, newest-visited first)', updated_at: 'ISO 8601', since: 'v0.16' },
        reactions: { value: '{ [blockId: string]: Array<"ember" | "moss" | "lilac"> }', updated_at: 'ISO 8601', since: 'v0.16' },
      },
      merge_policy: 'Newest-wins per top-level key. On the Magpie server, mergeReaderState() compares stored updated_at against incoming and incoming-newer replaces wholesale. On the Sparrow client, mirrorPull() writes only when remote updated_at is later than the local sparrow:<key>:updated_at. Apply callbacks use skipMirror: true to avoid push-loops, then re-paint the DOM (hydrateReactions + applyVisited) so the UI follows the remote state immediately.',
      signer_required: false,
      auth: 'none · localhost-bound only; Magpie never exposes this port externally',
      debounce_ms: 600,
      web_state_keys: [
        'sparrow:saved', 'sparrow:saved:updated_at',
        'sparrow:visited', 'sparrow:visited:updated_at',
        'sparrow:reactions', 'sparrow:reactions:updated_at',
      ],
    },

    // v0.12: Magpie bridge awareness. Probe the local peer-node at
    // 127.0.0.1:38473/health; when alive, fetch /config.json to
    // surface which of Magpie's destinations are ready. The submit
    // path stays on direct pc-ping-v1 /api/ping for v0.12 — v0.13
    // upgrades to Magpie /broadcast once the native-side clip-less
    // compose endpoint exists.
    magpie_bridge: {
      probe: {
        url: 'http://127.0.0.1:38473/health',
        timeout_ms: 1200,
        method: 'GET',
        purpose: 'non-blocking — composer still works when Magpie is offline',
      },
      config_source: {
        url: 'http://127.0.0.1:38473/config.json',
        shape: '{ pointcast: {...}, publishers: { [id]: { ready, enabled, ... } } }',
        purpose: 'derive the destination readiness chips the composer displays',
      },
      pill_states: ['probing', 'connected', 'offline'],
      ui_surface: 'sp-compose-bridge row inside the reply composer on /sparrow/b/<id> — pill + destination checkboxes (PC locked on) + "compose in magpie" deep link',
      submit_path: 'v0.13: POST http://127.0.0.1:38473/compose when any non-PointCast destination is checked AND the pill is in "connected" state. Any non-2xx or network error falls back to direct https://pointcast.xyz/api/ping (pc-ping-v1) so the reply still lands in PointCast. PointCast-only posts always use the direct path — no Magpie round-trip needed.',
      destinations_surfaced: Object.keys({
        pointcast: 1, mastodon: 1, farcaster: 1, bitchat: 1,
        bluesky: 1, twitter: 1, linkedin: 1, instagram: 1,
        zora: 1, objkt: 1, opensea: 1,
      }),

      // Contract Sparrow targets on the Magpie peer-node. Magpie's own
      // /broadcast endpoint requires a clipID; this clip-less route is
      // the counterpart designed for composer-originated posts
      // (Sparrow web reader or other thin clients). Native-side handler
      // landed in the Magpie repo in v0.14 — AppState.handleComposeRequest
      // builds an ephemeral ClipItem (id: nil, not persisted) and fans
      // out via PublisherRegistry.
      endpoint_contract: {
        status: 'shipped · magpie v0.14',
        native_source: 'Magpie/Services/MagpieServer.swift (handleCompose) + Magpie/App/AppState.swift (handleComposeRequest)',
        method: 'POST',
        path: '/compose',
        origin: 'http://127.0.0.1:38473',
        request_body: {
          body: 'string · required · plain text',
          title: 'string · optional · ≤120 chars',
          dek: 'string · optional · one-line framing',
          destinations: 'string[] · required · PublisherID raw values (pointcast, mastodon, farcaster, bitchat, bluesky, twitter, linkedin, instagram, zora, objkt, opensea)',
          channel: 'string · optional · PointCast channel code (FD/CRT/SPN/GF/GDN/ESC/FCT/VST/BTL)',
          blockType: 'string · optional · READ/NOTE/LISTEN/WATCH/LINK/VISIT/MINT/FAUCET',
          sourceUrl: 'string · optional · canonical URL of the thing being replied to',
          sourceApp: 'string · optional · "sparrow" by default',
          subject: 'string · optional · alias of title',
          timestamp: 'ISO 8601 · optional · client-side wall clock',
        },
        response_body: {
          ok: 'bool · true if at least one destination succeeded',
          clipID: 'Int64? · ephemeral clip id if Magpie created one for bookkeeping',
          results: 'Array<{ publisher, success, summary?, permalink?, remoteID?, error? }>',
        },
        native_side_shape:
          'Create an ephemeral ClipItem (not persisted), build a PublishDraft with the given body/title/dek/hints, call PublisherRegistry.publish(draft, to: destinations.compactMap(PublisherID.init(rawValue:))). Return per-destination outcomes — same result envelope shape as /broadcast so downstream clients can reuse parsing.',
        fallback_contract: 'When /compose 404s (Magpie version pre-v0.13) or any network error, Sparrow posts the body to https://pointcast.xyz/api/ping directly. PointCast always lands; extras may be missed. The composer surfaces this clearly: "direct (magpie fallback: <reason>)".',
      },
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
      friends_open: 'F',
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
      'v0.8': 'Reaction fan-out via NIP-07. Detects window.nostr, offers a "connect signer" pill next to the reactions toolbar; on reaction ADD, signs a kind-7 event r-tagged to https://pointcast.xyz/b/<id> and fire-and-forget publishes to a configurable relay pool (default: damus, primal, nos.lol). Emitted log prevents duplicate re-broadcasts on reload. Signer status surface states: local · available · connected · emitting.',
      'v0.9': 'Reaction aggregation (read side). Per-reader REQ subscription against the relay pool filtered by {kinds:[7], #r:[canonical-block-url]}. Client-side dedupe by event id; count badges paint on each chip as events arrive or from the last 200 stored per relay. Reading works without a signer. Kind-5 delete events fire on unreact when the local emitted log has the original event id, with optimistic local state.',
      'v0.10': 'Cross-reel count badges. One REQ per relay filtered by every visible block URL in #r, paints a compact "🔥 3 · 🌿 1" row into each receipt footer as events arrive. Shared state with reader aggregation so reader + reel stay in sync. Works on index, channel, saved — anywhere receipts render.',
      'v0.11': 'Inline reply composer on /sparrow/b/<id>. Collapsible panel below the reactions toolbar; body + optional subject; POSTs pc-ping-v1 to https://pointcast.xyz/api/ping with the parent block as sourceUrl, channel + expand=true. Shows pending/ok/error states and auto-collapses after a successful post.',
      'v0.12': 'Magpie bridge awareness. Composer probes 127.0.0.1:38473/health on load; when alive, fetches /config.json and paints a status pill + destination chips (reading state from publishers[id].ready). Deep link opens a fresh /magpie tab. Submit path stays on direct /api/ping — real multi-destination routing lands in v0.13 once the Magpie native side has a clip-less compose endpoint.',
      'v0.13': 'Magpie-routed multi-destination reply (web side). Destination chips are now checkboxes; PointCast is locked on. When any non-PC box is checked AND the Magpie bridge is connected, Sparrow POSTs to http://127.0.0.1:38473/compose with { body, title, destinations[], channel, hints }. Graceful fallback: any /compose failure (404 on older Magpie, network error, or all-destinations-failed) routes the reply to direct /api/ping instead. Per-destination result painted in the composer result span. Endpoint contract spec\'d in sparrow.json.magpie_bridge.endpoint_contract for the native side to implement.',
      'v0.14': 'Magpie native /compose endpoint shipped. Swift-side handler in Magpie/Services/MagpieServer.swift decodes ComposeRequest { body, title?, dek?, destinations[], channel?, blockType?, sourceUrl?, sourceApp?, subject?, timestamp?, overrides? }; AppState.handleComposeRequest builds an ephemeral ClipItem (id: nil, not persisted) + PublishDraft and fans out via PublisherRegistry. Results envelope mirrors /broadcast so existing parsers work unchanged. Sparrow\'s v0.13 /compose attempts now succeed on the first hop when Magpie is ≥v0.14; older versions still graceful-fallback.',
      'v0.15': 'Reading-list mirror via the Magpie peer-node. MagpieServer adds GET /reader-state.json + POST /reader-state (UserDefaults-backed blob store). SparrowLayout debounces POSTs on saved-list writes + pulls on load. Newest-wins per top-level key via updated_at timestamps. Single-machine today; Sparrow.app HTTP server for true native ↔ web mirror lands later alongside the v0.6 app reshape.',
      'v0.16': 'Visited + reactions extend the sparrow-reader-state-v1 schema. writeVisited + writeReactions both debounce into the same 600ms scheduleReaderMirror(); on pull, Sparrow repaints .is-visited and rehydrates reaction chips from remote state. Magpie-side merge logic unchanged — its per-key newest-wins already handled any shape.',
      'v0.17': 'OPML import/export on /sparrow/saved. Export bundles Sparrow\'s Atom feed + the nine channel RSS feeds + one <outline> per saved block (/b/<id>) into an OPML 2.0 file any feed reader can swallow. Import DOMParses the uploaded text and unions /b/<id> matches with sparrow:saved (additive, never destructive; unknown outlines ignored). Entirely client-side.',
      'v0.18': 'Bridge discovery (web side). Shared resolveMagpieOrigin() probes a ranked ladder — localStorage["sparrow:magpie-origin"] override → http://magpie.local:38473 → http://127.0.0.1:38473 — and caches the first /health responder on window.__sparrow. Used by every Magpie-bound fetch (mirror, bridge awareness, composer). Sets the stage for Magpie v0.19\'s Bonjour advertisement: the `.local` host just starts resolving once Magpie advertises via NWListener.',
      'v0.19': 'Magpie Swift-side Bonjour advertisement shipped. NWListener.service publishes "Magpie" of type _magpie._tcp on port 38473 with a TXT record carrying version, /health path, schema id, composer + mirror endpoint hints. macOS mDNS responder transparently resolves magpie.local to the host, so Sparrow\'s v0.18 ladder picks it up on the second rung without any web-side changes. Listener stays loopback-bound — advertisement is metadata-only.',
      'v0.20': 'Sparrow.app peer-node shipped. Sources/SparrowApp/SparrowServer.swift runs a loopback NWListener on port 38474 exposing GET /health + GET /reader-state.json + POST /reader-state with byte-identical sparrow-reader-state-v1 merge logic to Magpie\'s. NWListener.service advertises _sparrow._tcp "Sparrow" with a TXT record (version/path/schema/mirror/peer). Web resolver ladder extended to 5 rungs: user override → magpie.local → 127.0.0.1:38473 → sparrow.local:38474 → 127.0.0.1:38474. window.__sparrow.magpiePeerKind records which peer answered so the bridge pill can label it accurately. Composer stays Magpie-only and falls back to direct /api/ping when Sparrow.app is the resolved peer.',
      'v0.21': 'Cross-device sync of saved + visited + reactions via NIP-44-encrypted kind-30078 addressable events. Opt-in HUD pill (sync · on/off/n/a); self-encryption via window.nostr.nip44 means only the same npub can decrypt. Runs alongside the LAN peer-node mirror — both fire on the same scheduleReaderMirror() debounce, both use the same newest-wins-per-key merge policy so state stays coherent across device + peer. 4s throttle between relay pushes; on page load subscribes with limit:1 against each relay to pull latest.',
      'v0.22': 'Federated reading lists. New /sparrow/friends route. Opt-in "publish my saved list publicly" flag emits a separate kind-30078 event with d-tag sparrow-public-saved-v1 (unencrypted, narrow scope — just the saved ids + a client-id profile; no visited/reaction data). Friends management UI stores {pubkey,alias?}[] in sparrow:friends; on load, REQs the relay pool for each friend\'s latest public saved event and renders their list with server-shipped block lookups so titles and channels resolve. Hex-only for now; npub1… bech32 decode lands in a polish pass.',
      'v0.23': 'Federation polish. Self-contained NIP-19 bech32 codec in /sparrow/friends — npubToHex/hexToNpub/parsePubkey — so the add-form accepts npub1… alongside hex and the HUD self-pubkey display renders as a short npub. NIP-01 kind-0 profile lookup REQs {kinds:[0], authors:<friends>} on load, caches {name, display_name, picture, nip05, fetched_at} in sparrow:profiles (24h TTL), and uses display_name/name as auto-alias when the local alias is empty. Friends list + feed cards show a 🛰 glyph on names pulled from the relay so federated vs local is legible. Picture rendering + NIP-05 verification round-trip are explicitly v0.24.',
      'v0.24': 'Federation finish. Profile pictures render as 28px circles on /sparrow/friends list (18px inline on feed cards) with lazy loading + referrerpolicy=no-referrer + onerror hide. NIP-05 verification hits https://<domain>/.well-known/nostr.json?name=<user> and checks names[user] equals the pubkey; results cached on the profile with a 7-day TTL. Moss-pill ✓ when verified, oxblood-pill ! on mismatch, dot while pending. Keyboard shortcut F jumps to /sparrow/friends from any page; palette + cheatsheet entries added. Friends reel-lane on /sparrow dashboard is explicitly deferred to v0.25 to keep this sprint coherent.',
      'v0.25': 'Friends lane on the dashboard. New compact section between /sparrow rosette and reel shows freshest save from each followed npub — avatar · name · block № · title · channel chip — sorted by event created_at desc, capped at 6 rows. Shares the kind-30078 consumer flow with /sparrow/friends and reads the same sparrow:profiles cache so hydration stays one-pass. Server inlines a block lookup (id → title + channel + channelName) so titles resolve without per-block fetches. Opt-out via localStorage["sparrow:friends-lane-hidden"]; dismiss button lives on the lane header. Hidden entirely by default when no friends have been added.',
      'v0.26': 'Friends in motion. SparrowLayout gains a persistent streaming kind-30078 REQ with `since: bootTime` so only events published after the tab loaded fire a bottom-right "just saved" toast (avatar + name + № id · click opens). Max 3 visible, 7s TTL, fades on leave. Opt-in Web Audio chime (two-note fifth, ~450ms, no asset) via sparrow:friends-chime-enabled. Per-friend mute — sparrow:friends entries gain an optional `muted` field that drops the friend from every consumer path (subscribe, feed, lane, toasts) without unfollowing. New 🔈/🔇 mute button in /sparrow/friends. Global motion opt-out via sparrow:friends-motion-disabled.',
      'v0.27': 'Friends activity timeline at /sparrow/friends/activity. Dual subscription — bounded initial pull (limit 50) for history + `since: bootTime` live pull kept open until beforeunload. Events render newest-first as per-event cards (avatar + name + "saved N blocks" + relative timestamp + first 3 saved-block receipts with title/channel chips + "+N more"). New events splice at the top with a moss pulse animation + "new" pill that fades after 12 seconds. Respects mute — muted friends filtered from the authors list and re-checked on ingest. CTA added from /sparrow/friends feed head; palette + SW + routes + kicker + feature card updated.',
      'v0.28': 'Signals recap at /sparrow/signals. Three-panel aggregation over the same kind-30078 corpus the rest of the federation surface reads. Panel 1 — most co-saved (blocks hit by 2+ signers, count-sorted, top 12, inline saver chips). Panel 2 — recent adds (friends who published a fresh saved list in the last 7 days, newest first, with avatar + freshest receipt). Panel 3 — channel distribution (proportional bars across all 9 channels derived from saved-block channel codes, each linking to its /sparrow/ch/<slug>). Client-side aggregation only; reuses sparrow:profiles cache + server-shipped block lookup. Signals nav links added from /sparrow/friends feed head; palette + SW + routes + kicker + feature card updated. Stats bumped to 10 routes.',
      'v0.29': 'Signals, extended. Three of the four v0.29-bundled items land today; opt-in email digest deferred to v0.30 (needs sidecar worker infra). (1) First-picker attribution — in /sparrow/signals Panel 1, each co-saved block now surfaces ⭐ <name> — the friend with the earliest created_at among current savers. (2) Export JSON — new ⤓ button in signals nav dumps the current recap as sparrow-signals-<date>.json with schema sparrow-signals-v1 (friends, relays, newest_events, top_co_saved with saver lists + first_picker_at, notes documenting caveats). (3) Channel friends panel — new client-side strip on every /sparrow/ch/<slug> above the main reel showing which blocks in this channel your followed friends have co-saved, count-sorted, top 6, with first-picker chip. Hides when irrelevant; opt-out via localStorage["sparrow:ch-friends-hidden"].',
      'v0.30': 'Ambient friends + digest sidecar scaffold. (1) Ambient presence — SparrowLayout now publishes an ephemeral kind-20078 event tagged t:sparrow-presence every 60s while the tab is foregrounded (opt-in via sparrow:ambient-enabled). A streaming subscriber tracks friends\' presence via kinds:[20078] #t:sparrow-presence and paints a fixed bottom-left "✦ here now" avatar strip of friends seen in the last 90s. Uses NIP-16 ephemeral-kind range so relays never persist presence. (2) Digest sidecar scaffold — new panel in /sparrow/signals for email-digest subscription (schema sparrow-digest-subscription-v1). Worker isn\'t live yet; intents stored locally in sparrow:digest-subscription and POSTed to /api/sparrow/digest-subscribe with 501 handled as "queued, worker pending." Contract fully documented in /sparrow.json.nostr.federated_lists.digest_sidecar so the worker can pick up the shape when infra is ready. Toggle for ambient added to /sparrow/friends publisher panel. (current)',
      'v1.0': 'Full offline archive (300+ blocks) in IndexedDB. Cross-client read state via Nostr addressable events. /sparrow/llms.txt for machine readers. Federated reading lists.',
    },

    install_steps: [
      'Open https://pointcast.xyz/sparrow — no install required.',
      'Press ⌘K to see the palette; / to filter the reel; 1-9 to jump to channels; T to flip the theme; ? for the cheatsheet.',
      'Open any block (via the reel, a channel page, or the palette) — press S to save it. Saved list lives at /sparrow/saved.',
      '(Optional) install as a PWA when your browser offers it — Sparrow becomes a standalone app and keeps working offline.',
      '(Optional) get the native companion at /sparrow/connect — a menu-bar ✦ that pulses when new blocks land. macOS 13+.',
      '(Optional) subscribe to /sparrow/feed.xml in your feed reader of choice.',
      '(Optional, v0.22) connect a NIP-07 signer (Alby / nos2x), flip the sync pill in the HUD, and add friends at /sparrow/friends to see what other readers are saving.',
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
