/**
 * Forkable Template — the actual fork-this-repo developer surface.
 *
 * /forkable-radius is the framework. /coordinate is the deployment grid.
 * /manhattan-beach and /hermosa-beach are concrete instances. /strand-corridor
 * is the federation seam. This page is what was missing: the practical
 * "how do I run my own instance" guide for a local Land who has read the
 * framework and decided to commit.
 */

export const TEMPLATE_META = {
  title: 'Forkable Template',
  subtitle: 'Concrete fork-this-repo guide for new instance Lands',
  thesis: 'The Forkable Radius framework requires a forkable artifact. This page is that artifact: the step-by-step guide a local Land follows to clone the El Segundo template, customize it for their neighborhood, and stand up a working UES fork instance in under one weekend of focused work. The framework promises forkability; this page delivers it.',
  paperNumber: 'UES-Template-01',
  date: '2026-05-07',
  audience: 'A founder-figure who has read /forkable-radius, /coordinate, and at least one instance scaffold (/manhattan-beach or /hermosa-beach), and has decided to fork.',
};

export const PREREQUISITES = [
  { item: 'A neighborhood, not just an idea', detail: 'A specific named geography with edges. The framework treats anything from a 1-square-mile beach city to a 25-mile-radius county slice as valid; what matters is that the Land can name where the instance ends.' },
  { item: 'A local Land', detail: 'A founder-figure willing to commit ~8 hrs/week for 90 days. Without this, the framework cannot help. The Land does not need technical skill; they need to be able to walk the radius and convene a stewardship circle.' },
  { item: 'A GitHub account and basic git literacy', detail: 'Or a co-conspirator who has both. Forking the repo, running build:bare, and committing edits is the technical floor. Astro + npm experience helps but is not required.' },
  { item: 'A domain or subdomain', detail: 'Either a top-level domain ({yourcity}.org) or a subdomain ({yourcity}.pointcast.xyz). The framework prefers federated subdomains for the first year of operation; standalone domains are encouraged once the instance is mature.' },
  { item: '$0–$300 for the first year', detail: 'Domain registration ($12-15/year), Cloudflare or Netlify hosting (free tier sufficient for first year), optional First Bench fundraising target ($1,800-3,000). No software licenses; no platform fees.' },
];

export const TEN_STEP_FORK = [
  { step: '1', title: 'Read the four prerequisite surfaces', detail: 'In order: /forkable-radius (the framework, ~25 min), /coordinate (the deployment context, ~10 min), /manhattan-beach (a concrete fork example, ~15 min), /hermosa-beach (a second concrete fork, ~15 min). Total reading time: about one hour. You should be able to articulate the six-shape framework and the L0–L4 federation protocol from memory after this step.' },
  { step: '2', title: 'Fork the repo on GitHub', detail: 'github.com/{owner}/pointcast → Fork. Rename your fork to {yourcity}-pointcast or similar. Clone locally: `git clone git@github.com:{you}/{yourcity}-pointcast.git`. Run `npm install` then `npm run dev` to confirm the local dev server boots.' },
  { step: '3', title: 'Create your instance lib file', detail: 'Copy `src/lib/manhattanBeach.ts` to `src/lib/{yourcity}.ts`. Replace MB content with your-city content: INSTANCE_META, SNAPSHOT, INHERITED_FROM_ES, SPECIFIC_TERRAIN, SIX_SHAPES (status per shape), FIRST_NINETY_DAYS_PLAN, CORRIDOR or REGIONAL_POSITION, REFERENCES. Aim for 100-150 lines total. The MB and HB files are your two reference templates.' },
  { step: '4', title: 'Create your instance page + JSON mirror', detail: 'Copy `src/pages/manhattan-beach.astro` to `src/pages/{yourcity}.astro` and `src/pages/manhattan-beach.json.ts` to `src/pages/{yourcity}.json.ts`. Update the imports to your lib file. The page CSS uses --strand variable; pick a corridor or regional accent color of your choice if you are not on the Pacific Strand.' },
  { step: '5', title: 'Customize the SIX_SHAPES status', detail: 'For each of the six shapes, set the status (forming / speculative / building / shipping / dormant) honestly for your neighborhood. Most new instances start with 4-5 speculative + 1-2 forming. Do not inflate the status; the framework prizes honest reporting.' },
  { step: '6', title: 'Identify your First Sit anchor', detail: 'Pick the location for your inaugural Marine Layer Week 1 sit. For ES it is Plaza El Segundo; for MB the Pier; for HB the Pier. The location should be: walkable from most of the radius, predawn-quiet, and one specific bench / plaza / overlook (not a general area). Document it in your `MARINE_LAYER_SESSIONS` if you fork that lib too.' },
  { step: '7', title: 'Build and commit', detail: 'Run `npm run build:bare` to confirm the site builds. Commit with the message format `feat({yourcity}): instance scaffold` and push to your fork. The repo is now a working fork.' },
  { step: '8', title: 'Deploy to your domain', detail: 'Connect Cloudflare Pages or Netlify to your fork. Point your domain (or {yourcity}.pointcast.xyz subdomain via federation handshake) at the deployment. Confirm `https://{yourdomain}/{yourcity}` and `https://{yourdomain}/{yourcity}.json` both load.' },
  { step: '9', title: 'Federation handshake with parent', detail: 'Open an issue on the El Segundo upstream repo: "Federation handshake — {Yourcity} instance live at {url}". Include the URL of your `/{yourcity}.json` mirror. The El Segundo instance subscribes; you subscribe to the parent. Quarterly cadence begins.' },
  { step: '10', title: 'Run the first 90 days honestly', detail: 'Follow your own FIRST_NINETY_DAYS_PLAN. At Day 90, publish a status update on /{yourcity} reporting honestly: continued, restarted, or honestly retired. Most instances will continue. Some will retire. Both are valid outcomes.' },
];

