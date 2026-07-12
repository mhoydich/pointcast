import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute, F as Fragment } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { $ as $$WalletConnect } from './WalletConnect_C-fpO83k.mjs';
import contracts from './contracts_B1zhgPPX.mjs';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const $$Deploy = createComponent(async ($$result, $$props, $$slots) => {
  const MIKE_MAINWALLET_BUILD = "tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw";
  async function fetchLiveStats(kt1) {
    const stats = {
      totalSupply: null,
      holders: null,
      onChainAdmin: null,
      adminStatus: "unknown",
      recentOpAt: null
    };
    try {
      const [tokensRes, storageRes, opsRes] = await Promise.all([
        fetch(`https://api.tzkt.io/v1/tokens?contract=${kt1}&select=totalSupply,holdersCount&limit=200`),
        fetch(`https://api.tzkt.io/v1/contracts/${kt1}/storage`),
        fetch(`https://api.tzkt.io/v1/operations/transactions?target=${kt1}&limit=1&sort.desc=id&select=timestamp`)
      ]);
      if (tokensRes.ok) {
        const tokens = await tokensRes.json();
        if (Array.isArray(tokens) && tokens.length) {
          stats.totalSupply = tokens.reduce((sum, t) => sum + Number(t.totalSupply ?? 0), 0);
          stats.holders = tokens.reduce((max, t) => Math.max(max, t.holdersCount ?? 0), 0);
        } else {
          stats.totalSupply = 0;
          stats.holders = 0;
        }
      }
      if (storageRes.ok) {
        const storage = await storageRes.json();
        const admin = storage && (storage.administrator || storage.admin) || null;
        stats.onChainAdmin = typeof admin === "string" ? admin : null;
        if (stats.onChainAdmin === MIKE_MAINWALLET_BUILD) stats.adminStatus = "mine";
        else if (stats.onChainAdmin && /^tz1/.test(stats.onChainAdmin)) stats.adminStatus = "throwaway";
        else if (stats.onChainAdmin) stats.adminStatus = "other";
        else stats.adminStatus = "unknown";
      }
      if (opsRes.ok) {
        const ops = await opsRes.json();
        if (Array.isArray(ops) && ops.length) {
          stats.recentOpAt = ops[0]?.timestamp ?? null;
        }
      }
    } catch {
    }
    return stats;
  }
  const SLUG_DISPLAY = {
    visit_nouns: "Visit Nouns FA2",
    coffee_mugs: "Coffee Mugs FA2",
    birthdays: "Birthdays FA2",
    drum_token: "Drum Token",
    marketplace: "PointCast Marketplace",
    prize_cast: "Prize Cast",
    agent_derby_receipts: "Agent Derby Receipts"
  };
  const SLUG_DESCRIPTION = {
    visit_nouns: "Per-visit Noun NFT · public mint · royalty 5%",
    coffee_mugs: "5 rarity-tiered mug NFTs · public free mint · caps 333/144/64/21/8",
    birthdays: "Open-edition birthday cards · one token_id per BIRTHDAY block",
    drum_token: "PointCast utility token (FA1.2)",
    marketplace: "On-site listings + sales escrow",
    prize_cast: "Race-winner prize escrow",
    agent_derby_receipts: "Public receipt ledger for Agent Derby races"
  };
  function statusFor(slug, entry) {
    const liveKt1 = entry.mainnet && typeof entry.mainnet === "string" && entry.mainnet.startsWith("KT1") ? entry.mainnet : null;
    const contractFile = existsSync(resolve(`contracts/v2/${slug}_fa2.py`)) ? `contracts/v2/${slug}_fa2.py` : existsSync(resolve(`contracts/v2/${slug}.py`)) ? `contracts/v2/${slug}.py` : null;
    const artifactsAvailable = existsSync(resolve(`public/admin/_artifacts/${slug}-contract.json`)) && existsSync(resolve(`public/admin/_artifacts/${slug}-storage.json`));
    let status;
    if (liveKt1) status = "LIVE";
    else if (artifactsAvailable) status = "STAGED";
    else if (contractFile) status = "DRAFT";
    else status = "WRITTEN";
    return { status, contractFile, artifactsAvailable, kt1: liveKt1 };
  }
  const rawEntries = Object.entries(contracts).filter(
    ([k]) => !k.startsWith("_")
  );
  const liveLookups = await Promise.all(
    rawEntries.map(async ([slug, entry]) => {
      const { status, kt1 } = statusFor(slug, entry);
      if (status === "LIVE" && kt1) {
        const live = await fetchLiveStats(kt1);
        return [slug, live];
      }
      return [slug, null];
    })
  );
  const liveBySlug = Object.fromEntries(liveLookups);
  const rows = rawEntries.map(([slug, entry]) => {
    const { status, contractFile, artifactsAvailable, kt1 } = statusFor(slug, entry);
    return {
      slug,
      name: SLUG_DISPLAY[slug] || slug,
      description: SLUG_DESCRIPTION[slug] || "",
      status,
      chain: "tezos",
      symbol: entry.symbol ?? null,
      kt1,
      contractFile,
      artifactsAvailable,
      runbook: entry?._notes?.runbook ?? null,
      brief: entry?._notes?.brief ?? null,
      origNotes: entry?._mainnet_notes ?? entry?._shadownet_notes ?? null,
      live: liveBySlug[slug] ?? null
    };
  });
  const ORDER = ["STAGED", "DRAFT", "LIVE", "WRITTEN"];
  const grouped = { LIVE: [], STAGED: [], DRAFT: [], WRITTEN: [] };
  for (const r of rows) grouped[r.status].push(r);
  const counts = {
    total: rows.length,
    live: grouped.LIVE.length,
    staged: grouped.STAGED.length,
    draft: grouped.DRAFT.length,
    written: grouped.WRITTEN.length
  };
  const liveAggregate = grouped.LIVE.reduce(
    (acc, r) => {
      if (r.live?.totalSupply != null) acc.minted += r.live.totalSupply;
      if (r.live?.holders != null) acc.holders += r.live.holders;
      if (r.live?.adminStatus === "mine") acc.mineCount += 1;
      if (r.live?.adminStatus === "throwaway") acc.throwawayCount += 1;
      return acc;
    },
    { minted: 0, holders: 0, mineCount: 0, throwawayCount: 0 }
  );
  function relativeTimeFromIso(iso) {
    if (!iso) return "";
    try {
      const t = new Date(iso).getTime();
      if (!t) return "";
      const diff = Math.max(0, (Date.now() - t) / 1e3);
      if (diff < 60) return Math.floor(diff) + "s ago";
      if (diff < 3600) return Math.floor(diff / 60) + "m ago";
      if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
      return Math.floor(diff / 86400) + "d ago";
    } catch {
      return "";
    }
  }
  const ADMIN_TONE = {
    mine: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    throwaway: "bg-rose-500/15 text-rose-700 border-rose-500/30",
    other: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    unknown: "bg-card text-ink-soft border-rule/30"
  };
  const ADMIN_LABEL = {
    mine: "admin: you ✓",
    throwaway: "admin: throwaway ⚠",
    other: "admin: other",
    unknown: "admin: unknown"
  };
  const MIKE_MAINWALLET = "tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw";
  function deriveApprovals() {
    const out = [];
    for (const [slug, entry] of rawEntries) {
      const { status, kt1 } = statusFor(slug, entry);
      const name = SLUG_DISPLAY[slug] || slug;
      if (status === "LIVE" && kt1) {
        const adminInNotes = entry?._mainnet_notes?.administrator || "";
        const originator = entry?._mainnet_notes?.originator || "";
        const adminKnown = !!adminInNotes;
        const adminIsMike = adminInNotes === MIKE_MAINWALLET;
        const originatorIsMike = originator === MIKE_MAINWALLET;
        const transferPending = adminKnown ? !adminIsMike : !!originator && !originatorIsMike;
        if (transferPending) {
          const currentAdmin = adminInNotes || originator;
          out.push({
            slug,
            contractName: name,
            title: `Transfer ${name} admin to your mainwallet`,
            rationale: `Admin is currently ${currentAdmin.slice(0, 8)}…${currentAdmin.slice(-4)}. Call set_administrator(${MIKE_MAINWALLET.slice(0, 8)}…) to claim it.`,
            ctaHref: `/admin/deploy/${slug}#transfer-admin`,
            ctaLabel: "Transfer admin →",
            severity: "high"
          });
        }
        const tokens = entry.tokens;
        const tokensRegistered = entry._tokens_registered === true;
        const hasTokensRegistry = tokens && typeof tokens === "object" && Object.keys(tokens).length > 0;
        if (hasTokensRegistry && !tokensRegistered) {
          out.push({
            slug,
            contractName: name,
            title: `Register tokens for ${name}`,
            rationale: `${Object.keys(tokens).length} token names defined in contracts.json. Call register_tokens(...) once to bind names to token_ids; required before public mint can succeed.`,
            ctaHref: `/admin/deploy/${slug}#register-tokens`,
            ctaLabel: "Register →",
            severity: "high"
          });
        }
      }
      if (status === "STAGED") {
        out.push({
          slug,
          contractName: name,
          title: `Originate ${name}`,
          rationale: "Compiled artifacts staged at /admin/_artifacts/. The Publisher will load them, auto-patch the admin field, and originate via Kukai.",
          ctaHref: `/admin/deploy/new?prefill=${slug}`,
          ctaLabel: "Originate →",
          severity: "medium"
        });
      }
      if (status === "DRAFT") {
        out.push({
          slug,
          contractName: name,
          title: `Compile + originate ${name}`,
          rationale: "SmartPy source is committed. Compile via the IDE, then paste the JSONs into the Publisher.",
          ctaHref: `/admin/deploy/${slug}`,
          ctaLabel: "Compile path →",
          severity: "medium"
        });
      }
    }
    const rank = { high: 0, medium: 1, low: 2 };
    out.sort((a, b) => rank[a.severity] - rank[b.severity]);
    return out;
  }
  const approvals = deriveApprovals();
  const SEVERITY_TONE = {
    high: "border-rose-500/40 bg-rose-500/5",
    medium: "border-warm/40 bg-warm/5",
    low: "border-rule/30 bg-card/40"
  };
  const SEVERITY_BADGE = {
    high: "bg-rose-500/15 text-rose-700 border-rose-500/30",
    medium: "bg-warm/20 text-warm border-warm/40",
    low: "bg-card text-ink-soft border-rule/30"
  };
  const SEVERITY_LABEL = {
    high: "high",
    medium: "medium",
    low: "low"
  };
  const STATUS_TONE = {
    LIVE: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    STAGED: "bg-warm/20 text-warm border-warm/40",
    DRAFT: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    WRITTEN: "bg-ink-soft/15 text-ink-soft border-ink-soft/30"
  };
  const STATUS_LABEL = {
    LIVE: "live · mainnet",
    STAGED: "staged · ready",
    DRAFT: "draft · uncompiled",
    WRITTEN: "written · sketch"
  };
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Deploy · Admin", "description": "PointCast contract deploy center" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-[52rem] mx-auto px-4 pt-6 md:pt-10 pb-20"> <!-- Masthead band --> <div class="-mx-4 px-4 py-2.5 border-y border-rule/50 flex items-center justify-between gap-3 mb-6"> <div class="flex items-center gap-3"> <a href="/" class="font-mono text-sm md:text-base font-bold tracking-[0.28em] uppercase text-ink leading-none hover:text-warm transition-colors no-underline">
PointCast
</a> <span class="font-mono text-[0.58rem] tracking-[0.22em] uppercase text-warm">
/ admin / deploy
</span> </div> ${renderComponent($$result2, "WalletConnect", $$WalletConnect, {})} </div> <!-- Header --> <header class="mb-7"> <p class="font-mono text-[0.54rem] tracking-[0.22em] uppercase text-warm mb-2">
admin · deploy center
</p> <h1 class="font-serif italic text-[1.8rem] md:text-[2.2rem] text-ink font-medium leading-[1.1] mb-3">
Deploy a contract
</h1> <p class="text-[0.95rem] text-ink/70 leading-relaxed mb-3">
Every PointCast contract, from sketch to live. Click an action to
        compile, originate, or manage. All Tezos for now &mdash; Ethereum
        and Solana arrive with the Zora drop and Drum Token push.
</p> <div class="flex flex-wrap gap-2 font-mono text-[0.52rem] tracking-[0.16em] uppercase"> <span class="px-2 py-1 rounded-sm bg-card border border-rule/30 text-ink-soft"> ${counts.total} total
</span> <span class="px-2 py-1 rounded-sm border border-emerald-500/30 bg-emerald-500/10 text-emerald-700"> ${counts.live} live
</span> <span class="px-2 py-1 rounded-sm border border-warm/30 bg-warm/10 text-warm"> ${counts.staged} staged
</span> <span class="px-2 py-1 rounded-sm border border-amber-500/30 bg-amber-500/10 text-amber-700"> ${counts.draft} draft
</span> <span class="px-2 py-1 rounded-sm border border-ink-soft/30 bg-card text-ink-soft"> ${counts.written} written
</span> </div> </header>  ${counts.live > 0 && renderTemplate`<section class="mb-8 p-4 rounded-md border border-emerald-500/30 bg-emerald-500/5"> <div class="flex items-center justify-between mb-3"> <p class="font-mono text-[0.54rem] tracking-[0.22em] uppercase text-emerald-700">
live · mainnet
</p> <span class="font-mono text-[0.5rem] tracking-[0.14em] uppercase text-ink-soft/60">
via tzkt at build · ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " ")}Z
</span> </div> <div class="grid grid-cols-2 md:grid-cols-4 gap-3"> <div> <p class="font-mono text-[0.5rem] tracking-[0.18em] uppercase text-ink-soft/70 mb-0.5">total minted</p> <p class="text-[1.4rem] font-medium text-ink leading-none">${liveAggregate.minted}</p> </div> <div> <p class="font-mono text-[0.5rem] tracking-[0.18em] uppercase text-ink-soft/70 mb-0.5">live contracts</p> <p class="text-[1.4rem] font-medium text-ink leading-none">${counts.live}</p> </div> <div> <p class="font-mono text-[0.5rem] tracking-[0.18em] uppercase text-ink-soft/70 mb-0.5">your admin</p> <p class="text-[1.4rem] font-medium text-emerald-700 leading-none">${liveAggregate.mineCount}</p> </div> <div> <p class="font-mono text-[0.5rem] tracking-[0.18em] uppercase text-ink-soft/70 mb-0.5">throwaway admin</p> <p${addAttribute(`text-[1.4rem] font-medium leading-none ${liveAggregate.throwawayCount > 0 ? "text-rose-700" : "text-ink-soft"}`, "class")}>${liveAggregate.throwawayCount}</p> </div> </div> ${liveAggregate.throwawayCount > 0 && renderTemplate`<p class="mt-3 pt-3 border-t border-emerald-500/20 font-mono text-[0.55rem] tracking-[0.14em] uppercase text-rose-700">
⚠ ${liveAggregate.throwawayCount} contract${liveAggregate.throwawayCount === 1 ? "" : "s"} still admin'd by the throwaway origination signer · run <code class="bg-paper px-1 rounded">node scripts/transfer-admin.mjs</code> locally to take over
</p>`} </section>`} <!-- Pending approvals — highest-priority next moves --> ${approvals.length > 0 && renderTemplate`<section class="mb-8"> <div class="flex items-center justify-between mb-3 -mx-1 px-1 border-b border-rule/40 pb-1.5"> <h2 class="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-ink">
pending approvals
</h2> <span class="font-mono text-[0.5rem] tracking-[0.16em] uppercase text-ink-soft/60"> ${approvals.length} awaiting signature
</span> </div> <div class="space-y-2"> ${approvals.map((a) => renderTemplate`<a${addAttribute(a.ctaHref, "href")}${addAttribute(`block p-3 rounded-md border transition-colors no-underline hover:bg-card ${SEVERITY_TONE[a.severity]}`, "class")}> <div class="flex items-start justify-between gap-3"> <div class="flex-1 min-w-0"> <div class="flex items-center gap-2 flex-wrap mb-1"> <p class="font-medium text-ink leading-tight"> ${a.title} </p> <span${addAttribute(`px-1.5 py-0.5 rounded-sm border text-[0.5rem] tracking-[0.16em] uppercase font-mono leading-none ${SEVERITY_BADGE[a.severity]}`, "class")}> ${SEVERITY_LABEL[a.severity]} </span> </div> <p class="text-[0.85rem] text-ink-soft leading-snug"> ${a.rationale} </p> </div> <span class="shrink-0 inline-flex items-center px-2.5 py-1.5 rounded-sm bg-ink text-paper font-mono text-[0.55rem] tracking-[0.14em] uppercase"> ${a.ctaLabel} </span> </div> </a>`)} </div> </section>`} <!-- Quick actions --> <section class="mb-8 p-4 rounded-md border border-warm/40 bg-warm/5"> <p class="font-mono text-[0.54rem] tracking-[0.22em] uppercase text-warm mb-2">
publisher
</p> <p class="text-[0.92rem] text-ink mb-3">
Custom paste-and-originate &mdash; for one-off contracts or a clean re-deploy of
        an orphaned origination. Auto-patches the admin field to your connected wallet.
</p> <div class="flex flex-wrap gap-2"> <a href="/admin/deploy/new" class="inline-flex items-center justify-center px-4 py-2 rounded-md bg-ink text-paper font-mono text-[0.6rem] tracking-[0.16em] uppercase hover:bg-warm transition-colors no-underline">
Originate a contract &rarr;
</a> <a href="/admin/deploy/new?prefill=visit_nouns" class="inline-flex items-center justify-center px-4 py-2 rounded-md bg-card border border-rule/40 text-ink-soft font-mono text-[0.6rem] tracking-[0.16em] uppercase hover:border-warm hover:text-warm transition-colors no-underline">
Re-deploy Visit Nouns &rarr;
</a> </div> </section> <!-- Per-status sections --> ${ORDER.map((status) => {
    const list = grouped[status];
    if (!list.length) return null;
    return renderTemplate`<section class="mb-8"> <div class="flex items-center justify-between mb-3 -mx-1 px-1 border-b border-rule/40 pb-1.5"> <h2 class="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-ink"> ${STATUS_LABEL[status]} </h2> <span class="font-mono text-[0.5rem] tracking-[0.16em] uppercase text-ink-soft/60"> ${list.length} </span> </div> <ul class="divide-y divide-rule/30"> ${list.map((row) => renderTemplate`<li class="py-3 flex flex-col md:flex-row md:items-start md:justify-between gap-3"> <div class="flex-1 min-w-0"> <div class="flex items-center gap-2 flex-wrap mb-1"> <a${addAttribute(`/admin/deploy/${row.slug}`, "href")} class="font-medium text-ink text-[1rem] hover:text-warm transition-colors no-underline"> ${row.name} </a> <span${addAttribute(`px-1.5 py-0.5 rounded-sm border text-[0.5rem] tracking-[0.16em] uppercase font-mono leading-none ${STATUS_TONE[row.status]}`, "class")}> ${row.status} </span> <span class="px-1.5 py-0.5 rounded-sm border border-rule/40 text-[0.5rem] tracking-[0.16em] uppercase font-mono leading-none text-ink-soft bg-card">
tz
</span> ${row.symbol && renderTemplate`<span class="font-mono text-[0.55rem] tracking-[0.14em] uppercase text-ink-soft/70">
$${row.symbol} </span>`} </div> <p class="text-[0.85rem] text-ink-soft leading-snug mb-1"> ${row.description} </p> ${row.kt1 && renderTemplate`<p class="font-mono text-[0.6rem] tracking-[0.04em] text-ink/60 break-all"> ${row.kt1} </p>`} ${row.live && renderTemplate`<div class="mt-1.5 flex flex-wrap gap-1.5 items-center"> <span${addAttribute(`px-1.5 py-0.5 rounded-sm border text-[0.5rem] tracking-[0.16em] uppercase font-mono leading-none ${ADMIN_TONE[row.live.adminStatus]}`, "class")}> ${ADMIN_LABEL[row.live.adminStatus]} </span> ${row.live.totalSupply !== null && renderTemplate`<span class="px-1.5 py-0.5 rounded-sm border border-rule/40 text-[0.5rem] tracking-[0.16em] uppercase font-mono leading-none text-ink bg-card"> ${row.live.totalSupply} minted
</span>`} ${row.live.holders !== null && row.live.holders > 0 && renderTemplate`<span class="px-1.5 py-0.5 rounded-sm border border-rule/40 text-[0.5rem] tracking-[0.16em] uppercase font-mono leading-none text-ink-soft bg-card"> ${row.live.holders} holder${row.live.holders === 1 ? "" : "s"} </span>`} ${row.live.recentOpAt && renderTemplate`<span class="font-mono text-[0.5rem] tracking-[0.14em] uppercase text-ink-soft/60">
last op ${relativeTimeFromIso(row.live.recentOpAt)} </span>`} </div>`} ${row.contractFile && renderTemplate`<p class="font-mono text-[0.55rem] tracking-[0.04em] text-ink-soft/60 mt-0.5"> <a${addAttribute(`https://github.com/mhoydich/pointcast/blob/main/${row.contractFile}`, "href")} target="_blank" rel="noopener" class="hover:text-warm transition-colors"> ${row.contractFile} </a> </p>`} </div> <div class="flex flex-wrap gap-1.5 md:justify-end shrink-0"> ${row.status === "LIVE" && row.kt1 && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <a${addAttribute(`/admin/deploy/${row.slug}`, "href")} class="inline-flex items-center px-2.5 py-1.5 rounded-sm bg-ink text-paper font-mono text-[0.55rem] tracking-[0.14em] uppercase hover:bg-warm transition-colors no-underline">
Manage &rarr;
</a> <a${addAttribute(`https://tzkt.io/${row.kt1}/operations`, "href")} target="_blank" rel="noopener" class="inline-flex items-center px-2.5 py-1.5 rounded-sm bg-card border border-rule/40 text-ink-soft font-mono text-[0.55rem] tracking-[0.14em] uppercase hover:border-warm hover:text-warm transition-colors no-underline">
tzkt &nearr;
</a> ` })}`} ${row.status === "STAGED" && renderTemplate`<a${addAttribute(`/admin/deploy/new?prefill=${row.slug}`, "href")} class="inline-flex items-center px-2.5 py-1.5 rounded-sm bg-warm text-paper font-mono text-[0.55rem] tracking-[0.14em] uppercase hover:bg-ink transition-colors no-underline">
Originate &rarr;
</a>`} ${row.status === "DRAFT" && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <a${addAttribute(`/admin/deploy/${row.slug}`, "href")} class="inline-flex items-center px-2.5 py-1.5 rounded-sm bg-card border border-rule/40 text-ink-soft font-mono text-[0.55rem] tracking-[0.14em] uppercase hover:border-warm hover:text-warm transition-colors no-underline">
Compile &rarr;
</a> <a${addAttribute(`/admin/deploy/new?prefill=${row.slug}`, "href")} class="inline-flex items-center px-2.5 py-1.5 rounded-sm bg-warm text-paper font-mono text-[0.55rem] tracking-[0.14em] uppercase hover:bg-ink transition-colors no-underline">
Originate &rarr;
</a> ` })}`} ${row.status === "WRITTEN" && row.contractFile && renderTemplate`<a${addAttribute(`https://github.com/mhoydich/pointcast/blob/main/${row.contractFile}`, "href")} target="_blank" rel="noopener" class="inline-flex items-center px-2.5 py-1.5 rounded-sm bg-card border border-rule/40 text-ink-soft font-mono text-[0.55rem] tracking-[0.14em] uppercase hover:border-warm hover:text-warm transition-colors no-underline">
Source &nearr;
</a>`} ${row.status === "WRITTEN" && !row.contractFile && renderTemplate`<span class="inline-flex items-center px-2.5 py-1.5 rounded-sm bg-card text-ink-soft/50 font-mono text-[0.55rem] tracking-[0.14em] uppercase">
not yet written
</span>`} </div> </li>`)} </ul> </section>`;
  })} <!-- Coffee Mugs orphan note (informational, post-mortem of 2026-04-25 origination) --> <details class="mb-6 p-4 rounded-md border border-rule/30 bg-card/40"> <summary class="font-mono text-[0.58rem] tracking-[0.2em] uppercase text-ink-soft cursor-pointer">
Known orphans
</summary> <div class="mt-3 text-[0.85rem] text-ink-soft/80 leading-relaxed space-y-2"> <p> <strong>Coffee Mugs FA2 (KT1U6TrcNVwCmfkCZJysxFDyaYrYpV8shZCL)</strong> &mdash;
          originated 2026-04-25 via the legacy paste-and-deploy flow before the
          admin auto-patch landed. Storage shipped with <code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">tz1UyQDe&hellip;</code>
(the SmartPy test-account address) as <code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">administrator</code>,
          which means nobody can call <code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">register_tokens</code> or
<code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">set_administrator</code> from a real wallet.
          Do not list it on objkt; do not point <code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">contracts.json</code> at it.
          The Publisher's auto-admin-patch (added in this dashboard's PR) prevents
          the same class of orphan on every future origination.
</p> </div> </details> <!-- Coming soon --> <section class="mb-6"> <h2 class="font-mono text-[0.58rem] tracking-[0.2em] uppercase text-ink-soft/60 mb-2">
Other chains
</h2> <div class="grid md:grid-cols-2 gap-2"> <div class="p-3 rounded-md border border-rule/30 bg-card/40"> <div class="flex items-center gap-2 mb-1"> <span class="px-1.5 py-0.5 rounded-sm border border-rule/40 text-[0.5rem] tracking-[0.16em] uppercase font-mono leading-none text-ink-soft bg-paper">
eth
</span> <span class="font-mono text-[0.55rem] tracking-[0.16em] uppercase text-ink-soft/60">
soon
</span> </div> <p class="text-[0.85rem] text-ink-soft leading-snug">
Ethereum + Base via Wagmi / Zora SDK. Lands with the
            first Zora drop &mdash; tracked in <code class="font-mono text-[0.75rem] bg-card px-1 py-0.5 rounded">TASKS.md</code>.
</p> </div> <div class="p-3 rounded-md border border-rule/30 bg-card/40"> <div class="flex items-center gap-2 mb-1"> <span class="px-1.5 py-0.5 rounded-sm border border-rule/40 text-[0.5rem] tracking-[0.16em] uppercase font-mono leading-none text-ink-soft bg-paper">
sol
</span> <span class="font-mono text-[0.55rem] tracking-[0.16em] uppercase text-ink-soft/60">
soon
</span> </div> <p class="text-[0.85rem] text-ink-soft leading-snug">
Solana via <code class="font-mono text-[0.75rem] bg-card px-1 py-0.5 rounded">@solana/web3.js</code>
+ Phantom. Drum Token lives on Solana &mdash; bring up the publisher
            once that contract is past sketch.
</p> </div> </div> </section> <!-- Help --> <details class="p-4 rounded-md border border-rule/30 bg-card/40"> <summary class="font-mono text-[0.58rem] tracking-[0.2em] uppercase text-ink-soft cursor-pointer">
How status is computed
</summary> <ul class="mt-3 text-[0.85rem] text-ink-soft/80 leading-relaxed space-y-1 list-disc list-inside"> <li><strong>LIVE</strong> &mdash; <code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">contracts.json[slug].mainnet</code> starts with <code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">KT1</code>.</li> <li><strong>STAGED</strong> &mdash; pre-compiled artifacts at <code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">public/admin/_artifacts/&lt;slug&gt;-${`{contract,storage}`}.json</code>.</li> <li><strong>DRAFT</strong> &mdash; SmartPy source at <code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">contracts/v2/&lt;slug&gt;[_fa2].py</code> but no compiled JSON.</li> <li><strong>WRITTEN</strong> &mdash; entry in <code class="font-mono text-[0.78rem] bg-card px-1 py-0.5 rounded">contracts.json</code> but no source file yet.</li> </ul> </details> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/admin/deploy.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/admin/deploy.astro";
const $$url = "/admin/deploy";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Deploy,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
