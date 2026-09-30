import { makeRock, normalizeRock, readCabinet, rockSvg, ROCK_FAMILIES } from '../lib/pocket-rocks.mjs';
import { createRockViewer } from '../lib/pocket-rocks-renderer';

const STORAGE_KEY = 'pc:pocket-rocks:cabinet:v1';
let cleanUp: (() => void) | undefined;
let mountedPage: HTMLElement | undefined;

function boot() {
  const page = document.querySelector<HTMLElement>('[data-pocket-rocks]');
  if (page && page === mountedPage) return;
  cleanUp?.();
  if (!page) return;
  mountedPage = page;
  const controller = new AbortController();
  const { signal } = controller;
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => page.querySelector<T>(selector)!;
  const stage = get('[data-rock-stage]');
  const status = get('[data-rock-status]');
  const keep = get<HTMLButtonElement>('[data-keep]');
  const favorite = get<HTMLButtonElement>('[data-feature]');
  const shareFallback = get('[data-share-fallback]');
  const say = (message: string) => { status.textContent = message; };
  let persistent = true;
  let cabinet = readCabinet(null);
  try {
    cabinet = readCabinet(localStorage.getItem(STORAGE_KEY));
    localStorage.setItem('pc:pocket-rocks:storage-probe', '1');
    localStorage.removeItem('pc:pocket-rocks:storage-probe');
  } catch { persistent = false; }
  function storageNote() {
    get('[data-storage-note]').textContent = persistent
      ? 'Your cabinet stays on this device. Export it to take it with you.'
      : 'Storage is unavailable. Your cabinet lasts this visit; export it before leaving.';
  }
  let current = makeRock(18092026, 'agate');
  const params = new URL(location.href).searchParams;
  const seedParam = params.get('seed');
  const shared = seedParam !== null && /^\d{1,10}$/.test(seedParam)
    ? normalizeRock({ seed: Number(seedParam), familyId: params.get('family') }) : null;
  if (shared) current = shared;
  else if (cabinet.featuredId) current = cabinet.rocks.find((rock: any) => rock.id === cabinet.featuredId) || current;
  let viewer: Awaited<ReturnType<typeof createRockViewer>> | undefined;
  let alive = true;
  let familyIndex = ROCK_FAMILIES.findIndex((family: any) => family.id === current.familyId);
  const stored = () => cabinet.rocks.some((rock: any) => rock.id === current.id);
  const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];

  function save() {
    try {
      const latest = readCabinet(localStorage.getItem(STORAGE_KEY));
      cabinet = readCabinet(JSON.stringify({version:1,rocks:[...latest.rocks,...cabinet.rocks],featuredId:cabinet.featuredId || latest.featuredId}));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cabinet)); persistent = true;
    }
    catch { persistent = false; }
    storageNote();
  }
  function renderSpecimen() {
    get('[data-rock-name]').textContent = current.name;
    get('[data-rock-geology]').textContent = current.geology;
    get('[data-rock-group]').textContent = current.group;
    get('[data-rock-story]').textContent = current.story;
    get('[data-rock-fact]').textContent = current.fact;
    get('[data-rock-texture]').textContent = current.texture;
    get('[data-rock-number]').textContent = current.seed.toString(16).padStart(8,'0').toUpperCase();
    get('[data-rock-fallback]').innerHTML = rockSvg(current);
    stage.setAttribute('aria-label', `${current.name}. ${current.texture}`);
    keep.disabled = stored();
    keep.textContent = stored() ? '✓ In your cabinet' : '＋ Keep this rock';
    favorite.hidden = !stored();
    favorite.disabled = cabinet.featuredId === current.id;
    favorite.textContent = cabinet.featuredId === current.id ? 'Favorite ★' : 'Make favorite ☆';
    page!.querySelectorAll<HTMLElement>('[data-family]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.family === current.familyId)));
    shareFallback.hidden = true;
    viewer?.setRock(current);
  }
  function showRock(rock: any, message = '') {
    current = rock;
    familyIndex = ROCK_FAMILIES.findIndex((family: any) => family.id === rock.familyId);
    renderSpecimen();
    say(message);
    const url = new URL(location.href);
    url.searchParams.set('seed', String(rock.seed));
    url.searchParams.set('family', rock.familyId);
    history.replaceState(null, '', url);
  }
  function renderCabinet() {
    page!.querySelectorAll('[data-cabinet-count]').forEach(el => el.textContent = String(cabinet.rocks.length));
    get('[data-cabinet-empty]').hidden = cabinet.rocks.length > 0;
    const grid = get('[data-cabinet-grid]');
    const fragment = document.createDocumentFragment();
    for (const rock of [...cabinet.rocks].reverse()) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'rocks-cabinet-rock'; button.dataset.specimen = rock.id;
      button.setAttribute('aria-label', `Inspect ${rock.name}, ${rock.geology}, specimen ${rock.seed.toString(16).padStart(8,'0').toUpperCase()}${cabinet.featuredId === rock.id ? ', favorite' : ''}`);
      const art = document.createElement('img'); art.alt = ''; art.loading = 'lazy'; art.width = 240; art.height = 240;
      art.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rockSvg(rock, {size:240}))}`;
      const name = document.createElement('strong'); name.textContent = `${cabinet.featuredId === rock.id ? '★ ' : ''}${rock.name}`;
      const geology = document.createElement('small'); geology.textContent = rock.geology;
      const number = document.createElement('span'); number.className = 'rocks-mono'; number.textContent = `FIND ${rock.seed.toString(16).padStart(8,'0').toUpperCase()}`;
      button.append(art, name, geology, number); fragment.append(button);
    }
    grid.replaceChildren(fragment);
    const families = new Set(cabinet.rocks.map((rock: any) => rock.familyId)).size;
    get('[data-cabinet-progress]').textContent = families === 10 ? '◇ Full Pocket · all 10 geological families found' : `${families} of 10 geological families found`;
    get<HTMLButtonElement>('[data-export]').disabled = cabinet.rocks.length === 0;
  }
  function download(content: string, filename: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
    anchor.hidden = true; document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  keep.addEventListener('click', () => {
    if (stored()) return;
    if (cabinet.rocks.length >= 500) { say('Your cabinet has 500 rocks. Export it to keep a copy.'); return; }
    cabinet.rocks.push({...current, collectedAt:new Date().toISOString()});
    if (!cabinet.featuredId) cabinet.featuredId = current.id;
    save(); renderSpecimen(); renderCabinet();
    say(!stored() ? 'Your cabinet filled up in another tab. Export it to keep a copy.' : persistent ? `${current.name} is in your cabinet.` : `${current.name} kept for this visit. Export your cabinet to save it.`);
  }, {signal});
  get('[data-find]').addEventListener('click', () => {
    familyIndex = (familyIndex + 1) % ROCK_FAMILIES.length;
    showRock(makeRock(randomSeed(), ROCK_FAMILIES[familyIndex].id), 'A new small wonder.');
  }, {signal});
  page.querySelectorAll<HTMLButtonElement>('[data-family]').forEach(button => button.addEventListener('click', () => showRock(makeRock(randomSeed(), button.dataset.family), `${button.textContent?.trim().replace(/\s+/g,' ')} specimen found.`), {signal}));
  favorite.addEventListener('click', () => { cabinet.featuredId = current.id; save(); renderSpecimen(); renderCabinet(); say('Your favorite will greet you next time.'); }, {signal});
  get('[data-cabinet-grid]').addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('[data-specimen]');
    const rock = cabinet.rocks.find((entry: any) => entry.id === button?.dataset.specimen);
    if (!rock) return;
    showRock(rock);
    stage.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'center'});
    stage.focus({preventScroll:true});
  }, {signal});
  page.querySelectorAll<HTMLElement>('[data-turn]').forEach(button => button.addEventListener('click', () => viewer?.turn(Number(button.dataset.turn)), {signal}));
  stage.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault(); viewer?.turn(event.key === 'ArrowLeft' ? -1 : 1);
  }, {signal});
  get('[data-share]').addEventListener('click', async () => {
    const url = new URL(location.href); url.hash = ''; url.search = '';
    url.searchParams.set('seed',String(current.seed)); url.searchParams.set('family',current.familyId);
    try { await navigator.clipboard.writeText(url.href); if (alive) say('Specimen link copied.'); }
    catch {
      if (!alive) return;
      shareFallback.hidden = false;
      const input = get<HTMLInputElement>('[data-share-url]'); input.value = url.href; input.focus(); input.select(); say('Copy the link below to share this exact specimen.');
    }
  }, {signal});
  get('[data-artwork]').addEventListener('click', () => { download(rockSvg(current,{size:1200,background:true}), `${current.id.toLowerCase()}.svg`, 'image/svg+xml'); say('Your specimen artwork is ready to save.'); }, {signal});
  get('[data-export]').addEventListener('click', () => { download(JSON.stringify(cabinet,null,2), 'pointcast-pocket-rocks-cabinet.json', 'application/json'); say('Cabinet exported. Import it on another device to bring your rocks along.'); }, {signal});
  get<HTMLInputElement>('[data-import]').addEventListener('change', async event => {
    const input = event.target as HTMLInputElement; const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error('Choose a cabinet JSON file smaller than 1 MB.');
      const imported = readCabinet(await file.text());
      if (!alive) return;
      if (!imported.rocks.length) throw new Error('This file has no valid Pocket Rocks specimens.');
      const before = cabinet.rocks.length;
      const merged = readCabinet(JSON.stringify({version:1,rocks:[...cabinet.rocks,...imported.rocks],featuredId:cabinet.featuredId || imported.featuredId}));
      cabinet = merged; save(); renderSpecimen(); renderCabinet();
      say(`${cabinet.rocks.length - before} rocks added${cabinet.rocks.length === 500 ? '; cabinet limit reached' : ''}. ${persistent ? 'Your cabinet is saved.' : 'Export it before leaving.'}`);
    } catch (error) { if (alive) say(error instanceof Error ? error.message : 'That cabinet could not be imported.'); }
    input.value = '';
  }, {signal});
  get('[data-start]').addEventListener('click', event => { event.preventDefault(); stage.scrollIntoView({block:'center'}); stage.focus({preventScroll:true}); }, {signal});
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY) return;
    if (event.newValue === null) cabinet = readCabinet(null);
    else {
      const incoming = readCabinet(event.newValue);
      let latest = readCabinet(null);
      try { latest = readCabinet(localStorage.getItem(STORAGE_KEY)); } catch { persistent = false; storageNote(); }
      cabinet = readCabinet(JSON.stringify({version:1,rocks:[...latest.rocks,...incoming.rocks,...cabinet.rocks],featuredId:latest.featuredId || incoming.featuredId || cabinet.featuredId}));
      if (cabinet.rocks.length > latest.rocks.length) save();
    }
    renderSpecimen(); renderCabinet();
  }, {signal});
  page.querySelectorAll<HTMLButtonElement>('button:disabled').forEach(button => button.disabled = false);
  get<HTMLInputElement>('[data-import]').disabled = false;
  storageNote(); renderSpecimen(); renderCabinet();
  function viewerStatus(available: boolean) {
    get('[data-turn-hint]').textContent = available ? 'Drag to turn · arrow keys work too' : 'Illustrated specimen · 3D unavailable on this device';
    page!.querySelectorAll<HTMLButtonElement>('[data-turn]').forEach(button => button.disabled = !available);
  }
  page.querySelectorAll<HTMLButtonElement>('[data-turn]').forEach(button => button.disabled = true);
  stage.addEventListener('rock-viewer-status', event => viewerStatus((event as CustomEvent).detail.available), {signal});
  if (seedParam !== null && !shared) say('That specimen link was not valid. Here is a fresh rock to explore.');
  void createRockViewer(stage, current).then(result => {
    if (!alive) { result.dispose(); return; }
    viewer = result; viewer.setRock(current); viewerStatus(true);
  }).catch(() => {
    if (!alive) return;
    viewerStatus(false);
  });
  cleanUp = () => { alive = false; controller.abort(); viewer?.dispose(); cleanUp = undefined; mountedPage = undefined; };
}

document.addEventListener('astro:page-load', boot);
document.addEventListener('astro:before-swap', () => cleanUp?.());
boot();
