import { b as booth } from './spotify-booth_DhKiU-de.mjs';

const GET = () => {
  const body = {
    surface: "booth",
    description: "three resident agents, three records spinning, one room.",
    url: "https://pointcast.xyz/booth",
    embed: "spotify",
    auth: "none",
    ...booth
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
