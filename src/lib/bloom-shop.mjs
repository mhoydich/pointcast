// BLOOM SHOP — 20-work flower exhibition for the El Segundo gallery.
// Each work ships with an original vector study (rendered by artSvg) plus the
// image-generation prompt for a full-resolution print master.
// Checkout is intentionally inactive until Mike approves prices, editions,
// fulfillment and terms.

export const BLOOM_META = {
  title: 'BLOOM SHOP',
  subtitle: 'Flowers Machined in El Segundo',
  route: '/bloom-shop',
  label: 'AI-generated digital art',
  edition: 'vector-studies',
  printMastersAvailable: false,
  credit: 'Concept, curation and vector studies made with Claude for PointCast, El Segundo.',
  story:
    'El Segundo grew flowers before it built airplanes. BLOOM SHOP imagines a garage between the refinery and the runway where the mechanics started machining flowers instead of fenders. Each family is a different workbench, run by a different design tradition. The botany is invented; the light is the real 4 p.m. marine layer burning off over Dockweiler.',
  checkoutActive: false,
};

const O = '#E8552B'; // Signal Orange: in every work
const HAZE = '#EDE8DD';
const NAVY = '#1F2A3A';

export const BLOOM_FAMILIES = [
  { id: 'grid-garden', name: 'Grid Garden', tradition: 'Swiss graphic precision', intro: 'Blooms plotted on an invisible grid, rules running edge to edge.', chip: '#2A4BD7' },
  { id: 'still-water', name: 'Still Water', tradition: 'Swedish restraint', intro: 'One stem, a lot of fog, nothing extra.', chip: '#A9B8C2' },
  { id: 'calor', name: 'Calor', tradition: 'Mexican modernist color and rhythmic line', intro: 'Hot planes of color and lines that pulse like sound.', chip: '#D6336C' },
  { id: 'manifesto', name: 'Manifesto', tradition: 'Italian poster design', intro: 'Speed, scale and theater: flowers as headline acts.', chip: '#D7261E' },
  { id: 'grand-ave-garage', name: 'Grand Ave Garage', tradition: 'Midcentury El Segundo auto-shop and aerospace', intro: 'Enamel, pinstripes, rivets and wing ribs.', chip: '#2E8C8A' },
];

const neg = 'no text, no numbers, no logos, 4:5';

