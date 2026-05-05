/**
 * SPECIAL BREWS — the daily-rotation catalog.
 *
 * 35 brews. One per UTC day, deterministic, same for everyone in the
 * world that day. Rotation: (year × 7 + dayOfYear × 13) mod BREWS.length.
 * Cycle recurs every ~5 weeks but the offset varies per year so it
 * doesn't repeat in a predictable phase.
 *
 * Each brew has a color (for the cup), a steep time, a one-line
 * tasting note, and a one-line method. Mix of teas, coffees, herbals
 * across many origins — Western and Eastern, ancient and modern.
 *
 * Adding a new brew: append to the array. Don't reorder — the daily
 * rotation index is positional, so re-ordering rotates everyone's day.
 */

export type BrewType = 'tea' | 'coffee' | 'herbal';

export interface SpecialBrew {
  id: string;
  name: string;
  type: BrewType;
  origin: string;
  color: string;        // OKLCH or hex — the cup tint
  steepMin: number;     // approximate brew/steep time in minutes
  notes: string;        // tasting notes, one line
  method: string;       // how to brew, one line
}

export const BREWS: SpecialBrew[] = [
  { id: 'iron-goddess',     name: 'Iron Goddess',         type: 'tea',     origin: 'Anxi, Fujian',         color: '#c89358', steepMin: 4,  notes: 'Floral, creamy, with a long mineral finish.',                method: 'Gongfu — 95°C, short repeated steeps.' },
  { id: 'dragonwell',       name: 'Dragonwell',           type: 'tea',     origin: 'Hangzhou, Zhejiang',   color: '#9bb24a', steepMin: 3,  notes: 'Toasted chestnut, fresh-cut grass, gentle umami.',           method: '80°C, glass tumbler, leaves loose.' },
  { id: 'silver-needle',    name: 'Silver Needle',        type: 'tea',     origin: 'Fuding, Fujian',       color: '#dfd6b1', steepMin: 5,  notes: 'Honeysuckle, melon, white-pepper sweetness.',                 method: '75°C, long steeps, never agitate.' },
  { id: 'gyokuro',          name: 'Gyokuro',              type: 'tea',     origin: 'Uji, Kyoto',           color: '#5a7e2a', steepMin: 2,  notes: 'Deep umami, ocean, butter-vegetable richness.',                method: '60°C, kyusu, short first steep.' },
  { id: 'bi-luo-chun',      name: 'Bi Luo Chun',          type: 'tea',     origin: 'Dongting, Jiangsu',    color: '#a8c374', steepMin: 3,  notes: 'Spring snail-shaped curls. Apricot and orchid.',              method: '75°C — water poured over the leaves, not the other way.' },
  { id: 'da-hong-pao',      name: 'Da Hong Pao',          type: 'tea',     origin: 'Wuyi Mountains',       color: '#824019', steepMin: 4,  notes: 'Roasted, mineral, dark cherry, smoke wisp.',                  method: 'Gongfu — 100°C, ten steeps if you mean it.' },
  { id: 'pu-erh',           name: 'Aged Pu-erh',          type: 'tea',     origin: 'Yunnan',                color: '#5a3416', steepMin: 5,  notes: 'Earth, wet stone, library, sweet aftertaste.',                method: 'Rinse first. Then 100°C, deep steeps.' },
  { id: 'lapsang-souchong', name: 'Lapsang Souchong',     type: 'tea',     origin: 'Tongmu, Wuyi',         color: '#3a2010', steepMin: 4,  notes: 'Pine-smoked. Whisky and bonfire.',                            method: '100°C, 3-4 minutes, no milk.' },
  { id: 'genmaicha',        name: 'Genmaicha',            type: 'tea',     origin: 'Japan',                 color: '#c2a25b', steepMin: 2,  notes: 'Toasted rice + bancha. The everyday cup.',                    method: '85°C, 2 minutes, generous leaf.' },
  { id: 'hojicha',          name: 'Hojicha',              type: 'tea',     origin: 'Kyoto',                 color: '#8a4824', steepMin: 2,  notes: 'Roasted leaf. Caramel and woodsmoke. Low caffeine.',          method: '95°C, 1-2 minutes, evening tea.' },
  { id: 'matcha',           name: 'Matcha',               type: 'tea',     origin: 'Uji, Kyoto',           color: '#7ba94e', steepMin: 1,  notes: 'Whisked. Vegetal, sea-foam, vibrating green.',                method: 'Sift, 70°C water, M-shape whisk for 30 seconds.' },
  { id: 'jasmine-pearls',   name: 'Jasmine Pearls',       type: 'tea',     origin: 'Fuzhou, Fujian',       color: '#c8d088', steepMin: 3,  notes: 'Hand-rolled green scented with night-blooming jasmine.',      method: '85°C, watch the pearls unfurl, 3 minutes.' },
  { id: 'rose-pouchong',    name: 'Rose Pouchong',        type: 'tea',     origin: 'Pinglin, Taiwan',      color: '#b86670', steepMin: 4,  notes: 'Light oolong with petal. Fruit and perfume.',                 method: '90°C, 4 minutes, glass cup.' },
  { id: 'chai-masala',      name: 'Masala Chai',          type: 'herbal',  origin: 'Subcontinent',          color: '#a06a3e', steepMin: 8,  notes: 'Ginger, cardamom, clove, milk, sugar. Loud and warm.',        method: 'Boil water + spices, add tea, add milk, simmer 5 min.' },
  { id: 'chamomile',        name: 'Chamomile',            type: 'herbal',  origin: 'Egypt',                 color: '#dec976', steepMin: 6,  notes: 'Apple-blossom, hay, evening medicine.',                       method: '95°C, covered cup, 5-7 minutes.' },
  { id: 'mint',             name: 'Moroccan Mint',        type: 'tea',     origin: 'Marrakech',             color: '#6cb88a', steepMin: 4,  notes: 'Gunpowder green + spearmint. Sweet, poured tall.',            method: '100°C in a teapot, fresh mint, sugar to taste.' },
  { id: 'rooibos',          name: 'Rooibos',              type: 'herbal',  origin: 'Cederberg, ZA',         color: '#b04a25', steepMin: 7,  notes: 'Red bush. Vanilla, honey, no caffeine.',                      method: '100°C, 5-10 minutes, no over-steep risk.' },
  { id: 'honeybush',        name: 'Honeybush',            type: 'herbal',  origin: 'Eastern Cape, ZA',     color: '#c08230', steepMin: 6,  notes: 'Like rooibos but rounder. Honey on the nose.',                method: '100°C, 5+ minutes.' },
  { id: 'hibiscus',         name: 'Hibiscus',             type: 'herbal',  origin: 'Egypt / Mexico',        color: '#9b1f3a', steepMin: 6,  notes: 'Sour, magenta, vitamin-C bright.',                            method: '95°C, 5-8 minutes, hot or iced.' },
  { id: 'yerba-mate',       name: 'Yerba Mate',           type: 'tea',     origin: 'Argentina / Paraguay',  color: '#7a8c3a', steepMin: 3,  notes: 'Earthy, vegetal, herb-forest. Shared via gourd + bombilla.',  method: '70°C, gourd packed at angle, refill many times.' },
  { id: 'tulsi',            name: 'Tulsi',                type: 'herbal',  origin: 'India',                 color: '#7c9e4a', steepMin: 5,  notes: 'Holy basil. Clove and pepper, calming and bright at once.',   method: '95°C, 5 minutes, plain or with honey.' },
  { id: 'espresso',         name: 'Espresso',             type: 'coffee',  origin: 'Italy',                 color: '#321608', steepMin: 1,  notes: 'Crema, hazelnut, three sips of focus.',                       method: '9 bar, 18g in / 36g out, 28 seconds.' },
  { id: 'cortado',          name: 'Cortado',              type: 'coffee',  origin: 'Spain',                 color: '#7e4c2a', steepMin: 1,  notes: 'Espresso cut with equal warm milk. Quiet.',                   method: 'Double espresso, 2 oz steamed milk, no foam.' },
  { id: 'pour-over',        name: 'Pour Over',            type: 'coffee',  origin: 'Hario / Japan',         color: '#5a3219', steepMin: 4,  notes: 'Clarity. The bean speaks first.',                             method: 'V60, 1:16 ratio, 30s bloom, 4 pours.' },
  { id: 'french-press',     name: 'French Press',         type: 'coffee',  origin: 'France',                color: '#4a2a14', steepMin: 4,  notes: 'Body. Sediment. The morning cup that wakes a household.',     method: 'Coarse grind, 1:15, 4 minutes, plunge slowly.' },
  { id: 'cold-brew',        name: 'Cold Brew',            type: 'coffee',  origin: 'Anywhere overnight',    color: '#3a1f0a', steepMin: 720, notes: 'Smooth, low-acid, summer-stretched.',                        method: '1:8 coarse grind in water, 12 hrs in fridge, filter.' },
  { id: 'turkish-coffee',   name: 'Turkish Coffee',       type: 'coffee',  origin: 'Istanbul / Beirut',     color: '#2a1208', steepMin: 3,  notes: 'Powder-fine, unfiltered. The grounds settle. Read them.',     method: 'Cezve, 1 tsp coffee + 1 sugar + water, foam, pour.' },
  { id: 'cappuccino',       name: 'Cappuccino',           type: 'coffee',  origin: 'Italy',                 color: '#a37246', steepMin: 1,  notes: 'Equal espresso, milk, foam. A morning weight.',               method: 'Double espresso, 4 oz steamed milk with microfoam.' },
  { id: 'cuban-coffee',     name: 'Cafecito',             type: 'coffee',  origin: 'Havana / Miami',        color: '#3e2010', steepMin: 2,  notes: 'Espresso whipped with sugar — espumita on top.',              method: 'Moka pot, whip first drips with sugar, top with the rest.' },
  { id: 'vietnamese-iced',  name: 'Cà phê sữa đá',        type: 'coffee',  origin: 'Saigon',                color: '#5a3416', steepMin: 5,  notes: 'Phin filter + condensed milk over ice. Long sipping.',        method: 'Phin filter, 4 min drip onto sweetened milk, pour over ice.' },
  { id: 'yorkshire',        name: 'Yorkshire Builders',   type: 'tea',     origin: 'Harrogate, UK',         color: '#a06a3e', steepMin: 4,  notes: 'Strong, malty, takes milk and sugar without complaint.',      method: 'One bag, mug, boiling water, 4 minutes, splash of milk.' },
  { id: 'earl-grey',        name: 'Earl Grey',            type: 'tea',     origin: 'England (blend)',       color: '#7e3e1c', steepMin: 4,  notes: 'Black tea kissed with bergamot. Afternoon library.',          method: '95°C, 3-4 minutes, lemon optional.' },
  { id: 'english-breakfast', name: 'English Breakfast',   type: 'tea',     origin: 'England (blend)',       color: '#5e2e10', steepMin: 4,  notes: 'Assam-led blend. Strong, bracing, breakfast-honest.',         method: '100°C, 3-5 minutes, milk last.' },
  { id: 'sencha',           name: 'Sencha',               type: 'tea',     origin: 'Shizuoka, Japan',       color: '#7da34a', steepMin: 1,  notes: 'Japan\'s everyday green. Vegetal, marine, clean.',           method: '70°C, 60 seconds, kyusu.' },
  { id: 'tieguanyin-iced',  name: 'Iron Goddess on Ice',  type: 'tea',     origin: 'Anxi, by way of summer', color: '#cb9b58', steepMin: 4,  notes: 'Same Iron Goddess, brewed strong then iced. Floral, cold, long.', method: 'Hot brew at 2× strength, pour over ice immediately.' },
];

/**
 * Today's brew — same for every visitor on a given UTC day.
 *
 * Algorithm matches /drum-shrine: deterministic from year + day-of-year,
 * with a non-trivial multiplier so the rotation doesn't predictably repeat.
 */
export function getBrewForDate(d: Date = new Date()): SpecialBrew {
  const y = d.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  const dayOfYear = Math.floor((d.getTime() - start) / 86_400_000) + 1;
  const idx = (y * 7 + dayOfYear * 13) % BREWS.length;
  return BREWS[idx]!;
}

export function getBrewForDayOffset(offsetDays: number): SpecialBrew {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return getBrewForDate(d);
}
