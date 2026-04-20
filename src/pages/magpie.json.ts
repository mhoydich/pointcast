/**
 * /magpie.json — machine-readable manifest for the Magpie web UI.
 *
 * Agent discovery surface for the hosted clipboard peer-node companion.
 * Describes what Magpie is, where to install it, how the local peer-node
 * HTTP API is shaped, and how publishing flows through PointCast's
 * /api/ping endpoint.
 */
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = async () => {
  const manifest = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': 'https://pointcast.xyz/magpie',
    name: 'Magpie',
    description:
      'A macOS clipboard peer-node with a push-to-PointCast pipeline. Local-first capture, URL unfurls, block-type detection, and an expansion preview that stages a PointCast block before it publishes.',
    url: 'https://pointcast.xyz/magpie',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'macOS 13+',
    license: 'MIT',
    downloadUrl: 'https://github.com/Good-Feels/magpie/releases/latest',
    codeRepository: 'https://github.com/Good-Feels/magpie',
    version: '0.4',

    // How the hosted UI finds your running Magpie instance.
    peer_node: {
      host: '127.0.0.1',
      default_port: 38473,
      scheme: 'http',
      routes: {
        health: '/health',
        clips: '/clips.json',
        config: '/config.json',
        ui: '/',
      },
      cors: 'Access-Control-Allow-Origin: *',
      auth: 'none (localhost-bound)',
    },

    // What publishing a clip sends out.
    publish: {
      endpoint: 'https://pointcast.xyz/api/ping',
      schema: 'pc-ping-v1',
      fields: {
        type: 'pc-ping-v1',
        subject: 'string, <= 120 chars (enriched title when available)',
        body: 'string, <= 4000 chars (YAML frontmatter + body when expanded)',
        from: 'optional display name',
        address: 'optional Tezos tz/KT address',
        timestamp: 'ISO 8601',
        expand: 'bool — when true, cc drafts a PointCast block on next tick',
      },
      frontmatter_on_expand: {
        channel: 'one of: FD, CRT, SPN, GF, GDN, ESC, VST, BTL',
        type: 'one of: READ, NOTE, LISTEN, WATCH, LINK, VISIT, MINT',
        title: 'string',
        dek: 'optional string',
      },
    },

    // Block-type inference used by the UI for the kicker + default
    // channel when expanding.
    block_type_inference: {
      LISTEN: ['spotify', 'soundcloud', 'music.apple', 'bandcamp', 'tidal', 'anchor.fm'],
      WATCH: ['youtube', 'youtu.be', 'vimeo', 'twitch', 'loom.com', 'tiktok.com'],
      NOTE: ['x.com', 'twitter.com', 'warpcast', 'bsky.app', 'threads.net', 'mastodon', 'farcaster'],
      MINT: ['objkt', 'teia.art', 'fxhash', 'zora.co', 'manifold', 'opensea', 'foundation.app'],
      VISIT: ['maps.google', 'google.com/maps', 'apple.com/maps', 'yelp.com'],
      READ: ['github', 'medium', 'substack', 'nytimes', 'bloomberg', 'wsj', 'wired', 'theverge', 'stratechery', 'pointcast'],
      LINK: 'default for URLs not matching the above',
      NOTE_fallback: 'plain text under 240 chars',
      READ_fallback: 'plain text over 240 chars',
    },

    install_steps: [
      'Download the latest build from https://github.com/Good-Feels/magpie/releases/latest.',
      'Drag Magpie.app to /Applications and launch it.',
      'Grant clipboard access when prompted.',
      'Open Preferences → PointCast → enable "Serve local web UI".',
      'Return to https://pointcast.xyz/magpie — it connects automatically.',
    ],

    citation_format: {
      human: 'PointCast · CH.{CODE} · № {ID} — "{TITLE}" · {YYYY-MM-DD}',
      example: 'PointCast · CH.FD · № 0205 — "The front door is agentic" · 2026-04-14',
    },
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
