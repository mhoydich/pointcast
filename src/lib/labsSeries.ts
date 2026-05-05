/**
 * UES Working Papers — "The Lab and the Radius" series.
 *
 * Five papers on the great 20th-century industrial research labs,
 * read as local-network case studies. The thesis: each lab invented
 * a generation's future from inside a geography of less than the
 * 25-mile PointCast radius. Constraint was the medium.
 *
 * UES-WP-2026-06  Edison's Menlo Park             1876–1886   /menlo-park
 * UES-WP-2026-07  Bell Labs                       1925–1984   /bell-labs
 * UES-WP-2026-08  The Polaroid Lab                1937–2008   /polaroid-lab
 * UES-WP-2026-09  Xerox PARC                      1970–       /parc
 * UES-WP-2026-10  The Lab and the Radius (synthesis)          /lab-and-radius
 *
 * Companion to the diptych (UES-WP-2026-04 Trapper Keeper +
 * UES-WP-2026-05 Walkman). The diptych studied pre-digital personal
 * objects; this series studies the labs that preceded them.
 */

export type LabPaperEntry = {
  slug: string;
  url: string;
  paperNumber: string;
  title: string;
  shortTitle: string;
  era: string;
  geography: string;
  radiusInMiles: number;
  status: 'shipped' | 'forthcoming';
  abstract: string;
  thesis: string;
};

