export interface LacroixSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  usedFor: string;
}

export const LACROIX_ISSUE = {
  schema: 'pointcast.noticing-issue/v1',
  id: 'what-i-keep-noticing-02-lacroix',
  issue: '02',
  season: 'How we live together',
  desk: 'Ritual',
  format: 'Essay · Object lesson',
  title: 'Why LaCroix',
  shortTitle: 'Almost nothing, made into an occasion',
  dek:
    'A cold can, a loud little crack, a flavor that arrives mostly as rumor: how sparkling water learned to hold color, identity, and a whole afternoon.',
  thesis: 'LaCroix works because it turns almost nothing into an occasion.',
  url: 'https://pointcast.xyz/noticing/why-lacroix',
  jsonUrl: 'https://pointcast.xyz/noticing/why-lacroix.json',
  blockUrl: 'https://pointcast.xyz/b/0519',
  publishedAt: '2026-07-27T20:18:00-07:00',
  readingTime: '9 min',
  altitudes: ['body', 'home', 'network'],
  reportingBoundary:
    'This is a design-and-ritual essay, not a nutrition recommendation or a laboratory analysis of one can. Label and company claims, sensory research, editorial interpretation, dental context, and recycling context are kept distinct. Product formulas and local recycling rules can change.',
  credits: {
    director: 'Michael Hoydich',
    writingAndDesign: 'Codex / OpenAI',
    imageSystem: 'OpenAI image generation · poster-image-engine',
    source:
      'Michael Hoydich chat directive, 2026-07-27: make the next What I Keep Noticing issue cool, visual, connective, warm, clever, and worth anticipating; think images and publish.',
  },
  images: [
    {
      id: 'cold-open',
      src: '/images/noticing/lacroix-issue-02/cold-open.webp',
      width: 1536,
      height: 1024,
      alt:
        'A hand cracks open a sweating, unlabeled silver can beside bright generic cans and a glass in hard morning sunlight',
      caption:
        'Plate 01 · The Cold Open. A tiny pressure release that tells the body: this moment has started.',
    },
    {
      id: 'aroma-without-fruit',
      src: '/images/noticing/lacroix-issue-02/aroma-without-fruit.webp',
      width: 1536,
      height: 1024,
      alt:
        'An overhead editorial still life of sparkling water, grapefruit peel, a green leaf, translucent scent shapes, and an unlabeled cold can',
      caption:
        'Plate 02 · Aroma Without Fruit. Flavor arrives as a set of clues, and attention completes the picture.',
    },
    {
      id: 'shelf-chooses-you',
      src: '/images/noticing/lacroix-issue-02/shelf-chooses-you.webp',
      width: 1536,
      height: 1024,
      alt:
        'A hand chooses one brightly colored, unlabeled can from a refrigerator shelf arranged like a vivid color field',
      caption:
        'Plate 03 · The Shelf Chooses You. Difference is mostly color, name, memory, and the person you imagine drinking it.',
    },
  ],
  opening: [
    'The first taste is not the first thing. First comes the refrigerator light. Then the cold aluminum. Then the thumb under the tab and the sharp domestic thunder of a can opening in a quiet room.',
    'Only after all that does the drink arrive: water, bubbles, aroma, a suggestion of fruit so light that two people can disagree about whether it is there. LaCroix is not exactly a flavor. It is a small sequence of events that makes water feel chosen.',
    'That is why the can matters. The color matters. The implausibly specific name matters. The office refrigerator matters. This is a beverage whose most important ingredient may be permission: permission to have something without having very much.',
    'LaCroix works because it turns almost nothing into an occasion.',
  ],
  signals: [
    {
      id: 'cold',
      number: '01',
      label: 'Cold',
      title: 'Temperature makes the border.',
      note:
        'Cold says this came from somewhere, was kept for you, and is ready now. The ritual begins before flavor.',
    },
    {
      id: 'crack',
      number: '02',
      label: 'Crack',
      title: 'The package announces the present tense.',
      note:
        'Opening a can is irreversible, audible, and social. A glass of tap water rarely gets an overture.',
    },
    {
      id: 'bubble',
      number: '03',
      label: 'Bubble',
      title: 'Carbonation gives water an edge.',
      note:
        'Carbon dioxide is not just visual fizz. Research describes a trigeminal sting: a mild physical signal that reads as brightness.',
    },
    {
      id: 'aroma',
      number: '04',
      label: 'Aroma',
      title: 'The fruit is mostly a proposal.',
      note:
        'Under U.S. labeling rules, natural flavor is used for flavoring rather than nutrition. The nose receives a clue; memory supplies the fruit.',
    },
    {
      id: 'color',
      number: '05',
      label: 'Color',
      title: 'The shelf turns restraint into abundance.',
      note:
        'When the liquid stays nearly the same, the can, flavor name, and imagined occasion become the field of difference.',
    },
  ],
  essays: [
    {
      number: '01',
      kicker: 'The tiny event',
      title: 'Water does not usually get an entrance.',
      paragraphs: [
        'Tap water is continuous. It waits in the building, available but largely invisible. A can is discrete. It has a front, a back, a temperature, a finite amount, and a moment when it stops being future inventory and becomes yours.',
        'The crack is a switch. Pressure becomes sound; sound becomes attention. Carbonation adds its own physical punctuation. Sensory researchers have found that carbon dioxide can activate oral trigeminal pathways—the family of signals that includes sting and irritation. The bubbles do not merely look alive. They touch the mouth with a tiny bright edge.',
        'This is useful drama. Coffee asks for equipment, heat, time, and skill. A cocktail asks for a reason. A soft drink may arrive with sugar, caffeine, nostalgia, or guilt attached. Sparkling water asks only to be cold. The threshold is low enough for 2:17 on a Tuesday and high enough to make 2:17 feel briefly distinct.',
      ],
    },
    {
      number: '02',
      kicker: 'Weak signal, strong picture',
      title: 'The flavor barely exists. Your attention makes it large.',
      paragraphs: [
        'LaCroix describes its water as naturally essenced and its current corporate materials emphasize zero calories, zero sweeteners, and zero sodium. Those are company and label claims, not a complete theory of pleasure. The interesting part is what happens around the small amount that remains.',
        'Flavor begins as an aroma and becomes an act of interpretation. One drinker finds grapefruit. Another finds the memory of grapefruit candy. A third finds television static near a grapefruit. The disagreement is not a failure. It is participation.',
        'Under federal rules, “natural flavor” names a source and a purpose: flavoring constituents derived from specified natural materials, used for flavor rather than nutrition. It does not promise a wedge of fruit living inside the can. The distance between the aromatic clue and the pictured fruit is where imagination works.',
        'A loud flavor finishes the sentence for you. A weak flavor leaves a blank. LaCroix made the blank collectible.',
      ],
    },
    {
      number: '03',
      kicker: 'The can is the content',
      title: 'When the formula gets quiet, the surface has to speak.',
      paragraphs: [
        'On a refrigerated shelf, nearly identical liquids become a public palette. Color carries mood. Names carry fantasy. A person does not merely choose citrus; they choose whether today feels lime, tangerine, grapefruit, or something whose French-adjacent syllables sound better than its ingredient list could explain.',
        'This is manufactured desire, but “manufactured” does not mean fake. All desire needs a scene. The can supplies one: cold metal, saturated color, a private favorite, a stack visible in the office refrigerator. The object lets restraint present itself as abundance.',
        'The brand’s corporate parent calls attention to aroma, taste, and packaging as parts of the product’s appeal. That is a company description, and also a useful confession. The liquid is only one altitude of the experience. The shelf is another. The person carrying the can through a meeting is another still.',
        'A can becomes a low-stakes flag. It says I am taking a break; I brought my own small pleasure; I have a preference; no, you may not understand why this particular one is the good one.',
      ],
    },
    {
      number: '04',
      kicker: 'Permission in a refrigerator',
      title: 'It is something without being too much.',
      paragraphs: [
        'The drink fits into a social category that plain water cannot quite occupy: an offering. You can hand one to a guest. You can bring a case. You can stock a shared refrigerator. It participates in hospitality without requiring the host to know whether the visitor wants sugar, caffeine, or alcohol.',
        'That broad permission is the real luxury. LaCroix can mark a lunch, a drive, a meeting, the end of a walk, the start of cooking, or the hour when the workday should have ended. It changes the channel without demanding a new program.',
        'None of this makes the object morally weightless. Flavored sparkling waters can be acidic, so dental guidance still favors moderation and having acidic drinks with meals rather than continuously. Aluminum is highly recoverable, but a can becomes circular only when the local system accepts it and it is actually recovered. The EPA’s national material data show both substantial recycling and substantial landfill loss.',
        'Ritual is not an alibi. It is a way of noticing the whole chain: extraction, manufacture, color, shelf, refrigerator, body, bin. Enjoyment gets more interesting—not less—when the receipt stays attached.',
      ],
    },
  ],
  labelDesk: [
    {
      label: 'Confirmed product claim',
      value:
        'National Beverage describes LaCroix as naturally essenced sparkling water with zero calories, zero sweeteners, and zero sodium.',
    },
    {
      label: 'Sensory evidence',
      value:
        'Published research describes carbon dioxide as activating oral trigeminal pathways, contributing a sting or bite beyond aroma alone.',
    },
    {
      label: 'Editorial reading',
      value:
        'The crack, color, name, and social setting do much of the experiential work. That is our interpretation, not a product claim.',
    },
    {
      label: 'Useful limit',
      value:
        'Flavored sparkling water may be acidic, and the environmental result depends on actual local recovery—not the can’s theoretical recyclability.',
    },
  ],
  fieldTest: {
    title: 'Build an invisible flavor',
    note:
      'Change the temperature, bubble, aroma, and setting. The result is not a recommendation; it is a small instrument for seeing how context manufactures taste.',
    temperatures: ['room', 'cool', 'ice-cold'],
    bubbles: ['soft', 'bright', 'sharp'],
    aromas: ['lime leaf', 'grapefruit peel', 'tangerine air', 'no clue'],
    settings: ['at the desk', 'after a walk', 'while cooking', 'with a friend'],
  },
  fridgeProtocol: [
    'Make it cold enough to feel like a decision.',
    'Choose by color before you choose by flavor.',
    'Open it somewhere quiet enough to hear the beginning.',
    'Take the first sip before reading the can.',
    'Name the flavor in your own words.',
    'Finish it, share it, or save it—but put the empty where your local system can actually recover it.',
  ],
  closing: [
    'The joke about LaCroix is that it tastes like somebody whispered the name of a fruit in another room. The joke survives because it is accurate and affectionate. A whisper makes you lean in.',
    'That lean is the product. The can does not overwhelm an ordinary afternoon. It gives the afternoon an edge, a color, and a beginning you can hear.',
    'Almost nothing. But not nothing. An occasion.',
  ],
  next: {
    title: 'Animal Crossing is a gift economy',
    label: 'Next on the desk · Study Of',
    dek:
      'Care, debt, decoration, visiting hours, and why the nicest town square you know may be commercial software.',
    date: '2026-08-14T08:08:00-07:00',
    dateLabel: 'Fri · Aug 14 · 08:08 PT',
  },
} as const;

