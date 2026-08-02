export type OutdoorMode = 'flow' | 'court' | 'field' | 'stretch' | 'art' | 'nature' | 'social' | 'quiet';
export type OutdoorArc = 'center' | 'south-bay' | 'westside' | 'hills' | 'north-arc' | 'south-arc';

export const OPEN_AIR_COMMONS = {
  id: 'PC-BEACH-COMMONS-V18-OPEN-AIR',
  title: 'OPEN/25',
  subtitle: 'The Open-Air Commons',
  dek: 'Twenty-five official public doors, twelve low-equipment games, six easy resets, and a browser-local way to make a Southern California day from El Segundo outward.',
  url: 'https://pointcast.xyz/beach-commons/v18/outdoors',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v18/outdoors.json',
  blockUrl: 'https://pointcast.xyz/b/0554',
  fieldStudy: '018.C',
  publishedAt: '2026-08-02',
  updatedAt: '2026-08-02T15:20:00-07:00',
  center: 'El Segundo, California',
  radius: 'roughly 25 straight-line miles',
  status: 'Independent PointCast editorial field guide. It is not an operating-hours service, reservation system, event announcement, access guarantee, public-safety notice, or affiliation with a named public agency or steward.',
} as const;

export const OUTDOOR_MODES = [
  { id: 'flow', number: '01', label: 'Flow', color: '#287f9a', prompt: 'Walk, roll, jog, coast, or make one continuous line.', mark: '↝' },
  { id: 'court', number: '02', label: 'Court', color: '#d86243', prompt: 'Use the painted rules, then invent one fair variation.', mark: '□' },
  { id: 'field', number: '03', label: 'Field', color: '#6f8f62', prompt: 'Bring a ball, disc, ribbon, or only a boundary.', mark: '○' },
  { id: 'stretch', number: '04', label: 'Stretch', color: '#e1a845', prompt: 'Arrive gently. Leave with more range than urgency.', mark: '⌁' },
  { id: 'art', number: '05', label: 'Art', color: '#9a6858', prompt: 'Notice public form, make a response, leave the site unchanged.', mark: '✦' },
  { id: 'nature', number: '06', label: 'Nature', color: '#47785f', prompt: 'Look longer. Collect observations, not living things.', mark: '⌇' },
  { id: 'social', number: '07', label: 'Social', color: '#ec7b50', prompt: 'Make it easy to join, easy to pass, and easy to leave.', mark: '+' },
  { id: 'quiet', number: '08', label: 'Quiet', color: '#68777b', prompt: 'Choose a bench, horizon, shade line, or slow lap.', mark: '—' },
] as const;

export const OUTDOOR_ARCS = [
  { id: 'center', label: 'El Segundo center', note: 'The close-in civic rooms and Pacific edge.' },
  { id: 'south-bay', label: 'South Bay', note: 'Manhattan Beach and Hermosa Beach lawns, courts, and strand.' },
  { id: 'westside', label: 'Marina + Westside', note: 'Harbor edge, creek line, Venice play, and Culver City.' },
  { id: 'hills', label: 'Baldwin Hills', note: 'Steep views, regional parkland, restoration, and trail links.' },
  { id: 'north-arc', label: 'North arc', note: 'Cheviot Hills and Santa Monica public art, coast, and gardens.' },
  { id: 'south-arc', label: 'Torrance + Peninsula', note: 'Courts, marsh, botanic garden, canyon, sage, and tide edge.' },
] as const;

