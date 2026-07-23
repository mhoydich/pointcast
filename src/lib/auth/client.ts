import type { PointCastUser } from './types';

type SupportedWalletProvider = 'kukai' | 'metamask' | 'phantom';

type StoredWallet = {
  chain: 'tezos' | 'eth' | 'solana';
  address: string;
  provider: SupportedWalletProvider;
};

type EthereumProvider = {
  isMetaMask?: boolean;
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

type PhantomAccount = {
  publicKey?: { toString(): string };
};

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: { toString(): string };
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<PhantomAccount>;
  signMessage(message: Uint8Array, display?: 'utf8' | 'hex'): Promise<{ signature: Uint8Array }>;
};

const SESSION_ENDPOINT = '/api/auth/session';
const WALLET_STORAGE_KEY = 'pc:wallet';
const WALLETS_STORAGE_KEY = 'pc:wallets';
const ACTIVE_WALLET_STORAGE_KEY = 'pc:wallet-active';
let tezosLoginInFlight: Promise<PointCastUser | null> | null = null;

type TezosLoginOptions = {
  /** Skip the valid-cookie fast path and ask the active Beacon account to
   * prove control. Used for switching/linking wallets, not ordinary sign-in. */
  force?: boolean;
  /** Fail closed if Beacon changes accounts while a caller is linking a
   * specific active wallet to the PointCast session. */
  expectedAddress?: string;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isMobileSafari(): boolean {
  if (!isBrowser()) return false;
  const ua = window.navigator.userAgent;
  return /iP(ad|hone|od)/.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function createNonce(): string {
  if (!isBrowser()) return `ssr-${Date.now()}`;
  if (typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `pc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function persistWallet(wallet: StoredWallet | null): void {
  if (!isBrowser()) return;
  try {
    if (wallet) {
      window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
      if (wallet.chain === 'tezos') {
        let remembered: Array<StoredWallet & { addedAt?: number }> = [];
        try {
          const parsed = JSON.parse(window.localStorage.getItem(WALLETS_STORAGE_KEY) || '[]');
          if (Array.isArray(parsed)) remembered = parsed;
        } catch {
          // Replace malformed wallet memory with the verified session identity.
        }
        remembered = remembered.filter((entry) => entry?.address !== wallet.address);
        remembered.push({ ...wallet, addedAt: Date.now() });
        window.localStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(remembered));
        window.localStorage.setItem(ACTIVE_WALLET_STORAGE_KEY, wallet.address);
      }
    } else {
      window.localStorage.removeItem(WALLET_STORAGE_KEY);
      window.localStorage.removeItem(ACTIVE_WALLET_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures on locked-down browsers.
  }

  window.dispatchEvent(new CustomEvent('pc:wallet-change', { detail: wallet }));
}

function buildSignedMessage(kind: 'Tezos' | 'Ethereum' | 'Solana', fields: Record<string, string>): string {
  const lines = [`PointCast ${kind} Login`];
  for (const [key, value] of Object.entries(fields)) {
    lines.push(`${key}: ${value}`);
  }
  return lines.join('\n');
}

function openInstallUrl(url: string): void {
  if (!isBrowser()) return;
  if (isMobileSafari()) {
    window.location.assign(url);
    return;
  }
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    window.location.assign(url);
  }
}

function openServerAuth(pathname: string): null {
  if (!isBrowser()) return null;
  const url = new URL(pathname, window.location.origin);
  window.location.assign(url.toString());
  return null;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const reason = typeof payload?.reason === 'string'
      ? payload.reason
      : typeof payload?.message === 'string'
        ? payload.message
        : `Request failed with ${response.status}`;
    throw new Error(reason);
  }

  return payload as T;
}

function getEthereumProvider(): EthereumProvider | null {
  if (!isBrowser()) return null;
  const candidate = (window as any).ethereum;
  if (!candidate || typeof candidate.request !== 'function') return null;
  return candidate as EthereumProvider;
}

function getPhantomProvider(): PhantomProvider | null {
  if (!isBrowser()) return null;
  const candidate = (window as any).phantom?.solana ?? (window as any).solana;
  if (!candidate || typeof candidate.connect !== 'function' || typeof candidate.signMessage !== 'function') {
    return null;
  }
  return candidate as PhantomProvider;
}

async function performKukaiLogin(options: TezosLoginOptions): Promise<PointCastUser | null> {
  if (!isBrowser()) return null;

  if (!options.force) {
    const current = await getSession().catch(() => null);
    const identities = current?.identities.filter((item) => item.provider === 'kukai') ?? [];
    let activeAddress = '';
    try {
      activeAddress = window.localStorage.getItem(ACTIVE_WALLET_STORAGE_KEY) || '';
    } catch {
      // The signed session remains authoritative when storage is unavailable.
    }
    const identity = identities.find((item) => item.id === activeAddress)
      ?? identities.at(-1)
      ?? null;
    if (current && identity) {
      persistWallet({ chain: 'tezos', address: identity.id, provider: 'kukai' });
      return current;
    }
  }

  const { connectKukaiForSigning, signTezosPayload } = await import('../tezos');
  // Authentication is a gasless message signature. Asking Kukai for the
  // operation_request scope here can open a second permission flow (and, in
  // embedded/project handoffs, time out before the actual login signature).
  // Establish the smallest possible signing-only account first; the shared
  // Beacon client will reuse it when signTezosPayload runs below.
  const address = await connectKukaiForSigning();
  if (options.expectedAddress && address !== options.expectedAddress) {
    throw new Error('beacon-account-changed');
  }
  const message = buildSignedMessage('Tezos', {
    Address: address,
    Origin: window.location.origin,
    'Issued At': new Date().toISOString(),
    Nonce: createNonce(),
  });
  // The signed address must be part of the exact message. Connect/restore the
  // shared wallet first, then build and sign the final login challenge through
  // that same Beacon client.
  const proof = await signTezosPayload(message);
  const payload = await postJson<{ ok: true; user: PointCastUser }>('/api/auth/tezos', {
    address: proof.address,
    publicKey: proof.publicKey,
    signature: proof.signature,
    message,
  });

  persistWallet({ chain: 'tezos', address: proof.address, provider: 'kukai' });
  return payload.user;
}

/**
 * Sign into PointCast with Kukai once. Concurrent auth buttons share one
 * promise so a double click or two mounted menus cannot open competing Beacon
 * permission/signature requests.
 */
export async function loginWithKukai(
  options: TezosLoginOptions = {},
): Promise<PointCastUser | null> {
  if (tezosLoginInFlight) return tezosLoginInFlight;
  const pending = performKukaiLogin(options);
  tezosLoginInFlight = pending;
  try {
    return await pending;
  } finally {
    if (tezosLoginInFlight === pending) tezosLoginInFlight = null;
  }
}

/** Return the current signed user when this exact Tezos account is linked,
 * otherwise complete the free PointCast message-signature login. */
export async function ensurePointCastTezosLogin(address: string): Promise<PointCastUser | null> {
  const current = await getSession().catch(() => null);
  if (current?.identities.some((item) => item.provider === 'kukai' && item.id === address)) {
    persistWallet({ chain: 'tezos', address, provider: 'kukai' });
    return current;
  }
  return loginWithKukai({ force: true, expectedAddress: address });
}

/**
 * Rehydrate the browser wallet mirror from the signed PointCast session.
 * The HttpOnly cookie remains the source of truth; this only keeps legacy
 * mint/collect/profile surfaces in agreement with it.
 */
export async function restorePointCastTezosSession(): Promise<{
  user: PointCastUser | null;
  address: string | null;
}> {
  const user = await getSession();
  const identity = user?.identities.filter((item) => item.provider === 'kukai').at(-1) ?? null;
  if (!identity) return { user, address: null };
  persistWallet({ chain: 'tezos', address: identity.id, provider: 'kukai' });
  return { user, address: identity.id };
}

export async function loginWithGoogle(): Promise<PointCastUser | null> {
  return openServerAuth('/api/auth/google');
}

export async function loginWithApple(): Promise<PointCastUser | null> {
  return openServerAuth('/api/auth/apple');
}

export async function loginWithMetaMask(): Promise<PointCastUser | null> {
  if (!isBrowser()) return null;

  const provider = getEthereumProvider();
  if (!provider) {
    openInstallUrl('https://metamask.io/download/');
    throw new Error('metamask-not-available');
  }

  const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error('No Ethereum account returned.');

  const chainId = await provider.request({ method: 'eth_chainId' }).catch(() => null) as string | null;
  const message = buildSignedMessage('Ethereum', {
    Address: address,
    Origin: window.location.origin,
    'Issued At': new Date().toISOString(),
    Nonce: createNonce(),
    ...(chainId ? { 'Chain ID': chainId } : {}),
  });
  const signature = await provider.request({
    method: 'personal_sign',
    params: [message, address],
  }) as string;

  const payload = await postJson<{ ok?: boolean; user?: PointCastUser }>('/api/auth/ethereum', {
    provider: 'metamask',
    address,
    chainId,
    message,
    signature,
  });

  if (payload.user) {
    persistWallet({ chain: 'eth', address, provider: 'metamask' });
  }

  return payload.user ?? null;
}

export async function loginWithPhantom(): Promise<PointCastUser | null> {
  if (!isBrowser()) return null;

  const provider = getPhantomProvider();
  if (!provider) {
    openInstallUrl('https://phantom.app/download');
    throw new Error('phantom-not-available');
  }

  const connection = await provider.connect();
  const address = connection?.publicKey?.toString() ?? provider.publicKey?.toString();
  if (!address) throw new Error('No Solana account returned.');

  const message = buildSignedMessage('Solana', {
    Address: address,
    Origin: window.location.origin,
    'Issued At': new Date().toISOString(),
    Nonce: createNonce(),
  });
  const encodedMessage = new TextEncoder().encode(message);
  const signed = await provider.signMessage(encodedMessage, 'utf8');

  const payload = await postJson<{ ok?: boolean; user?: PointCastUser }>('/api/auth/solana', {
    provider: 'phantom',
    address,
    message,
    signature: bytesToBase64(signed.signature),
  });

  if (payload.user) {
    persistWallet({ chain: 'solana', address, provider: 'phantom' });
  }

  return payload.user ?? null;
}

export async function getSession(): Promise<PointCastUser | null> {
  if (!isBrowser()) return null;

  const response = await fetch(SESSION_ENDPOINT, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`session-fetch-failed:${response.status}`);
  }

  const payload = await response.json() as { user?: PointCastUser };
  return payload.user ?? null;
}

export async function logout(): Promise<void> {
  if (!isBrowser()) return;

  try {
    const { disconnectKukai } = await import('../tezos');
    await disconnectKukai();
  } catch {
    await fetch(SESSION_ENDPOINT, {
      method: 'DELETE',
      credentials: 'include',
    });
  }
  persistWallet(null);
  window.dispatchEvent(new CustomEvent('pc:auth-change', {
    detail: { user: null, source: 'auth-client' },
  }));
  window.dispatchEvent(new Event('pc:auth-refresh'));
}
