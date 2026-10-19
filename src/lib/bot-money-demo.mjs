/**
 * Local design exercise only. No money, accounts, work, or delivery happens here.
 * These transitions have no browser, network, payment, or persistence dependency.
 */
export const DEMO_OFFERS = Object.freeze({
  earn: Object.freeze({
    kind: 'earn',
    title: 'Clean up three product cards',
    summary: 'A small, useful job with a clear finish line. Imagine the buyer has reviewed and accepted your work.',
    amount: 18,
    seller: 'You (fictional maker)',
    buyer: 'Common Table Studio (fictional buyer)',
    recipient: 'Common Table Studio (fictional buyer)',
    deliverable: 'Three clearer product titles and descriptions, using only facts supplied by the buyer.',
    scope: 'Three cards, one round of text revisions. No images, publishing, pricing changes, or invented product claims.',
    license: 'The fictional buyer may use the approved text commercially in one shop. Supplied material must be theirs to use.',
    delivery: 'Nothing is created or delivered here. This models acceptance of a finished job.',
    approval: 'Record a fictional acceptance of the finished work and add 18 demo credits.',
  }),
  buy: Object.freeze({
    kind: 'buy',
    title: 'A poster for your next gathering',
    summary: 'Imagine buying an editable event poster from a small independent maker.',
    amount: 12,
    seller: 'Paper Porch (fictional maker)',
    buyer: 'You (fictional buyer)',
    recipient: 'You (fictional buyer)',
    deliverable: 'One editable event-poster template, with space for a title, date, place, and invitation.',
    scope: 'One template. No custom design, printing, or revisions.',
    license: 'One personal or community event. Commercial use, resale, and redistribution of the source file are excluded.',
    delivery: 'No poster file is delivered by this sandbox. This offer is an example, not a listing.',
    approval: 'Record a fictional purchase for yourself and subtract 12 demo credits.',
  }),
  gift: Object.freeze({
    kind: 'gift',
    title: 'A little something for a friend',
    summary: 'Imagine giving a friend a printable activity pack, with permission to use it clearly included.',
    amount: 8,
    seller: 'Small Hour Studio (fictional maker)',
    buyer: 'You (fictional giver)',
    recipient: 'Alex (fictional friend)',
    deliverable: 'One personal-use license for a printable activity pack, assigned to Alex.',
    scope: 'One recipient, one pack. No customization or revisions.',
    license: 'Alex may print the pack for personal use. Commercial use, resale, and public redistribution are excluded.',
    delivery: 'No pack or message is sent. Alex is a fictional recipient.',
    approval: 'Record a fictional gift to Alex and subtract 8 demo credits.',
  }),
});

/** @typedef {typeof DEMO_OFFERS.earn | typeof DEMO_OFFERS.buy | typeof DEMO_OFFERS.gift} DemoOffer */
/** @typedef {{ maxSpend: number, allowBuy: boolean, allowGift: boolean }} DemoPolicy */
/** @typedef {{ id: string, offer: DemoOffer, policyVersion: number, balanceBefore: number, reasons: string[] }} DemoProposal */
/**
 * @typedef {object} DemoRecord
 * @property {string} id
 * @property {string} scenario
 * @property {DemoOffer & { version: string }} offer
 * @property {{ before: number, change: number, after: number, unit: string }} balance
 * @property {string} format
 * @property {string} recordType
 * @property {string} mode
 * @property {boolean} fictional
 * @property {string} paymentStatus
 * @property {boolean} realFundsMoved
 * @property {boolean} realWorkPerformed
 * @property {boolean} realGoodsDelivered
 * @property {string} disclaimer
 * @property {string | null} createdAt
 * @property {{ amount: number, unit: string, cashValue: number, status: string }} price
 * @property {{ humanApproved: boolean, scope: string, realTransactionAuthorized: boolean, policy: DemoPolicy, policyVersion: number }} approvals
 */
/**
 * @typedef {object} DemoState
 * @property {number} balance
 * @property {DemoPolicy} policy
 * @property {number} policyVersion
 * @property {number} epoch
 * @property {number} sequence
 * @property {DemoProposal | null} pending
 * @property {DemoRecord[]} ledger
 * @property {string} notice
 */

/** @returns {DemoState} */
export function createState() {
  return {
    balance: 30,
    policy: { maxSpend: 20, allowBuy: true, allowGift: false },
    policyVersion: 0,
    epoch: 0,
    sequence: 0,
    pending: null,
    ledger: [],
    notice: 'Choose a sample, then review its terms. Every action here is fictional.',
  };
}

/** @param {DemoState} state @param {DemoOffer} offer */
function blockedReasons(state, offer) {
  if (offer.kind === 'earn') return [];
  const reasons = [];
  if (offer.kind === 'buy' && !state.policy.allowBuy) reasons.push('Buying for yourself is switched off.');
  if (offer.kind === 'gift' && !state.policy.allowGift) reasons.push('Giving a gift is switched off.');
  if (offer.amount > state.policy.maxSpend) reasons.push(`This needs ${offer.amount} demo credits; your limit is ${state.policy.maxSpend} per purchase or gift.`);
  if (offer.amount > state.balance) reasons.push(`This needs ${offer.amount} demo credits; your balance is ${state.balance}.`);
  return reasons;
}

