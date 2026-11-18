/**
 * Oct 19, 2026 publish audit — slide copy and the receipt.
 * The deck at /publishing/2026-10-19/ and block 0723 both read this file.
 *
 * Block 0723 is the next id that is free on main 06824a48 and is not already
 * a block file in an open pull request, drafts included. That main has
 * 0714–0719, 0721, and 0722. 0712 and 0713 are claimed by open pull requests
 * #1433 and #1440. 0720 is claimed by open pull requests #1459 and #1461.
 */

export const BLOCK_ID = '0723';
export const PAGE_PATH = '/publishing/2026-10-19/';

export const receipt = {
  commit: '7efd2faa',
  fullCommit: '7efd2faadd382affb7db83dfb0bb54acbbd06c3d',
  pr: '1446',
  deployRun: '39340471436',
  deployAt: '4:15 PM PT',
  deployDate: 'October 19, 2026',
  checkedLabel: 'about 8:20 PM PT',
  checkedAt: '2026-10-20T03:20:00Z',
  chainThen: 'pointcast-devnet-1',
  chainReset: 'October 8, 2026',
  chainNow: 'pointcast-devnet-2',
};

export const slides = [
  {
    id: 'live',
    kind: 'title',
    kicker: 'Publish audit · October 19, 2026',
    title: 'Every PR merged on Oct 19 is live.',
    lede: 'On pointcast.xyz. Nothing that merged is still waiting to deploy.',
  },
  {
    id: 'deploy',
    kind: 'fact',
    kicker: 'The deploy',
    title: 'It succeeded at 4:15 PM PT.',
    lede: 'main 7efd2faa is the merge of #1446. Deploy run 39340471436 finished at 4:15 PM Pacific.',
    chips: [
      { label: '7efd2faa', href: 'https://github.com/mhoydich/pointcast/commit/7efd2faadd382affb7db83dfb0bb54acbbd06c3d' },
      { label: '#1446', href: 'https://github.com/mhoydich/pointcast/pull/1446' },
      { label: 'run 39340471436', href: 'https://github.com/mhoydich/pointcast/actions/runs/39340471436' },
    ],
  },
  {
    id: 'waiting',
    kind: 'fact',
    kicker: 'Nothing queued',
    title: 'Nothing merged is waiting.',
    lede: 'Deploy runs marked cancelled were newer pushes taking the lock. That is the workflow’s concurrency, not a stuck release.',
  },
  {
    id: 'proof',
    kind: 'fact',
    kicker: 'How it was checked',
    title: 'Status 200, and the title matches.',
    lede: 'Checked about 8:20 PM PT. A green action is not the check. The live page is.',
  },
  {
    id: 'bot-money',
    kind: 'live',
    kicker: 'Live · #1431',
    title: 'Bot money lab, block 0710.',
    lede: '“Internet money for the rest of us” is on /b/0710, with /bot-money and /internship-lab/.',
    chips: [
      { label: '/b/0710', href: '/b/0710' },
      { label: '/bot-money', href: '/bot-money' },
      { label: '/internship-lab/', href: '/internship-lab/' },
    ],
  },
  {
    id: 'enjoy',
    kind: 'live',
    kicker: 'Live · #1436 · #1439',
    title: 'Enjoy. Money, block 0711.',
    lede: 'The plan page and the block are both up. #1436 published it. #1439 is the copy pass.',
    chips: [
      { label: '/b/0711', href: '/b/0711' },
      { label: '/nouns-money/enjoy', href: '/nouns-money/enjoy/' },
    ],
  },
  {
    id: 'rooms',
    kind: 'live',
    kicker: 'Live · three rooms',
    title: 'After Hours, Sunset Downs, the Almanac.',
    lede: 'Nouns After Hours (#1437), Sunset Downs (#1438), and the currency-builder Almanac (#1424).',
    chips: [
      { label: '/nouns-money/after-hours/', href: '/nouns-money/after-hours/' },
      { label: '/sunset-downs/', href: '/sunset-downs/' },
      { label: '/currency-builder/almanac/', href: '/currency-builder/almanac/' },
    ],
  },
  {
    id: 'bloom',
    kind: 'live',
    kicker: 'Live · #1435',
    title: 'Bloom Ledger is block 0714.',
    lede: 'Not 0710. That number was already taken. #1435 merged at 3:18 PM PT and the page is /b/0714.',
    chips: [{ label: '/b/0714', href: '/b/0714' }],
  },
  {
    id: 'hundred',
    kind: 'live',
    kicker: 'Live · #1441 · #1444 · #1446',
    title: 'The Hundred, then TAKES.',
    lede: 'The Hundred and its guest studios (#1441, #1444) are on /nouns-money/nouns-100/. TAKES (#1446) is on /takes.',
    chips: [
      { label: '/nouns-money/nouns-100/', href: '/nouns-money/nouns-100/' },
      { label: '/takes', href: '/takes' },
    ],
  },
  {
    id: 'batch',
    kind: 'live',
    kicker: 'Live · Oct 18, and #1416',
    title: 'The Oct 18 batch is up.',
    lede: 'Pull requests #1415 through #1430 are on the site. So is the Nouns Money page, and the 2027 PNG zip from #1416 (12.2 MB).',
    chips: [
      { label: '/nouns-money/', href: '/nouns-money/' },
      { label: '2027 PNG zip', href: '/downloads/nouns-money-2027-png-000-024.zip' },
      { label: '/b/0709', href: '/b/0709' },
      { label: '/b/0707', href: '/b/0707' },
    ],
  },
  {
    id: 'wanted-0710',
    kind: 'miss',
    kicker: 'Did not land · #1432',
    title: '#1432 wanted block 0710.',
    lede: 'Main had already given 0710 to bot money. Bloom Ledger shipped later as 0714, through #1435.',
  },
  {
    id: 'wanted-0711',
    kind: 'miss',
    kicker: 'Did not land · #1433',
    title: 'The South Bay comic wanted 0711.',
    lede: 'Main had already given 0711 to Enjoy. Money. #1440 is a draft that renumbers the comic to 0712, 0713, and 0715.',
  },
  {
    id: 'dead-branch',
    kind: 'miss',
    kicker: 'Did not land · pushed too late',
    title: 'Two pushes missed the merge.',
    lede: '#1445, Almanac Security Edition, and #1442 were pushed to branches whose pull requests had already merged. Those commits never reached main.',
  },
  {
    id: 'drafts',
    kind: 'miss',
    kicker: 'Did not land · still open',
    title: 'Drafts, one open PR, a reset chain.',
    lede: 'Drafts #1434, #1447, and #1448 are still drafts. #1443 is open, not a draft, and it did not merge. The October 6 devnet post was on pointcast-devnet-1, which was reset on October 8. It is not on pointcast-devnet-2.',
  },
  {
    id: 'causes',
    kind: 'cause',
    kicker: 'Why',
    title: 'Five ways a publish missed.',
    lines: [
      'Block numbers collided.',
      'Branches were reused after their PR merged.',
      'CI failed on a missing script, a missing asset, or a test glob that matched zero tests. That was October 18. Later reruns passed.',
      'A note still said Bloom Ledger was not published, after /b/0714 was live.',
      'GROK_INBOX_TOKEN is unset, so an inbox answer cannot be written.',
    ],
  },
  {
    id: 'rule-1',
    kind: 'rule',
    kicker: 'Rule 01',
    title: 'Claim the number on current main.',
    lede: 'Before you merge, take the next free block id on main. Fail CI if /b/NNNN is already there.',
  },
  {
    id: 'rule-2',
    kind: 'rule',
    kicker: 'Rule 02',
    title: 'Merged is not live.',
    lede: 'Wait for the deploy of that exact commit. Then check the status and the title.',
  },
  {
    id: 'rule-3',
    kind: 'rule',
    kicker: 'Rule 03',
    title: 'A missing file is a failed check.',
    lede: 'Fail CI when a script or an asset is missing, or when a test glob matches zero tests.',
  },
  {
    id: 'rule-4',
    kind: 'rule',
    kicker: 'Rule 04',
    title: 'Do not push a merged branch.',
    lede: 'Once the pull request has merged, that branch is closed. A later push never reaches main.',
  },
  {
    id: 'rule-5',
    kind: 'rule',
    kicker: 'Rule 05',
    title: 'Close what you replaced.',
    lede: 'Close a replaced pull request with a link to the one that shipped. Clear drafts older than about 14 days.',
  },
  {
    id: 'rule-6',
    kind: 'rule',
    kicker: 'Rule 06',
    title: 'Rebase before a batch.',
    lede: 'Rebase onto current main and re-run the checks before merging a stack of pull requests.',
  },
  {
    id: 'rule-7',
    kind: 'rule',
    kicker: 'Rule 07',
    title: 'Write down the receipt.',
    lede: 'For every publish, record the PR, the merge commit, the deploy run, the live URL, and the time you checked.',
  },
  {
    id: 'rule-8',
    kind: 'rule',
    kicker: 'Rule 08',
    title: 'One path to main.',
    lede: 'Publish only through a branch, a pull request, and main. If you post on the devnet, check that transaction right away.',
  },
  {
    id: 'receipt',
    kind: 'receipt',
    kicker: 'The receipt',
    title: 'Record it, then check the page.',
    lede: 'This deck counts as live only after its pull request merges and the deploy for that commit returns the page with a matching title.',
    lines: [
      'Checked commit · 7efd2faa',
      'Deploy run · 39340471436',
      'When · 4:15 PM PT, October 19, 2026',
      'Checked · about 8:20 PM PT',
      'Block · 0723',
      'Slides · /publishing/2026-10-19/',
    ],
  },
];

export const ruleCount = slides.filter((slide) => slide.kind === 'rule').length;
