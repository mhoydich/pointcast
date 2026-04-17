/**
 * /now.json — machine-readable version of /now.
 *
 * Live system snapshot: Card of the Day, Prize Cast state, latest blocks,
 * contract status, last commit. Cached 60s because the countdown + ago
 * labels don't need to be millisecond-fresh on the server.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { pickCardOfTheDay } from '../lib/battler/card-of-the-day';
import { getPrizeCastSnapshot, getNextPrizeCastDrawAt } from '../lib/prize-cast';
import contracts from '../data/contracts.json';
import { execSync } from 'node:child_process';

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const todaysCard = pickCardOfTheDay();
  const nextDraw = getNextPrizeCastDrawAt();
  const prizeCast = await getPrizeCastSnapshot();
  const visitNounsKt1 = ((contracts as any).visit_nouns?.mainnet ?? '').trim();
  const prizeCastKt1 = ((contracts as any).prize_cast?.mainnet ?? '').trim();
  const drumKt1 = ((contracts as any).drum_token?.mainnet ?? '').trim();

  // Live mint count
  let mintCount: number | null = null;
  if (visitNounsKt1.startsWith('KT1')) {
    try {
      const r = await fetch(`https://api.tzkt.io/v1/tokens?contract=${visitNounsKt1}&limit=10000&select=totalSupply`);
      if (r.ok) {
        const list: Array<{ totalSupply: string }> = await r.json();
        mintCount = list.reduce((sum, t) => sum + Number(t.totalSupply ?? 0), 0);
      }
    } catch {}
  }

  let lastCommit: { hash: string; subject: string; date: string; author: string } | null = null;
  try {
    const out = execSync('git log -1 --pretty=format:"%h|%s|%cI|%an"', { encoding: 'utf-8' }).trim();
    const [hash, subject, date, author] = out.split('|');
    lastCommit = { hash, subject, date, author };
  } catch {}

  const channelCounts: Record<string, number> = {};
  for (const b of blocks) channelCounts[b.data.channel] = (channelCounts[b.data.channel] ?? 0) + 1;

  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    broadcast: {
      cardOfTheDay: {
        id: todaysCard.id,
        date: todaysCard.date,
        dateLabel: todaysCard.dateLabel,
        note: todaysCard.note,
        rosterIndex: todaysCard.rosterIndex,
        arenaUrl: 'https://pointcast.xyz/battle',
      },
      prizeCast: {
        status: prizeCastKt1.startsWith('KT1') ? 'live' : 'pending',
        contract: prizeCastKt1 || null,
        nextDrawAt: nextDraw.toISOString(),
        tvlTez: prizeCast.tvlTez,
        prizePoolTez: prizeCast.prizePoolTez,
        drawDay: 'Sunday 18:00 UTC',
        url: 'https://pointcast.xyz/cast',
      },
    },
    latest: blocks.slice(0, 4).map((b) => ({
      id: b.data.id,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      channel: b.data.channel,
      type: b.data.type,
      title: b.data.title,
      timestamp: b.data.timestamp.toISOString(),
    })),
    footprint: {
      blocksLive: blocks.length,
      channelCount: Object.keys(channelCounts).length,
      channels: channelCounts,
      visitNounsMinted: mintCount,
      contracts: {
        visitNouns: { kt1: visitNounsKt1 || null, status: visitNounsKt1 ? 'live' : 'pending' },
        prizeCast: { kt1: prizeCastKt1 || null, status: prizeCastKt1 ? 'live' : 'pending-compile' },
        drumToken: { kt1: drumKt1 || null, status: drumKt1 ? 'live' : 'pending-compile' },
      },
    },
    trail: {
      lastCommit,
      statusPage: 'https://pointcast.xyz/status',
    },
    surfaces: {
      human: 'https://pointcast.xyz/now',
      archive: 'https://pointcast.xyz/archive.json',
      editions: 'https://pointcast.xyz/editions.json',
      forAgents: 'https://pointcast.xyz/for-agents',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
};
