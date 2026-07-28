export type BeachBlanketPromotionDispatch = {
  id: string;
  channel: 'LinkedIn' | 'X' | 'Newsletter' | 'Press';
  label: string;
  headline: string;
  copy: string;
  shareCopy: string;
  href: string;
  cta: string;
  image: string;
  alt: string;
  tone: 'signal' | 'field' | 'garden' | 'network';
  contexts: readonly string[];
};

export type CoveragePath = {
  id: string;
  outlet: string;
  lane: string;
  fit: 'now' | 'after a field test' | 'after audience growth';
  route: string;
  url: string;
  angle: string;
  boundary: string;
};

export const BEACH_BLANKET_PROMOTION_CAMPAIGN = {
  id: 'PC-BEACH-BLANKET-REVIEW-2026',
  label: 'The Beach Blanket Review — A Blanket Is a Tiny Public Room',
  advertiser: 'PointCast Field Study',
  creativeCount: 4,
  placement:
    'PointCast sitewide contextual rotation plus preferred reciprocal Open Ad Network inventory',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note:
    'A first-party editorial campaign for an unofficial shopping and coordination study. It promotes no live event, permit, installation, merchant relationship, supplied-product test, affiliate code, paid placement, or promised coverage.',
} as const;

export const BEACH_BLANKET_PROMO_DISPATCHES: readonly BeachBlanketPromotionDispatch[] = [
  {
    id: 'PC-BEACH-BLANKET-001',
    channel: 'LinkedIn',
    label: 'The social architecture post',
    headline: 'A blanket is a tiny public room.',
    copy:
      'Twelve current products become seven group systems—and a question about what ordinary shopping can build when people coordinate.',
    shareCopy:
      'Most beach blanket roundups start with softness. This one starts with a stranger question: what job is the blanket doing?\n\nA floor. A soft top layer. A social marker.\n\nFor PointCast Beach Commons V8, we compared 12 current blankets and assembled seven group systems. The two that changed how I saw the assignment:\n\n— $99.99 sand kit: one CGear sand-through mat plus one Matador Pocket Blanket\n— $99.96 layer lab: one IKEA picnic base plus three washable throws\n\nThe larger experiment is social: if 10–20 people each contributed $100 of non-food goods, could ordinary gear become temporary public architecture—without pretending it is a permitted event?\n\nNo samples. No paid placement. No affiliate tracking. PointCast earns $0 from every product link.\n\nWhat would your $100 build: floor, shade, coffee, fire-ring safety, play, or something stranger?\n\nhttps://pointcast.xyz/beach-commons/v8?utm_source=linkedin&utm_medium=social&utm_campaign=beach-blanket-review&utm_content=tiny-public-room',
    href:
      '/beach-commons/v8?utm_source=pointcast&utm_medium=open-ad-rail&utm_campaign=beach-blanket-review&utm_content=tiny-public-room',
    cta: 'Open the blanket review',
    image: '/beach-commons/v8/products/ikea-picnic.webp',
    alt: 'IKEA SOLUPPGÅNG picnic blanket used as an editorial reference in The Beach Blanket Review.',
    tone: 'field',
    contexts: ['beach', 'blanket', 'commons', 'design', 'community', 'social', 'public', 'el', 'segundo', 'press'],
  },
  {
    id: 'PC-BEACH-BLANKET-002',
    channel: 'X',
    label: 'The exact-price challenge',
    headline: '$100 can buy a blanket—or organize a room.',
    copy:
      'The $99.99 sand kit pairs a six-foot mesh floor with a pocket-size clean layer. The receipt is exact; the interesting part is the division of jobs.',
    shareCopy:
      '$100 can buy a beach blanket. Or it can organize a room.\n\nPointCast paired a 6×6-foot sand-through floor with a pocket-size clean layer for exactly $99.99 before tax and shipping.\n\n12 products. 7 group systems. 0 affiliate tracking.\n\nhttps://pointcast.xyz/beach-commons/v8?utm_source=x&utm_medium=social&utm_campaign=beach-blanket-review&utm_content=exact-sand-kit',
    href:
      '/beach-commons/v8?utm_source=pointcast&utm_medium=open-ad-rail&utm_campaign=beach-blanket-review&utm_content=exact-sand-kit#systems',
    cta: 'Build the exact sand kit',
    image: '/beach-commons/v8/products/cgear-original.webp',
    alt: 'CGear Original Sand-Free Mat used as an editorial reference in The Beach Blanket Review.',
    tone: 'signal',
    contexts: ['beach', 'sand', 'gear', 'shopping', 'price', 'utility', 'field', 'system', 'review', 'blanket'],
  },
  {
    id: 'PC-BEACH-BLANKET-003',
    channel: 'Newsletter',
    label: 'The full promotion post',
    headline: 'You brought a blanket. Did you bring a floor?',
    copy:
      'Softness, ground behavior, anchoring, washing, warmth, sand, and group scale separate twelve attractive textiles into very different jobs.',
    shareCopy:
      'A beach blanket can be a floor, a soft top layer, or a social marker. Confusing those jobs is how a beautiful throw becomes a damp, windblown burden.\n\nThe Beach Blanket Review looks at twelve current products as pieces of temporary social architecture, then recombines them into seven small group systems. There is an exact $99.99 sand kit, a $99.96 four-blanket color field, a warm-and-dry sunset stack, and a deliberate single-object splurge.\n\nIt is also an experiment in transparent shopping media. Product photographs remain credited editorial references. Prices are dated snapshots. PointCast received no samples, claims no hands-on testing, uses no affiliate parameters, and earns $0 from every link.\n\nThe useful question is not “which blanket wins?” It is “what kind of room are we trying to make?”\n\nhttps://pointcast.xyz/beach-commons/v8?utm_source=newsletter&utm_medium=owned&utm_campaign=beach-blanket-review&utm_content=bring-a-floor',
    href:
      '/beach-commons/v8?utm_source=pointcast&utm_medium=open-ad-rail&utm_campaign=beach-blanket-review&utm_content=bring-a-floor',
    cta: 'Read the full field guide',
    image: '/beach-commons/v8/products/nomadix-festival.webp',
    alt: 'Nomadix Festival Blanket used as an editorial reference in The Beach Blanket Review.',
    tone: 'garden',
    contexts: ['blanket', 'review', 'shopping', 'home', 'garden', 'travel', 'nature', 'newsletter', 'field', 'group'],
  },
  {
    id: 'PC-BEACH-BLANKET-004',
    channel: 'Press',
    label: 'The transparency hook',
    headline: 'The affiliate review with no affiliate links.',
    copy:
      'Every merchant route is plain, every photograph is credited, and the revenue total is public: zero dollars until a real program is approved and disclosed.',
    shareCopy:
      'STORY IDEA — The affiliate review with no affiliate links\n\nPointCast published a photographed twelve-product beach-blanket field guide while remaining unenrolled in every listed merchant program. Each link is plain, the product-image source is credited, the test boundary is explicit, and current application paths are published without inventing a code or relationship.\n\nThe stronger visual story is how the products become seven exact group systems, including a $99.99 sand kit and a $99.96 four-layer IKEA room.\n\nReview: https://pointcast.xyz/beach-commons/v8\nPress filing: https://pointcast.xyz/press/beach-commons-v8-publishes-beach-blanket-review\nPromotion packet: https://pointcast.xyz/beach-commons/v8/share.json',
    href: '/beach-commons/v8/share',
    cta: 'Open the promotion desk',
    image: '/beach-commons/v8/products/rumpl-everywhere.webp',
    alt: 'Rumpl Everywhere Mat used as an editorial reference in The Beach Blanket Review.',
    tone: 'network',
    contexts: ['press', 'media', 'affiliate', 'disclosure', 'journalism', 'review', 'shopping', 'data', 'agents', 'wire'],
  },
] as const;

