// TAKES — the writing desk. Markdown is the source of truth; "play" renders
// the chosen takes with hand-drawn underlines so you can audition them.
import {
  parseDoc, serializeDoc, serializeBlock, makeBlock, blockTokens, flatTakes, setTakeActive, addTakeOption,
  removeTakeOption, flattenTake, promoteTake, wrapTake, wrapDim, unwrapDimAt, cutRange, sentenceBounds,
  rangeIsClean, docStats, cleanMarkdown, SAMPLE_DOC,
} from './takes-core.mjs';
import { TakesAudio, AUDIO_DEFAULTS } from './takes-audio.mjs';

export const STORAGE_KEY = 'pointcast.takes.v1';

export const STYLE_DEFAULTS = {
  theme: 'midnight',
  font: 'plex',
  size: 17,
  leading: 1.75,
  measure: 64,
  underline: 'pen',
  wobble: 0.45,
  ink: 1.4,
  texture: 'grain',
  focus: false,
  layout: 'play',
  showStash: true,
};

export const FONTS = {
  plex: "'IBM Plex Mono', ui-monospace, monospace",
  jetbrains: "'JetBrains Mono', ui-monospace, monospace",
  courier: "'Courier Prime', 'Courier New', monospace",
  newsreader: "'Newsreader', Georgia, serif",
  literata: "'Literata', Georgia, serif",
  inter: "'Inter', system-ui, sans-serif",
  atkinson: "'Atkinson Hyperlegible', system-ui, sans-serif",
};

const store = {
  get() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; } },
  set(v) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); return true; } catch { return false; } },
};

