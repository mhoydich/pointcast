/**
 * daily-picks — canonical sources for the engagement plan's
 * "Walk of the Day" and "Strain of the Day" rotations.
 *
 * Both picks are deterministic per LA-local day (so every visitor and
 * every agent sees the same pick, and refreshing doesn't reroll). The
 * indices are spaced by different primes so the walk pick and the
 * strain pick rotate independently.
 *
 * Components (src/components/WalkOfDay.astro, StrainOfDay.astro) and
 * agent endpoints (src/pages/now.json.ts) all read from here.
 */

export type Walk = {
  name: string;
  dist: string;
  mins: number;
  tags: string[];
  dek: string;
  noun: number;
};

export type Strain = {
  brand: string;
  name: string;
  lane: 'lift' | 'focus' | 'move' | 'create' | 'connect' | 'settle';
  laneTone: string;
  profile: string;
  use: string;
  tags: string[];
  noun: number;
};

export const WALKS: readonly Walk[] = [
  { name: 'Main St → Library Park', dist: '0.9 mi', mins: 18, tags: ['library', 'mural', 'downtown'], dek: 'Past the bakery, cut through the patio gate at Library Park, sit under the jacaranda.', noun: 137 },
  { name: 'Imperial Hwy beach drop', dist: '1.4 mi', mins: 28, tags: ['ocean', 'sunset', 'lax planes'], dek: 'Down the bluff stairs, watch a 737 cross the horizon at exactly your eye level.', noun: 246 },
  { name: 'Pier loop · Manhattan Beach', dist: '2.2 mi', mins: 42, tags: ['pier', 'sand', 'volleyball'], dek: 'North on the strand, ramp up to the pier, return on the bike path. Stop for a paleta if open.', noun: 421 },
  { name: 'Sand Dune Park climb', dist: '0.4 mi', mins: 22, tags: ['hill', 'cardio', 'soft sand'], dek: 'Three trips up the dune is a workout disguised as a view.', noun: 555 },
  { name: 'Recreation Park lap', dist: '0.7 mi', mins: 15, tags: ['shade', 'pickleball', 'kids'], dek: 'Loop the inside path, peek at the courts, listen for paddle pop.', noun: 304 },
  { name: 'El Segundo Boulevard sit', dist: '0.6 mi', mins: 14, tags: ['cafe', 'people', 'mid-day'], dek: 'Slow walk east, sit on the planter outside the coffee shop. Read one chapter.', noun: 91 },
  { name: 'Hyperion overlook', dist: '1.1 mi', mins: 25, tags: ['view', 'wind', 'birds'], dek: 'East along Hughes Way, climb to the rim, watch hawks ride the thermals.', noun: 720 },
  { name: 'Smoky Hollow alley', dist: '0.8 mi', mins: 17, tags: ['art', 'shop', 'alley'], dek: 'Wind through the back streets, count murals, peek into the open garage doors.', noun: 187 },
  { name: 'Dockweiler dog walk', dist: '1.6 mi', mins: 30, tags: ['ocean', 'pet', 'sand'], dek: 'Park at the bottom, walk south as far as the next set of fire pits, then back.', noun: 56 },
  { name: 'Aviation Rec loop', dist: '1.0 mi', mins: 20, tags: ['trees', 'shade', 'soft loop'], dek: 'A flat, kind loop. Good for bringing a phone call along.', noun: 619 },
  { name: 'Eucalyptus Dr · slow', dist: '0.5 mi', mins: 12, tags: ['canopy', 'breath', 'short'], dek: 'Stand under the eucalyptus tunnel for 30 seconds. Notice the sound dampen.', noun: 222 },
  { name: 'El Porto morning', dist: '0.6 mi', mins: 14, tags: ['surf check', 'coffee', 'AM'], dek: 'Walk to the lookout. Three deep breaths. Decide if today is a paddle-out day.', noun: 778 },
  { name: 'Concourse → strand', dist: '1.3 mi', mins: 28, tags: ['quiet', 'flat', 'art'], dek: 'Down the public art corridor, drop to the strand, walk one block south, ramp back up.', noun: 14 },
  { name: 'Vista Del Mar tide watch', dist: '1.5 mi', mins: 32, tags: ['tide', 'binoculars', 'birds'], dek: 'Find a low-tide window. Walk the line where the wet sand meets the dry.', noun: 345 },
  { name: 'Holly Ave to Library', dist: '0.9 mi', mins: 18, tags: ['residential', 'flowers', 'shade'], dek: 'A flower-tour loop. Notice the front-yard succulents. Greet a cat.', noun: 88 },
  { name: 'Palm Ave south', dist: '0.7 mi', mins: 16, tags: ['palms', 'long view', 'flat'], dek: 'Straight shot for clarity. No decisions. Just walk.', noun: 412 },
  { name: 'Sepulveda + Grand', dist: '0.8 mi', mins: 17, tags: ['urban', 'food', 'mid-block'], dek: 'Window-shop down Grand. Buy something small.', noun: 161 },
  { name: 'Civic Center back path', dist: '0.5 mi', mins: 12, tags: ['lawn', 'shade', 'short'], dek: 'A pocket walk between the library and the post office. Sit on the lawn.', noun: 503 },
  { name: 'Rosecrans west to ocean', dist: '2.4 mi', mins: 45, tags: ['ocean end', 'longer', 'gradient'], dek: 'A real walk. Earphones in. Let the day land.', noun: 666 },
  { name: 'Point Vicente lighthouse view', dist: '1.0 mi', mins: 22, tags: ['cliff', 'lighthouse', 'whales (dec-apr)'], dek: 'Drive 20 min south first. The walk is the reward, not the destination.', noun: 999 },
  { name: 'Manhattan to Hermosa strand', dist: '3.1 mi', mins: 60, tags: ['strand', 'long', 'beach town'], dek: 'A weekend walk. Leave time to stop. Coffee at the start, juice at the end.', noun: 12 },
  { name: 'Imperial Avenue garden', dist: '0.6 mi', mins: 14, tags: ['garden', 'pollinators', 'morning'], dek: 'The community garden is best at 8am. Listen for the bees.', noun: 234 },
  { name: 'Pier-to-pier daydream', dist: '4.0 mi', mins: 75, tags: ['weekend', 'distance', 'reset'], dek: 'Manhattan Beach Pier to Hermosa Pier and back. The kind of walk that solves things.', noun: 800 },
  { name: 'Chevron grass run', dist: '0.7 mi', mins: 16, tags: ['unexpected', 'wide path', 'wind'], dek: 'The walking path along the Chevron grass strip is wider than you remember.', noun: 1024 },
  { name: 'Jacaranda Bloom hunt (May–Jun)', dist: '1.0 mi', mins: 22, tags: ['seasonal', 'jacaranda', 'photo'], dek: 'When the jacarandas pop, walk the streets that hold the most. Bring a camera.', noun: 422 },
  { name: 'Tide pool low-tide loop', dist: '0.8 mi', mins: 30, tags: ['low tide', 'pools', 'kids'], dek: 'Time it for low tide. Walk slowly. Anemones do not move fast.', noun: 333 },
  { name: 'Whimsical neighborhood pick', dist: '0.6 mi', mins: 14, tags: ['mystery', 'random', 'short'], dek: 'Pick a street you have never walked. Walk the block. Note one new thing.', noun: 111 },
  { name: 'Bike path · Vista Del Mar', dist: '2.0 mi', mins: 38, tags: ['bike path', 'walk only', 'breezy'], dek: 'Walk the bike path during a lull. The wind off the ocean does the talking.', noun: 909 },
  { name: 'Rooftop hour at home', dist: '0.0 mi', mins: 15, tags: ['rest day', 'sky', 'sit'], dek: 'Skip the walk today. Sit on the steps. Watch a contrail. Counts.', noun: 0 },
  { name: 'Hilltop park · Smoky Hollow', dist: '1.1 mi', mins: 24, tags: ['climb', 'view', 'green'], dek: 'A climb that pays back in view. Bring water.', noun: 547 },
];

