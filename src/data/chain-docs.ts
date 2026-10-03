/**
 * The pointcast-chain docs published at /chain/docs/. Each markdown file in
 * src/data/chain-docs/ is a byte-for-byte copy of the repo file at the source
 * commit (sha256 below, so anyone with the repo can check it). The page
 * shortens local file paths and rewrites links between these docs at render
 * time; the text itself is unchanged.
 */
export const DOCS_COMMIT = 'da7bc09';

export type ChainDoc = {
  slug: string;
  file: string;
  /** Path inside the pointcast-chain repo. */
  source: string;
  sha256: string;
  kicker: string;
  title: string;
  summary: string;
};

export const CHAIN_DOCS: ChainDoc[] = [
  {
    slug: 'readme', file: 'readme.md', source: 'README.md',
    sha256: '57bc37ae2e77b6d09eaecb51d41d76c7acc381d48cab507329f65755283e9052',
    kicker: 'START HERE · QUICK START · API · SIGNING · ANCHORING',
    title: 'The README.',
    summary: 'Quick start, environment, the HTTP API, signing with Kukai and Temple, drum attestation, MCP, Town Hall, VERIFY, the simulator, proofs and Tezos anchoring with measured costs.',
  },
  {
    slug: 'design', file: 'design.md', source: 'DESIGN.md',
    sha256: 'd0ef86119c4d6726d7fc845310a49e8a448d13e58795ac4069b2077ce34a37ca',
    kicker: 'DESIGN · DETERMINISM · ACCOUNTS · TRANSACTIONS · TRUST',
    title: 'The design notes.',
    summary: 'The shape of the chain, the determinism rules, accounts and signing modes, every transaction kind, drum attestation, mandates, presence tickets, the state root, the trust model, known gaps and the path to a Tezos rollup kernel.',
  },
  {
    slug: 'v2', file: 'v2.md', source: 'docs/V2.md',
    sha256: '334be32d57bb637f18e34415234b0e5f7a680f57899e97c52ac5e31cc5fa1e1e',
    kicker: 'PLAN OF RECORD · V2 · PRESENT COMPANY',
    title: 'v2: Present Company.',
    summary: 'The v2 plan: four pillars, fourteen packages over seven batches, batch-1 ownership, the demo moment, risks and merge order. Batch 1 is merged; its batch 2–7 list has since been replaced by the Town Network plan.',
  },
  {
    slug: 'wallets', file: 'wallets.md', source: 'docs/WALLETS.md',
    sha256: '8406ac19d5e697fa5fbe68404078450ad0a84c9d313c138f117f2b28e2c2d23e',
    kicker: 'SCOPE · WALLETS · PASSKEYS · ONE PROFILE · FIRST MINTS',
    title: 'Wallets, one profile, passkeys and First Mints.',
    summary: 'A research and design document, not built code: passkeys as a pass, device passes, one profile, the webauthn signing mode, First Mints recipes, phases and the open questions for Mike.',
  },
  {
    slug: 'art-minting', file: 'art-minting.md', source: 'docs/ART_MINTING.md',
    sha256: 'a779962b3b75373b956b46fe98a29f6e33778980e159cb438ace4a690cba9c2c',
    kicker: 'ART · A 1 TEZ SALE · A REHEARSED CERTIFICATE',
    title: 'Art minting.',
    summary: 'The pointcast-chain side of the dual-chain gallery: what is possible, the recommendation, the flow, the read API, the SDK, the mirror CLI, failure handling and the steps that need Mike. Local rehearsal.',
  },
  {
    slug: 'findings', file: 'findings.md', source: 'crates/chain-sim/FINDINGS.md',
    sha256: 'fb79ce7a4cca72fda3004e0c9232b10c501b039f4a61549a69bd9cc920d83c26',
    kicker: 'SIMULATOR · MEASURED 2026-10-02 · SCENARIO OUTPUT, NOT A FORECAST',
    title: 'pc-sim findings.',
    summary: 'What the economy simulator measured over 123.1 million applied transactions: every sybil key earns the epoch cap, and only room-attested drums plus tap gating together cut farming from 66% to 10.1%.',
  },
  {
    slug: 'review-codex', file: 'review-codex.md', source: 'docs/reviews/2026-10-03-astra-review.md',
    sha256: '60ec7831091d076740042ea2fe3510f97cdaec0feb225e9bffd52b2d60b93ecb',
    kicker: 'REVIEW · CODEX · AS-01 TO AS-07 · ALL FIXED',
    title: 'Independent review by Codex.',
    summary: 'Seven findings, each with a test that failed before the fix, and six follow-ups from Claude’s adversarial pass. Written by Claude from Codex’s tests and notes after OpenAI’s content filter stopped the run.',
  },
  {
    slug: 'proof-of-balance', file: 'report-proof-of-balance.md', source: 'docs/reviews/2026-10-03-codex-proof-of-balance-report.md',
    sha256: '6289c760eb3e1ca7ca732a0a30d4ab5c11488785a473d821bd5ffa594b01e99d',
    kicker: 'REPORT · CODEX · PROOF OF BALANCE',
    title: 'Proof of Balance: Codex’s report.',
    summary: 'What Codex built, how it validated it, the requirement it proved impossible (leaf counts are not authenticated) and the socket-free demo it ran when the sandbox blocked a port.',
  },
];

/** Repo-relative link targets that have a page here. */
export const DOC_LINKS: Record<string, string> = {
  'README.md': '/chain/docs/readme/',
  'DESIGN.md': '/chain/docs/design/',
  'docs/V2.md': '/chain/docs/v2/',
  'V2.md': '/chain/docs/v2/',
  'docs/WALLETS.md': '/chain/docs/wallets/',
  'WALLETS.md': '/chain/docs/wallets/',
  'docs/ART_MINTING.md': '/chain/docs/art-minting/',
  'ART_MINTING.md': '/chain/docs/art-minting/',
  'crates/chain-sim/FINDINGS.md': '/chain/docs/findings/',
  'FINDINGS.md': '/chain/docs/findings/',
};

/**
 * Prepare a doc's compiled HTML for the page: drop its own h1 (the page
 * renders the title), point links between published docs at their pages,
 * turn links to unpublished repo files into plain text, shorten local paths,
 * and wrap tables so they scroll on a phone.
 */
export function prepareDocHtml(html: string): string {
  return html
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '')
    .replace(/<a href="([^"]+)">([\s\S]*?)<\/a>/g, (whole, href: string, text: string) => {
      if (/^(https?:|mailto:|#|\/)/.test(href)) return whole;
      const [path, hash] = href.split('#');
      const page = DOC_LINKS[path.replace(/^\.\.?\//, '').replace(/^\.\.\//, '')];
      if (page) return `<a href="${page}${hash ? `#${hash}` : ''}">${text}</a>`;
      return `<span class="doc__repo" title="A file in the pointcast-chain repo (not published here)">${text}</span>`;
    })
    .replace(/\/private\/tmp\/claude-501\/[^/\s<"`]+\/[^/\s<"`]+\/scratchpad\//g, '…/scratchpad/')
    .replace(/\/Users\/michaelhoydich\//g, '~/')
    .replace(/<table>/g, '<div class="tbl"><table>')
    .replace(/<\/table>/g, '</table></div>');
}
