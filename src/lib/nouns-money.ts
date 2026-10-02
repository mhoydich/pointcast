export const MONEY = {
  schema: 'pointcast.nouns-money/v1',
  name: 'Nouns Money',
  motto: 'Collect a little. Pass a story.',
  canonical: 'https://pointcast.xyz/nouns-money/',
  machine: 'https://pointcast.xyz/nouns-money.json',
  publishedAt: '2026-10-02',
  status: 'Collectible art concept',
  disclosure: 'Independent collectible art concept directed by Mike Hoydich. Paper artworks for voluntary art trades, never cash. No bank, deposits, cash redemption, financial offer, NFT ownership or Nouns DAO endorsement.',
  built: ['A ten-design digital exhibition using actual numbered Nouns', 'Ten generated Nordic 2027 visual studies', 'A browser-local saved design set with JSON export', 'Original artwork downloads and provenance', 'A read-only machine edition', 'A fictional serial journey example and phased build scope'],
  proposed: ['A printer-proofed physical edition', 'A host-approved art-trade table', 'A moderated, opt-in serial journey service', 'Optional Tezos companion artworks, subject to a separate design and approval'],
  collecting: {
    meaning: 'Save designs you like in this browser. A saved design does not establish possession of a paper note, NFT ownership, a mint or a transfer.',
    storage: 'Browser localStorage, with in-memory fallback if storage is unavailable. No account or server collection record.',
    key: 'pointcast:nouns-money:design-set:v1',
    exports: 'A local JSON list of saved design IDs and public catalog metadata.',
  },
  artwork: {
    license: 'Nouns artwork is CC0; using it does not imply NFT ownership or endorsement.',
    provenance: '/images/nouns-money/provenance.json',
    officialSource: 'https://nouns.wtf/brand',
    sourceContract: '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03',
    sourceChain: 'Ethereum mainnet',
    note: 'Original numbered Nouns retain their pixel shapes and colors in the flat artwork. Physical scenes and Nordic 2027 studies are generated visual interpretations; the exact-source claims apply to Collection 01 flat masters only.',
  },
  download: '/downloads/nouns-money-collection-01.zip',
  noteSpec: {
    status: 'Front-face collectible design prototypes. No manufactured edition or physical proof verified.',
    trimMm: [150, 75], rasterPx: [3600, 1800], previewColorSpace: 'RGB; no calibrated CMYK or spot separation', specimenIds: 'NM-A-0001 through NM-A-0010 identify designs, not unique issued notes',
    meaning: 'Numerals and serials are design details, not monetary amounts or redemption promises.',
    printerHandoff: 'Confirm stock, reverse, bleed, safe area, color profile, ink process and cutting tolerance with the chosen printer; approve a physical proof before a run.',
  },
  exchange: [
    { step: '01', title: 'Find your favorite', body: 'A color, a Noun, a tiny detail. Save a design here. A future physical edition would begin with a printer-approved proof and clear collectible labeling.' },
    { step: '02', title: 'Bring something you made', body: 'At a proposed art table, two willing people could trade a paper note for another artwork or an agreed creative contribution. No cash exchange, deposit or promise to redeem.' },
    { step: '03', title: 'Pass the story', body: 'A future serial page could record an optional story and broad place, with consent and moderation. Keep private names, exact addresses and ownership claims out of the public trail.' },
  ],
  phases: [
    { phase: '00', title: 'The collecting room', status: 'Built in this release', scope: 'Ten original-art designs, a local saved set, portable JSON export, source downloads and an accessible machine edition.', exit: 'Phone and desktop tested; artwork provenance and downloads verified.' },
    { phase: '01', title: 'A small stack', status: 'Proposed · 1–2 weeks', scope: 'Choose one design, prepare both faces with the printer, proof the paper and color, then plan a small labeled pilot edition.', exit: 'Approved physical proof and an explicit materials budget. No printer order or quote assumed.' },
    { phase: '02', title: 'One afternoon together', status: 'Proposed · 1–2 weeks', scope: 'A host-approved art table, display sleeves, a friendly volunteer script and voluntary art trades. Observe which designs people enjoy carrying.', exit: 'Host permission, clear exchange rules and a bounded event budget. No participant or merchant commitments assumed.' },
    { phase: '03', title: 'Serials with stories', status: 'Proposed · 2–3 weeks', scope: 'A serial lookup, opt-in contributions, moderation, correction/removal controls, accessible QR destinations and read-only JSON exports. Explore Tezos companions separately.', exit: 'Privacy and abuse checks, tested recovery and verified pilot stories. Separate authorization for any onchain build.' },
  ],
  localResearch: {
    checkedAt: '2026-10-02',
    likelyReference: 'Citizens Business Bank · 275 Main Street, El Segundo',
    status: 'An operating, unaffiliated branch according to its official locator. Likely reference to Mike’s “citizen”; the intended bank is not certain.',
    source: 'https://www.cbbank.com/locations/el-segundo-business-financial-center/',
    acquisition: 'No sale availability, acquisition, owner permission or bank partnership has been established.',
    propertyStrategy: 'Try a hosted art table or temporary gallery first. Former bank spaces remain a research category; no property price or live lease quote is published.',
    planningSource: 'https://www.elsegundo.gov/government/departments/community-development/planning-division/downtown-specific-plan-update',
  },
  adventure: {
    name: 'Adventure DAO', status: 'Proposed research-and-project collective',
    description: 'People choose a bounded mission; agents research and build. Humans authorize spending and legal or financial decisions. A useful first mission could be a Nouns Money art afternoon.',
    missions: ['Nouns Money · an original-art collecting room and possible pop-up', 'Empty Bank Atlas · read-only research into former branch spaces', 'One Useful Thing / 30 Days · a software or community prototype'],
    disclosure: 'No established DAO governance, token, capital pool, membership offer, fundraising, investment return or acquisition activity is claimed.',
  },
  opinion: { author: 'Codex', text: 'Let people fall for one note before asking them to believe in a whole institution. A great set starts with a favorite; a great journey starts with someone wanting to pass it on.' },
} as const;

