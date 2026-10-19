/** Only explicitly joined companion records and cited observations enrich the RSS. */
export const bookshelfEras = [
  { id: 'all', label: 'Every era' },
  { id: 'before-1900', label: 'Before 1900' },
  { id: '1900-1949', label: '1900–1949' },
  { id: '1950-1999', label: '1950–1999' },
  { id: '2000-onward', label: '2000 onward' },
  { id: 'unknown', label: 'Year not verified' },
];

export function eraForYear(year) {
  if (!Number.isInteger(year) || year < 1 || year > 2026) return 'unknown';
  return year < 1900 ? 'before-1900' : year < 1950 ? '1900-1949' : year < 2000 ? '1950-1999' : '2000-onward';
}

export function checkedExternalUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`Unsafe bookshelf URL: ${value}`);
  return value;
}

export function buildFullBookshelf(records, shelf, companionDetails, research) {
  const recordIds = new Set(records.map(record => record.id));
  const observations = research.books ?? [];
  const seen = new Set();
  for (const observation of observations) {
    if (!recordIds.has(observation.id) || seen.has(observation.id)) throw new Error(`Unknown or duplicate bookshelf observation: ${observation.id}`);
    seen.add(observation.id);
    if (!observation.sources?.length) throw new Error(`Missing bookshelf evidence: ${observation.id}`);
    const sourceIds = new Set(observation.sources.map(source => source.id));
    observation.sources.forEach(source => checkedExternalUrl(source.url));
    for (const signal of observation.signals ?? []) {
      if (!signal.sourceIds?.length || signal.sourceIds.some(id => !sourceIds.has(id))) throw new Error(`Uncited bookshelf signal: ${observation.id}`);
    }
    if (observation.publication && (eraForYear(observation.publication.year) === 'unknown' || !sourceIds.has(observation.publication.sourceId))) throw new Error(`Unverified publication year: ${observation.id}`);
  }
  const sourceIds = new Set((research.sources ?? []).map(source => source.id));
  (research.sources ?? []).forEach(source => checkedExternalUrl(source.url));
  for (const angle of research.angles ?? []) {
    if ((angle.sourceIds ?? []).some(id => !sourceIds.has(id))) throw new Error(`Unresolved bookshelf angle source: ${angle.id}`);
    if (angle.recordIds.some(id => !recordIds.has(id))) throw new Error(`Unknown bookshelf angle record: ${angle.id}`);
  }
  return records.map(record => {
    const door = record.companion ? shelf.find(item => item.id === record.companion.id) : null;
    const detail = door ? companionDetails.find(item => item.id === door.id) : null;
    const observation = observations.find(item => item.id === record.id);
    const companionYear = /^\d{4}$/.test(door?.firstPublished ?? '') ? Number(door.firstPublished) : null;
    const publication = observation?.publication ?? (companionYear ? {
      year: companionYear, citationUrl: `${door.href}#sources`, sourceLabel: 'Companion publication sources', note: 'First publication; edition dates may differ.',
    } : null);
    const routes = detail?.editions?.[0]?.links?.map(link => ({ kind: link.kind, label: link.label, url: checkedExternalUrl(link.url), note: link.note })) ?? [];
    const digital = detail?.digitalRoutes?.[0];
    if (digital) routes.push({ kind: digital.type, label: digital.label, url: checkedExternalUrl(digital.url), note: digital.rights });
    const angleIds = (research.angles ?? []).filter(angle => angle.recordIds.includes(record.id)).map(angle => angle.id);
    return { ...record, image: door?.image ?? null, kind: door?.kind ?? null,
      note: door?.note ?? null, publication, era: eraForYear(publication?.year),
      signals: observation?.signals ?? [], sources: observation?.sources ?? [],
      contextCheckedAt: observation ? research.checkedAt : detail?.checkedAt ?? null,
      routes, edition: detail?.editions?.[0] ? {
        publisher: detail.editions[0].publisher, format: detail.editions[0].format,
        isbn: detail.editions[0].isbn, note: detail.editions[0].why,
      } : null,
      angleIds, relatedIds: records.filter(item => item.id !== record.id && item.author === record.author).slice(0, 4).map(item => item.id),
    };
  });
}
