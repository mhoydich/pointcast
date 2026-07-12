import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { i as identities } from './agent-identities_DjGMIDkm.mjs';
import { v as verifySpend, M as MANIFEST_FIELDS, a as SPEC_VERSION } from './agent-signing_CUlIm4Ga.mjs';

async function getStaticPaths() {
  const all = await getCollection("blocks");
  return all.filter((b) => b.data.spend).map((b) => ({ params: { id: b.data.id } }));
}
const GET = async ({ params }) => {
  const all = await getCollection("blocks");
  const block = all.find((b) => b.data.id === params.id);
  if (!block || !block.data.spend) {
    return json(404, { error: "no spend block", block_id: params.id });
  }
  const spend = block.data.spend;
  const result = verifySpend({ id: block.data.id, timestamp: block.data.timestamp, spend }, identities);
  const status = !spend.signature ? "unsigned" : result.ok ? "valid" : "invalid";
  let publicKeyUsed = null;
  if (spend.agent_id) {
    for (const v of Object.values(identities.instances ?? {})) {
      if (v.agent_id === spend.agent_id) {
        publicKeyUsed = v.public_key ?? null;
        break;
      }
    }
  }
  const body = {
    block_id: block.data.id,
    block_url: `https://pointcast.xyz/b/${block.data.id}/`,
    agent: spend.agent ?? null,
    agent_id: spend.agent_id ?? null,
    payee_agent: spend.payee_agent ?? null,
    payee_agent_id: spend.payee_agent_id ?? null,
    status,
    reason: result.reason,
    spec: spend.spec ?? SPEC_VERSION,
    signing_alg: spend.signing_alg ?? null,
    signature_present: !!spend.signature,
    public_key_used: publicKeyUsed,
    signed_manifest_fields: MANIFEST_FIELDS.concat(["block_id", "block_timestamp", "spec"]),
    timestamp: block.data.timestamp,
    verified_at: (/* @__PURE__ */ new Date()).toISOString(),
    references: {
      block: `https://pointcast.xyz/b/${block.data.id}/`,
      block_json: `https://pointcast.xyz/b/${block.data.id}.json`,
      money: "https://pointcast.xyz/money",
      money_json: "https://pointcast.xyz/money.json",
      issue: "https://github.com/mhoydich/pointcast/issues/262"
    }
  };
  return json(200, body);
};
function json(status, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60, s-maxage=300"
    }
  });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  getStaticPaths
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
