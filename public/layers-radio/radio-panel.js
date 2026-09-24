/**
 * The Layers Radio panel: one UI, two hosts (the standalone trial page and the
 * Layers deck). The host decides what a received mood does to its screen; the
 * panel owns sending, listening, the inbox and the viewer's own call sign.
 *
 * Honesty rules carried from the review brief:
 *  - Sender states are Preparing -> Playing -> Broadcast played. No delivery claim.
 *  - Received moods are tagged UNVERIFIED; a call sign is not an identity.
 *  - The mic opens only on Listen; Stop, Escape, page hidden and pagehide close it.
 *  - Decoded text is rendered with textContent only.
 */
import { MOODS, TEXT_MAX_BYTES, textBudget, createSequence, encodeFrame, hex } from '/layers-radio/radio-frame.js';
import { createRadioController } from '/layers-radio/radio-controller.js';
import { callSign, markSVG } from '/layers-radio/radio-callsign.js';
import { MOOD_COLORS } from '/layers-radio/radio-motifs.js';
import { createRadioAudio } from '/layers-radio/radio-audio.js';

const CSS = `
.pcr{--pcr-fg:#fdf2d6;--pcr-mute:#a79d8c;--pcr-rule:#3a342b;--pcr-field:#221e19;--pcr-gold:#e8b04a;--pcr-red:#e5484d;--pcr-green:#6fbf8e;color:var(--pcr-fg);font:13px/1.45 "Inter Variable",Inter,system-ui,sans-serif}
.pcr *{box-sizing:border-box}
.pcr-you{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.pcr-you .pcr-cs{display:inline-flex;align-items:center;gap:8px;font:700 12px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em}
.pcr-k{font:700 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.2em;color:var(--pcr-mute)}
.pcr-moods{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px;margin:10px 0}
.pcr-mood{all:unset;cursor:pointer;text-align:center;padding:9px 6px;border-radius:6px;border:1px solid var(--pcr-rule);font-weight:650;border-left:4px solid var(--m)}
.pcr-mood:hover{border-color:var(--m)}
.pcr-mood:focus-visible{outline:2px solid var(--pcr-gold);outline-offset:2px}
.pcr-mood[aria-pressed=true]{background:var(--m);color:var(--ink);border-color:var(--m)}
.pcr-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px}
.pcr input[type=text]{flex:1 1 200px;min-width:0;background:var(--pcr-field);color:var(--pcr-fg);border:1px solid var(--pcr-rule);border-radius:4px;padding:8px 9px;font:inherit}
.pcr input[type=text]:focus-visible{outline:2px solid var(--pcr-gold);outline-offset:1px}
.pcr-btn{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:4px;border:1px solid var(--pcr-rule);font:700 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em}
.pcr-btn:hover{border-color:var(--pcr-mute)}
.pcr-btn:focus-visible{outline:2px solid var(--pcr-gold);outline-offset:2px}
.pcr-btn[disabled]{opacity:.45;cursor:default}
.pcr-btn.pcr-send{border-color:#5a2a2a}
.pcr-btn.pcr-send:not([disabled]):hover{background:#3a1c1c}
.pcr-btn.pcr-listen[aria-pressed=true]{background:#5a1f1f;border-color:var(--pcr-red)}
.pcr-btn.pcr-mini{padding:4px 7px;font-size:10px}
.pcr-dot{width:6px;height:6px;border-radius:50%;background:#6b645a}
.pcr-listen[aria-pressed=true] .pcr-dot{background:var(--pcr-red);box-shadow:0 0 6px var(--pcr-red)}
.pcr-status{font:600 11px/1.3 ui-monospace,Menlo,monospace;letter-spacing:.06em;color:var(--pcr-mute)}
.pcr-status b{color:var(--pcr-fg)}
.pcr-budget{font-size:11px;color:var(--pcr-mute);white-space:nowrap}
.pcr-budget.over{color:var(--pcr-red)}
.pcr-meter{height:4px;flex:1 1 80px;min-width:60px;background:var(--pcr-field);border-radius:2px;overflow:hidden}
.pcr-meter i{display:block;height:100%;width:0;background:var(--pcr-green);transition:width .08s}
.pcr-opt{display:flex;gap:8px;align-items:flex-start;margin-top:10px;font-size:12px;color:var(--pcr-mute);cursor:pointer}
.pcr-opt input{margin-top:2px;accent-color:var(--pcr-gold)}
.pcr-inbox{list-style:none;margin:10px 0 0;padding:0}
.pcr-inbox li{display:grid;grid-template-columns:24px 1fr auto;gap:10px;align-items:start;padding:8px 0;border-top:1px solid var(--pcr-rule)}
.pcr-inbox .pcr-chip{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;vertical-align:1px}
.pcr-inbox small{display:block;color:var(--pcr-mute);font-size:11px}
.pcr-inbox .pcr-actions{display:flex;gap:4px}
.pcr-empty{color:var(--pcr-mute);font-size:12px;margin:8px 0 0}
.pcr-tag{font:600 9px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;color:var(--pcr-mute);border:1px solid var(--pcr-rule);border-radius:3px;padding:2px 4px;margin-left:6px}
.pcr details{margin-top:12px;border-top:1px solid var(--pcr-rule);padding-top:8px}
.pcr summary{cursor:pointer;color:var(--pcr-mute);font:700 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.2em}
.pcr select{background:var(--pcr-field);color:var(--pcr-fg);border:1px solid var(--pcr-rule);border-radius:4px;padding:5px}
.pcr pre{background:var(--pcr-field);border:1px solid var(--pcr-rule);border-radius:4px;padding:8px;font:11px/1.4 ui-monospace,Menlo,monospace;max-height:180px;overflow:auto;white-space:pre-wrap;word-break:break-all;margin:8px 0 0}
.pcr-mark{display:block;image-rendering:pixelated}
.pcr-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (prefers-reduced-motion: reduce){.pcr-meter i{transition:none}}
`;

