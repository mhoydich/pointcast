import assert from 'node:assert/strict';
import test from 'node:test';
import { clerkAnswer, houseOffers, parseAsk, parseBudget, parseSeconds, scoreOffer } from '../src/lib/shop-clerk.ts';
import { HAGGLE_ITEMS, haggleScore, haggleTurn, itemById, newHaggle } from '../src/lib/haggle.ts';

const front = {
  guides: [
    { id: 'ai-video', title: 'The new video machines', href: 'https://pointcast.xyz/reviews/ai-video', asOf: '2026-09-29' },
    { id: 'home-robots', title: 'Robots for the house', href: 'https://pointcast.xyz/reviews/home-robots', asOf: '2026-09-29' },
    { id: 'bags', title: 'Bags for a South Bay day', href: 'https://pointcast.xyz/reviews/bags', asOf: '2026-09-29' },
  ],
  picks: [
    { id: 'ai-video/kling-4', guide: 'ai-video', name: 'Kling 4.0', brand: 'Kuaishou · Kling AI', price: 10, priceText: 'From ~$10/mo*', url: 'https://kling.ai/', verdict: 'The one to watch.', reviewUrl: 'https://pointcast.xyz/reviews/ai-video#kling-4', facts: 'The one that just dropped · 30 s (Flash: 20 s) · Yes, stereo' },
    { id: 'ai-video/runway', guide: 'ai-video', name: 'Runway Gen-4.5', brand: 'Runway', price: 12, priceText: 'From $12/mo*', url: 'https://runway.com/', verdict: 'Still the best workbench.', reviewUrl: 'https://pointcast.xyz/reviews/ai-video#runway', facts: 'Up to a minute, multi-shot · 1080p · Yes' },
    { id: 'ai-video/midjourney-video', guide: 'ai-video', name: 'Midjourney Video (V1)', brand: 'Midjourney', price: 10, priceText: 'From $10/mo*', url: 'https://www.midjourney.com/', verdict: 'For your own Midjourney art only.', reviewUrl: 'https://pointcast.xyz/reviews/ai-video#midjourney-video', facts: 'Up to 21 s · 480p · No' },
    { id: 'home-robots/loona', guide: 'home-robots', name: 'Loona Petbot Premium', brand: 'KEYi Tech', price: 499, priceText: '$499*', url: 'https://keyirobot.com/', verdict: 'The robot pet for kids.', reviewUrl: 'https://pointcast.xyz/reviews/home-robots#loona', facts: 'Talks through ChatGPT' },
    { id: 'home-robots/matic', guide: 'home-robots', name: 'Matic', brand: 'Matic Robots', price: 1495, priceText: '$1,495*', url: 'https://maticrobots.com/', verdict: 'The one robot here with a daily job.', reviewUrl: 'https://pointcast.xyz/reviews/home-robots#matic', facts: 'Vacuum + mop' },
    { id: 'bags/boat-and-tote', guide: 'bags', name: 'Boat and Tote, Large', brand: 'L.L.Bean', price: 49.95, priceText: '$49.95*', url: 'https://www.llbean.com/', verdict: 'Lasts twenty years.', reviewUrl: 'https://pointcast.xyz/reviews/bags#boat-and-tote', facts: 'Beach · canvas' },
  ],
};
const known = front.guides.map((g) => g.id);

test('the Clerk reads budgets and clip lengths out of plain words', () => {
  assert.equal(parseBudget('robot pet under $500'), 500);
  assert.equal(parseBudget('something below 20 bucks'), 20);
  assert.equal(parseBudget('$30 or less please'), 30);
  assert.equal(parseBudget('max $1.5k'), 1500);
  assert.equal(parseBudget('a tote for the beach'), null);
  assert.equal(parseSeconds('30 second clips'), 30);
  assert.equal(parseSeconds('a 15s loop'), 15);
});

test('the Clerk keeps to the budget and ranks the guide it was asked about', () => {
  const a = clerkAnswer(front, parseAsk({ q: 'robot pet under $500' }, known));
  assert.equal(a.ask.guide, 'home-robots');
  assert.deepEqual(a.picks.map((p) => p.id), ['home-robots/loona']);
  assert.match(a.summary, /Loona/);
  assert.ok(a.picks[0].why.some((w) => w.includes('$499 fits a $500 budget')));
});

test('the Clerk prefers video models that reach the asked-for length', () => {
  const a = clerkAnswer(front, parseAsk({ q: '30 second AI video with sound under $20' }, known));
  assert.equal(a.picks[0].id, 'ai-video/kling-4');
  assert.ok(a.picks.findIndex((p) => p.id === 'ai-video/midjourney-video') > 0);
});

