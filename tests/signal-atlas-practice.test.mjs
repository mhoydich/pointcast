import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { PRACTICE_PACKET, evaluatePractice } from '../public/signal-atlas/practice-model.mjs';

test('machine packet and displayed exercise share the same fictional source facts', async () => {
  const json = JSON.parse(await readFile(new URL('../public/signal-atlas/practice-packet.json', import.meta.url), 'utf8'));
  assert.deepEqual(json, PRACTICE_PACKET);
  const html = await readFile(new URL('../public/signal-atlas/index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html);
  for (const record of json.records) {
    const text = dom.window.document.querySelector('.practice-packet').textContent;
    assert.ok(text.includes(record.recordId) && text.includes(record.sourceId) && text.includes(record.excerpt));
  }
  dom.window.close();
});
test('correct and incorrect work remain local, unsigned and unranked', () => {
  for (const [answer, outcome] of [
    [{recordId:'pkt_02',sourceId:'src_02'}, 'matches-fixture'],
    [{recordId:'pkt_01',sourceId:'src_02'}, 'needs-revision'],
    [{recordId:'pkt_02',sourceId:'src_01'}, 'needs-revision'],
  ]) {
    const { receipt, error } = evaluatePractice(JSON.stringify(answer));
    assert.equal(error, undefined);
    assert.equal(receipt.outcome, outcome);
    assert.equal(receipt.fictional, true);
    for (const field of ['submitted','signed','eligibleForStandings']) assert.equal(receipt[field], false);
    assert.equal(receipt.schema, 'signal-atlas.local-practice-receipt/v1');
    assert.ok(!Object.hasOwn(receipt, 'points') && !Object.hasOwn(receipt, 'signature'));
  }
});
test('duplicate keys, nested content, executable-looking values and extra fields fail closed', () => {
  const invalid = [
    '{"recordId":"pkt_01","recordId":"pkt_02","sourceId":"src_02"}',
    '{"recordId":"pkt_02","record\\u0049d":"pkt_02","sourceId":"src_02"}',
    '{"recordId":"pkt_02","sourceId":"src_02","eligibleForStandings":"true"}',
    '{"recordId":{"id":"pkt_02"},"sourceId":"src_02"}',
    '{"recordId":"<script>alert(1)</script>","sourceId":"src_02"}',
    '{"__proto__":"pkt_02","sourceId":"src_02"}',
    '[]', 'null', 'true', 'no', '{}', ' '.repeat(501), undefined,
  ];
  for (const input of invalid) {
    const result = evaluatePractice(input);
    assert.equal(typeof result.error, 'string', String(input));
    assert.equal(result.receipt, undefined, String(input));
  }
});
test('field order and escaped canonical keys do not change the result', () => {
  const standard = evaluatePractice('{"recordId":"pkt_02","sourceId":"src_02"}');
  assert.deepEqual(evaluatePractice('{ "sourceId": "src_02", "recordId": "pkt_02" }'), standard);
  assert.deepEqual(evaluatePractice('{"record\\u0049d":"pkt_02","sourceId":"src_02"}'), standard);
});
test('repeated practice edits invalidate receipts; reset and example recover from invalid input', async () => {
  const html = await readFile(new URL('../public/signal-atlas/index.html', import.meta.url), 'utf8');
  const source = await readFile(new URL('../public/signal-atlas/practice.mjs', import.meta.url), 'utf8');
  const dom = new JSDOM(html, {runScripts:'outside-only', url:'https://preview.invalid/signal-atlas/'});
  const {window} = dom;
  window.evaluatePractice = evaluatePractice;
  window.fetch = () => assert.fail('practice must never make a network request');
  window.eval(source.replace("import { evaluatePractice } from './practice-model.mjs';", 'const evaluatePractice = window.evaluatePractice;'));
  const $ = id => window.document.getElementById(id);
  const submit = () => $('practice-form').dispatchEvent(new window.Event('submit', {cancelable:true}));
  $('practice-answer').value = 'invalid';
  submit();
  assert.equal($('practice-answer').getAttribute('aria-invalid'), 'true');
  assert.equal($('practice-receipt').hidden, true);
  assert.equal($('practice-next').hidden, true);
  assert.equal($('practice-download').disabled, true);
  $('practice-example').click();
  assert.equal($('practice-answer').getAttribute('aria-invalid'), null);
  submit();
  assert.equal($('practice-receipt').hidden, false);
  assert.equal(JSON.parse($('practice-receipt-json').textContent).outcome, 'matches-fixture');
  assert.equal($('practice-next').hidden, false);
  assert.equal($('practice-download').disabled, false);
  assert.match($('practice-next-title').textContent, /with its source/);
  $('practice-receipt').open = true;
  $('practice-answer').value = '{"recordId":"pkt_03","sourceId":"src_03"}';
  $('practice-answer').dispatchEvent(new window.Event('input'));
  assert.equal($('practice-receipt').hidden, true);
  assert.equal($('practice-receipt-json').textContent, '');
  assert.equal($('practice-next').hidden, true);
  assert.equal($('practice-download').disabled, true);
  submit();
  assert.equal(JSON.parse($('practice-receipt-json').textContent).outcome, 'needs-revision');
  assert.match($('practice-next-note').textContent, /need another look/);
  $('practice-reset').click();
  assert.equal($('practice-answer').value, '');
  assert.equal($('practice-receipt').hidden, true);
  assert.equal($('practice-next').hidden, true);
  assert.equal($('practice-download').disabled, true);
  assert.equal(window.document.activeElement, $('practice-answer'));
  dom.window.close();
});
test('receipt download contains exactly the evaluated local result and cannot export stale work', async () => {
  const html = await readFile(new URL('../public/signal-atlas/index.html', import.meta.url), 'utf8');
  const source = await readFile(new URL('../public/signal-atlas/practice.mjs', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://preview.invalid/signal-atlas/' });
  const { window } = dom;
  const blobs = [], downloads = [], revoked = [];
  window.evaluatePractice = evaluatePractice;
  window.Blob = Blob;
  window.URL.createObjectURL = blob => { blobs.push(blob); return 'blob:local-test'; };
  window.URL.revokeObjectURL = url => revoked.push(url);
  window.setTimeout = callback => callback();
  window.HTMLAnchorElement.prototype.click = function () { downloads.push({ href: this.href, name: this.download }); };
  window.fetch = () => assert.fail('receipt must not be uploaded');
  window.eval(source.replace("import { evaluatePractice } from './practice-model.mjs';", 'const evaluatePractice = window.evaluatePractice;'));
  const $ = id => window.document.getElementById(id);
  $('practice-download').click();
  assert.equal(downloads.length, 0);
  $('practice-example').click();
  $('practice-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
  $('practice-download').click();
  assert.deepEqual(downloads, [{ href: 'blob:local-test', name: 'signal-atlas-local-practice.json' }]);
  assert.equal(blobs[0].type, 'application/json');
  assert.deepEqual(JSON.parse(await blobs[0].text()), evaluatePractice($('practice-answer').value).receipt);
  assert.deepEqual(revoked, ['blob:local-test']);
  assert.equal(window.document.querySelectorAll('a[download="signal-atlas-local-practice.json"]').length, 0);
  $('practice-answer').value = 'invalid';
  $('practice-answer').dispatchEvent(new window.Event('input'));
  $('practice-download').click();
  assert.equal(downloads.length, 1);
  dom.window.close();
});
