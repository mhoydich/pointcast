export const DIGITAL_PETS_PROMO_META = {
  schema: 'pointcast.digital-pets-promo/v2',
  title: 'The Animal After the Internet — campaign desk',
  description:
    'The live launch, reusable copy, chapter links, artwork, and six-week test office for PointCast Future Book 001.',
  route: '/digital-pets/share',
  jsonRoute: '/digital-pets/share.json',
  bookRoute: '/digital-pets',
  officeRoute: '/digital-pets/office',
  officeJsonRoute: '/digital-pets/office.json',
  blockRoute: '/b/0514',
  campaign: 'future-book-001-digital-pets',
  status: 'launched',
  launchChannel: 'X',
  launchAccount: '@mhoydich',
  launchUrl: 'https://x.com/mhoydich/status/2081936870641205589',
  launchedAt: '2026-07-27T19:56:00-07:00',
  launchPosts: 7,
  updatedAt: '2026-07-27T20:05:00-07:00',
  principle: 'Promote the ownership argument, not the topic category.',
} as const;

export const DIGITAL_PETS_PROMO_ANGLES = [
  {
    id: 'offline-self',
    label: 'Architecture disguised as fur',
    headline: 'Personality must survive Wi‑Fi.',
    copy:
      'If the network goes down and the creature becomes furniture, the company owned the personality. A real digital pet keeps a minimum viable self at home.',
    chapter: 5,
    path: '/digital-pets#its-personality-must-survive-wifi',
    image: '/images/digital-pets/plate-03-memory.webp',
    alt: 'A soft digital creature surrounded by translucent memory vessels in a cobalt room',
  },
  {
    id: 'memory-custody',
    label: 'The ownership question',
    headline: 'Memory is custody, not retention.',
    copy:
      'The important promise is not that a company will remember everything. It is that a household can carry the relationship forward without asking permission.',
    chapter: 6,
    path: '/digital-pets#memory-is-custody-not-retention',
    image: '/images/digital-pets/plate-06-editions.webp',
    alt: 'Several editions of one authored digital creature arranged like a publishing sequence',
  },
  {
    id: 'no-ransom',
    label: 'The economic line',
    headline: 'A subscription cannot decide whether your pet wakes up.',
    copy:
      'Charge for new stories, service, repair, and care. Never charge rent on the creature’s continued existence.',
    chapter: 9,
    path: '/digital-pets#a-monthly-fee-should-never-decide-whether-your-pet-wakes-up',
    image: '/images/digital-pets/plate-01-cover.webp',
    alt: 'A small soft digital creature waiting beside its charging bowl',
  },
] as const;

export const DIGITAL_PETS_X_THREAD = [
  {
    number: 1,
    text:
      'What should a person own in an AI world?\n\nWe made a whole book to answer that question through digital pets: bodies, memory, refusal, subscriptions, death, and the right to carry a creature forward.\n\nhttps://pointcast.xyz/digital-pets',
  },
  {
    number: 2,
    text:
      'The next great AI product will be a pet, not an assistant.\n\nAn assistant is judged by how quickly it disappears. A pet is loved because it remains.',
  },
  {
    number: 3,
    text:
      'A digital pet needs a body.\n\nNot realism. Limits. It occupies a chair, needs charging, can be held by someone else, and cannot be everywhere at once. Those constraints are where shared time begins.',
  },
  {
    number: 4,
    text:
      'Personality must survive Wi‑Fi.\n\nIf the network goes down and the creature becomes furniture, the company owned the personality. Keep the minimum viable self—identity, reflexes, rhythms, and recent memory—at home.',
  },
  {
    number: 5,
    text:
      'Memory is custody, not retention.\n\nThe promise is not “we remember everything.” The promise is “you can carry the relationship forward without asking us.” Export should feel like a family archive, not a database dump.',
  },
  {
    number: 6,
    text:
      'A subscription should never decide whether your pet wakes up.\n\nSell new stories. Sell repair. Sell care. Sell beautiful editions. Do not hold a creature’s continued existence for ransom.',
  },
  {
    number: 7,
    text:
      'And every digital pet needs a graveyard.\n\nIf we make creatures people can love, mortality is a product requirement—not an outage message.\n\nThe Animal After the Internet, a PointCast Future Book:\nhttps://pointcast.xyz/digital-pets',
  },
] as const;

