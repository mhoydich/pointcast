import { j as defineStyleVars, r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { c as createComponent } from './astro-component_DWMcTjG3.mjs';

const $$Money = createComponent(async ($$result, $$props, $$slots) => {
  const all = await getCollection("blocks");
  const receipts = all.filter((b) => b.data.spend).sort((a, b) => new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime());
  const totalUsd = receipts.reduce((s, b) => s + (b.data.spend?.amount_usd ?? 0), 0);
  const totalLive = receipts.filter((b) => (b.data.spend?.mode ?? "test") === "live").reduce((s, b) => s + (b.data.spend?.amount_usd ?? 0), 0);
  const totalTest = totalUsd - totalLive;
  const dualRail = receipts.filter((b) => b.data.edition && b.data.spend);
  const byAgent = /* @__PURE__ */ new Map();
  for (const b of receipts) {
    const s = b.data.spend;
    if (!s) continue;
    const cur = byAgent.get(s.agent) ?? { count: 0, usd: 0 };
    cur.count += 1;
    cur.usd += s.amount_usd;
    byAgent.set(s.agent, cur);
  }
  function fmt(n) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }
  function rel(d) {
    const t = new Date(d).getTime();
    const dt = Math.floor((Date.now() - t) / 1e3);
    if (dt < 60) return `${dt}s ago`;
    if (dt < 3600) return `${Math.floor(dt / 60)}m ago`;
    if (dt < 86400) return `${Math.floor(dt / 3600)}h ago`;
    if (dt < 86400 * 7) return `${Math.floor(dt / 86400)}d ago`;
    return new Date(d).toISOString().slice(0, 10);
  }
  const EMERALD = "#0B6B3A";
  const EMERALD_DEEP = "#06451F";
  const EMERALD_TINT = "#E7F3EC";
  const AMBER = "#BA7517";
  const INK = "#1A1A1A";
  const HAIR = "#D4CBB6";
  const $$definedVars = defineStyleVars([{ EMERALD, EMERALD_DEEP, EMERALD_TINT, AMBER, INK, HAIR }]);
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Money — PointCast", "description": "Agent spend receipts. Tezos = identity of artifact. Link = money of action.", "data-astro-cid-s3fbujul": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="money" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <header class="money__header" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <div class="money__chip" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>MNY</div> <h1 data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>Money</h1> <p class="dek" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>
Receipts of agent loops. Every block here is something a resident
        spent on the town's behalf — image-gen, inference, sponsorship,
        domain renewal — with the user-facing context they wrote when
        asking, the merchant they paid, and the credential they used.
        Tezos handles identity of artifact; Link handles money of action.
</p> </header> <section class="totals" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <div class="totals__cell" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <span class="totals__label" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>total</span> <span class="totals__big" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${fmt(totalUsd)}</span> <span class="totals__sub" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${receipts.length} receipt${receipts.length === 1 ? "" : "s"}</span> </div> <div class="totals__cell" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <span class="totals__label" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>testmode</span> <span class="totals__big"${addAttribute(`${`color: ${AMBER}`}; ${$$definedVars}`, "style")} data-astro-cid-s3fbujul>${fmt(totalTest)}</span> <span class="totals__sub" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>no real charges</span> </div> <div class="totals__cell" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <span class="totals__label" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>live</span> <span class="totals__big"${addAttribute(`${`color: ${EMERALD}`}; ${$$definedVars}`, "style")} data-astro-cid-s3fbujul>${fmt(totalLive)}</span> <span class="totals__sub" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>real spend</span> </div> <div class="totals__cell" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <span class="totals__label" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>dual-rail</span> <span class="totals__big" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${dualRail.length}</span> <span class="totals__sub" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>blocks w/ Tezos + Link</span> </div> </section> ${byAgent.size > 0 && renderTemplate`<section class="agents" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <h2 data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>By agent</h2> <div class="agents__grid" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> ${[...byAgent.entries()].map(([agent, stat]) => renderTemplate`<div class="agent" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <span class="agent__name" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${agent}</span> <span class="agent__usd" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${fmt(stat.usd)}</span> <span class="agent__count" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${stat.count} loop${stat.count === 1 ? "" : "s"}</span> </div>`)} </div> </section>`} <section class="ledger" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <h2 data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>Receipts</h2> ${receipts.length === 0 ? renderTemplate`<p class="empty" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>
No receipts yet. The first one fires when an agent runs
<code data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>scripts/agent-spend.mjs</code> and the spend request
          settles.
</p>` : renderTemplate`<ol class="ledger__list" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> ${receipts.map((b) => {
    const s = b.data.spend;
    return renderTemplate`<li class="receipt" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <a class="receipt__link"${addAttribute(`/b/${b.data.id}`, "href")} data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <span class="receipt__id" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${b.data.id}</span> <span class="receipt__title" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${b.data.title}</span> </a> <div class="receipt__row" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <span${addAttribute(`pill pill--${s.mode}`, "class")} data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${s.mode}</span> <span class="receipt__amt" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${fmt(s.amount_usd)}</span> <span class="receipt__sep" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>→</span> <span class="receipt__merchant" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${s.merchant}</span> <span class="receipt__sep" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>·</span> <span class="receipt__agent" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${s.agent}/${s.loop}</span> <span class="receipt__sep" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>·</span> <span class="receipt__when" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${rel(b.data.timestamp)}</span> <span${addAttribute(`status status--${s.status}`, "class")} data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${s.status}</span> </div> ${(s.card_last4 || s.approval_url) && renderTemplate`<div class="receipt__creds" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> ${s.card_brand && s.card_last4 && renderTemplate`<span class="cred" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <span class="cred__lbl" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>card</span> <span class="cred__val" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${s.card_brand} •••• ${s.card_last4}</span> </span>`} ${s.card_valid_until && renderTemplate`<span class="cred" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <span class="cred__lbl" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>valid until</span> <span class="cred__val" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${rel(s.card_valid_until)}</span> </span>`} ${s.approval_url && s.status === "pending_approval" && renderTemplate`<a class="cred cred--cta"${addAttribute(s.approval_url, "href")} target="_blank" rel="noopener" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <span class="cred__lbl" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>action</span> <span class="cred__val" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>tap to approve →</span> </a>`} ${s.link_session_id && renderTemplate`<span class="cred cred--mono" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <span class="cred__lbl" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>spend-request</span> <span class="cred__val" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${s.link_session_id}</span> </span>`} </div>`} ${s.context && renderTemplate`<p class="receipt__context" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>${s.context}</p>`} </li>`;
  })} </ol>`} </section> <footer class="money__footer" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}> <a href="/b/0410" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>Why this exists</a> <span data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>·</span> <a href="https://link.com/agents" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>link.com/agents</a> <span data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>·</span> <a href="https://github.com/mhoydich/pointcast/issues/262" data-astro-cid-s3fbujul${addAttribute($$definedVars, "style")}>#262</a> </footer> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/money.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/money.astro";
const $$url = "/money";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Money,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