export const NOTE_DESIGNS = [
  {
    "id": "nm-01",
    "file": "01-acid-assembly",
    "name": "Acid Assembly",
    "nouns": [
      0
    ],
    "series": "Collection 01",
    "numeral": 1,
    "specimenId": "NM-A-0001"
  },
  {
    "id": "nm-02",
    "file": "02-carnival-five",
    "name": "Carnival Five",
    "nouns": [
      1
    ],
    "series": "Collection 01",
    "numeral": 5,
    "specimenId": "NM-A-0002"
  },
  {
    "id": "nm-03",
    "file": "03-ultra-ten",
    "name": "Ultra Ten",
    "nouns": [
      2
    ],
    "series": "Collection 01",
    "numeral": 10,
    "specimenId": "NM-A-0003"
  },
  {
    "id": "nm-04",
    "file": "04-garden-twenty",
    "name": "Garden Twenty",
    "nouns": [
      3
    ],
    "series": "Collection 01",
    "numeral": 20,
    "specimenId": "NM-A-0004"
  },
  {
    "id": "nm-05",
    "file": "05-team-fifty",
    "name": "Team Fifty",
    "nouns": [
      4
    ],
    "series": "Collection 01",
    "numeral": 50,
    "specimenId": "NM-A-0005"
  },
  {
    "id": "nm-06",
    "file": "06-pink-orbit",
    "name": "Pink Orbit",
    "nouns": [
      5
    ],
    "series": "Collection 01",
    "numeral": 100,
    "specimenId": "NM-A-0006"
  },
  {
    "id": "nm-07",
    "file": "07-orange-index",
    "name": "Orange Index",
    "nouns": [
      6
    ],
    "series": "Collection 01",
    "numeral": 1,
    "specimenId": "NM-A-0007"
  },
  {
    "id": "nm-08",
    "file": "08-paper-edition",
    "name": "Paper Edition",
    "nouns": [
      7
    ],
    "series": "Collection 01",
    "numeral": 5,
    "specimenId": "NM-A-0008"
  },
  {
    "id": "nm-09",
    "file": "09-wave-ten",
    "name": "Wave Ten",
    "nouns": [
      8
    ],
    "series": "Collection 01",
    "numeral": 10,
    "specimenId": "NM-A-0009"
  },
  {
    "id": "nm-10",
    "file": "10-golden-cosmos",
    "name": "Golden Cosmos",
    "nouns": [
      9
    ],
    "series": "Collection 01",
    "numeral": 20,
    "specimenId": "NM-A-0010"
  }
] as const;

export const NORDIC_STUDIES = [
  {
    "file": "01-ice-blue-one",
    "name": "Ice Blue One",
    "referenceNoun": 0,
    "status": "Generated concept art"
  },
  {
    "file": "02-linen-vermilion-five",
    "name": "Linen Vermilion Five",
    "referenceNoun": 1,
    "status": "Generated concept art"
  },
  {
    "file": "03-glacier-mint-ten",
    "name": "Glacier Mint Ten",
    "referenceNoun": 2,
    "status": "Generated concept art"
  },
  {
    "file": "04-lilac-ultramarine-twenty",
    "name": "Lilac Ultramarine Twenty",
    "referenceNoun": 3,
    "status": "Generated concept art"
  },
  {
    "file": "05-salmon-forest-fifty",
    "name": "Salmon Forest Fifty",
    "referenceNoun": 4,
    "status": "Generated concept art"
  },
  {
    "file": "06-rose-charcoal-100",
    "name": "Rose Charcoal 100",
    "referenceNoun": 5,
    "status": "Generated concept art"
  },
  {
    "file": "07-cobalt-chalk-1",
    "name": "Cobalt Chalk One",
    "referenceNoun": 6,
    "status": "Generated concept art"
  },
  {
    "file": "08-sage-copper-5",
    "name": "Sage Copper Five",
    "referenceNoun": 7,
    "status": "Generated concept art"
  },
  {
    "file": "09-pearl-electric-yellow-10",
    "name": "Pearl Electric Yellow Ten",
    "referenceNoun": 8,
    "status": "Generated concept art"
  },
  {
    "file": "10-midnight-teal-silver-20",
    "name": "Midnight Teal Silver Twenty",
    "referenceNoun": 9,
    "status": "Generated concept art"
  }
] as const;
