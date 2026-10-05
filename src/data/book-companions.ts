import established from './bookshelf-expansion.json';
import selected from './bookshelf-goodreads.json';
import type { ExpansionBook } from '../lib/book-companion-types';
export const bookCompanions = [...established, ...selected] as unknown as ExpansionBook[];
