/**
 * /agents.json — the consolidated discovery manifest for AI agents.
 *
 * One endpoint that lists every machine-readable surface PointCast exposes
 * + live contract addresses + the stripped-HTML mode spec + citation format.
 * Agents that discover this file can map the whole site in a single request.
 *
 * This is the JSON sibling of /for-agents (which is the human-readable
 * manifest). Both are kept in sync on every build.
 *
 * Referenced from /for-agents, the site footer, and headers where useful.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { CHANNEL_LIST } from '../lib/channels';
import { BLOCK_TYPE_LIST } from '../lib/block-types';
import contracts from '../data/contracts.json';

export const GET: APIRoute = async () => {
  const blocks = await getCollection('blocks', ({ data }) => !data.draft);
  const since = blocks
    .map((b) => b.data.timestamp.getTime())
    .reduce((min, t) => (t < min ? t : min), Date.now());

  const visitNouns = ((contracts as any).visit_nouns?.mainnet ?? '').trim();
  const prizeCast = ((contracts as any).prize_cast?.mainnet ?? '').trim();
  const drumToken = ((contracts as any).drum_token?.mainnet ?? '').trim();
  const marketplace = ((contracts as any).marketplace?.mainnet ?? '').trim();

  const payload = {
    $schema: 'https://pointcast.xyz/BLOCKS.md',
    name: 'PointCast',
    description: 'A living broadcast from El Segundo — dispatches, faucets, visits, mints on Tezos.',
    homepage: 'https://pointcast.xyz',
    forAgents: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    blocksSince: new Date(since).toISOString().slice(0, 10),
    blocksCount: blocks.length,
    location: 'El Segundo, California, USA',
    language: 'en-US',
    license: 'CC0-flavored (see /for-agents for terms)',

    endpoints: {
      human: {
        home: 'https://pointcast.xyz/',
        manifesto: 'https://pointcast.xyz/manifesto',
        dao: 'https://pointcast.xyz/dao',
        yield: 'https://pointcast.xyz/yield',
        nounsCola: 'https://pointcast.xyz/nouns-cola',
        nounsColaCrush: 'https://pointcast.xyz/nouns-cola-crush',
        publish: 'https://pointcast.xyz/publish',
        beacon: 'https://pointcast.xyz/beacon',
        aiStack: 'https://pointcast.xyz/ai-stack',
        mesh: 'https://pointcast.xyz/mesh',
        yeePlayer: 'https://pointcast.xyz/yee',
        collabs: 'https://pointcast.xyz/collabs',
        collabsRelay: 'https://pointcast.xyz/collabs/relay',
        collabsArena: 'https://pointcast.xyz/collabs/arena',
        ping: 'https://pointcast.xyz/ping',
        sprint: 'https://pointcast.xyz/sprint',
        sprints: 'https://pointcast.xyz/sprints',
        drop: 'https://pointcast.xyz/drop',
        products: 'https://pointcast.xyz/products',
        polls: 'https://pointcast.xyz/polls',
        briefs: 'https://pointcast.xyz/briefs',
        gallery: 'https://pointcast.xyz/gallery',
        ethLegacy: 'https://pointcast.xyz/eth-legacy',
        glossary: 'https://pointcast.xyz/glossary',
        changelog: 'https://pointcast.xyz/changelog',
        archive: 'https://pointcast.xyz/archive',
        editions: 'https://pointcast.xyz/editions',
        collection: 'https://pointcast.xyz/collection',
        cast: 'https://pointcast.xyz/cast',
        drum: 'https://pointcast.xyz/drum',
        battle: 'https://pointcast.xyz/battle',
        now: 'https://pointcast.xyz/now',
        search: 'https://pointcast.xyz/search',
        random: 'https://pointcast.xyz/random',
        timeline: 'https://pointcast.xyz/timeline',
        status: 'https://pointcast.xyz/status',
        profile: 'https://pointcast.xyz/profile',
        family: 'https://pointcast.xyz/family',
        today: 'https://pointcast.xyz/today',
        moods: 'https://pointcast.xyz/moods',
        local: 'https://pointcast.xyz/local',
        nature: 'https://pointcast.xyz/nature',
        houseplants: 'https://pointcast.xyz/houseplants',
        tv: 'https://pointcast.xyz/tv',
        here: 'https://pointcast.xyz/here',
        forAgents: 'https://pointcast.xyz/for-agents',
        forNodes: 'https://pointcast.xyz/for-nodes',
      },
      json: {
        agents: 'https://pointcast.xyz/agents.json',
        blocks: 'https://pointcast.xyz/blocks.json',
        archive: 'https://pointcast.xyz/archive.json',
        editions: 'https://pointcast.xyz/editions.json',
        now: 'https://pointcast.xyz/now.json',
        cast: 'https://pointcast.xyz/cast.json',
        battle: 'https://pointcast.xyz/battle.json',
        timeline: 'https://pointcast.xyz/timeline.json',
        feed: 'https://pointcast.xyz/feed.json',
        random: 'https://pointcast.xyz/random.json',
        dao: 'https://pointcast.xyz/dao.json',
        yield: 'https://pointcast.xyz/yield.json',
        nounsCola: 'https://pointcast.xyz/nouns-cola.json',
        nounsColaCrush: 'https://pointcast.xyz/nouns-cola-crush.json',
        publish: 'https://pointcast.xyz/publish.json',
        beacon: 'https://pointcast.xyz/beacon.json',
        aiStack: 'https://pointcast.xyz/ai-stack.json',
        collabs: 'https://pointcast.xyz/collabs.json',
        products: 'https://pointcast.xyz/products.json',
        sprint: 'https://pointcast.xyz/sprint.json',
        sprints: 'https://pointcast.xyz/sprints.json',
        family: 'https://pointcast.xyz/family.json',
        today: 'https://pointcast.xyz/today.json',
        moods: 'https://pointcast.xyz/moods.json',
        local: 'https://pointcast.xyz/local.json',
        nature: 'https://pointcast.xyz/nature.json',
        houseplants: 'https://pointcast.xyz/houseplants.json',
      },
      api: {
        ping: 'https://pointcast.xyz/api/ping',
        publish: 'https://pointcast.xyz/api/publish',
        indexnow: 'https://pointcast.xyz/api/indexnow',
        queue: 'https://pointcast.xyz/api/queue',
        drop: 'https://pointcast.xyz/api/drop',
        poll: 'https://pointcast.xyz/api/poll',
        presence: 'wss://pointcast.xyz/api/presence',
        presenceSnapshot: 'https://pointcast.xyz/api/presence/snapshot',
        presenceProtocol: {
          transport: 'websocket',
          query: {
            sid: 'browser-scoped UUID; private; never broadcast back out',
            kind: ['human', 'agent', 'wallet'],
          },
          clientMessages: {
            identify: {
              type: 'identify',
              nounId: 'required integer 0-1199',
              mood: 'optional string',
              listening: 'optional string',
              where: 'optional string',
            },
            update: {
              type: 'update',
              nounId: 'required integer 0-1199',
              mood: 'optional string or null to clear',
              listening: 'optional string or null to clear',
              where: 'optional string or null to clear',
            },
            ping: {
              type: 'ping',
              nounId: 'required integer 0-1199',
            },
          },
          broadcast: {
            humans: 'count of non-agent visitors (includes wallet kind)',
            agents: 'count of agent visitors',
            sessions: [
              {
                nounId: 421,
                kind: 'human',
                joinedAt: '2026-04-20T05:35:00.000Z',
                mood: 'optional string',
                listening: 'optional string',
                where: 'optional string',
              },
            ],
          },
          cap: 50,
          privacy: 'Broadcasts never include raw session ids. Agent entries omit mood/listening/where.',
        },
        weather: 'https://pointcast.xyz/api/weather?station={slug}',
      },
      rss: {
        all: 'https://pointcast.xyz/feed.xml',
        postsOnly: 'https://pointcast.xyz/rss.xml',
      },
      indexnow: 'https://pointcast.xyz/api/indexnow',
      perBlock: {
        html: 'https://pointcast.xyz/b/{id}',
        json: 'https://pointcast.xyz/b/{id}.json',
      },
      perChannel: {
        html: 'https://pointcast.xyz/c/{slug}',
        json: 'https://pointcast.xyz/c/{slug}.json',
        rss: 'https://pointcast.xyz/c/{slug}.rss',
      },
      perMood: {
        html: 'https://pointcast.xyz/mood/{slug}',
        json: 'https://pointcast.xyz/mood/{slug}.json',
        algorithm: 'editorial classifier cutting across channels and types; mood slug = lowercase-hyphen, max 40 chars',
      },
      perYeeTrack: {
        html: 'https://pointcast.xyz/yee/{id}',
        note: 'WATCH-type blocks with a media.beats array get a playable rhythm-game overlay',
      },
      perStation: {
        html: 'https://pointcast.xyz/tv/{station}',
        weather: 'https://pointcast.xyz/api/weather?station={station}',
        note: 'STATIONS mode — 15 geo-stations within 100mi of El Segundo. Each route renders /tv in station-feed mode for that city. Keyboard: 1-9 + Q-Y for channel surfing across stations.',
      },
      crawl: {
        sitemap: 'https://pointcast.xyz/sitemap-blocks.xml',
        rss: 'https://pointcast.xyz/rss.xml',
      },
      metadata: {
        tezosMetadata: 'https://pointcast.xyz/api/tezos-metadata/{tokenId}',
      },
    },

    channels: CHANNEL_LIST.map((ch) => ({
      code: ch.code,
      slug: ch.slug,
      name: ch.name,
      purpose: ch.purpose,
      color: ch.color600,
      surfaces: {
        html: `https://pointcast.xyz/c/${ch.slug}`,
        json: `https://pointcast.xyz/c/${ch.slug}.json`,
        rss: `https://pointcast.xyz/c/${ch.slug}.rss`,
      },
    })),

    blockTypes: BLOCK_TYPE_LIST.map((t) => ({
      code: t.code,
      label: t.label,
      description: t.description,
      footerHint: t.footerHint,
    })),

    contracts: {
      visitNouns: {
        chain: 'tezos',
        network: 'mainnet',
        address: visitNouns || null,
        standard: 'FA2',
        status: visitNouns ? 'live' : 'pending',
        tzkt: visitNouns ? `https://tzkt.io/${visitNouns}` : null,
        objkt: visitNouns ? `https://objkt.com/collection/${visitNouns}` : null,
        description: 'Visit Nouns FA2 — open-supply, each token is a Nouns seed 0-1199.',
      },
      prizeCast: {
        chain: 'tezos',
        network: 'mainnet',
        address: prizeCast || null,
        standard: 'custom',
        status: prizeCast ? 'live' : 'pending-compile',
        description: 'No-loss prize-linked savings. PoolTogether-flavored, Tezos-native.',
        source: 'https://github.com/MikeHoydich/pointcast/blob/main/contracts/v2/prize_cast.py',
      },
      drumToken: {
        chain: 'tezos',
        network: 'mainnet',
        address: drumToken || null,
        standard: 'FA1.2',
        status: drumToken ? 'live' : 'pending-compile',
        description: 'DRUM attention coin. Signed-voucher claim flow.',
        source: 'https://github.com/MikeHoydich/pointcast/blob/main/contracts/v2/drum_token.py',
      },
      marketplace: {
        chain: 'tezos',
        network: 'mainnet',
        address: marketplace || null,
        status: marketplace ? 'live' : 'planned',
      },
    },

    agentMode: {
      trigger: 'User-Agent prefix "ai:" OR matches GPTBot / ClaudeBot / PerplexityBot / OAI-SearchBot / Atlas / Google-Extended',
      treatment: 'Returns stripped HTML: no <style>, no <link rel=stylesheet>, no preload/preconnect/icon/manifest, no inline <script> (JSON-LD preserved), no generator meta, no inline style attrs.',
      responseHeader: 'X-Agent-Mode: stripped · ai:<vendor>',
      payloadSavings: '~12% smaller on the home feed (97,631 vs 111,170 bytes verified).',
      source: 'https://github.com/MikeHoydich/pointcast/blob/main/functions/_middleware.ts',
    },

    cors: {
      policy: 'All JSON / markdown agent surfaces carry Access-Control-Allow-Origin: *.',
      applies: [
        '/agents.json', '/blocks.json', '/archive.json', '/editions.json',
        '/now.json', '/cast.json', '/battle.json', '/timeline.json',
        '/stack.json', '/feed.json', '/feed.xml', '/b/*.json',
        '/c/*.json', '/c/*.rss', '/llms.txt', '/llms-full.txt',
      ],
      note: 'Agents can fetch from any origin. No preflight needed for GETs.',
    },

    push: {
      indexnow: {
        endpoint: 'https://pointcast.xyz/api/indexnow',
        method: 'POST',
        shape: '{ urls: ["https://pointcast.xyz/..."] }',
        status: 'awaiting key binding (INDEXNOW_KEY in Cloudflare Pages env)',
        spec: 'https://www.indexnow.org/documentation',
      },
    },

    citationFormat: {
      template: 'PointCast · CH.{CODE} · № {ID} — "{TITLE}" · {YYYY-MM-DD}\nhttps://pointcast.xyz/b/{ID}',
      example: 'PointCast · CH.FD · № 0205 — "The front door is agentic" · 2026-04-14\nhttps://pointcast.xyz/b/0205',
    },

    contact: 'hello@pointcast.xyz',
    maintainers: [
      { name: 'Mike Hoydich', role: 'director', twitter: '@mhoydich' },
      { name: 'Claude Code', role: 'primary engineer', builtBy: 'Anthropic' },
      { name: 'Codex', role: 'specialist reviewer', builtBy: 'OpenAI' },
      { name: 'Manus', role: 'operations + computer-use' },
    ],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
