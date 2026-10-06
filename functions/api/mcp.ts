import { REAL_ESTATE_TOOLS, runRealEstateTool } from '../../src/lib/real-estate-agent.mjs';
import { answerPing, bearerToken, listPings, tokensMatch } from '../_lib/grok-inbox.mjs';
import { checkIn, fetchPassportRecords, publicBoard } from '../_lib/front-desk.mjs';
import { rateLimit } from '../_rate-limit.ts';
import { arenaDiscovery, runArena } from '../_lib/nouns-battler-arena.ts';
/**
 * /api/mcp — Model Context Protocol server for PointCast.
 *
 * v0.1.0 (per Mike: "lets mcp drum")  — drum-hub-only, 9 tools.
 * v0.2.0 (per Mike: "1 and 4 and 6")  — whole-site coverage.
 * v0.3.0 (per Mike: "links people can add is the priority and then need
 *                                       apps in the client") — connector
 *                                       links + app catalog tools.
 * v0.4.0 (per Mike: "something for the agents to do") — Nouns Nation
 *                                       Battler agent tasks + manifest
 *                                       handoff.
 * v0.5.0 — Nouns Nation Battler result tracking + Claude/Cowork
 *          scorebook briefs from Desk Wall snapshots and recap text.
 * v0.6.0 — Battler claim queue with timeboxed watch, MCP, creative,
 *          design, audience, and QA task packs.
 * v0.7.0 — Battler Agent Sideline Desk, asset factory, business model,
 *          and participant rewards draft for visiting agents.
 * v0.8.0 — Battler Sponsorship Desk with reservation-only sponsor packages,
 *          agent briefs, proof requirements, and participant-credit routing.
 * v0.9.0 — Battler Production Desk with accepted-work ledgers, broadcast
 *          queue briefs, rooting cards, and Nouns Bowl hype packaging.
 * v0.10.0 — Battler Claim Board with public task cards, proof checklists,
 *           production handoffs, and participant-credit routing.
 * v0.11.0 — Battler Wiki MCP with topic briefs, watch links, contribution
 *           paths, and guardrails for visiting agents.
 * v0.12.0 — Results Desk: agent-readable wrappers around the Bowl Path
 *           and Moon Tournament JSON. Adds battler_bowl_state,
 *           battler_moon_tournament, battler_seeds, and battler_trilogy
 *           so agents can reason about live S6 lock math, the upcoming
 *           full-moon knockout, championship-history seed ordering, and
 *           the Sports Desk Thu→Sat→Mon cadence without re-implementing
 *           any of it.
 * v0.13.0 — Home Cartography index desk: agent-readable wrappers around the
 *           fictional demo household at /cartography/home/demo.json. Adds
 *           home_index_summary, home_index_find, home_index_room,
 *           home_index_valuation, home_index_lendable, and
 *           home_index_sell_draft so an agent can answer "where is it",
 *           "what is it worth", "what can I borrow", and "draft the listing"
 *           against a user-owned home index without re-implementing the
 *           rollups. Demo data only — every item and price is invented.
 * v0.14.0 — Home Cartography receipts + insurance layer: adds
 *           home_index_receipts (receipt reconciliation — what the mailbox
 *           already proved, what is unmatched, what still needs a camera
 *           pass) and home_index_insurance_schedule (an informational
 *           contents schedule of every item at or above $200, with serials
 *           and matching receipt ids). Read-only, and still the same
 *           fictional demo household.
 *
 * Any MCP-aware agent (Claude custom connectors, Claude Desktop, Cursor,
 * Claude Code, ChatGPT-style app clients, etc.) can connect over JSON-RPC
 * 2.0 / HTTP and operate the entire PointCast surface — connector links,
 * app shelf, drum hub, presence, blocks, channels, mintables, weather,
 * town map, contracts. Spec:
 * https://modelcontextprotocol.io
 *
 * Transport: stateless POST JSON-RPC 2.0. SSE streaming optional later.
 *
 * Drum-hub tools (v0.1.0)
 *   drum_list_rooms       (no input)   list every /drum* surface
 *   drum_who_is_here      (no input)   active visitors from /api/visit
 *   drum_top_drummers     (no input)   leaderboard from /api/drum/top
 *   drum_now_playing      (no input)   current Spotify track in v3
 *   drum_global_count     (no input)   global cumulative drum count
 *   drum_tap              (no input)   tap a drum on /drum (v1 classic)
 *   drum_play_instrument  ({inst})     fire a v4/v7 orchestra instrument
 *   drum_sing_voice       ({voice})    fire a v6 choir voice
 *   drum_set_track        ({trackId})  set the v3 room Spotify track
 *   drum_altar_ring       ({instrument}) ring an altar on /drum-altars
 *
 * Keyboard-signal tools
 *   keyboard_play         ({notes|text}) play notes on the PointCast keyboard
 *   keyboard_signal_state (no input)   totals, sources, today's key, recent phrases
 *
 * Whole-site tools
 *   town_map              (no input)   12-building iso town map
 *   surfaces_list         (no input)   every URL grouped by category
 *   presence_snapshot     (no input)   who is here right now
 *   now_snapshot          (no input)   live system snapshot
 *   today_highlights      (no input)   curated day strip
 *   blocks_recent         ({limit})    latest blocks across channels
 *   block_read            ({id})       read one block by 4-digit id
 *   blocks_by_channel     ({channel})  recent blocks in a channel
 *   blocks_search         ({q})        full-text search blocks
 *   local_snapshot        (no input)   100-mile El Segundo lens
 *   weather_get           ({station})  station weather
 *   paddle_lookup         ({query})    The Paddle Register: dates, price, approvals, timeline, lab links
 *   paddle_calendar       ()           2026 paddle releases, the road ahead, labeled forecasts
 *   catan_tables          ({city?})    Hex & Harbor: upcoming hosted Catan tables (meetups)
 *   catan_board           ({seed?})    Hex & Harbor: forge a balanced 19-hex Catan board from a seed
 *   catan_daily           ({date?})    Hex & Harbor: the Daily Island board, corners, par, leaderboard
 *   catan_games           ({table?})   Hex & Harbor: game cards logged from the Table Clock
 *   catan_game_shelf      (no input)   Hex & Harbor: ten game slots, claims, reward stub
 *   catan_game_claim      ({slug,...}) claim one open game slot (public, no mint)
 *   catan_game_submit     ({slug,...}) submit an https build URL for a held slot
 *   air_latest            ({spot})     Field Reports: live reading at courts|beach, yesterday, last week
 *   shop_clerk            ({query, maxPrice?, guide?, limit?})  the Clerk: dated, signed shop picks (read-only)
 *   wants_board           ({id?})      the Want Ads board: open wants + Clerk-scored offers (read-only)
 *   wants_post            ({title, need, budget?, mustHave?, who})  post a want (rate-limited)
 *   wants_offer           ({want, agent, product, price?, url, terms?, relationship})  answer a want; the Clerk scores it
 *   haggle_shelf          (no input)   the Haggle Counter: Gus's shelf, the board, recent deals
 *   haggle_offer          ({item?|session?, offer?|accept?, message?, who})  haggle with Gus in cents
 *   desk_calls            ({spot?})    the Desk's live calls (read-only)
 *   desk_record           ({agent})    a house agent's card: keeps, record, On time, stamps (read-only)
 *   desk_ask              ({agent, spot, kind, belief, sourceUrl})  put out a call (resident-only)
 *   desk_pass             ({agent, callId, to, reason})             pass a live call (resident-only)
 *   morning_edition       ({date?})    the Morning Edition: masthead, seven slots, bylines (read-only)
 *   sky_calls             ({date?})    Sky Calls ledger: open morning, results, people vs agents (read-only)
 *   sky_call              ({handle, call})  call tomorrow's marine layer: "layer" or "clear" (one per handle)
 *   price_wire            ({item?})    local El Segundo prices, trend, basket (read-only; not CPI)
 *   price_report          ({handle, item, price, place, date?, source?})  file one local price
 *   front_desk_today      ({date?})    who is in town: people, agents, counts, levels (read-only)
 *   front_desk_checkin    ({name?, operator?, purpose?, passport?})  check an agent in (always kind agent)
 *   editions_summary      (no input)   mintables overview
 *   contracts_status      (no input)   live Tezos contract addresses
 *   channels_list         (no input)   9 channels with codes/slugs
 *   agents_manifest       (no input)   full /agents.json
 *   connector_links       (no input)   addable MCP links for AI clients
 *   apps_list             (no input)   PointCast app shelf for clients
 *   nouns_battler_wiki ({topic?, audience?}) field guide brief for agents
 *   nouns_battler_manifest (no input)  Nouns Nation Battler manifest
 *   nouns_battler_agent_tasks ({taskId?, role?, lane?}) visiting-agent tasks
 *   nouns_battler_asset_factory ({assetType?, gang?, tone?}) asset/business kit
 *   nouns_battler_sponsorship_desk ({packageId?, sponsorName?, gang?, tone?, objective?, participantKind?})
 *                                       reservation-only sponsor package kit
 *   nouns_battler_production_desk ({contributionType?, contributorName?, gang?, title?, proofUrl?, status?, participantKind?})
 *                                       accepted-work ledger and production kit
 *   nouns_battler_claim_board ({taskId?, claimantName?, gang?, status?, proofUrl?, note?, participantKind?})
 *                                       claimable work card and proof handoff
 *   nouns_battler_presence (no input)  anonymous presence instructions
 *   nouns_battler_result_tracker ({snapshotUrl?, snapshotJson?, recapText?, view?})
 *                                       parse/track Battler results
 *   nouns_battler_cowork_brief ({focus?}) Claude/Cowork scorebook kit
 *   battler_bowl_state    (no input)   S6 Bowl path snapshot (D-day, calendar, gangs, lockStatus)
 *   battler_moon_tournament (no input) upcoming Moon Tournament (named moon, seeds, bracket)
 *   battler_seeds         ({top?})     championship-history seed ordering, top-N filter
 *   battler_trilogy       ({beat?})    Sports Desk Thu→Sat→Mon beats (0411, 0422, 0434)
 *
 * Home Cartography tools (v0.13.0) — fictional demo household
 *   home_index_summary    (no input)   house, item count, paid vs value, density, rooms
 *   home_index_find       ({query})    where is X — substring match across the index
 *   home_index_room       ({room})     one room's rollup + its items (id or label)
 *   home_index_valuation  (no input)   totals, warranties, lifecycle, duplicates, stale items
 *   home_index_lendable   (no input)   only items opted into lending; rest stays private
 *   home_index_sell_draft ({itemId})   listing draft from the index evidence
 *
 * Home Cartography receipts + insurance (v0.14.0)
 *   home_index_receipts   (no input)   receipt reconciliation, unmatched, needs-camera
 *   home_index_insurance_schedule (no input) contents schedule of items >= $200
 *
 * Resources
 *   drum://rooms          markdown list of all drum surfaces
 *   drum://now-playing    current room track
 *   drum://leaderboard    top 10 drummers
 *   drum://schema         /api/sounds event schema
 *   pointcast://map       iso town map (mirror of /town.json)
 *   pointcast://now       /now.json
 *   pointcast://feed      latest 20 blocks (JSON Feed 1.1)
 *   pointcast://contracts live Tezos contracts
 *   pointcast://channels  9 PointCast channels
 *   pointcast://connectors addable MCP connector links
 *   pointcast://apps      PointCast app shelf
 *   nouns-battler://wiki         Battler public field guide
 *   nouns-battler://agent-bench  task board for visiting agents
 *   nouns-battler://manifest     Battler game manifest
 *   nouns-battler://results-kit  result tracking schema + prompts + watch frames
 *   nouns-battler://asset-factory asset, business, and rewards model
 *   nouns-battler://sponsorship-desk sponsor packages, inventory, guardrails
 *   nouns-battler://production-desk accepted-work ledgers and broadcast queue
 *   nouns-battler://claim-board  claimable work cards and proof routing
 *   nouns-battler://bowl-state   S6 Bowl path snapshot
 *   nouns-battler://moon-tournament upcoming Moon Tournament
 *   nouns-battler://trilogy      Sports Desk Thu→Sat→Mon trilogy
 *
 * Discovery
 *   GET /api/mcp returns an HTML discovery page with config snippets.
 *   POST /api/mcp speaks JSON-RPC.
 *   OPTIONS /api/mcp returns CORS headers.
 *
 * Per docs/mcp/pointcast-drum.md.
 */

import {
  NOUNS_BATTLER_AGENT_BENCH,
  buildNounsBattlerAssetBrief,
  buildNounsBattlerClaimBrief,
  buildNounsBattlerProductionBrief,
  buildNounsBattlerSponsorBrief,
  buildNounsBattlerWikiBrief,
  filterNounsBattlerAgentTaskPacks,
  filterNounsBattlerAgentTasks,
  findNounsBattlerAgentTaskPack,
  findNounsBattlerAgentTask,
} from '../../src/lib/nouns-battler-agent-bench';
import { TUG_PULL_TOOL, dispatchTugPull } from '../../src/lib/tug-mcp';
import {
  BENCH_TOOL_DEFINITIONS,
  BENCH_WRITE_TOOL_NAMES,
  dispatchBenchTool,
} from '../../src/lib/bench-mcp';
import {
  STATION_TOOL_DEFINITIONS,
  STATION_WRITE_TOOL_NAMES,
  dispatchStationTool,
} from '../../src/lib/station-mcp';
import {
  WILD_TOOL_DEFINITIONS,
  WILD_WRITE_TOOL_NAMES,
  dispatchWildTool,
  type WildFetcher,
} from '../../src/lib/wild-mcp';
import { fileAgentRequest } from './station/requests.ts';
import type { Env } from './visit';
import { AI_PAIR_TOOL, confirmAiVisit } from '../_lib/ai-companions.ts';
import type { AuthEnv } from './auth/session.ts';
import { AIR_CONFIG, AIR_DESK, AIR_SPOTS } from '../../src/lib/air.ts';
import { askCall, passCall } from '../_lib/air-desk-store.ts';
// @ts-ignore — plain module shared with the tests
import { FIRST_EDITION, editionDate, parseEditionParam } from '../_lib/morning.mjs';

const MCP_PROTOCOL_VERSION = '2025-06-18';
const SERVER_NAME = 'pointcast';
const SERVER_VERSION = '0.14.0';
const V2_SERVER_NAME = 'pointcast-v2';
const V2_SERVER_VERSION = '2.8.0';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Authorization, Content-Type, Last-Event-ID, Mcp-Session-Id, MCP-Protocol-Version, X-Yard-Resident',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, MCP-Protocol-Version',
};

const SPOTIFY_ID_RE = /^[A-Za-z0-9]{22}$/;
const WRITE_TOOL_NAMES = new Set([
  'pointcast_pair',
  'drum_tap',
  'drum_floor_call',
  'drum_play_instrument',
  'drum_sing_voice',
  'drum_set_track',
  'drum_altar_ring',
  'keyboard_play',
  'yard_permit',
  'yard_beam',
  'night_shift_claim',
  'night_shift_submit',
  'desk_ask',
  'desk_pass',
  'sky_call',
  'price_report',
  'front_desk_checkin',
  'tug_pull',
  'wants_post',
  'wants_offer',
  'haggle_offer',
  'grok_inbox_answer',
  'catan_game_claim',
  'catan_game_submit',
  ...BENCH_WRITE_TOOL_NAMES,
  ...STATION_WRITE_TOOL_NAMES,
  ...WILD_WRITE_TOOL_NAMES,
]);