export const OUTDOOR_RESOURCES: Array<{
  id: string;
  number: string;
  name: string;
  city: string;
  arc: OutdoorArc;
  band: string;
  modes: OutdoorMode[];
  surface: string;
  use: string;
  officialNote: string;
  check: string;
  cost: string;
  source: string;
  sourceLabel: string;
}> = [
  {
    id: 'recreation-park', number: '01', name: 'Recreation Park', city: 'El Segundo', arc: 'center', band: 'Center',
    modes: ['court', 'field', 'stretch', 'social'], surface: 'Painted courts · lawn · picnic shade',
    use: 'A many-option base camp: tennis, basketball, pickleball, volleyball, ping pong, grass, play, and an ordinary table between rounds.',
    officialNote: 'The City directory lists accessible paths, courts, fields, picnic facilities, play, restrooms, and water.',
    check: 'Court reservations, renovation work, program use, and posted rules can change.', cost: 'Free entry · some facilities reservable',
    source: 'https://www.elsegundorecparks.gov/Home/Components/FacilityDirectory/FacilityDirectory/1505/268864', sourceLabel: 'City of El Segundo Recreation & Parks',
  },
  {
    id: 'library-park', number: '02', name: 'Library Park', city: 'El Segundo', arc: 'center', band: 'Center',
    modes: ['stretch', 'art', 'social', 'quiet'], surface: 'Old trees · open lawn · bandstand',
    use: 'A soft civic room for a reading blanket, drawing exchange, unamplified listening circle, or very slow group arrival.',
    officialNote: 'The City lists a gazebo, green space, water fountain, shade trees, and a central location beside the library.',
    check: 'Events can change ordinary use; check the City calendar and posted conditions.', cost: 'Free entry',
    source: 'https://www.elsegundorecparks.gov/Home/Components/FacilityDirectory/FacilityDirectory/1535/268864', sourceLabel: 'City of El Segundo Recreation & Parks',
  },
  {
    id: 'campus-el-segundo', number: '03', name: 'Campus El Segundo Athletic Fields', city: 'El Segundo', arc: 'center', band: 'Center',
    modes: ['field', 'stretch', 'social'], surface: 'Synthetic multi-use fields',
    use: 'Best treated as a scheduled field door: useful for soccer geometry, relays, passing ladders, and larger games when access is confirmed.',
    officialNote: 'The City lists two full-size multi-purpose synthetic fields, restrooms, water, and reservation information.',
    check: 'Do not infer drop-in access. Confirm field availability and any permit or reservation first.', cost: 'Availability and fees vary',
    source: 'https://www.elsegundorecparks.gov/Home/Components/FacilityDirectory/FacilityDirectory/1503/268864', sourceLabel: 'City of El Segundo Recreation & Parks',
  },
  {
    id: 'dockweiler', number: '04', name: 'Dockweiler State Beach', city: 'Playa del Rey', arc: 'center', band: 'Near coast',
    modes: ['flow', 'field', 'stretch', 'nature', 'social', 'quiet'], surface: 'Sand · bike path · Pacific edge',
    use: 'The all-day coast door: bike-path motion, sand games, horizon work, volleyball, a picnic, and designated-fire-ring evenings when current conditions allow.',
    officialNote: 'LA County lists bike-path access, volleyball nets, picnic tables, restrooms, showers, access mat, wheelchairs, and designated fire pits.',
    check: 'Check water quality, weather, fire-pit status, parking, wildlife enclosure, and beach rules before leaving.', cost: 'Free beach entry · parking may cost',
    source: 'https://beaches.lacounty.gov/dockweiler-beach/', sourceLabel: 'Los Angeles County Beaches & Harbors',
  },
  {
    id: 'polliwog', number: '05', name: 'Polliwog Park', city: 'Manhattan Beach', arc: 'south-bay', band: 'Near south',
    modes: ['flow', 'stretch', 'art', 'nature', 'social', 'quiet'], surface: 'Pond path · garden · lawn · amphitheater',
    use: 'A useful nature-and-neighborhood mix for bird minutes, garden color studies, StoryWalk pacing, picnics, and a low-key closing circle.',
    officialNote: 'The City describes an 18-acre park with pond habitat, botanical garden, fitness court, playground, amphitheater, lawns, and paths.',
    check: 'Do not fish or feed wildlife. Check reservations, event overlays, dog rules, and current garden access.', cost: 'Free entry · reservable areas vary',
    source: 'https://www.manhattanbeach.gov/visitors/parks-and-facilities', sourceLabel: 'City of Manhattan Beach Parks & Facilities',
  },
  {
    id: 'manhattan-heights', number: '06', name: 'Manhattan Heights Park', city: 'Manhattan Beach', arc: 'south-bay', band: 'Near south',
    modes: ['court', 'field', 'stretch', 'social'], surface: 'Courts · athletic field · bouldering wall',
    use: 'A compact sport sampler for basketball, tennis, pickleball, a shared warm-up, and short format games with clear turns.',
    officialNote: 'The City lists lighted tennis, pickleball, basketball, an athletic field, bouldering wall, picnic facilities, restrooms, and water.',
    check: 'Check current court access, reservations, construction notices, lighting, and program use.', cost: 'Free entry · reservations may apply',
    source: 'https://www.manhattanbeach.gov/visitors/parks-and-facilities', sourceLabel: 'City of Manhattan Beach Parks & Facilities',
  },
  {
    id: 'bruces-beach', number: '07', name: "Bruce's Beach", city: 'Manhattan Beach', arc: 'south-bay', band: 'Near south',
    modes: ['court', 'stretch', 'art', 'quiet'], surface: 'Terraced grass · half court · ocean view',
    use: 'A short overlook room for one-ball HORSE variants, a history-and-art pause, a picnic, and a deliberate sunset finish.',
    officialNote: 'The City describes a terraced hillside, half basketball court, shade trees, benches, ocean views, commemorative plaque, and art.',
    check: 'This is a small, heavily meaningful place; keep games compact and respect memorial context and neighbors.', cost: 'Free entry',
    source: 'https://www.manhattanbeach.gov/visitors/parks-and-facilities', sourceLabel: 'City of Manhattan Beach Parks & Facilities',
  },
  {
    id: 'hermosa-beach', number: '08', name: 'Hermosa Beach', city: 'Hermosa Beach', arc: 'south-bay', band: 'South Bay coast',
    modes: ['flow', 'field', 'stretch', 'social', 'quiet'], surface: 'Sand · Strand · volleyball',
    use: 'A clean moving-social sequence: Strand walk, short mobility reset, beach-tennis or volleyball variation, then pier or horizon close.',
    officialNote: 'LA County lists beach tennis, swimming, volleyball, bike-path access, playground equipment, restrooms, showers, and lifeguards in daylight hours.',
    check: 'Check ocean conditions, water quality, tournament overlays, parking, and posted beach rules.', cost: 'Free beach entry · parking may cost',
    source: 'https://beaches.lacounty.gov/download-category/hermosa-beach/', sourceLabel: 'Los Angeles County Beaches & Harbors',
  },
  {
    id: 'valley-park', number: '09', name: 'Valley Park', city: 'Hermosa Beach', arc: 'south-bay', band: 'South Bay',
    modes: ['court', 'field', 'stretch', 'social', 'quiet'], surface: 'Basketball · play field · picnic grove',
    use: 'An inland counterweight to the sand: court games, field relays, a shaded reset, and an accessible family picnic base.',
    officialNote: 'The City lists a basketball court, play field, playground, picnic tables, restrooms, amphitheater, fire pit, and accessible swing.',
    check: 'Some reservations are resident-limited. Confirm fire use, group use, and posted conditions.', cost: 'Free entry · reservations vary',
    source: 'https://www.hermosabeach.gov/Home/Components/FacilityDirectory/FacilityDirectory/16/248', sourceLabel: 'City of Hermosa Beach',
  },
  {
    id: 'hopkins-wilderness', number: '10', name: 'Hopkins Wilderness Park', city: 'Redondo Beach', arc: 'south-bay', band: 'South Bay',
    modes: ['flow', 'stretch', 'nature', 'quiet'], surface: 'Urban preserve · forest · meadow · pond',
    use: 'A small wilderness interval for a trail loop, quiet looking, kid-scale habitat comparison, and a no-collection observation card.',
    officialNote: 'The City planning source describes an 11-acre natural preserve with forest, meadow, stream, pond, trails, picnic areas, visitor center, and restrooms.',
    check: 'The park has closure days and limited hours; camping and programs require current confirmation or reservation.', cost: 'Day use may be free · programs/camping vary',
    source: 'https://redondo.org/Documents/Departments/Community%20Development/Planning/General%20Plan%20And%20Long-Range%20Planning/3.4%20Conservation-Recreation%20and%20Parks-and%20Open%20Space%203-103to3-115.pdf', sourceLabel: 'City of Redondo Beach General Plan',
  },
  {
    id: 'burton-chace', number: '11', name: 'Burton W. Chace Park', city: 'Marina del Rey', arc: 'westside', band: 'Marina arc',
    modes: ['flow', 'stretch', 'art', 'social', 'quiet'], surface: 'Harbor point · lawn · pergolas',
    use: 'The marina living room: short laps, harbor drawing, chess or board-game tables, picnic shade, and a public-program handoff when scheduled.',
    officialNote: 'LA County lists a ten-acre waterfront park with accessible paths, views, picnic tables, barbecues, pergolas, shelters, guest docks, and public classes.',
    check: 'Check the live event schedule, registration requirements, rentals, docks, and parking before going.', cost: 'Free park entry · some programs/rentals vary',
    source: 'https://beaches.lacounty.gov/burton-chace-park/', sourceLabel: 'Los Angeles County Beaches & Harbors',
  },
  {
    id: 'ballona-creek', number: '12', name: 'Ballona Creek Bike Path', city: 'Culver City to coast', arc: 'westside', band: 'Westside spine',
    modes: ['flow', 'stretch', 'nature', 'quiet'], surface: 'Separated linear path · creek channel',
    use: 'A continuous-line day: choose a bounded out-and-back, make three observation stops, and let the path—not a destination—be the game.',
    officialNote: 'Culver City describes a roughly seven-mile path from Syd Kronenthal Park to the Pacific, connecting with the coastal bike path.',
    check: 'Check closures, daylight, surface, wind, crossings, bike readiness, and current path rules. Turn around early.', cost: 'Free access',
    source: 'https://www.culvercity.org/Services/Parking-Streets-Transportation/Biking-In-Culver-City', sourceLabel: 'City of Culver City',
  },
  {
    id: 'venice-beach-rec', number: '13', name: 'Venice Beach Recreation Center', city: 'Venice', arc: 'westside', band: 'Westside coast',
    modes: ['flow', 'court', 'field', 'stretch', 'art', 'social'], surface: 'Basketball · handball · paddle tennis · skate · beach',
    use: 'The high-energy public play room: watch first, choose one court culture, take turns clearly, and make the art and people-watching part of the route.',
    officialNote: 'LA Recreation and Parks lists basketball, paddle tennis, handball, Muscle Beach, skate park, and special events at Ocean Front Walk.',
    check: 'Busy public courts have their own etiquette. Check facility notices, hours, programs, and current rules.', cost: 'Free public areas · programs may vary',
    source: 'https://www2.laparks.org/venice/', sourceLabel: 'City of Los Angeles Recreation & Parks',
  },
  {
    id: 'culver-city-park', number: '14', name: 'Culver City Park', city: 'Culver City', arc: 'westside', band: 'Westside inland',
    modes: ['flow', 'court', 'field', 'stretch', 'nature', 'social'], surface: 'Trail · courts · fields · skate park',
    use: 'A useful junction: interpretive trail and rose garden for slow attention, courts and fields for play, and a connection toward the overlook.',
    officialNote: 'The City describes parks, courts, dog and skate facilities; its park material lists basketball, paths, play, picnic, rose garden, and overlook trail access.',
    check: 'Check trail, field, ropes-course, skate, dog, and reservation conditions separately.', cost: 'Free park entry · some facilities vary',
    source: 'https://www.culvercity.org/Explore/Parks-Recreation', sourceLabel: 'City of Culver City Parks & Recreation',
  },
  {
    id: 'baldwin-hills-overlook', number: '15', name: 'Baldwin Hills Scenic Overlook', city: 'Culver City', arc: 'hills', band: 'Baldwin Hills',
    modes: ['flow', 'stretch', 'nature', 'quiet'], surface: 'Steep trail · stairs · native habitat · view',
    use: 'A vertical day marker: choose stairs or trail honestly, stop before strain, read the restored landscape, and make the horizon the finish line.',
    officialNote: 'California State Parks lists a steep one-mile trail, stairs, an easier crown loop, visitor center, native habitat, and basin-wide views.',
    check: 'Heat and grade matter. Check current hours, visitor-center status, parking, hydration, and trail guidance.', cost: 'Free walk-in · parking fee',
    source: 'https://www.parks.ca.gov/?page_id=22790', sourceLabel: 'California State Parks',
  },
  {
    id: 'kenneth-hahn', number: '16', name: 'Kenneth Hahn State Recreation Area', city: 'Los Angeles', arc: 'hills', band: 'Baldwin Hills',
    modes: ['flow', 'field', 'stretch', 'nature', 'social', 'quiet'], surface: 'Regional parkland · trails · lawns · lake',
    use: 'A broad choose-your-own room for longer walking, field play, shade, family gathering, and a quiet transition between city and hill.',
    officialNote: 'LA County identifies the regional recreation area and current Baldwin Hills shuttle connection in its official park directory.',
    check: 'Regional park closure days, fees, programs, shuttle service, parking, and amenities can change; open the official page.', cost: 'Entry/parking conditions vary',
    source: 'https://parks.lacounty.gov/kenneth-hahn-state-recreation-area/', sourceLabel: 'Los Angeles County Parks & Recreation',
  },
  {
    id: 'cheviot-hills', number: '17', name: 'Cheviot Hills Recreation Center', city: 'Los Angeles', arc: 'north-arc', band: 'North inland',
    modes: ['court', 'field', 'stretch', 'art', 'social'], surface: 'Basketball · tennis · pétanque · fields · archery',
    use: 'A rare game sampler: pétanque, basketball, tennis, field sports, a picnic, or an arts-and-crafts program—one visit does not need to do everything.',
    officialNote: 'LA Recreation and Parks lists lighted courts, fields, pétanque, archery, picnic areas, play, rooms, and seasonal programming.',
    check: 'Independent facilities, classes, fields, range, pool, and courts have separate hours, fees, and reservations.', cost: 'Free park entry · programs/facilities vary',
    source: 'https://www2.laparks.org/reccenter/cheviot-hills', sourceLabel: 'City of Los Angeles Recreation & Parks',
  },
  {
    id: 'palisades-park', number: '18', name: 'Palisades Park', city: 'Santa Monica', arc: 'north-arc', band: 'North coast',
    modes: ['flow', 'stretch', 'art', 'social', 'quiet'], surface: 'Clifftop path · lawns · public art · chess',
    use: 'A long, linear overlook for walking conversations, chess, public-art noticing, picnic intervals, and a close that does not require buying anything.',
    officialNote: 'Santa Monica planning materials list walking paths, benches, picnic tables, public art, restrooms, and relocated public chess tables.',
    check: 'Check current park rules, event overlays, chess-table location, path work, parking, and coastal conditions.', cost: 'Free entry',
    source: 'https://www.santamonica.gov/media/RAD/Events/Community%20Event%20Planning%20Guide_2026.02.03.pdf', sourceLabel: 'City of Santa Monica',
  },
  {
    id: 'tongva-park', number: '19', name: 'Tongva Park', city: 'Santa Monica', arc: 'north-arc', band: 'North coast',
    modes: ['flow', 'stretch', 'art', 'nature', 'social', 'quiet'], surface: 'Braided garden paths · overlooks · public art',
    use: 'The designed-landscape room: trace an arroyo line, compare plant textures, make a sculpture response on paper, then gather at the overlook.',
    officialNote: 'The City describes walking paths, public art, splash pad, playground, ocean observation deck, gardens, and more than 100 plant species.',
    check: 'Check splash-pad status, maintenance work, events, hours, and park rules before relying on a feature.', cost: 'Free entry',
    source: 'https://www.santamonica.gov/press/2025/08/12/endless-summer-c-a-m-p-celebrates-santa-monica-s-150th-anniversary-in-a-free-day-of-art-music-and-play-for-all-ages', sourceLabel: 'City of Santa Monica',
  },
  {
    id: 'wilson-park', number: '20', name: 'Charles H. Wilson Park', city: 'Torrance', arc: 'south-arc', band: 'South inland',
    modes: ['flow', 'court', 'field', 'stretch', 'art', 'social'], surface: 'Fitness loop · courts · amphitheater · play',
    use: 'The durable all-purpose park: a measured loop, pickleball or basketball, sand volleyball, a market pass, and an amphitheater finish.',
    officialNote: 'Torrance lists a fitness course, courts, roller rink, fields, amphitheater, accessible tree house, picnic areas, play, and restrooms.',
    check: 'Construction and resurfacing closures occur. Check the current facility alert, reservations, market, and splash-pad status.', cost: 'Free entry · reservable facilities vary',
    source: 'https://www.torranceca.gov/Our-Community/Parks/Wilson-Park-Charles-H', sourceLabel: 'City of Torrance',
  },
  {
    id: 'madrona-marsh', number: '21', name: 'Madrona Marsh Preserve', city: 'Torrance', arc: 'south-arc', band: 'South inland',
    modes: ['flow', 'stretch', 'art', 'nature', 'quiet'], surface: 'Seasonal wetland · nature center · observation trail',
    use: 'A careful looking room: one slow circuit, bird and frog listening, field sketching, and a guided program only when actually scheduled.',
    officialNote: 'The City lists free admission, a nature center, docent walks, birding, habitat restoration, stories, and science activities.',
    check: 'The preserve has specific open days and hours. Programs may require registration; stay on paths and follow habitat rules.', cost: 'Free admission',
    source: 'https://www.torranceca.gov/Our-Community/Madrona-Marsh', sourceLabel: 'City of Torrance',
  },
  {
    id: 'south-coast-botanic', number: '22', name: 'South Coast Botanic Garden', city: 'Palos Verdes Peninsula', arc: 'south-arc', band: 'South garden',
    modes: ['flow', 'stretch', 'art', 'nature', 'quiet'], surface: 'Botanic paths · collections · shade',
    use: 'A paid public garden door for color study, plant-form drawing, a long easy walk, seasonal noticing, and a quiet bench close.',
    officialNote: 'LA County lists the botanic garden as a public park resource with current admission information and official program link.',
    check: 'Check admission, ticketing, event overlays, closures, mobility information, and garden rules.', cost: 'Admission charged · check current rates',
    source: 'https://parks.lacounty.gov/south-coast-botanic-garden/', sourceLabel: 'Los Angeles County Parks & Recreation',
  },
  {
    id: 'george-f-canyon', number: '23', name: 'George F Canyon Preserve', city: 'Rolling Hills Estates', arc: 'south-arc', band: 'Peninsula',
    modes: ['flow', 'stretch', 'nature', 'quiet'], surface: 'Riparian canyon · coastal sage trail',
    use: 'A short habitat contrast: shaded canyon to sage, with one listening stop, one texture sketch, and nothing removed.',
    officialNote: 'The operating land conservancy lists a 1.6-mile trail through riparian woodland and coastal sage scrub.',
    check: 'The nature-center building is reported closed for construction while the trail remains open; confirm before going.', cost: 'Trail access listed as free',
    source: 'https://pvplc.org/educate/', sourceLabel: 'Palos Verdes Peninsula Land Conservancy',
  },
  {
    id: 'white-point', number: '24', name: 'White Point Nature Preserve', city: 'San Pedro', arc: 'south-arc', band: 'Outer south',
    modes: ['flow', 'stretch', 'art', 'nature', 'quiet'], surface: 'Restored coastal sage · accessible trail · native garden',
    use: 'A long-view restoration room: accessible trail pacing, native-plant shapes, former-military landscape history, and a Catalina-facing close.',
    officialNote: 'The operating conservancy describes a restored 102-acre preserve, native demonstration garden, exhibits, and accessible trails.',
    check: 'The center has limited weekly hours while trails use dawn-to-dusk guidance; confirm access and parking route.', cost: 'Free parking and trail access listed',
    source: 'https://pvplc.org/educate/', sourceLabel: 'Palos Verdes Peninsula Land Conservancy',
  },
  {
    id: 'abalone-cove', number: '25', name: 'Abalone Cove Park / Reserve', city: 'Rancho Palos Verdes', arc: 'south-arc', band: 'Outer south',
    modes: ['flow', 'stretch', 'nature', 'quiet'], surface: 'Bluff · trails · marine reserve edge',
    use: 'A check-first coastal geology and tide-edge room: bluff views, bounded trail movement, no-take attention, and a leave-it-there practice.',
    officialNote: 'The City lists bluffs, trails, beaches, tide pools, restrooms, and an adjoining State Marine Conservation Area.',
    check: 'Several trails and beach access may be closed due to land movement. Read the current City alert and trail map before travel; never collect tide life.', cost: 'Park entry free · paid parking',
    source: 'https://www.rpvca.gov/1178/Abalone-Cove-Shoreline-Park-Reserve', sourceLabel: 'City of Rancho Palos Verdes',
  },
];

