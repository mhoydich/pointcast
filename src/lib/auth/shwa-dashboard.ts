import type { RuntimeJobSummary } from './ai-runtime-ui.ts';

export const SHWA_CATALOG = [
  { id: 'downloads', title: 'Fresh art for your screen', path: '/downloads/', detail: 'Original artwork and free downloads, including the hummingbird collection.', time: '2 min', kind: 'Art' },
  { id: 'rosebud', title: 'Make a tiny beat', path: '/rosebud', detail: 'A browser drum playground. Try a rhythm, leave a little silence, answer it.', time: '2 min', kind: 'Make' },
  { id: 'co-games', title: 'Play alongside your AI', path: '/co-games', detail: 'Two against the rift: a cooperative turn-based game with practice and connected AI modes.', time: '5 min', kind: 'Play' },
  { id: 'open-road', title: 'A minute somewhere quieter', path: '/open-road', detail: 'A one-minute shrine around a 1955 Chevrolet painting, with breathing and light.', time: '1 min', kind: 'Quiet' },
  { id: 'almanac', title: 'Find a reason to step outside', path: '/almanac', detail: 'Explore the local sun, moon and tide. Read current conditions there; do not guess them.', time: '3 min', kind: 'Outside' },
  { id: 'bell-choir', title: 'Leave a little sound in the air', path: '/bell-choir', detail: 'Twelve playable bells, shared with whoever else is in the room.', time: '2 min', kind: 'Music' },
  { id: 'other-worlds', title: 'See Los Angeles differently', path: '/other-worlds', detail: 'Nine metaphysical Los Angeles posters by Michael Hoydich. Looking is free.', time: '4 min', kind: 'Look' },
  { id: 'spellframe', title: 'Meet a strange new world', path: '/spellframe', detail: 'An original arena game prototype and a first set of fifty illustrated cards.', time: '5 min', kind: 'Explore' },
];
type Pick = { id: string; title: string; reason: string; firstStep: string };
export type ShwaPicks = { headline: string; note: string; picks: Pick[] };
export function parseShwaPicks(value: string): ShwaPicks | null {
  try {
    const data = JSON.parse(value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    if (data?.type !== 'shwa-picks' || typeof data.headline !== 'string' || typeof data.note !== 'string' || !Array.isArray(data.picks)) return null;
    const seen = new Set<string>();
    const picks = data.picks.filter((p: any) => p && SHWA_CATALOG.some(c => c.id === p.id) && !seen.has(p.id) && seen.add(p.id) && ['title','reason','firstStep'].every(k => typeof p[k] === 'string' && p[k].trim())).slice(0, 3).map((p: Pick) => ({ id:p.id, title:p.title.slice(0,90), reason:p.reason.slice(0,320), firstStep:p.firstStep.slice(0,200) }));
    return picks.length ? { headline: data.headline.slice(0,120), note:data.note.slice(0,240), picks } : null;
  } catch { return null; }
}
export function discoveryPrompt(page: string, song: string, reaction = '') {
  return `SHWA DISCOVERY\nBe an observant host with taste. Pick three genuinely interesting, varied things to do from the catalog. Lead with your strongest choice and explain what makes each worth doing. No survey, no questions, no generic motivation. Use the current public context when relevant, without pretending to know the person's mood or what they have already done. A reaction is a preference, never evidence of an action. ${reaction ? `Explicit reaction: ${reaction.slice(0,250)}.` : ''}\nPublic page: ${page.slice(0,350)}\nSong displayed: ${song.slice(0,200) || 'none'}\nCatalog: ${JSON.stringify(SHWA_CATALOG)}\nReturn ONLY JSON with type "shwa-picks", headline (short editorial title), note (one sentence explaining your selection), picks (3 objects with id from catalog, title, reason, firstStep). Be concise, about 180 words total. Do not invent links, events, live conditions, or completed actions.`;
}
export function mountShwaDashboard(root: HTMLElement, ask: (question: string, prior?: string, draft?: boolean) => void) {
  const doc = root.ownerDocument, win = doc.defaultView!;
  const host = root.querySelector<HTMLElement>('[data-shwa-dashboard]');
  if (!host) return { render() {}, clear() {}, stop() {} };
  const controller = new win.AbortController();
  let ready = false, opened = false, attempted = false, scheduled = false, jobs: RuntimeJobSummary[] = [], key = '';
  const q = (s: string) => host.querySelector<HTMLElement>(s)!;
  const make = (tag: string, text = '', cls = '') => { const el = doc.createElement(tag); el.textContent = text; if (cls) el.className = cls; return el; };
  const history = q('[data-shwa-history]'), cards = q('[data-shwa-cards]');
  function createCards(target: HTMLElement, data: ShwaPicks, interactive = true) {
    target.replaceChildren();
    for (const pick of data.picks) {
      const item = SHWA_CATALOG.find(c => c.id === pick.id)!;
      const card = make('article', '', 'shwa-card');
      card.append(make('p', `${item.kind} · ${item.time}`, 'shwa-eyebrow'), make('h3', pick.title), make('p', pick.reason), make('p', pick.firstStep, 'shwa-step'));
      const actions = make('div', '', 'shwa-card-actions'); const link = make('a', 'Go explore ↗') as HTMLAnchorElement;
      link.href = item.path; actions.append(link);
      if (interactive) {
        const more = make('button', 'More like this') as HTMLButtonElement; more.type = 'button'; more.dataset.shwaRefresh = ''; more.disabled = !ready;
        more.addEventListener('click', () => refresh(`I like ${item.title}. Find related experiences with a different angle.`)); actions.append(more);
      }
      card.append(actions); target.append(card);
    }
  }
  function refresh(reaction = '') {
    if (!ready) return;
    attempted = true;
    const url = new URL(doc.URL);
    const publicPage = /^\/(?:me|profile|auth|api|signin|login|callback)(?:\/|$)/i.test(url.pathname) ? 'private page; no page context shared' : `${doc.title} (${url.origin}${url.pathname})`;
    ask(discoveryPrompt(publicPage, doc.querySelector('[data-live-now-title]')?.textContent?.trim() || '', reaction));
  }
  q('[data-shwa-refresh]').addEventListener('click', () => refresh(), {signal:controller.signal});
  win.addEventListener('pc:dock-visibility', event => {
    const detail = (event as CustomEvent).detail;
    opened = Boolean(detail?.open && detail?.tray === 'my-ai'); if (opened) maybeStart();
  }, {signal:controller.signal});
  function maybeStart() {
    if (!opened || !ready || attempted || scheduled || jobs.some(j => j.question?.startsWith('SHWA DISCOVERY') && Date.now() - Date.parse(j.createdAt) < 30 * 60_000) || root.querySelector<HTMLTextAreaElement>('[data-runtime-prompt]')?.value.trim()) return;
    scheduled = true;
    win.queueMicrotask(() => { scheduled = false; if (!controller.signal.aborted && opened && ready && !attempted) refresh(); });
  }
  function render(next: RuntimeJobSummary[], canAsk: boolean) {
    ready = canAsk; jobs = next.filter(j => j.question && j.kind === 'prompt');
    host.querySelectorAll<HTMLButtonElement>('[data-shwa-refresh]').forEach(b => b.disabled = !ready);
    const completed = jobs.filter(j => j.status === 'succeeded' && j.result?.text && j.result.actualModels?.length);
    const discovery = completed.find(j => j.question?.startsWith('SHWA DISCOVERY') && parseShwaPicks(j.result!.text));
    const parsed = discovery ? parseShwaPicks(discovery.result!.text)! : null;
    const pending = jobs.find(j => j.question?.startsWith('SHWA DISCOVERY') && ['queued','running'].includes(j.status));
    q('[data-shwa-picks-label]').textContent = pending ? 'Shwa is choosing a few good things…' : parsed ? `Chosen by Shwa · ${new Date(discovery!.createdAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}` : 'A few doors worth opening';
    const nextKey = JSON.stringify(completed.map(j => [j.id, j.result?.text]));
    if (nextKey !== key) {
      key = nextKey;
      q('[data-shwa-headline]').textContent = parsed?.headline || 'There’s something good here.';
      q('[data-shwa-note]').textContent = parsed?.note || 'A little art, a little play, a place to pause. Shwa will choose from these and other corners of PointCast when your AI is ready.';
      createCards(cards, parsed || {headline:'', note:'', picks:SHWA_CATALOG.filter(c => c.path !== new URL(doc.URL).pathname).slice(0,3).map(c => ({id:c.id,title:c.title,reason:c.detail,firstStep:''}))});
      history.replaceChildren();
      q('[data-shwa-history-count]').textContent = `Your history · ${completed.length}`;
      if (!completed.length) history.append(make('p', 'Your Shwa answers will collect here.'));
      for (const job of completed) {
        const details = make('details'), summary = make('summary', `${new Date(job.createdAt).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} · ${job.question!.startsWith('SHWA DISCOVERY') ? 'A few good things to do' : job.question!.slice(0,95)}`);
        details.append(summary);
        const data = parseShwaPicks(job.result!.text);
        if (data) { details.append(make('h3',data.headline),make('p',data.note));const content = make('div');createCards(content,data,false);details.append(content); }
        else { details.append(make('p',job.question!, 'shwa-history-question'),make('p',job.result!.text,'shwa-history-answer')); }
        const follow = make('button', 'Continue this conversation') as HTMLButtonElement; follow.type='button';
        follow.addEventListener('click', () => {
          const panel = root.querySelector<HTMLDetailsElement>('[data-shwa-conversation]'); if (panel) panel.open = true;
          ask('', job.result!.text, true); root.querySelector<HTMLTextAreaElement>('[data-runtime-prompt]')?.focus();
        });
        details.append(follow);history.append(details);
      }
    }
    maybeStart();
  }
  return {render, clear() { jobs=[];key='';attempted=false;ready=false;history.replaceChildren();cards.replaceChildren(); }, stop() {controller.abort();} };
}
