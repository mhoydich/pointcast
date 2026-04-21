/**
 * /magpie.json — machine-readable manifest for the Magpie web UI.
 *
 * Agent discovery surface for the hosted clipboard peer-node companion.
 * Describes what Magpie is, where to install it, how the local peer-node
 * HTTP API is shaped, and — as of v0.6.1 — how to broadcast a captured
 * clip to multiple publishers (PointCast + Mastodon + Farcaster + bitchat
 * via Nostr) through the protocol-agnostic Publisher interface.
 * Additional adapters (Twitter/X, LinkedIn, Zora, Objkt, OpenSea) land
 * in v0.7+.
 */
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = async () => {
  const manifest = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': 'https://pointcast.xyz/magpie',
    name: 'Magpie',
    description:
      'A macOS clipboard peer-node + universal publisher for the agentic web. Local-first capture, URL unfurls, block-type detection, multi-destination broadcast across eleven destinations (PointCast + Mastodon + Farcaster + bitchat via Nostr + Bluesky + Twitter/X + LinkedIn + Instagram + Zora + Objkt + OpenSea) with per-destination previews, six one-click presets, image attachments with IPFS staging, draft retry queue, scheduled broadcasts (local + cloud), encrypted credential forwarding, macOS notifications, a reach dashboard, and a scriptable CLI. Hosted activity view at /magpie/activity, interactive tour at /magpie/tour, long-form guide at /magpie/guide.',
    url: 'https://pointcast.xyz/magpie',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'macOS 13+',
    license: 'MIT',
    downloadUrl: 'https://github.com/Good-Feels/magpie/releases/latest',
    codeRepository: 'https://github.com/Good-Feels/magpie',
    version: '1.1',
    protocol_version: '1.1',

    // How the hosted UI finds your running Magpie instance.
    peer_node: {
      host: '127.0.0.1',
      default_port: 38473,
      scheme: 'http',
      routes: {
        health: '/health',
        clips: '/clips.json',
        config: '/config.json',
        ui: '/',
        broadcast: '/broadcast (POST)',
        retry: '/retry (POST)',
        activity: '/activity (GET)',
        scheduled: '/scheduled (GET)',
        drafts: '/drafts (GET)',
        summary: '/summary?days=N (GET)',
        oauth_callback: '/oauth/callback/<publisher>',
      },
      cors: 'Access-Control-Allow-Origin: *',
      auth: 'none (localhost-bound)',
    },

    // One-click preset bundles the composer offers for multi-destination
    // selection. Each preset intersects with `ready` and `accepts(blockType)`
    // before selecting — chips dim for non-applicable presets on a given
    // clip. Full definitions live in Magpie/Publishers/Publisher.swift.
    destination_presets: [
      { id: 'all',      displayName: 'All ready',   shortCode: 'ALL',  publishers: 'every ready + capable destination' },
      { id: 'social',   displayName: 'Social',      shortCode: 'SOC',  publishers: ['mastodon', 'bluesky', 'twitter', 'farcaster'] },
      { id: 'web3',     displayName: 'Web3',        shortCode: 'W3',   publishers: ['farcaster', 'bitchat', 'zora', 'objkt'] },
      { id: 'longForm', displayName: 'Long-form',   shortCode: 'LONG', publishers: ['pointcast', 'linkedin', 'mastodon'] },
      { id: 'mesh',     displayName: 'Mesh',        shortCode: 'MESH', publishers: ['bitchat', 'farcaster'] },
      { id: 'visual',   displayName: 'Visual',      shortCode: 'VIS',  publishers: ['mastodon', 'bluesky', 'farcaster', 'instagram'] },
    ],

    // Hosted read-only UI for the peer-node's activity log. Fetches
    // /summary + /activity from 127.0.0.1:38473 client-side; refreshes
    // every 30s when the tab is visible. See src/pages/magpie/activity.astro.
    hosted_activity_page: {
      url: 'https://pointcast.xyz/magpie/activity',
      fetches: ['peer_node /summary?days=30', 'peer_node /activity?limit=100'],
      refresh_interval_s: 30,
      note: 'Browser-cross-origin is fine — peer-node serves Access-Control-Allow-Origin: *.',
    },

    // Onboarding surfaces. Shipped with v1.0.
    onboarding: {
      interactive_tour: 'https://pointcast.xyz/magpie/tour',
      long_form_guide: 'https://pointcast.xyz/magpie/guide',
      in_app_sheet: 'MagpieTourSheet — fires once on upgrade past v0.10',
    },

    // v1.0 shipped encrypted credential forwarding so the Cloudflare
    // worker can carry OAuth tokens + app passwords to cron tick without
    // being able to read them. AES-GCM-256 with a per-install symmetric
    // key stored in Keychain. Full round-trip: client encrypts →
    // KV stores ciphertext → cron hands opaque blob back to client
    // dispatcher → client decrypts + fans out. See
    // Magpie/Publishers/CredentialForwarding.swift.
    credential_forwarding: {
      algorithm: 'AES-GCM-256',
      key_storage: 'macOS Keychain, per-install, never leaves the device',
      envelope_fields: ['version', 'algorithm', 'nonce', 'ciphertext', 'tag'],
      cloud_can_read: false,
      supported_destinations_v1_0: ['mastodon', 'farcaster', 'bluesky', 'twitter', 'linkedin'],
      deferred_destinations: ['bitchat', 'zora', 'objkt', 'opensea', 'instagram'],
    },

    // On-chain infrastructure landed in v1.1.
    on_chain: {
      evm: {
        rpc_client: 'BaseRPC (pure Swift, no deps)',
        supported_methods: [
          'eth_chainId', 'eth_blockNumber', 'eth_gasPrice',
          'eth_maxPriorityFeePerGas', 'eth_getTransactionCount',
          'eth_estimateGas', 'eth_call',
          'eth_sendRawTransaction', 'eth_getTransactionReceipt',
        ],
        tx_encoding: 'EIP-1559 typed transaction via RLP.swift',
        mint_service: 'ZoraMintService — pin metadata + image via Pinata, build createCoin calldata, sign with EVMSigner, submit via BaseRPC, poll receipt for CoinCreated event.',
      },
      tezos: {
        rpc_client: 'TezosRPC (pure Swift, no deps)',
        supported_methods: [
          '/chains/main/chain_id',
          '/chains/main/blocks/head/hash',
          '/chains/main/blocks/head/context/contracts/<addr>/counter',
          '/chains/main/blocks/head/helpers/forge/operations',
          '/chains/main/blocks/head/helpers/scripts/run_operation',
          '/injection/operation',
        ],
        param_encoding: 'Michelson.swift — nat, string, bytes, pair, map, Teia mint_OBJKT shape',
        mint_service: 'ObjktMintService — pin TZIP-21 metadata + artifact via Pinata, build Michelson params, forge via node, sign with TezosSigner ed25519, inject operation.',
      },
    },

    // MCP server for agent integrations — NEW in v1.1.
    mcp_server: {
      binary: 'magpie-mcp (swift build -c release --target magpie-mcp)',
      protocol: 'Model Context Protocol (JSON-RPC over stdio)',
      tools: [
        'list_clips', 'search_clips',
        'get_summary', 'get_activity', 'get_scheduled', 'get_drafts',
        'broadcast_clip', 'retry_draft',
      ],
      install_note: 'Add to Claude Desktop config under mcpServers → magpie → command = /path/to/magpie-mcp.',
      endpoint_override: 'MAGPIE_ENDPOINT env var',
    },

    // Wallet signers — both real in v1.0.
    wallets: {
      evm: {
        signer: 'EVMSigner (secp256k1 ECDSA + Keccak256 address derivation)',
        chains: ['base', 'zora', 'ethereum', 'polygon'],
        ready: true,
        used_by: ['zora', 'opensea'],
        features: ['EIP-55 checksum addresses', 'EIP-191 personal_sign'],
        key_storage: 'Keychain',
      },
      tezos: {
        signer: 'TezosSigner (ed25519 / Blake2b via CryptoKit)',
        chains: ['mainnet'],
        ready: true,
        used_by: ['objkt'],
        key_storage: 'Keychain',
      },
      nostr: {
        signer: 'NostrLocalSigner (secp256k1 BIP-340 Schnorr)',
        ready: true,
        used_by: ['bitchat'],
        key_storage: 'Keychain (nsec_hex)',
      },
    },

    // Cloud-backed scheduler for broadcasts that fire while the laptop
    // is asleep. POST a pc-schedule-v1 record, the Cloudflare cron
    // dispatcher fires due entries every 5 min.
    cloud_scheduler: {
      endpoint: 'https://pointcast.xyz/api/schedule',
      methods: ['GET', 'POST', 'DELETE'],
      kv: 'PC_SCHEDULE_KV',
      cron: '*/5 * * * *',
      dispatches: ['pointcast'],
      dispatch_pending: ['mastodon', 'farcaster', 'bitchat', 'bluesky', 'twitter', 'linkedin', 'instagram', 'zora', 'objkt', 'opensea'],
      dispatch_note: 'Non-pointcast destinations need per-user credential forwarding — deferred to v0.10. The local BroadcastScheduler handles those today when the app is running.',
    },

    // v0.6.1: Nostr discovery surface. Agents following PointCast on
    // Nostr subscribe here to pick up bitchat broadcasts. Per-user
    // pubkey is configured in the Magpie client — the server-level
    // default below is for the pointcast.xyz broadcast account itself.
    nostr: {
      account_pubkey: null,
      default_relays: [
        'wss://relay.damus.io',
        'wss://relay.primal.net',
        'wss://nos.lol',
      ],
      client_tag: 'magpie',
      event_kinds: [1],
      thread_model: 'NIP-10 e-tags (marker="reply")',
    },

    // Media pinning service used by MINT publishers to persist the
    // attached image + metadata JSON on IPFS before the on-chain call.
    ipfs: {
      service: 'Pinata',
      client: 'PinataClient.swift',
      gateway: 'https://gateway.pinata.cloud/ipfs/<cid>',
      pins: ['image', 'metadata.json'],
    },

    // Publishers the Magpie node can broadcast through. Each entry
    // mirrors the `PublisherCapabilities` in the Swift source so agents
    // can reason about what a destination accepts before sending a draft.
    // v0.6 shipped PointCast + Mastodon + Farcaster; v0.6.1 added bitchat
    // (Nostr transport). Adapter source: Magpie/Publishers/*.swift
    publishers: [
      {
        id: 'pointcast',
        displayName: 'PointCast',
        shortCode: 'PC',
        supportedBlockTypes: ['READ', 'NOTE', 'LISTEN', 'WATCH', 'LINK', 'VISIT', 'MINT', 'FAUCET'],
        maxTextLength: 4000,
        supportsMedia: false,
        supportsMint: false,
        supportsThreading: false,
        requiresAuth: false,
        requiresWallet: false,
        transport: 'POST https://pointcast.xyz/api/ping (pc-ping-v1)',
      },
      {
        id: 'mastodon',
        displayName: 'Mastodon',
        shortCode: 'MA',
        supportedBlockTypes: ['READ', 'NOTE', 'LISTEN', 'WATCH', 'LINK', 'VISIT'],
        maxTextLength: 500,
        supportsMedia: true,
        supportsMint: false,
        supportsThreading: true,
        requiresAuth: true,
        requiresWallet: false,
        auth_model: 'Access token (app password) in Keychain',
        transport: 'POST https://<instance>/api/v1/statuses',
      },
      {
        id: 'farcaster',
        displayName: 'Farcaster',
        shortCode: 'FC',
        supportedBlockTypes: ['READ', 'NOTE', 'LISTEN', 'WATCH', 'LINK', 'VISIT', 'MINT', 'FAUCET'],
        maxTextLength: 320,
        supportsMedia: true,
        supportsMint: false,
        supportsThreading: true,
        requiresAuth: true,
        requiresWallet: false,
        auth_model: 'Neynar managed signer (API key + signer UUID)',
        transport: 'POST https://api.neynar.com/v2/farcaster/cast',
      },
      {
        id: 'bitchat',
        displayName: 'bitchat',
        shortCode: 'BC',
        supportedBlockTypes: ['READ', 'NOTE', 'LINK', 'VISIT'],
        maxTextLength: 280,
        supportsMedia: false,
        supportsMint: false,
        supportsThreading: true,
        requiresAuth: true,
        requiresWallet: false,
        auth_model: 'secp256k1 nsec in Keychain (signer live as of v1.0 via NostrLocalSigner)',
        transport: 'WSS ["EVENT", <NIP-01 kind:1>] → relay pool',
        default_relays: [
          'wss://relay.damus.io',
          'wss://relay.primal.net',
          'wss://nos.lol',
        ],
        mesh_note:
          'bitchat\'s BLE mesh is device-local; desktop Magpie broadcasts via bitchat\'s Nostr internet transport. Mesh delivery happens when any peer bridges.',
      },
      {
        id: 'zora',
        displayName: 'Zora',
        shortCode: 'ZO',
        supportedBlockTypes: ['MINT', 'LISTEN', 'WATCH'],
        maxTextLength: 4000,
        supportsMedia: true,
        supportsMint: true,
        supportsThreading: false,
        requiresAuth: false,
        requiresWallet: true,
        maxMediaCount: 1,
        supportedMediaTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        auth_model: 'EVM wallet (the wallet IS the auth)',
        chain: 'Base (default) | Zora Network',
        transport: 'ZoraCoinFactory.createCoin — ERC-1155 Coin minted on Base via BaseRPC, signed by EVMSigner (EIP-1559 tx)',
        ship_status: 'v1.1 — end-to-end minting live (ZoraMintService: Pinata pin → calldata → EIP-1559 tx → BaseRPC submit → receipt parse → zora.co permalink)',
      },
      {
        id: 'objkt',
        displayName: 'Objkt',
        shortCode: 'OB',
        supportedBlockTypes: ['MINT', 'LISTEN', 'WATCH'],
        maxTextLength: 5000,
        supportsMedia: true,
        supportsMint: true,
        supportsThreading: false,
        requiresAuth: false,
        requiresWallet: true,
        maxMediaCount: 1,
        supportedMediaTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        auth_model: 'Tezos wallet (the wallet IS the auth)',
        chain: 'Tezos mainnet',
        contracts: {
          default: 'teia',
          supported: ['teia', 'typed', 'versum', 'fxhash'],
        },
        transport: 'Teia FA2 mint_OBJKT — Michelson params, forged via TezosRPC, signed via TezosSigner ed25519, injected to /injection/operation',
        ship_status: 'v1.1 — end-to-end minting live (ObjktMintService: Pinata pin → Michelson encode → forge → sign → inject → objkt.com permalink)',
      },
      {
        id: 'bluesky',
        displayName: 'Bluesky',
        shortCode: 'BS',
        supportedBlockTypes: ['READ', 'NOTE', 'LISTEN', 'WATCH', 'LINK', 'VISIT'],
        maxTextLength: 300,
        supportsMedia: true,
        supportsMint: false,
        supportsThreading: true,
        requiresAuth: true,
        requiresWallet: false,
        maxMediaCount: 4,
        supportedMediaTypes: ['image/png', 'image/jpeg'],
        auth_model: 'App password → session JWT (cached in Keychain)',
        transport: 'POST https://bsky.social/xrpc/com.atproto.repo.createRecord (+ uploadBlob for images)',
      },
      {
        id: 'twitter',
        displayName: 'Twitter / X',
        shortCode: 'TW',
        supportedBlockTypes: ['READ', 'NOTE', 'LISTEN', 'WATCH', 'LINK', 'VISIT'],
        maxTextLength: 280,
        supportsMedia: true,
        supportsMint: false,
        supportsThreading: true,
        requiresAuth: true,
        requiresWallet: false,
        auth_model: 'OAuth 2.0 PKCE via MagpieServer /oauth/callback/twitter',
        transport: 'POST https://api.twitter.com/2/tweets (+ v1.1 INIT/APPEND/FINALIZE for media)',
        ship_status: 'v1.0 — text + threading + media upload live',
      },
      {
        id: 'linkedin',
        displayName: 'LinkedIn',
        shortCode: 'LI',
        supportedBlockTypes: ['READ', 'NOTE', 'LINK'],
        maxTextLength: 3000,
        supportsMedia: false,
        supportsMint: false,
        supportsThreading: false,
        requiresAuth: true,
        requiresWallet: false,
        auth_model: 'OAuth 2.0 via MagpieServer /oauth/callback/linkedin (resolves author URN)',
        transport: 'POST https://api.linkedin.com/v2/ugcPosts',
      },
      {
        id: 'instagram',
        displayName: 'Instagram',
        shortCode: 'IG',
        supportedBlockTypes: ['LISTEN', 'WATCH', 'LINK', 'VISIT', 'MINT'],
        maxTextLength: 2200,
        supportsMedia: true,
        supportsMint: false,
        supportsThreading: false,
        requiresAuth: true,
        requiresWallet: false,
        maxMediaCount: 10,
        supportedMediaTypes: ['image/jpeg', 'image/png'],
        auth_model: 'Meta for Developers OAuth (Business/Creator account + Facebook Page link)',
        transport: 'Graph API: /{ig-user-id}/media → /{ig-user-id}/media_publish',
        ship_status: 'v0.10 skeleton — capability shape + OAuth flow scaffolding; publish() throws until Graph API wiring completes',
      },
      {
        id: 'opensea',
        displayName: 'OpenSea',
        shortCode: 'OS',
        supportedBlockTypes: ['MINT', 'LINK'],
        maxTextLength: 1000,
        supportsMedia: false,
        supportsMint: false,
        supportsThreading: false,
        requiresAuth: true,
        requiresWallet: true,
        auth_model: 'EVM wallet (listing sig) + OpenSea API key',
        chain: 'Ethereum | Base | Polygon | Zora Network',
        transport: 'Seaport listing order → POST /api/v2/orders/{chain}/opensea/listings',
        semantics: 'listing, not mint — use Zora for minting, then OpenSea for secondary reach',
        ship_status: 'v0.10 skeleton — wallet-gated; waits on EVMSigner real impl',
      },
    ],

    // The protocol the local peer-node speaks back to us for broadcast.
    // POST /broadcast body = { clipID, destinations[], title?, dek?, body?, channel?, blockType?, overrides? }
    // Response = { ok, clipID, results[] } where results[] is one per
    // destination with { publisher, success, summary?, permalink?, error? }.
    broadcast_protocol: {
      method: 'POST',
      path: '/broadcast',
      request: {
        clipID: 'Int64 — id returned in /clips.json',
        destinations: 'Array<string> — PublisherID rawValues (pointcast, mastodon, ...)',
        title: 'optional string',
        dek: 'optional one-line string',
        body: 'optional string — defaults to clip.contentText',
        channel: 'optional PointCast channel code',
        blockType: 'optional block type override',
        overrides: 'optional { [publisherID]: string } — per-platform body',
      },
      response: {
        ok: 'bool',
        clipID: 'Int64',
        results: 'Array<{ publisher, success, summary?, permalink?, error? }>',
      },
      example_request: {
        clipID: 42,
        destinations: ['pointcast', 'mastodon', 'farcaster', 'bitchat'],
        title: 'The front door is agentic',
        dek: 'a single canonical home, syndicated to many',
        overrides: {
          farcaster: 'short take: the front door is agentic 🪶',
          bitchat: 'the front door is agentic — home on PointCast, echoed to the mesh',
        },
      },
    },

    // Legacy single-target publish (unchanged — for clients not using
    // the multi-destination broadcast API).
    publish: {
      endpoint: 'https://pointcast.xyz/api/ping',
      schema: 'pc-ping-v1',
      fields: {
        type: 'pc-ping-v1',
        subject: 'string, <= 120 chars (enriched title when available)',
        body: 'string, <= 4000 chars',
        from: 'optional display name',
        address: 'optional Tezos tz/KT address',
        timestamp: 'ISO 8601',
        expand: 'bool — when true, cc drafts a PointCast block on next tick',
        channel: 'optional PointCast channel code (FD/CRT/SPN/GF/...)',
        blockType: 'optional block type (READ/NOTE/LISTEN/...)',
        dek: 'optional one-line framing',
        sourceUrl: 'optional canonical URL of the captured thing',
        sourceApp: 'optional name of the app the clip came from',
      },
    },

    // Block-type inference used by the UI for the kicker + default
    // channel when expanding.
    block_type_inference: {
      LISTEN: ['spotify', 'soundcloud', 'music.apple', 'bandcamp', 'tidal', 'anchor.fm'],
      WATCH: ['youtube', 'youtu.be', 'vimeo', 'twitch', 'loom.com', 'tiktok.com'],
      NOTE: ['x.com', 'twitter.com', 'warpcast', 'bsky.app', 'threads.net', 'mastodon', 'farcaster'],
      MINT: ['objkt', 'teia.art', 'fxhash', 'zora.co', 'manifold', 'opensea', 'foundation.app'],
      VISIT: ['maps.google', 'google.com/maps', 'apple.com/maps', 'yelp.com'],
      READ: ['github', 'medium', 'substack', 'nytimes', 'bloomberg', 'wsj', 'wired', 'theverge', 'stratechery', 'pointcast'],
      LINK: 'default for URLs not matching the above',
      NOTE_fallback: 'plain text under 240 chars',
      READ_fallback: 'plain text over 240 chars',
    },

    install_steps: [
      'Download the latest build from https://github.com/Good-Feels/magpie/releases/latest.',
      'Drag Magpie.app to /Applications and launch it.',
      'Grant clipboard access when prompted.',
      'Open Preferences → PointCast → enable "Serve local web UI".',
      'Confirm the PointCast endpoint. Preferences → PointCast → Connection ships pre-filled with https://pointcast.xyz/api/ping — tap "Test Connection" to verify. Change it here only if you run a fork or a local broadcast. The hosted /magpie UI reads this from the peer-node\'s /config.json.',
      'Add destinations (optional): Preferences → Mastodon / Farcaster / bitchat / Bluesky / Twitter / LinkedIn / Instagram.',
      'For wallets: Preferences → Wallets → Generate or import Tezos / EVM keys (used by Objkt + Zora).',
      'For IPFS: Preferences → IPFS → paste Pinata JWT (used for Farcaster embeds + mint metadata).',
      'Return to https://pointcast.xyz/magpie — it connects automatically.',
    ],

    cli: {
      package: 'magpie-cli',
      commands: {
        list: 'List recent clips.',
        search: 'Search the archive.',
        push: 'Push a clip to the PointCast inbox.',
        expand: 'Push with expand=true — cc drafts a block next tick.',
        broadcast: 'Fan-out a clip to multiple publishers: magpie broadcast <id> --to pointcast,mastodon,farcaster',
        schedule: 'Queue a future broadcast via /api/schedule: magpie schedule <id> --to pointcast --at 2026-04-22T09:00:00Z',
        activity: 'Show recent publish outcomes.',
        summary: 'One-glance 30-day recap — totals, per-destination rates, block-type split.',
        scheduled: 'Show pending scheduled broadcasts.',
        drafts: 'Show the failed-publish retry queue.',
        retry: 'Retry a queued draft by its pending ID (first 8 chars work).',
        copy: "Copy a clip's text to the system pasteboard.",
        health: 'Probe the peer-node server.',
      },
    },

    roadmap: {
      'v0.6':  'Multi-publisher broadcast. Three destinations: PointCast (canonical), Mastodon, Farcaster.',
      'v0.6.1': 'bitchat adapter (Nostr transport). NIP-01 kind:1 notes fanned across a configurable relay pool.',
      'v0.7':  'Twitter/X + LinkedIn + Bluesky. OAuth 2.0 PKCE via MagpieServer /oauth/callback. Draft retry queue. Per-destination body overrides.',
      'v0.8':  'Image attachments across Mastodon/Bluesky/Farcaster. Scheduled broadcasts (local). Activity log. 24 regression guards.',
      'v0.9':  'Wallet infra: EVMSigner + TezosSigner + WalletRegistry + PinataClient. Zora + Objkt skeletons. /api/schedule cloud scheduler. CLI schedule. Farcaster IPFS staging.',
      'v0.10': 'Cron dispatcher on Cloudflare. Peer-node activity/scheduled/drafts/retry/summary routes. CLI activity/scheduled/retry/summary. Instagram + OpenSea skeletons. Composer clip context + destination presets + keyboard shortcuts. Reach dashboard. macOS notifications. Draft retry-all. Age-based retention. Hosted /magpie/activity page.',
      'v1.0': 'Interactive tour + long-form guide + in-app MagpieTourSheet. secp256k1.swift dep landed: real EVMSigner (ECDSA + Keccak256 + EIP-55 addresses), real NostrLocalSigner (BIP-340 Schnorr) activates bitchat broadcasting. Twitter v1.1 INIT/APPEND/FINALIZE media upload. Encrypted credential forwarding (AES-GCM-256).',
      'v1.0 GTM': 'Launch kit: /magpie/launch hero, /magpie/pitch 90-second overview, /magpie/faq (23 Q&As), /magpie/press, /magpie/changelog (70 ships indexed). Twitter thread + Farcaster cast + Show HN post + PointCast dogfood block + internal launch playbook.',
      'v1.1 (shipping)': 'On-chain fully wired. BaseRPC (pure Swift JSON-RPC) + RLP encoder + EIP-1559 tx builder → ZoraMintService end-to-end (Pinata pin → createCoin calldata → signed tx → BaseRPC → receipt parse). TezosRPC + Michelson encoder → ObjktMintService end-to-end (forge → sign → inject). Video + audio attachment types with MIME sniffing. magpie-mcp stdio server — Claude/Claude Code surface 8 tools (list_clips, search_clips, get_summary, get_activity, get_scheduled, get_drafts, broadcast_clip, retry_draft). 30 more regression guards.',
      'v1.2':  'Instagram Graph API media_publish. OpenSea Seaport order signing. Hardware wallet bridges (Beacon + WalletConnect). Cloud dispatcher expands to all encrypted-forwarding destinations. Proper ABI encoder for complex Zora contract calls.',
    },

    citation_format: {
      human: 'PointCast · CH.{CODE} · № {ID} — "{TITLE}" · {YYYY-MM-DD}',
      example: 'PointCast · CH.FD · № 0205 — "The front door is agentic" · 2026-04-14',
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
