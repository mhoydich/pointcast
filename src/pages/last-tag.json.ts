const manifest = {
  version: '1.0.0',
  name: 'Last Tag',
  human: 'https://pointcast.xyz/last-tag',
  genre: ['tag', 'arcade', 'action'],
  players: { human: 1, totalRunners: 6 },
  objective: 'Do not be it when the round clock reaches zero.',
  roundLengthsSeconds: [30, 60, 90],
  defaultRoundSeconds: 60,
  controls: {
    keyboard: ['WASD', 'Arrow keys', 'Space to dash'],
    pointer: ['Tap or drag to move', 'DASH button'],
  },
  rules: [
    'Touch another runner while you are it to transfer the tag.',
    'Dash recharges every four seconds.',
    'The playable boundary shrinks late in the round.',
    'The final ten seconds are sudden death.',
  ],
  persistence: {
    scope: 'device-local',
    bestScoreKey: 'pc:last-tag:best-v1',
  },
  related: {
    tagSignal: 'https://pointcast.xyz/tag-signal',
    apps: 'https://pointcast.xyz/apps',
  },
};

export const prerender = true;

export async function GET() {
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
