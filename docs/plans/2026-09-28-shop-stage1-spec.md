# Shop stage 1 build spec (PaidLink, paddle takes, method, court lane)

Branch `cc/shop-reviews-stage1-2026-09-28` (from 6611f936). Do not run git commit, stash, checkout or reset.

**Ships** structure only: no reviews, no paid links, no new outbound links. Every program is `approved:false`. The register stays affiliate-free, and `/paddles/changes` says so.

**Decisions.**
- Stage 1 renders PaidLink unpaid everywhere: no link, only "No link, no commission." The register page already links the maker's site.
- Reviews are takes, not scores: no stars, and a verdict bucket. Each paddle gets one page, keyed by register id. There is no TEMPLATE page.
- Deferred: `SHOPPING_ITEMS` and the metrics, until the first approval. Takes stay out of `reviews[]`, which needs a rating.

## S: data and logic

**`src/data/affiliate-programs.ts`** (new, no imports)
Each row is `{id, brand, network, rate, cookie, accepting, approved:false, approvedOn:null, linkHosts:[], applyOrder, status, source}`. The rows, with PRD values and sources only:
- `selkirk`: AvantLink, 15% with a 30-day cookie.
- `engage`: Skimlinks or FlexOffers, 10% or 8%.
- `crbn`: rate not confirmed.
- `six-zero`: UpPromote, rate not confirmed.
- `11six24`: $15 credit or $10 cash per paddle. Source: `11six24.com/pages/ambassador-program`.
- `amazon`: about 3%, unverified. Source: null.
- `joola`: `accepting:false`.

**`src/lib/commerce.ts`** (edit; import the config with its `.ts` extension so node can load it)
- Constants: `PAID_LINK_DISCLOSURE = 'Paid link. PointCast earns a commission if you buy.'` and `NO_COMMISSION_NOTE = 'No link, no commission.'`.
- `resolvePaidLinkWith(programs, href, program)` returns `{paid:true, href, host, program, network, rate, rel:'sponsored noopener', disclosure}` only when all of these hold:
  - the program is known, accepting and approved, with an ISO `approvedOn`;
  - `isOutboundCheckoutUrl(href)` passes;
  - the host is in `linkHosts`. Hosts stay empty until the network supplies its link format, which makes this a double lock.

  Otherwise it returns `{paid:false, note}`.
- `resolvePaidLink(href, program)` binds `AFFILIATE_PROGRAMS`. Also add `anyProgramApproved()`.
- `outboundCheckout(url, affiliate?: {program})` is unchanged without the second argument. With it, it adds `paid`, `affiliate` (`{program, network, rate}` or null) and `disclosure`.
- New lane `'court'`, labelled "Court". `shopLaneUrl('court')` returns `/shop/court`, and `commerceLane()` never returns `'court'`.

