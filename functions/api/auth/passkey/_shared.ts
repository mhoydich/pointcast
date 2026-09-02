import type {
  AuthenticationResponseJSON,
  AuthenticatorTransport,
  Base64URLString,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';

import type { AuthIdentity, PointCastUser } from '../../../../src/lib/auth/types';
import type { AuthEnv } from '../session.ts';

export const PASSKEY_RP_ID = 'pointcast.xyz';
export const PASSKEY_RP_NAME = 'PointCast';
export const PASSKEY_CHALLENGE_TTL_SECONDS = 5 * 60;
export const PASSKEY_REGISTER_PREFIX = 'webauthn:register:';
export const PASSKEY_LOGIN_PREFIX = 'webauthn:login:';

export interface PasskeyEnv extends AuthEnv {
  PASSKEY_ALLOWED_ORIGINS?: string;
}

export interface RegisterChallengeState {
  challenge: string;
  userId: string;
  label: string;
  createdAt: string;
}

export interface LoginChallengeState {
  challenge: string;
  createdAt: string;
}

export interface PasskeyCredentialRow {
  credential_id: Base64URLString;
  user_id: string;
  public_key: ArrayBuffer | Uint8Array | number[];
  counter: number;
  transports: string;
  created_at: string;
  last_used_at: string | null;
  label: string;
}

export interface PasskeySummary {
  credentialId: string;
  label: string;
  transports: AuthenticatorTransport[];
  createdAt: string;
  lastUsedAt: string | null;
}

export interface PasskeyRegistrationBody {
  flowId?: unknown;
  response?: unknown;
}

export interface PasskeyLoginBody {
  flowId?: unknown;
  response?: unknown;
}

export function requirePasskeyDb(env: PasskeyEnv): D1Database | null {
  return env.AUTH_DB ?? null;
}

export function normalizePasskeyLabel(value: unknown): string {
  if (typeof value !== 'string') return 'This device';
  const label = value.replace(/\s+/gu, ' ').trim().slice(0, 64);
  return label || 'This device';
}

export function passkeyOrigins(env: PasskeyEnv): string[] {
  const configured = (env.PASSKEY_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .flatMap((value) => {
      try {
        const origin = new URL(value).origin;
        return origin === 'null' ? [] : [origin];
      } catch {
        return [];
      }
    });
  return [...new Set(['https://pointcast.xyz', ...configured])];
}

export function isRegistrationResponse(value: unknown): value is RegistrationResponseJSON {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { id?: unknown; rawId?: unknown; type?: unknown; response?: unknown };
  return typeof candidate.id === 'string'
    && typeof candidate.rawId === 'string'
    && candidate.type === 'public-key'
    && Boolean(candidate.response && typeof candidate.response === 'object');
}

export function isAuthenticationResponse(value: unknown): value is AuthenticationResponseJSON {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { id?: unknown; rawId?: unknown; type?: unknown; response?: unknown };
  return typeof candidate.id === 'string'
    && typeof candidate.rawId === 'string'
    && candidate.type === 'public-key'
    && Boolean(candidate.response && typeof candidate.response === 'object');
}

export function parseTransports(value: string): AuthenticatorTransport[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return normalizeTransports(Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

export function normalizeTransports(values: unknown[]): AuthenticatorTransport[] {
  return values.filter((item): item is AuthenticatorTransport => (
    typeof item === 'string' && ['ble', 'hybrid', 'internal', 'nfc', 'usb'].includes(item)
  ));
}

export function toPublicKeyBytes(value: PasskeyCredentialRow['public_key']): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return Uint8Array.from(value);
}

export async function listPasskeyRows(
  db: D1Database,
  userId: string,
): Promise<PasskeyCredentialRow[]> {
  const result = await db.prepare(`
    SELECT credential_id, user_id, public_key, counter, transports,
      created_at, last_used_at, label
    FROM passkey_credentials
    WHERE user_id = ?
    ORDER BY created_at ASC
  `).bind(userId).all<PasskeyCredentialRow>();
  return result.results ?? [];
}

export async function getPasskeyRow(
  db: D1Database,
  credentialId: string,
): Promise<PasskeyCredentialRow | null> {
  return db.prepare(`
    SELECT credential_id, user_id, public_key, counter, transports,
      created_at, last_used_at, label
    FROM passkey_credentials
    WHERE credential_id = ?
  `).bind(credentialId).first<PasskeyCredentialRow>();
}

export function passkeySummary(row: PasskeyCredentialRow): PasskeySummary {
  return {
    credentialId: row.credential_id,
    label: row.label,
    transports: parseTransports(row.transports),
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}

export async function insertPasskey(
  db: D1Database,
  values: {
    credentialId: Base64URLString;
    userId: string;
    publicKey: Uint8Array;
    counter: number;
    transports?: AuthenticatorTransport[];
    label: string;
  },
): Promise<void> {
  await db.prepare(`
    INSERT INTO passkey_credentials (
      credential_id, user_id, public_key, counter, transports,
      created_at, last_used_at, label
    ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
  `).bind(
    values.credentialId,
    values.userId,
    Uint8Array.from(values.publicKey).buffer,
    values.counter,
    JSON.stringify(values.transports ?? []),
    new Date().toISOString(),
    values.label,
  ).run();
}

export async function updatePasskeyUse(
  db: D1Database,
  credentialId: string,
  counter: number,
): Promise<void> {
  await db.prepare(`
    UPDATE passkey_credentials
    SET counter = ?, last_used_at = ?
    WHERE credential_id = ?
  `).bind(counter, new Date().toISOString(), credentialId).run();
}

export async function deleteOwnedPasskey(
  db: D1Database,
  user: PointCastUser,
  credentialId: string,
): Promise<boolean> {
  const row = await getPasskeyRow(db, credentialId);
  if (!row || row.user_id !== user.userId) return false;

  const identities = user.identities.filter((identity) => !(
    identity.provider === 'passkey' && identity.id === credentialId
  ));
  const nextUser: PointCastUser = { ...user, identities };
  await db.batch([
    db.prepare('DELETE FROM passkey_credentials WHERE credential_id = ? AND user_id = ?')
      .bind(credentialId, user.userId),
    db.prepare('DELETE FROM identities WHERE provider = ? AND id = ? AND user_id = ?')
      .bind('passkey', credentialId, user.userId),
    db.prepare('UPDATE users SET payload = ? WHERE id = ?')
      .bind(JSON.stringify(nextUser), user.userId),
  ]);
  return true;
}

export function passkeyIdentity(credentialId: string, label: string): AuthIdentity {
  return {
    provider: 'passkey',
    id: credentialId,
    name: label,
    verifiedAt: new Date().toISOString(),
  };
}
