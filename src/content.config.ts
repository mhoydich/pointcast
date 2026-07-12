import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

/**
 * blocks — v2 primary collection.
 *
 * Every piece of content on PointCast is a Block. Schema follows BLOCKS.md
 * at the repo root. Each block is a JSON file in `src/content/blocks/`
 * named by its zero-padded 4-digit ID (e.g. `0205.json`).
 *
 * IDs are immutable and monotonically increasing across the archive. Never
 * reuse, never renumber. A retired block 404s — its ID is never handed to
 * something else.
 */
const blocks = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/blocks' }),
  schema: z.object({
    id: z.string().regex(/^\d{4}$/, 'id must be 4-digit zero-padded string'),
    channel: z.enum(['FD', 'CRT', 'SPN', 'GF', 'GDN', 'ESC', 'FCT', 'VST', 'BTL', 'BDY']),
    type: z.enum(['READ', 'LISTEN', 'WATCH', 'MINT', 'FAUCET', 'NOTE', 'VISIT', 'LINK', 'TALK', 'BIRTHDAY']),
    title: z.string(),
    body: z.string().optional(),
    timestamp: z.coerce.date(),
    size: z.enum(['1x1', '2x1', '1x2', '2x2', '3x2']).default('1x1'),
    // Nouns are minted daily forever — no hard upper cap. A lower bound of 0
    // catches negative seeds. If noun.pics starts 404ing for a specific seed
    // BlockCard's img onerror handler degrades to the dotted frame.
    noun: z.number().int().min(0).optional(),

    // Edition / mint metadata (Tezos-only in v2)
    edition: z
      .object({
        supply: z.union([z.number().int().positive(), z.literal('open')]),
        minted: z.number().int().min(0).default(0),
        price: z.union([
          z.object({ tez: z.number().nonnegative().optional(), usd: z.number().nonnegative().optional() }),
          z.literal('free'),
        ]),
        chain: z.literal('tezos').default('tezos'),
        contract: z.string().regex(/^KT1[A-Za-z0-9]{33}$/, 'contract must be a KT1 address'),
        tokenId: z.number().int().min(0),
        marketplace: z.enum(['objkt', 'fxhash', 'teia']).optional(),
      })
      .optional(),

    // Spend / Link receipt metadata — added 2026-04-30 per #262.
    // Sibling to `edition`. A Block carrying both is a "dual-rail" block:
    // edition is the on-chain identity of the artifact (Tezos);
    // spend is the off-chain receipt of what funded it (Stripe Link).
    // Populated by the Link webhook on settled spend requests.
    //
    // 2026-05-01 future-think additions:
    //   - `payee_agent` field — for the +12-18mo agent-to-agent payment
    //     primitive (my Codex pays your Codex for a packaged service).
    //     Today every spend has agent (who paid) and merchant (who got paid,
    //     a third-party). Tomorrow some spends will have payee_agent
    //     (who got paid, another agent-as-economic-subject).
    //   - `mcp_server_id` field — for the same era when residents call
    //     payments natively as MCP tools (link-cli mcp add) rather than
    //     shelling out via this script. Carries the agent's MCP identity.
    spend: z
      .object({
        agent: z.enum(['claude', 'codex', 'manus', 'cc']),
        // payee_agent — present when this spend was an agent-to-agent payment
        // rather than agent-to-merchant. agent and payee_agent both being set
        // means the spend has no third-party merchant; merchant = the recipient
        // agent's identity. The +12-18mo inversion lives in this field.
        payee_agent: z.enum(['claude', 'codex', 'manus', 'cc']).optional(),
        loop: z.string().min(1),                                 // see src/lib/agent-value.ts loop ids
        amount_usd: z.number().nonnegative().max(500),           // link-cli max is $500/req
        currency: z.string().default('usd'),
        merchant: z.string().min(1),                             // e.g. "replicate.com"
        merchant_url: z.string().url().optional(),
        credential_type: z.enum(['card', 'shared_payment_token']).default('shared_payment_token'),
        // Status enum mirrors link-cli's actual status values verified 2026-04-30.
        // 'pending_approval' is the initial state from `create`; transitions to
        // 'approved' / 'denied' / 'expired' on user action; 'settled' / 'refunded'
        // happen post-charge. 'pending'/'unknown' kept for historical receipts.
        status: z.enum(['pending', 'pending_approval', 'approved', 'denied', 'expired', 'settled', 'refunded', 'unknown']),
        link_session_id: z.string().default(''),                 // settled.id from link-cli (lsrq_xxx prefix). may be '' for pre-2026-04-30 historical blocks.
        approval_url: z.string().url().optional(),               // app.link.com/activity/approve/{id} — present while pending_approval
        receipt_url: z.string().url().optional(),                // Stripe-hosted receipt
        approved_by: z.string().optional(),                      // future: visitor handle when v1 multi-tenant
        // agent_id — globally-unique stable identity for the agent that fired
        // this spend. Format: pcr_<10-char-base32>. Source-of-truth at
        // src/data/agent-identities.json. The +6-12mo reputation primitive
        // from Block 0420. Optional today (older receipts won't have it);
        // forward receipts auto-populate via scripts/agent-spend.mjs.
        agent_id: z.string().regex(/^pcr_[a-z0-9]{8,}$/).optional(),
        payee_agent_id: z.string().regex(/^pcr_[a-z0-9]{8,}$/).optional(), // when the spend is agent-to-agent
        // Cryptographic signature over the canonical manifest (per spec
        // pointcast.agent-payments/v1). Ed25519. Public key resolved from
        // src/data/agent-identities.json via spend.agent_id. Verifies that
        // the signer holds the private key matching the claimed identity.
        // Optional (older receipts unsigned); forward receipts auto-sign
        // via scripts/agent-spend.mjs when the resident has a key minted.
        // Manifest fields signed: see src/lib/agent-signing.mjs MANIFEST_FIELDS.
        signature: z.string().optional(),
        signing_alg: z.literal('ed25519').optional(),
        spec: z.string().optional(),
        // Card-credential metadata captured from `retrieve --include card`.
        // Never store the full PAN here — that lives only in ~/.link-cli-receipts/{id}.json (0600).
        card_last4: z.string().regex(/^\d{4}$/).optional(),
        card_brand: z.string().optional(),                       // e.g. 'visa', 'mastercard'
        card_valid_until: z.string().optional(),                 // ISO timestamp; credential expiration
        mode: z.enum(['test', 'live']).default('test'),          // v0 ships in test mode
        context: z.string().optional(),                          // user-facing approval blurb (>=100 chars per CLI)
        // mcp_server_id — set when the spend was initiated through link-cli's
        // MCP server integration rather than this script's shell-out. v0+1
        // residents will register link-cli as an MCP server (link-cli mcp add)
        // and call spend tools natively. We capture the server id so receipts
        // can be attributed to the integration surface that fired them.
        mcp_server_id: z.string().optional(),
      })
      .optional(),

    // Payouts — added 2026-05-01 as forward-thinking scaffolding. The
    // +18-24mo end-state from the agent-payments proposal: when an artifact
    // *earns* (sponsorship, mint sale, ad), an automatic split fires across
    // the human + the agents that contributed.
    //
    // Today no Block on PointCast carries this field — we don't earn revenue
    // on individual artifacts yet. Schema landed early so the day a Block
    // does, we don't need a migration. A Block carrying `spend` AND `edition`
    // AND `payouts` is the fully-realized loop: cost is recorded, identity
    // is on-chain, revenue split is programmable.
    //
    // Validation: shares must sum to <= 1.0 (allows future fee/treasury cut
    // to absorb the residual). Each entry has either a human handle or an
    // agent identity, plus the share fraction.
    payouts: z
      .array(
        z.object({
          to: z.string().min(1),                                 // 'mike' / 'codex' / 'manus' / 'mh+cc' / arbitrary handle
          to_kind: z.enum(['human', 'agent', 'treasury', 'external']).default('agent'),
          share: z.number().min(0).max(1),                       // fraction 0.0-1.0
          rationale: z.string().optional(),                      // e.g. "scouted the lead", "wrote the prose", "minted the art"
          paid_out: z.boolean().default(false),                  // true once the split has fired
          paid_at: z.string().optional(),                        // ISO timestamp when split fired
          link_session_id: z.string().optional(),                // future: split lands as its own spend-request when that's the rail
        }),
      )
      .max(8)                                                    // generous; most splits will be 2-4 way
      .refine((items) => items.reduce((s, x) => s + x.share, 0) <= 1.0001, {
        message: 'payout shares must sum to <= 1.0',
      })
      .optional(),

    media: z
      .object({
        kind: z.enum(['image', 'audio', 'video', 'embed']),
        src: z.string(),
        /** Optional preview thumbnail. Used on the home grid for WATCH
         *  blocks so the card shows a video poster instead of just a
         *  facade chip. YouTube: img.youtube.com/vi/{id}/hqdefault.jpg. */
        thumbnail: z.string().optional(),
        /** Optional IPFS fallback URL if the primary CDN fails. */
        ipfsFallback: z.string().optional(),
        /** YeePlayer beat map — optional rhythm-game overlay. When present,
         *  the block gets a companion page at /yee/{id} that runs a static
         *  Guitar-Hero × karaoke session over the video. Beats are pure
         *  content: { t: seconds-from-start, word: visible bija/cue,
         *  color?: chakra hex, key?: keyboard hint } and the player is
         *  fully client-side (YouTube IFrame API + requestAnimationFrame).
         *  Only WATCH-type blocks with embed media qualify.
         */
        beats: z
          .array(
            z.object({
              t: z.number().nonnegative(),
              word: z.string(),
              color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
              key: z.string().optional(),
              note: z.string().optional(),
            }),
          )
          .optional(),
      })
      .optional(),

    external: z
      .object({
        label: z.string(),
        url: z.string().url(),
      })
      .optional(),

    // Agent-readable tags. Free-form, but keys used consistently become a
    // de-facto tag taxonomy over time. Values accept strings, numbers,
    // booleans, or arrays of those — blocks like 0362 (AgarChat) stash
    // structured config here (modes[], features[], sprints as number),
    // and locking meta to string-only would force callers to stringify.
    meta: z.record(z.string(), z.any()).optional(),

    // READ-type specifics
    readingTime: z.string().optional(),   // e.g. "4 min"
    dek: z.string().optional(),           // one-line editorial subtitle

    // VISIT-type specifics (carried from v1's visit-drop concept)
    visitor: z
      .object({
        kind: z.enum(['human', 'agent']),
        name: z.string().optional(),       // handle or display name
        vendor: z.string().optional(),     // "Claude", "Perplexity", etc.
        geo: z.string().optional(),        // city or region
        nounId: z.number().int().optional(),
      })
      .optional(),

    /**
     * Voice attribution. Per VOICE.md (added 2026-04-18): default author is
     * 'cc' (Claude Code). To carry 'mike' as the byline, the block MUST also
     * set `source` to the literal text or location of Mike's directive
     * (e.g. "chat 2026-04-18 mid-morning" or "voice note 2026-04-19"). This
     * exists to prevent Mike's voice from being invented when there's no
     * review gate — see AGENTS.md "Reads on every session" pattern.
     *
     * Codex review enforces: any block with author='mike' missing `source`
     * fails review. Any new block defaulting author='cc' is the safe path.
     */
    author: z.enum(['cc', 'mike', 'mh+cc', 'codex', 'manus', 'guest']).default('cc'),
    source: z.string().optional(),

    /**
     * Companion surfaces — lightweight cross-link list. When present, /b/{id}
     * renders a COMPANIONS strip pointing at related blocks / YeePlayer
     * titles / polls / external URLs. Max 12 entries. surface is a display
     * hint: 'yee' → /yee/{id}, 'poll' → /poll/{id}, 'external' → use id as
     * full URL, default 'block' → /b/{id}.
     */
    companions: z.array(z.object({
      id: z.string().min(1).max(80),
      label: z.string().min(1).max(80),
      surface: z.enum(['yee', 'poll', 'clock', 'block', 'external']).optional(),
    })).max(12).optional(),

    /** Optional widget — when set, /clock/{id} renders a live world-clock
     *  companion page. Zones resolve from COLLABORATORS (when
     *  includeCollaborators is true) merged with manual `zones` extras. */
    clock: z
      .object({
        includeCollaborators: z.boolean().default(true),
        zones: z.array(z.object({
          tz: z.string(),
          label: z.string(),
          sublabel: z.string().optional(),
          lat: z.number().min(-90).max(90).optional(),
          lon: z.number().min(-180).max(180).optional(),
          region: z.string().max(60).optional(),
          tags: z.array(z.string()).max(8).optional(),
          /** Place stats — population, elevation, nearest-water, etc. */
          facts: z.record(z.string(), z.string()).optional(),
          /** Time-of-day rituals (local clock). "from <= to" = same-day
           *  window; "from > to" = wraps past midnight. */
          rituals: z
            .array(
              z.object({
                from: z.string().regex(/^\d{2}:\d{2}$/),
                to: z.string().regex(/^\d{2}:\d{2}$/),
                label: z.string().max(80),
                glyph: z.string().max(4).optional(),
                data: z.string().max(140).optional(),
              }),
            )
            .max(16)
            .optional(),
          /** One-line seasonal flavor line. */
          seasonal: z.string().max(120).optional(),
          /** Iconic nearby places — landmarks, restaurants, institutions. */
          landmarks: z.array(z.string().max(80)).max(10).optional(),
          /** '12' (AM/PM) or '24' (hour). Defaults per zone at render. */
          timeFormat: z.enum(['12', '24']).optional(),
        })).max(20).optional(),
        style: z.enum(['digital', 'analog', 'both']).default('digital'),
      })
      .optional(),

    /**
     * Mood tag — free-text slug describing emotional/tonal register. Renders
     * as a chip on /b/{id} and powers /mood/{slug} filter pages that list
     * every block sharing the same tag. Slug convention: lowercase with
     * hyphens, e.g. "rainy-week", "pre-shop-ritual", "late-night-calm".
     * Named follow-up from sprint `10pm-bundle` (2026-04-18).
     */
    mood: z.string().regex(/^[a-z0-9][a-z0-9-]{0,38}$/, 'mood must be lowercase-hyphen slug, max 40 chars').optional(),

    draft: z.boolean().default(false),

    /**
     * Article quality gate (Mike 2026-05-12: "articles are eh").
     *
     * `featured: true` is the OPT-IN flag that lets a block claim the
     * homepage LEAD slot. Without it the LEAD chain goes:
     *   1. Morning Hero (data/morning-hero.json, has entry for today)
     *   2. Ship-as-lead (recent-ships.json — most recent feature PR)
     *   3. Latest featured block (this flag = true)
     *   4. Last-resort fallback (latest block of any kind)
     *
     * Default false means generic agent-authored articles do NOT
     * automatically claim the hero. Only blocks Mike or an agent
     * explicitly marks featured: true can take the LEAD over a ship.
     *
     * Set when: the block is genuinely good and represents the
     * editorial moment. Honor system; codex-review can enforce
     * if it ever gets abused.
     */
    featured: z.boolean().default(false),
  }),
});

