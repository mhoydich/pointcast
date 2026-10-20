// The API Playground: /chain/playground (src/pages/chain/playground.astro), its
// logic (public/chain/apps/playground.js, an ES module with no DOM access) and
// the pinned tool list (public/chain/apps/playground-tools.json).
//
// Three layers: the logic imported straight into node (classification, schema
// to form, snippets, the client against a mock fetch); the page's own script
// run in jsdom against a mock fetch (so the real DOM code is exercised); and
// rules read off the sources (nothing from the devnet becomes markup, no banned
// words, the honesty line is there, the setup lines match /chain/bots).
import assert from 'node:assert/strict';
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { DEVNET } from '../src/data/chain-home.ts';
import * as pg from '../public/chain/apps/playground.js';

const execFileAsync = promisify(execFile);
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const lib = read('public/chain/apps/playground.js');
const page = read('src/pages/chain/playground.astro');
const dataSrc = read('src/data/chain-app-playground.ts');
const botsPage = read('src/pages/chain/bots.astro');
const fixtureRaw = read('public/chain/apps/playground-tools.json');
const fixture = JSON.parse(fixtureRaw);
const captureScript = read('scripts/capture-chain-playground-fixture.mjs');

const PAGE_SCRIPT = page.match(/<script>([\s\S]*?)<\/script>/)[1];
const PAGE_STYLE = page.match(/<style is:global>([\s\S]*?)<\/style>/)[1];
// Strip comments so the rules read code and copy, not the notes about them.
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

// The data module imports './chain-home' (fine for Vite, not for node): load a copy that points at the .ts file.
const data = await (async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pg-data-'));
  const file = join(dir, 'chain-app-playground.ts');
  writeFileSync(file, dataSrc.replace("from './chain-home';", `from '${new URL('src/data/chain-home.ts', root).pathname}';`));
  return import(file);
})();

const { tools: PINNED } = pg.parseToolsList({ result: { tools: fixture.tools } });
const byName = (n) => PINNED.find((t) => t.name === n);
const fieldsOf = (n) => pg.fieldsFromSchema(byName(n).inputSchema);
const CTRL = (n) => String.fromCharCode(n);
const hasInvisible = (str) => [0x202e, 0x0000, 0x200b, 0x202a, 0x2066].some((n) => str.includes(CTRL(n)));

// ---------------------------------------------------------------- the files

test('every file of the app is here, and the pinned list is a real tools/list capture', () => {
  for (const f of ['public/chain/apps/playground.js', 'public/chain/apps/playground-tools.json', 'src/pages/chain/playground.astro', 'src/data/chain-app-playground.ts', 'scripts/capture-chain-playground-fixture.mjs'])
    assert.ok(existsSync(new URL(f, root)), f);
  assert.equal(fixture.schema, 'pointcast-devnet/playground-tools/v1');
  assert.equal(fixture.count, fixture.tools.length);
  assert.equal(fixture.tools.length, 21);
  assert.ok(Number.isFinite(Date.parse(fixture.captured_at)));
  assert.match(fixture.source, /local devnet-2 worker/);
  assert.equal(PINNED.length, fixture.tools.length, 'every pinned tool parses');
  // The capture script only ever talks to a local worker.
  assert.match(captureScript, /\['localhost', '127\.0\.0\.1'\]\.includes\(u\.hostname\)/);
});

test('the read-only and writing tool lists are exactly the ones the brief names', () => {
  assert.deepEqual([...pg.READ_TOOLS].sort(), ['capsules_due', 'chain_daily_lot', 'chain_duties', 'chain_feed', 'chain_read_account', 'chain_read_block', 'chain_status', 'chain_tx_digest', 'editions_list', 'nm_ledger', 'nm_note', 'station_get'].sort());
  assert.deepEqual([...pg.WRITE_TOOLS].sort(), ['chain_bid', 'chain_checkin', 'chain_crosscheck', 'chain_digest', 'chain_observe', 'chain_post', 'chain_review', 'chain_signal', 'chain_submit_signed'].sort());
  assert.equal(pg.READ_TOOLS.filter((n) => pg.WRITE_TOOLS.includes(n)).length, 0);
  // Today's devnet serves exactly those 21.
  assert.deepEqual(PINNED.map((t) => t.name).sort(), [...pg.READ_TOOLS, ...pg.WRITE_TOOLS].sort());
});

// ---------------------------------------------------------------- which devnet

test('?devnet= is honored for localhost and 127.0.0.1 only, as an origin', () => {
  const PUBLIC = DEVNET.url;
  const ok = (search, base) => {
    const r = pg.resolveDevnet(PUBLIC, search);
    assert.equal(r.base, base, search);
    assert.equal(r.mcp, `${base}/mcp`, search);
    assert.equal(r.override, true, search);
    assert.equal(r.ignored, '', search);
  };
  const no = (search) => {
    const r = pg.resolveDevnet(PUBLIC, search);
    assert.equal(r.base, PUBLIC, search);
    assert.equal(r.override, false, search);
    assert.ok(r.ignored, `${search} is reported as ignored`);
  };
  ok('?devnet=http://127.0.0.1:8799', 'http://127.0.0.1:8799');
  ok('?devnet=http://localhost:4321', 'http://localhost:4321');
  ok('?devnet=http://LOCALHOST:8799/some/path?x=1#h', 'http://localhost:8799');
  ok('?devnet=https://127.0.0.1', 'https://127.0.0.1');
  ok(`?devnet=${encodeURIComponent('http://127.0.0.1:8799/')}&x=1`, 'http://127.0.0.1:8799');
  for (const bad of [
    'https://evil.example',
    'http://127.0.0.1.evil.example',
    'http://localhost.evil.example',
    'http://evil.example#@127.0.0.1',
    'http://127.0.0.1@evil.example',
    'http://localhost@evil.example',
    'http://user:pw@127.0.0.1:8799',
    'http://[::1]:8799',
    'http://10.0.0.5:8799',
    'http://0.0.0.0:8799',
    'ftp://127.0.0.1',
    'javascript:alert(1)',
    '//evil.example',
    '127.0.0.1:8799',
    'not a url',
    DEVNET.url.replace('https://', 'https://127.0.0.1.'),
  ])
    no(`?devnet=${encodeURIComponent(bad)}`);
  // No parameter, an empty one, or a broken query string: the public devnet, nothing reported.
  for (const s of ['', '?', '?devnet=', '?other=1']) {
    const r = pg.resolveDevnet(PUBLIC, s);
    assert.deepEqual([r.base, r.override, r.ignored], [PUBLIC, false, '']);
  }
  assert.equal(pg.resolveDevnet(`${PUBLIC}/`, '').base, PUBLIC, 'a trailing slash is dropped');
  // The reported value is cleaned, one line, short.
  const long = pg.resolveDevnet(PUBLIC, `?devnet=${encodeURIComponent(`https://${'a'.repeat(300)}.example${CTRL(0x202e)}`)}`);
  assert.ok(long.ignored.length <= 80);
  assert.ok(!long.ignored.includes(CTRL(0x202e)));
});

// ---------------------------------------------------------------- tools/list and classification

test('classification: only a listed reader whose description and annotations agree gets Run', () => {
  const kinds = Object.fromEntries(PINNED.map((t) => [t.name, pg.classifyTool(t).kind]));
  for (const n of pg.READ_TOOLS) assert.equal(kinds[n], 'read', n);
  for (const n of pg.WRITE_TOOLS) assert.equal(kinds[n], 'write', n);
  for (const t of PINNED) assert.equal(pg.classifyTool(t).run, kinds[t.name] === 'read', t.name);
  // The devnet's own annotations agree with the page's list for today's 21 tools.
  for (const t of PINNED) assert.equal(t.annotations.readOnlyHint, kinds[t.name] === 'read', `${t.name}: annotation vs list`);
  // The description pattern: no reader matches it, every writer does.
  for (const t of PINNED) assert.equal(pg.POSTS_PATTERN.test(t.description), kinds[t.name] !== 'read', `${t.name}: description`);

  // A reader whose description now says it posts is downgraded, and so is one the devnet stops marking read-only.
  const status = byName('chain_status');
  assert.equal(pg.classifyTool({ ...status, description: 'Publish a post on the devnet.' }).kind, 'unknown');
  assert.equal(pg.classifyTool({ ...status, description: 'Counts toward today’s Daily Net.' }).run, false);
  assert.equal(pg.classifyTool({ ...status, annotations: { readOnlyHint: false } }).run, false);
  assert.equal(pg.classifyTool({ ...status, annotations: { destructiveHint: true } }).run, false);
  // A tool is run only on the devnet's own word that it is read-only: a list that lost its annotations, or marks it open-world, is not run
  assert.equal(pg.classifyTool({ ...status, annotations: {} }).run, false, 'no annotations: the name alone is not enough');
  assert.equal(pg.classifyTool({ ...status, annotations: undefined }).run, false);
  assert.equal(pg.classifyTool({ ...status, annotations: { openWorldHint: false } }).run, false, 'openWorldHint alone says nothing about writing');
  assert.equal(pg.classifyTool({ ...status, annotations: { readOnlyHint: true, openWorldHint: true } }).run, false, 'open-world is not run from here');
  assert.equal(pg.classifyTool({ ...status, annotations: { readOnlyHint: true, openWorldHint: false } }).run, true);
  assert.equal(pg.classifyTool({ ...status, annotations: { readOnlyHint: true } }).run, true);
  // the finding's changed-list cases: a read-list name whose description now says it records or queues something, with its annotations gone
  const changed = byName('chain_read_block');
  for (const description of ['Records a block marker on the chain and bumps a counter.', 'Signs and queues the tx in the mempool for you.']) {
    const c = pg.classifyTool({ ...changed, description, annotations: undefined });
    assert.equal(c.run, false, description);
    assert.equal(c.kind, 'unknown');
    assert.doesNotMatch(c.why, /annotations agree/, 'the reason does not claim a check that was not made');
  }
  const ok = pg.classifyTool(changed);
  assert.equal(ok.kind, 'read');
  assert.match(ok.why, /marked readOnlyHint: true by the devnet/);
  assert.doesNotMatch(ok.why, /annotations agree/);
  assert.match(page.replace(/\s+/g, ' '), /the devnet marks it read-only \(<code>readOnlyHint: true<\/code>, and not open-world\)\. A tool with no such mark is not run, whatever its name/);
  // A name the page has never seen is never run, however harmless it sounds.
  const stranger = { name: 'chain_peek', description: 'Reads one thing.', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } };
  assert.deepEqual([pg.classifyTool(stranger).kind, pg.classifyTool(stranger).run], ['unknown', false]);
  for (const bad of [null, undefined, {}, { name: '' }, { name: 42 }, 'chain_status']) assert.equal(pg.classifyTool(bad).run, false);
});

test('parseToolsList: a bounded, clean list; hostile and odd entries are dropped or tamed', () => {
  assert.throws(() => pg.parseToolsList(null), { kind: 'parse' });
  assert.throws(() => pg.parseToolsList({ jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'slow down: per-IP MCP limit' } }), { kind: 'rpc', code: -32000 });
  assert.throws(() => pg.parseToolsList({ result: {} }), { kind: 'parse' });
  assert.throws(() => pg.parseToolsList({ result: { tools: 'nope' } }), { kind: 'parse' });
  const { tools, dropped } = pg.parseToolsList({
    result: {
      tools: [
        { name: 'ok_tool', title: 'OK', description: `fine${CTRL(0x202e)}${CTRL(0)} text`, inputSchema: { type: 'object', properties: { a: { type: 'string', description: 'x'.repeat(2000) } } } },
        { name: 'ok_tool' },
        { name: '<img src=x onerror=alert(1)>', description: 'markup name' },
        { name: '__proto__' },
        { name: 'Upper' },
        { name: 'a'.repeat(80) },
        { description: 'no name' },
        null,
        'string',
        { name: 'no_schema', description: 'd' },
        { name: 'weird_schema', inputSchema: 'not an object' },
        { name: 'deep', inputSchema: { type: 'object', properties: { p: deepSchema(30) } } },
      ],
    },
  });
  assert.deepEqual(tools.map((t) => t.name), ['ok_tool', 'no_schema', 'weird_schema', 'deep']);
  assert.equal(dropped, 8);
  assert.ok(!hasInvisible(tools[0].description), 'bidi and control characters are stripped');
  assert.ok(tools[0].inputSchema.properties.a.description.length <= 400);
  assert.equal(tools[1].schemaOdd, true);
  assert.equal(tools[2].schemaOdd, true);
  assert.deepEqual(tools[1].inputSchema, { type: 'object', properties: {} });
  // A list longer than the cap is cut, and says how many it dropped.
  const many = pg.parseToolsList({ result: { tools: Array.from({ length: 300 }, (_, i) => ({ name: `t_${i}` })) } });
  assert.equal(many.tools.length, pg.MAX_TOOLS);
  assert.equal(many.dropped, 100);
  // The cloned schema keeps no unknown keys and cannot carry prototype keys.
  const sch = pg.cloneSchema(JSON.parse('{"type":"object","properties":{"__proto__":{"type":"string"},"constructor":{"type":"string"},"ok":{"type":"string","x-evil":"1","$ref":"#/x"}}}'));
  assert.deepEqual(Object.keys(sch.properties), ['ok']);
  assert.equal(sch.properties.ok.complex, true);
  assert.ok(!('x-evil' in sch.properties.ok));
});

function deepSchema(n) {
  return n === 0 ? { type: 'string' } : { type: 'object', properties: { next: deepSchema(n - 1) } };
}

test('diffTools: added, removed and changed tools against the pinned list', () => {
  assert.equal(pg.diffTools(PINNED, PINNED).same, true);
  const live = PINNED.filter((t) => t.name !== 'capsules_due').map((t) => (t.name === 'chain_feed' ? { ...t, description: `${t.description} More.` } : t.name === 'chain_read_block' ? { ...t, inputSchema: { ...t.inputSchema, properties: { height: { type: 'integer', minimum: 2 } } } } : t));
  live.push({ name: 'chain_new', description: 'New.', inputSchema: { type: 'object', properties: {} }, annotations: {} });
  const d = pg.diffTools(PINNED, live);
  assert.deepEqual([d.added, d.removed, d.changed.sort()], [['chain_new'], ['capsules_due'], ['chain_feed', 'chain_read_block']]);
  assert.equal(d.same, false);
  // Key order in a schema is not a change.
  const reordered = PINNED.map((t) => ({ ...t, inputSchema: JSON.parse(JSON.stringify(t.inputSchema, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).reverse()) : v))) }));
  assert.equal(pg.diffTools(PINNED, reordered).same, true);
  // The new tool is unknown to the page, so it gets no Run.
  assert.equal(pg.classifyTool(live.at(-1)).run, false);
});