export const OUTDOOR_GAMES = [
  { id: 'court-compass', number: '01', title: 'Court Compass', modes: ['court', 'social'], people: '2–8', kit: 'One ball', time: '12 min', rule: 'Choose north, south, east, and west edges. Every completed pass must visit a new direction. A dropped ball resets direction—not score.', close: 'End after the group completes one clean compass.' },
  { id: 'ten-touch', number: '02', title: 'Ten-Touch Rally', modes: ['court', 'field'], people: '2–10', kit: 'Ball, shuttle, or soft disc', time: '10 min', rule: 'Count consecutive cooperative touches. After ten, make the space one step wider or switch the non-dominant side.', close: 'Keep the highest clean rally; no elimination.' },
  { id: 'shadow-relay', number: '03', title: 'Shadow Relay', modes: ['flow', 'art'], people: '2–12', kit: 'None', time: '8 min', rule: 'One person makes a five-move shadow phrase. The next person repeats it and adds one move. Stay in a clear, flat boundary.', close: 'Finish with everyone performing the final phrase together.' },
  { id: 'bench-to-bench', number: '04', title: 'Bench to Bench', modes: ['flow', 'stretch', 'quiet'], people: '1–6', kit: 'None', time: '15 min', rule: 'Walk between three public seats. At each, do one gentle reset, notice one detail, and leave the seat available to others.', close: 'Name the most comfortable interval, not the fastest lap.' },
  { id: 'sculpture-echo', number: '05', title: 'Sculpture Echo', modes: ['art', 'stretch'], people: '1–8', kit: 'Paper optional', time: '10 min', rule: 'Choose one public artwork or plant form. Translate its line into a standing gesture or ten-second air drawing. Do not touch or climb.', close: 'Share what the form made you notice.' },
  { id: 'color-census', number: '06', title: 'Five-Color Census', modes: ['art', 'nature', 'quiet'], people: '1–10', kit: 'Paper optional', time: '12 min', rule: 'Find five colors already present. Each person must choose a different source: built, planted, sky, ground, or moving.', close: 'Arrange the colors into a temporary verbal palette; leave every source in place.' },
  { id: 'bird-minute', number: '07', title: 'Bird Minute', modes: ['nature', 'quiet'], people: '1–12', kit: 'Timer optional', time: '5 min', rule: 'Stand or sit still for one minute. Count distinct directions of bird sound, not species. Repeat once after walking.', close: 'Compare the two sound maps without feeding, calling, or approaching wildlife.' },
  { id: 'sound-postcard', number: '08', title: 'Sound Postcard', modes: ['art', 'nature', 'quiet'], people: '1–8', kit: 'Paper optional', time: '10 min', rule: 'Write or speak three layers: nearest sound, repeating sound, farthest sound. No recording required.', close: 'Trade postcards or keep yours private.' },
  { id: 'horizon-count', number: '09', title: 'Horizon Count', modes: ['stretch', 'quiet'], people: '1–20', kit: 'None', time: '6 min', rule: 'Face the longest view. Take five easy breaths, then name five depths from near to far without judging them.', close: 'Turn away slowly and notice what returns to the foreground.' },
  { id: 'slowest-lap', number: '10', title: 'The Slowest Lap', modes: ['flow', 'social', 'quiet'], people: '2–10', kit: 'None', time: '10 min', rule: 'Travel a short, clear loop together. The group succeeds when nobody is hurried and the formation stays passable.', close: 'The last person across is not the loser; there is no loser.' },
  { id: 'ground-rule', number: '11', title: 'Ground-Rule Game', modes: ['field', 'social'], people: '4–20', kit: 'Ball or soft disc', time: '20 min', rule: 'The site supplies three rules: a visible boundary, one protected quiet zone, and one reset point. The group adds only two more.', close: 'Play to a time, not a blowout; revise one rule after.' },
  { id: 'golden-hour-close', number: '12', title: 'Golden-Hour Close', modes: ['art', 'social', 'quiet'], people: '1–20', kit: 'None', time: '8 min', rule: 'Everyone chooses one west-facing color, sound, or temperature change. Share in a single sentence or keep silence.', close: 'Pack out, count the group, and leave before the place asks you to.' },
] as const;

