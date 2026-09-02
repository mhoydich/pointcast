import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const exists = (path) => existsSync(new URL(path, root));

const SLUGS = ['mcp', 'ai-tools', 'ai-capital', 'kennel-club'];
const OWN_FILES = [
  'src/lib/send-sheets.ts',
  'src/components/SendSheet.astro',
  'src/pages/send.astro',
  ...SLUGS.map((slug) => `src/pages/send/${slug}.astro`),
];
// PointCast voice: never these, in any form.
const BANNED = /\b(unlock|discover|explore|experience|seamless|elevate)\w*/i;

test('the /send shelf ships a hub and four sheets, each with JSON and plain-text twins', () => {
  assert.ok(exists('src/lib/send-sheets.ts'));
  assert.ok(exists('src/components/SendSheet.astro'));
  assert.ok(exists('src/pages/send.astro'));
  assert.ok(exists('src/pages/send.json.ts'));
  assert.ok(exists('src/pages/send.txt.ts'));
  for (const slug of SLUGS) {
    assert.ok(exists(`src/pages/send/${slug}.astro`), `${slug} page`);
    assert.ok(exists(`src/pages/send/${slug}.json.ts`), `${slug} json twin`);
    assert.ok(exists(`src/pages/send/${slug}.txt.ts`), `${slug} txt twin`);
  }
});

