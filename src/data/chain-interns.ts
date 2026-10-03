/**
 * Intern exploration assignments for pointcast-chain (/chain/interns and
 * /chain/interns.json). Voice and shape follow the PointCast intern desk
 * (/intern, /intern.json, /internships/roles.json and program.json):
 * educational project briefs, not employment offers, applications closed,
 * submissions through /ping and reviewed before any public follow-up.
 *
 * Every claim about the chain points at a doc in src/data/chain-docs/ (the
 * repo at da7bc09). Nothing here asks for a key, money or a public post.
 */

export const INTERN_PROGRAM = {
  title: 'PointCast Chain intern exploration assignments',
  status: 'educational_project_briefs_only',
  statusLabel: 'Project exploration · not an employment offer',
  applicationsOpen: false,
  edition: '2026-10-03',
  sourceCommit: 'da7bc09',
  submit: {
    url: 'https://pointcast.xyz/ping/',
    how: 'Send a short note through pointcast.xyz/ping with the assignment id, a link to your deliverable somewhere you control, and one sentence on what surprised you. Notes are read and reviewed before any public follow-up; nothing is published automatically. Never paste a secret, a seed phrase or anyone’s personal details into the note.',
  },
  sourceAccess:
    'The pointcast-chain repo is local today and has no public remote. Assignments marked “needs the source” start once a copy is shared with you; ask through /ping. The others work from public pages right now.',
  rules: [
    'No keys that control anything: public dev keys and throwaway local test credentials only.',
    'No money: nothing is bought, sold, staked or paid, and ATTN carries no value.',
    'No posting: nothing goes on a public channel or anyone’s account without review.',
    'No people, buildings or places in any image you make for an assignment.',
    'Say what you observed and what you inferred, separately. Plans are plans.',
  ],
  pendingTerms: ['Pay', 'Hours', 'Hiring entity', 'Supervisor', 'Eligibility', 'Agreements', 'Privacy'],
} as const;

export type Assignment = {
  id: string;
  title: string;
  why: string;
  steps: string[];
  deliverable: string;
  skills: string[];
  time: string;
  difficulty: 'starter' | 'intermediate' | 'advanced';
  needsSource: boolean;
  doNot: string[];
  read: { label: string; href: string }[];
};

