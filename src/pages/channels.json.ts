/**
 * /channels.json — PointCast's open-channels/0.1 manifest.
 *
 * Lists every PointCast channel with its feeds, plus the neighbor sites it
 * trades channels with (elsegundo.xyz, Halation). Same format as
 * https://elsegundo.xyz/channels.json; the spec lives in that repo at
 * docs/OPEN-CHANNELS.md. Each channel has one source site; other sites carry
 * it by reading its feed and linking back.
 */
import { CHANNEL_LIST, type ChannelCode } from '../lib/channels';
import type { APIRoute } from 'astro';

const ORIGIN = 'https://pointcast.xyz';

export const KINDS = ['pictures', 'edition', 'news', 'events', 'places', 'maps', 'shop', 'learning', 'desk', 'signals', 'diary', 'music', 'play', 'mints'] as const;

/** The closest shared kind for each PointCast channel. */
const KIND: Record<ChannelCode, (typeof KINDS)[number]> = {
  FD: 'edition',
  CRT: 'play',
  SPN: 'music',
  GF: 'news',
  GDN: 'diary',
  ESC: 'edition',
  FCT: 'mints',
  VST: 'desk',
  BTL: 'play',
  BDY: 'mints',
};

const CARRY = 'Show the block title and dek, and link the block page.';
const CARRY_GF = `${CARRY} Cannabis and hemp topics: elsegundo.xyz never carries this channel.`;

export const GET: APIRoute = () => {
  const payload = {
    version: 'open-channels/0.1',
    about: "Every PointCast channel, the feeds to read it by, and the neighbor sites PointCast trades channels with. JSON Feed 1.1 first, RSS 2.0 beside it.",
    site: { id: 'pointcast.xyz', name: 'PointCast', url: `${ORIGIN}/`, manifest: `${ORIGIN}/channels.json` },
    kinds: KINDS,
    channels: [
      {
        id: 'pointcast.xyz/all',
        kind: 'edition',
        title: 'PointCast · every block',
        description: 'Every published block across all channels, newest first.',
        html: `${ORIGIN}/`,
        feeds: { json: `${ORIGIN}/feed.json`, rss: `${ORIGIN}/feed.xml` },
        data: `${ORIGIN}/blocks.json`,
        cadence: 'as blocks publish',
        status: 'live',
        carry: CARRY,
      },
      ...CHANNEL_LIST.map((ch) => ({
        id: `pointcast.xyz/${ch.slug}`,
        kind: KIND[ch.code],
        code: `CH.${ch.code}`,
        title: `PointCast · ${ch.name}`,
        description: ch.purpose,
        color: ch.color600,
        html: `${ORIGIN}/c/${ch.slug}`,
        feeds: { json: `${ORIGIN}/c/${ch.slug}.json`, rss: `${ORIGIN}/c/${ch.slug}.rss` },
        cadence: 'as blocks publish',
        status: 'live',
        carry: ch.code === 'GF' ? CARRY_GF : CARRY,
      })),
    ],
    neighbors: [
      {
        id: 'elsegundo.xyz',
        name: 'elsegundo.xyz',
        url: 'https://elsegundo.xyz/',
        manifest: 'https://elsegundo.xyz/channels.json',
        feeds: { json: 'https://elsegundo.xyz/carousel/feed.json', rss: 'https://elsegundo.xyz/carousel/feed.xml' },
        status: 'feeds live, manifest proposed',
      },
      {
        id: 'halation',
        name: 'Halation',
        url: 'https://halation-diary.mhoydich.chatgpt.site/',
        manifest: 'https://halation-diary.mhoydich.chatgpt.site/channels.json',
        feeds: { json: 'https://halation-diary.mhoydich.chatgpt.site/feed.json', rss: 'https://halation-diary.mhoydich.chatgpt.site/rss.xml' },
        status: 'feeds live, manifest proposed',
      },
    ],
    carries: [
      { channel: 'elsegundo.xyz/pictures', feed: 'https://elsegundo.xyz/carousel/feed.json', where: 'not shown yet', status: 'proposed' },
      { channel: 'elsegundo.xyz/news', feed: 'https://elsegundo.xyz/today/feed.json', where: 'not shown yet', status: 'proposed' },
      { channel: 'halation/diary', feed: 'https://halation-diary.mhoydich.chatgpt.site/feed.json', where: 'not shown yet', status: 'proposed' },
    ],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
};
