import type { APIRoute } from 'astro';
import {
  CRYSTAL_BALL_PASS_DESCRIPTION,
  CRYSTAL_BALL_PASS_TITLE,
  CRYSTAL_BALL_PASS_TRAIL,
} from '../lib/crystal-ball-pass';

const payload = {
  schema: 'pointcast.game.crystal-ball-pass/v1',
  id: 'crystal-ball-pass-v1',
  name: CRYSTAL_BALL_PASS_TITLE,
  description: CRYSTAL_BALL_PASS_DESCRIPTION,
  url: 'https://pointcast.xyz/crystal-ball-pass',
  reviewUrl: 'https://pointcast.xyz/reviews/crystal-ball-pass',
  blockUrl: 'https://pointcast.xyz/b/0550',
  version: '1.0.0',
  releasedAt: '2026-08-01T00:20:00-07:00',
  authorship: 'Michael Hoydich × Codex / OpenAI for PointCast',
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
