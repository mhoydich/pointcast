import { fetchNewestHolders, relativeTime } from './data.mjs';

export async function mountNewestHolders(root, config, { fetcher = globalThis.fetch, now = new Date() } = {}) {
  root.hidden = true;
  const list = root.querySelector('[data-newest-holders-list]');
  list.replaceChildren();
  try {
    const holders = await fetchNewestHolders(fetcher, config, { now });
    if (!holders.length || !root.isConnected) return;
    const doc = root.ownerDocument;
    const fragment = doc.createDocumentFragment();
    for (const holder of holders) {
      const item = doc.createElement('li');
      const link = doc.createElement('a');
      link.href = holder.objktUrl;
      link.className = 'nmh-card';
      link.title = `${holder.name} · ${holder.address}`;
      const art = doc.createElement('span');
      art.className = 'nmh-art';
      art.textContent = 'Note';
      art.setAttribute('aria-hidden', 'true');
      if (holder.thumbnail) {
        const img = doc.createElement('img');
        img.src = holder.thumbnail;
        img.alt = '';
        img.width = 96;
        img.height = 64;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('error', () => img.remove(), { once: true });
        art.append(img);
      }
      const detail = doc.createElement('span');
      detail.className = 'nmh-detail';
      const label = doc.createElement('strong');
      label.textContent = holder.label;
      const note = doc.createElement('span');
      note.className = 'nmh-note';
      note.textContent = holder.name;
      const time = doc.createElement('time');
      time.dateTime = holder.timestamp;
      time.title = new Date(holder.timestamp).toLocaleString();
      time.textContent = relativeTime(holder.timestamp, now.getTime());
      detail.append(label, note, time);
      const arrow = doc.createElement('span');
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');
      link.append(art, detail, arrow);
      item.append(link);
      fragment.append(item);
    }
    list.append(fragment);
    root.hidden = false;
  } catch {
    list.replaceChildren();
    root.hidden = true;
  }
}

// The same markup and modules can be copied to the separately hosted home page.
for (const root of globalThis.document?.querySelectorAll('[data-newest-holders]') || []) {
  try {
    const config = JSON.parse(root.querySelector('[data-newest-holders-config]').textContent);
    void mountNewestHolders(root, config);
  } catch { root.hidden = true; }
}