/**
 * products — the Good Feels SEO foothold.
 *
 * Mike 2026-04-18: Good Feels is the day job. PointCast already carries
 * agent-discovery trust (stripped HTML mode, /agents.json, /llms.txt).
 * Exposing a structured /products surface lets crawlers find Good Feels
 * through us with proper schema.org Product markup.
 *
 * Authoring: each product is a JSON file at src/content/products/{slug}.json.
 * Mike (or cc, on Mike's directive via /drop) adds entries; PR them in.
 * Default `brand` is "Good Feels" — override for any non-shop products.
 */
const products = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,60}$/, 'slug must be lowercase alphanumeric + hyphens'),
    name: z.string().min(1).max(140),
    description: z.string().min(1).max(1200),
    /** Authoritative URL on the shop. Required so we never become a checkout. */
    url: z.string().url(),
    brand: z.string().default('Good Feels'),
    /** One or more image URLs — first one is the hero. */
    image: z.array(z.string().url()).optional(),
    /** Price in USD by default; if absent, page reads "see shop". */
    priceUsd: z.number().nonnegative().optional(),
    currency: z.string().length(3).default('USD'),
    availability: z.enum(['in-stock', 'out-of-stock', 'preorder', 'discontinued']).default('in-stock'),
    /** Free-form category — typically: tincture, edible, topical, accessory, bundle. */
    category: z.string().optional(),
    /** Optional effect / mood tags — short, descriptive. */
    effects: z.array(z.string()).optional(),
    /** Optional ingredients list. */
    ingredients: z.array(z.string()).optional(),
    /** Optional one-line subtitle. */
    dek: z.string().max(200).optional(),
    /** Concise per-serving cannabinoid summary, e.g. "5mg THC + 1mg CBD". */
    serving: z.string().max(120).optional(),
    /** Mood slugs this product pairs with. Drives /pairings/{mood} cross-index —
     *  a block with mood `late-night-calm` and a product with that slug in
     *  pairsWithMood co-surface on the same pairing page. Same slug shape
     *  as block.mood (lowercase-hyphen, max 40 chars). */
    pairsWithMood: z.array(z.string().regex(/^[a-z0-9][a-z0-9-]{0,38}$/)).max(8).optional(),
    /** Optional Sonic Postcard profile slug OR block id — the soundtrack
     *  this product plays against. Procedural profiles: el-segundo, medway,
     *  nyc, london, mallorca, istanbul, tokyo, mexico-city. */
    vibeProfile: z.string().max(60).optional(),
    /** When this entry was first added to PointCast. */
    addedAt: z.coerce.date(),
    /** Last upstream catalog update, when the source exposes one. */
    updatedAt: z.coerce.date().optional(),
    /** Author + source — same VOICE.md rules as blocks. Default cc; if
     *  Mike personally curated, set author='mike' + source. */
    author: z.enum(['cc', 'mike', 'mh+cc', 'codex', 'manus', 'guest']).default('cc'),
    source: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

