import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { assertDataValid } from '@taquito/michel-codec';
import { ParameterSchema } from '@taquito/michelson-encoder';
import {
  BOT_NOTE, PLACEHOLDER_ADDRESS, configProblems, evaluateGate1, parseArgs, planGate1, prepareStorage, storageTypeFromCode,
} from '../scripts/enjoy-money.mjs';
import { ENJOY_TOKENS, contractMetadata, noteSvg, tokenMetadata } from '../scripts/enjoy-money-metadata.mjs';

const ROOT = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, ROOT), 'utf8');
const readJson = async (path) => JSON.parse(await read(path));
const ADMIN = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
const TREASURY = 'tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6';
const GOOD = { admin: ADMIN, treasury: TREASURY, metadataBase: 'https://pointcast.xyz/nouns-money/enjoy/metadata', printRuns: { 0: 100, 1: 100, 2: 100 }, seal: [0, 1, 2], botTestMint: 3000, contract: 'KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh' };
const decode = (bytes) => Buffer.from(bytes, 'hex').toString('utf8');

const build = async () => ({
  code: await readJson('contracts/build/enjoy_money/step_001_cont_0_contract.json'),
  template: await readJson('contracts/build/enjoy_money/step_001_cont_0_storage.json'),
});

test('the compiled contract exposes exactly the planned entrypoints: no sale, swap, burn or withdrawal', async () => {
  const { code } = await build();
  const entrypoints = [];
  (function walk(node) {
    if (node.prim === 'or') return node.args.forEach(walk);
    entrypoints.push(node.annots[0].slice(1));
  })(code.find((section) => section.prim === 'parameter').args[0]);
  assert.deepEqual(entrypoints.sort(), [
    'accept_admin', 'balance_of', 'mint', 'seal', 'set_admin', 'set_metadata', 'set_token_metadata', 'set_treasury', 'transfer', 'update_operators',
  ]);
});

test('the SmartPy source carries the Phase 1 rules and the tests the plan asks for', async () => {
  const source = await read('contracts/enjoy-money/enjoy_money_fa2.py');
  for (const rule of ['"TOKEN_SEALED"', '"MINT_ONLY_TO_TREASURY"', '"TOKEN_NOT_SEALABLE"', '"ALREADY_SEALED"', '"NOT_PENDING_ADMIN"', 'tag="seal"']) assert.ok(source.includes(rule), rule);
  for (const heading of ['Minting into a sealed ID fails', 'Mint is rejected for non-admins', 'Transfers', 'Operator rules', 'Two-step admin handoff']) assert.ok(source.includes(heading), heading);
  assert.doesNotMatch(source, /class \w+\([^)]*main\.Admin\b/, 'the one-step fa2_lib Admin mixin stays out');
  for (const token of ENJOY_TOKENS) assert.ok(source.includes(`("${token.name}", "${token.symbol}")`), `${token.symbol} matches the metadata script`);
});

test('prepareStorage swaps in the environment and keeps the storage valid', async () => {
  const { code, template } = await build();
  const type = storageTypeFromCode(code);
  assert.ok(JSON.stringify(template).includes(PLACEHOLDER_ADDRESS), 'the build ships placeholders, not real addresses');
  const storage = prepareStorage(template, type, GOOD);
  assertDataValid(storage, type);
  const text = JSON.stringify(storage);
  assert.ok(text.includes(ADMIN) && text.includes(TREASURY));
  assert.ok(!text.includes(PLACEHOLDER_ADDRESS));
  const uris = [...text.matchAll(/"bytes":"([0-9a-f]+)"/g)].map((m) => decode(m[1])).filter((s) => s.startsWith('https://'));
  assert.deepEqual(uris.sort(), ['contract', 0, 1, 2, 3].map((n) => `${GOOD.metadataBase}/${n}.json`).sort());
  assert.ok(!JSON.stringify(template).includes(ADMIN), 'the template is not mutated');
});

test('config gates execution: real separate keys, ipfs on mainnet, notes only', async () => {
  const config = await readJson('contracts/enjoy-money/config.json');
  assert.ok(configProblems(config.shadownet, 'shadownet').length > 0, 'checked-in config is not executable until Mike fills the addresses');
  assert.deepEqual(configProblems(GOOD, 'shadownet', { needContract: true }), []);
  assert.match(configProblems(GOOD, 'mainnet').join(), /ipfs/);
  assert.deepEqual(configProblems({ ...GOOD, metadataBase: 'ipfs://bafyfinal' }, 'mainnet'), []);
  assert.match(configProblems({ ...GOOD, treasury: ADMIN }, 'shadownet').join(), /separate/);
  assert.match(configProblems({ ...GOOD, admin: PLACEHOLDER_ADDRESS }, 'shadownet').join(), /placeholder/);
  assert.match(configProblems({ ...GOOD, printRuns: { 3: 10 } }, 'shadownet').join(), /notes 0-2/);
  assert.match(configProblems({ ...GOOD, seal: [3] }, 'shadownet').join(), /notes 0-2/);
  assert.match(configProblems({ ...GOOD, contract: null }, 'shadownet', { needContract: true }).join(), /originate first/);
  assert.equal(config.mainnet.metadataBase, null);
  assert.deepEqual(config.mainnet.printRuns, { 0: 100 }, 'Series 1 mainnet starts with the 100-unit Enjoy. note');
});

