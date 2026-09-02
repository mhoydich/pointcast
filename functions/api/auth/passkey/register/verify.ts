import {
  verifyRegistrationResponse,
  type VerifiedRegistrationResponse,
} from '@simplewebauthn/server';

import {
  IdentityConflictError,
  authJson,
  consumeAuthState,
  readSessionFromRequest,
  upsertUserForIdentity,
} from '../../session.ts';
import {
  PASSKEY_REGISTER_PREFIX,
  PASSKEY_RP_ID,
  insertPasskey,
  isRegistrationResponse,
  normalizeTransports,
  passkeyIdentity,
  passkeyOrigins,
  requirePasskeyDb,
  type PasskeyEnv,
  type PasskeyRegistrationBody,
  type RegisterChallengeState,
} from '../_shared.ts';

type RegistrationVerifier = (options: Parameters<typeof verifyRegistrationResponse>[0]) => Promise<VerifiedRegistrationResponse>;

export function createRegisterVerifyHandler(
  verifyResponse: RegistrationVerifier = verifyRegistrationResponse,
): PagesFunction<PasskeyEnv> {
  return async ({ request, env }) => {
    const db = requirePasskeyDb(env);
    if (!db) {
      return authJson({ ok: false, provider: 'passkey', reason: 'd1-not-bound' }, { status: 503 });
    }
    const current = await readSessionFromRequest(request, env);
    if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });

    let body: PasskeyRegistrationBody;
    try {
      body = await request.json() as PasskeyRegistrationBody;
    } catch {
      return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
    }
    const flowId = typeof body.flowId === 'string' ? body.flowId : '';
    if (!flowId || !isRegistrationResponse(body.response)) {
      return authJson({ ok: false, reason: 'bad-passkey-response' }, { status: 400 });
    }

    const state = await consumeAuthState<RegisterChallengeState>(
      env,
      `${PASSKEY_REGISTER_PREFIX}${flowId}`,
    );
    if (!state) {
      return authJson({ ok: false, reason: 'passkey-challenge-expired-or-used' }, { status: 401 });
    }
    if (state.userId !== current.user.userId) {
      return authJson({ ok: false, reason: 'passkey-session-changed' }, { status: 403 });
    }

    try {
      const verification = await verifyResponse({
        response: body.response,
        expectedChallenge: state.challenge,
        expectedOrigin: passkeyOrigins(env),
        expectedRPID: PASSKEY_RP_ID,
        requireUserVerification: true,
        supportedAlgorithmIDs: [-7, -257],
      });
      if (!verification.verified) {
        return authJson({ ok: false, reason: 'passkey-verification-failed' }, { status: 401 });
      }

      const { credential } = verification.registrationInfo;
      await insertPasskey(db, {
        credentialId: credential.id,
        userId: current.user.userId,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: normalizeTransports(credential.transports ?? []),
        label: state.label,
      });

      try {
        const user = await upsertUserForIdentity(
          env,
          passkeyIdentity(credential.id, state.label),
          { currentUserId: current.user.userId },
        );
        return authJson({ ok: true, verified: true, user, credentialId: credential.id });
      } catch (error) {
        await db.prepare('DELETE FROM passkey_credentials WHERE credential_id = ?')
          .bind(credential.id)
          .run();
        throw error;
      }
    } catch (error) {
      if (error instanceof IdentityConflictError) {
        return authJson({ ok: false, reason: 'passkey-already-linked' }, { status: 409 });
      }
      return authJson({ ok: false, reason: 'passkey-verification-failed' }, { status: 401 });
    }
  };
}

export const onRequestPost = createRegisterVerifyHandler();