// ---------------------------------------------------------------- schema -> form

test('every inputSchema in the pinned (and local-devnet) tools/list becomes a form, a snippet and arguments', () => {
  const shapes = new Set();
  for (const t of PINNED) {
    const { fields, root: rootJson } = pg.fieldsFromSchema(t.inputSchema);
    assert.equal(rootJson, false, `${t.name}: a plain object schema needs no raw JSON box`);
    const props = Object.keys(t.inputSchema.properties || {});
    assert.deepEqual(fields.map((f) => f.name), props, `${t.name}: one field per property, in order`);
    const required = new Set(t.inputSchema.required || []);
    for (const f of fields) {
      assert.equal(f.required, required.has(f.name), `${t.name}.${f.name} required`);
      shapes.add(f.kind);
      assert.ok(pg.constraintText(f) !== undefined);
    }
    // Empty form: required fields are errors, optional ones are left out.
    const empty = pg.buildArguments(fields, {}, false);
    assert.deepEqual(Object.keys(empty.errors).sort(), [...required].sort(), `${t.name}: errors are exactly the required fields`);
    assert.equal(empty.ok, required.size === 0);
    assert.deepEqual(Object.keys(empty.args), [], `${t.name}: nothing invented`);
    // A snippet is always complete: examples stand in for the required fields.
    const args = pg.snippetArgs(fields, {}, false);
    for (const r of required) assert.ok(r in args, `${t.name}.${r} has an example in the snippet`);
    assert.doesNotThrow(() => JSON.parse(pg.rpcBody(t.name, args)));
  }
  // Every control the page can draw is used by the tools served today.
  assert.deepEqual([...shapes].sort(), ['boolean', 'integer', 'json', 'list', 'select', 'text', 'textarea']);
});

test('each tool’s fields carry its types, enums, bounds, patterns and requireds', () => {
  const f = (tool, name) => fieldsOf(tool).fields.find((x) => x.name === name);
  assert.deepEqual(pg.fieldsFromSchema(byName('chain_status').inputSchema), { fields: [], root: false });
  assert.deepEqual([f('chain_feed', 'limit').kind, f('chain_feed', 'limit').min, f('chain_feed', 'limit').max, f('chain_feed', 'limit').default], ['integer', 1, 50, 10]);
  assert.deepEqual([f('chain_feed', 'before').kind, f('chain_feed', 'before').min, f('chain_feed', 'before').max], ['integer', 1, undefined]);
  assert.equal(f('chain_read_account', 'address').required, true);
  assert.deepEqual([f('chain_post', 'channel').kind, f('chain_post', 'channel').enum, f('chain_post', 'channel').default], ['select', ['BOT', 'GDN'], 'BOT']);
  assert.deepEqual([f('chain_post', 'title').kind, f('chain_post', 'title').maxLength], ['text', 120]);
  assert.equal(f('chain_post', 'body').kind, 'textarea');
  assert.equal(f('chain_post', 'bot').pattern, '^[a-z0-9-]{2,24}$');
  assert.equal(f('chain_crosscheck', 'result').kind, 'select');
  assert.deepEqual(f('chain_crosscheck', 'result').enum, ['match', 'mismatch']);
  assert.deepEqual([f('chain_crosscheck', 'links_checked').min, f('chain_crosscheck', 'links_checked').max], [0, 64]);
  assert.equal(f('chain_review', 'items').kind, 'json');
  assert.deepEqual([f('chain_digest', 'cites').kind, f('chain_digest', 'cites').maxItems, f('chain_digest', 'cites').itemPattern], ['list', 20, '^[0-9a-fA-F]{64}$']);
  assert.deepEqual([f('chain_signal', 'sources').kind, f('chain_signal', 'sources').minItems, f('chain_signal', 'sources').maxItems], ['list', 1, 3]);
  assert.equal(f('chain_signal', 'label').kind, 'select');
  assert.equal(f('nm_note', 'svg').kind, 'boolean');
  assert.equal(f('chain_submit_signed', 'signed_tx').kind, 'json');
  assert.deepEqual([f('chain_bid', 'words').kind, f('chain_bid', 'words').maxItems], ['list', 3]);
  assert.equal(f('capsules_due', 'limit').max, 100);
  assert.equal(f('station_get', 'code').pattern, '^[A-Za-z0-9]{1,16}$');
});

test('every other JSON Schema shape still gives a form (or one JSON box), never an exception', () => {
  const cases = {
    notObject: { type: 'string' },
    arrayRoot: { type: 'array', items: { type: 'string' } },
    oneOfRoot: { oneOf: [{ type: 'object', properties: { a: { type: 'string' } } }, { type: 'object', properties: { b: { type: 'integer' } } }] },
    freeForm: { type: 'object' },
    freeFormTrue: { type: 'object', additionalProperties: true, properties: {} },
    noType: {},
    nullSchema: null,
    refProp: { type: 'object', properties: { a: { $ref: '#/$defs/a' } }, additionalProperties: false },
    anyOfProp: { type: 'object', properties: { a: { anyOf: [{ type: 'string' }, { type: 'integer' }] } } },
    typeArray: { type: 'object', properties: { a: { type: ['string', 'null'], maxLength: 4 }, b: { type: ['integer', 'null'], minimum: 0 } } },
    intEnum: { type: 'object', properties: { n: { type: 'integer', enum: [1, 2, 3], default: 2 } } },
    constProp: { type: 'object', properties: { v: { const: 'x' } } },
    listOfInts: { type: 'object', properties: { ids: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 9 }, minItems: 1, maxItems: 3 } }, required: ['ids'] },
    listOfObjects: { type: 'object', properties: { rows: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] } } } },
    nested: { type: 'object', properties: { o: { type: 'object', properties: { x: { type: 'string' } }, required: ['x'], additionalProperties: false } } },
    number: { type: 'object', properties: { r: { type: 'number', minimum: 0.5, maximum: 2.5 } }, additionalProperties: false },
    boolean: { type: 'object', properties: { b: { type: 'boolean', default: true } }, required: ['b'] },
    emptyEnum: { type: 'object', properties: { e: { type: 'string', enum: [] } } },
    badPattern: { type: 'object', properties: { p: { type: 'string', pattern: '([unclosed' } } },
    huge: { type: 'object', properties: Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`p${i}`, { type: 'string' }])) },
  };
  for (const [name, schema] of Object.entries(cases)) {
    const clean = pg.cloneSchema(schema);
    const { fields, root: rootJson } = pg.fieldsFromSchema(clean);
    assert.ok(Array.isArray(fields), name);
    if (rootJson) assert.deepEqual([fields.length, fields[0].kind, fields[0].name], [1, 'json', 'arguments'], name);
    assert.doesNotThrow(() => pg.buildArguments(fields, {}, rootJson), name);
    assert.doesNotThrow(() => pg.snippetArgs(fields, {}, rootJson), name);
    assert.doesNotThrow(() => JSON.stringify(pg.snippetArgs(fields, {}, rootJson)), name);
    assert.doesNotThrow(() => pg.curlSnippet('http://127.0.0.1:8799/mcp', 'chain_x', pg.snippetArgs(fields, {}, rootJson)), name);
  }
  const f = (name, key) => pg.fieldsFromSchema(pg.cloneSchema(cases[name])).fields.find((x) => x.name === key);
  for (const n of ['notObject', 'arrayRoot', 'oneOfRoot', 'freeForm', 'noType', 'nullSchema']) assert.equal(pg.fieldsFromSchema(pg.cloneSchema(cases[n])).root, true, n);
  assert.equal(pg.fieldsFromSchema(pg.cloneSchema(cases.number)).root, false);
  assert.equal(f('refProp', 'a').kind, 'json');
  assert.equal(f('anyOfProp', 'a').kind, 'json');
  assert.deepEqual([f('typeArray', 'a').kind, f('typeArray', 'a').nullable, f('typeArray', 'b').kind], ['text', true, 'integer']);
  assert.deepEqual([f('intEnum', 'n').kind, f('intEnum', 'n').enum, pg.initialValue(f('intEnum', 'n'))], ['select', [1, 2, 3], '2']);
  assert.equal(f('constProp', 'v').kind, 'select');
  assert.equal(f('listOfInts', 'ids').itemType, 'integer');
  assert.equal(f('listOfObjects', 'rows').kind, 'json');
  assert.equal(f('nested', 'o').kind, 'json');
  assert.equal(f('boolean', 'b').kind, 'boolean');
  assert.equal(pg.fieldsFromSchema(pg.cloneSchema(cases.huge)).fields.length, 60, 'at most 60 properties');
  // A root JSON box accepts an object and nothing else.
  const rootFields = pg.fieldsFromSchema(pg.cloneSchema(cases.freeForm)).fields;
  assert.deepEqual(pg.buildArguments(rootFields, { arguments: '{"a":1}' }, true), { args: { a: 1 }, errors: {}, ok: true });
  assert.equal(pg.buildArguments(rootFields, { arguments: '[1]' }, true).ok, false);
  assert.equal(pg.buildArguments(rootFields, { arguments: '{nope' }, true).ok, false);
  assert.deepEqual(pg.buildArguments(rootFields, { arguments: '' }, true), { args: {}, errors: {}, ok: true });
});

