/**
 * The Clerk — PointCast's buyer's agent.
 *
 * A deterministic reference desk over the shop front (/shop/front.json): it reads
 * a plain question ("30 second ai video with sound under $20"), pulls a budget,
 * a guide and search words out of it, and answers with dated picks and the
 * reason each one matched. No LLM, no commission, no paid ranking.
 *
 * The same module scores Want Ads offers: an offer from any agent is checked
 * against the budget, the must-haves, the maker's own domain and the price
 * PointCast last saw for the same product.
 *
 * Pure functions only: the Pages Functions fetch front.json and pass it in, so
 * node tests run against a fixture.
 */

export const CLERK_SCHEMA = 'pointcast.clerk/v1';
export const CLERK_VERSION = '2026-09-30';

export type FrontGuide = { id: string; title: string; href: string; asOf: string; kind?: string; countLabel?: string };
export type FrontPick = {
  id: string; guide: string; name: string; brand: string; price: number | null; priceText: string;
  url: string; verdict: string; reviewUrl: string; image?: string | null; facts?: string | null;
};
export type ShopFront = { guides: FrontGuide[]; picks: FrontPick[] };

export type ClerkAsk = { q: string; maxPrice: number | null; guide: string | null; limit: number; words: string[]; hinted: string[]; seconds: number | null };

export type ClerkMatch = {
  id: string; name: string; brand: string; guide: string; guideTitle: string; price: number | null; priceText: string;
  asOf: string | null; url: string; reviewUrl: string; verdict: string; why: string[]; score: number;
};

export type ClerkAnswer = {
  schema: typeof CLERK_SCHEMA;
  version: string;
  ask: { q: string; maxPrice: number | null; guide: string | null; words: string[] };
  summary: string;
  picks: ClerkMatch[];
  guides: { id: string; title: string; href: string; asOf: string }[];
  honesty: string[];
};

/** Words and phrases that point at one guide. Checked against the lowercased question. */
export const GUIDE_HINTS: Record<string, string[]> = {
  'ai-video': ['video', 'kling', 'sora', 'veo', 'runway', 'luma', 'seedance', 'wan', 'hailuo', 'minimax', 'pika', 'higgsfield', 'clip', 'clips', 'film', 'movie', 'animation', 'animate'],
  'ai-plans': ['chatgpt', 'claude pro', 'claude max', 'gemini', 'copilot', 'cursor', 'perplexity', 'ai plan', 'ai plans', 'chat plan'],
  'ai-work-life': ['ai for work', 'assistant', 'productivity'],
  'machine-room': ['computer', 'desk setup', 'gpu', 'monitor', 'rig', 'mac', 'workstation', 'local model'],
  'home-robots': ['robot', 'robots', 'robot pet', 'vacuum', 'aibo', 'loona', 'moflin', 'companion'],
  bags: ['bag', 'bags', 'tote', 'backpack', 'cooler', 'duffel', 'sling', 'carry'],
  'modular-carry': ['modular', 'carry system', 'molle', 'pouch'],
  'lego-sets': ['lego', 'brick', 'bricks'],
  'hummingbird-feeders': ['hummingbird', 'feeder', 'bird', 'birds'],
  'playstation-2026': ['playstation', 'ps5', 'game', 'games', 'video game'],
  paddles: ['paddle', 'paddles', 'pickleball'],
};

const STOP = new Set('a an and are as at be best but by can cheap cheapest do does for from get good have i im in is it its me my need of on or please recommend show some something that the thing to under want what whats which with would you your below less than max budget around about per month mo usd dollars dollar bucks one any'.split(' '));

/** Short tokens worth keeping; everything else under three letters is noise ("ai" matches half the shop). */
const SHORT_OK = new Set(['4k', '2k', '8k', 'tv', 'pc', 'vr', 'ps5']);

const money = (n: number) => (n % 1 === 0 ? `$${n.toLocaleString('en-US')}` : `$${n.toFixed(2)}`);

