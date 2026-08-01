import type { APIRoute } from 'astro';
import {
  CRYSTAL_BALL_PASS_DESCRIPTION,
  CRYSTAL_BALL_PASS_TITLE,
  CRYSTAL_BALL_PASS_TRAIL,
} from '../lib/crystal-ball-pass';
import { AFTERLIGHT_ROUTES } from '../lib/crystal-ball-pass-v2';

const payload = {
  schema: 'pointcast.world.crystal-ball-pass/v1',
  id: 'crystal-ball-pass-world-v1.1',
  name: CRYSTAL_BALL_PASS_TITLE,
  description: CRYSTAL_BALL_PASS_DESCRIPTION,
  url: 'https://pointcast.xyz/crystal-ball-pass',
  reviewUrl: 'https://pointcast.xyz/reviews/crystal-ball-pass',
  blockUrl: 'https://pointcast.xyz/b/0550',
  version: '1.1.0',
  releasedAt: '2026-08-01T00:20:00-07:00',
  updatedAt: '2026-08-01T16:00:00-07:00',
  authorship: 'Michael Hoydich × Codex / OpenAI for PointCast',
  entrypoints: {
    landing: 'https://pointcast.xyz/crystal-ball-pass',
    originalPassage: 'https://pointcast.xyz/crystal-ball-pass/play',
    afterlightV2: 'https://pointcast.xyz/crystal-ball-pass/v2',
    review: 'https://pointcast.xyz/reviews/crystal-ball-pass',
    block: 'https://pointcast.xyz/b/0550',
  },
  play: {
    estimatedMinutes: 5,
    scenes: CRYSTAL_BALL_PASS_TRAIL.length,
    choicesPerScene: 2,
    stats: ['warmth', 'provisions', 'wonder', 'miles'],
    endings: ['passage complete', 'cold wins this round'],
    persistence: 'session only',
    accountRequired: false,
    networkWrites: false,
  },
  afterlight: {
    version: '2.0.0',
    estimatedMinutes: '4–6 per route',
    routeCount: AFTERLIGHT_ROUTES.length,
    scenesPerRoute: 3,
    stats: ['warmth', 'signal', 'wonder'],
    persistence: 'session only',
    accountRequired: false,
    networkWrites: false,
    routes: AFTERLIGHT_ROUTES.map((route) => ({
      id: route.id,
      name: route.name,
      callSign: route.callSign,
      promise: route.promise,
      kit: route.kit,
      scenes: route.scenes.map((scene, index) => ({
        number: index + 1,
        place: scene.place,
        time: scene.time,
        weather: scene.weather,
        title: scene.title,
        codexMicro: scene.micro,
        choices: scene.choices.map((choice) => ({
          label: choice.label,
          detail: choice.detail,
          result: choice.result,
          delta: choice.delta,
        })),
      })),
    })),
  },
  sound: {
    source: 'gesture-gated Web Audio oscillators',
    autoplay: false,
    externalSamples: false,
  },
  optionalServices: {
    spotify: {
      behavior: 'opens the official Spotify account page in a separate tab',
      connectedToGame: false,
      accountDataReceived: false,
    },
    philipsHue: {
      behavior: 'opens the official Hue account page in a separate tab; on-page color preview works without a bridge',
      connectedToGame: false,
      accountDataReceived: false,
    },
  },
  visual: {
    socialImage: 'https://pointcast.xyz/images/crystal-ball-pass/og.png',
    gameScene: 'CSS forest layers, atmospheric gradients, animated mist, fireflies, and crystal light',
  },
  scenes: CRYSTAL_BALL_PASS_TRAIL.map((scene, index) => ({
    number: index + 1,
    place: scene.place,
    time: scene.time,
    weather: scene.weather,
    title: scene.title,
    codexMicro: scene.micro,
    choices: scene.choices.map((choice) => ({
      label: choice.label,
      detail: choice.detail,
      result: choice.result,
      delta: choice.delta,
    })),
  })),
};

export const GET: APIRoute = () =>
  new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
