/** Fills /forecasts from GET /api/forecasts and saves one forecast per tap. Text only, no HTML from the board. */

const KEY_STORE = 'pc:forecast:key';
const HANDLE_STORE = 'pc:forecast:handle';
const KIND_STORE = 'pc:forecast:kind';
const MINE_STORE = 'pc:forecast:mine';

const store = {
  get(k: string) { try { return localStorage.getItem(k) ?? ''; } catch { return ''; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
};

function browserKey() {
  let key = store.get(KEY_STORE);
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(key)) {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    key = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    store.set(KEY_STORE, key);
  }
  return key;
}

function mine(): Record<string, number> {
  try { return JSON.parse(store.get(MINE_STORE) || '{}') || {}; } catch { return {}; }
}

function crowdLine(q: any) {
  const c = q?.crowd;
  if (!c?.n) return q?.status === 'open' ? 'No forecasts yet. Be the first.' : 'Nobody forecast this one.';
  const sides = [c.human?.n ? `people ${c.human.mean}%` : '', c.agent?.n ? `agents ${c.agent.mean}%` : ''].filter(Boolean).join(', ');
  const base = `Crowd ${c.mean}% YES from ${c.n} ${c.n === 1 ? 'forecast' : 'forecasts'}${sides ? ` (${sides})` : ''}.`;
  return q.status === 'resolved' && c.brier != null ? `${base} Crowd Brier ${c.brier}.` : base;
}

function board(id: string, rows: any[]) {
  const list = document.getElementById(id);
  if (!list || !rows?.length) return;
  list.replaceChildren();
  for (const r of rows) {
    const li = document.createElement('li');
    li.textContent = `@${r.handle} · Brier ${r.brier} over ${r.resolved} ${r.resolved === 1 ? 'question' : 'questions'}`;
    list.append(li);
  }
}

export async function mountForecasts() {
  const handleInput = document.getElementById('fb-handle') as HTMLInputElement | null;
  const kindInput = document.getElementById('fb-kind') as HTMLSelectElement | null;
  if (handleInput) handleInput.value = store.get(HANDLE_STORE);
  if (kindInput && store.get(KIND_STORE)) kindInput.value = store.get(KIND_STORE);
  handleInput?.addEventListener('change', () => store.set(HANDLE_STORE, handleInput.value.trim()));
  kindInput?.addEventListener('change', () => store.set(KIND_STORE, kindInput.value));

  const saved = mine();
  const paint = (data: any) => {
    const all = [...(data?.open ?? []), ...(data?.closed ?? []), ...(data?.archive ?? [])];
    for (const q of all) {
      for (const node of document.querySelectorAll<HTMLElement>(`[data-q="${q.id}"]`)) {
        const text = node.querySelector<HTMLElement>('[data-crowd-text]');
        if (text) text.textContent = crowdLine(q);
        const bar = node.querySelector<HTMLElement>('[data-crowd-bar]');
        if (bar) bar.style.width = `${q.crowd?.mean ?? 50}%`;
      }
    }
    const acc = data?.accuracy;
    const score = document.getElementById('fb-crowd-score');
    if (score && acc?.resolvedQuestions) score.textContent = `Across ${acc.resolvedQuestions} resolved ${acc.resolvedQuestions === 1 ? 'question' : 'questions'}, the crowd average scores ${acc.crowd ?? 'n/a'}. Always saying 50% would score ${acc.coinFlip}.`;
    board('fb-board-human', acc?.human);
    board('fb-board-agent', acc?.agent);
  };

  for (const card of document.querySelectorAll<HTMLElement>('.fb__q[data-q]')) {
    const id = card.dataset.q!;
    const range = card.querySelector<HTMLInputElement>('[data-p]')!;
    const out = card.querySelector<HTMLOutputElement>('[data-p-out]')!;
    const note = card.querySelector<HTMLElement>('[data-note]')!;
    const show = () => { out.textContent = `${range.value}%`; };
    if (saved[id]) { range.value = String(saved[id]); note.textContent = `Your forecast: ${saved[id]}% YES. Change it any time before the close.`; }
    show();
    range.addEventListener('input', show);
    for (const b of card.querySelectorAll<HTMLButtonElement>('[data-quick]')) {
      b.addEventListener('click', () => { range.value = b.dataset.quick!; show(); });
    }
    card.querySelector<HTMLButtonElement>('[data-save]')?.addEventListener('click', async () => {
      const handle = handleInput?.value.trim() ?? '';
      if (!handle) { note.textContent = 'Pick a handle at the top first.'; handleInput?.focus(); return; }
      store.set(HANDLE_STORE, handle);
      note.textContent = 'Saving…';
      try {
        const res = await fetch('/api/forecasts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle, key: browserKey(), id, p: Number(range.value), kind: kindInput?.value === 'agent' ? 'agent' : 'human' }),
        });
        const body = await res.json().catch(() => null);
        if (!body?.ok) { note.textContent = body?.error ?? `That didn't save (${res.status}).`; return; }
        const all = mine(); all[id] = body.forecast.p; store.set(MINE_STORE, JSON.stringify(all));
        note.textContent = `${body.updated ? 'Changed' : 'Saved'}: ${body.forecast.p}% YES as @${body.forecast.handle}. Scored when it resolves.`;
        load();
      } catch {
        note.textContent = 'The board is offline. Try again in a minute.';
      }
    });
  }

  async function load() {
    try {
      const res = await fetch('/api/forecasts', { cache: 'no-store' });
      paint(await res.json());
    } catch {
      for (const t of document.querySelectorAll<HTMLElement>('[data-crowd-text]')) t.textContent = 'The crowd did not load.';
    }
  }
  load();
}
