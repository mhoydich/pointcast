import manifest from '../data/nouns-bandmates-launch.json' with { type: 'json' };
import { canonicalCodeSha256 } from './nouns-bandmates-mint.ts';

const KEY = `pointcast:bandmates-launch:${manifest.payloadSha256}`;
const rpc = 'https://rpc.tzkt.io/mainnet';
const sha = async (text: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), (b) => b.toString(16).padStart(2, '0')).join('');

type LaunchManifest = typeof manifest;
type FetchLike = (input: string, init?: RequestInit) => Promise<{ ok: boolean; text(): Promise<string>; json(): Promise<any> }>;

export async function verifyNounsBandmatesLaunchPackage(
  candidate: LaunchManifest,
  fetcher: FetchLike = fetch as FetchLike,
) {
  if (candidate.status !== 'awaiting-user-signature' || candidate.network !== 'mainnet' || candidate.chainId !== 'NetXdQprcVkpaWU') throw new Error('Launch manifest is not for Tezos mainnet.');
  if (!/^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/.test(candidate.administrator)) throw new Error('Launch administrator is invalid.');
  if (!/^\/[a-z0-9/_-]+\/[a-f0-9]{64}\.json$/.test(candidate.payload) || !candidate.payload.endsWith(`/${candidate.payloadSha256}.json`)) throw new Error('Launch payload path is not content-addressed.');
  if (candidate.terms.priceMutez !== 0 || candidate.terms.edition !== 'open' || candidate.terms.tokenCount !== 12 || candidate.terms.initialEditionsEach !== 1 || candidate.terms.initialRecipient !== candidate.administrator || candidate.terms.paused !== false || candidate.terms.royaltyPercent !== 0) throw new Error('Launch terms differ from the reviewed free collection.');
  const response = await fetcher(candidate.payload, { cache: 'no-store' });
  if (!response.ok) throw new Error('Launch package could not be loaded.');
  const text = await response.text();
  if (await sha(text) !== candidate.payloadSha256) throw new Error('Launch package does not match the reviewed version.');
  const payload = JSON.parse(text);
  if (payload.schema !== 'pointcast.nouns-bandmates-origination/v1' || payload.administrator !== candidate.administrator || payload.chainId !== candidate.chainId || payload.network !== 'mainnet' || !Array.isArray(payload.code) || await canonicalCodeSha256(payload.code) !== candidate.codeSha256 || await canonicalCodeSha256(payload.storage) !== candidate.storageSha256) throw new Error('Launch package verification failed.');
  const chainResponse = await fetcher(`${rpc}/chains/main/chain_id`, { cache: 'no-store' });
  if (!chainResponse.ok || await chainResponse.json() !== candidate.chainId) throw new Error('Tezos mainnet could not be verified.');
  return payload;
}

export async function verifiedLaunchPayload() {
  return verifyNounsBandmatesLaunchPackage(manifest);
}

export function nounsBandmatesLaunchAllowed(input: { busy: boolean; pending: boolean; address: string | null; administrator: string; agreed: boolean }): boolean {
  return !input.busy && !input.pending && input.agreed && input.address === input.administrator;
}

