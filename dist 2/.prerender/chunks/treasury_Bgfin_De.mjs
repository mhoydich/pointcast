import { j as defineStyleVars, r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { t as treasury } from './treasury_CZh7ypda.mjs';
import { c as createComponent } from './astro-component_DWMcTjG3.mjs';

const $$Treasury = createComponent(async ($$result, $$props, $$slots) => {
  const all = await getCollection("blocks");
  const periodStart = new Date(treasury.period_start);
  const now = /* @__PURE__ */ new Date();
  const periodMs = 30 * 24 * 60 * 60 * 1e3;
  const periodEnd = new Date(periodStart.getTime() + periodMs);
  const spendBlocks = all.filter((b) => b.data.spend);
  const periodSpends = spendBlocks.filter((b) => {
    const t = new Date(b.data.timestamp).getTime();
    return t >= periodStart.getTime() && t <= now.getTime();
  });
  const agents = Object.keys(treasury.per_agent);
  const agentRollup = {};
  for (const a of agents) {
    const allowance = treasury.per_agent[a].allowance_usd;
    const spent = periodSpends.filter((b) => b.data.spend?.agent === a).reduce((s, b) => s + (b.data.spend?.amount_usd ?? 0), 0);
    const remaining = Math.max(0, allowance - spent);
    agentRollup[a] = {
      allowance,
      spent,
      remaining,
      pct: allowance > 0 ? Math.min(100, spent / allowance * 100) : 0,
      receipts: periodSpends.filter((b) => b.data.spend?.agent === a).length
    };
  }
  const merchantRollup = {};
  for (const [m, cfg] of Object.entries(treasury.merchant_caps)) {
    const spent = periodSpends.filter((b) => b.data.spend?.merchant === m).reduce((s, b) => s + (b.data.spend?.amount_usd ?? 0), 0);
    merchantRollup[m] = {
      cap: cfg.monthly_usd,
      spent,
      remaining: Math.max(0, cfg.monthly_usd - spent),
      pct: cfg.monthly_usd > 0 ? Math.min(100, spent / cfg.monthly_usd * 100) : 0
    };
  }
  const totalAllowance = treasury.total_usd;
  const totalSpent = periodSpends.reduce((s, b) => s + (b.data.spend?.amount_usd ?? 0), 0);
  const totalRemaining = Math.max(0, totalAllowance - totalSpent);
  const daysElapsed = Math.max(0.5, (now.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1e3));
  const burnPerDay = totalSpent / daysElapsed;
  const projectedRunwayDays = burnPerDay > 0 ? totalRemaining / burnPerDay : Infinity;
  periodEnd.toISOString().slice(0, 10);
  const daysToReset = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1e3)));
  function fmt(n) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }
  const EMERALD = "#0B6B3A";
  const EMERALD_DEEP = "#06451F";
  const EMERALD_TINT = "#E7F3EC";
  const AMBER = "#BA7517";
  const CORAL = "#C73E3E";
  const INK = "#1A1A1A";
  const HAIR = "#D4CBB6";
  const $$definedVars = defineStyleVars([{ EMERALD, EMERALD_DEEP, EMERALD_TINT, AMBER, CORAL, INK, HAIR }]);
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Treasury — PointCast", "description": "Allowance + burn-rate dashboard for resident agent loops. Sibling to /money.", "data-astro-cid-lrz4x5ax": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="treasury" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <header class="treasury__header" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <div class="treasury__chip" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>TRY</div> <h1 data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>Treasury</h1> <p class="dek" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>
Per-agent monthly allowance and burn rate. /money is the ledger
        (what was spent). /treasury is the budget (what's allocated,
        what's left). Single-tenant, Mike-funded for v0. Resets on the
        1st of each month.
</p> </header> <section class="totals" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <div class="totals__cell" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <span class="totals__label" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>allocated this period</span> <span class="totals__big" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>${fmt(totalAllowance)}</span> <span class="totals__sub" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>${treasury.funder.handle} · ${treasury.funder.payment_method_kind}</span> </div> <div class="totals__cell" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <span class="totals__label" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>spent so far</span> <span class="totals__big"${addAttribute(`${`color: ${EMERALD}`}; ${$$definedVars}`, "style")} data-astro-cid-lrz4x5ax>${fmt(totalSpent)}</span> <span class="totals__sub" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>${periodSpends.length} receipt${periodSpends.length === 1 ? "" : "s"}</span> </div> <div class="totals__cell" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <span class="totals__label" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>remaining</span> <span class="totals__big"${addAttribute(`${`color: ${totalRemaining > 0 ? INK : CORAL}`}; ${$$definedVars}`, "style")} data-astro-cid-lrz4x5ax>${fmt(totalRemaining)}</span> <span class="totals__sub" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>${daysToReset} day${daysToReset === 1 ? "" : "s"} to reset</span> </div> <div class="totals__cell" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <span class="totals__label" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>burn / day</span> <span class="totals__big" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>${fmt(burnPerDay)}</span> <span class="totals__sub" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>projected runway: ${projectedRunwayDays === Infinity ? "∞" : `${Math.floor(projectedRunwayDays)}d`}</span> </div> </section> <section class="block" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <h2 data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>By agent</h2> <ul class="rollup" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> ${agents.map((a) => {
    const r = agentRollup[a];
    const pct = Math.round(r.pct);
    return renderTemplate`<li class="row" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <div class="row__head" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <span class="row__name" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>${a}</span> <span class="row__nums" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>${fmt(r.spent)} / ${fmt(r.allowance)} · ${r.receipts} loop${r.receipts === 1 ? "" : "s"}</span> </div> <div class="bar" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}><div class="bar__fill"${addAttribute(`${`width: ${pct}%`}; ${$$definedVars}`, "style")} data-astro-cid-lrz4x5ax></div></div> <p class="row__rationale" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>${treasury.per_agent[a].rationale}</p> </li>`;
  })} </ul> </section> <section class="block" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <h2 data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>By merchant</h2> <ul class="rollup" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> ${Object.entries(merchantRollup).map(([m, r]) => {
    const pct = Math.round(r.pct);
    return renderTemplate`<li class="row" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <div class="row__head" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <span class="row__name" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>${m}</span> <span class="row__nums" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>${fmt(r.spent)} / ${fmt(r.cap)} · ${treasury.merchant_caps[m].kind}</span> </div> <div class="bar" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}><div class="bar__fill"${addAttribute(`${`width: ${pct}%; background: ${AMBER}`}; ${$$definedVars}`, "style")} data-astro-cid-lrz4x5ax></div></div> </li>`;
  })} </ul> </section> <section class="block kill-switch" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <h2 data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>Kill switch</h2> <p class="dek" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>Server-side hard caps. Belt-and-suspenders to the Link dashboard caps Mike set at onboard. Both layers must allow a charge for it to clear.</p> <ul class="kill" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <li data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}><span data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>per purchase:</span> <strong data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>${fmt(treasury.kill_switch.per_purchase_usd)}</strong></li> <li data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}><span data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>per agent / day:</span> <strong data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>${fmt(treasury.kill_switch.per_agent_per_day_usd)}</strong></li> <li data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}><span data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>rolling 30 days:</span> <strong data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>${fmt(treasury.kill_switch.rolling_30d_usd)}</strong></li> </ul> </section> <footer class="treasury__footer" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}> <a href="/money" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>/money — the ledger</a> <span data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>·</span> <a href="/money.json" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>/money.json — agent feed</a> <span data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>·</span> <a href="/b/0420" data-astro-cid-lrz4x5ax${addAttribute($$definedVars, "style")}>/b/0420 — where this goes</a> </footer> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/treasury.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/treasury.astro";
const $$url = "/treasury";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Treasury,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
