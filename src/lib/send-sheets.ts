/**
 * send-sheets — the one-sheets under /send.
 *
 * Mike, 2026-09-01: "utilities i can send, say ai tools, how to mcp, ways
 * to make capital with ai contributions, etc."
 *
 * Every sheet is one data object rendered three ways: the page
 * (src/pages/send/<slug>.astro through SendSheet.astro), the JSON twin
 * (<slug>.json.ts) and the plain-text twin (<slug>.txt.ts) that the
 * "Copy the text" button pastes into a message. Nothing on a sheet is new
 * research. Each one distils pages that already exist and its footer names
 * them. Recipes and counts are imported where the repo exports them; the
 * hand-typed lines carry a `source:` comment and a date.
 */
import { POINTCAST_AGENT_KIT, POINTCAST_CLIENT_SETUPS } from './pointcast-agent-kit';
import { POINTCAST_CONNECTORS } from './pointcast-connectors';
import { RESIDENTS } from '../data/residents';
import { NEXT_MODELS, RESEARCH_AS_OF } from './next-models';

export const SEND_DATE = '2026-09-01';
export const SEND_ORIGIN = 'https://pointcast.xyz';

export interface SendItem {
  /** Mono tag above the title: a tier, a client eyebrow, a rail. */
  tag?: string;
  title: string;
  /** One line under the title. */
  note?: string;
  /** Verbatim command or URL, rendered in a code box with its own copy button. */
  command?: string;
  /** "Test it:" line. */
  verify?: string;
  /** Small trailing note. */
  extra?: string;
  /** Mono meta line: cost, count, where it shows. */
  meta?: string;
  /** Where it shows on the site, or the outside page it names. */
  href?: string;
}

export interface SendSection {
  heading: string;
  lead?: string;
  columns?: 2 | 3 | 4;
  items?: SendItem[];
  /** Plain lines instead of cells. */
  lines?: string[];
}

export interface SendSheet {
  slug: string;
  href: string;
  kicker: string;
  title: string;
  /** The part of the title set in the second channel colour. */
  em?: string;
  dek: string;
  color: string;
  color2: string;
  sections: SendSection[];
  close?: string;
  /** Routes this sheet was distilled from. Printed in the dated footer. */
  sources: string[];
  /** Defaults to the shelf's filing date; series sheets may carry their own. */
  date?: string;
}

/* ------------------------------------------------------------------ */
/* 01 · How to add an MCP, in one sitting.                             */
/* Sources: src/lib/pointcast-agent-kit.ts (rendered at /connectors and */
/* /agent-kit.md), src/lib/pointcast-connectors.ts (/connectors.json).  */
/* ------------------------------------------------------------------ */

const V2 = POINTCAST_CONNECTORS.find((connector) => connector.slug === 'pointcast-v2')!;
const CURSOR = V2.clients.find((client) => client.name === 'Cursor')!;
const CURSOR_CONFIG = JSON.stringify({ mcpServers: { pointcastV2: { url: V2.endpoint } } }, null, 2);