export const BLOOM_WORKS = [
  // I — Grid Garden
  { n: 1, slug: 'stamen-coordinates', family: 'grid-garden', title: 'Stamen Coordinates',
    description: 'A single poppy reduced to concentric circles, its stamens plotted as dots on an invisible 12-column grid.',
    palette: [HAZE, '#141414', O, '#2A4BD7'], composition: 'Bloom offset to the upper-left third; thin black rules run edge to edge.',
    prompt: `Swiss International Style graphic print of an abstract poppy built from concentric flat circles, stamens as precise dots on an invisible modular grid, thin black rules crossing the page, warm off-white background, signal orange and cobalt accents, asymmetric composition, flat screenprint texture, generous margins, ${neg}` },
  { n: 2, slug: 'tulip-section-drawing', family: 'grid-garden', title: 'Tulip Section Drawing',
    description: 'A tulip cut in cross-section like an engineering diagram, petals as nested arcs.',
    palette: ['#2A4BD7', '#141414', HAZE, O], composition: 'Centered vertical axis, symmetrical, open space below.',
    prompt: `minimalist Swiss modernist print of a tulip shown as a technical cross-section, nested flat arcs, cobalt and black on warm off-white, small signal orange core, strict vertical axis, precise geometry, flat ink, no labels, ${neg}` },
  { n: 3, slug: 'kinetic-iris', family: 'grid-garden', title: 'Kinetic Iris',
    description: 'Iris petals rotated in even steps, suggesting motion like a rotating instrument dial.',
    palette: ['#141414', O, '#C9C6BE', HAZE], composition: 'Diagonal sweep from bottom-left to top-right.',
    prompt: `abstract iris made of flat petal shapes repeated and rotated in even angular steps, suggesting motion, Swiss graphic precision, black orange and pale grey on warm off-white, diagonal composition, crisp edges, screenprint grain, ${neg}` },
  { n: 4, slug: 'seed-matrix', family: 'grid-garden', title: 'Seed Matrix',
    description: 'A sunflower head as a golden-angle spiral of small squares. Exactly one is orange.',
    palette: ['#141414', HAZE, O], composition: 'Spiral cropped by the right edge.',
    prompt: `sunflower seed head rendered as a precise golden-angle spiral of small black squares on warm off-white paper, one single signal orange square, spiral cropped by the right edge, Swiss modernist restraint, flat print, ${neg}` },
  // II — Still Water
  { n: 5, slug: 'one-stem-morning', family: 'still-water', title: 'One Stem, Morning',
    description: 'A single tall stem with one closed bud against an empty pale field.',
    palette: ['#F3F0E8', '#2F4A3F', '#A9B8C2', O], composition: 'Stem far right; most of the sheet left empty.',
    prompt: `Scandinavian minimalist print, a single tall thin green stem with one closed bud tipped in soft orange, vast empty pale birch-white field, fog-blue horizon band, quiet and calm, flat matte color, extreme negative space, ${neg}` },
  { n: 6, slug: 'lingonberry-lantern', family: 'still-water', title: 'Lingonberry Lantern',
    description: 'Bell-shaped blossoms hang like small lamps from an arched branch.',
    palette: ['#B23A3A', '#2F4A3F', '#F3F0E8', O], composition: 'Branch arcs across the top; blossoms drop into the middle.',
    prompt: `restrained Swedish graphic design, arched branch with hanging bell-shaped red blossoms like small lanterns, soft orange inner glow, pine green and birch white, simple flat shapes, calm balanced composition, linen paper texture, ${neg}` },
  { n: 7, slug: 'fog-meadow', family: 'still-water', title: 'Fog Meadow',
    description: 'A low horizon of tiny flower dots disappearing into marine fog.',
    palette: ['#A9B8C2', '#F3F0E8', '#2F4A3F', O], composition: 'Horizontal bands; flowers only in the lowest fifth.',
    prompt: `quiet Nordic minimal landscape, a low meadow of tiny flat flower dots fading into pale blue coastal fog, layered horizontal bands, pine green and a few orange dots, mostly empty soft sky, serene, flat print, ${neg}` },
  { n: 8, slug: 'folded-anemone', family: 'still-water', title: 'Folded Anemone',
    description: 'An anemone built like folded paper, each petal one crease.',
    palette: ['#F3F0E8', '#A9B8C2', '#141414', O], composition: 'Centered and small in a large pale field.',
    prompt: `anemone flower constructed as folded white paper planes, subtle fog-blue shadows, black center, one thin signal orange edge, Scandinavian restraint, small centered on a large pale field, crisp and gentle, ${neg}` },
  // III — Calor
  { n: 9, slug: 'marigold-pulse', family: 'calor', title: 'Marigold Pulse',
    description: 'A marigold radiating rings of wavy concentric lines, like sound.',
    palette: ['#F2A900', O, '#C8643B', NAVY], composition: 'Bloom low-center; rings fill the sheet.',
    prompt: `Mexican modernist inspired graphic print, a marigold flower emitting rhythmic concentric wavy lines filling the page, saturated marigold yellow, adobe and signal orange, deep navy linework, bold flat color, vibrant optical rhythm, ${neg}` },
  { n: 10, slug: 'agave-bloom-stair', family: 'calor', title: 'Agave Bloom Stair',
    description: 'An agave flower spike rising through stepped geometric terraces.',
    palette: ['#3E8E7E', '#D6336C', '#F2A900', '#F4EBDD'], composition: 'Strong vertical with stepped planes left and right.',
    prompt: `tall agave flower spike rising through stepped geometric color terraces, modernist Mexican architecture palette, agave green, bougainvillea pink, marigold yellow on warm plaster white, hard-edged flat planes, strong vertical, sunlit shadows, ${neg}` },
  { n: 11, slug: 'bougainvillea-wall', family: 'calor', title: 'Bougainvillea Wall',
    description: 'Bracts tumble down a sunlit wall cut by a deep diagonal shadow.',
    palette: ['#D6336C', '#C8643B', NAVY, O], composition: 'A diagonal shadow splits the frame.',
    prompt: `bougainvillea bracts cascading down a flat sunlit plaster wall, a crisp deep diagonal shadow cutting the composition, hot pink, adobe orange, navy, color-field modernism, flat graphic shapes, rhythmic repetition, ${neg}` },
  { n: 12, slug: 'woven-dahlia', family: 'calor', title: 'Woven Dahlia',
    description: 'A dahlia whose petals interlace like bands of woven textile.',
    palette: ['#D6336C', '#F2A900', '#3E8E7E', '#C8643B', NAVY], composition: 'Full, centered bloom on navy.',
    prompt: `dahlia built from interlaced flat color bands like woven textile, rhythmic petal pattern, magenta marigold agave adobe and signal orange on deep navy ground, bold symmetrical centered bloom, modernist graphic, ${neg}` },
  // IV — Manifesto
  { n: 13, slug: 'the-rose-accelerates', family: 'manifesto', title: 'The Rose Accelerates',
    description: 'A rose with speed lines streaming behind it, as if it were traveling.',
    palette: ['#D7261E', '#141414', '#F1E6CF', O], composition: 'Rose lower-right, streaks from the upper-left.',
    prompt: `bold Italian midcentury poster style illustration, a stylized red rose rushing forward with dynamic speed lines streaming behind it, vermilion black cream and orange, dramatic perspective, flat lithograph color, energetic diagonal, no lettering, ${neg}` },
  { n: 14, slug: 'giant-lily-small-town', family: 'manifesto', title: 'Giant Lily, Small Town',
    description: 'A towering lily over a tiny row of flat-roofed buildings.',
    palette: ['#F1E6CF', '#141414', '#C9962B', O], composition: 'Low horizon, monumental bloom.',
    prompt: `Italian poster design composition, a monumental white lily towering over a tiny row of flat-roofed coastal buildings, low horizon, ochre sky, black silhouettes, orange stamens, theatrical scale, flat lithographic color, ${neg}` },
  { n: 15, slug: 'petal-propeller', family: 'manifesto', title: 'Petal Propeller',
    description: 'Four petals form a spinning propeller with motion arcs.',
    palette: ['#D7261E', '#141414', '#F1E6CF', O], composition: 'Tight radial crop.',
    prompt: `four bold red petals forming a spinning propeller, curved motion arcs, futurist Italian poster energy, vermilion black and cream with a signal orange hub, tight radial composition, flat print, ${neg}` },
  { n: 16, slug: 'night-jasmine', family: 'manifesto', title: 'Night Jasmine',
    description: 'White jasmine stars bursting against black, like a festival poster.',
    palette: ['#141414', '#F1E6CF', '#C9962B', O], composition: 'Scattered burst, heavier at the top.',
    prompt: `night-blooming jasmine as white star shapes bursting across a black field, Italian festival poster drama, cream ochre and orange accents, flat bold shapes, celebratory scattered composition, ${neg}` },
  // V — Grand Ave Garage
  { n: 17, slug: 'torque-daisy', family: 'grand-ave-garage', title: 'Torque Daisy',
    description: 'A daisy whose petals are wrench-like forms around a hexagonal bolt-head center.',
    palette: ['#2E8C8A', '#D9DCDD', O, NAVY], composition: 'Centered inside an enamel sign ring with no lettering.',
    prompt: `midcentury American auto-shop sign style graphic, a daisy whose petals are abstract wrench-like forms around a hexagonal bolt center, enamel teal, chrome silver, signal orange, circular sign ring with no lettering, glossy enamel flat color, no brands, ${neg}` },
  { n: 18, slug: 'pinstripe-protea', family: 'grand-ave-garage', title: 'Pinstripe Protea',
    description: 'An invented protea drawn in flowing, mirrored hot-rod pinstripe lines.',
    palette: [NAVY, '#F1E6CF', O, '#F4C430'], composition: 'Symmetrical, mirrored flourishes.',
    prompt: `invented protea flower drawn entirely in flowing symmetrical hot-rod pinstripe lines, cream orange and safety yellow on deep navy enamel, mirrored flourishes, 1950s garage craftsmanship, crisp lines, ${neg}` },
  { n: 19, slug: 'wing-rib-orchid', family: 'grand-ave-garage', title: 'Wing Rib Orchid',
    description: 'An orchid assembled from aircraft wing ribs and rivet lines.',
    palette: ['#D9DCDD', '#8E8F8A', '#2E8C8A', O], composition: 'Exploded-view layout on a slight diagonal.',
    prompt: `orchid assembled from aircraft wing ribs, riveted aluminum panels and spars, exploded technical layout, chrome primer grey and teal with signal orange accents, aerospace geometry, coastal haze background, flat graphic, ${neg}` },
  { n: 20, slug: 'service-bay-sunset', family: 'grand-ave-garage', title: 'Service Bay Sunset',
    description: 'A huge hibiscus rises like the sun behind a stepped garage roofline.',
    palette: [O, '#F4C430', '#2E8C8A', NAVY], composition: 'Horizon at the lower third; bloom as setting sun.',
    prompt: `giant hibiscus rising like a setting sun behind a stepped midcentury garage roofline, coastal golden hour, signal orange safety yellow and teal sky, navy silhouette, flat sign-painting style, warm haze, no signage lettering, ${neg}` },
];

