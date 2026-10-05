import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { calculatePilot, makerBrief, PILOT_DEFAULTS, INPUT_LIMITS } from '../src/lib/buildworks.mjs';
import { initBuildworks } from '../src/scripts/buildworks.mjs';

const { JSDOM } = createRequire(import.meta.url)('jsdom');
const studio = JSON.parse(readFileSync(new URL('../src/data/buildworks.json', import.meta.url), 'utf8'));
const inputs = (overrides = {}) => ({ ...PILOT_DEFAULTS, ...overrides });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} should equal ${expected}`);

test('default pilot distinguishes landed cost, contribution, tooling and upfront cash recovery', () => {
  const result = calculatePilot();
  assert.equal(result.saleable, 95);
  assert.equal(result.rejected, 5);
  assert.equal(result.sold, 66);
  assert.equal(result.unsold, 29);
  near(result.inventoryCash, 355);
  near(result.cashRequired, 475);
  near(result.landed, 355 / 95);
  near(result.fees, 0.66);
  near(result.netReceipt, 7.44);
  near(result.contribution, 7.44 - 355 / 95);
  assert.equal(result.toolingBreakEven, 33);
  assert.equal(result.cashRecoveryUnits, 64);
  near(result.pilotCashResult, 16.04);
  near(result.grossMargin, (12 - 355 / 95) / 12 * 100);
  near(result.contributionMargin, (7.44 - 355 / 95) / 12 * 100);
  assert.ok(result.grossMargin > result.contributionMargin);
});

test('all integer rejection percentages round correctly at an exact 100-unit boundary', () => {
  for (let rejectPercent = 0; rejectPercent <= 99; rejectPercent++) {
    const result = calculatePilot(inputs({ quantity: 100, rejectPercent, sellThrough: 100 }));
    assert.equal(result.saleable, 100 - rejectPercent, `reject allowance ${rejectPercent}%`);
    assert.equal(result.sold, result.saleable);
    assert.equal(result.rejected, rejectPercent);
  }
});

test('fractional rejects and sell-through floor real units without rounding a fractional unit up', () => {
  const result = calculatePilot(inputs({ quantity: 101, rejectPercent: 5.5, sellThrough: 33.3 }));
  assert.equal(result.saleable, 95);
  assert.equal(result.rejected, 6);
  assert.equal(result.sold, 31);
  assert.equal(result.unsold, 64);
  assert.equal(calculatePilot(inputs({ quantity: 100, rejectPercent: 79.9999 })).saleable, 20);
  assert.equal(calculatePilot(inputs({ quantity: 100, rejectPercent: 80.0001 })).saleable, 19);
});

test('zero sell-through keeps the full batch cash exposure and unsold units', () => {
  const result = calculatePilot(inputs({ sellThrough: 0 }));
  assert.equal(result.sold, 0);
  assert.equal(result.unsold, 95);
  near(result.pilotCashResult, -475);
  const soldOut = calculatePilot(inputs({ sellThrough: 100 }));
  assert.equal(soldOut.unsold, 0);
  near(soldOut.pilotCashResult, 95 * soldOut.netReceipt - soldOut.cashRequired);
  near(soldOut.pilotCashResult, 95 * soldOut.contribution - soldOut.inputs.tooling);
});

test('tooling recovery and all-cash recovery are different with unsold inventory', () => {
  const result = calculatePilot(inputs({ quantity: 100, unitCost: 4, packaging: 0, freight: 0, tooling: 200,
    rejectPercent: 0, price: 10, shipping: 0, feePercent: 0, feeFixed: 0, returnReserve: 0, sellThrough: 50 }));
  assert.equal(result.contribution, 6);
  assert.equal(result.toolingBreakEven, 34);
  assert.equal(result.cashRecoveryUnits, 60);
  assert.equal(result.pilotCashResult, -100);
  assert.equal(result.unsold, 50);
});

test('decimal currency boundaries do not add an unnecessary recovery sale', () => {
  const base = inputs({ quantity: 1, unitCost: 0.2, packaging: 0, freight: 0, tooling: 1,
    rejectPercent: 0, price: 0.3, shipping: 0, feePercent: 0, feeFixed: 0, returnReserve: 0, sellThrough: 100 });
  assert.equal(calculatePilot(base).toolingBreakEven, 10, '$1 tooling / $0.10 contribution');
  assert.equal(calculatePilot({ ...base, price: 0.2999999 }).toolingBreakEven, 11,
    'a real shortfall still needs another sale');
  assert.equal(calculatePilot({ ...base, unitCost: 0.1, tooling: 0.2, price: 0.1 }).cashRecoveryUnits, 3,
    '$0.30 committed / $0.10 net receipt');
  assert.equal(calculatePilot({ ...base, unitCost: 0.1000001, tooling: 0.2, price: 0.1 }).cashRecoveryUnits, 4);
});

test('nonpositive contribution and receipts produce explicit unavailable recovery metrics', () => {
  const badMargin = calculatePilot(inputs({ unitCost: 20 }));
  assert.ok(badMargin.contribution < 0);
  assert.equal(badMargin.toolingBreakEven, null);
  assert.ok(badMargin.cashRecoveryUnits > badMargin.saleable);
  const negativeReceipt = calculatePilot(inputs({ price: 1, shipping: 2 }));
  assert.ok(negativeReceipt.netReceipt < 0);
  assert.equal(negativeReceipt.cashRecoveryUnits, null);
  assert.equal(negativeReceipt.toolingBreakEven, null);
  const free = calculatePilot(inputs({ price: 0, wholesalePrice: 0 }));
  assert.equal(free.grossMargin, null);
  assert.equal(free.contributionMargin, null);
  assert.equal(free.wholesaleGrossMargin, null);
});

test('wholesale gross margin preserves negative values and is independent of direct selling costs', () => {
  const result = calculatePilot(inputs({ wholesalePrice: 1, shipping: 900, feePercent: 99 }));
  near(result.wholesaleGrossMargin, (1 - result.landed) * 100);
  assert.ok(result.wholesaleGrossMargin < 0);
  const directCostsChanged = calculatePilot(inputs({ wholesalePrice: 1, shipping: 0, feePercent: 0 }));
  assert.equal(result.wholesaleGrossMargin, directCostsChanged.wholesaleGrossMargin);
});

test('reject blank, missing, nonfinite, out-of-range and fractional quantity inputs', () => {
  for (const [key, [min, max]] of Object.entries(INPUT_LIMITS)) {
    for (const value of ['', '   ', undefined, null, NaN, Infinity, -Infinity, 'not a number', min - 1, max + 1]) {
      assert.throws(() => calculatePilot(inputs({ [key]: value })), RangeError, `${key}: ${String(value)}`);
    }
  }
  assert.throws(() => calculatePilot(inputs({ quantity: 1.5 })), RangeError);
  assert.throws(() => calculatePilot(inputs({ quantity: 1, rejectPercent: 99 })), /no saleable units/);
  assert.deepEqual(calculatePilot(Object.fromEntries(Object.entries(PILOT_DEFAULTS).map(([key, value]) => [key, String(value)]))).inputs, PILOT_DEFAULTS);
});

test('calculator neither mutates caller input nor the frozen illustrative defaults', () => {
  const values = inputs({ sellThrough: 0 });
  const before = { ...values };
  calculatePilot(values);
  assert.deepEqual(values, before);
  assert.ok(Object.isFrozen(PILOT_DEFAULTS));
});

test('brief is real multiline plain text with rights, safety and non-order disclosure', () => {
  const brief = makerBrief(studio.concepts[0], studio.finishes[0], {}, calculatePilot());
  assert.ok(brief.split('\n').length > 30);
  assert.ok(!brief.includes('\\n'));
  assert.match(brief, /not an order, approved specification or tested product/);
  assert.match(brief, /Rights log for artwork/);
  assert.match(brief, /adult label alone does not exempt a children’s product/);
  assert.match(brief, /Saleable units: 95; assumed sold: 66; cash committed USD: 475\.00/);
  assert.match(brief, /Model excludes tax, duties, insurance, labor, overhead/);
});

test('brief removes control bytes and limits editable text while retaining literal markup as text', () => {
  const brief = makerBrief(studio.concepts[0], studio.finishes[0], {
    quantity: ' Q\u0000\u0001\u0008' + 'q'.repeat(30), audience: 'a'.repeat(180),
    question: '<script>alert(1)</script>\u0000\u000b\u001f' + 'x'.repeat(650)
  });
  assert.ok(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(brief));
  assert.equal(brief.match(/^Quantity to quote: (.*)$/m)[1].length, 20);
  assert.equal(brief.match(/^Audience \/ intended use: (.*)$/m)[1].length, 160);
  assert.equal(brief.match(/^Design question: (.*)$/m)[1].length, 600);
  assert.match(brief, /<script>alert\(1\)<\/script>/);
});

// The fixture exercises the browser module's DOM contract. The real Astro page
// is reviewed separately; no full site build is needed for these unit tests.
const results = ['cash', 'landed', 'contribution', 'cashResult', 'units', 'sold', 'gross', 'net', 'wholesale', 'breakEven', 'recovery'];
const markup = () => `<div data-buildworks>
  <h2 id="brief-title" tabindex="-1">Maker brief</h2><p data-interactive-note>JavaScript required</p>
  <form data-brief-form>
    <select name="concept" disabled>${studio.concepts.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
    <select name="finish" disabled>${studio.finishes.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}</select>
    <input name="quantity" value="25 / 50 / 100" disabled><input name="audience" disabled><textarea name="question" disabled></textarea>
    <p data-compatibility></p><button type="button" data-download disabled>Download</button><p data-brief-status role="status"></p>
  </form>
  <img data-brief-preview alt=""><pre data-brief-output tabindex="0"></pre>
  ${studio.concepts.map(c => `<button type="button" data-use-concept="${c.id}" disabled>Use ${c.name}</button>`).join('')}
  <form data-calculator>${Object.entries(PILOT_DEFAULTS).map(([key, value]) => `<input type="number" name="${key}" value="${value}" disabled>`).join('')}
    <button type="button" data-reset disabled>Reset</button><p data-calc-error role="status"></p>
    <p data-calc-status role="status" aria-live="polite" aria-atomic="true"></p>
  </form><div data-results>${results.map(key => `<span data-result="${key}"></span>`).join('')}</div>
</div>`;

function ui(t) {
  const dom = new JSDOM(markup(), { url: 'https://example.test/buildworks/' });
  const window = dom.window;
  const original = { document: globalThis.document, FormData: globalThis.FormData, setTimeout: globalThis.setTimeout,
    createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL };
  globalThis.document = window.document;
  globalThis.FormData = window.FormData;
  const downloads = [];
  const clicks = [];
  const revoked = [];
  URL.createObjectURL = blob => { downloads.push(blob); return `blob:https://example.test/${downloads.length}`; };
  URL.revokeObjectURL = url => { revoked.push(url); };
  globalThis.setTimeout = fn => { fn(); return 0; };
  window.HTMLAnchorElement.prototype.click = function () { clicks.push({ href: this.href, download: this.download }); };
  t.after(() => {
    globalThis.document = original.document;
    globalThis.FormData = original.FormData;
    globalThis.setTimeout = original.setTimeout;
    URL.createObjectURL = original.createObjectURL;
    URL.revokeObjectURL = original.revokeObjectURL;
    window.close();
  });
  const root = window.document.querySelector('[data-buildworks]');
  const change = (form, name, value, type = 'input') => {
    const control = root.querySelector(form).elements[name];
    control.value = String(value);
    control.dispatchEvent(new window.Event(type, { bubbles: true }));
  };
  initBuildworks(root, studio);
  return { root, window, change, downloads, clicks, revoked };
}