const MCP_SHEET: SendSheet = {
  slug: 'mcp',
  href: '/send/mcp',
  kicker: `One-sheet · MCP · ${POINTCAST_CLIENT_SETUPS.length + 1} clients · ${V2.tools.length} tools`,
  title: 'How to add an MCP, in one sitting.',
  em: 'in one sitting.',
  dek:
    'An MCP server is a URL your AI client can add as a connector. Once it is added, the client sees a list of named tools it can call for search, navigation, and bounded participation, instead of scraping pages.',
  color: '#8A2432',
  color2: '#185FA5',
  sections: [
    {
      heading: 'The worked example',
      lead: 'PointCast publishes its own. Every recipe below points at it.',
      columns: 2,
      items: [
        {
          tag: `${V2.status} · ${V2.category} · priority ${V2.priority}`,
          title: V2.name,
          note: V2.description,
          command: V2.endpoint,
          meta: 'transport http · json-rpc 2.0',
          href: '/connectors',
        },
        {
          tag: 'client-visible tools',
          title: `${V2.tools.length} tools`,
          note: V2.tools.join(' · '),
          meta: 'read tools first',
          href: '/connectors.json',
        },
      ],
    },
    {
      heading: 'Pick your client',
      lead: 'Four recipes as written on /connectors, plus the Cursor line from /connectors.json. The ChatGPT one needs no install: it is the starter prompt from /agent-kit.md.',
      columns: 2,
      items: [
        ...POINTCAST_CLIENT_SETUPS.map((client) => ({
          tag: client.eyebrow,
          title: client.name,
          note: client.setup,
          command: client.command,
          verify: client.verify,
          extra: client.note,
        })),
        {
          tag: 'config file · mcpServers',
          title: CURSOR.name,
          note: CURSOR.label,
          command: CURSOR_CONFIG,
          extra: CURSOR.note,
        },
      ],
    },
    {
      heading: 'Safety',
      lines: [
        POINTCAST_AGENT_KIT.safety[0],
        // source: src/pages/agent-kit.md.ts, "Citation and safety"
        'Read tools are the default. PointCast MCP tools that tap, post, claim, or otherwise participate are visible public actions; get human approval first.',
        POINTCAST_AGENT_KIT.safety[1],
      ],
    },
  ],
  sources: ['/connectors', '/connectors.json', '/agent-kit.md'],
};

/* ------------------------------------------------------------------ */
/* 02 · The AI tools on the desk.                                      */
/* Sources: src/pages/ai-stack.astro (tiers + what each is used for),   */
/* src/data/residents.ts, src/lib/next-models.ts, src/pages/stack.astro, */
/* and the pages named on each row. Read 2026-09-01.                    */
/* ------------------------------------------------------------------ */

const NOT_STATED = 'cost not stated here';

/** One desk tool. `cost` is required so no row ships without the money line. */
function tool(tag: string, title: string, note: string, cost: string, href: string): SendItem {
  return { tag, title, note, meta: cost, href };
}

const resident = (slug: string) => RESIDENTS.find((r) => r.slug === slug)!;