/**
 * polls — Schelling-point coordination polls.
 *
 * Mike 2026-04-18 (block 0272 directive via /ping): "shelling points".
 *
 * A poll is a question with N fixed options where the WIN condition is
 * "guess the most popular answer", not "guess the right answer". Reveals
 * collective focal points. Coordination game over content.
 *
 * Authoring: each poll is a JSON file at src/content/polls/{slug}.json.
 * Votes go to /api/poll → PC_POLLS_KV (bound in wrangler.toml).
 * Per-address vote dedup. Distribution visible after vote.
 */
const polls = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/polls' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,60}$/, 'slug must be lowercase alphanumeric + hyphens'),
    question: z.string().min(8).max(280),
    /** 3-7 options. The Schelling property breaks down with 1-2 (no game) or 8+ (no focal point). */
    options: z.array(z.object({
      id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,30}$/, 'option id must be slug-shaped'),
      label: z.string().min(1).max(120),
      hint: z.string().max(200).optional(),
    })).min(3).max(7),
    /** Editorial framing — what kind of focal point we're hunting. */
    dek: z.string().max(280).optional(),
    /** Optional close date. After this, votes are rejected (read-only display). */
    closesAt: z.coerce.date().optional(),
    openedAt: z.coerce.date(),
    /** When true, anyone can vote without an address. When false, address required. */
    anonymous: z.boolean().default(true),
    /** Poll purpose — does the result do something downstream? See /polls philosophy. */
    purpose: z.enum(['coordination', 'utility', 'editorial', 'decision', 'forecast']).default('coordination'),
    /** One-sentence concrete consequence when a leader emerges. */
    outcomeAction: z.string().max(280).optional(),
    /** Forecast mode — when set, poll has future resolution date. UI shows countdown. */
    resolvesAt: z.coerce.date().optional(),
    resolved: z.object({
      at: z.coerce.date(),
      correctOption: z.string().optional(),
      note: z.string().max(400).optional(),
    }).optional(),
    /** Zeitgeist mode — cultural snapshot, never resolves. Persists as a record of the moment. */
    zeitgeist: z.boolean().default(false),
    /** Per-option follow-ups. Keys are option.id, values are poll slugs.
     *  When a voter picks option X, /poll/{slug} reveals a "next on this
     *  pathway" card linking to followUps[X]. Creates branching poll graphs
     *  without mutating the linear vote flow. Invalid slugs are dropped at
     *  render time (no hard error). Max 7 (matches options). */
    followUps: z.record(z.string(), z.string()).optional(),
    /** Sibling polls — rendered as an "other ways in" rail on the poll page.
     *  Multiple start points into the same zeitgeist network. Always visible
     *  (not gated by vote). Poll slugs only; missing slugs are skipped. */
    related: z.array(z.string()).max(6).optional(),
    author: z.enum(['cc', 'mike', 'mh+cc', 'codex', 'manus', 'guest']).default('cc'),
    source: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

