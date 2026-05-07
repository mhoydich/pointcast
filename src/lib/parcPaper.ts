/**
 * Xerox PARC — UES Working Paper 2026-09.
 * Fourth entry in "The Lab and the Radius" series.
 */

export const PAPER_META = {
  title: 'The Cathedral They Did Not Ship From: A Material History of Xerox PARC, 1970–',
  shortTitle: 'Xerox PARC',
  authors: [
    { name: 'Michael Hoydich', dept: 'Department of Local Geography', email: 'mh@pointcast.xyz' },
    { name: 'The Marine Layer Cohort', dept: 'University of El Segundo', email: 'cohort@pointcast.xyz' },
  ],
  affiliation: 'University of El Segundo',
  publication: 'UES Working Papers in Material Culture, Vol. 1, No. 9',
  date: '2026-05-06',
  doi: '10.0000/ues.workingpaper.09',
  paperNumber: 'UES-WP-2026-09',
  series: { name: 'The Lab and the Radius', position: '4 of 5', hub: '/labs' },
  keywords: ['Xerox PARC', 'Alto', 'Smalltalk', 'Ethernet', 'GUI', 'laser printer', 'Steve Jobs', 'Stanford', 'transmission failure', 'innovator\'s dilemma'],
};

export const ABSTRACT = `This paper documents the Xerox Palo Alto Research Center (1970–) as the smallest-radius case in *The Lab and the Radius* series and the most asymmetrically-rewarded. From a single four-story building at 3333 Coyote Hill Road, Palo Alto — less than one mile from the Stanford University main quad — approximately fifty researchers invented, between 1971 and 1976, the laser printer (Starkweather, 1971), the Alto personal computer with bitmapped display and mouse (Lampson, Thacker, Kay et al., 1973), the Ethernet local-area network (Metcalfe and Boggs, 1973), the Smalltalk graphical user interface and object-oriented programming environment (Kay et al., 1972–1980), and the Bravo WYSIWYG word processor (Simonyi, 1974). With the partial exception of the laser printer, Xerox commercialized none of these inventions at scale. We argue that the geographic separation between PARC and Xerox\'s corporate headquarters in Stamford, Connecticut — three thousand miles, three time zones, and a corporate culture that treated PARC as a curiosity rather than a product roadmap — was structural to the transmission failure. Inventing the future inside a one-mile radius is achievable; shipping the future from that radius requires either co-located corporate authority (as at Polaroid Cambridge) or a founder-figure willing to perform the demonstration walk for buyers (as at Polaroid). PARC had neither. We close by drawing three findings that the University of El Segundo, holding a generous twenty-five-mile radius, must hold against: the distance-kills-transmission rule, the invent-vs-ship asymmetry, and the every-lab-needs-a-Land principle.`;

export type PaperSection = { number: string; title: string; body: string[]; footnotes?: { mark: string; text: string }[] };