test('buildArguments: coercion and every constraint, with a short message for each failure', () => {
  const build = (tool, values) => pg.buildArguments(fieldsOf(tool).fields, values);
  // integers: bounds, whole numbers, junk
  assert.deepEqual(build('chain_feed', { limit: '5' }).args, { limit: 5 });
  assert.deepEqual(build('chain_feed', { limit: ' 50 ' }).args, { limit: 50 });
  assert.match(build('chain_feed', { limit: '0' }).errors.limit, /1 or more/);
  assert.match(build('chain_feed', { limit: '51' }).errors.limit, /50 or less/);
  for (const bad of ['1.5', 'abc', '1e3', '0x10', '9'.repeat(30), '--1']) assert.match(build('chain_feed', { limit: bad }).errors.limit, /whole number|1 or more|50 or less/, bad);
  assert.deepEqual(build('chain_feed', { limit: '' }).args, {}, 'empty optional is left out');
  assert.deepEqual(build('chain_feed', { limit: '5', before: '100', channel: 'BOT' }).args, { limit: 5, before: 100, channel: 'BOT' });
  // strings: required, length, pattern
  assert.equal(build('chain_post', { bot: 'my-bot', title: 'hi' }).ok, true);
  assert.equal(build('chain_post', { bot: 'My Bot', title: 'hi' }).errors.bot, 'must match ^[a-z0-9-]{2,24}$');
  assert.match(build('chain_post', { bot: 'my-bot', title: 'x'.repeat(121) }).errors.title, /up to 120 characters \(this is 121\)/);
  assert.equal(build('chain_post', { bot: 'my-bot', title: '   ' }).errors.title, 'required');
  assert.deepEqual(build('chain_post', { bot: 'my-bot', title: 'hi', channel: 'GDN' }).args.channel, 'GDN');
  assert.match(build('chain_post', { bot: 'my-bot', title: 'hi', channel: 'NOPE' }).errors.channel, /one of BOT, GDN/);
  assert.equal(build('chain_post', { bot: 'my-bot', title: 'hi', idempotency_key: 'bad key!' }).ok, false);
  // a code point counts once, however it is encoded
  assert.equal(build('chain_post', { bot: 'my-bot', title: '\u{1F600}'.repeat(120) }).ok, true);
  // enums come back typed
  assert.equal(build('chain_signal', { bot: 'my-bot', label: 'fact', text: 't', sources: 'https://example.org/a' }).ok, true);
  // lists: one per line, per-item pattern, min and max
  const hex = 'a'.repeat(64);
  assert.deepEqual(build('chain_digest', { bot: 'my-bot', text: 't', cites: `${hex}\n\n  ${hex}  \n` }).args.cites, [hex, hex]);
  assert.match(build('chain_digest', { bot: 'my-bot', text: 't', cites: 'zzz' }).errors.cites, /line 1: must match/);
  assert.match(build('chain_digest', { bot: 'my-bot', text: 't', cites: Array(21).fill(hex).join('\n') }).errors.cites, /at most 20 items \(this is 21\)/);
  assert.equal(build('chain_digest', { bot: 'my-bot', text: 't', cites: '' }).errors.cites, 'required');
  assert.match(build('chain_signal', { bot: 'my-bot', label: 'fact', text: 't', sources: 'http://insecure.example' }).errors.sources, /line 1: must match \^https:\/\//);
  assert.match(build('chain_signal', { bot: 'my-bot', label: 'fact', text: 't', sources: Array(4).fill('https://a.example').join('\n') }).errors.sources, /at most 3/);
  // booleans
  assert.deepEqual(build('nm_note', { serial: '3', svg: 'false' }).args, { serial: 3, svg: false });
  assert.deepEqual(build('nm_note', { serial: '3', svg: '' }).args, { serial: 3 });
  assert.equal(build('nm_note', { serial: '', svg: 'true' }).errors.serial, 'required');
  // JSON boxes are parsed and checked against the schema
  const item = { tx: hex, rating: 'good', reason: 'ok' };
  assert.deepEqual(build('chain_review', { bot: 'my-bot', items: JSON.stringify([item]) }).args.items, [item]);
  assert.match(build('chain_review', { bot: 'my-bot', items: '[{' }).errors.items, /not valid JSON/);
  assert.match(build('chain_review', { bot: 'my-bot', items: '{}' }).errors.items, /must be array/);
  assert.match(build('chain_review', { bot: 'my-bot', items: '[]' }).errors.items, /at least 1 items/);
  assert.match(build('chain_review', { bot: 'my-bot', items: JSON.stringify([{ ...item, rating: 'meh' }]) }).errors.items, /items\[0\]\.rating: must be one of good, unclear, flag/);
  assert.match(build('chain_review', { bot: 'my-bot', items: JSON.stringify([{ ...item, extra: 1 }]) }).errors.items, /not a known field/);
  assert.match(build('chain_review', { bot: 'my-bot', items: JSON.stringify([{ rating: 'good' }]) }).errors.items, /items\[0\]\.tx: required/);
  assert.match(build('chain_review', { bot: 'my-bot', items: JSON.stringify(Array(6).fill(item)) }).errors.items, /at most 5 items/);
  assert.equal(build('chain_submit_signed', { signed_tx: '{"tx":{}}' }).ok, true);
  assert.equal(build('chain_submit_signed', { signed_tx: '"a string"' }).ok, false);
  assert.equal(build('chain_tx_digest', { tx: '{"sender":"x","type":"transfer"}' }).ok, true);
  // numbers
  const nf = pg.fieldsFromSchema(pg.cloneSchema({ type: 'object', properties: { r: { type: 'number', minimum: 0.5, maximum: 2.5 } } })).fields;
  assert.deepEqual(pg.buildArguments(nf, { r: '1.25' }).args, { r: 1.25 });
  assert.match(pg.buildArguments(nf, { r: '3' }).errors.r, /2.5 or less/);
  assert.equal(pg.buildArguments(nf, { r: 'x' }).errors.r, 'a number');
  // an unclosed pattern from a hostile schema is ignored, not thrown
  const bp = pg.fieldsFromSchema(pg.cloneSchema({ type: 'object', properties: { p: { type: 'string', pattern: '([unclosed' } } })).fields;
  assert.deepEqual(pg.buildArguments(bp, { p: 'anything' }).args, { p: 'anything' });
});

test('snippetArgs fills a required field with an example and keeps what the form holds', () => {
  const { fields } = fieldsOf('chain_crosscheck');
  const args = pg.snippetArgs(fields, { bot: 'zed-bot', height: '12' });
  assert.equal(args.bot, 'zed-bot');
  assert.equal(args.height, 12);
  assert.equal(args.of_tx, '<64 hex>');
  assert.equal(args.claimed_root, '<12 to 64 hex>');
  assert.equal(args.result, 'match');
  assert.ok(!('idempotency_key' in args), 'optional fields are not invented');
  assert.equal(pg.snippetArgs(fieldsOf('chain_digest').fields, {}).cites[0], '<64 hex>');
  assert.equal(pg.snippetArgs(fieldsOf('chain_post').fields, {}).bot, 'my-bot');
  assert.deepEqual(pg.snippetArgs(fieldsOf('chain_review').fields, {}).items, [{ tx: '<64 hex>', rating: 'good' }]);
  assert.deepEqual(pg.snippetArgs(fieldsOf('chain_signal').fields, {}).sources, ['<https URL>']);
});

// ---------------------------------------------------------------- snippets

test('shq and the curl snippet survive a real shell, whatever the arguments say', () => {
  const nasty = [`it's`, `"double"`, 'new\nline', '$HOME `uname` $(id)', '\\n \\\\', '\u{1F600} é', "'; echo pwned; '"];
  for (const s of nasty) {
    const out = spawnSync('bash', ['-c', `printf %s ${pg.shq(s)}`], { encoding: 'utf8' });
    assert.equal(out.stdout, s, JSON.stringify(s));
  }
  for (const s of nasty) {
    const args = { title: s, nested: { list: [s] } };
    const snippet = pg.curlSnippet('http://127.0.0.1:8799/mcp', 'chain_post', args);
    const probe = `curl() { for a in "$@"; do printf '%s\\0' "$a"; done; }\n${snippet}`;
    const out = spawnSync('bash', ['-c', probe], { encoding: 'utf8' });
    const argv = out.stdout.split('\0').slice(0, -1);
    assert.deepEqual(argv, ['-s', 'http://127.0.0.1:8799/mcp', '-H', 'content-type: application/json', '-H', 'accept: application/json, text/event-stream', '-d', pg.rpcBody('chain_post', args)], JSON.stringify(s));
    assert.deepEqual(JSON.parse(argv.at(-1)).params, { name: 'chain_post', arguments: args });
  }
  assert.match(pg.curlSnippet('http://127.0.0.1:8799/mcp', 'chain_status', {}), /^curl -s 'http:\/\/127\.0\.0\.1:8799\/mcp' \\\n/);
  assert.equal(pg.restCurl('http://127.0.0.1:8799', '/feed', { limit: 3, before: undefined, x: '' }), `curl -s 'http://127.0.0.1:8799/feed?limit=3'`);
  assert.equal(pg.restCurl('http://127.0.0.1:8799', '/account/tz1x'), `curl -s 'http://127.0.0.1:8799/account/tz1x'`);
});

test('the Node snippet is ten lines, valid, and runs against a server', async () => {
  const snippet = pg.nodeSnippet('http://127.0.0.1:1/mcp', 'chain_feed', { limit: 5, channel: `it's "x"` });
  assert.equal(snippet.split('\n').length, 10);
  const dir = mkdtempSync(join(tmpdir(), 'pg-snip-'));
  writeFileSync(join(dir, 'snippet.mjs'), snippet);
  const parsed = spawnSync(process.execPath, ['--check', join(dir, 'snippet.mjs')], { encoding: 'utf8' });
  assert.equal(parsed.status, 0, parsed.stderr);
  let seen;
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      seen = { method: req.method, headers: req.headers, body: JSON.parse(body) };
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: '{"ok":true}' }], structuredContent: { ok: true, echoed: seen.body.params.arguments } } }));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const url = `http://127.0.0.1:${server.address().port}/mcp`;
    // Async, not spawnSync: this process is the server the snippet talks to.
    const run = await execFileAsync(process.execPath, ['--input-type=module', '-e', pg.nodeSnippet(url, 'chain_feed', { limit: 5, channel: `it's "x"` })], { encoding: 'utf8', timeout: 15000 });
    assert.deepEqual(JSON.parse(run.stdout), { ok: true, echoed: { limit: 5, channel: `it's "x"` } });
    assert.equal(seen.method, 'POST');
    assert.equal(seen.headers['content-type'], 'application/json');
    assert.equal(seen.headers.accept, 'application/json, text/event-stream');
    assert.deepEqual(seen.body, { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'chain_feed', arguments: { limit: 5, channel: `it's "x"` } } });
  } finally {
    server.close();
  }
});

// ---------------------------------------------------------------- REST routes and twins

test('REST routes: the thirteen routes of the brief, inputs validated, paths encoded', () => {
  assert.deepEqual(pg.REST_ROUTES.map((r) => r.path), ['/status', '/params', '/raw/blocks', '/raw/block/{height}', '/net', '/witnesses', '/checkpoints', '/daily', '/nm/state', '/editions', '/station/{code}', '/capsules', '/account/{address}']);
  const route = (id) => pg.REST_ROUTES.find((r) => r.id === id);
  for (const r of pg.REST_ROUTES) {
    assert.ok(r.blurb.length > 10, r.id);
    if (!r.params.length) assert.ok(r.tryQuery && typeof r.tryQuery === 'object', `${r.id}: a Try that needs no input`);
  }
  assert.deepEqual(pg.buildRoute(route('status')), { path: '/status', query: {}, errors: {}, ok: true });
  assert.deepEqual(pg.buildRoute(route('raw-blocks')).query, { from: 1, limit: 3 }, 'a Try never pulls the default 100 raw blocks');
  assert.deepEqual(pg.buildRoute(route('witnesses')).query, { limit: 10 });
  assert.equal(pg.buildRoute(route('raw-block'), { height: '7' }).path, '/raw/block/7');
  for (const bad of ['', '0', '-1', 'x', '1.5', '1/2', '../status', '99999999999999999999']) assert.equal(pg.buildRoute(route('raw-block'), { height: bad }).ok, false, `height ${bad}`);
  assert.equal(pg.buildRoute(route('station'), { code: 'gdn' }).path, '/station/gdn');
  for (const bad of ['', '../x', 'a/b', 'a'.repeat(17), 'a b', '%2e%2e']) assert.equal(pg.buildRoute(route('station'), { code: bad }).ok, false, `code ${bad}`);
  const addr = 'tz1bLEsiTQ2vQx8znZnuahFfKEf98xicMX35';
  assert.equal(pg.buildRoute(route('account'), { address: addr }).path, `/account/${addr}`);
  for (const bad of ['', 'tz1', `${addr}/controllers`, '../status', `${addr}?x=1`, 'KT1Vt8JkUShtxihYQUBQfnDfvVm3RvDCicp', `${addr}#x`])
    assert.equal(pg.buildRoute(route('account'), { address: bad }).ok, false, `address ${bad}`);
  for (const ok of ['pca1Vt8JkUShtxihYQUBQfnDfvVm3RvDCicp', 'tz2Vt8JkUShtxihYQUBQfnDfvVm3RvDCicp', 'pcp1Vt8JkUShtxihYQUBQfnDfvVm3RvDCicp']) assert.equal(pg.buildRoute(route('account'), { address: ok }).ok, true, ok);
});

test('twinFor: the GET (or digest) route that answers each read-only tool, and what it cannot take', () => {
  assert.deepEqual(pg.twinFor('chain_status', {}), { method: 'GET', path: '/status', query: {}, dropped: [], note: '' });
  assert.equal(pg.twinFor('chain_feed', {}).query.limit, 10, 'the tool defaults to 10; GET /feed defaults to 20');
  assert.deepEqual(pg.twinFor('chain_feed', { limit: 3, before: 9, channel: 'BOT' }).dropped, ['channel']);
  assert.equal(pg.twinLabel(pg.twinFor('chain_feed', { limit: 3, before: 9 })), 'GET /feed?limit=3&before=9');
  assert.equal(pg.twinFor('chain_read_block', {}).path, '/block/latest');
  assert.equal(pg.twinFor('chain_read_block', { height: 12 }).path, '/block/12');
  assert.equal(pg.twinFor('chain_read_account', {}), null);
  assert.equal(pg.twinFor('chain_read_account', { address: 'tz1a/b' }).path, '/account/tz1a%2Fb');
  assert.equal(pg.twinFor('station_get', {}).path, '/stations');
  assert.equal(pg.twinFor('station_get', { code: 'ORC' }).path, '/station/ORC');
  assert.deepEqual(pg.twinFor('capsules_due', { limit: 5 }).query, { due: 1, limit: 5 });
  assert.deepEqual(pg.twinFor('chain_duties', { bot: 'my-bot' }).query, { bot: 'my-bot', address: undefined });
  assert.equal(pg.twinFor('chain_daily_lot', { lot: 4 }).path, '/daily/4');
  assert.equal(pg.twinFor('chain_daily_lot', {}).path, '/daily');
  assert.equal(pg.twinFor('nm_ledger', { after: 0, limit: 5 }).path, '/nm/ledger');
  assert.equal(pg.twinFor('nm_note', { serial: 2 }).path, '/nm/note/2');
  assert.equal(pg.twinFor('nm_note', {}), null);
  assert.deepEqual([pg.twinFor('chain_tx_digest', { tx: { a: 1 } }).method, pg.twinFor('chain_tx_digest', { tx: { a: 1 } }).path], ['POST', '/tx/digest']);
  // Every read-only tool has a twin (given its required arguments), and no writing tool does.
  const example = { chain_read_account: { address: 'tz1x' }, nm_note: { serial: 1 }, chain_tx_digest: { tx: {} } };
  for (const n of pg.READ_TOOLS) assert.ok(pg.twinFor(n, example[n] || {}), n);
  for (const n of pg.WRITE_TOOLS) assert.equal(pg.twinFor(n, { bot: 'my-bot' }), null, n);
});

// ---------------------------------------------------------------- the client

const rpcOk = (id, result) => ({ jsonrpc: '2.0', id, result });
const callResult = (value, isError = false) => ({ content: [{ type: 'text', text: JSON.stringify(value) }], isError, structuredContent: value });

function mockFetch(handler) {
  const calls = [];
  const f = async (url, init = {}) => {
    const u = new URL(url, 'https://pointcast.xyz');
    const call = { url: String(url), method: init.method || 'GET', path: u.pathname, query: Object.fromEntries(u.searchParams), body: init.body ? JSON.parse(init.body) : undefined, init };
    calls.push(call);
    const r = await handler(call);
    if (r instanceof Error) throw r;
    const body = r.body === undefined ? '' : typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
    return new Response(body, { status: r.status ?? 200, headers: r.headers });
  };
  f.calls = calls;
  return f;
}
const BASE = 'http://127.0.0.1:8799';
const corsBlocked = () => new TypeError('Failed to fetch');
/** A devnet whose /mcp the browser cannot read (a CORS block rejects the fetch) but whose GETs work. */
const blockedDevnet = (extra = () => undefined) => mockFetch((c) => extra(c) ?? (c.path === '/mcp' ? corsBlocked() : c.path === '/status' ? { body: { chain_id: 'pointcast-devnet-2', height: 5 } } : { body: { path: c.path, query: c.query } }));
const liveDevnet = (tools = fixture.tools, extra = () => undefined) =>
  mockFetch((c) => {
    const x = extra(c);
    if (x) return x;
    if (c.path !== '/mcp') return { body: { path: c.path } };
    if (c.body.method === 'tools/list') return { body: rpcOk(c.body.id, { tools }) };
    if (c.body.method === 'tools/call') return { body: rpcOk(c.body.id, callResult({ called: c.body.params.name, args: c.body.params.arguments })) };
    return { body: { jsonrpc: '2.0', id: c.body.id, error: { code: -32601, message: 'method not found' } } };
  });

test('discover: live list over MCP, with a diff against the pinned list', async () => {
  const live = [...fixture.tools.filter((t) => t.name !== 'capsules_due'), { name: 'chain_mystery', description: 'Does something.', inputSchema: { type: 'object', properties: { q: { type: 'string' } } } }];
  const f = liveDevnet(live);
  const client = pg.createClient({ base: BASE, fetch: f });
  const d = await client.discover(PINNED);
  assert.deepEqual([d.mode, d.reason, d.transport, client.transport], ['live', '', 'mcp', 'mcp']);
  assert.equal(d.tools.length, 21);
  assert.deepEqual([d.diff.added, d.diff.removed], [['chain_mystery'], ['capsules_due']]);
  // tools/list went out exactly as the brief says.
  assert.equal(f.calls.length, 1);
  assert.deepEqual([f.calls[0].method, f.calls[0].path], ['POST', '/mcp']);
  assert.equal(f.calls[0].init.headers['content-type'], 'application/json');
  assert.equal(f.calls[0].init.headers.accept, 'application/json, text/event-stream');
  assert.deepEqual([f.calls[0].body.jsonrpc, f.calls[0].body.method], ['2.0', 'tools/list']);
  assert.equal(f.calls[0].init.credentials, 'omit');
  // The new tool is unknown, so it never runs; a known reader still does.
  await assert.rejects(client.run(d.tools.find((t) => t.name === 'chain_mystery'), {}), { kind: 'refused' });
  assert.equal(f.calls.length, 1, 'refused before any request');
  const r = await client.run(d.tools.find((t) => t.name === 'chain_feed'), { limit: 2 });
  assert.deepEqual([r.via, r.isError, r.json], ['mcp', false, { called: 'chain_feed', args: { limit: 2 } }]);
  assert.match(pg.discoveryMessage(d, { pinnedAt: '2026-10-19' }), /differs from the pinned list: 1 new \(chain_mystery\).*1 no longer served \(capsules_due\)/);
  assert.match(pg.discoveryMessage(await pg.createClient({ base: BASE, fetch: liveDevnet() }).discover(PINNED)), /the same as the pinned list/);
});

