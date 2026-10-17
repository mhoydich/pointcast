import { readingMapWithCompanions, readingMapThemes, readingMapSnapshot } from './reading-map.ts';
import { readingShelf } from './reading-shelf.ts';
import { bookCompanions } from './book-companions.ts';
import research from './bookshelf-context.json' with { type: 'json' };
import { buildFullBookshelf, bookshelfEras } from '../lib/full-bookshelf-model.mjs';

export const fullBookshelf = buildFullBookshelf(readingMapWithCompanions(readingShelf), readingShelf, bookCompanions, research);
export { bookshelfEras };
export const bookshelfContext = research;
export const bookshelfSummary = {
  records: fullBookshelf.length,
  companions: fullBookshelf.filter(book => book.companion).length,
  sourceNotes: fullBookshelf.filter(book => book.signals.length).length,
  publicationYears: fullBookshelf.filter(book => book.publication).length,
  ratingsNotSupplied: fullBookshelf.length,
};
export const fullBookshelfMetadata = {
  snapshot: readingMapSnapshot, summary: bookshelfSummary,
  ratings: { mike: null, publicAverage: null, note: 'The supplied snapshot contains title and author metadata only. No personal ratings or public rating totals are displayed.' },
  popularity: { checkedAt: research.checkedAt, coverage: bookshelfSummary.sourceNotes, note: research.coverageNote },
  eras: bookshelfEras.map(era => ({ ...era, count: era.id === 'all' ? fullBookshelf.length : fullBookshelf.filter(book => book.era === era.id).length })),
  themes: readingMapThemes, angles: research.angles, sourceRegistry: research.sources, trends: research.trends, records: fullBookshelf,
};
