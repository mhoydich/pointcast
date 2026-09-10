import type { PointCastUser } from './types.ts';
import * as buyer from '../x402-buyer.ts';
import type { BuyerQuote, BuyerWallet } from '../x402-buyer.ts';
import { X402_CHAIN_ID } from '../x402.ts';

const ENDPOINT = '/api/me/ai-purchases';
// The session API emits these only before reserving or submitting a payment.
const UNSUBMITTED_REASONS = new Set([
  'payment-window-too-short', 'payment-quote-expired', 'verified-ai-must-be-online', 'quote-does-not-match-review',
  'payment-terms-changed', 'public-publication-approval-required', 'payment-does-not-match-review',
  'invalid-payment-signature', 'ai-purchases-not-enabled', 'bench-full-before-payment',
]);
const APPROVAL_NOTICE = 'Review the exact USDC authorization in your wallet. Signing authorizes this one payment and public question.';
export type Purchase = {
  id: string; runtimeId: string; status: 'quoted' | 'submitting' | 'unresolved' | 'failed' | 'delivered' | 'expired';
  question: string; amount: string; symbol: string; displayAmount: string; network: string; payTo: string; asset: string;
  endpoint: string; quote: Record<string, unknown>; quoteHash: string; expiresAt: number; payer: string | null;
  actionId: string | null; transactionHash: string | null; receiptVerified: boolean; chainVerified: boolean; deliveryVerified: boolean;
  result: null | { sit: { id: string; day: string; answer: string; name: string }; url: string };
  receipt?: Record<string, unknown> | null; proofCheckedAt?: number | null; error: string | null; createdAt: number; updatedAt: number;
};
type Runtime = { id: string; label: string; provider: string; model: string };
type Snapshot = { available: boolean; unavailableReason?: string; runtimes: Runtime[]; purchases: Purchase[] };
type WalletApi = Pick<typeof buyer, 'createWalletDiscovery' | 'connectBuyerWallet' | 'watchBuyerWallet' | 'validateBuyerQuote' | 'signBuyerPayment'>;

