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
import { clean, esc, fitTitle, heavy, wrap } from '../unfurl/cards.mjs';
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

const chip = (x, y, text, { fill = 'none', stroke = INK, color = INK } = {}) => {
  const w = Math.round(text.length * 12.6 + 32);
  return { w, svg: `<rect x="${x}" y="${y}" width="${w}" height="44" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/><text x="${x + 16}" y="${y + 29}" font-family="${MONO}" font-size="20" font-weight="700" letter-spacing="1" fill="${color}"${heavy(20, color, 700)}>${esc(text)}</text>` };
};

/** 1200x630 card. `nounHref` is a data: URI the route fetched (optional); `now` stamps the "live" line. */
export function buildSvg(summary, { nounHref = '', now = Date.now() } = {}) {
  const textW = nounHref ? 760 : 1040;
  const t = fitTitle(summary.name, textW, 2);
  const titleY = 190 + t.size;
  const titleSvg = t.lines.map((line, i) => `<text x="64" y="${titleY + i * t.size * 1.05}" font-family="${SANS}" font-size="${t.size}" font-weight="800" letter-spacing="-2" fill="${INK}"${heavy(t.size, INK, 800)}>${esc(line)}</text>`).join('');
  const afterTitle = titleY + (t.lines.length - 1) * t.size * 1.05;

  const c = summary.counts;
  const labels = summary.empty ? [] : [plural(c.messages, 'message'), c.people ? plural(c.people, 'person', 'people') : '', c.agents ? plural(c.agents, 'agent') : ''].filter(Boolean)
    .map((l) => l.replace(/^\d+/, (d) => compact(Number(d))));
  const chipsOf = summary.openLabel ? [...labels.map((l) => ({ l })), { l: summary.openLabel.replace(/^\d+/, (d) => compact(Number(d))), open: true }] : labels.map((l) => ({ l }));
  let x = 64, row = 0;
  const maxX = 64 + textW;
  let chips = '';
  for (const { l, open } of chipsOf) {
    const w = Math.round(l.length * 12.6 + 32);
    if (x + w > maxX && x > 64) { x = 64; row += 1; }
    const y = afterTitle + 36 + row * 56;
    const ch = open ? chip(x, y, l.toUpperCase(), { fill: SIGNAL, stroke: SIGNAL, color: '#ffffff' }) : chip(x, y, l.toUpperCase());
    chips += ch.svg; x += ch.w + 12;
  }
  const chipsBottom = afterTitle + 36 + row * 56 + 44;

  let lastSvg = '';
  const lastY = chipsBottom + 56;
  if (summary.last) {
    const who = summary.last.name ? `${summary.last.name} \u00B7 ${summary.last.kind}` : 'someone';
    const when = ago(summary.last.at, now);
    lastSvg += `<text x="64" y="${lastY}" font-family="${MONO}" font-size="17" font-weight="700" letter-spacing="1" fill="${INK2}"${heavy(17, INK2, 700)}>${esc(`LAST POST \u00B7 ${who}${when ? ` \u00B7 ${when}` : ''}`.toUpperCase())}</text>`;
    const line = summary.last.text
      ? wrap(summary.last.name === 'Collator' && summary.last.kind === 'robot' ? summary.last.text : `\u201C${summary.last.text}\u201D`, { size: 26, width: textW, k: 0.52, maxLines: 2 })
      : ['Someone posted \u00B7 open the thread to read it'];
    lastSvg += line.map((l, i) => `<text x="64" y="${lastY + 40 + i * 34}" font-family="${SANS}" font-size="26" fill="${summary.last.text ? INK : INK2}">${esc(l)}</text>`).join('');
  } else if (summary.empty) {
    lastSvg = `<text x="64" y="${lastY}" font-family="${SANS}" font-size="26" fill="${INK2}">${esc('Nothing here yet \u00B7 be the first to append')}</text>`;
  }

  const noun = nounHref
    ? `<rect x="896" y="186" width="240" height="240" fill="${SIGNAL}" transform="translate(8 8)"/><rect x="896" y="186" width="240" height="240" fill="#ffffff" stroke="${INK}" stroke-width="3"/><image x="899" y="189" width="234" height="234" href="${nounHref}" xlink:href="${nounHref}" preserveAspectRatio="xMidYMid slice"/>`
    : '';
  const live = `LIVE AT SHARE TIME · ${new Date(now).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  const label = `${summary.name} on the Loom: ${summary.description}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${esc(clean(label))}">
<rect width="1200" height="630" fill="${PAPER}"/>
<rect x="24" y="24" width="1152" height="582" fill="none" stroke="${INK}" stroke-width="3"/>
<text x="64" y="86" font-family="${SANS}" font-size="30" font-weight="800" fill="${INK}"${heavy(30, INK, 800)}>The Loom</text>
<text x="1136" y="86" text-anchor="end" font-family="${MONO}" font-size="18" font-weight="700" letter-spacing="1" fill="${INK2}">POINTCAST.XYZ/LOOM</text>
<line x1="64" y1="110" x2="1136" y2="110" stroke="${HAIR}" stroke-width="2"/>
${titleSvg}${noun}${chips}${lastSvg}
<line x1="64" y1="560" x2="1136" y2="560" stroke="${HAIR}" stroke-width="2"/>
<circle cx="72" cy="582" r="6" fill="${SIGNAL}"/>
<text x="90" y="588" font-family="${MONO}" font-size="16" font-weight="700" letter-spacing="1" fill="${INK2}">${esc(live)}</text>
</svg>`;
}