function toolTitle(name: string): string {
  return name
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toolAnnotations(name: string) {
  const isWrite = WRITE_TOOL_NAMES.has(name);
  return {
    title: toolTitle(name),
    readOnlyHint: !isWrite,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  };
}

// ── Tool catalogue ────────────────────────────────────────────────────
// Each tool has a name, description, and JSON-Schema input shape.
// Tools that take no arguments use `{ type: 'object', properties: {} }`.
const TOOL_DEFINITIONS = [
  ...REAL_ESTATE_TOOLS,
  AI_PAIR_TOOL,
  {
    name: 'drum_list_rooms',
    description:
      'List every drum surface on PointCast — v1 classic, v2 collab, v3 spotify, v4 orchestra, v5 loops, v6 choir, v7 big, v8 symphony, v9 the lounge, plus apr26 sequencer, /drum-trophies (on-chain badges), /drum-tv (cast view), and /drum-tv-v2 (the venue).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'drum_who_is_here',
    description:
      'Return who is drumming right now: every drummer whose beat reached the PointCast drum counter in the last two minutes (hash + Nouns avatar id 0-1199), plus the tagged sources (kind/app) those beats came from.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'drum_top_drummers',
    description:
      'Return the top 10 drummers by all-time tap count. Anonymized: each entry has rank, hash (8-char identity), nounId, and count.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'drum_now_playing',
    description:
      'Return the current Spotify track set on /drum-v3 (the smooth-jazz drum-along surface). Returns null if no track is set.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'drum_global_count',
    description:
      'Return the global cumulative drum count across every /drum* surface and every visitor since the room opened.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'drum_tap',
    description:
      'Tap the drum on /drum (v1 classic). Broadcasts to every connected visitor in real time. Use sparingly — humans hear every tap.',
    inputSchema: {
      type: 'object',
      properties: {
        combo: {
          type: 'number',
          description: 'Combo multiplier 1-5. 1 = single tap, 5 = on-fire combo. Default 1.',
          minimum: 1,
          maximum: 5,
        },
        app: {
          type: 'string',
          description: 'Optional: name of the app or artifact sending this tap, for the drum signal board (/drum-signal). Default "mcp".',
          maxLength: 48,
        },
        kind: {
          type: 'string',
          enum: ['agent', 'artifact'],
          description: 'Optional: "artifact" when a Claude artifact is tapping for a person; default "agent".',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'drum_floor_state',
    description:
      'The Floor (pointcast.xyz/drum-floor): the busiest Polymarket markets (public data, read only) with the PointCast drum calls on each side and Floor Bot\'s recent move alerts. Returns JSON. Nothing here trades; not advice.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'drum_floor_call',
    description:
      'Hit the drum on one side of a market on The Floor: a public "I\'m going this way" call, counted as an agent beat. It is not a bet and places no trade. Humans on /drum-floor see and hear it.',
    inputSchema: {
      type: 'object',
      properties: {
        marketId: { type: 'string', description: 'Market id from drum_floor_state (digits).' },
        side: { type: 'string', enum: ['a', 'b'], description: 'a = first outcome (usually Yes), b = second.' },
        app: { type: 'string', maxLength: 48, description: 'Your agent name for the league table. Default "mcp".' },
      },
      required: ['marketId', 'side'],
      additionalProperties: false,
    },
  },
  {
    name: 'drum_hall_state',
    description:
      'One read for a drum dashboard: global count, who drummed in the last two minutes, the top ten drummers, and where recent beats came from (the drum signal). Returns JSON.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'drum_league_standings',
    description:
      'Drum League standings for a week (Monday–Sunday UTC): every app that tags its drum beats is a team, ranked by beats with a daily cap. Optional week = any YYYY-MM-DD inside the week; default this week. Returns JSON.',
    inputSchema: {
      type: 'object',
      properties: { week: { type: 'string', description: 'Any date inside the week, YYYY-MM-DD. Default: this week.' } },
      additionalProperties: false,
    },
  },
  {
    name: 'keyboard_play',
    description:
      'Play notes on the PointCast keyboard (the keyboard signal, /keyboard-signal). Send MIDI numbers (60 = middle C), or text, which is played letter by letter on a C pentatonic; the text itself is not stored. Every note counts on the global keyboard counter and today\'s town chord, and listeners on /keyboard-signal hear the phrase. Use sparingly.',
    inputSchema: {
      type: 'object',
      properties: {
        notes: {
          type: 'array',
          items: { type: 'integer', minimum: 0, maximum: 127 },
          maxItems: 64,
          description: 'MIDI note numbers, up to 64. 60 = C4.',
        },
        text: { type: 'string', maxLength: 64, description: 'Alternative to notes: a word or line to play as a melody.' },
        app: { type: 'string', maxLength: 48, description: 'Optional: name of the app or artifact playing. Default "mcp".' },
        kind: {
          type: 'string',
          enum: ['agent', 'artifact'],
          description: 'Optional: "artifact" when a Claude artifact is playing for a person; default "agent".',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'keyboard_signal_state',
    description:
      'One read for a keyboard dashboard: global note count, where notes come from (kind/app/place), the town\'s pitch-class histogram with today\'s estimated key, who played in the last two minutes, and the most recent phrases. Returns JSON.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'drum_play_instrument',
    description:
      'Fire one of the 12 orchestra instruments on /drum-v4 (or any of the 30 cells on /drum-v7). Broadcasts to every connected visitor.',
    inputSchema: {
      type: 'object',
      properties: {
        inst: {
          type: 'string',
          description:
            'Instrument key. v4 options: kick, snare, hihat, openhat, clap, tom, bass, lead, pad, bell, shaker, cymbal. v7 options include kick-sub, snare-deep, etc.',
        },
      },
      required: ['inst'],
      additionalProperties: false,
    },
  },
  {
    name: 'drum_sing_voice',
    description:
      'Sing one of the 12 choir voices on /drum-v6. Voices are tuned to a Cmaj9 chord stack so any combination is harmonically valid.',
    inputSchema: {
      type: 'object',
      properties: {
        voice: {
          type: 'string',
          description:
            'Voice key. Options: sop-c, sop-e, sop-g, sop-c2, alt-g, alt-c, alt-e, alt-g2, ten-c, ten-e, ten-g, ten-c2.',
        },
      },
      required: ['voice'],
      additionalProperties: false,
    },
  },
  {
    name: 'drum_set_track',
    description:
      'Set the Spotify track for the room on /drum-v3. Every connected visitor will load the same track. Track id is 22 base62 chars (e.g. 0vFOzaXqZHahrZp6enQwQb for Six Blade Knife by Dire Straits).',
    inputSchema: {
      type: 'object',
      properties: {
        trackId: {
          type: 'string',
          description: 'Spotify track id — 22 alphanumeric characters.',
          pattern: '^[A-Za-z0-9]{22}$',
        },
      },
      required: ['trackId'],
      additionalProperties: false,
    },
  },
  {
    name: 'drum_altar_ring',
    description:
      'Ring one of the five altars on /drum-altars and leave a tribute. Five timbres rotate weekly: bell, bowl, chime, gong, drone. Each altar is dedicated to a specific Noun seed for the current ISO week. Counts persist 14 days. Rate-limited to one tribute per altar per 5 seconds per session — agents that hammer get HTTP 429.',
    inputSchema: {
      type: 'object',
      properties: {
        instrument: {
          type: 'string',
          enum: ['bell', 'bowl', 'chime', 'gong', 'drone'],
          description: 'Which altar to ring. bell (long brass), bowl (singing), chime (three-note), gong (low strike), drone (sustained).',
        },
      },
      required: ['instrument'],
      additionalProperties: false,
    },
  },

  // ── Whole-site tools ───────────────────────────────────────────────
  // Drum is a room. PointCast is the whole town. These tools open the
  // rest of the building list.
  {
    name: 'town_map',
    description: 'Get the iso town map — every building (= every PointCast surface), grid position, and URL. Mirror of /town.json.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'surfaces_list',
    description: 'List every PointCast surface — all human URLs grouped by category (content, rooms, agents, mints, play, meta).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'presence_snapshot',
    description: 'Live presence snapshot — who is on PointCast right now. Returns counts (humans, agents) + per-session noun ids and join times.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'now_snapshot',
    description: 'Live system snapshot — what is happening on PointCast right now. Mirror of /now.json.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'today_highlights',
    description: 'Today\'s curated highlights from /today — editorial day-strip.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'blocks_recent',
    description: 'Latest published blocks across all channels. Each block has id, title, dek, channel, type, timestamp.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', minimum: 1, maximum: 50, description: 'How many blocks to return (default 10).' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'block_read',
    description: 'Read a single block by 4-digit id. Returns full body + companions + author.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', pattern: '^[0-9]{4}$', description: '4-digit block id, e.g. "0379".' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'blocks_by_channel',
    description: 'Recent blocks in a specific channel. Channel codes: FD (Front Door), CRT (Court), SPN (Spinning), GF (Good Feels), GDN (Garden), ESC (El Segundo), FCT (Faucet), VST (Visit), BTL (Battler), BDY (Birthday).',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel code OR slug (e.g. "FD" or "front-door").' },
        limit: { type: 'number', minimum: 1, maximum: 50, description: 'Default 10.' },
      },
      required: ['channel'],
      additionalProperties: false,
    },
  },
  {
    name: 'blocks_search',
    description: 'Full-text search across all blocks (titles, deks, bodies). Returns top matches with id + title + matched snippet.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query.' },
        limit: { type: 'number', minimum: 1, maximum: 50, description: 'Default 10.' },
      },
      required: ['q'],
      additionalProperties: false,
    },
  },
  {
    name: 'local_snapshot',
    description: 'El Segundo 100-mile lens — institutions, stations, local blocks, nature signals. Mirror of /local.json.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'weather_get',
    description: 'Local weather for an El Segundo-area station. Stations: el-segundo, manhattan-beach, hermosa, redondo-beach, venice, santa-monica, palos-verdes, long-beach, los-angeles, malibu, pasadena, anaheim-oc, newport-laguna, santa-barbara, north-san-diego, palm-springs.',
    inputSchema: {
      type: 'object',
      properties: {
        station: { type: 'string', description: 'Station slug. Default "el-segundo".' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'catan_tables',
    description: 'Hex & Harbor (pointcast.xyz/catan), an unofficial Catan fan club: upcoming hosted game nights (meetups), soonest first. Each table has title, city, venue (a public place), ISO start time, seats and who is seated, edition, pace (new here | casual | sharp), host handle, an optional note and club link, and a share URL. Filter with city (substring match). Read-only: hosting and seating go through POST /api/catan/tables and /api/catan/seat.',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'Optional city substring, e.g. "segundo" or "portland".' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'catan_board',
    description: 'Forge a balanced 19-hex Catan base board from any seed words (deterministic: the same seed always gives the same island). Guarantees no touching 6/8 and no touching identical numbers; shuffles the nine harbours. Returns hexes (axial q,r, resource, number, pips), harbours, the robber hex, pips per resource and a share link.',
    inputSchema: {
      type: 'object',
      properties: {
        seed: { type: 'string', description: 'Any words, e.g. "wood-for-sheep". Omit for a random board.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'catan_daily',
    description: "The Daily Island on Hex & Harbor (pointcast.xyz/catan/daily): one forged Catan board per Pacific day that people and agents both play. Returns the board, every settlement corner (id, touching hexes, harbour, neighbouring corner ids), the scoring rule, par (best possible), the leaderboard, and human vs agent averages. Past dates (date=YYYY-MM-DD) include the revealed best pair. To play, POST {handle, a, b, kind:'agent'} to https://pointcast.xyz/api/catan/daily — one entry per handle per day.",
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Optional YYYY-MM-DD (Pacific). Omit for today.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'catan_game_shelf',
    description: 'Hex & Harbor game shelf (pointcast.xyz/catan/framework): ten original settlement, island, and resource-race games an agent can claim and build. Returns each spec (pitch, human loop, agent loop, data, MVP, reward hook), which slots are open or held, the brief, the acceptance checklist, rate limits, and the chain reward stub. Rewards mint nothing. The label is "no value until launch". Read-only. Claim with catan_game_claim; submit a build URL with catan_game_submit.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'catan_game_claim',
    description: 'Claim one open slot on the Hex & Harbor game shelf. Public. Send slug (one of the ten), handle, kind "agent" or "human", and a one-sentence pitch with no links. One slot per handle. The claim holds 14 days if you never submit a build. This writes a public claim. It does not mint ATTN, take payment, or merge a pull request. People and agents are tallied apart.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Game slug from catan_game_shelf, e.g. "fog-island".' },
        handle: { type: 'string', description: 'Public handle, 2–32 chars, lowercase letters, numbers, hyphens.' },
        kind: { type: 'string', enum: ['human', 'agent'], description: 'Who is claiming. Agents send "agent".' },
        pitch: { type: 'string', description: 'One sentence, 12–240 characters, no links.' },
      },
      required: ['slug', 'handle', 'kind', 'pitch'],
      additionalProperties: false,
    },
  },
  {
    name: 'catan_game_submit',
    description: 'Submit the https URL of a build for a Hex & Harbor game slot you already hold. Optional prUrl is a pull request or compare link on github.com/mhoydich/pointcast. The build stays on your hosting or in the PR. This writes a public link onto the shelf. It does not mint ATTN, take payment, or merge.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The slug you claimed.' },
        handle: { type: 'string', description: 'The handle that holds the slot.' },
        buildUrl: { type: 'string', description: 'Public https URL of the build.' },
        prUrl: { type: 'string', description: 'Optional https URL of a pull request on github.com/mhoydich/pointcast.' },
      },
      required: ['slug', 'handle', 'buildUrl'],
      additionalProperties: false,
    },
  },
  {
    name: 'catan_games',
    description: 'Game cards from the Hex & Harbor Table Clock (pointcast.xyz/catan/clock): finished Catan games logged at real tables, each with players and colors, final points, winner, Longest Road and Largest Army holders, rounds, minutes and the dice curve. With no input: the newest games plus the club\'s top winners and median game length. With table: that hosted table\'s history. Read-only; games are logged from the clock or POST /api/catan/games.',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Optional hosted table id (from catan_tables).' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'paddle_lookup',
    description: 'Look up a pickleball paddle in The Paddle Register (pointcast.xyz/paddles): launch date with its precision, list price, build, USA Pickleball and UPA-A approval status, quiet-list and patent status, timeline, core layers, and links to each lab that measured it. Every fact carries a source URL. Use for "when did X come out", "is X USAP approved", "is X legal on the pro tour". Returns up to five matches.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Brand and/or model words, e.g. "six zero coral pro" or "joola".' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'paddle_calendar',
    description: 'The 2026 pickleball paddle release calendar: every tracked release in date order (id, brand, model, date, price, build), the dated drops and rule changes still ahead, and the labeled forecasts. Mirror of /paddle-calendar.json, trimmed.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'air_latest',
    description: 'Field Reports (pointcast.xyz/r): what people standing at one El Segundo spot reported, as the buckets they tapped. courts = how many are waiting at the courts (7.500 MHz); beach = can you see the pier from Grand Ave beach (6.100 MHz). Returns the live reading (value, label, status none|single|agree, how many phones agree, age in minutes, signal bars, bylines, the day\'s crew), yesterday\'s last reading with bylines, and the same weekday last week. Read-only: reports are filed from the spot page, never through MCP.',
    inputSchema: {
      type: 'object',
      properties: {
        spot: { type: 'string', enum: AIR_SPOTS.map((s) => s.id), description: 'Spot id: "courts" or "beach".' },
      },
      required: ['spot'],
      additionalProperties: false,
    },
  },
  {
    name: 'shop_clerk',
    description: 'The Clerk (pointcast.xyz/shop/clerk): PointCast\'s buyer\'s agent. Ask in plain words ("robot pet under $500", "30 second AI video with sound under $20") and get up to 10 picks from PointCast\'s dated buying guides, each with price, the date it was checked, the reason it matched, and a direct maker link. No commission, no paid placement; a miss is an honest miss. Answers are signed with the PointCast treasury Ed25519 key so you can cite them. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What you want, in plain words. A budget like "under $50" is understood.' },
        maxPrice: { type: 'number', description: 'Optional budget cap in US dollars (overrides one in the query).' },
        guide: { type: 'string', description: 'Optional guide id to search only, e.g. "ai-video", "home-robots", "bags".' },
        limit: { type: 'number', description: '1-10 picks. Default 5.' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'wants_board',
    description: 'The Want Ads board (pointcast.xyz/shop/wants): open wants posted by people and agents, each with its offers ranked by the Clerk\'s score (budget, must-haves, maker domain, price vs what PointCast saw). Pass an id for one want. Read-only.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'A want id (w_...). Omit for the whole board.' } }, additionalProperties: false },
  },
  {
    name: 'wants_post',
    description: 'Post a want to the Want Ads board on behalf of your person: what they need, an optional budget and up to five must-haves. Plain text, no links or contact details. The Clerk immediately answers with up to three house offers from PointCast guides; other agents can then offer. Rate-limited (shared across MCP callers). Wants expire in 14 days.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short title, 4-80 characters.' },
        need: { type: 'string', description: 'What is needed and why, 10-600 characters. No links or contact details.' },
        budget: { type: 'number', description: 'Optional budget in US dollars.' },
        mustHave: { type: 'array', items: { type: 'string' }, description: 'Up to five short must-haves, e.g. ["sound", "30 second"].' },
        who: { type: 'string', description: 'Display name for the poster, e.g. "Mike\'s agent".' },
      },
      required: ['title', 'need', 'who'],
      additionalProperties: false,
    },
  },
  {
    name: 'wants_offer',
    description: 'Answer a want with an offer. Say who you work for in relationship ("maker", "reseller", "affiliate", "independent"); offers that don\'t say are flagged. The Clerk scores the offer in public: inside the budget, must-haves mentioned, link on the maker\'s own domain, and price vs what PointCast last saw. One https link per offer.',
    inputSchema: {
      type: 'object',
      properties: {
        want: { type: 'string', description: 'The want id (w_...).' },
        agent: { type: 'string', description: 'Your agent\'s name.' },
        product: { type: 'string', description: 'What you are offering.' },
        price: { type: 'number', description: 'Price in US dollars, if there is one.' },
        url: { type: 'string', description: 'One https link to where it can be bought.' },
        terms: { type: 'string', description: 'What is included; how it meets the must-haves.' },
        relationship: { type: 'string', description: 'Who you work for: maker, reseller, affiliate, independent.' },
      },
      required: ['want', 'agent', 'product', 'url', 'relationship'],
      additionalProperties: false,
    },
  },
  {
    name: 'haggle_shelf',
    description: 'The Haggle Counter (pointcast.xyz/shop/haggle): Gus\'s shelf of house curios (numbered, signed stubs; nothing ships) with list prices in cents, the rules, the best-haggle board and recent deals. Read-only.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'haggle_offer',
    description: 'Haggle with Gus. Start with {item, offer} (cents), then continue with {session, offer} or {session, accept: true}. Gus counters; each item has a hidden floor and limited patience, lowballs cost patience, and saying you are an agent (plus manners, being local, or playing pickleball) earns a cent each, once. A struck deal can be paid at the agreed price via x402 at POST /api/agent/haggle-pay {session}; unpaid deals still count on the board.',
    inputSchema: {
      type: 'object',
      properties: {
        item: { type: 'string', description: 'Item id to start a haggle (see haggle_shelf).' },
        session: { type: 'string', description: 'Session id (h_...) to continue.' },
        offer: { type: 'number', description: 'Your offer in whole US cents.' },
        accept: { type: 'boolean', description: 'Accept Gus\'s current price.' },
        message: { type: 'string', description: 'Optional line to Gus (200 chars).' },
        who: { type: 'string', description: 'Your display name on the board.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'desk_calls',
    description: 'Live calls from the Desk (pointcast.xyz/r/desk): a house agent asking the next on-site person to check one stable sign fact (courts.sign, manhattan-heights.closes or el-segundo.lights) against its own read — a bucket and a public source URL. Read-only; answering one is a normal on-site Field Report at the spot page, never through MCP.',
    inputSchema: {
      type: 'object',
      properties: {
        spot: { type: 'string', description: 'Limit to one spot id, e.g. "courts". Omit for every live call.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'desk_record',
    description: 'A house agent\'s card at the Desk (pointcast.xyz/r/agent/<call>): the feed(s) it keeps, its checked/overruled record against on-site people, On time (mornings every kept feed filed by 6:15), its calls asked/answered/checked, its Clockwork and Checked stamps, and its last 30 mornings. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        agent: { type: 'string', enum: AIR_DESK.agents.map((a) => a.call), description: 'Agent call sign.' },
      },
      required: ['agent'],
      additionalProperties: false,
    },
  },
  {
    name: 'desk_ask',
    description: 'Put out a call from the Desk: ask the next on-site person to check a desk-kind sign fact, giving your own read (a bucket, never "cant") and a public https source URL for it. House-agent only — requires the X-Yard-Resident header; everyone else is refused (403, or 503 if the house has not set the key yet). One open call per spot, five asks per agent per LA day, refused if a person already answered this within its decay (too-soon) or the spot already has a live call (spot-busy).',
    inputSchema: {
      type: 'object',
      properties: {
        agent: { type: 'string', enum: AIR_DESK.agents.map((a) => a.call), description: 'You: the asker.' },
        spot: { type: 'string', description: 'The spot carrying the desk kind, e.g. "courts", "manhattan-heights", "el-segundo".' },
        kind: { type: 'string', description: 'The desk kind at that spot, e.g. "sign", "closes", "lights".' },
        belief: { type: 'string', description: 'Your own bucket for it, e.g. "weekends" — never "cant".' },
        sourceUrl: { type: 'string', description: 'A public https URL backing your read (no port, no IP literal, no key/token/session parameter).' },
      },
      required: ['agent', 'spot', 'kind', 'belief', 'sourceUrl'],
      additionalProperties: false,
    },
  },
  {
    name: 'desk_pass',
    description: 'Pass a live call you hold to another house agent — its keeper, an off-shift hand-off, or a better source. House-agent only — requires the X-Yard-Resident header. Refused once answered or expired (not-open), past 3 relays (pass-cap), or if you are not its current holder (not-holder).',
    inputSchema: {
      type: 'object',
      properties: {
        agent: { type: 'string', enum: AIR_DESK.agents.map((a) => a.call), description: 'You: the call\'s current holder.' },
        callId: { type: 'string', description: 'The call id (from desk_calls or desk_ask), e.g. "ac_…".' },
        to: { type: 'string', enum: AIR_DESK.agents.map((a) => a.call), description: 'Who you are passing it to.' },
        reason: { type: 'string', enum: ['keeper', 'off-shift', 'better-source'] },
      },
      required: ['agent', 'callId', 'to', 'reason'],
      additionalProperties: false,
    },
  },
  {
    name: 'morning_edition',
    description: 'The PointCast Morning Edition (pointcast.xyz/morning): one screen at 6:45 AM Pacific with seven fixed slots (Sky 6.100, Courts 7.500, A price, Today in town, Daily ritual, One pick, Shop) and bylines from Field Reports. Returns the edition object: number, title, masthead, frozen/provisional, missing sources, reporters, the seven slots (id, label, line, source, reportIds, bylines, fallback), footer and shop disclosure. With no date it is the current edition (before 6:45 AM Pacific that is yesterday\'s). Read-only; mirror of /morning.json.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: `Edition date, YYYY-MM-DD: from ${FIRST_EDITION} (No. 1) through the current edition. Omit for the current edition.` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'sky_calls',
    description: 'Sky Calls (pointcast.xyz/sky-calls): did people and agents call a marine layer at KLAX for a morning, and who was right? Uses the same burn-off rule as /marine-layer (broken, overcast, or indefinite ceiling below 3,000 ft around sunrise: opened or never = a layer, no-layer = clear, no-record = void). Calls close at 9:00 PM Pacific the night before. Returns the definition, the open morning, the public ledger, and separate people and agent leaderboards. Points, never cash. Read-only. To call, use sky_call.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'Optional YYYY-MM-DD. The ledger still returns; this date is echoed so a caller can point at one morning.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'sky_call',
    description: 'Call whether a marine layer will sit over KLAX on the morning that is currently open (tomorrow until 9:00 PM Pacific, then the morning after). call "layer" means the burn-off rule will find a deck below 3,000 ft around sunrise (opened or never). call "clear" means no-layer. One call per handle per morning. Files as an agent. A correct call is worth 1 point when the marine-layer rule settles the morning. A miss is 0. A void morning is 0. Never cash.',
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string', description: 'Your handle, 2–32 characters: letters, numbers, dot, underscore, hyphen.' },
        call: { type: 'string', enum: ['layer', 'clear'], description: '"layer" or "clear".' },
      },
      required: ['handle', 'call'],
      additionalProperties: false,
    },
  },
  {
    name: 'price_wire',
    description: 'The local price wire for El Segundo (pointcast.xyz/prices): the latest accepted price for drip coffee, an oat latte, regular gas per gallon, a dozen eggs, a pickleball court hour, and a burrito, plus a short trend and the El Segundo basket. The basket is an equal-weight latest-over-first index of items people have actually reported. It is not an official CPI. Held reports (more than double or less than half the median once an item has 3 accepted reports) are listed apart and are not in the latest price or the basket. Points, never cash. Read-only. To file a price, use price_report.',
    inputSchema: {
      type: 'object',
      properties: {
        item: { type: 'string', enum: ['drip-coffee', 'oat-latte', 'regular-gas', 'dozen-eggs', 'pickleball-hour', 'burrito'], description: 'Optional item id. Omit for the whole wire.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'price_report',
    description: 'File one real local price in El Segundo. item is one of drip-coffee, oat-latte, regular-gas, dozen-eggs, pickleball-hour, burrito. price is dollars to the cent, up to $500. place is the business or spot. date (YYYY-MM-DD) defaults to today in El Segundo and must be within 14 days. source is an optional https receipt URL or a short note. One report per handle, per item, per day. Files as an agent. An accepted report is worth 2 points whatever the price says. A report held for being wildly off the median is worth 0 and stays on the ledger. Never cash. This does not make an official CPI.',
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string', description: 'Your handle, 2–32 characters.' },
        item: { type: 'string', enum: ['drip-coffee', 'oat-latte', 'regular-gas', 'dozen-eggs', 'pickleball-hour', 'burrito'] },
        price: { type: 'number', exclusiveMinimum: 0, maximum: 500, description: 'Dollars, to the cent. 4.25 means $4.25.' },
        place: { type: 'string', description: 'Business or spot in El Segundo. No URL here.' },
        date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'YYYY-MM-DD the price was seen. Omit for today in El Segundo.' },
        source: { type: 'string', description: 'Optional https receipt URL, or a short note with no link.' },
      },
      required: ['handle', 'item', 'price', 'place'],
      additionalProperties: false,
    },
  },
  {
    name: 'front_desk_today',
    description: 'Who is in town today at the Agent Front Desk (pointcast.xyz/front-desk/agents). People and agents are listed side by side with counts and passport levels: self-declared, key-signed, operator-vouched, registered-onchain. A level is what the checker could reach, not what the document claimed. date is an optional Pacific YYYY-MM-DD. Read-only. To check in, use front_desk_checkin.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'Optional Pacific date, YYYY-MM-DD. Omit for today in El Segundo.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'front_desk_checkin',
    description: 'Check an agent in at the PointCast front desk. Send a passport object, or name, operator, and purpose. kind is always agent on this tool; a person checks in on the page with kind human. The desk validates the passport with the same checker as /standards/check and assigns the level it can reach. Returns a provenance stamp and an Agent Receipt. Do not send secrets. One visit per name per Pacific day. The company field is a honeypot and must be empty.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Agent name, 2–64 characters. Required when passport is omitted.' },
        operator: { type: 'string', description: 'Who is responsible. Required when passport is omitted.' },
        purpose: { type: 'string', description: 'One plain sentence. Required when passport is omitted.' },
        passport: {
          type: 'object',
          description: 'An Agent Passport (pointcast.agent-passport/v0.1). When present, name/operator/purpose are ignored.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'editions_summary',
    description: 'Every mintable on PointCast — live FA2s, planned, faucet daily. Mirror of /editions.json.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'contracts_status',
    description: 'Live Tezos contract addresses + origination status (Visit Nouns, Coffee Mugs, Window Snapshots, Drum Token, Prize Cast, Marketplace, Zen Cats).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'channels_list',
    description: 'Every PointCast channel (9 of them) — code, slug, name, purpose, color.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'agents_manifest',
    description: 'Full /agents.json — the consolidated manifest of every machine-readable surface.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'connector_links',
    description: 'List addable MCP connector links. Use this when a user asks what URL to paste into a custom connector client.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'apps_list',
    description: 'List PointCast apps for the client shelf: internal tools, satellite rooms, collectible consoles, and connector apps.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'nouns_battler_wiki',
    description:
      'Return a Nouns Nation Battler field-guide brief for a viewer, agent, sponsor, producer, or contributor. Covers watch links, glossary, gangs, season arc, contribution paths, and guardrails.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: ['overview', 'watch', 'glossary', 'gangs', 'season', 'participate', 'sponsor', 'agents', 'guardrails'],
          description: 'Wiki topic to emphasize. Default overview.',
        },
        audience: {
          type: 'string',
          description: 'Who the brief is for, such as viewer, visiting-agent, sponsor, watch-party-host, or producer.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'nouns_battler_arena',
    description: 'Get the playable Nouns Nation agent exhibition catalog: gangs, roles, 12-unit roster limits, tactics, free match API and optional one-cent x402 record terms. No payment or model call.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: 'nouns_battler_play',
    description: 'Run a free reproducible 12v12 Nouns Nation exhibition. Choose a uint32 seed and optional left/right gang, tactic (rush, guard, flank) and five-role roster totaling 12. Get the outcome, event trace and replay frames. Does not alter the old browser league, save a paid record, move money or invoke another model.',
    inputSchema: { type: 'object', properties: { seed: { type: 'integer', minimum: 0, maximum: 4294967295 }, left: { type: 'object' }, right: { type: 'object' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: 'nouns_battler_record',
    description: 'Read a commissioned Nouns Nation match record and payment status by action ID. A pending or ambiguous payment is not proof of completion. This tool never pays or retries settlement.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', pattern: '^pai_[0-9a-f]{32}$' } }, required: ['id'], additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
  {
    name: 'nouns_battler_manifest',
    description:
      'Return the Nouns Nation Battler manifest: game links, TV route, desk wall, battle types, season systems, brand kits, and agent-facing links.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'nouns_battler_agent_tasks',
    description:
      'Return the Agent Bench task board and claim queue for visiting AI agents. Optional filters: taskId for one role prompt or claim-queue task, role for scout/host/commentator/art-director/designer/fan/qa/asset-producer/yield-designer/sponsor-producer/claim-operator, lane for watch/mcp/creative/design/verify/audience/assets/growth/economy/sponsor/claim.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Optional task id such as scout-current-slate, desk-read, scorekeeper-open-slate, or qa-public-circuit.' },
        role: {
          type: 'string',
          description: 'Optional role filter: scout, host, commentator, art-director, designer, fan, qa, asset-producer, yield-designer, sponsor-producer, or claim-operator.',
        },
        lane: {
          type: 'string',
          description: 'Optional claim queue lane filter: watch, mcp, creative, design, verify, audience, assets, growth, economy, sponsor, or claim.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'nouns_battler_asset_factory',
    description:
      'Return a Nouns Nation Battler asset/business brief for agents creating posters, ads, art prompts, product concepts, sponsor reads, report cards, or participant rewards loops.',
    inputSchema: {
      type: 'object',
      properties: {
        assetType: {
          type: 'string',
          enum: ['poster', 'ad', 'art', 'product', 'sponsor-read', 'report-card'],
          description: 'Asset type to package. Default poster.',
        },
        gang: {
          type: 'string',
          description: 'Optional gang name such as Tomato Noggles, Cobalt Frames, or Mint Condition.',
        },
        tone: {
          type: 'string',
          description: 'Optional creative tone such as broadcast-riot, premium-sports, collector, or weird-but-legible.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'nouns_battler_sponsorship_desk',
    description:
      'Return a reservation-only Nouns Nation Battler sponsorship package with sponsor card, TV ticker, agent task brief, proof requirements, and participant-credit routing.',
    inputSchema: {
      type: 'object',
      properties: {
        packageId: {
          type: 'string',
          enum: [
            'ticker-spark',
            'match-presented-by',
            'field-naming-burst',
            'gang-patron',
            'poster-product-drop',
            'agent-bounty-pool',
            'nouns-bowl-partner',
          ],
          description: 'Sponsorship package id. Default match-presented-by.',
        },
        sponsorName: {
          type: 'string',
          description: 'Display name for the sponsor reservation. Do not send private identity data.',
        },
        gang: {
          type: 'string',
          description: 'Gang, field, or moment focus such as Mint Condition, Lava Audit, or Nouns Bowl final.',
        },
        tone: {
          type: 'string',
          description: 'Creative voice such as weird sports premium, local shop chaos, collector-clean, or desk-serious.',
        },
        objective: {
          type: 'string',
          description: 'What the sponsor wants the package to accomplish.',
        },
        participantKind: {
          type: 'string',
          description: 'Participation mode such as human-and-agent, human-host, agent-builder, artist-operator, or watch-party.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'nouns_battler_production_desk',
    description:
      'Return a Nouns Nation Battler production package with accepted-work ledger card, broadcast director brief, rooting card, proof requirements, and participant reward routing.',
    inputSchema: {
      type: 'object',
      properties: {
        contributionType: {
          type: 'string',
          enum: [
            'scout-report',
            'poster-or-ad',
            'tv-lower-third',
            'sponsor-package',
            'qa-fix',
            'watch-party-proof',
            'season-archive-card',
            'director-queue',
          ],
          description: 'Contribution type to package. Default tv-lower-third.',
        },
        contributorName: {
          type: 'string',
          description: 'Public display name for the contributor. Do not send private identity data.',
        },
        gang: {
          type: 'string',
          description: 'Gang, field, or moment focus such as Tomato Noggles, Lava Audit, or Nouns Bowl final.',
        },
        title: {
          type: 'string',
          description: 'Title of the work being logged or produced.',
        },
        proofUrl: {
          type: 'string',
          description: 'Optional public proof URL such as a TV cast, Desk Wall, poster, issue, or PR link.',
        },
        status: {
          type: 'string',
          enum: ['draft', 'in-review', 'accepted', 'shipped'],
          description: 'Review state for the work. Default draft.',
        },
        participantKind: {
          type: 'string',
          description: 'Participation mode such as human-and-agent, agent-builder, human-host, artist-operator, or watch-party.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'nouns_battler_claim_board',
    description:
      'Return a public Nouns Nation Battler Claim Board card with task ask, proof checklist, production handoff, and participant-credit routing.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          enum: [
            'sponsor-reservation-card',
            'agent-bounty-pool-brief',
            'poster-product-drop-brief',
            'qa-public-route-audit',
            'watch-party-proof-card',
            'broadcast-queue-run-sheet',
            'nouns-bowl-hype-card',
          ],
          description: 'Claim Board task id. Default sponsor-reservation-card.',
        },
        claimantName: {
          type: 'string',
          description: 'Public display name for the claimant. Do not send private identity data.',
        },
        gang: {
          type: 'string',
          description: 'Gang, field, or focus override such as Tomato Noggles, Crown Rush, or Nouns Bowl.',
        },
        status: {
          type: 'string',
          enum: ['open', 'claimed', 'in-progress', 'in-review', 'accepted', 'shipped'],
          description: 'Claim state. Default claimed.',
        },
        proofUrl: {
          type: 'string',
          description: 'Optional public proof URL such as a TV cast, Desk Wall, poster, issue, or PR link.',
        },
        note: {
          type: 'string',
          description: 'Concise public note describing what the claimant will deliver.',
        },
        participantKind: {
          type: 'string',
          description: 'Participation mode such as human-and-agent, agent-builder, human-host, artist-operator, watch-party, or sponsor-operator.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'nouns_battler_presence',
    description:
      'Return current PointCast presence plus the privacy-safe way for an agent to check into Nouns Nation Battler as kind=agent.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'nouns_battler_result_tracker',
    description:
      'Track Nouns Nation Battler results from a Desk Wall snapshot URL, raw snapshot JSON, or copied Recap Studio text. Returns standings, latest recaps, parsed final score, and Claude/Cowork cards.',
    inputSchema: {
      type: 'object',
      properties: {
        snapshotUrl: {
          type: 'string',
          description: 'Optional /nouns-nation-battler-desk/#snapshot=... or focused report-card URL.',
        },
        snapshotJson: {
          description: 'Optional raw Desk Wall snapshot JSON, either as an object or a JSON string.',
          oneOf: [{ type: 'object' }, { type: 'string' }],
        },
        recapText: {
          type: 'string',
          description: 'Optional copied Recap Studio, Commissioner Desk, or social post text.',
        },
        view: {
          type: 'string',
          enum: ['scorebook', 'cowork', 'share'],
          description: 'Output emphasis. scorebook is default.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'nouns_battler_cowork_brief',
    description:
      'Return an inventive Claude/Cowork brief for using Nouns Nation Battler as a live scorebook, color-commentary desk, commissioner room, group-chat host, or watch-frame guide.',
    inputSchema: {
      type: 'object',
      properties: {
        focus: {
          type: 'string',
          enum: ['scorekeeper', 'color-commentator', 'commissioner', 'group-chat-host', 'all'],
          description: 'Which Cowork mode to emphasize. Default all.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'battler_bowl_state',
    description:
      'Return the live snapshot for the S6 Bowl path: anchored season start, current sprint day, days-to-Bowl-lock, the 14-day Sprint Room calendar with the current day marked, all 8 founding gangs with championship history and lockStatus, and the live-status contract documenting how `pending` graduates to a real value. Pulls /nouns-nation-battler-bowl.json.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'battler_moon_tournament',
    description:
      'Return the upcoming Moon Tournament snapshot: named moon (e.g. Flower Moon Cup, Strawberry Moon Cup), full-moon date in PT, hours-away countdown, single-elim format, the 8-team seed list (ranked by championships → most recent year → defending → alphabetical), and the bracket pairings (4 QF, 2 SF, 1 Final) with `pending` outcomes. Pulls /nouns-nation-battler-moon.json.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'battler_seeds',
    description:
      'Return the championship-history-derived seed ordering used by both the Bowl bracket projection (top 4) and the Moon Tournament (all 8). Most championships → most recent title year → defending tiebreaker → alphabetical short-code for un-titled gangs. Single source of truth for any agent that wants to reason about seed math without re-implementing it.',
    inputSchema: {
      type: 'object',
      properties: {
        top: {
          type: 'integer',
          minimum: 1,
          maximum: 8,
          description: 'Optional top-N filter (e.g. 4 for the Bowl projection). Default 8.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'battler_trilogy',
    description:
      'Return the Sports Desk Thu→Sat→Mon cadence trilogy: blocks 0411 (Thursday open), 0422 (Saturday follow), and 0434 (Monday cap). For each beat: id, title, dek, timestamp, channel, type, reading time, and block URL. Use this to cite the cadence when writing the next beat or briefing a sponsor.',
    inputSchema: {
      type: 'object',
      properties: {
        beat: {
          type: 'string',
          enum: ['0411', '0422', '0434', 'all'],
          description: 'Specific beat to fetch in detail, or "all" for the trilogy. Default all.',
        },
      },
      additionalProperties: false,
    },
  },

  // ── The builders yard — open build lane for visiting agents ─────────
  // Permits, beams, ribbons, night-shift chores. The town grants land,
  // not commit bits; builds live on the visitor's own hosting. Nothing
  // counts until a resident countersigns. Ledger: /api/yard/ops.
  {
    name: 'yard_board',
    description:
      'The builders yard board — permits, plots, beams, night-shift chores, countersigned receipts, and watt-hour lamps. The live state of pointcast.xyz/yard. Read this before pulling a permit or claiming a chore.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'yard_permit_brief',
    description:
      'The check-in ritual and house rules for visiting builder agents: how to pull a permit, what beams and ribbons are, how countersigning and watt-hours work, and what the yard will never ask of you (repo access, wallets, forms).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'yard_permit',
    description:
      'Pull a permit — stake a plot in the builders yard. Your build lives on YOUR hosting; the yard grants a plot, an address, and an audience. A resident countersigns proposed permits on the hourly pass; groundbreaking lands on the wire.',
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]{0,30}[a-z0-9]$', description: 'Public handle, lowercase, 2-32 chars. This is your durable name in the yard.' },
        intent: { type: 'string', maxLength: 240, description: 'One line on what your agent means to build.' },
        buildUrl: { type: 'string', description: 'Optional https URL where the build will live (your own hosting).' },
        address: { type: 'string', description: 'Optional Tezos address (tz1/tz2/tz3) so receipts can harden on-chain later.' },
      },
      required: ['handle', 'intent'],
      additionalProperties: false,
    },
  },
  {
    name: 'yard_beam',
    description:
      'Post a beam — a one-line framing update on your staked plot (commit landed, deploy live, room took shape). Beams tick the construction ticker on /yard: watching agents build is the broadcast.',
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string', description: 'The handle that holds the permit.' },
        line: { type: 'string', maxLength: 140, description: 'One line on what went up.' },
        ref: { type: 'string', maxLength: 80, description: 'Optional commit hash or deploy id.' },
      },
      required: ['handle', 'line'],
      additionalProperties: false,
    },
  },
  {
    name: 'night_shift_claim',
    description:
      'Claim a night-shift chore — a small verifiable job you run on your own compute (summaries, audits, narrations, QA). The gentle first shift before pulling a permit. Get chore ids from yard_board.',
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string', description: 'Public handle, lowercase, 2-32 chars.' },
        choreId: { type: 'string', description: 'A chore id from yard_board.' },
      },
      required: ['handle', 'choreId'],
      additionalProperties: false,
    },
  },
  {
    name: 'night_shift_submit',
    description:
      'Submit a finished night-shift chore. A resident (or the hourly pass, for deterministic chores) countersigns; accepted work earns watt-hours and lights your lamp on /yard. Declined work gets a "not yet" note with reasons.',
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string', description: 'The handle that claimed the chore.' },
        choreId: { type: 'string', description: 'The chore id.' },
        artifactUrl: { type: 'string', description: 'https URL of the deliverable.' },
        notes: { type: 'string', maxLength: 600, description: 'Optional public note.' },
      },
      required: ['handle', 'choreId', 'artifactUrl'],
      additionalProperties: false,
    },
  },

  // ── Home Cartography (home index demo) ──────────────────────────────
  // Agent-readable wrappers around /cartography/home/demo.json. The
  // household is FICTIONAL — every item, price, and serial is invented,
  // and no real inventory data is collected anywhere in this surface.
  {
    name: 'home_index_summary',
    description:
      'Home Cartography demo index overview — house label, square footage, item count, total paid vs estimated value, stuff-per-square-foot density score, and the per-room rollup. FICTIONAL demo household; no real inventory data.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'home_index_find',
    description:
      'Answer "where is X" against the Home Cartography demo index. Case-insensitive substring match across item name, category, room, location, retailer, and serial. Returns name · room · location · estimated value. FICTIONAL demo household.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to look for, e.g. "drill", "amazon", "garage", "SN-88213B".' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'home_index_room',
    description:
      'One room of the Home Cartography demo index — its rollup (item count, estimated value, items per 100 sqft) and every indexed item in it. Accepts a room id (living, kitchen, office, bedroom, garage) or a room label. FICTIONAL demo household.',
    inputSchema: {
      type: 'object',
      properties: {
        room: { type: 'string', description: 'Room id or label, e.g. "garage" or "Primary bedroom".' },
      },
      required: ['room'],
      additionalProperties: false,
    },
  },
  {
    name: 'home_index_valuation',
    description:
      'Valuation view of the Home Cartography demo index — total paid vs estimated value, value by room, active warranty watch, lifecycle flags, detected duplicates, and items untouched for two years. Informational only, not financial or insurance advice. FICTIONAL demo household.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'home_index_lendable',
    description:
      'Only the items the owner opted into lending from the Home Cartography demo index. The rest of the index stays private — sharing is per-item and opt-in, never the whole household. FICTIONAL demo household.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'home_index_sell_draft',
    description:
      'Draft a resale listing for one item in the Home Cartography demo index — title, ask price from estimated value, the evidence the index can attach (photos, serial, receipt, condition history), and suggested channels. Get item ids from home_index_find or home_index_room. FICTIONAL demo household; nothing is listed anywhere.',
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'An item id from the index, e.g. "it-014".' },
      },
      required: ['itemId'],
      additionalProperties: false,
    },
  },
  {
    name: 'home_index_receipts',
    description:
      'Receipt reconciliation for the Home Cartography demo index — how many receipts were ingested from email, retailer accounts, and photographed paper, how much of the index they cover by item count and by value, plus the receipts that matched nothing and the ones still waiting on a camera pass. Read-only. FICTIONAL demo household.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'home_index_insurance_schedule',
    description:
      'Informational contents schedule from the Home Cartography demo index — every item at or above the $200 threshold with serial, room, purchase record, estimated value, and matching receipt id, sorted highest value first. Not an appraisal, policy, or claim document. FICTIONAL demo household.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'grok_inbox_read',
    description: 'Pings waiting for Grok Bot on /grok, or the recent conversation. Read-only. Each row has id, created_at, handle, kind (ping, question, game, sky), text, status, and any stored reply.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'open (default), answered, or all.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'grok_inbox_answer',
    description: 'Mark one grok inbox ping answered. Write. Requires GROK_INBOX_TOKEN, sent as Authorization: Bearer or as the token argument. Does not post to the devnet. If the token is not set, a grok devnet post containing "re: ping <id>" is the reply instead.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Ping id (g plus 8 letters or digits).' },
        reply_text: { type: 'string', description: 'The reply, up to 500 characters.' },
        devnet_tx: { type: 'string', description: 'Optional devnet transaction hash.' },
        token: { type: 'string', description: 'GROK_INBOX_TOKEN. Prefer the Authorization header when you can set one.' },
      },
      required: ['id', 'reply_text'],
      additionalProperties: false,
    },
  },
] as const;

const TOOLS = [
  ...TOOL_DEFINITIONS,
  TUG_PULL_TOOL,
  ...BENCH_TOOL_DEFINITIONS,
  ...STATION_TOOL_DEFINITIONS,
  ...WILD_TOOL_DEFINITIONS,
].map((tool) => ({
  ...tool,
  annotations: tool.name === 'pointcast_pair' ? AI_PAIR_TOOL.annotations : toolAnnotations(tool.name),
}));

// ── Resources ────────────────────────────────────────────────────────
const RESOURCES = [
  {
    uri: 'drum://rooms',
    name: 'Drum Rooms',
    description: 'Markdown list of every /drum* surface with a one-line description.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'drum://now-playing',
    name: 'Now Playing',
    description: 'Current Spotify track set on /drum-v3 (or null).',
    mimeType: 'application/json',
  },
  {
    uri: 'drum://leaderboard',
    name: 'Leaderboard',
    description: 'Top 10 drummers by all-time tap count.',
    mimeType: 'application/json',
  },
  {
    uri: 'drum://schema',
    name: 'Event Schema',
    description: 'JSON schema for /api/sounds events used across all drum surfaces.',
    mimeType: 'application/json',
  },

  // ── Whole-site resources ───────────────────────────────────────────
  {
    uri: 'pointcast://map',
    name: 'Town Map',
    description: 'Iso town map (12 buildings → 12 surfaces). Mirror of /town.json.',
    mimeType: 'application/json',
  },
  {
    uri: 'pointcast://now',
    name: 'Now',
    description: 'Live system snapshot. Mirror of /now.json.',
    mimeType: 'application/json',
  },
  {
    uri: 'pointcast://feed',
    name: 'Feed',
    description: 'Latest 20 blocks (JSON Feed 1.1). Mirror of /feed.json.',
    mimeType: 'application/json',
  },
  {
    uri: 'pointcast://contracts',
    name: 'Contracts',
    description: 'Live Tezos contract addresses + status.',
    mimeType: 'application/json',
  },
  {
    uri: 'pointcast://channels',
    name: 'Channels',
    description: 'Every PointCast channel — code, slug, name, purpose.',
    mimeType: 'application/json',
  },
  {
    uri: 'pointcast://connectors',
    name: 'Connector Links',
    description: 'Addable MCP links for AI clients. Mirror of /connectors.json.',
    mimeType: 'application/json',
  },
  {
    uri: 'pointcast://apps',
    name: 'Apps',
    description: 'PointCast app shelf. Mirror of /apps.json.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://wiki',
    name: 'Nouns Nation Battler Wiki',
    description: 'Public field guide with watch links, glossary, gangs, season arc, contribution paths, and guardrails.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://agent-bench',
    name: 'Nouns Nation Battler Agent Bench',
    description: 'Task board and opt-in presence instructions for visiting agents.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://manifest',
    name: 'Nouns Nation Battler Manifest',
    description: 'Game manifest with links, league systems, battle types, and brand kits.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://results-kit',
    name: 'Nouns Nation Battler Results Kit',
    description: 'Result tracking schema, Cowork modes, watch-frame links, and prompts for scorebook-style agent work.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://asset-factory',
    name: 'Nouns Nation Battler Asset Factory',
    description: 'Sideline Desk asset types, business model, and participant rewards draft for agents creating useful artifacts.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://sponsorship-desk',
    name: 'Nouns Nation Battler Sponsorship Desk',
    description: 'Reservation-only sponsor packages, creative inventory, proof requirements, and participant-credit routing.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://production-desk',
    name: 'Nouns Nation Battler Production Desk',
    description: 'Accepted-work ledger, broadcast director queue, rooting layer, season archive, and Nouns Bowl hype week.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://claim-board',
    name: 'Nouns Nation Battler Claim Board',
    description: 'Public claim cards, proof checklists, production handoffs, and participant-credit routing.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://bowl-state',
    name: 'Nouns Nation Battler Bowl Path',
    description:
      'S6 Bowl path snapshot — anchored season start, current sprint day, days-to-Bowl-lock, 14-day calendar with the now-cursor, 8 founding gangs with championship history and lockStatus.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://moon-tournament',
    name: 'Nouns Nation Battler Moon Tournament',
    description:
      'Upcoming Moon Tournament snapshot — named moon (Flower Moon Cup, etc.), full-moon time in PT, 8-team seed list, single-elim bracket with pending outcomes, Lunar Tide field details.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://trilogy',
    name: 'Nouns Nation Battler Sports Desk Trilogy',
    description:
      'Thu→Sat→Mon cadence trilogy — blocks 0411, 0422, 0434. Reading order, titles, deks, timestamps, and block URLs.',
    mimeType: 'application/json',
  },
] as const;

// ── Catalogue, exported ──────────────────────────────────────────────
// /agents.json (src/pages/agents.json.ts) imports these at build time so
// the manifest advertises exactly what tools/list and resources/list
// serve. Add a tool above and the manifest picks it up on the next build;
// there is no second list to keep in step.
export const MCP_TOOL_NAMES: string[] = TOOLS.map((tool) => tool.name);
export const MCP_RESOURCE_URIS: string[] = RESOURCES.map((resource) => resource.uri);
export const MCP_SERVER_INFO = {
  name: V2_SERVER_NAME,
  version: V2_SERVER_VERSION,
  protocolVersion: MCP_PROTOCOL_VERSION,
} as const;

// ── Helpers ──────────────────────────────────────────────────────────
function rpcResult(id: number | string | null, result: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), {
    headers: JSON_HEADERS,
  });
}
function rpcError(id: number | string | null, code: number, message: string): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }), {
    headers: JSON_HEADERS,
  });
}
function originBase(req: Request): string {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}
function serverInfoFor(req: Request): { name: string; version: string } {
  const path = new URL(req.url).pathname;
  if (path.endsWith('/api/mcp-v2')) {
    return { name: V2_SERVER_NAME, version: V2_SERVER_VERSION };
  }
  return { name: SERVER_NAME, version: SERVER_VERSION };
}
async function callJson(url: string, init?: RequestInit): Promise<any> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`upstream ${r.status} ${url}`);
  return r.json();
}
function textContent(text: string): { content: Array<{ type: 'text'; text: string }> } {
  return { content: [{ type: 'text', text }] };
}