**`src/lib/paddle-takes.ts`** (new, `import type` only)
```ts
type Relationship = 'owner'|'insider'|'sample'|'bought';
type Verdict = 'bag'|'depends'|'pass';
interface PaddleTake { id; paddleId; status:'published'|'draft'; publishedAt;
  reviewer:{handle; relationship:Relationship}; thesis; wouldChange; hoursPlayed:number;
  testedFrom; testedTo; verdict:Verdict; record:{date; note; source}[];
  affiliate:{program; url}|null; disclosure:string }
```
- `RELATIONSHIP_WORDS`: bought (own money, retail), sample (free or discounted), insider (Mike's own bag), owner (financial tie to the maker, ambassadors included).
- `VERDICT_WORDS`: "Stays in the bag" / "Depends on your game" / "Pass".
- `MIN_HOURS = 10`. `TAKE_FIELDS` holds a label and a meaning for each field.
- `validateTake(take, knownIds)` requires:
  - a slug id;
  - a known `paddleId` that is not `method`;
  - a handle matching `/^@[a-z0-9_]{2,24}$/i`;
  - valid enums;
  - a thesis of 20–280 chars and `wouldChange` of 10–280;
  - hours from `MIN_HOURS` to 2000;
  - ISO dates with `testedFrom ≤ testedTo ≤ publishedAt`;
  - a non-empty record whose sources are `'reviewer'` or https;
  - a non-empty disclosure;
  - an affiliate that is null, or a known program with an https link off-site.
- `publishableTakes(takes, ids)` drops drafts. It **throws** on an invalid published take or a duplicate id, so a bad entry fails the build instead of vanishing.
- `orderTakes` sorts by latest record date, then `publishedAt`, then id. It never reads verdict, relationship or affiliate.

**`src/data/paddle-reviews.ts`**: `export const PADDLE_REVIEWS: PaddleTake[] = [];`. Only real takes, filed by their reviewer.

**`src/lib/shop-court.ts`**: `courtLane(rows, asOf, {recentDays=120, recentCap=12})` returns `{upcoming, recent}`.
- `upcoming`: rows with `status==='upcoming'`, oldest date first.
- `recent`: released or limited rows within the window, newest first, capped.
- It takes no commission, program or rate input.

**Register data**
- Add `policy:'POLICY'` to `CHANGE_WORDS`, and allow `'policy'` in `tests/paddle-register.test.mjs`.
- Add this entry to `changes[]` in `paddle-register.json`, dated the merge day: `{kind:'policy', paddle:null, source:'https://pointcast.xyz/reviews/paddles/method', text:"Paid links will never appear in this register. If a paddle maker's program approves PointCast, paid links will appear only on paddle review pages and in the Shop's court lane, each labeled beside the link: \"Paid link. PointCast earns a commission if you buy.\" Commission never changes what we rank or recommend. No program has approved PointCast yet, so there are no paid links anywhere today."}`
- `docs/11six24-affiliate.md`, item 2: on approval, set the config fields. The link appears only through PaidLink, never in PaddleBlock or the register, and there are no discount codes.

**Tests (S)**
- `shop-paid-link`:
  - 7 ids, all `approved===false` (a stage-1 guard).
  - JOOLA is not accepting.
  - Every resolution comes back unpaid, including unknown programs and http or pointcast hrefs.
  - A patched, approved program pays only on a listed host, and only with the exact disclosure.
  - `outboundCheckout(url)` is unchanged.
  - No lane is `'court'`.
- `paddle-takes`:
  - A test-local `@fixture` passes.
  - Each validation rule rejects its case.
  - Throws and drops happen as specified.
  - Swapping verdict, affiliate or relationship never reorders.
  - `PADDLE_REVIEWS.length===0` (a stage-1 guard; the first real review removes it).
- `shop-court`:
  - Order and cap hold on the real JSON.
  - Every id exists.
  - The source has no `\b(affiliate|commission|program|rate)\b` and no `astro:content`.

## P: pages

**Every page** uses the grammar of `paddles/changes.astro` (non-legacy `BlockLayout`, `--pc-*` tokens, `CHANNELS.CRT`) and has one h1, JSON-LD, and a unique 50–160 character description. The og image is `/images/og/paddles.png`, or `/images/og/paddles/<id>.png` on review pages. No `<img>` except the register's `paddlePlate` drawing. No mention of Good Feels, THC or cannabis.

1. **`components/PaidLink.astro`** — props `{href?, program?, label?}`, resolved with `resolvePaidLink`.
   - Paid: one `<span class="paidlink">` wraps `<a rel="sponsored noopener" target="_blank">` and `{PAID_LINK_DISCLOSURE}`.
   - Unpaid: the same wrapper, holding only `{NO_COMMISSION_NOTE}`.
   - The file has exactly one `<a`. The note is 13px Inter and is never hidden.
2. **`components/ShopCourtLane.astro`** `{upcoming, recent, compact?}`.
   - Each row shows: date · brand and model, linked to `/paddles/<id>` · build · list price · the take, or "No review yet" · `<PaidLink/>`.
   - When `anyProgramApproved()` is false, the banner reads: "No paddle maker has approved PointCast yet. Nothing here earns a commission."
   - Footer: "Order is by release date. Commission never changes it."
3. **`pages/shop/court.astro`** — `courtLane(PADDLES, REGISTER_STATS.asOf)`, plus a link to the register.
4. **`pages/shop.astro`** — a "PADDLES · NO PAID LINKS" tile, and `<section id="court">` after merch showing the compact lane (upcoming only). The catalog is untouched.
5. **`pages/shop.json.ts`** — adds a `court` lane with `paidLinks: anyProgramApproved()`.
6. **`pages/reviews/paddles/index.astro`**: the empty state reads exactly "First review coming from Mike's bag." and links to the method page, `/shop/court` and `/paddles`. Takes are listed in `orderTakes` order. Never print a zero count.
7. **`pages/reviews/paddles/[id].astro`**
   - Paths come from `publishableTakes(PADDLE_REVIEWS, ids)`, which is empty today.
   - Each take shows the handle and relationship, hours, tested dates, verdict stamp, thesis, "What would change my mind", the record, a disclosure box, `<PaidLink>` and a link to the register.
   - JSON-LD is a `Review` with the handle as a Person author. No `reviewRating`.
8. **`[id].json.ts` and `pages/reviews/paddles.json.ts`** — schema `pointcast.paddle-reviews/v1`: the reviews, the programs with their approved flags, the disclosure, and the method URL.
9. **`pages/reviews/paddles/method.astro`** covers:
   - How picks are made: the hour floor and the buckets. A pass is published like a keeper, nothing is suppressed, and no reward depends on what a take says.
   - How paddles are sourced: the four relationships. Hours are as the reviewer reports them.
   - Commission never changes the order.
   - The programs table, with an Approved yes/no column and a status line.
   - Disclosure: the exact string sits beside every paid link. Never "affiliate" alone, and never only in a footer. Owned brands say so. Link the FTC guides.
   - `TAKE_FIELDS`.
   - The register stays affiliate-free.
10. **`pages/reviews/index.astro`** — a link to `/reviews/paddles`.
11. **`sitemap-discovery.xml.ts`** — adds `/shop/court`, `/reviews/paddles`, `/reviews/paddles/method` and `/reviews/paddles.json`.
12. **`components/PaddleBlock.astro`** — rewrite the AFFILIATE TODO to match the doc.

**Tests (P)** are source assertions in `tests/shop-stage1-pages.test.mjs`:
- **Register sources.** `src/pages/paddles/**`, `paddles.json.ts`, `paddle-register.ts` and `paddle-calendar.ts` contain no `PaidLink`, `resolvePaidLink`, `affiliate-programs` or `rel=…sponsored`. Match the rel attribute, not the word: the calendar prose says "sponsored players".
- **Paddle JSON.** No `avantlink|skimlinks|flexoffers|uppromote|amzn.to|[?&](tag|ref|aff\w*)=`.
- **PaidLink.** One `<a`, with `sponsored noopener`, inside the same wrapper as the disclosure. The unpaid branch has no link. No `sr-only`, `visually-hidden` or `display:none`.
- **New sources (except PaidLink).** No `sponsored`, no `<img`, no `getCollection('products'`, and nothing matching `/good ?feels|thc|cannabis/i`.
- **`[id].astro`.** Uses `publishableTakes(` and renders `reviewer.handle`. There is no template page.
- **Method page.** Has the table, the disclosure and the ranking sentence.
- **Index.** Has the exact empty line.
- **Changes.** Exactly one `policy` entry, mentioning "review pages", "court lane" and "never".

## Verify
1. The new tests pass, then `npm test` passes.
2. A full `npm run build` succeeds. `dist/reviews/paddles/` holds only the index, the method page and the JSON, and `dist/shop/court/` exists.
3. Clear the `dist.stale-*` directories from the scratchpad.
4. No horizontal scroll at 375px.

## Open for Mike
1. Is a 10-hour verdict floor right?
2. Ambassadors count as `owner`, so approved 11SIX24 takes read `owner`, not `insider`.
3. PaddleBlock loses the planned 11SIX24 link.
4. Out of scope: `/shop` and `/products` list THC items with no 21+ line.
