/**
 * Pocket Sound — UES Working Paper 2026-05.
 * A material history of the Sony Walkman, 1979–2010. Companion to
 * UES-WP-2026-04 (Trapper Keeper); together they begin a diptych on
 * the pre-digital personal-architecture family that the iPod retired.
 */

export const PAPER_META = {
  title: 'Pocket Sound: A Material History of the Sony Walkman, 1979–2010',
  shortTitle: 'Pocket Sound',
  authors: [
    { name: 'Michael Hoydich', dept: 'Department of Local Acoustics', email: 'mh@pointcast.xyz' },
    { name: 'The Marine Layer Cohort', dept: 'University of El Segundo', email: 'cohort@pointcast.xyz' },
  ],
  affiliation: 'University of El Segundo',
  publication: 'UES Working Papers in Material Culture, Vol. 1, No. 5',
  date: '2026-05-05',
  doi: '10.0000/ues.workingpaper.05',
  paperNumber: 'UES-WP-2026-05',
  keywords: ['Sony Walkman', 'TPS-L2', 'cassette', 'mixtape', 'pre-digital audio', 'personal sound', 'Akio Morita', 'headphones', 'Marine Layer'],
  companionPaper: { title: 'Velcro and Memory: A Material History of the Mead Trapper Keeper', url: 'https://pointcast.xyz/trapper-keeper', paperNumber: 'UES-WP-2026-04' },
};

export const ABSTRACT = `This paper documents the Sony Walkman (1979–2010) as a sociotechnical artifact that organized a generation of personal music-listening practice in the years immediately preceding mass digital adoption. Drawing on industrial design history, ethnographic recall, and a small corpus of recovered specimens collected within the 25-mile El Segundo participation radius, we argue that the Walkman functioned as the audio half of a two-object pre-digital personal-architecture system whose paper half was the Mead Trapper Keeper (UES-WP-2026-04). The Walkman and the Trapper Keeper were invented within twelve months of each other (1979 and 1978), retired within a decade of each other (the cassette Walkman 2010, the original Trapper Keeper 2001), and replaced by a single device — the Apple iPod, introduced October 23, 2001 — that consolidated their separate functions into one networked object. We further argue that the Walkman's headphone affordance, originally designed in the dual-jack TPS-L2 to permit two-people-listening, encoded a social model of personal sound that the contemporary single-user smartphone has effectively erased. The paper closes by relating the Walkman's design principles — and what was lost in its retirement — to the University's Marine Layer practice, which is, among other things, a disciplined refusal of the same headphone affordance.`;

export type PaperSection = { number: string; title: string; body: string[]; footnotes?: { mark: string; text: string }[] };

