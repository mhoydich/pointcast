import { generateRegistrationOptions } from '@simplewebauthn/server';

import { randomUrlSafeString } from '../../_oauth.ts';
import {
  authJson,
  hasFreshAuthentication,
  readSessionFromRequest,
  writeAuthState,
} from '../../session.ts';
import {
  PASSKEY_CHALLENGE_TTL_SECONDS,
  PASSKEY_REGISTER_PREFIX,
  PASSKEY_RP_ID,
  PASSKEY_RP_NAME,
  listPasskeyRows,
  normalizePasskeyLabel,
  parseTransports,
  requirePasskeyDb,
  type PasskeyEnv,
  type RegisterChallengeState,
} from '../_shared.ts';

type RegistrationOptionsGenerator = typeof generateRegistrationOptions;

export function createRegisterOptionsHandler(
  generateOptions: RegistrationOptionsGenerator = generateRegistrationOptions,
): PagesFunction<PasskeyEnv> {
  return async ({ request, env }) => {
    const db = requirePasskeyDb(env);
    if (!db) {
      return authJson({ ok: false, provider: 'passkey', reason: 'd1-not-bound' }, { status: 503 });
    }
    const current = await readSessionFromRequest(request, env);
    if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });
    if (!await hasFreshAuthentication(env, current.session)) {
      return authJson({ ok: false, reason: 'fresh-sign-in-required' }, { status: 403 });
    }

    let body: { label?: unknown } = {};
    try {
      body = await request.json() as typeof body;
    } catch {
      // An empty body uses the friendly default label.
    }
    const label = normalizePasskeyLabel(body.label);
    const existing = await listPasskeyRows(db, current.user.userId);
    const options = await generateOptions({
      rpName: PASSKEY_RP_NAME,
      rpID: PASSKEY_RP_ID,
      userID: new TextEncoder().encode(current.user.userId),
      userName: current.user.userId,
      userDisplayName: current.user.preferredName,
      attestationType: 'none',
      excludeCredentials: existing.map((row) => ({
        id: row.credential_id,
        transports: parseTransports(row.transports),
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
      preferredAuthenticatorType: 'localDevice',
      supportedAlgorithmIDs: [-7, -257],
    });

    const flowId = randomUrlSafeString();
    const state: RegisterChallengeState = {
      challenge: options.challenge,
      userId: current.user.userId,
      label,
      createdAt: new Date().toISOString(),
    };
    await writeAuthState(
      env,
      `${PASSKEY_REGISTER_PREFIX}${flowId}`,
      state,
      PASSKEY_CHALLENGE_TTL_SECONDS,
    );
    return authJson({ ok: true, flowId, options });
  };
}

export const onRequestPost = createRegisterOptionsHandler();
