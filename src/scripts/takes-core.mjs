// TAKES — the document model.
// A document is Markdown with three small additions:
//   {{original | alternate | >chosen}}   inline takes (word, phrase or sentence)
//   ((dimmed text))                      pushed back, still there
//   ::: takes / +++ / :::                paragraph takes ("+++ >" marks the chosen one)
// and an overflow stash after a "--- overflow ---" line.

export const OVERFLOW_RULE = '--- overflow ---';
const OVERFLOW_RE = /^---\s*overflow\s*---\s*$/im;
const FENCE_OPEN = /^:::\s*takes\s*$/i;
const FENCE_CLOSE = /^:::\s*$/;
const FENCE_SEP = /^\+\+\+\s*(>)?\s*$/;

let nextId = 1;
const newId = () => `b${nextId++}`;

export function makeBlock(versions, active = 0) {
  const list = versions.length ? versions : [''];
  return { id: newId(), versions: list, active: Math.max(0, Math.min(active, list.length - 1)) };
}

export function parseDoc(md = '') {
  const text = String(md).replace(/\r\n?/g, '\n');
  const match = OVERFLOW_RE.exec(text);
  const body = match ? text.slice(0, match.index) : text;
  const tail = match ? text.slice(match.index + match[0].length) : '';
  const blocks = [];
  const lines = body.split('\n');
  let para = [];
  const flush = () => {
    if (para.length) blocks.push(makeBlock([para.join('\n')]));
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (FENCE_OPEN.test(line.trim())) {
      flush();
      const versions = [];
      let current = [];
      let active = 0;
      i++;
      for (; i < lines.length && !FENCE_CLOSE.test(lines[i].trim()); i++) {
        const sep = FENCE_SEP.exec(lines[i].trim());
        if (sep) {
          versions.push(current.join('\n').trim());
          current = [];
          if (sep[1]) active = versions.length;
        } else current.push(lines[i]);
      }
      versions.push(current.join('\n').trim());
      blocks.push(makeBlock(versions, active));
      continue;
    }
    if (!line.trim()) { flush(); continue; }
    if (/^#{1,3}\s/.test(line)) { flush(); blocks.push(makeBlock([line.trim()])); continue; }
    para.push(line.replace(/\s+$/, ''));
  }
  flush();
  const overflow = tail.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  return { blocks, overflow };
}

export function serializeBlock(block) {
  if (block.versions.length === 1) return block.versions[0];
  const parts = ['::: takes', block.versions[0]];
  for (let i = 1; i < block.versions.length; i++) {
    parts.push(i === block.active ? '+++ >' : '+++', block.versions[i]);
  }
  parts.push(':::');
  return parts.join('\n');
}

export function serializeDoc(doc) {
  const body = doc.blocks.map(serializeBlock).filter(s => s.length).join('\n\n');
  if (!doc.overflow.length) return body + '\n';
  return `${body}\n\n${OVERFLOW_RULE}\n\n${doc.overflow.join('\n\n')}\n`;
}

// ---------- inline ----------

export function blockPrefix(src) {
  const h = /^(#{1,3})\s+/.exec(src);
  if (h) return { kind: `h${h[1].length}`, len: h[0].length };
  const q = /^>\s?/.exec(src);
  if (q) return { kind: 'quote', len: q[0].length };
  return { kind: 'p', len: 0 };
}

export function takeSource(options, active) {
  return '{{' + options.map((o, i) => (i === active && i > 0 ? '>' : '') + o).join(' | ') + '}}';
}

function parseTakeInner(inner) {
  const raw = inner.split('|');
  let active = 0;
  const options = raw.map((r, i) => {
    let t = r.trim();
    if (t.startsWith('>')) { t = t.slice(1).trim(); active = i; }
    return t;
  });
  return { options, active };
}

// Returns tokens with absolute source offsets. Text tokens are verbatim
// substrings so a DOM selection can be mapped back to the source.
export function parseInline(src, base = 0, counter = { n: 0 }) {
  const tokens = [];
  let buf = '';
  let bufStart = 0;
  const pushText = () => {
    if (buf) tokens.push({ t: 'text', v: buf, s: base + bufStart, e: base + bufStart + buf.length });
    buf = '';
  };
  let i = 0;
  while (i < src.length) {
    if (src.startsWith('{{', i)) {
      const j = src.indexOf('}}', i + 2);
      if (j > i + 2) {
        pushText();
        const { options, active } = parseTakeInner(src.slice(i + 2, j));
        tokens.push({ t: 'take', g: counter.n++, s: base + i, e: base + j + 2, options, active });
        i = j + 2; bufStart = i; continue;
      }
    }
    if (src.startsWith('((', i)) {
      const j = src.indexOf('))', i + 2);
      if (j > i + 2) {
        pushText();
        tokens.push({ t: 'dim', s: base + i, e: base + j + 2, children: parseInline(src.slice(i + 2, j), base + i + 2, counter) });
        i = j + 2; bufStart = i; continue;
      }
    }
    if (src.startsWith('**', i)) {
      const j = src.indexOf('**', i + 2);
      if (j > i + 2) {
        pushText();
        tokens.push({ t: 'b', s: base + i, e: base + j + 2, children: parseInline(src.slice(i + 2, j), base + i + 2, counter) });
        i = j + 2; bufStart = i; continue;
      }
    }
    const ch = src[i];
    if ((ch === '*' || ch === '_') && /\S/.test(src[i + 1] || '') && (i === 0 || /[\s(["'—-]/.test(src[i - 1]))) {
      const j = src.indexOf(ch, i + 1);
      if (j > i + 1 && /\S/.test(src[j - 1]) && !/\w/.test(src[j + 1] || '')) {
        pushText();
        tokens.push({ t: 'i', s: base + i, e: base + j + 1, children: parseInline(src.slice(i + 1, j), base + i + 1, counter) });
        i = j + 1; bufStart = i; continue;
      }
    }
    if (!buf) bufStart = i;
    buf += ch;
    i++;
  }
  pushText();
  return tokens;
}

export function blockTokens(src) {
  const pre = blockPrefix(src);
  return { ...pre, tokens: parseInline(src.slice(pre.len), pre.len) };
}

export function flatTakes(tokens, out = []) {
  for (const tok of tokens) {
    if (tok.t === 'take') out.push(tok);
    else if (tok.children) flatTakes(tok.children, out);
  }
  return out;
}

export function flatDims(tokens, out = []) {
  for (const tok of tokens) {
    if (tok.t === 'dim') out.push(tok);
    if (tok.children) flatDims(tok.children, out);
  }
  return out;
}

const findTake = (src, g) => flatTakes(blockTokens(src).tokens).find(t => t.g === g);
const splice = (src, s, e, insert) => src.slice(0, s) + insert + src.slice(e);

export function setTakeActive(src, g, active) {
  const tok = findTake(src, g);
  if (!tok) return src;
  const a = ((active % tok.options.length) + tok.options.length) % tok.options.length;
  return splice(src, tok.s, tok.e, takeSource(tok.options, a));
}

export function addTakeOption(src, g, text) {
  const tok = findTake(src, g);
  const clean = sanitizeOption(text);
  if (!tok || !clean) return src;
  const options = [...tok.options, clean];
  return splice(src, tok.s, tok.e, takeSource(options, options.length - 1));
}

export function removeTakeOption(src, g, index) {
  const tok = findTake(src, g);
  if (!tok || index <= 0) return src;
  const options = tok.options.filter((_, i) => i !== index);
  if (options.length === 1) return splice(src, tok.s, tok.e, options[0]);
  const active = tok.active === index ? 0 : tok.active > index ? tok.active - 1 : tok.active;
  return splice(src, tok.s, tok.e, takeSource(options, active));
}

// Keep what is showing and drop the alternatives.
export function flattenTake(src, g) {
  const tok = findTake(src, g);
  return tok ? splice(src, tok.s, tok.e, tok.options[tok.active]) : src;
}

// Make the showing take the new original; the old original becomes an alternate.
export function promoteTake(src, g) {
  const tok = findTake(src, g);
  if (!tok || tok.active === 0) return src;
  const options = [tok.options[tok.active], ...tok.options.filter((_, i) => i !== tok.active)];
  return splice(src, tok.s, tok.e, takeSource(options, 0));
}

export function sanitizeOption(text) {
  return String(text || '').replace(/[{}|]/g, '').replace(/\s+/g, ' ').trim();
}

// A source range is safe to wrap if it does not cut through a token.
export function rangeIsClean(src, s, e) {
  if (!(e > s)) return false;
  const { tokens, len } = blockTokens(src);
  if (s < len) return false;
  const walk = list => list.every(tok => {
    if (tok.t === 'text') return true;
    const inside = s <= tok.s && e >= tok.e;
    const outside = e <= tok.s || s >= tok.e;
    if (inside || outside) return true;
    // fully within the inner part of a dim/bold/italic is fine
    if (tok.children && s > tok.s && e < tok.e) {
      const open = tok.t === 'i' ? 1 : 2;
      if (s >= tok.s + open && e <= tok.e - open) return walk(tok.children);
    }
    return false;
  });
  return walk(tokens);
}

export function wrapTake(src, s, e, alternate) {
  const original = sanitizeOption(src.slice(s, e));
  const alt = sanitizeOption(alternate);
  if (!original || !rangeIsClean(src, s, e)) return src;
  const options = alt ? [original, alt] : [original, original];
  return splice(src, s, e, takeSource(options, alt ? 1 : 0));
}

export function wrapDim(src, s, e) {
  if (!rangeIsClean(src, s, e)) return src;
  return splice(src, s, e, `((${src.slice(s, e)}))`);
}

export function unwrapDimAt(src, pos) {
  const dim = flatDims(blockTokens(src).tokens).find(d => pos >= d.s && pos <= d.e);
  if (!dim) return src;
  return src.slice(0, dim.s) + src.slice(dim.s + 2, dim.e - 2) + src.slice(dim.e);
}

export function cutRange(src, s, e) {
  if (!rangeIsClean(src, s, e)) return { src, cut: '' };
  const cut = src.slice(s, e).trim();
  const next = (src.slice(0, s) + src.slice(e)).replace(/[ \t]{2,}/g, ' ').replace(/ ([,.;:!?])/g, '$1');
  return { src: next, cut };
}

// Expand a source range to the sentence around it.
export function sentenceBounds(src, s, e = s) {
  const { tokens, len: pre } = blockTokens(src);
  // takes are opaque: punctuation inside an alternate never ends a sentence
  let masked = src;
  for (const t of flatTakes(tokens)) masked = masked.slice(0, t.s) + 'x'.repeat(t.e - t.s) + masked.slice(t.e);
  const stop = c => /[.!?]/.test(c || '');
  let a = Math.max(pre, s);
  const endsBefore = i => { let k = i; while (k > pre && /["'”’)]/.test(masked[k])) k--; return stop(masked[k]); };
  while (a > pre && !(/\s/.test(masked[a - 1]) && endsBefore(a - 2))) a--;
  let b = Math.max(e, a + 1);
  while (b < src.length && !stop(masked[b - 1])) b++;
  while (b < src.length && /["'”’)]/.test(src[b])) b++;
  while (a < b && /\s/.test(src[a])) a++;
  while (b > a && /\s/.test(src[b - 1])) b--;
  // never cut through a token: grow to its edges
  for (const tok of tokens) {
    if (tok.t === 'text') continue;
    if (a > tok.s && a < tok.e) a = tok.s;
    if (b > tok.s && b < tok.e) b = tok.e;
  }
  return [a, b];
}

export function plainOf(tokens) {
  return tokens.map(tok => {
    if (tok.t === 'text') return tok.v;
    if (tok.t === 'take') return tok.options[tok.active];
    return plainOf(tok.children || []);
  }).join('');
}

export function blockPlain(src) {
  const { tokens } = blockTokens(src);
  return plainOf(tokens);
}

export function docStats(doc) {
  let takes = 0;
  let paragraphTakes = 0;
  const text = doc.blocks.map(b => {
    const src = b.versions[b.active];
    takes += flatTakes(blockTokens(src).tokens).length;
    if (b.versions.length > 1) paragraphTakes++;
    return blockPlain(src);
  }).join('\n\n');
  const words = (text.match(/[\p{L}\p{N}’']+/gu) || []).length;
  return { words, chars: text.length, takes, paragraphTakes, overflow: doc.overflow.length };
}

// A clean "print take": the chosen words only, no Takes syntax, no stash.
export function cleanMarkdown(doc, { keepDim = true } = {}) {
  return doc.blocks.map(b => {
    const src = b.versions[b.active];
    const pre = blockPrefix(src);
    const strip = list => list.map(tok => {
      if (tok.t === 'text') return tok.v;
      if (tok.t === 'take') return tok.options[tok.active];
      if (tok.t === 'dim') return keepDim ? strip(tok.children) : '';
      if (tok.t === 'b') return `**${strip(tok.children)}**`;
      if (tok.t === 'i') return `*${strip(tok.children)}*`;
      return '';
    }).join('');
    return src.slice(0, pre.len) + strip(parseInline(src.slice(pre.len), pre.len)).replace(/[ \t]{2,}/g, ' ').trim();
  }).filter(Boolean).join('\n\n') + '\n';
}

export const SAMPLE_DOC = `# Low Tide, Third Draft

The water pulls back from the jetty and leaves the sand {{shining | glassy | >wet and bright}} like a plate nobody has cleared yet. Gulls work the edge. A dog runs at them and they lift, all at once, and settle {{ten feet away | a little further down | >just out of reach}}.

::: takes
Somebody is always walking here at this hour. It is the part of the day that belongs to nobody in particular.
+++ >
There is always one walker at this hour, coat zipped, head down, owning a part of the day nobody else has claimed.
+++
At six there is one walker, one dog and a lot of sky.
:::

{{Every draft is a low tide. | Drafts work like tides.}} ((The first pass covers everything; the second pulls back and shows you what was under it.)) You keep the shells you want and let the water have the rest.

Press **Tab** to step through the takes, the arrow keys to audition them, and **O** to go back to the original. Select any words and press **T** for a new take, **D** to dim them or **S** to stash them in the overflow.

${OVERFLOW_RULE}

The pier lights were still on, which felt like a mistake someone would fix soon.

A sentence about pelicans that does not belong yet.
`;
