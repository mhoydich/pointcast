import process from 'vite-plugin-node-polyfills/shims/process';
import { spawn } from 'node:child_process';

const LINK_CAPS = {
  perPurchaseUsd: 10};
const LINK_MERCHANT_WHITELIST_V0 = /* @__PURE__ */ new Set([
  "replicate.com",
  "api.anthropic.com",
  "api.openai.com"
]);
async function createSpendRequest(input) {
  const paymentMethodId = process.env.LINK_PAYMENT_METHOD_ID;
  if (!paymentMethodId) {
    throw new Error(
      "LINK_PAYMENT_METHOD_ID env not set. Mike needs to run `link-cli onboard` and add the resulting csmrpd_xxx id to wrangler.toml [vars]."
    );
  }
  if (input.amountUsd > LINK_CAPS.perPurchaseUsd) {
    throw new Error(
      `Amount $${input.amountUsd} exceeds per-purchase cap of $${LINK_CAPS.perPurchaseUsd}. Raise the cap in src/lib/link.ts before re-running, after Mike approves.`
    );
  }
  if (!LINK_MERCHANT_WHITELIST_V0.has(input.merchant)) {
    throw new Error(
      `Merchant "${input.merchant}" not in v0 whitelist. Add it to LINK_MERCHANT_WHITELIST_V0 in src/lib/link.ts after Mike approves.`
    );
  }
  if (input.context.length < 100) {
    throw new Error(
      `context must be >= 100 chars (link-cli requirement). Got ${input.context.length}.`
    );
  }
  const useTest = input.testMode !== false;
  const args = [
    "spend-request",
    "create",
    "--payment-method-id",
    paymentMethodId,
    "--credential-type",
    "shared_payment_token",
    "--amount",
    String(Math.round(input.amountUsd * 100)),
    "--currency",
    "usd",
    "--merchant-name",
    input.merchant,
    "--merchant-url",
    input.merchantUrl,
    "--context",
    input.context,
    "--request-approval",
    "--format",
    "json"
  ];
  if (useTest) args.push("--test");
  const raw = await spawnLinkCli(args);
  return parseSpendRequestOutput(raw, input.amountUsd);
}
function spawnLinkCli(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("link-cli", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => stdout += d.toString());
    proc.stderr.on("data", (d) => stderr += d.toString());
    proc.on("error", (err) => reject(new Error(`link-cli spawn failed: ${err.message}. Is @stripe/link-cli installed globally?`)));
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`link-cli exited ${code}: ${stderr || stdout}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (err) {
        reject(new Error(`link-cli stdout not JSON: ${stdout.slice(0, 200)}`));
      }
    });
  });
}
function parseSpendRequestOutput(raw, amountUsd) {
  const r = raw;
  const id = r.id ?? r.spend_request_id ?? "";
  const status = r.status ?? "pending";
  const receiptUrl = r.receipt_url ?? void 0;
  if (!id) {
    throw new Error(`link-cli payload missing id: ${JSON.stringify(raw).slice(0, 200)}`);
  }
  return { id, status, amountUsd, receiptUrl, raw };
}

const POST = async ({ request }) => {
  if (process.env.LINK_SPEND_ENDPOINT_ENABLED !== "true") {
    return json(503, {
      error: "link-spend-endpoint-disabled",
      message: "POST /api/link/spend is scaffolding. Enable via LINK_SPEND_ENDPOINT_ENABLED=true after onboard + payment-method-id are wired. See src/pages/api/link/spend.ts."
    });
  }
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.LINK_AGENT_TOKEN ?? ""}`;
  if (!process.env.LINK_AGENT_TOKEN || auth !== expected) {
    return json(401, { error: "unauthorized" });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "invalid-json" });
  }
  try {
    const result = await createSpendRequest(body);
    return json(200, result);
  } catch (err) {
    return json(400, { error: "spend-failed", message: err.message });
  }
};
function json(status, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json" }
  });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
