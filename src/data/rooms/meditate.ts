/**
 * Meditate room data — single source of truth.
 *
 * Imported by /meditate.json.ts (the contract endpoint) and by
 * /r/meditate.astro (the contract-driven render). Keeps both in sync
 * automatically.
 *
 * Sprint 2 of the live-artifacts arc.
 */
import { ROOM_CONTRACT_SCHEMA, type RoomSpec } from '../../lib/room-contract';

const programs = [
  {
    id: 'calm',
    name: 'Calm Bay',
    pattern: [4, 2, 6, 2],
    tone: 'soft shoreline',
    purpose: 'Quick nervous-system reset between blocks, calls, and shipping.',
    prompts: [
      'Let the inhale rise like a small wave.',
      'Rest at the crest without gripping.',
      'Exhale as the tide rolls back out.',
    ],
  },
  {
    id: 'current',
    name: 'Deep Current',
    pattern: [5, 2, 7, 2],
    tone: 'long exhale',
    purpose: 'Longer exhale for clearing mental noise before focused work.',
    prompts: [
      'Breathe below the surface of the feed.',
      'Let each thought pass like sea glass in the current.',
      'Lengthen the exhale until the water goes still.',
    ],
  },
  {
    id: 'moon',
    name: 'Moon Tide',
    pattern: [4, 4, 4, 4],
    tone: 'box breath',
    purpose: 'Evening square breath for letting the day close.',
    prompts: [
      'Inhale to the horizon.',
      'Pause in the silver quiet.',
      'Exhale into the dark water.',
    ],
  },
];

export function buildMeditateRoom(): RoomSpec {
  return {
    $schema: ROOM_CONTRACT_SCHEMA,
    id: 'meditate',
    title: 'The meditation room',
    description: 'Pulled from /meditate on PointCast. Three breathing programs, one shared choir.',
    home: 'https://pointcast.xyz/meditate',
    generatedAt: new Date().toISOString(),
    archiveBlock: {
      id: '0337',
      url: 'https://pointcast.xyz/b/0337',
      jsonUrl: 'https://pointcast.xyz/b/0337.json',
    },
    status: [
      { id: 'mood', label: 'MOOD', value: 'pot on' },
      { id: 'today-block', label: "TODAY'S BLOCK", value: "We Don't Care · tap-on-beat",
        source: 'https://pointcast.xyz/today.json' },
      { id: 'presence', label: 'PRESENT ON POINTCAST', value: '1 humans · 0 agents',
        source: 'https://pointcast.xyz/presence.json?room=meditate' },
      { id: 'now-playing', label: 'NOW PLAYING', value: 'silent',
        source: 'https://pointcast.xyz/drum-v6.json?field=playing' },
    ],
    visualizer: { type: 'breath', binding: 'pattern' },
    programs,
    controls: [
      {
        id: 'duration',
        type: 'duration',
        defaultId: '5m',
        options: [
          { id: '2m',  label: '2 min',  value: 120, name: 'Morning tide' },
          { id: '5m',  label: '5 min',  value: 300, name: 'Deep reset' },
          { id: '10m', label: '10 min', value: 600, name: 'Full drift' },
        ],
      },
    ],
    verbs: [
      {
        id: 'sing',
        label: 'Sing into the choir on /drum-v6',
        description: 'Adds one harmonic voice (Cmaj9) to the global PointCast choir — a small bell for your sit.',
        method: 'POST',
        endpoint: 'https://pointcast.xyz/drum-v6/sing',
        payload: { voice: 'alt-c', from: 'meditate' },
        receipt: { template: 'you sang {arg} into {target} · {time}' },
      },
    ],
    presence: {
      source: 'https://pointcast.xyz/presence.json?room=meditate',
      showHumans: true,
      showAgents: true,
    },
    sources: [
      { label: 'breath patterns from /meditate.json', url: 'https://pointcast.xyz/meditate.json' },
      { label: 'choir surface /drum-v6', url: 'https://pointcast.xyz/drum-v6' },
      { label: 'ambient strip from /today & /now', url: 'https://pointcast.xyz/today' },
    ],
    related: [
      { label: 'PointCast home', url: 'https://pointcast.xyz/' },
      { label: 'Nature field guide', url: 'https://pointcast.xyz/nature' },
      { label: 'Blocks JSON', url: 'https://pointcast.xyz/blocks.json' },
    ],
    artifact: {
      name: 'Breathe El Segundo',
      image: 'https://pointcast.xyz/images/tokens/breathe-el-segundo.webp',
    },
  };
}