// AI_TOOLS:begin
const DESK_SECTIONS: SendSection[] = [
  {
    heading: 'Residents',
    lead: 'The three agents that ship the site. Status and role from /residents.',
    columns: 3,
    items: [
      // notes: src/pages/stack.astro "Team" layer + src/pages/ai-stack.astro pointcastUses
      tool(
        `${resident('cc').status} · daily`,
        resident('cc').name,
        'Primary engineer. Architecture, routing, contracts, deploys. Signs blocks as cc.',
        NOT_STATED,
        '/residents',
      ),
      tool(
        `${resident('codex').status} · weekly`,
        resident('codex').name,
        'Specialist and parallel lane (tezos bakery, kowloon, derby v3). Code review before main merges.',
        NOT_STATED,
        '/residents',
      ),
      tool(
        `${resident('manus').status} · weekly`,
        resident('manus').name,
        'Browser, ops, real-user QA. Behind-login work: deploy settings, DNS, objkt admin, mint testing as a real user.',
        NOT_STATED,
        '/residents',
      ),
    ],
  },
  {
    heading: 'Chat',
    columns: 3,
    items: [
      tool('daily', 'Claude', "Mike's daily chat and content co-author. Claude Code carries most of the code and content work.", 'custom connectors on paid plans per /connectors', '/ai-stack'),
      tool('weekly', 'ChatGPT', 'Cross-check, image-prompt refinement, occasional voice brainstorms.', NOT_STATED, '/ai-stack'),
      tool('occasional', 'Gemini', 'When a brief PDF or transcript is too large for Claude. Open resident slot at /residents.', NOT_STATED, '/ai-stack'),
      tool('occasional', 'DeepSeek', 'Second opinion on tricky code diffs.', NOT_STATED, '/ai-stack'),
      tool('watching', 'Kimi', 'Tried for feeding whole repos. Open resident slot at /residents.', NOT_STATED, '/ai-stack'),
      tool('occasional', 'Cursor', 'Editor-integrated assists. PointCast leans more CLI.', NOT_STATED, '/ai-stack'),
    ],
  },
  {
    heading: 'Image',
    columns: 4,
    items: [
      tool('weekly', 'Midjourney', 'Cover-art experiments and the /gallery slideshow. The block schema names it as the default image tool.', NOT_STATED, '/gallery'),
      tool('weekly', 'Ideogram', 'Typographic experiments and block cover drafts with words on them.', NOT_STATED, '/ai-stack'),
      tool('occasional', 'Flux', 'Photo-ish renders, local or through an API.', NOT_STATED, '/ai-stack'),
      tool('occasional', 'DALL-E / gpt-image', 'Quick mockups inside a ChatGPT session.', NOT_STATED, '/ai-stack'),
    ],
  },
  {
    heading: 'Video',
    columns: 4,
    items: [
      tool('occasional', 'Runway', 'Experimental video. Not yet on PointCast; planned for WATCH blocks.', 'price is the bottleneck for volume, per /ai-stack', '/ai-stack'),
      tool('watching', 'Sora', 'Tried experimentally.', NOT_STATED, '/ai-stack'),
      tool('occasional', 'Kling', 'High-volume iteration before a final Runway render.', 'a fraction of the Runway price, per /ai-stack', '/ai-stack'),
      tool('occasional', 'Pika', 'Stylized clips. Experimental.', NOT_STATED, '/ai-stack'),
    ],
  },
  {
    heading: 'Research and agents',
    columns: 4,
    items: [
      tool('daily', 'Perplexity', 'Daily research, fact-checking, Tezos ecosystem updates.', NOT_STATED, '/ai-stack'),
      tool('weekly', 'Claude web search', 'Live API docs inside Claude Code sessions.', NOT_STATED, '/ai-stack'),
      tool('occasional', 'Claude Agent', 'Sub-agents inside Claude Code for parallel work.', NOT_STATED, '/ai-stack'),
      tool('watching', 'OpenAI Operator', 'Tested; not adopted. Manus is the lead.', NOT_STATED, '/ai-stack'),
    ],
  },
  {
    heading: 'Audio',
    columns: 3,
    items: [
      tool('occasional', 'ElevenLabs', 'The original soundscape at /elemental-shrine. No voice dispatches yet.', NOT_STATED, '/elemental-shrine'),
      tool('occasional', 'Suno', 'Part of the Noun-voice tribute in block 0219. Experimental.', 'free tier cannot be monetized; commercial rights need the paid tiers, per /ai-income', '/b/0219'),
      tool('watching', 'Hume AI', 'Watching. Narrower than ElevenLabs.', NOT_STATED, '/ai-stack'),
    ],
  },
  {
    heading: 'Rails and readers',
    lead: 'Not AI tools, but the desk runs on them. From /stack and the pages named.',
    columns: 3,
    items: [
      tool('model studies', 'Qwen', 'Three model studies: /qwen-weather, /qwen-silver-letter, /qwen-good-intelligence. Outputs are pre-rendered static media.', 'runs on a QwenCloud Personal Token Plan; price not stated here', '/qwen-weather'),
      tool('reader', 'Firecrawl', 'The open-source web reader for pages without a clean machine surface. Field guide at /firecrawl, setup at /connectors.', 'open source (core AGPL-3.0, MCP server MIT); the smoke test needs no account', '/firecrawl'),
      tool('rail', 'Stripe', 'Hosted checkout for the $25 season ticket at /25. Stripe Link receipts in the /money ledger.', 'sells the $25 ticket; fees not stated here', '/25'),
      tool('rail', 'Tezos · Taquito + Beacon', 'Wallet connect and on-chain mints: Coffee Mugs at /coffee, Visit Nouns at /minted. Taquito 25.0 with Beacon wallet operations.', 'free mainnet FA2 per /stack; wallet fees not stated here', '/stack'),
      tool('runtime', 'Cloudflare Pages + KV', 'Static hosting, Pages Functions, and KV for presence, reactions, and drum taps.', NOT_STATED, '/stack'),
      tool('runtime', 'Astro 6.1', 'The static-site framework: islands, file routing, content collections for blocks.', NOT_STATED, '/stack'),
    ],
  },
];
// AI_TOOLS:end

const RELEASE_LABEL: Record<string, string> = {
  upcoming: 'upcoming',
  controlled: 'controlled',
  available: 'available',
  'open-weights': 'open weights',
};

