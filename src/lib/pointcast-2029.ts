import { MASCOT_CARDS } from './mascot-battler';

export interface PointCast2029Identity {
  rank: number;
  slug: string;
  school: string;
  short: string;
  conference: string;
  city: string;
  state: string;
  currentStadium: string;
  localResource: string;
  sourceLabel: string;
  sourceUrl: string;
  markName: string;
  markPaths: string[];
  primary: string;
  secondary: string;
  paper: string;
  thesis: string;
  stadium: string;
  campus: string;
  gear: string;
  house: number;
  houseArt: string;
  canonical: string;
  machineEdition: string;
}

const identityDirections = [
  {
    markName: 'Night Seed',
    markPaths: ['M50 7A43 43 0 1 0 50 93A43 43 0 1 0 50 7M50 20L59 42L82 50L59 58L50 80L41 58L18 50L41 42Z'],
    primary: '#bb2f24', secondary: '#10243b', paper: '#e8dec7',
    thesis: 'A buckeye becomes a radial engine: botanical, civic, and visible from the last row.',
    stadium: 'Turn the bowl into a Great Lakes winter garden with prairie concourses and blue snowmelt channels.',
    campus: 'Plant a walkable seed line from the Olentangy to the stadium gates, lit by low amber disks.',
    gear: 'Reversible scarlet work jacket, navy wool collar, and one round seed patch students can repair.',
  },
  {
    markName: 'Golden Hinge',
    markPaths: ['M18 84V45C18 19 82 19 82 45V84H66V47C66 33 34 33 34 47V84Z', 'M42 51H58V93H42Z'],
    primary: '#d1a21f', secondary: '#18314a', paper: '#eee5ca',
    thesis: 'The campus arch becomes a hinge: history that opens instead of a coat of arms that closes.',
    stadium: 'Make the north end a warm winter arcade with chapel-scale arches and a public skating ribbon.',
    campus: 'A golden-hinge wayfinding system links the lakes, library, residence halls, and night bus.',
    gear: 'Deep-blue rain cape with a hinged gold throat tab and unbranded wool stadium scarf.',
  },
  {
    markName: 'Cut Horizon',
    markPaths: ['M8 38H92V53H8Z', 'M21 58H79L67 76H33Z'],
    primary: '#bf5700', secondary: '#172d2f', paper: '#eadabf',
    thesis: 'Texas is not an animal silhouette. It is heat, distance, limestone, and one impossible horizon.',
    stadium: 'Carve a shaded limestone river through the concourse and open its western edge to evening wind.',
    campus: 'Paint a continuous burnt-orange horizon at sitting height across public benches and ramps.',
    gear: 'Wide-brim transit hat, mineral canvas overshirt, and reflective horizon seam for the walk home.',
  },
  {
    markName: 'Rain Loop',
    markPaths: ['M28 13C6 30 11 67 41 69C56 70 61 58 53 47C46 36 31 41 32 52C33 60 44 62 50 57C58 81 88 75 91 48C94 21 72 11 55 20C45 25 42 36 48 43C55 51 68 47 68 37C68 29 60 26 54 29C55 11 39 5 28 13Z'],
    primary: '#2d7c58', secondary: '#182b67', paper: '#e2dfcc',
    thesis: 'Two weather systems cross without becoming a letter: the Pacific Northwest as motion.',
    stadium: 'Suspend a translucent rain roof over timber ribs and make every downspout part of the show.',
    campus: 'Build refill, repair, and rain-dry stations into a loop between river, transit, and field.',
    gear: 'Packable loop-shell in algae and cobalt with clip-on blanket panels for wet night games.',
  },
  {
    markName: 'Red Clay Gate',
    markPaths: ['M15 17H85V34H33V84H15Z', 'M49 50H85V84H68V67H49Z'],
    primary: '#a72621', secondary: '#22201d', paper: '#d9c7a6',
    thesis: 'A red-clay threshold replaces the cartoon growl with an architectural kind of force.',
    stadium: 'Wrap the field in shaded brick stoops, campus food tables, and a red-clay cooling court.',
    campus: 'A chain of open gates marks walking routes from Athens music rooms to Saturday gathering points.',
    gear: 'Washed clay chore coat, black repair tape, and modular brass gate clasp.',
  },
  {
    markName: 'Limestone Signal',
    markPaths: ['M17 18H48V34H17Z', 'M17 42H67V58H17Z', 'M17 66H83V82H17Z'],
    primary: '#9b272d', secondary: '#24354b', paper: '#e8ddc4',
    thesis: 'Three quarried slabs broadcast confidence without borrowing a mascot or a varsity letter.',
    stadium: 'Use limestone terraces, greenhouse stairs, and a student-radio deck to make the champion’s field public.',
    campus: 'Repeat the three-bar signal at bike scale, door scale, and broadcast-tower scale.',
    gear: 'Cream quilted overshirt with three woven red bars and replaceable navy pocket modules.',
  },
  {
    markName: 'Storm Eye',
    markPaths: ['M8 50C25 16 72 8 92 34C72 30 57 35 49 50C41 65 27 70 8 66C28 92 75 84 92 50C75 59 61 58 50 50C39 42 25 41 8 50Z'],
    primary: '#ef6b2e', secondary: '#17674c', paper: '#e7ddc6',
    thesis: 'An asymmetric eye built from pressure bands—coastal weather, not cartoon menace.',
    stadium: 'Open the bowl to Biscayne air with a porous shade ring, cooling gardens, and a stormwater commons.',
    campus: 'An orange-to-green pressure map guides people to shade, water, transit, and hurricane shelter information.',
    gear: 'Breathable field shirt, storm flap sling, and a two-color eye woven directly into the fabric.',
  },
  {
    markName: 'River Night Iris',
    markPaths: ['M50 7C64 23 82 28 93 50C82 72 64 77 50 93C36 77 18 72 7 50C18 28 36 23 50 7Z', 'M50 29A21 21 0 1 0 50 71A21 21 0 1 0 50 29Z'],
    primary: '#5a3477', secondary: '#e0b52c', paper: '#e8dfc9',
    thesis: 'The Mississippi at night becomes an iris: reflection, floodplain, music, and watchfulness.',
    stadium: 'Turn the exterior into a porous river-night commons of giant fans, clay walls, and band terraces.',
    campus: 'A violet floodline and gold night-light system connects river ecology to every Saturday route.',
    gear: 'Ultralight violet stadium jacket with golden interior map and instrument-friendly shoulder gussets.',
  },
  {
    markName: 'High Plains Broadcast',
    markPaths: ['M8 43H35L18 18H38L50 38L62 18H82L65 43H92V57H65L82 82H62L50 62L38 82H18L35 57H8Z'],
    primary: '#c62c2c', secondary: '#202020', paper: '#e4d9bf',
    thesis: 'A broadcast burst meets the plains horizon—fast, dry, generous, and impossible to reduce to initials.',
    stadium: 'Build a shade-and-wind machine with solar sails, dust gardens, and a public radio porch.',
    campus: 'A campus broadcast line lets clubs publish analog flip-board messages from library to field.',
    gear: 'Black field vest with red reflective burst panels and a removable radio pouch.',
  },
  {
    markName: 'Sun Gate',
    markPaths: ['M12 18H43V82H12Z', 'M57 18H88V82H57Z', 'M43 37A13 13 0 1 0 43 63A13 13 0 1 0 43 37Z'],
    primary: '#b72633', secondary: '#e4ad31', paper: '#eee0c5',
    thesis: 'Two slabs hold the California sun: monumental at the stadium, friendly on a bus pass.',
    stadium: 'Replace the hard perimeter with a sun-gate park, deep colonnades, and night-market concourses.',
    campus: 'Use red gates and gold disks to mark the useful ten-minute walk between transit and student life.',
    gear: 'Boxy sun jacket with a removable gold disk pocket and deep red ventilation panels.',
  },
  {
    markName: 'Tideline',
    markPaths: ['M8 31C22 18 36 18 50 31C64 44 78 44 92 31V49C78 62 64 62 50 49C36 36 22 36 8 49Z', 'M8 61C22 48 36 48 50 61C64 74 78 74 92 61V79C78 92 64 92 50 79C36 66 22 66 8 79Z'],
    primary: '#9f263b', secondary: '#283438', paper: '#e2d6be',
    thesis: 'Two rolling lines trade position: old power expressed as a living edge, not inherited script.',
    stadium: 'Make a shaded civic bowl whose rain channels reveal the Black Warrior watershed after every storm.',
    campus: 'A continuous tideline mural records student groups, public events, and annual high-water marks.',
    gear: 'Crimson wool shell with charcoal wave quilting and a repairable aluminum ticket clip.',
  },
  {
    markName: 'Mountain Echo',
    markPaths: ['M8 77L35 27L50 49L65 27L92 77H75L64 57L50 78L36 57L25 77Z'],
    primary: '#17375e', secondary: '#93a7b5', paper: '#e7e2d3',
    thesis: 'Nested ridges make an echo you can feel at embroidery scale and stadium scale.',
    stadium: 'Give the bowl a low timber winter roof and a public commons that works on the other 358 days.',
    campus: 'A ridge-to-ridge sound trail maps student radio, rehearsal rooms, and quiet places.',
    gear: 'Navy modular blanket coat with pale-blue contour stitching and snap-in seat cushion.',
  },
  {
    markName: '12th Grid',
    markPaths: ['M18 18H35V35H18ZM42 18H59V35H42ZM66 18H83V35H66ZM18 42H35V59H18ZM42 42H59V59H42ZM66 42H83V59H66ZM18 66H35V83H18ZM42 66H59V83H42ZM66 66H83V83H66Z'],
    primary: '#6a2939', secondary: '#394c3c', paper: '#e5dcc5',
    thesis: 'A community grid makes the “twelfth” idea visible without a numeral, seal, or military pastiche.',
    stadium: 'Break the megastructure into twelve shaded neighborhoods with their own water, food, and band rooms.',
    campus: 'Student organizations steward one square each in a campus-wide grid of noticeboards and gardens.',
    gear: 'Maroon utility overshirt with nine visible grid pockets and three internal community patches.',
  },
  {
    markName: 'Prairie Wind',
    markPaths: ['M9 25H79L92 40H22Z', 'M9 48H68L81 63H22Z', 'M9 71H57L68 84H22Z'],
    primary: '#b8462d', secondary: '#274c63', paper: '#e7d9bb',
    thesis: 'Three wind bands accelerate across an open field: movement with no wagon wheel required.',
    stadium: 'Open shaded breezeways through the bowl and use tall-grass roofs as visible wind instruments.',
    campus: 'Wind flags double as campus orientation and real-time shade, heat, and air-quality signals.',
    gear: 'Rust-and-blue wind smock with three long ventilation pleats and pack-flat stadium hood.',
  },
  {
    markName: 'Big House Void',
    markPaths: ['M10 16H90V84H10ZM31 36V64H69V36Z'],
    primary: '#173e70', secondary: '#f1bd32', paper: '#e9dfc4',
    thesis: 'The mark is the room itself: 100,000 people organized around a charged rectangle of nothing.',
    stadium: 'Keep the great void, but wrap it with greenhouse concourses, public transit, and winter study halls.',
    campus: 'An empty blue square becomes a frame for student work rather than a logo stamped over it.',
    gear: 'Dark-blue square-cut coat with maize void lining and a window pocket for student-made inserts.',
  },
  {
    markName: 'Wasatch Pulse',
    markPaths: ['M8 62H26L37 29L50 72L63 39L73 62H92V78H62L51 54L38 91L25 78H8Z'],
    primary: '#245f82', secondary: '#d34e2f', paper: '#e5ddc8',
    thesis: 'A mountain pulse is altitude in motion—specific to place without drawing a peak badge.',
    stadium: 'Stretch a rain-and-snow roof between timber masts and place the rail platform inside the commons.',
    campus: 'A blue pulse line climbs campus, marking effort, elevation, water, and rest.',
    gear: 'Cobalt anorak with red pulse seam, modular warmth panels, and a tram-pass sleeve.',
  },
  {
    markName: 'Delta Cut',
    markPaths: ['M10 17H90L61 50L90 83H10L39 50Z'],
    primary: '#b43c40', secondary: '#386455', paper: '#e6dac0',
    thesis: 'Two river cuts meet at the center: sharp, hospitable, and free of plantation nostalgia.',
    stadium: 'Build a shaded delta garden around the bowl with water tables and regional food cooperatives.',
    campus: 'A branching path system privileges shade trees, public water, and the walk between town and campus.',
    gear: 'Rose canvas field shirt with green delta gussets and a shared tool-roll pocket.',
  },
  {
    markName: 'River Howl',
    markPaths: ['M8 52L20 52L29 25L40 80L51 37L61 67L71 19L81 52H92V68H70L62 45L51 88L40 50L31 84L20 68H8Z'],
    primary: '#e55f22', secondary: '#214e68', paper: '#e8dbc0',
    thesis: 'A river waveform carries the crowd: sound translated into topography, never an animal head.',
    stadium: 'Terrace the river edge with orange shade sails, mist courts, and a civic sound garden.',
    campus: 'Let student bands publish a weekly waveform banner that changes with the city’s actual sounds.',
    gear: 'Orange rain vest over river-blue knit, with reflective waveform tape made in the print lab.',
  },
  {
    markName: 'Hill Charge',
    markPaths: ['M8 80L34 22L48 55L61 31L92 80H72L61 58L48 83L34 50L27 80Z'],
    primary: '#dd5b24', secondary: '#4b6038', paper: '#e4d8bd',
    thesis: 'Two slopes collide to make upward energy—landscape force instead of a paw or letter.',
    stadium: 'Sink cooling gardens into the hill and use the upper concourse as a year-round public overlook.',
    campus: 'A hill-charge trail combines stairs, ramps, shade landings, and student art at every elevation.',
    gear: 'Citrus climbing smock with green side panels and a fold-out ground cloth.',
  },
  {
    markName: 'Redtail Thermal',
    markPaths: ['M50 9C77 9 91 28 91 50C91 76 70 91 48 91C27 91 11 77 11 58C11 39 26 27 42 27C57 27 68 37 68 50C68 62 59 70 49 70C39 70 32 63 32 54C32 47 37 42 43 42C49 42 53 46 53 51C53 55 50 58 47 58'],
    primary: '#b83a32', secondary: '#294b58', paper: '#e4d8c1',
    thesis: 'A rising thermal remembers the red desert and mountain air without depicting a bird.',
    stadium: 'A translucent weather roof collects rain, frames the mountains, and vents summer heat upward.',
    campus: 'Thermal spirals mark cool routes, refill points, and places where the valley wind can be felt.',
    gear: 'Red spiral quilt, slate rain shell, and a circular warmth panel that moves from bag to seat.',
  },
  {
    markName: 'Cedar Rainline',
    markPaths: ['M16 14H30V86H16ZM43 26H57V86H43ZM70 38H84V86H70Z'],
    primary: '#4b5f54', secondary: '#5b4b86', paper: '#e2ddce',
    thesis: 'Three cedar rainlines are weather, forest, and skyline with no animal shorthand.',
    stadium: 'Put steep democratic seating beneath a rain-harvesting timber canopy served directly by light rail.',
    campus: 'Cedar bars measure rainfall on wayfinding posts and route captured water into visible gardens.',
    gear: 'Forest quilted cape with ultraviolet rain bars and a dry-pocket for paper tickets.',
  },
  {
    markName: 'Limestone Spring',
    markPaths: ['M50 8A42 42 0 1 0 50 92A42 42 0 1 0 50 8ZM50 27A23 23 0 1 1 33 65L50 50Z'],
    primary: '#246c6a', secondary: '#df7b29', paper: '#e7dec7',
    thesis: 'A spring aperture cuts into a limestone disk: water, shade, and Florida light in one move.',
    stadium: 'Turn the perimeter into a porous spring garden with giant fans, shaded pools, and public food tables.',
    campus: 'A cool-water loop links refill stations, swimming history, ecology, and the stadium walk.',
    gear: 'Teal mesh overshirt with citrus spring pocket and detachable sun sleeves.',
  },
  {
    markName: 'Dawn Burst',
    markPaths: ['M50 7L59 36L84 20L69 44L96 50L67 59L82 84L58 69L50 96L41 67L16 82L31 58L4 50L33 41L18 16L42 31Z'],
    primary: '#922f39', secondary: '#e3a52d', paper: '#e7dbc2',
    thesis: 'Dawn before the bird: heat and noise reduced to a civic burst anyone can draw.',
    stadium: 'Create a sunrise market under the stands and a shaded evening plaza that belongs to Columbia.',
    campus: 'The burst becomes a student-published signal for performances, food, rides, and mutual aid.',
    gear: 'Garnet cropped work jacket with golden burst vents and a screenprinted scarf blank.',
  },
  {
    markName: 'Blue Mirage',
    markPaths: ['M8 25H92V39H8ZM20 44H80V58H20ZM32 63H68V77H32Z'],
    primary: '#2b62b7', secondary: '#d34b32', paper: '#e5dcc5',
    thesis: 'The blue field becomes an interference pattern: a public optical event, not borrowed horse anatomy.',
    stadium: 'Extend the famous field into a river-and-desert commons with cooling arcades and bike arrival.',
    campus: 'Mirage bars mark changing distance to shade, water, foothills, and the Boise River.',
    gear: 'Blue transit shell with red interference liner and a packable desert-sun hood.',
  },
  {
    markName: 'Dusk Wing',
    markPaths: ['M8 24L50 43L92 24L68 56L92 76L50 61L8 76L32 56Z'],
    primary: '#25282b', secondary: '#d7ad35', paper: '#e3dac3',
    thesis: 'Three balanced planes catch prairie dusk: aerial energy without a hawk illustration.',
    stadium: 'Make the west edge a dusk commons for the hospital wave, river walks, and year-round gathering.',
    campus: 'A black-and-gold light trail connects the river, arts campus, hospital, and stadium without visual noise.',
    gear: 'Black wool stadium vest with gold wing folds, deep hand pockets, and a shared blanket strap.',
  },
] as const;

