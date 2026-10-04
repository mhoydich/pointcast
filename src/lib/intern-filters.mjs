export function matchesRole(card, { query = '', organization = '', depth = '' }) {
  return (!organization || card.organization === organization) && (!depth || card.depth === depth) && query.trim().toLowerCase().split(/\s+/).every(word => card.search.includes(word));
}
export function setupInternFilters(doc) {
  const filters = doc.querySelector('[data-intern-filters]');
  if (!filters || filters.dataset.ready) return;
  filters.dataset.ready = 'true';
  filters.hidden = false;
  const search = doc.querySelector('#ic-search'), organization = doc.querySelector('#ic-organization'), depth = doc.querySelector('#ic-depth');
  const cards = [...doc.querySelectorAll('[data-role-card]')];
  const update = () => {
    let visible = 0;
    for (const card of cards) { card.hidden = !matchesRole(card.dataset, {query:search.value, organization:organization.value, depth:depth.value}); if (!card.hidden) visible++; }
    doc.querySelector('#ic-count').textContent = `Showing ${visible} of ${cards.length} role records`;
    doc.querySelector('#ic-empty').hidden = visible > 0;
    const index=doc.querySelector('#ic-title-index');
    if(index){const matching=[...index.querySelectorAll('[data-role-card]')].filter(c=>!c.hidden).length;index.hidden=matching===0;index.open=!!(search.value||organization.value||depth.value);} 
  };
  search.addEventListener('input',update); organization.addEventListener('change',update); depth.addEventListener('change',update);
  doc.querySelector('#ic-reset').addEventListener('click', () => {search.value='';organization.value='';depth.value='';update();search.focus();});
}