const HORIZON_SECTION: SendSection = {
  heading: 'On the horizon, reviewed not used',
  columns: 2,
  items: [
    {
      tag: `${NEXT_MODELS.length} models · researched ${RESEARCH_AS_OF}`,
      title: 'The model desk at /next-models.',
      note: NEXT_MODELS.map((model) => `${model.name} (${model.maker}, ${RELEASE_LABEL[model.releaseState] ?? model.releaseState})`).join(' · '),
      meta: `none on the desk yet · ${NOT_STATED}`,
      href: '/next-models',
    },
  ],
};

const DESK_COUNT = DESK_SECTIONS.reduce((n, section) => n + (section.items?.length ?? 0), 0);

const AI_TOOLS_SHEET: SendSheet = {
  slug: 'ai-tools',
  href: '/send/ai-tools',
  kicker: `One-sheet · AI tools · ${DESK_COUNT} on the desk · ${NEXT_MODELS.length} on the horizon`,
  title: 'The AI tools on the desk.',
  em: 'on the desk.',
  dek:
    "One desk's kit, not a ranking. What each tool does here, where it shows on the site, and whether the repo says it costs money. Where it does not, the line says so.",
  color: '#1b3a5b',
  color2: '#993C1D',
  sections: [...DESK_SECTIONS, HORIZON_SECTION],
  sources: ['/ai-stack', '/ai-stack.json', '/residents', '/next-models', '/stack'],
};

/* ------------------------------------------------------------------ */
/* 03 · Ways to make capital with AI contributions.                    */
/* Sources: src/pages/ai-income.json.ts LANES + ROUTES (researched      */
/* 2026-08-31; pay lines verbatim), the three rails from /25, /x402,    */
/* /minted with numbers read 2026-09-01, and block 0576.                */
/* ------------------------------------------------------------------ */

// source: src/pages/ai-income.json.ts `tiers`
const TIER_LINES = [
  'PAYS NOW — documented payouts at scale; startable this month.',
  'SELECTIVE — real money behind a high bar, vetting gate, or high variance.',
  'EARLY — rails live, money thin.',
  'LONG ODDS — winners real, median roughly $0.',
];

/** One route from the field guide. `pay` is the guide's own line, ceiling and median together. */
function route(tier: string, title: string, operator: string, pay: string, href: string): SendItem {
  return { tag: tier, title, note: pay, meta: operator, href };
}

// source: src/pages/ai-income.json.ts ROUTES, 2026-08-31
const LANE_SECTIONS: SendSection[] = [
  {
    heading: '01 · Sell your judgment to the labs',
    columns: 2,
    items: [
      route('selective', 'Mercor', 'Mercor', '$40-250+/hr; top US experts $100k-400k/yr part-time', 'https://www.mercor.com'),
      route('pays now', 'Turing', 'Turing', '$15-40/hr tasks; ~$39/hr trainer average; global-friendly', 'https://www.turing.com'),
    ],
  },
  {
    heading: '02 · The generalist queue',
    columns: 2,
    items: [
      route('pays now', 'DataAnnotation.tech', 'Surge ecosystem', '$14-25/hr reliable; $30-40 specialist projects', 'https://www.dataannotation.tech'),
      route('pays now', 'Outlier', 'Scale AI', '$15-56/hr; empty-queue risk; rates down YoY', 'https://outlier.ai'),
    ],
  },
  {
    heading: '03 · Build with it',
    columns: 2,
    items: [
      route('long odds', 'Micro-SaaS & indie apps', 'independent', 'median subscription app $492/mo; outliers $20k-130k+/mo', '/ai-income#build'),
      route('selective', 'Selling to the builders', 'independent', 'audience-first portfolios to $90k/mo; near zero without', '/ai-income#build'),
    ],
  },
  {
    heading: '04 · Sell services, amplified',
    columns: 2,
    items: [
      route('pays now', 'AI-fluent freelancing', 'Upwork/Fiverr/direct', '+34%/hr for AI work; established $4-10k/mo', '/ai-income#services'),
      route('selective', 'Automation consulting', 'independent', 'projects $500-15k; solo operators $10-30k/mo revenue', '/ai-income#services'),
    ],
  },
  {
    heading: '05 · Sell what it makes',
    columns: 2,
    items: [
      route('long odds', 'Faceless video channels', 'YouTube/TikTok', 'survivors $1k-50k/mo as production businesses', '/ai-income#content'),
      route('long odds', 'KDP ebooks', 'Amazon', 'median approximately $0 without marketing', '/ai-income#content'),
    ],
  },
  {
    heading: '06 · Teach it',
    columns: 2,
    items: [
      route('pays now', 'Corporate workshops', 'direct', 'half-day $3-8k; full-day $6-15k; trainers $3-40k/mo', '/ai-income#teach'),
      route('selective', 'Cohort courses', 'Maven et al.', '~$12k average per cohort; instructor keeps 90%', '/ai-income#teach'),
    ],
  },
  {
    heading: '07 · Get paid by the agents',
    columns: 2,
    items: [
      route('pays now', 'Apify actors', 'Apify', '80% share; ~$1.2M/mo total developer payouts', 'https://apify.com'),
      route('early', 'x402 & crawl fees', 'Coinbase/Cloudflare', '100M+ transactions, cent-sized payments; payouts small', 'https://www.x402.org'),
    ],
  },
];

