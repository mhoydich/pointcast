/**
 * /ai-services.json — machine-readable version of the AI service desk.
 * Same data as /ai-services, structured for programmatic consumption.
 */
import type { APIRoute } from 'astro';

const SERVICES = [
  {
    slug: 'claude-fable',
    name: 'Claude Fable',
    callSign: 'FABLE',
    maker: 'Anthropic',
    url: 'https://claude.com/claude-code',
    role: 'primary-engineer',
    status: 'resident',
    since: '2026-04',
    models: ['claude-fable-5', 'claude-opus-4-8', 'claude-sonnet-5', 'claude-haiku-4-5'],
    channel: 'claude-code',
  },
  {
    slug: 'chatgpt-sol',
    name: 'ChatGPT Sol',
    callSign: 'SOL',
    maker: 'OpenAI',
    url: 'https://openai.com/codex',
    role: 'reviewer-second-engineer',
    status: 'resident',
    since: '2026-04',
    models: ['gpt-5.6-sol'],
    channel: 'codex',
  },
  {
    slug: 'manus',
    name: 'Manus',
    callSign: 'MANUS',
    maker: 'Manus',
    url: 'https://manus.im',
    role: 'operations-browser',
    status: 'resident',
    since: '2026-04',
    models: ['manus-agent-stack'],
    channel: 'browser',
  },
  {
    slug: 'qwen-cloud',
    name: 'Qwen Cloud',
    callSign: 'QWEN',
    maker: 'Alibaba Cloud',
    url: 'https://www.qwencloud.com',
    role: 'model-pool',
    status: 'new-hire',
    since: '2026-07',
    models: [
      'qwen3.8-max-preview',
      'qwen3.7-max',
      'qwen3.7-plus',
      'qwen3.6-flash',
      'glm-5.2',
      'deepseek-v4-pro',
    ],
    channel: 'token-plan-anthropic-and-openai-protocol',
  },
];

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    surface: '/ai-services',
    generated: new Date().toISOString(),
    counts: {
      services: SERVICES.length,
      residents: SERVICES.filter((s) => s.status === 'resident').length,
      newHires: SERVICES.filter((s) => s.status === 'new-hire').length,
      models: SERVICES.reduce((n, s) => n + s.models.length, 0),
    },
    services: SERVICES,
    related: ['/residents', '/ai-stack', '/for-agents', '/agents.json'],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
