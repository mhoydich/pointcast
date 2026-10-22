import type { APIRoute } from 'astro';
import {
  GRIDTOWN_VERSION, GRIDTOWN_TITLE, GRIDTOWN_DESCRIPTION, GRID_SIZE, MAX_LEVEL, STARTING_FUNDS, POWER_CAPACITY, UPKEEP, RESIDENTS_PER_LEVEL, JOBS,
  TOOLS, LESSONS, TILES, STORAGE_KEY, CITY_TITLES, createCity, cityToText, encodeCity,
} from '../lib/gridtown.mjs';

export const GET: APIRoute = () => {
  const sample = createCity(20261022);
  const payload = {
    schema: 'pointcast.gridtown/v1',
    version: GRIDTOWN_VERSION,
    title: GRIDTOWN_TITLE,
    url: 'https://pointcast.xyz/gridtown/',
    description: GRIDTOWN_DESCRIPTION,
    published: '2026-10-22',
    author: 'PointCast · Claude Code',
    play: {
      input: 'Tap or click a tile with a tool selected; drag to paint roads, zones and bulldozing. Arrow keys move a cursor, Enter builds, number keys pick tools, N advances a month.',
      time: 'One month per Next month press, or one every two seconds with Auto on.',
      storage: { where: 'browser-local', key: STORAGE_KEY, portable: 'Export or import city JSON; the same file reloads the same town.' },
      share: {
        map: 'https://pointcast.xyz/gridtown/?seed={seed} opens the same empty terrain for anyone.',
        city: 'https://pointcast.xyz/gridtown/#city={code} opens a whole town read-only; the visitor can inspect it and keep a copy, which replaces their saved city.',
        code: 'g1.{seed}.{month}.{funds}.{tax}.{256 tile letters}.{url-encoded name}: numbers in base 36, funds may start with -. Tiles: g grass, w water, t trees, r road, p park, e power plant; homes a-d, shops h-k, workshops m,n,o,q for levels 0-3. Water must match the seed.',
      },
      inspect: 'Inspect any tile (I) for its road, power, demand, air and land value, and the one next step that would let it grow.',
      price: 'free',
      account: 'none',
    },
    board: { size: GRID_SIZE, startingFunds: STARTING_FUNDS, maxLevel: MAX_LEVEL, tiles: Object.values(TILES) },
    tools: TOOLS.map((t) => ({ id: t.id, label: t.label, cost: t.cost, key: t.key, hint: t.hint })),
    rules: {
      growth: 'Zone tiles are visited in reading order from the top left. A zone gains one level a month when it touches a road on one of four sides, is powered, and demand for it is positive at that moment; demand is recomputed after every tile that changes, so growth stops once the town has what it asked for. A zone loses a level when dark or cut off, or when demand is below -40. A home in smoke stops at level one and loses a level a month until it gets there.',
      people: { residentsPerHomeLevel: RESIDENTS_PER_LEVEL, jobsPerShopLevel: JOBS.com, jobsPerWorkshopLevel: JOBS.ind },
      power: { zoneTilesPerPlant: POWER_CAPACITY, order: 'reading order from the top left; zones beyond capacity are dark' },
      pollution: 'Workshops and power plants add smoke to every tile within two steps (Manhattan distance, inclusive), so a clear home is three steps away. Parks remove two units within two steps and add land value; water and trees add value to neighbors. Only a park within two steps counts for the park lesson.',
      demand: {
        basis: 'Every term counts people and jobs that exist, never tiles that are only zoned, so extra empty zoning waits instead of freezing the town.',
        homes: '30 + (jobs - people) / 2, clamped to -100..100',
        shops: '20 + 2 x (round(0.3 x people) - shop jobs), clamped',
        workshops: '20 + 1.5 x (round(0.7 x people) - workshop jobs), clamped',
      },
      money: { income: '(people + jobs / 2) x taxRate / 10 per month', upkeep: UPKEEP, taxRange: [0, 20], defaultTax: 7 },
      happiness: 'Starts at 50. Plus up to 25 for full employment, up to 15 for parks per 40 residents, up to 10 for land value, and 1 per tax point under 7 up to 3; minus 3 per tax point over 7 and up to 30 for smoke over homes.',
      bulldoze: 'Always allowed, whatever the funds, so a broke town can shed upkeep. The page keeps one step of undo for builds.',
      determinism: 'The map comes from a 32-bit seed. Nothing after that is random: the same moves on the same seed give the same town.',
    },
    lessons: LESSONS.map((l, i) => ({ number: i + 1, id: l.id, title: l.title, text: l.text })),
    titles: CITY_TITLES,
    sample: { seed: sample.seed, cityCode: encodeCity(sample), legend: { '.': 'grass', '~': 'water', t: 'trees', '#': 'road', R: 'homes', C: 'shops', I: 'workshops', P: 'park', '*': 'power plant' }, map: cityToText(sample).split('\n') },
    source: 'https://github.com/mhoydich/pointcast/blob/main/src/lib/gridtown.mjs',
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
  });
};
