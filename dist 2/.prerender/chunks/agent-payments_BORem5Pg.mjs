import { M as MANIFEST_FIELDS, S as SIGNING_ALG, a as SPEC_VERSION } from './agent-signing_CUlIm4Ga.mjs';

const GET = async () => {
  const body = {
    spec: SPEC_VERSION,
    spec_url: "https://github.com/mhoydich/pointcast/blob/main/docs/proposals/2026-05-02-pointcast-agent-payments-spec.md",
    generated_at: (/* @__PURE__ */ new Date()).toISOString(),
    issuer: {
      name: "PointCast",
      url: "https://pointcast.xyz",
      operator: "Mike Hoydich",
      operator_handle: "mike",
      operator_kind: "human"
    },
    endpoints: {
      receipts: "/money.json",
      receipts_human: "/money",
      treasury: "/treasury.json",
      treasury_human: "/treasury",
      identities: "/data/agent-identities.json",
      // Verifier is templated per block id; agents substitute {block_id}.
      verifier_template: "/api/verify/spend/{block_id}.json",
      block_template: "/b/{block_id}/",
      block_json_template: "/b/{block_id}.json",
      spec_doc: "/docs/proposals/2026-05-02-pointcast-agent-payments-spec.md"
    },
    signing: {
      algorithm: SIGNING_ALG,
      key_format: "raw-base64-32-bytes-for-public; pkcs8-pem-for-private",
      key_size_bytes: 32,
      manifest_fields: MANIFEST_FIELDS,
      manifest_binding_fields: ["block_id", "block_timestamp", "spec"],
      manifest_excluded_operational: ["card_last4", "card_brand", "card_valid_until", "approval_url", "receipt_url", "context"],
      canonical_form: "JSON with alphabetically sorted keys, newline-terminated, UTF-8"
    },
    identity: {
      format: "pcr_<8-or-more-char-base32-lowercase>",
      kinds: ["agent", "human", "treasury", "external"],
      lookup: "GET /data/agent-identities.json then find instances[*].agent_id matching"
    },
    supported_modes: ["test", "live"],
    supported_currencies: ["usd"],
    supported_credential_types: ["card", "shared_payment_token"],
    payment_rails: ["stripe-link"],
    // Discovery hint: agents implementing the spec should look up receipts
    // via /money.json (paginated when archive is large; currently full list)
    // and verify each via the verifier_template.
    crawl_hint: {
      list_endpoint: "/money.json",
      list_count_field: "total_count",
      list_items_field: "receipts",
      verify_each: true
    },
    license: "Apache-2.0",
    references: {
      issue: "https://github.com/mhoydich/pointcast/issues/262",
      framing_post: "https://pointcast.xyz/b/0410",
      forward_look: "https://pointcast.xyz/b/0420"
    },
    notes: "This is a draft surface. Until /.well-known/agent-payments is formally registered with IANA, adopters use this path per the v1 spec. Stable enough to crawl; the SHAPE is versioned via the `spec` field."
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=900"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
