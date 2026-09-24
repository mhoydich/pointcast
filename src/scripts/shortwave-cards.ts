/**
 * Town cards on Shortwave: your card in the sidebar, the editor dialog, and
 * the profile banner at /shortwave#@handle. Everything is built with
 * textContent; the only markup strings are fixed.
 */
export type PublicCard = {
  handle: string; name: string; noun: number; bio: string; now: string; place: string; song: string;
  links: { label: string; url: string }[]; color: string; wallet: string;
  onchain: { contract: string; tokenId: number; owner: string } | null;
  url: string; avatar: string; createdAt: string; updatedAt: string; released?: boolean;
};
export type Mine = { signedIn: boolean; card: PublicCard | null; wallets: string[]; name: string; colors: string[] };
export type ProfileStats = { updates: number; more: boolean; casts: number | null; places: string[]; tags: [string, number][]; last: string | null };

const COLORS = ['#185fa5', '#0a6c9f', '#2f8f4e', '#e0a100', '#e5663b', '#c0262d', '#d6457a', '#7152a4', '#1f2a33'];
const short = (a: string) => `${a.slice(0, 5)}…${a.slice(-4)}`;
function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n;
}

export async function loadMine(): Promise<Mine> {
  try {
    const res = await fetch('/api/card', { credentials: 'same-origin', headers: { accept: 'application/json' } });
    if (res.status === 401) return { signedIn: false, card: null, wallets: [], name: '', colors: COLORS };
    const j = await res.json();
    if (!j?.ok) return { signedIn: false, card: null, wallets: [], name: '', colors: COLORS };
    const card = j.card && !j.card.released ? j.card as PublicCard : null;
    return { signedIn: true, card, wallets: j.wallets || [], name: j.name || '', colors: j.colors || COLORS };
  } catch { return { signedIn: false, card: null, wallets: [], name: '', colors: COLORS }; }
}

export async function loadCard(handle: string): Promise<PublicCard | null> {
  const res = await fetch(`/api/card?handle=${encodeURIComponent(handle)}`, { headers: { accept: 'application/json' } });
  if (res.status === 404) return null;
  const j = await res.json().catch(() => null);
  if (!res.ok || !j?.ok) throw new Error('Could not load that card.');
  return j.card;
}

/** The sidebar block: your card, a claim button, or a sign-in nudge. */
export function paintMyCard(el: HTMLElement, mine: Mine) {
  el.replaceChildren();
  if (!mine.signedIn) {
    el.append(h('h2', '', 'Your town card'), h('p', 'muted', 'Sign in and claim a @handle. Your posts get your name, your Noun and a ✓ nobody else can put on them.'));
    const a = h('a', 'sw-claim'); a.href = `/auth?returnTo=${encodeURIComponent('/shortwave#card')}`; a.textContent = 'Sign in to claim yours'; el.append(a);
    return;
  }
  if (!mine.card) {
    el.append(h('h2', '', 'Your town card'), h('p', 'muted', 'You are signed in but have no card yet. Claim a @handle and your posts carry it.'));
    const a = h('a', 'sw-claim'); a.href = '#card'; a.textContent = 'Claim your @handle'; el.append(a);
    return;
  }
  const c = mine.card;
  const box = h('a', 'sw-mini'); box.href = `#@${c.handle}`; box.style.setProperty('--card', c.color);
  const img = h('img'); img.src = c.avatar; img.alt = ''; img.width = 40; img.height = 40;
  const txt = h('span'); txt.append(h('strong', '', c.name), h('small', '', `@${c.handle}`));
  box.append(img, txt);
  const edit = h('a', 'sw-link', 'edit card'); edit.href = '#card';
  const connect = h('a', 'sw-link', 'sign in elsewhere with it'); connect.href = '/connect';
  const row = h('p', 'sw-mini-links'); row.append(edit, document.createTextNode(' · '), connect);
  el.append(h('h2', '', 'Your town card'), box, row);
}