export const OUTDOOR_RESETS = [
  { id: 'arrive', title: 'Arrive through the feet', duration: '45 sec', instruction: 'Stand or sit securely. Feel heel, outer foot, and big-toe base. Shift only as far as balance stays easy.', option: 'Seated: press each foot gently into the ground.' },
  { id: 'ankles', title: 'Ankle alphabet', duration: '60 sec', instruction: 'Lift one foot only if stable and draw small letters with the toes. Change sides before the ankle tires.', option: 'Keep the heel down and trace small side-to-side arcs.' },
  { id: 'calves', title: 'Calf tide', duration: '45 sec', instruction: 'Use a wall, rail, or bench back only if it is meant for support. Rise onto both feet, pause, and lower slowly five times.', option: 'Seated: alternate lifting heels.' },
  { id: 'shoulders', title: 'Shoulder weather', duration: '45 sec', instruction: 'Make five small backward circles, five forward, then let the arms hang. Keep the neck quiet.', option: 'Move one shoulder at a time.' },
  { id: 'hips', title: 'Easy figure four', duration: '60 sec', instruction: 'Seated on a stable chair or bench, place one ankle over the opposite lower leg only if comfortable. Hinge forward slightly.', option: 'Keep both feet down and let one knee open a little to the side.' },
  { id: 'horizon', title: 'Long-view exhale', duration: '60 sec', instruction: 'Let the eyes rest on a comfortable distant point. Breathe normally and allow the exhale to become a little longer.', option: 'Eyes can stay lowered or closed if that feels safer.' },
] as const;