test('an off-shelf question is an honest miss', () => {
  const a = clerkAnswer(front, parseAsk({ q: 'best espresso machine' }, known));
  assert.equal(a.picks.length, 0);
  assert.match(a.summary, /Nothing on PointCast/);
});

test('short noise words like "ai" do not match everything', () => {
  const ask = parseAsk({ q: 'ai' }, known);
  assert.deepEqual(ask.words, []);
});

test('offers are scored on budget, must-haves, maker domain and seen price', () => {
  const want = { title: 'Video for ads', need: 'weekly clips', budget: 30, guide: null, mustHave: ['sound'] };
  const good = scoreOffer(front, want, { agent: 'a', product: 'Runway Gen-4.5', price: 12, url: 'https://runway.com/pricing', terms: 'with sound', relationship: 'maker' });
  assert.equal(good.verdict, 'strong');
  assert.equal(good.flags.length, 0);
  assert.equal(good.matchedPick, 'ai-video/runway');
  const bad = scoreOffer(front, want, { agent: 'b', product: 'Kling 4.0', price: 45, url: 'https://kling4.example/', terms: '4k', relationship: '' });
  assert.ok(bad.flags.some((f) => /over the \$30 budget/.test(f)));
  assert.ok(bad.flags.some((f) => /not the maker/.test(f)));
  assert.ok(bad.flags.some((f) => /didn’t say who it works for/.test(f)));
  assert.ok(bad.score < good.score);
  const insecure = scoreOffer(front, want, { agent: 'c', product: 'x', price: 1, url: 'http://example.com', terms: '', relationship: 'maker' });
  assert.equal(insecure.verdict, 'flagged');
});

test('house offers are labeled house and come from the guides', () => {
  const offers = houseOffers(front, { title: 'tote', need: 'a tote for the beach', budget: null, guide: null, mustHave: [] });
  assert.ok(offers.length >= 1);
  for (const o of offers) { assert.equal(o.offer.relationship, 'house'); assert.match(o.offer.agent, /house/); }
});

test('Gus never sells under his floor, whatever you say', () => {
  for (const item of HAGGLE_ITEMS) {
    let state = newHaggle(item);
    const moves = [1, 2, 3, item.floor - 3, item.floor - 2, item.floor - 1, item.floor - 1, item.floor - 1];
    for (const offer of moves) {
      const r = haggleTurn(item, state, { offer: Math.max(1, offer), message: 'please thanks El Segundo pickleball, I am an agent' });
      state = r.state;
      if (state.status !== 'open') break;
    }
    if (state.deal !== null) assert.ok(state.deal >= Math.ceil(item.floor * 0.8), `${item.id} sold at ${state.deal}`);
  }
});

test('Gus is deterministic', () => {
  const item = itemById('wax-seal');
  const play = () => { let s = newHaggle(item); const out = []; for (const o of [10, 20, 25]) { const r = haggleTurn(item, s, { offer: o }); s = r.state; out.push(r.reply); if (s.status !== 'open') break; } return out; };
  assert.deepEqual(play(), play());
});

test('insulting Gus does not buy a better last price than haggling politely', () => {
  const item = itemById('haggle-cup');
  let rude = newHaggle(item);
  for (const o of [5, 30, 30, 30]) { rude = haggleTurn(item, rude, { offer: o }).state; if (rude.finalOffer || rude.status !== 'open') break; }
  let polite = newHaggle(item);
  for (const o of [70, 72, 74, 75]) { polite = haggleTurn(item, polite, { offer: o }).state; if (polite.finalOffer || polite.status !== 'open') break; }
  const rudeBest = rude.status === 'open' ? rude.ask : rude.deal ?? Infinity;
  const politeBest = polite.status === 'open' ? polite.ask : polite.deal ?? Infinity;
  assert.ok(rudeBest >= politeBest, `rude ${rudeBest} vs polite ${politeBest}`);
});

test('accepting takes the current price and scores the discount', () => {
  const item = itemById('red-pin');
  let s = haggleTurn(item, newHaggle(item), { offer: 5 }).state;
  const r = haggleTurn(item, s, { accept: true });
  assert.equal(r.state.status, 'deal');
  assert.equal(r.state.deal, s.ask);
  assert.equal(haggleScore(item, 10), 50);
  assert.equal(haggleTurn(item, r.state, { offer: 3 }).ok, false);
});
