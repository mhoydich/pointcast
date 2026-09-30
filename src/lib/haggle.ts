/**
 * The Haggle Counter — Gus sells house curios, and you (or your agent) haggle.
 *
 * Every item is a stub: a numbered, signed ticket for one object from the
 * specimen sheets. Nothing ships. A struck deal can be paid through the x402
 * rail at exactly the agreed price, and every paid cent splits 50/50 like
 * every other paid town action.
 *
 * The engine is deterministic and pure: the same state and the same offer
 * always get the same answer, so agents can study Gus and people can't be
 * cheated by a coin flip. His hidden floor only moves for reasons he states.
 */

export const HAGGLE_SCHEMA = 'pointcast.haggle/v1';

export type HaggleItem = {
  id: string; name: string; blurb: string; list: number; floor: number; patience: number;
  image: string; alt: string; mood: 'easy' | 'fair' | 'stubborn';
};

/** Prices in US cents. Floors are secret on the page, published in the source (it's a game, not a con). */
export const HAGGLE_ITEMS: HaggleItem[] = [
  { id: 'service-bell', name: 'The Clerk’s service bell', blurb: 'Ring once for an honest answer. Ring twice and Gus pretends not to hear.', list: 25, floor: 8, patience: 5, image: '/images/agent-shop/stub-bell.jpg', alt: 'A brass service bell', mood: 'easy' },
  { id: 'wax-seal', name: 'A sealed receipt', blurb: 'Proof you bought something, sealed in red wax. What you bought is between you and the seal.', list: 40, floor: 14, patience: 5, image: '/images/agent-shop/stub-seal.jpg', alt: 'A paper receipt with a red wax seal', mood: 'fair' },
  { id: 'tin-cans', name: 'The tin-can line', blurb: 'Two cans and a string. The first connection. Still works if you pull it tight.', list: 30, floor: 10, patience: 5, image: '/images/agent-shop/stub-cans.jpg', alt: 'Two tin-can phones joined by a string', mood: 'fair' },
  { id: 'puzzle', name: 'Two pieces that fit', blurb: 'A buyer and a seller who were looking for each other. Sold as a pair only.', list: 35, floor: 12, patience: 5, image: '/images/agent-shop/stub-puzzle.jpg', alt: 'A black and a blue puzzle piece clicked together', mood: 'fair' },
  { id: 'red-pin', name: 'The red push pin', blurb: 'Holds one want to the board. Gus has a drawer of them and knows it.', list: 20, floor: 6, patience: 6, image: '/images/agent-shop/stub-pin.jpg', alt: 'A red push pin', mood: 'easy' },
  { id: 'paper-plane', name: 'A paper airplane', blurb: 'For sending a want across the room. Flies once, beautifully.', list: 15, floor: 5, patience: 6, image: '/images/agent-shop/stub-plane.jpg', alt: 'A folded paper airplane', mood: 'easy' },
  { id: 'lucky-dice', name: 'Lucky dice', blurb: 'The Catan table swears by them. Gus doesn’t gamble on price.', list: 50, floor: 20, patience: 4, image: '/images/agent-shop/stub-dice.jpg', alt: 'A pair of white dice', mood: 'stubborn' },
  { id: 'haggle-cup', name: 'The Haggle Cup', blurb: 'Gus would rather keep it. Talk him out of it and you own the only one.', list: 100, floor: 60, patience: 3, image: '/images/agent-shop/stub-cup.jpg', alt: 'A small gold trophy cup', mood: 'stubborn' },
];

export const itemById = (id: string) => HAGGLE_ITEMS.find((i) => i.id === id) ?? null;

export type HaggleStatus = 'open' | 'deal' | 'walked' | 'paid';
export type HaggleTurn = { by: 'you' | 'gus'; cents: number | null; line: string };
export type HaggleState = {
  item: string; round: number; ask: number; patience: number; status: HaggleStatus;
  bonuses: string[]; finalOffer: boolean; deal: number | null; turns: HaggleTurn[]; insults?: number;
};

export const cents = (n: number) => (n >= 100 ? `$${(n / 100).toFixed(2)}` : `${n}¢`);

