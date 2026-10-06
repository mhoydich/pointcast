import type { APIRoute } from 'astro';
import learning from '../../lib/pickleball-home/learning.json' with { type: 'json' };
import courts from '../../lib/pickleball-home/courts.json' with { type: 'json' };
import { PRACTICE_OPTIONS, PRACTICE_PRESETS } from '../../lib/pickleball-v2/model.js';
import { articles, publicArticle } from '../../lib/pickleball-v2/articles.js';
import paddleLab from '../../lib/paddle-court/public.json' with { type: 'json' };

export const GET: APIRoute = () => new Response(JSON.stringify({
  title: 'Pickleball Home · RALLY × PointCast',
  url: 'https://pointcast.xyz/pickleball/home',
  primarySite: 'https://tez-rally.pages.dev/',
  board: 'https://pointcast.xyz/pickleball',
  learning,
  courts,
  v2: {
    version: '2.0',
    checkedAt: '2026-10-03',
    planner: { options: PRACTICE_OPTIONS, presets: PRACTICE_PRESETS, instruction: 'Original practice prompts adapted to goal, time, space and partner. Compact-net plans do not measure regulation-court depth or coverage.' },
    scorecard: { schema: 2, storage: 'browser-local', maxSets: 100, export: 'JSON', measurement: 'Self-reported attempts and reps meeting a chosen target; not a verified skill rating.', accountSync: false, publicAPI: false },
    articles: articles.map(publicArticle),
  },
  paddleLab: {
    ...paddleLab,
    integrationUrl: 'https://pointcast.xyz/pickleball/home#paddle-court-station',
    publication: { ...paddleLab.publication, hero_cta: { ...paddleLab.publication.hero_cta, anchor: '#paddle-court-card' } },
    interactive_court_card: { ...paddleLab.interactive_court_card, id: 'paddle-court-card', publicEntries: false },
  },
  availability: 'Directory facts are sourced and dated. This feed does not claim current court availability.',
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' } });