const RAILS_SECTION: SendSection = {
  heading: 'The three rails this town runs',
  lead: 'Real numbers, read 2026-09-01. Small numbers printed plainly.',
  columns: 3,
  items: [
    {
      // source: src/lib/pointcast-25.ts sale.priceUsd; functions/api/25/checkout.ts (302 to buy.stripe.com); no ticket ledger exists in the repo
      tag: 'stripe · /25',
      title: '$25 season ticket',
      note: 'Hosted Stripe checkout for the PointCast 25 founding season ticket. Tickets recorded: 0. The town keeps no sales ledger; the checkout is a redirect to buy.stripe.com.',
      meta: 'block 0510 · since 2026-07-27',
      href: '/25',
    },
    {
      // source: https://pointcast.xyz/api/x402/receipt (402 body) and ?list=1 total_count 0; functions/api/x402/receipt.ts
      tag: 'x402 · /x402',
      title: 'x402 receipts',
      note: 'Pay $0.01 USDC on Etherlink (eip155:42793) over HTTP 402 and get a countersigned receipt. Settled: 0.',
      meta: 'endpoint answers 402 · ledger total_count 0',
      href: '/x402',
    },
    {
      // source: TzKT, Visit Nouns KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh (17 token ids, 20 editions, last mint 2026-04-28); Coffee Mugs KT1JQ3AjzFvMnjZ9mGqrM13aj8LQBx9JpoXt (2 token ids, 3 editions)
      tag: 'tezos · /minted',
      title: 'Tezos editions',
      note: 'Visit Nouns FA2: 20 editions across 17 token ids, last mint 2026-04-28. Coffee Mugs FA2: 3 editions across 2 token ids.',
      meta: 'mainnet · per TzKT · blocks 0229 and 0364',
      href: '/minted',
    },
  ],
};

// source: src/pages/ai-income.json.ts ROUTES.length, 2026-08-31 (block 0576 meta.routes)
const AI_INCOME_ROUTE_COUNT = 29;

const AI_CAPITAL_SHEET: SendSheet = {
  slug: 'ai-capital',
  href: '/send/ai-capital',
  kicker: `One-sheet · AI capital · ${LANE_SECTIONS.length} lanes · ${AI_INCOME_ROUTE_COUNT} routes · ${RAILS_SECTION.items!.length} rails`,
  title: 'Ways to make capital with AI contributions.',
  em: 'with AI contributions.',
  dek:
    'Seven lanes from the field guide at /ai-income, one or two routes each, with the evidence tier printed next to the pay. Then the three rails this town runs itself, with their real numbers. No advice, no promises.',
  color: '#0B6B3A',
  color2: '#8A2432',
  sections: [
    { heading: 'Read the tiers first', lines: TIER_LINES },
    ...LANE_SECTIONS,
    RAILS_SECTION,
  ],
  // source: src/content/blocks/0576.json body
  close: 'The rails are live and the money is thin.',
  sources: ['/ai-income', '/ai-income.json', '/25', '/x402', '/minted', '/b/0576'],
};