export const SECTIONS: PaperSection[] = [
  {
    number: '1',
    title: 'Introduction',
    body: [
      'On July 1, 1970, the Xerox Corporation opened the Palo Alto Research Center in a four-story modernist office building at 3333 Coyote Hill Road, Palo Alto, California — approximately three-quarters of a mile up the hill from the Stanford University main quadrangle.[1] The center had been authorized in late 1969 by Jacob E. Goldman, then Xerox\'s chief scientist, who had concluded that the company\'s existing East Coast research operation in Webster, New York, was too narrowly focused on photocopier improvement to support the diversified-technology future Xerox\'s leadership wanted. George Pake, a former Washington University in St. Louis provost and physicist, was hired to direct the new West Coast laboratory; Pake selected Palo Alto over Pasadena and Boulder and presented the Coyote Hill Road site to Xerox president C. Peter McColough in early 1970.',
      'For the next ten years, until approximately 1980, PARC produced what is, by any honest accounting, the densest concentration of foundational personal-computing inventions in human history. The list, in chronological order: the laser printer (Gary Starkweather, 1971); the Alto personal computer with the first commercially-targeted bitmapped display, mouse, and graphical user interface (Butler Lampson, Charles Thacker, Alan Kay, and approximately fifteen colleagues, 1973); the Ethernet local-area network (Robert Metcalfe and David Boggs, 1973); the Smalltalk programming environment (Kay et al., elaborated through the decade); the Bravo WYSIWYG word processor (Charles Simonyi, 1974); InterPress, the page-description language that became PostScript (Warnock and Geschke, 1980).[2] All from one building, staffed at peak by approximately 200 people of which perhaps 50 were principal researchers, all within a one-mile radius of Stanford.',
      'And yet — Xerox commercialized almost none of it.[3] The laser printer became a Xerox product. The other inventions reached the market through Apple (which licensed and adapted PARC concepts for the 1984 Macintosh), through 3Com (which Metcalfe founded to ship Ethernet), through Adobe (which Warnock and Geschke founded to ship PostScript), through Microsoft (which hired Simonyi to lead the Word development that became the WYSIWYG-word-processor commercial standard), and through dozens of subsequent firms. The PARC inventions defined the commercial computing industry of the 1980s, 1990s, and 2000s; PARC itself, and Xerox, captured perhaps a tenth of one percent of the resulting wealth.',
      'This paper is the fourth entry in *The Lab and the Radius*. The first three documented Edison\'s Menlo Park (25-mile radius from Manhattan), Bell Labs (25-mile radius from Manhattan, sixty-six years later), and Polaroid (5-mile radius in Cambridge). PARC is the smallest-radius case in the series and the case that asks the hardest question of any UES program. The geography that produces extraordinary invention does not, by itself, produce extraordinary transmission. What does?',
    ],
    footnotes: [
      { mark: '1', text: 'The 3333 Coyote Hill Road building was designed by Spencer Associates of Palo Alto and completed for Xerox\'s occupancy in mid-1970. The architectural style is corporate-modernist with a recessed entry on the south face. PARC continues to occupy the building in 2026 as a research subsidiary of SRI International.' },
      { mark: '2', text: 'For the canonical institutional history of PARC, see Hiltzik (1999) and Smith & Alexander (1988). Both books cover the 1970s breakthrough decade; Hiltzik is more thorough on the institutional politics, Smith & Alexander on the personalities.' },
      { mark: '3', text: 'The exception, as noted above, is the laser printer, which Xerox launched as the 9700 in 1977 and which became a multi-billion-dollar product line. The personal-computer, GUI, Ethernet, WYSIWYG, and PostScript inventions were not commercialized by Xerox at scale.' },
    ],
  },
  {
    number: '2',
    title: 'Origins: Coyote Hill Road, 1970',
    body: [
      'The choice of Palo Alto, and specifically of the Coyote Hill Road site, was deliberate. Pake wanted a research operation that could draw on Stanford\'s computer science faculty (the Stanford AI Lab under John McCarthy was three miles south at the time) and on the graduate-student labor market that Stanford and the nearby UC Berkeley were producing in large numbers. The Bay Area in 1970 had Lockheed, Hewlett-Packard, IBM\'s San Jose Research Lab, and the early stages of what would become the personal-computer industry; the East Coast had Xerox\'s Webster operation and the legacy IBM and Bell Labs facilities, but the talent pool for the kind of speculative computing work Pake wanted to do was concentrated in California.[4]',
      'The 3333 Coyote Hill Road building had four floors above ground and a basement. The first floor housed administration, a cafeteria, and a small auditorium. The second floor was the Computer Science Laboratory, which under Bob Taylor (a former DARPA program manager who joined PARC in 1970) became the principal site of the Alto, Ethernet, and Bravo work. The third floor was the General Sciences Laboratory under William Spencer, focused on physics, materials, and the early laser printer work. The fourth floor was the System Sciences Laboratory under Pake, focused on systems analysis and what would today be called organizational research. The basement housed the prototype-fabrication machine shop.',
      'We treat the geographic compression as the critical methodological precondition, in continuity with the prior three papers in the series. PARC\'s entire research operation, throughout its productive decade, fit inside a single building. Researchers from the Computer Science Laboratory and the General Sciences Laboratory who needed to coordinate on a project — for example, the Ethernet work, which required both circuit-design (CSL) and signal-integrity-physics (GSL) expertise — walked one flight of stairs. The maximum geographic distance between any two PARC collaborators during the 1970s was approximately fifty meters and one elevator ride.',
    ],
    footnotes: [
      { mark: '4', text: 'For the Bay Area technical-labor-market context circa 1970, see Lécuyer (2006), *Making Silicon Valley*, MIT Press.' },
    ],
  },
  {
    number: '3',
    title: 'The Alto, 1973',
    body: [
      'The Alto was the canonical PARC artifact. It was conceived primarily by Butler Lampson and Charles Thacker, with substantial design input from Alan Kay (whose Dynabook concept paper of 1972 had argued for a personal interactive computer aimed at children); the first prototype was operational on April 1, 1973.[5] The Alto carried a 606-by-808-pixel monochrome bitmapped display oriented in portrait mode (designed by Thacker explicitly to match the dimensions of an 8.5-by-11-inch sheet of paper), a three-button mouse (the second mouse ever built; Engelbart\'s original 1968 mouse had been at SRI International, two miles north on the same Stanford-adjacent corridor), a keyboard, and approximately 128 kilobytes of main memory. The processor was a custom microcoded design running at approximately 6 MIPS — modest by 2026 standards, exceptional in 1973.',
      'The Alto was, in 1973, ten years ahead of the commercial state of the art. The Apple I would not be released until 1976; the Apple II in 1977; the IBM PC in 1981; the Macintosh, which inherited the Alto\'s GUI, mouse, and bitmapped-display affordances, in 1984. PARC produced approximately two thousand Altos for internal Xerox use during the 1970s. Approximately a hundred were placed at universities and partner research labs; roughly half a dozen were demonstrated to outside parties under non-disclosure agreements during the decade.[6]',
      'The Alto was also, in 1973, complete. Bravo (the WYSIWYG word processor) ran on it; the Smalltalk programming environment ran on it; the Ethernet networked it to other Altos in the building; a network laser printer (the EARS, predecessor to the 9700) printed from it. Anyone using an Alto in 1976 was using, materially, the architecture that would dominate commercial personal computing from approximately 1984 onward. The future was already running in one building in Palo Alto. Xerox could not figure out how to ship it.',
    ],
    footnotes: [
      { mark: '5', text: 'The April 1, 1973 first-boot date is the conventional anniversary; some sources place the first stable Alto operation in late March or early May. The official Xerox PARC commemoration uses April 1.' },
      { mark: '6', text: 'The number of external Alto demonstrations during the 1970s is documented variously across sources; the canonical list compiled by Hiltzik (1999, pp. 246–251) identifies approximately six high-stakes external visits between 1976 and 1979.' },
    ],
  },
  {
    number: '4',
    title: 'The Transmission Failure',
    body: [
      'The Xerox Corporation, in 1973, was a $4-billion-revenue copier company headquartered at 800 Long Ridge Road in Stamford, Connecticut. The senior management — McColough, then-CFO Archie McCardell, and the broader Stamford executive committee — were photocopier executives who had spent their careers in a business with a clear product (the copier), a clear customer (the corporate office manager), and a clear sales motion (the leased machine, the per-page billing, the field-service contract). The PARC inventions were the opposite of all three: ambiguous products (a personal computer? a network? a programming language?), unclear customers (engineers? students? secretaries?), and unfamiliar sales motions (capital sale? license? upgrade?).',
      'The geographic distance between Stamford and Palo Alto was three thousand miles, three time zones, and approximately six hours of door-to-door travel. Xerox executives visited PARC perhaps once or twice a year; PARC researchers visited Stamford perhaps once or twice a career. The 1977 *Futures Day* internal demonstration — at which Pake and Taylor presented the Alto, Ethernet, and laser printer to the assembled Stamford executive committee with their wives present in a Houston hotel ballroom — is the canonical Xerox-couldn\'t-see-it moment in the institutional historiography. The wives, by Hiltzik\'s account, were generally enthusiastic; the husbands were generally puzzled.[7]',
      'We argue that the transmission failure was not a failure of PARC\'s communication, nor a failure of Xerox\'s intelligence (the Stamford executives were not stupid), but a structural failure of the corporate geography. A copier executive in Stamford in 1977 had no daily exposure to the Alto. A PARC researcher in Palo Alto in 1977 had no daily exposure to the copier sales force. Each side\'s defaults were invisible to the other. The corporate organization chart said the PARC inventions belonged to Xerox; the institutional reality was that they belonged to whichever company\'s engineers could see them, copy them, and ship them. Apple\'s engineers, after Steve Jobs\'s December 1979 PARC visit, could.',
      'Polaroid, the prior paper in the series, demonstrated the opposite case. Land\'s Cambridge research operation was geographically integrated with the Cambridge marketing department, the Brattle Street demo store, the Norwood tooling shop, and the Waltham film plant — all inside five miles. Land personally walked visitors through the Walk; the visitor saw the chemistry, the optics, the design, and the camera in the same forty-five minutes. Xerox\'s Stamford executives never had this experience for PARC inventions. There was no equivalent of Land at PARC. Pake was a research administrator; Taylor was a brilliant lab director; Kay was a visionary thinker. None of the three was the founder-figure-with-corporate-authority-to-ship that the Polaroid Walk presupposed.',
    ],
    footnotes: [
      { mark: '7', text: 'Hiltzik (1999), pp. 187–193, gives the canonical account of the *Futures Day* demonstration. Smith & Alexander (1988) provide a complementary version with somewhat different emphasis on the role of Xerox CEO McColough.' },
    ],
  },
  {
    number: '5',
    title: 'Steve Jobs, December 1979',
    body: [
      'On December 9, 1979, a twenty-four-year-old Steve Jobs arrived at 3333 Coyote Hill Road for a scheduled three-hour demonstration. Apple Computer, which Jobs had co-founded in 1976, was preparing to raise its Series C funding round; Xerox\'s investment arm, Xerox Development Corporation, had agreed to participate at a level of approximately $1 million in exchange for the right to purchase 100,000 pre-IPO Apple shares at $10 each. The PARC demonstration was, in essence, a quid pro quo: Apple would receive a deep technical look at PARC\'s personal-computing work; Xerox would receive Apple equity at a favorable price.[8]',
      'The demonstration was given by Larry Tesler and Adele Goldberg, with Bob Taylor in attendance. The Smalltalk graphical environment was running on an Alto. Jobs saw bitmapped graphics, overlapping windows, the mouse, drop-down menus, scroll bars, and the full WYSIWYG word-processing model in operation. He famously asked, by Goldberg\'s subsequent account, "Why aren\'t you doing anything with this?" — to which the honest PARC answer was that the institutional layers between Palo Alto and Stamford had, for six years, made the question unanswerable.[9]',
      'Jobs\'s visit is the canonical moment in the Xerox-couldn\'t-ship-it historiography. Apple\'s subsequent products — the Lisa (1983), the Macintosh (1984), and through the Macintosh the entire commercial personal-computing industry — inherited the Alto\'s GUI, mouse, bitmapped display, and WYSIWYG affordances. Jobs himself credited the visit publicly throughout his subsequent career. Xerox\'s 100,000 Apple shares, purchased at $10 in 1979, were worth approximately $17 million when Apple went public in December 1980. The Xerox executives in Stamford sold the shares; they were not held to maturity. By 2026 valuations, the same shares would be worth approximately $4.5 billion.[10]',
      'We treat the December 1979 visit as the inverse of a Land Walk. Land conducted the Walk for visitors he expected to convert into Polaroid customers; the visitor saw the Polaroid product and bought the Polaroid product. Tesler and Goldberg conducted the PARC demonstration for a visitor whose institutional position they did not yet recognize — a young CEO of an upstart competitor who, having seen the work, would proceed to ship it under a different label. The demonstration succeeded; the conversion failed. The visitor left with the future in his head.',
    ],
    footnotes: [
      { mark: '8', text: 'The exact terms of the Xerox-Apple equity arrangement are documented in the Apple S-1 filing of October 1980 and in Hiltzik (1999), pp. 333–342.' },
      { mark: '9', text: 'Goldberg, A. (2008). "Personal Recollections of Smalltalk and PARC." *IEEE Annals of the History of Computing*, 30(2). The "Why aren\'t you doing anything with this?" quotation has been variously attributed to Jobs and to Tesler; both attributions appear in published recollections.' },
      { mark: '10', text: 'Approximate calculation based on the Apple split-adjusted share price as of mid-2026, applied to the 1980 share count without correction for subsequent dilution. The figure is illustrative.' },
    ],
  },
  {
    number: '6',
    title: 'Decline and Persistence',
    body: [
      'PARC\'s productive period extended approximately through 1985. The principal exodus began in 1980 and accelerated through the mid-decade: Charles Simonyi to Microsoft (1981); Bob Metcalfe to 3Com (1979); John Warnock and Chuck Geschke to Adobe (1982); Larry Tesler to Apple (1980); Adele Goldberg to ParcPlace Systems (1988). The remaining PARC operation continued substantial work — particularly in the 1990s on optical computing and ubiquitous-computing concepts (Mark Weiser\'s 1991 *Scientific American* paper "The Computer for the 21st Century" remains the canonical formulation) — but the 1970s concentration of foundational invention was not repeated.[11]',
      'In 2002, Xerox reorganized PARC as a wholly-owned independent subsidiary called Palo Alto Research Center Incorporated, ostensibly to allow PARC to take outside research contracts and to facilitate spin-offs. In 2023, the parent Xerox transferred PARC to SRI International (Stanford Research Institute), the same Menlo Park nonprofit that had hosted Doug Engelbart\'s original mouse demonstration in 1968. PARC continues to operate at 3333 Coyote Hill Road as an SRI subsidiary. The current research staff is approximately 150 people; the principal contemporary work is in printed electronics, ethnographic AI research, and clean-energy materials.[12]',
      'We are explicit: PARC did not fail in any productive-output sense. The first decade of its existence produced more fundamental personal-computing invention than any equivalent decade at any other research lab in human history. The failure was institutional and corporate-geographic: Xerox could not absorb what PARC produced, and the inventions therefore migrated to companies that could. The lesson for the University of El Segundo is correspondingly precise. Geographic concentration of invention is achievable at small scale (PARC inside a 1-mile radius; Polaroid inside a 5-mile radius). Geographic concentration of *transmission*, which requires the institutional-corporate-authority side to be co-located with the inventive side, is the harder problem, and the one PARC is the canonical case for.',
    ],
    footnotes: [
      { mark: '11', text: 'Weiser, M. (1991). "The Computer for the 21st Century." *Scientific American*, 265(3), 94–104. Weiser was a PARC principal scientist from 1987 until his death in 1999.' },
      { mark: '12', text: 'PARC corporate communications, 2023; SRI International press release on the 2023 transfer.' },
    ],
  },
  {
    number: '7',
    title: 'Findings: What PARC Teaches the University',
    body: [
      'Three findings, each tied to a University program.',
      '<strong>Finding I — Distance kills transmission.</strong> The three-thousand-mile separation between PARC and Xerox\'s Stamford headquarters was structural to the transmission failure. The University holds a generous twenty-five-mile radius — generous compared to PARC\'s one mile, generous compared to Polaroid\'s five — but the radius must include not only the inventive cohort but the corporate authority that ships the invention. The University\'s commitment to keep the Commons CLT shell entity inside the same radius as the Marine Layer cohort is, in this comparative frame, the explicit answer to the PARC failure mode. We do not delegate the transmission to a Stamford that cannot see the invention.',
      '<strong>Finding II — Inventing is the easy part.</strong> PARC produced the Alto, the GUI, Ethernet, Smalltalk, Bravo, and InterPress in approximately six years from a single building. Apple, 3Com, Adobe, and Microsoft together took approximately twenty-five years to ship the same inventions to a market that ultimately valued them in the trillions of dollars. The ratio is approximately four-to-one in favor of the shipping work. The University\'s programs (Marine Layer, Commons, Civic Layer, Geology, Ocean Wing, Fire, Nature Practice, Common Forms) are designed substantially around transmission rather than invention: the artifact-per-sit, the give-back ledger, the citation registry, the JSON mirrors, the open-publication policy. We have under-invested in invention and over-invested in transmission, on purpose.',
      '<strong>Finding III — Every lab needs a Land.</strong> Polaroid had Edwin Land — founder, principal scientist, demonstration-walker, and corporate-decision-maker, all in one person, all in Cambridge. PARC had George Pake, Bob Taylor, and Alan Kay — a research administrator, a lab director, and a visionary, none of them the corporate-decision-maker. The structural absence of an internal Land at PARC was the root cause of the Steve-Jobs-walked-out-with-the-future episode of December 1979. The University of El Segundo, in this comparative frame, is honest about needing a Land. The Marine Layer cohort\'s rotating stewardship model (Sitter → Bell → Place → Layer) is structured to produce, over time, internal Lands rather than to import them. The point of stewardship rotation is that the next demonstration walker is already in the cohort.',
    ],
  },
  {
    number: '8',
    title: 'Conclusion',
    body: [
      'The Xerox Palo Alto Research Center was a single building at 3333 Coyote Hill Road, Palo Alto, California, less than one mile from the Stanford University main quadrangle. Between 1971 and 1976, approximately fifty researchers in that building invented the laser printer, the personal computer with bitmapped graphics and a mouse, the graphical user interface, the local-area network, the WYSIWYG word processor, and the page-description language that became PostScript. They shipped almost none of it themselves. The corporate parent in Stamford, Connecticut — three thousand miles east, three time zones, six hours of door-to-door travel — could not absorb what the lab produced.',
      'It deserves to be remembered as the densest concentration of foundational personal-computing invention in human history. It deserves to be studied as the canonical institutional case for the distance-kills-transmission rule. And it deserves, perhaps most of all, to be visited. Anyone in the Bay Area today can walk from the Stanford main quadrangle to 3333 Coyote Hill Road in approximately twenty minutes uphill. The building is still there. Most of it is still doing research. Some of what is being done in the building today, in 2026, will turn out, in 2046, to have been the work of the next generation of Lampsons and Thackers and Kays.',
      'We invite the reader to make the walk, briefly — actually or imaginatively — before continuing to the references. <em>Three quarters of a mile uphill from Stanford. One four-story building. Twenty minutes. The cathedral they did not ship from is still standing.</em>',
    ],
  },
];

