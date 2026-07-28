export type SignalShackBench = {
  id: string;
  number: string;
  title: string;
  lane: 'LOW-FI' | 'FIELD-FI' | 'SKY-FI' | 'HI-FI';
  image: string;
  alt: string;
  promise: string;
  build: string;
  groupMove: string;
  boundary: string;
  parts: readonly string[];
};

export const BEACH_COMMONS_V9 = {
  schema: 'https://pointcast.xyz/schemas/field-study/v1',
  id: 'PC-FIELD-STUDY-009',
  edition: 9,
  title: 'SIGNAL SHACK',
  subtitle: 'Beach Commons V9',
  dek: 'The neighborhood electronics counter returns as a public coastal workshop: eight group benches, charming low-fi, ambitious hi-fi, and nothing that needs a feed.',
  url: 'https://pointcast.xyz/beach-commons/v9',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v9.json',
  blockUrl: 'https://pointcast.xyz/b/0526',
  blockId: '0526',
  publishedAt: '2026-07-27',
  previousEdition: {
    title: 'The Beach Blanket Review — Beach Commons V8',
    url: 'https://pointcast.xyz/beach-commons/v8',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v8.json',
  },
  location: {
    name: 'Dockweiler State Beach / El Segundo coast',
    region: 'Los Angeles County, California',
    status:
      'site inspiration only; no event is announced, scheduled, permitted, or affiliated with LA County',
    plausibleCoveredPath:
      'Reserve an authorized indoor or covered civic venue such as the Dockweiler Youth Center, confirm the allowed program and equipment in advance, and keep the beach itself ordinary public beach use.',
  },
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, originating beach-commons idea, and low-fi / hi-fi brief',
    },
    {
      name: 'Codex / OpenAI',
      role: 'current-technology research, concept development, image generation, instrument design, and PointCast edition',
    },
  ],
  thesis: {
    publicCounter:
      'A shared parts counter makes technical confidence social. Nobody needs the whole kit; every person contributes one part, one repair, one observation, or one thing they can teach.',
    spectrum:
      'Low-fi and hi-fi are not ranks. A battery-free crystal receiver can be as magical as local edge AI because each reveals a different layer of how a signal becomes experience.',
    noFeed:
      'The room can be technologically advanced without becoming another attention machine: no television, no scrolling wall, no required account, and no cloud dependency for the central experience.',
  },
  nonAffiliation:
    'SIGNAL SHACK borrows the welcoming spirit of the old neighborhood electronics counter. It is not affiliated with, sponsored by, or endorsed by RadioShack or any electronics retailer.',
  boundary:
    'Unofficial speculative field study only. Not an announced event, beach authorization, venue reservation, construction document, electrical plan, radio-equipment certification, amateur-radio license, emergency network, weather service, retail offer, or invitation to install equipment at Dockweiler.',
} as const;