/** The banner at the top of /shortwave#@handle. */
export function profileBanner(card: PublicCard, stats: ProfileStats, isMine: boolean, onTag: (t: string) => void): HTMLElement {
  const root = h('div', 'sw-pro'); root.style.setProperty('--card', card.color);
  root.append(h('div', 'sw-pro-band'));
  const head = h('div', 'sw-pro-head');
  const img = h('img', 'sw-pro-noun'); img.src = card.avatar; img.alt = `Noun ${card.noun}`; img.width = 96; img.height = 96;
  const id = h('div', 'sw-pro-id');
  const name = h('h2'); name.append(document.createTextNode(card.name), h('span', 'sw-check', '✓'));
  name.querySelector('.sw-check')!.setAttribute('title', 'A PointCast member. This card is tied to their account.');
  const handle = h('p', 'sw-pro-handle', `@${card.handle}`);
  if (card.onchain) {
    const b = h('a', 'sw-badge', 'on-chain profile'); b.href = `https://tzkt.io/${card.onchain.contract}/tokens/${card.onchain.tokenId}`; b.target = '_blank'; b.rel = 'noopener noreferrer';
    b.title = `Profile object #${card.onchain.tokenId} on Tezos, held by one of their wallets`; handle.append(' ', b);
  }
  id.append(name, handle);
  head.append(img, id);
  if (isMine) { const e = h('a', 'sw-chip sw-pro-edit', 'Edit card'); e.href = '#card'; head.append(e); }
  root.append(head);

  const body = h('div', 'sw-pro-body');
  if (card.bio) body.append(h('p', 'sw-pro-bio', card.bio));
  const facts = h('ul', 'sw-pro-facts');
  if (card.now) facts.append(h('li', '', `Now: ${card.now}`));
  if (card.place) facts.append(h('li', '', `📍 ${card.place}`));
  if (card.wallet) { const li = h('li'); const a = h('a', '', `ꜩ ${short(card.wallet)}`); a.href = `https://tzkt.io/${card.wallet}/operations`; a.target = '_blank'; a.rel = 'noopener noreferrer'; li.append(a); facts.append(li); }
  for (const l of card.links) { const li = h('li'); const a = h('a', '', `↗ ${l.label}`); a.href = l.url; a.target = '_blank'; a.rel = 'me noopener noreferrer nofollow'; li.append(a); facts.append(li); }
  if (facts.childElementCount) body.append(facts);
  const m = card.song.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
  if (m) {
    const f = h('iframe', 'spotify'); f.src = `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=pointcast`; f.width = '100%'; f.height = m[1] === 'track' || m[1] === 'episode' ? '80' : '152';
    f.setAttribute('frameborder', '0'); f.allow = 'encrypted-media'; f.loading = 'lazy'; f.title = `${card.name}'s song`; body.append(f);
  }
  const dl = h('dl', 'sw-pro-stats');
  const stat = (n: string, label: string) => { const d = h('div'); d.append(h('dd', '', n), h('dt', '', label)); dl.append(d); };
  stat(`${stats.updates}${stats.more ? '+' : ''}`, stats.updates === 1 ? 'update' : 'updates');
  stat(stats.casts === null ? '—' : String(stats.casts), 'Tezos casts');
  stat(String(stats.places.length), stats.places.length === 1 ? 'place' : 'places');
  stat(stats.last || '—', 'last posted');
  body.append(dl);
  if (stats.tags.length) {
    const p = h('p', 'sw-pro-tags');
    for (const [t] of stats.tags.slice(0, 10)) { const a = h('a', 'tag', `#${t}`); a.href = '#feed'; a.addEventListener('click', (ev) => { ev.preventDefault(); onTag(t); }); p.append(a, document.createTextNode(' ')); }
    body.append(p);
  }
  if (stats.places.length) body.append(h('p', 'sw-pro-places muted', `Posted from ${stats.places.slice(0, 6).join(', ')}`));
  root.append(body);
  return root;
}

export function missingBanner(handle: string, mine: Mine): HTMLElement {
  const root = h('div', 'sw-pro sw-pro-empty');
  root.append(h('h2', '', `Nobody is @${handle} yet.`));
  if (mine.signedIn && !mine.card) { const a = h('a', 'sw-claim', `Claim @${handle}`); a.href = `#card`; a.dataset.claim = handle; root.append(a); }
  else if (!mine.signedIn) { const a = h('a', 'sw-claim', 'Sign in to claim it'); a.href = `/auth?returnTo=${encodeURIComponent('/shortwave#card')}`; root.append(a); }
  return root;
}

