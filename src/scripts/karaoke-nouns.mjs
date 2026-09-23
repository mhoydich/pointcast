/**
 * Local, decorative Nouns for the people sharing this screen.
 * These companions do not listen, score, identify, or represent remote users.
 */
export const NOUN_COMPANIONS = Object.freeze([
  { name: 'Pocket Captain', image: '/games/nouns-nation-battler/assets/noun-1.svg' },
  { name: 'Moon Rim', image: '/games/nouns-nation-battler/assets/noun-37.svg' },
  { name: 'Low & Slow', image: '/games/nouns-nation-battler/assets/noun-12.svg' },
  { name: 'Soft Signal', image: '/games/nouns-nation-battler/assets/noun-5.svg' },
  { name: 'Glass Garden', image: '/games/nouns-nation-battler/assets/noun-20.svg' },
  { name: 'Cloud Nine', image: '/games/nouns-nation-battler/assets/noun-9.svg' },
]);

const clampSingers = value => Math.min(8, Math.max(1, Math.trunc(Number(value)) || 1));

export function initNounCompanions(container) {
  if (!(container instanceof Element)) throw new TypeError('A companion container element is required.');

  let singerCount = 1;
  let choices = [0];
  const activeAnimations = new Set();

  const heading = document.createElement('div');
  heading.className = 'noun-companions__heading';
  const headingText = document.createElement('div');
  const title = document.createElement('h2');
  title.textContent = 'NOUN COMPANIONS';
  const note = document.createElement('p');
  note.textContent = 'Local room mascots · decorative only';
  headingText.append(title, note);

  const cheerButton = document.createElement('button');
  cheerButton.type = 'button';
  cheerButton.className = 'noun-companions__cheer';
  cheerButton.textContent = 'Cheer';
  cheerButton.setAttribute('aria-label', 'Cheer for the singers on this screen');
  heading.append(headingText, cheerButton);

  const list = document.createElement('div');
  list.className = 'noun-companions__list';
  list.setAttribute('role', 'list');

  const status = document.createElement('p');
  status.className = 'noun-companions__status';
  status.setAttribute('role', 'status');
  status.textContent = 'Tap a companion to choose another.';

  container.classList.add('noun-companions');
  container.replaceChildren(heading, list, status);

  function render(focusSinger = 0) {
    list.replaceChildren(...choices.slice(0, singerCount).map((choice, index) => {
      const companion = NOUN_COMPANIONS[choice];
      const item = document.createElement('div');
      item.className = 'noun-companion';
      item.setAttribute('role', 'listitem');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'noun-companion__choice';
      button.dataset.singer = String(index + 1);
      button.setAttribute('aria-label', `Singer ${index + 1} companion: ${companion.name}. Choose next companion.`);

      const image = document.createElement('img');
      image.src = companion.image;
      image.alt = '';
      image.width = 72;
      image.height = 72;
      image.loading = 'lazy';
      image.decoding = 'async';

      const text = document.createElement('span');
      const singer = document.createElement('small');
      singer.textContent = `Singer ${index + 1}`;
      const name = document.createElement('strong');
      name.textContent = companion.name;
      text.append(singer, name);
      button.append(image, text);
      button.addEventListener('click', () => {
        choices[index] = (choices[index] + 1) % NOUN_COMPANIONS.length;
        render(index + 1);
        status.textContent = `Singer ${index + 1} chose ${NOUN_COMPANIONS[choices[index]].name}.`;
      });
      item.append(button);
      return item;
    }));
    if (focusSinger) list.querySelector(`[data-singer="${focusSinger}"]`)?.focus();
  }

  function setSingers(count) {
    singerCount = clampSingers(count);
    choices = Array.from({ length: singerCount }, (_, index) => choices[index] ?? index % NOUN_COMPANIONS.length);
    render();
    status.textContent = `${singerCount} ${singerCount === 1 ? 'companion' : 'companions'} on this screen.`;
  }

  function cheer(label = 'Cheer') {
    const safeLabel = typeof label === 'string' && label.trim() ? label.trim().slice(0, 40) : 'Cheer';
    status.textContent = `${safeLabel} for the singers on this screen.`;
    container.dataset.cheer = safeLabel;

    const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduceMotion) return;
    list.querySelectorAll('.noun-companion__choice').forEach((element, index) => {
      if (typeof element.animate !== 'function') return;
      const animation = element.animate(
        [
          { transform: 'translateY(0) rotate(0)' },
          { transform: `translateY(-5px) rotate(${index % 2 ? '1.5deg' : '-1.5deg'})`, offset: .48 },
          { transform: 'translateY(0) rotate(0)' },
        ],
        { duration: 360, delay: Math.min(index * 24, 144), easing: 'ease-out' },
      );
      activeAnimations.add(animation);
      animation.onfinish = animation.oncancel = () => activeAnimations.delete(animation);
    });
  }

  function reset() {
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations.clear();
    delete container.dataset.cheer;
    status.textContent = 'Tap a companion to choose another.';
  }

  cheerButton.addEventListener('click', () => cheer('A little applause'));
  render();
  return { setSingers, cheer, reset };
}
