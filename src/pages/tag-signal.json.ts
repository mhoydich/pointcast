/**
 * /tag-signal.json - machine-readable manifest for the embeddable tag game.
 */
import type { APIRoute } from 'astro';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Tag Signal',
  status: 'playable browser prototype',
  human: 'https://pointcast.xyz/tag-signal',
  playable: 'https://pointcast.xyz/games/tag-signal/',
  embedDemo: 'https://pointcast.xyz/games/tag-signal/embed-demo.html',
  install: {
    script: 'https://pointcast.xyz/games/tag-signal/embed.js',
    snippet: '<script src="https://pointcast.xyz/games/tag-signal/embed.js" data-tag-game data-campaign="spring-drop" data-site="homepage"></script>',
    optionalAttributes: ['data-campaign', 'data-site', 'data-duration', 'data-endpoint'],
  },
  intent: 'A portable game block that can travel onto other sites while keeping a simple event trail.',
  game: {
    genre: 'tag',
    durationSeconds: 30,
    controls: ['arrow keys', 'WASD', 'click', 'touch drag'],
    objective: 'Tag the red runner before time expires.',
  },
  tracking: {
    localStorageKey: 'tag-game-events-v1',
    eventTypes: ['impression', 'start', 'tag', 'finish'],
    browserEvent: 'tag-game:event',
    postMessage: '{ source: "tag-game", event }',
    endpoint: 'Optional data-endpoint receives JSON via navigator.sendBeacon when available.',
  },
  caveats: [
    'Scores and events are local browser state unless data-endpoint is configured.',
    'The embed script loads its own scoped CSS and game engine from the same folder.',
    'No personal identity, wallet, or cross-site tracking is built in.',
  ],
  links: {
    human: 'https://pointcast.xyz/tag-signal',
    playable: 'https://pointcast.xyz/games/tag-signal/',
    embedDemo: 'https://pointcast.xyz/games/tag-signal/embed-demo.html',
    block: 'https://pointcast.xyz/b/0388',
    channel: 'https://pointcast.xyz/c/btl',
  },
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
