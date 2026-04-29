/**
 * Sparrow cartridges — the AI-subscription primitive (v0.41).
 *
 * A cartridge is one of the user's AI subscriptions, represented as a
 * small JSON object the user installs once into Sparrow. Each cartridge
 * carries identity (provider, model, label, color, glyph), declared
 * capabilities (text.complete, text.chat, image.generate, audio.tts,
 * etc.), and auth metadata WITHOUT the actual key — keys live
 * separately under a NIP-44-encrypted localStorage entry.
 *
 * Users own their AI relationships. Their keys never leave the device
 * unencrypted; their cartridge list can be federated publicly without
 * leaking secrets.
 *
 * See docs/plans/2026-04-29-sparrow-cartridge-front-door.md.
 */

// ─── Types ───────────────────────────────────────────────────────────

export type CartridgeCapability =
  | 'text.complete' | 'text.chat' | 'text.tool_use'
  | 'image.understand' | 'image.generate'
  | 'audio.transcribe' | 'audio.tts' | 'audio.generate'
  | 'video.generate' | 'embedding.text';

export type CartridgeAuthMethod = 'api_key' | 'oauth' | 'local';

export interface CartridgeAuth {
  method: CartridgeAuthMethod;
  header?: string;
  endpoint: string;
  key_ref: string;
  header_prefix?: string;
}

export interface CartridgeLimits {
  context_tokens?: number;
  rate_per_min?: number;
  cost_estimate_per_1k_input?: number;
  cost_estimate_per_1k_output?: number;
}

export interface Cartridge {
  id: string;
  schema: 'sparrow-cartridge-v1';
  provider: string;
  model: string;
  label: string;
  color: string;
  glyph: string;
  capabilities: CartridgeCapability[];
  auth: CartridgeAuth;
  limits?: CartridgeLimits;
  added_at: number;
  shared: boolean;
}

// ─── localStorage keys ───────────────────────────────────────────────

const KEY_LIST = 'sparrow:cartridges:v1';
const KEY_PREFIX = 'sparrow:cartridges:keys:';
const KEY_DEFAULT = 'sparrow:cartridges:default';

// ─── List read / write ──────────────────────────────────────────────

export function listCartridges(): Cartridge[] {
  try {
    const raw = localStorage.getItem(KEY_LIST);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is Cartridge => validateCartridge(c) === null);
  } catch { return []; }
}

function writeList(list: Cartridge[]): void {
  try {
    localStorage.setItem(KEY_LIST, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('sparrow:cartridges-changed'));
  } catch { /* localStorage full or disabled — fail silent */ }
}

export function validateCartridge(value: unknown): string | null {
  if (!value || typeof value !== 'object') return 'not an object';
  const c = value as Partial<Cartridge>;
  if (typeof c.id !== 'string' || !c.id.match(/^[a-z0-9][a-z0-9-_]*$/)) return 'invalid id';
  if (c.schema !== 'sparrow-cartridge-v1') return 'unsupported schema';
  if (typeof c.provider !== 'string' || !c.provider) return 'missing provider';
  if (typeof c.model !== 'string' || !c.model) return 'missing model';
  if (typeof c.label !== 'string' || !c.label) return 'missing label';
  if (typeof c.color !== 'string') return 'missing color';
  if (typeof c.glyph !== 'string') return 'missing glyph';
  if (!Array.isArray(c.capabilities) || c.capabilities.length === 0) return 'missing capabilities';
  if (!c.auth || typeof c.auth !== 'object') return 'missing auth';
  const auth = c.auth as CartridgeAuth;
  if (!['api_key', 'oauth', 'local'].includes(auth.method)) return 'invalid auth.method';
  if (typeof auth.endpoint !== 'string') return 'missing auth.endpoint';
  if (typeof auth.key_ref !== 'string') return 'missing auth.key_ref';
  if (typeof c.added_at !== 'number') return 'missing added_at';
  if (typeof c.shared !== 'boolean') return 'missing shared';
  return null;
}

// ─── Add / remove ────────────────────────────────────────────────────

export function addCartridge(c: Cartridge): Cartridge {
  const err = validateCartridge(c);
  if (err) throw new Error(`cartridge invalid: ${err}`);
  if (!localStorage.getItem(c.auth.key_ref)) {
    throw new Error('cartridge key not found at auth.key_ref — store key first');
  }
  const list = listCartridges();
  if (list.some((existing) => existing.id === c.id)) {
    throw new Error(`cartridge with id "${c.id}" already exists`);
  }
  const next = [...list, c];
  writeList(next);
  if (list.length === 0) setDefaultCartridge(c.id);
  return c;
}

export function removeCartridge(id: string): boolean {
  const list = listCartridges();
  const target = list.find((c) => c.id === id);
  if (!target) return false;
  try { localStorage.removeItem(target.auth.key_ref); } catch { /* empty */ }
  const next = list.filter((c) => c.id !== id);
  writeList(next);
  if (getDefaultCartridgeId() === id) setDefaultCartridge(next[0]?.id ?? null);
  return true;
}

