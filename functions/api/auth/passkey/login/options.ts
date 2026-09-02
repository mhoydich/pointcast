import { generateAuthenticationOptions } from '@simplewebauthn/server';

import { randomUrlSafeString } from '../../_oauth.ts';
import { authJson, writeAuthState } from '../../session.ts';
import {
  PASSKEY_CHALLENGE_TTL_SECONDS,
  PASSKEY_LOGIN_PREFIX,
  PASSKEY_RP_ID,
  requirePasskeyDb,
  type LoginChallengeState,
  type PasskeyEnv,
} from '../_shared.ts';

type AuthenticationOptionsGenerator = typeof generateAuthenticationOptions;

export function createLoginOptionsHandler(
  generateOptions: AuthenticationOptionsGenerator = generateAuthenticationOptions,
): PagesFunction<PasskeyEnv> {
  return async ({ env }) => {
    if (!requirePasskeyDb(env)) {
      return authJson({ ok: false, provider: 'passkey', reason: 'd1-not-bound' }, { status: 503 });
    }
    const options = await generateOptions({
      rpID: PASSKEY_RP_ID,
      userVerification: 'required',
    });
    const flowId = randomUrlSafeString();
    const state: LoginChallengeState = {
      challenge: options.challenge,
      createdAt: new Date().toISOString(),
    };
    await writeAuthState(
      env,
      `${PASSKEY_LOGIN_PREFIX}${flowId}`,
      state,
      PASSKEY_CHALLENGE_TTL_SECONDS,
    );
    return authJson({ ok: true, flowId, options });
  };
}

export const onRequestPost = createLoginOptionsHandler();
