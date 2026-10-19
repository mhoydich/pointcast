import established from './bookshelf-expansion.json' with { type: 'json' };
import selected from './bookshelf-goodreads.json' with { type: 'json' };
import type { ExpansionBook } from '../lib/book-companion-types';
export const bookCompanions = [...established, ...selected] as unknown as ExpansionBook[];
