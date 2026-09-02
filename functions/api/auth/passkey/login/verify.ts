import {
  verifyAuthenticationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';

import {
  authJson,
  consumeAuthState,
  issueSession,
  loadUserById,
  withSessionCookie,
} from '../../session.ts';
import {
  PASSKEY_LOGIN_PREFIX,
  PASSKEY_RP_ID,
  getPasskeyRow,
  isAuthenticationResponse,
  parseTransports,
  passkeyOrigins,
  requirePasskeyDb,
  toPublicKeyBytes,
  updatePasskeyUse,
  type LoginChallengeState,
  type PasskeyEnv,
  type PasskeyLoginBody,
} from '../_shared.ts';

type AuthenticationVerifier = (options: Parameters<typeof verifyAuthenticationResponse>[0]) => Promise<VerifiedAuthenticationResponse>;

export function createLoginVerifyHandler(
  verifyResponse: AuthenticationVerifier = verifyAuthenticationResponse,
): PagesFunction<PasskeyEnv> {
  return async ({ request, env }) => {
    const db = requirePasskeyDb(env);
    if (!db) {
      return authJson({ ok: false, provider: 'passkey', reason: 'd1-not-bound' }, { status: 503 });
    }

    let body: PasskeyLoginBody;
    try {
      body = await request.json() as PasskeyLoginBody;
    } catch {
      return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
    }
    const flowId = typeof body.flowId === 'string' ? body.flowId : '';
    if (!flowId || !isAuthenticationResponse(body.response)) {
      return authJson({ ok: false, reason: 'bad-passkey-response' }, { status: 400 });
    }

    const state = await consumeAuthState<LoginChallengeState>(
      env,
      `${PASSKEY_LOGIN_PREFIX}${flowId}`,
    );
    if (!state) {
      return authJson({ ok: false, reason: 'passkey-challenge-expired-or-used' }, { status: 401 });
    }

    const credential = await getPasskeyRow(db, body.response.id);
    if (!credential) {
      return authJson({ ok: false, reason: 'passkey-not-found' }, { status: 401 });
    }

    try {
      const verification = await verifyResponse({
        response: body.response,
        expectedChallenge: state.challenge,
        expectedOrigin: passkeyOrigins(env),
        expectedRPID: PASSKEY_RP_ID,
        credential: {
          id: credential.credential_id,
          publicKey: toPublicKeyBytes(credential.public_key),
          counter: credential.counter,
          transports: parseTransports(credential.transports),
        },
        requireUserVerification: true,
      });
      if (!verification.verified) {
        return authJson({ ok: false, reason: 'passkey-verification-failed' }, { status: 401 });
      }

      const user = await loadUserById(env, credential.user_id);
      if (!user) return authJson({ ok: false, reason: 'passkey-user-not-found' }, { status: 401 });
      await updatePasskeyUse(db, credential.credential_id, verification.authenticationInfo.newCounter);
      const session = await issueSession(env, user.userId);
      return withSessionCookie(authJson({ ok: true, verified: true, user, session }), session);
    } catch {
      return authJson({ ok: false, reason: 'passkey-verification-failed' }, { status: 401 });
    }
  };
}

export const onRequestPost = createLoginVerifyHandler();
