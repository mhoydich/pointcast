import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { r as roundTrip, a as blockAtUri } from './block-to-lexicon_B-byCOnZ.mjs';

const $$Preview = createComponent(async ($$result, $$props, $$slots) => {
  const SAMPLE_IDS = ["0381", "0387", "0384", "0371"];
  const all = await getCollection("blocks", ({ data }) => !data.draft);
  const byId = new Map(all.map((e) => [e.data.id, e.data]));
  function stripLongBody(obj) {
    if (!obj || typeof obj !== "object") return obj;
    if (typeof obj.body !== "string") return obj;
    if (obj.body.length <= 320) return obj;
    return { ...obj, body: obj.body.slice(0, 280) + "… [" + obj.body.length + " chars total]" };
  }
  const samples = SAMPLE_IDS.map((id) => byId.get(id)).filter((d) => d != null).map((data) => {
    const block = {
      ...data,
      timestamp: data.timestamp instanceof Date ? data.timestamp.toISOString() : String(data.timestamp)
    };
    const rt = roundTrip(block);
    return {
      block,
      blockTrimmed: stripLongBody(block),
      record: rt.record,
      recordTrimmed: stripLongBody(rt.record),
      lossless: rt.lossless,
      drift: rt.drift
    };
  });
  const allBlockData = all.map((e) => ({
    ...e.data,
    timestamp: e.data.timestamp instanceof Date ? e.data.timestamp.toISOString() : String(e.data.timestamp)
  }));
  let totalScanned = 0, lossless = 0;
  const driftRows = [];
  for (const b of allBlockData) {
    totalScanned++;
    const rt = roundTrip(b);
    if (rt.lossless) lossless++;
    else driftRows.push({ id: b.id, paths: rt.drift });
  }
  const drifted = totalScanned - lossless;
  const losslessPct = totalScanned > 0 ? (lossless / totalScanned * 100).toFixed(1) : "0.0";
  const driftFieldCounts = {};
  for (const row of driftRows) {
    for (const p of row.paths) {
      const head = p.split(/[.[]/)[0] || "(root)";
      driftFieldCounts[head] = (driftFieldCounts[head] || 0) + 1;
    }
  }
  const driftFields = Object.entries(driftFieldCounts).sort((a, b) => b[1] - a[1]);
  const exampleAtUri = blockAtUri("did:plc:pointcast-el-segundo-example", "0387");
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "/federation/preview — Block ↔ Lexicon spike", "description": "Phase 0 spike. Full-corpus round-trip stats + side-by-side Block vs xyz.pointcast.block Lexicon record. Companion to RFC 0004 and the audit:lexicon CLI." }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="fp"> <header class="fp__head"> <p class="fp__kicker mono">PHASE 0 SPIKE · 2026-04-29</p> <h1 class="fp__title">Block ↔ Lexicon · preview</h1> <p class="fp__lede">
A learn-by-doing test of the <code>xyz.pointcast.block</code> AT Protocol
        Lexicon defined in <a href="https://github.com/mhoydich/pointcast/blob/main/docs/rfcs/0004-pointcast-block-lexicon.md">RFC 0004</a>.
        The stats banner runs the round-trip against every published block at
        build time. The cards below show four representative blocks side-by-side.
</p> <div class="fp__lede2 mono"> <span>example AT-URI:</span> <code class="fp__aturi">${exampleAtUri}</code> </div> <div class="fp__legend mono"> <span class="fp__chip fp__chip--ok">LOSSLESS</span> <span class="fp__chip fp__chip--warn">DRIFT</span> <span class="fp__legend-note">drift = paths where round-trip differs from input</span> </div> </header> <section class="fp__stats"> <div class="fp__stats-grid"> <div class="fp__stat"> <p class="fp__stat-label mono">scanned</p> <p class="fp__stat-value">${totalScanned}</p> <p class="fp__stat-sub mono">published blocks</p> </div> <div class="fp__stat fp__stat--ok"> <p class="fp__stat-label mono">lossless</p> <p class="fp__stat-value">${lossless}</p> <p class="fp__stat-sub mono">${losslessPct}% of corpus</p> </div> <div${addAttribute(`fp__stat ${drifted > 0 ? "fp__stat--warn" : ""}`, "class")}> <p class="fp__stat-label mono">drift</p> <p class="fp__stat-value">${drifted}</p> <p class="fp__stat-sub mono">${drifted === 0 ? "all clean" : "on schema gaps"}</p> </div> </div> ${driftFields.length > 0 && renderTemplate`<div class="fp__driftfields mono"> <span class="fp__driftfields-label">drift fields:</span> ${driftFields.map(([f, n]) => renderTemplate`<span class="fp__driftfield">${f} <span class="fp__driftfield-n">×${n}</span></span>`)} </div>`} <p class="fp__stats-note mono">
runs at build time via <code>roundTrip()</code> from <code>src/lib/lexicon/block-to-lexicon.ts</code> · same logic as <code>npm run audit:lexicon</code> </p> </section> <section class="fp__samples"> ${samples.map((s) => renderTemplate`<article${addAttribute(`fp__card${s.lossless ? " fp__card--ok" : " fp__card--drift"}`, "class")}> <header class="fp__card-head"> <p class="fp__card-id mono">${s.block.id}</p> <p class="fp__card-title">${s.block.title}</p> <p class="fp__card-meta mono"> <span>${s.block.channel}</span> <span>·</span> <span>${s.block.type}</span> <span>·</span> <span>${s.block.author ?? "—"}</span> <span>·</span> <span${addAttribute(`fp__chip ${s.lossless ? "fp__chip--ok" : "fp__chip--warn"}`, "class")}> ${s.lossless ? "LOSSLESS" : `DRIFT · ${s.drift.length}`} </span> </p> </header> <div class="fp__columns"> <details class="fp__col" open> <summary class="fp__col-summary mono">BLOCK · src/content/blocks/${s.block.id}.json</summary> <pre class="fp__pre"><code>${JSON.stringify(s.blockTrimmed, null, 2)}</code></pre> </details> <details class="fp__col" open> <summary class="fp__col-summary mono">LEXICON · xyz.pointcast.block record</summary> <pre class="fp__pre"><code>${JSON.stringify(s.recordTrimmed, null, 2)}</code></pre> </details> </div> ${s.drift.length > 0 && renderTemplate`<details class="fp__drift"> <summary class="fp__drift-summary mono">DRIFT PATHS · ${s.drift.length}</summary> <ul class="fp__drift-list mono"> ${s.drift.map((p) => renderTemplate`<li>${p}</li>`)} </ul> </details>`} </article>`)} </section> ${driftRows.length > 0 && renderTemplate`<section class="fp__driftlist"> <h2 class="fp__driftlist-title">All drifting blocks (${driftRows.length})</h2> <p class="fp__driftlist-note mono">
Each row is a block whose round-trip diverged. The path is the field that didn't survive.
</p> <ul class="fp__driftlist-rows mono"> ${driftRows.map((row) => renderTemplate`<li class="fp__driftrow"> <span class="fp__driftrow-id">${row.id}</span> <span class="fp__driftrow-paths">${row.paths.join(", ")}</span> </li>`)} </ul> </section>`} <footer class="fp__foot mono"> <p class="fp__foot-note">
Pure shape-mapping. No DIDs were issued, no firehose was subscribed,
        no PDSes were harmed. Phase 1 commit decision lands at end of Sprint 5
        in <code>docs/notes/2026-05-02-sprint-next-direction.md</code>.
</p> <p class="fp__foot-links"> <a href="https://github.com/mhoydich/pointcast/blob/main/docs/rfcs/0004-pointcast-block-lexicon.md">RFC 0004 →</a> <a href="https://github.com/mhoydich/pointcast/blob/main/docs/rfcs/0005-pointcast-talk-lexicon.md">RFC 0005 →</a> <a href="https://github.com/mhoydich/pointcast/blob/main/src/lib/lexicon/block-to-lexicon.ts">converter source →</a> <a href="https://github.com/mhoydich/pointcast/blob/main/scripts/roundtrip-blocks.mjs">audit:lexicon CLI →</a> <a href="/federation/at/0405.json">/federation/at/${"{id}"}.json sample →</a> </p> </footer> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/federation/preview.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/federation/preview.astro";
const $$url = "/federation/preview";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Preview,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
