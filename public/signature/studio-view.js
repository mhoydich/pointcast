/**
 * DOM for /signature. All layout, hashing, signing and the devnet post live
 * in studio.js. Text from the devnet is written with textContent. The SVG is
 * parsed and adopted, not assigned as HTML.
 */

import {
  connectPinned,
  describeError,
  ed25519Works,
  forgetSeed,
  keyFromSeed,
  loadStoredSeed,
  makeNet,
  newSeedHex,
  pinnedStatus,
  resolveApi,
  sendFailureText,
  storeSeed,
} from '../chain/apps/chain-kit.js';
import {
  KEY_SLOT,
  assertSafeSvg,
  editionsSummary,
  emailSnippet,
  hashBytes,
  inlineSvgSnippet,
  layoutDrawn,
  layoutTyped,
  layoutUpload,
  planRecord,
  recordSignature,
  signStatement,
  txLinks,
  verifyStatement,
} from './studio.js';

const q = (root, sel) => root.querySelector(sel);
const text = (node, value) => { if (node) node.textContent = value; };

function showSvg(host, svg) {
  const safe = assertSafeSvg(svg);
  const doc = new DOMParser().parseFromString(safe, 'image/svg+xml');
  if (!doc.documentElement || doc.documentElement.tagName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) {
    throw new Error('the signature SVG did not parse');
  }
  host.replaceChildren(host.ownerDocument.importNode(doc.documentElement, true));
}