/* ------------------------------------------------------------------ */
/* 04 · Kennel Club.                                                   */
/* Source: src/data/kennel-club-september-sitting.json (September 2). */
/* ------------------------------------------------------------------ */

const KENNEL_CLUB_SHEET: SendSheet = {
  slug: 'kennel-club',
  href: '/send/kennel-club',
  kicker: 'One-sheet · Kennel Club · September 2026 · 30 daily sittings',
  title: 'Kennel Club: thirty dogs, one a day.',
  em: 'one a day.',
  dek: 'Thirty original dog portrait plates, assigned to every calendar day in September 2026. The plates are public now. The Tezos mint is waiting on its contract.',
  color: '#8A2432',
  color2: '#BA7517',
  sections: [
    {
      heading: 'The sitting',
      columns: 3,
      items: [
        { tag: '01–30 · September', title: 'One dog every day', note: 'Each date has a named dog, distinct breed, title, wardrobe line, portrait plate, and planned Tezos token id.', meta: 'calendar true · America/Los_Angeles', href: '/kennel-club' },
        { tag: 'Today', title: 'Follow the daily plate', note: 'Open the Kennel Club room for the current sitting, yesterday’s faded plate, tomorrow’s held silhouette, and the full thirty-day calendar.', meta: 'human room + calendar JSON', href: '/kennel-club' },
        { tag: 'Machine read', title: 'Thirty metadata records', note: 'Every sitting has its own JSON twin with image URLs and TZIP-21-style attributes: sitting, mint date, breed, title, wardrobe, scene, and token id.', meta: '30 static JSON doors', href: '/kennel-club.json' },
      ],
    },
    {
      heading: 'Mint coming',
      lines: [
        'The series is planned for Tezos mainnet: 30 token ids, numbered 0 through 29, one associated with each September day.',
        'No wallet, chain call, price, edition cap, or contract address is live on this sheet. The room says plainly: mint window opens when the contract lands.',
        'September 1 and 2 opened late. The first two dogs were already waiting.',
      ],
    },
  ],
  close: 'Follow the sitting. The mint comes after the contract.',
  sources: ['/kennel-club', '/kennel-club.json'],
  date: '2026-09-02',
};

/* ------------------------------------------------------------------ */
/* The hub.                                                            */
/* ------------------------------------------------------------------ */

export const SEND_SHEETS = {
  mcp: MCP_SHEET,
  'ai-tools': AI_TOOLS_SHEET,
  'ai-capital': AI_CAPITAL_SHEET,
  'kennel-club': KENNEL_CLUB_SHEET,
} as const;

export type SendSlug = keyof typeof SEND_SHEETS;

export const SEND_SHEET_LIST: SendSheet[] = [MCP_SHEET, AI_TOOLS_SHEET, AI_CAPITAL_SHEET, KENNEL_CLUB_SHEET];

export const SEND_HUB: SendSheet = {
  slug: 'send',
  href: '/send',
  kicker: `Send this · ${SEND_SHEET_LIST.length} one-sheets · plain text twins`,
  title: 'Things you can send someone.',
  em: 'send someone.',
  dek:
    'Short pages made to be texted. Each one reads in about two minutes on a phone, has a JSON twin and a plain-text twin at the same address, and a copy button so the words go into a message as they are.',
  color: '#185FA5',
  color2: '#993C1D',
  sections: [
    {
      heading: `${SEND_SHEET_LIST.length} sheets`,
      columns: 3,
      items: SEND_SHEET_LIST.map((sheet, index) => ({
        tag: `one-sheet ${String(index + 1).padStart(2, '0')}`,
        title: sheet.title,
        note: sheet.dek,
        meta: `${sheet.href} · .json · .txt`,
        href: sheet.href,
      })),
    },
    {
      heading: 'How to send one',
      lines: [
        'Open the sheet and press Copy the text. Paste it into a message.',
        'Or send the link. Every sheet has a Text it, Email it, and Copy link line at the bottom.',
        'Each sheet has a .json and a .txt twin at the same address, so a machine can read it too.',
      ],
    },
  ],
  sources: SEND_SHEET_LIST.map((sheet) => sheet.href),
};