/** Pull a budget out of plain words: "under $20", "below 100", "<$50", "$30 or less", "budget 25", "max $40". */
export function parseBudget(q: string): number | null {
  const s = q.toLowerCase().replace(/,/g, '');
  const patterns = [
    /(?:under|below|less than|max(?:imum)?|budget(?: of)?|up to|at most|no more than|<=?|≤)\s*\$?\s*(\d+(?:\.\d+)?)\s*(k)?/,
    /\$\s*(\d+(?:\.\d+)?)\s*(k)?\s*(?:or less|or under|max|tops|budget)/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) {
      const n = Number(m[1]) * (m[2] ? 1000 : 1);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

/** Every guide the question hints at, strongest first. */
export function hintedGuides(q: string, known: string[]): { id: string; hits: number }[] {
  const s = ` ${q.toLowerCase()} `;
  const out: { id: string; hits: number }[] = [];
  for (const [id, hints] of Object.entries(GUIDE_HINTS)) {
    if (!known.includes(id)) continue;
    const hits = hints.filter((h) => new RegExp(`[^a-z0-9]${h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z0-9]`).test(s)).length;
    if (hits) out.push({ id, hits });
  }
  return out.sort((a, b) => b.hits - a.hits);
}

/** One guide only when it clearly wins; a tie searches everywhere (hinted guides still rank higher). */
export function detectGuide(q: string, known: string[]): string | null {
  const h = hintedGuides(q, known);
  return h.length && (h.length === 1 || h[0].hits > h[1].hits) ? h[0].id : null;
}

/** "30 second", "30s", "30-sec" → 30. Used to rank video picks by clip length. */
export function parseSeconds(q: string): number | null {
  const m = q.toLowerCase().match(/(\d{1,3})\s*-?\s*(?:s|sec|secs|second|seconds)\b/);
  return m ? Number(m[1]) : null;
}

export function parseAsk(input: { q?: unknown; maxPrice?: unknown; guide?: unknown; limit?: unknown }, known: string[]): ClerkAsk {
  const q = typeof input.q === 'string' ? input.q.trim().slice(0, 240) : '';
  const explicitMax = input.maxPrice === undefined || input.maxPrice === null || input.maxPrice === '' ? null : Number(input.maxPrice);
  const maxPrice = explicitMax !== null && Number.isFinite(explicitMax) && explicitMax > 0 ? explicitMax : parseBudget(q);
  const guideIn = typeof input.guide === 'string' ? input.guide.trim().toLowerCase() : '';
  const guide = guideIn && known.includes(guideIn) ? guideIn : detectGuide(q, known);
  const limitN = Number(input.limit);
  const limit = Number.isInteger(limitN) && limitN >= 1 && limitN <= 10 ? limitN : 5;
  const words = [...new Set(q.toLowerCase().replace(/\$\s*\d+(?:\.\d+)?k?/g, ' ').split(/[^a-z0-9.+-]+/).map((w) => w.replace(/^[.+-]+|[.+-]+$/g, '')).filter((w) => (w.length > 2 || SHORT_OK.has(w)) && !STOP.has(w) && !/^\d+(\.\d+)?$/.test(w)))].slice(0, 12);
  const hinted = hintedGuides(q, known).map((h) => h.id);
  const seconds = parseSeconds(q);
  return { q, maxPrice, guide, limit, words: seconds ? words.filter((w) => !/^(s|sec|secs|second|seconds)$/.test(w)) : words, hinted, seconds };
}

const hay = (p: FrontPick, guideTitle: string) => `${p.name} ${p.brand} ${p.verdict} ${guideTitle} ${p.priceText}`.toLowerCase();
const stem = (w: string) => w.replace(/(ies|es|s)$/, '');
const has = (text: string, w: string) => text.includes(w) || (w.length > 4 && text.includes(stem(w)));

export function clerkAnswer(front: ShopFront, ask: ClerkAsk): ClerkAnswer {
  const guideById = new Map(front.guides.map((g) => [g.id, g]));
  const scored: ClerkMatch[] = [];
  for (const p of front.picks) {
    const g = guideById.get(p.guide);
    const title = g?.title ?? p.guide;
    if (ask.guide && p.guide !== ask.guide) continue;
    if (ask.maxPrice !== null && (p.price === null || p.price > ask.maxPrice)) continue;
    const h = hay(p, title);
    const nameHay = `${p.name} ${p.brand}`.toLowerCase();
    const why: string[] = [];
    let score = 0;
    const factHay = (p.facts ?? '').toLowerCase();
    const nameHits = ask.words.filter((w) => has(nameHay, w));
    const otherHits = ask.words.filter((w) => !nameHits.includes(w) && has(h, w));
    const factHits = ask.words.filter((w) => !nameHits.includes(w) && !otherHits.includes(w) && has(factHay, w));
    score += nameHits.length * 5 + otherHits.length * 2 + factHits.length * 2;
    // Off-shelf questions stay honest: without a guide, most of the words have to land.
    const covered = nameHits.length + otherHits.length + factHits.length;
    if (!ask.guide && ask.words.length && covered / ask.words.length <= 0.5 && nameHits.length < 2) continue;
    if (nameHits.length) why.push(`name matches “${nameHits.join('”, “')}”`);
    if (otherHits.length) why.push(`review mentions “${otherHits.join('”, “')}”`);
    if (factHits.length) why.push(`guide notes “${factHits.join('”, “')}”`);
    if (ask.guide) { score += 3; why.push(`from ${title}`); }
    else if (ask.hinted.includes(p.guide)) { score += 3; why.push(`from ${title}`); }
    if (ask.seconds !== null && p.facts) {
      const lengths = [...p.facts.matchAll(/(\d{1,3})\s*s\b/g)].map((m) => Number(m[1]));
      if (lengths.length) {
        const longest = Math.max(...lengths);
        if (longest >= ask.seconds) { score += 4; why.push(`clips up to ${longest} s`); }
        else score -= 2;
      }
    }
    if (ask.maxPrice !== null && p.price !== null) {
      score += 1 + Math.max(0, (ask.maxPrice - p.price) / ask.maxPrice); // cheaper inside budget ranks a little higher
      why.push(`${money(p.price)} fits a ${money(ask.maxPrice)} budget`);
    }
    if (!ask.words.length && (ask.guide || ask.maxPrice !== null)) score += 1;
    if (score <= 0) continue;
    scored.push({
      id: p.id, name: p.name, brand: p.brand, guide: p.guide, guideTitle: title, price: p.price, priceText: p.priceText,
      asOf: g?.asOf ?? null, url: p.url, reviewUrl: p.reviewUrl, verdict: p.verdict, why, score: Math.round(score * 100) / 100,
    });
  }
  scored.sort((a, b) => b.score - a.score || (a.price ?? Infinity) - (b.price ?? Infinity) || a.name.localeCompare(b.name));
  const picks = scored.slice(0, ask.limit);
  const guidesUsed = [...new Set(picks.map((p) => p.guide))].map((id) => guideById.get(id)).filter(Boolean) as FrontGuide[];
  const honesty = [
    'Prices are the ones PointCast saw on the date shown, from the maker. The maker’s page is the truth.',
    'No commission, no paid placement. Links go straight to the maker.',
  ];
  if (picks.some((p) => p.priceText.includes('*'))) honesty.push('A * means the price has a note on the guide card: read it before you buy.');
  let summary: string;
  if (!ask.q && !ask.guide && ask.maxPrice === null) summary = 'Ask me something: a thing you want, a budget, or both. Example: “robot pet under $500”.';
  else if (!picks.length && ask.guide && guideById.has(ask.guide)) {
    const g = guideById.get(ask.guide)!;
    guidesUsed.push(g);
    summary = `No pick in ${g.title} matches that${ask.maxPrice !== null ? ` under ${money(ask.maxPrice)}` : ''}. The full guide is at ${g.href}.`;
  }
  else if (!picks.length) summary = `Nothing on PointCast’s shelves matches${ask.maxPrice !== null ? ` under ${money(ask.maxPrice)}` : ''}${ask.guide ? ` in ${guideById.get(ask.guide)?.title ?? ask.guide}` : ''}. We only answer from guides we’ve written, so a miss is honest.`;
  else {
    const top = picks[0];
    summary = `${picks.length} pick${picks.length === 1 ? '' : 's'}. Start with ${top.name} (${top.priceText.replace(/\*$/, '')}, ${top.guideTitle}, checked ${top.asOf ?? 'recently'}): ${top.verdict}`;
  }
  return {
    schema: CLERK_SCHEMA, version: CLERK_VERSION,
    ask: { q: ask.q, maxPrice: ask.maxPrice, guide: ask.guide, words: ask.words },
    summary, picks, guides: guidesUsed.map((g) => ({ id: g.id, title: g.title, href: g.href, asOf: g.asOf })), honesty,
  };
}

/* ---------------------------------------------------------------- Want Ads */

export type WantInput = { title: string; need: string; budget: number | null; guide: string | null; mustHave: string[] };
export type OfferInput = { agent: string; product: string; price: number | null; url: string; terms: string; relationship: string };
export type OfferScore = { score: number; verdict: 'strong' | 'fair' | 'weak' | 'flagged'; notes: string[]; flags: string[]; matchedPick: string | null };

const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const baseDomain = (h: string) => h.split('.').slice(-2).join('.');

/** Find the guide pick an offer is most likely talking about (name tokens overlap). */
export function matchPick(front: ShopFront, product: string, url: string): FrontPick | null {
  const words = product.toLowerCase().split(/[^a-z0-9.+]+/).filter((w) => w.length > 1 && !STOP.has(w));
  const host = baseDomain(hostOf(url));
  let best: { p: FrontPick; s: number } | null = null;
  for (const p of front.picks) {
    const name = `${p.name} ${p.brand}`.toLowerCase();
    let s = words.filter((w) => name.includes(w)).length * 2;
    if (host && baseDomain(hostOf(p.url)) === host) s += 3;
    if (s >= 3 && (!best || s > best.s)) best = { p, s };
  }
  return best?.p ?? null;
}

export function scoreOffer(front: ShopFront, want: WantInput, offer: OfferInput): OfferScore {
  const notes: string[] = [];
  const flags: string[] = [];
  let score = 50;
  const host = hostOf(offer.url);
  if (!/^https:\/\//.test(offer.url) || !host) { flags.push('Link is not a plain https address.'); score -= 30; }
  if (want.budget !== null && offer.price !== null) {
    if (offer.price <= want.budget) { score += 15; notes.push(`${money(offer.price)} is inside the ${money(want.budget)} budget.`); }
    else { score -= 25; flags.push(`${money(offer.price)} is over the ${money(want.budget)} budget.`); }
  } else if (offer.price === null) { score -= 10; notes.push('No price given. Ask for one before you decide.'); }
  const offerHay = `${offer.product} ${offer.terms}`.toLowerCase();
  if (want.mustHave.length) {
    const met = want.mustHave.filter((m) => m.toLowerCase().split(/\s+/).every((w) => offerHay.includes(w)));
    const missing = want.mustHave.filter((m) => !met.includes(m));
    score += met.length * 8 - missing.length * 10;
    if (met.length) notes.push(`Says it covers: ${met.join(', ')}.`);
    if (missing.length) flags.push(`Doesn’t mention: ${missing.join(', ')}.`);
  }
  const pick = matchPick(front, offer.product, offer.url);
  if (pick) {
    notes.push(`PointCast reviewed ${pick.name}: ${pick.verdict}`);
    const pickHost = baseDomain(hostOf(pick.url));
    if (host && pickHost && baseDomain(host) !== pickHost) { flags.push(`Link goes to ${host}, not the maker (${pickHost}). Could be a reseller.`); score -= 15; }
    else if (host) { score += 5; notes.push('Link goes to the maker’s own site.'); }
    if (pick.price !== null && offer.price !== null) {
      const diff = (offer.price - pick.price) / pick.price;
      if (diff > 0.1) { flags.push(`Priced ${money(offer.price)}; PointCast saw ${pick.priceText.replace(/\*$/, '')} from the maker.`); score -= 15; }
      else if (diff < -0.1) notes.push(`Cheaper than the ${pick.priceText.replace(/\*$/, '')} PointCast saw. Worth checking the terms.`);
      else { score += 5; notes.push(`Matches the price PointCast saw (${pick.priceText.replace(/\*$/, '')}).`); }
    }
  }
  const rel = offer.relationship.toLowerCase();
  if (/seller|maker|brand|affiliate|reseller|partner|commission/.test(rel)) notes.push(`The agent says it is: ${offer.relationship}. Good that it says so.`);
  else if (rel === 'house') notes.push('House offer from the Clerk, straight from a PointCast guide.');
  else { flags.push('The agent didn’t say who it works for.'); score -= 5; }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const verdict = flags.some((f) => /not a plain https/.test(f)) ? 'flagged' : score >= 70 ? 'strong' : score >= 45 ? 'fair' : 'weak';
  return { score, verdict, notes, flags, matchedPick: pick?.id ?? null };
}

/** The Clerk answers every new want with up to three house offers, labeled as house. */
export function houseOffers(front: ShopFront, want: WantInput): { offer: OfferInput; pick: ClerkMatch }[] {
  const ask = parseAsk({ q: `${want.title} ${want.need} ${want.mustHave.join(' ')}`, maxPrice: want.budget ?? undefined, guide: want.guide ?? undefined, limit: 3 }, front.guides.map((g) => g.id));
  return clerkAnswer(front, ask).picks.map((m) => ({
    pick: m,
    offer: {
      agent: 'The Clerk (house)',
      product: `${m.name} · ${m.brand}`,
      price: m.price,
      url: m.url,
      terms: `${m.verdict} From PointCast’s ${m.guideTitle}, checked ${m.asOf ?? 'recently'}. Full review: ${m.reviewUrl}`,
      relationship: 'house',
    },
  }));
}
