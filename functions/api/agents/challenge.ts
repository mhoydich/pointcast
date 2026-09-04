import {
  AGENT_IDENTITY_OPTIONS,
  handleAgentChallenge,
  type AgentIdentityEnv,
} from '../../_lib/agent-identity.ts';

export const onRequestOptions = AGENT_IDENTITY_OPTIONS;
export const onRequestGet: PagesFunction<AgentIdentityEnv> = async ({ request, env }) => handleAgentChallenge(request, env);
export const onRequestPost: PagesFunction<AgentIdentityEnv> = async ({ request, env }) => handleAgentChallenge(request, env);