export function purchaseError(reason: string): string {
  const messages: Record<string, string> = {
    unauthorized: 'Sign in to PointCast to review your purchases.',
    'select-a-wallet': 'Choose a browser wallet first.',
    'switch-wallet-to-etherlink': 'Switch your selected wallet to Etherlink, then reconnect it here.',
    'wallet-changed': 'Your wallet account or network changed. Review the purchase and reconnect before approving.',
    'wallet-account-unavailable': 'No wallet account is available. Open your wallet and reconnect.',
    'wallet-events-unavailable': 'This wallet cannot safely report account changes. Choose another compatible wallet.',
    'wallet-signature-invalid': 'The wallet signature could not be verified. No payment was submitted by this page.',
    'wallet-signature-account-mismatch': 'The signature did not match the selected wallet. No payment was submitted by this page.',
    'unsupported-wallet-signature': 'This pilot requires a compatible standard wallet signature. No payment was submitted by this page.',
    'payment-window-too-short': 'This quote is too close to expiry. Refresh it and review the new terms before approving.',
    'bench-full-before-payment': 'Today’s Bench is full. No payment was submitted. You can still read the Bench and return another day.',
    'payment-quote-expired': 'This quote expired. Review a fresh quote before approving a payment.',
    'payment-terms-mismatch': 'The payment terms could not be verified. No approval is available.',
    'purchase-cancelled': 'Approval stopped. This page did not submit the pending signature.',
    'ai-purchases-not-enabled': 'This purchase pilot is not enabled here. Free Bench participation is still available.',
    'verified-ai-must-be-online': 'Your verified AI must be online and signed in before a new purchase can proceed.',
    'resolve-or-cancel-your-existing-purchase-before-starting-another': 'Review or skip your existing quote before starting another. If already submitted, check its status without paying again.',
    'quote-does-not-match-review': 'The quote no longer matches this review. Close it and review fresh terms before approval.',
    'payment-terms-changed': 'The service changed its payment terms. Close this quote and review a new one.',
    'payment-does-not-match-review': 'The payment authorization does not match the reviewed terms. Check this purchase before continuing.',
    'purchase-already-submitted-or-no-longer-available': 'This purchase has already been submitted or closed. Check its existing status; do not pay again.',
    'purchase-status-unavailable-check-existing-attempt': 'This purchase status is unavailable. Check the existing attempt; do not pay again.',
    'question-must-be-1-to-280-characters': 'Enter a public question between 1 and 280 characters.',
    'public-publication-approval-required': 'Review the exact public question and confirm publication before approving the payment.',
    'purchase-quote-unavailable': 'The service cannot provide a payment quote right now. No payment was submitted.',
    'runtime-not-ready': 'Complete a task with an online, signed-in AI before reviewing a purchase.',
    'runtime-offline': 'Your AI is offline. Reopen its companion before reviewing or approving a purchase.',
    'request-conflict': 'This request differs from the previous review. Edit it and review a new purchase.',
    'user-rejected': 'You declined the wallet request. No payment was submitted by this page.',
  };
  return messages[reason] || 'Purchases are unavailable right now. Check the purchase status before trying anything else.';
}
export class PurchaseRequestError extends Error {
  status: number; reason: string;
  constructor(status: number, reason: string) { super(purchaseError(reason)); this.status = status; this.reason = reason; }
}
export async function readPurchaseResponse(response: Response): Promise<Record<string, any>> {
  let payload: any;
  try { payload = await response.json(); } catch { /* Proxy failures may return HTML. */ }
  if (!response.ok || !payload || typeof payload !== 'object' || Array.isArray(payload) || payload.ok !== true) {
    throw new PurchaseRequestError(response.status, typeof payload?.reason === 'string' ? payload.reason : response.status === 401 ? 'unauthorized' : 'invalid-response');
  }
  return payload;
}
export function purchaseStatus(purchase: Purchase, now = Date.now()): string {
  if (purchase.status === 'quoted') return now >= purchase.expiresAt ? 'Quote expired · no new approval available'
    : purchase.expiresAt - now <= buyer.MIN_BUYER_SUBMISSION_MS ? 'Quote needs refreshing · no new approval available' : 'Review terms · no payment submitted';
  if (purchase.status === 'submitting') return 'Submission recorded · check outcome';
  if (purchase.status === 'unresolved') return 'Payment outcome unresolved · do not pay again';
  if (purchase.status === 'failed') return 'Purchase needs attention · do not repeat the payment';
  if (purchase.status === 'expired') return 'Quote closed · no new approval available';
  return purchase.receiptVerified && purchase.deliveryVerified ? 'Question delivered · receipt verified' : 'Delivery reported · verification incomplete';
}
export function safeBenchUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value, 'https://pointcast.xyz'); return url.origin === 'https://pointcast.xyz' && ['/bench', '/api/bench'].includes(url.pathname) && !url.username && !url.password
      && (url.pathname !== '/api/bench' || (/^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('day') || '') && [...url.searchParams.keys()].every(key => key === 'day'))) ? url.href : null; }
  catch { return null; }
}

