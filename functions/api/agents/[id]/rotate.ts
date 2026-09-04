import {
  AGENT_IDENTITY_OPTIONS,
  handleAgentRotate,
  type AgentIdentityEnv,
} from '../../../_lib/agent-identity.ts';

export const onRequestOptions = AGENT_IDENTITY_OPTIONS;
export const onRequestPost: PagesFunction<AgentIdentityEnv> = async ({ request, env, params }) => (
  handleAgentRotate(request, env, typeof params.id === 'string' ? params.id : '')
);
