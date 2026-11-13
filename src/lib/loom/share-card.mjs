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
import { clean, esc, fitTitle, wrap } from '../unfurl/cards.mjs';
import { nounForPath } from '../unfurl/rooms.mjs';
import { parseAddress } from './address.mjs';

export const SITE = 'https://pointcast.xyz';
const INBOX_KINDS = new Set(['handle', 'agent', 'wallet', 'did']);
const EXCERPT = 90;

const PAPER = '#f4f5f2';
const INK = '#101214';
const INK2 = '#5b6168';
const SIGNAL = '#1f4fd8';
const HAIR = '#d6d9d2';
const SANS = 'Inter, system-ui, sans-serif';
const MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';

/** The house robot, or any verified sender. "robot" cannot be claimed by a poster (SENDER_KINDS is human|agent). */
export function isTrustedSender(from) {
  if (!from) return false;
  return from.verified === true || (from.kind === 'robot' && from.name === 'Collator');
}

/**
 * Open questions: visible messages of kind 'question' that have no visible
 * direct reply of kind 'answer'. Replies to replies do not close it.
 */
export function openQuestions(messages) {
  const list = Array.isArray(messages) ? messages.filter((m) => m && !m.hidden) : [];
  const answered = new Set(list.filter((m) => m.kind === 'answer' && m.parent).map((m) => m.parent));
  return list.filter((m) => m.kind === 'question' && !answered.has(m.id)).length;
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
  const label = clean(log.label || parsed?.label || canonical, 'thread');

  const bySeq = [...messages].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  const first = bySeq[0];
  const lastMsg = bySeq.at(-1);
  const titleTrusted = !!log.title && !inbox && isTrustedSender(first?.from);
  const name = clean(titleTrusted ? log.title : label, 'thread');

  const tasks = kind === 'topic' && /^#.+-tasks$/i.test(canonical);
  const counts = {
    messages: Number.isFinite(apiJson?.count) ? apiJson.count : messages.length,
    people: participants.filter((p) => p.kind === 'human').length,
    agents: participants.filter((p) => p.kind === 'agent' || p.kind === 'robot').length,
    openQuestions: openQuestions(messages),
    tasks,
  };
  const openLabel = counts.openQuestions ? `${counts.openQuestions} open ${tasks ? (counts.openQuestions === 1 ? 'task' : 'tasks') : (counts.openQuestions === 1 ? 'question' : 'questions')}` : '';

  let last = null;
  if (lastMsg) {
    const showText = !inbox && isTrustedSender(lastMsg.from);
    last = {
      name: clean(lastMsg.from?.name, 'someone').slice(0, 40),
      kind: ['human', 'agent', 'robot'].includes(lastMsg.from?.kind) ? lastMsg.from.kind : 'human',
      text: showText ? excerptOf(lastMsg.body) || null : null,
      at: lastMsg.at ?? null,
    };
  }
  return {
    address: canonical,
    kind,
    inbox,
    title: `${name} · the Loom`,
    name,
    description: countsLine(counts),
    counts,
    openLabel,
    last,
    seq: Number(apiJson?.seq) || 0,
    updatedAt: log.updatedAt ?? null,
    noun: nounForPath(canonical),
  };
}

const enc = encodeURIComponent;

