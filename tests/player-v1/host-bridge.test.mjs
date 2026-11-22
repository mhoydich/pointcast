/** Host bridge logic tests with DOM and companion stubs; NOT a live-provider test. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const candidates = [path.join(dir, '../integration/host-bridge.js'), path.join(dir, '../../public/player-v1/host-bridge.js')];
const source = fs.readFileSync(candidates.find(p => fs.existsSync(p)), 'utf8');
const tests = [];
function test(name, fn) { fn(); tests.push({ name, passed: true }); console.log('PASS ' + name); }
class Element extends EventTarget {
  constructor() { super(); this.map = {}; this.textContent = ''; this.isConnected = true; this.focusCount = 0; }
  querySelector(s) { return this.map[s] || null; }
  focus() { this.focusCount++; }
}
class Input extends Element { checked = true; }
class Textarea extends Element { value = 'old private context'; }
class Select extends Element { value = 'old-context'; }
class Frame extends Element { contentWindow = { sent: [], postMessage(data, origin) { this.sent.push({ data, origin }); } }; }
class Dialog extends Element { open = false; openCount = 0; showModal() { this.open = true; this.openCount++; } close() { this.open = false; this.dispatchEvent(new Event('close')); } }
const window = new EventTarget(), document = new Element(), root = new Element(), frame = new Frame(), dialog = new Dialog();
const notice = new Element(), status = new Element(), opener = new Element(), closer = new Element(), prompt = new Textarea(), focused = new Element();
let submits = 0, inputEvents = 0;
const run = new Element(); run.click = () => submits++;
prompt.addEventListener('input', () => inputEvents++);
root.map = { '[data-player-frame]': frame, '[data-player-ai-dialog]': dialog, '[data-player-host-notice]': notice, '[data-player-open-ai]': opener, '[data-player-draft-status]': status };
dialog.map = { '[data-player-close]': closer, '[data-runtime-prompt]': prompt, '[data-runtime-run]': run, '[data-runtime-context]': new Select(), '[data-runtime-note]': new Textarea(), '[data-runtime-page]': new Input(), '[data-runtime-followup]': new Input(), '[data-runtime-gentle]': new Input() };
document.map['[data-player-host]'] = root; document.activeElement = focused;
const location = { origin: 'https://pointcast.example' };
const context = vm.createContext({ window, document, location, HTMLElement: Element, HTMLIFrameElement: Frame, HTMLDialogElement: Dialog, HTMLInputElement: Input, HTMLTextAreaElement: Textarea, HTMLSelectElement: Select, AbortController, Event });
vm.runInContext(source, context);
function message(data, source = frame.contentWindow, origin = location.origin) { const e = new Event('message'); Object.assign(e, { data, source, origin }); window.dispatchEvent(e); }
const packet = value => ({ type: 'pointcast.player.ai-draft', version: 1, prompt: value });
test('Mount acknowledges only the known frame at exact origin', () => { assert.equal(frame.contentWindow.sent.length, 1); assert.equal(frame.contentWindow.sent[0].origin, location.origin); });
test('Ready handshake receives an acknowledgement', () => { message({ type: 'pointcast.player.ready', version: 1 }); assert.equal(frame.contentWindow.sent.length, 2); });
test('Wrong-origin draft is rejected', () => { message(packet('injected'), frame.contentWindow, 'https://attacker.invalid'); assert.equal(prompt.value, 'old private context'); });
test('Wrong-window draft is rejected', () => { message(packet('injected'), {}); assert.equal(prompt.value, 'old private context'); });
test('Wrong-version draft is rejected', () => { message({ ...packet('injected'), version: 2 }); assert.equal(prompt.value, 'old private context'); });
test('Non-string prompt is rejected', () => { message(packet({ attack: true })); assert.equal(prompt.value, 'old private context'); });
test('Empty and over-limit prompts do not open a dialog', () => { message(packet(' ')); message(packet('x'.repeat(4001))); assert.equal(dialog.open, false); assert.match(notice.textContent, /not accepted/); });
test('Valid draft fills the exact prompt and opens review', () => { message(packet('Draft only. Keep the room quiet.')); assert.equal(prompt.value, 'Draft only. Keep the room quiet.'); assert.equal(dialog.open, true); assert.equal(inputEvents, 1); });
test('Prior optional private context is cleared', () => { for (const s of ['[data-runtime-page]', '[data-runtime-followup]', '[data-runtime-gentle]']) assert.equal(dialog.map[s].checked, false); assert.equal(dialog.map['[data-runtime-note]'].value, ''); assert.equal(dialog.map['[data-runtime-context]'].value, ''); });
test('Handoff never clicks Run or submits a task', () => { assert.equal(submits, 0); assert.match(status.textContent, /No AI task has started/); });
test('Closing review restores focus', () => { closer.dispatchEvent(new Event('click')); assert.equal(dialog.open, false); assert.equal(focused.focusCount, 1); });
test('Manual open is available without a handoff', () => { opener.dispatchEvent(new Event('click')); assert.equal(dialog.open, true); dialog.close(); });
test('Remount does not duplicate message handlers', () => { window.__pointcastPlayerHostV1.mount(); const before = inputEvents; message(packet('Second draft')); assert.equal(inputEvents, before + 1); });
test('Astro cleanup removes the handoff handler', () => { document.dispatchEvent(new Event('astro:before-swap')); const before = prompt.value; message(packet('Should not arrive')); assert.equal(prompt.value, before); assert.equal(dialog.open, false); });
test('Opaque origins cannot acknowledge or accept a draft', () => { location.origin = 'null'; const sent = frame.contentWindow.sent.length; window.__pointcastPlayerHostV1.mount(); message(packet('Opaque')); assert.equal(frame.contentWindow.sent.length, sent); assert.equal(dialog.open, false); });
test('No task was submitted throughout all bridge tests', () => assert.equal(submits, 0));
console.log('RESULT ' + tests.length + ' passed 0 failed; DOM/companion stubs, no live provider.');
fs.writeFileSync(path.join(dir, 'host-bridge-results.json'), JSON.stringify({ passed: tests.length, failed: 0, environment: 'Node VM with explicit DOM and companion test stubs; no Astro rendering, authentication or live AI tested.', tests }, null, 2));
