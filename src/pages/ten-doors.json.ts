/** /ten-doors.json - the Ten Doors hub manifest (2026-11-02). Source: src/lib/ten-doors.mjs. */
import type { APIRoute } from 'astro';
import { DOORS, SITE, TEN_DOORS_DATE, jsonResponse } from '../lib/ten-doors.mjs';

export const GET: APIRoute = () =>
  jsonResponse({
    $schema: `${SITE}/for-agents`,
    generatedAt: new Date().toISOString(),
    name: 'Ten Doors',
    opened: TEN_DOORS_DATE,
    human: `${SITE}/ten-doors`,
    summary: 'Ten new PointCast areas: four instruments, four games, an oracle and a quiet place. All free in the browser, no account, nothing to buy, nothing a visitor makes leaves their device.',
    direction: 'Michael Hoydich, 2026-11-02: "make 10 new pointcast areas, drum etc, be inventive"',
    build: 'Claude Code, 2026-11-02',
    doors: DOORS.map((d, i) => ({
      number: i + 1,
      slug: d.slug,
      name: d.name,
      kind: d.kind,
      genre: d.genre,
      pitch: d.pitch,
      human: `${SITE}/${d.slug}`,
      json: `${SITE}/${d.slug}.json`,
      forAgents: d.agents,
    })),
    clockDriven: {
      'meter-oracle': 'a new fortune every 15 minutes, the same for everyone',
      'green-flash': 'computed sunsets for El Segundo',
      'ice-cream-route': 'a new street map every Pacific day',
      'tide-pool-census': 'a new pool every Pacific day',
    },
  });
