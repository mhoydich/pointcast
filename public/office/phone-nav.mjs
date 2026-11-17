const destinations = Object.freeze([
  ['floor', 'Floor'],
  ['activity', 'Activity'],
  ['evidence', 'Evidence'],
]);

/** Native controls; the host owns panel visibility and focus. No data is fetched. */
export function createPhoneNav(document, { onSelect } = {}) {
  if (onSelect !== undefined && typeof onSelect !== 'function') {
    throw new TypeError('onSelect must be a function');
  }
  const element = document.createElement('nav');
  element.className = 'office-phone-nav';
  element.setAttribute('aria-label', 'Office views');
  const buttons = new Map();
  let selected = 'floor';

  function setSelected(view) {
    if (!buttons.has(view)) throw new RangeError(`Unknown office view: ${view}`);
    selected = view;
    for (const [key, button] of buttons) {
      button.setAttribute('aria-pressed', String(key === selected));
    }
  }

  for (const [view, label] of destinations) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'office-phone-nav__button';
    button.textContent = label;
    button.setAttribute('aria-controls', `office-${view}`);
    button.addEventListener('click', () => {
      setSelected(view);
      onSelect?.(view);
    });
    buttons.set(view, button);
    element.append(button);
  }
  setSelected(selected);
  return { element, setSelected };
}