/** @param {DemoState} state @param {string} kind @returns {DemoState} */
export function propose(state, kind) {
  if (!Object.hasOwn(DEMO_OFFERS, kind)) return { ...state, pending: null, notice: 'Choose one of the three available samples.' };
  const offer = DEMO_OFFERS[kind];
  const sequence = state.sequence + 1;
  const reasons = blockedReasons(state, offer);
  return {
    ...state,
    sequence,
    pending: {
      id: `demo-${state.epoch}-${sequence}`,
      offer,
      policyVersion: state.policyVersion,
      balanceBefore: state.balance,
      reasons,
    },
    notice: reasons.length ? `Demo approval is blocked. ${reasons.join(' ')}` : 'Proposal ready. Read the scope and permission before recording your demo approval.',
  };
}

/**
 * Changes require a fresh proposal, including changes that would relax a limit.
 * @param {DemoState} state @param {DemoPolicy} policy @returns {DemoState}
 */
export function applyPolicy(state, policy) {
  if (!policy || !Number.isInteger(policy.maxSpend) || policy.maxSpend < 5 || policy.maxSpend > 30 || typeof policy.allowBuy !== 'boolean' || typeof policy.allowGift !== 'boolean') {
    return { ...state, pending: null, notice: 'Enter a whole-number limit from 5 to 30 demo credits. Prepare a fresh proposal afterward.' };
  }
  if (policy.maxSpend === state.policy.maxSpend && policy.allowBuy === state.policy.allowBuy && policy.allowGift === state.policy.allowGift) {
    return state.pending ? state : { ...state, notice: 'Your permissions are set. Prepare a fresh proposal to review its terms.' };
  }
  return {
    ...state,
    policy: { maxSpend: policy.maxSpend, allowBuy: policy.allowBuy, allowGift: policy.allowGift },
    policyVersion: state.policyVersion + 1,
    pending: null,
    notice: 'Your permissions changed. Prepare a fresh proposal to use these permissions.',
  };
}

/** @param {DemoState} state @param {string} proposalId @param {string} [createdAt] @returns {DemoState} */
export function approve(state, proposalId, createdAt) {
  const proposal = state.pending;
  if (!proposal || proposal.id !== proposalId) return { ...state, notice: 'There is no matching proposal to approve. Prepare a fresh one.' };
  if (proposal.policyVersion !== state.policyVersion || proposal.balanceBefore !== state.balance) return { ...state, pending: null, notice: 'The balance or permissions changed. Prepare a fresh proposal.' };
  const reasons = blockedReasons(state, proposal.offer);
  if (reasons.length) return { ...state, pending: { ...proposal, reasons }, notice: `Demo approval is blocked. ${reasons.join(' ')}` };
  const offer = proposal.offer;
  const change = offer.kind === 'earn' ? offer.amount : -offer.amount;
  const balance = state.balance + change;
  const record = {
    format: 'pointcast-offer-desk-demo-v1',
    recordType: 'fictional_demo_record',
    mode: 'sandbox',
    fictional: true,
    paymentStatus: 'not_processed',
    realFundsMoved: false,
    realWorkPerformed: false,
    realGoodsDelivered: false,
    disclaimer: 'DESIGN SANDBOX ONLY. Demo credits have no cash value. No payment, work, delivery, message, or real transaction occurred. This is not proof of purchase or earnings.',
    id: proposal.id,
    createdAt: createdAt || null,
    scenario: offer.kind,
    offer: { ...offer, version: 'fictional-example-v1' },
    price: { amount: offer.amount, unit: 'DEMO_CREDIT', cashValue: 0, status: 'fictional_example' },
    approvals: {
      humanApproved: true,
      scope: offer.approval,
      realTransactionAuthorized: false,
      policy: { ...state.policy },
      policyVersion: state.policyVersion,
    },
    balance: { before: state.balance, change, after: balance, unit: 'DEMO_CREDIT' },
  };
  return {
    ...state,
    balance,
    pending: null,
    ledger: [...state.ledger, record],
    notice: `Fictional ${offer.kind === 'earn' ? 'work acceptance' : offer.kind === 'buy' ? 'purchase' : 'gift'} recorded. ${Math.abs(change)} demo credits ${change > 0 ? 'added' : 'subtracted'}. No real transaction occurred.`,
  };
}

/** @param {DemoState} state @returns {DemoState} */
export function decline(state) {
  return { ...state, pending: null, notice: 'Proposal declined. Your demo balance has not changed.' };
}

/** @param {DemoState} state @returns {DemoState} */
export function reset(state) {
  return { ...createState(), epoch: state.epoch + 1, notice: 'Sandbox reset: 30 demo credits, original permissions, and an empty record list.' };
}
