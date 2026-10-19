import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountInternshipLab } from '../src/scripts/internship-lab.mjs';

function fixture() {
  const checkboxes = (kind, count) => Array.from({ length: count }, (_, i) => `<input type="checkbox" data-${kind}="${i}">`).join('');
  return new JSDOM(`<div id="lab">
    <p id="il-progress"></p><p id="il-submission-state"></p><p id="il-approval-state"></p><p id="il-url-help"></p>
    <select id="il-role" data-field="role"><option>Design</option><option>Build</option></select>
    <input data-field="goal"><input data-field="offer"><textarea data-field="evidence"></textarea><input id="il-url" data-field="artifactUrl">
    ${checkboxes('onboarding', 3)}
    ${['understand', 'make', 'test'].map(id => `<span data-task-label="${id}"></span><select data-task="${id}"><option value="todo">To do</option><option value="doing">In progress</option><option value="ready">Ready</option></select>`).join('')}
    <fieldset id="il-review-checks">${checkboxes('review', 4)}<textarea data-field="reviewNote"></textarea></fieldset>
    <fieldset id="il-deploy-checks">${checkboxes('deploy', 3)}<input data-field="approvalReference"><button id="il-record-approval">Record</button></fieldset>
    <button id="il-export-json">JSON</button><button id="il-export-md">Markdown</button><button id="il-reset">Clear</button><p id="il-download-status"></p>
  </div>`, { url: 'https://pointcast.xyz/internship-lab/' });
}

test('actual controller gates the workflow, exports drafts, invalidates changed reviews and clears state', async () => {
  const dom = fixture();
  const root = dom.window.document.querySelector('#lab');
  const $ = selector => root.querySelector(selector);
  const field = (name, value) => { const input = $(`[data-field="${name}"]`); input.value = value; input.dispatchEvent(new dom.window.Event('input')); };
  const check = (kind, index, value = true) => { const input = $(`[data-${kind}="${index}"]`); input.checked = value; input.dispatchEvent(new dom.window.Event('change')); };
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalConfirm = globalThis.confirm;
  let exportedBlob;
  let filename;
  URL.createObjectURL = blob => { exportedBlob = blob; return 'blob:test'; };
  URL.revokeObjectURL = () => {};
  globalThis.confirm = () => true;
  dom.window.HTMLAnchorElement.prototype.click = function () { filename = this.download; };
  try {
    mountInternshipLab(root);
    assert.equal($('#il-review-checks').disabled, true);
    assert.equal($('#il-record-approval').disabled, true);
    field('goal', 'Learn to describe and test a small useful offer.');
    field('offer', 'Original book swap signs');
    for (let i = 0; i < 3; i++) check('onboarding', i);
    for (const input of root.querySelectorAll('[data-task]')) { input.value = 'ready'; input.dispatchEvent(new dom.window.Event('change')); }
    field('evidence', 'Version 1 uses my original SVG. I checked keyboard access, mobile layout and the ZIP contents.');
    field('artifactUrl', 'http://example.com');
    assert.equal($('#il-review-checks').disabled, true);
    assert.match($('#il-url-help').textContent, /Use a public https URL/);
    field('artifactUrl', 'https://example.com/draft');
    assert.equal($('#il-review-checks').disabled, false);
    for (let i = 0; i < 4; i++) check('review', i);
    field('reviewNote', 'Checked the source, rights and matching product description.');
    assert.equal($('#il-deploy-checks').disabled, false);
    for (let i = 0; i < 3; i++) check('deploy', i);
    field('approvalReference', 'v1 / owner role / review A');
    assert.equal($('#il-record-approval').disabled, false);
    $('#il-record-approval').click();
    assert.match($('#il-approval-state').textContent, /^Practice approval recorded/);
    $('#il-export-json').click();
    let packet = JSON.parse(await exportedBlob.text());
    assert.equal(filename, 'pointcast-internship-handoff.json');
    assert.equal(packet.deployment_rehearsal.practice_approval_recorded, true);
    assert.equal(packet.deployment_enabled, false);
    assert.equal(packet.submitted_to_pointcast, false);
    field('reviewNote', 'Changed review: version 2 needs another download check.');
    assert.equal($('#il-record-approval').disabled, true);
    assert.ok([...root.querySelectorAll('[data-deploy]')].every(input => !input.checked));
    $('#il-export-json').click();
    packet = JSON.parse(await exportedBlob.text());
    assert.equal(packet.deployment_rehearsal.practice_approval_recorded, false);
    field('evidence', 'Changed the artifact to version 2. Need to repeat the source checks.');
    assert.ok([...root.querySelectorAll('[data-review]')].every(input => !input.checked));
    $('#il-export-md').click();
    assert.match(await exportedBlob.text(), /No work has been deployed/);
    assert.equal(filename, 'pointcast-internship-handoff.md');
    $('#il-reset').click();
    assert.equal($('[data-field="goal"]').value, '');
    assert.equal($('#il-review-checks').disabled, true);
    assert.equal(dom.window.document.activeElement.id, 'il-role');
    $('#il-export-json').click();
    packet = JSON.parse(await exportedBlob.text());
    assert.equal(packet.status, 'local_draft');
    assert.equal(packet.offer_title, '');
  } finally {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    globalThis.confirm = originalConfirm;
    dom.window.close();
  }
});
