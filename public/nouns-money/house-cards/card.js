// Two ordinary page breaks share one proof. They never start or advance the host activity.
(() => {
  const tag = 'nouns-money-house-card';
  if (customElements.get(tag)) return;
  const headlines = { loom: 'Somebody left this.', battler: 'The prize money.' };

  class NounsMoneyHouseCard extends HTMLElement {
    static observedAttributes = ['hidden'];
    #observer;
    #timer;
    #inView = false;

    connectedCallback() {
      const placement = this.getAttribute('placement');
      if (!Object.hasOwn(headlines, placement)) return;
      if (!this.shadowRoot) {
        const root = this.attachShadow({ mode: 'open' });
        root.innerHTML = `
          <style>
            :host { display: block; min-width: 0; width: 100%; box-sizing: border-box; }
            :host([hidden]) { display: none !important; }
            * { box-sizing: border-box; }
            aside { position: relative; isolation: isolate; display: grid; gap: .4rem;
              grid-template-columns: minmax(0,1fr) auto; margin: .45rem 0;
              padding: .65rem .9rem .8rem; border: 1px solid #a89c83; border-top: 3px solid #903a2b;
              background: #f6efe1; color: #28372f; text-align: start; font: normal 16px/1.25 system-ui,sans-serif; }
            header { grid-column: 1/-1; display:flex; align-items:center; justify-content:space-between; gap: .5rem; }
            header span { color: #813425; font: 700 .72rem/1.25 ui-monospace,monospace; letter-spacing: .04em; }
            button { font: 600 .85rem/1 system-ui,sans-serif; color: #28372f; border: 1px solid #9b9382;
              background: transparent; min-height: 32px; min-width: 44px; padding: .3rem .6rem; cursor: pointer; }
            h2 { margin: .1rem 0 0; font: normal clamp(1.35rem, 3vw, 1.9rem)/1.05 Georgia,serif; letter-spacing: -.035em; }
            p { margin: .35rem 0 .55rem; color: #4f5146; font-size: .78rem; }
            a { display: inline-flex; align-items: center; min-height: 28px; color: #783425;
              font: 650 .9rem/1.25 system-ui,sans-serif; text-decoration: underline; text-underline-offset: .18em; }
            button:focus-visible,a:focus-visible { outline: 3px solid #175777; outline-offset: 2px; }
            img { width: clamp(78px,17vw,152px); max-width: 100%; height: auto; align-self: center;
              box-shadow: 1px 2px 2px #3a34262b; transform: rotate(-3deg); }
          </style>
          <aside aria-label="Nouns Money house ad">
            <header><span>A word from the mint</span><button type="button" aria-label="Skip Nouns Money house ad">Skip</button></header>
            <div><h2></h2><p>Art, no cash value</p><a href="https://nounsmoney.xyz/">Visit the mint</a></div>
            <img src="/nouns-money/house-cards/note.svg" width="600" height="264" alt="An engraved house proof with a red serial.">
          </aside>`;
        root.querySelector('h2').textContent = headlines[placement];
        root.querySelector('button').addEventListener('click', () => this.#dismiss());
        this.addEventListener('focusin', this.#updateTimer);
        this.addEventListener('focusout', () => queueMicrotask(this.#updateTimer));
        this.addEventListener('pointerenter', this.#updateTimer);
        this.addEventListener('pointerleave', this.#updateTimer);
      }
      this.#inView = false;
      this.#observer = new IntersectionObserver(([entry]) => {
        this.#inView = entry.intersectionRatio >= 0.5;
        this.#updateTimer();
      }, { threshold: [0, 0.5] });
      this.#observer.observe(this);
      document.addEventListener('visibilitychange', this.#updateTimer);
    }

    attributeChangedCallback() {
      this.#updateTimer();
    }

    disconnectedCallback() {
      this.#observer?.disconnect();
      clearTimeout(this.#timer);
      document.removeEventListener('visibilitychange', this.#updateTimer);
    }

    #updateTimer = () => {
      clearTimeout(this.#timer);
      if (!this.isConnected || this.hidden || !this.#inView || document.hidden ||
          this.shadowRoot?.activeElement || this.matches(':hover')) return;
      this.#timer = setTimeout(() => { this.hidden = true; }, 7000);
    };

    #dismiss() {
      const selector = this.dataset.returnFocus;
      const explicitTarget = selector && document.querySelector(selector);
      const row = this.nextElementSibling;
      this.hidden = true;
      // On Loom the next directory row is always a button. The round host supplies its own control.
      const target = explicitTarget || (row?.matches('button,a[href]') ? row : row?.querySelector('button,a[href]'));
      target?.focus({ preventScroll: true });
    }
  }
  customElements.define(tag, NounsMoneyHouseCard);
})();
