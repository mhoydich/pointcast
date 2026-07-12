const starters = [
  {
    hex: "82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2",
    alias: "jack",
    note: "jack dorsey · writes about Nostr + payments"
  },
  {
    hex: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
    alias: "fiatjaf",
    note: "fiatjaf · Nostr protocol author"
  }
  // Edit in place to curate. Adding a line ships a new federation.json.
  // No code change needed in friends.astro.
];
const GET = async () => {
  const body = {
    schema: "sparrow-federation-v1",
    version: "0.32",
    curated_at: "2026-04-21",
    curator: "pointcast.xyz editorial",
    docs: "https://pointcast.xyz/sparrow.json · nostr.federation_json",
    starters,
    notes: {
      scope: "Starter seeds are suggestions — following them is one click, unfollowing is one click. Not a bootstrap list, not a whitelist.",
      caveat: "Aliases here are editorial labels. Once a starter is followed, Sparrow's NIP-01 kind-0 lookup takes over and the alias can be replaced by the subject's own display_name.",
      editing: "Want your pubkey added? Open an issue / PR on the pointcast.xyz repo or ping via /api/ping."
    }
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=900",
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
