export const BEACH_COMMONS_V16 = {
  id: 'PC-BEACH-COMMONS-V16',
  edition: 16,
  fieldStudy: '016',
  title: 'The Billion Little New Yorkers',
  dek: 'The oysters did not save the harbor. The project may have saved the idea of a harbor.',
  url: 'https://pointcast.xyz/beach-commons/v16',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v16.json',
  blockUrl: 'https://pointcast.xyz/b/0544',
  publishedAt: '2026-07-29',
  updatedAt: '2026-07-29T15:30:00-07:00',
  status:
    'A reported editorial and community field guide. It announces no restoration project, habitat work, collection, event, partnership, permit, donation drive, or public program.',
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, originating question, and Beach Commons series',
    },
    {
      name: 'Codex / OpenAI',
      role: 'reporting, writing, research, companion curation, design, and implementation',
    },
  ],
} as const;

export const OYSTER_STATS = [
  {
    value: '150M',
    label: 'oysters restored',
    note: 'Current headline count published by Billion Oyster Project.',
  },
  {
    value: '3M lb',
    label: 'shells collected',
    note: 'Restaurant shell diverted into restoration work.',
  },
  {
    value: '40K+',
    label: 'students reached',
    note: 'BOP reports more than 100 participating schools.',
  },
  {
    value: '5.8M',
    label: 'live oysters',
    note: 'Estimated in a six-acre lower Hudson restoration study.',
  },
] as const;

export const SCOREBOARDS = [
  {
    id: 'commons',
    number: '01',
    title: 'Does the human commons reproduce?',
    verdict: 'Yes—convincingly.',
    summary:
      'A restaurant shell becomes classroom material; a classroom becomes a monitoring crew; a monitoring crew becomes harbor literacy. The strongest thing BOP has restored may be the chain of custody between New Yorkers and their water.',
    measures: [
      'Do schools return next term?',
      'Can a child do real, legible work?',
      'Do restaurants, scientists, agencies, and neighbors share one operating loop?',
      'Can participation deepen from field trip to stewardship?',
    ],
  },
  {
    id: 'reef',
    number: '02',
    title: 'Does the living system reproduce?',
    verdict: 'Promising, local, unfinished.',
    summary:
      'Oysters survive, grow, build habitat, and sometimes reproduce. But natural recruitment remains uneven, restoration still depends on hatcheries and hands, and a billion by 2035 requires a pace closer to infrastructure than gardening.',
    measures: [
      'Are oysters surviving through seasons?',
      'Are larvae settling without being placed?',
      'Does biodiversity accumulate around the reef?',
      'Can intervention decline without the system declining too?',
    ],
  },
] as const;

export type RadiusBand = 'near' | 'middle' | 'far';
export type RadiusWork = 'habitat' | 'water' | 'learning' | 'watching';