export function injectRadioCSS() {
  if (document.querySelector('style[data-pcr]')) return;
  const s = document.createElement('style'); s.dataset.pcr = ''; s.textContent = CSS; document.head.append(s);
}
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
  }
  n.append(...kids.filter(Boolean));
  return n;
};
const safeStore = s => ({ get: k => { try { return s.getItem(k); } catch { return null; } }, set: (k, v) => { try { s.setItem(k, v); } catch {} } });

/**
 * createRadioPanel({ host, volume, onReceive(frame, callSign, effectsOn), onPreview(moodId, callSign),
 *   onTransmit(seconds), onListenChange(bool), onStop(reason), effectsLabel, effectsDefault, effectsKey })
 */
export function createRadioPanel(opts = {}) {
  const {
    host = 'page', volume = () => 0.9,
    onReceive = () => {}, onPreview = () => {}, onTransmit = () => {}, onListenChange = () => {}, onStop = () => {},
    effectsLabel = 'Chime when a mood arrives', effectsDefault = true, effectsKey = `pcr-effects-${host}`,
  } = opts;
  injectRadioCSS();
  const local = safeStore(globalThis.localStorage), session = safeStore(globalThis.sessionStorage);

  // ---- log ----
  const logEl = el('pre', { 'aria-label': 'Radio log' }, 'ready');
  const log = (...a) => {
    const line = `${new Date().toTimeString().slice(0, 8)} ${a.join(' ')}`;
    logEl.textContent = (logEl.textContent + '\n' + line).split('\n').slice(-40).join('\n');
  };

  // ---- state ----
  const seq = createSequence({ get: () => session.get('pc-radio-seq'), set: v => session.set('pc-radio-seq', v) });
  const muted = new Set((session.get('pc-radio-muted') || '').split(',').filter(Boolean));
  let mood = null, effectsOn = (local.get(effectsKey) ?? (effectsDefault ? '1' : '0')) === '1';
  let meterRaf = 0;

  // ---- DOM ----
  const root = el('div', { class: 'pcr', 'data-pcr-host': host });
  const youMark = el('span');
  const youLabel = el('b');
  const you = el('div', { class: 'pcr-you' },
    el('span', { class: 'pcr-k', text: 'YOUR CALL SIGN' }),
    el('span', { class: 'pcr-cs' }, youMark, youLabel),
    el('button', { class: 'pcr-btn pcr-mini', type: 'button', 'aria-label': 'Play my call sign', onclick: () => { audio.ensureCtx(); audio.playCallSign(seq.alias); } }, '▶ HEAR IT'),
    el('button', { class: 'pcr-btn pcr-mini', type: 'button', 'aria-label': 'Get a new call sign', onclick: () => { seq.reset(); renderYou(); log('new call sign', callSign(seq.alias).label); } }, 'NEW'),
  );
  const renderYou = () => { const cs = callSign(seq.alias); youMark.innerHTML = markSVG(cs, 20); youLabel.textContent = cs.label; };

  const moodsEl = el('div', { class: 'pcr-moods', role: 'group', 'aria-label': 'Mood' });
  for (const m of MOODS) {
    const c = MOOD_COLORS[m.id];
    const b = el('button', { class: 'pcr-mood', type: 'button', 'aria-pressed': 'false', 'data-id': m.id, onclick: () => selectMood(m.id) }, m.name);
    b.style.setProperty('--m', c.hex); b.style.setProperty('--ink', c.ink);
    moodsEl.append(b);
  }
  const note = el('input', { type: 'text', placeholder: 'optional note, up to 32 bytes', 'aria-label': 'Optional note', autocomplete: 'off', maxlength: 64 });
  const budget = el('span', { class: 'pcr-budget', 'aria-live': 'polite' }, `0 / ${TEXT_MAX_BYTES} bytes`);
  const sendBtn = el('button', { class: 'pcr-btn pcr-send', type: 'button', disabled: true }, 'SEND');
  const previewBtn = el('button', { class: 'pcr-btn', type: 'button', disabled: true, 'aria-describedby': 'pcr-preview-hint' }, 'PREVIEW');
  const previewHint = el('span', { id: 'pcr-preview-hint', class: 'pcr-sr', text: 'Plays the mood on this device only. Nothing is broadcast.' });
  const sendStatus = el('span', { class: 'pcr-status', 'aria-live': 'polite' }, 'Pick a mood.');
  const listenBtn = el('button', { class: 'pcr-btn pcr-listen', type: 'button', 'aria-pressed': 'false' }, el('span', { class: 'pcr-dot' }), 'LISTEN');
  const stopBtn = el('button', { class: 'pcr-btn', type: 'button' }, 'STOP');
  const listenStatus = el('span', { class: 'pcr-status', 'aria-live': 'polite' }, 'Mic closed.');
  const meterFill = el('i');
  const effects = el('input', { type: 'checkbox', 'aria-label': effectsLabel }); effects.checked = effectsOn;
  effects.addEventListener('change', () => { effectsOn = effects.checked; local.set(effectsKey, effectsOn ? '1' : '0'); });
  const inbox = el('ol', { class: 'pcr-inbox', 'aria-live': 'polite', 'aria-label': 'Received moods' });
  const empty = el('p', { class: 'pcr-empty' }, 'Nothing heard yet. Press Listen, then send a mood from another device nearby.');
  const proto = el('select', { 'aria-label': 'Speed' },
    el('option', { value: 'GGWAVE_PROTOCOL_AUDIBLE_FAST', selected: true }, 'audible fast (default)'),
    el('option', { value: 'GGWAVE_PROTOCOL_AUDIBLE_NORMAL' }, 'audible normal (slower, sturdier)'));
  const loopBtn = el('button', { class: 'pcr-btn pcr-mini', type: 'button', disabled: true }, 'SOFTWARE LOOPBACK');
  const loopStatus = el('span', { class: 'pcr-status' });

  root.append(
    you, moodsEl,
    el('div', { class: 'pcr-row' }, note, budget),
    el('div', { class: 'pcr-row' }, sendBtn, previewBtn, previewHint, sendStatus),
    el('div', { class: 'pcr-row' }, listenBtn, stopBtn, listenStatus, el('span', { class: 'pcr-meter', 'aria-hidden': 'true' }, meterFill)),
    el('label', { class: 'pcr-opt' }, effects, el('span', { text: effectsLabel })),
    inbox, empty,
    el('details', {},
      el('summary', {}, 'DETAILS'),
      el('div', { class: 'pcr-row' }, el('span', { class: 'pcr-k', text: 'SPEED' }), proto),
      el('div', { class: 'pcr-row' }, loopBtn, loopStatus),
      el('p', { class: 'pcr-empty', text: 'Loopback encodes and decodes on this device in software. It checks the codec, not the room.' }),
      logEl),
  );

  // ---- audio + controller ----
  const audio = createRadioAudio({ log, volume, onTrackEnded: () => radio.stopListen('mic ended') });
  const radio = createRadioController({
    seq,
    encodeWave: (bytes, p) => audio.encodeWave(bytes, p),
    playWave: (wave, meta) => { const h = audio.playTransmission(wave, meta); try { onTransmit(h.seconds); } catch {} return h; },
    playMotif: m => audio.playMotif(m, { gain: volume() * 0.8 }),
    requestMic: () => audio.requestMic(),
    attachMic: (s, onFrame) => audio.attachMic(s, onFrame),
    detachMic: () => audio.detachMic(),
    decodeSamples: f => audio.decodeSamples(f),
    log,
    onState(kind, text) {
      if (kind === 'listen') {
        listenStatus.textContent = text;
        const on = radio.state.listening;
        listenBtn.setAttribute('aria-pressed', String(on));
        if (on && !meterRaf) meterLoop(); else if (!on) { cancelAnimationFrame(meterRaf); meterRaf = 0; meterFill.style.width = '0'; }
        try { onListenChange(on); } catch {}
      } else if (kind !== 'idle') {
        sendStatus.innerHTML = '';
        const m = /^(Preparing|Playing|Broadcast played)(.*)$/.exec(text);
        if (m) sendStatus.append(el('b', { text: m[1] }), m[2]); else sendStatus.textContent = text;
      }
      refresh();
    },
    onReceive(d) {
      if (muted.has(d.alias)) { log('muted call sign ignored', d.alias.slice(0, 4)); return; }
      addToInbox(d);
      try { onReceive(d, callSign(d.aliasBytes), effectsOn); } catch (e) { log('receive effect error', e.message); }
    },
  });

  function meterLoop() { meterRaf = requestAnimationFrame(meterLoop); meterFill.style.width = Math.min(100, audio.level() * 300) + '%'; }

  function selectMood(id) {
    mood = id;
    moodsEl.querySelectorAll('.pcr-mood').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.id === id)));
    refresh();
  }
  function refresh() {
    const b = textBudget(note.value);
    budget.textContent = b.over ? `${b.bytes} / ${TEXT_MAX_BYTES} bytes, ${b.over} over` : `${b.bytes} / ${TEXT_MAX_BYTES} bytes`;
    budget.classList.toggle('over', b.over > 0);
    const busy = radio.state.sending || radio.state.previewing;
    sendBtn.disabled = !mood || b.over > 0 || busy;
    previewBtn.disabled = !mood || busy;
    loopBtn.disabled = !mood || b.over > 0 || busy;
  }
  note.addEventListener('input', refresh);
  note.addEventListener('keydown', e => { if (e.key === 'Enter' && !sendBtn.disabled) { e.preventDefault(); sendBtn.click(); } });

  function addToInbox(d) {
    empty.hidden = true;
    const cs = callSign(d.aliasBytes), c = MOOD_COLORS[d.mood];
    const body = el('div');
    const chip = el('span', { class: 'pcr-chip' }); chip.style.background = c.hex;
    body.append(chip, el('b', { text: d.moodName }));
    if (d.text) body.append(' ', el('span', { text: d.text }));
    body.append(el('span', { class: 'pcr-tag', text: 'UNVERIFIED' }));
    body.append(el('small', { text: `call sign ${cs.label} · #${d.messageId} · ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` }));
    const actions = el('div', { class: 'pcr-actions' },
      el('button', { class: 'pcr-btn pcr-mini', type: 'button', 'aria-label': `Hear call sign ${cs.label}`, onclick: () => { audio.ensureCtx(); audio.playCallSign(d.aliasBytes); } }, '▶'),
      el('button', { class: 'pcr-btn pcr-mini', type: 'button', 'aria-label': `Mute call sign ${cs.label}`, onclick: ev => { muted.add(d.alias); session.set('pc-radio-muted', [...muted].join(',')); ev.currentTarget.textContent = 'MUTED'; ev.currentTarget.disabled = true; log('muted', cs.label); } }, 'MUTE'));
    const li = el('li', {}, el('span', { html: markSVG(cs, 24) }), body, actions);
    inbox.prepend(li);
    while (inbox.children.length > 10) inbox.lastChild.remove();
  }

  // ---- actions ----
  sendBtn.addEventListener('click', async () => {
    audio.ensureCtx();                                 // inside the gesture, before any await (iOS)
    if (!audio.codecReady) sendStatus.textContent = 'Loading the sound codec…';
    try { await audio.loadCodec(); } catch (e) { sendStatus.textContent = 'Could not load the sound codec. Check your connection and try again.'; log(e.message); return; }
    const r = await radio.send({ mood, text: note.value, protocol: proto.value });
    if (r.ok) log('sent', `${r.bytes.length} B`, hex(r.bytes));
  });
  previewBtn.addEventListener('click', () => {
    audio.ensureCtx();
    try { onPreview(mood, callSign(seq.alias)); } catch {}
    radio.preview({ mood });
  });
  listenBtn.addEventListener('click', async () => {
    if (radio.state.listening || radio.state.pending) { radio.stopListen('stopped'); return; }
    audio.ensureCtx();
    if (!audio.codecReady) listenStatus.textContent = 'Loading the sound codec…';
    try { await audio.loadCodec(); } catch (e) { listenStatus.textContent = 'Could not load the sound codec. Check your connection and try again.'; log(e.message); return; }
    radio.startListen();
  });
  stopBtn.addEventListener('click', () => stop('stop'));
  loopBtn.addEventListener('click', async () => {
    audio.ensureCtx();
    try { await audio.loadCodec(); } catch (e) { loopStatus.textContent = 'Codec failed to load.'; return; }
    const bytes = encodeFrame({ alias: seq.alias, messageId: seq.take(), mood, text: note.value });
    const { found, seconds, rate } = audio.softwareLoopback(bytes, proto.value);
    const ok = found.length === 1 && hex(found[0]) === hex(bytes);
    loopStatus.textContent = `${ok ? 'exact' : 'mismatch'} · ${bytes.length} B · ${seconds.toFixed(2)} s at ${rate} Hz (codec only)`;
    log('loopback', ok ? 'exact' : 'MISMATCH', `${bytes.length} B`, `${seconds.toFixed(3)} s`, `${rate} Hz`);
  });

  function stop(reason) { radio.stopRadio(reason); try { onStop(reason); } catch {} }

  renderYou();
  refresh();
  return {
    el: root, radio, audio, stop,
    get listening() { return radio.state.listening; },
    get callSign() { return callSign(seq.alias); },
  };
}