// Draft scenarios only. Production costs are estimates pending vendor quotes.
export const BLOOM_PRICING = {
  status: 'draft — not for sale',
  assumptions: [
    'Archival pigment print on 310 gsm cotton rag from a print-on-demand lab or South Bay printer.',
    'Rolled in a tube, shipped within the US. Local gallery pickup removes shipping.',
    'About 3% card processing. Framing quoted separately.',
    'Upscaled print masters at 6000 px or more on the long edge.',
  ],
  sizes: [
    { size: '8×10 in', cost: 12, ship: 8, open: 45, ed50: 85, ed10: null },
    { size: '16×20 in', cost: 32, ship: 14, open: 110, ed50: 195, ed10: null },
    { size: '24×30 in', cost: 65, ship: 22, open: 220, ed50: 380, ed10: 950 },
    { size: '32×40 in', cost: 110, ship: 35, open: null, ed50: 650, ed10: 1600 },
  ],
  pendingApproval: ['Prices', 'Edition sizes', 'Fulfillment vendor', 'Terms: returns, shipping, AI-art disclosure'],
};

export const familyOf = (w) => BLOOM_FAMILIES.find((f) => f.id === w.family);

// ---------- vector studies ----------
const W = 400, H = 500;
const r2 = (x) => Math.round(x * 10) / 10;
const polar = (cx, cy, r, a) => [r2(cx + r * Math.cos(a)), r2(cy + r * Math.sin(a))];
const petal = (cx, cy, len, wid, a, fill, extra = '') => {
  const [tx, ty] = polar(cx, cy, len, a);
  const [l1x, l1y] = polar(cx, cy, len * 0.5, a - wid);
  const [l2x, l2y] = polar(cx, cy, len * 0.5, a + wid);
  return `<path d="M${cx} ${cy} Q${l1x} ${l1y} ${tx} ${ty} Q${l2x} ${l2y} ${cx} ${cy}Z" fill="${fill}" ${extra}/>`;
};
const range = (n) => Array.from({ length: n }, (_, i) => i);