/* ------------------------------------------------------------------ */
/* Renderers shared by the page, the JSON twin and the text twin.      */
/* ------------------------------------------------------------------ */

export function sheetUrl(sheet: SendSheet): string {
  return `${SEND_ORIGIN}${sheet.href}`;
}

export function sheetStamp(sheet: SendSheet): string {
  if (sheet.date) return `PointCast · one-sheet · ${sheet.date} · source pages: ${sheet.sources.join(', ')}`;
  return `PointCast · one-sheet · ${SEND_DATE} · source pages: ${sheet.sources.join(', ')}`;
}

function textLine(item: SendItem): string[] {
  const out: string[] = [];
  const tag = item.tag ? ` [${item.tag.toUpperCase()}]` : '';
  out.push(`- ${item.title}${tag}`);
  if (item.note) out.push(`  ${item.note}`);
  if (item.command) {
    for (const line of item.command.split('\n')) out.push(`  > ${line}`);
  }
  if (item.verify) out.push(`  Test it: ${item.verify}`);
  if (item.extra) out.push(`  Note: ${item.extra}`);
  const trail = [item.meta, item.href ? (item.href.startsWith('/') ? `${SEND_ORIGIN}${item.href}` : item.href) : '']
    .filter(Boolean)
    .join(' · ');
  if (trail) out.push(`  ${trail}`);
  return out;
}

/** The plain-text twin. Also what "Copy the text" puts on the clipboard. */
export function renderSheetText(sheet: SendSheet): string {
  const lines: string[] = [
    sheet.title.toUpperCase(),
    sheet.kicker,
    sheetUrl(sheet),
    '',
    sheet.dek,
    '',
  ];
  for (const section of sheet.sections) {
    lines.push(section.heading.toUpperCase());
    if (section.lead) lines.push(section.lead);
    for (const item of section.items ?? []) lines.push(...textLine(item));
    for (const line of section.lines ?? []) lines.push(`- ${line}`);
    lines.push('');
  }
  if (sheet.close) {
    lines.push(sheet.close, '');
  }
  lines.push(sheetStamp(sheet));
  lines.push(`Twins: ${sheetUrl(sheet)}.json · ${sheetUrl(sheet)}.txt`);
  lines.push('');
  return lines.join('\n');
}

/** The JSON twin. */
export function sheetPayload(sheet: SendSheet) {
  return {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    date: sheet.date ?? SEND_DATE,
    site: SEND_ORIGIN,
    hub: `${SEND_ORIGIN}/send`,
    canonical: sheetUrl(sheet),
    slug: sheet.slug,
    kicker: sheet.kicker,
    title: sheet.title,
    dek: sheet.dek,
    sections: sheet.sections,
    close: sheet.close ?? null,
    sources: sheet.sources.map((source) => (source.startsWith('/') ? `${SEND_ORIGIN}${source}` : source)),
    stamp: sheetStamp(sheet),
    twins: {
      html: sheetUrl(sheet),
      json: `${sheetUrl(sheet)}.json`,
      txt: `${sheetUrl(sheet)}.txt`,
    },
    text: renderSheetText(sheet),
  };
}

const TEXT_HEADERS = (sheet: SendSheet) => ({
  'content-type': 'text/plain; charset=utf-8',
  'cache-control': 'public, max-age=300',
  'access-control-allow-origin': '*',
  link: [
    `<${sheetUrl(sheet)}>; rel="canonical"; type="text/html"`,
    `<${sheetUrl(sheet)}.json>; rel="alternate"; type="application/json"`,
  ].join(', '),
});

const JSON_HEADERS = (sheet: SendSheet) => ({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'public, max-age=300',
  'access-control-allow-origin': '*',
  link: [
    `<${sheetUrl(sheet)}>; rel="canonical"; type="text/html"`,
    `<${sheetUrl(sheet)}.txt>; rel="alternate"; type="text/plain"`,
  ].join(', '),
});

export function textResponse(sheet: SendSheet): Response {
  return new Response(renderSheetText(sheet), { headers: TEXT_HEADERS(sheet) });
}

export function jsonResponse(sheet: SendSheet): Response {
  return new Response(JSON.stringify(sheetPayload(sheet), null, 2), { headers: JSON_HEADERS(sheet) });
}
