// Coordinates use a 1200-unit-wide page, so type scales with the printed sheet.
const WIDTH = 1200;
const PAPER = '#faf8f2';
const WHITE = '#fffefa';
const INK = '#201f1d';
const SMOKE = '#575651';
const LINE = '#b6b3aa';
const ACCENT = '#c84428';
const BRIGHT = '#ff7757';
const segmenter = typeof Intl.Segmenter === 'function' && new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const letters = text => segmenter ? Array.from(segmenter.segment(text), part => part.segment) : Array.from(text);
const plain = value => String(value ?? '').replace(/\s+/gu, ' ').trim();

function ellipsis(text, fits) {
  if (fits(text)) return text;
  const chars = letters(text);
  let low = 0, high = chars.length;
  const excerpt = n => chars.slice(0, n).join('').trimEnd() + '…';
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (fits(excerpt(mid))) low = mid;
    else high = mid - 1;
  }
  return excerpt(low);
}

// Preserve word boundaries when they exist; split large unspaced tokens on graphemes.
function wrap(text, fits, count) {
  const lines = [];
  let line = '';
  for (const word of plain(text).split(' ')) {
    const combined = line ? line + ' ' + word : word;
    if (fits(combined)) { line = combined; continue; }
    if (line) lines.push(line);
    if (lines.length >= count) break;
    line = word;
    if (fits(word)) continue;
    line = '';
    for (const glyph of letters(word)) {
      if (line && !fits(line + glyph)) {
        lines.push(line);
        if (lines.length >= count) break;
        line = '';
      }
      line += glyph;
    }
    if (lines.length >= count) break;
  }
  if (lines.length < count) return [...lines, line];
  const last = lines.pop();
  const wordEnd = last.lastIndexOf(' ');
  lines.push(!fits(last + '…') && wordEnd > 0 ? last.slice(0, wordEnd) + '…' : ellipsis(last + '…', fits));
  return lines;
}

function fallbackFlame(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 32, size / 32);
  ctx.beginPath();
  ctx.moveTo(5, 24);
  ctx.bezierCurveTo(3, 17, 10, 13, 10, 7);
  ctx.bezierCurveTo(13, 9, 13, 12, 14, 14);
  ctx.bezierCurveTo(20, 9, 22, 4, 21, 0);
  ctx.bezierCurveTo(28, 8, 32, 17, 27, 25);
  ctx.bezierCurveTo(22, 34, 8, 34, 5, 24);
  ctx.fill();
  ctx.restore();
}

