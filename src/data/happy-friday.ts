// src/data/happy-friday.ts
// Curated weekend content for HappyFridayBlock.astro
// Rotates by ISO week number modulo 5 (indices 0–4)

export type WeekendMode = 'playlist' | 'cocktail' | 'longread' | 'dispatch' | 'ritual';

export interface PlaylistData {
  mode: 'playlist';
  title: string;
  subtitle: string;
  tracks: string[];
  meta: string;
}

export interface CocktailData {
  mode: 'cocktail';
  title: string;
  subtitle: string;
  recipe: { ingredient: string; amount: string }[];
  instructions: string;
  story: string;
  meta: string;
}

export interface LongreadData {
  mode: 'longread';
  title: string;
  author: string;
  subtitle: string;
  pitch: string;
  meta: string;
}

export interface DispatchData {
  mode: 'dispatch';
  title: string;
  neighborhood: string;
  spots: { name: string; note: string }[];
  meta: string;
}

export interface RitualData {
  mode: 'ritual';
  title: string;
  subtitle: string;
  items: string[];
  meta: string;
}

export type WeekendData = PlaylistData | CocktailData | LongreadData | DispatchData | RitualData;

export const weekendRotation: Record<number, WeekendData> = {
  // MODE A — Saturday Morning Playlist
  0: {
    mode: 'playlist',
    title: 'Saturday Morning Coffee',
    subtitle: 'Slow start. Warm tones. No agenda.',
    tracks: [
      '"Pink Moon" — Nick Drake',
      '"Teardrop" — Massive Attack',
      '"Fade Into You" — Mazzy Star',
      '"The Girl from Ipanema" — Stan Getz & João Gilberto',
      '"Harvest Moon" — Neil Young',
      '"Mystery of Love" — Sufjan Stevens',
      '"Lua" — Bright Eyes',
    ],
    meta: '38 min · 7 tracks · best with a pour-over',
  },

  // MODE B — Cocktail of the Week
  1: {
    mode: 'cocktail',
    title: 'The Paper Plane',
    subtitle: 'Equal parts everything. Perfectly balanced.',
    recipe: [
      { ingredient: 'Bourbon (Bulleit or similar)', amount: '¾ oz' },
      { ingredient: 'Amaro Nonino', amount: '¾ oz' },
      { ingredient: 'Aperol', amount: '¾ oz' },
      { ingredient: 'Fresh lemon juice', amount: '¾ oz' },
    ],
    instructions:
      'Combine all four ingredients in a shaker with ice. Shake hard for 12–15 seconds until the tin is properly cold. Double-strain into a chilled coupe. Express a lemon peel over the glass, then discard.',
    story:
      'Invented by Sam Ross at Milk & Honey in New York around 2008, named after the M.I.A. song. It became one of the defining cocktails of the modern craft era because the equal-parts formula is impossible to mess up and endlessly riffable. Bitter, sour, boozy, and somehow refreshing all at once.',
    meta: 'Serve up · Coupe glass · No garnish needed',
  },

  // MODE C — Long Read
  2: {
    mode: 'longread',
    title: 'The Architecture of Happiness',
    author: 'Alain de Botton',
    subtitle: 'A book for anyone who has ever stood in a room and felt something.',
    pitch:
      'De Botton argues that the buildings we inhabit are not neutral containers—they are moral arguments, encoded in stone and glass, about how we ought to live. He moves from Flemish farmhouses to modernist towers with the same curiosity, and by the end you\'ll never look at a doorframe the same way again.',
    meta: '~280 pages · Vintage Books · Best read slowly, one chapter per morning',
  },

  // MODE D — City Dispatch
  3: {
    mode: 'dispatch',
    title: 'South Bay Saturday',
    neighborhood: 'Manhattan Beach & Hermosa',
    spots: [
      {
        name: 'Two Guns Espresso',
        note:
          'Get there before 9am. Order the flat white, grab a stool at the window, and watch the locals roll in on bikes. The pastries are from a small bakery in Torrance and they run out by 10.',
      },
      {
        name: 'The Strand',
        note:
          'Walk south from Manhattan Beach Pier toward Hermosa. The architecture gets weirder and more interesting the further you go. Bring headphones but don\'t use them for the first 15 minutes.',
      },
      {
        name: 'Love & Salt',
        note:
          'For dinner. The wood-fired cauliflower and the pasta change seasonally. Sit at the bar if it\'s just you or two—the bartenders are good company and the pours are generous.',
      },
    ],
    meta: 'Los Angeles · South Bay · Best on foot',
  },

  // MODE E — Friday's Ritual
  4: {
    mode: 'ritual',
    title: "Friday's Ritual",
    subtitle: 'Three small things. No optimization required.',
    items: [
      'Take a 20-minute walk without your phone. No headphones either. Just the neighborhood, whatever it sounds like today.',
      'Text one person you haven\'t spoken to in a while—not to catch up, just to say you were thinking of them. Two sentences is enough.',
      'Make something with your hands before Sunday ends. Doesn\'t matter what. A meal, a sketch, a playlist, a rearranged shelf.',
    ],
    meta: 'Low effort · High return · Repeat weekly',
  },
};
