/**
 * Share cards for Loom threads (OFF-31): the pure part. Given the JSON that
 * GET /api/loom?to=<address> returns, decide what a preview may say, draw the
 * 1200x630 card as SVG, and produce the tag values for the page head.
 *
 * The words rule: a stranger's words never reach a card by default. The
 * latest message's text is shown only when its sender is verified or is the
 * house robot Collator, and never for an inbox (@handle, agent:, wallet, did).
 * No message-quality ("recommended") filter exists in the repo yet (OFF-16
 * is not built), so verified/Collator is the whole rule. The same rule covers
 * the thread title: log.title is typed by whoever posted first, so it is used
 * only when that first poster is trusted; otherwise the address label stands.
 */
import { clean, esc, heavy, wrap } from '../unfurl/cards.mjs';
import { nounForPath } from '../unfurl/rooms.mjs';
import { parseAddress } from './address.mjs';
import { nounBackground, nounRecipe, nounRects } from './noun-card.mjs';

export const SITE = 'https://pointcast.xyz';
const INBOX_KINDS = new Set(['handle', 'agent', 'wallet', 'did']);
const EXCERPT = 90;

const INK = '#101214';
const INK2 = '#5b6168';
const SANS = 'Inter, system-ui, sans-serif';
const MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';

/** The house robot, or any verified sender. "robot" cannot be claimed by a poster (SENDER_KINDS is human|agent). */
export function isTrustedSender(from) {
  if (!from) return false;
  return from.verified === true || (from.kind === 'robot' && from.name === 'Collator');
}

/**
 * Open questions, same rule as questionStatus() in src/pages/loom/index.astro:
 * a visible question is answered when any visible direct reply is not from the
 * robot; with no visible replies it is answered if its reply count is above 0
 * (replies we cannot see still count). Kind 'answer' is not special.
 */