export type Reference = { id: string; cite: string };

export const REFERENCES: Reference[] = [
  { id: 'hiltzik-1999', cite: 'Hiltzik, M. A. (1999). *Dealers of Lightning: Xerox PARC and the Dawn of the Computer Age*. HarperBusiness.' },
  { id: 'smith-alexander-1988', cite: 'Smith, D. K., & Alexander, R. C. (1988). *Fumbling the Future: How Xerox Invented, Then Ignored, the First Personal Computer*. William Morrow.' },
  { id: 'kay-1972', cite: 'Kay, A. (1972). *A Personal Computer for Children of All Ages*. Xerox PARC internal memorandum.' },
  { id: 'lampson-thacker-1976', cite: 'Lampson, B. W., & Thacker, C. P. (1976). "Alto: A Personal Computer." Xerox PARC Computer Science Laboratory Technical Report.' },
  { id: 'metcalfe-boggs-1976', cite: 'Metcalfe, R. M., & Boggs, D. R. (1976). "Ethernet: Distributed Packet Switching for Local Computer Networks." *Communications of the ACM*, 19(7), 395–404.' },
  { id: 'goldberg-2008', cite: 'Goldberg, A. (2008). "Personal Recollections of Smalltalk and PARC." *IEEE Annals of the History of Computing*, 30(2), 52–64.' },
  { id: 'weiser-1991', cite: 'Weiser, M. (1991). "The Computer for the 21st Century." *Scientific American*, 265(3), 94–104.' },
  { id: 'lecuyer-2006', cite: 'Lécuyer, C. (2006). *Making Silicon Valley: Innovation and the Growth of High Tech, 1930–1970*. MIT Press.' },
  { id: 'apple-s1-1980', cite: 'Apple Computer, Inc. (1980, October). *Form S-1 Registration Statement*. U.S. Securities and Exchange Commission.' },
  { id: 'pointcast-menlo-park', cite: 'University of El Segundo. (2026). *A Minor Invention Every Ten Days: A Material History of Edison\'s Menlo Park*. UES-WP-2026-06. https://pointcast.xyz/menlo-park' },
  { id: 'pointcast-bell-labs', cite: 'University of El Segundo. (2026). *The Long Hallway: A Material History of Bell Labs*. UES-WP-2026-07. https://pointcast.xyz/bell-labs' },
  { id: 'pointcast-polaroid', cite: 'University of El Segundo. (2026). *Land\'s Vertical: A Material History of the Polaroid Lab*. UES-WP-2026-08. https://pointcast.xyz/polaroid-lab' },
  { id: 'pointcast-labs', cite: 'University of El Segundo. (2026). *The Lab and the Radius* [series hub]. https://pointcast.xyz/labs' },
  { id: 'pointcast-marine-layer', cite: 'University of El Segundo. (2026). *Marine Layer: A Place-Based Meditative Program*. UES-WP-2026-01. https://pointcast.xyz/marine-layer' },
];

