import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { posix } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { JSDOM } from 'jsdom';
import { BOT_MONEY_DATE, BOT_MONEY_URL, botMoneyManifest } from '../src/lib/bot-money.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root));
const text = (path) => read(path).toString('utf8');
const json = (path) => JSON.parse(text(path));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const catalog = botMoneyManifest();
const kit = catalog.products.find((product) => product.sku === 'pc-first-offer-kit');
const sprint = catalog.products.find((product) => product.sku === 'pc-offer-page-sprint');
const kitDirectory = `first-offer-kit-${kit.version}`;
const publicDirectory = `public/downloads/${kitDirectory}`;
const portableProduct = json(`${publicDirectory}/product.json`);
const fileManifest = json(`${publicDirectory}/manifest.json`);

// Read ZIP central-directory entries independently of the kit generator. This
// verifies the delivered archive itself, including compressed bytes and names.
function zipFiles(bytes) {
  let end = bytes.length - 22;
  const earliest = Math.max(0, end - 65535);
  while (end >= earliest && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  assert.ok(end >= earliest, 'ZIP end-of-directory record is present');
  assert.equal(end + 22 + bytes.readUInt16LE(end + 20), bytes.length, 'ZIP has no truncated comment or trailing data');
  assert.equal(bytes.readUInt16LE(end + 4), 0, 'single-volume ZIP');
  const count = bytes.readUInt16LE(end + 10);
  assert.ok(count > 0 && count < 100, 'bounded starter-kit archive');
  assert.equal(bytes.readUInt16LE(end + 8), count);
  const files = new Map();
  const directoryStart = bytes.readUInt32LE(end + 16);
  let offset = directoryStart;
  for (let index = 0; index < count; index++) {
    assert.equal(bytes.readUInt32LE(offset), 0x02014b50, 'central directory entry');
    const flags = bytes.readUInt16LE(offset + 8);
    const method = bytes.readUInt16LE(offset + 10);
    const compressedLength = bytes.readUInt32LE(offset + 20);
    const size = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    assert.ok(!name.startsWith('/') && !name.includes('\\') && !name.split('/').includes('..'), `safe ZIP path: ${name}`);
    assert.ok(name.startsWith(`${kitDirectory}/`), `one enclosing kit directory: ${name}`);
    assert.equal(flags & 1, 0, `not encrypted: ${name}`);
    assert.notEqual((bytes.readUInt32LE(offset + 38) >>> 16) & 0o170000, 0o120000, `not a symlink: ${name}`);
    const local = bytes.readUInt32LE(offset + 42);
    assert.equal(bytes.readUInt32LE(local), 0x04034b50, 'local file header');
    const localNameLength = bytes.readUInt16LE(local + 26);
    assert.equal(bytes.subarray(local + 30, local + 30 + localNameLength).toString('utf8'), name);
    assert.equal(bytes.readUInt16LE(local + 8), method);
    const start = local + 30 + localNameLength + bytes.readUInt16LE(local + 28);
    assert.ok(start + compressedLength <= directoryStart, `complete compressed data: ${name}`);
    assert.ok(size < 1024 * 1024, `bounded file size: ${name}`);
    const compressed = bytes.subarray(start, start + compressedLength);
    assert.ok(method === 0 || method === 8, `standard ZIP compression: ${name}`);
    const data = method === 8 ? inflateRawSync(compressed, { maxOutputLength: 1024 * 1024 }) : compressed;
    assert.equal(data.length, size, `uncompressed size: ${name}`);
    if (!name.endsWith('/')) {
      const relative = name.slice(kitDirectory.length + 1);
      assert.ok(!files.has(relative), `unique archive file: ${relative}`);
      files.set(relative, data);
    }
    offset += 46 + nameLength + bytes.readUInt16LE(offset + 30) + bytes.readUInt16LE(offset + 32);
  }
  assert.equal(offset, end, 'all central directory entries were consumed');
  return files;
}

function directoryFiles(directory, prefix = '') {
  return readdirSync(new URL(`${directory}/`, root), { withFileTypes: true }).flatMap((entry) => {
    assert.ok(!entry.isSymbolicLink(), `portable kit does not include symlinks: ${entry.name}`);
    const relative = prefix + entry.name;
    return entry.isDirectory() ? directoryFiles(`${directory}/${entry.name}`, `${relative}/`) : [relative];
  }).sort();
}

test('catalog offers a free versioned kit and an unpriced inquiry, with explicit sandbox and scenario boundaries', () => {
  assert.equal(BOT_MONEY_URL, 'https://pointcast.xyz/bot-money/');
  assert.equal(catalog.url, BOT_MONEY_URL);
  assert.equal(catalog.schema, 'pointcast.bot-money/v1');
  assert.equal(catalog.updatedAt, BOT_MONEY_DATE);
  assert.equal(new Set(catalog.products.map((product) => product.sku)).size, catalog.products.length);
  assert.equal(kit.status, 'available');
  assert.deepEqual(kit.price, { status: 'free', amount: 0, currency: 'USD' });
  assert.equal(kit.delivery.mode, 'direct-download');
  assert.equal(kit.delivery.accountRequired, false);
  assert.equal(kit.delivery.paymentRequired, false);
  assert.equal(sprint.status, 'inquiry-only');
  assert.deepEqual(sprint.price, { status: 'not-set', amount: null, currency: 'USD' });
  assert.equal(sprint.delivery.mode, 'not-scheduled');
  assert.equal(sprint.delivery.url, null);
  assert.equal(new URL(sprint.inquiry).protocol, 'mailto:');
  assert.equal(new URL(sprint.inquiry).pathname, 'hello@pointcast.xyz');
  for (const product of catalog.products) {
    assert.ok(product.version && product.limitations.length && product.humanApproval.length, product.sku);
    assert.equal(product.delivery.paymentRequired, false, 'this release opens no paid checkout');
  }
  assert.equal(catalog.demo.status, 'sandbox');
  for (const flag of ['realFunds', 'realWorkPerformed', 'paymentProcessing']) assert.equal(catalog.demo[flag], false);
  assert.deepEqual(catalog.scenarios.map(({ year, status, prediction }) => [year, status, prediction]), [
    [2027, 'speculative-design-scenario', false], [2028, 'speculative-design-scenario', false],
  ]);
  assert.deepEqual(catalog.agentAccess.newMcpTools, []);
  assert.equal(catalog.agentAccess.protocolComplianceClaim, false);
  assert.equal(catalog.agentAccess.shoppingPlatformApprovalClaim, false);
  assert.equal(catalog.agentAccess.existingMcp, 'https://pointcast.xyz/api/mcp-v2');
});

test('download URL, byte size, archive SHA-256, every manifest file, and published loose files agree', () => {
  const download = new URL(kit.delivery.url);
  assert.equal(download.origin, 'https://pointcast.xyz');
  assert.equal(download.pathname, `/downloads/${kitDirectory}.zip`);
  const archive = read(`public${download.pathname}`);
  assert.equal(archive.length, kit.delivery.bytes, 'catalog download byte count');
  assert.equal(hash(archive), kit.delivery.sha256, 'catalog SHA-256 identifies exactly the offered ZIP');
  const files = zipFiles(archive);
  const expected = [...portableProduct.contents].sort();
  assert.deepEqual([...files.keys()].sort(), expected, 'archive contents match the product list');
  assert.deepEqual(directoryFiles(publicDirectory), expected, 'loose downloads match the same product list');
  assert.deepEqual(fileManifest.files.map((file) => file.path).sort(), expected);
  assert.equal(fileManifest.file_count, files.size);
  assert.equal(fileManifest.version, kit.version);
  assert.equal(fileManifest.released, BOT_MONEY_DATE);
  assert.equal(fileManifest.checksum_algorithm, 'sha256');
  for (const entry of fileManifest.files) {
    const data = files.get(entry.path);
    assert.deepEqual(data, read(`${publicDirectory}/${entry.path}`), `ZIP and loose file agree: ${entry.path}`);
    if (entry.path === 'manifest.json') {
      assert.equal(entry.bytes, null);
      assert.equal(entry.sha256, null);
    } else {
      assert.equal(entry.bytes, data.length, `manifest byte count: ${entry.path}`);
      assert.equal(entry.sha256, hash(data), `manifest SHA-256: ${entry.path}`);
    }
  }
  for (const file of ['START-HERE.html', 'templates/offer-page.html', 'templates/product.json', 'templates/agent.md', 'templates/receipt-template.md', 'worksheets/offer-worksheet.md', 'worksheets/cost-time-planner.csv', 'checklists/publish-and-accept.md', 'checklists/spending-permission.md']) assert.ok(files.has(file), `advertised useful deliverable: ${file}`);
  assert.equal([...files.keys()].filter((name) => name.startsWith('examples/') && name.endsWith('.md')).length, 3);
  assert.equal([...files.keys()].filter((name) => name.startsWith('cards/') && name.endsWith('.svg')).length, 3);
});

test('portable product and editable draft preserve free fulfillment, license, and approval status', () => {
  for (const key of ['sku', 'version', 'name']) assert.equal(portableProduct[key], kit[key]);
  assert.equal(portableProduct.lifecycle, kit.status);
  for (const key of ['status', 'amount', 'currency']) assert.equal(portableProduct.price[key], kit.price[key]);
  assert.equal(portableProduct.price.payment_required, kit.delivery.paymentRequired);
  assert.equal(portableProduct.delivery.account_required, kit.delivery.accountRequired);
  assert.equal(portableProduct.delivery.format, kit.delivery.format);
  assert.equal(portableProduct.delivery.filename, `${kitDirectory}.zip`);
  assert.equal(portableProduct.delivery.top_level_directory, `${kitDirectory}/`);
  assert.equal(portableProduct.license.name, kit.license.name);
  assert.equal(portableProduct.license.spdx_id, 'MIT');
  assert.equal(portableProduct.license.notice_required, true);
  assert.equal(portableProduct.license.trademark_rights, false);
  assert.equal(new URL(kit.license.url).pathname, `/downloads/${kitDirectory}/${portableProduct.license.file}`);
  assert.match(text(`${publicDirectory}/${portableProduct.license.file}`), /MIT License[\s\S]*Permission is hereby granted[\s\S]*copyright notice/);
  assert.equal(portableProduct.agent_permissions.purchase_enabled, false);
  const draft = json(`${publicDirectory}/templates/product.json`);
  assert.equal(draft.lifecycle, 'draft');
  assert.equal(draft.availability, 'not_available');
  assert.equal(draft.price.amount, null);
  assert.equal(draft.delivery.download_url, null);
  assert.equal(draft.action.enabled, false);
  assert.equal(draft.agent_permissions.automatic_purchase, false);
  assert.ok(draft.agent_permissions.human_approval_required.includes('purchase'));
});

test('kit start page and offer template work offline with valid relative file links and no active forms or scripts', () => {
  const files = new Set(directoryFiles(publicDirectory));
  for (const file of ['START-HERE.html', 'templates/offer-page.html']) {
    const dom = new JSDOM(text(`${publicDirectory}/${file}`));
    const document = dom.window.document;
    assert.equal(document.querySelectorAll('script, form, iframe, object, embed').length, 0, file);
    for (const element of document.querySelectorAll('*')) {
      assert.ok([...element.attributes].every((attribute) => !attribute.name.startsWith('on')), `no inline handlers in ${file}`);
    }
    for (const element of document.querySelectorAll('[href], [src]')) {
      const link = element.getAttribute('href') ?? element.getAttribute('src');
      if (!link || link.startsWith('#')) continue;
      assert.ok(!/^(?:[a-z]+:|\/)/i.test(link), `offline relative link in ${file}: ${link}`);
      const target = posix.normalize(posix.join(posix.dirname(file), decodeURIComponent(link.split(/[?#]/)[0])));
      assert.ok(files.has(target), `bundled target in ${file}: ${target}`);
    }
    dom.window.close();
  }
});

test('source publication links and static CORS policy expose the lab without adding checkout', () => {
  const block = json('src/content/blocks/0710.json');
  assert.equal(block.draft, false);
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.paymentEnabled, false);
  assert.equal(block.meta.freeDownload, new URL(kit.delivery.url).pathname);
  assert.equal(block.meta.feature_json, '/bot-money.json');
  assert.ok(json('src/data/new-today.json').some((item) => item.link === '/bot-money/' && item.block === block.id));
  const headers = text('public/_headers');
  const catalogRule = headers.split(/\r?\n(?=\S)/).find((rule) => rule.startsWith('/bot-money.json\n'));
  assert.ok(catalogRule, 'Cloudflare static catalog header rule exists');
  assert.match(catalogRule, /Access-Control-Allow-Origin:\s*\*/);
  assert.match(catalogRule, /Content-Type:\s*application\/json/);
});

const built = (paths) => paths.every((path) => existsSync(new URL(`dist/${path}`, root)));
const skipBuild = 'Run npm run build:bare to enable rendered-output checks.';

test('rendered lab has one main and h1, unique IDs, resolvable labels and anchors, and matching structured product metadata', { skip: !built(['bot-money/index.html', 'bot-money.json']) && skipBuild }, () => {
  const renderedCatalog = json('dist/bot-money.json');
  assert.deepEqual(renderedCatalog, catalog, 'built catalog is current');
  const dom = new JSDOM(text('dist/bot-money/index.html'), { url: BOT_MONEY_URL });
  const document = dom.window.document;
  assert.equal(document.querySelectorAll('main').length, 1);
  assert.equal(document.querySelectorAll('h1').length, 1);
  const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
  assert.equal(new Set(ids).size, ids.length, 'all rendered IDs are unique');
  for (const element of document.querySelectorAll('[aria-labelledby], [aria-describedby], [aria-controls], label[for]')) {
    for (const attribute of ['aria-labelledby', 'aria-describedby', 'aria-controls', 'for']) {
      for (const id of (element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean)) assert.ok(document.getElementById(id), `${attribute} target exists: ${id}`);
    }
  }
  for (const anchor of document.querySelectorAll('a[href^="#"]')) assert.ok(document.getElementById(decodeURIComponent(anchor.hash.slice(1))), `fragment link exists: ${anchor.hash}`);
  for (const image of document.querySelectorAll('img')) assert.ok(image.hasAttribute('alt'), 'image has an explicit text alternative');
  assert.equal(document.querySelector('link[rel="canonical"]').href, BOT_MONEY_URL);
  assert.ok([...document.querySelectorAll('link[rel="alternate"][type="application/json"]')].some((link) => link.href === catalog.agentAccess.catalog));
  const structured = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((script) => {
    const value = JSON.parse(script.textContent);
    return value['@graph'] ?? [value];
  });
  const product = structured.find((entry) => entry['@type'] === 'Product' && entry.sku === kit.sku);
  const article = structured.find((entry) => entry['@type'] === 'Article');
  assert.ok(article && product, 'article and free product both have structured metadata');
  assert.equal(article.url, BOT_MONEY_URL);
  for (const key of ['sku', 'name', 'version', 'url']) assert.equal(product[key], kit[key]);
  assert.equal(product.offers.price, kit.price.amount);
  assert.equal(product.offers.priceCurrency, kit.price.currency);
  assert.equal(product.offers.url, kit.delivery.url);
  assert.equal(product.offers.availability, 'https://schema.org/InStock');
  assert.ok(document.querySelector(`#first-offer-kit a[download][href="${new URL(kit.delivery.url).pathname}"]`));
  assert.ok(document.querySelector(`#offer-sprint a[href="${sprint.inquiry}"]`));
  assert.equal(structured.filter((entry) => entry['@type'] === 'Product').length, 1, 'inquiry-only service is not marked as a product in stock');
  dom.window.close();
});

test('built discovery, block, JSON feed, RSS and sitemap all lead to the same published feature', { skip: !built(['agents.json', 'index.html', 'shop/index.html', 'for-agents/index.html', 'agent-kit.md', 'feed.json', 'feed.xml', 'b/0710.json', 'sitemap-discovery.xml']) && skipBuild }, () => {
  const agents = json('dist/agents.json');
  assert.equal(agents.botMoney.human, BOT_MONEY_URL);
  assert.equal(agents.botMoney.catalog, catalog.agentAccess.catalog);
  assert.equal(agents.botMoney.download, kit.delivery.url);
  for (const file of ['index.html', 'shop/index.html', 'for-agents/index.html', 'agent-kit.md', 'llms.txt', 'llms-full.txt']) assert.match(text(`dist/${file}`), /\/bot-money\//, `built discovery link: ${file}`);
  const block = json('dist/b/0710.json');
  assert.equal(block.id, '0710');
  const feedEntry = json('dist/feed.json').items.find((entry) => entry._pointcast?.id === '0710');
  assert.ok(feedEntry, 'global JSON Feed includes announcement');
  assert.equal(feedEntry.title, block.title);
  assert.equal(new URL(feedEntry.external_url).pathname.replace(/\/$/, ''), '/bot-money');
  const rss = new JSDOM(text('dist/feed.xml'), { contentType: 'text/xml' });
  assert.ok([...rss.window.document.querySelectorAll('item')].some((item) => item.querySelector('link')?.textContent === 'https://pointcast.xyz/b/0710'), 'global RSS includes announcement');
  rss.window.close();
  const sitemap = new JSDOM(text('dist/sitemap-discovery.xml'), { contentType: 'text/xml' });
  const locations = [...sitemap.window.document.querySelectorAll('loc')].map((node) => node.textContent);
  assert.ok(locations.includes(BOT_MONEY_URL));
  assert.ok(locations.includes(catalog.agentAccess.catalog));
  sitemap.window.close();
});
