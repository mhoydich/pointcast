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

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isMobileSafari(): boolean {
  if (!isBrowser()) return false;
  const ua = window.navigator.userAgent;
  return /iP(ad|hone|od)/.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
}

function utf8ToHex(value: string): string {
  return Array.from(new TextEncoder().encode(value))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
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

function persistWallet(wallet: StoredWallet | null): void {
  if (!isBrowser()) return;
  try {
    if (wallet) {
      window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
    } else {
      window.localStorage.removeItem(WALLET_STORAGE_KEY);
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

export async function loginWithKukai(): Promise<PointCastUser | null> {
  if (!isBrowser()) return null;

  const [{ connectKukai }, { BeaconWallet }] = await Promise.all([
    import('../tezos'),
    import('@taquito/beacon-wallet'),
  ]);

  const wallet = new BeaconWallet({
    name: 'PointCast',
    preferredNetwork: 'mainnet' as any,
  });

  let activeAccount = await wallet.client.getActiveAccount();
  if (!activeAccount) {
    await connectKukai();
    activeAccount = await wallet.client.getActiveAccount();
  }
  if (!activeAccount) {
    await wallet.requestPermissions({ network: { type: 'mainnet' as any } });
    activeAccount = await wallet.client.getActiveAccount();
  }

  const address = activeAccount?.address ?? await wallet.getPKH();
  const publicKey = activeAccount?.publicKey ?? await wallet.getPK();
  const message = buildSignedMessage('Tezos', {
    Address: address,
    Origin: window.location.origin,
    'Issued At': new Date().toISOString(),
    Nonce: createNonce(),
  });
  const signature = await wallet.sign(utf8ToHex(message));
  const payload = await postJson<{ ok: true; user: PointCastUser }>('/api/auth/tezos', {
    address,
    publicKey,
    signature,
    message,
  });

  persistWallet({ chain: 'tezos', address, provider: 'kukai' });
  return payload.user;
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

  await fetch(SESSION_ENDPOINT, {
    method: 'DELETE',
    credentials: 'include',
  });
}