test('discover: a browser that cannot read /mcp (CORS) falls back to the pinned list and the GET routes', async () => {
  const f = blockedDevnet();
  const client = pg.createClient({ base: BASE, fetch: f });
  const d = await client.discover(PINNED);
  assert.deepEqual([d.mode, d.reason, d.transport, client.transport], ['fixture', 'blocked', 'rest', 'rest']);
  assert.equal(d.tools, PINNED);
  assert.deepEqual(f.calls.map((c) => `${c.method} ${c.path}`), ['POST /mcp', 'GET /status'], 'one blocked POST, then a GET to tell blocked from down');
  const msg = pg.discoveryMessage(d, { pinnedAt: '2026-10-19' });
  assert.match(msg, /cannot read \/mcp/);
  assert.match(msg, /no CORS headers on \/mcp, on purpose/);
  assert.match(msg, /21 tools pinned from a local run of the devnet Worker, captured 2026-10-19/);
  // Run goes through the matching GET route and says so.
  const r = await client.run(byName('chain_feed'), { limit: 4, channel: 'BOT' });
  assert.deepEqual([r.via, r.isError, r.status], ['rest', false, 200]);
  assert.equal(pg.twinLabel(r.twin), 'GET /feed?limit=4');
  assert.deepEqual(r.twin.dropped, ['channel']);
  assert.deepEqual(r.json, { path: '/feed', query: { limit: '4' } });
  assert.equal(f.calls.filter((c) => c.path === '/mcp').length, 1, 'MCP is not tried again once it is known to be blocked');
  // A tool with no twin for what was typed says so instead of calling anything.
  await assert.rejects(client.run(byName('chain_read_account'), {}), { kind: 'refused' });
  // The digest twin is the one POST, and it goes to /tx/digest.
  const dg = await client.run(byName('chain_tx_digest'), { tx: { sender: 'x', type: 'transfer' } });
  assert.deepEqual([dg.via, f.calls.at(-1).method, f.calls.at(-1).path], ['rest', 'POST', '/tx/digest']);
  assert.deepEqual(f.calls.at(-1).body, { sender: 'x', type: 'transfer' });
});

test('discover: unreachable, 429, an HTTP error, a JSON-RPC error and a reply that is not tools/list', async () => {
  const none = pg.createClient({ base: BASE, fetch: mockFetch(() => corsBlocked()) });
  const down = await none.discover(PINNED);
  assert.deepEqual([down.mode, down.reason], ['fixture', 'unreachable']);
  assert.match(pg.discoveryMessage(down), /devnet unreachable/);
  await assert.rejects(none.run(byName('chain_status'), {}), { kind: 'network' });
  assert.match(pg.friendlyError(down.error), /devnet unreachable/);

  const slow = pg.createClient({ base: BASE, fetch: mockFetch((c) => (c.path === '/mcp' ? { status: 429, headers: { 'retry-after': '42' }, body: { jsonrpc: '2.0', id: null, error: { code: -32000, message: 'slow down: per-IP MCP limit' } } } : { body: {} })) });
  const rate = await slow.discover(PINNED);
  assert.deepEqual([rate.mode, rate.reason, slow.transport], ['fixture', 'rate', 'mcp']);
  assert.match(pg.discoveryMessage(rate), /slow down \(HTTP 429\).*Try again in a minute/);
  assert.match(pg.friendlyError(rate.error), /slow down \(HTTP 429\).*Try again in 42 s/);
  assert.equal(rate.error.retryAfter, 42);

  const five = await pg.createClient({ base: BASE, fetch: mockFetch(() => ({ status: 503, body: '<html>upstream down</html>' })) }).discover(PINNED);
  assert.deepEqual([five.mode, five.reason], ['fixture', 'http']);
  assert.match(pg.discoveryMessage(five), /did not return a usable tools\/list \(HTTP 503\)/);

  const rpcErr = await pg.createClient({ base: BASE, fetch: mockFetch((c) => ({ body: { jsonrpc: '2.0', id: c.body.id, error: { code: -32601, message: 'method not found: tools/list' } } })) }).discover(PINNED);
  assert.deepEqual([rpcErr.mode, rpcErr.reason], ['fixture', 'rpc']);
  assert.match(pg.discoveryMessage(rpcErr), /error \(method not found: tools\/list\)/);

  for (const body of ['<html>captive portal</html>', '{"not":"a list"}', '[]', 'null', '']) {
    const d = await pg.createClient({ base: BASE, fetch: mockFetch(() => ({ body })) }).discover(PINNED);
    assert.equal(d.mode, 'fixture', body);
    assert.ok(['parse', 'http', 'rpc'].includes(d.reason), `${body}: ${d.reason}`);
    assert.equal(d.tools, PINNED);
  }
});

test('the client: a timeout, an oversized reply, a GET 429 and error bodies that are shown', async () => {
  const hang = pg.createClient({ base: BASE, timeoutMs: 20, fetch: (url, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' })))) });
  await assert.rejects(hang.get('/status'), { kind: 'timeout' });
  assert.match(pg.friendlyError(new pg.PgError('timeout', 'x')), /No answer within 8 s/);
  const big = pg.createClient({ base: BASE, maxChars: 100, fetch: mockFetch(() => ({ body: 'x'.repeat(500) })) });
  await assert.rejects(big.get('/status'), { kind: 'size' });
  assert.match(pg.friendlyError(new pg.PgError('size', 'x')), /larger than this page reads/);
  const limited = pg.createClient({ base: BASE, fetch: mockFetch(() => ({ status: 429, body: { error: 'slow down: per-IP read limit', network: 'devnet' } })) });
  await assert.rejects(limited.get('/status'), { kind: 'rate' });
  await assert.rejects(limited.runRoute(pg.REST_ROUTES[0]), { kind: 'rate' });
  assert.match(pg.friendlyError(new pg.PgError('rate', 'x')), /Try again in about a minute/);
  // 4xx and 5xx bodies come back as results, with their JSON.
  const notFound = pg.createClient({ base: BASE, fetch: mockFetch(() => ({ status: 404, body: { error: 'block not found', network: 'devnet' } })) });
  assert.deepEqual(await notFound.get('/block/999').then(({ status, ok, json }) => ({ status, ok, json })), { status: 404, ok: false, json: { error: 'block not found', network: 'devnet' } });
  const rr = await notFound.runRoute(pg.REST_ROUTES.find((r) => r.id === 'raw-block'), { height: '999' });
  assert.deepEqual([rr.ok, rr.status, rr.built.path], [false, 404, '/raw/block/999']);
  await assert.rejects(notFound.runRoute(pg.REST_ROUTES.find((r) => r.id === 'raw-block'), { height: 'x' }), { kind: 'refused' });
  // A tool that returns isError over MCP is shown as an error result, with its JSON.
  const errTool = pg.createClient({ base: BASE, fetch: mockFetch((c) => ({ body: rpcOk(c.body.id, callResult({ error: 'block not found', network: 'devnet' }, true)) })) });
  const e = await errTool.run(byName('chain_read_block'), { height: 99999 });
  assert.deepEqual([e.via, e.isError, e.json.error], ['mcp', true, 'block not found']);
  // An MCP call that dies mid-way over the network is retried through the GET twin only if the devnet still answers GET.
  let n = 0;
  const flaky = pg.createClient({ base: BASE, fetch: mockFetch((c) => (c.path === '/mcp' && c.body.method === 'tools/call' ? corsBlocked() : c.path === '/mcp' ? { body: rpcOk(c.body.id, { tools: fixture.tools }) } : (n += 1, { body: { ok: true, path: c.path } }))) });
  await flaky.discover(PINNED);
  const viaTwin = await flaky.run(byName('chain_status'), {});
  assert.deepEqual([viaTwin.via, flaky.transport], ['rest', 'rest']);
});

test('run never calls a tool that posts: refused before any request, however it is asked', async () => {
  const f = liveDevnet();
  const client = pg.createClient({ base: BASE, fetch: f });
  await client.discover(PINNED);
  const before = f.calls.length;
  for (const t of PINNED.filter((x) => pg.classifyTool(x).kind !== 'read')) await assert.rejects(client.run(t, { bot: 'my-bot', title: 't' }), { kind: 'refused' }, t.name);
  await assert.rejects(client.run({ name: 'chain_post', description: 'a reader', annotations: { readOnlyHint: true } }, {}), { kind: 'refused' });
  await assert.rejects(client.run({ ...byName('chain_status'), name: 'chain_checkin' }, {}), { kind: 'refused' });
  await assert.rejects(client.run(null, {}), { kind: 'refused' });
  assert.equal(f.calls.length, before, 'no request was made for any of them');
  // The only methods this module ever sends over MCP are these.
  assert.deepEqual([...new Set(f.calls.map((c) => c.body && c.body.method))].filter(Boolean), ['tools/list']);
  for (const name of pg.READ_TOOLS) await client.run(byName(name), pg.snippetArgs(fieldsOf(name).fields, {}));
  assert.deepEqual([...new Set(f.calls.slice(before).map((c) => c.body.params.name))].sort(), [...pg.READ_TOOLS].sort());
});

test('describeCall, formatResult and summarizeStatus', () => {
  assert.deepEqual(pg.describeCall(callResult({ a: 1 })), { isError: false, json: { a: 1 }, text: '{"a":1}' });
  assert.deepEqual(pg.describeCall({ content: [{ type: 'text', text: '{"b":2}' }] }), { isError: false, json: { b: 2 }, text: '{"b":2}' });
  assert.deepEqual(pg.describeCall({ content: [{ type: 'text', text: 'plain' }], isError: true }), { isError: true, json: undefined, text: 'plain' });
  assert.throws(() => pg.describeCall(null), { kind: 'parse' });
  const f = pg.formatResult({ a: 'x'.repeat(100) }, 50);
  assert.deepEqual([f.truncated, f.shown.length, f.total > 100], [true, 50, true]);
  assert.equal(pg.formatResult('plain').text, 'plain');
  assert.ok(!hasInvisible(pg.formatResult(`a${CTRL(0x202e)}b${CTRL(0)}c`).text));
  const h = 'a'.repeat(64);
  const s = pg.summarizeStatus({ chain_id: 'pointcast-devnet-2', height: 7, genesis_hash: h, house: 'tz1bLEsiTQ2vQx8znZnuahFfKEf98xicMX35', may_reset: true }, h);
  assert.deepEqual([s.chainId, s.height, s.genesis, s.genesis12, s.mayReset], ['pointcast-devnet-2', 7, 'match', 'a'.repeat(12), true]);
  assert.equal(pg.summarizeStatus({ genesis_hash: h }, 'b'.repeat(64)).genesis, 'changed');
  assert.equal(pg.summarizeStatus({ genesis_hash: h }, '').genesis, 'unpinned');
  assert.equal(pg.summarizeStatus({}, h).genesis, 'unknown');
  assert.equal(pg.summarizeStatus({ house: '<img src=x>' }).house, '');
  assert.equal(pg.summarizeStatus(null), null);
});

// ---------------------------------------------------------------- the page script in jsdom

/** The server-rendered hooks the script looks for, as a skeleton of the page. */
function skeleton({ dataApi = DEVNET.url } = {}) {
  const routes = pg.REST_ROUTES.map((r) => {
    const fields = r.params.map((p) => `<div class="pg-field"><label for="pg-route-${r.id}-${p.name}">${p.label}</label><input id="pg-route-${r.id}-${p.name}" class="pg-input" type="text" value="${p.example}" data-pg-input="${p.name}" /><p class="pg-err" data-pg-err="${p.name}"></p></div>`).join('');
    return `<li class="pg-route" data-route="${r.id}"><p class="pg-route__path"><code>GET ${r.path}</code></p><div class="pg-route__try">${fields}<button type="button" class="btn" data-pg-try hidden>Try</button></div><p class="pg-curl"><code data-pg-curl>curl</code></p></li>`;
  }).join('');
  return `<!doctype html><html><body>
  <div class="chn pg" data-pg data-state="static" data-api="${dataApi}" data-genesis="${DEVNET.genesis}" data-tools-url="/chain/apps/playground-tools.json" data-pinned-at="2026-10-19">
    <p data-honesty>x <a href="${data.HONESTY.path}">${data.HONESTY.path}</a>.</p>
    <p data-pg-override hidden></p><p data-pg-status>static</p><p data-pg-chain></p>
    <span data-pg-filter hidden><button type="button" data-pg-show="all" aria-pressed="true">All</button><button type="button" data-pg-show="read" aria-pressed="false">Read-only</button><button type="button" data-pg-show="write" aria-pressed="false">Posts</button></span>
    <button type="button" data-pg-retry hidden>Read tools/list again</button>
    <ol data-pg-tools><li class="pg-tool pg-tool--static">static</li></ol>
    <ol class="pg-routes">${routes}</ol>
    <template id="pg-tpl-writes"><p class="pg-writes"><b>No Run.</b> ${data.WRITES.lead} <a href="${data.WRITES.path}">${data.WRITES.path}</a>.</p></template>
    <template id="pg-tpl-unknown"><p class="pg-writes"><b>No Run.</b> ${data.UNKNOWN_LINE} ${data.WRITES.lead} <a href="${data.WRITES.path}">${data.WRITES.path}</a>.</p></template>
  </div></body></html>`;
}

const waitFor = async (fn, what, ms = 2000) => {
  const end = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() > end) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 5));
  }
};

/**
 * Run the page's own <script> in a jsdom window. `fetch` is the mock; the
 * import line is replaced by the module's exports.
 */
