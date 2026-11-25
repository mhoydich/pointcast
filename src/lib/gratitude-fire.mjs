// Thanksgiving variant of the fragment-link pattern in shareables PR #1901.
// The page supplies the existing Hearth SVG; words never become HTML or SVG.
export const DEFAULT_LINE = 'thankful for the people who keep a light on.';
export const MAX_LINE_LENGTH = 140;
export const MAX_HASH_LENGTH = 2400;
export const PICTURE_WIDTH = 1200;
export const PICTURE_HEIGHT = 630;

export function normalizeLine(value) {
  const text = String(value ?? '').replace(/[\u0000-\u001f\u007f]/gu, ' ').replace(/\s+/gu, ' ').trim();
  // Count Unicode code points so a limit never leaves half of an emoji.
  return Array.from(text, char => /^[\uD800-\uDFFF]$/u.test(char) ? '\uFFFD' : char)
    .slice(0, MAX_LINE_LENGTH).join('').trim();
}

export function lineFromHash(hash = '') {
  if (hash.length > MAX_HASH_LENGTH) return DEFAULT_LINE;
  try { decodeURIComponent(hash); } catch { return DEFAULT_LINE; }
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (params.get('fire') !== 'hearth') return DEFAULT_LINE;
  return normalizeLine(params.get('line')) || DEFAULT_LINE;
}

export function shareUrl(base, line) {
  const url = new URL(base);
  url.username = url.password = url.search = '';
  url.hash = new URLSearchParams({ fire: 'hearth', line: normalizeLine(line) || DEFAULT_LINE }).toString();
  return url.href;
}

/** Wrap even a single long word; preserve whole graphemes when measuring. */
export function layoutLines(context, text, maxWidth) {
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const characters = segmenter ? [...segmenter.segment(text)].map(part => part.segment) : Array.from(text);
  const lines = [];
  let current = '';
  for (const character of characters) {
    if (current && context.measureText(current + character).width > maxWidth) {
      const space = current.lastIndexOf(' ');
      if (space > 0 && character !== ' ') {
        lines.push(current.slice(0, space));
        current = current.slice(space + 1) + character;
      } else {
        lines.push(current.trim());
        current = character.trimStart();
      }
    } else current += character;
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

/** Native canvas only: exact Hearth paths, local fonts, no remote images. */
export function drawPicture(canvas, svg, line) {
  canvas.width = PICTURE_WIDTH;
  canvas.height = PICTURE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Picture drawing is unavailable.');
  const view = canvas.ownerDocument.defaultView;
  context.fillStyle = '#14110F';
  context.fillRect(0, 0, PICTURE_WIDTH, PICTURE_HEIGHT);
  context.imageSmoothingEnabled = false;
  context.save();
  context.translate(544, 100);
  context.scale(14, 14);
  for (const path of svg.querySelectorAll('path')) {
    context.fillStyle = view.getComputedStyle(path).fill;
    context.fill(new view.Path2D(path.getAttribute('d')));
  }
  context.restore();

  const text = normalizeLine(line) || DEFAULT_LINE;
  let lines, size = 48;
  do {
    context.font = `${size}px Georgia, serif`;
    lines = layoutLines(context, text, 1008);
    if (lines.length <= 3 || size <= 24) break;
    size -= 2;
  } while (true);
  context.fillStyle = '#F4EDE4';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const lineHeight = size * 1.3;
  const top = 414 - (lines.length - 1) * lineHeight / 2;
  lines.forEach((words, i) => context.fillText(words, 600, top + i * lineHeight));
}

export function mountGratitudeFire(document, window) {
  const get = id => document.getElementById(id);
  const maker = get('maker');
  const words = get('words');
  const line = get('line');
  const status = get('status');
  const fallback = get('fallback');
  const link = get('link');
  const save = get('save');
  const counter = get('count');
  const currentLine = () => normalizeLine(words.value) || DEFAULT_LINE;

  function update() {
    const normalized = normalizeLine(words.value);
    if (Array.from(words.value).length > MAX_LINE_LENGTH) words.value = normalized;
    line.textContent = normalized || DEFAULT_LINE;
    counter.textContent = `${Array.from(normalized).length} / ${MAX_LINE_LENGTH}`;
    status.textContent = '';
    fallback.hidden = true;
    link.value = '';
  }
  function readLink() {
    words.value = lineFromHash(window.location.hash);
    update();
  }
  words.addEventListener('input', event => { if (!event.isComposing) update(); });
  words.addEventListener('compositionend', update);
  window.addEventListener('hashchange', readLink);
  maker.addEventListener('submit', async event => {
    event.preventDefault();
    const url = shareUrl(window.location.href, currentLine());
    try {
      await window.navigator.clipboard.writeText(url);
      status.textContent = 'Link copied. Send this fire to someone.';
      fallback.hidden = true;
    } catch {
      link.value = url;
      fallback.hidden = false;
      status.textContent = 'Your link is ready to copy below.';
      link.focus();
      link.select();
    }
  });
  save.addEventListener('click', async () => {
    save.disabled = true;
    status.textContent = '';
    try {
      const canvas = document.createElement('canvas');
      drawPicture(canvas, document.querySelector('.hearth-flame'), currentLine());
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Picture drawing is unavailable.');
      const url = window.URL.createObjectURL(blob);
      const download = document.createElement('a');
      download.href = url;
      download.download = 'gratitude-fire.png';
      document.body.append(download);
      download.click();
      download.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 30000);
      status.textContent = 'Your picture is ready. Check your downloads.';
    } catch {
      status.textContent = 'The picture could not be saved. Try again, or copy the link.';
    } finally {
      save.disabled = false;
    }
  });
  readLink();
  maker.hidden = false;
}