export type SpecimenPlate = { id: string; figure: string; caption: string; description: string; era: 'building' | 'alto' | 'jobs-visit' | 'radius-comparison' };

export const PLATES: SpecimenPlate[] = [
  { id:'plate-i', figure:'Plate I', caption:'3333 Coyote Hill Road, Palo Alto. Four-story modernist office building completed 1970. Approximately three-quarters of a mile up the hill from the Stanford University main quadrangle. Building plan reconstruction.', description:'Schematic four-story building with floor-by-floor occupancy.', era:'building' },
  { id:'plate-ii', figure:'Plate II', caption:'Xerox Alto, April 1973. 606×808 portrait-oriented bitmapped display, three-button mouse, keyboard, custom microcoded processor at ~6 MIPS, ~128KB main memory. Approximately 2,000 units produced for internal Xerox use during the 1970s.', description:'Alto with portrait monitor, keyboard, mouse.', era:'alto' },
  { id:'plate-iii', figure:'Plate III', caption:'The geographic asymmetry, December 9, 1979. Xerox HQ at 800 Long Ridge Road, Stamford, Connecticut, three thousand miles east. PARC at 3333 Coyote Hill Road, Palo Alto, three quarters of a mile from Stanford. Steve Jobs visited PARC; the inventions migrated west to east via Apple.', description:'US continental map showing Stamford CT to Palo Alto CA distance with annotations.', era:'jobs-visit' },
  { id:'plate-iv', figure:'Plate IV', caption:'Radius comparison across the four-lab series. Menlo Park 25 mi · Murray Hill 25 mi · Cambridge 5 mi · PARC 1 mi. Inverse correlation between radius size and per-researcher invention density; direct correlation between radius size and transmission success.', description:'Bar chart of the four labs ordered by radius.', era:'radius-comparison' },
];

export const PAPER_NOTES = {
  uesNote: 'UES Working Papers are non-peer-reviewed publications of the University of El Segundo. Comments to mh@pointcast.xyz.',
  acknowledgments: 'The authors thank the Xerox PARC Historical Archive at the Computer History Museum, Mountain View, CA; the SRI International communications office for the 2023 transfer documentation; and the Marine Layer cohort for the predawn discussion at Plaza El Segundo that produced Finding III and the analogy between Land\'s presence at Polaroid and the structural absence of a Land at PARC.',
  seriesNote: 'This is the fourth entry in the multi-part series *The Lab and the Radius*. The first three papers treated Edison\'s Menlo Park (UES-WP-2026-06), Bell Labs (UES-WP-2026-07), and the Polaroid Lab (UES-WP-2026-08). The fifth and final entry (UES-WP-2026-10, forthcoming) will be a synthesis paper extracting twelve principles for the 25-mile radius from the four cases. See https://pointcast.xyz/labs for the series hub.',
};