export const SERIES_META = {
  title: 'The Lab and the Radius',
  subtitle: 'Local-Network Design from Edison to PARC',
  description: 'A multi-part UES Working Papers series treating the great 20th-century industrial research labs as local-network case studies. Each lab invented its generation\'s future from inside a geography smaller than the 25-mile PointCast participation radius. We argue the radius was not a constraint but the medium.',
  publication: 'UES Working Papers in Material Culture, Vol. 1',
  authors: [
    { name: 'Michael Hoydich', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
    { name: 'The Marine Layer Cohort', dept: 'University of El Segundo', email: 'cohort@pointcast.xyz' },
  ],
  affiliation: 'University of El Segundo',
  startedAt: '2026-05-05',
  thesis: 'The great 20th-century industrial research labs were local networks. Each invented its generation\'s future from inside a geography of less than twenty-five miles — the same radius the University holds as its participation boundary. We argue that the radius was the medium of the work, not its constraint.',
  prefaceTo: ['UES-WP-2026-04 (Trapper Keeper)', 'UES-WP-2026-05 (Walkman)'],
};

export const SERIES: LabPaperEntry[] = [
  {
    slug: 'menlo-park', url: '/menlo-park', paperNumber: 'UES-WP-2026-06',
    title: 'A Minor Invention Every Ten Days: A Material History of Edison\'s Menlo Park, 1876–1886',
    shortTitle: 'Menlo Park',
    era: '1876–1886',
    geography: 'Menlo Park, New Jersey — approximately 25 miles southwest of Manhattan',
    radiusInMiles: 25,
    status: 'shipped',
    abstract: 'Thomas Edison\'s Menlo Park research complex (1876–1886) was the first industrial research laboratory and remains the canonical case study in cadence-driven invention. We document the lab as a six-acre campus inside a 25-mile commute from New York; the team of approximately forty "muckers" as the principal instrument; the ~3,500 surviving notebooks as the memory architecture; and the explicit production cadence of "a minor invention every ten days and a big thing every six months" as a generative constraint. We close by drawing direct lines to the University\'s Marine Layer artifact-per-sit practice, the Commons give-back ledger, and the principle that the smallest useful unit is a bench.',
    thesis: 'The first industrial research lab was a 25-mile-radius local network. The cadence was the system; the notebook was the receipt; the team was the instrument.',
  },
  {
    slug: 'bell-labs', url: '/bell-labs', paperNumber: 'UES-WP-2026-07',
    title: 'The Long Hallway: A Material History of Bell Labs, 1925–1984',
    shortTitle: 'Bell Labs',
    era: '1925–1984',
    geography: 'Murray Hill, New Jersey — approximately 25 miles west of Manhattan',
    radiusInMiles: 25,
    status: 'forthcoming',
    abstract: 'Forthcoming. Bell Labs as the case for cross-disciplinary collision: the transistor (1947), information theory (1948), Unix (1969), C (1972), CCD (1969), the laser (1958), all from one Murray Hill campus accessible by the same commuter rail line that served Edison\'s Menlo Park. The Long Hallway — building 1, 720 feet end to end — was designed so that no researcher could traverse it without involuntarily encountering at least one colleague from a different discipline. Architecture as collision instrument.',
    thesis: 'Cross-disciplinary collision was Bell Labs\' principal method. The 720-foot hallway was the medium.',
  },
  {
    slug: 'polaroid-lab', url: '/polaroid-lab', paperNumber: 'UES-WP-2026-08',
    title: 'Land\'s Vertical: A Material History of the Polaroid Lab, 1937–2008',
    shortTitle: 'Polaroid Lab',
    era: '1937–2008',
    geography: 'Cambridge, Massachusetts — within walking distance of MIT and Harvard, < 5-mile radius',
    radiusInMiles: 5,
    status: 'forthcoming',
    abstract: 'Forthcoming. Edwin Land\'s Polaroid as the smallest-radius case in the series: a single Cambridge company that did the chemistry, the optics, the mechanical design, the consumer industrial design, the marketing photography, and the retail-store theatrical demonstrations within a five-mile radius. We treat the SX-70 (1972) as the canonical artifact and Land\'s sixty-foot demonstration walk through Polaroid\'s Cambridge headquarters as a piece of pre-Apple product theater. The Land lab teaches that vertical integration inside a small geography produces distinctive aesthetic coherence.',
    thesis: 'Vertical integration inside a 5-mile radius produces distinctive aesthetic coherence. Land\'s Cambridge was a 5-mile lab.',
  },
  {
    slug: 'parc', url: '/parc', paperNumber: 'UES-WP-2026-09',
    title: 'The Cathedral They Did Not Ship From: A Material History of Xerox PARC, 1970–',
    shortTitle: 'Xerox PARC',
    era: '1970–',
    geography: 'Palo Alto, California — single building at 3333 Coyote Hill Road, < 1-mile radius from Stanford',
    radiusInMiles: 1,
    status: 'forthcoming',
    abstract: 'Forthcoming. The Palo Alto Research Center invented the personal computer (Alto, 1973), the laser printer (1971), the graphical user interface (Smalltalk, 1972), Ethernet (1973), and the WYSIWYG word processor (Bravo, 1974) inside a single building staffed by approximately fifty researchers. We document PARC as the smallest-radius case in the series and the most asymmetrically-rewarded: nearly every PARC invention shipped at scale through some other company. The paper closes by asking what the University can learn from a lab that successfully invented but did not successfully transmit.',
    thesis: 'Inventing the future inside a one-mile radius is achievable. Shipping the future from that radius is harder.',
  },
  {
    slug: 'lab-and-radius', url: '/lab-and-radius', paperNumber: 'UES-WP-2026-10',
    title: 'The Lab and the Radius: A Synthesis',
    shortTitle: 'Synthesis',
    era: '1876–present',
    geography: 'Four labs, four radii, one shared principle',
    radiusInMiles: 25,
    status: 'forthcoming',
    abstract: 'Forthcoming. The synthesis paper for the series. We compare Menlo Park (25 miles), Murray Hill (25 miles), Cambridge (5 miles), and Palo Alto (<1 mile) along nine dimensions: cadence, team size, principal instrument, memory architecture, transmission strategy, peak duration, decline pattern, dominant artifact, and successor pattern. We extract twelve principles for local-network design under the PointCast 25-mile radius, organized by phase of practice (Phase 0 Map, Phase 1 Steward, Phase 2 Vehicle, Phase 3 First Parcel, Phase 4 Open Hours).',
    thesis: 'Twelve principles for local-network design, drawn from four labs that worked.',
  },
];
