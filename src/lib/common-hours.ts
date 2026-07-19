export const COMMON_HOURS_URL = 'https://common-hours.mhoydich.chatgpt.site';

export const COMMON_HOURS_RITUALS = [
  { name: 'Daily Chimes', kind: 'sound ritual', mark: '◉', path: 'https://daily-chimes-ritual.mhoydich.chatgpt.site', note: 'Thirteen luminous bells for marking a task, a threshold, or the close of day.' },
  { name: 'Prayer Bells', kind: 'chime garden', mark: '⌁', path: '/prayer-bells', note: 'The Angelus, playable as a small garden of bells.' },
  { name: 'Morning Hours', kind: 'five altars', mark: '☼', path: '/prayer-altars', note: 'Matins, Lauds, Prime, Terce, and Sext.' },
  { name: 'Evening Altars', kind: 'night stations', mark: '☾', path: '/prayer-altars-evening', note: 'A dusk companion to the morning hours.' },
  { name: 'PointCast Shrines', kind: 'public index', mark: '◇', path: '/shrines', note: 'Human, JSON, and Markdown doors into the shrine system.' },
  { name: 'Drum Shrine', kind: 'daily noun', mark: '●', path: '/drum-shrine', note: 'One daily Noun, one ring, one small act of attention.' },
  { name: 'Drum Vespers', kind: 'evening rhythm', mark: '◒', path: '/drum-vespers', note: 'A rhythm room for the day’s gentler edge.' },
  { name: 'Nouns Stamps', kind: 'attendance marks', mark: '✣', path: '/nouns-stamps', note: 'Small proofs that you showed up.' },
] as const;
