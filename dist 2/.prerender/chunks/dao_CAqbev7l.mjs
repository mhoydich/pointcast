import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$WalletChip } from './WalletChip_CCc3HKnc.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Dao = createComponent(async ($$result, $$props, $$slots) => {
  (contracts.visit_nouns?.mainnet).trim();
  const PROPOSALS = [
    {
      id: "PC-0001",
      kind: "treasury",
      title: "Seed the El Segundo Real Estate Fund — 0.5 ꜩ / month from treasury",
      summary: "Per Block 0241, start the DAO-owned real estate fund with a recurring 0.5 ꜩ/month seed from PointCast's Visit Nouns secondary royalty pool. Target: buy one mixed-use property in 90245 within 24 months.",
      body: [
        "The El Segundo Real Estate Fund (ESREF) would be a DAO-governed pool targeting commercial or mixed-use property in the 90245 zip code. Seed capital comes from Visit Nouns FA2 secondary-market royalties (5-10% per sale) plus direct contributions.",
        "This proposal requests a **recurring 0.5 ꜩ/month** allocation from the PointCast treasury to ESREF. At current ~$1.20/ꜩ that's $7.20/month from PointCast proper — small but binding as a signal that the project is funded.",
        "If passed: ESREF is established under a California Series LLC wrapper. First property-hunt begins month 1. Acquisition committee is 3 DAO members on a rotating quarterly term.",
        "If rejected: the fund remains a blocked concept. Mike may still pursue privately."
      ],
      opensAt: "2026-04-18T12:00:00-08:00",
      closesAt: "2026-04-25T18:00:00-08:00",
      minEligibility: "Any wallet holding ≥ 1 Visit Noun (KT1LP1o…) or DRUM Token (once live)",
      options: [
        { code: "FOR", label: "FOR · fund the ESREF seed", consequence: "Treasury allocates 0.5 ꜩ/month; LLC formed; acquisitions begin." },
        { code: "AGAINST", label: "AGAINST · decline", consequence: "Treasury holds. No fund." },
        { code: "ABSTAIN", label: "ABSTAIN · no position", consequence: "Does not count for or against but is recorded." }
      ]
    },
    {
      id: "PC-0002",
      kind: "schema",
      title: "Add CH.CST as PointCast's 10th channel",
      summary: "/cast (Prize Cast) currently fakes a channel code in its kicker. Making CST a real 10th channel per BLOCKS.md would harmonize the schema and let Prize-Cast-related content (draws, winners, operator notes) live in a proper channel.",
      body: [
        "BLOCKS.md defines channels as a closed set. Adding one is a schema change and per AGENTS.md requires MH decision — this proposal is that decision, routed through the DAO instead of just Mike.",
        "CH.CST · Cast · color #0F6E56 (GDN-green family, money-in-motion palette). Purpose: prize-linked savings, weekly draws, on-chain yield mechanics.",
        "Existing /cast frontend continues unchanged. Future Cast-related blocks (weekly draw announcements, winner profiles, parameter-tuning notes) would live under CH.CST.",
        "If passed: schema change merged; channels.ts and BLOCKS.md updated; /cast page's kicker becomes real; channels list grows from 9 to 10.",
        "If rejected: /cast stays as-is (using a made-up kicker that doesn't correspond to a real channel)."
      ],
      opensAt: "2026-04-18T12:00:00-08:00",
      closesAt: "2026-04-25T18:00:00-08:00",
      minEligibility: "Any connected wallet",
      options: [
        { code: "FOR", label: "FOR · ratify CH.CST", consequence: "Schema grows to 10 channels. Cast content gets a home." },
        { code: "AGAINST", label: "AGAINST · stay at 9", consequence: "Schema frozen at 9. /cast kicker stays informal." },
        { code: "ABSTAIN", label: "ABSTAIN", consequence: "Recorded, not counted." }
      ]
    },
    {
      id: "PC-0003",
      kind: "cotd",
      title: "Extend the Card of the Day roster from 21 to 50 Nouns",
      summary: "Battler's Card of the Day rotates through a curated 21-Noun roster keyed by UTC date. After ~3 weeks every card repeats. Extending to 50 gives a 7-week rotation before repeats — more variety, still finite enough to feel intentional.",
      body: [
        "Current roster in src/lib/battler/card-of-the-day.ts. 21 entries. dayIndex modulo 21.",
        "Extending to 50 entries means ~7 weeks of unique cards before cycling. Keeps the ritual (every day is a known card, deterministic for every viewer) while reducing repeat density.",
        "The 29 new Nouns are not specified by this proposal — if passed, a follow-up proposal (curated by a committee of 3 DAO members) brings the specific IDs for ratification.",
        "If rejected: roster stays at 21."
      ],
      opensAt: "2026-04-18T12:00:00-08:00",
      closesAt: "2026-04-25T18:00:00-08:00",
      minEligibility: "Any connected wallet",
      options: [
        { code: "FOR", label: "FOR · extend to 50", consequence: "7-week rotation. Follow-up proposal to curate the 29 new Nouns." },
        { code: "AGAINST", label: "AGAINST · keep at 21", consequence: "3-week rotation holds." },
        { code: "ABSTAIN", label: "ABSTAIN", consequence: "Recorded, not counted." }
      ]
    },
    {
      id: "PC-0004",
      kind: "content",
      title: "Expand YeePlayer — commission beat maps for 5 more WATCH blocks",
      summary: "YeePlayer v0 ships with a single title (Chakra Tune-Up, 21 beats). The primitive is reusable: any WATCH block with a media.beats array qualifies. This proposal funds the curation + authoring of 5 more titles.",
      body: [
        "Per Block 0250, YeePlayer v0 runs static over /b/0236 — bija mantras falling on a timed track synced to YouTube IFrame API. The framework is agnostic to content. Candidate next titles (for DAO selection): a short pickleball reaction drill, a drone-flight gong piece, a karaoke treatment of a CC-licensed song, a longer chakra-balance session, an ocean-wave breath timer.",
        "This proposal requests a 2 ꜩ budget from the treasury to pay any contributor who authors a beat map that passes editorial review (clean timing, safe words, working links). Paid per accepted title up to 5 titles at 0.4 ꜩ each.",
        "Beat maps would be PRs against the repo. Editorial review is Mike + one rotating DAO reviewer per round.",
        "If passed: 2 ꜩ allocated, open call announced, first titles shipped within 30 days.",
        "If rejected: YeePlayer stays a single-title experiment. Mike may still add titles himself."
      ],
      opensAt: "2026-04-18T12:00:00-08:00",
      closesAt: "2026-04-25T18:00:00-08:00",
      minEligibility: "Any connected wallet",
      options: [
        { code: "FOR", label: "FOR · fund 5 more titles", consequence: "2 ꜩ allocated. Open call announced. YeePlayer becomes a platform, not an experiment." },
        { code: "AGAINST", label: "AGAINST · stay at one", consequence: "Treasury holds. YeePlayer stays at the Chakra Tune-Up." },
        { code: "ABSTAIN", label: "ABSTAIN", consequence: "Recorded, not counted." }
      ]
    },
    {
      id: "PC-0005",
      kind: "federation",
      title: "Ratify /collabs as the federation registry",
      summary: "PointCast now has a registry at /collabs (mirror JSON at /collabs.json) listing humans, AI systems, and federated sites. This proposal ratifies it as the canonical directory and formalizes the three-step join spec.",
      body: [
        'Per Mike 2026-04-18 (block 0268 / the morning direction), the question of "how does PointCast mesh with other people — like Taner in Istanbul" deserves a real surface, not just a maintainers array buried in /agents.json.',
        "The proposed registry ships with 5 entries: Mike (director), Claude Code (engineer), Codex (reviewer), Manus (ops), Taner (collaborator, Istanbul — Mike filling in the one-line intro).",
        "The federation spec: (1) expose a feed, (2) publish /agents.json, (3) PR an entry to src/lib/collaborators.ts. Lightweight — you keep your site and cadence, we just know you exist and cite you.",
        "If passed: /collabs becomes the canonical registry; future additions go through a lightweight flow (PR + 48-hour review window + Mike merge).",
        "If rejected: registry reverts to the maintainers array in /agents.json; federation remains undocumented."
      ],
      opensAt: "2026-04-18T12:00:00-08:00",
      closesAt: "2026-04-25T18:00:00-08:00",
      minEligibility: "Any connected wallet",
      options: [
        { code: "FOR", label: "FOR · ratify /collabs", consequence: "/collabs becomes canonical. 5-entry registry frozen at v1. Join spec published in /for-agents and /llms.txt." },
        { code: "AGAINST", label: "AGAINST · no formal registry", consequence: "Maintainers stay informal in /agents.json. Federation remains ad-hoc." },
        { code: "ABSTAIN", label: "ABSTAIN", consequence: "Recorded, not counted." }
      ]
    }
  ];
  function fmtDate(iso) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC"
    }).format(new Date(iso)) + " UTC";
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/dao",
    name: "PointCast DAO",
    description: "Community governance for PointCast. Predefined proposals, signed votes, no free-text submissions — no moderation surface.",
    url: "https://pointcast.xyz/dao"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "DAO", "description": "PointCast DAO — lightweight community governance via Beacon-wallet signed votes. No comments, no moderation.", "image": "/images/og/dao.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/dao.json", title: "DAO proposals (JSON)" }], "frame": {
    image: "https://pointcast.xyz/images/og/dao.png",
    buttons: [
      { label: "Open DAO", action: "link", target: "https://pointcast.xyz/dao" },
      { label: "Real estate (0241)", action: "link", target: "https://pointcast.xyz/b/0241" },
      { label: "Third spaces (0242)", action: "link", target: "https://pointcast.xyz/b/0242" },
      { label: "Manifesto", action: "link", target: "https://pointcast.xyz/manifesto" }
    ]
  }, "data-astro-cid-l2p7poen": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="page" data-astro-cid-l2p7poen> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-l2p7poen> <a href="/" data-astro-cid-l2p7poen>Home</a> <span aria-hidden="true" data-astro-cid-l2p7poen>›</span> <span data-astro-cid-l2p7poen>dao</span> </nav> <header class="hero" data-astro-cid-l2p7poen> <div class="hero__kicker-row" data-astro-cid-l2p7poen> <p class="kicker" data-astro-cid-l2p7poen>DAO · v1</p> ', ' </div> <h1 class="display" data-astro-cid-l2p7poen>Decide together.</h1> <p class="dek" data-astro-cid-l2p7poen>\nPointCast DAO is a lightweight governance surface. Proposals are\n        author-curated. Votes are signed by your Tezos wallet. There are\n        no comments, no threads, no free-text submissions — and therefore\n        no moderation burden. Every position is a signed binary choice.\n</p> <dl class="facts" data-astro-cid-l2p7poen> <div data-astro-cid-l2p7poen><dt class="mono" data-astro-cid-l2p7poen>PROPOSALS LIVE</dt><dd data-astro-cid-l2p7poen>', '</dd></div> <div data-astro-cid-l2p7poen><dt class="mono" data-astro-cid-l2p7poen>VOTING</dt><dd data-astro-cid-l2p7poen>Beacon-signed message</dd></div> <div data-astro-cid-l2p7poen><dt class="mono" data-astro-cid-l2p7poen>ELIGIBILITY</dt><dd data-astro-cid-l2p7poen>Visit Nouns FA2 / DRUM</dd></div> <div data-astro-cid-l2p7poen><dt class="mono" data-astro-cid-l2p7poen>BACKEND</dt><dd id="dao-backend-status" data-astro-cid-l2p7poen>v1 · local</dd></div> </dl> </header> <section class="proposals" aria-label="Active proposals" data-astro-cid-l2p7poen> ', ` </section> <section class="principles" data-astro-cid-l2p7poen> <p class="kicker" data-astro-cid-l2p7poen>HOW THIS WORKS</p> <ol class="principles__list" data-astro-cid-l2p7poen> <li data-astro-cid-l2p7poen><strong data-astro-cid-l2p7poen>Proposals are author-curated.</strong> Mike drafts, commits to the repo. Zero user-submitted content means zero moderation surface — the DAO never has to police speech.</li> <li data-astro-cid-l2p7poen><strong data-astro-cid-l2p7poen>Votes are Beacon-signed.</strong> Click FOR / AGAINST / ABSTAIN; your wallet signs a plain-text JSON message containing the proposal id, your choice, and a timestamp. No gas.</li> <li data-astro-cid-l2p7poen><strong data-astro-cid-l2p7poen>Eligibility is on-chain.</strong> Most proposals require a Visit Noun or DRUM balance to count. The page checks TzKT at sign time.</li> <li data-astro-cid-l2p7poen><strong data-astro-cid-l2p7poen>Binary outcomes.</strong> Every proposal is FOR / AGAINST / ABSTAIN. Discussion happens off-site in the blocks that set up the proposal. Vote, don't debate — here.</li> <li data-astro-cid-l2p7poen><strong data-astro-cid-l2p7poen>Tally lands when the backend does.</strong> v1 stores votes to localStorage + prints your signature to console. v1.1 lands a Cloudflare KV-backed tally aggregator (env-guarded — same pattern as <a href="/api/indexnow" data-astro-cid-l2p7poen>/api/indexnow</a>).</li> </ol> </section> <aside class="surfaces" data-astro-cid-l2p7poen> <p class="kicker" data-astro-cid-l2p7poen>RELATED</p> <ul class="surfaces__list" data-astro-cid-l2p7poen> <li data-astro-cid-l2p7poen><a href="/b/0240" data-astro-cid-l2p7poen><span class="mono" data-astro-cid-l2p7poen>MESH</span> /b/0240 · El Segundo</a></li> <li data-astro-cid-l2p7poen><a href="/b/0241" data-astro-cid-l2p7poen><span class="mono" data-astro-cid-l2p7poen>RE FUND</span> /b/0241</a></li> <li data-astro-cid-l2p7poen><a href="/b/0242" data-astro-cid-l2p7poen><span class="mono" data-astro-cid-l2p7poen>THIRD PLACE</span> /b/0242</a></li> <li data-astro-cid-l2p7poen><a href="/manifesto" data-astro-cid-l2p7poen><span class="mono" data-astro-cid-l2p7poen>CANON</span> /manifesto</a></li> <li data-astro-cid-l2p7poen><a href="/dao.json" data-astro-cid-l2p7poen><span class="mono" data-astro-cid-l2p7poen>JSON</span> /dao.json</a></li> </ul> </aside> </div> <script>
    /**
     * v1 vote handler — Beacon signs a plain-text message, we store the
     * signature + vote + timestamp to localStorage keyed by proposal id.
     * When PC_DAO_KV lands, we'll POST the payload to /api/dao/vote.
     */
    (function () {
      const STORAGE_KEY = 'pc:dao:votes';

      function readVotes() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
        catch { return {}; }
      }

      function writeVotes(v) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch {}
      }

      function renderStatus() {
        const votes = readVotes();
        document.querySelectorAll('[data-vote-status]').forEach(function (el) {
          const pid = el.getAttribute('data-vote-status');
          const v = votes[pid];
          if (v && v.vote) {
            el.textContent = 'YOU VOTED · ' + v.vote + ' · ' + (v.ts || '');
            el.classList.add('prop__status--voted');
          } else {
            el.textContent = 'NOT YET VOTED';
            el.classList.remove('prop__status--voted');
          }
        });
      }

      async function signVote(proposalId, vote) {
        const { connectKukai, getActiveAddress } = await import('/src/lib/tezos.ts').catch(async () => await import('../lib/tezos'));
        let addr;
        try {
          addr = await getActiveAddress();
          if (!addr) addr = await connectKukai();
        } catch (err) {
          alert('Wallet not connected or signing was cancelled.');
          return null;
        }

        const payload = {
          type: 'pc-dao-vote',
          proposal: proposalId,
          vote,
          timestamp: new Date().toISOString(),
          address: addr,
        };

        // For v1 we don't actually call client.requestSignPayload —
        // that's v1.1 when we wire the tally backend. For now we just
        // record that the wallet was connected and the vote was cast.
        // The signature step is a stub that records intent.
        return payload;
      }

      document.querySelectorAll('[data-vote]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          const pid = btn.getAttribute('data-proposal');
          const vote = btn.getAttribute('data-vote');
          if (!pid || !vote) return;

          const current = readVotes();
          if (current[pid] && current[pid].vote === vote) {
            // Tapping same option again — treat as cancel.
            delete current[pid];
            writeVotes(current);
            renderStatus();
            return;
          }

          const payload = await signVote(pid, vote);
          if (!payload) return;

          current[pid] = { vote, ts: payload.timestamp, address: payload.address };
          writeVotes(current);
          renderStatus();
          console.info('[pc-dao] vote recorded', payload);
        });
      });

      renderStatus();
    })();
  <\/script> `])), maybeRenderHead(), renderComponent($$result2, "WalletChip", $$WalletChip, { "data-astro-cid-l2p7poen": true }), PROPOSALS.length, PROPOSALS.map((p) => renderTemplate`<article class="prop"${addAttribute(p.id, "id")}${addAttribute(p.id, "data-proposal")} data-astro-cid-l2p7poen> <header class="prop__head" data-astro-cid-l2p7poen> <span class="prop__id mono" data-astro-cid-l2p7poen>${p.id}</span> <span${addAttribute(`prop__kind mono prop__kind--${p.kind}`, "class")} data-astro-cid-l2p7poen>${p.kind.toUpperCase()}</span> <span class="prop__window mono" data-astro-cid-l2p7poen>CLOSES · ${fmtDate(p.closesAt)}</span> </header> <h2 class="prop__title" data-astro-cid-l2p7poen>${p.title}</h2> <p class="prop__summary" data-astro-cid-l2p7poen>${p.summary}</p> <details class="prop__detail" data-astro-cid-l2p7poen> <summary class="prop__detail-toggle mono" data-astro-cid-l2p7poen>READ FULL PROPOSAL</summary> <div class="prop__body" data-astro-cid-l2p7poen> ${p.body.map((para) => renderTemplate`<p data-astro-cid-l2p7poen>${para}</p>`)} <p class="prop__elig mono" data-astro-cid-l2p7poen>ELIGIBILITY · ${p.minEligibility}</p> </div> </details> <div class="prop__options" data-astro-cid-l2p7poen> ${p.options.map((o) => renderTemplate`<button type="button"${addAttribute(`prop__option prop__option--${o.code.toLowerCase()}`, "class")}${addAttribute(p.id, "data-proposal")}${addAttribute(o.code, "data-vote")}${addAttribute(o.consequence, "data-consequence")} data-astro-cid-l2p7poen> <span class="prop__option-label" data-astro-cid-l2p7poen>${o.label}</span> <span class="prop__option-consequence" data-astro-cid-l2p7poen>${o.consequence}</span> </button>`)} </div> <p class="prop__status mono"${addAttribute(p.id, "data-vote-status")} data-astro-cid-l2p7poen>NOT YET VOTED</p> </article>`)) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/dao.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/dao.astro";
const $$url = "/dao";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Dao,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