export const SIGNAL_SHACK_BENCHES: readonly SignalShackBench[] = [
  {
    id: 'parts-counter',
    number: '01',
    title: 'The Public Parts Counter',
    lane: 'LOW-FI',
    image: '/beach-commons/v9/assets/01-public-parts-counter.png',
    alt: 'A large coastal electronics workshop with a horseshoe plywood parts counter, color-sorted drawers, accessible group benches, tools, repaired radios, and the beach visible beyond.',
    promise: 'A neighborhood counter where asking for the tiny weird thing is the beginning of a conversation.',
    build:
      'Eight rolling benches orbit one color-sorted commons. Every tool and component checks out on a physical tray, then comes back before the bell.',
    groupMove:
      'Arrive with one broken object, one useful component, or one thing you know how to do. Leave having taught and learned one move.',
    boundary:
      'Low-voltage bench work in an authorized room; supervised tools, eye protection, accessible heights, protected charging, complete parts count.',
    parts: ['sorted passives', 'meters', 'hand tools', 'repair trays'],
  },
  {
    id: 'crystal-radio',
    number: '02',
    title: 'Crystal Radio Picnic',
    lane: 'LOW-FI',
    image: '/beach-commons/v9/assets/02-crystal-radio-picnic.png',
    alt: 'Children and elders wind copper coils and share headphones around a round plywood crystal-radio worktable overlooking the coast.',
    promise: 'Copper, a diode, an ear: the smallest possible lesson in pulling a signal from the air.',
    build:
      'Wind coils, clip passive circuits, tune slowly, compare antenna and ground demonstrations, and split one quiet receiver across two headphones.',
    groupMove:
      'One person winds, one clips, one logs changes with colored tokens, and one listens. Rotate every eight minutes.',
    boundary:
      'Receive only. Use a safe indoor teaching antenna and qualified mentor; no long exterior wire, transmitter, or exposed mains.',
    parts: ['enameled wire', 'ferrite rod', 'diode', 'high-impedance earphone'],
  },
  {
    id: 'cassette-sun',
    number: '03',
    title: 'Cassette Sun Station',
    lane: 'LOW-FI',
    image: '/beach-commons/v9/assets/03-cassette-sun-station.png',
    alt: 'A warm coastal cassette and analog-synth repair lab with solar tray, amber patch bay, many headphones, tape loops, and people dancing quietly.',
    promise: 'Repair the transport, catch a wave texture, cut a loop, and make the quietest dance floor on the coast.',
    build:
      'Re-belt cassette decks, make short physical loops, build contact microphones, then route tape and tiny synth voices through a four-way headphone patch.',
    groupMove:
      'Every team contributes exactly thirty seconds: wave texture, machine rhythm, voice-free field sound, or hand-built oscillator.',
    boundary:
      'Headphones and near-field testing inside the approved room; no amplified beach music, unattended batteries, or recording of private conversation.',
    parts: ['cassette deck', 'belt kit', 'piezo disc', 'headphone splitter'],
  },
  {
    id: 'mesh-lanterns',
    number: '04',
    title: 'Mesh Message Lanterns',
    lane: 'FIELD-FI',
    image: '/beach-commons/v9/assets/04-mesh-message-lanterns.png',
    alt: 'A blue-hour group workshop assembling orange, cream, and blue radio lanterns around a tabletop mesh made from cord and glowing nodes.',
    promise: 'Short local messages move from lantern to lantern even when the room chooses to stay offline.',
    build:
      'Fit certified low-power LoRa modules into repairable cases, keep stock antennas intact, and use a tabletop token game to understand store-and-forward routing.',
    groupMove:
      'Write a short practical message, hand its matching wooden token to the next bench, and watch the digital and physical routes diverge.',
    boundary:
      'Certified modules and stock antennas only. Local experimental messaging is not guaranteed coverage, emergency service, or permission to modify a transmitter.',
    parts: ['certified LoRa node', 'stock antenna', 'USB-C power', 'repairable case'],
  },
  {
    id: 'weather-ear',
    number: '05',
    title: 'Weather Ear',
    lane: 'FIELD-FI',
    image: '/beach-commons/v9/assets/05-weather-ear.png',
    alt: 'An open coastal sensor workshop filled with tabletop instruments, perforated housings, wind ribbons, accessible benches, and people comparing hand-built observations.',
    promise: 'Turn wind, pressure, warmth, humidity, and texture into light, pen movement, and private sound.',
    build:
      'Combine a compact microcontroller with environmental sensors, an analog reference, and one non-screen output: beads, light, a pen trace, or headphones.',
    groupMove:
      'Half the table predicts what changed; half reads the instruments. Trade sides, then discuss where the devices disagree.',
    boundary:
      'A learning instrument, not a forecast or air-quality authority; no faces, biometrics, wildlife tags, drones, kites, exterior mast, or permanent station.',
    parts: ['microcontroller', 'environment sensor', 'analog reference', 'physical output'],
  },
  {
    id: 'weather-window',
    number: '06',
    title: 'GOES Weather Window',
    lane: 'SKY-FI',
    image: '/beach-commons/v9/assets/06-goes-weather-window.png',
    alt: 'A night receive-only radio workshop with vintage instruments, amber acrylic sculpture, public satellite-inspired cloud imagery, weaving, prints, and headphones.',
    promise: 'Receive public weather imagery from space, then translate clouds into print, weaving, light, and sound.',
    build:
      'A mentored receive-only SDR table introduces filters, antennas, public GOES data, and the difference between receiving a signal and transmitting one.',
    groupMove:
      'Radio listeners describe structure; artists answer without copying the display. The finished weather window belongs to both teams.',
    boundary:
      'Receive-only demonstration with authorized equipment and placement. No transmission, hacked satellite, emergency interception, or giant command screen.',
    parts: ['receive-only SDR', 'filters', 'shielded cable', 'authorized receiving antenna'],
  },
  {
    id: 'offline-ai',
    number: '07',
    title: 'Offline AI Repair Bench',
    lane: 'HI-FI',
    image: '/beach-commons/v9/assets/07-offline-ai-repair-bench.png',
    alt: 'A sunset electronics repair room with a transparent amber local-computing enclosure, magnifiers, meters, sorted components, repaired fans, and people examining circuit boards.',
    promise: 'Use a small local model as a bench assistant—visible, offline, fallible, and always subordinate to human judgment.',
    build:
      'A local accelerator helps sort components, compare healthy and failing bearing sounds, and point a board-only camera toward possible solder defects.',
    groupMove:
      'One person asks, one verifies with a meter, one finds the service evidence, and one gets to disagree with the machine.',
    boundary:
      'Offline by default; no faces, personal data, surveillance, cloud account, autonomous repair decision, or claim that a model makes equipment safe.',
    parts: ['single-board computer', 'local AI accelerator', 'board camera', 'physical network switch'],
  },
  {
    id: 'quiet-hifi',
    number: '08',
    title: 'Quiet Hi-Fi Assembly',
    lane: 'HI-FI',
    image: '/beach-commons/v9/assets/08-quiet-hifi-assembly.png',
    alt: 'A dense sunset community electronics assembly centered on a branching headphone tree, amber modular audio equipment, patch cables, turntables, and silent dancing.',
    promise: 'Every bench becomes one channel in a collective instrument nobody outside the room has to hear.',
    build:
      'Patch repaired transports, contact microphones, analog preamps, local signal processing, meters, light objects, and a many-branch headphone tree.',
    groupMove:
      'Each bench sends one restrained layer. The final mix succeeds only when the group leaves enough space to hear everyone else.',
    boundary:
      'Headphone-first and permitted indoor listening; cable covers, safe levels, protected power, accessible paths, and a complete same-night pack-out.',
    parts: ['headphone distribution', 'modular preamps', 'limiter', 'tactile controller'],
  },
] as const;

