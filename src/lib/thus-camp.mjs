/** Thus Camp: pure kit-building helpers shared by the pages, the JSON feed and the browser. */

export const THUS_CAMP_CANONICAL = 'https://pointcast.xyz/thus-camp/';

export function findSituation(data, slug) {
  return data.situations.find((s) => s.slug === slug) ?? null;
}

/** An item applies when it has no role restriction, or when no role is chosen, or when the chosen role is listed. */
export function itemFitsRole(item, role) {
  if (!item.roles || item.roles.length === 0) return true;
  if (!role) return true;
  return item.roles.includes(role);
}

/**
 * Build one pack list: the situation's loadout filtered by role, then each chosen
 * modifier's items, then optionally the trunk kit. Items are deduped by id, first wins,
 * so a situation's own wording beats the generic modifier wording.
 */
export function buildKit(data, slug, { role = '', modifiers = [], trunk = false } = {}) {
  const situation = findSituation(data, slug);
  if (!situation) return null;
  const validRole = situation.roles.some((r) => r.id === role) ? role : '';
  const chosen = data.modifiers.filter((m) => modifiers.includes(m.id));
  const seen = new Set();
  const items = [];
  const add = (item, group) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    items.push({ id: item.id, name: item.name, why: item.why, tier: item.tier ?? 'core', group });
  };
  for (const item of situation.loadout) if (itemFitsRole(item, validRole)) add(item, 'loadout');
  for (const mod of chosen) for (const item of mod.items) add(item, mod.id);
  if (trunk) for (const item of data.trunkKit.items) add(item, 'trunk');
  return {
    slug: situation.slug,
    title: situation.title,
    role: validRole,
    modifiers: chosen.map((m) => m.id),
    trunk: Boolean(trunk),
    call: situation.call,
    items,
  };
}

/** Plain-text pack list for copy/paste into notes or a group chat. */
export function kitText(data, kit, checked = new Set()) {
  if (!kit) return '';
  const situation = findSituation(data, kit.slug);
  const role = situation?.roles.find((r) => r.id === kit.role)?.label;
  const mods = data.modifiers.filter((m) => kit.modifiers.includes(m.id)).map((m) => m.label);
  const head = [`THUS CAMP · ${kit.title}`, [role, ...mods].filter(Boolean).join(' · '), kit.call].filter(Boolean);
  const lines = kit.items.map((i) => `${checked.has(i.id) ? '[x]' : '[ ]'} ${i.name}${i.tier === 'nice' ? ' (nice to have)' : ''}`);
  return [...head, '', ...lines, '', THUS_CAMP_CANONICAL + kit.slug + '/'].join('\n');
}

/** Read a kit choice from URL params, ignoring anything that is not in the data. */
export function readKitParams(data, params) {
  const slug = params.get('s') ?? '';
  const situation = findSituation(data, slug) ?? data.situations[0];
  const role = situation.roles.some((r) => r.id === params.get('r')) ? params.get('r') : '';
  const modIds = new Set(data.modifiers.map((m) => m.id));
  const modifiers = (params.get('m') ?? '').split(',').filter((m) => modIds.has(m));
  const trunk = params.get('t') === '1';
  return { slug: situation.slug, role, modifiers, trunk };
}

export function kitParams({ slug, role, modifiers, trunk }) {
  const p = new URLSearchParams({ s: slug });
  if (role) p.set('r', role);
  if (modifiers?.length) p.set('m', modifiers.join(','));
  if (trunk) p.set('t', '1');
  return p;
}

/** Machine-readable payload for /thus-camp.json. */
export function campPayload(data) {
  return {
    name: data.name,
    tagline: data.tagline,
    version: data.version,
    author: data.author,
    source: data.source,
    url: THUS_CAMP_CANONICAL,
    disclaimer: data.disclaimer,
    premise: data.premise,
    thus: data.thus,
    modifiers: data.modifiers,
    trunkKit: data.trunkKit,
    situations: data.situations.map((s) => ({ ...s, url: `${THUS_CAMP_CANONICAL}${s.slug}/` })),
  };
}
