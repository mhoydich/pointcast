import {
  AGENT_IDENTITY_OPTIONS,
  handleAgentRegister,
  type AgentIdentityEnv,
} from '../../_lib/agent-identity.ts';

export const onRequestOptions = AGENT_IDENTITY_OPTIONS;
export const onRequestPost: PagesFunction<AgentIdentityEnv> = async ({ request, env }) => handleAgentRegister(request, env);