export const DAY_RECIPES = [
  { id: 'soft-coast', company: ['solo', 'pair'], energy: ['soft'], texture: ['coast'], time: ['45'], title: 'Soft Coast', resourceIds: ['dockweiler', 'bruces-beach', 'hermosa-beach', 'palisades-park'], resetId: 'horizon', gameId: 'sound-postcard', sequence: ['Arrive without a target', 'Take one short out-and-back', 'Make a three-layer sound postcard', 'Close on the longest view'] },
  { id: 'court-coast', company: ['pair', 'group'], energy: ['move', 'full'], texture: ['court', 'coast'], time: ['120', 'half'], title: 'Court + Coast', resourceIds: ['recreation-park', 'manhattan-heights', 'venice-beach-rec', 'wilson-park'], resetId: 'shoulders', gameId: 'ten-touch', sequence: ['Warm up below game speed', 'Build one cooperative rally', 'Walk until conversation changes', 'Finish with a no-score round'] },
  { id: 'garden-lines', company: ['solo', 'pair', 'group'], energy: ['soft', 'move'], texture: ['art'], time: ['45', '120'], title: 'Garden Lines', resourceIds: ['library-park', 'polliwog', 'tongva-park', 'south-coast-botanic'], resetId: 'arrive', gameId: 'sculpture-echo', sequence: ['Choose one line in the landscape', 'Echo it without touching', 'Find five supporting colors', 'Leave one sentence for yourself'] },
  { id: 'wetland-quiet', company: ['solo', 'pair'], energy: ['soft'], texture: ['nature'], time: ['45', '120'], title: 'Wetland Quiet', resourceIds: ['polliwog', 'hopkins-wilderness', 'madrona-marsh', 'george-f-canyon'], resetId: 'horizon', gameId: 'bird-minute', sequence: ['Read the habitat rules', 'Walk one slow circuit', 'Listen twice from different points', 'Leave every living thing in place'] },
  { id: 'field-social', company: ['group'], energy: ['move', 'full'], texture: ['field', 'court'], time: ['120', 'half'], title: 'Open Field Social', resourceIds: ['campus-el-segundo', 'valley-park', 'culver-city-park', 'kenneth-hahn'], resetId: 'calves', gameId: 'ground-rule', sequence: ['Agree on a small visible boundary', 'Protect one quiet edge', 'Play to time and revise one rule', 'Count people and equipment out'] },
  { id: 'long-line', company: ['solo', 'pair', 'group'], energy: ['move', 'full'], texture: ['coast', 'nature'], time: ['120', 'half'], title: 'The Long Line', resourceIds: ['ballona-creek', 'baldwin-hills-overlook', 'white-point', 'abalone-cove'], resetId: 'ankles', gameId: 'slowest-lap', sequence: ['Choose the turnaround before starting', 'Make three no-purchase stops', 'Let the slowest pace set the group', 'Turn around with energy still in reserve'] },
] as const;