export const SIGNAL_SHACK_LANES = [
  {
    id: 'low-fi',
    title: 'LOW-FI',
    color: '#ef6a2e',
    thesis: 'Few parts. Huge revelation.',
    benchIds: ['crystal-radio', 'cassette-sun'],
  },
  {
    id: 'field-fi',
    title: 'FIELD-FI',
    color: '#2f796f',
    thesis: 'Sense locally. Coordinate modestly.',
    benchIds: ['mesh-lanterns', 'weather-ear'],
  },
  {
    id: 'sky-fi',
    title: 'SKY-FI',
    color: '#315ac8',
    thesis: 'Receive the larger public signal.',
    benchIds: ['weather-window'],
  },
  {
    id: 'hi-fi',
    title: 'HI-FI',
    color: '#9b3859',
    thesis: 'Complex tools, transparent limits.',
    benchIds: ['offline-ai', 'quiet-hifi'],
  },
] as const;

export const SIGNAL_SHACK_ROLES = [
  { id: 'repair', title: 'Repair', move: 'Bring one object back from almost-broken.' },
  { id: 'receive', title: 'Receive', move: 'Tune a signal without becoming a broadcaster.' },
  { id: 'sound', title: 'Sound', move: 'Contribute one quiet layer to the headphone mix.' },
  { id: 'sense', title: 'Sense', move: 'Compare a hand observation with an instrument.' },
  { id: 'power', title: 'Power', move: 'Count watts, isolate batteries, close the locker.' },
  { id: 'parts', title: 'Parts', move: 'Keep the counter legible and every tray complete.' },
  { id: 'teach', title: 'Teach', move: 'Show one move slowly enough to be repeated.' },
  { id: 'pack', title: 'Pack', move: 'Find the last wire and leave no component behind.' },
] as const;

export const SIGNAL_SHACK_CYCLE = [
  { minute: '00', title: 'Ring the parts bell', detail: 'Choose a role, take one tray, name one question.' },
  { minute: '08', title: 'Make one visible change', detail: 'Wind, solder, repair, route, measure, or draw.' },
  { minute: '18', title: 'Trade benches', detail: 'The next group inherits both the object and the explanation.' },
  { minute: '26', title: 'Listen together', detail: 'Headphones on. Screens down. Compare what changed.' },
  { minute: '30', title: 'Return the tray', detail: 'Count every part, record the repair, rotate or pack.' },
] as const;

export const SIGNAL_SHACK_CURRENT_TECH = [
  {
    title: 'Local mesh messaging',
    now: 'Meshtastic describes an open-source, off-grid, decentralized LoRa mesh with low-power devices and regional radio settings.',
    use: 'A small, clearly bounded store-and-forward teaching network using certified devices and stock antennas.',
    source: 'https://meshtastic.org/',
    sourceLabel: 'Meshtastic official project',
  },
  {
    title: 'Small local AI',
    now: 'Raspberry Pi documents 13, 26, and 40 TOPS accelerator options for Raspberry Pi 5, including local generative models on AI HAT+ 2.',
    use: 'Component sorting, board-only inspection, and sound comparison with the network physically disconnected.',
    source: 'https://www.raspberrypi.com/documentation/accessories/ai-hat-plus.html',
    sourceLabel: 'Raspberry Pi AI HAT documentation',
  },
  {
    title: 'Tiny environmental sensing',
    now: 'Arduino’s Nicla Sense ME combines motion and environmental sensing in a compact low-power form; Nano ESP32 adds Wi-Fi, Bluetooth, MicroPython, and USB-C.',
    use: 'Tabletop instruments that express readings through light, motion, pen, and headphones—not an authority dashboard.',
    source: 'https://docs.arduino.cc/hardware/nicla-sense-me',
    sourceLabel: 'Arduino Nicla Sense ME',
  },
  {
    title: 'Public weather from space',
    now: 'NOAA’s HRIT/EMWIN service distributes GOES imagery, warnings, and environmental data in an open format without a NOAA receive fee or license.',
    use: 'A qualified receive-only SDR demonstration that turns public weather data into collective art.',
    source: 'https://www.ospo.noaa.gov/operations/goes/hrit/index.html',
    sourceLabel: 'NOAA HRIT/EMWIN',
  },
] as const;