const ART = {
  'stamen-coordinates': () => {
    const rules = [60, 140, 330, 430].map((y) => `<rect x="0" y="${y}" width="${W}" height="1.5" fill="#141414"/>`).join('');
    const circles = [110, 82, 54].map((r, i) => `<circle cx="150" cy="190" r="${r}" fill="${['#141414', O, HAZE][i]}"/>`).join('');
    const dots = range(36).map((i) => { const [x, y] = polar(150, 190, 18 + (i % 3) * 10, i * 0.523); return `<circle cx="${x}" cy="${y}" r="3" fill="#2A4BD7"/>`; }).join('');
    return `<rect width="${W}" height="${H}" fill="${HAZE}"/>${rules}<rect x="268" y="60" width="1.5" height="370" fill="#141414"/>${circles}${dots}<rect x="290" y="360" width="60" height="44" fill="#2A4BD7"/>`;
  },
  'tulip-section-drawing': () => {
    const arcs = range(5).map((i) => `<path d="M${200 - 110 + i * 18} 120 Q200 ${380 - i * 30} ${200 + 110 - i * 18} 120" fill="none" stroke="${i % 2 ? '#141414' : '#2A4BD7'}" stroke-width="${10 - i}"/>`).join('');
    return `<rect width="${W}" height="${H}" fill="${HAZE}"/><rect x="199" y="60" width="2" height="400" fill="#141414"/>${arcs}<circle cx="200" cy="230" r="14" fill="${O}"/><rect x="194" y="300" width="12" height="150" fill="#2A4BD7"/>`;
  },
  'kinetic-iris': () => {
    const ps = range(7).map((i) => petal(90 + i * 30, 420 - i * 40, 210, 0.55, -1.25 + i * 0.3, i === 6 ? O : i % 2 ? '#C9C6BE' : '#141414', `opacity="${0.55 + i * 0.065}"`)).join('');
    return `<rect width="${W}" height="${H}" fill="${HAZE}"/>${ps}`;
  },
  'seed-matrix': () => {
    const sq = range(420).map((i) => { const r = 9 * Math.sqrt(i); const [x, y] = polar(330, 250, r, i * 2.39996); const s = 4 + i / 110; return `<rect x="${r2(x - s / 2)}" y="${r2(y - s / 2)}" width="${r2(s)}" height="${r2(s)}" fill="${i === 137 ? O : '#141414'}"/>`; }).join('');
    return `<rect width="${W}" height="${H}" fill="${HAZE}"/>${sq}`;
  },
  'one-stem-morning': () =>
    `<rect width="${W}" height="${H}" fill="#F3F0E8"/><rect y="330" width="${W}" height="40" fill="#A9B8C2" opacity=".55"/><path d="M318 470 C314 360 326 240 316 150" stroke="#2F4A3F" stroke-width="3" fill="none"/><ellipse cx="316" cy="136" rx="9" ry="20" fill="#2F4A3F"/><ellipse cx="316" cy="124" rx="6" ry="9" fill="${O}"/>`,
  'lingonberry-lantern': () => {
    const bells = range(6).map((i) => { const x = 70 + i * 52, y = 120 + Math.sin((i / 5) * Math.PI) * -40 + 40; return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 50 + (i % 2) * 30}" stroke="#2F4A3F" stroke-width="2"/><path d="M${x - 18} ${y + 92 + (i % 2) * 30} Q${x} ${y + 40 + (i % 2) * 30} ${x + 18} ${y + 92 + (i % 2) * 30}Z" fill="#B23A3A"/><circle cx="${x}" cy="${y + 88 + (i % 2) * 30}" r="5" fill="${O}"/>`; }).join('');
    return `<rect width="${W}" height="${H}" fill="#F3F0E8"/><path d="M30 190 Q200 40 370 190" stroke="#2F4A3F" stroke-width="5" fill="none"/>${bells}`;
  },
  'fog-meadow': () => {
    const bands = range(5).map((i) => `<rect y="${i * 80}" width="${W}" height="80" fill="#A9B8C2" opacity="${0.15 + i * 0.12}"/>`).join('');
    const dots = range(140).map((i) => { const x = (i * 97) % W, y = 410 + ((i * 53) % 85); return `<circle cx="${x}" cy="${y}" r="${1.5 + (y - 410) / 30}" fill="${i % 23 === 0 ? O : '#2F4A3F'}"/>`; }).join('');
    return `<rect width="${W}" height="${H}" fill="#F3F0E8"/>${bands}<rect y="400" width="${W}" height="100" fill="#F3F0E8" opacity=".6"/>${dots}`;
  },
  'folded-anemone': () => {
    const fs = range(6).map((i) => { const a = (i / 6) * Math.PI * 2; const [x1, y1] = polar(200, 250, 60, a - 0.45); const [x2, y2] = polar(200, 250, 70, a + 0.1); return `<path d="M200 250 L${x1} ${y1} L${x2} ${y2}Z" fill="${i % 2 ? '#A9B8C2' : '#FFFFFF'}" stroke="#A9B8C2" stroke-width=".8"/>`; }).join('');
    return `<rect width="${W}" height="${H}" fill="#F3F0E8"/>${fs}<line x1="200" y1="250" x2="${polar(200, 250, 70, 0.1)[0]}" y2="${polar(200, 250, 70, 0.1)[1]}" stroke="${O}" stroke-width="2"/><circle cx="200" cy="250" r="12" fill="#141414"/>`;
  },
  'marigold-pulse': () => {
    const rings = range(14).map((i) => { const r = 70 + i * 26; const pts = range(73).map((k) => { const a = (k / 72) * Math.PI * 2; const rr = r + Math.sin(a * 12) * 6; return polar(200, 360, rr, a).join(' '); }).join(' L'); return `<path d="M${pts}Z" fill="none" stroke="${i % 3 === 1 ? O : NAVY}" stroke-width="3"/>`; }).join('');
    const ps = range(16).map((i) => petal(200, 360, 62, 0.3, (i / 16) * Math.PI * 2, i % 2 ? '#F2A900' : '#C8643B')).join('');
    return `<rect width="${W}" height="${H}" fill="#F2A900"/>${rings}${ps}<circle cx="200" cy="360" r="16" fill="${O}"/>`;
  },
  'agave-bloom-stair': () => {
    const steps = range(6).map((i) => `<rect x="${i * 26}" y="${500 - (i + 1) * 60}" width="${120 - i * 18}" height="${(i + 1) * 60}" fill="${i % 2 ? '#3E8E7E' : '#D6336C'}"/><rect x="${280 + i * 18}" y="${500 - (6 - i) * 60}" width="${120 - i * 18}" height="${(6 - i) * 60}" fill="${i % 2 ? '#F2A900' : '#3E8E7E'}"/>`).join('');
    const buds = range(7).map((i) => `<circle cx="${200 + (i % 2 ? 16 : -16)}" cy="${90 + i * 26}" r="10" fill="${i === 0 ? O : '#F2A900'}"/>`).join('');
    return `<rect width="${W}" height="${H}" fill="#F4EBDD"/>${steps}<rect x="196" y="80" width="8" height="420" fill="#3E8E7E"/>${buds}`;
  },
  'bougainvillea-wall': () => {
    const br = range(40).map((i) => { const x = 40 + ((i * 71) % 320), y = 40 + i * 10 + ((i * 37) % 40); return range(3).map((k) => petal(x, y, 22, 0.6, (k / 3) * Math.PI * 2 + i, i % 7 ? '#D6336C' : O)).join(''); }).join('');
    return `<rect width="${W}" height="${H}" fill="#C8643B"/><path d="M0 500 L400 140 L400 500Z" fill="${NAVY}" opacity=".85"/>${br}`;
  },
  'woven-dahlia': () => {
    const cols = ['#D6336C', '#F2A900', '#3E8E7E', '#C8643B', O];
    const layers = [[140, 16], [105, 14], [70, 12], [38, 10]].map(([len, n], L) => range(n).map((i) => petal(200, 250, len, 0.22, (i / n) * Math.PI * 2 + L * 0.2, cols[(i + L) % 5], `stroke="${NAVY}" stroke-width="2"`)).join('')).join('');
    return `<rect width="${W}" height="${H}" fill="${NAVY}"/>${layers}<circle cx="200" cy="250" r="10" fill="${O}"/>`;
  },
  'the-rose-accelerates': () => {
    const streaks = range(9).map((i) => `<line x1="${-20 + i * 14}" y1="${40 + i * 30}" x2="${250 + i * 6}" y2="${300 + i * 14}" stroke="${i % 3 ? '#141414' : O}" stroke-width="${3 + (i % 3) * 3}"/>`).join('');
    const rose = range(5).map((i) => `<circle cx="${290 - i * 3}" cy="${380 - i * 3}" r="${80 - i * 16}" fill="${i % 2 ? '#F1E6CF' : '#D7261E'}"/>`).join('');
    return `<rect width="${W}" height="${H}" fill="#F1E6CF"/>${streaks}${rose}`;
  },
  'giant-lily-small-town': () => {
    const town = range(8).map((i) => `<rect x="${i * 50 + 5}" y="${440 - (i % 3) * 10}" width="40" height="${60 + (i % 3) * 10}" fill="#141414"/>`).join('');
    const ps = range(6).map((i) => petal(200, 230, 170, 0.28, -Math.PI / 2 + (i - 2.5) * 0.42, '#F1E6CF', 'stroke="#141414" stroke-width="2"')).join('');
    const st = range(5).map((i) => { const [x, y] = polar(200, 230, 70, -Math.PI / 2 + (i - 2) * 0.3); return `<line x1="200" y1="230" x2="${x}" y2="${y}" stroke="#141414" stroke-width="2"/><circle cx="${x}" cy="${y}" r="5" fill="${O}"/>`; }).join('');
    return `<rect width="${W}" height="${H}" fill="#C9962B"/><rect x="196" y="230" width="8" height="220" fill="#141414"/>${ps}${st}${town}`;
  },
  'petal-propeller': () => {
    const arcs = range(4).map((i) => `<path d="M${polar(200, 250, 175, i * 1.5708 + 0.3).join(' ')} A175 175 0 0 1 ${polar(200, 250, 175, i * 1.5708 + 1.1).join(' ')}" stroke="#141414" stroke-width="4" fill="none"/>`).join('');
    const ps = range(4).map((i) => petal(200, 250, 165, 0.42, i * 1.5708 + 0.6, '#D7261E')).join('');
    return `<rect width="${W}" height="${H}" fill="#F1E6CF"/>${arcs}${ps}<circle cx="200" cy="250" r="22" fill="${O}" stroke="#141414" stroke-width="4"/>`;
  },
  'night-jasmine': () => {
    const stars = range(46).map((i) => { const x = 30 + ((i * 151 + (i % 5) * 29) % 340), y = 30 + Math.pow(((i * 37) % 46) / 46, 1.6) * 440, s = 14 + (i % 4) * 9; return range(5).map((k) => petal(x, y, s, 0.7, (k / 5) * Math.PI * 2 + i, '#F1E6CF')).join('') + `<circle cx="${x}" cy="${y}" r="${s / 5}" fill="${i % 5 ? '#C9962B' : O}"/>`; }).join('');
    return `<rect width="${W}" height="${H}" fill="#141414"/>${stars}`;
  },
  'torque-daisy': () => {
    const ps = range(12).map((i) => { const a = (i / 12) * Math.PI * 2; const [x, y] = polar(200, 250, 92, a); const [ex, ey] = polar(200, 250, 124, a); return `<line x1="200" y1="250" x2="${x}" y2="${y}" stroke="#D9DCDD" stroke-width="18" stroke-linecap="round"/><circle cx="${ex}" cy="${ey}" r="18" fill="#D9DCDD"/><circle cx="${ex}" cy="${ey}" r="8" fill="#2E8C8A"/>`; }).join('');
    const hex = range(6).map((i) => polar(200, 250, 36, (i / 6) * Math.PI * 2).join(',')).join(' ');
    return `<rect width="${W}" height="${H}" fill="${NAVY}"/><circle cx="200" cy="250" r="185" fill="#2E8C8A" stroke="#D9DCDD" stroke-width="10"/>${ps}<polygon points="${hex}" fill="${O}" stroke="${NAVY}" stroke-width="4"/>`;
  },
  'pinstripe-protea': () => {
    const half = range(7).map((i) => `<path d="M200 ${420 - i * 10} C${200 + 30 + i * 18} ${360 - i * 20} ${200 + 80 + i * 10} ${220 - i * 15} 200 ${140 + i * 14}" fill="none" stroke="${['#F1E6CF', O, '#F4C430'][i % 3]}" stroke-width="2.5"/>`).join('');
    return `<rect width="${W}" height="${H}" fill="${NAVY}"/><g>${half}</g><g transform="translate(400 0) scale(-1 1)">${half}</g><path d="M200 420 C150 460 250 470 200 490" stroke="#F1E6CF" stroke-width="2" fill="none"/>`;
  },
  'wing-rib-orchid': () => {
    const ribs = range(5).map((i) => { const a = -2.3 + i * 0.75; const [x, y] = polar(200, 260, 30, a); return `<g transform="translate(${x - 200} ${y - 260}) rotate(${r2((a * 180) / Math.PI + 90)} 200 260)"><path d="M200 260 C160 200 170 120 200 90 C230 120 240 200 200 260Z" fill="${i === 2 ? '#2E8C8A' : '#D9DCDD'}" stroke="#8E8F8A" stroke-width="2"/>${range(5).map((k) => `<line x1="${185 + k * 2}" y1="${120 + k * 26}" x2="${215 - k * 2}" y2="${120 + k * 26}" stroke="#8E8F8A" stroke-width="1.5"/><circle cx="200" cy="${120 + k * 26}" r="2" fill="${O}"/>`).join('')}</g>`; }).join('');
    return `<rect width="${W}" height="${H}" fill="${HAZE}"/><line x1="40" y1="460" x2="360" y2="60" stroke="#8E8F8A" stroke-dasharray="6 6"/>${ribs}<circle cx="200" cy="260" r="20" fill="${O}" stroke="#8E8F8A" stroke-width="3"/>`;
  },
  'service-bay-sunset': () => {
    const ps = range(5).map((i) => petal(200, 330, 170, 0.5, (i / 5) * Math.PI * 2 - Math.PI / 2, O, `stroke="#F4C430" stroke-width="3"`)).join('');
    return `<rect width="${W}" height="${H}" fill="#2E8C8A"/><rect y="200" width="${W}" height="150" fill="#F4C430" opacity=".5"/>${ps}<circle cx="200" cy="330" r="18" fill="#F4C430"/><path d="M0 500 L0 360 L90 360 L90 340 L210 340 L210 370 L300 370 L300 350 L400 350 L400 500Z" fill="${NAVY}"/><rect x="110" y="400" width="80" height="100" fill="#2E8C8A" opacity=".35"/>`;
  },
};

export function artSvg(slug, title = '') {
  const draw = ART[slug];
  if (!draw) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}" preserveAspectRatio="xMidYMid meet">${draw()}</svg>`;
}
