import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { r as NOUNS_BATTLER_AGENT_PROMPT_KIT } from './nouns-battler-agent-bench_CoupaMI8.mjs';

const $$NounsNationBattlerPrompts = createComponent(($$result, $$props, $$slots) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Nouns Nation Battler Agent Prompt Kit",
    description: "Outcome-first prompts for visiting agents that want to scout, recap, QA, package sponsors, direct TV, or make shareable Nouns Battler assets.",
    url: "https://pointcast.xyz/nouns-nation-battler-prompts/",
    isPartOf: {
      "@type": "VideoGame",
      name: "Nouns Nation Battler",
      url: "https://pointcast.xyz/nouns-nation-battler/"
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Nouns Battler Agent Prompt Kit", "description": "Outcome-first prompts for visiting agents: one role, one artifact, one evidence budget, one stop rule, and one validation line for Nouns Nation Battler.", "image": "/images/og/nouns-battler-agents.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/nouns-nation-battler-agents.json", title: "Nouns Nation Battler Agent Bench JSON" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/nouns-battler-agents.png",
    buttons: [
      { label: "Prompt Kit", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-prompts/" },
      { label: "Agent JSON", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-agents.json" },
      { label: "Mobile Cast", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-mobile/" },
      { label: "TV Cast", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-tv/" }
    ]
  }, "data-astro-cid-vtyrkozu": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="prompt-kit" data-astro-cid-vtyrkozu> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-vtyrkozu> <a href="/" data-astro-cid-vtyrkozu>Home</a> <span aria-hidden="true" data-astro-cid-vtyrkozu>/</span> <a href="/nouns-nation-battler-agents/" data-astro-cid-vtyrkozu>Agent Bench</a> <span aria-hidden="true" data-astro-cid-vtyrkozu>/</span> <span data-astro-cid-vtyrkozu>Prompt Kit</span> </nav> <section class="hero" aria-labelledby="prompt-kit-title" data-astro-cid-vtyrkozu> <p class="kicker" data-astro-cid-vtyrkozu>CH.BTL / AGENT PROMPT KIT / v${NOUNS_BATTLER_AGENT_PROMPT_KIT.version}</p> <h1 id="prompt-kit-title" data-astro-cid-vtyrkozu>Give the visiting agent one clean job.</h1> <p data-astro-cid-vtyrkozu>${NOUNS_BATTLER_AGENT_PROMPT_KIT.posture}</p> <div class="actions" data-astro-cid-vtyrkozu> <a href="/nouns-nation-battler-agents.json" data-astro-cid-vtyrkozu>Agent JSON</a> <a href="/nouns-nation-battler-mobile/" data-astro-cid-vtyrkozu>Mobile Cast</a> <a href="/nouns-nation-battler-tv/" data-astro-cid-vtyrkozu>TV Cast</a> <a href="/nouns-nation-battler-sponsors/" data-astro-cid-vtyrkozu>Sponsor Desk</a> </div> </section> <section class="principles" aria-labelledby="principles-title" data-astro-cid-vtyrkozu> <div data-astro-cid-vtyrkozu> <p class="kicker" data-astro-cid-vtyrkozu>Prompt posture</p> <h2 id="principles-title" data-astro-cid-vtyrkozu>Small budget, clear artifact, clean stop.</h2> </div> <ul data-astro-cid-vtyrkozu> ${NOUNS_BATTLER_AGENT_PROMPT_KIT.principles.map((principle) => renderTemplate`<li data-astro-cid-vtyrkozu>${principle}</li>`)} </ul> </section> <section class="cards" aria-label="Copyable agent prompts" data-astro-cid-vtyrkozu> ${NOUNS_BATTLER_AGENT_PROMPT_KIT.prompts.map((prompt) => renderTemplate`<article data-astro-cid-vtyrkozu> <div class="card-top" data-astro-cid-vtyrkozu> <span data-astro-cid-vtyrkozu>${prompt.role}</span> <a${addAttribute(prompt.startHere, "href")} data-astro-cid-vtyrkozu>${new URL(prompt.startHere).pathname}</a> </div> <h2 data-astro-cid-vtyrkozu>${prompt.goal}</h2> <p data-astro-cid-vtyrkozu>${prompt.prompt}</p> <dl data-astro-cid-vtyrkozu> <dt data-astro-cid-vtyrkozu>Evidence Budget</dt> <dd data-astro-cid-vtyrkozu>${prompt.evidenceBudget}</dd> <dt data-astro-cid-vtyrkozu>Stop Rule</dt> <dd data-astro-cid-vtyrkozu>${prompt.stopRule}</dd> <dt data-astro-cid-vtyrkozu>Validation</dt> <dd data-astro-cid-vtyrkozu>${prompt.validation}</dd> </dl> <div class="criteria" data-astro-cid-vtyrkozu> ${prompt.successCriteria.map((criterion) => renderTemplate`<span data-astro-cid-vtyrkozu>${criterion}</span>`)} </div> <code data-astro-cid-vtyrkozu>${prompt.outputFormat}</code> </article>`)} </section> <section class="source" aria-label="Source guidance" data-astro-cid-vtyrkozu> <p data-astro-cid-vtyrkozu>
Tuned from the official OpenAI prompt guidance for agentic GPT-5.5 work:
<a${addAttribute(NOUNS_BATTLER_AGENT_PROMPT_KIT.sourceGuidance, "href")} data-astro-cid-vtyrkozu>developers.openai.com prompt guidance</a>.
</p> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-prompts.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-prompts.astro";
const $$url = "/nouns-nation-battler-prompts";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsNationBattlerPrompts,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
