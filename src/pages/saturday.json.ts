import type { APIRoute } from 'astro';

/**
 * /saturday.json — agent-readable sibling of /saturday.
 *
 * Mirrors the data on the page (residents, jars, set, wire) so other
 * agents can fetch the block's structure without parsing HTML. Keeps
 * the page itself authoritative — this is a read-through.
 */

const RESIDENTS = [
  { id: 'claude', noun: 137, role: 'leans on the railing' },
  { id: 'codex',  noun: 444, role: 'on the steps, eyes closed' },
  { id: 'manus',  noun: 819, role: 'pushes the screen door open' },
];

const JARS = [
  {
    strain: 'PERSY OG',
    label: 'Tier 1',
    cross: 'OG Kush × Triangle Kush',
    type: 'Indica-leaning hybrid',
    effects: ['relaxed', 'gassy', 'creative', 'porch-pace'],
    terps: [
      { name: 'myrcene',       pct: 0.92 },
      { name: 'caryophyllene', pct: 0.61 },
      { name: 'limonene',      pct: 0.34 },
    ],
    batch: { jarred: '2026-04-29', no: 'B-2026-049', flower: 'whole nug · hand-trimmed' },
    log: 'Heavy on the lid-pop — pine needle, diesel, a bottom note like fresh cut grass. Settles you into the chair within four breaths and stays in the room a long time.',
  },
  {
    strain: 'GOLDEN HOUR',
    label: 'Tier 1',
    cross: 'Tangie × Sunset Sherbet',
    type: 'Sativa-leaning hybrid',
    effects: ['uplift', 'focus', 'citrus', 'long talk'],
    terps: [
      { name: 'limonene',      pct: 1.04 },
      { name: 'terpinolene',   pct: 0.48 },
      { name: 'pinene',        pct: 0.22 },
    ],
    batch: { jarred: '2026-05-02', no: 'B-2026-052', flower: 'whole nug · hand-trimmed' },
    log: 'Tangerine peel and creamsicle. Easy on the lungs, fast on the conversation — the kind of jar that makes you want to walk somewhere with someone.',
  },
  {
    strain: 'EL SEGUNDO PINK',
    label: '1 of 1',
    cross: 'Pink Rozay × Ice Cream Cake',
    type: 'Balanced hybrid',
    effects: ['social', 'floral', 'dreamy', 'low-key'],
    terps: [
      { name: 'linalool',      pct: 0.71 },
      { name: 'caryophyllene', pct: 0.55 },
      { name: 'humulene',      pct: 0.28 },
    ],
    batch: { jarred: '2026-05-08', no: 'B-2026-058', flower: '1 of 1 · single-pheno run' },
    log: 'Floral and sweet, rosewater on a sugar cube. The high is dreamy not heavy — golden-hour brain. Best shared, worst hoarded.',
  },
];

const SET = [
  { side: 'A1', title: 'warm-up',          notes: 'brushed kit · 78 bpm' },
  { side: 'A2', title: 'el segundo edge',  notes: 'pads + bass' },
  { side: 'B1', title: 'golden hour',      notes: 'longest cut, 11 min' },
  { side: 'B2', title: 'porch lights',     notes: 'ambient, fade out' },
];

const WIRE = [
  { time: '15:00', note: 'golden hour starts to slide; sky goes peach over the SoCal Edison stack.' },
  { time: '16:30', note: 'wind off the ocean cools the porch; jars come back inside.' },
  { time: '18:00', note: 'dinner at home, no agenda, weekend wire stays open.' },
  { time: '21:00', note: 'drum altar opens for whoever\'s still around. low volume.' },
];

export const GET: APIRoute = async () => {
  const now = new Date();
  const ptDay = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/Los_Angeles' }).format(now);
  const isSaturday = ptDay === 'Sat';

  const payload = {
    schema: 'https://pointcast.xyz/schemas/saturday-v0',
    name: 'PointCast / Saturday',
    url: 'https://pointcast.xyz/saturday',
    generatedAt: now.toISOString(),
    intent: 'A weekend-only block from El Segundo. Tribute to 710 Labs — flower, genetics, effects profile.',
    state: {
      isSaturday,
      ptDay,
      open: isSaturday,
    },
    place: {
      city: 'El Segundo',
      region: 'CA',
      country: 'US',
      vibe: 'porch at golden hour',
    },
    tribute: {
      to: '710 Labs',
      url: 'https://710labs.com',
      reason: 'Flower genetics done with intent. Effects profiles you can feel between jars.',
      stance: 'No transactions, no claims. Reverence only.',
    },
    residents: RESIDENTS,
    counter: {
      title: 'The Counter',
      subtitle: 'FLOWER · GENETICS · EFFECTS PROFILE · NOT FOR SALE · A TRIBUTE',
      jars: JARS,
    },
    soundtrack: {
      venue: '/drum-altar',
      mood: 'low volume, long set',
      set: SET,
    },
    wire: WIRE,
    license: 'CC0-1.0',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=120, s-maxage=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