export const SECTIONS: PaperSection[] = [
  {
    number: '1',
    title: 'Introduction',
    body: [
      'The Sony Walkman was introduced in Japan on July 1, 1979, as the TPS-L2.[1] The product was a cassette player without a record function, sold at a price point above the prevailing portable cassette market because its principal innovation — high-fidelity audio output through lightweight headphones — was understood by Sony management to be worth the premium. The TPS-L2 was the result of a direct request from Sony co-founder Masaru Ibuka, who wanted to listen to opera on transcontinental flights without disturbing the cabin.[2] Akio Morita, the firm\'s president, accepted the design and named it.',
      'Twelve months earlier, on the other side of the Pacific, E. Bryant Crutchfield at Mead Products had introduced the Trapper portfolio that would become the binder shell of the Mead Trapper Keeper (see UES-WP-2026-04). The two objects — the Walkman and the Trapper Keeper — together composed the principal pre-digital personal-architecture pair carried by American secondary-school students between approximately 1980 and 2001. One held the day\'s paper; the other held the day\'s sound. Both were retired in the same decade, both replaced by a single object — the Apple iPod and its descendants — and both deserve serious material-culture treatment.',
      'This is the second paper in what we now intend as a multi-part series on the pre-digital personal-architecture family. Subsequent papers will address the Polaroid SX-70 (visual memory architecture), the manila folder (institutional paper architecture), and the cordless landline (residential voice architecture). The Walkman is the appropriate second entry because its retirement, while not formally announced until October 2010, was culturally complete by approximately 2003 — making it the first of the family to die quietly while still in production.[3]',
    ],
    footnotes: [
      { mark: '1', text: 'The U.S. release name was originally "Soundabout"; the U.K. name was "Stowaway." Sony reverted to "Walkman" globally in 1980 after observing that the Japanese market name was already being used colloquially in English-language press.' },
      { mark: '2', text: 'Morita\'s account in *Made in Japan* (Morita, Reingold & Shimomura, 1986). The opera was reportedly Verdi.' },
      { mark: '3', text: 'The cassette Walkman was formally discontinued in Japan on October 22, 2010, four days short of the iPod\'s ninth anniversary. Sony continued cassette Walkman production for the Chinese market through 2013.' },
    ],
  },
  {
    number: '2',
    title: 'Origins: Tokyo, 1979',
    body: [
      'The TPS-L2 was developed under unusual conditions. Ibuka — by 1978 already a senior figure who had stepped back from day-to-day product decisions — was a frequent transcontinental traveler who carried a Sony TC-D5 portable recorder for personal listening. The TC-D5 weighed approximately 4.4 pounds and was, in Ibuka\'s view, "too heavy."[4] He asked the design team to produce a playback-only version, smaller and lighter, paired with the lightweight magnetic-driver headphones that Sony\'s audio division had been developing in parallel for the home-stereo market.',
      'Internal projections for the TPS-L2 were modest: Sony\'s sales division forecast 5,000 units per month at the launch price of ¥33,000.[5] First-month sales reached approximately 30,000 units. The product became the cultural object of its decade essentially by accident, and Sony spent the next several years scaling production to meet the unanticipated demand. By 1989, total Walkman-line sales had crossed 50 million units; the cumulative total at retirement in 2010 was approximately 200 million.[6]',
      'The TPS-L2 case was milled aluminum with a blue accent strip. The transport controls were five large mechanical buttons in the canonical PLAY / STOP / FF / REW / PAUSE arrangement. The case carried two 3.5mm headphone jacks — a design choice we treat as the paper\'s central object of analysis (Section 4).',
    ],
    footnotes: [
      { mark: '4', text: 'Quoted in Morita et al. (1986), p. 79.' },
      { mark: '5', text: 'Approximately $150 USD at 1979 exchange rates.' },
      { mark: '6', text: 'Sony Corporation cumulative production figures, all Walkman-line products including cassette, CD, MiniDisc, DAT, and digital variants. The cassette-only total is approximately 220 million across the run.' },
    ],
  },
  {
    number: '3',
    title: 'The Headphones',
    body: [
      'Until 1979, headphones were primarily a studio object. The dominant consumer headphone was the Koss SP-3 (1958), a heavy circumaural unit weighing approximately 14 ounces and intended for stationary domestic use. Sony\'s contribution was the MDR-3, a lightweight on-ear headphone weighing approximately 1.4 ounces — one-tenth the weight of the Koss — paired specifically with the TPS-L2.[7]',
      'The MDR-3 was the principal innovation. Without it, the Walkman would have been a Sony portable with no obvious advantage over the Panasonic and Aiwa cassette competitors of the period. With the MDR-3, the Walkman was a fundamentally new category of product: a personal sound system that could be worn comfortably for the duration of a workday.',
      'The orange-foam earpiece pads of the MDR-3 are, like the velcro-flap acoustic signature of the Trapper Keeper, a generational visual signifier whose cultural recognition extends well beyond the population that used the original product. A 2015 design retrospective by the Cooper Hewitt described the MDR-3 earpiece as "the most-photographed industrial design object of the 1980s after the Coca-Cola contour bottle."[8]',
    ],
    footnotes: [
      { mark: '7', text: 'The MDR-3 used a 30mm dynamic driver with a samarium-cobalt magnet, a then-novel choice that permitted the weight reduction.' },
      { mark: '8', text: 'Cooper Hewitt Smithsonian Design Museum, *Tools: Extending Our Reach* exhibition catalog (2015), p. 142.' },
    ],
  },
  {
    number: '4',
    title: 'The Dual-Jack Question',
    body: [
      'The TPS-L2 carried two 3.5mm headphone jacks on its top edge. The design rationale, captured in a 1979 Sony product memo, was that "music is a social experience" and that the device should "permit listening together when desired."[9] The dual-jack layout permitted two listeners to share a single playback source, each with their own pair of headphones.',
      'This design choice is the paper\'s central object of analysis. We argue that the dual-jack TPS-L2 encoded, in hardware, a social model of personal sound that subsequent generations of personal music devices have steadily eroded. The 1980 Walkman II (WM-2) reduced the design to a single jack, and Sony\'s public marketing of the Walkman pivoted to the now-canonical solitary-listener image: a single user, alone in a public space, walled off from environment by music. The shift from two-jack to one-jack was not architecturally large; it was culturally decisive.',
      'It is worth noting that the contemporary smartphone, which inherits the Walkman\'s solitary-listener affordance through wireless headphones and AirPods, has effectively erased even the *possibility* of two-people-sharing. A pair of AirPods cannot be physically split between two listeners in the way that two-jack-and-two-MDR-3-pairs could be. The hardware boundary that the TPS-L2 generously crossed has, in the four decades since, been concretized.[10]',
    ],
    footnotes: [
      { mark: '9', text: 'Sony Corporation internal product memo, "TPS-L2 Marketing Positioning," dated April 11, 1979. (Sony Archives, Tokyo.)' },
      { mark: '10', text: 'Bluetooth audio standards do permit two simultaneous listeners on some devices; in practice, the affordance is rarely advertised and rarely used.' },
    ],
  },
  {
    number: '5',
    title: 'The Mixtape',
    body: [
      'The Walkman\'s primary medium was the Compact Cassette, introduced by Philips in 1963 as a dictation format and adopted as a music distribution medium by the early 1970s. The cassette\'s relevant design property, for Walkman purposes, was its physical reciprocity with home cassette recorders: any cassette played on a Walkman could equally be recorded *on* a home recorder, and any cassette recorded at home could play on a Walkman.',
      'This reciprocity produced the *mixtape* — a hand-curated 60-minute or 90-minute compilation, recorded by one person from their own record or radio collection, given to another. The mixtape became, by the mid-1980s, the dominant personal-curation artifact of the period. We argue that the mixtape\'s social life was the Walkman\'s second-order effect: the Walkman made portable listening normal; portable listening made personal curation valuable; personal curation became, in cassette form, a gift economy.[11]',
      'The mixtape\'s discontinuation tracks the Walkman\'s. The cassette\'s replacement by the recordable CD (CD-R, 1990) and then by the MP3 file produced curation artifacts that did not require the recipient to play the medium on a specific device. The intimacy of the mixtape — the labor of recording it in real time, the constraint of fitting a side to its 30 or 45 minutes — was a property of the medium, not the file. The mixtape died with the Walkman because the medium and the device were the same object.',
    ],
    footnotes: [
      { mark: '11', text: 'For a fuller treatment of the mixtape as gift, see Hornby (1995) and Moore (2004).' },
    ],
  },
  {
    number: '6',
    title: 'Discontinuation, 2010',
    body: [
      'Sony formally discontinued the cassette Walkman in Japan on October 22, 2010. The announcement was made quietly, via a Sony Japan press release, and was reported the same day by *The Wall Street Journal* and *NHK*.[12] The cassette Walkman had been in continuous production for 31 years, four months, and three weeks. Approximately 220 million cassette-format units had been manufactured across the run.',
      'Sony\'s announcement noted that production for the Chinese export market would continue through 2013. This footnote is itself culturally telling: by 2010, the cassette Walkman was no longer a Japanese or American consumer object; it was an export object for markets where the iPod\'s economics had not yet displaced the cassette\'s. The product had migrated geographically as it had aged, in a pattern familiar from the late life of analog photography (Polaroid film), the rotary telephone, and the compact fluorescent bulb.',
      'As with the Trapper Keeper, the Walkman\'s retirement closely tracks the iPod\'s arc: the iPod was introduced October 23, 2001, exactly nine years and 364 days before the cassette Walkman\'s formal retirement. We do not claim a causal link between the retirement and the iPod anniversary; we do claim that the temporal synchrony, like the 2001 Trapper Keeper retirement and the 2001 iPod introduction, is structurally meaningful.',
    ],
    footnotes: [
      { mark: '12', text: '"Sony to Cease Cassette Walkman Production." *Wall Street Journal*, October 22, 2010.' },
    ],
  },
  {
    number: '7',
    title: 'Findings: What the Walkman Teaches the University',
    body: [
      'We close with three findings relating Walkman design principles to the University of El Segundo\'s programs.',
      '<strong>Finding I.</strong> Personal sound is a civic act. Wearing music in public is, whether the wearer intends it or not, a public-square statement: a refusal of the surrounding acoustic environment in favor of a curated alternative. The Walkman was the first technology to make this refusal economically and physically practical for a mass population. The smartphone has made it nearly compulsory. The Marine Layer program — which forbids headphones during sit, by explicit instruction in the First Sit packet — recovers the pre-Walkman acoustic posture: hearing what is around you is the practice. The marine layer is the bell. If you cannot hear traffic, planes, surf, or fog, you are sitting in the wrong place.[13]',
      '<strong>Finding II.</strong> Two-people-sharing was a real social affordance, and its loss is a real social loss. The dual-jack TPS-L2 hardware-encoded a model of music as something you do *with* a person. The single-jack WM-2, the iPod, and the modern AirPod hardware-encode a model of music as something you do *instead of* the person beside you. The Honey League program, which scores reciprocal acts (lend, host, bring, publish), is an attempt to recover the dual-jack affordance in a non-musical register: the practice of arranging objects so that two people are doing the thing together by default.',
      '<strong>Finding III.</strong> The Walkman did not fail; the cassette did. The device was perfectly engineered for its medium, and the medium was overtaken by a different media economy. PointCast Commons holds, as a related principle, that the building (the device, the bench, the parcel) is not what matters — the medium of the practice is what matters. A bench is a Walkman without a cassette; a cassette is a Walkman without a bench. The pair makes the practice; either alone is hardware.',
    ],
    footnotes: [
      { mark: '13', text: 'Verbatim from the Marine Layer principles. See https://pointcast.xyz/marine-layer.' },
    ],
  },
  {
    number: '8',
    title: 'Conclusion',
    body: [
      'The Sony Walkman was a milled-aluminum cassette player with two headphone jacks, a samarium-cobalt-magnet headphone, and a thirty-one-year run that ended in 2010 in Japan and 2013 in the export markets. It carried two hundred and twenty million units of personal sound across four continents and four decades, and then it stopped being made.',
      'It deserves to be remembered as the first object that made portable personal music economically and physically practical for a mass population, and as the last object that made *shared* portable personal music a designed-in default. It deserves to be studied as a piece of pre-digital material culture with serious lessons for the post-digital one. And it deserves, perhaps most of all, to be remembered without nostalgia: not as a totem of a better-sounding past, but as a fork in the social geometry of personal sound that still has not fully closed.',
      'Anyone of the appropriate generational cohort can recall the *click* of a TPS-L2 transport key; the orange-foam earpiece on a friend\'s pair of MDR-3 headphones; the small acoustic spillage from the headphones of the person sitting in the next seat on the bus. We invite the reader to do so, briefly, before continuing to the references. <em>Click.</em>',
    ],
  },
];