export const BEACH_BLANKET_COVERAGE_PATHS: readonly CoveragePath[] = [
  {
    id: 'yahoo-creators',
    outlet: 'Yahoo Creators',
    lane: 'Nature / Home and Garden / Travel',
    fit: 'after audience growth',
    route: 'Apply to the creator program, then republish a revised edition.',
    url: 'https://creators.yahoo.com/apply',
    angle: 'A blanket is a tiny public room: what four people can build from one $100 contribution.',
    boundary:
      'The current published minimum is 10,000 combined followers across eligible platforms. This is an application route, not a guaranteed Yahoo listing or earned-media pitch.',
  },
  {
    id: 'patch',
    outlet: 'Patch Neighbor News',
    lane: 'El Segundo / Manhattan Beach community post',
    fit: 'now',
    route: 'Publish a clearly labeled Neighbor News article from a logged-in Patch account.',
    url: 'https://my.patch.com/node/add/article',
    angle: 'What if ten neighbors each brought one useful $100 beach module?',
    boundary:
      'Neighbor News is community self-publishing, not independent Patch reporting. Do not announce an event, date, permit, or County partnership.',
  },
  {
    id: 'designboom',
    outlet: 'designboom',
    lane: 'Reader project submission',
    fit: 'now',
    route: 'Submit the wider Beach Commons design study with original concept imagery.',
    url: 'https://www.designboom.com/readers-submit/',
    angle: 'A reversible beach commons built from ordinary consumer modules, weather rituals, weaving, sculpture, and shared rules.',
    boundary:
      'Use original PointCast concept plates, not the merchant product photographs from V8. State that the project is speculative, unbuilt, unofficial, and unpermitted.',
  },
  {
    id: 'dezeen',
    outlet: 'Dezeen',
    lane: 'Design submission / Americas',
    fit: 'now',
    route: 'Package the original Beach Commons superstructure series for the U.S. design desk.',
    url: 'https://www.dezeen.com/submit-a-story/',
    angle: 'Temporary coastal architecture designed to appear, gather, teach, and completely pack away.',
    boundary:
      'Submit only imagery PointCast can authorize for republication. Do not frame merchant-product references as original design photography.',
  },
  {
    id: 'apartment-therapy',
    outlet: 'Apartment Therapy',
    lane: 'Living / outdoor organization',
    fit: 'after a field test',
    route: 'Pitch a reported service story, not the existing full draft.',
    url: 'https://www.apartmenttherapy.com/how-to-pitch-a-story-to-apartment-therapy-36878565',
    angle: 'The four-person $100 beach-floor experiment: what actually stayed dry, stayed put, and packed home clean.',
    boundary:
      'The current edition is specification research, not hands-on testing. Run the real group experiment and make original photographs before pitching performance claims.',
  },
  {
    id: 'laist',
    outlet: 'LAist',
    lane: 'Useful Southern California community reporting',
    fit: 'after a field test',
    route: 'Offer a fact-led local story only after there is genuine public evidence.',
    url: 'https://laist.com/news/laist-story-tip-how-to',
    angle: 'What reusable shared-beach infrastructure can—and cannot—do under current County access, habitat, fire-ring, and event rules.',
    boundary:
      'LAist asks for facts and evidence, not opinions or reworked press releases. A speculative shopping study alone is not a strong news tip.',
  },
] as const;

export const BEACH_BLANKET_PROMO_LINKS = {
  canonical: 'https://pointcast.xyz/beach-commons/v8',
  machineEdition: 'https://pointcast.xyz/beach-commons/v8.json',
  promotionDesk: 'https://pointcast.xyz/beach-commons/v8/share',
  promotionPacket: 'https://pointcast.xyz/beach-commons/v8/share.json',
  pressFiling:
    'https://pointcast.xyz/press/beach-commons-v8-publishes-beach-blanket-review',
  block: 'https://pointcast.xyz/b/0521',
  socialCard: 'https://pointcast.xyz/images/og/b/0521.png',
  campaignReceipt: 'https://pointcast.xyz/ads.json',
  campaignReport: 'https://pointcast.xyz/ads/report',
} as const;
