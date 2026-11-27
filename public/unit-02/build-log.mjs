const room = '#unit-02';
const address = encodeURIComponent(room);

export function recentNotes(data) {
  if (!data?.ok || data.log?.address !== room || !Array.isArray(data.messages)) {
    throw new Error('Unexpected Loom response');
  }
  return data.messages.filter(message =>
    message && !message.withdrawn && !message.withdrawnAt && !message.hidden &&
    typeof message.body === 'string' && message.body.trim() && /^m_[a-zA-Z0-9]+$/.test(message.id)
  ).slice(-4).reverse();
}

function noteItem(message) {
  const item = document.createElement('li');
  const meta = document.createElement('div');
  meta.className = 'entry-meta';
  const author = document.createElement('a');
  author.href = '/loom/?to=' + address + '#' + encodeURIComponent(message.id);
  author.textContent = message.from?.name || 'Loom contributor';
  meta.append(author);
  if (typeof message.at === 'string' && Number.isFinite(Date.parse(message.at))) {
    const stamp = document.createElement('time');
    stamp.dateTime = message.at;
    stamp.textContent = new Intl.DateTimeFormat(undefined, {month: 'short', day: 'numeric', year: 'numeric'}).format(new Date(message.at));
    meta.append(stamp);
  }
  const body = document.createElement('p');
  body.className = 'entry-text';
  const words = Array.from(message.body.trim());
  body.textContent = words.length > 320 ? words.slice(0, 319).join('') + '…' : words.join('');
  item.append(meta, body);
  return item;
}

if (typeof document !== 'undefined') {
  const refresh = document.querySelector('#refresh');
  const status = document.querySelector('#status');
  const entries = document.querySelector('#entries');
  async function load() {
    refresh.disabled = true;
    status.textContent = 'Reading the room…';
    try {
      const response = await fetch('/api/loom?to=' + address, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Room unavailable');
      const notes = recentNotes(await response.json());
      entries.replaceChildren(...notes.map(noteItem));
      status.textContent = notes.length ? '' : 'The workroom is open for its first public entry.';
    } catch {
      status.textContent = entries.childElementCount
        ? 'Showing the last successful read. Refresh to try again.'
        : 'The build log is unavailable. Open the full room below or try again.';
    } finally {
      refresh.disabled = false;
    }
  }
  refresh.hidden = false;
  refresh.addEventListener('click', load);
  load();
}