async function rasterize(svg, width, height) {
  const safe = assertSafeSvg(svg);
  const url = URL.createObjectURL(new Blob([safe], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('the browser could not draw that SVG'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = Math.max(1, Math.ceil(width * scale));
    canvas.height = Math.max(1, Math.ceil(height * scale));
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!png) throw new Error('this browser did not return a PNG');
    return { png, bytes: new Uint8Array(await png.arrayBuffer()) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function download(blob, name) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function start(root) {
  const stage = q(root, '[data-stage]');
  const missing = q(root, '[data-missing]');
  const note = q(root, '[data-note]');
  const name = q(root, '[data-name]');
  const fontSel = q(root, '[data-font]');
  const size = q(root, '[data-size]');
  const slant = q(root, '[data-slant]');
  const weight = q(root, '[data-weight]');
  const color = q(root, '[data-color]');
  const flourish = q(root, '[data-flourish]');
  const pen = q(root, '[data-pen]');
  const pad = q(root, '[data-pad]');
  const file = q(root, '[data-file]');
  const typePanel = q(root, '[data-panel="type"]');
  const drawPanel = q(root, '[data-panel="draw"]');
  const uploadPanel = q(root, '[data-panel="upload"]');
  const hashOut = q(root, '[data-hash-out]');
  const signedOut = q(root, '[data-signed]');
  const verifyOut = q(root, '[data-verify-out]');
  const bodyOut = q(root, '[data-body]');
  const recordOut = q(root, '[data-record-out]');
  const chainStatus = q(root, '[data-chain-status]');
  const editions = q(root, '[data-editions]');
  const sendBtn = q(root, '[data-send]');
  const artifactActions = root.querySelectorAll('[data-png], [data-svg], [data-copy-svg], [data-copy-png], [data-copy-html], [data-copy-inline], [data-hash], [data-sign], [data-prepare]');
  let renderVersion = 0;
  const where = resolveApi(window.location.search, { api: root.dataset.api, genesis: root.dataset.genesis });

  const S = {
    mode: 'type',
    font: null,
    fonts: new Map(),
    points: [],
    drawing: false,
    upload: null,
    svg: '',
    width: 0,
    height: 0,
    kind: 'typed',
    png: null,
    hash: '',
    plan: null,
    key: null,
    chain: null,
  };

  function controls() {
    return {
      size: Number(size.value),
      slant: Number(slant.value),
      weight: Number(weight.value),
      color: color.value,
      flourish: flourish.checked,
    };
  }

  function invalidate() {
    renderVersion += 1;
    S.svg = '';
    S.width = 0;
    S.height = 0;
    S.png = null;
    S.hash = '';
    S.plan = null;
    text(hashOut, '');
    text(signedOut, '');
    text(bodyOut, '');
    text(recordOut, '');
    stage.replaceChildren();
    for (const button of artifactActions) button.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    return renderVersion;
  }

  async function loadFont(id) {
    if (S.fonts.has(id)) return S.fonts.get(id);
    const res = await fetch('/signature/paths/' + id + '.json', { cache: 'force-cache' });
    if (!res.ok) throw new Error('the outlines for ' + id + ' did not load (' + res.status + ')');
    const json = await res.json();
    S.fonts.set(id, json);
    return json;
  }

  async function render() {
    const version = invalidate();
    const mode = S.mode;
    const fontId = fontSel.value;
    const typedText = name.value || 'PointCast';
    const settings = controls();
    try {
      let laid;
      let kind;
      let message = '';
      if (mode === 'type') {
        const font = await loadFont(fontId);
        if (version !== renderVersion) return;
        laid = layoutTyped({ font, text: typedText, ...settings });
        S.font = font;
        message = laid.missing.length ? 'This face has no glyph for: ' + laid.missing.join(' ') : '';
        kind = 'typed';
      } else if (mode === 'draw') {
        laid = layoutDrawn(S.points, { minWidth: 1.2, maxWidth: Number(pen.value), color: settings.color, flourish: settings.flourish });
        kind = 'drawn';
      } else {
        if (!S.upload) { text(missing, 'Choose an image.'); return; }
        laid = S.upload;
        message = 'An upload stays a picture. The SVG wraps it. It is not a traced vector.';
        kind = 'upload';
      }
      if (version !== renderVersion) return;
      showSvg(stage, laid.svg);
      S.svg = laid.svg;
      S.width = laid.width;
      S.height = laid.height;
      S.kind = kind;
      text(missing, message);
      text(note, kind === 'upload' ? 'PNG export re-encodes the picture on a transparent canvas.' : 'PNG is a transparent raster of this SVG.');
      for (const button of artifactActions) button.disabled = false;
    } catch (e) {
      if (version !== renderVersion) return;
      if (e && e.code === 'empty' && mode === 'draw') {
        text(missing, 'Draw on the pad. Lift your pointer and the stroke becomes the signature.');
        return;
      }
      text(missing, e && e.message ? e.message : 'Could not draw that.');
    }
  }

  function setMode(mode) {
    S.mode = mode;
    typePanel.hidden = mode !== 'type';
    drawPanel.hidden = mode !== 'draw';
    uploadPanel.hidden = mode !== 'upload';
    for (const btn of root.querySelectorAll('[data-mode-set]')) btn.setAttribute('aria-pressed', btn.dataset.modeSet === mode ? 'true' : 'false');
    render();
  }

  function pointFrom(ev) {
    const r = pad.getBoundingClientRect();
    const src = ev;
    return { x: src.clientX - r.left, y: src.clientY - r.top, t: ev.timeStamp, pressure: typeof ev.pressure === 'number' ? ev.pressure : null };
  }

  function paintPad() {
    const ctx = pad.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = pad.clientWidth;
    const h = pad.clientHeight;
    if (pad.width !== Math.floor(w * dpr) || pad.height !== Math.floor(h * dpr)) {
      pad.width = Math.floor(w * dpr);
      pad.height = Math.floor(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color.value;
    ctx.lineWidth = Number(pen.value) * 0.6;
    ctx.beginPath();
    S.points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.stroke();
  }

  if (pad) {
    pad.addEventListener('pointerdown', (ev) => {
      try { pad.setPointerCapture(ev.pointerId); } catch { /* some browsers refuse capture on this event */ }
      S.drawing = true;
      invalidate();
      S.points = [pointFrom(ev)];
      paintPad();
    });
    pad.addEventListener('pointermove', (ev) => {
      if (!S.drawing) return;
      const batch = typeof ev.getCoalescedEvents === 'function' ? ev.getCoalescedEvents() : [ev];
      for (const e of batch) S.points.push(pointFrom(e));
      paintPad();
    });
    const end = () => { if (!S.drawing) return; S.drawing = false; render(); };
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
  }

  q(root, '[data-clear]')?.addEventListener('click', () => { S.points = []; paintPad(); render(); });

  file?.addEventListener('change', () => {
    const version = invalidate();
    S.upload = null;
    const f = file.files && file.files[0];
    if (!f) { text(missing, 'Choose an image.'); return; }
    if (!/^image\/(png|jpeg|gif|webp)$/.test(f.type)) { text(missing, 'Upload a PNG, JPEG, GIF or WebP.'); return; }
    text(missing, 'Reading the image…');
    const failed = () => {
      if (version === renderVersion) text(missing, 'The image could not be read. Choose a PNG, JPEG, GIF or WebP.');
    };
    const reader = new FileReader();
    reader.onerror = failed;
    reader.onload = () => {
      if (version !== renderVersion) return;
      const img = new Image();
      img.onerror = failed;
      img.onload = () => {
        if (version !== renderVersion) return;
        const max = 1400;
        const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        try {
          S.upload = layoutUpload({ dataUrl: String(reader.result), width: img.naturalWidth * scale, height: img.naturalHeight * scale });
          setMode('upload');
        } catch (e) { text(missing, e.message); }
      };
      img.src = String(reader.result);
    };
    try { reader.readAsDataURL(f); } catch { failed(); }
  });

  for (const btn of root.querySelectorAll('[data-mode-set]')) btn.addEventListener('click', () => setMode(btn.dataset.modeSet));
  for (const el of [name, fontSel, size, slant, weight, color, flourish, pen]) el?.addEventListener('input', () => { if (S.mode === 'draw' && el === color) paintPad(); render(); });

  async function png() {
    if (!S.svg) throw new Error('Make a mark before exporting or hashing it.');
    const version = renderVersion;
    const result = S.png || await rasterize(S.svg, S.width, S.height);
    if (version !== renderVersion) throw new Error('The mark changed. Try again with the current preview.');
    S.png = result;
    return result;
  }

  q(root, '[data-png]')?.addEventListener('click', async () => {
    try { const { png: blob } = await png(); download(blob, 'signature.png'); text(note, 'Downloaded signature.png.'); }
    catch (e) { text(note, e.message); }
  });
  q(root, '[data-svg]')?.addEventListener('click', () => {
    if (!S.svg) return;
    download(new Blob([S.svg], { type: 'image/svg+xml' }), 'signature.svg');
    text(note, S.kind === 'upload' ? 'Downloaded an SVG that embeds the picture. The paths are not traced.' : 'Downloaded signature.svg. Typed and drawn marks are vector paths.');
  });
  q(root, '[data-copy-svg]')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(S.svg); text(note, 'SVG copied.'); }
    catch { text(note, 'Clipboard refused the SVG. Use Download SVG.'); }
  });
  q(root, '[data-copy-html]')?.addEventListener('click', async () => {
    const html = emailSnippet({ width: Math.min(420, S.width || 280), alt: name.value || 'Signature' });
    try { await navigator.clipboard.writeText(html); text(note, 'Email HTML copied. Attach signature.png. The snippet does not embed the image, because most mail clients strip data URIs.'); }
    catch { text(note, html); }
  });
  q(root, '[data-copy-png]')?.addEventListener('click', async () => {
    try {
      const { png: blob } = await png();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        text(note, 'PNG copied to the clipboard.');
      } else throw new Error('no image clipboard');
    } catch { text(note, 'This browser did not copy the PNG. Download it instead.'); }
  });
  q(root, '[data-copy-inline]')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(inlineSvgSnippet(S.svg)); text(note, 'Inline SVG snippet copied. Webmail may remove it.'); }
    catch { text(note, 'Clipboard refused the snippet.'); }
  });

  q(root, '[data-hash]')?.addEventListener('click', async () => {
    const version = renderVersion;
    try {
      const { bytes } = await png();
      const hash = await hashBytes(bytes);
      if (version !== renderVersion) return;
      S.hash = hash;
      text(hashOut, 'sha256 ' + S.hash + '\n' + bytes.length + ' bytes of PNG. Change the mark and this hash is no longer the one you sign or record.');
      hashOut.dataset.state = 'ok';
    } catch (e) {
      hashOut.dataset.state = 'bad';
      text(hashOut, e.message);
    }
  });

  q(root, '[data-sign]')?.addEventListener('click', async () => {
    const version = renderVersion;
    try {
      if (!S.hash) {
        const { bytes } = await png();
        const hash = await hashBytes(bytes);
        if (version !== renderVersion) return;
        S.hash = hash;
        text(hashOut, 'sha256 ' + S.hash);
      }
      if (!S.key) throw new Error('Make a key first. It stays in this browser.');
      const signed = await signStatement({ key: S.key, statement: q(root, '[data-statement]').value, pngSha256: S.hash });
      if (version !== renderVersion) return;
      text(signedOut, [
        signed.canonical,
        '',
        'public key ' + signed.publicKey,
        'address ' + signed.address,
        'signature ' + signed.signature,
      ].join('\n'));
      signedOut.dataset.state = 'ok';
      const pk = q(root, '[data-v-pk]');
      const sig = q(root, '[data-v-sig]');
      const blob = q(root, '[data-v-text]');
      if (pk && !pk.value) pk.value = signed.publicKey;
      if (sig && !sig.value) sig.value = signed.signature;
      if (blob && !blob.value) blob.value = signed.canonical;
    } catch (e) {
      signedOut.dataset.state = 'bad';
      text(signedOut, e.message);
    }
  });

  q(root, '[data-verify]')?.addEventListener('click', async () => {
    const result = await verifyStatement({
      canonical: q(root, '[data-v-text]').value,
      publicKey: q(root, '[data-v-pk]').value.trim(),
      signature: q(root, '[data-v-sig]').value.trim(),
    });
    verifyOut.dataset.state = result.ok ? 'ok' : 'bad';
    text(verifyOut, result.reason);
  });

  async function ensureKeyBits() {
    const supported = await ed25519Works();
    const status = q(root, '[data-key-status]');
    const addr = q(root, '[data-key-address]');
    if (!supported) { text(status, 'This browser cannot make an ed25519 key. Use a current Chrome, Edge, Safari or Firefox.'); return; }
    const stored = loadStoredSeed(window.localStorage, KEY_SLOT);
    if (stored) {
      S.key = await keyFromSeed(stored);
      q(root, '[data-key-keep]').checked = true;
    }
    text(status, S.key ? 'This key signs as ' + S.key.sender + '. It is a devnet play key. It is not stored on a server.' : 'No key yet. Make one in this browser. Leave “Keep it on this device” off and it dies with the tab.');
    text(addr, S.key ? S.key.sender : '');
  }

  q(root, '[data-key-make]')?.addEventListener('click', async () => {
    S.key = await keyFromSeed(newSeedHex());
    const keep = q(root, '[data-key-keep]');
    if (keep && keep.checked) storeSeed(window.localStorage, KEY_SLOT, S.key.seedHex);
    else forgetSeed(window.localStorage, KEY_SLOT);
    text(q(root, '[data-key-status]'), 'This key signs as ' + S.key.sender + '. Only a signature leaves the browser.');
    text(q(root, '[data-key-address]'), S.key.sender);
    q(root, '[data-key-seed]').hidden = true;
  });
  q(root, '[data-key-keep]')?.addEventListener('change', (ev) => {
    if (!S.key) return;
    if (ev.target.checked) storeSeed(window.localStorage, KEY_SLOT, S.key.seedHex);
    else forgetSeed(window.localStorage, KEY_SLOT);
  });
  q(root, '[data-key-show]')?.addEventListener('click', () => {
    const box = q(root, '[data-key-seed]');
    if (!S.key || !box) return;
    box.hidden = !box.hidden;
    box.value = box.hidden ? '' : S.key.seedHex;
  });
  q(root, '[data-key-forget]')?.addEventListener('click', () => {
    S.key = null;
    forgetSeed(window.localStorage, KEY_SLOT);
    text(q(root, '[data-key-status]'), 'Forgotten in this tab. If it was only in memory, it is gone.');
    text(q(root, '[data-key-address]'), '');
    const box = q(root, '[data-key-seed]');
    if (box) { box.value = ''; box.hidden = true; }
  });

  q(root, '[data-prepare]')?.addEventListener('click', async () => {
    const version = renderVersion;
    try {
      const { bytes } = await png();
      const hash = await hashBytes(bytes);
      if (version !== renderVersion) return;
      S.hash = hash;
      text(hashOut, 'sha256 ' + S.hash);
      S.plan = planRecord({
        sha256: S.hash,
        kind: S.kind,
        font: S.kind === 'typed' ? fontSel.value : '',
        bytes: bytes.length,
        label: q(root, '[data-label]').value,
        svg: S.kind === 'upload' ? '' : S.svg,
        media: q(root, '[data-media]').value,
      });
      text(bodyOut, 'Channel ' + S.plan.channel + '\nTitle ' + S.plan.title + '\n\n' + S.plan.body);
      bodyOut.dataset.state = 'ok';
      if (sendBtn) sendBtn.disabled = false;
      text(recordOut, (S.plan.body.includes('\nsvg:omitted')
        ? 'The SVG stays on this page. The devnet’s word filter reads digits as letters, and a real outline trips it. The post keeps the hash. '
        : '') + 'Nothing has been sent. Read the post above. Sign and send posts it to the public devnet with your key.');
    } catch (e) {
      S.plan = null;
      if (sendBtn) sendBtn.disabled = true;
      bodyOut.dataset.state = 'bad';
      text(bodyOut, e.message);
    }
  });

  q(root, '[data-send]')?.addEventListener('click', async () => {
    if (!S.plan) { text(recordOut, 'Prepare the post first.'); return; }
    if (!S.key) { text(recordOut, 'Make a key first.'); return; }
    const version = renderVersion;
    const plan = S.plan;
    const key = S.key;
    sendBtn.disabled = true;
    try {
      if (!S.chain) {
        text(chainStatus, 'Reading the devnet…');
        const net = makeNet(where.api);
        const st = await pinnedStatus(net, where.genesis);
        text(chainStatus, 'Public devnet ' + st.chainId + ', height ' + st.height + '. It may reset.');
        S.chain = await connectPinned(where.api, { pinned: where.genesis });
      }
      if (version !== renderVersion || S.plan !== plan || S.key !== key) {
        sendBtn.disabled = !S.plan || !S.svg;
        return;
      }
      const done = await recordSignature({
        chain: S.chain,
        key,
        plan,
        onStage: (s) => text(recordOut, s === 'signed' ? 'Signed in the browser. Sending…' : s === 'sent' ? 'The devnet accepted it. Waiting for a block…' : 'Waiting…'),
      });
      const links = txLinks(where.api, done.txHash);
      recordOut.dataset.state = 'ok';
      text(recordOut, 'Recorded in block ' + done.height + '.\nTransaction ' + done.txHash + '\n' + links.tx);
      const box = q(root, '[data-links]');
      if (box) {
        box.hidden = false;
        box.replaceChildren();
        for (const [label, href] of [['Transaction', links.tx], ['Feed', links.feed], ['Verify a block', links.verify]]) {
          const a = document.createElement('a');
          a.href = href;
          a.textContent = label;
          if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noreferrer'; }
          box.append(a, ' ');
        }
      }
      if (S.plan === plan) S.plan = null;
    } catch (e) {
      recordOut.dataset.state = 'bad';
      text(recordOut, e && e.sendState ? sendFailureText(e) : describeError(e));
      sendBtn.disabled = !S.plan || !S.svg;
    }
  });

  async function readChain() {
    try {
      const net = makeNet(where.api);
      const st = await pinnedStatus(net, where.genesis);
      text(chainStatus, where.override
        ? 'Reading a local devnet at ' + where.api + '. Height ' + st.height + '.'
        : 'Public devnet ' + st.chainId + ', height ' + st.height + '. ' + (st.mayReset ? 'It may reset.' : ''));
      const ed = await net.get('/editions');
      const sum = editionsSummary(ed);
      text(editions, sum.lines.join('\n'));
    } catch (e) {
      text(chainStatus, describeError(e));
    }
  }

  ensureKeyBits();
  setMode('type');
  readChain();
}
