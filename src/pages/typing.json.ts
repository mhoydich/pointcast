const drills = [
  {
    id: 'dispatch',
    label: 'Dispatch',
    intent: 'Practice PointCast front-door and block-language sentences.',
    lines: [
      'PointCast is still the dispatch board.',
      'A living broadcast from El Segundo, one Block at a time.',
      'The feed stays dense, local, slightly cryptic, and alive.',
      'Every dispatch is a Block before it is a page.',
    ],
  },
  {
    id: 'routes',
    label: 'Routes',
    intent: 'Practice exact PointCast route strings and agent-readable endpoints.',
    lines: [
      '/for-agents /agents.json /llms.txt /llms-full.txt',
      '/now /today /feed.json /feed.xml /archive.json',
      '/gamgee /sprints /workbench /status /ping',
      '/drum /battle /yee /polls /nouns-cola-crush',
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    intent: 'Practice the multi-agent build-loop language.',
    lines: [
      'Claude shapes the plan. Codex lands the patch. Manus runs the browser pass.',
      'Ship in small reviewable slices and leave the dirty train inventoried.',
      'Agents get stable manifests, feeds, and a visible release ledger.',
      'Humans get the live home; machines get the canonical map.',
    ],
  },
  {
    id: 'gamgee',
    label: 'Gamgee',
    intent: 'Practice the RC0 release-note voice.',
    lines: [
      'Gamgee explains the doorway without cleaning the fingerprints off the controls.',
      'The release frame does not replace the old site. It protects it.',
      'YOU ALONE OPEN DRAWER BEACON AGENT MAP DIRTY TRAIN INVENTORY',
      'Small enough to ship. Weird enough to still be PointCast.',
    ],
  },
];

export async function GET() {
  return new Response(JSON.stringify({
    schema: 'https://pointcast.xyz/schemas/typing-tutor-v0',
    name: 'PointCast Typing Tutor',
    url: 'https://pointcast.xyz/typing',
    generatedAt: new Date().toISOString(),
    storage: 'localStorage only; no server-side score writes',
    metrics: ['wpm', 'accuracy', 'progress', 'errors', 'streak', 'best per drill bank'],
    drills,
  }, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
}