export const WHAT_TO_KEEP = [
  'BlockLayout shared layout — keep using it; design consistency is a federation feature, not a constraint',
  'JSON mirrors at every endpoint — non-negotiable for federation L1',
  'Six-category give-back ledger — Hours · Dollars · Objects · Easement · Expertise · Custody',
  'CC0 / MIT licensing on all your additions',
  'Schema.org JSON-LD on every page',
  'The cohort-cap-12 / floor-5 Marine Layer pattern',
  'The eight-week place-based sit cycle structure (you customize the weekly anchors, you keep the cycle shape)',
];

export const WHAT_TO_CUSTOMIZE = [
  'Hero typography — Hermosa uses lighter weight than MB; ES uses condensed; pick what fits your neighborhood',
  'Accent color — MB and HB share strand-blue (#5b8aa8) because they share the corridor; an inland fork picks an inland palette',
  'SPECIFIC_TERRAIN features — yours, not a copy of MB or HB',
  'First Bench cost band — adjust for local construction costs',
  'Voluntary association inventory — this is the most-different section across instances',
  'Marine Layer weekly anchors — keep the eight-week shape, customize each weekly site',
  'Civic Translation languages — your local linguistic mix; Spanish is common, Korean / Japanese / Mandarin / Tagalog / Vietnamese all candidates depending on neighborhood',
];

export const WHAT_NOT_TO_FORK = [
  'The El Segundo Working Papers (UES-WP-2026-XX) — these are ES-specific scholarly artifacts; do not renumber them as your own',
  'The reference instance status — only the parent (ES today) can be the reference; forks are forks',
  'The El Segundo logo / wordmark — make your own',
  'Other instances\' First Bench commitments — your treasury is yours; do not import another instance\'s ledger',
  'The Coordinate deployment grid — that surface is the federation\'s cross-instance map; you are added to it, you do not maintain your own',
];

export const FAQ = [
  { q: 'Can I fork without using Astro?', a: 'Yes. The framework is content + commitment, not technology. Astro is convenient because the parent instance uses it, but a Hugo / Eleventy / Next / hand-rolled HTML fork is equally valid as long as the JSON mirrors are at predictable paths.' },
  { q: 'What if my neighborhood is bigger than 25 miles?', a: 'Pick a 25-mile slice and call it your radius. The framework is about radius commitment, not radius geography. Los Angeles can host four or five overlapping UES forks (West Side, South Bay, Eastside, San Gabriel Valley, etc.) — they are not the same instance.' },
  { q: 'Can I fork without committing to all six shapes?', a: 'Yes. Most new instances are speculative or dormant on 4-5 of the 6 shapes for the first year. The framework rewards honest status reporting; running one shape well beats running six shapes badly.' },
  { q: 'Do I have to federate with the parent?', a: 'No, but you forfeit the corridor commitments (quarterly sit, annual council, joint drill, shared Common Forms). Going independent is a valid choice; the framework is voluntary at every level.' },
  { q: 'What if I want to leave the federation later?', a: 'You can. The protocol is voluntary, additive, and revocable. Honest disclosure is the only requirement: post a status update saying when and why your instance left.' },
  { q: 'What about funding?', a: 'The framework is built to run on $0-300/year for the first year. Domain + free hosting is the floor. Once your Commons ledger has 25 give-back receipts, you trigger your First Bench fundraising. There is no fundraising before earned standing.' },
  { q: 'Who do I talk to if I get stuck?', a: 'Email mh@pointcast.xyz with subject line "Forking · {Yourcity}". The parent instance offers asynchronous help during the first 90 days at no cost.' },
];

export const REFERENCES = [
  { id: 'pointcast-forkable', cite: 'University of El Segundo. (2026). *The Forkable Radius*. UES-WP-2026-11. https://pointcast.xyz/forkable-radius' },
  { id: 'pointcast-coordinate', cite: 'University of El Segundo. (2026). *Coordinate · Six-Shape Deployment Grid*. https://pointcast.xyz/coordinate' },
  { id: 'pointcast-mb', cite: 'University of El Segundo. (2026). *Manhattan Beach Instance*. UES-Fork-MB-01. https://pointcast.xyz/manhattan-beach' },
  { id: 'pointcast-hb', cite: 'University of El Segundo. (2026). *Hermosa Beach Instance*. UES-Fork-HB-02. https://pointcast.xyz/hermosa-beach' },
  { id: 'pointcast-strand', cite: 'University of El Segundo. (2026). *The Strand Corridor*. UES-Federation-01. https://pointcast.xyz/strand-corridor' },
  { id: 'astro', cite: 'Astro. (Continuing). *Static Site Generator Documentation*. astro.build.' },
  { id: 'cloudflare-pages', cite: 'Cloudflare. (Continuing). *Cloudflare Pages*. pages.cloudflare.com.' },
];

export const TEMPLATE_NOTES = {
  uesNote: 'This page is the developer-facing artifact of the Forkable Radius. It assumes you have read the framework and decided to commit; if not, start at /forkable-radius.',
  invitation: 'When you ship your fork, email mh@pointcast.xyz with the URL. The parent instance will subscribe to your JSON mirrors and add you to /coordinate as a federated instance. The federation grows by addition, never by acquisition.',
};