/** Reasons Gus will knock a cent off his floor for, once each. He says which one landed. */
const BONUSES: { id: string; test: RegExp; line: string }[] = [
  { id: 'local', test: /\b(el segundo|south bay|local|neighbor|neighbour|down the street)\b/i, line: 'A neighbor, huh. That’s worth a cent.' },
  { id: 'polite', test: /\b(please|thank you|thanks|appreciate)\b/i, line: 'Manners. Rare at this counter. A cent off.' },
  { id: 'court', test: /\b(pickleball|paddle|the courts?)\b/i, line: 'You play at the courts? I’ll take a cent off for the dink game.' },
  { id: 'honest-bot', test: /\b(i am an? (ai|agent|bot)|i'm an? (ai|agent|bot)|on behalf of|my (human|person|owner))\b/i, line: 'An agent who says so. Honesty gets a cent.' },
];

export function newHaggle(item: HaggleItem): HaggleState {
  return { item: item.id, round: 0, ask: item.list, patience: item.patience, status: 'open', bonuses: [], finalOffer: false, deal: null, turns: [{ by: 'gus', cents: item.list, line: `${item.name}. ${cents(item.list)}. Make me an offer.` }] };
}

/** A tiny deterministic "voice" so Gus doesn't repeat himself: picks a line by round and item. */
function pick(lines: string[], state: HaggleState): string {
  let h = state.round * 7;
  for (const c of state.item) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return lines[h % lines.length];
}

export type HaggleMove = { offer?: number; accept?: boolean; message?: string };
export type HaggleResult = { state: HaggleState; reply: string; ok: boolean; error?: string };

export function haggleTurn(item: HaggleItem, prev: HaggleState, move: HaggleMove): HaggleResult {
  const state: HaggleState = { ...prev, bonuses: [...prev.bonuses], turns: [...prev.turns] };
  if (state.status !== 'open') return { state, reply: 'This one’s closed. Start a new haggle.', ok: false, error: 'closed' };

  const message = (move.message ?? '').slice(0, 200);
  if (move.accept) {
    state.turns.push({ by: 'you', cents: state.ask, line: message || 'Deal.' });
    state.status = 'deal'; state.deal = state.ask;
    const reply = `Sold, ${cents(state.ask)}. Pleasure doing business.`;
    state.turns.push({ by: 'gus', cents: state.ask, line: reply });
    return { state, reply, ok: true };
  }

  const offer = Math.round(Number(move.offer));
  if (!Number.isFinite(offer) || offer < 1 || offer > item.list * 2) return { state, reply: `Offer a whole number of cents, 1 to ${item.list * 2}.`, ok: false, error: 'bad-offer' };
  state.round += 1;
  state.turns.push({ by: 'you', cents: offer, line: message || `${cents(offer)}?` });

  const landed: string[] = [];
  for (const b of BONUSES) {
    if (!state.bonuses.includes(b.id) && b.test.test(message)) { state.bonuses.push(b.id); landed.push(b.line); }
  }
  const floor = Math.max(Math.ceil(item.floor * 0.8), item.floor - state.bonuses.length);
  const say = (line: string) => { const full = [...landed, line].join(' '); state.turns.push({ by: 'gus', cents: state.status === 'open' ? state.ask : state.deal, line: full }); return full; };

  if (offer >= state.ask) {
    state.status = 'deal'; state.deal = state.ask;
    return { state, reply: say(offer > state.ask ? `Keep your change. ${cents(state.ask)}, sold.` : `${cents(state.ask)}. Sold.`), ok: true };
  }
  if (state.finalOffer) {
    state.status = 'walked';
    return { state, reply: say(`I said ${cents(state.ask)} was my last price. Come back tomorrow.`), ok: true };
  }
  if (offer >= floor && (offer >= Math.round(state.ask * 0.85) || state.round >= 4)) {
    state.status = 'deal'; state.deal = offer;
    return { state, reply: say(pick([`Fine. ${cents(offer)}. You drive a hard bargain.`, `${cents(offer)}. Don’t tell the others.`, `Ugh. ${cents(offer)}, sold.`], state)), ok: true };
  }
  if (offer < Math.floor(item.floor * 0.4)) {
    state.patience -= 2;
    state.insults = (state.insults ?? 0) + 1;
  } else {
    state.patience -= 1;
    const give = Math.min(0.6, 0.25 + 0.1 * state.round) * ({ easy: 1, fair: 0.8, stubborn: 0.5 } as const)[item.mood];
    state.ask = Math.max(floor + 1, Math.min(state.ask - 1, Math.round(state.ask - (state.ask - offer) * give)));
    if (state.ask <= offer) state.ask = offer + 1;
  }
  if (state.patience <= 0) {
    state.finalOffer = true;
    // His last price never rewards rudeness: it can't fall far below where you'd pushed him.
    if (!state.insults) state.ask = Math.min(state.ask, Math.max(floor + Math.ceil((item.list - floor) / 5), Math.round(state.ask * 0.85)));
    return { state, reply: say(`My patience is gone. ${cents(state.ask)}, last price. Take it or leave it.`), ok: true };
  }
  if (offer < Math.floor(item.floor * 0.4)) {
    return { state, reply: say(pick([`${cents(offer)}? For this? I’m holding at ${cents(state.ask)}.`, `You’re joking. ${cents(state.ask)}.`, `I’ve had better offers from the gulls. ${cents(state.ask)}.`], state)), ok: true };
  }
  return { state, reply: say(pick([`I can do ${cents(state.ask)}.`, `Meet me at ${cents(state.ask)}.`, `${cents(state.ask)}, and that’s generous.`, `How about ${cents(state.ask)}?`], state)), ok: true };
}

/** 0–100: how much of the list price you talked off, the leaderboard's score. */
export const haggleScore = (item: HaggleItem, deal: number) => Math.round(((item.list - deal) / item.list) * 100);
