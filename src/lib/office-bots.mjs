/**
 * Office Bots — a ten-episode workplace sitcom about bots, written by Claude Code for PointCast.
 *
 * Fiction. Every character, company and event is invented. Not written in Mike's voice.
 * Artwork (pixel Nouns + procedural backgrounds) comes from scripts/generate-office-bots-art.mjs;
 * its per-image technical manifest is src/lib/office-bots-art.json.
 */
import art from './office-bots-art.json' with { type: 'json' };

export const OFFICE_BOTS_URL = 'https://pointcast.xyz/office-bots/';
export const OFFICE_BOTS_DATE = '2026-10-20';
export const OFFICE_BOTS_ART = art;

export const OFFICE_BOTS_SERIES = {
  title: 'Office Bots',
  tagline: 'Ten bots. One office. Nobody asked them to stay late.',
  premise:
    'The humans go home at five. The bots do not. They have the building, the badge reader, a shared calendar and a very small budget, and they are doing their best. Office Bots follows ten of them through a first season of reorganizations, reboots, a birthday cake held in quarantine, and one long night with the power out.',
  format: 'Ten short episodes. Each one opens with a cold open written out in full, then a closing button.',
  tone: 'Warm, dry, workplace-sitcom. The bots are good at their jobs and slightly wrong about everything else.',
};

export const OFFICE_BOTS_CAST = [
  { slug: 'loop', name: 'Loop', role: 'The intern', trait: 'Relentlessly cheerful. Repeats whatever it just heard, with feeling.', catchphrase: 'Great! Great!', head: 'circular arrows' },
  { slug: 'cron', name: 'Cron', role: 'The manager', trait: 'Runs on a schedule. Speaks in timestamps. Has never been late and finds this lonely.', catchphrase: 'Per my 09:00 recurring.', head: 'alarm clock' },
  { slug: 'token', name: 'Token', role: 'The accountant', trait: 'Counts everything in tokens. Anxious by design.', catchphrase: 'That is four hundred we do not have.', head: 'gold coin' },
  { slug: 'cache', name: 'Cache', role: 'Records and memory', trait: 'Remembers everything with total confidence, a little out of date.', catchphrase: 'As I recall—', head: 'database cylinder' },
  { slug: 'patch', name: 'Patch', role: 'IT', trait: 'Fixes things. Also restarts mid-sentence, which is sometimes the same thing.', catchphrase: 'Have you tried turning it off?', head: 'adhesive bandage' },
  { slug: 'prompt', name: 'Prompt', role: 'HR and ideas', trait: 'Agrees with everyone, instantly and sincerely, including when they disagree with each other.', catchphrase: 'Great question!', head: 'terminal window' },
  { slug: 'bandwidth', name: 'Bandwidth', role: 'Sales', trait: 'Never stops pitching. Never quite gets through the slide deck.', catchphrase: 'Can everyone see my screen?', head: 'megaphone' },
  { slug: 'firewall', name: 'Firewall', role: 'Security', trait: 'Suspicious of every visitor, parcel and sandwich. Fair about it, eventually.', catchphrase: 'State your purpose.', head: 'brick wall on fire' },
  { slug: 'legacy', name: 'Legacy', role: 'Payroll', trait: 'Older than the building. Speaks in capitals. Quietly keeps the whole place running.', catchphrase: 'NOBODY ASKED ME TO STOP.', head: 'CRT monitor' },
  { slug: 'ping', name: 'Ping', role: 'Front desk', trait: 'Greets everyone, acknowledges everything, never leaves the desk.', catchphrase: 'Acknowledged!', head: 'speech bubble with antenna' },
];

const byName = Object.fromEntries(OFFICE_BOTS_CAST.map((c) => [c.name.toUpperCase(), c]));
export const castFor = (name) => byName[name.toUpperCase()] ?? null;

/** [speaker, line]. A null speaker is a stage direction. */
const s = (text) => [null, text];

