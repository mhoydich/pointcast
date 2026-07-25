import type { APIRoute } from 'astro';
import { HOME_SIGNALS } from '../lib/home-signals';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify({
  version: '1.0',
  title: 'PointCast front-door signal tuner',
  description: 'The visual frequencies available through Change the signal on the PointCast front door.',
  privacy: 'Selection happens in the visitor browser. PointCast does not receive or store a signal-selection event.',
  interaction: {
    default: HOME_SIGNALS[0].id,
    sequence: 'wrap',
    directSelection: true,
    keyboardOperable: true,
    reducedMotion: true,
  },
  signals: HOME_SIGNALS.map((signal, index) => ({
    position: index + 1,
    id: signal.id,
    frequency: signal.frequency,
    channel: signal.channel,
    title: signal.title,
    note: signal.note,
    image: new URL(signal.src, 'https://pointcast.xyz').toString(),
    alt: signal.alt,
    color: signal.color,
    href: new URL(signal.href, 'https://pointcast.xyz').toString(),
  })),
}, null, 2), {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
    'Content-Type': 'application/json; charset=utf-8',
  },
});
