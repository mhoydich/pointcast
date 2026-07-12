/**
 * Welcome room — the starter room for a new PointCast node.
 *
 * Edit this file to make it yours: change the title, swap the programs,
 * wire a real verb endpoint, point status badges at your live data.
 * Then duplicate this file to add more rooms — each new room ships as
 * src/data/rooms/<id>.ts + src/pages/<id>.json.ts + src/pages/r/<id>.astro.
 */
import { ROOM_CONTRACT_SCHEMA, type RoomSpec } from '../../lib/room-contract';

export function buildWelcomeRoom(): RoomSpec {
  return {
    $schema: ROOM_CONTRACT_SCHEMA,
    id: 'welcome',
    title: 'A new room.',
    description: 'You just spun up a PointCast node. This is the starter room — edit src/data/rooms/welcome.ts to make it yours.',
    home: 'https://your-node.example/r/welcome',
    generatedAt: new Date().toISOString(),
    status: [
      { id: 'node', label: 'NODE', value: 'your-node' },
      { id: 'today', label: 'TODAY', value: 'first light' },
      { id: 'present', label: 'PRESENT', value: '1 humans · 0 agents' },
      { id: 'mood', label: 'MOOD', value: 'just opened' },
    ],
    visualizer: { type: 'breath', binding: 'pattern' },
    programs: [
      {
        id: 'arrival',
        name: 'Arrival',
        pattern: [4, 2, 6, 2],
        tone: 'soft shoreline',
        purpose: 'A quick breath while the page comes alive.',
        prompts: [
          'You are here.',
          'The room is listening.',
          'Take one slow exhale.',
        ],
      },
    ],
    controls: [
      {
        id: 'duration',
        type: 'duration',
        defaultId: '2m',
        options: [
          { id: '2m', label: '2 min', value: 120 },
          { id: '5m', label: '5 min', value: 300 },
        ],
      },
    ],
    verbs: [
      {
        id: 'wave',
        label: 'Wave at the broadcast',
        description: 'Pings the node to say you arrived. Wire this to your own endpoint later.',
        method: 'POST',
        endpoint: 'https://your-node.example/wave',
        payload: { from: 'welcome' },
        receipt: { template: 'you waved at {target} · {time}' },
      },
    ],
    sources: [
      { label: 'welcome.json', url: 'https://your-node.example/welcome.json' },
    ],
    related: [
      { label: 'PointCast (root)', url: 'https://pointcast.xyz' },
    ],
  };
}
