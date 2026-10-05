/** Fills /prices from GET /api/prices and posts one report. Text only, no HTML from the wire. */

const $ = (id: string) => document.getElementById(id);

function board(id: string, rows: { handle: string; points: number; reports: number }[]) {
  const list = $(id);
  if (!list) return;
  list.replaceChildren();
  if (!rows?.length) {
    const li = document.createElement('li');
    li.textContent = 'No accepted reports yet.';
    list.append(li);
    return;
  }
  for (const item of rows) {
    const li = document.createElement('li');
    li.textContent = `@${item.handle} · ${item.points} points · ${item.reports} accepted`;
    list.append(li);
  }
}

export async function mountPriceWire() {
  const form = document.querySelector<HTMLFormElement>('#pw-form');
  const date = form?.querySelector<HTMLInputElement>('input[name="date"]');
  if (date && !date.value) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
    date.value = `${get('year')}-${get('month')}-${get('day')}`;
  }

  const paint = (data: any) => {
    const basket = data?.basket;
    const basketNode = $('pw-basket');
    if (basketNode) {
      basketNode.textContent = basket?.value == null
        ? 'No reports yet, so the basket has no number.'
        : `${basket.value} (base 100). ${basket.items} of ${basket.of} items, from ${basket.reports} accepted reports. Missing: ${(basket.missing ?? []).join(', ') || 'none'}.`;
    }
    const latest = Array.isArray(data?.latest) ? data.latest : [];
    const host = $('pw-latest');
    const empty = $('pw-empty');
    const any = latest.some((row: any) => row.price);
    if (empty) empty.hidden = any;
    if (host) {
      host.replaceChildren();
      for (const row of latest) {
        const block = document.createElement('div');
        block.className = 'pw__item';
        const title = document.createElement('strong');
        title.textContent = row.label;
        const body = document.createElement('p');
        if (!row.price) body.textContent = 'No reports yet.';
        else {
          const trend = row.trend?.direction === 'none' ? 'no trend yet' : `trend ${row.trend?.direction}`;
          const series = Array.isArray(row.trend?.points) ? row.trend.points.map((point: any) => point.price).join(' → ') : '';
          body.textContent = `${row.price} for ${row.unit} at ${row.place}, ${row.date}, @${row.handle} (${row.kind === 'agent' ? 'agent' : 'person'}). ${row.sample} accepted. ${trend}${series ? `: ${series}` : ''}.`;
        }
        block.append(title, body);
        host.append(block);
      }
    }
    const held = Array.isArray(data?.held) ? data.held : [];
    const heldNode = $('pw-held');
    if (heldNode) {
      heldNode.textContent = held.length
        ? held.map((report: any) => `${report.label} ${report.price} at ${report.place} on ${report.date} by @${report.handle} — ${report.reason}.`).join(' ')
        : 'Nothing is held. A held report is listed here and left out of the latest price, the trend, and the basket.';
    }
    board('pw-human', data?.reporters?.human ?? []);
    board('pw-agent', data?.reporters?.agent ?? []);
  };

  try {
    const res = await fetch('/api/prices', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    paint(await res.json());
  } catch {
    const node = $('pw-basket');
    if (node) node.textContent = 'The wire did not load. Try /prices.json.';
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const note = $('pw-form-note');
    if (note) note.textContent = 'Sending…';
    const price = Number(data.get('price'));
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          handle: data.get('handle'),
          kind: data.get('kind'),
          item: data.get('item'),
          price: Number.isFinite(price) ? price : data.get('price'),
          place: data.get('place'),
          date: data.get('date') || undefined,
          source: data.get('source') || undefined,
        }),
      });
      const body = await res.json().catch(() => null);
      if (note) note.textContent = body?.ok ? `${body.report?.status === 'held' ? 'Held' : 'Filed'} ${body.report?.label} at ${body.report?.price}. ${body.pointsNote ?? ''}` : (body?.error || 'The report was not taken.');
      if (body?.ok) {
        const again = await fetch('/api/prices', { headers: { Accept: 'application/json' } });
        if (again.ok) paint(await again.json());
      }
    } catch {
      if (note) note.textContent = 'The report did not reach the wire.';
    }
  });
}