// ---------- hand-drawn underline tiles ----------
function rng(seed) {
  let x = seed * 2654435761 % 4294967296 || 1;
  return () => ((x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

const tileCache = new Map();
export function penTile(seed, { color, wobble, ink, style }) {
  const key = [seed, color, wobble, ink, style].join('|');
  if (tileCache.has(key)) return tileCache.get(key);
  const W = 220, H = 10, mid = 5;
  const r = rng(seed + 7);
  let svg = '';
  const c = encodeURIComponent(color);
  if (style === 'pen' || style === 'double') {
    const lines = style === 'double' ? [mid - 1.8, mid + 1.8] : [mid];
    for (const base of lines) {
      const pts = [];
      let drift = 0;
      for (let x = 0; x <= W; x += 11) {
        drift += (r() - 0.5) * wobble * 1.3;
        drift *= 0.82;
        const y = x === 0 || x >= W - 1 ? base : base + drift + Math.sin(x / (30 + r() * 20)) * wobble * 0.9;
        pts.push([x, y.toFixed(2)]);
      }
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        d += ` Q${x0 + 5.5} ${y0} ${(x0 + x1) / 2} ${((+y0 + +y1) / 2).toFixed(2)}`;
      }
      d += ` T${W} ${base}`;
      svg += `<path d='${d}' fill='none' stroke='${c}' stroke-width='${ink}' stroke-linecap='round' opacity='${(0.85 + r() * 0.15).toFixed(2)}'/>`;
    }
  } else if (style === 'marker') {
    svg = `<path d='M0 ${mid + 1} Q55 ${mid - wobble} 110 ${mid + 1} T220 ${mid + 1}' fill='none' stroke='${c}' stroke-width='${7 + ink}' stroke-linecap='butt' opacity='0.28'/>`;
  }
  const url = svg ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'%3E${svg.replace(/</g, '%3C').replace(/>/g, '%3E')}%3C/svg%3E")` : 'none';
  if (tileCache.size > 400) tileCache.clear();
  tileCache.set(key, url);
  return url;
}

export function gutterTile(seed, { color, wobble, ink }) {
  const key = ['g', seed, color, wobble, ink].join('|');
  if (tileCache.has(key)) return tileCache.get(key);
  const r = rng(seed + 31);
  const H = 160;
  let d = 'M4 0';
  for (let y = 16; y <= H; y += 16) d += ` Q${(4 + (r() - 0.5) * wobble * 3).toFixed(2)} ${y - 8} 4 ${y}`;
  const svg = `<path d='${d}' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='${ink}' stroke-linecap='round'/>`;
  const url = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='${H}' viewBox='0 0 8 ${H}'%3E${svg.replace(/</g, '%3C').replace(/>/g, '%3E')}%3C/svg%3E")`;
  tileCache.set(key, url);
  return url;
}

const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

// ---------- app ----------
export function initTakes(root) {
  if (!root || root.dataset.ready) return null;
  root.dataset.ready = 'true';
  const $ = sel => root.querySelector(sel);
  const $$ = sel => [...root.querySelectorAll(sel)];

  const saved = store.get() || {};
  const state = {
    doc: parseDoc(saved.md || SAMPLE_DOC),
    style: { ...STYLE_DEFAULTS, ...(saved.style || {}) },
    audioSettings: { ...AUDIO_DEFAULTS, ...(saved.audio || {}) },
    focusTake: null, // {b, g}
    focusBlock: 0,
    editing: null, // block index being edited inline
    undo: [],
    redo: [],
  };
  const audio = new TakesAudio(state.audioSettings);

  const page = $('[data-page]');
  const source = $('[data-source]');
  const stashList = $('[data-stash-list]');
  const statusEl = $('[data-status]');
  const live = $('[data-live]');
  const pop = $('[data-pop]');
  const selbar = $('[data-selbar]');
  const lab = $('[data-lab]');
  const help = $('[data-help]');

  const announce = msg => { live.textContent = ''; requestAnimationFrame(() => { live.textContent = msg; }); };
  const flash = msg => {
    const el = $('[data-toast]');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(flash.t);
    flash.t = setTimeout(() => el.classList.remove('is-on'), 1600);
  };

  // --- persistence / history ---
  let saveTimer = 0;
  const persist = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const ok = store.set({ md: serializeDoc(state.doc), style: state.style, audio: audio.s });
      $('[data-saved]').textContent = ok ? 'Saved in this browser' : 'Not saved: browser storage is off';
    }, 250);
  };
  const snapshot = () => {
    state.undo.push(serializeDoc(state.doc));
    if (state.undo.length > 200) state.undo.shift();
    state.redo = [];
  };
  const restore = (from, to) => {
    if (!from.length) return flash('Nothing to undo');
    to.push(serializeDoc(state.doc));
    state.doc = parseDoc(from.pop());
    state.focusTake = null;
    render();
  };

  const mutateBlock = (b, fn) => {
    const block = state.doc.blocks[b];
    if (!block) return;
    const before = block.versions[block.active];
    const after = fn(before);
    if (after === before) return false;
    snapshot();
    block.versions[block.active] = after;
    return true;
  };

  const panFor = b => (state.doc.blocks.length > 1 ? (b / (state.doc.blocks.length - 1)) * 2 - 1 : 0);

  // --- style ---
  const themeColors = () => {
    const cs = getComputedStyle(root);
    return { take: cs.getPropertyValue('--tk-take').trim() || '#7aa2ff', alt: cs.getPropertyValue('--tk-alt').trim() || '#ffb86b', gutter: cs.getPropertyValue('--tk-gutter').trim() || '#e0a060' };
  };
  const applyStyle = () => {
    const s = state.style;
    root.dataset.theme = s.theme;
    root.dataset.texture = s.texture;
    root.dataset.layout = s.layout;
    root.dataset.focus = s.focus ? 'on' : 'off';
    root.dataset.stash = s.showStash ? 'on' : 'off';
    root.dataset.underline = s.underline;
    root.style.setProperty('--tk-font', FONTS[s.font] || FONTS.plex);
    root.style.setProperty('--tk-size', `${s.size}px`);
    root.style.setProperty('--tk-leading', s.leading);
    root.style.setProperty('--tk-measure', `${s.measure}ch`);
    $$('[data-mode]').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.mode === s.layout)));
  };

  const decorate = () => {
    const s = state.style;
    const col = themeColors();
    $$('.tk-take').forEach(el => {
      const seed = hash(el.dataset.key || '');
      const isAlt = el.dataset.active !== '0';
      if (s.underline === 'pen' || s.underline === 'double' || s.underline === 'marker') {
        el.style.backgroundImage = penTile(seed, { color: isAlt ? col.alt : col.take, wobble: s.wobble * 4, ink: s.ink, style: s.underline });
      } else el.style.backgroundImage = '';
    });
    $$('.tk-block[data-versions]').forEach(el => {
      el.style.setProperty('--tk-gutter-img', gutterTile(hash(el.dataset.id), { color: col.gutter, wobble: s.wobble * 2, ink: s.ink }));
    });
  };

  // --- render ---
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const renderTokens = (tokens, b) => tokens.map(tok => {
    if (tok.t === 'text') return `<span class="tk-t" data-s="${tok.s}">${esc(tok.v)}</span>`;
    if (tok.t === 'take') {
      const shown = tok.options[tok.active] || ' ';
      const label = `Take ${tok.active + 1} of ${tok.options.length}${tok.active === 0 ? ', original' : ''}: ${shown}`;
      return `<span class="tk-take" tabindex="0" role="button" aria-label="${esc(label)}" data-b="${b}" data-g="${tok.g}" data-active="${tok.active}" data-count="${tok.options.length}" data-key="${state.doc.blocks[b].id}-${tok.g}">${esc(shown)}</span>`;
    }
    const cls = tok.t === 'dim' ? 'tk-dim' : tok.t === 'b' ? 'tk-b' : 'tk-i';
    const tag = tok.t === 'b' ? 'strong' : tok.t === 'i' ? 'em' : 'span';
    const extra = tok.t === 'dim' ? ` data-dim="${tok.s}" title="Dimmed — press U to bring it back"` : '';
    return `<${tag} class="${cls}"${extra}>${renderTokens(tok.children, b)}</${tag}>`;
  }).join('');

  const renderBlock = (block, b) => {
    const src = block.versions[block.active];
    const { kind, tokens } = blockTokens(src);
    const tag = kind.startsWith('h') ? kind : kind === 'quote' ? 'blockquote' : 'p';
    const multi = block.versions.length > 1;
    const meta = multi ? ` data-versions="${block.versions.length}"` : '';
    const vlabel = multi ? `<span class="tk-vcount" aria-hidden="true">${block.active === 0 ? 'orig' : `take ${block.active + 1}`} · ${block.active + 1}/${block.versions.length}</span>` : '';
    if (state.editing === b) {
      return `<div class="tk-block is-editing" data-b="${b}" data-id="${block.id}"${meta}>${vlabel}<textarea class="tk-inline" data-inline aria-label="Edit paragraph source" spellcheck="true">${esc(src)}</textarea><p class="tk-inline-hint">Enter to keep · Shift+Enter for a line break · Esc to cancel</p></div>`;
    }
    const body = renderTokens(tokens, b) || '<span class="tk-empty">Empty paragraph. Double-click to write.</span>';
    return `<div class="tk-block tk-${kind}${block.active > 0 ? ' is-alt' : ''}" data-b="${b}" data-id="${block.id}"${meta}>${vlabel}<div class="tk-tools" aria-label="Paragraph tools"><button type="button" data-act="prev-version" title="Previous paragraph take ([)" aria-label="Previous paragraph take">‹</button><button type="button" data-act="add-version" title="New paragraph take (P)" aria-label="New paragraph take">+</button><button type="button" data-act="next-version" title="Next paragraph take (])" aria-label="Next paragraph take">›</button><button type="button" data-act="edit" title="Edit (E)" aria-label="Edit paragraph">✎</button></div><${tag} class="tk-text">${body}</${tag}></div>`;
  };

  const renderStash = () => {
    const items = state.doc.overflow;
    $('[data-stash-count]').textContent = items.length;
    stashList.innerHTML = items.length
      ? items.map((it, i) => `<li draggable="true" data-stash="${i}"><p>${esc(it)}</p><div><button type="button" data-act="unstash" data-i="${i}" title="Put back after the focused paragraph">Put back ↩</button><button type="button" data-act="copy-stash" data-i="${i}" title="Copy">Copy</button><button type="button" data-act="drop-stash" data-i="${i}" title="Delete" aria-label="Delete stash item">×</button></div></li>`).join('')
      : '<li class="tk-stash-empty">Select words and press <kbd>S</kbd> to stash them here. Nothing is lost.</li>';
  };

  const renderStatus = () => {
    const st = docStats(state.doc);
    statusEl.textContent = `${st.words} words · ${st.chars} chars · ${st.takes} takes · ${st.paragraphTakes} para takes`;
  };

  function render({ keepSource = false } = {}) {
    const active = document.activeElement;
    const hadFocus = !!active && (page.contains(active) || pop.contains(active)) && !active.matches('input');
    page.innerHTML = state.doc.blocks.map(renderBlock).join('') + '<button type="button" class="tk-add-para" data-act="add-para">+ paragraph</button>';
    if (!keepSource) source.value = serializeDoc(state.doc);
    renderStash();
    renderStatus();
    decorate();
    markFocus();
    if (state.editing !== null) {
      const ta = page.querySelector('[data-inline]');
      if (ta) { autosize(ta); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
    } else if (state.focusTake) {
      const el = page.querySelector(`.tk-take[data-b="${state.focusTake.b}"][data-g="${state.focusTake.g}"]`);
      if (el && hadFocus) el.focus({ preventScroll: true });
    }
    persist();
  }

  const markFocus = () => {
    $$('.tk-block').forEach(el => el.classList.toggle('is-focus', +el.dataset.b === state.focusBlock));
  };

  const autosize = ta => { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight + 2}px`; };

  // --- take actions ---
  const cycleTake = (b, g, dir) => {
    const block = state.doc.blocks[b];
    const tok = flatTakes(blockTokens(block.versions[block.active]).tokens).find(t => t.g === g);
    if (!tok) return;
    const next = ((tok.active + dir) % tok.options.length + tok.options.length) % tok.options.length;
    block.versions[block.active] = setTakeActive(block.versions[block.active], g, next);
    state.focusTake = { b, g };
    state.focusBlock = b;
    audio.ensure();
    audio.take(next, { pan: panFor(b), total: tok.options.length });
    announce(next === 0 ? `Back to the original: ${tok.options[0]}` : `Take ${next + 1} of ${tok.options.length}: ${tok.options[next]}`);
    render();
    if (!pop.hidden) openPop(b, g);
  };

  const backToOriginal = (b, g) => {
    const block = state.doc.blocks[b];
    const tok = flatTakes(blockTokens(block.versions[block.active]).tokens).find(t => t.g === g);
    if (!tok || tok.active === 0) { audio.ensure(); audio.take(0, { pan: panFor(b) }); return; }
    cycleTake(b, g, -tok.active);
  };

  const cycleVersion = (b, dir) => {
    const block = state.doc.blocks[b];
    if (!block || block.versions.length < 2) { audio.ensure(); audio.action('error'); flash('One take so far. Press P for a new paragraph take.'); return; }
    block.active = ((block.active + dir) % block.versions.length + block.versions.length) % block.versions.length;
    state.focusBlock = b;
    state.focusTake = null;
    audio.ensure();
    audio.paragraph(block.active, { pan: panFor(b) });
    announce(block.active === 0 ? 'Original paragraph' : `Paragraph take ${block.active + 1} of ${block.versions.length}`);
    render();
  };

  const addVersion = b => {
    const block = state.doc.blocks[b];
    if (!block) return;
    snapshot();
    block.versions.push(block.versions[block.active]);
    block.active = block.versions.length - 1;
    state.focusBlock = b;
    state.editing = b;
    audio.ensure();
    audio.action('version', { pan: panFor(b) });
    announce(`New paragraph take ${block.active + 1}. Editing.`);
    render();
  };

  // --- popover for a take ---
  let popTarget = null;
  function openPop(b, g) {
    const block = state.doc.blocks[b];
    const tok = flatTakes(blockTokens(block.versions[block.active]).tokens).find(t => t.g === g);
    const anchor = page.querySelector(`.tk-take[data-b="${b}"][data-g="${g}"]`);
    if (!tok || !anchor) return closePop();
    popTarget = { b, g };
    pop.innerHTML = `<ol class="tk-pop-list">${tok.options.map((o, i) => `<li><button type="button" data-act="pick" data-i="${i}" aria-current="${i === tok.active}"><span>${i === 0 ? 'orig' : i + 1}</span>${esc(o) || '<em>(empty)</em>'}</button>${i > 0 ? `<button type="button" class="tk-pop-x" data-act="remove-option" data-i="${i}" aria-label="Delete take ${i + 1}">×</button>` : ''}</li>`).join('')}</ol>
      <form class="tk-pop-add" data-add-option><input name="alt" autocomplete="off" placeholder="Another take…" aria-label="Write another take"/><button type="submit">Add</button></form>
      <div class="tk-pop-row"><button type="button" data-act="promote" title="Make the showing take the original">Make original</button><button type="button" data-act="flatten" title="Keep the showing take, drop the rest">Keep this</button><button type="button" data-act="close-pop">Done</button></div>`;
    pop.hidden = false;
    const r = anchor.getBoundingClientRect();
    const host = root.getBoundingClientRect();
    const w = Math.min(340, host.width - 24);
    pop.style.width = `${w}px`;
    let left = r.left - host.left;
    left = Math.max(12, Math.min(left, host.width - w - 12));
    pop.style.left = `${left}px`;
    pop.style.top = `${r.bottom - host.top + 10}px`;
  }
  function closePop() { pop.hidden = true; popTarget = null; }

  // --- selection → source range ---
  const pointToSrc = (node, offset) => {
    let el = node.nodeType === 3 ? node.parentElement : node;
    if (node.nodeType !== 3) {
      // element boundary: try the child text span
      const child = node.childNodes[offset] || node.childNodes[offset - 1];
      if (child && child.nodeType === 1 && child.matches?.('.tk-t')) return +child.dataset.s + (node.childNodes[offset] ? 0 : child.textContent.length);
      return null;
    }
    if (!el.matches('.tk-t')) return null;
    return +el.dataset.s + offset;
  };
  const readSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const startBlock = (range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer).closest?.('.tk-block');
    const endBlock = (range.endContainer.nodeType === 3 ? range.endContainer.parentElement : range.endContainer).closest?.('.tk-block');
    if (!startBlock || startBlock !== endBlock || !page.contains(startBlock)) return { error: 'Keep the selection inside one paragraph.' };
    const b = +startBlock.dataset.b;
    let s = pointToSrc(range.startContainer, range.startOffset);
    let e = pointToSrc(range.endContainer, range.endOffset);
    if (s === null || e === null) return { error: 'Start and end the selection on plain words, outside existing takes.' };
    const block = state.doc.blocks[b];
    const src = block.versions[block.active];
    while (s < e && /\s/.test(src[s])) s++;
    while (e > s && /\s/.test(src[e - 1])) e--;
    if (!rangeIsClean(src, s, e)) return { error: 'That selection cuts through a take or a dim. Try a little wider or narrower.' };
    return { b, s, e, text: src.slice(s, e) };
  };

  const showSelbar = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || state.editing !== null) { selbar.hidden = true; return; }
    const info = readSelection();
    if (!info) { selbar.hidden = true; return; }
    const range = sel.getRangeAt(0);
    const r = range.getBoundingClientRect();
    const host = root.getBoundingClientRect();
    selbar.hidden = false;
    selbar.dataset.error = info.error || '';
    $('[data-selbar-msg]').textContent = info.error || '';
    const w = selbar.offsetWidth || 280;
    selbar.style.left = `${Math.max(8, Math.min(r.left - host.left + r.width / 2 - w / 2, host.width - w - 8))}px`;
    selbar.style.top = `${r.top - host.top - 48}px`;
  };

  let pendingTake = null;
  const startTake = info => {
    pendingTake = info;
    const form = $('[data-take-form]');
    form.hidden = false;
    $('[data-take-orig]').textContent = info.text;
    const input = form.querySelector('input');
    input.value = '';
    selbar.hidden = true;
    const host = root.getBoundingClientRect();
    const r = window.getSelection()?.rangeCount ? window.getSelection().getRangeAt(0).getBoundingClientRect() : { left: 40, bottom: 120 };
    const w = Math.min(380, host.width - 24);
    form.style.width = `${w}px`;
    form.style.left = `${Math.max(12, Math.min(r.left - host.left, host.width - w - 12))}px`;
    form.style.top = `${r.bottom - host.top + 10}px`;
    input.focus();
  };

  const doSelectionAction = (kind, info = readSelection()) => {
    if (!info) return flash('Select some words first.');
    if (info.error) { audio.ensure(); audio.action('error'); return flash(info.error); }
    audio.ensure();
    if (kind === 'sentence') {
      const block = state.doc.blocks[info.b];
      const src = block.versions[block.active];
      const [s, e] = sentenceBounds(src, info.s, info.e);
      if (!rangeIsClean(src, s, e)) return flash('That sentence already holds a take. Select it word by word.');
      return startTake({ b: info.b, s, e, text: src.slice(s, e) });
    }
    if (kind === 'take') return startTake(info);
    if (kind === 'dim') {
      mutateBlock(info.b, src => wrapDim(src, info.s, info.e));
      audio.action('dim', { pan: panFor(info.b) });
      announce('Dimmed');
    }
    if (kind === 'stash') {
      let cut = '';
      mutateBlock(info.b, src => { const res = cutRange(src, info.s, info.e); cut = res.cut; return res.src; });
      if (cut) state.doc.overflow.unshift(cut);
      audio.action('stash', { pan: panFor(info.b) });
      announce('Moved to the overflow stash');
      if (!state.style.showStash) flash('Stashed. Open the overflow to see it.');
    }
    window.getSelection()?.removeAllRanges();
    selbar.hidden = true;
    state.focusBlock = info.b;
    render();
  };

  // --- inline edit ---
  const commitInline = (cancel = false) => {
    const ta = page.querySelector('[data-inline]');
    const b = state.editing;
    state.editing = null;
    if (ta && !cancel) {
      const value = ta.value.replace(/\r\n?/g, '\n').trim();
      const block = state.doc.blocks[b];
      const parts = value.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      if (block && value !== block.versions[block.active]) {
        snapshot();
        if (parts.length <= 1 || block.versions.length > 1) block.versions[block.active] = value;
        else {
          block.versions[block.active] = parts[0];
          state.doc.blocks.splice(b + 1, 0, ...parts.slice(1).map(p => makeBlock([p])));
        }
        audio.action('commit', { pan: panFor(b) });
      }
      if (block && !block.versions[block.active] && block.versions.length === 1) state.doc.blocks.splice(b, 1);
    }
    render();
    const el = page.querySelector(`.tk-block[data-b="${b}"]`);
    el?.focus?.();
  };
  const startEdit = b => {
    if (state.editing !== null) commitInline();
    state.editing = b;
    state.focusBlock = b;
    closePop();
    audio.ensure();
    audio.action('edit', { pan: panFor(b) });
    render();
  };

  // --- source mode helpers ---
  const sourceWrap = kind => {
    const ta = source;
    const { selectionStart: a, selectionEnd: z, value } = ta;
    const sel = value.slice(a, z);
    if (!sel.trim()) return flash('Select some text in the source first.');
    let insert;
    if (kind === 'take') insert = `{{${sel} | }}`;
    else if (kind === 'dim') insert = `((${sel}))`;
    else if (kind === 'stash') {
      ta.value = value.slice(0, a) + value.slice(z);
      syncFromSource(true);
      state.doc.overflow.unshift(sel.trim());
      audio.ensure(); audio.action('stash');
      render();
      return;
    }
    ta.setRangeText(insert, a, z, 'end');
    if (kind === 'take') ta.setSelectionRange(a + insert.length - 3, a + insert.length - 3);
    audio.ensure(); audio.action(kind === 'dim' ? 'dim' : 'create');
    syncFromSource();
  };
  let srcSnap = false;
  const syncFromSource = (quiet = false) => {
    if (!srcSnap && !quiet) { snapshot(); srcSnap = true; setTimeout(() => { srcSnap = false; }, 1500); }
    state.doc = parseDoc(source.value);
    state.focusTake = null;
    render({ keepSource: true });
  };

  // --- file ---
  const download = (name, text, type = 'text/markdown') => {
    const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };
  const titleSlug = () => {
    const first = state.doc.blocks.find(b => /^#\s/.test(b.versions[b.active]));
    const t = first ? first.versions[first.active].replace(/^#+\s*/, '') : 'takes';
    return t.toLowerCase().replace(/[{}()|>]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'takes';
  };

  // --- events ---
  root.addEventListener('click', e => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const act = t.closest('[data-act]');
    const take = t.closest('.tk-take');
    if (take && !act && page.contains(take)) {
      const b = +take.dataset.b, g = +take.dataset.g;
      state.focusTake = { b, g };
      state.focusBlock = b;
      markFocus();
      audio.ensure();
      if (popTarget && popTarget.b === b && popTarget.g === g) closePop(); else openPop(b, g);
      take.focus();
      return;
    }
    if (!act) {
      if (!pop.contains(t)) closePop();
      const blockEl = t.closest('.tk-block');
      if (blockEl && page.contains(blockEl)) { state.focusBlock = +blockEl.dataset.b; markFocus(); }
      return;
    }
    const name = act.dataset.act;
    const blockEl = act.closest('.tk-block');
    const b = blockEl ? +blockEl.dataset.b : state.focusBlock;
    const i = +act.dataset.i;
    switch (name) {
      case 'prev-version': cycleVersion(b, -1); break;
      case 'next-version': cycleVersion(b, 1); break;
      case 'add-version': addVersion(b); break;
      case 'edit': startEdit(b); break;
      case 'add-para': {
        snapshot();
        state.doc.blocks.push(makeBlock(['']));
        startEdit(state.doc.blocks.length - 1);
        break;
      }
      case 'pick': if (popTarget) cycleTake(popTarget.b, popTarget.g, i - (+page.querySelector(`.tk-take[data-b="${popTarget.b}"][data-g="${popTarget.g}"]`)?.dataset.active || 0)); break;
      case 'remove-option': if (popTarget) { const { b: pb, g } = popTarget; mutateBlock(pb, src => removeTakeOption(src, g, i)); audio.action('stash'); render(); openPop(pb, g); } break;
      case 'promote': if (popTarget) { const { b: pb, g } = popTarget; mutateBlock(pb, src => promoteTake(src, g)); audio.action('promote'); flash('That take is the original now'); render(); openPop(pb, g); } break;
      case 'flatten': if (popTarget) { const { b: pb, g } = popTarget; mutateBlock(pb, src => flattenTake(src, g)); audio.action('commit'); closePop(); state.focusTake = null; render(); } break;
      case 'close-pop': closePop(); break;
      case 'sel-take': doSelectionAction('take'); break;
      case 'sel-sentence': doSelectionAction('sentence'); break;
      case 'sel-dim': doSelectionAction('dim'); break;
      case 'sel-stash': doSelectionAction('stash'); break;
      case 'src-take': sourceWrap('take'); break;
      case 'src-dim': sourceWrap('dim'); break;
      case 'src-stash': sourceWrap('stash'); break;
      case 'unstash': {
        const text = state.doc.overflow[i];
        snapshot();
        state.doc.overflow.splice(i, 1);
        const at = Math.min(state.doc.blocks.length, state.focusBlock + 1);
        state.doc.blocks.splice(at, 0, makeBlock([text]));
        state.focusBlock = at;
        audio.ensure(); audio.action('unstash');
        announce('Put back into the draft');
        render();
        break;
      }
      case 'copy-stash': navigator.clipboard?.writeText(state.doc.overflow[i]).then(() => flash('Copied'), () => flash('Copy failed')); break;
      case 'drop-stash': snapshot(); state.doc.overflow.splice(i, 1); render(); break;
      case 'toggle-stash': state.style.showStash = !state.style.showStash; applyStyle(); syncLab(); persist(); break;
      case 'open-lab': lab.hidden = !lab.hidden; act.setAttribute('aria-expanded', String(!lab.hidden)); audio.ensure(); if (!lab.hidden) lab.querySelector('[data-tab][aria-selected="true"]')?.focus(); break;
      case 'close-lab': lab.hidden = true; $('[data-act="open-lab"]').setAttribute('aria-expanded', 'false'); break;
      case 'help': help.hidden = !help.hidden; break;
      case 'close-help': help.hidden = true; break;
      case 'sound': {
        audio.ensure();
        audio.apply({ enabled: !audio.s.enabled });
        syncLab(); persist();
        act.setAttribute('aria-pressed', String(audio.s.enabled));
        flash(audio.s.enabled ? 'Sound on' : 'Sound off');
        break;
      }
      case 'audition': audio.ensure(); audio.audition(); break;
      case 'undo': restore(state.undo, state.redo); break;
      case 'redo': restore(state.redo, state.undo); break;
      case 'save-md': download(`${titleSlug()}.takes.md`, serializeDoc(state.doc)); audio.ensure(); audio.action('save'); flash('Downloaded with every take'); break;
      case 'save-clean': download(`${titleSlug()}.md`, cleanMarkdown(state.doc)); audio.ensure(); audio.action('save'); flash('Downloaded the chosen takes only'); break;
      case 'copy-md': navigator.clipboard?.writeText(serializeDoc(state.doc)).then(() => flash('Takes Markdown copied'), () => flash('Copy failed')); break;
      case 'copy-clean': navigator.clipboard?.writeText(cleanMarkdown(state.doc)).then(() => flash('Clean copy copied'), () => flash('Copy failed')); break;
      case 'open-md': $('[data-file]').click(); break;
      case 'new-doc': {
        if (!confirm('Start a blank page? The current draft stays in undo until you reload.')) break;
        snapshot();
        state.doc = parseDoc('# Untitled\n\n');
        state.focusBlock = 0;
        render();
        break;
      }
      case 'sample': snapshot(); state.doc = parseDoc(SAMPLE_DOC); render(); break;
      case 'reset-style': state.style = { ...STYLE_DEFAULTS, layout: state.style.layout }; applyStyle(); syncLab(); decorate(); persist(); break;
      case 'reset-sound': audio.apply({ ...AUDIO_DEFAULTS, enabled: audio.s.enabled }); syncLab(); persist(); break;
      case 'preset': applyPreset(act.dataset.preset); break;
      default: break;
    }
  });

  page.addEventListener('dblclick', e => {
    const blockEl = e.target instanceof Element && e.target.closest('.tk-block');
    if (!blockEl || e.target.closest('.tk-take') || e.target.closest('[data-inline]')) return;
    if (window.getSelection()?.toString().trim() && !e.target.closest('.tk-empty')) {
      // a double-click selected a word: offer the selection bar instead
      setTimeout(showSelbar, 0);
      return;
    }
    startEdit(+blockEl.dataset.b);
  });

  page.addEventListener('focusin', e => {
    const take = e.target instanceof Element && e.target.closest('.tk-take');
    if (take) { state.focusTake = { b: +take.dataset.b, g: +take.dataset.g }; state.focusBlock = +take.dataset.b; markFocus(); }
  });

  page.addEventListener('input', e => {
    if (e.target.matches?.('[data-inline]')) autosize(e.target);
  });

  page.addEventListener('focusout', e => {
    if (e.target.matches?.('[data-inline]') && state.editing !== null) {
      setTimeout(() => { if (state.editing !== null && !page.contains(document.activeElement)) commitInline(); }, 120);
    }
  });

  document.addEventListener('selectionchange', () => {
    if (!root.isConnected) return;
    clearTimeout(showSelbar.t);
    showSelbar.t = setTimeout(showSelbar, 120);
  });

  $('[data-take-form]').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.currentTarget;
    const value = form.querySelector('input').value;
    form.hidden = true;
    if (!pendingTake) return;
    const { b, s, e: end } = pendingTake;
    pendingTake = null;
    let g = null;
    mutateBlock(b, src => {
      const next = wrapTake(src, s, end, value);
      const t = flatTakes(blockTokens(next).tokens).find(tok => tok.s === s);
      g = t ? t.g : null;
      return next;
    });
    window.getSelection()?.removeAllRanges();
    state.focusTake = g === null ? null : { b, g };
    state.focusBlock = b;
    audio.action('create', { pan: panFor(b) });
    announce('New take added. Arrow keys switch between them.');
    render();
    page.querySelector(`.tk-take[data-b="${b}"][data-g="${g}"]`)?.focus();
  });
  $('[data-take-form]').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.currentTarget.hidden = true; pendingTake = null; }
  });

  pop.addEventListener('submit', e => {
    if (!e.target.matches('[data-add-option]') || !popTarget) return;
    e.preventDefault();
    const value = e.target.querySelector('input').value;
    const { b, g } = popTarget;
    if (!mutateBlock(b, src => addTakeOption(src, g, value))) return;
    audio.action('create', { pan: panFor(b) });
    render();
    openPop(b, g);
    pop.querySelector('input')?.focus();
  });

  // keyboard
  root.addEventListener('keydown', e => {
    const t = e.target;
    const mod = e.metaKey || e.ctrlKey;
    if (t.matches?.('[data-inline]')) {
      audio.key(e.key);
      if (e.key === 'Escape') { e.preventDefault(); commitInline(true); }
      else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitInline(); }
      return;
    }
    if (t === source) {
      audio.key(e.key);
      if (e.altKey && (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3')) {
        e.preventDefault();
        sourceWrap({ Digit1: 'take', Digit2: 'dim', Digit3: 'stash' }[e.code]);
      }
      if (e.key === 'Escape' && state.style.layout === 'write') { setLayout('play'); }
      return;
    }
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); restore(e.shiftKey ? state.redo : state.undo, e.shiftKey ? state.undo : state.redo); return; }
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); persist(); flash('Saved in this browser'); return; }
    if (mod || e.altKey) return;
    if (t.matches?.('input, select, textarea') || t.closest?.('[data-lab]')) {
      if (e.key === 'Escape' && t.closest?.('[data-lab]')) { lab.hidden = true; }
      return;
    }
    if (pop.contains(t) && e.key !== 'Escape') return;

    const take = t.closest?.('.tk-take');
    const key = e.key;
    const hasSel = window.getSelection() && !window.getSelection().isCollapsed;
    if (hasSel && ['t', 'T', 'd', 'D', 's', 'S', '.'].includes(key)) {
      e.preventDefault();
      doSelectionAction({ t: 'take', d: 'dim', s: 'stash', '.': 'sentence' }[key.toLowerCase()]);
      return;
    }
    if (take) {
      const b = +take.dataset.b, g = +take.dataset.g;
      if (key === 'ArrowRight' || key === 'ArrowDown') { e.preventDefault(); return cycleTake(b, g, 1); }
      if (key === 'ArrowLeft' || key === 'ArrowUp') { e.preventDefault(); return cycleTake(b, g, -1); }
      if (key === 'o' || key === 'O' || key === 'Home') { e.preventDefault(); return backToOriginal(b, g); }
      if (key === 'Enter' || key === ' ') { e.preventDefault(); return popTarget ? closePop() : openPop(b, g); }
      if (key === 'Delete' || key === 'Backspace') { e.preventDefault(); mutateBlock(b, src => flattenTake(src, g)); audio.action('commit'); state.focusTake = null; closePop(); return render(); }
    }
    if (key === 'Escape') { closePop(); selbar.hidden = true; help.hidden = true; lab.hidden = true; return; }
    if (key === '?') { e.preventDefault(); help.hidden = !help.hidden; return; }
    const b = state.focusBlock;
    if (key === '[') { e.preventDefault(); return cycleVersion(b, -1); }
    if (key === ']') { e.preventDefault(); return cycleVersion(b, 1); }
    if (key === 'p' || key === 'P') { e.preventDefault(); return addVersion(b); }
    if (key === 'e' || key === 'E') { e.preventDefault(); return startEdit(b); }
    if (key === 'u' || key === 'U') {
      const block = state.doc.blocks[b];
      const src = block?.versions[block.active] || '';
      const dimEl = take?.closest('[data-dim]') || page.querySelector(`.tk-block[data-b="${b}"] [data-dim]`);
      if (dimEl) { e.preventDefault(); mutateBlock(b, s => unwrapDimAt(s, +dimEl.dataset.dim)); audio.action('undim', { pan: panFor(b) }); announce('Brought back'); return render(); }
      if (!src) return;
    }
    if (key === 'w' || key === 'W') { e.preventDefault(); return setLayout(state.style.layout === 'write' ? 'play' : 'write'); }
    if (key === 'f' || key === 'F') { e.preventDefault(); state.style.focus = !state.style.focus; applyStyle(); syncLab(); persist(); return flash(state.style.focus ? 'Focus on' : 'Focus off'); }
    if (key === 'm' || key === 'M') { e.preventDefault(); audio.ensure(); audio.apply({ enabled: !audio.s.enabled }); syncLab(); persist(); return flash(audio.s.enabled ? 'Sound on' : 'Sound off'); }
    if (key === 'j' || key === 'n') { e.preventDefault(); return stepTake(1); }
    if (key === 'k' || key === 'b') { e.preventDefault(); return stepTake(-1); }
  });

  const stepTake = dir => {
    const all = $$('.tk-take');
    if (!all.length) return flash('No takes yet. Select words and press T.');
    const cur = all.indexOf(document.activeElement);
    const next = all[(cur + dir + all.length) % all.length] || all[0];
    next.focus();
    next.scrollIntoView({ block: 'nearest' });
    audio.ensure();
    audio.take(+next.dataset.active, { pan: panFor(+next.dataset.b) });
  };

  source.addEventListener('input', () => syncFromSource());

  // stash drag back into the page
  stashList.addEventListener('dragstart', e => {
    const li = e.target.closest('[data-stash]');
    if (li) e.dataTransfer.setData('text/x-takes-stash', li.dataset.stash);
  });
  page.addEventListener('dragover', e => { if ([...e.dataTransfer.types].includes('text/x-takes-stash')) e.preventDefault(); });
  page.addEventListener('drop', e => {
    const i = e.dataTransfer.getData('text/x-takes-stash');
    if (i === '') return;
    e.preventDefault();
    const blockEl = e.target.closest('.tk-block');
    state.focusBlock = blockEl ? +blockEl.dataset.b : state.doc.blocks.length - 1;
    root.querySelector(`[data-act="unstash"][data-i="${i}"]`)?.click();
  });
  // drop selected text onto the stash
  $('[data-stash]').addEventListener('dragover', e => { if (e.dataTransfer.types.includes('text/plain')) e.preventDefault(); });
  $('[data-stash]').addEventListener('drop', e => {
    e.preventDefault();
    const info = readSelection();
    if (info && !info.error) doSelectionAction('stash', info);
  });

  $('[data-file]').addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) return flash('That file is over 2 MB.');
    const text = await file.text();
    snapshot();
    state.doc = parseDoc(text);
    state.focusBlock = 0;
    render();
    flash(`Opened ${file.name}`);
    e.target.value = '';
  });

  // --- layout ---
  const setLayout = mode => {
    if (state.editing !== null) commitInline();
    state.style.layout = mode;
    applyStyle();
    syncLab();
    persist();
    if (mode === 'write') source.focus();
    announce(mode === 'write' ? 'Write mode: Markdown source' : mode === 'split' ? 'Split mode' : 'Play mode');
  };
  $$('[data-mode]').forEach(btn => btn.addEventListener('click', () => setLayout(btn.dataset.mode)));

  // --- lab (settings) ---
  const getPath = path => {
    const [group, key] = path.split('.');
    return group === 'audio' ? audio.s[key] : state.style[key];
  };
  const setPath = (path, value) => {
    const [group, key] = path.split('.');
    if (group === 'audio') {
      audio.ensure();
      audio.apply({ [key]: value });
      if (['voice', 'scale', 'root', 'octave', 'length', 'originalVoice'].includes(key)) audio.take(1 + Math.floor(Math.random() * 3), {});
    } else {
      state.style[key] = value;
      applyStyle();
      decorate();
    }
    persist();
  };
  function syncLab() {
    $$('[data-set]').forEach(input => {
      const v = getPath(input.dataset.set);
      if (input.type === 'checkbox') input.checked = !!v;
      else input.value = String(v);
      const out = root.querySelector(`[data-out="${input.dataset.set}"]`);
      if (out) out.textContent = input.dataset.unit === '%' ? `${Math.round(v * 100)}%` : `${v}${input.dataset.unit || ''}`;
    });
    $('[data-act="sound"]').setAttribute('aria-pressed', String(audio.s.enabled));
  }
  $$('[data-set]').forEach(input => {
    const handler = () => {
      let v = input.type === 'checkbox' ? input.checked : input.value;
      if (input.type === 'range' || input.dataset.num) v = Number(v);
      setPath(input.dataset.set, v);
      syncLab();
    };
    input.addEventListener(input.type === 'range' ? 'input' : 'change', handler);
  });
  $$('[data-tab]').forEach(tab => tab.addEventListener('click', () => {
    $$('[data-tab]').forEach(x => x.setAttribute('aria-selected', String(x === tab)));
    $$('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== tab.dataset.tab; });
  }));

  const PRESETS = {
    'editors-pen': { style: { theme: 'midnight', font: 'plex', underline: 'pen', wobble: 0.45, texture: 'grain' }, audio: { voice: 'glass', scale: 'pentatonic', reverb: 0.35, ambience: 'off', keys: 'off' } },
    'beach-house': { style: { theme: 'dusk', font: 'newsreader', underline: 'pen', wobble: 0.7, texture: 'paper' }, audio: { voice: 'kalimba', scale: 'lydian', reverb: 0.5, ambience: 'ocean', keys: 'drops' } },
    'night-terminal': { style: { theme: 'phosphor', font: 'jetbrains', underline: 'dotted', wobble: 0.1, texture: 'scan' }, audio: { voice: 'chip', scale: 'minorPent', reverb: 0.15, echo: 0.25, ambience: 'tape', keys: 'tick' } },
    'manuscript': { style: { theme: 'paper', font: 'literata', underline: 'pen', wobble: 0.6, texture: 'paper' }, audio: { voice: 'pluck', scale: 'dorian', reverb: 0.4, ambience: 'rain', keys: 'typewriter' } },
    'riso-zine': { style: { theme: 'riso', font: 'courier', underline: 'marker', wobble: 0.8, texture: 'grain' }, audio: { voice: 'marimba', scale: 'pentatonic', reverb: 0.25, ambience: 'off', keys: 'notes' } },
    'deep-focus': { style: { theme: 'ink', font: 'atkinson', underline: 'straight', wobble: 0, texture: 'none', focus: true }, audio: { voice: 'pad', scale: 'insen', reverb: 0.6, ambience: 'drone', keys: 'off' } },
  };
  const applyPreset = name => {
    const p = PRESETS[name];
    if (!p) return;
    state.style = { ...state.style, ...p.style };
    audio.ensure();
    audio.apply(p.audio);
    applyStyle(); syncLab(); decorate(); persist();
    audio.audition();
    flash(`Preset: ${name.replace(/-/g, ' ')}`);
  };

  // theme colours change → redraw tiles
  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  root.dataset.motion = mq?.matches ? 'reduced' : 'ok';
  window.addEventListener('resize', () => { closePop(); selbar.hidden = true; });

  applyStyle();
  syncLab();
  render();
  $('[data-saved]').textContent = saved.md ? 'Restored from this browser' : 'Sample draft · edits save in this browser';
  return { state, audio, render };
}
