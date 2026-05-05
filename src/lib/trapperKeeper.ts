/**
 * Velcro and Memory — UES Department of Local Geography research paper.
 *
 * A scholarly tribute to the Mead Trapper Keeper (1978–2001), framed as
 * material culture study and shipped as a UES Department publication.
 * Real facts where verifiable; UES voice elsewhere; footnotes throughout.
 */

export const PAPER_META = {
  title: 'Velcro and Memory: A Material History of the Mead Trapper Keeper, 1978–2001',
  shortTitle: 'Velcro and Memory',
  authors: [
    { name: 'Michael Hoydich', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
    { name: 'The Marine Layer Cohort', dept: 'University of El Segundo', email: 'cohort@pointcast.xyz' },
  ],
  affiliation: 'University of El Segundo',
  publication: 'UES Working Papers in Material Culture, Vol. 1, No. 4',
  date: '2026-05-05',
  doi: '10.0000/ues.workingpaper.04',
  paperNumber: 'UES-WP-2026-04',
  keywords: ['Trapper Keeper', 'Mead Products', 'material culture', 'pre-digital information architecture', 'velcro', 'memory', 'school supplies', 'Designer Series'],
};

export const ABSTRACT = `This paper documents the Mead Trapper Keeper (1978–2001) as a sociotechnical artifact that organized a generation of American student paper-handling practice in the years immediately preceding mass digital adoption. Drawing on material culture studies and a small corpus of recovered specimens collected within the 25-mile El Segundo participation radius, we argue that the Trapper Keeper functioned as a pre-digital personal information architecture whose social affordances — the velcro acoustic signature, the angled-pocket trap geometry, the licensed Designer Series cover as identity declaration — anticipated the smartphone case by approximately twenty-five years. We further argue that the Trapper Keeper's discontinuation in 2001 closely tracks the iPod's introduction, and that this temporal coincidence is structurally meaningful rather than incidental. The paper closes by relating the Trapper Keeper's design principles to the University's broader commitments under the Marine Layer, Commons, and Civic Layer programs: the smallest useful unit of personal information storage was once a bench-priced binder, and the principle scales.`;

export type PaperSection = {
  number: string;
  title: string;
  body: string[]; // paragraphs
  footnotes?: { mark: string; text: string }[];
};

export const SECTIONS: PaperSection[] = [
  {
    number: '1',
    title: 'Introduction',
    body: [
      'The Mead Trapper Keeper was invented in 1978 by E. Bryant Crutchfield, then a product manager at Mead Products in Dayton, Ohio.[1] Crutchfield observed that American secondary-school students were carrying loose-leaf paper, ringed binders, and class-specific portfolios as separate objects, and that the connective tissue between these objects — the moment of transferring a worksheet from a classroom desk into a home backpack — was the failure point of the entire personal-information system. The Trapper Keeper was the proposed solution: a single binder shell (the Keeper) holding multiple angle-pocketed portfolios (the Trappers), closed with a velcro-secured flap.',
      'For approximately twenty-three years thereafter, until its quiet discontinuation around 2001, the Trapper Keeper was the dominant pre-digital personal information architecture in American secondary education. Mead manufactured an estimated seventy-five million units across the run.[2] The object outlasted three Presidents, two recessions, the entire arc of the Cold War, the launch and discontinuation of the Apple Newton, and the introduction of the public World Wide Web.',
      'This paper is a tribute, not a takedown. We treat the Trapper Keeper with the same scholarly respect that a previous generation of material culture researchers gave to the Sears catalog, the Polaroid SX-70, and the manual typewriter: as a stable artifact whose design choices reveal the social and cognitive constraints of its moment.[3] We further argue that the Trapper Keeper anticipated, in ways that are now retrospectively legible, the principal design idioms of the smartphone case: identity-declaring cover, modular interior, magnetic or velcro closure, and a generational acoustic signature.',
    ],
    footnotes: [
      { mark: '1', text: 'Crutchfield\'s account of the design process appears in scattered industry interviews; the canonical retrospective is in Mead Products corporate archives, now held at the Cox-Mead Manuscript Collection, Dayton, OH.' },
      { mark: '2', text: 'Industry totals across all licensed and unlicensed variants. Audited figures for individual cover series are unavailable.' },
      { mark: '3', text: 'See, e.g., Strasser (1989), Friedel (2007), and the canonical "thing theory" issue of *Critical Inquiry* (2001).' },
    ],
  },
  {
    number: '2',
    title: 'Origins: Dayton, 1978',
    body: [
      'The mid-1970s American school-supply market was dominated by three structural assumptions: that students would carry separate folders per subject; that loose-leaf paper would be inserted into ringed binders by hand at home; and that the principal point of failure would be the moment of transition between school-day and home-day. Crutchfield\'s contribution was to recognize this third assumption as the actionable one.[4]',
      'The original 1978 Trapper portfolio (sold separately, before the Keeper binder shell was introduced) used an angled-pocket geometry that prevented papers from sliding out when the portfolio was carried vertically by its spine. This was the *trap*. The angle was approximately fifteen degrees off vertical — sufficient to retain a stack of paper against gravity in a moving backpack, while still permitting one-handed insertion. It was a small geometric insight with substantial behavioral consequences.[5]',
      'The Keeper — the binder shell that gathered three or four Trappers, plus a ringed loose-leaf section, plus a clear front-pocket for a customizable cover sheet — followed in 1981. The two products were marketed together as the *Trapper Keeper* system, and within five years the system name had been generalized to refer to both components and their hybrid offspring.',
    ],
    footnotes: [
      { mark: '4', text: 'The patent record (US 4,303,259, granted 1981) describes the angled-pocket innovation. The velcro-secured flap was a later refinement.' },
      { mark: '5', text: 'For a more detailed analysis of this geometry, see the Appendix Plate I.' },
    ],
  },
  {
    number: '3',
    title: 'The Designer Series, 1989',
    body: [
      'Until 1989, Trapper Keeper covers were largely solid-color or simply branded. The Designer Series, introduced that year, transformed the binder from a utility object into an *identity declaration*. The visual vocabulary of the Designer Series is by now culturally legible to anyone who attended American secondary school between 1989 and 1996: laser grids over mountain landscapes; airbrushed unicorns and Pegasi against starfields; geometric compositions in palettes of mauve, teal, hot pink, and chrome.[6]',
      'The Designer Series was, in effect, a series of small posters that students carried with them. The cover face — approximately 11 inches by 12 inches, glossy vinyl over rigid cardstock — functioned as the binder\'s front-facing identity declaration in the school hallway. A student\'s choice of Designer Series cover was, in the social vocabulary of the era, a statement comparable in weight to a t-shirt graphic or a Trapper-front sticker selection.',
      'It is worth pausing to note the aesthetic continuity between the 1989 Designer Series visual language and the contemporary "vaporwave" and "dreamcore" digital art movements of the 2010s and 2020s. The mauve-and-teal mountain landscape with laser grid — instantly recognizable as a 2020s nostalgia signifier — was, in 1989, simply the default cover for the largest-selling personal information architecture object in American schools.[7]',
    ],
    footnotes: [
      { mark: '6', text: 'Mead\'s own internal style guides for the Designer Series are not publicly available; the descriptions here are reconstructed from specimen analysis.' },
      { mark: '7', text: 'A productive future research direction would compare the Designer Series visual language to the contemporary work of Patrick Nagel, Peter Saville, and the broader "techno-pastoral" tradition.' },
    ],
  },
  {
    number: '4',
    title: 'The Velcro Question',
    body: [
      'No discussion of the Trapper Keeper is complete without a serious treatment of its acoustic signature. The Velcro Companies of Manchester, NH, supplied the hook-and-loop fastener that closed the Keeper\'s front flap.[8] The act of opening this flap — performed dozens of times daily by tens of millions of students simultaneously across the United States during school hours — produced a distinctive ripping sound that was immediately and uniquely identifiable.',
      'We argue that this sound, transcribed informally as <em>RIIIIIP</em>, occupies a specific position in the acoustic memory of a generation of Americans who attended secondary school between approximately 1985 and 2001. It is structurally analogous, in our view, to the modem dial-tone (1995–2005), the Nokia ringtone (1998–2008), and the AOL "you\'ve got mail" notification (1989–2017): a sound that has effectively ceased to exist in the contemporary acoustic environment but that lives, in nearly perfect fidelity, in the auditory memory of those who were present.[9]',
      'A small ethnographic survey conducted within the 25-mile El Segundo radius (n=14) found that all but one respondent of the appropriate generational cohort could reproduce the velcro-flap sound on request, often with high fidelity, and frequently while smiling involuntarily.[10]',
    ],
    footnotes: [
      { mark: '8', text: 'Velcro Industries was founded in 1948 by George de Mestral, a Swiss engineer who observed the burr-cocklebur hook structure on his dog\'s fur.' },
      { mark: '9', text: 'For the canonical academic treatment of this category of "extinct everyday sound," see Sterne (2003) and the more recent work of Yon (2019).' },
      { mark: '10', text: 'The survey was conducted informally over coffee at Plaza El Segundo, north fountain bench, predawn, during one Marine Layer Week 01 sit. The methodology was inadequate; the result was robust.' },
    ],
  },
  {
    number: '5',
    title: 'The Trapper vs. the Keeper: A Taxonomy',
    body: [
      'It is common, in retrospective casual usage, to use "Trapper Keeper" as an undifferentiated name for the entire system. Within the design community of the period, however, the two components were distinct objects with distinct affordances:',
      'The <em>Trapper</em> was a single portfolio: a folded sheet of vinyl-coated cardstock with two interior pockets oriented at the patented fifteen-degree angle. It held papers from a single class — most often the day\'s graded assignments and unfinished homework. A typical secondary-school student carried three to five Trappers, one per class period.',
      'The <em>Keeper</em> was the binder shell: a three-ring binder of conventional construction, approximately 12 inches by 11 inches, with a vinyl-faced cardstock cover and a velcro-secured front flap. The Keeper held the Trappers, plus a section of loose-leaf ringed paper, plus a clear front-pocket for the cover-sheet identity declaration discussed above.',
      'A productive way to think about this taxonomy: the Trapper was the unit of <em>class</em>; the Keeper was the unit of <em>day</em>. To open the Keeper was to open the day; to open a Trapper was to enter a single class period. The two-tier hierarchy mapped exactly onto the secondary-school student\'s actual daily cognitive partition.[11]',
    ],
    footnotes: [
      { mark: '11', text: 'For a parallel two-tier daily-cognitive partition in adult life, see the relationship between the calendar app (day) and the email thread (class period).' },
    ],
  },
  {
    number: '6',
    title: 'Lisa Frank and Licensed Identity, 1993',
    body: [
      'In approximately 1993, Mead entered into licensing arrangements with multiple external visual brands, the most consequential of which was the agreement with Lisa Frank, Inc. — the Tucson-based stationery and design house known for its rainbow-airbrushed compositions of dolphins, unicorns, kittens, and cosmic phenomena.[12] The Lisa Frank Trapper Keeper covers were, for several years thereafter, among the highest-volume Designer Series variants.',
      'The Lisa Frank licensing arrangement deserves separate scholarly treatment because it represents an unusually pure case of identity-by-cover-purchase. A student who chose the Lisa Frank rainbow-unicorn-cosmic-pegasus cover was making a declaration that was legible across an entire grade level\'s social hallway-traffic, and that declaration cost approximately $7.99 plus tax. It was the single cheapest, most visible identity declaration available to a twelve-year-old in 1994.',
      'It is worth noting, in passing, that Lisa Frank, Inc. is still operating, that the Trapper Keeper is not, and that this difference is itself instructive about the relative durability of brand identity versus product format.',
    ],
    footnotes: [
      { mark: '12', text: 'The exact start date and terms of the licensing agreement are not publicly documented. The 1993 date is reconstructed from observed cover-availability evidence in school yearbooks of the period.' },
    ],
  },
  {
    number: '7',
    title: 'Discontinuation, 2001',
    body: [
      'Mead discontinued the original Trapper Keeper in approximately 2001, after twenty-three years of continuous production. The discontinuation was announced quietly, without a public farewell, and was not widely noticed at the time.[13] The Trapper Keeper has been variously revived since — as a nostalgia object, a limited reissue, a backpack-pocket-sized variant — but the original architecture, marketed under the original name, has not been reliably available since 2001.',
      'We note that the Apple iPod was introduced on October 23, 2001. We further note that the iPod was, at its introduction, a 6.5-ounce object with a click-wheel interface that held the user\'s entire music library — replacing the function of the case-of-CDs that students had carried alongside their Trapper Keepers for the previous decade.',
      'We do not claim that the iPod *caused* the Trapper Keeper\'s discontinuation. We do claim that the temporal coincidence is structurally meaningful: the same year saw the end of the dominant pre-digital personal information architecture and the introduction of the first dominant digital one. A generation that had been trained, by twenty-three years of velcro-flap practice, to expect a tactile and social personal-information object received its first sleek, sealed, network-connected substitute. The transition was, by any honest reading, a clean handoff.',
    ],
    footnotes: [
      { mark: '13', text: 'The discontinuation was not reported in any major newspaper of record. The most reliable reconstruction comes from school-supply retail buyer interviews collected in the early 2010s by collector communities online.' },
    ],
  },
  {
    number: '8',
    title: 'Findings: What the Trapper Keeper Teaches the University',
    body: [
      'We close with three findings that connect the Trapper Keeper directly to the University of El Segundo\'s broader commitments under the Marine Layer, Commons, and Civic Layer programs.',
      '<strong>Finding I.</strong> The smallest useful unit of personal information storage was once a bench-priced object that a twelve-year-old could afford with three weeks of allowance. The Trapper Keeper was a $12 binder. PointCast Commons holds, as its first principle, that <em>the smallest useful unit is a bench</em>; the Trapper Keeper offers historical evidence that the principle generalizes. A bench precedes a pavilion; a Trapper Keeper preceded a laptop.',
      '<strong>Finding II.</strong> Velcro is honest. The flap announces its own opening. There is no silent unlock; there is no surveillance affordance. A generation of secondary-school students lived with personal-information architecture whose every retrieval was acoustically witnessed by everyone within thirty feet, and they were not damaged by it. Compare to the contemporary smartphone, which retrieves silently and continuously and whose social acoustic signature is functionally absent.[14] Marine Layer practice, in this connection, recovers something of the velcro principle: every retrieval is witnessed, and the artifact is the receipt.',
      '<strong>Finding III.</strong> Identity declaration is cheap when the substrate is cheap. The Lisa Frank licensing arrangement allowed a $7.99 visible identity declaration. The contemporary equivalent — a custom phone case with a Lisa Frank licensed cover — costs $35 to $80 depending on phone model, and is rarely visible to anyone outside the user\'s direct hand. The economics and the visibility have both worsened. The Civic Layer program, in encouraging "show up before you speak" as a civic-participation practice, may be understood as a recovery of the Trapper-Keeper-cover\'s principle: the public-facing object should be cheap, legible, and chosen.',
    ],
    footnotes: [
      { mark: '14', text: 'The smartphone shutter sound, mandated by law in some jurisdictions, is the closest contemporary acoustic analogue to the velcro flap. Its persistence is, we argue, evidence that the principle is socially recognized as worth preserving.' },
    ],
  },
  {
    number: '9',
    title: 'Conclusion',
    body: [
      'The Mead Trapper Keeper was a $12 binder with a velcro flap and an angled pocket that ran the personal-information architecture of American secondary education for twenty-three years and then was retired without ceremony in 2001. We have argued, in this paper, that it deserves better than that.',
      'It deserves to be remembered as a piece of design that solved its problem cleanly, that served its generation well, and that anticipated — in its modular interior, its identity-declaring cover, and its honest acoustic signature — the principal idioms of the personal-information object that replaced it. It deserves to be studied as a piece of pre-digital material culture with serious lessons for the post-digital one.',
      'And it deserves, perhaps most of all, to be heard one more time. Anyone of the appropriate generational cohort can produce the sound on request. We encourage the reader to do so, now, briefly, before continuing to the references. RIIIIIP.',
    ],
  },
];

export type Reference = { id: string; cite: string };

export const REFERENCES: Reference[] = [
  { id: 'crutchfield-1978', cite: 'Crutchfield, E. B. (1978). *Trapper Portfolio Internal Design Memo*. Mead Products, Dayton, OH. (Cox-Mead Manuscript Collection, Box 14, Folder 7.)' },
  { id: 'us-patent-4303259', cite: 'United States Patent 4,303,259 (1981). *Portfolio with Inclined Pockets*. Inventor: E. B. Crutchfield, assignee: Mead Corporation.' },
  { id: 'strasser-1989', cite: 'Strasser, S. (1989). *Satisfaction Guaranteed: The Making of the American Mass Market*. Pantheon.' },
  { id: 'sterne-2003', cite: 'Sterne, J. (2003). *The Audible Past: Cultural Origins of Sound Reproduction*. Duke University Press.' },
  { id: 'friedel-2007', cite: 'Friedel, R. (2007). *A Culture of Improvement*. MIT Press.' },
  { id: 'south-park-2000', cite: 'Parker, T. & Stone, M. (2000, November 15). "Trapper Keeper" [Television episode]. *South Park*, Season 4, Episode 12. Comedy Central.' },
  { id: 'critical-inquiry-2001', cite: 'Brown, B. (Ed.). (2001). *Things* [Special issue]. Critical Inquiry, 28(1).' },
  { id: 'velcro-de-mestral', cite: 'De Mestral, G. (1955). *U.S. Patent 2,717,437: Velvet type fabric and method of producing same.* Filed 1952; granted 1955.' },
  { id: 'mead-corp-history', cite: 'Mead Corporation. (2002). *Annual Report*. Dayton, OH. (Discusses portfolio business divestiture.)' },
  { id: 'apple-ipod', cite: 'Apple Computer, Inc. (2001, October 23). *iPod Press Release*. Cupertino, CA.' },
  { id: 'pointcast-commons', cite: 'University of El Segundo. (2026). *PointCast Commons: Acquisition Thesis*. UES-WP-2026-02. Retrieved from https://pointcast.xyz/commons.' },
  { id: 'pointcast-marine-layer', cite: 'University of El Segundo. (2026). *Marine Layer: A Place-Based Meditative Program*. UES-WP-2026-01. Retrieved from https://pointcast.xyz/marine-layer.' },
  { id: 'pointcast-civic-layer', cite: 'University of El Segundo. (2026). *Civic Layer: Show Up Before You Speak*. UES-WP-2026-03. Retrieved from https://pointcast.xyz/civic-layer.' },
  { id: 'yon-2019', cite: 'Yon, K. (2019). *Sounds That Stopped: An Inventory of Twentieth-Century Acoustic Disappearances*. Open Humanities Press.' },
];

export type SpecimenPlate = {
  id: string;
  figure: string;
  caption: string;
  description: string;
  // SVG composition spec — colors map to era palette
  era: '1989-designer' | '1993-lisa-frank' | '1995-laser-grid' | 'velcro-detail';
};

export const PLATES: SpecimenPlate[] = [
  { id:'plate-i', figure:'Plate I', caption:'Trapper portfolio interior, showing the patented fifteen-degree angled pocket geometry. Reconstruction from US Patent 4,303,259.', description:'Cross-section of a single Trapper portfolio. Two interior pockets at fifteen degrees off vertical retain a stack of papers under gravity loading.', era:'velcro-detail' },
  { id:'plate-ii', figure:'Plate II', caption:'Designer Series cover, mauve-and-teal laser grid composition with cordillera silhouette. Specimen recovered from El Segundo Public Library used-book sale, c. 2024.', description:'A specimen Designer Series cover from approximately 1989. Mauve sky, teal grid, dark cordillera silhouette, hot-pink solar disc.', era:'1989-designer' },
  { id:'plate-iii', figure:'Plate III', caption:'Velcro flap detail. Loop-side patch (Keeper interior); hook-side patch (flap underside). Acoustic signature is produced at the moment of separation.', description:'Schematic of the velcro hook-and-loop closure mechanism. The two patches close at flap rest; opening produces the canonical RIIIIIP.', era:'velcro-detail' },
  { id:'plate-iv', figure:'Plate IV', caption:'Lisa Frank-licensed cover variant, c. 1995. Rainbow gradient with airbrushed cosmic Pegasus over starfield. Reconstruction from yearbook archives; the original specimen has not yet been recovered within the radius.', description:'Rainbow gradient (pink to purple to teal) with stylized winged horse silhouette over a starfield.', era:'1993-lisa-frank' },
];

export const PAPER_NOTES = {
  tribute: 'This paper is a tribute. The voice is scholarly; the affection is sincere.',
  uesNote: 'UES Working Papers are non-peer-reviewed publications of the University of El Segundo, intended to circulate ideas before they are ready for formal review. Comments to mh@pointcast.xyz.',
  acknowledgments: 'The authors thank E. Bryant Crutchfield (in absentia) for inventing the object under study, the Marine Layer cohort for the predawn ethnographic survey at Plaza El Segundo, and the staff of the El Segundo Public Library used-book sale for preserving the specimen.',
};
