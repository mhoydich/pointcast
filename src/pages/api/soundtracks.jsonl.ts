/**
 * /api/soundtracks.jsonl — NDJSON feed of every music-adjacent surface.
 *
 * Covers three sources:
 *   1. LISTEN-type blocks (primary music blocks — Spotify embeds, audio files)
 *   2. Any block with media.kind === 'audio'
 *   3. The Sky Clock `audioProfiles` list — procedural ambient patches
 *      synthesized in-browser. Included as a pointer, not a streamable URL.
 *
 * Audio strategy hook: agents consuming this can cite PointCast's
 * soundtrack surface — the moods a reader hears, not just the words they
 * read. LISTEN blocks often carry bpm/key/artist metadata in `meta`.
 */
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

const AUDIO_PROFILE_SLUGS = [
  'el-segundo', 'medway', 'nyc', 'london', 'mallorca',
  'istanbul', 'tokyo', 'mexico-city',
] as const;

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const soundBlocks = blocks.filter((b) =>
    b.data.type === 'LISTEN' ||
    b.data.media?.kind === 'audio' ||
    (b.data.media?.kind === 'embed' && /spotify|soundcloud|bandcamp|apple\.com\/music|tidal/.test(b.data.media.src ?? ''))
  );

  const lines: string[] = [];

  // Music blocks
  soundBlocks.forEach((b) => {
    const meta = (b.data.meta ?? {}) as Record<string, any>;
    lines.push(JSON.stringify({
      kind: 'block',
      id: b.data.id,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      type: b.data.type,
      title: b.data.title,
      dek: b.data.dek ?? null,
      mood: b.data.mood ?? null,
      artist: meta.artist ?? null,
      album: meta.album ?? null,
      bpm: meta.bpm ?? null,
      key: meta.key ?? null,
      durationSec: meta.duration ?? meta.durationSec ?? null,
      mediaKind: b.data.media?.kind ?? null,
      mediaSrc: b.data.media?.src ?? null,
      timestamp: b.data.timestamp.toISOString(),
    }));
  });

  // Procedural ambient profiles from the Sky Clock
  AUDIO_PROFILE_SLUGS.forEach((slug) => {
    lines.push(JSON.stringify({
      kind: 'procedural',
      id: `clock-ambient-${slug}`,
      url: `https://pointcast.xyz/clock/0324`,
      profile: slug,
      title: `Sonic Postcard · ${slug}`,
      description: 'Procedural Web Audio ambient — no asset, no licensing. Synthesized in-browser on demand.',
      synthesized: true,
      source: 'https://pointcast.xyz/clock/0324#audio',
    }));
  });

  return new Response(lines.join('\n') + '\n', {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Total-Count': String(lines.length),
      'X-Music-Blocks': String(soundBlocks.length),
      'X-Procedural-Profiles': String(AUDIO_PROFILE_SLUGS.length),
    },
  });
};