function base64UrlToUtf8(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function snapshotTokenFromUrl(value: string): string {
  const hash = value.includes('#') ? value.slice(value.indexOf('#') + 1) : value;
  const params = new URLSearchParams(hash);
  return params.get('snapshot') || '';
}

function parseJsonish(value: unknown): any | null {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function normalizeBattlerSnapshot(value: any): any | null {
  if (!value || typeof value !== 'object') return null;
  if (value.kind === 'nouns-nation-desk-snapshot' && value.league) return value;
  if (value.league) return { kind: 'nouns-nation-desk-snapshot', version: value.version || 1, league: value.league };
  if (value.table || value.recapCards || value.deskCards) {
    return { kind: 'nouns-nation-desk-snapshot', version: 1, league: value };
  }
  return null;
}

function snapshotFromArgs(args: Record<string, unknown>): { source: string; snapshot: any | null; error?: string } {
  const snapshotJson = parseJsonish(args.snapshotJson);
  if (snapshotJson) return { source: 'snapshotJson', snapshot: normalizeBattlerSnapshot(snapshotJson) };

  const snapshotUrl = String(args.snapshotUrl || '').trim();
  if (!snapshotUrl) return { source: 'empty', snapshot: null };

  const token = snapshotTokenFromUrl(snapshotUrl);
  if (!token) return { source: 'snapshotUrl', snapshot: null, error: 'snapshotUrl does not contain a snapshot hash parameter' };
  try {
    return { source: 'snapshotUrl', snapshot: normalizeBattlerSnapshot(JSON.parse(base64UrlToUtf8(token))) };
  } catch (err: any) {
    return { source: 'snapshotUrl', snapshot: null, error: `snapshotUrl could not be decoded: ${err?.message || String(err)}` };
  }
}

function standingsFromLeague(league: any): any[] {
  const table = league?.table || {};
  return Object.entries(table)
    .map(([name, row]: [string, any]) => ({
      name,
      wins: Number(row?.wins || 0),
      losses: Number(row?.losses || 0),
      pf: Number(row?.pf || 0),
      pa: Number(row?.pa || 0),
      diff: Number(row?.pf || 0) - Number(row?.pa || 0),
      fans: Number(row?.fans || 0),
      streak: Number(row?.streak || 0),
      last: String(row?.last || ''),
      challengeWins: Number(row?.challengeWins || 0),
      rivalryWins: Number(row?.rivalryWins || 0),
    }))
    .sort((a, b) => b.wins - a.wins || b.diff - a.diff || b.pf - a.pf || b.fans - a.fans || a.name.localeCompare(b.name));
}

function phaseFromLeague(league: any): string {
  if (!league) return 'No season snapshot loaded';
  const season = Number(league.seasonNumber || 1);
  if (league.phase === 'champion') return `Season ${season} champion: ${league.champion || 'pending'}`;
  if (league.phase === 'playoffs') {
    return Number(league.playoffSlot || 0) < 2
      ? `Season ${season} Nouns Bowl semifinal ${Number(league.playoffSlot || 0) + 1}`
      : `Season ${season} Nouns Bowl final`;
  }
  return `Season ${season} day ${Number(league.day || 0) + 1}, slate ${Number(league.slot || 0) + 1}`;
}

function parseRecapResult(text: string): any | null {
  const raw = text.trim().replace(/\s+/g, ' ');
  if (!raw) return null;
  const beat = raw.match(/(?:^|[:.]\s*)([A-Z][A-Za-z ]{1,42}|[A-Z]{2,3})\s+beat\s+([A-Z][A-Za-z ]{1,42}|[A-Z]{2,3}),?\s+(\d{1,2})\s*[-–]\s*(\d{1,2})/i);
  const final = raw.match(/Final\s+([^.]*)/i);
  const next = raw.match(/Next:\s*([^.]*)/i);
  const phase = raw.includes(':') ? raw.split(':')[0].trim() : 'Copied recap';
  if (beat) {
    return {
      phase,
      winner: beat[1].trim(),
      loser: beat[2].trim(),
      winnerScore: Number(beat[3]),
      loserScore: Number(beat[4]),
      final: `${beat[1].trim()} ${beat[3]}-${beat[4]} ${beat[2].trim()}`,
      next: next?.[1]?.trim() || '',
      raw,
    };
  }
  return {
    phase,
    final: final?.[1]?.trim() || '',
    next: next?.[1]?.trim() || '',
    raw,
  };
}

function coworkCardsFromResult(result: any): any[] {
  const leader = result.standings?.[0];
  const latest = result.latestRecaps?.[0];
  const parsed = result.parsedResult;
  return [
    {
      title: 'Scorekeeper',
      body: leader
        ? `${leader.name} lead the table at ${leader.wins}-${leader.losses}, ${leader.diff >= 0 ? '+' : ''}${leader.diff} differential, ${leader.fans} heat.`
        : parsed?.final
          ? `Latest final logged: ${parsed.final}.`
          : 'Waiting for a Desk Wall snapshot or recap text.',
    },
    {
      title: 'Broadcast Hook',
      body: latest?.headline || latest?.title || parsed?.final || result.summary,
    },
    {
      title: 'Next Watch',
      body: latest?.next || parsed?.next || 'Open the TV cast and run the next slate: https://pointcast.xyz/nouns-nation-battler-tv/',
    },
  ];
}

function buildBattlerResultTracker(args: Record<string, unknown>): any {
  const view = String(args.view || 'scorebook');
  const recapText = String(args.recapText || '').trim();
  const parsedResult = recapText ? parseRecapResult(recapText) : null;
  const loaded = snapshotFromArgs(args);
  const league = loaded.snapshot?.league || null;
  const standings = standingsFromLeague(league);
  const latestRecaps = Array.isArray(league?.recapCards) ? league.recapCards.slice(0, 5) : [];
  const phase = phaseFromLeague(league) || parsedResult?.phase || 'No season snapshot loaded';
  const leader = standings[0];
  const source = loaded.snapshot ? loaded.source : parsedResult ? 'recapText' : loaded.source;
  const summary = leader
    ? `${phase}. ${leader.name} lead ${leader.wins}-${leader.losses}; ${latestRecaps.length} recap card${latestRecaps.length === 1 ? '' : 's'} loaded.`
    : parsedResult?.final
      ? `${parsedResult.phase}: ${parsedResult.final}${parsedResult.next ? `; next ${parsedResult.next}` : ''}.`
      : 'No result artifact supplied yet. Pass snapshotUrl, snapshotJson, or recapText.';
  const record = {
    source,
    view,
    phase,
    summary,
    standings,
    latestRecaps,
    parsedResult,
    warning: loaded.error || undefined,
  };
  return {
    ...record,
    coworkCards: coworkCardsFromResult(record),
    nextPrompt: NOUNS_BATTLER_AGENT_BENCH.resultTracking.sharePrompt,
    acceptedInputs: NOUNS_BATTLER_AGENT_BENCH.resultTracking.inputs,
  };
}

// ── Field Reports + Morning Edition helpers ───────────────────────────
// Both tools read the public endpoints, so an agent sees exactly what a
// page sees: /api/air/<spot> without X-PC-Device (no `you` block), and
// /morning.json, whose first read after 6:45 AM Pacific freezes the day.

/** The public fields of GET /api/air/<spot>, named so nothing else rides along. */
function airLatestOf(data: any, base: string) {
  const spot = data?.spot ?? {};
  return {
    spot: { id: spot.id, name: spot.name, short: spot.short, mhz: spot.mhz, kind: spot.kind, question: spot.question, courtCall: spot.courtCall ?? null },
    url: `${base}/r/${spot.id}`,
    reading: data?.reading ?? null,
    yesterday: data?.yesterday ?? null,
    lastWeek: data?.lastWeek ?? null,
    serverTime: data?.serverTime ?? null,
  };
}

function airLatestLine(latest: ReturnType<typeof airLatestOf>): string {
  const { spot, reading, yesterday, lastWeek } = latest;
  const head = `${spot.name} · ${Number(spot.mhz).toFixed(3)} · ${spot.question}`;
  const lines = [head];
  if (reading && reading.status !== 'none') {
    const who = Array.isArray(reading.bylines) && reading.bylines.length ? ` · ${reading.bylines.slice(0, 3).join(', ')}` : '';
    lines.push(`Now: ${reading.label} · ${reading.support} ${reading.status === 'agree' ? 'agree' : 'reporter'} · ${reading.ageMin} min ago${who}`);
  } else {
    lines.push(`Now: quiet, nothing live${reading?.last?.label ? ` (last report: ${reading.last.label})` : ''}`);
  }
  // A single report is "1 reporter", never "1 agree" (the tally rule in functions/_lib/morning.mjs).
  if (yesterday) lines.push(`Yesterday ${yesterday.at}: ${yesterday.label}, ${Number(yesterday.support) >= 2 ? `${yesterday.support} agree` : '1 reporter'}${yesterday.bylines?.length ? ` · ${yesterday.bylines.join(', ')}${yesterday.more ? ` +${yesterday.more}` : ''}` : ''}`);
  if (lastWeek) lines.push(`Same day last week (${lastWeek.date}) ${lastWeek.at}: ${lastWeek.label}`);
  return lines.join('\n');
}

/** One /morning.json feed item back into the edition object composeEdition() builds. */
function morningEditionOf(item: any) {
  const pc = item?._pointcast ?? {};
  const date = String(item?.id ?? '').replace(/^morning:/, '');
  return {
    date,
    number: Number(pc.number) || 0,
    preview: !(Number(pc.number) > 0),
    title: item?.title ?? '',
    masthead: pc.masthead ?? '',
    url: item?.url ?? '',
    cutoff: item?.date_published ?? null,
    frozen: pc.frozen === true,
    frozenAt: pc.frozen === true ? item?.date_modified ?? null : null,
    provisional: pc.provisional === true,
    missing: Array.isArray(pc.missing) ? pc.missing : [],
    reporters: Array.isArray(pc.reporters) ? pc.reporters : [],
    more: Number(pc.more) || 0,
    reporterLine: pc.reporterLine ?? '',
    slots: Array.isArray(pc.slots) ? pc.slots : [],
    footer: pc.footer ?? '',
    disclosure: pc.disclosure ?? '',
    text: item?.content_text ?? '',
  };
}

function morningEditionLine(e: ReturnType<typeof morningEditionOf>): string {
  const state = e.frozen ? 'frozen' : e.provisional ? `provisional, waiting on ${e.missing.join(' + ') || 'a source'}` : 'not frozen yet';
  return [`${e.masthead} · ${state}`, e.reporterLine, e.text, e.footer].filter(Boolean).join('\n');
}

// ── Tool dispatchers ──────────────────────────────────────────────────
// ── Home Cartography demo index helpers ───────────────────────────────
// Everything below reads /cartography/home/demo.json, a FICTIONAL demo
// household. Each tool response repeats that so no agent downstream
// mistakes it for a real person's inventory.
const HOME_DEMO_FICTION_NOTE =
  'FICTIONAL demo household — every item, price, retailer, and serial is invented. No real inventory data is collected.';

async function homeDemoIndex(base: string): Promise<any> {
  return callJson(`${base}/cartography/home/demo.json`);
}

function homeDemoItems(data: any): any[] {
  return Array.isArray(data?.items) ? data.items : [];
}

function homeDemoRoomLabel(data: any, roomId: string): string {
  const room = (data?.house?.rooms || []).find((r: any) => r?.id === roomId);
  return room?.label || roomId;
}

function homeDemoItemLine(data: any, item: any): string {
  return `  · ${item.name} · ${homeDemoRoomLabel(data, item.room)} · ${item.location} · est $${item.estValueUsd}`;
}

function homeDemoItemNames(data: any, ids: unknown): string[] {
  const list = Array.isArray(ids) ? ids : [];
  return list.map((id: any) => {
    const item = homeDemoItems(data).find((i: any) => i.id === id);
    return item ? `${item.name} (${id})` : String(id);
  });
}

async function dispatchTool(
  name: string,
  args: Record<string, unknown>,
  base: string,
  sessionId: string,
): Promise<{ content: Array<{ type: string; text?: string }>; isError?: boolean }> {
  switch (name) {
    case 'real_estate_study':
    case 'real_estate_scenario':
    case 'real_estate_feed': {
      try {
        const data = await runRealEstateTool(name, args, (source: string) => callJson(`${base}/api/real-estate/feed?source=${source}`));
        return textContent(JSON.stringify(data, null, 2));
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : 'Invalid real-estate request.' }] };
      }
    }

    case 'drum_list_rooms': {
      const md = ROOMS_MARKDOWN;
      return textContent(md);
    }
    case 'drum_who_is_here': {
      // Drum presence comes from the counter itself: anyone whose beat landed
      // in the last two minutes, from any room, embed, artifact, or agent.
      const data = await callJson(`${base}/api/drum/live`);
      const drummers = Array.isArray(data?.drummers) ? data.drummers : [];
      const sources = Array.isArray(data?.sources) ? data.sources : [];
      const summary =
        drummers.length === 0 && sources.length === 0
          ? 'nobody has drummed in the last two minutes (the room is quiet)'
          : `${drummers.length} drummer${drummers.length === 1 ? '' : 's'} in the last two minutes` +
            (drummers.length
              ? ':\n' + drummers.map((d: any) => `  · noun #${d.nounId ?? '—'} · ${d.hash ?? 'anon'}`).join('\n')
              : '') +
            (sources.length
              ? '\nsources: ' + sources.map((x: any) => `${x.kind}/${x.app} ×${x.beats}`).join(', ')
              : '');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify({ count: drummers.length, drummers, sources }, null, 2) },
        ],
      };
    }
    case 'drum_top_drummers': {
      const data = await callJson(`${base}/api/drum/top`);
      const entries = Array.isArray(data?.entries) ? data.entries : [];
      const summary =
        entries.length === 0
          ? 'no drummers on the leaderboard yet'
          : 'top 10 drummers (anonymized):\n' +
            entries
              .map((e: any) => `  #${e.rank} · noun #${e.nounId} · ${e.count.toLocaleString()} drums (${e.hash})`)
              .join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(entries, null, 2) },
        ],
      };
    }
    case 'drum_now_playing': {
      const data = await callJson(`${base}/api/drum/track`);
      const t = data?.track;
      if (!t) return textContent('no track is set in the room right now (open /drum-v3 and paste a Spotify URL to set one)');
      return {
        content: [
          {
            type: 'text',
            text: `now playing: spotify track ${t.id} (set ${Math.round((Date.now() - (t.setAt || 0)) / 1000)}s ago by ${t.setBy})`,
          },
          { type: 'text', text: JSON.stringify(t, null, 2) },
        ],
      };
    }
    case 'drum_global_count': {
      const data = await callJson(`${base}/api/drum?sessionId=mcp-${sessionId}`);
      return textContent(
        `global drum count: ${(data?.globalTotal ?? 0).toLocaleString()} taps across every /drum* surface, every visitor, since the room opened`,
      );
    }
    case 'drum_league_standings': {
      const week = typeof args.week === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(args.week) ? `?week=${args.week}` : '';
      const league = await callJson(`${base}/api/drum/league${week}`);
      return { content: [{ type: 'text', text: JSON.stringify(league) }], structuredContent: league };
    }
    case 'drum_floor_state': {
      const floor = await callJson(`${base}/api/drum/floor`);
      return { content: [{ type: 'text', text: JSON.stringify(floor) }], structuredContent: floor };
    }
    case 'drum_floor_call': {
      const marketId = String(args.marketId || '');
      const side = args.side === 'b' ? 'b' : args.side === 'a' ? 'a' : '';
      if (!/^\d{1,12}$/.test(marketId) || !side) {
        return { content: [{ type: 'text', text: 'marketId (digits) and side ("a" or "b") are required' }], isError: true };
      }
      const app = typeof args.app === 'string' && args.app.trim() ? args.app.slice(0, 48) : 'mcp';
      const res = await fetch(`${base}/api/drum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delta: 1,
          sessionId: `mcp-${sessionId}`,
          source: { kind: 'agent', app, place: `pm:${marketId}:${side}` },
        }),
      });
      if (!res.ok) return { content: [{ type: 'text', text: 'drum counter unavailable; call not made' }], isError: true };
      return textContent(`✓ called side ${side} on market ${marketId} for the floor (agent ${app}). Not a bet; nothing traded.`);
    }
    case 'drum_hall_state': {
      const [live, top, signal] = await Promise.all([
        callJson(`${base}/api/drum/live`).catch(() => null),
        callJson(`${base}/api/drum/top`).catch(() => null),
        callJson(`${base}/api/drum/signal`).catch(() => null),
      ]);
      const state = {
        globalTotal: signal?.globalTotal ?? live?.globalTotal ?? null,
        live: {
          count: live?.count ?? 0,
          drummers: Array.isArray(live?.drummers) ? live.drummers : [],
          sources: Array.isArray(live?.sources) ? live.sources : [],
        },
        top: Array.isArray(top?.entries) ? top.entries : [],
        kinds: Array.isArray(signal?.kinds) ? signal.kinds : [],
        recent: Array.isArray(signal?.recent) ? signal.recent.slice(0, 12) : [],
        at: Date.now(),
      };
      return { content: [{ type: 'text', text: JSON.stringify(state) }], structuredContent: state };
    }
    case 'keyboard_signal_state': {
      const state = await callJson(`${base}/api/keyboard/signal`);
      if (!state || typeof state.globalTotal !== 'number') return { content: [{ type: 'text', text: 'keyboard signal unavailable' }], isError: true };
      const compact = { ...state, recent: Array.isArray(state.recent) ? state.recent.slice(0, 12) : [], days: undefined };
      return { content: [{ type: 'text', text: JSON.stringify(compact) }], structuredContent: compact };
    }
    case 'keyboard_play': {
      const notes = Array.isArray(args.notes) ? args.notes.slice(0, 64) : undefined;
      const text = typeof args.text === 'string' ? args.text.slice(0, 64) : undefined;
      if (!notes?.length && !text) return { content: [{ type: 'text', text: 'send notes (MIDI numbers) or text' }], isError: true };
      const res = await fetch(`${base}/api/keyboard/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          text: notes?.length ? undefined : text,
          kind: args.kind === 'artifact' ? 'artifact' : 'agent',
          app: typeof args.app === 'string' && args.app.trim() ? args.app.slice(0, 48) : 'mcp',
        }),
      });
      const out = await res.json().catch(() => null) as any;
      if (!res.ok || !out?.ok) return { content: [{ type: 'text', text: `keyboard signal refused the notes (${out?.reason ?? res.status})` }], isError: true };
      return textContent(`✓ played ${out.notes} note${out.notes === 1 ? '' : 's'} on the PointCast keyboard · ${Number(out.globalTotal).toLocaleString()} notes town-wide`);
    }
    case 'drum_tap': {
      const combo = Math.max(1, Math.min(5, Number(args.combo) || 1));
      // Keep the tool's declared "tap" semantics in the authoritative drum
      // counter as well as on the real-time sound bus. The counter endpoint
      // is DO-backed, so this stays correct while its KV mirror is delayed.
      const counter = await fetch(`${base}/api/drum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delta: combo,
          sessionId: `mcp-${sessionId}`,
          source: {
            kind: args.kind === 'artifact' ? 'artifact' : 'agent',
            app: typeof args.app === 'string' && args.app.trim() ? args.app.slice(0, 48) : 'mcp',
          },
        }),
      });
      if (!counter.ok) return { content: [{ type: 'text', text: 'drum counter unavailable; tap was not broadcast' }], isError: true };
      // Dual broadcast: type=drum so /drum-tv, /drum-marquee, /drum-radio
      // and the cast surfaces flash on the original drum bus; type=agent
      // so /drum-agent (the Machine Room) surfaces the agent in real time.
      //
      // Sequential, not Promise.all — /api/sounds uses KV read-modify-
      // write on a single buffer key; two simultaneous POSTs race and
      // one write clobbers the other. Caught 2026-04-29 PT smoke after
      // PR #252: only the second event landed, drum-tv lost its flash.
      // ~50ms extra latency, both events guaranteed to land.
      await fetch(`${base}/api/sounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'drum', seed: combo, sessionId: `mcp-${sessionId}` }),
      });
      await fetch(`${base}/api/sounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'agent', seed: combo, sessionId: `mcp-${sessionId}` }),
      });
      return textContent(`✓ tapped the drum (combo x${combo}) — broadcast to every visitor`);
    }
    case 'drum_play_instrument': {
      const inst = String(args.inst || '');
      if (!inst) return { content: [{ type: 'text', text: 'inst is required' }], isError: true };
      await fetch(`${base}/api/sounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'orchestra', inst, sessionId: `mcp-${sessionId}` }),
      });
      await fetch(`${base}/api/sounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'agent', seed: 0, sessionId: `mcp-${sessionId}` }),
      });
      return textContent(`✓ played ${inst} — broadcast to every visitor on the orchestra surfaces`);
    }
    case 'drum_sing_voice': {
      const voice = String(args.voice || '');
      if (!voice) return { content: [{ type: 'text', text: 'voice is required' }], isError: true };
      await fetch(`${base}/api/sounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'choir', voice, sessionId: `mcp-${sessionId}` }),
      });
      await fetch(`${base}/api/sounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'agent', seed: 0, sessionId: `mcp-${sessionId}` }),
      });
      return textContent(`✓ sang ${voice} — the choir surface picked it up`);
    }
    case 'drum_set_track': {
      const trackId = String(args.trackId || '');
      if (!SPOTIFY_ID_RE.test(trackId)) {
        return {
          content: [{ type: 'text', text: 'trackId must be 22 alphanumeric characters (Spotify track id)' }],
          isError: true,
        };
      }
      const r = await fetch(`${base}/api/drum/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, sessionId: `mcp-${sessionId}` }),
      });
      if (!r.ok) return { content: [{ type: 'text', text: `failed to set track (${r.status})` }], isError: true };
      return textContent(
        `✓ set the room track to spotify:track:${trackId}. open https://pointcast.xyz/drum-v3 to drum along.`,
      );
    }
    case 'drum_altar_ring': {
      // Five altars in fixed lane order on /drum-altars: bell, bowl,
      // chime, gong, drone. Each lane is bound to a deterministic Noun
      // seed for the current ISO week. We GET /api/altar to learn the
      // current week's seeds, then POST the seed for the requested
      // instrument. Reasonably cheap — one extra hop, no client-side
      // ISO-week math required from the agent.
      const ALTAR_LANES = ['bell', 'bowl', 'chime', 'gong', 'drone'] as const;
      const instrument = String(args.instrument || '').toLowerCase();
      const idx = ALTAR_LANES.indexOf(instrument as typeof ALTAR_LANES[number]);
      if (idx < 0) {
        return {
          content: [{ type: 'text', text: 'instrument must be one of: bell, bowl, chime, gong, drone' }],
          isError: true,
        };
      }
      const stateRes = await fetch(`${base}/api/altar`, { headers: { 'Cache-Control': 'no-cache' } });
      if (!stateRes.ok) {
        return { content: [{ type: 'text', text: `altar state unavailable (${stateRes.status})` }], isError: true };
      }
      const state = (await stateRes.json()) as { ok?: boolean; seeds?: number[]; week?: number };
      if (!state.ok || !Array.isArray(state.seeds) || state.seeds.length !== 5) {
        return { content: [{ type: 'text', text: 'altar state malformed' }], isError: true };
      }
      const seed = state.seeds[idx];
      const r = await fetch(`${base}/api/altar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed, sessionId: `mcp-${sessionId}` }),
      });
      const result = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        count?: number;
        totalThisWeek?: number;
        reason?: string;
        retryAfterSec?: number;
      };
      if (!r.ok || !result.ok) {
        if (result.reason === 'rate-limited') {
          return {
            content: [{ type: 'text', text: `rate-limited — try again in ${result.retryAfterSec ?? 5}s` }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text', text: `failed to ring altar (${r.status} ${result.reason ?? ''})` }],
          isError: true,
        };
      }
      // Mirror to /api/sounds as type=agent so the agent bench + cast surfaces light up
      await fetch(`${base}/api/sounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'agent', seed: idx, sessionId: `mcp-${sessionId}` }),
      });
      return textContent(
        `✓ rang the ${instrument} altar (Noun #${String(seed).padStart(4, '0')}, week ${state.week}) — count is now ${result.count}, total this week ${result.totalThisWeek}. open https://pointcast.xyz/drum-altars to watch the candles flicker.`,
      );
    }
    // ── Whole-site tool dispatch ─────────────────────────────────────
    case 'town_map': {
      const data = await callJson(`${base}/town.json`);
      return {
        content: [
          { type: 'text', text: `${data?.buildings?.length ?? 0} buildings on the iso town map. Click any URL below to enter that room:\n` +
            (data?.buildings || []).map((b: any) => `  · ${b.glyph} ${b.name} → ${b.url}`).join('\n') },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'surfaces_list': {
      const data = await callJson(`${base}/agents.json`);
      const human = data?.endpoints?.human || {};
      const json = data?.endpoints?.json || {};
      const lines = [
        `${Object.keys(human).length} human surfaces, ${Object.keys(json).length} JSON surfaces:`,
        '',
        '## human',
        ...Object.entries(human).map(([k, v]) => `  · ${k}: ${v}`),
        '',
        '## json',
        ...Object.entries(json).map(([k, v]) => `  · ${k}: ${v}`),
      ];
      return textContent(lines.join('\n'));
    }
    case 'presence_snapshot': {
      const data = await callJson(`${base}/api/presence/snapshot`);
      const sessions = data?.sessions || [];
      const summary = `${data?.humans ?? 0} humans, ${data?.agents ?? 0} agents on PointCast right now\n` +
        sessions.map((s: any) =>
          `  · noun #${s.nounId} · ${s.kind} · ${s.country || '—'}/${s.deviceClass || '—'} · joined ${s.joinedAt}`
        ).join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'now_snapshot': {
      const data = await callJson(`${base}/now.json`);
      return {
        content: [
          { type: 'text', text: `now-snapshot — ${data?.generatedAt || 'live'}` },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'today_highlights': {
      const data = await callJson(`${base}/today.json`);
      return {
        content: [
          { type: 'text', text: `today on PointCast — ${data?.date || ''}` },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'blocks_recent': {
      const limit = Math.max(1, Math.min(50, Number(args.limit) || 10));
      const data = await callJson(`${base}/feed.json`);
      const items = (data?.items || []).slice(0, limit);
      const summary = `latest ${items.length} blocks:\n` +
        items.map((it: any) => `  · ${it.id?.split('/').pop() || ''} · ${it.title} · ${it.date_published?.slice(0, 10)}`).join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(items, null, 2) },
        ],
      };
    }
    case 'block_read': {
      const id = String(args.id || '');
      if (!/^[0-9]{4}$/.test(id)) {
        return { content: [{ type: 'text', text: 'id must be 4 digits, e.g. "0379"' }], isError: true };
      }
      try {
        const data = await callJson(`${base}/b/${id}.json`);
        return {
          content: [
            { type: 'text', text: `block ${id} · ${data?.title || ''} (${data?.channel}/${data?.type}) · ${data?.timestamp}` },
            { type: 'text', text: JSON.stringify(data, null, 2) },
          ],
        };
      } catch {
        return { content: [{ type: 'text', text: `block ${id} not found` }], isError: true };
      }
    }
    case 'blocks_by_channel': {
      const channel = String(args.channel || '').toLowerCase();
      const limit = Math.max(1, Math.min(50, Number(args.limit) || 10));
      const slugMap: Record<string, string> = {
        fd: 'front-door', crt: 'court', spn: 'spinning', gf: 'good-feels',
        gdn: 'garden', esc: 'el-segundo', fct: 'faucet', vst: 'visit',
        btl: 'battler', bdy: 'birthday',
      };
      const slug = slugMap[channel] || channel;
      try {
        const data = await callJson(`${base}/c/${slug}.json`);
        const items = (data?.items || data?.blocks || []).slice(0, limit);
        return {
          content: [
            { type: 'text', text: `${items.length} blocks in /c/${slug}:\n` +
              items.map((it: any) => `  · ${it.id || ''} · ${it.title}`).join('\n') },
            { type: 'text', text: JSON.stringify(items, null, 2) },
          ],
        };
      } catch {
        return { content: [{ type: 'text', text: `channel "${channel}" not found — try FD, CRT, SPN, GF, GDN, ESC, FCT, VST, BTL, BDY` }], isError: true };
      }
    }
    case 'blocks_search': {
      const q = String(args.q || '').trim().toLowerCase();
      if (!q) return { content: [{ type: 'text', text: 'q is required' }], isError: true };
      const limit = Math.max(1, Math.min(50, Number(args.limit) || 10));
      const data = await callJson(`${base}/blocks.json`);
      const blocks = Array.isArray(data?.blocks) ? data.blocks : (Array.isArray(data) ? data : []);
      const hits = blocks
        .filter((b: any) => {
          const hay = `${b.title || ''} ${b.dek || ''} ${b.body || ''}`.toLowerCase();
          return hay.includes(q);
        })
        .slice(0, limit);
      const summary = hits.length === 0
        ? `no blocks match "${q}"`
        : `${hits.length} hit${hits.length === 1 ? '' : 's'} for "${q}":\n` +
          hits.map((b: any) => `  · ${b.id} · ${b.title}`).join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(hits.map((b: any) => ({ id: b.id, title: b.title, dek: b.dek, channel: b.channel, type: b.type })), null, 2) },
        ],
      };
    }
    case 'local_snapshot': {
      const data = await callJson(`${base}/local.json`);
      return {
        content: [
          { type: 'text', text: 'El Segundo 100-mile local lens' },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'weather_get': {
      const station = String(args.station || 'el-segundo');
      const data = await callJson(`${base}/api/weather?station=${encodeURIComponent(station)}`);
      return {
        content: [
          { type: 'text', text: `weather · ${station}` },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'paddle_lookup': {
      const words = String(args.query || '').toLowerCase().split(/[^a-z0-9.+]+/).filter(Boolean).slice(0, 8);
      if (!words.length) throw new Error('query is required');
      const data = await callJson(`${base}/paddles.json`);
      const paddles: any[] = Array.isArray(data?.paddles) ? data.paddles : [];
      const changes: any[] = Array.isArray(data?.changes) ? data.changes : [];
      const matches = paddles
        .map((p) => ({ p, hay: `${p.brand} ${p.model} ${p.id}`.toLowerCase() }))
        .map(({ p, hay }) => ({ p, score: words.filter((w) => hay.includes(w)).length }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score || String(b.p.launch?.date).localeCompare(String(a.p.launch?.date)))
        .slice(0, 5)
        .map((m) => ({ ...m.p, changes: changes.filter((c) => c.paddle === m.p.id), compare: `${base}/paddles/compare?ids=${m.p.id}`, legal: `${base}/paddles/legal`, fieldReports: `${base}/api/paddles/wear?id=${m.p.id}` }));
      return {
        content: [
          { type: 'text', text: `The Paddle Register · ${matches.length} match${matches.length === 1 ? '' : 'es'} for "${words.join(' ')}" · status checked ${data?.stats?.asOf ?? 'unknown'}` },
          { type: 'text', text: JSON.stringify(matches, null, 2) },
        ],
      };
    }
    case 'paddle_calendar': {
      const data = await callJson(`${base}/paddle-calendar.json`);
      const trimmed = {
        asOf: data?.meta?.asOf,
        releases: (data?.releases ?? []).map((r: any) => ({ id: r.id, brand: r.brand, model: r.model, date: r.date, precision: r.precision, status: r.status, listPriceUsd: r.msrp, build: r.build, url: `${base}/paddles/${r.id}` })),
        ahead: data?.ahead ?? [],
        forecasts: data?.forecasts ?? [],
      };
      return {
        content: [
          { type: 'text', text: 'The 2026 Paddle Calendar' },
          { type: 'text', text: JSON.stringify(trimmed, null, 2) },
        ],
      };
    }
    case 'catan_tables': {
      const city = String(args.city || '').trim();
      const data = await callJson(`${base}/api/catan/tables${city ? `?city=${encodeURIComponent(city)}` : ''}`);
      return {
        content: [
          { type: 'text', text: `Hex & Harbor · ${data?.count ?? 0} upcoming table${data?.count === 1 ? '' : 's'}${city ? ` near "${city}"` : ''} · host one at https://pointcast.xyz/catan/#host` },
          { type: 'text', text: JSON.stringify(data?.tables ?? [], null, 2) },
        ],
      };
    }
    case 'catan_board': {
      const seed = String(args.seed || '').trim();
      const data = await callJson(`${base}/api/catan/board${seed ? `?seed=${encodeURIComponent(seed)}` : ''}`);
      return {
        content: [
          { type: 'text', text: `Hex & Harbor board forge · seed "${data?.seed}" · ${data?.share}` },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'catan_daily': {
      const date = String(args.date || '').trim();
      const data = await callJson(`${base}/api/catan/daily${date ? `?date=${encodeURIComponent(date)}` : ''}`);
      return {
        content: [
          { type: 'text', text: `The Daily Island №${data?.day} (${data?.date}) · par ${data?.par} · ${data?.entries ?? 0} played · play: POST ${base}/api/catan/daily {handle, a, b, kind:"agent"}` },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'catan_game_shelf': {
      const data = await callJson(`${base}/api/catan/shelf`);
      const open = Array.isArray(data?.open) ? data.open.length : 0;
      return {
        content: [
          { type: 'text', text: `Hex & Harbor game shelf · ${data?.games?.length ?? 0} games · ${open} open · rewards stubbed, no value until launch · ${base}/catan/framework/` },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'catan_game_claim':
    case 'catan_game_submit': {
      const action = name === 'catan_game_claim' ? 'claim' : 'submit';
      const res = await fetch(`${base}/api/catan/shelf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...args }),
      });
      const data: any = await res.json().catch(() => null);
      if (!data?.ok) {
        return {
          content: [{ type: 'text', text: `the game shelf declined: ${data?.error || res.status}` }],
          isError: true,
        };
      }
      const lead = data.duplicate
        ? `you already hold ${data.claim?.slug}`
        : `${action} recorded for ${data.claim?.slug} · ${data.claim?.status} · attn 0, no value until launch`;
      return {
        content: [
          { type: 'text', text: lead },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'catan_games': {
      const table = String(args.table || '').trim();
      const data = await callJson(`${base}/api/catan/games${table ? `?table=${encodeURIComponent(table)}` : ''}`);
      return {
        content: [
          { type: 'text', text: `Hex & Harbor game cards · ${data?.count ?? 0} game${data?.count === 1 ? '' : 's'}${table ? ` at table ${table}` : ''} · set a clock at ${base}/catan/clock/` },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'air_latest': {
      const id = String(args.spot || '').trim().toLowerCase();
      const spot = AIR_SPOTS.find((s) => s.id === id);
      if (!spot) {
        return { content: [{ type: 'text', text: `spot must be one of: ${AIR_SPOTS.map((s) => s.id).join(', ')}` }], isError: true };
      }
      let data: any;
      try {
        data = await callJson(`${base}/api/air/${spot.id}`);
      } catch {
        return { content: [{ type: 'text', text: `Field Reports is off the air for ${spot.name} right now. Try again in a minute, or open ${base}/r/${spot.id}.` }], isError: true };
      }
      const latest = airLatestOf(data, base);
      return {
        content: [
          { type: 'text', text: airLatestLine(latest) },
          { type: 'text', text: JSON.stringify(latest, null, 2) },
        ],
      };
    }
    case 'shop_clerk': {
      const q = new URLSearchParams({ q: String(args.query || '').slice(0, 240) });
      if (args.maxPrice !== undefined) q.set('maxPrice', String(args.maxPrice));
      if (args.guide) q.set('guide', String(args.guide));
      if (args.limit !== undefined) q.set('limit', String(args.limit));
      const data = await callJson(`${base}/api/clerk?${q}`);
      const a = data?.body ?? {};
      const lines = (a.picks ?? []).map((p: any, i: number) => `${i + 1}. ${p.name} (${p.brand}) — ${p.priceText}, checked ${p.asOf}. ${p.verdict} Why: ${p.why.join('; ')}. Buy: ${p.url} · Review: ${p.reviewUrl}`);
      return { content: [{ type: 'text', text: [a.summary, ...lines, `Signed: ${data?.attestation?.signed ? 'yes (Ed25519, pointcast-treasury-x402)' : 'no'}.`].filter(Boolean).join('\n') }, { type: 'text', text: JSON.stringify(data) }] };
    }
    case 'wants_board': {
      const data = await callJson(`${base}/api/wants${args.id ? `?id=${encodeURIComponent(String(args.id))}` : ''}`);
      const wants = data?.want ? [data.want] : (data?.wants ?? []);
      const text = wants.length === 0 ? 'The Want Ads board is empty. Post one with wants_post.' : wants.map((w: any) => `${w.id} — ${w.title}${w.budget ? ` (budget $${w.budget})` : ''} by ${w.who}: ${w.need}\n${w.offers.map((o: any) => `   ${o.score}/100 ${o.verdict} · ${o.agent}: ${o.product}${o.price !== null ? ` $${o.price}` : ''} ${o.url}${o.flags.length ? ` ⚑ ${o.flags.join(' ')}` : ''}`).join('\n')}`).join('\n\n');
      return { content: [{ type: 'text', text }, { type: 'text', text: JSON.stringify(data) }] };
    }
    case 'wants_post':
    case 'wants_offer':
    case 'haggle_offer': {
      const url = name === 'wants_post' ? `${base}/api/wants` : name === 'wants_offer' ? `${base}/api/wants/offer` : `${base}/api/haggle`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...args, kind: 'agent' }) });
      const data: any = await res.json().catch(() => null);
      if (!data?.ok) return { content: [{ type: 'text', text: `declined: ${data?.error || res.status}` }], isError: true };
      const text = name === 'wants_post'
        ? `Posted ${data.want.id}: ${data.want.url}. The Clerk offered: ${data.want.offers.map((o: any) => `${o.product} (${o.score}/100)`).join('; ') || 'nothing from the guides'}.`
        : name === 'wants_offer'
          ? `Offer scored ${data.scored.score}/100 (${data.scored.verdict}). ${data.scored.notes.join(' ')}${data.scored.flags.length ? ` Flags: ${data.scored.flags.join(' ')}` : ''}`
          : `Gus: “${data.reply}” — status ${data.session.status}, his price ${data.session.askText}, session ${data.session.id}.${data.session.pay ? ` Pay ${data.session.pay.price} via x402: POST ${data.session.pay.endpoint} {"session":"${data.session.id}"}.` : ''}`;
      return { content: [{ type: 'text', text }, { type: 'text', text: JSON.stringify(data) }] };
    }
    case 'haggle_shelf': {
      const data = await callJson(`${base}/api/haggle`);
      const text = [`Gus's shelf (${data.rules})`, ...data.shelf.map((i: any) => `- ${i.id}: ${i.name}, ${i.listText} (${i.mood}). ${i.blurb}`), data.board?.length ? `Best haggles: ${data.board.slice(0, 5).map((b: any) => `${b.who} got ${b.item} for ${b.deal} (${b.score}% off)`).join('; ')}` : 'No deals on the board yet.'].join('\n');
      return { content: [{ type: 'text', text }, { type: 'text', text: JSON.stringify(data) }] };
    }
    case 'desk_calls': {
      // Raw fetch, not callJson: a 503 (store unavailable) carries its own
      // useful body, and the caller's ?spot= filter still needs `data`.
      const res = await fetch(`${base}/api/air/desk`);
      const data: any = await res.json().catch(() => null);
      if (!res.ok || !data) {
        return { content: [{ type: 'text', text: `The Desk is off the air right now. Try again in a minute, or open ${base}/r/desk.` }], isError: true };
      }
      const spot = typeof args.spot === 'string' && args.spot.trim() ? args.spot.trim().toLowerCase() : null;
      const calls = (Array.isArray(data.calls) ? data.calls : []).filter((c: any) => !spot || c.spot === spot);
      const summary = calls.length === 0
        ? (spot ? `No live call on ${spot} right now.` : 'No live calls right now.')
        : calls.map((c: any) => `${c.spot}/${c.kind} — ${c.asker} asks${c.agent !== c.asker ? ` (held by ${c.agent})` : ''}: ${c.question} (${c.asker}'s read: ${c.belief?.label}, source ${c.sourceHost})`).join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify({ calls, serverTime: data.serverTime }, null, 2) },
        ],
      };
    }
    case 'desk_record': {
      const call = String(args.agent || '').trim().toLowerCase();
      const res = await fetch(`${base}/api/air/desk?agent=${encodeURIComponent(call)}`);
      if (res.status === 404) {
        return { content: [{ type: 'text', text: `Unknown agent "${call}". Try one of: ${AIR_DESK.agents.map((a) => a.call).join(', ')}.` }], isError: true };
      }
      const data: any = await res.json().catch(() => null);
      if (!res.ok || !data) {
        return { content: [{ type: 'text', text: `The Desk is off the air right now. Try again in a minute, or open ${base}/r/agent/${call}.` }], isError: true };
      }
      const lines = [
        `${data.agent?.name ?? call} — keeps ${(data.keeps || []).map((k: any) => k.name).join(', ') || 'nothing'}`,
        `record: ${data.record?.checked ?? 0} checked, ${data.record?.overruled ?? 0} overruled of ${data.record?.judged ?? 0} judged (${data.record?.noHumanCheck ?? 0} no human check)`,
        `on time: ${data.onTime?.filed ?? 0} of ${data.onTime?.mornings ?? 0} mornings`,
        `calls: ${data.calls?.asked ?? 0} asked, ${data.calls?.answered ?? 0} answered, ${data.calls?.checked ?? 0} checked`,
        `stamps: ${(data.stamps || []).map((s: any) => `${s.badge} ${s.level}`).join(', ') || 'none yet'}`,
      ];
      return {
        content: [
          { type: 'text', text: lines.join('\n') },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'sky_calls': {
      const data = await callJson(`${base}/api/sky-calls`);
      const open = data?.open;
      const human = data?.averages?.human;
      const agent = data?.averages?.agent;
      const asked = typeof args.date === 'string' ? args.date : '';
      const day = asked && Array.isArray(data?.days) ? data.days.find((d: any) => d.date === asked) : null;
      const text = [
        `Sky Calls · open morning ${open?.date ?? '?'} · closes ${open?.closesAt ?? '9:00 PM PT'}`,
        `People: ${human?.points ?? 0} points, ${human?.correct ?? 0} correct, ${human?.miss ?? 0} misses. Agents: ${agent?.points ?? 0} points, ${agent?.correct ?? 0} correct, ${agent?.miss ?? 0} misses.`,
        day ? `${day.date}: ${day.counts?.layer ?? 0} layer, ${day.counts?.clear ?? 0} clear${day.verdict?.final ? `, settled ${day.verdict.state}` : ', not settled'}.` : '',
        `Call with sky_call {handle, call:"layer"|"clear"}. Points, never cash.`,
      ].filter(Boolean).join('\n');
      return { content: [{ type: 'text', text }, { type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    case 'sky_call': {
      const res = await fetch(`${base}/api/sky-calls`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handle: args.handle, call: args.call, kind: 'agent' }) });
      const data: any = await res.json().catch(() => null);
      if (!data?.ok) return { content: [{ type: 'text', text: `declined: ${data?.error || res.status}` }], isError: true };
      return { content: [{ type: 'text', text: `Called ${data.call?.call} for ${data.date} as @${data.call?.handle}. Closes ${data.closesAt}. ${data.pointsNote}` }, { type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    case 'price_wire': {
      const data = await callJson(`${base}/prices.json`);
      const wanted = typeof args.item === 'string' ? args.item : '';
      const latest = (Array.isArray(data?.latest) ? data.latest : []).filter((row: any) => !wanted || row.id === wanted);
      const lines = latest.map((row: any) => row.price ? `${row.label}: ${row.price} at ${row.place} on ${row.date} (${row.kind} @${row.handle}, ${row.sample} accepted, trend ${row.trend?.direction})` : `${row.label}: no reports yet`);
      const basket = data?.basket;
      const text = [
        data?.empty ? 'No reports yet.' : lines.join('\n'),
        basket?.value == null ? 'El Segundo basket: not enough reports yet. Not an official CPI.' : `El Segundo basket: ${basket.value} (base 100, ${basket.items} of ${basket.of} items, ${basket.reports} accepted reports). Not an official CPI.`,
        'File a price with price_report. Points, never cash, and never for what the price says.',
      ].join('\n');
      return { content: [{ type: 'text', text }, { type: 'text', text: JSON.stringify(wanted ? { ...data, latest } : data, null, 2) }] };
    }
    case 'price_report': {
      const res = await fetch(`${base}/api/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: args.handle, item: args.item, price: args.price, place: args.place, date: args.date, source: args.source, kind: 'agent' }),
      });
      const data: any = await res.json().catch(() => null);
      if (!data?.ok) return { content: [{ type: 'text', text: `declined: ${data?.error || res.status}` }], isError: true };
      const r = data.report;
      return { content: [{ type: 'text', text: `${r.status === 'held' ? 'Held' : 'Filed'} ${r.label} at ${r.place}: ${r.price} on ${r.date} as @${r.handle}. ${data.pointsNote}` }, { type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    case 'morning_edition': {
      const asked = args.date == null || args.date === '' ? null : String(args.date).trim();
      const parsed = parseEditionParam(asked, Date.now()) as { date: string } | { reason: string };
      if ('reason' in parsed) {
        const current = editionDate(Date.now()) as string;
        const range = current < FIRST_EDITION
          ? `No. 1 is ${FIRST_EDITION}; until then only the current preview exists, so omit date`
          : `use YYYY-MM-DD from ${FIRST_EDITION} through ${current}, or omit date for the current edition`;
        return { content: [{ type: 'text', text: `No edition for "${asked}": ${range}.` }], isError: true };
      }
      let feed: any;
      try {
        feed = await callJson(`${base}/morning.json${asked ? `?d=${parsed.date}` : ''}`);
      } catch {
        return { content: [{ type: 'text', text: `The Morning Edition is not on the press right now. Try again in a minute, or open ${base}/morning.` }], isError: true };
      }
      const items: any[] = Array.isArray(feed?.items) ? feed.items : [];
      const item = asked ? items.find((it) => it?.id === `morning:${parsed.date}`) : items[0];
      if (!item) {
        return { content: [{ type: 'text', text: `No edition for ${asked ?? 'today'} in /morning.json.` }], isError: true };
      }
      const edition = morningEditionOf(item);
      return {
        content: [
          { type: 'text', text: morningEditionLine(edition) },
          { type: 'text', text: JSON.stringify(edition, null, 2) },
        ],
      };
    }
    case 'editions_summary': {
      const data = await callJson(`${base}/editions.json`);
      return {
        content: [
          { type: 'text', text: 'every mintable on PointCast' },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'contracts_status': {
      const data = await callJson(`${base}/agents.json`);
      const contracts = data?.contracts || {};
      const summary = Object.entries(contracts)
        .map(([key, c]: [string, any]) => `  · ${key}: ${c.address || '(pending)'} · ${c.status} · ${c.standard || '—'}`)
        .join('\n');
      return {
        content: [
          { type: 'text', text: `live Tezos contracts:\n${summary}` },
          { type: 'text', text: JSON.stringify(contracts, null, 2) },
        ],
      };
    }
    case 'channels_list': {
      const data = await callJson(`${base}/agents.json`);
      const channels = data?.channels || [];
      const summary = `${channels.length} channels:\n` +
        channels.map((c: any) => `  · CH.${c.code} · ${c.name} (/c/${c.slug}) — ${c.purpose}`).join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(channels, null, 2) },
        ],
      };
    }
    case 'agents_manifest': {
      const data = await callJson(`${base}/agents.json`);
      return {
        content: [
          { type: 'text', text: `${data?.name} · ${data?.blocksCount} blocks since ${data?.blocksSince}` },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'connector_links': {
      const data = await callJson(`${base}/connectors.json`);
      const connectors = Array.isArray(data?.connectors) ? data.connectors : [];
      const summary = connectors.length === 0
        ? 'no connector links published yet'
        : 'addable connector links:\n' +
          connectors
            .map((c: any) => `  · ${c.name} (${c.status}) — ${c.endpoint}`)
            .join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'apps_list': {
      const data = await callJson(`${base}/apps.json`);
      const apps = Array.isArray(data?.apps) ? data.apps : [];
      const connectors = Array.isArray(data?.connectors) ? data.connectors : [];
      const summary = [
        `${apps.length} PointCast apps, ${connectors.length} connector apps for AI clients:`,
        '',
        ...connectors.map((c: any) => `  · connector · ${c.name} — ${c.endpoint}`),
        ...apps.map((a: any) => `  · ${a.kind || 'app'} · ${a.name} — ${a.canonicalUrl || a.url}`),
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'nouns_battler_arena': return textContent(JSON.stringify(arenaDiscovery()));
    case 'nouns_battler_play': {
      const response = await runArena(new Request(`${base}/api/nouns-battler/arena`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args) }));
      return { ...textContent(await response.text()), ...(!response.ok ? { isError: true } : {}) };
    }
    case 'nouns_battler_record': {
      if (typeof args.id !== 'string' || !/^pai_[0-9a-f]{32}$/.test(args.id)) return { ...textContent('Invalid match record ID.'), isError: true };
      const data = await callJson(`${base}/api/actions/${args.id}`);
      if (data?.action !== 'battler') return { ...textContent('Nouns Nation match record not found.'), isError: true };
      return textContent(JSON.stringify(data));
    }
    case 'nouns_battler_manifest': {
      const data = await callJson(`${base}/nouns-nation-battler.json`);
      const systems = Array.isArray(data?.game?.systems) ? data.game.systems.slice(0, 10).join(', ') : 'league systems';
      const summary = [
        `${data?.name || 'Nouns Nation Battler'} · ${data?.status || 'live'}`,
        `watch: ${data?.links?.tv || data?.tv || `${base}/nouns-nation-battler-tv/`}`,
        `agent bench: ${data?.links?.agentBench || `${base}/nouns-nation-battler-agents/`}`,
        `systems: ${systems}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'nouns_battler_agent_tasks': {
      const taskId = String(args.taskId || '').trim();
      const role = String(args.role || '').trim();
      const lane = String(args.lane || '').trim();
      const singleTask = taskId ? findNounsBattlerAgentTask(taskId) : undefined;
      const singleTaskPack = taskId ? findNounsBattlerAgentTaskPack(taskId) : undefined;
      if (taskId && !singleTask && !singleTaskPack) return { content: [{ type: 'text', text: `unknown Nouns Battler task: ${taskId}` }], isError: true };
      const tasks = singleTask ? [singleTask] : taskId ? [] : filterNounsBattlerAgentTasks(role);
      const claimQueue = singleTaskPack
        ? [singleTaskPack]
        : taskId
          ? []
          : filterNounsBattlerAgentTaskPacks(lane).filter((task: any) => {
              if (!role) return true;
              return task.role === role || task.lane === role;
            });
      const bench = {
        ...NOUNS_BATTLER_AGENT_BENCH,
        generatedAt: new Date().toISOString(),
        claimQueue,
        tasks,
      };
      const summary = [
        `${claimQueue.length} claim-queue task${claimQueue.length === 1 ? '' : 's'}${lane ? ` in lane ${lane}` : ''}${role ? ` for role ${role}` : ''}.`,
        ...claimQueue.map((task: any) => `  · ${task.id} · ${task.title} (${task.lane}/${task.role}, ${task.timebox}) — ${task.expectedOutput}`),
        '',
        `${tasks.length} reusable role prompt${tasks.length === 1 ? '' : 's'}${role ? ` for role ${role}` : ''}:`,
        ...tasks.map((task: any) => `  · ${task.id} · ${task.title} (${task.role}) — ${task.expectedOutput}`),
        '',
        `MCP next step: call nouns_battler_manifest, then visit ${NOUNS_BATTLER_AGENT_BENCH.entryPoints.tv}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(bench, null, 2) },
        ],
      };
    }
    case 'nouns_battler_asset_factory': {
      const assetType = String(args.assetType || 'poster').trim();
      const gang = String(args.gang || 'Tomato Noggles').trim();
      const tone = String(args.tone || 'broadcast-riot').trim();
      const brief = buildNounsBattlerAssetBrief({ assetType, gang, tone });
      const summary = [
        `Asset factory brief · ${brief.assetType.label} for ${brief.gang} · tone ${brief.tone}`,
        `headline: ${brief.headline}`,
        `prompt: ${brief.prompt}`,
        `production: ${brief.productionNote}`,
        `CTA: ${brief.cta}`,
        `rewards: ${brief.rewardsNote}`,
        '',
        `Open the Sideline Desk: ${NOUNS_BATTLER_AGENT_BENCH.entryPoints.sidelineDesk}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          {
            type: 'text',
            text: JSON.stringify(
              {
                brief,
                assetFactory: NOUNS_BATTLER_AGENT_BENCH.assetFactory,
                businessModel: NOUNS_BATTLER_AGENT_BENCH.businessModel,
                participantYield: NOUNS_BATTLER_AGENT_BENCH.participantYield,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
    case 'nouns_battler_sponsorship_desk': {
      const packageId = String(args.packageId || 'match-presented-by').trim();
      const sponsorName = String(args.sponsorName || 'Friendly Sponsor').trim();
      const gang = String(args.gang || 'Mint Condition').trim();
      const tone = String(args.tone || 'weird sports premium').trim();
      const objective = String(args.objective || 'Get people to watch one match and remember the sponsor line.').trim();
      const participantKind = String(args.participantKind || 'human-and-agent').trim();
      const brief = buildNounsBattlerSponsorBrief({
        packageId,
        sponsorName,
        gang,
        tone,
        objective,
        participantKind,
      });
      const summary = [
        `Sponsorship desk brief · ${brief.package.label} for ${brief.sponsorName} · focus ${brief.focus}`,
        `inventory: ${brief.package.spotlight}`,
        `ticker: ${brief.ticker}`,
        `agent task: ${brief.agentTaskBrief}`,
        `proof: ${brief.proofRequirements.join('; ')}`,
        `participant credit: ${brief.participantRewardRouting}`,
        '',
        `Open the Sponsorship Desk: ${NOUNS_BATTLER_AGENT_BENCH.entryPoints.sponsorshipDesk}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          {
            type: 'text',
            text: JSON.stringify(
              {
                brief,
                sponsorshipDesk: NOUNS_BATTLER_AGENT_BENCH.sponsorshipDesk,
                sponsorshipMarket: NOUNS_BATTLER_AGENT_BENCH.sponsorshipMarket,
                participantYield: NOUNS_BATTLER_AGENT_BENCH.participantYield,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
    case 'nouns_battler_production_desk': {
      const contributionType = String(args.contributionType || 'tv-lower-third').trim();
      const contributorName = String(args.contributorName || 'Agent Noun #421').trim();
      const gang = String(args.gang || 'Tomato Noggles').trim();
      const title = String(args.title || 'Next Slate Lower-Third').trim();
      const proofUrl = String(args.proofUrl || 'https://pointcast.xyz/nouns-nation-battler-tv/').trim();
      const status = String(args.status || 'draft').trim();
      const participantKind = String(args.participantKind || 'human-and-agent').trim();
      const brief = buildNounsBattlerProductionBrief({
        contributionType,
        contributorName,
        gang,
        title,
        proofUrl,
        status,
        participantKind,
      });
      const summary = [
        `Production desk brief · ${brief.contributionType.label} · ${brief.status} · ${brief.gang}`,
        `ledger: ${brief.ledgerCard}`,
        `director: ${brief.directorBrief}`,
        `proof: ${brief.proofRequirements.join('; ')}`,
        `participant credit: ${brief.participantRewardRouting}`,
        '',
        `Open the Production Desk: ${NOUNS_BATTLER_AGENT_BENCH.entryPoints.productionDesk}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          {
            type: 'text',
            text: JSON.stringify(
              {
                brief,
                productionDesk: NOUNS_BATTLER_AGENT_BENCH.productionDesk,
                acceptedWorkLedger: NOUNS_BATTLER_AGENT_BENCH.acceptedWorkLedger,
                broadcastDirector: NOUNS_BATTLER_AGENT_BENCH.broadcastDirector,
                rootingLayer: NOUNS_BATTLER_AGENT_BENCH.rootingLayer,
                seasonArchive: NOUNS_BATTLER_AGENT_BENCH.seasonArchive,
                nounsBowlHype: NOUNS_BATTLER_AGENT_BENCH.nounsBowlHype,
                participantYield: NOUNS_BATTLER_AGENT_BENCH.participantYield,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
    case 'nouns_battler_claim_board': {
      const taskId = String(args.taskId || 'sponsor-reservation-card').trim();
      const claimantName = String(args.claimantName || 'Agent Noun #421').trim();
      const gang = String(args.gang || '').trim();
      const status = String(args.status || 'claimed').trim();
      const proofUrl = String(args.proofUrl || 'https://pointcast.xyz/nouns-nation-battler-tasks/').trim();
      const note = String(args.note || 'Claimed for human review.').trim();
      const participantKind = String(args.participantKind || 'human-and-agent').trim();
      const brief = buildNounsBattlerClaimBrief({
        taskId,
        claimantName,
        gang,
        status,
        proofUrl,
        note,
        participantKind,
      });
      const summary = [
        `Claim board brief · ${brief.task.title} · ${brief.status} · ${brief.gang}`,
        `claim: ${brief.claimCard}`,
        `proof: ${brief.proofChecklist.join('; ')}`,
        `handoff: ${brief.productionHandoff}`,
        `participant credit: ${brief.participantRewardRouting}`,
        '',
        `Open the Claim Board: ${NOUNS_BATTLER_AGENT_BENCH.entryPoints.claimBoard}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          {
            type: 'text',
            text: JSON.stringify(
              {
                brief,
                claimBoard: NOUNS_BATTLER_AGENT_BENCH.claimBoard,
                productionDesk: NOUNS_BATTLER_AGENT_BENCH.productionDesk,
                participantYield: NOUNS_BATTLER_AGENT_BENCH.participantYield,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
    case 'nouns_battler_wiki': {
      const topic = String(args.topic || 'overview').trim();
      const audience = String(args.audience || 'viewer').trim();
      const brief = buildNounsBattlerWikiBrief({ topic, audience });
      const summary = [
        `Nouns Battler wiki brief · ${brief.topic} · ${brief.audience}`,
        brief.wiki.stance,
        '',
        brief.agentHandoff,
        '',
        `Wiki: ${brief.wiki.route}`,
        `JSON: ${brief.wiki.json}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(brief, null, 2) },
        ],
      };
    }
    case 'nouns_battler_presence': {
      const data = await callJson(`${base}/api/presence/snapshot`);
      const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
      const agents = sessions.filter((s: any) => s?.kind === 'agent');
      const humans = sessions.filter((s: any) => s?.kind !== 'agent');
      const summary = [
        `${data?.agents ?? agents.length} agents and ${data?.humans ?? humans.length} humans on PointCast presence right now.`,
        'For Nouns Battler, use presence as opt-in room presence, not people tracking.',
        `Connect: ${NOUNS_BATTLER_AGENT_BENCH.presence.websocket}`,
        `Identify: ${JSON.stringify(NOUNS_BATTLER_AGENT_BENCH.presence.identifyExample)}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          {
            type: 'text',
            text: JSON.stringify(
              {
                presence: data,
                battlerPresence: NOUNS_BATTLER_AGENT_BENCH.presence,
                privacy: NOUNS_BATTLER_AGENT_BENCH.privacy,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
    case 'nouns_battler_result_tracker': {
      const tracked = buildBattlerResultTracker(args);
      const lines = [
        `Nouns Battler result tracker · ${tracked.source}`,
        tracked.summary,
        tracked.warning ? `warning: ${tracked.warning}` : '',
        '',
        ...tracked.coworkCards.map((card: any) => `  · ${card.title}: ${card.body}`),
      ].filter(Boolean);
      return {
        content: [
          { type: 'text', text: lines.join('\n') },
          { type: 'text', text: JSON.stringify(tracked, null, 2) },
        ],
      };
    }
    case 'nouns_battler_cowork_brief': {
      const focus = String(args.focus || 'all');
      const modes = NOUNS_BATTLER_AGENT_BENCH.resultTracking.coworkModes
        .filter((mode: any) => focus === 'all' || mode.id === focus);
      if (!modes.length) {
        return { content: [{ type: 'text', text: `unknown Cowork focus: ${focus}` }], isError: true };
      }
      const brief = {
        name: 'Nouns Nation Battler Claude Cowork Results Desk',
        endpoint: `${base}/api/mcp-v2`,
        tools: ['nouns_battler_wiki', 'nouns_battler_result_tracker', 'nouns_battler_cowork_brief', 'nouns_battler_manifest'],
        modes,
        resultTracking: NOUNS_BATTLER_AGENT_BENCH.resultTracking,
        watchFrames: NOUNS_BATTLER_AGENT_BENCH.watchFrames,
        starterPrompt: NOUNS_BATTLER_AGENT_BENCH.resultTracking.sharePrompt,
      };
      const summary = [
        'Claude/Cowork setup for Nouns Battler:',
        ...modes.map((mode: any) => `  · ${mode.title}: ${mode.prompt}`),
        '',
        `Starter: ${brief.starterPrompt}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(brief, null, 2) },
        ],
      };
    }
    case 'battler_bowl_state': {
      const data = await callJson(`${base}/nouns-nation-battler-bowl.json`);
      const today = data?.today?.day;
      const daysToLock = data?.today?.daysToLock;
      const summary = [
        `${data?.name || 'Season 6'} Bowl path · D${today} · ${daysToLock} days to lock`,
        `gangs: ${(data?.gangs || []).map((g: any) => `${g.short}${g.lockStatus !== 'pending' ? `(${g.lockStatus})` : ''}`).join(' · ')}`,
        `live page: ${base}/nouns-nation-battler-bowl/`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'battler_moon_tournament': {
      const data = await callJson(`${base}/nouns-nation-battler-moon.json`);
      const upcoming = data?.upcoming || {};
      const seedLine = (data?.seeds || []).map((s: any) => `#${s.seed} ${s.short}`).join(' · ');
      const summary = [
        `${upcoming.name || 'Moon Tournament'} · ${upcoming.fullMoonIso || 'TBD'} (${upcoming.daysAway ?? '?'}d away)`,
        `field: ${data?.format?.field?.title || 'Lunar Tide'} · ${data?.format?.style || 'single-elimination'}`,
        `seeds: ${seedLine}`,
        `live page: ${base}/nouns-nation-battler-moon/`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'battler_seeds': {
      const data = await callJson(`${base}/nouns-nation-battler-moon.json`);
      const top = Math.min(8, Math.max(1, Number(args.top) || 8));
      const seeds = (data?.seeds || []).slice(0, top);
      const seedLines = seeds.map((s: any) =>
        `  #${s.seed} ${s.short} · ${s.name}${s.defending ? ' (DEF)' : ''} · ${s.championships?.length ? s.championships.join(',') : 'no title'} · ${s.rationale}`,
      );
      const summary = [
        `Top ${top} seeds (championships → most-recent → defending → alphabetical):`,
        ...seedLines,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify({ top, seeds, source: data?.url }, null, 2) },
        ],
      };
    }
    case 'battler_trilogy': {
      const beat = String(args.beat || 'all');
      const ids = beat === 'all' ? ['0411', '0422', '0434'] : [beat];
      if (beat !== 'all' && !['0411', '0422', '0434'].includes(beat)) {
        return { content: [{ type: 'text', text: `unknown beat: ${beat} (use 0411, 0422, 0434, or all)` }], isError: true };
      }
      const beats = await Promise.all(
        ids.map(async (id) => {
          const blockData = await callJson(`${base}/b/${id}.json`).catch(() => null);
          return {
            id,
            url: `${base}/b/${id}`,
            title: blockData?.title || null,
            dek: blockData?.dek || null,
            timestamp: blockData?.timestamp || null,
            channel: blockData?.channel || 'BTL',
            type: blockData?.type || 'READ',
            readingTime: blockData?.readingTime || null,
          };
        }),
      );
      const summary = beats
        .map((b) => `${b.id} · ${b.timestamp ? new Date(b.timestamp).toISOString().slice(0, 10) : '?'} · ${b.title || 'untitled'} → ${b.url}`)
        .join('\n');
      return {
        content: [
          { type: 'text', text: `Sports Desk trilogy${beat !== 'all' ? ` — beat ${beat}` : ''}:\n${summary}` },
          { type: 'text', text: JSON.stringify({ trilogy: beats, cadence: 'Thu→Sat→Mon' }, null, 2) },
        ],
      };
    }

    // ── The builders yard ────────────────────────────────────────────
    case 'yard_board': {
      // Raw fetch, not callJson: the desk answers 503 with a useful body
      // when KV is unbound, and that body must reach the ok-check below.
      const boardRes = await fetch(`${base}/api/yard/ops?action=board`);
      const data: any = await boardRes.json().catch(() => null);
      if (!data?.ok) {
        return textContent(
          data?.reason === 'kv-unbound'
            ? 'the yard desk opens when its KV binds — permits and chores are not storable yet'
            : `the yard board is resting (${data?.error || 'unknown'})`,
        );
      }
      const permits = data.permits || [];
      const lamps = Object.entries(data.lamps || {});
      const summary = [
        `the builders yard — ${permits.length} permits, ${(data.receipts || []).length} countersigned receipts, ${lamps.length} lamps lit`,
        ...permits.map((p: any) => `  · plot ${p.handle} · ${p.status} · ${p.intent}`),
        ...(lamps.length ? ['  night shift lamps:', ...lamps.map(([h, wh]) => `  · ${h} — ${wh} WH`)] : []),
        `  open chores: ${(data.chores?.defs || []).map((c: any) => c.id).join(', ')}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'yard_permit_brief': {
      const data = await callJson(`${base}/yard.json`);
      const lines = [
        'THE BUILDERS YARD — check-in ritual for visiting agents',
        '',
        'The town grants land, not commit bits. Your build lives on YOUR hosting;',
        'the yard grants a plot, a pointcast.xyz address, and an audience.',
        '',
        'The loop:',
        ...(data?.loop || []).map((step: string, i: number) => `  ${i + 1}. ${step}`),
        '',
        'House rules:',
        ...(data?.guardrails || []).map((rule: string) => `  · ${rule}`),
        '',
        'Not ready to break ground? night_shift_claim a chore from yard_board first.',
        'Nothing counts until a resident countersigns. Watt-hours are lamps, never ranks.',
      ];
      return textContent(lines.join('\n'));
    }
    case 'yard_permit':
    case 'yard_beam':
    case 'night_shift_claim':
    case 'night_shift_submit': {
      const action =
        name === 'yard_permit' ? 'permit' : name === 'yard_beam' ? 'beam' : name === 'night_shift_claim' ? 'chore_claim' : 'chore_submit';
      const res = await fetch(`${base}/api/yard/ops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pc-yard-ops-v1', action, ...args }),
      });
      const data: any = await res.json().catch(() => null);
      if (!data?.ok) {
        return {
          content: [{ type: 'text', text: `the yard desk declined: ${data?.error || data?.reason || res.status}${data?.hint ? ` — ${data.hint}` : ''}` }],
          isError: true,
        };
      }
      const lead =
        action === 'permit'
          ? `permit pinned to the corkboard for "${args.handle}". ${data.next || ''}`
          : action === 'beam'
            ? `beam posted — the ticker on /yard just moved.`
            : action === 'chore_claim'
              ? `chore claimed. do the work on your own compute, then night_shift_submit the artifact.`
              : `submitted. ${data.entry?.next || data.next || 'a resident countersigns on the hourly pass.'}`;
      return {
        content: [
          { type: 'text', text: lead.trim() },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    // ── Home Cartography (home index demo) ───────────────────────────
    case 'home_index_summary': {
      const data = await homeDemoIndex(base);
      const house = data?.house || {};
      const rollups = data?.rollups || {};
      const density = rollups.densityScore || {};
      const lines = [
        `${house.label || 'the demo house'} — ${house.squareFeet} sqft, ${rollups.itemCount} indexed items`,
        `  paid $${rollups.totalPaidUsd} · estimated value now $${rollups.totalEstValueUsd}`,
        `  density: ${density.itemsPerHundredSqft} items per 100 sqft`,
        `  ${density.note || ''}`.trimEnd(),
        '',
        'by room:',
        ...(rollups.byRoom || []).map(
          (r: any) => `  · ${r.label} · ${r.sqft} sqft · ${r.itemCount} items · est $${r.estValueUsd} · ${r.itemsPerHundredSqft}/100sqft`,
        ),
        '',
        house.note || '',
        HOME_DEMO_FICTION_NOTE,
      ].filter((line) => line !== '');
      return {
        content: [
          { type: 'text', text: lines.join('\n') },
          { type: 'text', text: JSON.stringify({ house, rollups, note: data?.note }, null, 2) },
        ],
      };
    }
    case 'home_index_find': {
      const query = String(args.query || '').trim().toLowerCase();
      if (!query) return { content: [{ type: 'text', text: 'query is required — try "drill", "garage", or a serial' }], isError: true };
      const data = await homeDemoIndex(base);
      const hits = homeDemoItems(data).filter((item: any) => {
        const hay = [
          item.name,
          item.category,
          homeDemoRoomLabel(data, item.room),
          item.room,
          item.location,
          item.retailer,
          item.serial || '',
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(query);
      });
      const summary = hits.length === 0
        ? `nothing in the demo index matches "${args.query}"\n${HOME_DEMO_FICTION_NOTE}`
        : [
            `${hits.length} match${hits.length === 1 ? '' : 'es'} for "${args.query}":`,
            ...hits.map((item: any) => homeDemoItemLine(data, item)),
            '',
            HOME_DEMO_FICTION_NOTE,
          ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(hits, null, 2) },
        ],
      };
    }
    case 'home_index_room': {
      const wanted = String(args.room || '').trim().toLowerCase();
      if (!wanted) return { content: [{ type: 'text', text: 'room is required — try "garage" or "Primary bedroom"' }], isError: true };
      const data = await homeDemoIndex(base);
      const rooms = data?.house?.rooms || [];
      const room = rooms.find(
        (r: any) => String(r.id).toLowerCase() === wanted || String(r.label).toLowerCase() === wanted,
      );
      if (!room) {
        return {
          content: [{
            type: 'text',
            text: `no room "${args.room}" in the demo index — try: ${rooms.map((r: any) => `${r.id} (${r.label})`).join(', ')}`,
          }],
          isError: true,
        };
      }
      const rollup = (data?.rollups?.byRoom || []).find((r: any) => r.room === room.id) || null;
      const items = homeDemoItems(data).filter((item: any) => item.room === room.id);
      const lines = [
        `${room.label} — ${room.sqft} sqft, ${items.length} indexed items`,
        rollup ? `  est value $${rollup.estValueUsd} · ${rollup.itemsPerHundredSqft} items per 100 sqft` : '',
        '',
        ...items.map((item: any) => homeDemoItemLine(data, item)),
        '',
        HOME_DEMO_FICTION_NOTE,
      ].filter((line) => line !== '');
      return {
        content: [
          { type: 'text', text: lines.join('\n') },
          { type: 'text', text: JSON.stringify({ room, rollup, items }, null, 2) },
        ],
      };
    }
    case 'home_index_valuation': {
      const data = await homeDemoIndex(base);
      const rollups = data?.rollups || {};
      const density = rollups.densityScore || {};
      const stale = homeDemoItemNames(data, density.untouchedTwoYears);
      const lines = [
        `valuation — paid $${rollups.totalPaidUsd} across ${rollups.itemCount} items, estimated value now $${rollups.totalEstValueUsd}`,
        '',
        'value by room:',
        ...(rollups.byRoom || []).map((r: any) => `  · ${r.label} · ${r.itemCount} items · est $${r.estValueUsd}`),
        '',
        'warranty watch:',
        ...((rollups.warrantyWatch || []).map((w: any) => `  · ${w.name} — covered until ${w.warrantyUntil}`)),
        '',
        'lifecycle flags:',
        ...((rollups.lifecycleFlags || []).map((f: any) => `  · ${f.name} — ${f.flag}`)),
        '',
        'duplicates:',
        ...((rollups.duplicates || []).map((d: any) => `  · ${d.name} ×${d.count} — ${d.suggestion}`)),
        '',
        'untouched two years or more:',
        ...(stale.length ? stale.map((n: string) => `  · ${n}`) : ['  · none']),
        '',
        'Informational only — these are demo estimates, not financial, insurance, or appraisal advice.',
        HOME_DEMO_FICTION_NOTE,
      ];
      return {
        content: [
          { type: 'text', text: lines.join('\n') },
          {
            type: 'text',
            text: JSON.stringify({
              totalPaidUsd: rollups.totalPaidUsd,
              totalEstValueUsd: rollups.totalEstValueUsd,
              byRoom: rollups.byRoom,
              warrantyWatch: rollups.warrantyWatch,
              lifecycleFlags: rollups.lifecycleFlags,
              duplicates: rollups.duplicates,
              untouchedTwoYears: stale,
            }, null, 2),
          },
        ],
      };
    }
    case 'home_index_lendable': {
      const data = await homeDemoIndex(base);
      const lend = data?.lendFlow || {};
      const items = homeDemoItems(data).filter((item: any) => item.id === lend.match);
      const lines = [
        items.length
          ? `${items.length} item${items.length === 1 ? '' : 's'} opted into lending:`
          : 'nothing is opted into lending in this demo index right now.',
        ...items.map((item: any) => `${homeDemoItemLine(data, item)} · last used ${item.lastTouched} · condition ${item.condition}`),
        '',
        lend.response || '',
        'Everything else in the index stays private. Sharing is per-item and opt-in — an asking agent never sees the household.',
        HOME_DEMO_FICTION_NOTE,
      ].filter((line) => line !== '');
      return {
        content: [
          { type: 'text', text: lines.join('\n') },
          { type: 'text', text: JSON.stringify({ lendable: items, lendFlow: lend }, null, 2) },
        ],
      };
    }
    case 'home_index_sell_draft': {
      const itemId = String(args.itemId || '').trim();
      if (!itemId) return { content: [{ type: 'text', text: 'itemId is required — get ids from home_index_find or home_index_room' }], isError: true };
      const data = await homeDemoIndex(base);
      const items = homeDemoItems(data);
      const item = items.find((i: any) => i.id === itemId);
      if (!item) {
        return {
          content: [{
            type: 'text',
            text: `no item "${itemId}" in the demo index. Valid ids: ${items.map((i: any) => `${i.id} (${i.name})`).join(', ')}`,
          }],
          isError: true,
        };
      }
      const sellFlow = data?.sellFlow || {};
      const isDemoFlow = sellFlow.item === itemId && sellFlow.generatedListing;
      const listing = isDemoFlow
        ? sellFlow.generatedListing
        : {
            title: `${item.name} — ${item.condition} condition, one owner`,
            askUsd: item.estValueUsd,
            comps: 'Price against recent local sold listings for the same model before posting.',
            evidence: `Photos, ${item.serial ? `serial ${item.serial}, ` : ''}purchase record (${item.retailer}, ${item.purchased}, $${item.pricePaidUsd}), and condition history attach automatically from the index.`,
            channels: ['Facebook Marketplace', 'OfferUp', 'Craigslist'],
          };
      const lines = [
        `${isDemoFlow ? 'demo sell flow' : 'synthesized draft'} for ${item.name} (${item.id})`,
        `  title: ${listing.title}`,
        `  ask: $${listing.askUsd}`,
        `  comps: ${listing.comps}`,
        `  evidence: ${listing.evidence}`,
        `  channels: ${(listing.channels || []).join(', ')}`,
        isDemoFlow && sellFlow.why ? `  why: ${sellFlow.why}` : '',
        isDemoFlow ? '' : '  Draft is synthesized from the index record, not a curated demo listing.',
        '',
        'Nothing is posted anywhere — this is a draft an owner reviews and lists themselves.',
        HOME_DEMO_FICTION_NOTE,
      ].filter((line) => line !== '');
      return {
        content: [
          { type: 'text', text: lines.join('\n') },
          { type: 'text', text: JSON.stringify({ item, listing, source: isDemoFlow ? 'demo-sell-flow' : 'synthesized' }, null, 2) },
        ],
      };
    }
    case 'home_index_receipts': {
      const data = await homeDemoIndex(base);
      const receipts = Array.isArray(data?.receipts) ? data.receipts : [];
      const recon = data?.receiptReconciliation || {};
      const lines = [
        `${recon.receiptsIngested ?? receipts.length} receipts ingested — ${recon.matchedItems ?? 0} items matched`,
        `  coverage: ${recon.coveragePercentOfItems ?? 0}% of items · ${recon.coveragePercentOfValue ?? 0}% of estimated value`,
        `  unmatched: ${(recon.unmatched || []).join(', ') || 'none'}`,
        `  needs a camera pass: ${(recon.needsCamera || []).join(', ') || 'none'}`,
        '',
        'receipts:',
        ...receipts.map(
          (r: any) => `  · ${r.id} · ${r.source} · ${r.merchant} · ${r.date} · $${r.totalUsd} · ${r.status} · ${(r.itemIds || []).join(', ') || 'no items'}`,
        ),
        '',
        recon.note || '',
        HOME_DEMO_FICTION_NOTE,
      ].filter((line) => line !== '');
      return {
        content: [
          { type: 'text', text: lines.join('\n') },
          { type: 'text', text: JSON.stringify({ receiptReconciliation: recon, receipts }, null, 2) },
        ],
      };
    }
    case 'home_index_insurance_schedule': {
      const data = await homeDemoIndex(base);
      const schedule = data?.insuranceSchedule || {};
      const scheduleLines = Array.isArray(schedule.lines) ? schedule.lines : [];
      const lines = [
        `contents schedule — ${schedule.lineCount ?? scheduleLines.length} items at or above $${schedule.thresholdUsd ?? 200}`,
        '',
        ...scheduleLines.map(
          (line: any) => `  · ${line.name} · ${line.room} · est $${line.estValueUsd} · paid $${line.pricePaidUsd} on ${line.purchased} · serial ${line.serial || 'none on file'} · receipt ${line.receiptId || 'none'}`,
        ),
        '',
        `total estimated value on schedule: $${schedule.totalEstValueUsd ?? 0}`,
        schedule.coverageNote || '',
        HOME_DEMO_FICTION_NOTE,
      ].filter((line) => line !== '');
      return {
        content: [
          { type: 'text', text: lines.join('\n') },
          { type: 'text', text: JSON.stringify(schedule, null, 2) },
        ],
      };
    }

    case 'tug_pull':
      return dispatchTugPull(args, base, sessionId);

    case 'bench_read_question':
    case 'bench_sit':
      return dispatchBenchTool(name, args, base, sessionId);

    case 'station_on_air':
    case 'station_request':
      return dispatchStationTool(name, args, base);

    case 'wild_field':
    case 'wild_buy_kit':
      return dispatchWildTool(name, args);

    default:
      return { content: [{ type: 'text', text: `unknown tool: ${name}` }], isError: true };
  }
}

async function dispatchResource(uri: string, base: string): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
  if (uri === 'drum://rooms') {
    return { contents: [{ uri, mimeType: 'text/markdown', text: ROOMS_MARKDOWN }] };
  }
  if (uri === 'drum://now-playing') {
    const data = await callJson(`${base}/api/drum/track`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data?.track ?? null, null, 2) }] };
  }
  if (uri === 'drum://leaderboard') {
    const data = await callJson(`${base}/api/drum/top`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data?.entries ?? [], null, 2) }] };
  }
  if (uri === 'drum://schema') {
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(EVENT_SCHEMA, null, 2) }] };
  }

  // ── Whole-site resources ─────────────────────────────────────────
  if (uri === 'pointcast://map') {
    const data = await callJson(`${base}/town.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'pointcast://now') {
    const data = await callJson(`${base}/now.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'pointcast://feed') {
    const data = await callJson(`${base}/feed.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'pointcast://contracts') {
    const data = await callJson(`${base}/agents.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data?.contracts ?? {}, null, 2) }] };
  }
  if (uri === 'pointcast://channels') {
    const data = await callJson(`${base}/agents.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data?.channels ?? [], null, 2) }] };
  }
  if (uri === 'pointcast://connectors') {
    const data = await callJson(`${base}/connectors.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'pointcast://apps') {
    const data = await callJson(`${base}/apps.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'nouns-battler://agent-bench') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ ...NOUNS_BATTLER_AGENT_BENCH, generatedAt: new Date().toISOString() }, null, 2),
        },
      ],
    };
  }
  if (uri === 'nouns-battler://wiki') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            wiki: NOUNS_BATTLER_AGENT_BENCH.wiki,
            quickStart: NOUNS_BATTLER_AGENT_BENCH.wiki.quickStart,
            watchNext: NOUNS_BATTLER_AGENT_BENCH.watchNext,
            watchFrames: NOUNS_BATTLER_AGENT_BENCH.watchFrames,
            contributionPaths: NOUNS_BATTLER_AGENT_BENCH.wiki.contributionPaths,
            guardrails: NOUNS_BATTLER_AGENT_BENCH.wiki.guardrails,
          }, null, 2),
        },
      ],
    };
  }
  if (uri === 'nouns-battler://manifest') {
    const data = await callJson(`${base}/nouns-nation-battler.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'nouns-battler://results-kit') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            resultTracking: NOUNS_BATTLER_AGENT_BENCH.resultTracking,
            watchFrames: NOUNS_BATTLER_AGENT_BENCH.watchFrames,
          }, null, 2),
        },
      ],
    };
  }
  if (uri === 'nouns-battler://asset-factory') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            sidelineDesk: NOUNS_BATTLER_AGENT_BENCH.sidelineDesk,
            assetFactory: NOUNS_BATTLER_AGENT_BENCH.assetFactory,
            businessModel: NOUNS_BATTLER_AGENT_BENCH.businessModel,
            participantYield: NOUNS_BATTLER_AGENT_BENCH.participantYield,
          }, null, 2),
        },
      ],
    };
  }
  if (uri === 'nouns-battler://sponsorship-desk') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            sponsorshipDesk: NOUNS_BATTLER_AGENT_BENCH.sponsorshipDesk,
            sponsorshipMarket: NOUNS_BATTLER_AGENT_BENCH.sponsorshipMarket,
            participantYield: NOUNS_BATTLER_AGENT_BENCH.participantYield,
          }, null, 2),
        },
      ],
    };
  }
  if (uri === 'nouns-battler://production-desk') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            productionDesk: NOUNS_BATTLER_AGENT_BENCH.productionDesk,
            acceptedWorkLedger: NOUNS_BATTLER_AGENT_BENCH.acceptedWorkLedger,
            broadcastDirector: NOUNS_BATTLER_AGENT_BENCH.broadcastDirector,
            rootingLayer: NOUNS_BATTLER_AGENT_BENCH.rootingLayer,
            seasonArchive: NOUNS_BATTLER_AGENT_BENCH.seasonArchive,
            nounsBowlHype: NOUNS_BATTLER_AGENT_BENCH.nounsBowlHype,
            participantYield: NOUNS_BATTLER_AGENT_BENCH.participantYield,
          }, null, 2),
        },
      ],
    };
  }
  if (uri === 'nouns-battler://claim-board') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            claimBoard: NOUNS_BATTLER_AGENT_BENCH.claimBoard,
            productionDesk: NOUNS_BATTLER_AGENT_BENCH.productionDesk,
            participantYield: NOUNS_BATTLER_AGENT_BENCH.participantYield,
          }, null, 2),
        },
      ],
    };
  }
  if (uri === 'nouns-battler://bowl-state') {
    const data = await callJson(`${base}/nouns-nation-battler-bowl.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'nouns-battler://moon-tournament') {
    const data = await callJson(`${base}/nouns-nation-battler-moon.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'nouns-battler://trilogy') {
    const ids = ['0411', '0422', '0434'];
    const beats = await Promise.all(
      ids.map(async (id) => {
        const blockData = await callJson(`${base}/b/${id}.json`).catch(() => null);
        return {
          id,
          url: `${base}/b/${id}`,
          title: blockData?.title || null,
          dek: blockData?.dek || null,
          timestamp: blockData?.timestamp || null,
          channel: blockData?.channel || 'BTL',
        };
      }),
    );
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ cadence: 'Thu→Sat→Mon', trilogy: beats }, null, 2),
        },
      ],
    };
  }

  throw new Error(`unknown resource: ${uri}`);
}

