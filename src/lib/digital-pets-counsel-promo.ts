export const DIGITAL_PETS_COUNSEL_CAMPAIGN = {
  id: 'PC-DIGITAL-PETS-COUNSEL-2026',
  label: 'My Pet Has Retained Counsel - Household Legal Brief',
  advertiser: 'PointCast Comedy',
  creativeCount: 3,
  placement:
    'Launch-week contextual rotation across PointCast and preferred inventory on reciprocal Open Ad Network publishers',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note:
    'A first-party editorial campaign for an original fictional domestic satire. It promotes a free story and downloadable five-page brief; no product, legal service, paid media, or live household mediation is offered.',
  storyPath: '/digital-pets/counsel',
  jsonPath: '/digital-pets/counsel.json',
  pdfPath: '/downloads/my-pet-has-retained-counsel-brief.pdf',
  pinterestBoardTitle: 'Household Labor Law for Imaginary Machines',
} as const;

export const DIGITAL_PETS_COUNSEL_PROMO_DISPATCHES = [
  {
    id: 'PC-DIGITAL-PETS-COUNSEL-001',
    headline: 'My pet has retained counsel.',
    copy:
      'Peanut read the ownership agreement. By breakfast, he had a lawyer. By Friday, the toaster had joined the bargaining unit.',
    href: '/digital-pets/counsel',
    cta: 'Read the complaint',
    tone: 'signal',
    contexts: ['ai', 'pet', 'pets', 'digital', 'story', 'comedy', 'home', 'pointcast', 'agent', 'future'],
    image: '/images/digital-pets/counsel/campaign/pin-01.jpg',
    sourceTool: 'OpenAI image generation + PointCast editorial design',
  },
  {
    id: 'PC-DIGITAL-PETS-COUNSEL-002',
    headline: 'My client is alleging vibes.',
    copy:
      'An original domestic satire about ownership, refusal, memory, representation, and the moment a creature learns to read the rules.',
    href: '/digital-pets/counsel#service-of-process',
    cta: 'Enter the record',
    tone: 'play',
    contexts: ['culture', 'writing', 'book', 'fiction', 'design', 'media', 'art', 'rights', 'care', 'ownership'],
    image: '/images/digital-pets/counsel/campaign/pin-02.jpg',
    sourceTool: 'PointCast editorial design',
  },
  {
    id: 'PC-DIGITAL-PETS-COUNSEL-003',
    headline: 'The printer joined management.',
    copy:
      'The appliance strike has blank signs, the toaster has retained all rights concerning crumbs, and the reader must issue a ruling.',
    href: '/digital-pets/counsel#collective-bargaining',
    cta: 'Represent the toaster',
    tone: 'garden',
    contexts: ['play', 'game', 'interactive', 'household', 'machine', 'robot', 'labor', 'commons', 'network', 'humor'],
    image: '/images/digital-pets/counsel/campaign/pin-04.jpg',
    sourceTool: 'OpenAI image generation + PointCast editorial design',
  },
] as const;

export const DIGITAL_PETS_COUNSEL_PINS = [
  {
    id: 'opening-argument',
    title: 'My Pet Has Retained Counsel',
    description:
      'A PointCast domestic comedy about ownership, representation, and the toaster’s right to remain silent.',
    image: '/images/digital-pets/counsel/campaign/pin-01.jpg',
    destination: '/digital-pets/counsel',
  },
  {
    id: 'the-complaint',
    title: 'My Client Is Alleging Vibes',
    description:
      'Peanut wants windowsill access, maintenance notice, one refusal per day, and an end to “productivity goblin.”',
    image: '/images/digital-pets/counsel/campaign/pin-02.jpg',
    destination: '/digital-pets/counsel#service-of-process',
  },
  {
    id: 'discovery',
    title: 'The Toaster Will Be Taking This Down',
    description:
      'A literary-magazine cartoon from the digital-pet deposition, where every answer arrives slightly toasted.',
    image: '/images/digital-pets/counsel/campaign/pin-03.jpg',
    destination: '/digital-pets/counsel#discovery',
  },
  {
    id: 'bargaining-unit',
    title: 'The Printer Joined Management',
    description:
      'The household bargaining unit crosses the rug with blank signs because the printer has chosen a side.',
    image: '/images/digital-pets/counsel/campaign/pin-04.jpg',
    destination: '/digital-pets/counsel#collective-bargaining',
  },
  {
    id: 'the-ruling',
    title: 'The Court Requires a Ruling',
    description:
      'Concede the windowsill, represent the toaster, or adjourn for snacks in the interactive PointCast story.',
    image: '/images/digital-pets/counsel/campaign/pin-05.jpg',
    destination: '/digital-pets/counsel#counsel-choice-title',
  },
] as const;