/** Paint either shareable PNG size at native resolution. Call canvas.toBlob(callback, 'image/png') to export. */
export function renderCard(canvas, { layout, format, card }, flame) {
  const portrait = format === 'portrait';
  canvas.width = portrait ? 1080 : 1200;
  canvas.height = portrait ? 1350 : 675;
  const H = canvas.height * WIDTH / canvas.width;
  const pad = 66, right = WIDTH - pad, wide = right - pad;
  const signal = layout === 'signal', ledger = layout === 'ledger', day = card.kind === 'day';
  const ink = signal ? WHITE : INK;
  const muted = signal ? '#c0bdb7' : SMOKE;
  const accent = signal ? BRIGHT : ACCENT;
  const ctx = canvas.getContext('2d');
  ctx.scale(canvas.width / WIDTH, canvas.width / WIDTH);
  ctx.textBaseline = 'top';
  ctx.fillStyle = signal ? INK : ledger ? PAPER : WHITE;
  ctx.fillRect(0, 0, WIDTH, H);

  function line(x1, x2, y, color = LINE, thickness = 2) {
    ctx.fillStyle = color;
    ctx.fillRect(x1, y, x2 - x1, thickness);
  }
  function font(size, weight, color) {
    ctx.font = `${weight} ${size}px Arial, sans-serif`;
    ctx.fillStyle = color;
  }
  function label(value, x, y, width, size = 32, weight = 400, color = ink) {
    font(size, weight, color);
    const fits = s => ctx.measureText(s).width <= width;
    ctx.fillText(ellipsis(plain(value), fits), x, y);
  }
  function paragraph(text, x, y, width, height, size, weight = 500, color = ink) {
    font(size, weight, color);
    const leading = Math.ceil(size * 1.12);
    const lines = wrap(text, s => ctx.measureText(s).width <= width, Math.max(1, Math.floor(height / leading)));
    lines.forEach((s, i) => ctx.fillText(s, x, y + i * leading));
  }
  function mark(x, y, size) {
    if (flame) {
      // Item 24's bare flame places the tongues in the center of a 240 × 164 stage.
      const w = flame.width || flame.naturalWidth, h = flame.height || flame.naturalHeight;
      if (w && h) {
        ctx.drawImage(flame, w * .29, h * .20, w * .42, h * .70, x, y, size, size);
        return;
      }
    }
    ctx.fillStyle = accent;
    fallbackFlame(ctx, x, y, size);
  }
  function footer() {
    line(pad, right, H - 97, signal ? '#68635e' : LINE);
    const url = plain(card.linkLabel);
    font(32, 500, ink);
    if (ctx.measureText(url).width <= wide) {
      ctx.fillText(url, pad, H - 70);
      return;
    }
    // A screenshot is a portable source citation: keep every character of the URL.
    const chars = letters(url);
    let split = Math.floor(chars.length / 2);
    const nearby = chars.slice(split, split + 9).findIndex(s => '/?#&='.includes(s));
    if (nearby >= 0) split += nearby + 1;
    const rows = [chars.slice(0, split).join(''), chars.slice(split).join('')];
    const max = Math.max(...rows.map(row => ctx.measureText(row).width));
    const size = Math.min(32, 32 * wide / max);
    font(size, 500, ink);
    rows.forEach((row, i) => ctx.fillText(row, pad, H - 82 + 36 * i));
  }
  function credit() {
    label(card.byline, pad, H - 159, wide, 35, 600, ink);
  }

  if (signal) {
    mark(pad, 43, 49);
    label('The Loom', pad + 65, 45, 280, 42, 700);
    label(card.room, 486, 50, right - 486, 35, 500, muted);
    line(pad, pad + 76, portrait ? 205 : 138, accent, 7);
    label(card.date, pad, portrait ? 240 : 162, wide, 32, 500, muted);
  } else if (ledger) {
    label('THE LOOM', pad, 46, 310, 44, 700);
    mark(right - 47, 43, 47);
    line(pad, right, 113, INK, 4);
    label(card.room, pad, 138, wide * .55, 34, 600);
    label(card.date, pad + wide * .58, 140, wide * .42, 31, 500, muted);
  } else {
    mark(pad, 44, 43);
    label('The Loom', pad + 57, 43, 260, 39, 700);
    const dateWidth = wide * .51;
    font(31, 500, muted);
    const date = ellipsis(plain(card.date), s => ctx.measureText(s).width <= dateWidth);
    ctx.fillText(date, right - ctx.measureText(date).width, 49);
    line(pad, right, 111, INK, 2);
    label(card.room, pad, portrait ? 168 : 142, wide, 36, 600, accent);
  }
  footer();
  const metrics = Array.isArray(card.metrics) ? card.metrics.slice(0, 3) : [];
  if (!day) {
    credit();
    const short = portrait && plain(card.quote).length <= 85;
    const top = portrait ? (short ? 405 : signal ? 383 : ledger ? 334 : 273) : ledger || signal ? 229 : 209;
    const bottom = H - (portrait ? 218 : 181);
    if (signal) {
      // The opening mark identifies the excerpt; the byline remains outside the quotation.
      label('“', pad - 5, top - 20, 100, 116, 700, accent);
      paragraph(card.quote, pad + 90, top, wide - 90, bottom - top, short ? 112 : portrait ? 82 : 60, 700);
    } else if (ledger) {
      line(pad, right, top - 22, LINE);
      label('EXCERPT', pad, top + 5, 178, 26, 700, accent);
      paragraph(card.quote, pad + 185, top, wide - 185, bottom - top, short ? 98 : portrait ? 73 : 52, 500);
    } else {
      paragraph(card.quote, pad, top, wide, bottom - top, short ? 132 : portrait ? 94 : 67, 600);
    }
    return;
  }

  const title = card.title || 'Day on the Loom';
  const top = signal ? (portrait ? 325 : 219) : ledger ? (portrait ? 238 : 215) : (portrait ? 262 : 213);
  label(title, pad, top, wide, portrait ? 78 : 58, 700);
  if (ledger) {
    const start = top + (portrait ? 148 : 77);
    const rowH = Math.min(portrait ? 265 : 87, (H - 113 - start) / 3);
    metrics.forEach(({value, label: name}, index) => {
      const y = start + index * rowH;
      line(pad, right, y, signal ? '#68635e' : LINE);
      const valueSize = portrait ? 105 : 56;
      label(value, pad, y + rowH * .18, wide * .34, valueSize, 700, index === 0 ? accent : ink);
      paragraph(name, pad + wide * .37, y + rowH * .24, wide * .63, rowH * .72, portrait ? 48 : 32, 500);
    });
  } else if (signal && metrics.length) {
    const [first, ...rest] = metrics;
    label(first.value, pad, portrait ? 478 : 308, portrait ? wide : 337, portrait ? 260 : 142, 700, accent);
    paragraph(first.label, pad, portrait ? 775 : 468, portrait ? wide : 337, 90, portrait ? 49 : 32);
    rest.forEach(({value, label: name}, i) => {
      const x = portrait ? pad + i * 555 : 465 + i * 335;
      const w = portrait ? 500 : 270;
      line(x, x + w, portrait ? 956 : 350, '#68635e');
      label(value, x, portrait ? 994 : 372, w, portrait ? 140 : 80, 600);
      paragraph(name, x, portrait ? 1164 : 472, w, portrait ? 156 : 85, portrait ? 41 : 32, 500, muted);
    });
  } else if (portrait) {
    metrics.forEach(({value, label: name}, i) => {
      const y = 463 + i * 275;
      label(value, pad, y, wide, 147, 700, accent);
      paragraph(name, pad, y + 158, wide, 108, 44, 500);
    });
  } else {
    const col = wide / 3;
    metrics.forEach(({value, label: name}, i) => {
      const x = pad + i * col;
      line(x, x + col - 25, 319, i === 0 ? accent : LINE, 3);
      label(value, x, 345, col - 24, 112, 700);
      paragraph(name, x, 479, col - 24, 85, 32);
    });
  }
}
