/** Restore only catalog-approved match settings; URL input never starts a match. */
export function setupFromParams(params, catalog) {
  const allowed = (key, items, fallback) => items.some(item => item.id === params.get(key)) ? params.get(key) : fallback;
  const leftGang = allowed('leftGang', catalog.gangs, allowed('gang', catalog.gangs, catalog.gangs[0].id));
  const rightGang = allowed('rightGang', catalog.gangs, catalog.gangs.find(gang => gang.id !== leftGang)?.id || leftGang);
  const rawSeed = params.get('seed');
  const seed = rawSeed !== null && /^\d+$/.test(rawSeed) && Number(rawSeed) <= 4294967295 ? Number(rawSeed) : 42;
  return { seed, left: { gang: leftGang, tactic: allowed('leftTactic', catalog.tactics, 'rush') }, right: { gang: rightGang, tactic: allowed('rightTactic', catalog.tactics, 'guard') } };
}
