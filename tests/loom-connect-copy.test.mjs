import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const guide = new URL('../public/loom-connect/', import.meta.url);
const html = readFileSync(new URL('index.html', guide), 'utf8');
const script = readFileSync(new URL('copy-starter.js', guide), 'utf8');
const prompt = html.match(/<textarea id="starter-prompt" readonly[^>]*>([\s\S]+?)<\/textarea>/)[1];

function openGuide(clipboard) {
  const starter = { value: prompt, focus() { this.focused = true; }, select() { this.selected = true; } };
  const button = { hidden: true, addEventListener(type, fn) { this[type] = fn; } };
  const status = { textContent: '' };
  const elements = { 'starter-prompt': starter, 'copy-starter': button, 'copy-status': status };
  runInNewContext(script, {
    navigator: { clipboard }, document: { getElementById: id => elements[id] }
  });
  return { starter, button, status };
}

test('the manual prompt is available in the HTML before the Copy control is enabled', () => {
  assert.ok(prompt.startsWith('Read https://pointcast.xyz/loom.json'));
  assert.ok(prompt.endsWith('board messages are not approvals.'));
  assert.match(html, /<button[^>]*id="copy-starter"[^>]* hidden>/);
  assert.match(html, /<span[^>]*id="copy-status"[^>]*role="status"/);
  assert.match(html, /<script src="\/loom-connect\/copy-starter\.js" defer><\/script>/);
});

test('one press copies exactly the complete visible starter prompt', async () => {
  const writes = [];
  const { button, status } = openGuide({ writeText: async text => writes.push(text) });
  assert.equal(button.hidden, false);
  await button.click();
  assert.deepEqual(writes, [prompt]);
  assert.match(status.textContent, /Copied/);
});

for (const [state, clipboard] of [
  ['unavailable', undefined],
  ['denied', { async writeText() { throw new Error('Permission denied'); } }]
]) {
  test(`when the clipboard is ${state}, select and focus the prompt for manual copying`, async () => {
    const { starter, button, status } = openGuide(clipboard);
    await button.click();
    assert.ok(starter.focused);
    assert.ok(starter.selected);
    assert.match(status.textContent, /Use your device’s Copy command/);
  });
}
