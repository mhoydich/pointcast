import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const page = readFileSync(new URL('../src/pages/standards/check/index.astro', import.meta.url), 'utf8');
const script = readFileSync(new URL('../src/scripts/standards-check.mjs', import.meta.url), 'utf8');
const formMarkup = page.match(/<form\b[\s\S]*?<\/form>/)?.[0];
const submitTags = [...formMarkup.matchAll(/<button\b[^>]*\btype="submit"[^>]*>/g)];
const defaultSubmitter = submitTags[0]?.[0] || '';
const initiallyDisabled = /\sdisabled(?:\s|>|=)/.test(defaultSubmitter);
const bootScript = script.replace(/^import \{[\s\S]*?\} from '\.\.\/lib\/passport-check\.mjs';\n/m, '');
assert.notEqual(bootScript, script, 'mock only pure checker imports; execute the actual boot body');

function fixture({ failBoot = false } = {}) {
  const button = { disabled: initiallyDisabled };
  const raw = '{"operator":{"contact":"private fixture content"}}';
  const box = { value: raw };
  const attachmentStates = [];
  const form = { handler: null, addEventListener(type, handler) {
    if (type === 'submit') { attachmentStates.push(button.disabled); this.handler = handler; }
  }, querySelector: () => box };
  const nodes = { 'check-form': form, 'passport-file': { addEventListener() {} }, 'load-example': { addEventListener() {} }, 'check-submit': button };
  const context = vm.createContext({
    document: { getElementById(id) { if (failBoot && id === 'load-example') throw new Error('fixture boot failure'); return nodes[id] || null; } },
    FormData: class { get(name) { assert.equal(name, 'passport'); return raw; } },
    checkInputs: [],
  });
  return { button, raw, form, attachmentStates, context };
}

test('native HTML default submission is disabled without JavaScript or before hydration', () => {
  assert.ok(formMarkup);
  assert.equal(submitTags.length, 1);
  assert.equal(initiallyDisabled, true, 'the default submitter must be disabled in shipped HTML');
  assert.match(defaultSubmitter, /\bid="check-submit"/);
  assert.equal(/<input\b[^>]*\btype="(?:text|search|email|password|number)"/.test(formMarkup), false);
  assert.match(formMarkup, /<textarea\b/, 'Enter edits multiline text; any implicit default-submit activation is blocked by the disabled default submitter');
});

test('boot failure before the safe handler leaves native submission disabled', () => {
  const f = fixture({ failBoot: true });
  assert.throws(() => vm.runInContext(bootScript, f.context), /fixture boot failure/);
  assert.equal(f.form.handler, null);
  assert.equal(f.button.disabled, true);
});

test('actual checker boot enables only after preventDefault handler attaches', () => {
  const f = fixture();
  vm.runInContext(bootScript, f.context);
  assert.deepEqual(f.attachmentStates, [true]);
  assert.equal(f.button.disabled, false);
  assert.equal(typeof f.form.handler, 'function');
  // Crypto/feed math is covered separately; this regression targets actual DOM wiring.
  vm.runInContext('runCheck = (raw) => { checkInputs.push(raw); };', f.context);
  let prevented = false;
  f.form.handler({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(f.context.checkInputs.length, 1);
  assert.equal(f.context.checkInputs[0], f.raw);
});
