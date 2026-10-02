export function filterCompanies(companies, {query = '', capability = '', city = '', availability = '', geography = ''} = {}) {
  const text = query.trim().toLowerCase();
  return companies.filter(c => (!text || [c.name, c.city, c.summary, ...c.capabilities].join(' ').toLowerCase().includes(text)) && (!capability || c.capabilities.includes(capability)) && (!city || c.city === city) && (!availability || c.outsideWork === availability) && (!geography || c.geographyStatus === geography));
}
export function validateAtlas(atlas) {
  const errors = [];
  const ids = new Set();
  for (const c of atlas.companies) {
    if (!c.id || ids.has(c.id)) errors.push(`Duplicate or missing id: ${c.id}`);
    ids.add(c.id);
    if (!['yes','no','unknown'].includes(c.outsideWork)) errors.push(`${c.id}: outsideWork`);
    if (!c.name || !c.city || !c.summary || !c.capabilities?.length) errors.push(`${c.id}: missing identity/capability`);
    if (!c.sources?.length || c.sources.some(s => !/^https:\/\//.test(s.url) || !s.checkedDate)) errors.push(`${c.id}: sources`);
    if (!c.distanceBasis || !Number.isFinite(c.distanceMiles) || c.distanceMiles < 0 || c.distanceMiles > atlas.radiusMiles) errors.push(`${c.id}: distance`);
    if (!['approximate-within-radius','boundary-check-required'].includes(c.geographyStatus) || c.latitude !== null || c.longitude !== null) errors.push(`${c.id}: geography provenance`);
    if (!c.availabilityEvidence) errors.push(`${c.id}: availability evidence`);
  }
  return errors;
}