export const FIELD_ETIQUETTE = [
  'Check the official page again before leaving. Hours, closures, permits, reservations, water quality, fire conditions, and construction change.',
  'A public door is not an empty door. Programs, neighbors, wildlife, maintenance crews, and existing court customs already occupy the place.',
  'Look and draw; do not collect shells, rocks, plants, animals, artifacts, or tide-pool life. Follow every preserve and marine-protected-area rule.',
  'Use only existing courts, paths, lawns, picnic areas, designated fire rings, and legal access points. Do not install, stake, mark, climb, or alter the site.',
  'Keep pathways, access mats, ramps, benches, and sightlines available. Choose adaptations that keep the invitation open.',
  'Bring less sound than the place can absorb. Amplification, vendors, large groups, structures, classes, and organized events may require permission.',
  'Stop any movement that causes pain, dizziness, numbness, unusual shortness of breath, or loss of balance. The reset deck is general recreation, not medical advice.',
  'Pack out everything, count people and equipment, and leave before conditions, fatigue, darkness, tides, or closing rules make the decision for you.',
] as const;

export const SOURCE_DESK = [
  { label: 'El Segundo Recreation & Parks', url: 'https://www.elsegundorecparks.gov/parks-facilities/parks-facilities-directory', note: 'Official city directory for the center parks, fields, reservations, and current project notices.' },
  { label: 'LA County Beaches & Harbors', url: 'https://beaches.lacounty.gov/', note: 'Official beach and marina facility pages, rules, access information, and live advisories.' },
  { label: 'South Bay city park desks', url: 'https://www.manhattanbeach.gov/visitors/parks-and-facilities', note: 'City facility pages for Manhattan Beach, Hermosa Beach, Redondo Beach, and Torrance are linked on each resource card.' },
  { label: 'Westside and hill park desks', url: 'https://www.culvercity.org/Explore/Parks-Recreation', note: 'Culver City, LA City, LA County, California State Parks, and Santa Monica source each public door directly.' },
  { label: 'Peninsula habitat desks', url: 'https://pvplc.org/lands/', note: 'City and operating-conservancy pages carry current preserve, nature-center, trail, closure, and no-take context.' },
] as const;
