// Accept the Loom's own message locators. The pasted URL is never a fetch target.
const site = 'https://pointcast.xyz';
const messageId = /^m_[0-9a-z]{6,24}$/;
const replyAddress = /^loom:([0-9a-f]{24})#(m_[0-9a-z]{6,24})$/;
const readableRoom = /^(?:#[a-z0-9][a-z0-9-]{0,39}|@[a-z0-9][a-z0-9_.-]{0,31})$/i;
const badLink = 'Paste a PointCast Loom permalink to one message.';
const missing = 'That message is unavailable or has no text to share.';
const unavailable = 'The public board could not be read. Try again.';
const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});

function locator(input) {
  const text = typeof input === 'string' ? input.trim() : '';
  if (!text || text.length > 2048) throw new Error(badLink);
  let url;
  try { url = new URL(/^pointcast\.xyz\//i.test(text) ? 'https://' + text : text, site); }
  catch { throw new Error(badLink); }
  if (url.origin !== site || url.username || url.password) throw new Error(badLink);
  const path = url.pathname.replace(/\/$/, '');
  const topic = path.match(/^\/loom\/topic\/([a-z0-9][a-z0-9-]{0,39})$/i);
  if (!topic && path !== '/loom' && path !== '/loom/classic') throw new Error(badLink);
  if (url.searchParams.getAll('to').length > 1) throw new Error(badLink);

  const id = url.hash.slice(1);
  const to = topic ? '#' + topic[1] : url.searchParams.get('to') || '';
  const reply = replyAddress.exec(to) || replyAddress.exec(to + '#' + id);
  if (reply) {
    if (id && id !== reply[2] && id !== 'thread') throw new Error(badLink);
    return { to: reply[0], key: reply[1], id: reply[2] };
  }
  if (!messageId.test(id) || !readableRoom.test(to)) throw new Error(badLink);
  return { to: to.toLowerCase(), id };
}

export async function loadMessage(input, { fetcher = fetch } = {}) {
  const { to, key, id } = locator(input);
  let board;
  try {
    const response = await fetcher(site + '/api/loom?to=' + encodeURIComponent(to), {
      method: 'GET', credentials: 'omit', redirect: 'error',
    });
    if (!response.ok) throw new Error();
    board = await response.json();
  } catch { throw new Error(unavailable); }
  const log = board?.log;
  const room = log?.address;
  if (board?.ok !== true || board.exists === false || typeof room !== 'string' ||
      !room || (key ? log.key !== key : room !== to)) throw new Error(missing);
  const message = Array.isArray(board.messages) && board.messages.find(row => row?.id === id && !row.hidden);
  const quote = typeof message?.body === 'string' ? message.body.trim() : '';
  if (!quote) throw new Error(missing);

  // A room+fragment link focuses the article. Other thread kinds use the
  // fixed-size reply locator accepted by /loom's own reply-address resolver.
  const href = readableRoom.test(room)
    ? '/loom?to=' + encodeURIComponent(room) + '#' + id
    : '/loom?to=' + encodeURIComponent(to);
  const date = message.at && new Date(message.at);
  return {
    kind: 'message', quote, byline: message.from?.name || 'Loom participant', room,
    date: date && Number.isFinite(date.getTime()) ? dateFormat.format(date) : '',
    linkLabel: 'pointcast.xyz' + href, source: site + href,
  };
}
