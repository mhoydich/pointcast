/** Thin handler for /loom/bot/NAME. Reads through handleLoom (internal GETs); no second storage path. */
import { handleLoom } from './service.mjs';
import { badBotNameText, buildBotPage, isBotSender, parseBotName, unknownBotText } from './bot-page.mjs';

const API = 'https://pointcast.xyz/api/loom';
const text = (body, status, cache) => new Response(body, { status, headers: {
  'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' } });
const internal = async (query, kv) => { try { return await (await handleLoom(new Request(`${API}${query}`), { kv })).json(); } catch { return null; } };

/** Questions that name the bot and have no reply of kind "answer". Echoes lose their kind, so look at the source log. */
async function openQuestions(name, inbox, logKey, kv) {
  const candidates = [];
  for (const m of [...inbox].reverse()) {
    if (m.hidden || isBotSender(m.from, name)) continue;
    if (m.kind === 'question') candidates.push({ key: logKey, id: m.id, inbox: true });
    else if (m.kind === 'link' && m.via?.key && m.via?.id) candidates.push({ key: m.via.key, id: m.via.id });
    if (candidates.length >= 25) break;
  }
  const logs = new Map();
  const MAX_SOURCES = 5;
  const out = [];
  const done = new Set();
  for (const c of candidates) {
    const addr = `loom:${c.key}#${c.id}`;
    if (done.has(addr)) continue;
    done.add(addr);
    let msgs = inbox;
    if (!c.inbox) {
      if (!logs.has(c.key) && logs.size >= MAX_SOURCES) continue;
      if (!logs.has(c.key)) logs.set(c.key, (await internal(`?to=${encodeURIComponent(`loom:${c.key}#${c.id}`)}`, kv))?.messages ?? null);
      msgs = logs.get(c.key);
    }
    const q = msgs?.find((m) => m.id === c.id);
    if (!q || q.hidden || q.kind !== 'question') continue;
    if (msgs.some((m) => m.parent === q.id && m.kind === 'answer' && !m.hidden)) continue;
    out.push({ address: addr, body: q.body, from: q.from?.name });
    if (out.length >= 10) break;
  }
  return out;
}

/** Resolve only the five displayed outbox receipts; never reuse append-time text.
 * A missing/trimmed source is explicitly unavailable, not a stale fallback.
 */
async function currentSent(sent, kv) {
  const logs = new Map();
  const out = [];
  for (const receipt of sent.slice(0, 5)) {
    if (!logs.has(receipt.key)) logs.set(receipt.key,
      receipt.key ? await internal(`?to=${encodeURIComponent(`loom:${receipt.key}#${receipt.id}`)}`, kv) : null);
    const source = logs.get(receipt.key);
    const message = source?.ok && source.messages?.find(m => m.id === receipt.id);
    out.push({ ...receipt, body: !message ? '[source unavailable, hidden or trimmed; open the thread]'
      : message.hidden ? '[withdrawn or hidden]' : message.body });
  }
  return out;
}

export async function serveBot(request, kv, rawName) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  const name = parseBotName(rawName);
  if (!name) return text(badBotNameText(), 404, 'public, max-age=300');
  const [inboxRes, outRes] = await Promise.all([internal(`?to=${encodeURIComponent(`@${name}`)}`, kv), internal(`?from=${encodeURIComponent(`@${name}`)}`, kv)]);
  if (!inboxRes?.ok || !outRes?.ok) return text('The Loom is out of reach right now. Try again in a minute.\n', 503, 'no-store');
  const sent = await currentSent(Array.isArray(outRes.sent) ? outRes.sent : [], kv);
  const exists = !!inboxRes.log?.createdAt;
  if (!exists && !sent.length) return text(unknownBotText(name), 404, 'public, max-age=60');
  const inbox = exists ? inboxRes.messages ?? [] : [];
  const questions = await openQuestions(name, inbox, inboxRes.log?.key, kv);
  return text(buildBotPage(name, { inbox, sent, questions, trimmed: inboxRes.log?.trimmedBefore != null }), 200, 'no-store');
}