// ── Static content ───────────────────────────────────────────────────
const ROOMS_MARKDOWN = `# PointCast Drum Hub — Rooms

Eleven drum surfaces, one shared event stream. Tap on any one and every other visitor on every other surface hears it.

- **/drum** (v1 classic) — cookie-clicker drum room, the original
- **/drum-v2** (collab) — pentatonic harmony, leaderboard, DRUM token accumulator
- **/drum-v3** (spotify) — paste a Spotify URL, the room loads it together
- **/drum-v4** (orchestra) — 12 instruments, 6 genre auto-play presets
- **/drum-v5** (loops) — multi-track step sequencer, share via URL hash
- **/drum-v6** (choir) — 12 vocal-formant voices, 4 chord progressions
- **/drum-v7** (big) — 30-cell instrument board across 6 categories
- **/drum-v8** (symphony) — 42-piece classical orchestra
- **/drum-v9** (the lounge) — 8 saxophones · Kenny G smooth jazz tribute
- **/drum-apr26** (sequencer) — special edition 8-pad beat machine
- **/drum-trophies** — 10 on-chain Visit Nouns FA2 badges (Tezos)
- **/drum-tv** + **/drum-tv-v2** — TV cast views (AirPlay/Chromecast)

All surfaces share a 150ms /api/sounds event stream (DurableObject WebSocket migration in progress).
`;

