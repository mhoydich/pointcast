import {
  BANDMATE_QUARTET_ROLES,
  composeBandmateScore,
  nounsDrumClubBandmateArrangement,
  nounsDrumClubArrangementPlayUrl,
  type BandmateQuartet,
} from './nouns-drum-club-arrangements';

const mount = () => {
  const root = document.querySelector<HTMLElement>('[data-band-builder]');
  if (!root || root.dataset.mounted === 'true') return;
  root.dataset.mounted = 'true';
  const selects = BANDMATE_QUARTET_ROLES.map((role) => root.querySelector<HTMLSelectElement>(`[data-band-select="${role}"]`));
  const slots = BANDMATE_QUARTET_ROLES.map((role) => root.querySelector<HTMLElement>(`[data-band-slot="${role}"]`));
  const play = root.querySelector<HTMLAnchorElement>('[data-band-play]');
  const status = root.querySelector<HTMLElement>('[data-band-status]');
  let defaults = (root.dataset.defaultBand || '').split(',').map(Number) as unknown as BandmateQuartet;
  const daily = nounsDrumClubBandmateArrangement(new Date());
  const label = root.querySelector<HTMLElement>('[data-band-label]');
  if (label) label.textContent = 'TODAY’S BAND';
  selects.forEach((select) => { if (select) select.disabled = false; });
  root.querySelectorAll<HTMLButtonElement>('button[disabled]').forEach((button) => { button.disabled = false; });
  if (daily.dateKey !== root.dataset.date) {
    defaults = daily.quartet;
    root.dataset.date = daily.dateKey;
    root.dataset.defaultBand = daily.quartet.join(',');
    const date = root.querySelector<HTMLElement>('[data-band-date]');
    if (date) date.textContent = daily.dateKey;
    const prompt = root.querySelector<HTMLElement>('[data-band-prompt]');
    if (prompt) prompt.textContent = daily.prompt.split('. ').slice(-1)[0];
    selects.forEach((select, index) => { if (select) select.value = String(daily.quartet[index]); });
  }
  const values = () => selects.map((select) => Number(select?.value)) as unknown as BandmateQuartet;
  const update = (announce = true) => {
    const quartet = values();
    try {
      const isDailyBand = quartet.every((id, index) => id === daily.quartet[index]);
      if (label) label.textContent = isDailyBand ? 'TODAY’S BAND' : 'YOUR BAND';
      const score = isDailyBand ? daily.score : composeBandmateScore(quartet, 'Encore · Your band');
      if (play) {
        const localUrl = new URL(nounsDrumClubArrangementPlayUrl(quartet, score), window.location.origin);
        play.href = `${localUrl.pathname}${localUrl.search}`;
      }
      slots.forEach((slot, index) => {
        const select = selects[index];
        const option = select?.selectedOptions[0];
        const item = option?.dataset;
        if (!slot || !item) return;
        slot.style.setProperty('--band-color', item.color || '#f0e94a');
        const image = slot.querySelector<HTMLImageElement>('[data-band-image]');
        const name = slot.querySelector<HTMLElement>('[data-band-name]');
        if (image) { image.src = item.webp || ''; image.alt = item.name || ''; }
        if (name) name.textContent = item.name || '';
      });
      const tempoSummary = root.querySelector<HTMLElement>('[data-band-tempo-summary]');
      if (tempoSummary) tempoSummary.textContent = `Combined feel · ${score.tempo} BPM`;
      if (announce && status) status.textContent = 'Band updated. Play & remix when you are ready.';
    } catch {
      if (status) status.textContent = 'Choose one player in each role to make your band.';
    }
  };
  selects.forEach((select) => select?.addEventListener('change', () => update()));
  root.querySelector<HTMLButtonElement>('[data-band-reset]')?.addEventListener('click', () => {
    selects.forEach((select, index) => { if (select && Number.isFinite(defaults[index])) select.value = String(defaults[index]); });
    update();
    status && (status.textContent = 'Today’s band is back on stage.');
  });
  root.querySelector<HTMLButtonElement>('[data-band-shuffle]')?.addEventListener('click', () => {
    const before = selects.map((select) => select?.value).join(',');
    for (let attempt = 0; attempt < 8 && selects.map((select) => select?.value).join(',') === before; attempt += 1) {
      selects.forEach((select) => {
        if (!select) return;
        const options = Array.from(select.options);
        select.value = options[Math.floor(Math.random() * options.length)]?.value || select.value;
      });
    }
    if (selects.map((select) => select?.value).join(',') === before) {
      const first = selects[0];
      if (first && first.options.length > 1) first.selectedIndex = (first.selectedIndex + 1) % first.options.length;
    }
    update();
    status && (status.textContent = 'New players, same open stage.');
  });
  update(false);
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
else mount();
document.addEventListener('astro:page-load', mount);
