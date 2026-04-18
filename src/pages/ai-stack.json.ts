/**
 * /ai-stack.json — machine-readable version of the AI tools guide.
 * Same data as /ai-stack, structured for programmatic consumption.
 */
import type { APIRoute } from 'astro';

const TOOLS = [
  { name: 'Claude',                  maker: 'Anthropic',      category: 'language-chat', tier: 'daily',      url: 'https://claude.ai' },
  { name: 'ChatGPT',                 maker: 'OpenAI',         category: 'language-chat', tier: 'weekly',     url: 'https://chatgpt.com' },
  { name: 'Gemini',                  maker: 'Google',         category: 'language-chat', tier: 'occasional', url: 'https://gemini.google.com' },
  { name: 'DeepSeek',                maker: 'DeepSeek',       category: 'language-chat', tier: 'occasional', url: 'https://chat.deepseek.com' },
  { name: 'Kimi',                    maker: 'Moonshot AI',    category: 'language-chat', tier: 'watching',   url: 'https://kimi.com' },
  { name: 'Claude Code',             maker: 'Anthropic',      category: 'code',          tier: 'daily',      url: 'https://claude.com/claude-code' },
  { name: 'Codex',                   maker: 'OpenAI',         category: 'code',          tier: 'weekly',     url: 'https://openai.com/codex' },
  { name: 'Cursor',                  maker: 'Anysphere',      category: 'code',          tier: 'occasional', url: 'https://cursor.com' },
  { name: 'Midjourney',              maker: 'Midjourney',     category: 'image',         tier: 'weekly',     url: 'https://midjourney.com' },
  { name: 'Ideogram',                maker: 'Ideogram AI',    category: 'image',         tier: 'weekly',     url: 'https://ideogram.ai' },
  { name: 'Flux',                    maker: 'Black Forest Labs', category: 'image',      tier: 'occasional', url: 'https://blackforestlabs.ai' },
  { name: 'DALL-E / gpt-image',      maker: 'OpenAI',         category: 'image',         tier: 'occasional', url: 'https://chatgpt.com' },
  { name: 'Runway',                  maker: 'Runway',         category: 'video',         tier: 'occasional', url: 'https://runwayml.com' },
  { name: 'Sora',                    maker: 'OpenAI',         category: 'video',         tier: 'watching',   url: 'https://sora.com' },
  { name: 'Kling',                   maker: 'Kuaishou',       category: 'video',         tier: 'occasional', url: 'https://klingai.com' },
  { name: 'Pika',                    maker: 'Pika Labs',      category: 'video',         tier: 'occasional', url: 'https://pika.art' },
  { name: 'Perplexity',              maker: 'Perplexity',     category: 'research',      tier: 'daily',      url: 'https://perplexity.ai' },
  { name: 'Claude · web search',     maker: 'Anthropic',      category: 'research',      tier: 'weekly',     url: 'https://claude.ai' },
  { name: 'Manus',                   maker: 'Manus',          category: 'agent',         tier: 'weekly',     url: 'https://manus.im' },
  { name: 'Claude Agent',            maker: 'Anthropic',      category: 'agent',         tier: 'occasional', url: 'https://docs.claude.com/en/agents' },
  { name: 'OpenAI Operator',         maker: 'OpenAI',         category: 'agent',         tier: 'watching',   url: 'https://openai.com/operator' },
  { name: 'ElevenLabs',              maker: 'ElevenLabs',     category: 'audio',         tier: 'occasional', url: 'https://elevenlabs.io' },
  { name: 'Suno',                    maker: 'Suno',           category: 'audio',         tier: 'occasional', url: 'https://suno.com' },
  { name: 'Hume AI',                 maker: 'Hume',           category: 'audio',         tier: 'watching',   url: 'https://hume.ai' },
];

export const GET: APIRoute = async () => {
  const dailyTools = TOOLS.filter((t) => t.tier === 'daily');
  const categoryCounts: Record<string, number> = {};
  for (const t of TOOLS) categoryCounts[t.category] = (categoryCounts[t.category] ?? 0) + 1;

  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    site: 'https://pointcast.xyz',
    total: TOOLS.length,
    dailyCount: dailyTools.length,
    categoryCounts,
    tools: TOOLS,
    principles: [
      'Voice fit first — Claude reads like a colleague, ChatGPT reads like a product.',
      'Use the best model for the job, not the one in the subscription.',
      'Code needs tool-use, not just completion.',
      'Image aesthetics ≠ image function — Midjourney for feel, Ideogram for text, Flux for photo.',
      'Video is in its Sora-moment — experiment quarterly.',
      'Agents are a layer, not a product.',
    ],
    links: {
      human: 'https://pointcast.xyz/ai-stack',
      techStack: 'https://pointcast.xyz/stack',
      manifesto: 'https://pointcast.xyz/manifesto',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
