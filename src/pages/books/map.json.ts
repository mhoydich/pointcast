import type { APIRoute } from 'astro';
import { readingShelf } from '../../data/reading-shelf';
import { readingMapThemes, readingMapSnapshot, readingMapWithCompanions, readingMapPathsFor } from '../../data/reading-map';

export const prerender = true;
export const GET: APIRoute = () => {
  const records = readingMapWithCompanions(readingShelf);
  return new Response(JSON.stringify({
    title: 'The PointCast reading map', url: 'https://pointcast.xyz/books/map/',
    ...readingMapSnapshot,
    grouping: 'One manually assigned editorial theme per title. Open shelf means the connection remains uncertain.',
    companionCount: records.filter((record) => record.companion).length,
    themes: readingMapThemes.map((theme) => ({ ...theme, count: records.filter((record) => record.theme === theme.id).length })),
    editorialPaths: readingMapPathsFor(records),
    records,
  }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