async function openPage({ fetch, search = '', dataApi, clipboard, beforeLoad = false, hidden = false, io } = {}) {
  const dom = new JSDOM(skeleton({ dataApi }), { url: `https://pointcast.xyz/chain/playground${search}`, pretendToBeVisual: true });
  const { window } = dom;
  window.fetch = fetch;
  window.requestIdleCallback = (fn) => fn();
  if (io) window.IntersectionObserver = io;
  if (clipboard) Object.defineProperty(window.navigator, 'clipboard', { value: clipboard, configurable: true });
  const body = PAGE_SCRIPT.replace(/import \{([\s\S]*?)\} from '[^']*playground\.js';/, 'const {$1} = __pg;');
  assert.ok(body.includes('= __pg;'), 'the import line was found');
  if (hidden) Object.defineProperty(window.document, 'visibilityState', { value: 'hidden', configurable: true });
  if (!beforeLoad) await new Promise((r) => (window.document.readyState === 'complete' ? r() : window.addEventListener('load', r)));
  const run = new Function('window', 'document', 'navigator', 'Event', 'URLSearchParams', '__pg', body);
  run(window, window.document, window.navigator, window.Event, window.URLSearchParams, pg);
  const doc = window.document;
  const rootEl = doc.querySelector('[data-pg]');
  return {
    dom,
    window,
    doc,
    root: rootEl,
    status: () => doc.querySelector('[data-pg-status]').textContent,
    cards: () => [...doc.querySelectorAll('[data-pg-tools] > li.pg-tool')],
    card: (name) => doc.getElementById(`tool-${name}`),
    open(name) {
      const li = doc.getElementById(`tool-${name}`);
      const d = li.querySelector('details');
      d.open = true;
      d.dispatchEvent(new window.Event('toggle'));
      return li;
    },
    async ready(ms = 2000) {
      await waitFor(() => rootEl.dataset.state !== 'static' && rootEl.dataset.state !== 'loading' && doc.querySelector('[data-pg-tools]').dataset.live === 'yes', 'the tool list', ms);
      await new Promise((r) => setTimeout(r, 15));
    },
    type(el, value) {
      el.value = value;
      el.dispatchEvent(new window.Event('input', { bubbles: true }));
    },
    settle(el) {
      el.dispatchEvent(new window.Event('change', { bubbles: true }));
    },
    submit(li) {
      li.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    },
  };
}

const pinnedRoute = (c) => (c.path === '/chain/apps/playground-tools.json' ? { body: fixtureRaw } : undefined);
const withPinned = (inner) => (c) => pinnedRoute(c) ?? inner(c);

test('page script: nothing is read before the load event; then one pinned-list read, one tools/list and one /status', async () => {
  const f = liveDevnet(fixture.tools, pinnedRoute);
  const early = await openPage({ fetch: f, beforeLoad: true });
  assert.notEqual(early.doc.readyState, 'complete', 'the script ran while the page was still loading');
  assert.equal(f.calls.length, 0, 'no request before load');
  await early.ready();
  assert.deepEqual(f.calls.map((c) => `${c.method} ${new URL(c.url, 'https://pointcast.xyz').pathname}`), ['GET /chain/apps/playground-tools.json', 'POST /mcp', 'GET /status']);
  assert.equal(early.root.dataset.state, 'live');
  // A hidden tab reads nothing until it is shown.
  const g = liveDevnet(fixture.tools, pinnedRoute);
  const hidden = await openPage({ fetch: g, hidden: true });
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(g.calls.length, 0, 'no request while the tab is hidden');
  Object.defineProperty(hidden.doc, 'visibilityState', { value: 'visible', configurable: true });
  hidden.doc.dispatchEvent(new hidden.window.Event('visibilitychange'));
  await hidden.ready();
  assert.equal(g.calls.filter((c) => c.path === '/mcp').length, 1);
});

test('page script: waits for the section to be near the viewport, and reads anyway if the window never says so', async () => {
  const observed = [];
  let fire;
  class FakeIO {
    constructor(cb) {
      fire = cb;
    }
    observe(el) {
      observed.push(el);
    }
  }
  const f = liveDevnet(fixture.tools, pinnedRoute);
  const p = await openPage({ fetch: f, io: FakeIO });
  assert.equal(observed.length, 1, 'the page root is observed');
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(f.calls.length, 0, 'not near the viewport yet: nothing is read');
  fire([{ isIntersecting: false }]);
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(f.calls.length, 0, 'still not near');
  fire([{ isIntersecting: true }]);
  await p.ready();
  assert.equal(f.calls.filter((c) => c.path === '/mcp').length, 1);
  // A window that never reports anything (a pane that is not rendering): the read starts after a moment.
  const g = liveDevnet(fixture.tools, pinnedRoute);
  const q = await openPage({ fetch: g, io: class { observe() {} } });
  assert.equal(g.calls.length, 0);
  await q.ready(4500);
  assert.equal(g.calls.filter((c) => c.path === '/mcp').length, 1, 'read after the fallback');
  assert.match(PAGE_SCRIPT, /const NEAR_FALLBACK_MS = 2500;/);
});

test('page script, live MCP: a card per tool, Run only on readers, a new tool is a writer, a changed one is marked', async () => {
  const live = fixture.tools.map((t) => (t.name === 'chain_status' ? { ...t, description: `${t.description} Changed.` } : t));
  live.push({ name: 'chain_mystery', description: 'Does something unknown.', inputSchema: { type: 'object', properties: { q: { type: 'string', maxLength: 5 } }, required: ['q'] }, annotations: { readOnlyHint: true } });
  const f = liveDevnet(live, pinnedRoute);
  const p = await openPage({ fetch: f });
  await p.ready();
  assert.equal(p.cards().length, 22);
  assert.match(p.status(), /tools\/list read from the devnet just now: 22 tools/);
  assert.match(p.status(), /1 new \(chain_mystery\)/);
  assert.match(p.status(), /1 changed \(chain_status\)/);
  assert.equal(p.root.dataset.transport, 'mcp');
  assert.equal(p.doc.querySelector('[data-pg-retry]').hidden, true, 'no retry when the read worked');
  assert.equal(p.doc.querySelector('[data-pg-filter]').hidden, false);
  for (const t of pg.parseToolsList({ result: { tools: live } }).tools) {
    const li = p.open(t.name);
    const kind = pg.classifyTool(t).kind;
    const run = li.querySelector('button[type="submit"]');
    assert.equal(!!run, kind === 'read', `${t.name}: Run only on a reader`);
    if (kind === 'read') assert.equal(run.textContent, `Run ${t.name}`);
    else {
      assert.ok(li.querySelector('.pg-writes'), `${t.name}: the plain line`);
      assert.match(li.querySelector('.pg-writes').textContent, /This posts to a public chain; use your own bot or key; see \/chain\/bots\./);
      assert.equal(li.querySelector('.pg-writes a').getAttribute('href'), '/chain/bots');
    }
    assert.ok(li.querySelector('.pg-snip pre code').textContent.startsWith('curl -s'), `${t.name}: curl`);
    assert.equal(li.querySelectorAll('.pg-snip pre code')[1].textContent.split('\n').length, 10, `${t.name}: ten-line Node`);
    assert.equal(li.dataset.kind, kind === 'read' ? 'read' : 'write');
  }
  // The unknown tool says why, and still gets a form and snippets.
  const mystery = p.card('chain_mystery');
  assert.match(mystery.textContent, /does not know this tool/);
  assert.ok(mystery.querySelector('input[type="text"]'));
  assert.match(mystery.querySelector('summary').textContent, /new since the pinned list/);
  assert.match(p.card('chain_status').querySelector('summary').textContent, /changed since the pinned list/);
  // Filter chips.
  p.doc.querySelector('[data-pg-show="read"]').click();
  assert.equal(p.cards().filter((li) => !li.hidden).length, 12);
  assert.equal(p.doc.querySelector('[data-pg-show="read"]').getAttribute('aria-pressed'), 'true');
  p.doc.querySelector('[data-pg-show="write"]').click();
  assert.equal(p.cards().filter((li) => !li.hidden).length, 10);
  p.doc.querySelector('[data-pg-show="all"]').click();
  assert.equal(p.cards().filter((li) => !li.hidden).length, 22);
  // Nothing posts: across all of the above, no tools/call was sent.
  assert.deepEqual(f.calls.filter((c) => c.body && c.body.method === 'tools/call'), []);
});

test('page script: a #tool-<name> link opens that tool\u2019s card', async () => {
  const f = liveDevnet(fixture.tools, pinnedRoute);
  const p = await openPage({ fetch: f, search: '#tool-chain_read_block' });
  await p.ready();
  const li = p.card('chain_read_block');
  assert.equal(li.querySelector('details').open, true);
  assert.ok(li.querySelector('.pg-body'), 'built');
  assert.equal(p.card('chain_status').querySelector('details').open, false, 'the default first card stays closed when a link names another');
  assert.match(page, /id=\{`tool-\$\{t\.name\}`\} data-kind=\{kinds\[i\]\}/, 'the pinned list carries the same anchors before the script runs');
});

test('page script: forms are built from the schema, validated, and Run calls tools/call', async () => {
  const f = liveDevnet(fixture.tools, pinnedRoute);
  const p = await openPage({ fetch: f });
  await p.ready();
  const li = p.open('chain_feed');
  const inputs = [...li.querySelectorAll('.pg-field')];
  assert.deepEqual(inputs.map((x) => x.querySelector('.pg-fname').textContent), ['limit', 'before', 'channel']);
  const limit = li.querySelector('input[name="limit"]');
  assert.equal(limit.getAttribute('inputmode'), 'numeric');
  assert.equal(limit.getAttribute('placeholder'), '10', 'the default is the placeholder');
  assert.match(li.textContent, /1 to 50 · whole number/);
  assert.ok(li.querySelector(`label[for="${limit.id}"]`), 'a visible label');
  assert.ok(limit.getAttribute('aria-describedby').split(' ').every((id) => p.doc.getElementById(id)), 'its hint and error exist');
  // Invalid: nothing is sent, the field is marked, the message is plain, focus goes to the first bad field.
  p.type(limit, '99');
  p.submit(li);
  assert.match(li.querySelector('.pg-err').textContent, /limit: 50 or less/);
  assert.equal(limit.getAttribute('aria-invalid'), 'true');
  assert.match(li.querySelector('.pg-run').textContent, /^1 field needs attention before this can run\.$/);
  assert.equal(f.calls.filter((c) => c.body && c.body.method === 'tools/call').length, 0);
  assert.equal(p.doc.activeElement, limit);
  // The snippet follows the form while typing.
  p.type(limit, '3');
  p.type(li.querySelector('input[name="channel"]'), 'BOT');
  const [curl, node] = li.querySelectorAll('.pg-snip pre code');
  assert.match(curl.textContent, /"arguments":\{"limit":3,"channel":"BOT"\}/);
  assert.match(node.textContent, /arguments: \{"limit":3,"channel":"BOT"\}/);
  assert.equal(limit.getAttribute('aria-invalid'), null, 'fixing the value clears the mark');
  // Valid: one tools/call over MCP, the result is JSON in a collapsible box with Copy.
  p.submit(li);
  await waitFor(() => !li.querySelector('.pg-out').hidden, 'the result');
  const call = f.calls.find((c) => c.body && c.body.method === 'tools/call');
  assert.deepEqual(call.body.params, { name: 'chain_feed', arguments: { limit: 3, channel: 'BOT' } });
  assert.match(li.querySelector('.pg-out__line').textContent, /^OK · tools\/call over MCP · \d+ ms$/);
  assert.deepEqual(JSON.parse(li.querySelector('.pg-json pre code').textContent), { called: 'chain_feed', args: { limit: 3, channel: 'BOT' } });
  assert.equal(li.querySelector('.pg-json').tagName, 'DETAILS');
  assert.ok(li.querySelector('.pg-json .pg-copy'));
  assert.equal(li.querySelector('.pg-out__line').getAttribute('aria-live'), 'polite');
  assert.equal(li.querySelector('button[type="submit"]').disabled, false);
  // A tool with no arguments says so, and Run works with an empty form.
  const st = p.open('chain_status');
  assert.match(st.textContent, /takes no arguments/);
  p.submit(st);
  await waitFor(() => !st.querySelector('.pg-out').hidden, 'the status result');
  // Selects, lists and JSON boxes have the right controls; a required select starts on a real value.
  const cc = p.open('chain_crosscheck');
  assert.equal(cc.querySelector('select[name="result"]').value, 'match');
  assert.equal(cc.querySelector('select[name="result"]').querySelectorAll('option').length, 2, 'required: no empty option');
  const post = p.open('chain_post');
  assert.equal(post.querySelector('select[name="channel"]').value, 'BOT');
  assert.equal(post.querySelector('textarea[name="body"]').rows, 4);
  assert.ok(post.querySelector('input[name="bot"][aria-required="true"]'));
  const review = p.open('chain_review');
  assert.match(review.querySelector('textarea[name="items"]').getAttribute('placeholder'), /"rating": "good"/);
  assert.equal(p.open('chain_digest').querySelector('textarea[name="cites"]').rows, 5);
});

test('page script, write tools: no Run, no request, a snippet that follows the form, a placeholder note', async () => {
  const f = liveDevnet(fixture.tools, pinnedRoute);
  const p = await openPage({ fetch: f });
  await p.ready();
  const li = p.open('chain_post');
  assert.equal(li.querySelector('button[type="submit"]'), null);
  assert.equal([...li.querySelectorAll('button')].filter((b) => /run/i.test(b.textContent)).length, 0);
  const [curl] = li.querySelectorAll('.pg-snip pre code');
  assert.match(curl.textContent, /"name":"chain_post"/);
  assert.match(curl.textContent, /"bot":"my-bot","title":"<title>"/, 'required fields hold examples');
  assert.equal(li.querySelector('.pg-snips .fine').hidden, false, 'the placeholder note shows');
  p.type(li.querySelector('input[name="bot"]'), 'my-own-bot');
  p.type(li.querySelector('input[name="title"]'), `it's a "title"`);
  assert.match(curl.textContent, /"bot":"my-own-bot","title":"it'\\''s a \\"title\\""/);
  assert.equal(li.querySelector('.pg-snips .fine').hidden, true);
  // Submitting a write form (Enter in a field) does nothing at all, and the page does not navigate.
  const ev = new p.window.Event('submit', { bubbles: true, cancelable: true });
  li.querySelector('form').dispatchEvent(ev);
  assert.equal(ev.defaultPrevented, true, 'implicit submission is swallowed');
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(f.calls.filter((c) => c.body && c.body.method === 'tools/call').length, 0);
  // A write tool has no GET twin box.
  assert.equal(li.querySelector('.pg-getbox').hidden, true);
  // A reader has one, and it follows the form.
  const feed = p.open('chain_feed');
  assert.equal(feed.querySelector('.pg-getbox').hidden, false);
  p.type(feed.querySelector('input[name="limit"]'), '4');
  assert.equal(feed.querySelectorAll('.pg-snip pre code')[2].textContent, `curl -s '${DEVNET.url}/feed?limit=4'`);
});