export const STRAINS: readonly Strain[] = [
  { brand: '710 Labs', name: 'Cake Crasher', lane: 'settle', laneTone: '#3a4f7c', profile: 'Wedding Cake x Wedding Crasher: vanilla, frosting, grape gas, plush body.', use: 'Dinner-to-couch, dessert run, late creative review.', tags: ['dessert', 'body', 'premium'], noun: 88 },
  { brand: '710 Labs', name: 'Garlic Cocktail', lane: 'create', laneTone: '#b854b8', profile: 'GMO funk braided with mimosa citrus; savory, loud, strangely sunny.', use: 'Cooking, beat digging, weird-good brainstorms.', tags: ['gmo', 'citrus', 'savory'], noun: 234 },
  { brand: '710 Labs', name: 'Moonbow', lane: 'connect', laneTone: '#d94d68', profile: 'Zkittlez family sweetness with soft cookie depth and a bright fruit finish.', use: 'Friend hangs, playlists, gallery walk, movie night.', tags: ['z', 'fruit', 'social'], noun: 422 },
  { brand: '710 Labs', name: 'Papaya', lane: 'move', laneTone: '#e86f3a', profile: 'Tropical, ripe, resinous, and easygoing without being too sleepy.', use: 'Beach walk, stretching, farmers market loop.', tags: ['tropical', 'hash', 'sunny'], noun: 555 },
  { brand: 'Cannabiotix', name: 'Cereal Milk', lane: 'connect', laneTone: '#d94d68', profile: 'Creamy berry cereal, vanilla sugar, balanced hybrid posture.', use: 'Brunch, conversation, low-stakes games.', tags: ['creamy', 'balanced', 'dessert'], noun: 304 },
  { brand: 'Cannabiotix', name: 'L’Orange', lane: 'lift', laneTone: '#f5b441', profile: 'Orange peel, tang, daytime sparkle. Classic CBX citrus.', use: 'Coffee walk, inbox clearing, Sunday reset.', tags: ['orange', 'daytime', 'bright'], noun: 137 },
  { brand: 'Cannabiotix', name: 'Kush Mountains', lane: 'settle', laneTone: '#3a4f7c', profile: 'Earth, pine, OG gravity, old-school SoCal exhale.', use: 'After-dinner decompression, body care, late album listen.', tags: ['og', 'pine', 'night'], noun: 720 },
  { brand: 'Cannabiotix', name: 'Tropicanna', lane: 'move', laneTone: '#e86f3a', profile: 'Tangie-adjacent citrus, berry, and lift; good when the day still has legs.', use: 'Bike path, creative chores, beach volleyball spectating.', tags: ['citrus', 'active', 'fruit'], noun: 421 },
  { brand: 'Fig Farms', name: 'Blue Face', lane: 'focus', laneTone: '#259e8a', profile: 'Fig Farms flagship-feeling gas, berry, and polished hybrid clarity.', use: 'Deep work, editing, vinyl sorting, focused hang.', tags: ['gas', 'berry', 'clarity'], noun: 619 },
  { brand: 'Fig Farms', name: 'Dark Karma', lane: 'create', laneTone: '#b854b8', profile: 'Complex, dark fruit, spice, and incense — for following strange ideas.', use: 'Writing, drawing, ambient set, night-market wandering.', tags: ['spice', 'incense', 'visual'], noun: 222 },
  { brand: 'Fig Farms', name: 'Holy Moly!', lane: 'lift', laneTone: '#f5b441', profile: 'Bright, expressive, aromatic; a lively counterpoint to heavier Fig lanes.', use: 'Morning notes, cafe work, thrift route.', tags: ['bright', 'aromatic', 'hybrid'], noun: 91 },
  { brand: 'Fig Farms', name: 'Animal Face', lane: 'settle', laneTone: '#3a4f7c', profile: 'Dense gas and animal-cookie gravity with a confident evening shape.', use: 'Post-sport recovery, hot shower, documentary mode.', tags: ['gas', 'cookie', 'body'], noun: 778 },
];

/**
 * LA-local day-of-epoch index. Ignores DST drift — only used for
 * stable bucketing, not millisecond accuracy.
 */
export function dayIndex(d: Date = new Date()): number {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const y = Number(fmt.find((p) => p.type === 'year')!.value);
  const m = Number(fmt.find((p) => p.type === 'month')!.value);
  const day = Number(fmt.find((p) => p.type === 'day')!.value);
  const dt = new Date(Date.UTC(y, m - 1, day));
  return Math.floor(dt.getTime() / 86400000);
}

// Different primes so the two picks rotate independently.
const WALK_PRIME = 7919;
const STRAIN_PRIME = 4441;

export function walkOfDayIndex(d: Date = new Date()): number {
  return (dayIndex(d) * WALK_PRIME) % WALKS.length;
}

export function strainOfDayIndex(d: Date = new Date()): number {
  return (dayIndex(d) * STRAIN_PRIME) % STRAINS.length;
}

export function walkOfDay(d: Date = new Date()): Walk {
  return WALKS[walkOfDayIndex(d)];
}

export function strainOfDay(d: Date = new Date()): Strain {
  return STRAINS[strainOfDayIndex(d)];
}
