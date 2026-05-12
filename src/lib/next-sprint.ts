export const NEXT_SPRINT = {
  id: 'shrine-bell-crawl-sprint',
  title: 'Shrine Bell Crawl Sprint',
  slug: 'next-sprint',
  status: 'ready',
  owner: 'codex',
  horizon: '24 shrines, one visit-after-visit crawl',
  startsAt: '2026-05-12T09:00:00-07:00',
  human: 'https://pointcast.xyz/next-sprint',
  json: 'https://pointcast.xyz/next-sprint.json',
  archiveBlock: null,
  heroImage: '/images/shrines/shrine-background-sheet.png',
  heroImageAlt: 'Generated PointCast shrine background sheet',
  related: {
    operatingBoard: 'https://pointcast.xyz/shrine-crawl',
    operatingBoardLabel: 'Shrine Crawl',
    builder: 'https://pointcast.xyz/shrines',
    builderLabel: 'Shrine Gallery',
    manifest: 'https://pointcast.xyz/shrine-crawl.json',
    manifestLabel: 'Crawl JSON',
    sprintPicker: 'https://pointcast.xyz/sprints',
  },
  goal:
    'Ship a 24-stop shrine crawl where every visit has a distinct background direction, a bell-ringing option, a route to visit next, and a Midjourney-ready prompt for the shrine visual pass.',
  whyTitle: 'Make shrine visits feel like a crawl, not a gallery.',
  whyBody:
    'The previous shrine work gave PointCast a strong unfurl language. This sprint turns that language into a playable chain: ring the bell, collect the prompt, visit the next room, and keep the route ritual moving.',
  scoreboard: [
    { label: 'Shrines', target: 24, unit: 'unique visits' },
    { label: 'Bell Modes', target: 4, unit: 'ring patterns' },
    { label: 'Route Exits', target: 24, unit: 'live next visits' },
    { label: 'MJ Prompts', target: 24, unit: 'image recipes' },
    { label: 'Agent Reads', target: 2, unit: 'JSON endpoints' },
  ],
  kickoff: [
    {
      label: 'Now',
      title: 'Open the crawl',
      href: '/shrine-crawl',
      detail: 'Visit each shrine, ring its bell, and move to the next PointCast route.',
    },
    {
      label: 'Next',
      title: 'Pull the image recipes',
      href: '/shrine-crawl.json',
      detail: 'Use the Midjourney-ready prompt list as the v2 background generation queue.',
    },
    {
      label: 'Later',
      title: 'Fold back into shrines',
      href: '/shrines',
      detail: 'Treat the best crawl concepts as the next permanent shrine sets.',
    },
  ],
  lanes: [
    {
      id: 'concepts',
      label: 'Shrine Concepts',
      owner: 'Codex',
      target: '24 distinct stops with a reason to exist',
      tasks: [
        'Name each shrine so it feels like a room, not a generic card.',
        'Pair every shrine with an existing PointCast route that works as the next visit.',
        'Keep the crawl loop coherent enough to run in one sitting.',
      ],
    },
    {
      id: 'backgrounds',
      label: 'Backgrounds',
      owner: 'Codex + Mike',
      target: 'Midjourney-ready recipes for every shrine',
      tasks: [
        'Write one prompt per shrine with subject, materials, mood, and no-text constraints.',
        'Use the existing shrine background art as the temporary v1 surface.',
        'Keep prompts seedable so a later Midjourney pass can generate a stable set.',
      ],
    },
    {
      id: 'bells',
      label: 'Bells',
      owner: 'Codex',
      target: 'four ring patterns that make repeat clicks feel different',
      tasks: [
        'Reuse the shared Noun voice chime helpers instead of adding another audio path.',
        'Give each shrine a noun id and a single, chord, cascade, or drone mode.',
        'Track rung and visited state locally without making it a permission system.',
      ],
    },
    {
      id: 'chain',
      label: 'Visit Chain',
      owner: 'Codex',
      target: 'one-button next shrine progression',
      tasks: [
        'Add a rail with all 24 stops and an obvious current shrine.',
        'Make Visit Next advance the crawl while keeping route links visible.',
        'Keep the page functional on narrow screens without text collisions.',
      ],
    },
    {
      id: 'polish',
      label: 'Polish',
      owner: 'Mike + PointCast',
      target: 'a crawl worth revisiting after the image pass',
      tasks: [
        'Run the crawl on desktop and mobile and tighten any long labels.',
        'Pick the strongest prompts for the first Midjourney generation batch.',
        'Publish a short recap that names the best shrine visit and the next v3 idea.',
      ],
    },
  ],
  days: [
    {
      label: 'Hour 0',
      title: 'Rotate the board',
      deliverable: '/next-sprint and /next-sprint.json point at the shrine bell crawl.',
    },
    {
      label: 'Hour 6',
      title: 'Ship the 24-stop crawl',
      deliverable: '/shrine-crawl renders every shrine with bells, tasks, routes, and prompts.',
    },
    {
      label: 'Hour 12',
      title: 'Generate the image pass',
      deliverable: 'Use the Midjourney prompt queue to make the first 24 shrine background candidates.',
    },
    {
      label: 'Hour 24',
      title: 'Promote the winners',
      deliverable: 'The best backgrounds become permanent shrine assets and the rest become v3 notes.',
    },
  ],
  gates: [
    'No shrine blocks access to a real page; this stays playful, not permissioned.',
    'No completion state depends on a server write.',
    'No shrine ships without a working route href and a next-visit action.',
    'No Midjourney prompt asks for readable text, logos, or watermark-like marks.',
    'No new sound path bypasses the existing shared chime helpers.',
  ],
  nextBuilds: [
    {
      id: 'crawl-page',
      title: 'Crawl page',
      output: 'Build the interactive 24-shrine bell crawl.',
      estMin: 45,
    },
    {
      id: 'crawl-json',
      title: 'Crawl JSON',
      output: 'Expose all shrine visits, bells, routes, tasks, and prompts as agent-readable JSON.',
      estMin: 35,
    },
    {
      id: 'gallery-link',
      title: 'Gallery link',
      output: 'Add crawl entry points from the existing shrine gallery.',
      estMin: 30,
    },
    {
      id: 'image-pass',
      title: 'Midjourney batch',
      output: 'Generate the first 24 background candidates from the prompt queue.',
      estMin: 30,
    },
    {
      id: 'mobile-pass',
      title: 'Mobile polish pass',
      output: 'Verify the crawl across narrow screens and tighten any overflow.',
      estMin: 25,
    },
  ],
  links: [
    { label: '/shrine-crawl', href: '/shrine-crawl' },
    { label: '/shrine-crawl.json', href: '/shrine-crawl.json' },
    { label: '/shrines', href: '/shrines' },
    { label: '/unfurls#builder', href: '/unfurls#builder' },
    { label: '/next-sprint.json', href: '/next-sprint.json' },
  ],
};

export type NextSprint = typeof NEXT_SPRINT;