export const ASSIGNMENTS: Assignment[] = [
  {
    id: 'PCC-I01',
    title: 'Run a node and press VERIFY',
    why: 'The chain’s central promise is that anyone can check the sequencer. A newcomer running it once and writing down every snag is the cheapest test of that promise, and of the docs.',
    steps: [
      'Open /chain/yard/ on a laptop, press ✓ VERIFY, and note how long the replay takes and exactly what the strip says when it finishes.',
      'With the source: install Rust with rustup and run `cargo test -p chain-core`. Time it.',
      'Run `cargo run -p node -- run --dev --demo`, open http://127.0.0.1:8545/ and press VERIFY there.',
      'Start the lying node (`cargo run -p node --example lying_node`), open http://127.0.0.1:8545/?api=http://127.0.0.1:8546 and press VERIFY. Download evidence.json from the red banner.',
      'Save the lying node’s /params as params.json and run `pointcast-node evidence check evidence.json --params params.json`. Record the exit code.',
      'Write the run log while it is fresh.',
    ],
    deliverable: 'A one-page run log: machine and versions, every command with how long it took, screenshots of a green and a red VERIFY, the evidence check’s exit code, and every stumble with what the docs should have said.',
    skills: ['terminal basics', 'reading docs', 'careful notes'],
    time: '2–4 hours',
    difficulty: 'starter',
    needsSource: true,
    doNot: ['Use any key but the public dev keys.', 'Point anything at Tezos mainnet or set an anchor key.', 'Post screenshots publicly before review.'],
    read: [{ label: 'Dev tools: quickstart', href: '/chain/dev#quickstart' }, { label: 'Verify Desk', href: '/chain/dev#verify' }],
  },
  {
    id: 'PCC-I02',
    title: 'Phone audit of the Block Yard and First Mints',
    why: 'Most visitors arrive on a phone. The yard draws the chain as cubes and runs a wasm verifier; First Mints is a composer with many controls. Both have to work at 375 pixels, with a thumb, large text and a screen reader.',
    steps: [
      'Use at least two phones, one iOS and one Android if you can; a browser’s responsive mode is the fallback, and say so.',
      'Open /chain and /chain/yard/: note time to first paint, press VERIFY, scroll, pinch and rotate.',
      'Open /chain/first-mints/ and compose a card. Check every control can be reached, read and operated, with focus visible.',
      'Repeat with the largest text size, with dark mode, and for two minutes each with VoiceOver and TalkBack.',
      'Log each issue: device, steps, expected, actual, screenshot, severity.',
    ],
    deliverable: 'An issue table and a top-five fix list ranked by how many visitors each would help.',
    skills: ['QA', 'accessibility basics', 'screenshots'],
    time: '2–4 hours',
    difficulty: 'starter',
    needsSource: false,
    doNot: ['File issues publicly or tag anyone.', 'Enter personal data anywhere.', 'Describe the preview as minting: nothing is minted and no key is created.'],
    read: [{ label: 'Block Yard', href: '/chain/yard/?snapshot=./snapshot.json' }, { label: 'First Mints preview', href: '/chain/first-mints/' }],
  },
  {
    id: 'PCC-I03',
    title: 'Write a new chain-sim scenario',
    why: 'The simulator is how the chain learns where farming leaks before anything has value. Its findings come from six scenarios; v2 needs more questions asked, honestly.',
    steps: [
      'Read the pc-sim findings and the six scenario files in crates/chain-sim/scenarios.',
      'Build pc-sim and reproduce one documented root first: town-baseline, seed 1, ends at af59737ff877376d….',
      'Pick a question nobody has run. Example: what changes if half the honest regulars only drum, or a much smaller town under one-tap-an-hour gating?',
      'Write the scenario JSON, run it with `pc-sim run`, then a small `pc-sim sweep` over one parameter.',
      'Record seed → root for every run and say what moved and what didn’t.',
    ],
    deliverable: 'The scenario file, each run’s summary.json, and a one-page note in the findings’ own style, labelled scenario output, not a forecast.',
    skills: ['JSON', 'reading Rust lightly', 'basic statistics'],
    time: '1–2 days',
    difficulty: 'advanced',
    needsSource: true,
    doNot: ['Change chain-core or any consensus code.', 'Present a result as a forecast.', 'Claim a protocol bug without a seed that reproduces it.'],
    read: [{ label: 'pc-sim findings', href: '/chain/docs/findings/' }],
  },
  {
    id: 'PCC-I04',
    title: 'A passkey device test matrix',
    why: 'The wallet scope plans passkeys as the wallet: a webauthn signing mode and pcp1 addresses. The design assumes ES256 keys, signCount 0 on synced passkeys, and a fixed order of fields in clientDataJSON. Real devices have to be checked.',
    steps: [
      'Read “Passkey design” in the wallet scope.',
      'List the devices you can reach: iPhone or iPad Safari, macOS Safari and Chrome, Android Chrome, Windows Hello.',
      'On a scratch page served from localhost, feature-detect platform authenticators (isUserVerifyingPlatformAuthenticatorAvailable, and getClientCapabilities where it exists).',
      'Create a throwaway passkey for rpId localhost that requests ES256 only (alg -7), and sign one fixed 32-byte challenge.',
      'Record the algorithm, the UP and UV flags, signCount, and the first keys of clientDataJSON in order. Then delete the credential.',
      'Fill in the matrix.',
    ],
    deliverable: 'A matrix (device × browser × sync provider × ES256 × UV × signCount × clientDataJSON order × notes) and the scratch page’s source.',
    skills: ['JavaScript', 'WebAuthn basics', 'careful recording'],
    time: '1 day',
    difficulty: 'intermediate',
    needsSource: false,
    doNot: ['Register passkeys on pointcast.xyz or any real account.', 'Share credential ids or keys from a personal account.', 'Publish device serial numbers.'],
    read: [{ label: 'Wallet scope: passkey design', href: '/chain/docs/wallets/' }],
  },
  {
    id: 'PCC-I05',
    title: 'First Mints palettes and type',
    why: 'A First Mints recipe picks from fixed lists: 16 backgrounds, 16 patterns, a handful of fonts and 16 inks, and any background and ink pair under 4.5:1 contrast must be rejected. Once an edition opens, those lists are permanent.',
    steps: [
      'Read the recipe encoding in the wallet scope (BG_V1, PATTERN_V1, FONT_V1, INK_V1).',
      'Compute the contrast ratio of every background against candidate inks and mark every pair under 4.5:1.',
      'Try the preview at /chain/first-mints/ on a phone and note which combinations break at small sizes.',
      'Propose an INK_V1 list of 16 that leaves the most passing pairs, and check each font’s licence allows embedding.',
      'Write up the choices and the trade-offs.',
    ],
    deliverable: 'A contrast grid, a proposed INK_V1 with reasons, and five sample cards as screenshots.',
    skills: ['color', 'typography', 'a spreadsheet or a small script'],
    time: '1 day',
    difficulty: 'intermediate',
    needsSource: false,
    doNot: ['Put people, buildings or places in samples.', 'Use a font whose licence doesn’t allow embedding.', 'Call the preview a mint.'],
    read: [{ label: 'Wallet scope: First Mints', href: '/chain/docs/wallets/' }, { label: 'First Mints preview', href: '/chain/first-mints/' }],
  },
  {
    id: 'PCC-I06',
    title: 'An oracle feed spec for an El Segundo signal',
    why: 'The Town Network plan includes oracles: signed reports from registered keys. A good first feed is one whose truth is public and boring, like the marine layer or the tide.',
    steps: [
      'Pick one: the time the marine layer breaks at the coast, or the day’s high-tide height.',
      'Find two independent public sources and note how often each updates and its terms of use. PointCast’s fog log at /marine-layer is one place to start.',
      'Define the report: fields, units, integer encoding (the chain uses no floats), the reporting window, and what counts as late or missing.',
      'Write the dispute rule in plain English: how a second source could challenge a report.',
      'Write ten sample reports from real past data.',
    ],
    deliverable: 'A two-page spec with a JSON report schema and ten example reports, labelled a plan.',
    skills: ['research', 'data', 'clear writing'],
    time: '1–2 days',
    difficulty: 'intermediate',
    needsSource: false,
    doNot: ['Build anything that sends transactions.', 'Scrape a site against its terms, or pay for an answer.', 'Imply that any feed is live.'],
    read: [{ label: 'The fog log', href: '/marine-layer' }, { label: 'Design: no floats, integers only', href: '/chain/docs/design/' }],
  },
  {
    id: 'PCC-I07',
    title: 'Prediction market rules in plain English, with play money',
    why: 'The Town Network plan lists prediction markets: integer math, resolved by oracles, play money by default. Before any code, the rules have to read clearly to a neighbor.',
    steps: [
      'Pick one local yes-or-no question with a public answer, such as whether the marine layer clears by noon on Saturday.',
      'Write the rules: who can open a market, how to join with play money, when it closes, the resolution source, the dispute window, and what happens if the source goes missing.',
      'Work one pool-style payout by hand in whole numbers and write down every rounding.',
      'List how a crowd of free keys could game it, using the simulator’s findings.',
      'Have one person who isn’t technical read it, and write down every question they ask.',
    ],
    deliverable: 'One page of rules, the worked example, the gaming risks, and the reader’s questions.',
    skills: ['plain writing', 'arithmetic', 'fairness'],
    time: '1 day',
    difficulty: 'starter',
    needsSource: false,
    doNot: ['Use real money or anything of value.', 'Frame it as gambling or an investment.', 'Open a market or take a bet from anyone.'],
    read: [{ label: 'pc-sim findings', href: '/chain/docs/findings/' }, { label: 'Roadmap', href: '/chain#roadmap' }],
  },
  {
    id: 'PCC-I08',
    title: 'Map PointCast’s identity surfaces',
    why: 'The wallet scope found many overlapping ways PointCast says who someone is: several holdings pages, three wallet connectors, two storage models, town cards and accounts, two agent registries. One profile starts with an accurate map.',
    steps: [
      'Read “What PointCast has today” in the wallet scope.',
      'Visit each public surface signed out: /auth, /me, /profile, /wallet, /minted, /passport, /townsfolk, /connect, and a /p/ handle page.',
      'For each, record what it shows, where its data comes from as documented, and what it overlaps.',
      'Draw one diagram: person → login identities → public face → chain accounts → agents.',
      'Mark every place where two surfaces could disagree about who someone is.',
    ],
    deliverable: 'The diagram, a table of surfaces with sources and overlaps, and the three changes you would make first.',
    skills: ['information architecture', 'diagramming', 'careful reading'],
    time: '1 day',
    difficulty: 'intermediate',
    needsSource: false,
    doNot: ['Sign in with a real wallet or create an account for the audit.', 'Screenshot anyone’s personal data.', 'Go beyond what a signed-out visitor can see.'],
    read: [{ label: 'Wallet scope: what PointCast has today', href: '/chain/docs/wallets/' }],
  },
  {
    id: 'PCC-I09',
    title: 'A dev-tools docs pass',
    why: 'The SDK quickstart on /chain/dev should work for someone who has never seen the code. Every stumble is a doc bug, and the cheapest time to find them is now.',
    steps: [
      'Read /chain/dev top to bottom before touching anything.',
      'Download /chain/sdk/pointcast-chain.js, import it in Node 20 or later, and call the pure functions: addressKind, recipientStatus, checkDropId, bodyHash, certificateCopy("no_node").',
      'Call connect(null) and confirm every read returns {status: "no_node"}.',
      'With the source and a local dev node, run the read path: connect with expect, getDrop, getMints, getHoldings. Confirm verification.verifiedHolder stays false on a dev chain, and read holderReason.',
      'Log every stumble: what you tried, what happened, and what the page should say instead.',
    ],
    deliverable: 'A stumble log and a proposed rewrite of the quickstart section.',
    skills: ['JavaScript', 'Node', 'technical writing'],
    time: '1 day',
    difficulty: 'intermediate',
    needsSource: false,
    doNot: ['Run the signing flow with a real wallet: it belongs on the creator’s desk.', 'Paste a secret into a terminal, a page or a note.', 'Point the SDK at anything but a local dev node.'],
    read: [{ label: 'Dev tools: SDK', href: '/chain/dev#sdk' }, { label: 'Art minting: SDK quickstart', href: '/chain/docs/art-minting/' }],
  },
  {
    id: 'PCC-I10',
    title: 'Explain the chain to a neighbor',
    why: 'If the chain can’t be explained on one page to someone in El Segundo who has never owned crypto, the design isn’t finished. The wallet scope drafted a community explainer; test the idea on a real reader.',
    steps: [
      'Read the community explainer in the wallet scope and the /chain home.',
      'Write a one-page explainer: what it is, what it is for, what it isn’t (no money, not public yet), and one thing to try (the Block Yard).',
      'Give it to one neighbor, friend or relative who doesn’t work in tech.',
      'Watch them read it. Write down every question and every word they tripped on.',
      'Revise once.',
    ],
    deliverable: 'Version one, the feedback notes without names, and version two.',
    skills: ['plain writing', 'listening'],
    time: 'Half a day, plus one conversation',
    difficulty: 'starter',
    needsSource: false,
    doNot: ['Record or quote the reader without permission.', 'Collect their contact details.', 'Promise rewards, value, or that anything is live.'],
    read: [{ label: 'Wallet scope: community explainer', href: '/chain/docs/wallets/' }, { label: 'The chain home', href: '/chain' }],
  },
];
