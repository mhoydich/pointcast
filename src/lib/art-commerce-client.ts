import { TEZOS_MAINNET, createPurchaseController } from './art-commerce.mjs';

const MAX_ART_BYTES = 16 * 1024 * 1024;
function hexText(value: unknown) {
  if (typeof value !== 'string' || !/^(?:[a-f0-9]{2}){1,4096}$/i.test(value)) return null;
  const bytes = new Uint8Array(value.match(/../g)!.map(pair => parseInt(pair, 16)));
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { return null; }
}
async function getJson(path: string, rpc = false) {
  const response = await fetch(`${rpc ? TEZOS_MAINNET.rpc : TEZOS_MAINNET.indexer}${path}`, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error('Public chain verification is unavailable. No purchase was prepared.');
  return response.json();
}
async function artworkHash(path: string) {
  const response = await fetch(path, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15_000) });
  if (!response.ok || !/^image\/(png|webp|jpeg)(?:;|$)/i.test(response.headers.get('content-type') ?? '') || Number(response.headers.get('content-length') ?? 0) > MAX_ART_BYTES) throw new Error('Artwork bytes could not be verified.');
  if (!response.body) throw new Error('Artwork bytes are missing.');
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > MAX_ART_BYTES) { await reader.cancel(); throw new Error('Artwork is too large to verify.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

/** Read existing Beacon account only. Never connects, signs, transfers or sends. */
async function getWallet() {
  const { pointCastWallet } = await import('./tezos');
  const wallet = await pointCastWallet(); const account = await wallet.client.getActiveAccount();
  return account ? { address: account.address, network: account.network?.type } : null;
}
async function readProof(config: any, artwork: any, record: any) {
  const collection = encodeURIComponent(config.collectionContract);
  const seller = encodeURIComponent(config.seller);
  const marketplace = encodeURIComponent(TEZOS_MAINNET.marketplace);
  const tokenId = encodeURIComponent(String(record.tokenId));
  const [chainId, head, indexedHead, storage, ask, balances, tokens, operators, sha256, script, rawMetadata] = await Promise.all([
    getJson('/chains/main/chain_id', true),
    getJson('/chains/main/blocks/head/header', true), getJson('/v1/head'),
    getJson(`/v1/contracts/${marketplace}/storage`),
    getJson(`/v1/contracts/${marketplace}/bigmaps/asks/keys/${record.askId}`),
    getJson(`/v1/tokens/balances?account=${seller}&token.contract=${collection}&token.tokenId=${tokenId}&balance.gt=0&limit=2`),
    getJson(`/v1/tokens?contract=${collection}&tokenId=${tokenId}&limit=2`),
    getJson(`/v1/contracts/${collection}/bigmaps/operators/keys?active=true&key.owner=${seller}&key.operator=${marketplace}&key.token_id=${tokenId}&limit=2`),
    artworkHash(artwork.v2.asset),
    getJson(`/chains/main/blocks/head/context/contracts/${collection}/script`, true),
    getJson(`/v1/contracts/${collection}/bigmaps/token_metadata/keys/${record.tokenId}`),
  ]);
  const codeBytes = new TextEncoder().encode(JSON.stringify(script.code));
  const codeHash = await crypto.subtle.digest('SHA-256', codeBytes);
  // Unsupported FA2 metadata/operator layouts fail closed. Extend only after
  // the selected collection's audited ABI and storage have been reviewed.
  const token = Array.isArray(tokens) && tokens.length === 1 ? tokens[0] : null;
  const balance = Array.isArray(balances) && balances.length === 1 ? balances[0] : null;
  const operator = Array.isArray(operators) && operators.length === 1 ? operators[0] : null;
  return {
    checkedAt: Date.now(), chainId, level: head.level, indexerLevel: indexedHead.level,
    paused: storage.paused, platformFeeBps: Number(storage.platform_fee_bps),
    platformFeeReceiver: storage.platform_fee_receiver, royaltyReceiver: storage.royalty_receiver,
    askActive: ask.active, ask: ask.value,
    sellerBalance: Number(balance?.balance ?? 0), totalSupply: Number(token?.totalSupply),
    operatorApproved: operator?.active === true && operator?.key?.owner === config.seller && operator?.key?.operator === config.marketplace && String(operator?.key?.token_id) === String(record.tokenId),
    artifactUri: token?.metadata?.artifactUri, artifactSha256: sha256,
    collectionCodeSha256: Array.from(new Uint8Array(codeHash), b => b.toString(16).padStart(2, '0')).join(''),
    metadataUri: rawMetadata?.active === true ? hexText(rawMetadata?.value?.token_info?.['']) : null,
    metadataSha256: rawMetadata?.active === true ? hexText(rawMetadata?.value?.token_info?.metadataSha256) : null,
    onchainArtifactSha256: rawMetadata?.active === true ? hexText(rawMetadata?.value?.token_info?.artifactSha256) : null,
  };
}

export function mountArtPurchasePanels(config: any) {
  for (const panel of document.querySelectorAll<HTMLElement>('[data-art-purchase]')) {
    if (panel.dataset.purchaseMounted) continue;
    panel.dataset.purchaseMounted = 'true';
    const button = panel.querySelector<HTMLButtonElement>('[data-prepare-purchase]');
    const status = panel.querySelector<HTMLElement>('[data-purchase-message]');
    if (!button || !status || button.disabled) continue;
    const artwork = JSON.parse(panel.dataset.artwork ?? '{}');
    const controller = createPurchaseController(config, { getWallet, readProof });
    let busy = false; let download: HTMLAnchorElement | null = null; let downloadUrl: string | null = null; let expirationTimer: ReturnType<typeof setTimeout> | null = null;
    function clearDownload() {
      download?.remove(); download = null;
      if (downloadUrl) URL.revokeObjectURL(downloadUrl); downloadUrl = null;
      if (expirationTimer) clearTimeout(expirationTimer); expirationTimer = null;
    }
    window.addEventListener('pc:wallet-change', () => { controller.invalidate(); clearDownload(); status.textContent = 'Wallet changed. Prepare a new review file.'; });
    button.addEventListener('click', async () => {
      if (busy) return; busy = true; button.disabled = true; clearDownload();
      status.textContent = 'Checking mainnet listing, seller ownership and artwork…';
      try {
        const plan = await controller.prepare(artwork);
        downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' }));
        download = document.createElement('a'); download.href = downloadUrl;
        download.download = 'pointcast-art-purchase-unsigned.json'; download.textContent = 'Download unsigned review file';
        status.textContent = 'Verified for preparation only. Price: 1 tez plus additional network fees, which are unknown until your wallet estimates them. Nothing has been signed or sent.';
        status.after(download);
        expirationTimer = setTimeout(() => { clearDownload(); status.textContent = 'Review file expired. Prepare again before signing manually.'; }, 60_000);
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : 'No purchase was prepared. Try again.';
      } finally { busy = false; button.disabled = false; }
    });
  }
}
