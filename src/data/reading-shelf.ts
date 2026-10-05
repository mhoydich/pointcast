import { bookCompanions as companions } from './book-companions';

export const shelfThemes = [
  { id: 'all', label: 'Everything' },
  { id: 'power', label: 'Power & money' },
  { id: 'networks', label: 'Networks & ideas' },
  { id: 'place', label: 'Place & belonging' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'memory', label: 'Memory & choices' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'attention', label: 'Attention' },
  { id: 'language', label: 'Words & language' },
  { id: 'practice', label: 'Habits & aspiration' },
];

const established = [
  { id: 'siddhartha', title: 'Siddhartha', author: 'Hermann Hesse', kind: 'A novel', firstPublished: '1922', href: '/siddhartha/', metadata: '/siddhartha.json', image: '/images/siddhartha/river-horizon.webp', tone: 'river', themes: ['attention', 'place'], note: 'A life in search of itself. Compare translations, follow the river, find a copy.' },
  { id: 'den-of-thieves', title: 'Den of Thieves', author: 'James B. Stewart', kind: 'Reported nonfiction', firstPublished: '1991', href: '/books/den-of-thieves/', metadata: '/books/den-of-thieves.json', image: '/images/bookshop/den-of-thieves.webp', tone: 'midnight', themes: ['power'], note: 'Inside the ambition and financial crime of 1980s Wall Street. Read the record closely.' },
  { id: 'playing-for-pizza', title: 'Playing for Pizza', author: 'John Grisham', kind: 'A novel', firstPublished: '2007', href: '/books/playing-for-pizza/', metadata: '/books/playing-for-pizza.json', image: '/images/bookshop/playing-for-pizza.webp', tone: 'parma', themes: ['place', 'attention'], note: 'American football, a second chance and life in Parma. A different sort of Grisham.' },
];

export const readingShelf = [...established, ...companions.map((book) => ({
  id: book.id, title: book.title, author: book.attributionLine || book.authors.join(' & '), kind: book.kind,
  firstPublished: book.firstPublished, href: `/books/${book.id}/`, metadata: `/books/${book.id}.json`,
  image: book.art.src, tone: book.theme, themes: book.themes, note: book.dek,
}))];

// Canterbury is a separate editorial project. Add its literary-door card only
// after its own publication is approved and its live route is confirmed.
export const literaryDoors = [
  { title: 'The Bukowski room', href: '/bukowski/', image: '/images/bukowski/room.webp', label: 'A literary tribute', note: 'A quieter room for the work, the voice and the contradictions. An existing PointCast tribute, with its own reading paths.' },
];