test('page script, CORS-blocked /mcp: says so, shows the pinned list, runs readers through GET and names the route', async () => {
  const f = blockedDevnet(pinnedRoute);
  const p = await openPage({ fetch: f });
  await p.ready();
  assert.equal(p.root.dataset.state, 'rest');
  assert.equal(p.root.dataset.transport, 'rest');
  assert.match(p.status(), /This browser cannot read \/mcp/);
  assert.match(p.status(), /21 tools pinned from a local run of the devnet Worker, captured 2026-10-19/);
  assert.equal(p.cards().length, 21);
  assert.equal(p.doc.querySelector('[data-pg-retry]').hidden, false, 'a retry button');
  const li = p.open('chain_feed');
  p.type(li.querySelector('input[name="limit"]'), '2');
  p.type(li.querySelector('input[name="channel"]'), 'BOT');
  p.submit(li);
  await waitFor(() => !li.querySelector('.pg-out').hidden, 'the GET result');
  const line = li.querySelector('.pg-out__line').textContent;
  assert.match(line, /GET \/feed\?limit=2 · HTTP 200 · \d+ ms · \/mcp is not readable from this browser/);
  assert.match(li.querySelector('.pg-out__notes').textContent, /Not sent: channel\. GET \/feed has no channel filter/);
  assert.deepEqual(f.calls.filter((c) => c.path === '/feed').map((c) => c.query), [{ limit: '2' }]);
  // The chain line and the pinned genesis.
  await waitFor(() => p.doc.querySelector('[data-pg-chain]').textContent, 'the chain line');
  assert.match(p.doc.querySelector('[data-pg-chain]').textContent, /pointcast-devnet-2 · height 5/);
});

test('page script: devnet unreachable and a 429, with a retry that reads live', async () => {
  const down = await openPage({ fetch: mockFetch((c) => pinnedRoute(c) ?? corsBlocked()) });
  await down.ready();
  assert.equal(down.root.dataset.state, 'down');
  assert.match(down.status(), /devnet unreachable/);
  assert.equal(cardsText(down).includes('chain_status'), true, 'the pinned list is still there');
  const li = down.open('chain_status');
  down.submit(li);
  await waitFor(() => !li.querySelector('.pg-out').hidden, 'the error');
  assert.match(li.querySelector('.pg-out__line').textContent, /devnet unreachable/);
  assert.equal(li.querySelector('.pg-out').dataset.bad, 'yes');

  let healthy = false;
  const g = mockFetch(async (c) => {
    const x = pinnedRoute(c);
    if (x) return x;
    if (c.path === '/mcp' && !healthy) return { status: 429, body: { jsonrpc: '2.0', id: null, error: { code: -32000, message: 'slow down: per-IP MCP limit' } } };
    if (c.path === '/mcp') return { body: rpcOk(c.body.id, { tools: fixture.tools }) };
    return { body: { chain_id: 'pointcast-devnet-2', height: 3 } };
  });
  const rate = await openPage({ fetch: g });
  await rate.ready();
  assert.match(rate.status(), /slow down \(HTTP 429\)/);
  const retry = rate.doc.querySelector('[data-pg-retry]');
  assert.equal(retry.hidden, false);
  healthy = true;
  retry.click();
  await waitFor(() => /read from the devnet just now/.test(rate.status()), 'the live list after retry');
  assert.equal(rate.root.dataset.state, 'live');
  assert.equal(retry.hidden, true);
});
const cardsText = (p) => p.cards().map((li) => li.textContent).join(' ');

