/**
 * Discovery helpers for pointcast.agent-payments/v1.
 *
 * - discover(siteUrl)              → fetch the /.well-known/agent-payments.json envelope
 * - fetchReceipts(siteUrl)         → fetch the receipts feed (resolves via discovery)
 * - verifyReceiptByUrl(siteUrl, blockId, identityRegistry) → end-to-end verify
 *
 * All helpers use the global fetch (Node 18+ / browser).
 */

import { verifySpend } from './signing.mjs';

/**
 * Fetch the .well-known discovery envelope for an agent-payments site.
 * Returns the parsed JSON or throws on non-2xx.
 */
export async function discover(siteUrl) {
  const u = new URL('/.well-known/agent-payments.json', siteUrl);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`discovery failed: ${r.status} ${r.statusText} for ${u.href}`);
  return r.json();
}

/**
 * Fetch the receipts feed from a site. Uses /.well-known to discover the
 * actual feed location, falls back to /money.json by convention.
 */
export async function fetchReceipts(siteUrl, opts = {}) {
  let receiptsPath = '/money.json';
  if (!opts.skipDiscovery) {
    try {
      const wk = await discover(siteUrl);
      if (wk?.endpoints?.receipts) receiptsPath = wk.endpoints.receipts;
    } catch { /* fall back to convention */ }
  }
  const u = new URL(receiptsPath, siteUrl);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`receipts fetch failed: ${r.status} ${r.statusText} for ${u.href}`);
  return r.json();
}

/**
 * Verify a single receipt end-to-end:
 *  1. Fetch /b/{blockId}.json from the site
 *  2. Fetch /data/agent-identities.json (or wherever discovery says)
 *  3. Run verifySpend()
 *
 * Returns { ok, reason, block, status } where status is 'valid' / 'invalid' / 'unsigned'.
 */
export async function verifyReceiptByUrl(siteUrl, blockId, opts = {}) {
  let identitiesPath = '/data/agent-identities.json';
  let blockPath = `/b/${blockId}.json`;
  if (!opts.skipDiscovery) {
    try {
      const wk = await discover(siteUrl);
      if (wk?.endpoints?.identities) identitiesPath = wk.endpoints.identities;
      if (wk?.endpoints?.block_json_template) {
        blockPath = wk.endpoints.block_json_template.replace('{block_id}', blockId);
      }
    } catch { /* fall back */ }
  }
  const blockUrl = new URL(blockPath, siteUrl);
  const idUrl = new URL(identitiesPath, siteUrl);

  const [blockResp, idResp] = await Promise.all([fetch(blockUrl), fetch(idUrl)]);
  if (!blockResp.ok) throw new Error(`block fetch failed: ${blockResp.status} ${blockUrl.href}`);
  if (!idResp.ok) throw new Error(`identities fetch failed: ${idResp.status} ${idUrl.href}`);

  const block = await blockResp.json();
  const identities = await idResp.json();

  if (!block.spend) return { ok: false, reason: 'no spend field', block, status: 'unsigned' };
  const r = verifySpend(block, identities);
  const status = !block.spend.signature ? 'unsigned' : (r.ok ? 'valid' : 'invalid');
  return { ok: r.ok, reason: r.reason, block, status };
}
