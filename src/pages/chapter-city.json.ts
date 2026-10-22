import type { APIRoute } from 'astro';
import { TOOLS, W, H, DILEMMAS, LANDMARKS } from '../scripts/chapter-city-sim.mjs';
import { CAST } from '../scripts/chapter-city-story.mjs';

const payload = {
  name: 'Chapter City',
  kind: 'browser city-building game with procedural fiction',
  canonical: 'https://pointcast.xyz/chapter-city/',
  description: 'A SimCity-style city-builder in which each simulated year is written up as a chapter of a novel about the town. Story text is generated in the browser from templates and the simulation state; no AI model, accounts or network calls are used during play.',
  map: { width: W, height: H, terrain: ['sea', 'beach', 'grass', 'trees', 'creek'] },
  tools: Object.fromEntries(Object.entries(TOOLS).map(([k, t]) => [k, { label: t.label, cost: t.cost, monthlyUpkeep: t.upkeep }])),
  landmarks: Object.fromEntries(LANDMARKS.map((k) => [k, { label: TOOLS[k].label, cost: TOOLS[k].cost, unlocksAtPopulation: TOOLS[k].unlock, coastal: !!TOOLS[k].coastal }])),
  rules: [
    'Zones (homes, shops, industry) grow only within two tiles of a road and with power; above the first level they also need water.',
    'Demand for homes follows jobs; demand for shops and industry follows population. Taxes above 7% lower all demand.',
    'Schools, clinics, fire stations and watch houses cover about six tiles. Unprotected built-up lots can burn.',
    'Industry and power plants pollute within three tiles; parks and trees reduce it. Land near the sea is worth more.',
    'Each turn simulates twelve months, names districts, and writes one chapter with a newspaper headline.',
    'Landmarks (lighthouse, ferry pier, college, stadium) unlock at population milestones; each can be built once, and the lighthouse and pier must touch the sea.',
    'Elections every four years: below 40% approval ends the book. A treasury below -1,500 at year end also ends it.',
  ],
  story: {
    engine: 'Seeded templates over simulation events; chapters are deterministic for a given town and year',
    cast: CAST,
    recurring: ['Wendell, a sea serpent', 'Ines the falconer', 'the town Ledger'],
    dilemmas: Object.fromEntries(Object.entries(DILEMMAS).map(([k, d]) => [k, { title: d.title, options: [d.a.label, d.b.label] }])),
    plates: 'Each chapter carries a woodcut-style plate drawn from a snapshot of the map at that year end.',
    readAloud: 'Chapters can be read aloud with the browser speech synthesis voice, when available.',
    card: 'Any chapter can be saved or shared as a 1200x630 PNG card: masthead, headline, title and plate, drawn in the browser.',
    export: 'The whole novel downloads as Markdown.',
  },
  fiction: 'The town, characters, newspaper and serpent are fictional.',
  boundaries: { storage: 'browser localStorage only', accounts: false, network: 'fonts only', ai: false, payments: false },
  methods: ['GET'],
  sideEffects: 'none',
};

export const GET: APIRoute = () => new Response(JSON.stringify(payload, null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' },
});
