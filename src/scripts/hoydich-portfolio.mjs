export function initPortfolio(root) {
  if (!root || root.dataset.portfolioReady === 'true') return;
  root.dataset.portfolioReady = 'true';
  const main = root.closest('main');
  if (main) main.tabIndex = -1;
  const family = root.querySelector('[data-family-filter]');
  const statusButtons = [...root.querySelectorAll('[data-status-filter]')];
  const projectCards = [...root.querySelectorAll('[data-project-card]')];
  const nativeCards = [...root.querySelectorAll('[data-native-card]')];
  const studioCards = [...root.querySelectorAll('[data-studio-card]')];
  let status = 'all';
  const apply = () => {
    const familyId = family.value;
    const fitsFamily = card => familyId === 'all' || card.dataset.family === familyId;
    for (const card of projectCards) card.hidden = !fitsFamily(card) || (status !== 'all' && status !== 'open' && card.dataset.nextStatus !== status);
    for (const card of studioCards) card.hidden = !fitsFamily(card) || (status === 'open' || status === 'delivered-native') || (status !== 'all' && card.dataset.status !== status);
    for (const card of nativeCards) card.hidden = !fitsFamily(card) || (status !== 'all' && status !== 'delivered-native');
    const nativeCount = nativeCards.filter(card => !card.hidden).length;
    const openCount = projectCards.filter(card => !card.hidden).length;
    const studioCount = studioCards.filter(card => !card.hidden).length;
    root.querySelector('[data-project-empty]').hidden = openCount > 0;
    root.querySelector('[data-studio-empty]').hidden = studioCount > 0;
    root.querySelector('[data-filter-result]').textContent = `${openCount} open ${openCount === 1 ? 'project' : 'projects'} and ${studioCount} studio ${studioCount === 1 ? 'thread' : 'threads'}${nativeCards.length ? `; ${nativeCount} native ${nativeCount === 1 ? 'edition' : 'editions'}` : ''} shown.`;
    for (const button of statusButtons) button.setAttribute('aria-pressed', String(button.dataset.statusFilter === status));
  };
  family.addEventListener('change', apply);
  for (const button of statusButtons) button.addEventListener('click', () => { status = button.dataset.statusFilter; apply(); });
  root.querySelector('[data-reset-filters]').addEventListener('click', () => { status = 'all'; family.value = 'all'; apply(); });
  for (const link of root.querySelectorAll('[data-show-studio]')) link.addEventListener('click', () => { status = 'all'; apply(); });
  root.querySelector('[data-portfolio-filters]').hidden = false;
  apply();
}
