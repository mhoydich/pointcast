/**
 * The saved sky in the browser.
 * Tweet text stays in the DOM as text. This file never reads it as code.
 */
import { skyLayout, skyLine, utcDay } from '../lib/bookmarks.mjs';

type IndexItem = { id: string; account: string; theme: string; first_seen: string };

const root = document.querySelector<HTMLElement>('[data-bookmarks]');
if (root) {
  const sky = root.querySelector<HTMLElement>('[data-sky]');
  const stage = root.querySelector<HTMLElement>('[data-stage]');
  const lines = root.querySelector<SVGSVGElement>('[data-lines]');
  const line = root.querySelector<HTMLElement>('[data-sky-line]');
  const dayLabel = root.querySelector<HTMLElement>('[data-sky-day]');
  const indexNode = document.getElementById('bm-index');
  const index = JSON.parse(indexNode?.textContent || '[]') as IndexItem[];

  const paint = (day: string) => {
    if (!sky || !stage) return;
    const layout = skyLayout(index, day);
    sky.dataset.drift = layout.drift;
    root.dataset.drift = layout.drift;
    if (line) line.textContent = skyLine(layout);
    if (dayLabel) dayLabel.textContent = day;
    stage.replaceChildren();
    for (const card of layout.cards) {
      const source = root.querySelector<HTMLElement>(
        `.river .card[data-account="${CSS.escape(card.item.account)}"][data-id="${CSS.escape(card.item.id)}"]`,
      );
      if (!source) continue;
      const copy = source.cloneNode(true) as HTMLElement;
      copy.classList.add('card--sky');
      copy.removeAttribute('id');
      copy.style.setProperty('--col', String(card.column));
      copy.style.setProperty('--row', String(card.row));
      copy.style.setProperty('--jx', `${card.jx}px`);
      copy.style.setProperty('--jy', `${card.jy}px`);
      copy.style.setProperty('--r', `${card.rotate}deg`);
      stage.append(copy);
    }
    drawLines();
    applyFilters();
  };

  const drawLines = () => {
    if (!sky || !lines || !stage) return;
    const narrow = window.matchMedia('(max-width: 760px)').matches;
    lines.replaceChildren();
    if (narrow) return;
    const box = sky.getBoundingClientRect();
    if (box.width < 20) return;
    lines.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const cards = [...stage.querySelectorAll<HTMLElement>('.card--sky')].filter((card) => !card.hidden);
    const centers = cards.map((card) => {
      const rect = card.getBoundingClientRect();
      return {
        theme: card.dataset.theme || '',
        x: rect.left + rect.width / 2 - box.left,
        y: rect.top + rect.height / 2 - box.top,
      };
    });
    for (let i = 0; i < centers.length; i += 1) {
      for (let j = i + 1; j < centers.length; j += 1) {
        if (centers[i].theme !== centers[j].theme) continue;
        const dist = Math.hypot(centers[i].x - centers[j].x, centers[i].y - centers[j].y);
        if (dist <= 0 || dist > box.width * 0.34) continue;
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        node.setAttribute('x1', String(centers[i].x));
        node.setAttribute('y1', String(centers[i].y));
        node.setAttribute('x2', String(centers[j].x));
        node.setAttribute('y2', String(centers[j].y));
        node.setAttribute('stroke', getComputedStyle(cards[i]).getPropertyValue('--ink').trim() || '#185FA5');
        lines.append(node);
      }
    }
  };

  const applyFilters = () => {
    const theme = root.dataset.themeFilter || 'all';
    const account = root.dataset.accountFilter || 'all';
    root.querySelectorAll<HTMLElement>('.river').forEach((river) => {
      const cards = [...river.querySelectorAll<HTMLElement>('.card')];
      cards.forEach((card) => {
        card.hidden = account !== 'all' && card.dataset.account !== account;
      });
      const themeOk = theme === 'all' || river.dataset.theme === theme;
      river.hidden = !themeOk || cards.every((card) => card.hidden);
    });
    root.querySelectorAll<HTMLElement>('.card--sky').forEach((card) => {
      const themeOk = theme === 'all' || card.dataset.theme === theme;
      const accountOk = account === 'all' || card.dataset.account === account;
      card.hidden = !(themeOk && accountOk);
    });
  };

  root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.dataset.filter;
      const value = button.dataset.value || 'all';
      if (kind === 'theme') root.dataset.themeFilter = value;
      if (kind === 'account') root.dataset.accountFilter = value;
      root.querySelectorAll<HTMLButtonElement>(`[data-filter="${kind}"]`).forEach((other) => {
        other.setAttribute('aria-pressed', other === button ? 'true' : 'false');
      });
      applyFilters();
      drawLines();
    });
  });

  const tick = () => {
    root.style.setProperty('--hour', String(new Date().getUTCHours()));
  };

  paint(utcDay());
  tick();
  window.addEventListener('resize', drawLines);
  window.setInterval(tick, 60_000);
}