export const RADIUS_RESOURCES: readonly {
  title: string;
  organization: string;
  band: RadiusBand;
  distance: string;
  work: readonly RadiusWork[];
  invitation: string;
  caution?: string;
  url: string;
}[] = [
  {
    title: 'Read a living shoreline already in progress',
    organization: 'Los Angeles County Beaches & Harbors',
    band: 'near',
    distance: '0–5 miles',
    work: ['habitat', 'learning'],
    invitation:
      'Start at Dockweiler’s dune work: sand fencing, sediment capture, native habitat, and active management on an exposed Pacific beach.',
    caution: 'Observe from established access; dunes are habitat, not a project-material aisle.',
    url: 'https://beaches.lacounty.gov/coastal-resilience/living-shorelines/',
  },
  {
    title: 'Follow the butterfly through the dune',
    organization: 'The Bay Foundation · LAX Dunes',
    band: 'near',
    distance: '0–5 miles',
    work: ['habitat', 'learning'],
    invitation:
      'Learn why coastal buckwheat, weed removal, and long volunteer continuity matter to the endangered El Segundo blue butterfly.',
    caution: 'Check current access and volunteer listings before visiting restoration areas.',
    url: 'https://www.santamonicabay.org/what-we-do/projects/legacy-influence/',
  },
  {
    title: 'Make wastewater visible civic knowledge',
    organization: 'City of El Segundo · Hyperion information',
    band: 'near',
    distance: '0–5 miles',
    work: ['water', 'watching'],
    invitation:
      'Track plant performance, odor reporting, public updates, tours, and advanced water-purification plans. Clean water is mostly infrastructure before it is mascot.',
    url: 'https://www.elsegundo.gov/our-city/hyperion-what-you-need-to-know',
  },
  {
    title: 'Borrow an aquarium’s public doorway',
    organization: 'Roundhouse Aquarium',
    band: 'middle',
    distance: '5–12 miles',
    work: ['learning', 'watching'],
    invitation:
      'Volunteer or visit a free, hands-on marine education room at the end of Manhattan Beach Pier—the smallest useful version of a public field station.',
    url: 'https://roundhouseaquarium.org/volunteer/',
  },
  {
    title: 'Study a wetland without pretending it is uncomplicated',
    organization: 'Friends of Ballona Wetlands',
    band: 'middle',
    distance: '5–12 miles',
    work: ['habitat', 'water', 'learning'],
    invitation:
      'Use education programs, cleanups, and water-quality work to understand a living place whose restoration future is active, technical, and contested.',
    caution: 'A commons can hold disagreement; this listing is a doorway, not an endorsement of one restoration design.',
    url: 'https://ballona.org/projects/educationprograms/',
  },
  {
    title: 'Become a repeat witness',
    organization: 'Los Angeles Waterkeeper',
    band: 'far',
    distance: '12–25 miles',
    work: ['water', 'watching'],
    invitation:
      'Look for MPA Watch and other volunteer science. A coast becomes legible when the same people return, use the same method, and publish what they see.',
    url: 'https://www.lawaterkeeper.org/volunteer/',
  },
  {
    title: 'Connect the classroom to the working harbor',
    organization: 'AltaSea · LA Waterfront STEM Network',
    band: 'far',
    distance: '12–25 miles',
    work: ['learning', 'water'],
    invitation:
      'Follow the emerging network linking AltaSea, Cabrillo Marine Aquarium, Los Angeles Maritime Institute, Battleship Iowa, and LA Harbor College.',
    url: 'https://altasea.org/altasea-launches-los-angeles-waterfront-stem-network-to-build-the-next-generation-of-blue-economy-leaders/',
  },
  {
    title: 'Volunteer where specimens become stories',
    organization: 'Cabrillo Marine Aquarium',
    band: 'far',
    distance: '12–25 miles',
    work: ['learning', 'watching'],
    invitation:
      'Explore education, interpretation, and citizen-science roles at the edge of the Port of Los Angeles.',
    url: 'https://cma.recreation.parks.lacity.gov/get-involved/volunteer-programs',
  },
] as const;

export const FIRST_SEASON = [
  {
    week: '01',
    title: 'The coastline orientation',
    action:
      'Walk one public route from Dockweiler dunes to the Hyperion boundary. Record only what is already public: access, smell, wind, water color, signs, habitat fencing, maintenance, and questions.',
  },
  {
    week: '02',
    title: 'The institution field trip',
    action:
      'Visit or volunteer with one existing organization. Ask how people enter, what useful work a first-timer can do, what requires training, and what keeps regulars returning.',
  },
  {
    week: '03',
    title: 'The two-scoreboard supper',
    action:
      'Bring six neighbors together. Score one local effort twice: once for human continuity and once for ecological reproduction. Do not let attendance masquerade as habitat.',
  },
  {
    week: '04',
    title: 'The public receipt',
    action:
      'Publish one page: what was observed, who already does the work, which claims remain unknown, where to volunteer, and what nobody has permission to touch.',
  },
] as const;