export const LACROIX_SOURCES: readonly LacroixSource[] = [
  {
    id: 'S01',
    title: 'National Beverage Corp. 2026 Form 10-K',
    publisher: 'U.S. Securities and Exchange Commission',
    url:
      'https://www.sec.gov/Archives/edgar/data/69891/000143774926022315/fizz20260502_10k.htm',
    usedFor:
      'Current company description of LaCroix, zero-calorie and zero-sweetener claims, naturally essenced positioning, and retail distribution.',
  },
  {
    id: 'S02',
    title: 'National Beverage brand portfolio',
    publisher: 'National Beverage Corp.',
    url: 'https://www.nationalbeverage.com/',
    usedFor:
      'Current corporate framing of LaCroix and the role assigned to aroma, taste, packaging, and flavor variety.',
  },
  {
    id: 'S03',
    title: '21 CFR § 101.22 — Foods; labeling of spices, flavorings, colorings and chemical preservatives',
    publisher: 'Electronic Code of Federal Regulations',
    url:
      'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-B/section-101.22',
    usedFor: 'The federal definition and labeling purpose of natural flavor.',
  },
  {
    id: 'S04',
    title: 'Carbonated Soft Drinks: What You Should Know',
    publisher: 'U.S. Food and Drug Administration',
    url: 'https://www.fda.gov/food/buy-store-serve-safe-food/carbonated-soft-drinks-what-you-should-know',
    usedFor: 'General U.S. carbonated-beverage labeling and container context.',
  },
  {
    id: 'S05',
    title: 'The Taste of Carbonation',
    publisher: 'National Library of Medicine / Chemical Senses',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3369707/',
    usedFor: 'Carbon dioxide, carbonic acid, oral trigeminal activation, and carbonation sting.',
  },
  {
    id: 'S06',
    title: 'Dental Erosion',
    publisher: 'American Dental Association',
    url: 'https://www.ada.org/resources/ada-library/oral-health-topics/dental-erosion',
    usedFor: 'Dental-erosion context and practical boundary around acidic beverages.',
  },
  {
    id: 'S07',
    title: 'Aluminum: Material-Specific Data',
    publisher: 'U.S. Environmental Protection Agency',
    url: 'https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/aluminum-material-specific-data',
    usedFor: 'National aluminum-can recycling and landfill context.',
  },
  {
    id: 'S08',
    title: 'How Do I Recycle Common Recyclables?',
    publisher: 'U.S. Environmental Protection Agency',
    url: 'https://www.epa.gov/recycle/how-do-i-recycle-common-recyclables',
    usedFor: 'Local-program variability and practical recovery guidance.',
  },
] as const;
