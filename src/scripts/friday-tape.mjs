// /friday-tape page script. Reads Shwa's live feed when it exists, otherwise keeps
// the checked snapshot already printed in the HTML. No storage, no beacons, no wallet connect.
import {
  normalizeTape,
  canonicalText,
  sha256Hex,
  receiptHtml,
  keepsakeSvg,
  yoursLine,
} from '../lib/friday-tape-ui.mjs';

const reduced = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

async function svgToPng(svg, width = 1080, height = 1350) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function mountFridayTape(root, { fallback, feedUrl = '/friday-tape.json' } = {}) {
  const paper = root.querySelector('[data-ft-paper]');
  const form = root.querySelector('[data-ft-yours]');
  const keep = root.querySelector('[data-ft-keep]');
  const live = root.querySelector('[data-ft-live]');
  const status = root.querySelector('[data-ft-source]');
  const snapshot = normalizeTape(fallback);
  if (!paper || !snapshot || root.dataset.ftMounted) return;
  root.dataset.ftMounted = '1';

  const state = { tape: snapshot, source: 'snapshot', yours: null, torn: false, digest: '', urls: [] };
  const say = (msg) => { if (live) live.textContent = msg; };

  async function paint({ animate = false } = {}) {
    state.digest = await sha256Hex(canonicalText(state.tape, state.yours ? [state.yours] : []));
    paper.innerHTML = receiptHtml(state.tape, { digest: state.digest, source: state.source, yours: state.yours, torn: state.torn });
    paper.dataset.digest = state.digest;
    if (animate && !reduced()) {
      paper.classList.remove('is-printing');
      void paper.offsetWidth;
      paper.classList.add('is-printing');
    }
  }

  // Live feed: only replaces the snapshot when it parses as RECEIPTLINE v1 with at least one sourced line.
  try {
    const res = await fetch(feedUrl, { cache: 'no-store', headers: { accept: 'application/json' } });
    const type = res.headers.get('content-type') || '';
    if (res.ok && type.includes('json')) {
      const tape = normalizeTape(await res.json());
      if (tape) {
        state.tape = tape;
        state.source = 'live';
      }
    }
  } catch {
    /* stay on the snapshot */
  }
  if (status) {
    status.textContent =
      state.source === 'live'
        ? 'Printing from the live feed at /friday-tape.json.'
        : 'Printing from a dated snapshot. Shwa’s live feed at /friday-tape.json is not up yet.';
  }
  await paint({ animate: true });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const line = yoursLine(String(data.get('mode') || 'didnt'), String(data.get('line') || ''));
    if (!line) {
      say('Type a few words first.');
      form.querySelector('input[type="text"]')?.focus();
      return;
    }
    state.yours = line;
    state.torn = false;
    if (keep) keep.hidden = true;
    await paint({ animate: true });
    say(`Printed your line: ${line.label}. The barcode now covers it too.`);
    paper.querySelector('.ft-line--yours')?.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  });

  root.addEventListener('click', async (event) => {
    const tear = event.target.closest?.('[data-ft-tear]');
    if (!tear) return;
    state.torn = true;
    await paint();
    if (!reduced()) {
      paper.classList.remove('is-torn-off');
      void paper.offsetWidth;
      paper.classList.add('is-torn-off');
    }
    await makeKeepsake();
  });

  async function makeKeepsake() {
    if (!keep) return;
    state.urls.forEach((u) => URL.revokeObjectURL(u));
    state.urls = [];
    const svg = keepsakeSvg(state.tape, { digest: state.digest, yours: state.yours, tornAt: new Date().toISOString() });
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    state.urls.push(svgUrl);
    const png = await svgToPng(svg);
    const pngUrl = png ? URL.createObjectURL(png) : '';
    if (pngUrl) state.urls.push(pngUrl);
    const stamp = `pointcast-anti-receipt-${state.tape.date}-${state.digest.slice(0, 8)}`;

    const img = keep.querySelector('img');
    if (img) img.src = pngUrl || svgUrl;
    const aPng = keep.querySelector('[data-ft-png]');
    const aSvg = keep.querySelector('[data-ft-svg]');
    if (aPng) {
      aPng.hidden = !pngUrl;
      aPng.href = pngUrl;
      aPng.download = `${stamp}.png`;
    }
    if (aSvg) {
      aSvg.href = svgUrl;
      aSvg.download = `${stamp}.svg`;
    }
    const share = keep.querySelector('[data-ft-share]');
    if (share) {
      const file = png ? new File([png], `${stamp}.png`, { type: 'image/png' }) : null;
      const can = !!(file && navigator.canShare?.({ files: [file] }));
      share.hidden = !can;
      share.onclick = can
        ? () => navigator.share({ files: [file], title: 'PointCast anti-receipt', text: 'What the town made today. pointcast.xyz/friday-tape' }).catch(() => {})
        : null;
    }
    keep.hidden = false;
    say('Torn. Your keepsake is ready to save below.');
    keep.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
  }
}
