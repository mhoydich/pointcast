/**
 * /cadence.json — machine-readable 15-min ship schedule.
 *
 * Mike 2026-04-20 18:05 PT: *"build the system so we are active on the
 * 15 min mark, always shipping, small, medium, large, etc."*
 *
 * Agent-readable mirror of the /cadence page. Returns the next upcoming
 * ships + recent history + active-window metadata. CORS-open so other
 * nodes can consume it.
 *
 * Author: cc. Source: Mike 2026-04-20 18:05 PT chat.
 */
import type { APIRoute } from 'astro';
import {
  SHIP_QUEUE,
  upcomingShips,
  recentShips,
  nextShip,
  isActiveWindow,
  nextSlot,
  SIZE_LABEL,
  COLLAB_LABEL,
  STATE_LABEL,
} from '../lib/ship-queue';

export const GET: APIRoute = async () => {
  const now = new Date();
  const payload = {
    $schema: 'https://pointcast.xyz/cadence.json',
    name: 'PointCast ship cadence',
    description:
      '15-min-mark ship schedule. Every 15 minutes on the clock during active hours (6am–2am PT), a ship is due. Sizes rotate (shy/modest/healthy/heavy); collaborators rotate (cc/codex/chatgpt/manus/mike/kimi). The attribution layer is the compute ledger at /compute.json.',
    generatedAt: now.toISOString(),
    homepage: 'https://pointcast.xyz',

    activeWindow: {
      isActiveNow: isActiveWindow(now),
      timezone: 'America/Los_Angeles',
      activeHours: '06:00–02:00 PT',
      muteWindow: '02:00–06:00 PT (no autonomous ships)',
      nextSlotIso: nextSlot(now),
    },

    summary: {
      total: SHIP_QUEUE.length,
      queued: SHIP_QUEUE.filter((s) => s.state === 'queued').length,
      inFlight: SHIP_QUEUE.filter((s) => s.state === 'in-flight').length,
      shipped: SHIP_QUEUE.filter((s) => s.state === 'shipped').length,
      skipped: SHIP_QUEUE.filter((s) => s.state === 'skipped').length,
      deferred: SHIP_QUEUE.filter((s) => s.state === 'deferred').length,
    },

    nextShip: (() => {
      const n = nextShip();
      if (!n) return null;
      return {
        id: n.id,
        title: n.title,
        size: n.size,
        sizeLabel: SIZE_LABEL[n.size],
        collab: n.collab,
        collabLabel: COLLAB_LABEL[n.collab],
        dueAt: n.dueAt,
        state: n.state,
      };
    })(),

    upcoming: upcomingShips(8).map((s) => ({
      id: s.id,
      title: s.title,
      size: s.size,
      collab: s.collab,
      dueAt: s.dueAt,
      state: s.state,
      source: s.source ?? null,
    })),

    recent: recentShips(24).map((s) => ({
      id: s.id,
      title: s.title,
      size: s.size,
      collab: s.collab,
      dueAt: s.dueAt,
      landedAt: s.landedAt ?? null,
      state: s.state,
      artifact: s.artifact ?? null,
      ledgerEntry: s.ledgerEntry ?? null,
    })),

    scales: {
      size: Object.entries(SIZE_LABEL).map(([k, label]) => ({ id: k, label })),
      collab: Object.entries(COLLAB_LABEL).map(([k, label]) => ({ id: k, label })),
      state: Object.entries(STATE_LABEL).map(([k, label]) => ({ id: k, label })),
    },

    spec: {
      plan: 'https://github.com/MikeHoydich/pointcast/blob/main/docs/plans/2026-04-20-cadence-system.md',
      source: 'https://github.com/MikeHoydich/pointcast/blob/main/src/lib/ship-queue.ts',
      ledger: 'https://pointcast.xyz/compute.json',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