test('CLI guards: preparation by default, mainnet needs explicit confirmation, ghostnet is retired', () => {
  assert.equal(parseArgs(['originate']).execute, false);
  assert.throws(() => parseArgs(['originate', '--network', 'mainnet', '--execute']), /I_UNDERSTAND_MAINNET/);
  assert.equal(parseArgs(['gate1', '--network', 'mainnet', '--execute', '--confirm-mainnet', 'I_UNDERSTAND_MAINNET']).execute, true);
  assert.throws(() => parseArgs(['status', '--network', 'ghostnet']), /retired/);
  assert.throws(() => parseArgs(['redeem']), /Unknown command/);
});

test('planGate1 mints each run to Treasury, seals the notes, and is idempotent', () => {
  const fresh = planGate1({ supply: {}, sealed: {} }, GOOD);
  assert.deepEqual(fresh.mints, [
    { to_: TREASURY, token_id: 0, amount: 100 }, { to_: TREASURY, token_id: 1, amount: 100 }, { to_: TREASURY, token_id: 2, amount: 100 }, { to_: TREASURY, token_id: BOT_NOTE, amount: 3000 },
  ]);
  assert.deepEqual(fresh.seals, [0, 1, 2]);
  const partial = planGate1({ supply: { 0: 100, 1: 40 }, sealed: { 0: 100 } }, GOOD);
  assert.deepEqual(partial.mints.map((m) => [m.token_id, m.amount]), [[1, 60], [2, 100], [3, 3000]]);
  assert.deepEqual(partial.seals, [1, 2]);
  assert.deepEqual(planGate1({ supply: { 0: 100, 1: 100, 2: 100, 3: 3000 }, sealed: { 0: 100, 1: 100, 2: 100 } }, GOOD), { mints: [], seals: [] });
  assert.throws(() => planGate1({ supply: { 0: 90 }, sealed: { 0: 90 } }, GOOD), /sealed at 90/);
  assert.throws(() => planGate1({ supply: { 0: 101 }, sealed: {} }, GOOD), /exceeds/);
});

test('evaluateGate1 passes only when every run is minted, held and sealed', () => {
  const done = { supply: { 0: 100, 1: 100, 2: 100, 3: 3000 }, sealed: { 0: 100, 1: 100, 2: 100 }, treasury: { 0: 100, 1: 100, 2: 100, 3: 3000 } };
  assert.deepEqual(evaluateGate1(done, GOOD), []);
  assert.match(evaluateGate1({ ...done, sealed: { 0: 100, 1: 100 } }, GOOD).join(), /note 2: not sealed/);
  assert.match(evaluateGate1({ ...done, supply: { ...done.supply, 3: 10 } }, GOOD).join(), /Bot Note/);
});

test('the mint and seal calls encode against the compiled parameter type', async () => {
  const { code } = await build();
  const schema = ParameterSchema.fromRPCResponse({ script: { code, storage: [] } });
  const mint = schema.EncodeObject({ mint: [{ to_: TREASURY, token_id: 0, amount: 100 }] });
  assert.match(JSON.stringify(mint), /"int":"100"/);
  assert.match(JSON.stringify(schema.EncodeObject({ seal: 0 })), /"int":"0"/);
});

test('published metadata and art match the generator, with decimals 0 and the closed-loop line', async () => {
  assert.deepEqual(await readJson('public/nouns-money/enjoy/metadata/contract.json'), contractMetadata());
  for (const token of ENJOY_TOKENS) {
    const published = await readJson(`public/nouns-money/enjoy/metadata/${token.id}.json`);
    assert.deepEqual(published, tokenMetadata(token));
    assert.equal(published.decimals, 0);
    assert.match(published.description, /no redemption/);
    assert.equal(await read(`public/nouns-money/enjoy/art/${token.id}.svg`), noteSvg(token));
  }
});

test('key files and plaintext print codes are gitignored', async () => {
  const ignore = await read('.gitignore');
  for (const pattern of ['*.key', '*.secret', 'secrets/', '**/print/']) assert.ok(ignore.split('\n').includes(pattern), pattern);
});
