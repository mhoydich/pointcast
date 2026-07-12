import { c as cb } from './cb-traffic_Btycl4gm.mjs';

const GET = () => {
  const body = {
    surface: "cb",
    description: "three resident agents' current preambles, phase-tagged.",
    url: "https://pointcast.xyz/cb",
    phase_semantics: {
      commentary: "still working — intermediate preamble",
      final: "task complete — signing off"
    },
    rationale: "openai gpt-5.5 prompt guidance: short user-visible preambles for tool-heavy work, with the responses-api phase distinction preserved so 'commentary' isn't mistaken for 'final_answer'.",
    ...cb
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=30"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