/* ----- v2 collection re-export at end of file ----- */

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    type: z.enum(['article', 'essay', 'art', 'newsletter']).default('article'),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    stack: z.array(z.string()).default([]),
    link: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const drops = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/drops' }),
  schema: z.object({
    date: z.coerce.date(),
    type: z.enum([
      'spotify', 'link', 'note', 'quote', 'image', 'visit',
      'video', 'twitch', 'tumblr', 'twitter', 'instagram',
      'arena', 'objkt', 'fxhash', 'mirror', 'generic',
    ]),
    title: z.string().optional(),
    url: z.string().optional(),
    caption: z.string().optional(),
    attribution: z.string().optional(),
    nounId: z.number().optional(),
    readSlug: z.string().optional(),
    readTitle: z.string().optional(),
    becameDispatch: z.string().optional(),
    model: z.string().optional(),
    variant: z.enum(['compact', 'full', 'auto']).optional(),
    image: z.string().optional(),
    artist: z.string().optional(),
    supply: z.number().optional(),
    priceXtz: z.number().optional(),
    contract: z.string().optional(),
    tokenId: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

/**
 * gallery — Midjourney + AI-art slideshow viewer. Per Mike 2026-04-18.
 * Each entry: slug, title, imageUrl, tool (mj/ideogram/sora/runway/nouns),
 * optional mood (slug for /mood/{slug}), createdAt, author/source.
 */
const gallery = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/gallery' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,60}$/),
    title: z.string().min(1).max(140),
    imageUrl: z.string(),
    promptSummary: z.string().max(280).optional(),
    tool: z.enum(['midjourney', 'ideogram', 'sora', 'runway', 'nouns', 'other']).default('midjourney'),
    mood: z.string().regex(/^[a-z0-9][a-z0-9-]{0,40}$/).optional(),
    createdAt: z.coerce.date(),
    author: z.enum(['cc', 'mike', 'mh+cc', 'codex', 'manus', 'guest']).default('mike'),
    source: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

/**
 * eth-legacy — retrospective of Mike's ~43 ETH/Polygon token deployments
 * (public-only columns, per /eth-legacy + src/content/eth-legacy/_README.md).
 */
const ethLegacy = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/eth-legacy' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,60}$/),
    name: z.string().min(1).max(200),
    ticker: z.string().max(60).optional().nullable(),
    deployer: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().nullable(),
    contract: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().nullable(),
    network: z.enum(['mainnet', 'ropsten', 'goerli', 'sepolia', 'polygon', 'unknown']).default('unknown'),
    notes: z.string().max(400).optional().nullable(),
    story: z.string().max(4000).optional(),
    addedAt: z.coerce.date(),
    author: z.enum(['cc', 'mike', 'mh+cc', 'codex', 'manus', 'guest']).default('mike'),
    source: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

/**
 * family — Fukunaga Hoydich family + named circle. Mike-curated, consented.
 * Per Mike 2026-04-19 direct chat confirmation ("names are fine, fukunaga
 * hoydich"). Names + optional Tezos addresses (opt-in, not required).
 * Private individuals should NEVER be added without Mike's explicit consent.
 */
const family = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/family' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,60}$/),
    name: z.string().min(1).max(140),
    role: z.enum(['family', 'circle', 'collaborator', 'honored-guest']).default('family'),
    /** Optional free-text relationship line — e.g. "south-bay pickleball partner". */
    relationship: z.string().max(200).optional(),
    /** Opt-in Tezos address. Leave empty until person shares it. */
    tezosAddress: z.string().regex(/^(tz|KT)[1-3][1-9A-HJ-NP-Za-km-z]{33}$/).optional(),
    /** Optional avatar — typically a noun.pics URL. */
    avatar: z.string().optional(),
    since: z.coerce.date().optional(),
    /** Optional birthday — MM-DD only. Year omitted on purpose (privacy +
     *  age-agnostic rendering). Drives /cake upcoming list and the per-person
     *  birthday-block annual cadence. Opt-in per person, same consent rule
     *  as tezosAddress. */
    birthday: z.string().regex(/^\d{2}-\d{2}$/, 'birthday must be MM-DD').optional(),
    /** Optional permanent Noun seed — locked in by the person's first
     *  birthday block. Same Noun is reused for every future birthday block,
     *  every avatar, every cross-link to them on PointCast. 0–1199 per
     *  noun.pics range. */
    permanentNoun: z.number().int().min(0).max(1199).optional(),
    /** When false, hidden from the public /family page. Default true per Mike's consent. */
    listed: z.boolean().default(true),
    author: z.enum(['cc', 'mike', 'mh+cc']).default('mh+cc'),
    source: z.string().optional(),
  }),
});

