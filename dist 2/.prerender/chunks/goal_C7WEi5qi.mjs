import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Goal = createComponent(async ($$result, $$props, $$slots) => {
  const goals = [
    {
      id: "watch",
      label: "Watch",
      title: "Make one result understandable in 30 seconds.",
      copy: "Turn a score into a field, show the shape, explain the setup, and let the Nouns battle carry the energy.",
      proof: "Viewer can say the source result, field shape, and why this match feels like the game.",
      noun: 12
    },
    {
      id: "share",
      label: "Share",
      title: "Create one copyable alt-broadcast artifact.",
      copy: "Package the result as a short receipt, invite, sponsor read, poster prompt, or group-chat recap.",
      proof: "One person can paste the artifact without editing out official-data, betting, prediction, or payout claims.",
      noun: 33
    },
    {
      id: "agent",
      label: "Agent",
      title: "Give a visiting agent a useful job.",
      copy: "Ask an agent to write headlines, proof notes, poster ideas, and watch copy from the generated kit.",
      proof: "The agent output has source result, shape, guardrail, and one concrete next action.",
      noun: 48
    },
    {
      id: "sponsor",
      label: "Sponsor",
      title: "Frame a no-money-yet sponsor package.",
      copy: "Route the reenactment into a reservation-only media package: field naming, read, clip, poster, or bounty.",
      proof: "The package says reservation intent only and requires human acceptance before any credit routing.",
      noun: 56
    }
  ];
  const shapes = [
    { id: "close", label: "Close", field: "Windy kingdom rush", modifier: "small survivor gap and late-lane gust" },
    { id: "comeback", label: "Comeback", field: "Garden comeback field", modifier: "morale dip, then scheduled surge" },
    { id: "blowout", label: "Blowout", field: "Lava lane rout", modifier: "formation advantage and hot-lane pressure" },
    { id: "upset", label: "Upset", field: "Auction floor upset", modifier: "belief spike and faster special clock" },
    { id: "overtime", label: "Overtime", field: "Rift overtime field", modifier: "sudden-death pressure and high damage" }
  ];
  const agentLanes = [
    {
      label: "Claude Code lane",
      task: "Inspect route/link/build health and propose one fix before publish.",
      output: "ROUTE REVIEW: checked URLs, one issue or none, one recommended fix."
    },
    {
      label: "Creative agent lane",
      task: "Generate headline, poster concept, clip caption, and watch CTA.",
      output: "CREATIVE DROP: headline, caption, visual prompt, CTA."
    },
    {
      label: "Sponsor agent lane",
      task: "Generate a reservation-only sponsor read with proof and human approval language.",
      output: "SPONSOR READ: surface, line, proof, guardrail."
    },
    {
      label: "QA agent lane",
      task: "Check guardrails, URLs, no official/betting claims, and mobile clarity.",
      output: "QA GUARDRAIL: pass/fail, exact text risk, top fix."
    }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Nouns Sports Reenactment Mission Control",
    description: "A goal-oriented control room for turning a sports result into a Nouns Nation Battler reenactment, share artifact, and agent task pack.",
    url: "https://pointcast.xyz/nouns-nation-sports-reenactment/goal/",
    step: [
      "Pick a goal.",
      "Choose a result shape.",
      "Confirm or type the source result.",
      "Copy the generated host, agent, share, and proof artifacts.",
      "Launch the Battle Desk reenactment and keep the guardrail visible."
    ].map((name, index) => ({ "@type": "HowToStep", position: index + 1, name }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Sports Reenactment Mission Control", "description": "A goal-first control room for turning one sports result into a watchable Nouns reenactment, copyable artifact, and parallel agent task pack.", "image": "/images/og/nouns-battler-live.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/nouns-nation-battler.json", title: "Nouns Nation Battler manifest" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/nouns-battler-live.png",
    buttons: [
      { label: "Mission Control", action: "link", target: "https://pointcast.xyz/nouns-nation-sports-reenactment/goal/" },
      { label: "Reenactment", action: "link", target: "https://pointcast.xyz/nouns-nation-sports-reenactment/" },
      { label: "Battle Desk", action: "link", target: "https://pointcast.xyz/nouns-nation-battler/" },
      { label: "Mobile Cast", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-mobile/" }
    ]
  }, "data-astro-cid-dc2z3a53": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="mission-room" data-mission-control data-astro-cid-dc2z3a53> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-dc2z3a53> <a href="/" data-astro-cid-dc2z3a53>Home</a> <span aria-hidden="true" data-astro-cid-dc2z3a53>/</span> <a href="/nouns-nation-sports-reenactment/" data-astro-cid-dc2z3a53>Sports Reenactment</a> <span aria-hidden="true" data-astro-cid-dc2z3a53>/</span> <span data-astro-cid-dc2z3a53>Mission Control</span> </nav> <section class="hero" aria-labelledby="mission-title" data-astro-cid-dc2z3a53> <div class="hero__copy" data-astro-cid-dc2z3a53> <p class="kicker" data-astro-cid-dc2z3a53>CH.BTL / MISSION CONTROL</p> <h1 id="mission-title" data-astro-cid-dc2z3a53>Choose the job before the battle starts.</h1> <p data-astro-cid-dc2z3a53>
Pick a goal, pick a result shape, and leave with the host read, agent handoff,
          share receipt, proof checklist, and launch link. This stays local-first and
          informational: no official feed, no odds, no betting, no forced outcome.
</p> <div class="hero-actions" data-astro-cid-dc2z3a53> <a class="primary" data-mission-launch href="/nouns-nation-battler/#mode=desk&reenact=close" data-astro-cid-dc2z3a53>Launch Battle Desk</a> <a href="/nouns-nation-sports-reenactment/" data-astro-cid-dc2z3a53>Reenactment Site</a> </div> </div> <aside aria-label="Generated mission summary" data-astro-cid-dc2z3a53> <span data-mission-field="goalLabel" data-astro-cid-dc2z3a53>Watch</span> <strong data-mission-field="headline" data-astro-cid-dc2z3a53>Celtics 112, Knicks 109 becomes a Windy kingdom rush mission.</strong> <p data-mission-field="summary" data-astro-cid-dc2z3a53>Host a close-finish Nouns reenactment and help viewers understand the game shape in 30 seconds.</p> </aside> </section> <section class="control-panel" aria-labelledby="control-title" data-astro-cid-dc2z3a53> <div class="section-head" data-astro-cid-dc2z3a53> <p class="kicker" data-astro-cid-dc2z3a53>Control Panel</p> <h2 id="control-title" data-astro-cid-dc2z3a53>Tune the reenactment package.</h2> </div> <div class="controls" data-astro-cid-dc2z3a53> <fieldset data-astro-cid-dc2z3a53> <legend data-astro-cid-dc2z3a53>Goal</legend> <div class="button-grid" data-astro-cid-dc2z3a53> ${goals.map((goal, index) => renderTemplate`<button type="button"${addAttribute(index === 0 ? "is-active" : "", "class")}${addAttribute(goal.id, "data-goal-option")}${addAttribute(goal.label, "data-label")}${addAttribute(goal.title, "data-title")}${addAttribute(goal.copy, "data-copy")}${addAttribute(goal.proof, "data-proof")} data-astro-cid-dc2z3a53> <span data-astro-cid-dc2z3a53>${goal.label}</span> <strong data-astro-cid-dc2z3a53>${goal.title}</strong> </button>`)} </div> </fieldset> <fieldset data-astro-cid-dc2z3a53> <legend data-astro-cid-dc2z3a53>Shape</legend> <div class="button-grid button-grid--shape" data-astro-cid-dc2z3a53> ${shapes.map((shape, index) => renderTemplate`<button type="button"${addAttribute(index === 0 ? "is-active" : "", "class")}${addAttribute(shape.id, "data-shape-option")}${addAttribute(shape.label, "data-label")}${addAttribute(shape.field, "data-field")}${addAttribute(shape.modifier, "data-modifier")} data-astro-cid-dc2z3a53> <span data-astro-cid-dc2z3a53>${shape.label}</span> <strong data-astro-cid-dc2z3a53>${shape.field}</strong> </button>`)} </div> </fieldset> <fieldset class="result-fields" data-astro-cid-dc2z3a53> <legend data-astro-cid-dc2z3a53>Source Result</legend> <label data-astro-cid-dc2z3a53>League <input data-result-league value="NBA" data-astro-cid-dc2z3a53></label> <label data-astro-cid-dc2z3a53>Winner <input data-result-winner value="Celtics" data-astro-cid-dc2z3a53></label> <label data-astro-cid-dc2z3a53>Loser <input data-result-loser value="Knicks" data-astro-cid-dc2z3a53></label> <label data-astro-cid-dc2z3a53>Score <input data-result-score value="112-109" data-astro-cid-dc2z3a53></label> </fieldset> </div> </section> <section class="artifacts" aria-labelledby="artifacts-title" data-astro-cid-dc2z3a53> <div class="section-head" data-astro-cid-dc2z3a53> <p class="kicker" data-astro-cid-dc2z3a53>Generated Package</p> <h2 id="artifacts-title" data-astro-cid-dc2z3a53>Copy the exact artifact for the next agent or human.</h2> </div> <div class="artifact-grid" data-astro-cid-dc2z3a53> <article data-astro-cid-dc2z3a53> <span data-astro-cid-dc2z3a53>Host Rundown</span> <textarea data-artifact="host" readonly data-astro-cid-dc2z3a53></textarea> <button type="button" data-copy-artifact="host" data-astro-cid-dc2z3a53>Copy host</button> </article> <article data-astro-cid-dc2z3a53> <span data-astro-cid-dc2z3a53>Agent Task</span> <textarea data-artifact="agent" readonly data-astro-cid-dc2z3a53></textarea> <button type="button" data-copy-artifact="agent" data-astro-cid-dc2z3a53>Copy agent</button> </article> <article data-astro-cid-dc2z3a53> <span data-astro-cid-dc2z3a53>Share Receipt</span> <textarea data-artifact="share" readonly data-astro-cid-dc2z3a53></textarea> <button type="button" data-copy-artifact="share" data-astro-cid-dc2z3a53>Copy receipt</button> </article> <article data-astro-cid-dc2z3a53> <span data-astro-cid-dc2z3a53>Proof Checklist</span> <textarea data-artifact="proof" readonly data-astro-cid-dc2z3a53></textarea> <button type="button" data-copy-artifact="proof" data-astro-cid-dc2z3a53>Copy proof</button> </article> </div> </section> <section class="parallel" aria-labelledby="parallel-title" data-astro-cid-dc2z3a53> <div class="section-head" data-astro-cid-dc2z3a53> <p class="kicker" data-astro-cid-dc2z3a53>Parallel Agent Initiative</p> <h2 id="parallel-title" data-astro-cid-dc2z3a53>Four lanes for Claude Code and visiting agents.</h2> </div> <div class="lane-grid" data-astro-cid-dc2z3a53> ${agentLanes.map((lane) => renderTemplate`<article data-astro-cid-dc2z3a53> <strong data-astro-cid-dc2z3a53>${lane.label}</strong> <p data-astro-cid-dc2z3a53>${lane.task}</p> <em data-astro-cid-dc2z3a53>${lane.output}</em> </article>`)} </div> </section> <section class="guardrails" aria-labelledby="guardrails-title" data-astro-cid-dc2z3a53> <div data-astro-cid-dc2z3a53> <p class="kicker" data-astro-cid-dc2z3a53>Guardrails</p> <h2 id="guardrails-title" data-astro-cid-dc2z3a53>Weird sports, clean claims.</h2> </div> <ul data-astro-cid-dc2z3a53> <li data-astro-cid-dc2z3a53>User-entered result only; no live sports API claim.</li> <li data-astro-cid-dc2z3a53>Informational Nouns reenactment, not official replay.</li> <li data-astro-cid-dc2z3a53>No odds, betting, investment, payout, prediction, or forced outcome language.</li> <li data-astro-cid-dc2z3a53>Human approval is required before sponsor or participant-credit routing.</li> </ul> </section> </main> ${renderScript($$result2, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-sports-reenactment/goal.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-sports-reenactment/goal.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-sports-reenactment/goal.astro";
const $$url = "/nouns-nation-sports-reenactment/goal";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Goal,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
