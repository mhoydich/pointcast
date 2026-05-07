import type { APIRoute } from 'astro';
import { SPELLS } from '../data/spells';

export const GET: APIRoute = () => {
  const byKind = {
    burst:     SPELLS.filter(s => s.kind === 'burst'),
    companion: SPELLS.filter(s => s.kind === 'companion'),
    ambient:   SPELLS.filter(s => s.kind === 'ambient'),
  };

  const payload = {
    name: 'PointCast Spells',
    url: 'https://pointcast.xyz/spells',
    description:
      'Magic words for the PointCast dock. Type +spellname in the omnibox, or cast from /spells.',
    total: SPELLS.length,
    omnibox_syntax: '+spellname',
    cast_event: 'pc:spell:cast',
    clear_event: 'pc:spell:clear',
    kinds: ['burst', 'companion', 'ambient'] as const,
    kind_notes: {
      burst:     'One-shot — spawns, delights, self-cleans after durationMs.',
      companion: 'Small creature that walks across the screen, then wanders off.',
      ambient:   'Persistent overlay that stays until cleared.',
    },
    spells: SPELLS.map(s => ({
      id:        s.id,
      label:     s.label,
      blurb:     s.blurb,
      glyph:     s.glyph,
      kind:      s.kind,
      ...(s.durationMs != null ? { durationMs: s.durationMs } : {}),
      accent:    s.accent,
    })),
    by_kind: {
      burst:     byKind.burst.map(s => s.id),
      companion: byKind.companion.map(s => s.id),
      ambient:   byKind.ambient.map(s => s.id),
    },
    cast_url:     'https://pointcast.xyz/spells',
    generated_at: new Date().toISOString(),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type':  'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
