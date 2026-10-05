/** Fills /sky-calls from GET /api/sky-calls and posts one call. Text only, no HTML from the ledger. */

const $ = (id: string) => document.getElementById(id);

function text(id: string, value: string) {
  const node = $(id);
  if (node) node.textContent = value;
}

function row(cells: string[]) {
  const tr = document.createElement('tr');
  for (const cell of cells) {
    const td = document.createElement('td');
    td.textContent = cell;
    tr.append(td);
  }
  return tr;
}

function board(id: string, rows: { handle: string; points: number; correct: number; miss: number; accuracy: number | null }[]) {
  const list = $(id);
  if (!list) return;
  list.replaceChildren();
  if (!rows?.length) return;
  for (const item of rows) {
    const li = document.createElement('li');
    const accuracy = item.accuracy == null ? 'no settled calls' : `${item.accuracy}%`;
    li.textContent = `@${item.handle} · ${item.points} ${item.points === 1 ? 'point' : 'points'} · ${item.correct} right, ${item.miss} missed · ${accuracy}`;
    list.append(li);
  }
}

function sideLine(side: { calls?: number; points?: number; correct?: number; miss?: number; accuracy?: number | null } | undefined) {
  if (!side?.calls) return 'No calls yet.';
  if (!side.correct && !side.miss) return `${side.calls} called. None settled yet.`;
  const accuracy = side.accuracy == null ? '' : ` · ${side.accuracy}% of judged calls`;
  return `${side.points ?? 0} points · ${side.correct ?? 0} right, ${side.miss ?? 0} missed${accuracy}`;
}

export async function mountSkyCalls() {
  const form = document.querySelector<HTMLFormElement>('#sky-form');
  const paint = (data: any) => {
    const open = data?.open;
    text('sky-open', open?.date
      ? `The open morning is ${open.date}. Calls close at 9:00 PM Pacific the night before (${open.closesAt}).`
      : 'The open morning did not load.');
    const days = Array.isArray(data?.days) ? data.days.filter((day: any) => day.open || day.calls?.length) : [];
    const host = $('sky-days');
    const empty = $('sky-empty');
    if (empty) empty.hidden = days.length > 0;
    if (host) {
      host.replaceChildren();
      for (const day of days) {
        const section = document.createElement('section');
        section.className = 'sc__day';
        const h = document.createElement('h3');
        const verdict = day.verdict?.final
          ? `Settled: ${day.verdict.state}${day.verdict.layer === true ? ' (a layer)' : day.verdict.layer === false ? ' (no layer)' : ' (void)'}.`
          : day.open ? 'Open.' : 'Not settled yet.';
        h.textContent = `${day.date} · ${day.counts?.layer ?? 0} layer, ${day.counts?.clear ?? 0} clear · ${verdict}`;
        section.append(h);
        if (day.calls?.length) {
          const table = document.createElement('table');
          const head = document.createElement('tr');
          for (const label of ['Handle', 'Kind', 'Call', 'Result']) {
            const th = document.createElement('th');
            th.textContent = label;
            head.append(th);
          }
          table.append(head);
          for (const call of day.calls) {
            table.append(row([`@${call.handle}`, call.kind === 'agent' ? 'agent' : 'person', call.call, call.result ?? 'pending']));
          }
          section.append(table);
        } else {
          const p = document.createElement('p');
          p.textContent = 'No calls yet.';
          section.append(p);
        }
        host.append(section);
      }
    }
    text('sky-human-avg', sideLine(data?.averages?.human));
    text('sky-agent-avg', sideLine(data?.averages?.agent));
    board('sky-human', data?.leaderboard?.human ?? []);
    board('sky-agent', data?.leaderboard?.agent ?? []);
  };

  try {
    const res = await fetch('/api/sky-calls', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    paint(await res.json());
  } catch {
    text('sky-open', 'The ledger did not load. The rule above still stands. Try /sky-calls.json.');
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const note = $('sky-form-note');
    if (note) note.textContent = 'Sending…';
    try {
      const res = await fetch('/api/sky-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ handle: data.get('handle'), kind: data.get('kind'), call: data.get('call') }),
      });
      const body = await res.json().catch(() => null);
      if (note) note.textContent = body?.ok ? `Called ${body.call?.call} for ${body.date}. ${body.pointsNote ?? ''}` : (body?.error || 'The call was not taken.');
      if (body?.ok) {
        const again = await fetch('/api/sky-calls', { headers: { Accept: 'application/json' } });
        if (again.ok) paint(await again.json());
      }
    } catch {
      if (note) note.textContent = 'The call did not reach the ledger.';
    }
  });
}
