/**
 * /api/catan/ics — hosted tables as calendar invites.
 * ?id=  → one table (.ics download)   ·   ?city= or nothing → a subscribable feed
 */
import { CATAN_ORIGIN, icsEscape } from '../../../src/lib/catan.ts';
import { loadTables, type CatanEnv, type StoredTable } from '../../_lib/catan-store.ts';

const stamp = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
// RFC 5545 wants lines folded at 75 octets.
const fold = (line: string) => line.length <= 74 ? line : line.match(/.{1,73}/g)!.join('\r\n ');

function vevent(t: StoredTable, now: string): string[] {
  const start = new Date(t.when);
  const end = new Date(start.getTime() + 3 * 3600_000);
  const url = `${CATAN_ORIGIN}/?table=${t.id}#tables`;
  const desc = [`${t.seated.length} of ${t.seats} seats taken · ${t.edition} · ${t.pace}`, `Host: ${t.host}`, t.note, `Take a seat: ${url}`].filter(Boolean).join('\n');
  return [
    'BEGIN:VEVENT',
    `UID:catan-${t.id}@pointcast.xyz`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start.toISOString())}`,
    `DTEND:${stamp(end.toISOString())}`,
    `SUMMARY:${icsEscape(`Catan · ${t.title}`)}`,
    `LOCATION:${icsEscape(`${t.venue}, ${t.city}`)}`,
    `DESCRIPTION:${icsEscape(desc)}`,
    `URL:${url}`,
    'END:VEVENT',
  ].map(fold);
}

export const onRequestGet: PagesFunction<CatanEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const tables = env.VISITS ? await loadTables(env.VISITS) : [];
  const id = url.searchParams.get('id');
  const city = (url.searchParams.get('city') || '').toLowerCase();
  const pick = id ? tables.filter((t) => t.id === id) : tables.filter((t) => !city || t.city.toLowerCase().includes(city));
  if (id && !pick.length) return new Response('No such table', { status: 404 });
  const now = new Date().toISOString();
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PointCast//Hex & Harbor//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(id ? 'Catan table' : `Hex & Harbor tables${city ? ` · ${city}` : ''}`)}`,
    ...pick.flatMap((t) => vevent(t, now)),
    'END:VCALENDAR',
  ];
  return new Response(lines.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `${id ? 'attachment' : 'inline'}; filename="${id ? `catan-${id}` : 'hex-and-harbor'}.ics"`,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
};