/** Wire the editor dialog. Returns open(prefillHandle?). */
export function mountEditor(dialog: HTMLDialogElement, getMine: () => Mine, onSaved: (card: PublicCard | null) => void) {
  const form = dialog.querySelector<HTMLFormElement>('form')!;
  const f = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
  const status = dialog.querySelector<HTMLElement>('[data-ed-status]')!;
  const nounImg = dialog.querySelector<HTMLImageElement>('[data-ed-noun]')!;
  const swatches = dialog.querySelector<HTMLElement>('[data-ed-colors]')!;
  const wallet = form.elements.namedItem('wallet') as HTMLSelectElement;
  const remove = dialog.querySelector<HTMLButtonElement>('[data-ed-remove]')!;
  const chainBtn = dialog.querySelector<HTMLButtonElement>('[data-ed-chain]')!;
  const title = dialog.querySelector<HTMLElement>('[data-ed-title]')!;
  let color = COLORS[0];

  const paintNoun = () => { const n = Math.max(0, Math.min(1199, Number(f('noun').value) || 0)); nounImg.src = `https://noun.pics/${n}.svg`; };
  const paintColors = () => swatches.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color === color)));
  swatches.replaceChildren(...COLORS.map((c) => { const b = h('button'); b.type = 'button'; b.dataset.color = c; b.style.background = c; b.setAttribute('aria-label', `Color ${c}`); b.addEventListener('click', () => { color = c; paintColors(); }); return b; }));
  f('noun').addEventListener('input', paintNoun);
  dialog.querySelector<HTMLButtonElement>('[data-ed-dice]')!.addEventListener('click', () => { f('noun').value = String(Math.floor(Math.random() * 1200)); paintNoun(); });
  dialog.querySelectorAll<HTMLButtonElement>('[data-ed-cancel]').forEach((b) => b.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('close', () => { if (location.hash === '#card') history.replaceState(history.state, '', location.pathname + location.search); });

  function fill(card: Partial<PublicCard> | null, fallbackName: string, handle = '') {
    f('handle').value = card?.handle || handle;
    f('name').value = card?.name || fallbackName || '';
    f('noun').value = String(card?.noun ?? Math.floor(Math.random() * 1200));
    f('bio').value = card?.bio || ''; f('now').value = card?.now || ''; f('place').value = card?.place || ''; f('song').value = card?.song || '';
    for (let i = 0; i < 3; i++) { f(`link${i}label`).value = card?.links?.[i]?.label || ''; f(`link${i}url`).value = card?.links?.[i]?.url || ''; }
    color = card?.color && COLORS.includes(card.color) ? card.color : COLORS[0];
    paintNoun(); paintColors();
  }

  chainBtn.addEventListener('click', async () => {
    chainBtn.disabled = true; status.textContent = 'Reading your profile objects on Tezos…';
    try {
      const j = await (await fetch('/api/card?prefill=1', { credentials: 'same-origin' })).json();
      if (!j.ok) throw new Error(j.error || 'Could not read Tezos.');
      const p = j.profiles?.[0];
      if (!p) { status.textContent = j.wallets?.length ? 'None of your linked wallets holds a PointCast profile object yet.' : 'Link a Tezos wallet on your account first.'; return; }
      f('handle').value = p.handle; if (p.name) f('name').value = p.name; if (p.bio) f('bio').value = p.bio.slice(0, 160); f('noun').value = String(p.noun);
      p.links.slice(0, 3).forEach((l: { label: string; url: string }, i: number) => { f(`link${i}label`).value = l.label; f(`link${i}url`).value = l.url; });
      if ([...wallet.options].some((o) => o.value === p.owner)) wallet.value = p.owner;
      paintNoun(); status.textContent = `Filled from your on-chain profile @${p.handle}. Save to keep it.`;
    } catch (e) { status.textContent = e instanceof Error ? e.message : 'Could not read Tezos.'; }
    finally { chainBtn.disabled = false; }
  });

  remove.addEventListener('click', async () => {
    if (!confirm('Remove your town card? Your handle becomes free for anyone. Your old posts stay.')) return;
    remove.disabled = true;
    const r = await fetch('/api/card', { method: 'DELETE', credentials: 'same-origin' }).then((x) => x.json()).catch(() => null);
    remove.disabled = false;
    if (r?.ok) { onSaved(null); dialog.close(); } else status.textContent = 'Could not remove it. Try again.';
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const save = form.querySelector<HTMLButtonElement>('[type=submit]')!; save.disabled = true; status.textContent = 'Saving…';
    const links = [0, 1, 2].map((i) => ({ label: f(`link${i}label`).value, url: f(`link${i}url`).value })).filter((l) => l.url.trim() || l.label.trim());
    const card = { handle: f('handle').value, name: f('name').value, noun: Number(f('noun').value) || 0, bio: f('bio').value, now: f('now').value, place: f('place').value, song: f('song').value, links, color, wallet: wallet.value };
    try {
      const res = await fetch('/api/card', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ card }) });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || 'Could not save.');
      status.textContent = 'Saved.'; onSaved(j.card); dialog.close();
    } catch (e) { status.textContent = e instanceof Error ? e.message : 'Could not save.'; }
    finally { save.disabled = false; }
  });

  return function open(handle = '') {
    const mine = getMine();
    const signIn = dialog.querySelector<HTMLElement>('[data-ed-signin]')!;
    signIn.hidden = mine.signedIn; form.hidden = !mine.signedIn;
    title.textContent = mine.card ? 'Edit your town card' : 'Claim your @handle';
    remove.hidden = !mine.card;
    wallet.replaceChildren(h('option', '', 'Don’t show a wallet'), ...mine.wallets.map((w) => { const o = h('option', '', short(w)); o.value = w; return o; }));
    (wallet.options[0] as HTMLOptionElement).value = '';
    chainBtn.hidden = !mine.wallets.length;
    fill(mine.card, mine.name, handle);
    wallet.value = mine.card?.wallet || '';
    status.textContent = '';
    if (!dialog.open) dialog.showModal();
    (mine.signedIn ? f('handle') : signIn.querySelector('a'))?.focus();
  };
}
