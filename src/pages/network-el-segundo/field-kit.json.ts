import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const payload = {
    id: 'network-el-segundo-field-kit-003',
    name: 'Local Signal Field Kit',
    author: 'MH',
    publishedAt: '2026-07-23T18:55:00.000Z',
    status: 'concept-system-published',
    canonicalUrl: 'https://pointcast.xyz/network-el-segundo/field-kit',
    releaseUrl: 'https://network-el-segundo.mhoydich.chatgpt.site/field-kit',
    pointcastBlock: 'https://pointcast.xyz/b/0488',
    shareImage: 'https://network-el-segundo.mhoydich.chatgpt.site/og-field-kit.png',
    premise: 'Eight neighbor-scale instruments share one four-signal language across an opt-in local mesh.',
    products: [
      { id: 'beam-01', name: 'Porch Beam', channel: 'aimed light', targetReach: '25 m sightline' },
      { id: 'window-02', name: 'Window Flag', channel: 'ambient light', targetReach: '60 m visual' },
      { id: 'chime-03', name: 'Corner Chime', channel: 'quiet sound', targetReach: '12 m audible' },
      { id: 'burst-04', name: 'Microburst', channel: 'radial LED light', targetReach: '40 m visual', rule: 'mini fireworks, zero fire' },
      { id: 'pebble-05', name: 'Hush Pebble', channel: 'touch', targetReach: 'shared surface' },
      { id: 'ripple-06', name: 'Roof Ripple', channel: 'shielded line light', targetReach: '100 m visual' },
      { id: 'relay-07', name: 'Mesh Post', channel: 'local relay', targetReach: '250 m concept target' },
      { id: 'cards-08', name: 'Field Cards', channel: 'paper and reflection', targetReach: 'across a room' },
    ],
    protocol: [
      { id: 'hello', signal: 'HELLO', pattern: 'one short pulse', meaning: 'I see you; no reply needed' },
      { id: 'meet', signal: 'MEET', pattern: 'three even pulses', meaning: 'come outside or join a scheduled gathering' },
      { id: 'hand', signal: 'NEED A HAND', pattern: 'long, short, long', meaning: 'neighbor assistance; not an emergency channel' },
      { id: 'clear', signal: 'ALL CLEAR', pattern: 'two slow pulses', meaning: 'finished, home safe, close the loop' },
    ],
    rollout: {
      geography: 'Diagrammatic El Segundo study from the Pacific edge through Downtown and Smoky Hollow to the eastside campus and transit edge.',
      mapIsForNavigation: false,
      municipalPlan: false,
      phases: [
        { id: 1, name: 'Porch loop', nodes: 8, runTime: 'two evenings' },
        { id: 2, name: 'Cross-town thread', nodes: 16, runTime: 'four weekends' },
        { id: 3, name: 'Dusk rehearsal', nodes: 24, runTime: 'one shared hour' },
      ],
    },
    boundaries: {
      certifiedHardware: false,
      emergencyChannel: false,
      surveillance: false,
      locationHistory: false,
      pyrotechnics: false,
      lasers: false,
      flame: false,
      projectiles: false,
      physicalPilotRequires: ['host consent', 'line-of-sight testing', 'local review', 'quiet hours', 'one-evening shutdown plan'],
    },
    interaction: {
      browserAudio: 'User-triggered low-volume previews only; no autoplay.',
      map: 'Visitors can switch among three rollout phases and rehearse four shared signals.',
      storedData: 'None.',
    },
    disclosure: 'This is a signed MH concept release, not certified hardware, emergency infrastructure, a municipal program, or an active physical mesh.',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