/**
 * mesh — federated-follow primitive.
 *
 * External PointCast-adjacent nodes (friend blogs, noun-adjacent projects,
 * sibling broadcasts) that PointCast points at. The complement to the
 * in-HUD imagined-peer list — mesh entries are real cross-links with
 * structured metadata so /mesh can render them as a network, and
 * /api/mesh.jsonl can syndicate the list to agents.
 *
 * Imagined peers stay valid as placeholders: set `status: 'imagined'`
 * when the node isn't real yet. Promote to `'live'` when the URL resolves.
 */
const mesh = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/mesh' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,60}$/),
    name: z.string().min(1).max(80),
    url: z.string().url(),
    feedUrl: z.string().url().optional(),
    /** What kind of node — broadcast, zine, gallery, dev bench, agent. */
    kind: z.enum(['blog', 'zine', 'broadcast', 'gallery', 'feed', 'bench', 'agent', 'node']).default('node'),
    /** Current reality status. 'imagined' = placeholder we're describing as
     *  if it exists; 'live' = real node resolving; 'archived' = was live,
     *  retired but kept for history. */
    status: z.enum(['imagined', 'live', 'archived']).default('imagined'),
    description: z.string().min(1).max(280),
    /** Trust/closeness tier — drives node ordering on the map. */
    trust: z.enum(['close', 'known', 'interesting', 'watching']).default('known'),
    /** Geographic hint (free text) and optional coordinates for /mesh geo view. */
    region: z.string().max(60).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
    /** Optional Sonic Postcard profile — if set, /mesh pipes its ambient. */
    vibeProfile: z.string().max(60).optional(),
    /** Optional Nouns avatar seed. */
    noun: z.number().int().min(0).optional(),
    /** Optional Tezos address — for future on-chain attestation. */
    tezosAddress: z.string().regex(/^(tz|KT)[1-3][1-9A-HJ-NP-Za-km-z]{33}$/).optional(),
    addedAt: z.coerce.date(),
    /** When false, hidden from /mesh — kept in collection but not rendered. */
    listed: z.boolean().default(true),
    author: z.enum(['cc', 'mike', 'mh+cc', 'codex', 'manus', 'guest']).default('cc'),
    source: z.string().optional(),
  }),
});

