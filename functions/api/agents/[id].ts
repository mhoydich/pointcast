import {
  AGENT_IDENTITY_OPTIONS,
  handleAgentGet,
  type AgentIdentityEnv,
} from '../../_lib/agent-identity.ts';

export const onRequestOptions = AGENT_IDENTITY_OPTIONS;
export const onRequestGet: PagesFunction<AgentIdentityEnv> = async ({ env, params }) => (
  handleAgentGet(env, typeof params.id === 'string' ? params.id : '')
);