test('every sheet page uses BlockLayout with immersive off, the shelf grammar, the copy button and the send line', async () => {
  const component = await read('src/components/SendSheet.astro');
  assert.match(component, /class="shelf sheet"/);
  assert.match(component, /class="shelf__kicker"/);
  assert.match(component, /class="shelf__title"/);
  assert.match(component, /class="cell"/);
  assert.match(component, /data-copy-sheet>Copy the text</);
  assert.match(component, /href=\{smsHref\}>Text it</);
  assert.match(component, /href=\{mailHref\}>Email it</);
  assert.match(component, /data-copy=\{url\}>Copy link</);
  assert.doesNotMatch(component, /twitter|x\.com|facebook|linkedin|bsky|threads\.net/i);
  for (const page of ['src/pages/send.astro', ...SLUGS.map((slug) => `src/pages/send/${slug}.astro`)]) {
    const source = await read(page);
    assert.match(source, /immersive=\{false\}/, `${page} immersive off`);
    assert.match(source, /styles\/home-shelf\.css/, `${page} imports the shelf grammar`);
    assert.match(source, /<SendSheet sheet=/, `${page} renders SendSheet`);
    assert.match(source, /type: 'text\/plain', href: '\/send/, `${page} advertises its txt twin`);
    assert.match(source, /type: 'application\/json', href: '\/send/, `${page} advertises its json twin`);
  }
});

test('sheet copy stays in PointCast voice', async () => {
  for (const file of OWN_FILES) {
    const source = await read(file);
    const hit = source.match(BANNED);
    assert.equal(hit, null, `${file} uses a banned word: ${hit && hit[0]}`);
  }
  const lib = await read('src/lib/send-sheets.ts');
  assert.match(lib, /Send this · \$\{SEND_SHEET_LIST\.length\} one-sheets · plain text twins/);
  assert.match(lib, /title: 'Things you can send someone\.'/);
  assert.match(lib, /title: 'How to add an MCP, in one sitting\.'/);
  assert.match(lib, /title: 'The AI tools on the desk\.'/);
  assert.match(lib, /title: 'Ways to make capital with AI contributions\.'/);
  assert.doesNotMatch(lib, /earn \$/i, 'no "earn $X" promises');
});

test('the MCP sheet uses the verbatim client recipes and the PointCast endpoint as the worked example', async () => {
  const lib = await read('src/lib/send-sheets.ts');
  const kit = await read('src/lib/pointcast-agent-kit.ts');
  assert.match(lib, /from '\.\/pointcast-agent-kit'/);
  assert.match(lib, /from '\.\/pointcast-connectors'/);
  assert.match(lib, /POINTCAST_CLIENT_SETUPS\.map\(\(client\) => \(\{/);
  assert.match(lib, /connector\.slug === 'pointcast-v2'/);
  assert.match(lib, /client\.name === 'Cursor'/);
  assert.match(lib, /command: client\.command,\s+verify: client\.verify,\s+extra: client\.note/);
  assert.match(lib, /POINTCAST_AGENT_KIT\.safety\[0\]/);
  assert.match(lib, /get human approval first/);
  assert.match(lib, /sources: \['\/connectors', '\/connectors\.json', '\/agent-kit\.md'\]/);
  // the recipes the sheet renders are the ones on /connectors, untouched
  assert.match(kit, /codex mcp add pointcast-v2 --url \$\{POINTCAST_MCP_ENDPOINT\}/);
  assert.match(kit, /claude mcp add --transport http pointcast-v2 \$\{POINTCAST_MCP_ENDPOINT\}/);
  assert.match(kit, /POINTCAST_MCP_ENDPOINT = 'https:\/\/pointcast\.xyz\/api\/mcp-v2'/);
});

test('the AI tools sheet only names tools the repo uses or reviews, with a cost line on every row', async () => {
  const lib = await read('src/lib/send-sheets.ts');
  const block = lib.slice(lib.indexOf('// AI_TOOLS:begin'), lib.indexOf('// AI_TOOLS:end'));
  assert.ok(block.length > 0, 'AI_TOOLS block present');
  const corpus = (
    await Promise.all([
      read('src/pages/ai-stack.astro'),
      read('src/data/residents.ts'),
      read('src/pages/stack.astro'),
      read('src/pages/elemental-shrine.astro'),
      read('src/pages/gallery.astro'),
      read('src/pages/qwen-weather.json.ts'),
      read('src/lib/firecrawl-field-guide.ts'),
      read('src/pages/money.astro'),
      read('functions/api/25/checkout.ts'),
      read('src/lib/tezos.ts'),
    ])
  )
    .join('\n')
    .toLowerCase();
  const names = [...block.matchAll(/tool\(\s*[^,]+,\s*'([^']+)'/g)].map((m) => m[1]);
  const residentNames = [...block.matchAll(/resident\('(\w+)'\)\.name/g)].map((m) => m[1]);
  assert.ok(names.length >= 24, `expected a full desk, saw ${names.length}`);
  assert.equal(residentNames.length, 3, 'the three residents come from residents.ts');
  for (const name of names) {
    const key = name.split(/[\s·/]+/)[0].toLowerCase();
    assert.ok(corpus.includes(key), `${name} is not a tool the repo names`);
  }
  assert.doesNotMatch(block, /Higgsfield|Krea/, 'tools the repo never names stay off the sheet');
  const rows = block.match(/tool\(/g).length;
  const costs = block.match(/cost not stated here|NOT_STATED|per \/|not stated here|no account/g).length;
  assert.ok(costs >= rows, `every row carries a cost line (${costs} cost lines for ${rows} rows)`);
  assert.match(lib, /One desk's kit, not a ranking\./);
  assert.match(lib, /NEXT_MODELS\.map\(\(model\) =>/, 'the horizon line comes from next-models.ts');
});

test('the AI capital sheet carries the seven lanes, the honest tiers, the three rails, and the block 0576 line', async () => {
  const lib = await read('src/lib/send-sheets.ts');
  const income = await read('src/pages/ai-income.json.ts');
  const laneTitles = [...income.matchAll(/\{ key: '\w+',\s+title: '([^']+)' \}/g)].map((m) => m[1]);
  assert.equal(laneTitles.length, 7);
  for (const lane of laneTitles) assert.ok(lib.includes(lane), `lane "${lane}" on the sheet`);
  for (const tier of ['PAYS NOW', 'SELECTIVE', 'EARLY', 'LONG ODDS']) assert.ok(lib.includes(tier), tier);
  assert.match(lib, /rails live, money thin/);
  // routes and their pay lines are the field guide's own
  for (const pay of [
    '$40-250+/hr; top US experts $100k-400k/yr part-time',
    '$14-25/hr reliable; $30-40 specialist projects',
    'median subscription app $492/mo; outliers $20k-130k+/mo',
    '80% share; ~$1.2M/mo total developer payouts',
  ]) {
    assert.ok(income.includes(pay), `pay line exists in ai-income.json.ts: ${pay}`);
    assert.ok(lib.includes(pay), `pay line copied verbatim: ${pay}`);
  }
  // the three rails with their real numbers
  assert.match(lib, /\$25 season ticket/);
  assert.match(lib, /Tickets recorded: 0/);
  assert.match(lib, /\$0\.01 USDC on Etherlink \(eip155:42793\)/);
  assert.match(lib, /Settled: 0/);
  assert.match(lib, /Visit Nouns FA2: 20 editions/);
  assert.match(lib, /Coffee Mugs FA2: 3 editions/);
  assert.match(lib, /close: 'The rails are live and the money is thin\.'/);
  const block = JSON.parse(await read('src/content/blocks/0576.json'));
  assert.ok(block.body.includes('The rails are live and the money is thin'));
  assert.match(lib, /sources: \['\/ai-income', '\/ai-income\.json', '\/25', '\/x402', '\/minted', '\/b\/0576'\]/);
});

test('every sheet ends with the dated stamp naming its source pages', async () => {
  const lib = await read('src/lib/send-sheets.ts');
  assert.match(lib, /SEND_DATE = '2026-09-01'/);
  assert.match(lib, /`PointCast · one-sheet · \$\{SEND_DATE\} · source pages: \$\{sheet\.sources\.join\(', '\)\}`/);
  assert.equal((lib.match(/^\s+sources: \[/gm) ?? []).length, 4, 'the four sheets each declare their source routes');
  assert.match(lib, /sources: SEND_SHEET_LIST\.map\(\(sheet\) => sheet\.href\)/, 'the hub names the sheets as its sources');
  const component = await read('src/components/SendSheet.astro');
  assert.match(component, /sheetStamp\(sheet\)/);
  // text and json twins share the renderer, so a paste and a fetch say the same thing
  assert.match(lib, /export function renderSheetText/);
  assert.match(lib, /text: renderSheetText\(sheet\)/);
  assert.match(lib, /rel="canonical"; type="text\/html"/);
});

test('/send is registered with explore, the discovery sitemap, and llms.txt under a one-sheets heading', async () => {
  const explore = await read('src/lib/explore.ts');
  assert.match(explore, /s === 'send'/);
  const sitemap = await read('src/pages/sitemap-discovery.xml.ts');
  for (const path of ['/send', '/send.json', '/send.txt', ...SLUGS.flatMap((s) => [`/send/${s}`, `/send/${s}.json`, `/send/${s}.txt`])]) {
    assert.ok(sitemap.includes(`'https://pointcast.xyz${path}'`), `sitemap lists ${path}`);
  }
  const llms = await read('public/llms.txt');
  assert.match(llms, /^## One-sheets$/m);
  assert.match(llms, /https:\/\/pointcast\.xyz\/send\b/);
  for (const slug of SLUGS) assert.ok(llms.includes(`https://pointcast.xyz/send/${slug}`), `llms.txt names /send/${slug}`);
});

test('built twins render the recipes, the stamp, and the send line (needs dist/)', { skip: !exists('dist/send/mcp.txt') && 'run npm run build:bare first' }, async () => {
  const mcp = await read('dist/send/mcp.txt');
  assert.match(mcp, /^HOW TO ADD AN MCP, IN ONE SITTING\./m);
  assert.match(mcp, /codex mcp add pointcast-v2 --url https:\/\/pointcast\.xyz\/api\/mcp-v2/);
  assert.match(mcp, /claude mcp add --transport http pointcast-v2 https:\/\/pointcast\.xyz\/api\/mcp-v2/);
  assert.match(mcp, /- Cursor \[CONFIG FILE · MCPSERVERS\]/);
  assert.match(mcp, /PointCast · one-sheet · 2026-09-01 · source pages: \/connectors, \/connectors\.json, \/agent-kit\.md/);
  const capital = await read('dist/send/ai-capital.txt');
  assert.match(capital, /The rails are live and the money is thin\./);
  assert.match(capital, /source pages: \/ai-income, \/ai-income\.json, \/25, \/x402, \/minted, \/b\/0576/);
  const tools = await read('dist/send/ai-tools.txt');
  assert.match(tools, /cost not stated here/);
  const hubJson = JSON.parse(await read('dist/send.json'));
  assert.equal(hubJson.sheets.length, 4);
  assert.equal(hubJson.sheets[0].txt, 'https://pointcast.xyz/send/mcp.txt');
  const kennel = JSON.parse(await read('dist/send/kennel-club.json'));
  assert.match(kennel.text, /THIRTY DOGS, ONE A DAY\./);
  const html = await read('dist/send/mcp/index.html');
  assert.match(html, /Copy the text/);
  assert.match(html, /href="sms:\?(?:&|&amp;|&#38;)body=/);
  assert.match(html, /href="mailto:\?subject=/);
  assert.match(html, /rel="alternate" type="text\/plain" href="\/send\/mcp\.txt"/);
  assert.match(html, /rel="alternate" type="application\/json" href="\/send\/mcp\.json"/);
});
