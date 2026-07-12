import { i as buildPointcastPetsManifest } from './pets_B2SFpmWd.mjs';

const GET = async () => {
  const manifest = buildPointcastPetsManifest();
  const payload = {
    ...manifest,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    entrypoints: {
      html: "https://pointcast.xyz/pets",
      json: "https://pointcast.xyz/pets.json",
      sitePet: "https://pointcast.xyz/pet",
      sitePetNamePoll: "https://pointcast.xyz/poll/site-pet-name",
      sitePetNamePollApi: "https://pointcast.xyz/api/poll?slug=site-pet-name",
      playLayer: "https://pointcast.xyz/play.json",
      zenCats: "https://pointcast.xyz/zen-cats",
      zenCatsJson: "https://pointcast.xyz/zen-cats.json"
    },
    agentProtocol: {
      planStatus: "Use phases and queue as the source of truth for what exists, what is queued, and what is gated.",
      localState: "Pet state is browser-local. Do not claim a visitor has completed care actions unless that visitor supplies localStorage-derived state.",
      namePoll: "The site pet name poll is public at /poll/site-pet-name, but the result is not a canonical pet name until reviewed and accepted.",
      mintLanguage: "Describe pets as local-first unless a roster item has a live dedicated contract. Zen Cats are Tezos-ready, not mint-live until PCCAT has a KT1 address."
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
