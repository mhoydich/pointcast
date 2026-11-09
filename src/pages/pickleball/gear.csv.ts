import { gearRows } from '../../lib/player-gear';

const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export const GET = () => {
  const rows = gearRows();
  const head = ['person', 'person_slug', 'person_kind', 'kind', 'brand', 'model', 'variant', 'paddle_id', 'signature', 'basis', 'source', 'source_date'] as const;
  const csv = [head.join(','), ...rows.map((r) => head.map((h) => cell(String(r[h] ?? ''))).join(','))].join('\n') + '\n';
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
};