export const SIGNAL_SHACK_REALITY_PATHS = [
  {
    id: 'table',
    title: 'Path A / One legal table',
    status: 'Start smallest',
    description:
      'A private skill-share at an ordinary picnic or community table: battery-free radio experiments, repaired cassette players, hand tools, headphones, and a strict parts count. No organized public event claim.',
  },
  {
    id: 'room',
    title: 'Path B / Reserve the room',
    status: 'Most credible V9',
    description:
      'Ask LA County about reserving the Dockweiler Youth Center multipurpose room, describe the electronics program and all equipment, confirm insurance and rules, and keep the radio, soldering, charging, and listening inside the approved footprint.',
  },
  {
    id: 'partner',
    title: 'Path C / Partner laboratory',
    status: 'Advanced version',
    description:
      'Work with a library, school, amateur-radio club, repair café, university lab, or civic maker group that can provide qualified instructors, equipment controls, accessibility, and a safer inland venue.',
  },
] as const;

export const SIGNAL_SHACK_RULES = [
  {
    title: 'Venue before spectacle',
    detail:
      'This is not an announced beach event. LA County says organized activities and larger groups may require permits; reserve and disclose the actual program before gathering.',
    source: 'https://beaches.lacounty.gov/dockweiler-youth-center/',
    sourceLabel: 'Dockweiler Youth Center',
  },
  {
    title: 'Quiet means quiet',
    detail:
      'LA County beach rules prohibit amplified music. Use headphones, acoustic objects, and any approved indoor listening level.',
    source: 'https://beaches.lacounty.gov/la-county-beach-rules/',
    sourceLabel: 'LA County Beach Rules',
  },
  {
    title: 'Certified radio only',
    detail:
      'Part 15 devices must meet authorization and interference rules. Use certified modules and supplied antennas; licensed operators control any amateur transmission.',
    source: 'https://docs.fcc.gov/public/attachments/DA-24-782A1.pdf',
    sourceLabel: 'FCC Part 15 advisory',
  },
  {
    title: 'No battery drama',
    detail:
      'Use enclosed protected packs, supervised charging, fire-resistant isolation, cable covers, and a stop plan. Keep batteries and electronics away from saltwater and fire rings.',
    source: 'https://beaches.lacounty.gov/dockweiler-beach-fire-pits/',
    sourceLabel: 'LA County fire-pit rules',
  },
  {
    title: 'Habitat is not a test zone',
    detail:
      'Dockweiler includes a fenced western snowy plover enclosure. No devices, antennas, lights, sound experiments, people, or storage enter protected habitat.',
    source: 'https://beaches.lacounty.gov/dockweiler-beach/',
    sourceLabel: 'LA County Dockweiler visitor page',
  },
  {
    title: 'Every wire comes home',
    detail:
      'Small components are litter waiting to happen. Work over trays, count before and after, use lidded rolling cabinets, and stop when wind defeats containment.',
    source: 'https://beaches.lacounty.gov/la-county-beach-rules/',
    sourceLabel: 'LA County Beach Rules',
  },
] as const;

export const SIGNAL_RACK_VOICES = [
  { id: 'crystal', label: 'Crystal ping', color: '#ffb12b', hint: 'one clean carrier' },
  { id: 'tape', label: 'Tape wobble', color: '#ef6a2e', hint: 'a repaired loop' },
  { id: 'mesh', label: 'Mesh pulse', color: '#4fae9a', hint: 'three small hops' },
  { id: 'weather', label: 'Weather hiss', color: '#8ed1c8', hint: 'filtered air' },
  { id: 'sky', label: 'Sky sweep', color: '#6b8cff', hint: 'receive only' },
  { id: 'hifi', label: 'Hi-fi chord', color: '#e35f92', hint: 'room for everyone' },
] as const;
