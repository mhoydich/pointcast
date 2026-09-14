import { nounRoster } from './co-games-roster';

/** Presentation only: game state and AI requests remain in co-games-ui. */
export function mountCoGamesHud(root: HTMLElement): () => void {
  const doc = root.ownerDocument;
  const win = doc.defaultView!;
  const lifetime = new win.AbortController();
  const options = { signal: lifetime.signal };
  let animationTimer: number | undefined;
  let opener: HTMLElement | null = null;
  const dialogs = [...root.querySelectorAll<HTMLDialogElement>('dialog')];
  root.querySelectorAll<HTMLButtonElement>('[data-dialog]').forEach(button => button.addEventListener('click', () => {
    if (button.disabled) return;
    const dialog = dialogs.find(item => item.id === button.dataset.dialog);
    if (!dialog) return;
    opener = button;
    dialog.showModal();
  }, options));
  dialogs.forEach(dialog => {
    dialog.addEventListener('close', () => { opener?.focus(); opener = null; }, options);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }, options);
  });

  type Noun = typeof nounRoster[number];
  let crew: Noun[] = [];
  let pinnedHero: Noun | null = null;
  const roster = root.querySelector('[data-noun-roster]');
  const rosterButtons: HTMLButtonElement[] = [];
  const renderCrew = () => {
    root.querySelectorAll<HTMLImageElement>('[data-noun-slot]').forEach(image => {
      const noun = crew[Number(image.dataset.nounSlot)];
      if (noun) image.src = noun.src;
    });
    root.querySelectorAll<HTMLElement>('[data-noun-name]').forEach(label => {
      const noun = crew[Number(label.dataset.nounName)];
      if (noun) label.textContent = noun.name;
    });
    root.querySelector('.cg-you')?.setAttribute('aria-label', `${crew[0].name}, your Noun. Choose another Noun`);
    rosterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.nounChoice === crew[0].id)));
  };
  const shuffleCrew = () => {
    const previous = crew;
    const next: Noun[] = pinnedHero ? [pinnedHero] : [];
    while (next.length < 4) {
      const slot = next.length;
      const candidates = nounRoster.filter(noun => !next.includes(noun) && noun.id !== previous[slot]?.id);
      next.push(candidates[Math.floor(Math.random() * candidates.length)]);
    }
    crew = next;
    renderCrew();
  };
  for (const noun of nounRoster) {
    const button = doc.createElement('button');
    button.type = 'button'; button.className = 'cg-roster-card'; button.dataset.nounChoice = noun.id;
    const image = doc.createElement('img'); image.src = noun.src; image.alt = ''; image.width = 80; image.height = 80;
    const label = doc.createElement('span'); label.textContent = noun.name;
    button.append(image, label);
    button.addEventListener('click', () => {
      if (root.dataset.busy === 'true') return;
      const oldHero = crew[0];
      const otherSlot = crew.findIndex(member => member.id === noun.id);
      if (otherSlot > 0) crew[otherSlot] = oldHero;
      crew[0] = noun; pinnedHero = noun;
      renderCrew();
      dialogs.find(dialog => dialog.id === 'cg-roster')?.close();
    }, options);
    rosterButtons.push(button); roster?.append(button);
  }
  root.querySelector('[data-shuffle-nouns]')?.addEventListener('click', () => {
    if (root.dataset.busy === 'true') return;
    pinnedHero = null; shuffleCrew();
  }, options);
  shuffleCrew();

  const resetAnimation = () => {
    win.clearTimeout(animationTimer);
    root.classList.remove('cg-animating');
    delete root.dataset.human;
    delete root.dataset.support;
    delete root.dataset.combo;
  };
  // A quick double-click is still only one visible turn.
  root.addEventListener('click', event => {
    const target = event.target instanceof win.Element ? event.target.closest('[data-cast],[data-request],[data-card],[data-hint]') : null;
    if (target && root.classList.contains('cg-animating')) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, { ...options, capture: true });
  const syncRift = () => {
    const health = Number(root.querySelector('[data-enemy]')?.textContent || 18);
    const maximum = Number(root.querySelector('[data-enemy-max]')?.textContent || 18);
    const fill = root.querySelector<HTMLElement>('[data-rift-fill]');
    if (fill) fill.style.width = `${Math.max(0, Math.min(maximum, health)) / maximum * 100}%`;
    const armor = Number(root.querySelector('[data-current-armor]')?.textContent || 0);
    const indicator = root.querySelector<HTMLElement>('[data-armor-indicator]');
    if (indicator) indicator.hidden = armor <= 0;
    root.dataset.armor = armor > 0 ? 'active' : 'none';
  };
  const observer = new win.MutationObserver(syncRift);
  root.querySelectorAll('[data-enemy],[data-enemy-max],[data-current-armor]').forEach(element => {
    observer.observe(element, { childList: true, characterData: true, subtree: true });
  });
  const syncRosterBusy = () => root.querySelectorAll<HTMLButtonElement>('[data-dialog="cg-roster"],[data-shuffle-nouns],[data-noun-choice]')
    .forEach(button => { button.disabled = root.dataset.busy === 'true'; });
  const busyObserver = new win.MutationObserver(syncRosterBusy);
  busyObserver.observe(root, { attributes: true, attributeFilter: ['data-busy'] });
  syncRift(); syncRosterBusy();
  root.addEventListener('co-games:turn', event => {
    const turn = (event as CustomEvent<{ human: string; support: string; damage: number; taken: number; healing: number; combo?: { name: string; description: string } | null }>).detail;
    resetAnimation();
    root.dataset.human = turn.human;
    root.dataset.support = turn.support;
    root.dataset.combo = String(Boolean(turn.combo));
    const rift = root.querySelector('[data-damage-rift]');
    const team = root.querySelector('[data-damage-team]');
    const comboName = root.querySelector('[data-combo-name]');
    const comboDetail = root.querySelector('[data-combo-detail]');
    if (rift) rift.textContent = turn.damage ? `−${turn.damage}` : turn.human === 'focus' ? '×2' : 'BLOCK';
    if (team) team.textContent = turn.taken ? `−${turn.taken}` : turn.healing ? `+${turn.healing}` : 'BLOCK';
    if (comboName) comboName.textContent = turn.combo?.name || '';
    if (comboDetail) comboDetail.textContent = turn.combo ? ({ echo: 'Ember + Echo · +2 bonus damage', ward: 'Root + Ward · +2 bonus healing', mend: 'Focus + Mend · +2 bonus healing' } as Record<string, string>)[turn.support] || turn.combo.description : '';
    root.classList.add('cg-animating');
    animationTimer = win.setTimeout(resetAnimation, win.matchMedia('(prefers-reduced-motion: reduce)').matches ? 350 : 1800);
  }, options);
  root.addEventListener('co-games:match', event => {
    resetAnimation();
    if (!(event as CustomEvent<{ retry: boolean }>).detail.retry) shuffleCrew();
  }, options);
  root.querySelector('[data-replay]')?.addEventListener('click', resetAnimation, options);
  doc.addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || dialogs.some(dialog => dialog.open)) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input,textarea,select,[contenteditable=true]')) return;
    const card = ({ '1': 'ember', '2': 'root', '3': 'focus' } as Record<string, string>)[event.key];
    if (card) { event.preventDefault(); root.querySelector<HTMLButtonElement>(`[data-card="${card}"]`)?.click(); }
    if (event.code === 'Space' && (!target?.closest('button,a') || Boolean(target?.closest('[data-card]')))) {
      event.preventDefault();
      const selector = root.dataset.status !== 'playing' ? '[data-replay]' : root.dataset.mode === 'native' ? '[data-request]' : '[data-cast]';
      root.querySelector<HTMLButtonElement>(selector)?.click();
    }
  }, options);
  return () => {
    resetAnimation(); observer.disconnect(); busyObserver.disconnect();
    dialogs.forEach(dialog => { if (dialog.open) dialog.close(); });
    lifetime.abort(); rosterButtons.forEach(button => button.remove());
  };
}
