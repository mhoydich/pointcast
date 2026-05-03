/**
 * First Sit — the inaugural Marine Layer sit.
 * Single source of truth so /first-sit, /marine-layer, /commons all agree.
 */
export const FIRST_SIT = {
  date: '2026-05-09',
  weekday: 'Saturday',
  startTime: '06:00 PT',
  endTime: '07:15 PT',
  durationMinutes: 75,
  location: {
    name: 'Plaza El Segundo, north fountain bench',
    address: '720 S Sepulveda Blvd, El Segundo, CA 90245',
    pin: 'Bench at the north fountain — closest to the Whole Foods entrance.',
    lat: 33.9167,
    lng: -118.3917,
  },
  bring: [
    'A layer (the marine layer is real, the temperature reads 56°F).',
    'A small notebook or your phone in airplane mode.',
    'Nothing else. No coffee yet. No headphones.',
  ],
  cohortCap: 12,
  steward: 'Mike (founder, this once)',
  practice: '4–7–8 breath for the first eight rounds, then natural breath.',
  postSit: {
    note: 'After the sit, log it as a Custody or Hours give-back at /commons.',
    weight: 1,
  },
} as const;