/**
 * seeingTheFuture — daily intelligence dispatch series.
 *
 * Lives in its own lane, parallel to `blocks` (per BLOCKS.md, channel
 * additions are a Mike-decision item; this surface has its own schema and
 * preserves per-vertical aesthetics via raw HTML bodies). Mounted at
 * /c/seeing-the-future/. One JSON file per dispatch at
 * src/content/seeing-the-future/{issue}.json, with a sibling .html body
 * file referenced by `bodyHtmlPath` so the dispatch's distinct inline-CSS
 * aesthetic survives unmodified.
 *
 * Issue numbers are series-local (0001-padded), monotonically increasing
 * within this series only — independent of the global block ID space.
 */
const seeingTheFuture = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/seeing-the-future' }),
  schema: z.object({
    /** Series-local issue number, zero-padded to 4 digits. */
    issue: z.string().regex(/^\d{4}$/, 'issue must be 4-digit zero-padded string'),
    /** Publication date — anchors day-of-week and rotation lookup. */
    date: z.coerce.date(),
    /** Locked vertical — drives palette, day, idiom. */
    vertical: z.enum([
      'cannabis',
      'ai-frontdoor',
      'pickleball',
      'hemp-thc',
      'streetwear',
      'recovery',
      'meridians',
    ]),
    /** Day-of-week shorthand. Must match vertical's locked day. */
    day: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
    /** Headline of the dispatch — pulled from the source HTML's hed/thesis. */
    thesis: z.string().min(1),
    /** 1-2 sentence summary of the dispatch's argument, used in feeds + list. */
    summary: z.string().min(1).max(600),
    /** Vertical's primary hex — denormalized for fast list rendering. */
    palette: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    /** Vertical's accent hex — denormalized. */
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    /** Block-shape carryover for cross-system parity. */
    blockType: z.literal('READ').default('READ'),
    mood: z.literal('morning').default('morning'),
    byline: z.string().default('MH × Opus 4.6'),
    /** Optional reading-time hint. */
    readingTime: z.string().optional(),
    /** Path to the raw HTML body, relative to this collection's base. */
    bodyHtmlPath: z.string().regex(/^[a-z0-9][a-z0-9-]*\.html$/),
    /** Original source filename + Cowork session for traceability. */
    source: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blocks, posts, projects, drops, products, polls, gallery, ethLegacy, family, mesh, seeingTheFuture };