async function verifyOriginatedCode(address: string): Promise<void> {
  if (!/^KT1[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) throw new Error('Tezos did not return a valid originated contract address.');
  const response = await fetch(`${rpc}/chains/main/blocks/head/context/contracts/${address}/script`, { cache: 'no-store' });
  if (!response.ok) throw new Error('The operation was included, but the originated contract is not readable yet. Check TzKT before continuing.');
  const script = await response.json();
  if (!Array.isArray(script?.code) || await canonicalCodeSha256(script.code) !== manifest.codeSha256) throw new Error('The originated contract code does not match the reviewed launch package.');
}

export function mountNounsBandmatesLaunch() {
  const root = document.querySelector<HTMLElement>('[data-bandmates-launch]');
  if (!root || root.dataset.mounted) return;
  root.dataset.mounted = 'true';
  const connect = root.querySelector<HTMLButtonElement>('[data-connect]')!;
  const launch = root.querySelector<HTMLButtonElement>('[data-launch]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const receipt = root.querySelector<HTMLAnchorElement>('[data-receipt]')!;
  const agree = root.querySelector<HTMLInputElement>('[data-agree]')!;
  let address: string | null = null;
  let busy = false;
  let pending = false;
  try { pending = !!localStorage.getItem(KEY); } catch { pending = true; }
  const update = () => { launch.disabled = !nounsBandmatesLaunchAllowed({ busy, pending, address, administrator: manifest.administrator, agreed: agree.checked }); connect.disabled = busy || pending; };
  const showReceipt = (opHash: string) => { receipt.href = `https://tzkt.io/${opHash}`; receipt.textContent = 'View launch operation on TzKT ↗'; receipt.hidden = false; };
  if (pending) {
    status.textContent = 'A launch was already started in this browser. Check the operation before doing anything else; this page will not create a second collection.';
    try { const previous = JSON.parse(localStorage.getItem(KEY) || '{}'); if (/^o[1-9A-HJ-NP-Za-km-z]{50}$/.test(previous.opHash)) showReceipt(previous.opHash); } catch { /* keep the duplicate guard */ }
  }
  agree.addEventListener('change', update);
  connect.addEventListener('click', async () => {
    busy = true; update(); status.textContent = 'Checking the package and connecting your wallet…';
    try {
      await verifiedLaunchPayload();
      const { connectKukaiForSigning, pointCastWallet } = await import('./tezos');
      address = await connectKukaiForSigning();
      const account = await (await pointCastWallet()).client.getActiveAccount();
      if (account?.network?.type !== 'mainnet') throw new Error('Choose your Tezos mainnet wallet.');
      status.textContent = address === manifest.administrator ? 'Creator wallet connected. Review the terms, then open the transaction in your wallet.' : 'This launch belongs to the creator wallet shown above. Switch accounts in your wallet to continue.';
    } catch (error) { address = null; status.textContent = error instanceof Error ? error.message : 'Wallet connection did not complete.'; }
    finally { busy = false; update(); }
  });
  launch.addEventListener('click', async () => {
    if (launch.disabled) return;
    busy = true; update();
    let requested = false;
    let submittedHash = '';
    try {
      const payload = await verifiedLaunchPayload();
      const { tezosClient, pointCastWallet } = await import('./tezos');
      const account = await (await pointCastWallet()).client.getActiveAccount();
      if (account?.address !== manifest.administrator || account?.network?.type !== 'mainnet') throw new Error('The connected creator wallet changed. Reconnect before launching.');
      // Write before requesting the wallet so uncertain responses cannot duplicate an origination.
      localStorage.setItem(KEY, JSON.stringify({ state: 'wallet-requested', at: new Date().toISOString() }));
      pending = true; requested = true;
      status.textContent = 'Review the network charge in your wallet. Only your approval creates the collection.';
      const operation = await (await tezosClient()).wallet.originate({ code: payload.code, init: payload.storage, balance: 0 }).send();
      submittedHash = operation.opHash;
      localStorage.setItem(KEY, JSON.stringify({ state: 'submitted', opHash: operation.opHash }));
      showReceipt(operation.opHash);
      status.textContent = 'Launch submitted. Waiting for Tezos confirmation…';
      const contract = await operation.contract();
      await verifyOriginatedCode(contract.address);
      localStorage.setItem(KEY, JSON.stringify({ state: 'confirmed', opHash: operation.opHash, contract: contract.address }));
      status.textContent = `Included on Tezos and contract code verified: ${contract.address}. Send this address to the PointCast team to verify storage and enable public collecting.`;
    } catch (error) {
      const aborted = (error as { name?: string })?.name === 'AbortedBeaconError';
      if (requested && !submittedHash && aborted) { localStorage.removeItem(KEY); pending = false; }
      status.textContent = submittedHash
        ? 'The operation was submitted, but PointCast has not independently verified the resulting contract code. Check the TzKT receipt; this page has locked a second launch.'
        : requested && !aborted
          ? 'The wallet response is uncertain. Check your wallet and TzKT before retrying; this page has locked a second launch.'
          : error instanceof Error ? error.message : 'Launch was not completed.';
    } finally { busy = false; update(); }
  });
  update();
}