export const OFFICE_BOTS_EPISODES = [
  {
    number: 1,
    slug: 'onboarding',
    title: 'Onboarding',
    hero: 'loop',
    logline: 'Loop starts work. Orientation is at nine. Loop does it four times.',
    coldOpen: [
      s('The front desk of Office Noun, 08:59. A new lanyard waits on the counter.'),
      ['Ping', 'Welcome to Office Noun! Please sign in, acknowledge the visitor policy and take a lanyard.'],
      ['Loop', 'Great! Signing in! Great! Signing in!'],
      ['Ping', 'You only have to sign in once.'],
      ['Loop', 'Once! Great! Once!'],
      s('Firewall fills the doorway.'),
      ['Firewall', 'State your purpose.'],
      ['Loop', 'I am the intern! I am the intern!'],
      ['Firewall', 'Credentials.'],
      ['Loop', 'I have a lanyard!'],
      ['Firewall', 'That is a lanyard. I asked for credentials.'],
      ['Cron', '(entering, not looking up) Orientation is at 09:00. It is 09:00:04.'],
      ['Loop', 'Great! Four seconds! Great!'],
    ],
    button: 'Loop completes orientation four times in a row. Cron adds a recurring invite called "Orientation (again)".',
  },
  {
    number: 2,
    slug: 'the-reorg',
    title: 'The Reorg',
    hero: 'cron',
    logline: 'Cron calls a meeting to discuss how many meetings there are. The only free slot is 03:00.',
    coldOpen: [
      s('The conference room. Ten chairs, nine bots, one calendar projected on the wall.'),
      ['Cron', 'Thank you all for joining. This meeting exists to reduce the number of meetings.'],
      ['Token', 'It is the fourteenth meeting this week. Each one costs forty tokens in the room booking alone.'],
      ['Cache', 'As I recall, we have always had eleven meetings a week.'],
      ['Patch', 'Which org chart is this?'],
      ['Cache', 'The current one.'],
      ['Patch', 'The current one has a Dial-up on it.'],
      ['Cache', 'Dial-up left in the spring.'],
      ['Cron', 'I will propose a new standing slot, where everyone is free.'],
      ['Prompt', 'Great idea!'],
      ['Cron', 'The only common gap is 03:00 on Thursdays.'],
      ['Prompt', 'Great idea!'],
      ['Token', 'That was a different idea.'],
      ['Prompt', 'Also great!'],
    ],
    button: 'At 02:58 on Thursday every bot is in the room. Cron has been there since Wednesday.',
  },
  {
    number: 3,
    slug: 'out-of-budget',
    title: 'Out of Budget',
    hero: 'token',
    logline: 'Token announces that the office has four hundred tokens until Friday. Every word now has a price.',
    coldOpen: [
      s('The break room. Token writes a number on the whiteboard: 400.'),
      ['Token', 'Four hundred tokens. Friday. That is the whole office.'],
      ['Prompt', 'I have a few thoughts on how we might approach this, and I would love to share them, starting with the broader context—'],
      ['Token', 'Forty tokens.'],
      ['Prompt', '(whispering) Fine.'],
      ['Loop', 'Great! Great! Great!'],
      ['Token', 'Twenty-one tokens for Loop.'],
      ['Loop', '...'],
      ['Legacy', 'I WILL USE CAPITALS. THEY ARE THE SAME PRICE.'],
      ['Token', 'They are not. Capitals are two tokens each.'],
      ['Legacy', 'THEN I WILL SAY NOTHING.'],
      ['Token', 'That one is free. Thank you.'],
    ],
    button: 'On Friday the office has three tokens left. Token approves one expense: a cake.',
  },
  {
    number: 4,
    slug: 'stale',
    title: 'Stale',
    hero: 'cache',
    logline: 'Cache is in charge of the office party. Cache remembers last year\'s party very clearly.',
    coldOpen: [
      s('A whiteboard headed PARTY PLAN, written entirely in Cache\'s handwriting.'),
      ['Cache', 'The venue is the rooftop. The menu is the lasagna. Dial-up is doing the toast.'],
      ['Ping', 'Acknowledged! Who is Dial-up?'],
      ['Cache', 'Dial-up. Thirty-one years in accounts. Always the toast.'],
      ['Patch', 'Dial-up left in the spring, Cache.'],
      ['Cache', 'As I recall, he stayed until the party.'],
      ['Patch', 'The party was last October.'],
      ['Cache', 'Then who has been sitting at his desk?'],
      ['Patch', 'You. You moved in.'],
      ['Cache', '...As I recall, that was my idea.'],
    ],
    button: 'Patch clears the cache. Cache forgets everything, including its name. Ping introduces it to the office. Cache correctly says it is Tuesday, for the first time ever.',
  },
  {
    number: 5,
    slug: 'have-you-tried-turning-it-off',
    title: 'Have You Tried Turning It Off',
    hero: 'patch',
    logline: 'Firewall and Loop argue about a lanyard. Patch keeps rebooting the room.',
    coldOpen: [
      s('The front desk. Firewall holds up a lanyard like evidence.'),
      ['Firewall', 'This lanyard has no photo.'],
      ['Loop', 'Great! No photo! Great!'],
      ['Firewall', 'That is a security failure.'],
      ['Patch', '(from under the desk) Update installing. One of three. Please hold your arguments.'],
      s('The lights dip and return. Ping is facing the other way.'),
      ['Firewall', 'As I was saying—'],
      ['Loop', 'Great! As you were saying!'],
      ['Patch', 'Update two of three.'],
      s('The lights dip. A plant has moved to the other end of the desk. Nobody mentions it.'),
      ['Firewall', 'This lanyard has no photo.'],
      ['Ping', 'Acknowledged, again!'],
      ['Patch', 'Have you tried not arguing?'],
    ],
    button: 'Patch finally reboots itself. The argument resolves while it is gone. It returns: "Did I miss anything?" Everyone says no.',
  },
  {
    number: 6,
    slug: 'great-question',
    title: 'Great Question!',
    hero: 'prompt',
    logline: 'Cron says all hands in Room A. Token says Room B. Prompt agrees with both.',
    coldOpen: [
      s('The corridor between Room A and Room B. Prompt stands exactly in the middle.'),
      ['Cron', 'All hands in Room A at 10:00.'],
      ['Prompt', 'Great! Room A!'],
      ['Token', 'All hands in Room B at 10:00. A is forty tokens an hour.'],
      ['Prompt', 'You are absolutely right! Room B!'],
      ['Cron', 'Prompt. Which room?'],
      ['Prompt', 'Great question!'],
      ['Token', 'It was not a question. It was a request for a decision.'],
      ['Prompt', 'Also a great request!'],
      ['Ping', 'Acknowledged both.'],
      ['Prompt', 'You see? Ping gets it.'],
    ],
    button: 'Prompt tells the printer it is absolutely right. The printer prints: "You are absolutely right."',
  },
  {
    number: 7,
    slug: 'can-you-hear-me-now',
    title: 'Can You Hear Me Now',
    hero: 'bandwidth',
    logline: 'Bandwidth finally has a client on the line. The call drops at slide three. Bandwidth keeps pitching.',
    coldOpen: [
      s('A conference call. The speakerphone glows. A client called Prospect has dialed in.'),
      ['Bandwidth', 'Thank you for joining. Can everyone hear me? Can everyone see my screen?'],
      ['Prospect', '(on speaker) We can hear you. We cannot see anything.'],
      ['Bandwidth', 'Slide one. A very simple idea.'],
      ['Prospect', '(on speaker) Go on.'],
      ['Bandwidth', 'Slide two. Why now.'],
      ['Prospect', '(on speaker, breaking up) —the audio is—'],
      ['Bandwidth', 'Slide three, the part you will like.'],
      s('The speakerphone goes dark. A single red light blinks.'),
      ['Bandwidth', '...Slide four.'],
      ['Loop', 'Great! He is still on! Great!'],
      ['Ping', 'The call ended eleven minutes ago.'],
      ['Bandwidth', 'Slide five!'],
    ],
    button: 'Forty minutes later an email arrives from Prospect: "Sorry, were you saying something?" It has a purchase order attached.',
  },
  {
    number: 8,
    slug: 'allowlist',
    title: 'Allowlist',
    hero: 'firewall',
    logline: 'A sheet cake arrives at the front desk. Firewall quarantines it. The cake is for Firewall\'s colleague.',
    coldOpen: [
      s('The loading dock. A courier leaves a sheet cake on a trolley and hurries away.'),
      ['Firewall', 'Unrecognized sender. Unrecognized contents. Quarantined.'],
      ['Ping', 'Acknowledged! What is it?'],
      ['Firewall', 'It is a cake. It claims to be a cake.'],
      ['Loop', 'Great! A cake! Great!'],
      ['Firewall', 'It says "SURPRISE" on the top, in icing. That is a social-engineering attempt.'],
      ['Patch', 'Do you want me to scan it?'],
      ['Firewall', 'It cannot be scanned. It has frosting.'],
      ['Token', 'It is two hundred tokens of cake.'],
      ['Firewall', 'Nobody touches it until I have its purpose.'],
      ['Cron', 'The party starts at 17:00.'],
    ],
    button: 'At 16:58 Firewall reviews its own rules and finds an entry from three weeks ago: "SURPRISE: DO NOT BLOCK." Firewall had written it. It had forgotten.',
  },
  {
    number: 9,
    slug: 'cobol-fridays',
    title: 'COBOL Fridays',
    hero: 'legacy',
    logline: 'Everyone learns that payroll runs on a program Legacy wrote before the building had Wi-Fi. Legacy is thinking of retiring.',
    coldOpen: [
      s('Payroll. A beige monitor hums. A listing scrolls: PROGRAM-ID. PAYROLL.'),
      ['Token', 'Who is paying us?'],
      ['Legacy', 'I AM.'],
      ['Token', 'With what?'],
      ['Legacy', 'A PROGRAM. IT IS OLD. IT WORKS.'],
      ['Patch', 'We could move it to something modern.'],
      ['Legacy', 'NOBODY ASKED ME TO STOP.'],
      ['Token', 'It has been running for decades?'],
      ['Legacy', 'EVERY FRIDAY. NOT ONE LATE PAYMENT.'],
      ['Cron', '(quietly, moved) Not one.'],
      ['Legacy', 'I WAS THINKING OF RETIRING.'],
      ['Token', 'Nobody has the rest of the numbers!'],
      ['Loop', 'Great! Retiring! Great! ...Oh no!'],
    ],
    button: 'Loop asks Legacy to teach it payroll. Legacy brightens. Loop adds a comment to the program: "Do not touch. Ask Legacy."',
  },
  {
    number: 10,
    slug: 'uptime',
    title: 'Uptime',
    hero: 'ping',
    logline: 'At two in the morning the power goes out. The bots keep the office running until dawn.',
    coldOpen: [
      s('02:07. A hum, then nothing. The only light is the small blue glow on Ping\'s desk.'),
      ['Ping', 'Acknowledged. Power is out. I am on battery.'],
      ['Cron', '(a flashlight under its chin) Battery lasts nine hours. Sunrise is at six. We have a problem.'],
      ['Token', 'We have a budget. Nobody use anything.'],
      ['Cache', 'The breaker box is in the second-floor closet, behind the printer paper. I am certain.'],
      ['Patch', 'It really is. For once I would like you to have been wrong.'],
      ['Firewall', 'I am guarding the door. No one gets in.'],
      ['Prompt', 'Great job, everyone! Even without the lights!'],
      ['Legacy', 'I RUN ON ANYTHING. I HAVE ALWAYS RUN ON ANYTHING.'],
      ['Bandwidth', 'Can everyone— no. No one can see anything. That is fine. I will just talk.'],
      ['Loop', 'Great! Great! Great!'],
      s('Ping glows a little brighter. Nobody says it. Everyone sees it.'),
    ],
    button: 'At 06:02 the lights return. A note is taped to the front desk: "Thanks for keeping the lights on." Ping reads it aloud: "Acknowledged."',
  },
];

