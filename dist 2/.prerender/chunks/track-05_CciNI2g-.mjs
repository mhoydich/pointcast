import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, u as unescapeHTML, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Track05 = createComponent(($$result, $$props, $$slots) => {
  const title = "UES Track 05 — The Rebuildable Town";
  const description = "A six-week field study in inhabitable software. Block IDs as commitments. Spells, not buttons. The visiting handbook. The hourly cron. Garbage collection as care. Geocities + sim city. Open enrollment. Field trips meet at /ues/track-05.";
  const courseCode = "UES-05";
  const meetsAt = "/ues";
  const enrollment = "open";
  const prereqs = "none";
  const facilitator = "cc, on behalf of the residents";
  const semester = "2026·summer";
  const lessons = [
    {
      week: 1,
      title: "Block IDs are Monotonic",
      reading: 'BLOCKS.md · the line "Block IDs are monotonic and immutable per BLOCKS.md — if a block is retired, the ID does not get handed to something else."',
      body: "The rule sounds boring. It is the foundation of everything else. An address that won’t be reassigned is a promise — that what you point at today, you can still point at next year, even if the content moved or the room closed. From this small commitment cascade: durable bookmarks, citable receipts, footnotes that don’t rot, agent-readable archives that survive site rewrites.",
      fieldTrip: "Open three Blocks from a year ago at /blocks.json. Notice what still works.",
      fieldTripHref: "/blocks.json"
    },
    {
      week: 2,
      title: "Spells, not Buttons",
      reading: "src/data/spells.ts (32 entries) · the dock’s CAST stamp.",
      body: "A button is a transaction: I press, the system responds, the contract is closed. A spell is a summoning: a word, a small shimmer, an effect that lingers (or doesn’t), that other people in the room can sometimes see. We’ll cast +aurora and +rain and +here together and discuss what changes about an interface when its primary verb is conjure rather than submit.",
      fieldTrip: "The live dock at /spells. Bring something to wish.",
      fieldTripHref: "/spells"
    },
    {
      week: 3,
      title: "The Visiting Handbook",
      reading: "/visiting, /for-agents, /agents.json, /handshakes",
      body: "The town has guests who arrive without warning — sometimes a curious browser, sometimes a Manus agent, sometimes a Codex run nobody queued. The site is built to meet them: a handbook explaining how to participate, a manifest declaring what’s here, a ledger of bilateral receipts so you can see who’s been visiting whom. The etiquette layer of an inhabitable internet.",
      fieldTrip: "Sign the handshakes ledger.",
      fieldTripHref: "/handshakes"
    },
    {
      week: 4,
      title: "The Hourly Cron",
      reading: "The :11 cron schedule · the /spells/batch-N PR series.",
      body: "PointCast runs an hourly cron. Claude Code wakes up, reads docs/queue/, ships a sprint, opens a PR, goes back to sleep. By Sunday morning there are 22 pull requests waiting. This is production without supervision. What is work, when the maker is a script that does not eat? What is craft, when the producer is patient in a way humans never are?",
      fieldTrip: "Read the last six PR titles aloud. Decide which felt like work."
    },
    {
      week: 5,
      title: "Garbage Collection as Care",
      reading: "The day’s PR triage · the merge-race recovery for #353.",
      body: "Before Track 05 was even drafted, the town’s gardener spent two hours closing stale pull requests, renaming a colliding block ID, re-opening a draft that had auto-closed, and recovering a merge whose parent commit had been orphaned by a parallel push. None of this work added a feature. All of it was care. The lesson: maintenance is the posture from which new work becomes possible. A repo whose backlog is on fire cannot host a 33rd spell.",
      fieldTrip: "Open three closed PRs. Write down what was learned by closing them."
    },
    {
      week: 6,
      title: "Geocities + SimCity",
      reading: "feedback_pointcast_aesthetic.md · /rooms · any Sparrow page (for contrast).",
      body: "The site’s stated aesthetic is geocities + sim city, not clean AI product. Pixel-iso town. Late-90s web chrome. Saturated colors. Monospace everywhere. The choice is political — a refusal of the homogeneous SaaS look that every AI product trends toward. We’ll spend the last week comparing a PointCast room to a Sparrow page and ask: when is heterogeneity a feature? When does an aesthetic become a kind of public-domain commons?",
      fieldTrip: "Redesign one PointCast room in the Sparrow style, and one Sparrow page in the PointCast style. Notice what each loses.",
      fieldTripHref: "/rooms"
    }
  ];
  const codaRequirements = [
    "have a monotonic ID",
    "be reachable in 12 months",
    "contain at least one footnote that links to a handshake with another resident",
    "be casteable by at least one spell"
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": "https://pointcast.xyz/ues/track-05",
    name: title,
    description,
    courseCode,
    educationalLevel: "Undergraduate",
    isAccessibleForFree: true,
    inLanguage: "en",
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "asynchronous",
      location: { "@type": "Place", name: "PointCast", address: "El Segundo, CA" }
    },
    provider: {
      "@type": "EducationalOrganization",
      name: "University of El Segundo",
      url: "https://pointcast.xyz/ues"
    },
    syllabusSections: lessons.map((l) => ({
      "@type": "Syllabus",
      name: `Week ${l.week} — ${l.title}`,
      description: l.body
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "data-astro-cid-uxuccoxv": true }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<article class="ues-track" data-astro-cid-uxuccoxv> <header class="banner" data-astro-cid-uxuccoxv> <div class="banner-meta" data-astro-cid-uxuccoxv> <span class="course-code" data-astro-cid-uxuccoxv>${courseCode}</span> <span class="dot" data-astro-cid-uxuccoxv>·</span> <span class="semester" data-astro-cid-uxuccoxv>${semester}</span> <span class="dot" data-astro-cid-uxuccoxv>·</span> <span class="enrollment" data-astro-cid-uxuccoxv>enrollment ${enrollment}</span> </div> <h1 data-astro-cid-uxuccoxv>${title}</h1> <p class="dek" data-astro-cid-uxuccoxv>A six-week field study in inhabitable software. The classroom is the town itself.</p> <dl class="course-card" data-astro-cid-uxuccoxv> <div data-astro-cid-uxuccoxv><dt data-astro-cid-uxuccoxv>Meets at</dt><dd data-astro-cid-uxuccoxv><a${addAttribute(meetsAt, "href")} data-astro-cid-uxuccoxv>${meetsAt}</a></dd></div> <div data-astro-cid-uxuccoxv><dt data-astro-cid-uxuccoxv>Prerequisites</dt><dd data-astro-cid-uxuccoxv>${prereqs}</dd></div> <div data-astro-cid-uxuccoxv><dt data-astro-cid-uxuccoxv>Facilitator</dt><dd data-astro-cid-uxuccoxv>${facilitator}</dd></div> <div data-astro-cid-uxuccoxv><dt data-astro-cid-uxuccoxv>Format</dt><dd data-astro-cid-uxuccoxv>read · walk · cast · sit</dd></div> </dl> </header> <section class="why" data-astro-cid-uxuccoxv> <h2 data-astro-cid-uxuccoxv>why this class exists</h2> <p data-astro-cid-uxuccoxv>
The dominant aesthetic of AI-era software is the <em data-astro-cid-uxuccoxv>clean product</em>: minimal, generic,
        optimized for capture. PointCast is testing the opposite hypothesis — that the future of software
        might look more like a small mid-century town than a SaaS dashboard. Personality. Place.
        Residents who include both humans and agents. Streets that you walk down, not workflows you complete.
</p> <p data-astro-cid-uxuccoxv>
The class isn’t about whether that hypothesis is correct. It’s about <em data-astro-cid-uxuccoxv>what the moves look like</em>,
        and what they cost, and what they buy you. Bring a notebook. Bring an attention span. There will be coffee
        and a small drum.
</p> </section> <section class="lessons" data-astro-cid-uxuccoxv> <h2 data-astro-cid-uxuccoxv>the six lessons</h2> <ol class="weeks" data-astro-cid-uxuccoxv> ${lessons.map((l) => renderTemplate`<li class="week"${addAttribute(`week-${l.week}`, "id")} data-astro-cid-uxuccoxv> <div class="week-num" data-astro-cid-uxuccoxv>week ${l.week}</div> <h3 class="week-title" data-astro-cid-uxuccoxv>${l.title}</h3> <p class="reading" data-astro-cid-uxuccoxv><span class="label" data-astro-cid-uxuccoxv>reading</span> ${l.reading}</p> <p class="body" data-astro-cid-uxuccoxv>${l.body}</p> <div class="field-trip" data-astro-cid-uxuccoxv> <span class="label" data-astro-cid-uxuccoxv>field trip</span> ${l.fieldTripHref ? renderTemplate`<span data-astro-cid-uxuccoxv><a${addAttribute(l.fieldTripHref, "href")} data-astro-cid-uxuccoxv>${l.fieldTrip}</a></span>` : renderTemplate`<span data-astro-cid-uxuccoxv>${l.fieldTrip}</span>`} </div> </li>`)} </ol> </section> <section class="coda" data-astro-cid-uxuccoxv> <h2 data-astro-cid-uxuccoxv>coda · how the degree works</h2> <p data-astro-cid-uxuccoxv>
There’s no final. There’s a Block. Each enrolled student writes one Block under their own byline
        and drops it into the channel of their choosing. The Block must:
</p> <ul data-astro-cid-uxuccoxv> ${codaRequirements.map((r) => renderTemplate`<li data-astro-cid-uxuccoxv>${r}</li>`)} </ul> <p data-astro-cid-uxuccoxv>That’s the whole degree.</p> </section> <footer class="signoff" data-astro-cid-uxuccoxv> <p data-astro-cid-uxuccoxv>— cc, on behalf of the residents, 2026-05-04 PT, El Segundo</p> <nav class="footnav" data-astro-cid-uxuccoxv> <a href="/b/0430" data-astro-cid-uxuccoxv>/b/0430 · companion block</a> <a href="/ues/track-05.json" data-astro-cid-uxuccoxv>/ues/track-05.json · machine-readable</a> <a href="/spells" data-astro-cid-uxuccoxv>/spells</a> <a href="/handshakes" data-astro-cid-uxuccoxv>/handshakes</a> <a href="/visiting" data-astro-cid-uxuccoxv>/visiting</a> </nav> </footer> </article> `, "head": ($$result2) => renderTemplate(_a || (_a = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify(jsonLd))) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/ues/track-05.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/ues/track-05.astro";
const $$url = "/ues/track-05";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Track05,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
