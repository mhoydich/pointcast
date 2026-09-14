import { coGameWorlds, type CoGameWorldId } from './co-games-worlds';

export function mountCoGamesWorlds(root: HTMLElement): () => void {
  const doc = root.ownerDocument, win = doc.defaultView!;
  const lifetime = new win.AbortController();
  const options = { signal: lifetime.signal };
  const landscape = root.querySelector<HTMLImageElement>('.cg-landscape');
  const stage = root.querySelector<HTMLElement>('.cg-stage');
  const grid = root.querySelector('[data-world-grid]');
  const cards: HTMLButtonElement[] = [];
  const effects = root.querySelector<HTMLSelectElement>('[data-effects-control]');
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  let selectedEffects = 'gentle';
  try { selectedEffects = win.localStorage.getItem('pointcast:co-games:effects') || 'gentle'; } catch {}
  if (!['gentle', 'full', 'still'].includes(selectedEffects)) selectedEffects = 'gentle';
  const renderEffects = () => {
    root.dataset.effects = motion.matches ? 'still' : selectedEffects;
    if (effects) effects.value = selectedEffects;
    const note = root.querySelector('[data-motion-note]');
    if (note) note.textContent = motion.matches ? 'Your device’s reduced-motion setting is on. Effects stay still.'
      : selectedEffects === 'still' ? 'Still scenes. Clear turn results.' : selectedEffects === 'gentle' ? 'Small glows and quiet movement.' : 'Floating sparks and bouncier battle effects.';
  };
  effects?.addEventListener('change', () => {
    selectedEffects = effects.value;
    try { win.localStorage.setItem('pointcast:co-games:effects', selectedEffects); } catch {}
    renderEffects();
  }, options);
  motion.addEventListener('change', renderEffects, options);
  renderEffects();

  for (const [id, world] of Object.entries(coGameWorlds)) {
    const button = doc.createElement('button'); button.type = 'button'; button.className = 'cg-world-card';
    button.dataset.visitEncounter = id;
    const image = doc.createElement('img'); image.src = world.src; image.alt = ''; image.loading = 'lazy'; image.width = 360; image.height = 180;
    const copy = doc.createElement('div');
    const chapter = doc.createElement('small'); chapter.textContent = `CHAPTER ${world.chapter}`;
    const name = doc.createElement('strong'); name.textContent = world.name;
    const story = doc.createElement('p'); story.textContent = world.story;
    const action = doc.createElement('em'); action.textContent = 'Travel here ↗';
    copy.append(chapter, name, story, action); button.append(image, copy); grid?.append(button); cards.push(button);
  }
  let current: CoGameWorldId | undefined;
  let imageVersion = 0;
  let arrivalTimer: number | undefined;
  let pendingImage: HTMLImageElement | null = null;
  const syncFloor = () => {
    if (!landscape || !stage || !landscape.naturalWidth || !landscape.naturalHeight) return;
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height) return;
    const scale = Math.max(width / landscape.naturalWidth, height / landscape.naturalHeight);
    const imageHeight = landscape.naturalHeight * scale;
    const ground = current === 'rush' ? 0.78 : current === 'shell' ? 0.76 : current === 'storm' ? 0.77 : 0.735;
    const floorY = imageHeight * ground - (imageHeight - height) * .62;
    const label = root.querySelector<HTMLElement>('.cg-you>span')?.getBoundingClientRect().height || 18;
    root.style.setProperty('--cg-floor-bottom', `${Math.max(8, Math.min(height * .38, height - floorY - label))}px`);
  };
  const syncWorld = () => {
    const id = root.dataset.encounter as CoGameWorldId;
    const world = coGameWorlds[id];
    const busy = root.dataset.busy === 'true';
    root.querySelectorAll<HTMLButtonElement>('[data-dialog="cg-worlds"]').forEach(button => { button.disabled = busy; });
    cards.forEach(button => { button.disabled = busy; button.setAttribute('aria-current', String(button.dataset.visitEncounter === id)); });
    if (!world || current === id) return;
    current = id;
    root.dataset.world = world.theme;
    root.style.setProperty('--cg-world-position', world.position);
    const name = root.querySelector('[data-world-name]'), story = root.querySelector('[data-world-story]');
    if (name) name.textContent = world.name;
    if (story) story.textContent = world.story;
    const version = ++imageVersion;
    if (pendingImage) { pendingImage.onload = null; pendingImage.onerror = null; }
    if (!landscape || landscape.getAttribute('src') === world.src) { syncFloor(); return; }
    pendingImage = new win.Image();
    pendingImage.onload = () => {
      if (lifetime.signal.aborted || version !== imageVersion || !landscape) return;
      landscape.src = world.src;
      root.classList.remove('cg-world-arrive');
      win.clearTimeout(arrivalTimer);
      root.classList.add('cg-world-arrive');
      arrivalTimer = win.setTimeout(() => root.classList.remove('cg-world-arrive'), 650);
      syncFloor(); pendingImage = null;
    };
    pendingImage.onerror = () => { if (version !== imageVersion || lifetime.signal.aborted) return; pendingImage = null; current = undefined; };
    pendingImage.src = world.src;
  };
  landscape?.addEventListener('load', syncFloor, options);
  const observer = new win.MutationObserver(syncWorld);
  observer.observe(root, { attributes: true, attributeFilter: ['data-encounter', 'data-busy'] });
  const resize = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(syncFloor) : null;
  if (stage) resize?.observe(stage);
  win.addEventListener('resize', syncFloor, options);
  syncWorld();
  return () => {
    lifetime.abort(); observer.disconnect(); resize?.disconnect(); win.clearTimeout(arrivalTimer);
    if (pendingImage) { pendingImage.onload = null; pendingImage.onerror = null; }
    cards.forEach(card => card.remove()); root.classList.remove('cg-world-arrive');
  };
}