export const COMPANIONS = [
  {
    kind: 'Spotify',
    title: 'Billion Little New Yorkers — Harbor Shift',
    note: 'Post-punk, soul, jazz, disco, ferry light, physical work, and the civic pleasure of a job with other people.',
    url: 'https://open.spotify.com/playlist/3Rv5BAIFyOpcOtTW5kFUdZ?utm_source=openai&utm_medium=chatgpt&go=1&nap_web=1&request_id=1335c59b-c842-4a3c-8bfd-bfe2c8c247c2&nl=spotify%3Anl%3ACAASEBM1xZvIQko8i%2F2%2F4sjCR8IaGDk6M1J2NUJBSUZ5T3BjT3RUVzVrRlVkWiADMAPgAzXoA8epz%2Fn6M%2FADoAQ%3D',
  },
  {
    kind: 'Spotify',
    title: 'Twenty-Five Miles of Pacific — El Segundo Commons',
    note: 'Surf psych, jazz-funk, ambient, Latin, indie, dune wind, bicycle pace, sunrise to blue hour.',
    url: 'https://open.spotify.com/playlist/5hs7CoajyoNu135rQjk4BO?utm_source=openai&utm_medium=chatgpt&go=1&nap_web=1&request_id=d7b89e21-e59e-4507-a390-806a151faeef&nl=spotify%3Anl%3ACAASENe4niHlnkUHo5CAahUfru8aGDk6NWhzN0NvYWp5b051MTM1clFqazRCTyADMAPgAzXoA8jLz%2Fn6M%2FADoAQ%3D',
  },
] as const;

export const PINTEREST_BOARDS = [
  {
    kind: 'Pinterest',
    title: 'LIVING REEFS — Billion Little New Yorkers',
    note: '20 pins: harbor classrooms, shell recycling, working reefs, oyster ecology, and restoration as visible public work.',
    url: 'https://www.pinterest.com/hoydich/living-reefs-billion-little-new-yorkers/',
  },
  {
    kind: 'Pinterest',
    title: '25 MILES OF PACIFIC — El Segundo Commons',
    note: '20 pins: dunes, the El Segundo blue butterfly, wetlands, water monitoring, aquariums, and the working harbor.',
    url: 'https://www.pinterest.com/hoydich/25-miles-of-pacific-el-segundo-commons/',
  },
] as const;

export const OYSTER_SOURCES = [
  {
    label: 'Billion Oyster Project · current project totals',
    url: 'https://www.billionoysterproject.org/',
    use: 'Headline restoration, shell, and student counts.',
  },
  {
    label: 'Billion Oyster Project · STEM education',
    url: 'https://www.billionoysterproject.org/stem-education',
    use: 'School network and student participation.',
  },
  {
    label: 'Billion Oyster Project · FAQ',
    url: 'https://www.billionoysterproject.org/faq',
    use: '2035 goal, methods, and project framing; project pages contain counts from different update cycles.',
  },
  {
    label: 'Successful initial restoration in the lower Hudson River Estuary',
    url: 'https://www.citedrive.com/en/discovery/successful-initial-restoration-of-oyster-habitat-in-the-lower-hudson-river-estuary-scpunited-statesscp/',
    use: 'Peer-reviewed six-acre restoration results, including an estimated 5.8 million live oysters.',
  },
  {
    label: 'Developing a self-sustaining oyster population in Jamaica Bay',
    url: 'https://www.billionoysterproject.org/s/Final-Report-No-Appendicies-Developing-Self-Sustaining-Oyster-Population-in-Jamaica-Bay-1.pdf',
    use: 'Adult survival, growth and reproduction alongside absent observed recruitment.',
  },
  {
    label: 'NYSDEC · Bush Terminal restoration application',
    url: 'https://dec.ny.gov/news/environmental-notice-bulletin/2026-03-25/completed-application/brooklyn-billion-oyster-project',
    use: 'Current scale: a proposed first phase using approximately 22 million spat-on-shell oysters.',
  },
  {
    label: 'NYC DEP · Harbor Water Quality',
    url: 'https://home4.nyc.gov/site/dep/water/harbor-water-quality.page',
    use: 'Long-run harbor improvement and water-quality monitoring context.',
  },
  {
    label: 'NYC DEP · Combined Sewer Overflows',
    url: 'https://www.nyc.gov/site/dep/water/combined-sewer-overflows.page',
    use: 'Why wastewater infrastructure, stormwater, and overflow control remain central.',
  },
  {
    label: 'The New Yorker · The Seas Are Rising. Could Oysters Protect Us?',
    url: 'https://www.newyorker.com/magazine/2021/08/09/the-seas-are-rising-could-oysters-protect-us',
    use: 'A narrative account of the project and the larger oyster-restoration movement.',
  },
] as const;