export type Reference = { id: string; cite: string };

export const REFERENCES: Reference[] = [
  { id: 'morita-1986', cite: 'Morita, A., Reingold, E. M., & Shimomura, M. (1986). *Made in Japan: Akio Morita and Sony*. E. P. Dutton.' },
  { id: 'sony-tps-l2-memo', cite: 'Sony Corporation. (1979, April 11). *TPS-L2 Marketing Positioning* [Internal product memo]. Sony Corporate Archives, Tokyo.' },
  { id: 'sony-press-2010', cite: 'Sony Corporation. (2010, October 22). *Cassette Walkman Production Discontinuation* [Press release]. Tokyo.' },
  { id: 'wsj-2010', cite: '"Sony to Cease Cassette Walkman Production." (2010, October 22). *The Wall Street Journal*.' },
  { id: 'cooper-hewitt-2015', cite: 'Cooper Hewitt Smithsonian Design Museum. (2015). *Tools: Extending Our Reach* [Exhibition catalog]. Cooper Hewitt.' },
  { id: 'apple-ipod-2001', cite: 'Apple Computer, Inc. (2001, October 23). *iPod Press Release*. Cupertino, CA.' },
  { id: 'hornby-1995', cite: 'Hornby, N. (1995). *High Fidelity*. Victor Gollancz Ltd.' },
  { id: 'moore-2004', cite: 'Moore, T. (2004). *Mix Tape: The Art of Cassette Culture*. Universe Publishing.' },
  { id: 'philips-1963', cite: 'Philips. (1963). *Compact Cassette System Specification*. Eindhoven.' },
  { id: 'koss-sp3', cite: 'Koss Corporation. (1958). *Stereophone SP-3 Product Manual*. Milwaukee, WI.' },
  { id: 'sony-mdr3-spec', cite: 'Sony Corporation. (1979). *MDR-3 Stereo Headphone Specifications*. Tokyo.' },
  { id: 'us-patent-trapperkeeper', cite: 'University of El Segundo. (2026). *Velcro and Memory: A Material History of the Mead Trapper Keeper*. UES-WP-2026-04. https://pointcast.xyz/trapper-keeper.' },
  { id: 'pointcast-marine-layer', cite: 'University of El Segundo. (2026). *Marine Layer: A Place-Based Meditative Program*. UES-WP-2026-01. https://pointcast.xyz/marine-layer.' },
  { id: 'pointcast-honey-league', cite: 'University of El Segundo. (2026). *Local Honey League: Soft Standings*. UES-WP-2026-06 [forthcoming]. https://pointcast.xyz/honey-league.' },
];