export function openQuestions(messages) {
  const list = Array.isArray(messages) ? messages.filter((m) => m && !m.hidden) : [];
  let open = 0;
  for (const q of list) {
    if (q.kind !== 'question') continue;
    const kids = list.filter((r) => r !== q && r.parent === q.id);
    const answered = kids.length ? kids.some((r) => r.from?.kind !== 'robot') : Number(q.replies) > 0;
    if (!answered) open += 1;
  }
  return open;
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function countsLine(c) {
  const parts = [plural(c.messages, 'message')];
  if (c.people) parts.push(plural(c.people, 'person', 'people'));
  if (c.agents) parts.push(plural(c.agents, 'agent'));
  if (c.openQuestions) parts.push(`${c.openQuestions} open ${c.tasks ? (c.openQuestions === 1 ? 'task' : 'tasks') : (c.openQuestions === 1 ? 'question' : 'questions')}`);
  return parts.join(' · ');
}

function excerptOf(text, n = EXCERPT) {
  const t = clean(text);
  return t.length > n ? `${t.slice(0, n - 1).replace(/\s+$/, '')}…` : t;
}

/**
 * @param apiJson  the parsed body of GET /api/loom?to=...
 * @param address  the address the caller asked for (any spelling)
 */
export function summarize(apiJson, address) {
  const log = apiJson?.log ?? {};
  const messages = Array.isArray(apiJson?.messages) ? apiJson.messages.filter((m) => m && !m.hidden) : [];
  const participants = Array.isArray(apiJson?.participants) ? apiJson.participants : [];
  let parsed = null;
  try { parsed = parseAddress(address); } catch { /* the log's own kind decides */ }
  const kind = log.kind || parsed?.kind || 'unknown';
  const inbox = INBOX_KINDS.has(kind) || INBOX_KINDS.has(parsed?.kind);
  const canonical = log.address || parsed?.address || String(address ?? '');
  const count = Number.isFinite(apiJson?.count) ? apiJson.count : messages.length;
  const empty = count === 0;

  // Address words are attacker-chosen until someone has posted: an empty thread gets a generic title,
  // and a URL thread shows its host only (never path text), except home-site paths once the thread has posts.
  let label = clean(log.label || parsed?.label || canonical, 'thread');
  let canonicalParsed = null;
  try { canonicalParsed = parseAddress(canonical); } catch { /* keep label */ }
  if (canonicalParsed?.kind === 'url' && !(canonicalParsed.home && !empty)) label = clean(canonicalParsed.host, 'thread');

  const bySeq = [...messages].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  const first = bySeq[0];
  const lastMsg = bySeq.at(-1);
  const titleTrusted = !!log.title && !inbox && !empty && isTrustedSender(first?.from);
  const name = empty ? 'A new Loom thread' : clean(titleTrusted ? log.title : label, 'thread');

  const tasks = kind === 'topic' && /^#.+-tasks$/i.test(canonical);
  const counts = {
    messages: count,
    people: participants.filter((p) => p.kind === 'human').length,
    agents: participants.filter((p) => p.kind === 'agent').length,
    openQuestions: openQuestions(messages),
    tasks,
  };
  const openLabel = counts.openQuestions ? `${counts.openQuestions} open ${tasks ? (counts.openQuestions === 1 ? 'task' : 'tasks') : (counts.openQuestions === 1 ? 'question' : 'questions')}` : '';

  // Inbox and empty cards: counts only, no last-poster line. Otherwise the poster's name and text are shown only for trusted senders.
  let last = null;
  if (lastMsg && !inbox && !empty) {
    const trusted = isTrustedSender(lastMsg.from);
    let text = null;
    if (trusted) {
      if (lastMsg.from.kind === 'robot' && lastMsg.kind === 'link') {
        const n = (lastMsg.links ?? lastMsg.cites ?? []).length;
        text = n ? `Collator linked ${plural(n, 'other thread')}` : 'Collator linked other threads';
      } else text = excerptOf(lastMsg.body) || null;
    }
    last = {
      name: trusted ? clean(lastMsg.from?.name, 'Someone').slice(0, 40) : null,
      kind: trusted ? lastMsg.from.kind : null,
      text,
      at: lastMsg.at ?? null,
    };
  }
  return {
    address: canonical,
    replyAddress: parsed?.kind === 'reply' ? parsed.address : null,
    kind,
    inbox,
    empty,
    title: `${name} \u00B7 the Loom`,
    name,
    description: empty ? 'No messages yet' : countsLine(counts),
    counts,
    openLabel,
    last,
    seq: Number(apiJson?.seq) || 0,
    updatedAt: log.updatedAt ?? null,
    noun: nounForPath(canonical),
  };
}

const enc = encodeURIComponent;

// The text column: x=80 up to the Noun window's left edge (810) less a margin. Nothing in it may pass TEXT_RIGHT.
const TEXT_X = 80;
const WINDOW_X = 810;
const TEXT_RIGHT = WINDOW_X - 32;
const TITLE_SIZES = [84, 76, 68, 60, 54, 48, 42, 36];
const TITLE_FLOOR = TITLE_SIZES.at(-1);
const TITLE_TWO_LINE_MAX = 60; // two lines above this push the last-post line into the dry line at the foot

/** Advance of one glyph in em, Inter, rounded up so the estimate errs wide. */
function glyphEm(ch) {
  if (ch === '\u2026') return 0.9;
  if (/[iIjl.,:;'|!\u2019\u00B7 ]/.test(ch)) return 0.32;
  if (/[frt()\-\u2013/\\]/.test(ch)) return 0.42;
  if (/[mwMW@%\u2014\u00C6\u00E6\u0152\u0153]/.test(ch)) return 1;
  if (/[0-9#$+=~_?<>&]/.test(ch)) return 0.68;
  if (ch !== ch.toLowerCase()) return 0.78; // capitals, accented ones included
  return 0.62;
}

/** Estimated drawn width in px of a title line at `size` (letter-spacing -2, plus the heavy stroke). */
export function titleWidth(text, size) {
  let em = 0;
  for (const ch of String(text)) em += glyphEm(ch);
  return Math.max(0, em * size - 2 * [...String(text)].length + size * 0.045);
}

/** Greedy wrap by estimated width. Returns null when a single word is wider than the column. */
function wrapTitle(words, size, maxW) {
  const lines = [];
  let line = '';
  for (const w of words) {
    if (titleWidth(w, size) > maxW) return null;
    if (!line) line = w;
    else if (titleWidth(`${line} ${w}`, size) <= maxW) line += ` ${w}`;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Fit the title to its column: step the size down until it fits whole (one line, or two at the smaller sizes);
 * only at the floor size is it cut, and then it runs on to a second line before the ellipsis.
 */
export function fitLoomTitle(text, maxW = TEXT_RIGHT - TEXT_X) {
  const title = clean(text, 'thread');
  const words = title.split(' ').filter(Boolean);
  for (const size of TITLE_SIZES) {
    const lines = wrapTitle(words, size, maxW);
    if (lines && (lines.length === 1 || (lines.length === 2 && size <= TITLE_TWO_LINE_MAX))) return { size, lines, truncated: false };
  }
  const size = TITLE_FLOOR;
  const lines = [''];
  let truncated = false;
  for (const ch of title) {
    const cur = lines.at(-1);
    if (ch === ' ' && !cur) continue;
    if (titleWidth(cur + ch, size) <= maxW) { lines[lines.length - 1] = cur + ch; continue; }
    if (lines.length < 2) {
      // Prefer to break at the last space; a word with none (a host, a long handle) is split where it stands.
      const sp = cur.lastIndexOf(' ');
      if (ch === ' ') lines.push('');
      else if (sp > 0) { lines[0] = cur.slice(0, sp); lines.push(cur.slice(sp + 1) + ch); }
      else lines.push(ch);
      continue;
    }
    truncated = true;
    let cut = cur.replace(/\s+$/, '');
    while (cut && titleWidth(`${cut}\u2026`, size) > maxW) cut = cut.slice(0, -1);
    lines[1] = `${cut}\u2026`;
    break;
  }
  return { size, lines: lines.filter(Boolean), truncated };
}

/**
 * Tag values for the page head. Empty threads keep the generic /loom canonical, add noindex and no image.
 * A reply address keeps its own og:url; the image and counts are the parent thread's.
 */
export function metaFor(summary, address, seq = summary?.seq ?? 0) {
  const canonical = summary?.address || address;
  const s = Math.max(0, Math.floor(Number(seq) || 0));
  const url = summary.empty ? `${SITE}/loom` : `${SITE}/loom?to=${enc(summary.replyAddress || canonical)}`;
  return {
    title: summary.title,
    description: summary.description,
    url,
    canonical: url,
    noindex: !!summary.empty,
    image: summary.empty ? null : `${SITE}/og/loom.png?to=${enc(canonical)}&s=${s}`,
    imageWidth: '1200',
    imageHeight: '630',
    imageAlt: `${summary.name} on the Loom: ${summary.description}`,
    twitterCard: summary.empty ? 'summary' : 'summary_large_image',
    rss: `${SITE}/api/loom?to=${enc(canonical)}&format=rss`,
    rssTitle: `${summary.name} \u00B7 the Loom (RSS)`,
  };
}

function ago(iso, now) {
  const t = Date.parse(iso ?? '');
  if (!Number.isFinite(t) || !Number.isFinite(now)) return '';
  const m = Math.max(0, Math.round((now - t) / 60000));
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const compact = (n) => (n >= 10000 ? `${Math.round(n / 1000)}k` : String(n));

/** 1200x630 Office Noun card. `now` stamps the date and the "live" line. The Noun is drawn from bundled trait data; nothing is fetched. */
export function buildSvg(summary, { now = Date.now() } = {}) {
  const recipe = nounRecipe(summary);
  const bgc = nounBackground(recipe.bg);
  const date = new Date(now).toISOString().slice(0, 10);
  const textW = TEXT_RIGHT - TEXT_X;
  const t = fitLoomTitle(summary.name, textW);
  const titleY = 218 + t.size;
  const titleSvg = t.lines.map((line, i) => `<text x="80" y="${Math.round(titleY + i * t.size * 1.05)}" font-family="${SANS}" font-size="${t.size}" font-weight="800" letter-spacing="-2" fill="${INK}"${heavy(t.size, INK, 800)}>${esc(line)}</text>`).join('');
  const afterTitle = Math.round(titleY + (t.lines.length - 1) * t.size * 1.05);

  const c = summary.counts;
  const bits = summary.empty ? ['NO MESSAGES YET'] : [plural(c.messages, 'message'), c.people ? plural(c.people, 'person', 'people') : '', c.agents ? plural(c.agents, 'agent') : ''].filter(Boolean)
    .map((l) => l.replace(/^\d+/, (d) => compact(Number(d))).toUpperCase());
  const countsY = afterTitle + 44;
  const counts = `<text x="80" y="${countsY}" font-family="${MONO}" font-size="21" font-weight="700" letter-spacing="1" fill="${INK}"${heavy(21, INK, 700)}>${esc(bits.join(' \u00B7 '))}</text>`;
  let chipSvg = '';
  let chipBottom = countsY + 14;
  if (summary.openLabel) {
    const label = summary.openLabel.replace(/^\d+/, (d) => compact(Number(d))).toUpperCase();
    const w = Math.round(label.length * 12.6 + 32);
    chipSvg = `<rect x="80" y="${countsY + 18}" width="${w}" height="44" fill="${INK}"/><text x="96" y="${countsY + 47}" font-family="${MONO}" font-size="20" font-weight="700" letter-spacing="1" fill="#ffffff"${heavy(20, '#ffffff', 700)}>${esc(label)}</text>`;
    chipBottom = countsY + 62;
  }

  let lastSvg = '';
  const lastY = chipBottom + 40;
  if (summary.last) {
    const who = summary.last.name ? `${summary.last.name} \u00B7 ${summary.last.kind}` : 'someone';
    const when = ago(summary.last.at, now);
    lastSvg += `<text x="80" y="${lastY}" font-family="${MONO}" font-size="15" font-weight="700" letter-spacing="1" fill="${INK2}"${heavy(15, INK2, 700)}>${esc(`LAST POST \u00B7 ${who}${when ? ` \u00B7 ${when}` : ''}`.toUpperCase())}</text>`;
    const line = summary.last.text
      ? wrap(summary.last.name === 'Collator' && summary.last.kind === 'robot' ? summary.last.text : `\u201C${summary.last.text}\u201D`, { size: 22, width: textW, k: 0.52, maxLines: 1 })
      : ['Someone posted \u00B7 open the thread to read it'];
    lastSvg += line.map((l, i) => `<text x="80" y="${lastY + 30 + i * 30}" font-family="${SANS}" font-size="22" fill="${summary.last.text ? INK : INK2}">${esc(l)}</text>`).join('');
  } else if (summary.empty) {
    lastSvg = `<text x="80" y="${lastY}" font-family="${SANS}" font-size="22" fill="${INK2}">${esc('Nothing here yet \u00B7 be the first to append')}</text>`;
  }
  const dry = recipe.line ? `<text x="80" y="548" font-family="${MONO}" font-size="18" font-weight="700" fill="${INK2}"${heavy(18, INK2, 700)}>${esc(recipe.line)}</text>` : '';

  const nounSvg = `<g data-noun-pixels="1" transform="translate(810 130)" shape-rendering="crispEdges">${nounRects(recipe.parts)}</g>`;
  const windowSvg = `<rect x="810" y="130" width="320" height="320" fill="${bgc}"/>${nounSvg}`
    + `<rect x="810" y="390" width="320" height="60" fill="#8b5a2b"/><rect x="810" y="390" width="320" height="10" fill="#a8743d"/>`
    + `<rect x="808" y="128" width="324" height="324" fill="none" stroke="${INK}" stroke-width="4"/>`;
  const live = 'LIVE AT SHARE TIME';
  const label = `${summary.name} on the Loom: ${summary.description}`;
  const strip = (x, text, anchor = 'start') => `<text x="${x}" y="42" text-anchor="${anchor}" font-family="${MONO}" font-size="17" font-weight="700" letter-spacing="2" fill="${INK}"${heavy(17, INK, 700)}>${text}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${esc(clean(label))}" data-noun="${recipe.parts.join(',')}" data-room="${esc(recipe.room ?? '')}">
<rect width="1200" height="630" fill="${bgc}"/>
${strip(40, 'OFFICE NOUN')}${strip(250, 'THE BOARD')}${strip(470, date)}${strip(1160, live, 'end')}
<rect x="50" y="82" width="1120" height="520" fill="#9a9a9a"/>
<rect x="40" y="72" width="1120" height="520" fill="#ffffff" stroke="${INK}" stroke-width="4"/>
<text x="80" y="136" font-family="${MONO}" font-size="18" font-weight="700" letter-spacing="2" fill="${INK2}"${heavy(18, INK2, 700)}>${esc(recipe.kicker)}</text>
${titleSvg}${counts}${chipSvg}${lastSvg}${dry}
${windowSvg}
</svg>`;
}