export const POINTCAST_2029 = {
  spec: 'pointcast.saturday-rebranded/v1',
  title: 'SATURDAY, REBRANDED',
  subtitle: 'A visual expansion draft for the PointCast 25.',
  year: 2029,
  publishedAt: '2026-07-27T22:29:00-07:00',
  canonical: 'https://pointcast.xyz/25/2029',
  machineEdition: 'https://pointcast.xyz/25/2029.json',
  fieldKit: {
    title: 'Saturday Commons',
    canonical: 'https://pointcast.xyz/25/2029/field-kit',
    machineEdition: 'https://pointcast.xyz/25/2029/field-kit.json',
    block: '0525',
  },
  block: '0524',
  board: '000',
  visualPlates: [
    ...[1, 2, 3, 4, 5].map((house) => ({
      kind: 'mark-house',
      title: `Mark House ${String(house).padStart(2, '0')}`,
      image: `/images/pointcast-2029/mark-house-0${house}.png`,
    })),
    { kind: 'stadium', title: 'Great Lakes Civic Bowl', image: '/images/pointcast-2029/stadium-great-lakes.png' },
    { kind: 'stadium', title: 'River Night Commons', image: '/images/pointcast-2029/stadium-river-night.png' },
    { kind: 'stadium', title: 'Mountain Rain Roof', image: '/images/pointcast-2029/stadium-mountain-rain.png' },
    { kind: 'gear', title: 'Transit Kit', image: '/images/pointcast-2029/gear-transit-kit.png' },
    { kind: 'gear', title: 'Band, Newsroom, Night Shift', image: '/images/pointcast-2029/gear-night-shift.png' },
  ],
  rules: [
    'Place before mascot: landscape, weather, civic memory, and useful infrastructure lead.',
    'Every symbol must work at sixteen pixels, on cloth, and across sixty feet of concrete.',
    'A stadium is public infrastructure before it is a premium hospitality product.',
    'Student gear should be affordable, repairable, layerable, and locally customizable.',
    'Paper, paint, cloth, and architecture must still work when the app fails.',
    'A sponsor may support a place. It may not become the place’s identity.',
  ],
  boundary:
    'Unofficial speculative editorial design. PointCast is not affiliated with, endorsed by, or commissioned by any school, conference, athletic program, stadium, or governing body. These wholly original abstract marks and imagined 2029 environments do not replace official identities, depict approved plans, or reproduce official logos, uniforms, or mascot costumes.',
} as const;

export const POINTCAST_2029_IDENTITIES: PointCast2029Identity[] = MASCOT_CARDS.map((card, index) => {
  const direction = identityDirections[index];
  if (!direction) throw new Error(`Missing 2029 identity direction for rank ${card.rank}`);
  const house = Math.floor(index / 5) + 1;
  return {
    rank: card.rank,
    slug: card.slug,
    school: card.school,
    short: card.short,
    conference: card.conference,
    city: card.city,
    state: card.state,
    currentStadium: card.stadium,
    localResource: card.localResource,
    sourceLabel: card.sourceLabel,
    sourceUrl: card.sourceUrl,
    ...direction,
    markPaths: [...direction.markPaths],
    house,
    houseArt: `/images/pointcast-2029/mark-house-0${house}.png`,
    canonical: `https://pointcast.xyz/25/2029/${card.slug}`,
    machineEdition: `https://pointcast.xyz/25/2029/${card.slug}.json`,
  };
});

export const POINTCAST_2029_CONFERENCES = Array.from(
  new Set(POINTCAST_2029_IDENTITIES.map((identity) => identity.conference)),
);

export function getPointCast2029Identity(slug: string) {
  return POINTCAST_2029_IDENTITIES.find((identity) => identity.slug === slug);
}