export type SpecimenPlate = { id: string; figure: string; caption: string; description: string; era: 'tps-l2' | 'mdr3' | 'mixtape' | 'dual-jack' };

export const PLATES: SpecimenPlate[] = [
  { id:'plate-i', figure:'Plate I', caption:'TPS-L2 industrial design schematic. Milled aluminum casing, blue accent strip, five mechanical transport keys, dual 3.5mm headphone jacks at top edge. Reconstruction from Sony 1979 product literature.', description:'Front view of the original 1979 Sony Walkman.', era:'tps-l2' },
  { id:'plate-ii', figure:'Plate II', caption:'Sony MDR-3 headphone earpiece detail. Orange foam pad over 30mm dynamic driver. Approximately 1.4 ounces total weight per unit, one-tenth the weight of the contemporary Koss SP-3.', description:'On-ear headphone with orange foam pad — the canonical visual signifier of 1980s portable audio.', era:'mdr3' },
  { id:'plate-iii', figure:'Plate III', caption:'Compact Cassette mixtape, hand-labeled side A. Specimen recovered from El Segundo Public Library used-book sale, c. 2024. Contents unknown; the label reads "FOR M, SUMMER 89."', description:'90-minute cassette with handwritten label — the dominant personal-curation artifact of the 1980s.', era:'mixtape' },
  { id:'plate-iv', figure:'Plate IV', caption:'Dual-jack social geometry, TPS-L2. Two listeners share one source through two pairs of MDR-3 headphones. The hardware affordance for two-people-sharing was specific to the 1979 model and was reduced to a single jack in the 1980 WM-2.', description:'Schematic of the two-people-sharing affordance encoded in the TPS-L2 hardware.', era:'dual-jack' },
];

export const PAPER_NOTES = {
  tribute: 'This paper is a tribute. The voice is scholarly; the affection is sincere.',
  uesNote: 'UES Working Papers are non-peer-reviewed publications of the University of El Segundo, intended to circulate ideas before they are ready for formal review. Comments to mh@pointcast.xyz.',
  acknowledgments: 'The authors thank Akio Morita and Masaru Ibuka (in absentia) for the object under study, the Sony Corporation Archives for the 1979 internal memos cited in Section 4, and the Marine Layer cohort for the silent (no-headphone) review session that produced Finding I.',
  seriesNote: 'This is the second entry in a multi-part UES series on the pre-digital personal-architecture family. UES-WP-2026-04 (Trapper Keeper) treats paper architecture; this paper treats audio. Forthcoming entries will address visual memory (Polaroid SX-70), institutional paper (the manila folder), and residential voice (the cordless landline).',
};
