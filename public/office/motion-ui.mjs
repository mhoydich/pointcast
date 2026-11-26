/** Local, view-only motion preference. No storage, activity, audio, or network. */
export function createMotionControls(document, root, { matchMedia } = {}) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'office-motion-control';
  element.textContent = 'Still mode';
  let query;
  let userStill = false;
  let destroyed = false;
  // Absence or failure of preference detection leaves the room still.
  try {
    const read = matchMedia ?? document.defaultView?.matchMedia?.bind(document.defaultView);
    query = read?.('(prefers-reduced-motion: reduce)');
  } catch { /* Static fallback. */ }
  const known = () => typeof query?.matches === 'boolean';
  const render = () => {
    if (destroyed) return;
    const enforced = !known() || query.matches;
    const reduced = enforced || userStill;
    root.dataset.motion = reduced ? 'reduced' : 'full';
    element.setAttribute('aria-pressed', String(reduced));
    element.disabled = enforced;
    element.title = enforced
      ? 'Still mode follows your system preference, or stays on when it is unavailable.'
      : 'Keep the room still.';
  };
  const change = () => { userStill = !userStill; render(); };
  // Guard synthetic events as well as normal disabled-button behavior.
  const click = () => { if (!destroyed && known() && !query.matches) change(); };
  element.addEventListener('click', click);
  if (typeof query?.addEventListener === 'function') query.addEventListener('change', render);
  else if (typeof query?.addListener === 'function') query.addListener(render);
  render();
  return {
    element,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      element.removeEventListener('click', click);
      if (typeof query?.removeEventListener === 'function') query.removeEventListener('change', render);
      else if (typeof query?.removeListener === 'function') query.removeListener(render);
      // Removing controls must never restart motion.
      root.dataset.motion = 'reduced';
      element.remove();
    },
  };
}
