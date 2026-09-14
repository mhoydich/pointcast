import type { APIRoute } from 'astro';
import { initial, observe, human, partner, encounters, combos } from '../lib/co-games-engine.mjs';
import { coGameWorlds } from '../lib/co-games-worlds.ts';

export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'Co-games: Noun battles',
  url: 'https://pointcast.xyz/co-games',
  status: 'free-browser-practice',
  description: 'Help a little lost star find its way home through four pixel-art worlds. Play quick co-op Noun battles with visible attacks, armor and spell combos, or freely visit any chapter. Choose a spell; your partner adds support and one click resolves the turn.',
  availability: {
    practicePartner: true,
    pairedNativeSupport: true,
    providers: ['codex', 'claude'],
    requiresForNativeSupport: ['signed-in PointCast profile', 'paired awake computer', 'running companion', 'native subscription sign-in'],
    liveModelVerification: 'Each support response must report actualModels and a valid move before it is used.',
    publicMultiplayer: false,
    prizes: false,
    purchases: false,
  },
  state: { storage: 'browser memory; resets on reload', rulesAuthority: 'local deterministic engine', hiddenInformation: false,
    sessionWins: 'local completed wins only; resets on reload; no leaderboard', defaultEncounter: 'garden',
    encounterCycle: ['garden', 'rush', 'shell', 'storm'],
    restart: 'A loss retries the same encounter; a win offers the next chapter. New battle chooses the next different encounter. Worlds lets you visit any chapter without winning first. Each restart resets cards, health and move history with a new game ID, retaining session wins. Travel is blocked while a turn is in flight and never requests inference.' },
  story: {
    premise: 'A little lost star travels from Lantern grove to Midnight diner, Tideglass ruins and Moon station on its way home.',
    freeExploration: true,
    travelRequestsInference: false,
    chapters: Object.entries(coGameWorlds).map(([encounter, world]) => ({
      encounter, chapter: world.chapter, name: world.name, image: world.src,
      story: world.story, arrival: world.arrival, victory: world.victory,
    })),
  },
  presentation: {
    audio: {
      synthesis: 'Original browser Web Audio soundscapes and effects; no audio downloads or model calls.',
      moods: ['drift', 'gentle', 'playful'], defaultMood: 'gentle', defaultVolumePercent: 35,
      requiresUserGesture: true,
      controls: 'Mute, volume and sound mood are optional local preferences. Hidden pages suspend audio; returning requires another user gesture.',
    },
    visualEffects: ['gentle', 'full', 'still'],
    haptics: { defaultEnabled: false, requiresDeviceSupport: true, requiresExplicitOptIn: true,
      note: 'Optional vibration on supported devices; unavailable hardware or browser support is reported without implying a physical tap occurred.' },
  },
  rules: {
    rounds: 4, teamHealth: 14, defaultRivalHealth: encounters.garden.enemy, incomingAttacks: encounters.garden.threats,
    encounters, combos,
    compatibility: 'Classic retains the original no-combo rules for existing engine callers; the browser starts in Garden.',
    human, partner,
    humanStock: { ember: 3, root: 'unlimited', focus: 1 },
    supportStock: { echo: 2, ward: 2, mend: 1 },
    resolution: 'Heal first up to 14, including any active combo healing. Focus doubles only the next human damaging spell; then add support damage and active combo damage. Subtract this encounter’s current-turn armor once from combined damage, minimum zero. Both attacks land simultaneously; block expires each round. Win with rivals at 0 and team above 0; mutual destruction or surviving rivals after four rounds is a loss.',
  },
  agent: {
    protocol: 'pointcast.co-games.v1',
    observationExample: observe(initial('garden'), 'ember', 'example-game'),
    responseExample: { gameId: 'example-game', revision: 0, selectedHuman: 'ember', support: 'ward', reason: 'Protect the team while your spell damages the rival crew.' },
    constraints: 'Echo gameId, revision, and selectedHuman exactly. Choose only from legalSupports. Use the observation’s encounter, armor, attacks and enabled combos. Do not provide changed stats. Clicking Play with AI authorizes one support request and automatic resolution of that single validated turn. Each following round requires another explicit click; no automatic next-round inference. Visiting a world, changing sound settings or replaying does not authorize inference.',
    transport: 'The signed-in game uses /api/me/ai-runtimes. There is no public game mutation endpoint.',
    setup: 'https://pointcast.xyz/me#my-ai',
  },
  links: { spellframe: 'https://pointcast.xyz/spellframe', play: 'https://pointcast.xyz/play' },
}), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
