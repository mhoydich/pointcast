import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { m as maybeRenderHead, b as addAttribute, a as renderTemplate, r as renderComponent } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import 'clsx';
import { $ as $$WalletChip } from './WalletChip_CCc3HKnc.mjs';
import contracts from './contracts_B1zhgPPX.mjs';
import { g as getPrizeCastSnapshot, a as getPrizeCastTzktUrl, f as formatTezAmount, P as PRIZE_CAST_PENDING_MESSAGE, b as PRIZE_CAST_FIRST_DRAW_PLACEHOLDER, s as shortTezosAddress } from './prize-cast_Bt_lh8RM.mjs';

const $$PrizeCastPanel = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$PrizeCastPanel;
  const {
    contract = "",
    minDepositMutez = 1e6
  } = Astro2.props;
  const contractReady = contract.startsWith("KT1");
  const minDepositTez = ((minDepositMutez ?? 1e6) / 1e6).toFixed(2);
  return renderTemplate`${maybeRenderHead()}<section class="prize-panel" data-prize-cast-panel${addAttribute(contract, "data-contract")}${addAttribute(minDepositMutez ?? 1e6, "data-min-deposit-mutez")} data-astro-cid-yesctolv> <div class="prize-panel__head" data-astro-cid-yesctolv> <div data-astro-cid-yesctolv> <p class="prize-panel__kicker" data-astro-cid-yesctolv>Deposit / withdraw</p> <h2 data-astro-cid-yesctolv>Move tez in and out of the weekly cast.</h2> </div> <p class="prize-panel__wallet" data-wallet-state data-astro-cid-yesctolv> ${contractReady ? "Connect wallet to deposit." : "Not yet originated — ghostnet test pending."} </p> </div> <label class="prize-panel__field" data-astro-cid-yesctolv> <span class="prize-panel__label" data-astro-cid-yesctolv>Amount (ꜩ)</span> <input type="number" inputmode="decimal" min="0" step="0.01"${addAttribute(minDepositTez, "placeholder")} data-amount-input${addAttribute(!contractReady, "disabled")} data-astro-cid-yesctolv> </label> <dl class="prize-panel__facts" data-astro-cid-yesctolv> <div data-astro-cid-yesctolv> <dt data-astro-cid-yesctolv>Min deposit</dt> <dd data-astro-cid-yesctolv>${Number(minDepositTez).toFixed(2)} ꜩ</dd> </div> <div data-astro-cid-yesctolv> <dt data-astro-cid-yesctolv>Flow</dt> <dd data-astro-cid-yesctolv>Beacon → Kukai / Temple / Umami</dd> </div> <div data-astro-cid-yesctolv> <dt data-astro-cid-yesctolv>Withdrawals</dt> <dd data-astro-cid-yesctolv>Principal stays liquid</dd> </div> </dl> <div class="prize-panel__actions" data-astro-cid-yesctolv> <button type="button" class="prize-panel__btn prize-panel__btn--primary" data-action="deposit"${addAttribute(!contractReady, "disabled")} data-astro-cid-yesctolv> ${contractReady ? "Connect wallet to deposit" : "Deposit unavailable"} </button> <button type="button" class="prize-panel__btn prize-panel__btn--ghost" data-action="withdraw"${addAttribute(!contractReady, "disabled")} data-astro-cid-yesctolv> ${contractReady ? "Connect wallet to withdraw" : "Withdraw unavailable"} </button> </div> <p class="prize-panel__status" role="status" aria-live="polite" data-status data-astro-cid-yesctolv> ${contractReady ? "Deposits accrue tickets over time; withdrawals return principal." : "Contract address lands here after the ghostnet smoke test."} </p> <p class="prize-panel__footnote" data-astro-cid-yesctolv>
Deposit signs <code data-astro-cid-yesctolv>deposit()</code> with mutez attached. Withdraw signs <code data-astro-cid-yesctolv>withdraw(amount_mutez)</code>.
    Successful ops open on TzKT in the status line.
</p> </section> ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/PrizeCastPanel.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/PrizeCastPanel.astro", void 0);

const $$Cast = createComponent(async ($$result, $$props, $$slots) => {
  const visitNounsKt1 = (contracts.visit_nouns?.mainnet).trim();
  const prizeCastKt1 = (contracts.prize_cast?.mainnet).trim();
  const snapshot = await getPrizeCastSnapshot();
  const pending = prizeCastKt1 === "";
  const tzktUrl = getPrizeCastTzktUrl(prizeCastKt1) ?? (visitNounsKt1 ? `https://tzkt.io/${visitNounsKt1}` : "https://tzkt.io");
  const nextDrawDate = new Date(snapshot.nextDrawAt);
  const winners = pending ? [] : snapshot.winners.slice(0, 10);
  function formatCountdown(target) {
    const diff = Math.max(0, target.getTime() - Date.now());
    const totalMinutes = Math.floor(diff / 6e4);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor(totalMinutes % 1440 / 60);
    const minutes = totalMinutes % 60;
    return { days, hours, minutes };
  }
  function formatUtcLabel(date) {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      hour12: false
    }).format(date).replace(",", "");
  }
  function dayOfWeekMarker(offset) {
    const now = /* @__PURE__ */ new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset));
    return {
      dow: d.getUTCDay(),
      label: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(d).toUpperCase(),
      isToday: offset === 0,
      isDrawDay: d.getUTCDay() === 0,
      dayNum: d.getUTCDate()
    };
  }
  const rhythmDays = Array.from({ length: 7 }, (_, i) => dayOfWeekMarker(i));
  const cd = formatCountdown(nextDrawDate);
  const statusText = pending ? "PENDING ORIGINATION" : snapshot.fetchError ? "DEGRADED READ" : "LIVE · SETTLING WEEKLY";
  const statusTone = pending ? "pending" : snapshot.fetchError ? "warn" : "live";
  const metrics = [
    {
      label: "TVL",
      value: pending ? "—" : formatTezAmount(snapshot.tvlTez),
      delta: pending ? "ꜩ" : `PRINCIPAL ${formatTezAmount(snapshot.principalTez, 2)}`,
      rank: "01"
    },
    {
      label: "PRIZE POOL",
      value: pending ? "—" : formatTezAmount(snapshot.prizePoolTez),
      delta: pending ? "ꜩ" : `YIELD · ${snapshot.accumulatedSince ? "ACCUMULATING" : "AWAITING FIRST DRAW"}`,
      rank: "02"
    },
    {
      label: "PARTICIPANTS",
      value: pending ? "—" : String(snapshot.participantCount ?? 0),
      delta: pending ? "WALLETS" : "WALLETS HOLDING TICKETS",
      rank: "03"
    },
    {
      label: "NEXT DRAW",
      value: pending ? "—" : `${cd.days}d ${String(cd.hours).padStart(2, "0")}h ${String(cd.minutes).padStart(2, "0")}m`,
      delta: `SUN 18:00 UTC · ${formatUtcLabel(nextDrawDate).toUpperCase()}`,
      rank: "04"
    }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/cast",
    name: "Prize Cast",
    description: "No-loss prize savings on Tezos. Deposit tez, keep principal, and the weekly yield becomes the prize.",
    url: "https://pointcast.xyz/cast",
    mainEntity: {
      "@type": "FinancialProduct",
      name: "Prize Cast",
      category: "Prize-linked savings",
      additionalProperty: [
        { "@type": "PropertyValue", name: "contract", value: prizeCastKt1 || "pending origination" },
        { "@type": "PropertyValue", name: "nextDrawAt", value: snapshot.nextDrawAt }
      ]
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Prize Cast", "description": "No-loss prize savings on Tezos. Deposit tez, keep your principal, and the aggregate yield becomes the weekly prize.", "image": "/images/og/cast.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/cast.json", title: "Prize Cast snapshot (JSON)" }], "data-astro-cid-qrxmieql": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-qrxmieql> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-qrxmieql> <a href="/" data-astro-cid-qrxmieql>Home</a> <span aria-hidden="true" data-astro-cid-qrxmieql>›</span> <span data-astro-cid-qrxmieql>cast</span> </nav> <header class="head" data-astro-cid-qrxmieql> <div class="head__kicker-row" data-astro-cid-qrxmieql> <p class="kicker" data-astro-cid-qrxmieql>CH.CST · PRIZE CAST · v1</p> <span${addAttribute(`status status--${statusTone}`, "class")} data-astro-cid-qrxmieql> <span class="status__dot" aria-hidden="true" data-astro-cid-qrxmieql></span> ${statusText} </span> </div> <div class="head__body" data-astro-cid-qrxmieql> <h1 class="display" data-astro-cid-qrxmieql>No-loss prize savings.</h1> <p class="dek" data-astro-cid-qrxmieql>
Deposit tez. Your principal stays liquid. The aggregate baking yield pools each week, and one participant wins the whole thing every Sunday at 18:00 UTC.
</p> </div> <div class="head__rail" data-astro-cid-qrxmieql> ${renderComponent($$result2, "WalletChip", $$WalletChip, { "data-astro-cid-qrxmieql": true })} </div> </header> <section class="terminal" aria-label="Prize Cast live metrics" data-astro-cid-qrxmieql> ${metrics.map((item) => renderTemplate`<article class="metric" data-astro-cid-qrxmieql> <div class="metric__head" data-astro-cid-qrxmieql> <span class="metric__rank" data-astro-cid-qrxmieql>${item.rank}</span> <span class="metric__label" data-astro-cid-qrxmieql>${item.label}</span> </div> <p${addAttribute(`metric__value ${pending ? "metric__value--pending" : ""}`, "class")}${addAttribute(item.label.toLowerCase().replace(/\s+/g, "-"), "data-metric")} data-astro-cid-qrxmieql>${item.value}</p> <p class="metric__delta" data-astro-cid-qrxmieql>${item.delta}</p> </article>`)} </section> <section class="rhythm" aria-label="Weekly draw rhythm" data-astro-cid-qrxmieql> <div class="rhythm__head" data-astro-cid-qrxmieql> <p class="section-kicker" data-astro-cid-qrxmieql>DRAW RHYTHM · 7-DAY</p> <p class="section-note" data-astro-cid-qrxmieql>Sunday 18:00 UTC · the week resets after settlement</p> </div> <div class="rhythm__bar" role="presentation" data-astro-cid-qrxmieql> ${rhythmDays.map((day) => renderTemplate`<div${addAttribute(`cell ${day.isToday ? "cell--today" : ""} ${day.isDrawDay ? "cell--draw" : ""}`, "class")} data-astro-cid-qrxmieql> <span class="cell__day" data-astro-cid-qrxmieql>${day.label.slice(0, 1)}</span> <span class="cell__num" data-astro-cid-qrxmieql>${day.dayNum}</span> ${day.isDrawDay && renderTemplate`<span class="cell__mark" data-astro-cid-qrxmieql>DRAW</span>`} ${day.isToday && !day.isDrawDay && renderTemplate`<span class="cell__mark" data-astro-cid-qrxmieql>NOW</span>`} </div>`)} </div> </section> <section class="mech" aria-label="How Prize Cast works" data-astro-cid-qrxmieql> <div class="mech__head" data-astro-cid-qrxmieql> <p class="section-kicker" data-astro-cid-qrxmieql>MECHANISM · HOW IT WORKS</p> </div> <ol class="mech__steps" data-astro-cid-qrxmieql> <li class="step" data-astro-cid-qrxmieql> <span class="step__num" data-astro-cid-qrxmieql>01</span> <div class="step__body" data-astro-cid-qrxmieql> <h3 class="step__title" data-astro-cid-qrxmieql>Deposit</h3> <p class="step__note" data-astro-cid-qrxmieql>Send tez to the pool via Beacon. You receive tickets proportional to your stake. Min deposit ${pending ? "1.00" : snapshot.minDepositMutez ? (snapshot.minDepositMutez / 1e6).toFixed(2) : "1.00"} ꜩ.</p> </div> </li> <li class="step" data-astro-cid-qrxmieql> <span class="step__num" data-astro-cid-qrxmieql>02</span> <div class="step__body" data-astro-cid-qrxmieql> <h3 class="step__title" data-astro-cid-qrxmieql>Stake</h3> <p class="step__note" data-astro-cid-qrxmieql>The pool contract stakes with a Tezos baker. Principal is never at risk — the baker earns ~5% APY, which the contract collects.</p> </div> </li> <li class="step" data-astro-cid-qrxmieql> <span class="step__num" data-astro-cid-qrxmieql>03</span> <div class="step__body" data-astro-cid-qrxmieql> <h3 class="step__title" data-astro-cid-qrxmieql>Accrue</h3> <p class="step__note" data-astro-cid-qrxmieql>Each week, the aggregate baking reward accumulates in the prize pool. Everyone's principal stays liquid and withdrawable at any moment.</p> </div> </li> <li class="step" data-astro-cid-qrxmieql> <span class="step__num" data-astro-cid-qrxmieql>04</span> <div class="step__body" data-astro-cid-qrxmieql> <h3 class="step__title" data-astro-cid-qrxmieql>Draw</h3> <p class="step__note" data-astro-cid-qrxmieql>Sunday 18:00 UTC, anyone can call <code data-astro-cid-qrxmieql>draw()</code>. On-chain randomness picks one ticket. Prize pool empties into that wallet.</p> </div> </li> </ol> </section> <section class="panel-wrap" aria-label="Deposit / withdraw" data-astro-cid-qrxmieql> ${pending && renderTemplate`<div class="pending-band" data-astro-cid-qrxmieql> <p class="pending-band__label" data-astro-cid-qrxmieql>DEPOSIT DESK · OFFLINE</p> <p class="pending-band__note" data-astro-cid-qrxmieql>${PRIZE_CAST_PENDING_MESSAGE}. The smoke test is next; this panel goes live the moment the mainnet KT1 lands in <code data-astro-cid-qrxmieql>contracts.json</code>.</p> </div>`} ${renderComponent($$result2, "PrizeCastPanel", $$PrizeCastPanel, { "contract": prizeCastKt1, "minDepositMutez": snapshot.minDepositMutez, "data-astro-cid-qrxmieql": true })} </section> ${!pending && snapshot.fetchError && renderTemplate`<div class="error" data-astro-cid-qrxmieql> <p class="error__label" data-astro-cid-qrxmieql>DEGRADED READ</p> <p data-astro-cid-qrxmieql>${snapshot.fetchError}. Verify the contract directly on <a${addAttribute(tzktUrl, "href")} target="_blank" rel="noopener" data-astro-cid-qrxmieql>TzKT</a>.</p> </div>`} <section class="winners" aria-label="Past winners" data-astro-cid-qrxmieql> <div class="section-head" data-astro-cid-qrxmieql> <p class="section-kicker" data-astro-cid-qrxmieql>PAST WINNERS · LAST 10</p> <p class="section-note" data-astro-cid-qrxmieql>Every settled draw ends up here as a receipt. On-chain, permanent, linkable.</p> </div> ${pending ? renderTemplate`<div class="receipt receipt--placeholder" data-astro-cid-qrxmieql> <div class="receipt__head mono" data-astro-cid-qrxmieql> <span data-astro-cid-qrxmieql>TICKET</span> <span data-astro-cid-qrxmieql>WINNER</span> <span data-astro-cid-qrxmieql>PRIZE</span> <span data-astro-cid-qrxmieql>BLOCK</span> </div> <div class="receipt__empty" data-astro-cid-qrxmieql> <p data-astro-cid-qrxmieql>${PRIZE_CAST_FIRST_DRAW_PLACEHOLDER}</p> <p class="receipt__empty-sub" data-astro-cid-qrxmieql>No prize has been cast yet. Come back after Sunday 18:00 UTC following the ghostnet smoke test.</p> </div> </div>` : winners.length > 0 ? renderTemplate`<div class="receipt" data-astro-cid-qrxmieql> <div class="receipt__head mono" data-astro-cid-qrxmieql> <span data-astro-cid-qrxmieql>TICKET</span> <span data-astro-cid-qrxmieql>WINNER</span> <span data-astro-cid-qrxmieql>PRIZE</span> <span data-astro-cid-qrxmieql>BLOCK</span> </div> ${winners.map((winner, idx) => renderTemplate`<div${addAttribute(`receipt__row ${idx === 0 ? "receipt__row--latest" : ""}`, "class")} data-astro-cid-qrxmieql> <span class="receipt__cell mono" data-astro-cid-qrxmieql>#${String(winner.round).padStart(4, "0")}</span> <span class="receipt__cell" data-astro-cid-qrxmieql> ${winner.caller ? renderTemplate`<a${addAttribute(`https://tzkt.io/${winner.winner}`, "href")} target="_blank" rel="noopener" data-astro-cid-qrxmieql>${shortTezosAddress(winner.winner)}</a>` : shortTezosAddress(winner.winner)} ${idx === 0 && renderTemplate`<span class="latest-tag mono" data-astro-cid-qrxmieql>LATEST</span>`} </span> <span class="receipt__cell receipt__cell--prize" data-astro-cid-qrxmieql>${formatTezAmount(winner.prizeTez)}</span> <span class="receipt__cell mono" data-astro-cid-qrxmieql>${winner.block ?? "—"}</span> </div>`)} </div>` : renderTemplate`<div class="receipt receipt--placeholder" data-astro-cid-qrxmieql> <p data-astro-cid-qrxmieql>No draw data yet. The first settled draw will land here.</p> </div>`} </section> <aside class="agent-strip" data-astro-cid-qrxmieql> <div class="agent-strip__head" data-astro-cid-qrxmieql> <p class="section-kicker" data-astro-cid-qrxmieql>AGENT SURFACES</p> <p class="section-note" data-astro-cid-qrxmieql>This page exists in three registers — HTML, JSON, structured. Pick your reader.</p> </div> <ul class="agent-strip__list" data-astro-cid-qrxmieql> <li data-astro-cid-qrxmieql><a href="/cast.json" data-astro-cid-qrxmieql><span class="mono" data-astro-cid-qrxmieql>GET</span> /cast.json</a></li> <li data-astro-cid-qrxmieql><a href="/for-agents" data-astro-cid-qrxmieql><span class="mono" data-astro-cid-qrxmieql>SEE</span> /for-agents</a></li> <li data-astro-cid-qrxmieql><a${addAttribute(tzktUrl, "href")} target="_blank" rel="noopener" data-astro-cid-qrxmieql><span class="mono" data-astro-cid-qrxmieql>→</span> TzKT</a></li> <li data-astro-cid-qrxmieql><a href="/docs/pm-briefs/2026-04-17-prize-cast-on-tezos.md" data-astro-cid-qrxmieql><span class="mono" data-astro-cid-qrxmieql>DOC</span> design</a></li> </ul> <p class="agent-strip__contract mono" data-astro-cid-qrxmieql>
CONTRACT · <code data-astro-cid-qrxmieql>${prizeCastKt1 || "pending origination"}</code> </p> </aside> </div> ${renderScript($$result2, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cast.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cast.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cast.astro";
const $$url = "/cast";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Cast,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
