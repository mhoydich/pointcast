import { DEMO_OFFERS, createState, propose, applyPolicy, approve, decline, reset } from '../lib/bot-money-demo.mjs';

type Scenario = keyof typeof DEMO_OFFERS;

function mountOfferDesk(root: HTMLElement) {
  if (root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';
  const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const prepare = find<HTMLButtonElement>('[data-bm-prepare]');
  const approveButton = find<HTMLButtonElement>('[data-bm-approve]');
  const declineButton = find<HTMLButtonElement>('[data-bm-decline]');
  const resetButton = find<HTMLButtonElement>('[data-bm-reset]');
  const download = find<HTMLButtonElement>('[data-bm-download]');
  const limit = find<HTMLInputElement>('[data-bm-limit]');
  const buyAllowed = find<HTMLInputElement>('[data-bm-buy]');
  const giftAllowed = find<HTMLInputElement>('[data-bm-gift]');
  const review = find<HTMLElement>('[data-bm-review]');
  const status = find<HTMLElement>('[data-bm-status]');
  let state = createState();
  let scenario: Scenario = 'earn';

  function writeControls() {
    limit.value = String(state.policy.maxSpend);
    buyAllowed.checked = state.policy.allowBuy;
    giftAllowed.checked = state.policy.allowGift;
    root.querySelectorAll<HTMLInputElement>('input[name="bm-scenario"]').forEach((radio) => { radio.checked = radio.value === scenario; });
  }

  // Browser form restoration does not always fire input/change events. Read the
  // visible controls at each action boundary, and invalidate stale proposals.
  function readControls() {
    const selected = root.querySelector<HTMLInputElement>('input[name="bm-scenario"]:checked')?.value;
    if (!selected || !Object.hasOwn(DEMO_OFFERS, selected)) {
      state = { ...state, pending: null, notice: 'Choose one of the three available samples.' };
      return false;
    }
    if (selected !== scenario) {
      scenario = selected as Scenario;
      state = { ...state, pending: null, notice: 'Sample changed. Prepare a fresh proposal to review its terms.' };
    }
    state = applyPolicy(state, { maxSpend: limit.valueAsNumber, allowBuy: buyAllowed.checked, allowGift: giftAllowed.checked });
    return limit.validity.valid;
  }

  function render() {
    const offer = DEMO_OFFERS[scenario];
    find('[data-bm-balance]').textContent = String(state.balance);
    find('[data-bm-sample-title]').textContent = offer.title;
    find('[data-bm-sample-summary]').textContent = offer.summary;
    find('[data-bm-sample-delivery]').textContent = offer.delivery;
    find('[data-bm-sample-price]').textContent = `${scenario === 'earn' ? '+' : '−'}${offer.amount} demo credits`;
    status.textContent = state.notice;
    prepare.disabled = !limit.validity.valid;
    review.hidden = !state.pending;
    approveButton.disabled = !state.pending || state.pending.reasons.length > 0 || !limit.validity.valid;
    declineButton.disabled = !state.pending;
    if (state.pending) {
      const terms = state.pending.offer;
      root.querySelectorAll<HTMLElement>('[data-bm-term]').forEach((element) => {
        element.textContent = terms[element.dataset.bmTerm as keyof typeof terms] as string;
      });
      find('[data-bm-review-price]').textContent = `${terms.amount} demo credits · ${terms.kind === 'earn' ? 'added' : 'subtracted'} only after demo approval`;
      find('[data-bm-policy-summary]').textContent = `Balance: ${state.balance} demo credits. Limit: ${state.policy.maxSpend} per purchase or gift. Buying: ${state.policy.allowBuy ? 'allowed' : 'off'}. Gifts: ${state.policy.allowGift ? 'allowed' : 'off'}. Earning does not spend credits.`;
      const blocked = find('[data-bm-blocked]');
      blocked.hidden = state.pending.reasons.length === 0;
      blocked.textContent = state.pending.reasons.join(' ');
    }
    const ledger = find<HTMLOListElement>('[data-bm-ledger]');
    const template = find<HTMLTemplateElement>('[data-bm-record-template]');
    ledger.replaceChildren(...state.ledger.map((record) => {
      const fragment = template.content.cloneNode(true) as DocumentFragment;
      fragment.querySelector('[data-bm-record-kind]')!.textContent = `DEMO ${record.scenario === 'earn' ? 'WORK ACCEPTANCE' : record.scenario === 'buy' ? 'PURCHASE' : 'GIFT'} / NO REAL TRANSACTION`;
      fragment.querySelector('[data-bm-record-title]')!.textContent = record.offer.title;
      fragment.querySelector('[data-bm-record-change]')!.textContent = `${record.balance.change > 0 ? '+' : '−'}${Math.abs(record.balance.change)} demo credits`;
      fragment.querySelector('[data-bm-record-after]')!.textContent = `${record.balance.after} remaining`;
      return fragment;
    }));
    find('[data-bm-empty]').hidden = state.ledger.length > 0;
    download.disabled = state.ledger.length === 0;
  }

  // A fresh page always starts from the same explicit defaults, including when
  // the browser restores controls before the client runs.
  writeControls();
  root.querySelectorAll<HTMLFieldSetElement>('[data-bm-controls]').forEach((fieldset) => { fieldset.disabled = false; });
  resetButton.disabled = false;
  root.querySelectorAll<HTMLInputElement>('input[name="bm-scenario"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      readControls();
      render();
    });
  });
  const changePolicy = () => {
    readControls();
    render();
  };
  limit.addEventListener('input', changePolicy);
  buyAllowed.addEventListener('change', changePolicy);
  giftAllowed.addEventListener('change', changePolicy);
  prepare.addEventListener('click', () => {
    if (!readControls()) {
      render();
      limit.reportValidity();
      return;
    }
    state = propose(state, scenario);
    render();
    find('[data-bm-review-heading]').focus();
  });
  approveButton.addEventListener('click', () => {
    const proposalId = state.pending?.id;
    if (!readControls()) {
      render();
      limit.reportValidity();
      return;
    }
    if (!proposalId || state.pending?.id !== proposalId) {
      render();
      prepare.focus();
      return;
    }
    state = approve(state, proposalId, new Date().toISOString());
    render();
    if (!state.pending) prepare.focus();
  });
  declineButton.addEventListener('click', () => {
    state = decline(state);
    render();
    prepare.focus();
  });
  resetButton.addEventListener('click', () => {
    state = reset(state);
    scenario = 'earn';
    writeControls();
    render();
  });
  download.addEventListener('click', () => {
    const record = state.ledger.at(-1);
    if (!record) return;
    const blob = new Blob([`${JSON.stringify(record, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pointcast-FICTIONAL-demo-${record.id}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Fictional JSON record prepared for download. It is not a real receipt or proof of earnings.';
  });
  render();
}

function mount() {
  document.querySelectorAll<HTMLElement>('[data-bot-money-demo]').forEach(mountOfferDesk);
}

mount();
document.addEventListener('astro:page-load', mount);