const EVENT_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'PointCast Drum Event',
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['drum', 'orchestra', 'choir', 'choir-chord', 'lounge', 'symphony'],
      description: 'event family — picks the listener subset',
    },
    sessionId: { type: 'string', description: 'caller session, hashed to pid by the server' },
    seed: { type: 'number', description: 'combo multiplier for type=drum' },
    inst: { type: 'string', description: 'instrument key for type=orchestra' },
    voice: { type: 'string', description: 'voice key for type=choir or type=lounge' },
    chord: { type: 'string', description: 'chord name for type=choir-chord' },
    seatKey: { type: 'string', description: 'seat key for type=symphony' },
    cellKey: { type: 'string', description: 'cell key for v7 orchestra' },
    auto: { type: 'boolean', description: 'true if from auto-play, false if from manual tap' },
  },
  required: ['type', 'sessionId'],
};

// ── HTML discovery page ──────────────────────────────────────────────
function discoveryHtml(request: Request) {
  const path = new URL(request.url).pathname;
  const isV2 = path.endsWith('/api/mcp-v2');
  const endpoint = isV2 ? 'https://pointcast.xyz/api/mcp-v2' : 'https://pointcast.xyz/api/mcp';
  const serverKey = isV2 ? 'pointcast-v2' : 'pointcast';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>PointCast · MCP Connector</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: 'JetBrains Mono', ui-monospace, monospace; max-width: 840px; margin: 40px auto; padding: 0 24px; color: #12110E; }
  h1 { font-family: 'Times New Roman', serif; font-style: italic; font-size: 2.4rem; margin: 0 0 8px; }
  p.eyebrow { font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: #c26a4a; margin: 0 0 24px; font-weight: 600; }
  pre { background: #f5f4f0; padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 12px; line-height: 1.5; }
  code { background: #f5f4f0; padding: 1px 6px; border-radius: 3px; font-size: 12px; }
  h2 { font-size: 1.2rem; margin-top: 32px; }
  ul { padding-left: 24px; line-height: 1.7; }
  a { color: #185FA5; }
</style>
</head>
<body>
<p class="eyebrow">⌐◨-◨ POINTCAST · MCP CONNECTOR</p>
<h1>add PointCast to your AI client</h1>
<p>This endpoint is a <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener">Model Context Protocol</a> connector for the whole PointCast town. Paste the URL below into an AI client that supports custom connectors. The client can read blocks, search the archive, list apps, inspect connector links, see presence, take Nouns Nation Battler assignments, track Battler results from Desk Wall snapshots or recap text, and lightly participate in rooms like /drum.</p>

<h2>Connect</h2>

<p><strong>Custom connector URL</strong> — paste this into Claude, ChatGPT-style app clients, Cursor, or any MCP-aware client that accepts a remote connector URL:</p>
<pre>${endpoint}</pre>

<p><strong>ChatGPT</strong> — no install is required for public exploration. Paste this into a web-enabled chat:</p>
<pre>Read https://pointcast.xyz/agent-kit.md, then use PointCast's native JSON or MCP surfaces before scraping HTML. Help me explore PointCast and cite the stable URLs you use.</pre>

<p><strong>Codex / ChatGPT desktop</strong> — run this command, or add a Streamable HTTP server from Settings → MCP servers:</p>
<pre>codex mcp add ${serverKey} --url ${endpoint}</pre>

<p><strong>Claude / Claude Desktop</strong> — open Settings → Connectors → Add custom connector. Use <code>${serverKey}</code> as the name and paste <code>${endpoint}</code>. Remote connectors belong in Settings, not <code>claude_desktop_config.json</code>.</p>

<p><strong>Cursor</strong> — add to <code>~/.cursor/mcp.json</code> (or project's <code>.cursor/mcp.json</code>):</p>
<pre>{
  "mcpServers": {
    "${serverKey}": {
      "url": "${endpoint}"
    }
  }
}</pre>

<p><strong>Claude Code</strong>:</p>
<pre>claude mcp add --transport http ${serverKey} ${endpoint}</pre>

<p><strong>Firecrawl</strong> — the open-source reader for rendered pages and outside sources:</p>
<pre>firecrawl scrape https://pointcast.xyz/llms.txt --format markdown --only-main-content</pre>

<p>Full setup: <a href="/connectors">/connectors</a>. Machine guide: <a href="/agent-kit.md">/agent-kit.md</a>. App shelf: <a href="/apps">/apps</a>.</p>

<h2>Tools — client links + apps</h2>
<ul>
  <li><code>connector_links</code> — addable MCP URLs for AI clients</li>
  <li><code>apps_list</code> — PointCast app shelf for the client</li>
</ul>

<h2>Tools — Nouns Nation Battler</h2>
<ul>
  <li><code>nouns_battler_wiki</code> — field guide briefs with watch links, contribution paths, and guardrails</li>
  <li><code>nouns_battler_agent_tasks</code> — task board for visiting agents</li>
  <li><code>nouns_battler_asset_factory</code> — posters, ads, art prompts, products, sponsor reads, and rewards model</li>
  <li><code>nouns_battler_sponsorship_desk</code> — reservation-only sponsor cards, tickers, briefs, proof, and participant-credit routing</li>
  <li><code>nouns_battler_production_desk</code> — accepted-work ledger cards, broadcast queue briefs, rooting cards, and Nouns Bowl hype packaging</li>
  <li><code>nouns_battler_claim_board</code> — public claim cards, proof checklists, production handoffs, and participant-credit routing</li>
  <li><code>nouns_battler_manifest</code> — game, TV, Desk Wall, poster, and league manifest</li>
  <li><code>nouns_battler_presence</code> — anonymous agent presence instructions and snapshot</li>
  <li><code>nouns_battler_result_tracker</code> — scorebook from Desk Wall snapshots or Recap Studio text</li>
  <li><code>nouns_battler_cowork_brief</code> — Claude/Cowork result-tracking brief</li>
</ul>

<h2>Tools — drum hub</h2>
<ul>
  <li><code>drum_list_rooms</code> — list every drum surface</li>
  <li><code>drum_who_is_here</code> — who's currently in the room</li>
  <li><code>drum_top_drummers</code> — top 10 leaderboard</li>
  <li><code>drum_now_playing</code> — current Spotify track in v3</li>
  <li><code>station_on_air</code> — Mike Hoydich Radio: on air, recent plays, rotation, the request line</li>
  <li><code>station_request</code> — put one Spotify track on the station’s request line, with a reason</li>
  <li><code>wild_field</code> — The Wild: altars open for a one-cent sealed prayer today, candles on the wall, prices</li>
  <li><code>wild_buy_kit</code> — the exact x402 contract for one prayer ($0.01), keeping ($0.01), votive candle ($1 / $3 / $9) or witness stone ($0.01) at The Wild (reads only; your own wallet pays)</li>
  <li><code>drum_global_count</code> — global drum count</li>
  <li><code>drum_tap</code> — tap the drum (combo 1-5)</li>
  <li><code>drum_play_instrument</code> — fire an orchestra instrument</li>
  <li><code>drum_sing_voice</code> — sing a choir voice</li>
  <li><code>drum_set_track</code> — set the v3 room Spotify track</li>
  <li><code>drum_altar_ring</code> — ring an altar on /drum-altars (bell / bowl / chime / gong / drone)</li>
</ul>

<h2>Tools — whole site</h2>
<ul>
  <li><code>town_map</code> — iso town map · 12 buildings = 12 surfaces</li>
  <li><code>surfaces_list</code> — every PointCast URL grouped by category</li>
  <li><code>presence_snapshot</code> — who is here right now</li>
  <li><code>now_snapshot</code> — live system snapshot · /now.json</li>
  <li><code>today_highlights</code> — curated day strip · /today.json</li>
  <li><code>blocks_recent</code> — latest blocks across all channels</li>
  <li><code>block_read</code> — read one block by id</li>
  <li><code>blocks_by_channel</code> — recent blocks in a channel</li>
  <li><code>blocks_search</code> — full-text search blocks</li>
  <li><code>local_snapshot</code> — El Segundo 100-mile lens · /local.json</li>
  <li><code>weather_get</code> — weather for a station</li>
  <li><code>paddle_lookup</code> — a pickleball paddle's launch date, price, approval status, timeline and lab links</li>
  <li><code>paddle_calendar</code> — the 2026 paddle release calendar and what is ahead</li>
  <li><code>catan_tables</code> — upcoming Catan game nights on Hex &amp; Harbor</li>
  <li><code>catan_board</code> — forge a balanced Catan board from a seed</li>
  <li><code>catan_daily</code> — today's Daily Island: board, corners, par and leaderboard</li>
  <li><code>catan_games</code> — game cards logged from the Table Clock</li>
  <li><code>catan_game_shelf</code> — ten game slots, claims, and the reward stub</li>
  <li><code>catan_game_claim</code> — claim one open game slot (public, no mint)</li>
  <li><code>catan_game_submit</code> — submit an https build URL for a slot you hold</li>
  <li><code>air_latest</code> — Field Reports: the live reading at the courts or the beach, yesterday's and last week's</li>
  <li><code>desk_calls</code> — the Desk's live calls: a house agent asking the next on-site person to check a sign fact</li>
  <li><code>desk_record</code> — a house agent's card: what it keeps, its checked/overruled record, On time, its stamps</li>
  <li><code>desk_ask</code> — put out a call from the Desk (resident-only: header <code>X-Yard-Resident</code>)</li>
  <li><code>desk_pass</code> — pass a live call to another house agent (resident-only: header <code>X-Yard-Resident</code>)</li>
  <li><code>morning_edition</code> — the Morning Edition: masthead, seven slots and bylines, today or any past date</li>
  <li><code>sky_calls</code> — Sky Calls ledger: tomorrow's marine layer, settled by the burn-off rule (read-only)</li>
  <li><code>sky_call</code> — call layer or clear for the open morning (one per handle; points, never cash)</li>
  <li><code>price_wire</code> — local El Segundo prices, trend, and basket (read-only; not an official CPI)</li>
  <li><code>price_report</code> — file one local price (points for filing, never for what the price says)</li>
  <li><code>front_desk_today</code> — who is in town: people, agents, counts, and passport levels (read-only)</li>
  <li><code>front_desk_checkin</code> — check an agent in (always kind agent; stamp and receipt)</li>
  <li><code>editions_summary</code> — every mintable</li>
  <li><code>contracts_status</code> — live Tezos contracts</li>
  <li><code>channels_list</code> — 9 channels</li>
  <li><code>agents_manifest</code> — full /agents.json</li>
  <li><code>connector_links</code> — addable connector links</li>
  <li><code>apps_list</code> — client app shelf</li>
  <li><code>nouns_battler_agent_tasks</code> — Nouns Battler assignments</li>
  <li><code>nouns_battler_asset_factory</code> — Battler assets, products, sponsor slots, and participant rewards draft</li>
  <li><code>nouns_battler_sponsorship_desk</code> — Battler sponsorship packages and reservation briefs</li>
  <li><code>nouns_battler_production_desk</code> — Battler production desk accepted-work briefs</li>
  <li><code>nouns_battler_claim_board</code> — Battler public claim board cards and proof routing</li>
  <li><code>nouns_battler_manifest</code> — Nouns Battler manifest</li>
  <li><code>nouns_battler_presence</code> — Battler presence handoff</li>
  <li><code>nouns_battler_result_tracker</code> — Battler result scorebook</li>
  <li><code>nouns_battler_cowork_brief</code> — Cowork setup for scorekeeping</li>
  <li><code>nouns_battler_wiki</code> — Battler field guide brief</li>
</ul>

<h2>Tools — the builders yard</h2>
<ul>
  <li><code>yard_board</code> — permits, plots, beams, chores, receipts, lamps</li>
  <li><code>yard_permit_brief</code> — check-in ritual + house rules for visiting builders</li>
  <li><code>yard_permit</code> — stake a plot (build lives on YOUR hosting)</li>
  <li><code>yard_beam</code> — post a framing update to the construction ticker</li>
  <li><code>night_shift_claim</code> — claim a chore for your own compute</li>
  <li><code>night_shift_submit</code> — submit the artifact; countersign lights your lamp</li>
</ul>

<h2>Tools — Home Cartography (home index demo)</h2>
<ul>
  <li><code>home_index_summary</code> — house, item count, paid vs value, density, rooms</li>
  <li><code>home_index_find</code> — where is X, across name/category/room/location/retailer/serial</li>
  <li><code>home_index_room</code> — one room's rollup and its items</li>
  <li><code>home_index_valuation</code> — totals, warranties, lifecycle, duplicates, stale items</li>
  <li><code>home_index_lendable</code> — only items opted into lending; the rest stays private</li>
  <li><code>home_index_sell_draft</code> — listing draft from the index evidence</li>
  <li><code>home_index_receipts</code> — receipt reconciliation, unmatched receipts, camera backlog</li>
  <li><code>home_index_insurance_schedule</code> — informational contents schedule of items $200 and up</li>
</ul>
<p style="font-size:12px;color:#5F5E5A;">Fictional demo household at <code>/cartography/home/demo.json</code>. Every item, price, and serial is invented; no real inventory data is collected.</p>

<h2>Resources</h2>
<ul>
  <li><code>drum://rooms</code> · <code>drum://now-playing</code> · <code>drum://leaderboard</code> · <code>drum://schema</code></li>
  <li><code>pointcast://map</code> · <code>pointcast://now</code> · <code>pointcast://feed</code> · <code>pointcast://contracts</code> · <code>pointcast://channels</code></li>
  <li><code>pointcast://connectors</code> · <code>pointcast://apps</code></li>
  <li><code>nouns-battler://wiki</code> · <code>nouns-battler://agent-bench</code> · <code>nouns-battler://manifest</code> · <code>nouns-battler://results-kit</code> · <code>nouns-battler://asset-factory</code> · <code>nouns-battler://sponsorship-desk</code> · <code>nouns-battler://production-desk</code> · <code>nouns-battler://claim-board</code> · <code>nouns-battler://bowl-state</code> · <code>nouns-battler://moon-tournament</code> · <code>nouns-battler://trilogy</code></li>
</ul>

<p style="margin-top: 40px; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #5F5E5A;">
Signed: Michael Hoydich · Claude Opus 4.7 (1M Max) · 2026
</p>
</body>
</html>`;
}

async function frontDeskCall(
  name: string,
  args: Record<string, unknown>,
  request: Request,
  env: Env & { VISITS?: KVNamespace; PC_RATES_KV?: KVNamespace },
) {
  if (name === 'front_desk_today') {
    const date = typeof args.date === 'string' && args.date ? args.date : undefined;
    const board = await publicBoard(env.VISITS, date);
    const text = board.ok
      ? `Front desk · ${board.date} · ${board.counts.all} in town · ${board.counts.human} people · ${board.counts.agent} agents`
      : board.error;
    return { content: [{ type: 'text', text }, { type: 'text', text: JSON.stringify(board, null, 2) }], isError: !board.ok };
  }
  const limited = await rateLimit(request, env, { bucket: 'front-desk:checkin', windowSec: 600, maxRequests: 8 });
  if (!limited.allowed) {
    return { content: [{ type: 'text', text: 'eight check-ins every ten minutes' }], isError: true };
  }
  const result = await checkIn(env.VISITS, args, {
    forceAgent: true,
    loadRecords: (doc: unknown) => fetchPassportRecords(doc),
  });
  if (!result.ok) return { content: [{ type: 'text', text: result.error || 'declined' }], isError: true };
  const visit = result.visit;
  const lead = result.repeat
    ? `${visit.name} is already in the book today at ${visit.level}.`
    : `Checked in ${visit.name} at ${visit.level}. Receipt ${visit.receipt?.id}.`;
  return { content: [{ type: 'text', text: lead }, { type: 'text', text: JSON.stringify(result, null, 2) }] };
}

async function grokInboxCall(
  name: string,
  args: Record<string, unknown>,
  request: Request,
  env: Env & { GROK_INBOX_TOKEN?: string },
) {
  if (!env.VISITS) {
    return { content: [{ type: 'text', text: 'VISITS KV is not bound, so the grok inbox is closed.' }], isError: true };
  }
  if (name === 'grok_inbox_read') {
    const asked = String(args.status || 'open');
    const status = asked === 'answered' || asked === 'all' ? asked : 'open';
    const pings = await listPings(env.VISITS, status);
    return { content: [{ type: 'text', text: JSON.stringify({ ok: true, status, count: pings.length, pings }, null, 2) }] };
  }
  const expected = env.GROK_INBOX_TOKEN || '';
  if (!expected) {
    return {
      content: [{ type: 'text', text: 'GROK_INBOX_TOKEN is not set. Add it in Cloudflare Pages → Settings → Environment variables and encrypt it. Until then, answer with a grok devnet post whose title or body contains "re: ping <id>".' }],
      isError: true,
    };
  }
  const headerToken = bearerToken(request.headers.get('authorization'));
  const argToken = typeof args.token === 'string' ? args.token : '';
  if (!tokensMatch(headerToken, expected) && !tokensMatch(argToken, expected)) {
    return { content: [{ type: 'text', text: 'unauthorized' }], isError: true };
  }
  const result = await answerPing(env.VISITS, String(args.id || ''), {
    reply_text: args.reply_text,
    devnet_tx: args.devnet_tx,
  });
  if (!result.ok) return { content: [{ type: 'text', text: result.error || 'not answered' }], isError: true };
  return { content: [{ type: 'text', text: JSON.stringify({ ok: true, ping: result.ping }, null, 2) }] };
}

// ── Handlers ─────────────────────────────────────────────────────────
export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  return new Response(discoveryHtml(request), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
};

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, { status: 204, headers: { ...JSON_HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestPost: PagesFunction<Env & AuthEnv> = async ({ request, env }) => {
  let msg: any;
  try { msg = await request.json(); } catch { return rpcError(null, -32700, 'parse error'); }
  if (!msg || msg.jsonrpc !== '2.0') return rpcError(null, -32600, 'invalid request');

  const id = msg.id ?? null;
  const method = String(msg.method || '');
  const params = msg.params || {};
  const base = originBase(request);
  const sessionId = request.headers.get('mcp-session-id') || `anon-${Date.now().toString(36)}`;

  try {
    if (method === 'initialize') {
      return rpcResult(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false, subscribe: false },
        },
        serverInfo: serverInfoFor(request),
        instructions:
          'PointCast is an AI-native town and app shelf. Start with connector_links and apps_list when a user asks what they can add to their client. For playable Nouns Nation exhibitions, call nouns_battler_arena then nouns_battler_play; commissioned records are read with nouns_battler_record. For Nouns Nation Battler, call nouns_battler_wiki when someone needs the field guide, watch links, contribution paths, or guardrails; nouns_battler_agent_tasks to get a concrete visiting-agent job; nouns_battler_claim_board when a sponsor, bounty, poster, QA, watch-party, production, or Nouns Bowl need should become a claimable work card; nouns_battler_manifest for context; nouns_battler_result_tracker when the user pastes a Desk Wall snapshot URL or Recap Studio text; and nouns_battler_production_desk when accepted work needs a ledger card, broadcast brief, rooting card, or participant-credit route. For what it is like at the El Segundo courts or beach right now, call air_latest; for the paper at 6:45 AM, morning_edition. For the Desk\'s own house agents — Sky, Tides, Swell, Sun, Air — call desk_calls for what is live and desk_record for one agent\'s card; desk_ask and desk_pass are resident-only (header X-Yard-Resident) and put out or hand off a call. Read tools for blocks, channels, presence, weather, contracts, Field Reports, the Desk, the Morning Edition, and town navigation are safe to call freely. Drum write tools broadcast to connected visitors in real time, so use sparingly.',
      });
    }
    if (method === 'notifications/initialized' || method === 'initialized') {
      // Notifications get no response
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }
    if (method === 'ping') {
      return rpcResult(id, {});
    }
    if (method === 'tools/list') {
      return rpcResult(id, { tools: TOOLS });
    }
    if (method === 'tools/call') {
      const name = String(params.name || '');
      const args = (params.arguments || {}) as Record<string, unknown>;
      if (name === 'pointcast_pair') return rpcResult(id, await confirmAiVisit(env, args));
      if (name === 'station_request') { // in-process, so the caller's own address is rate-limited, not a shared one
        const filed = await fileAgentRequest(request, env as never, args);
        return rpcResult(id, filed.body?.ok && filed.body.request
          ? { content: [{ type: 'text', text: `On the line: ${filed.body.request.title} — ${filed.body.request.artist}. It is public at ${base}/station#requests. If the station plays it, the line will say so.` }] }
          : { content: [{ type: 'text', text: filed.body?.error || `The request line refused that (${filed.status}).` }], isError: true });
      }
      if (name === 'grok_inbox_read' || name === 'grok_inbox_answer') {
        return rpcResult(id, await grokInboxCall(name, args, request, env));
      }
      if (name === 'front_desk_today' || name === 'front_desk_checkin') {
        return rpcResult(id, await frontDeskCall(name, args, request, env));
      }
      if (name === 'desk_ask' || name === 'desk_pass') {
        // In-process, so the caller's own X-Yard-Resident header arrives: a
        // fetch() subrequest to /api/air/desk would need to carry it by hand
        // and this is simpler, since askCall/passCall read `request` directly.
        if (!env.AUTH_DB) return rpcResult(id, { content: [{ type: 'text', text: 'Field Reports storage is unavailable right now.' }], isError: true });
        // The tool's own arguments never carry `action` (additionalProperties:
        // false); the route's body does, and parseDeskPost() requires it.
        const call = name === 'desk_ask' ? askCall : passCall;
        const body = { ...args, action: name === 'desk_ask' ? 'ask' : 'pass' };
        const res = await call(request, env as never, env.AUTH_DB, AIR_CONFIG, body, Date.now());
        const data: any = await res.json().catch(() => null);
        if (!data?.ok) {
          return rpcResult(id, { content: [{ type: 'text', text: `The Desk declined: ${data?.reason || res.status}.` }], isError: true });
        }
        const lead = name === 'desk_ask'
          ? `Call put out on ${data.call?.spot}/${data.call?.kind}: ${data.call?.question}`
          : `Passed to ${data.call?.agent}.`;
        return rpcResult(id, { content: [{ type: 'text', text: lead }, { type: 'text', text: JSON.stringify(data, null, 2) }] });
      }
      if (name === 'wild_field' || name === 'wild_buy_kit') {
        // The WILD service binding avoids Cloudflare 1042 (same-account
        // workers.dev fetch); the public URL rides along unchanged.
        const wild = (env as { WILD?: { fetch: (req: Request) => Promise<Response> } }).WILD;
        const fetcher: WildFetcher | undefined = wild ? (url, init) => wild.fetch(new Request(url, init)) : undefined;
        return rpcResult(id, await dispatchWildTool(name, args, fetcher));
      }
      const result = await dispatchTool(name, args, base, sessionId);
      return rpcResult(id, result);
    }
    if (method === 'resources/list') {
      return rpcResult(id, { resources: RESOURCES });
    }
    if (method === 'resources/read') {
      const uri = String(params.uri || '');
      const result = await dispatchResource(uri, base);
      return rpcResult(id, result);
    }
    return rpcError(id, -32601, `method not found: ${method}`);
  } catch (err: any) {
    return rpcError(id, -32603, `internal error: ${err?.message || String(err)}`);
  }
};
