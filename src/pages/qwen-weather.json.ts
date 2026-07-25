import type { APIRoute } from 'astro';

const record = {
  schema: 'pointcast.model-study/v1',
  id: 'PC-QWEN-WEATHER-2026',
  block: '0494',
  title: 'QWEN / WEATHER MEMORY',
  subtitle: 'The Weather Has a Memory',
  status: 'public',
  publishedAt: '2026-07-25T17:05:00.000Z',
  canonical: 'https://pointcast.xyz/qwen-weather',
  description:
    'Four QwenCloud models pass one impossible forecast from language to image to moving sound.',
  models: [
    {
      id: 'qwen3.8-max-preview',
      displayName: 'Qwen 3.8 Max',
      capability: 'language',
      contribution: 'Six-line impossible weather score',
    },
    {
      id: 'glm-5.2',
      displayName: 'GLM-5.2',
      capability: 'language',
      contribution: 'Four independent counterforecast observations',
    },
    {
      id: 'wan2.7-image-pro',
      displayName: 'Wan 2.7 Image Pro',
      capability: 'image generation',
      contribution: '4096 × 4096 source weather organism',
    },
    {
      id: 'happyhorse-1.1-r2v',
      displayName: 'HappyHorse 1.1',
      capability: 'reference-to-video with generated audio',
      contribution: '8.04-second 1280 × 720 H.264 video with AAC audio',
    },
  ],
  artifacts: {
    image: 'https://pointcast.xyz/images/qwen-weather/weather-organism.jpg',
    video: 'https://pointcast.xyz/images/qwen-weather/weather-memory.mp4',
    poster: 'https://pointcast.xyz/images/qwen-weather/qwen-weather-og.png',
  },
  provenance: {
    generationMode: 'interactive agent-directed creation',
    liveInferenceOnPage: false,
    deployedCredentials: false,
    note: 'All model outputs are pre-rendered static media. The QwenCloud Token Plan key is not included in PointCast.',
  },
  interaction: {
    autoplay: 'muted',
    audio: 'visitor-enabled',
    reducedMotion: 'static poster fallback',
  },
} as const;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(record, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