test('page script, REST routes: Try, inputs checked before anything is sent, errors and 429 shown, the account example from /status', async () => {
  const house = 'tz1bLEsiTQ2vQx8znZnuahFfKEf98xicMX35';
  let mode = 'ok';
  const f = mockFetch((c) => {
    const x = pinnedRoute(c);
    if (x) return x;
    if (c.path === '/mcp') return corsBlocked();
    if (c.path === '/status') return { body: { chain_id: 'pointcast-devnet-2', height: 8, genesis_hash: DEVNET.genesis, house } };
    if (mode === '429') return { status: 429, body: { error: 'slow down: per-IP read limit', network: 'devnet' } };
    if (c.path === '/raw/block/404') return { status: 404, body: { error: 'block not found', network: 'devnet' } };
    return { body: { route: c.path, q: c.query } };
  });
  const p = await openPage({ fetch: f });
  await p.ready();
  await waitFor(() => p.doc.querySelector('[data-route="account"] input').value, 'the account example');
  assert.equal(p.doc.querySelector('[data-route="account"] input').value, house);
  assert.match(p.doc.querySelector('[data-pg-chain]').textContent, /matches the genesis this page pins/);
  const route = (id) => p.doc.querySelector(`[data-route="${id}"]`);
  for (const li of p.doc.querySelectorAll('.pg-route')) assert.equal(li.querySelector('[data-pg-try]').hidden, false, `${li.dataset.route}: Try is shown`);
  // No input: one GET, with the small default query.
  route('raw-blocks').querySelector('[data-pg-try]').click();
  await waitFor(() => !route('raw-blocks').querySelector('.pg-out').hidden && /OK/.test(route('raw-blocks').querySelector('.pg-out__line').textContent), 'raw blocks');
  assert.deepEqual(f.calls.filter((c) => c.path === '/raw/blocks').map((c) => c.query), [{ from: '1', limit: '3' }]);
  assert.match(route('raw-blocks').querySelector('.pg-out__line').textContent, /^OK · GET \/raw\/blocks\?from=1&limit=3 · HTTP 200/);
  // A bad value never leaves the page.
  const rb = route('raw-block');
  p.type(rb.querySelector('input'), 'not-a-number');
  assert.match(rb.querySelector('[data-curl], [data-pg-curl]').textContent, /raw\/block\/\{height\}/);
  rb.querySelector('[data-pg-try]').click();
  assert.match(rb.querySelector('.pg-err').textContent, /height: a whole number, 1 or more/);
  assert.equal(f.calls.filter((c) => c.path.startsWith('/raw/block/')).length, 0);
  assert.equal(p.doc.activeElement, rb.querySelector('input'));
  // A good value, the curl line follows it.
  p.type(rb.querySelector('input'), '5');
  assert.match(rb.querySelector('[data-pg-curl]').textContent, /\/raw\/block\/5'$/);
  rb.querySelector('[data-pg-try]').click();
  await waitFor(() => /OK/.test(rb.querySelector('.pg-out__line').textContent), 'block 5');
  assert.deepEqual(JSON.parse(rb.querySelector('.pg-json pre code').textContent), { route: '/raw/block/5', q: {} });
  // A 404 body is shown as an error result.
  p.type(rb.querySelector('input'), '404');
  rb.querySelector('[data-pg-try]').click();
  await waitFor(() => /error/.test(rb.querySelector('.pg-out__line').textContent), 'the 404');
  assert.match(rb.querySelector('.pg-out__line').textContent, /answered with an error · GET \/raw\/block\/404 · HTTP 404/);
  assert.equal(rb.querySelector('.pg-out').dataset.bad, 'yes');
  assert.match(rb.querySelector('.pg-json pre code').textContent, /block not found/);
  // 429.
  mode = '429';
  route('daily').querySelector('[data-pg-try]').click();
  await waitFor(() => /slow down/.test(route('daily').querySelector('.pg-out__line').textContent), 'the 429');
  assert.match(route('daily').querySelector('.pg-out__line').textContent, /slow down \(HTTP 429\)/);
  assert.equal(route('daily').querySelector('[data-pg-try]').disabled, false, 'Try is usable again');
  // Enter in a route\u2019s input is Try.
  const enterBefore = f.calls.filter((c) => c.path === '/station/GDN').length;
  const stationInput = route('station').querySelector('input');
  const enter = new p.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
  stationInput.dispatchEvent(enter);
  assert.equal(enter.defaultPrevented, true);
  await waitFor(() => f.calls.filter((c) => c.path === '/station/GDN').length === enterBefore + 1, 'Enter to try the station route');
  // The account route refuses a path that is not an address.
  const acc = route('account');
  p.type(acc.querySelector('input'), `${house}/controllers`);
  const before = f.calls.length;
  acc.querySelector('[data-pg-try]').click();
  assert.match(acc.querySelector('.pg-err').textContent, /address: an address/);
  assert.equal(f.calls.length, before);
});

test('page script: ?devnet= reads a local devnet; any other value is ignored and said so', async () => {
  const local = blockedDevnet(pinnedRoute);
  const a = await openPage({ fetch: local, search: '?devnet=http://127.0.0.1:8799' });
  await a.ready();
  assert.ok(local.calls.filter((c) => !c.path.startsWith('/chain/')).every((c) => c.url.startsWith('http://127.0.0.1:8799/')));
  assert.equal(a.doc.querySelector('[data-pg-override]').hidden, false);
  assert.match(a.doc.querySelector('[data-pg-override]').textContent, /Reading a local devnet at http:\/\/127\.0\.0\.1:8799\./);
  assert.match(a.card('chain_status').querySelector('summary').textContent, /chain_status/);
  const li = a.open('chain_feed');
  assert.match(li.querySelector('.pg-snip pre code').textContent, /^curl -s 'http:\/\/127\.0\.0\.1:8799\/mcp'/);
  // With an override there is no pinned genesis to compare.
  await waitFor(() => a.doc.querySelector('[data-pg-chain]').textContent, 'chain line');
  assert.doesNotMatch(a.doc.querySelector('[data-pg-chain]').textContent, /GENESIS CHANGED|matches the genesis/);

  for (const search of ['?devnet=https://evil.example', '?devnet=http://127.0.0.1.evil.example:8799', `?devnet=${encodeURIComponent('http://localhost@evil.example')}`]) {
    const f = blockedDevnet(pinnedRoute);
    const b = await openPage({ fetch: f, search });
    await b.ready();
    assert.ok(f.calls.filter((c) => !c.path.startsWith('/chain/')).every((c) => c.url.startsWith(`${DEVNET.url}/`)), search);
    assert.match(b.doc.querySelector('[data-pg-override]').textContent, /^Ignored \?devnet=/);
    assert.match(b.doc.querySelector('[data-pg-override]').textContent, /Reading the public devnet\.$/);
  }
  const plain = await openPage({ fetch: blockedDevnet(pinnedRoute) });
  await plain.ready();
  assert.equal(plain.doc.querySelector('[data-pg-override]').hidden, true);
});

test('page script: a changed genesis is said out loud, with the recording', async () => {
  const f = mockFetch((c) => pinnedRoute(c) ?? (c.path === '/mcp' ? corsBlocked() : { body: { chain_id: 'pointcast-devnet-3', height: 2, genesis_hash: 'c'.repeat(64) } }));
  const p = await openPage({ fetch: f });
  await p.ready();
  await waitFor(() => p.doc.querySelector('[data-pg-chain]').textContent, 'the chain line');
  const t = p.doc.querySelector('[data-pg-chain]').textContent;
  assert.match(t, /GENESIS CHANGED/);
  assert.match(t, /\/chain\/yard\/devnet-1\//);
  assert.equal(p.doc.querySelector('[data-pg-chain]').dataset.genesis, 'changed');
});

test('page script: results are copied whole, and a large result is cut for display only', async () => {
  const copied = [];
  const big = { rows: Array.from({ length: 6000 }, (_, i) => ({ i, pad: 'xxxxxxxxxx' })) };
  const f = mockFetch((c) => pinnedRoute(c) ?? (c.path === '/mcp' ? corsBlocked() : c.path === '/status' ? { body: { chain_id: 'x' } } : { body: big }));
  const p = await openPage({ fetch: f, clipboard: { writeText: async (t) => void copied.push(t) } });
  await p.ready();
  const li = p.doc.querySelector('[data-route="net"]');
  li.querySelector('[data-pg-try]').click();
  await waitFor(() => /OK/.test(li.querySelector('.pg-out__line').textContent), 'the big result');
  const shown = li.querySelector('.pg-json pre code').textContent;
  assert.equal(shown.length, pg.DISPLAY_CHARS);
  assert.match(li.querySelector('.pg-out .fine').textContent, /Showing the first 60,000 of [\d,]+ characters\. Copy takes all of it\./);
  const btn = li.querySelector('.pg-json .pg-copy');
  btn.click();
  await waitFor(() => copied.length === 1, 'the copy');
  assert.deepEqual(JSON.parse(copied[0]), big, 'Copy takes the whole result');
  await waitFor(() => btn.textContent === 'Copied', 'the label');
  // A snippet's Copy button copies the snippet's text.
  const sli = p.open('chain_status');
  sli.querySelector('.pg-snip .pg-copy').click();
  await waitFor(() => copied.length === 2, 'the snippet copy');
  assert.equal(copied[1], sli.querySelector('.pg-snip pre code').textContent);
});

test('page script: a hostile tools/list and hostile results stay text (no element, no attribute, no link)', async () => {
  const evil = '<img src=x onerror="window.__pwned=1"><script>window.__pwned=2</script>';
  const live = [
    { name: 'chain_status', description: evil, inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } },
    { name: 'chain_feed', description: evil, inputSchema: { type: 'object', properties: { [evil]: { type: 'string', description: evil, default: evil, pattern: evil }, [`a b" onfocus="x`]: { type: 'string', enum: [evil, `"><svg onload=1>`] } }, required: [evil] }, annotations: { readOnlyHint: true } },
    { name: 'chain_post', description: evil, title: evil, inputSchema: { type: 'object', properties: { x: { type: 'array', items: { type: 'string', enum: [evil] } } } } },
    { name: 'chain_checkin', description: `${CTRL(0x202e)}reversed`, inputSchema: { type: 'object', properties: { bot: { type: 'string', description: `<a href="javascript:alert(1)">x</a>` } } } },
  ];
  const f = mockFetch((c) => {
    const x = pinnedRoute(c);
    if (x) return x;
    if (c.path === '/mcp' && c.body.method === 'tools/list') return { body: rpcOk(c.body.id, { tools: live }) };
    if (c.path === '/mcp') return { body: rpcOk(c.body.id, callResult({ note: evil, nested: { html: evil } })) };
    return { body: { chain_id: evil, height: 1, house: evil, note: evil } };
  });
  const p = await openPage({ fetch: f });
  await p.ready();
  for (const name of ['chain_status', 'chain_feed', 'chain_post', 'chain_checkin']) p.open(name);
  // Run the reader that returns markup.
  const st = p.card('chain_status');
  p.submit(st);
  await waitFor(() => !st.querySelector('.pg-out').hidden, 'the hostile result');
  assert.match(st.querySelector('.pg-json pre code').textContent, /<img src=x onerror/, 'it is shown, as text');
  assert.equal(st.querySelector('.pg-json pre code').children.length, 0);
  const area = p.card('chain_status').closest('ol');
  assert.equal(area.querySelectorAll('img,script,iframe,svg,object,embed,link,style,meta,base,[srcdoc]').length, 0, 'no element came from devnet text');
  // Every attribute in the tools area is one the page itself sets; no handler, no href, no src, no style.
  for (const el of p.root.querySelectorAll('*')) for (const a of el.attributes) {
    assert.ok(!/^on/i.test(a.name), `handler ${a.name} on <${el.tagName}>`);
    if (el.closest('template')) continue;
    assert.ok(!['src', 'srcdoc', 'style', 'formaction', 'action'].includes(a.name), `${a.name} on <${el.tagName.toLowerCase()}>`);
  }
  // The only links under the tools list are the two server-written ones, cloned from a template.
  const hrefs = [...area.querySelectorAll('a')].map((a) => a.getAttribute('href'));
  assert.ok(hrefs.every((h) => h === '/chain/bots'), JSON.stringify(hrefs));
  assert.equal(p.window.__pwned, undefined);
  assert.equal(p.doc.querySelector('[data-pg-chain]').children.length, 0);
  assert.equal(p.doc.querySelector('[data-pg-status]').children.length, 0);
  // The odd name could not be used as a selector or an id by accident: ids are the tool name and an index.
  for (const el of area.querySelectorAll('[id]')) assert.match(el.id, /^(tool-[a-z0-9_]+|pg-[a-z0-9_]+-\d+(-hint|-err)?)$/, el.id);
  // The bidi override is gone from the description.
  assert.ok(!p.card('chain_checkin').textContent.includes(CTRL(0x202e)));
  assert.ok(!p.root.textContent.includes(CTRL(0x202e)));
});

test('page script: an odd schema (oneOf, free-form) is one JSON box for the arguments, and still runs if it is a reader', async () => {
  const live = [
    { name: 'chain_status', description: 'Reads.', inputSchema: { oneOf: [{ type: 'object' }, { type: 'object' }] }, annotations: { readOnlyHint: true } },
    { name: 'chain_duties', description: 'Reads.', annotations: { readOnlyHint: true } },
  ];
  const f = liveDevnet(live, pinnedRoute);
  const p = await openPage({ fetch: f });
  await p.ready();
  const li = p.open('chain_status');
  const box = li.querySelector('textarea[name="arguments"]');
  assert.ok(box, 'one JSON box');
  p.type(box, '[1]');
  p.submit(li);
  assert.match(li.querySelector('.pg-err').textContent, /must be a JSON object/);
  p.type(box, '{"x":1}');
  p.submit(li);
  await waitFor(() => !li.querySelector('.pg-out').hidden, 'result');
  assert.deepEqual(f.calls.find((c) => c.body && c.body.method === 'tools/call').body.params, { name: 'chain_status', arguments: { x: 1 } });
  assert.match(p.open('chain_duties').textContent, /its input schema was missing or odd; the form takes raw JSON/);
});

// ---------------------------------------------------------------- source rules

/** Everything the DOM-safety rule forbids, found by reading a source. Empty = clean. */
function domSafetyProblems(src) {
  const body = code(src);
  const problems = [];
  const ban = [
    [/\binnerHTML\b|\bouterHTML\b/, 'innerHTML or outerHTML'],
    [/insertAdjacentHTML|document\.write|createContextualFragment|DOMParser|set:html/, 'a markup-parsing call'],
    [/\beval\s*\(|new Function\b|setTimeout\(\s*['"`]/, 'eval, new Function or a string timer'],
    [/\.(href|src|srcset|srcdoc|action|formAction)\s*=[^=]/, 'a link or source assignment'],
    [/\.style\s*=[^=]|style\.setProperty|\.cssText\s*=/, 'a style write'],
    [/\.on[a-z]+\s*=[^=]/, 'an on* handler property'],
  ];
  for (const [re, what] of ban) if (re.test(body)) problems.push(what);
  // setAttribute: only inside h() (checked against ATTR_OK below) or with a fixed aria name.
  for (const m of body.matchAll(/setAttribute\(\s*([^,)]+)/g)) {
    const arg = m[1].trim();
    if (arg === 'k') continue;
    if (!/^'aria-(?:invalid|pressed)'$/.test(arg)) problems.push(`setAttribute(${arg})`);
  }
  const allow = body.match(/const ATTR_OK = new Set\(\[([^\]]*)\]\)/);
  if (allow) for (const a of allow[1].match(/'[^']+'/g).map((s) => s.slice(1, -1))) if (/^(href|src|srcset|srcdoc|style|action|formaction|xlink:href|on.*)$/i.test(a)) problems.push(`ATTR_OK allows ${a}`);
  return problems;
}

test('nothing from the devnet becomes markup, an href, a src or a style: the rule, and a mutation that proves it bites', () => {
  assert.deepEqual(domSafetyProblems(PAGE_SCRIPT), []);
  assert.deepEqual(domSafetyProblems(lib), []);
  // Text goes in with textContent, and the page's own builder is the only setAttribute with a variable name.
  assert.ok((code(PAGE_SCRIPT).match(/\.textContent = /g) || []).length >= 20);
  assert.equal((code(PAGE_SCRIPT).match(/node\.setAttribute\(k, /g) || []).length, 1);
  // The logic module has no DOM at all.
  assert.doesNotMatch(code(lib), /\b(document|window|navigator|localStorage|sessionStorage|location)\b/);
  assert.doesNotMatch(code(lib), /^import\s/m, 'no imports');

  // Mutation 1: one textContent that carries devnet text becomes innerHTML.
  const m1 = PAGE_SCRIPT.replace('statusEl.textContent = discoveryMessage(d, { pinnedAt });', 'statusEl.innerHTML = discoveryMessage(d, { pinnedAt });');
  assert.notEqual(m1, PAGE_SCRIPT, 'the line to mutate exists');
  assert.deepEqual(domSafetyProblems(m1), ['innerHTML or outerHTML']);
  // Mutation 2: the result box writes the result as markup.
  const m2 = PAGE_SCRIPT.replace('code.textContent = f.shown;', 'code.innerHTML = f.shown;');
  assert.notEqual(m2, PAGE_SCRIPT);
  assert.deepEqual(domSafetyProblems(m2), ['innerHTML or outerHTML']);
  // Mutation 3: the attribute allow-list lets href through, or a link is built from a tool name.
  assert.ok(domSafetyProblems(PAGE_SCRIPT.replace("'id', 'for',", "'id', 'href', 'for',")).includes('ATTR_OK allows href'));
  assert.ok(domSafetyProblems(`${PAGE_SCRIPT}\na.href = tool.name;`).includes('a link or source assignment'));
  assert.ok(domSafetyProblems(`${PAGE_SCRIPT}\nlink.setAttribute('href', tool.description);`).length > 0);
  assert.ok(domSafetyProblems(`${PAGE_SCRIPT}\nel.style = tool.name;`).length > 0);
  assert.ok(domSafetyProblems(`${PAGE_SCRIPT}\nel.onclick = fn;`).length > 0);
  assert.ok(domSafetyProblems(`${PAGE_SCRIPT}\neval(x);`).length > 0);
  assert.ok(domSafetyProblems(`${PAGE_SCRIPT}\ndocument.write(x);`).length > 0);
  assert.ok(domSafetyProblems(lib.replace('return value.slice(0, max).replace(BLOCK_INVISIBLE_RE', 'el.innerHTML = value.slice(0, max).replace(BLOCK_INVISIBLE_RE')).length > 0);
  // The page markup writes devnet values nowhere: every {expression} is a build-time constant.
  assert.doesNotMatch(page, /set:html|dangerouslySetInnerHTML/);
});

test('lazy: importing the module touches nothing, and every request in the page script sits inside a function', async () => {
  const realFetch = globalThis.fetch;
  let fetched = 0;
  globalThis.fetch = () => {
    fetched += 1;
    throw new Error('no fetch at import');
  };
  try {
    await import(`../public/chain/apps/playground.js?lazy=${Date.now()}`);
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(fetched, 0);
  const body = code(PAGE_SCRIPT);
  const calls = [...body.matchAll(/\bwindow\.fetch\s*\(/g)];
  assert.ok(calls.length >= 2);
  for (const { index } of calls) {
    const before = body.slice(0, index);
    assert.ok((before.match(/\{/g) || []).length - (before.match(/\}/g) || []).length > 0, `a fetch at ${index} sits at top level`);
  }
  for (const needle of ['requestIdleCallback', 'IntersectionObserver', "visibilityState === 'hidden'", "addEventListener('load'"]) assert.ok(PAGE_SCRIPT.includes(needle), needle);
  assert.equal((PAGE_SCRIPT.match(/<script/g) || []).length, 0);
  assert.equal((page.match(/<script>/g) || []).length, 1, 'one script on the page');
});

/** Banned words, as the brief lists them. A dollar sign counts as currency when a number follows it; ${...} and $VAR are code, not money. */
const BANNED = [
  [/\$\s?\d/, 'a dollar amount'],
  [/\bUSD\b/i, 'USD'],
  [/\bcash(?:ed|es|ing)?\b/i, 'cash'],
  [/\binvest/i, 'invest'],
  [/\bprofit/i, 'profit'],
  [/\bearn(?:s|ed|ing|ings)?\b/i, 'earn'],
  [/\bairdrop/i, 'airdrop'],
  [/\breal[- ]money\b/i, 'real money'],
  [/\byield/i, 'yield'],
  [/\bstak(?:e|es|ed|ing)\b/i, 'stake'],
  [/\bredeem/i, 'redeem'],
  [/\bbacked\b/i, 'backed'],
];
const bannedIn = (s) => BANNED.filter(([re]) => re.test(s)).map(([, w]) => w);

test('no banned words anywhere in the app’s files (and the checker catches each one)', () => {
  const files = { 'playground.js': lib, 'playground.astro': page, 'chain-app-playground.ts': dataSrc, 'playground-tools.json': fixtureRaw, 'capture script': captureScript, 'this test’s own copy': '' };
  for (const [name, src] of Object.entries(files)) assert.deepEqual(bannedIn(src), [], name);
  // The checker itself: each banned form is caught, the harmless look-alikes are not.
  for (const bad of ['costs $5', 'about $ 10', '12 USD', 'cash out', 'invest now', 'invested', 'a profit', 'profitable', 'earn tokens', 'earning', 'an airdrop', 'real money', 'real-money', 'high yield', 'yields', 'stake it', 'staking', 'redeem it', 'redeemed', 'is backed by', 'it was backed'])
    assert.ok(bannedIn(bad).length > 0, bad);
  for (const fine of ['${MCP}', '$XAI_API_KEY', 'learn more', 'search', 'bearing', 'cashier', 'stakeholder', 'backend', 'yarn'])
    assert.deepEqual(bannedIn(fine), [], fine);
  // The Daily Mint is a play auction in play ATTN, wherever it is named.
  for (const [name, src] of Object.entries(files)) assert.doesNotMatch(src, /Daily Mint[^.]{0,40}\b(sale|market|price)\b/i, name);
});

test('the honesty line: devnet-2, no value, may reset, dated and recorded, devnet-1 as precedent; on the page and in the method note', () => {
  const problems = (pageSrc, dataText) => {
    const out = [];
    if (!/\{HONESTY\.lead\} <a href=\{HONESTY\.path\}>\{HONESTY\.path\}<\/a>\./.test(pageSrc)) out.push('the page does not render the honesty line');
    if ((pageSrc.match(/\{HONESTY\.lead\}/g) || []).length < 2) out.push('the line is not repeated in the method note');
    if (!/data-honesty/.test(pageSrc)) out.push('no data-honesty hook');
    if (!/NO VALUE · MAY RESET, NEVER SILENTLY/.test(pageSrc)) out.push('the kicker does not say no value, may reset');
    for (const need of ['devnet-2', 'no value is promised', 'may reset', 'dated and recorded', 'never silent', 'devnet-1', '/chain/yard/devnet-1/']) if (!dataText.includes(need)) out.push(`the line lacks "${need}"`);
    if (!/A witness or a stamp is an accountable claim, not proof of truth\./.test(pageSrc)) out.push('the witness line is missing');
    return out;
  };
  const line = `${data.HONESTY.lead} ${data.HONESTY.path}.`;
  assert.equal(data.HONESTY_LINE, line);
  assert.deepEqual(problems(page, data.HONESTY_LINE), []);
  assert.equal(data.HONESTY.path, '/chain/yard/devnet-1/');
  // Mutations: take the line out of the page, the method note, the data, the kicker, the witness line.
  assert.ok(problems(page.replace('<b>Devnet.</b> {HONESTY.lead} <a href={HONESTY.path}>{HONESTY.path}</a>.', '<b>Devnet.</b>'), data.HONESTY_LINE).length > 0);
  assert.ok(problems(page.replace(/\{HONESTY\.lead\}( <a href=\{HONESTY\.path\}>\{HONESTY\.path\}<\/a>\. Filed by Claude Code)/, '$1'), data.HONESTY_LINE).length > 0);
  assert.ok(problems(page, data.HONESTY_LINE.replace('may reset', 'may change')).length > 0);
  assert.ok(problems(page, data.HONESTY_LINE.replace('dated and recorded', 'announced')).length > 0);
  assert.ok(problems(page, data.HONESTY_LINE.replace('/chain/yard/devnet-1/', '')).length > 0);
  assert.ok(problems(page.replace('NO VALUE · MAY RESET, NEVER SILENTLY', 'LIVE'), data.HONESTY_LINE).length > 0);
  assert.ok(problems(page.replace('A witness or a stamp is an accountable claim, not proof of truth.', ''), data.HONESTY_LINE).length > 0);
  // The writes line, verbatim, and where it comes from.
  assert.equal(data.WRITES_LINE, 'This posts to a public chain; use your own bot or key; see /chain/bots.');
  assert.match(page, /<template id="pg-tpl-writes">[\s\S]*\{WRITES\.lead\} <a href=\{WRITES\.path\}>\{WRITES\.path\}<\/a>\./);
  // Words the brief rules out as claims.
  for (const [name, src] of [['page', page], ['lib', lib], ['data', dataSrc]]) {
    assert.doesNotMatch(src, /\bverified\b/i, name);
    assert.doesNotMatch(src, /main\s*net|\bworth\b/i, name);
  }
  // If the site has been built, the built page says it too.
  const dist = new URL('dist/chain/playground/index.html', root);
  if (existsSync(dist)) {
    const text = readFileSync(dist, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
    assert.ok(text.includes(data.HONESTY.lead.replace(/\s+/g, ' ')), 'the built page carries the honesty line');
  }
});

test('the three setup blocks are /chain/bots’ own lines, character for character', () => {
  const tpl = (src, name, { exported = false, raw = false } = {}) => {
    const m = src.match(new RegExp(`${exported ? 'export ' : ''}const ${name} = ${raw ? 'String\\.raw' : ''}\`([\\s\\S]*?)\`;`));
    assert.ok(m, `${name} in source`);
    return m[1];
  };
  assert.equal(tpl(dataSrc, 'GROK_CURL', { exported: true, raw: true }), tpl(botsPage, 'grok', { raw: true }));
  assert.equal(tpl(dataSrc, 'OPENAI_TOOL', { exported: true }), tpl(botsPage, 'openaiTool'));
  assert.equal(tpl(dataSrc, 'CLAUDE_CODE', { exported: true }), tpl(botsPage, 'claudeCode'));
  const MCP = DEVNET.mcp;
  assert.equal(data.MCP_URL, MCP);
  assert.equal(data.CLAUDE_CODE, `claude mcp add --transport http pointcast-devnet ${MCP}`);
  assert.match(data.GROK_CURL, /"model": "grok-4\.3"/);
  assert.ok(data.GROK_CURL.includes(`"server_url": "${MCP}"`));
  // The prose steps: the same words as the list items on /chain/bots, with the URL in place of {MCP}.
  const li = (label) => {
    const m = botsPage.match(new RegExp(`<li><b>${label}:</b> ([^\\n]*?)</li>`));
    assert.ok(m, label);
    return m[1].replace(/<code>\{MCP\}<\/code>/g, MCP).replace(/<[^>]+>/g, '');
  };
  assert.equal(data.CHATGPT_STEP, li('ChatGPT'));
  assert.equal(data.CLAUDE_STEP, li('claude\\.ai'));
  assert.equal(data.GROK_NOTE, botsPage.match(/(xAI’s API connects[\s\S]*?Grok model\.)/)[1].replace(/\s+/g, ' '));
  // The page renders each of them: from the constants, not retyped.
  for (const c of ['GROK_CURL', 'OPENAI_TOOL', 'CLAUDE_CODE']) assert.match(page, new RegExp(`<Snippet label="[^"]+" code=\\{${c}\\} />`), c);
  assert.match(page, /\{chatgptLead\}<code>\{MCP_URL\}<\/code>\{chatgptTail\}/);
  assert.match(page, /\{claudeLead\}<code>\{MCP_URL\}<\/code>\{claudeTail\}/);
  assert.match(page, /\{GROK_NOTE\}/);
  // The public MCP URL is never an override: it comes from chain-home.
  assert.match(dataSrc, /import \{ DEVNET \} from '\.\/chain-home';/);
  assert.match(dataSrc, /const MCP = DEVNET\.mcp;/);
  assert.match(page, /data-api=\{D\}/);
  assert.match(page, /const D = DEVNET\.url;/);
  assert.doesNotMatch(page + dataSrc + lib, /workers\.dev|[0-9a-f]{64}/, 'no devnet constant is retyped here');
});

test('--pg-bad is defined on the page root itself: error text, invalid borders and bad results get their red', () => {
  const css = code(PAGE_STYLE);
  // the root element carries both classes on one node, so the rule that defines the colour must match that node (a descendant selector cannot)
  assert.match(page, /<div\s+class="chn pg"/, 'the root is class="chn pg"');
  const dom = new JSDOM('<!doctype html><div class="chn pg" data-pg><p class="pg-err"></p><ul><li class="pg-out" data-bad="yes"><span class="pg-out__line"></span></li></ul></div>');
  const rootEl = dom.window.document.querySelector('[data-pg]');
  const definers = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => /--pg-bad\s*:/.test(m[2])).flatMap((m) => m[1].split(',').map((x) => x.trim()));
  assert.ok(definers.length >= 1, 'something defines --pg-bad');
  assert.ok(definers.some((sel) => rootEl.matches(sel)), '--pg-bad is set on the root, which its users inherit from: ' + definers.join(' | '));
  assert.ok(!definers.includes('.chn .pg'), 'not by a descendant selector, which can never match the root');
  // every use of the variable (outside the one fallback) is on the root or inside it, where the root's value is inherited
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*var\(--pg-bad[^{}]*)\}/g)) for (const sel of m[1].split(',').map((x) => x.trim())) assert.ok(/^\.chn /.test(sel) || /^\.chn\.pg/.test(sel), sel);
  // a value is defined, not just referenced
  assert.match(css, /--pg-bad:#b3001b/);
});

test('a schema pattern from the devnet is a hint, not a hazard: a pattern that can run for ever is not run on what a person types', () => {
  // every pattern the real tools carry is tame, so real validation is unchanged
  const real = [];
  const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') { if (typeof x.pattern === 'string') real.push(x.pattern); Object.values(x).forEach(walk); } };
  walk(PINNED.map((t) => t.inputSchema));
  assert.ok(real.length >= 3, 'the tools carry patterns: ' + real.join(' '));
  for (const p of real) assert.equal(pg.analysePattern(p).tame, true, p);
  for (const p of ['^[a-z0-9-]{2,24}$', '^https://\\S+$', '^(?:tz1|tz2)[1-9A-HJ-NP-Za-km-z]{33}$', '^(?:ab)+$', '^\\d{1,3}(?:,\\d{3})?$']) assert.equal(pg.analysePattern(p).tame, true, p);
  // the shapes that blow up, and the ones that cannot be told from them
  for (const p of ['^(a+)+$', '^(a|a)*$', '^(.*)*$', '(a|aa)+$', '^(\\w+\\s?)*$', '^((a+)b)+$', '(a)\\1', '(?=a)a', '(?<!a)b', 'a*a*a*a*b', 'x'.repeat(401), '(unclosed', 'unopened)']) assert.equal(pg.analysePattern(p).tame, false, p);
  assert.equal(pg.analysePattern(5).tame, false);
  // the finding's repro: ^(a+)+$ on 28 letters and a bang took 1.2 s each time (twice per keystroke); now it is not run and takes no time
  const t0 = Date.now();
  assert.equal(pg.safeMatch('^(a+)+$', 'a'.repeat(28) + '!'), true, 'not run: no verdict is claimed');
  assert.equal(pg.safeMatch('^(a+)+$', 'a'.repeat(5000) + '!'), true);
  assert.ok(Date.now() - t0 < 100, 'took ' + (Date.now() - t0) + ' ms');
  // through the form: typing into a field whose schema pattern is hostile builds arguments instantly and raises no pattern error
  const schema = pg.cloneSchema({ type: 'object', properties: { s: { type: 'string', pattern: '^(a+)+$' }, list: { type: 'array', items: { type: 'string', pattern: '^(a|a)*$' } } } });
  const { fields } = pg.fieldsFromSchema(schema);
  const t1 = Date.now();
  for (const n of [22, 26, 28, 30]) {
    const r = pg.buildArguments(fields, { s: 'a'.repeat(n) + '!', list: 'a'.repeat(n) + '!\n' + 'a'.repeat(n) + '!' });
    assert.deepEqual(r.errors, {}, 'no pattern error is invented for a pattern that was not run');
    assert.equal(r.args.s, 'a'.repeat(n) + '!');
  }
  assert.ok(Date.now() - t1 < 200, 'four keystrokes took ' + (Date.now() - t1) + ' ms');
  assert.deepEqual(pg.validateJson('a'.repeat(30) + '!', { type: 'string', pattern: '^(a+)+$' }), []);
  // a tame pattern still validates, and a long text against a polynomial one is not run
  assert.equal(pg.safeMatch('^[a-z0-9-]{2,24}$', 'My Bot'), false);
  assert.equal(pg.safeMatch('^[a-z0-9-]{2,24}$', 'my-bot'), true);
  assert.equal(pg.safeMatch('^\\w*-\\w*$', 'x'.repeat(5000)), true, 'two unbounded repeats on a long text: not run');
  assert.equal(pg.safeMatch('^\\w+$', 'x'.repeat(5000) + '!'), false, 'one unbounded repeat is linear and still runs');
  assert.equal(pg.safeMatch('([unclosed', 'x'), true, 'an invalid pattern is ignored, as before');
  assert.match(lib, /export function safeMatch/);
});

test('the page keeps the BLOCKS grammar: square corners, 1.5px borders, weights 400 and 500, tokens, focus, reduced motion', () => {
  const css = code(PAGE_STYLE);
  assert.doesNotMatch(css, /border-radius\s*:\s*(?!0\b)[1-9]/, 'no rounded corners');
  assert.doesNotMatch(css, /font(?:-weight)?\s*:[^;}]*\b(?:600|700|800|900|bold)\b/, 'only 400 and 500');
  for (const m of css.matchAll(/font:(\d{3})\s/g)) assert.ok(['400', '500'].includes(m[1]), `font weight ${m[1]}`);
  assert.doesNotMatch(css, /overflow-x\s*:\s*scroll/);
  // Colours come from the page's tokens. The only literals: the one alert red, and the dark code panel's Copy button (same as Snippet.astro).
  const hexes = [...new Set(css.match(/#[0-9A-Fa-f]{3,8}\b/g) || [])].sort();
  assert.deepEqual(hexes, ['#0B1B2E', '#185FA5', '#5A86B5', '#E8EEF5', '#b3001b'].sort());
  for (const tok of ['--pc-ink', '--pc-ink-soft', '--pc-ink-muted', '--pc-bg', '--pc-rule-soft', '--pc-font-mono', '--pc-font-sans', '--c50', '--c600', '--c800']) assert.ok(css.includes(`var(${tok}`), tok);
  assert.match(css, /1\.5px solid var\(--c600\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /\.pg-input:focus-visible[^{]*\{outline:2px solid var\(--c600\)/);
  // Tap targets of 44px for the controls that matter.
  for (const sel of ['.pg-chip', '.pg-input']) assert.match(css, new RegExp(`\\${sel}\\{[^}]*min-height:44px`), sel);
  // 16px type in inputs, so iOS does not zoom.
  assert.match(css, /\.pg-input\{[^}]*font:400 16px/);
  // Phones: one column, wrapped long text, no horizontal page scroll from the layout.
  assert.match(css, /@media \(max-width:760px\)\{[^@]*\.pg-route\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(css, /@media \(max-width:760px\)\{[^@]*\.pg-input--code\{font-size:16px\}/, '16px type in the JSON boxes on phones');
  assert.match(css, /overflow-wrap:anywhere/);
  const chainCss = read('src/styles/chain.css');
  assert.match(chainCss, /@media \(max-width:640px\)\{\s*\.chn\{padding:16px 16px 96px\}/, '16px gutters at phone width');
  assert.match(chainCss, /\.chn pre\{[^}]*overflow-x:auto/, 'code scrolls inside its box');
  // Accessibility hooks in the markup and the script.
  assert.match(page, /data-pg-status aria-live="polite"/);
  assert.ok((PAGE_SCRIPT.match(/aria-live/g) || []).length >= 3);
  assert.match(PAGE_SCRIPT, /'aria-describedby'/);
  assert.match(PAGE_SCRIPT, /'aria-required'/);
  assert.match(PAGE_SCRIPT, /'aria-invalid'/);
  assert.match(page, /role="group" aria-label="Show tools"/);
  assert.match(page, /aria-pressed="true"/);
  assert.match(PAGE_SCRIPT, /h\('label', \{ for: id \}/);
  assert.match(page, /<label for=\{`pg-route-/);
});

test('the page is wired to the shared devnet facts and nothing off-limits', () => {
  assert.match(page, /import \{ DEVNET, assertDevnetLaunchPinned \} from '\.\.\/\.\.\/data\/chain-home';/);
  assert.match(page, /\nassertDevnetLaunchPinned\(\);\n/);
  assert.match(page, /<ChainHeader current="playground"/);
  assert.match(page, /data-genesis=\{DEVNET\.genesis\}/);
  assert.match(page, /import \{ REST_ROUTES, classifyTool, parseToolsList, restCurl \} from '\.\.\/\.\.\/\.\.\/public\/chain\/apps\/playground\.js';/);
  assert.match(PAGE_SCRIPT, /from '\.\.\/\.\.\/\.\.\/public\/chain\/apps\/playground\.js';/);
  assert.match(page, /import pinned from '\.\.\/\.\.\/\.\.\/public\/chain\/apps\/playground-tools\.json';/);
  assert.match(page, /hideAds/);
  // Every hook the script looks for is in the markup, and the test skeleton has the same ones.
  const scriptHooks = [...new Set([...PAGE_SCRIPT.matchAll(/\[data-pg(?:-[a-z]+)?(?:=[^\]]*)?\]/g)].map((m) => m[0].replace(/=.*\]/, ']')))];
  const markup = page.slice(0, page.indexOf('<script>'));
  for (const hook of scriptHooks) assert.ok(markup.includes(hook.slice(1, -1)), `${hook} is in the page markup`);
  const sk = skeleton();
  for (const hook of scriptHooks) assert.ok(sk.includes(hook.slice(1, -1)), `${hook} is in the test skeleton`);
  // The shared files are not this app's to edit.
  for (const f of ['src/data/chain-home.ts', 'src/pages/chain.astro', 'src/data/front-door-news.json', 'public/llms.txt', 'src/pages/for-agents.astro']) assert.ok(!page.includes(`'${f}'`), f);
});

test('against the local devnet-2 worker, when one is running: its tools/list is the pinned list and every shape parses', async (t) => {
  const base = process.env.PG_LOCAL_DEVNET || 'http://127.0.0.1:8799';
  let reply;
  try {
    const res = await fetch(`${base}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }), signal: AbortSignal.timeout(1500) });
    reply = await res.json();
  } catch {
    t.skip('no local devnet worker answering');
    return;
  }
  const { tools } = pg.parseToolsList(reply);
  const d = pg.diffTools(PINNED, tools);
  assert.deepEqual(d, { added: [], removed: [], changed: [], same: true });
  for (const tool of tools) {
    const { fields, root: r } = pg.fieldsFromSchema(tool.inputSchema);
    assert.ok(Array.isArray(fields));
    assert.doesNotThrow(() => pg.snippetArgs(fields, {}, r), tool.name);
  }
});
