/** Exhibition-only client. Collector authorization is a message signature, never an operation. */
export type Artwork = {
  id: number; number: number; title: string; slug: string; description: string;
  alt: string; image: string; preview: string; metadata: string;
};
type Claim = {
  id: string; artworkId: number; address: string;
  status: 'reserved' | 'signed' | 'submitted' | 'confirmed' | 'failed';
  operationHash?: string | null; receiptUrl?: string | null;
};
type DropStatus = {
  ok: boolean; enabled: boolean; phase: 'open' | 'closed' | 'preview' | 'unavailable';
  serverTime: string; closesAt: string; collectorCostMutez: number;
  artworks: { artworkId: number; editionSize: number; remaining: number }[];
  claim?: Claim | null;
};
type SignedBody = { address: string; artworkId: number; nonce: string; publicKey: string; signature: string };
type SigningWallet = {
  getActiveAddress(): Promise<string | null>;
  connectKukaiForSigning(): Promise<string>;
  signTezosPayload(message: string): Promise<{ address: string; publicKey: string; signature: string; payload: string }>;
};
type ClientOptions = {
  fetcher?: typeof fetch;
  wallet?: () => Promise<SigningWallet>;
  now?: () => number;
  pollMs?: number;
};

export function mountOtherWorlds(root: HTMLElement, artworks: Artwork[], options: ClientOptions = {}) {
  const document = root.ownerDocument;
  const window = document.defaultView!;
  const fetcher = options.fetcher ?? window.fetch.bind(window);
  const loadWallet = options.wallet ?? (() => import('./tezos'));
  const now = options.now ?? Date.now;
  const $ = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const dialog = $<HTMLDialogElement>('[data-art-dialog]');
  const claimButton = $<HTMLButtonElement>('[data-claim-button]');
  const retryButton = $<HTMLButtonElement>('[data-retry-button]');
  const message = $('[data-claim-message]');
  const receiptLink = $<HTMLAnchorElement>('[data-receipt-link]');
  let selected = artworks[0];
  let status: DropStatus | null = null;
  let serverClock = 0;
  let clockReceived = 0;
  let address: string | null = null;
  let claim: Claim | null = null;
  let signedBody: SignedBody | null = null;
  let busy = false;
  let destroyed = false;
  let lastTrigger: HTMLElement | null = null;
  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  let statusRequest = 0;
  let walletPromise: Promise<SigningWallet> | null = null;
  const wallet = () => walletPromise ??= loadWallet();
  const listeners: (() => void)[] = [];
  const listen = (target: EventTarget, name: string, callback: EventListener) => {
    target.addEventListener(name, callback);
    listeners.push(() => target.removeEventListener(name, callback));
  };

  function say(text: string, tone = '') {
    message.textContent = text;
    message.dataset.tone = tone;
  }

  function phase() {
    if (!status) return 'unavailable';
    const trustedTime = serverClock + Math.max(0, now() - clockReceived);
    if (Number.isFinite(serverClock) && trustedTime >= Date.parse(status.closesAt)) return 'closed';
    if (status.collectorCostMutez !== 0 || !Number.isFinite(serverClock)) return 'unavailable';
    return status.enabled && status.phase === 'open' ? 'open' : status.phase === 'closed' ? 'closed' : status.phase === 'preview' ? 'preview' : 'unavailable';
  }

  function isConfirmed(receipt: Claim | null): boolean {
    return receipt?.status === 'confirmed' && /^o[1-9A-HJ-NP-Za-km-z]{50}$/.test(receipt.operationHash ?? '');
  }

  function receiptForWallet() {
    return claim?.address === address ? claim : null;
  }

  function render() {
    const currentPhase = phase();
    root.dataset.phase = currentPhase;
    $('[data-drop-status]').textContent = {
      open: 'CLAIMS OPEN', closed: 'CLAIMS CLOSED', preview: 'EXHIBITION PREVIEW', unavailable: 'CLAIM DESK UNAVAILABLE',
    }[currentPhase];
    for (const art of artworks) {
      const inventory = status?.artworks?.find((item) => item.artworkId === art.id);
      const count = root.querySelector<HTMLElement>(`[data-edition-count="${art.id}"]`);
      if (count) count.textContent = currentPhase === 'open' && inventory && Number.isInteger(inventory.remaining)
        ? inventory.remaining === 0 ? 'All editions claimed' : `${inventory.remaining} of 27 available`
        : '27 editions';
    }
    const inventory = status?.artworks?.find((item) => item.artworkId === selected.id);
    $('[data-dialog-editions]').textContent = currentPhase === 'open' && inventory
      ? `${inventory.remaining} of 27 editions available` : 'Edition of 27';
    const walletLabel = $('[data-wallet-address]');
    walletLabel.hidden = !address;
    walletLabel.textContent = address ? `${address.slice(0, 8)}…${address.slice(-6)} · Tezos wallet` : '';
    root.querySelectorAll<HTMLButtonElement>('[data-previous-artwork],[data-next-artwork]').forEach((button) => { button.disabled = busy; });
    if (busy) { claimButton.disabled = true; return; }
    const receipt = receiptForWallet();
    receiptLink.hidden = true;
    retryButton.hidden = true;
    if (receipt) {
      const ownArt = artworks.find((art) => art.id === receipt.artworkId);
      claimButton.disabled = true;
      if (isConfirmed(receipt)) {
        claimButton.textContent = 'Artwork delivered';
        say(`${ownArt?.title ?? 'Your artwork'} is confirmed in your wallet. Thank you for collecting.`, 'success');
        receiptLink.href = `https://tzkt.io/${receipt.operationHash}`;
        receiptLink.hidden = false;
      } else if (receipt.status === 'failed') {
        claimButton.textContent = 'Delivery needs attention';
        say('This delivery was not confirmed. Check its status again before making another claim.', 'error');
        retryButton.hidden = false;
      } else {
        claimButton.textContent = receipt.status === 'reserved' ? 'Artwork reserved' : 'Delivery pending';
        say(`${ownArt?.title ?? 'Your artwork'} is reserved for this wallet. Pointcast is completing delivery; it is not confirmed yet.`);
        retryButton.textContent = signedBody ? 'Check delivery again' : 'Resume delivery with wallet';
        retryButton.hidden = false;
        if (/^o[1-9A-HJ-NP-Za-km-z]{50}$/.test(receipt.operationHash ?? '')) {
          receiptLink.href = `https://tzkt.io/${receipt.operationHash}`;
          receiptLink.textContent = 'View pending operation on Tezos ↗';
          receiptLink.hidden = false;
        }
      }
      if (isConfirmed(receipt)) receiptLink.textContent = 'View delivery on Tezos ↗';
      return;
    }
    claimButton.disabled = currentPhase !== 'open' || !inventory || inventory.remaining <= 0;
    if (currentPhase === 'closed') {
      claimButton.textContent = 'Claims have closed';
      say('This exhibition’s claim window ended at midnight Pacific time on September 13, 2026. The gallery remains open.');
    } else if (currentPhase === 'preview') {
      claimButton.textContent = 'Claims are not open yet';
      say('The exhibition is on view. Free claims will become available when the publisher opens the claim desk.');
    } else if (currentPhase === 'unavailable' || !inventory) {
      claimButton.textContent = 'Claim desk unavailable';
      say('Live availability could not be verified. Please try again shortly.');
      retryButton.textContent = 'Check availability again';
      retryButton.hidden = false;
    } else if (inventory.remaining <= 0) {
      claimButton.textContent = 'All 27 editions claimed';
      say('This transmission is fully collected. You can choose another available artwork.');
    } else {
      claimButton.textContent = address ? 'Sign & claim this artwork · 0 ꜩ' : 'Connect wallet to claim · 0 ꜩ';
      say('Approve a free message signature to confirm wallet control. Pointcast pays the transaction fee.');
    }
  }

  function showArtwork(id: number, trigger?: HTMLElement) {
    if (busy) return;
    const artwork = artworks.find((item) => item.id === id);
    if (!artwork) return;
    selected = artwork;
    const img = $<HTMLImageElement>('[data-dialog-image]');
    img.src = artwork.preview;
    img.alt = artwork.alt;
    $('[data-dialog-title]').textContent = artwork.title;
    $('[data-dialog-description]').textContent = artwork.description;
    $('[data-dialog-number]').textContent = `TRANSMISSION ${String(artwork.number).padStart(2, '0')} / 09`;
    $<HTMLAnchorElement>('[data-original-link]').href = artwork.image;
    $<HTMLAnchorElement>('[data-metadata-link]').href = artwork.metadata;
    render();
    if (!dialog.open) {
      lastTrigger = trigger ?? null;
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
      $('[data-close-dialog]').focus();
    }
  }

  function closeDialog() {
    dialog.close();
  }

  async function request(path: string, body?: unknown) {
    const response = await fetcher(path, {
      method: body ? 'POST' : 'GET', cache: 'no-store', credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      const error = new Error(data.message || 'The claim desk could not complete that request.');
      Object.assign(error, { reason: data.reason, claim: data.claim });
      throw error;
    }
    return data;
  }

  async function refreshStatus() {
    const requestId = ++statusRequest;
    const currentAddress = address;
    try {
      const next = await request(`/api/other-worlds${currentAddress ? `?address=${encodeURIComponent(currentAddress)}` : ''}`) as DropStatus;
      if (destroyed || requestId !== statusRequest || address !== currentAddress) return;
      if (!Array.isArray(next.artworks) || !next.closesAt || !next.serverTime) throw new Error('Invalid availability response.');
      status = next;
      serverClock = Date.parse(next.serverTime);
      clockReceived = now();
      if (next.claim?.address === address) claim = next.claim;
      render();
      if (claim && !isConfirmed(claim) && claim.status !== 'failed') schedulePoll();
    } catch {
      if (destroyed || requestId !== statusRequest) return;
      status = null;
      render();
    }
  }

  function acceptClaim(value: Claim) {
    if (!value?.id || value.address !== address || !artworks.some((art) => art.id === value.artworkId)) {
      throw new Error('The claim desk returned an unexpected receipt. Please check availability again.');
    }
    claim = value;
  }

  function schedulePoll() {
    if (pollTimer || destroyed || !receiptForWallet() || isConfirmed(claim) || claim?.status === 'failed') return;
    pollTimer = setTimeout(() => {
      pollTimer = null;
      if (!destroyed && !busy) void pollReceipt();
    }, options.pollMs ?? 6000);
  }

  async function pollReceipt(resume = false) {
    if (busy || !receiptForWallet()) return;
    busy = true;
    render();
    try {
      const data = await request(`/api/other-worlds/receipt?id=${encodeURIComponent(claim!.id)}`);
      acceptClaim(data.claim);
      if (!isConfirmed(claim) && claim?.status !== 'failed' && signedBody && (resume || claim?.status === 'reserved' || claim?.status === 'signed')) {
        acceptClaim((await request('/api/other-worlds/claim', signedBody)).claim);
      }
    } catch {
      // A network timeout does not prove that the operation failed. Keep its receipt.
      busy = false;
      render();
      say('Delivery status is temporarily unavailable. Your reservation is retained; check again shortly.');
      schedulePoll();
      return;
    } finally {
      busy = false;
    }
    render();
    schedulePoll();
  }

  async function claimArtwork(resume = false) {
    if (busy) return;
    if (!resume && (claimButton.disabled || phase() !== 'open')) return;
    const artworkId = resume && claim ? claim.artworkId : selected.id;
    busy = true;
    claimButton.textContent = 'Opening your wallet…';
    render();
    say('Connect your Tezos wallet. No payment is requested.');
    try {
      const signer = await wallet();
      const signingAddress = await signer.connectKukaiForSigning();
      if (address && address !== signingAddress) { claim = null; signedBody = null; }
      address = signingAddress;
      // Refresh after connect: the wallet may already own a claim or this artwork may have filled.
      await refreshStatus();
      if (receiptForWallet() && !resume) {
        busy = false;
        render();
        return;
      }
      if (!resume && (phase() !== 'open' || (status?.artworks.find((art) => art.artworkId === artworkId)?.remaining ?? 0) <= 0)) {
        busy = false;
        render();
        return;
      }
      const challenge = await request('/api/other-worlds/challenge', { address: signingAddress, artworkId });
      if (typeof challenge.message !== 'string' || typeof challenge.nonce !== 'string') throw new Error('The claim desk returned an invalid wallet challenge.');
      claimButton.textContent = 'Approve the free signature…';
      say('In your wallet, sign the message for this artwork. This verifies wallet control and costs 0 ꜩ.');
      const proof = await signer.signTezosPayload(challenge.message);
      if (proof.address !== signingAddress || address !== signingAddress) throw new Error('The active wallet changed. Please connect again before claiming.');
      if (challenge.payload && proof.payload !== challenge.payload) throw new Error('The signed message did not match the claim challenge.');
      signedBody = { address: signingAddress, artworkId, nonce: challenge.nonce, publicKey: proof.publicKey, signature: proof.signature };
      claimButton.textContent = 'Reserving your artwork…';
      say('Wallet control verified. Pointcast is preparing your delivery.');
      acceptClaim((await request('/api/other-worlds/claim', signedBody)).claim);
    } catch (error) {
      const err = error as Error & { reason?: string; claim?: Claim };
      if (err.claim?.address === address) claim = err.claim;
      busy = false;
      // The signed POST may have reached the server even if its reply was lost.
      // Re-read the wallet receipt before offering a new claim.
      if (signedBody) await refreshStatus();
      render();
      if (!receiptForWallet()) {
        const declined = /abort|reject|denied|declin|cancel/i.test(`${err.name} ${err.message}`);
        say(declined ? 'The wallet request was cancelled. No claim has been confirmed. You can try again.' : err.message || 'The claim could not be completed. Please try again.', 'error');
      }
      schedulePoll();
      return;
    } finally {
      busy = false;
    }
    render();
    schedulePoll();
  }

  listen(root, 'click', ((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const opener = target.closest<HTMLElement>('[data-open-artwork]');
    if (opener && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      showArtwork(Number(opener.dataset.openArtwork), opener);
    }
  }) as EventListener);
  listen($('[data-close-dialog]'), 'click', closeDialog);
  listen(dialog, 'close', () => { document.documentElement.style.overflow = ''; lastTrigger?.focus(); });
  listen(dialog, 'click', ((event: MouseEvent) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
  }) as EventListener);
  listen(dialog, 'keydown', ((event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft' && !busy) { event.preventDefault(); showArtwork(artworks[(artworks.indexOf(selected) + artworks.length - 1) % artworks.length].id); }
    if (event.key === 'ArrowRight' && !busy) { event.preventDefault(); showArtwork(artworks[(artworks.indexOf(selected) + 1) % artworks.length].id); }
  }) as EventListener);
  listen($('[data-previous-artwork]'), 'click', () => showArtwork(artworks[(artworks.indexOf(selected) + artworks.length - 1) % artworks.length].id));
  listen($('[data-next-artwork]'), 'click', () => showArtwork(artworks[(artworks.indexOf(selected) + 1) % artworks.length].id));
  listen(claimButton, 'click', () => { void claimArtwork(); });
  listen(retryButton, 'click', () => {
    if (receiptForWallet()) {
      if (!signedBody && claim?.status !== 'failed' && !isConfirmed(claim)) void claimArtwork(true);
      else void pollReceipt(true);
    } else void refreshStatus();
  });
  listen(window, 'pc:wallet-change', ((event: CustomEvent<{ address?: string } | null>) => {
    const next = event.detail?.address ?? null;
    if (next !== address) {
      address = next; claim = null; signedBody = null;
      if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
      void refreshStatus();
    }
  }) as EventListener);
  listen(document, 'visibilitychange', () => { if (!document.hidden) void refreshStatus(); });
  const tick = setInterval(() => { if (!destroyed && !busy && root.dataset.phase !== phase()) render(); }, 1000);
  const refresh = setInterval(() => { if (!document.hidden && !busy) void refreshStatus(); }, 30000);
  const ready = refreshStatus();
  // Lazy-load Beacon only on explicit interaction. Wallet restoration is read-only once the dialog opens.
  let restored = false;
  listen(root, 'click', ((event: MouseEvent) => {
    if (!(event.target as HTMLElement).closest('[data-open-artwork]') || restored) return;
    restored = true;
    void wallet().then((signer) => signer.getActiveAddress()).then((active) => {
      if (!destroyed && !busy && active && active !== address) { address = active; return refreshStatus(); }
    }).catch(() => { /* Browse-only access stays available when wallet storage is unavailable. */ });
  }) as EventListener);

  return {
    ready, refreshStatus, showArtwork, claimArtwork, pollReceipt,
    destroy() {
      destroyed = true;
      ++statusRequest;
      clearInterval(tick); clearInterval(refresh);
      if (pollTimer) clearTimeout(pollTimer);
      listeners.forEach((remove) => remove());
      document.documentElement.style.overflow = '';
    },
  };
}
