/**
 * /api/auth/tezos
 *
 * Auth records prefer AUTH_DB. USERS remains a fallback for previews and
 * legacy session read-through during the D1 cutover.
 */

import { getPkhfromPk, verifySignature } from '@taquito/utils';

import type { AuthIdentity } from '../../../src/lib/auth/types';
import {
  deliverHeldKennelClubDogs,
  linkedTezosAddress,
  type KennelClaimEnv,
} from '../kennel-club/_claims';
import {
  IdentityConflictError,
  authJson,
  hasAuthStorage,
  issueSession,
  readAuthState,
  readSessionFromRequest,
  upsertUserForIdentity,
  withSessionCookie,
  writeAuthState,
  type AuthEnv,
} from './session';

interface TezosAuthBody {
  address?: unknown;
  publicKey?: unknown;
  signature?: unknown;
  message?: unknown;
}

const LOGIN_PREFIX = 'PointCast Tezos Login';
const MESSAGE_TTL_MS = 5 * 60 * 1000;
const NONCE_PREFIX = 'auth-nonce:tezos:';

function michelineStringPayload(value: string): string {
  const bytes = Array.from(new TextEncoder().encode(value))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  const byteLength = (bytes.length / 2).toString(16).padStart(8, '0');
  return `0501${byteLength}${bytes}`;
}

function parseSignedMessage(message: string): Record<string, string> | null {
  const lines = message.split('\n');
  if (lines[0]?.trim() !== LOGIN_PREFIX) return null;

  const fields: Record<string, string> = {};
  for (const line of lines.slice(1)) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) fields[key] = value;
  }

  return fields;
}

function shortAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export const onRequestPost: PagesFunction<AuthEnv & KennelClaimEnv> = async (context) => {
  const { request, env } = context;
  if (!hasAuthStorage(env)) {
    return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  }

  let body: TezosAuthBody;
  try {
    body = (await request.json()) as TezosAuthBody;
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }

  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const publicKey = typeof body.publicKey === 'string' ? body.publicKey.trim() : '';
  const signature = typeof body.signature === 'string' ? body.signature.trim() : '';
  const message = typeof body.message === 'string' ? body.message : '';

  if (!address || !publicKey || !signature || !message) {
    return authJson({ ok: false, reason: 'missing-fields' }, { status: 400 });
  }

  const parsedMessage = parseSignedMessage(message);
  if (!parsedMessage) {
    return authJson({ ok: false, reason: 'bad-message-format' }, { status: 400 });
  }

  const requestOrigin = new URL(request.url).origin;
  if (parsedMessage.Address !== address || parsedMessage.Origin !== requestOrigin) {
    return authJson({ ok: false, reason: 'message-mismatch' }, { status: 400 });
  }

  const issuedAt = Date.parse(parsedMessage['Issued At'] ?? '');
  if (!Number.isFinite(issuedAt) || Math.abs(Date.now() - issuedAt) > MESSAGE_TTL_MS) {
    return authJson({ ok: false, reason: 'stale-message' }, { status: 400 });
  }

  const nonce = parsedMessage.Nonce ?? '';
  if (!/^[a-zA-Z0-9-]{16,128}$/.test(nonce)) {
    return authJson({ ok: false, reason: 'bad-nonce' }, { status: 400 });
  }
  const nonceKey = `${NONCE_PREFIX}${nonce}`;
  if (await readAuthState<string>(env, nonceKey)) {
    return authJson({ ok: false, reason: 'replayed-message' }, { status: 409 });
  }

  let derivedAddress = '';
  try {
    derivedAddress = getPkhfromPk(publicKey);
  } catch {
    return authJson({ ok: false, reason: 'bad-public-key' }, { status: 400 });
  }

  if (derivedAddress !== address) {
    return authJson({ ok: false, reason: 'address-public-key-mismatch' }, { status: 401 });
  }

  const isValidSignature = verifySignature(
    michelineStringPayload(message),
    publicKey,
    signature,
  );
  if (!isValidSignature) {
    return authJson({ ok: false, reason: 'invalid-signature' }, { status: 401 });
  }
  await writeAuthState(env, nonceKey, address, Math.ceil(MESSAGE_TTL_MS / 1000));

  const current = await readSessionFromRequest(request, env);
  const identity: AuthIdentity = {
    provider: 'kukai',
    id: address,
    name: shortAddress(address),
    verifiedAt: new Date().toISOString(),
  };

  try {
    const user = await upsertUserForIdentity(env, identity, {
      currentUserId: current?.user.userId ?? null,
    });
    const deliveryAddress = linkedTezosAddress(user);
    if (deliveryAddress && env.AUTH_DB && env.KENNEL_CLUB_CLAIM_SECRET_KEY) {
      context.waitUntil(deliverHeldKennelClubDogs({
        env,
        userId: user.userId,
        deliveredTo: deliveryAddress,
      }).catch((error) => {
        console.error(JSON.stringify({
          message: 'kennel-club-auto-delivery-failed',
          userId: user.userId,
          error: error instanceof Error ? error.message : String(error),
        }));
      }));
    }
    const session = await issueSession(env, user.userId);
    return withSessionCookie(
      authJson({
        ok: true,
        user,
        session,
      }),
      session,
    );
  } catch (error) {
    if (error instanceof IdentityConflictError) {
      return authJson({ ok: false, reason: 'identity-already-linked' }, { status: 409 });
    }
    throw error;
  }
};
