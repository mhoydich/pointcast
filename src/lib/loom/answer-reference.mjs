/** Bounded to the supplied thread window. A reference clears a UI reminder,
 * never proves completion or grants authority. Echoes/house robots do not count. */
const normalized = value => String(value ?? '').replace(/\s+/g, ' ').trim();
export function answerReferences(threads, isHouseRobot) {
  const links = new Map(), quotes = new Map();
  const keys = new Map(threads.map(t => [t.address, t.key]));
  const add = (index, key, m) => { if (!index.has(key)) index.set(key, []); index.get(key).push(m); };
  for (const thread of threads) for (const m of thread.messages ?? []) {
    if (m.hidden || m.withdrawn || m.via || isHouseRobot(m.from)) continue;
    const text = String(m.body ?? '');
    const targets = new Set();
    const custom = value => { for (const match of String(value).matchAll(/loom:([a-z0-9]+)#(m_[a-z0-9]+)/gi)) targets.add(`${match[1]}#${match[2]}`); };
    custom(text);
    for (const value of [...(text.match(/https?:\/\/[^\s<>"']+/g) ?? []), ...(m.cites ?? [])]) {
      custom(value);
      try {
        const url = new URL(String(value).replace(/[.,;!?)]+$/, ''));
        if (url.origin !== 'https://pointcast.xyz' || !/^\/loom\/?$/.test(url.pathname)) continue;
        const to = url.searchParams.get('to'); custom(to);
        const id = url.hash.slice(1), key = keys.get(to);
        if (key && /^m_[a-z0-9]+$/i.test(id)) targets.add(`${key}#${id}`);
      } catch { /* not a canonical link */ }
    }
    for (const target of targets) add(links, target, m);
    const quoted = [...text.matchAll(/"([^"\n]{20,})"|“([^”\n]{20,})”/g)].map(match => match[1] || match[2]);
    const blocks = text.match(/(?:^>[^\n]*(?:\n|$))+/gm) ?? [];
    for (const block of blocks) quoted.push(block.replace(/^>\s?/gm, ''));
    for (const quote of new Set(quoted.map(normalized).filter(q => q.length >= 20))) add(quotes, quote, m);
  }
  return (thread, message) => {
    const candidates = [...(links.get(`${thread.key}#${message.id}`) ?? []), ...(quotes.get(normalized(message.body)) ?? [])];
    return candidates.some(m => m.id !== message.id && Date.parse(m.at) > Date.parse(message.at));
  };
}