test('UI initialization enables controls, shows accurate assumptions and is idempotent', async t => {
  const { root, change, downloads } = ui(t);
  assert.equal(root.dataset.bound, 'true');
  assert.equal(root.querySelectorAll(':disabled').length, 0);
  assert.equal(root.querySelector('[data-result="cash"]').textContent, '$475.00');
  assert.equal(root.querySelector('[data-result="sold"]').textContent, '66 assumed sold / 29 unsold');
  assert.equal(root.querySelector('[data-results]').hidden, false);
  assert.match(root.querySelector('[data-interactive-note]').textContent, /until you leave or reload/);
  change('[data-calculator]', 'quantity', 200);
  initBuildworks(root, studio);
  assert.equal(root.querySelector('[data-calculator]').elements.quantity.value, '200');
  root.querySelector('[data-download]').click();
  assert.equal(downloads.length, 1, 'repeated lifecycle setup must not duplicate listeners');
  assert.match(await downloads[0].text(), /quantity: 200/);
});

test('UI prevents both forms submitting and uses no external persistence or network code', t => {
  const { root, window } = ui(t);
  for (const selector of ['[data-calculator]', '[data-brief-form]']) {
    const event = new window.Event('submit', { bubbles: true, cancelable: true });
    assert.equal(root.querySelector(selector).dispatchEvent(event), false);
    assert.equal(event.defaultPrevented, true);
  }
  const script = readFileSync(new URL('../src/scripts/buildworks.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(script, /\b(?:fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage)\b/);
});

test('concept shortcut selects its first proposed process, updates illustration and moves keyboard focus', t => {
  const { root, window, change } = ui(t);
  const concept = studio.concepts.find(c => c.id === 'tide-window');
  root.querySelector(`[data-use-concept="${concept.id}"]`).click();
  const form = root.querySelector('[data-brief-form]');
  assert.equal(form.elements.concept.value, concept.id);
  assert.equal(form.elements.finish.value, 'magnet');
  assert.equal(window.document.activeElement.id, 'brief-title');
  assert.equal(root.querySelector('[data-brief-preview]').getAttribute('src'), '/images/buildworks/tide-window.svg');
  assert.match(root.querySelector('[data-brief-output]').textContent, /Concept: Tide Window/);
  assert.match(root.querySelector('[data-brief-status]').textContent, /Tide Window is now/);
  assert.match(root.querySelector('[data-compatibility]').textContent, /Plausible process/);
  change('[data-brief-form]', 'finish', 'embroidery', 'change');
  assert.match(root.querySelector('[data-compatibility]').textContent, /Exploratory pairing/);
  assert.match(root.querySelector('[data-brief-output]').textContent, /Process to discuss: Embroidered patch/);
});

test('unsafe-looking editable text stays literal and never creates nodes in the preview', t => {
  const { root, window, change } = ui(t);
  const value = '<img src=x onerror="alert(1)"> & <script>alert(2)</script>';
  change('[data-brief-form]', 'question', value);
  assert.ok(root.querySelector('[data-brief-output]').textContent.includes(value));
  assert.equal(root.querySelector('[data-brief-output]').querySelectorAll('img,script').length, 0);
  assert.equal(window.alertTriggered, undefined);
});

test('invalid input hides stale results and removes invalid assumptions from exported briefs', async t => {
  const { root, change, downloads, clicks, revoked } = ui(t);
  assert.match(root.querySelector('[data-brief-output]').textContent, /ILLUSTRATIVE PILOT INPUTS/);
  change('[data-calculator]', 'quantity', '');
  assert.equal(root.querySelector('[data-results]').hidden, true);
  assert.match(root.querySelector('[data-calc-error]').textContent, /quantity/);
  assert.doesNotMatch(root.querySelector('[data-brief-output]').textContent, /ILLUSTRATIVE PILOT INPUTS|cash committed USD/);
  root.querySelector('[data-download]').click();
  assert.equal(downloads.length, 1);
  assert.equal(downloads[0].type, 'text/plain;charset=utf-8');
  assert.doesNotMatch(await downloads[0].text(), /ILLUSTRATIVE PILOT INPUTS|cash committed USD/);
  assert.equal(clicks[0].download, 'el-segundo-buildworks-maker-brief.txt');
  assert.deepEqual(revoked, [clicks[0].href]);
  assert.equal(root.querySelectorAll('a[download]').length, 0, 'temporary download anchor is removed');
  change('[data-calculator]', 'quantity', 100);
  assert.equal(root.querySelector('[data-results]').hidden, false);
  assert.equal(root.querySelector('[data-calc-error]').textContent, '');
  assert.match(root.querySelector('[data-brief-output]').textContent, /cash committed USD: 475\.00/);
});

test('UI displays undefined zero-price margins and recovery limits, then reset restores defaults', t => {
  const { root, change } = ui(t);
  change('[data-calculator]', 'price', 0);
  change('[data-calculator]', 'wholesalePrice', 0);
  assert.equal(root.querySelector('[data-result="gross"]').textContent, 'Undefined at $0 price');
  assert.equal(root.querySelector('[data-result="wholesale"]').textContent, 'Undefined at $0 wholesale price');
  assert.match(root.querySelector('[data-result="breakEven"]').textContent, /nonpositive contribution/);
  assert.match(root.querySelector('[data-result="recovery"]').textContent, /nonpositive net receipts/);
  root.querySelector('[data-reset]').click();
  change('[data-calculator]', 'unitCost', 20);
  assert.match(root.querySelector('[data-result="recovery"]').textContent, /exceeds this batch/);
  assert.match(root.querySelector('[data-result="wholesale"]').textContent, /^-/);
  root.querySelector('[data-reset]').click();
  for (const [key, value] of Object.entries(PILOT_DEFAULTS)) {
    assert.equal(root.querySelector('[data-calculator]').elements[key].value, String(value));
  }
  assert.equal(root.querySelector('[data-result="cash"]').textContent, '$475.00');
});

test('completed calculator changes announce a concise summary and invalid inputs clear it', t => {
  const { root, change } = ui(t);
  const status = root.querySelector('[data-calc-status]');
  assert.equal(status.textContent, '', 'initial render must not announce all illustrative results');
  change('[data-calculator]', 'quantity', 200);
  assert.equal(status.textContent, '', 'typing updates results without announcing each keystroke');
  change('[data-calculator]', 'quantity', 200, 'change');
  assert.match(status.textContent, /Model updated\. Upfront batch cash \$785\.00/);
  assert.match(status.textContent, /direct contribution .* per unit; batch cash result/);
  change('[data-calculator]', 'quantity', '');
  assert.equal(status.textContent, '');
  root.querySelector('[data-reset]').click();
  assert.match(status.textContent, /Upfront batch cash \$475\.00/);
});

test('a new root after an Astro navigation initializes independently', t => {
  const { root, window } = ui(t);
  root.remove();
  window.document.body.innerHTML = markup();
  const replacement = window.document.querySelector('[data-buildworks]');
  initBuildworks(null, studio);
  initBuildworks(replacement, studio);
  assert.equal(replacement.dataset.bound, 'true');
  assert.equal(replacement.querySelectorAll(':disabled').length, 0);
  assert.match(replacement.querySelector('[data-brief-output]').textContent, /cash committed USD: 475\.00/);
});