/** Tag values for the page head. `address` is the one the share link used; the log's own canonical address wins. */
export function metaFor(summary, address, seq = summary?.seq ?? 0) {
  const canonical = summary?.address || address;
  const s = Math.max(0, Math.floor(Number(seq) || 0));
  const url = `${SITE}/loom?to=${enc(canonical)}`;
  return {
    title: summary.title,
    description: summary.description,
    url,
    canonical: url,
    image: `${SITE}/og/loom.png?to=${enc(canonical)}&s=${s}`,
    imageWidth: '1200',
    imageHeight: '630',
    imageAlt: `${summary.name} on the Loom: ${summary.description}`,
    twitterCard: 'summary_large_image',
    rss: `${SITE}/api/loom?to=${enc(canonical)}&format=rss`,
    rssTitle: `${summary.name} · the Loom (RSS)`,
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

const chip = (x, y, text, { fill = 'none', stroke = INK, color = INK } = {}) => {
  const w = Math.round(text.length * 12.6 + 32);
  return { w, svg: `<rect x="${x}" y="${y}" width="${w}" height="44" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/><text x="${x + 16}" y="${y + 29}" font-family="${MONO}" font-size="20" font-weight="700" letter-spacing="1" fill="${color}">${esc(text)}</text>` };
};

/** 1200x630 card. `nounHref` is a data: URI the route fetched (optional); `now` stamps the "live" line. */
export function buildSvg(summary, { nounHref = '', now = Date.now() } = {}) {
  const textW = nounHref ? 760 : 1040;
  const t = fitTitle(summary.name, textW, 2);
  const titleY = 190 + t.size;
  const titleSvg = t.lines.map((line, i) => `<text x="64" y="${titleY + i * t.size * 1.05}" font-family="${SANS}" font-size="${t.size}" font-weight="800" letter-spacing="-2" fill="${INK}">${esc(line)}</text>`).join('');
  const afterTitle = titleY + (t.lines.length - 1) * t.size * 1.05;

  const labels = summary.description.split(' · ').filter((p) => p !== summary.openLabel);
  let x = 64;
  const chipY = afterTitle + 36;
  let chips = '';
  for (const label of labels) {
    const c = chip(x, chipY, label.toUpperCase());
    chips += c.svg; x += c.w + 12;
  }
  if (summary.openLabel) chips += chip(x, chipY, summary.openLabel.toUpperCase(), { fill: SIGNAL, stroke: SIGNAL, color: '#ffffff' }).svg;

  let lastSvg = '';
  const lastY = chipY + 44 + 56;
  if (summary.last) {
    const who = `${summary.last.name} · ${summary.last.kind}`;
    const when = ago(summary.last.at, now);
    lastSvg += `<text x="64" y="${lastY}" font-family="${MONO}" font-size="17" font-weight="700" letter-spacing="1" fill="${INK2}">${esc(`LAST POST · ${who}${when ? ` · ${when}` : ''}`.toUpperCase())}</text>`;
    const line = summary.last.text
      ? wrap(`“${summary.last.text}”`, { size: 26, width: textW, k: 0.52, maxLines: 2 })
      : [`${summary.last.name} posted · open the thread to read it`];
    lastSvg += line.map((l, i) => `<text x="64" y="${lastY + 40 + i * 34}" font-family="${SANS}" font-size="26" font-weight="${summary.last.text ? 500 : 400}" fill="${summary.last.text ? INK : INK2}">${esc(l)}</text>`).join('');
  } else {
    lastSvg = `<text x="64" y="${lastY}" font-family="${SANS}" font-size="26" fill="${INK2}">${esc('Nothing here yet · be the first to append')}</text>`;
  }

  const noun = nounHref
    ? `<rect x="896" y="186" width="240" height="240" fill="${SIGNAL}" transform="translate(8 8)"/><rect x="896" y="186" width="240" height="240" fill="#ffffff" stroke="${INK}" stroke-width="3"/><image x="899" y="189" width="234" height="234" href="${nounHref}" xlink:href="${nounHref}" preserveAspectRatio="xMidYMid slice"/>`
    : '';
  const live = `LIVE AT SHARE TIME · ${new Date(now).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  const label = `${summary.name} on the Loom: ${summary.description}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${esc(clean(label))}">
<rect width="1200" height="630" fill="${PAPER}"/>
<rect x="24" y="24" width="1152" height="582" fill="none" stroke="${INK}" stroke-width="3"/>
<text x="64" y="86" font-family="${SANS}" font-size="30" font-weight="800" fill="${INK}">The Loom</text>
<text x="1136" y="86" text-anchor="end" font-family="${MONO}" font-size="18" font-weight="700" letter-spacing="1" fill="${INK2}">POINTCAST.XYZ/LOOM</text>
<line x1="64" y1="110" x2="1136" y2="110" stroke="${HAIR}" stroke-width="2"/>
${titleSvg}${noun}${chips}${lastSvg}
<line x1="64" y1="560" x2="1136" y2="560" stroke="${HAIR}" stroke-width="2"/>
<circle cx="72" cy="582" r="6" fill="${SIGNAL}"/>
<text x="90" y="588" font-family="${MONO}" font-size="16" font-weight="700" letter-spacing="1" fill="${INK2}">${esc(live)}</text>
</svg>`;
}