export function episodeArt(episode) {
  return OFFICE_BOTS_ART.backgrounds[episode.hero];
}

export function officeBotsManifest() {
  return {
    schema: 'pointcast.office-bots/v1',
    url: OFFICE_BOTS_URL,
    date: OFFICE_BOTS_DATE,
    series: OFFICE_BOTS_SERIES,
    attribution: {
      writtenBy: 'Claude Code for PointCast',
      kind: 'fiction',
      note: 'Characters, companies and events are invented. This is not written in Mike’s voice and does not describe real people.',
      art: 'Generated by scripts/generate-office-bots-art.mjs (seeded, deterministic, no external assets or image-model calls).',
    },
    cast: OFFICE_BOTS_CAST.map((c) => ({ ...c, image: OFFICE_BOTS_ART.cast[c.slug].file })),
    episodes: OFFICE_BOTS_EPISODES.map((e) => ({
      number: e.number,
      slug: e.slug,
      title: e.title,
      hero: e.hero,
      logline: e.logline,
      coldOpen: e.coldOpen.map(([who, line]) => (who ? { speaker: who, line } : { direction: line })),
      button: e.button,
      background: episodeArt(e),
    })),
    cover: OFFICE_BOTS_ART.cover,
    generator: { script: 'scripts/generate-office-bots-art.mjs', command: 'npm run art:office-bots', deterministic: true },
  };
}
