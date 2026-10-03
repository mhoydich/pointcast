/** A local reading aid. No fetches, persistence, installs, or subscriptions. */
function initializeFieldGuideFilter() {
  const guide = document.querySelector<HTMLElement>('[data-plugin-field-guide]');
  if (!guide || guide.dataset.filterReady === 'true') return;

  const select = guide.querySelector<HTMLSelectElement>('#fg-brand-filter');
  const count = guide.querySelector<HTMLElement>('#fg-example-count');
  const controls = guide.querySelector<HTMLElement>('[data-brand-filter-ui]');
  const examples = Array.from(guide.querySelectorAll<HTMLElement>('.fg-example-card[data-brand]'));
  if (!select || !count || !controls) return;

  const names: Record<string, string> = {
    pointcast: 'PointCast',
    ues: 'University of El Segundo',
    industrynext: 'IndustryNext',
  };

  function applyFilter() {
    const brand = select!.value;
    let visible = 0;
    for (const example of examples) {
      example.hidden = brand !== 'all' && example.dataset.brand !== brand;
      if (!example.hidden) visible += 1;
    }
    count!.textContent = brand === 'all'
      ? `Showing all ${visible} examples.`
      : `Showing ${visible} of ${examples.length} examples for ${names[brand] ?? brand}.`;
  }

  guide.dataset.filterReady = 'true';
  controls.hidden = false;
  select.addEventListener('change', applyFilter);
  applyFilter();
}

initializeFieldGuideFilter();
document.addEventListener('astro:page-load', initializeFieldGuideFilter);