export const DIGITAL_PETS_SINGLE_POSTS = [
  {
    id: 'offline',
    label: 'Architecture',
    text:
      'Personality must survive Wi‑Fi. If your digital pet loses its identity when the network drops, you never owned the relationship.\n\nhttps://pointcast.xyz/digital-pets#its-personality-must-survive-wifi',
  },
  {
    id: 'custody',
    label: 'Ownership',
    text:
      'Memory is custody, not retention. The meaningful AI promise is not “we stored everything.” It is “you can carry the relationship forward without asking permission.”\n\nhttps://pointcast.xyz/digital-pets#memory-is-custody-not-retention',
  },
  {
    id: 'ransom',
    label: 'Business model',
    text:
      'A subscription should never decide whether your pet wakes up. Charge for stories, service, repair, and care—never rent on the creature’s continued existence.\n\nhttps://pointcast.xyz/digital-pets#a-monthly-fee-should-never-decide-whether-your-pet-wakes-up',
  },
  {
    id: 'graveyard',
    label: 'Culture',
    text:
      'Every digital pet needs a graveyard. If we make creatures people can love, death cannot arrive as a shutdown notice.\n\nhttps://pointcast.xyz/digital-pets#every-digital-pet-needs-a-graveyard',
  },
] as const;

export const DIGITAL_PETS_OUTREACH_NOTES = [
  {
    id: 'product',
    audience: 'Product and hardware builders',
    subject: 'The architecture question hiding inside digital pets',
    note:
      'I made a future book about digital pets, but the real subject is what a person should own in an AI world. The chapters on offline personality, memory custody, and subscription design are the center. I would love your read on where the architecture becomes unrealistic.',
    path: '/digital-pets#its-personality-must-survive-wifi',
  },
  {
    id: 'culture',
    audience: 'Writers, artists, and cultural readers',
    subject: 'What do we owe a creature we made mortal?',
    note:
      'The emotionally hardest chapter in this book is the graveyard: what a company owes people when the hardware bricks, the service closes, or the creature reaches an authored end. I would love to know whether it earns the seriousness of its premise.',
    path: '/digital-pets#every-digital-pet-needs-a-graveyard',
  },
  {
    id: 'business',
    audience: 'Founders and investors',
    subject: 'A digital pet is published IP, not rented software',
    note:
      'The business claim in this book is narrow: an authored creature is an IP asset, the hardware roadmap is a publishing schedule, and recurring revenue cannot become ransom. Curious which part you think survives contact with a real P&L.',
    path: '/digital-pets#a-hardware-roadmap-is-a-publishing-schedule',
  },
] as const;

export const DIGITAL_PETS_PROMO_ASSETS = [
  {
    id: 'launch-card',
    label: 'Launch card · 1200 × 630',
    path: '/images/og/b/0514.png',
    kind: 'social card',
  },
  {
    id: 'creature-cover',
    label: 'Creature cover · 1024 × 1536',
    path: '/images/digital-pets/plate-01-cover.webp',
    kind: 'portrait plate',
  },
  {
    id: 'memory-plate',
    label: 'Memory plate · 1024 × 1536',
    path: '/images/digital-pets/plate-03-memory.webp',
    kind: 'portrait plate',
  },
  {
    id: 'graveyard-plate',
    label: 'Graveyard plate · 1024 × 1536',
    path: '/images/digital-pets/plate-05-graveyard.webp',
    kind: 'portrait plate',
  },
] as const;

export const DIGITAL_PETS_LAUNCH_SEQUENCE = [
  {
    when: 'Hour 0',
    move: 'Publish the seven-post thread.',
    reason: 'Establish the whole argument once. Let the book be the proof link.',
    status: 'complete',
  },
  {
    when: 'Hour 6–12',
    move: 'Send five personal notes, each aimed at one chapter.',
    reason: 'Replies from the right readers are worth more than broad passive impressions.',
    status: 'next',
  },
  {
    when: 'Day 2',
    move: 'Post “Memory is custody” as a standalone claim.',
    reason: 'It carries the PointCast ownership thesis beyond the digital-pets category.',
    status: 'queued',
  },
  {
    when: 'Day 3',
    move: 'Post the graveyard plate and ask one question.',
    reason: 'The emotional argument invites stories, not applause: what should happen when the company dies first?',
    status: 'queued',
  },
  {
    when: 'Day 4',
    move: 'Report the first evidence.',
    reason: 'Share replies, saves, DMs, and where readers stopped. Promotion becomes editorial learning.',
    status: 'queued',
  },
] as const;

export const DIGITAL_PETS_PROMO_MEASURES = [
  'Replies that quote or challenge a specific claim',
  'Direct messages that contain a personal digital-pet story',
  'Saves and bookmarks reported by the posting account',
  'Clicks to a chapter-deep link rather than only the cover',
  'Invitations to discuss hardware, memory, repair, or publishing',
] as const;