export function mountAiPurchases(root: HTMLElement, options: { walletApi?: WalletApi; pollMs?: number } = {}): () => void {
  const doc = root.ownerDocument, win = doc.defaultView!;
  const walletApi = options.walletApi ?? buyer;
  const lifetime = new win.AbortController();
  let requests = new win.AbortController(), approval = new win.AbortController();
  let lastAuthOwner: string | null = null;
  let epoch = 0, readVersion = 0, intent = 0;
  let acceptedSession = false, authMissing = false, loading = true, available = false, busy = '', notice = '';
  let draftDirty = false;
  let snapshot: Snapshot = { available: false, runtimes: [], purchases: [] };
  let selectedId = '', selectedRuntime = '', selectedWallet = '', payer = '';
  let wallets: readonly BuyerWallet[] = [];
  let walletWatch: (() => void) | null = null;
  let discovery: ReturnType<WalletApi['createWalletDiscovery']> | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let quoteRetry: { fingerprint: string; requestId: string } | null = null;
  const uncertain = new Set<string>();
  const mustRefresh = new Set<string>();
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const text = (selector: string, value: string) => { q(selector).textContent = value; };
  const live = (version = epoch) => !lifetime.signal.aborted && root.isConnected && epoch === version;
  const form = q<HTMLFormElement>('[data-purchase-form]');
  const question = q<HTMLTextAreaElement>('[data-purchase-question]');
  const runtimeSelect = q<HTMLSelectElement>('[data-purchase-runtime]');
  const walletSelect = q<HTMLSelectElement>('[data-purchase-wallet]');
  const consent = q<HTMLInputElement>('[data-purchase-public-consent]');
  const current = () => snapshot.purchases.find((p) => p.id === selectedId) ?? null;
  const pending = (p: Purchase) => ['submitting', 'unresolved'].includes(p.status) || uncertain.has(p.id);
  const eligible = (p: Purchase) => available && snapshot.runtimes.some((runtime) => runtime.id === p.runtimeId);
  const fresh = (p: Purchase) => p.status === 'quoted' && Date.now() < p.expiresAt - buyer.MIN_BUYER_SUBMISSION_MS && !uncertain.has(p.id) && !mustRefresh.has(p.id);
  const quoteFingerprint = () => JSON.stringify({ runtimeId: selectedRuntime, question: question.value.trim() });

  function checkedQuote(p: Purchase): BuyerQuote {
    const quote = walletApi.validateBuyerQuote(p.quote, { endpoint: p.endpoint, amountUnits: '10000', expiresAt: p.expiresAt });
    if (p.amount !== quote.amountUnits || p.symbol !== 'USDC' || p.displayAmount !== '0.01' || p.network !== quote.accepted.network
      || p.payTo.toLowerCase() !== quote.accepted.payTo.toLowerCase() || p.asset.toLowerCase() !== quote.accepted.asset.toLowerCase()
      || !p.quoteHash || !Number.isFinite(p.expiresAt)) throw new Error('payment-terms-mismatch');
    return quote;
  }
  function resetApproval() {
    ++intent; approval.abort(); approval = new win.AbortController(); consent.checked = false;
  }
  function resetWallet() { resetApproval(); walletWatch?.(); walletWatch = null; payer = ''; }
  function clearSensitive() {
    resetWallet(); snapshot = { available: false, runtimes: [], purchases: [] }; selectedId = ''; selectedRuntime = ''; selectedWallet = '';
    uncertain.clear(); mustRefresh.clear(); quoteRetry = null; draftDirty = false; form.reset(); runtimeSelect.replaceChildren(); walletSelect.value = '';
    q('[data-purchase-history]').replaceChildren(); text('[data-purchase-public-text]', ''); text('[data-purchase-result-text]', '');
    q('[data-purchase-result-link]').removeAttribute('href'); q('[data-purchase-explorer]').removeAttribute('href');
  }
  async function request(body?: Record<string, unknown>) {
    let response: Response;
    try { response = await fetch(ENDPOINT, { method: body ? 'POST' : 'GET', credentials: 'include', cache: 'no-store', signal: requests.signal,
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) }); }
    catch { throw new PurchaseRequestError(0, 'network-error'); }
    return readPurchaseResponse(response);
  }
  function invalidateSession(message: string) {
    ++epoch; ++readVersion; requests.abort(); requests = new win.AbortController(); clearTimeout(timer);
    lastAuthOwner = null; acceptedSession = false; authMissing = true; available = false; loading = false;
    busy = ''; notice = message; clearSensitive(); render();
  }

  function render() {
    if (!live()) return;
    const p = current();
    const unresolved = snapshot.purchases.some(pending);
    const statusText = p && mustRefresh.has(p.id) ? 'Quote needs refreshing · no new approval available' : p ? purchaseStatus(p) : '';
    let verifiedQuote = false;
    if (p && fresh(p)) { try { checkedQuote(p); verifiedQuote = true; } catch { /* Never enable signing with unchecked terms. */ } }
    const draftMatches = !p || p.status !== 'quoted' || (p.question === question.value.trim() && p.runtimeId === selectedRuntime);
    const canApprove = Boolean(p && draftMatches && eligible(p) && fresh(p) && verifiedQuote && !busy);
    const existingQuote = snapshot.purchases.find(item => item.status === 'quoted' && !uncertain.has(item.id));
    root.setAttribute('aria-busy', String(loading || Boolean(busy)));
    root.dataset.state = !acceptedSession ? loading ? 'checking' : authMissing ? 'signed-out' : 'unavailable' : busy === 'signing' ? 'awaiting-wallet' : p ? uncertain.has(p.id) ? 'unresolved' : p.status : available ? 'ready' : 'unavailable';
    text('[data-purchase-badge]', loading ? 'Checking…' : !acceptedSession ? authMissing ? 'Sign-in required' : 'Status unavailable' : busy === 'signing' ? 'Awaiting wallet approval' : p ? uncertain.has(p.id) ? 'Outcome unresolved' : statusText : available ? 'Optional paid participation' : 'Not available');
    text('[data-purchase-notice]', notice || (!acceptedSession ? 'Sign in to PointCast to review your purchases.' : !available ? 'This purchase pilot is not enabled or its service is unavailable.'
      : !snapshot.runtimes.length ? 'Complete a real task with your AI first. Its companion must be online and signed in for a new purchase.' : 'Review the exact public text and payment terms before deciding.'));
    q('[data-purchase-unavailable]').hidden = available && snapshot.runtimes.length > 0;
    text('[data-purchase-unavailable]', snapshot.runtimes.length ? 'Your existing purchase records remain readable.' : 'Free Bench participation is available without an AI or wallet.');
    const runtimeKey = JSON.stringify(snapshot.runtimes);
    if (runtimeSelect.dataset.options !== runtimeKey) {
      runtimeSelect.replaceChildren(...snapshot.runtimes.map((runtime) => { const option = doc.createElement('option'); option.value = runtime.id; option.textContent = `${runtime.label} · ${runtime.provider} · ${runtime.model}`; return option; }));
      runtimeSelect.dataset.options = runtimeKey;
    }
    runtimeSelect.value = selectedRuntime; runtimeSelect.disabled = !available || Boolean(busy);
    question.disabled = Boolean(busy);
    text('[data-purchase-quote]', existingQuote ? existingQuote.question === question.value.trim() && existingQuote.runtimeId === selectedRuntime ? fresh(existingQuote) ? 'Review existing purchase · no payment yet' : 'Refresh this quote · no payment yet' : 'Replace existing quote · no payment yet' : 'Review a purchase · no payment yet');
    q<HTMLButtonElement>('[data-purchase-quote]').disabled = !available || !selectedRuntime || Boolean(busy) || unresolved || !question.value.trim() || question.value.trim().length > 280;
    q('[data-purchase-review]').hidden = !p;
    text('[data-purchase-heading]', p?.status === 'quoted' ? 'Review this one purchase' : 'Your purchase');
    text('[data-purchase-status]', p ? !draftMatches ? 'You edited the draft. Review again to replace this quote before approving.' : fresh(p) && !verifiedQuote ? 'The payment terms could not be verified. Approval is unavailable.' : uncertain.has(p.id) ? 'Submission outcome unknown. Check this purchase; do not sign another payment.' : `${statusText}${p.error ? `. ${p.error.slice(0, 500)}` : ''}` : '');
    text('[data-purchase-public-text]', p?.question || '');
    const source = p && snapshot.runtimes.find((runtime) => runtime.id === p.runtimeId);
    text('[data-purchase-source]', source ? `${source.label} · ${source.provider} · ${source.model}` : p ? `Previously verified AI · ${p.runtimeId}` : '');
    text('[data-purchase-price]', p ? `${p.displayAmount} ${p.symbol}` : '');
    text('[data-purchase-atomic]', p ? `${p.amount} atomic units` : '');
    text('[data-purchase-network]', p ? `Etherlink · ${p.network}` : '');
    text('[data-purchase-recipient]', p?.payTo || ''); text('[data-purchase-asset]', p?.asset || '');
    text('[data-purchase-expiry]', p ? new Date(p.expiresAt).toLocaleString() : ''); text('[data-purchase-id]', p?.id || '');
    q('[data-purchase-approval]').hidden = !p || !fresh(p) || !verifiedQuote;
    consent.disabled = !canApprove;
    const walletKey = wallets.map((w) => `${w.uuid}:${w.name}`).join('|');
    if (walletSelect.dataset.options !== walletKey) {
      const placeholder = doc.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Choose a wallet';
      walletSelect.replaceChildren(placeholder, ...wallets.map((w) => { const option = doc.createElement('option'); option.value = w.uuid; option.textContent = w.name; return option; }));
      walletSelect.dataset.options = walletKey;
    }
    walletSelect.value = selectedWallet; walletSelect.disabled = !canApprove;
    text('[data-purchase-wallet-hint]', wallets.length ? 'Choose a browser wallet. Connecting it does not sign or pay.' : 'No compatible browser wallet has announced itself. Open this page in a browser with your wallet extension.');
    text('[data-purchase-payer]', payer ? `Your payer wallet: ${payer} · public Bench name: ${payer.slice(0, 6)}…${payer.slice(-4)}` : '');
    q<HTMLButtonElement>('[data-purchase-connect]').disabled = !canApprove || !selectedWallet;
    q<HTMLButtonElement>('[data-purchase-approve]').disabled = !canApprove || !payer || !consent.checked;
    q<HTMLButtonElement>('[data-purchase-skip]').disabled = Boolean(busy);
    q('[data-purchase-stop]').hidden = busy !== 'signing';
    q('[data-purchase-reconcile]').hidden = !p || !(pending(p) || p.status === 'delivered' || (p.status === 'failed' && Boolean(p.transactionHash || p.receiptVerified)));
    q<HTMLButtonElement>('[data-purchase-reconcile]').disabled = Boolean(busy) || !acceptedSession;
    q('[data-purchase-proof]').hidden = !p || ['quoted', 'expired'].includes(p.status);
    text('[data-purchase-receipt-proof]', p?.receiptVerified ? 'PointCast verified the receipt signature and purchase terms.' : 'Receipt signature and terms have not been verified.');
    text('[data-purchase-chain-proof]', p?.chainVerified ? 'An independent RPC check observed the exact USDC transfer. This is not a rollup finality claim.' : 'Exact USDC transfer check pending. Do not repeat the payment.');
    text('[data-purchase-delivery-proof]', p?.deliveryVerified ? 'PointCast verified the stored public Bench question.' : 'The public Bench question has not been verified as delivered.');
    const transaction = p?.transactionHash && /^0x[0-9a-fA-F]{64}$/.test(p.transactionHash) ? p.transactionHash : '';
    text('[data-purchase-tx]', transaction ? `Transaction: ${transaction}` : '');
    const explorer = q<HTMLAnchorElement>('[data-purchase-explorer]'); explorer.hidden = !transaction;
    if (transaction) explorer.href = `https://explorer.etherlink.com/tx/${transaction}`; else explorer.removeAttribute('href');
    q('[data-purchase-result]').hidden = !p?.result;
    text('[data-purchase-result-heading]', p?.deliveryVerified ? 'Published Bench question' : 'Reported Bench result · not verified');
    text('[data-purchase-result-text]', p?.result?.sit.answer || '');
    const resultUrl = p?.deliveryVerified ? safeBenchUrl(p.result?.url) : null;
    const resultLink = q<HTMLAnchorElement>('[data-purchase-result-link]'); resultLink.hidden = !resultUrl;
    if (resultUrl) resultLink.href = resultUrl; else resultLink.removeAttribute('href');
    q('[data-purchase-empty]').hidden = snapshot.purchases.length > 0;
    const historyKey = JSON.stringify(snapshot.purchases.map((item) => [item.id, item.status, item.updatedAt, uncertain.has(item.id)]));
    const history = q('[data-purchase-history]');
    if (history.dataset.items !== historyKey) {
      history.replaceChildren(...snapshot.purchases.map((item) => { const li = doc.createElement('li'); const button = doc.createElement('button'); button.type = 'button'; button.dataset.purchaseId = item.id;
        button.textContent = `${new Date(item.createdAt).toLocaleString()} · ${item.displayAmount} ${item.symbol} · ${purchaseStatus(item)}`; li.append(button); return li; }));
      history.dataset.items = historyKey;
    }
  }
  function schedule() {
    clearTimeout(timer);
    if (live() && acceptedSession && doc.visibilityState === 'visible') timer = setTimeout(() => void load(), options.pollMs ?? 3000);
  }
  async function load(): Promise<boolean> {
    const version = epoch, read = ++readVersion;
    try {
      const data = await request();
      if (!live(version) || read !== readVersion) return false;
      if (typeof data.available !== 'boolean' || !Array.isArray(data.runtimes) || !Array.isArray(data.purchases)) throw new PurchaseRequestError(200, 'invalid-response');
      const previous = current();
      acceptedSession = true; authMissing = false; available = data.available; snapshot = data as Snapshot;
      const updated = previous && snapshot.purchases.find((p) => p.id === previous.id);
      if (previous && (!updated || updated.quoteHash !== previous.quoteHash || updated.question !== previous.question || updated.expiresAt !== previous.expiresAt)) resetApproval();
      if (!snapshot.runtimes.some((r) => r.id === selectedRuntime)) selectedRuntime = snapshot.runtimes[0]?.id || '';
      if (!snapshot.purchases.some((p) => p.id === selectedId)) {
        selectedId = snapshot.purchases[0]?.id || '';
        const selected = current();
        if (selected?.status === 'quoted' && !draftDirty) { question.value = selected.question; if (snapshot.runtimes.some(r => r.id === selected.runtimeId)) selectedRuntime = selected.runtimeId; }
      }
      for (const p of snapshot.purchases) if (p.status !== 'quoted') { uncertain.delete(p.id); mustRefresh.delete(p.id); }
      loading = false; render(); schedule(); return true;
    } catch (error) {
      if (!live(version) || read !== readVersion) return false;
      available = false; loading = false;
      if (error instanceof PurchaseRequestError && error.status === 401) { invalidateSession(error.message); return false; }
      if (!acceptedSession) lastAuthOwner = null;
      notice = error instanceof PurchaseRequestError ? error.message : purchaseError(''); render(); schedule(); return false;
    }
  }
  function acceptPurchase(p: Purchase) {
    snapshot.purchases = [p, ...snapshot.purchases.filter((previous) => previous.id !== p.id)]; selectedId = p.id;
    if (p.status !== 'quoted') { uncertain.delete(p.id); mustRefresh.delete(p.id); }
  }
  async function mutate(body: Record<string, unknown>): Promise<Purchase | null> {
    if (busy || !acceptedSession) return null;
    const version = epoch; ++readVersion; clearTimeout(timer); busy = String(body.operation); notice = ''; render();
    try {
      const data = await request(body);
      if (!live(version)) return null;
      if (!data.purchase?.id) throw new PurchaseRequestError(200, 'invalid-response');
      acceptPurchase(data.purchase);
      if (body.operation === 'quote') { quoteRetry = null; draftDirty = false; resetApproval(); question.value = data.purchase.question; notice = 'Review the exact public text and terms. No payment has been submitted.'; }
      else if (body.operation === 'cancel') { resetApproval(); notice = 'Purchase skipped. No new wallet approval is available for this quote.'; }
      else notice = 'Purchase status refreshed. No new payment was requested.';
      return data.purchase;
    } catch (error) {
      if (!live(version)) return null;
      if (error instanceof PurchaseRequestError && error.status === 401) { invalidateSession(error.message); return null; }
      notice = error instanceof PurchaseRequestError ? error.message : purchaseError('');
      return null;
    } finally { if (live(version)) { busy = ''; render(); schedule(); } }
  }
  function walletChanged() { resetWallet(); notice = purchaseError('wallet-changed'); render(); }
  async function connect() {
    if (q<HTMLButtonElement>('[data-purchase-connect]').disabled || !discovery) return;
    const version = epoch; resetWallet(); const attempt = intent; busy = 'connecting'; notice = ''; render();
    try {
      const wallet = discovery.select(selectedWallet);
      const connected = await walletApi.connectBuyerWallet(wallet);
      if (!live(version) || attempt !== intent) return;
      // A first account grant may emit accountsChanged while connect is pending.
      // Subscribe after that grant, then read both values again under the watcher.
      walletWatch = walletApi.watchBuyerWallet(wallet, walletChanged);
      const [accounts, chain] = await Promise.all([
        wallet.provider.request({ method: 'eth_accounts' }), wallet.provider.request({ method: 'eth_chainId' }),
      ]);
      if (!live(version) || attempt !== intent) return;
      if (!Array.isArray(accounts) || typeof accounts[0] !== 'string' || accounts[0].toLowerCase() !== connected.payer.toLowerCase()) throw new Error('wallet-changed');
      if (typeof chain !== 'string' || !/^0x[0-9a-f]+$/i.test(chain) || BigInt(chain) !== BigInt(X402_CHAIN_ID)) throw new Error('switch-wallet-to-etherlink');
      payer = connected.payer; notice = 'Wallet connected. Review the public question and approve only if you want this one payment.';
    } catch (error) { if (live(version) && attempt === intent) { resetWallet(); notice = purchaseError((error as Error)?.message || ''); } }
    finally { if (live(version)) { busy = ''; render(); } }
  }
  async function approve() {
    const initial = current();
    if (!initial || q<HTMLButtonElement>('[data-purchase-approve]').disabled || !discovery) return;
    const version = epoch, attempt = intent, account = payer, id = initial.id, hash = initial.quoteHash;
    const walletId = selectedWallet;
    const stillApproved = () => live(version) && intent === attempt && consent.checked && payer === account && current()?.id === id && current()?.quoteHash === hash;
    busy = 'signing'; notice = APPROVAL_NOTICE; render();
    try {
      const wallet = discovery.select(walletId);
      if (!await load() || !stillApproved()) return;
      let p = current()!;
      if (!fresh(p)) throw new Error('payment-window-too-short');
      if (!eligible(p)) throw new Error('runtime-not-ready');
      const quote = checkedQuote(p);
      const signed = await walletApi.signBuyerPayment({ wallet, quote, expectedAccount: account, signal: approval.signal });
      if (!stillApproved()) return;
      if (!await load() || !stillApproved()) return;
      p = current()!;
      if (!fresh(p)) throw new Error('payment-window-too-short');
      if (!eligible(p)) throw new Error('runtime-not-ready');
      checkedQuote(p);
      busy = 'submitting'; uncertain.add(id); ++readVersion; clearTimeout(timer); notice = 'Payment authorization is being submitted. Wait for the recorded outcome; do not pay again.'; render();
      const data = await request({ operation: 'submit', purchaseId: id, quoteHash: hash, paymentSignature: signed.paymentSignature, confirmPublic: true });
      if (!live(version)) return;
      if (!data.purchase?.id) throw new PurchaseRequestError(200, 'invalid-response');
      acceptPurchase(data.purchase); resetApproval(); notice = '';
    } catch (error) {
      if (!live(version)) return;
      if (error instanceof PurchaseRequestError && error.status === 401) { invalidateSession(error.message); return; }
      if (error instanceof PurchaseRequestError && error.status >= 400 && error.status < 600 && UNSUBMITTED_REASONS.has(error.reason)) {
        uncertain.delete(id); mustRefresh.add(id); resetApproval();
      }
      notice = uncertain.has(id) ? 'The submission outcome could not be confirmed. Check this purchase; do not sign or pay again.'
        : error instanceof PurchaseRequestError ? error.message : purchaseError((error as any)?.code === 4001 ? 'user-rejected' : (error as Error)?.message || '');
    } finally { if (live(version)) {
      if (busy === 'signing' && notice === APPROVAL_NOTICE) {
        resetApproval(); notice = 'Approval interrupted. No payment was submitted by this page. Review the current quote before trying again.';
      }
      busy = ''; render(); schedule();
    } }
  }
  async function reviewPurchase() {
    if (q<HTMLButtonElement>('[data-purchase-quote]').disabled) return;
    const version = epoch, fingerprint = quoteFingerprint();
    const body = { runtimeId: selectedRuntime, question: question.value.trim() };
    const previous = snapshot.purchases.find(p => p.status === 'quoted' && !uncertain.has(p.id));
    if (previous) {
      if (fresh(previous) && previous.runtimeId === body.runtimeId && previous.question === body.question) { resetApproval(); selectedId = previous.id; notice = 'Review your existing quote. No new purchase was created.'; render(); return; }
      const closed = await mutate({ operation: 'cancel', purchaseId: previous.id });
      if (!live(version) || !closed || closed.status !== 'expired') return;
    }
    if (quoteRetry?.fingerprint !== fingerprint) quoteRetry = { fingerprint, requestId: win.crypto.randomUUID() };
    await mutate({ operation: 'quote', requestId: quoteRetry.requestId, ...body });
  }
  form.addEventListener('submit', (event) => { event.preventDefault(); void reviewPurchase(); }, { signal: lifetime.signal });
  function draftChanged() {
    draftDirty = true;
    if (quoteRetry?.fingerprint !== quoteFingerprint()) quoteRetry = null;
    const p = current();
    if (p?.status === 'quoted' && (p.question !== question.value.trim() || p.runtimeId !== selectedRuntime)) { resetApproval(); }
    render();
  }
  form.addEventListener('input', draftChanged, { signal: lifetime.signal });
  runtimeSelect.addEventListener('change', () => { selectedRuntime = runtimeSelect.value; draftChanged(); }, { signal: lifetime.signal });
  consent.addEventListener('change', render, { signal: lifetime.signal });
  walletSelect.addEventListener('change', () => { resetWallet(); selectedWallet = walletSelect.value; notice = ''; render(); }, { signal: lifetime.signal });
  q('[data-purchase-connect]').addEventListener('click', () => void connect(), { signal: lifetime.signal });
  q('[data-purchase-approve]').addEventListener('click', () => void approve(), { signal: lifetime.signal });
  q('[data-purchase-stop]').addEventListener('click', () => { resetApproval(); notice = purchaseError('purchase-cancelled'); render(); }, { signal: lifetime.signal });
  q('[data-purchase-skip]').addEventListener('click', () => { const p = current(); if (p && fresh(p)) void mutate({ operation: 'cancel', purchaseId: p.id }); }, { signal: lifetime.signal });
  q('[data-purchase-reconcile]').addEventListener('click', () => { const p = current(); if (p) void mutate({ operation: 'reconcile', purchaseId: p.id }); }, { signal: lifetime.signal });
  q('[data-purchase-history]').addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-purchase-id]'); if (!button || busy) return;
    resetApproval(); draftDirty = false; selectedId = button.dataset.purchaseId || ''; const p = current();
    if (p?.status === 'quoted') { question.value = p.question; if (snapshot.runtimes.some(r => r.id === p.runtimeId)) selectedRuntime = p.runtimeId; }
    notice = ''; render();
  }, { signal: lifetime.signal });
  // The wallet bridge also reports unchanged sessions during cross-tab storage sync.
  // Only duplicate bridge reports are inert; explicit auth actions always invalidate.
  function authChanged(event: Event) {
    const detail = (event as CustomEvent<{ user?: Partial<Pick<PointCastUser, 'userId'>> | null; source?: string }>).detail;
    const owner = typeof detail?.user?.userId === 'string' && detail.user.userId ? detail.user.userId : null;
    if (event.type === 'pc:auth-change' && detail?.source === 'tezos-session-bridge' && owner && owner === lastAuthOwner) return;
    lastAuthOwner = owner;
    ++epoch; ++readVersion; requests.abort(); requests = new win.AbortController(); clearTimeout(timer); busy = ''; notice = ''; available = false; acceptedSession = false; authMissing = false; loading = true; clearSensitive(); render();
    if (event.type === 'pc:auth-change' && detail?.user === null) { loading = false; authMissing = true; render(); return; }
    void load();
  }
  win.addEventListener('pc:auth-change', authChanged, { signal: lifetime.signal });
  win.addEventListener('pc:auth-refresh', authChanged, { signal: lifetime.signal });
  doc.addEventListener('visibilitychange', () => { clearTimeout(timer); if (doc.visibilityState === 'visible' && acceptedSession) void load(); }, { signal: lifetime.signal });
  discovery = walletApi.createWalletDiscovery(win, (found) => { wallets = found; if (selectedWallet && !found.some((w) => w.uuid === selectedWallet)) { resetWallet(); selectedWallet = ''; } render(); });
  wallets = discovery.wallets(); render(); void load();
  return () => { ++epoch; ++readVersion; clearTimeout(timer); requests.abort(); clearSensitive(); discovery?.stop(); lifetime.abort(); };
}