// ─── Default cartridge ───────────────────────────────────────────────

export function getDefaultCartridgeId(): string | null {
  try { return localStorage.getItem(KEY_DEFAULT); } catch { return null; }
}

export function getDefaultCartridge(): Cartridge | null {
  const id = getDefaultCartridgeId();
  if (!id) return null;
  return listCartridges().find((c) => c.id === id) ?? null;
}

export function setDefaultCartridge(id: string | null): void {
  try {
    if (id) localStorage.setItem(KEY_DEFAULT, id);
    else localStorage.removeItem(KEY_DEFAULT);
    window.dispatchEvent(new CustomEvent('sparrow:cartridges-changed'));
  } catch { /* empty */ }
}

// ─── Encrypted key store ─────────────────────────────────────────────

export function keyRefFor(id: string): string {
  return `${KEY_PREFIX}${id}`;
}

/**
 * Encrypt and store an API key. Uses NIP-44 self-encryption when
 * window.nostr.nip44 is available (NIP-07 signer installed); otherwise
 * falls back to a clearly-labeled `unencrypted-v1` envelope so the UI
 * can warn the user. Returns the key_ref the cartridge should
 * reference.
 */
export async function storeKey(id: string, key: string): Promise<string> {
  const ref = keyRefFor(id);
  try {
    const w = window as unknown as {
      nostr?: {
        getPublicKey?: () => Promise<string>;
        nip44?: { encrypt?: (pubkey: string, plaintext: string) => Promise<string> };
      };
    };
    const pk = await w.nostr?.getPublicKey?.();
    const ciphertext = pk ? await w.nostr?.nip44?.encrypt?.(pk, key) : null;
    if (pk && ciphertext) {
      const envelope = JSON.stringify({
        v: 'nip44-self-v1',
        pk,
        ct: ciphertext,
        at: Math.floor(Date.now() / 1000),
      });
      localStorage.setItem(ref, envelope);
      return ref;
    }
  } catch { /* fall through to unencrypted fallback */ }

  const envelope = JSON.stringify({
    v: 'unencrypted-v1',
    raw: key,
    at: Math.floor(Date.now() / 1000),
    warning: 'no NIP-07 signer available — install one for NIP-44 self-encryption',
  });
  localStorage.setItem(ref, envelope);
  return ref;
}

/**
 * Decrypt and return the API key for a cartridge id. Returns null when
 * no key is stored or decryption fails. The returned plaintext should
 * be used for a single API call and dropped.
 */
export async function fetchKey(id: string): Promise<string | null> {
  const ref = keyRefFor(id);
  const raw = localStorage.getItem(ref);
  if (!raw) return null;
  let envelope: { v?: string; pk?: string; ct?: string; raw?: string };
  try { envelope = JSON.parse(raw); } catch { return null; }
  if (envelope.v === 'unencrypted-v1' && typeof envelope.raw === 'string') {
    return envelope.raw;
  }
  if (envelope.v === 'nip44-self-v1' && envelope.pk && envelope.ct) {
    try {
      const w = window as unknown as {
        nostr?: { nip44?: { decrypt?: (pubkey: string, ciphertext: string) => Promise<string> } };
      };
      const plaintext = await w.nostr?.nip44?.decrypt?.(envelope.pk, envelope.ct);
      return plaintext ?? null;
    } catch { return null; }
  }
  return null;
}

export function hasUnencryptedKeys(): boolean {
  return listCartridges().some((c) => {
    const raw = localStorage.getItem(c.auth.key_ref);
    if (!raw) return false;
    try {
      const env = JSON.parse(raw);
      return env.v === 'unencrypted-v1';
    } catch { return false; }
  });
}

// ─── Factory ─────────────────────────────────────────────────────────

export function makeCartridge(partial: {
  id: string;
  provider: string;
  model: string;
  label: string;
  capabilities: CartridgeCapability[];
  auth: { method: CartridgeAuthMethod; header?: string; endpoint: string; header_prefix?: string };
  color?: string;
  glyph?: string;
  limits?: CartridgeLimits;
  shared?: boolean;
}): Cartridge {
  return {
    id: partial.id,
    schema: 'sparrow-cartridge-v1',
    provider: partial.provider,
    model: partial.model,
    label: partial.label,
    color: partial.color ?? 'oklch(74% 0.16 72)',
    glyph: partial.glyph ?? '✦',
    capabilities: partial.capabilities,
    auth: {
      method: partial.auth.method,
      header: partial.auth.header,
      endpoint: partial.auth.endpoint,
      header_prefix: partial.auth.header_prefix,
      key_ref: keyRefFor(partial.id),
    },
    limits: partial.limits,
    added_at: Math.floor(Date.now() / 1000),
    shared: partial.shared ?? false,
  };
}
