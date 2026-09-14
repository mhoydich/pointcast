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
  const resetAnimation = () => {
    win.clearTimeout(animationTimer);
    root.classList.remove('cg-animating');
    delete root.dataset.human;
    delete root.dataset.support;
  };
  // A quick double-click is still only one visible turn.
  root.addEventListener('click', event => {
    const target = event.target instanceof win.Element ? event.target.closest('[data-cast],[data-request],[data-card],[data-hint]') : null;
    if (target && root.classList.contains('cg-animating')) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, { ...options, capture: true });
  const syncRift = () => {
    const health = Number(root.querySelector('[data-enemy]')?.textContent || 18);
    const fill = root.querySelector<HTMLElement>('[data-rift-fill]');
    if (fill) fill.style.width = `${Math.max(0, Math.min(18, health)) / 18 * 100}%`;
  };
  const observer = new win.MutationObserver(syncRift);
  const enemy = root.querySelector('[data-enemy]');
  if (enemy) observer.observe(enemy, { childList: true, characterData: true, subtree: true });
  root.addEventListener('co-games:turn', event => {
    const turn = (event as CustomEvent<{ human: string; support: string; damage: number; taken: number; healing: number }>).detail;
    resetAnimation();
    root.dataset.human = turn.human;
    root.dataset.support = turn.support;
    const rift = root.querySelector('[data-damage-rift]');
    const team = root.querySelector('[data-damage-team]');
    if (rift) rift.textContent = turn.damage ? `−${turn.damage}` : '×2';
    if (team) team.textContent = turn.taken ? `−${turn.taken}` : turn.healing ? `+${turn.healing}` : 'BLOCK';
    root.classList.add('cg-animating');
    animationTimer = win.setTimeout(resetAnimation, win.matchMedia('(prefers-reduced-motion: reduce)').matches ? 350 : 1100);
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
  return () => { resetAnimation(); observer.disconnect(); dialogs.forEach(dialog => { if (dialog.open) dialog.close(); }); lifetime.abort(); };
}
