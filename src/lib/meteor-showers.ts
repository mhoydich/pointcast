/**
 * meteor-showers — fixed-calendar table of annual major meteor showers.
 *
 * Dates are the traditional peak nights (viewing best in the predawn hours
 * of the date listed). Real peak times vary by ±1 day year-to-year based
 * on Earth's position in the debris trail; for the Collab Clock's
 * "shower is close" indicator ±5 days of peak is sufficient.
 *
 * Sources cross-checked: American Meteor Society (amsmeteors.org),
 * timeanddate.com/astronomy/meteor-shower. Peak brightness ratings are
 * the max ZHR (zenithal hourly rate) under ideal conditions.
 */

export interface MeteorShower {
  name: string;
  /** Peak date (month/day) — year is injected at lookup time. */
  peak: { month: number; day: number };  // month 1–12, day 1–31
  /** Approximate active window around peak (days before/after). */
  window: { before: number; after: number };
  /** Max zenithal hourly rate — a rough intensity proxy. */
  zhr: number;
  /** Constellation name the shower radiates from. */
  radiant: string;
  /** Short glyph for compact chips. */
  glyph: string;
  /** One-line editorial flavor for the ribbon. */
  blurb: string;
}

export const SHOWERS: MeteorShower[] = [
  {
    name: 'Quadrantids',
    peak: { month: 1, day: 3 },
    window: { before: 1, after: 2 },
    zhr: 110,
    radiant: 'Boötes',
    glyph: '✨',
    blurb: 'Sharp peak, fickle — watch the morning of Jan 3.',
  },
  {
    name: 'Lyrids',
    peak: { month: 4, day: 22 },
    window: { before: 3, after: 3 },
    zhr: 18,
    radiant: 'Lyra',
    glyph: '✨',
    blurb: "One of humanity's oldest observed showers — Chinese records, 687 BCE.",
  },
  {
    name: 'Eta Aquariids',
    peak: { month: 5, day: 6 },
    window: { before: 4, after: 4 },
    zhr: 50,
    radiant: 'Aquarius',
    glyph: '✨',
    blurb: 'Dust from Halley. Best south of the equator.',
  },
  {
    name: 'Perseids',
    peak: { month: 8, day: 12 },
    window: { before: 5, after: 5 },
    zhr: 100,
    radiant: 'Perseus',
    glyph: '🌠',
    blurb: 'The summer classic — warm nights, bright meteors.',
  },
  {
    name: 'Orionids',
    peak: { month: 10, day: 21 },
    window: { before: 4, after: 4 },
    zhr: 20,
    radiant: 'Orion',
    glyph: '✨',
    blurb: 'The other half of Halley — October leaves behind.',
  },
  {
    name: 'Leonids',
    peak: { month: 11, day: 17 },
    window: { before: 3, after: 3 },
    zhr: 15,
    radiant: 'Leo',
    glyph: '✨',
    blurb: 'Storms every 33 years. Off-year nights are quiet but persistent.',
  },
  {
    name: 'Geminids',
    peak: { month: 12, day: 14 },
    window: { before: 4, after: 4 },
    zhr: 120,
    radiant: 'Gemini',
    glyph: '🌠',
    blurb: 'The best of the year. Dense, slow, multicolored.',
  },
  {
    name: 'Ursids',
    peak: { month: 12, day: 22 },
    window: { before: 2, after: 2 },
    zhr: 10,
    radiant: 'Ursa Minor',
    glyph: '✨',
    blurb: 'Quiet solstice shower — radiant near the North Star.',
  },
];

export interface UpcomingShower {
  shower: MeteorShower;
  peakAt: Date;
  daysUntil: number;        // negative if peak already passed; 0 if today
  inWindow: boolean;        // within shower.window of peak
}

/**
 * Return the nearest shower relative to `now`, plus whether we're in its
 * viewing window. Looks at both this year's remaining showers and next
 * year's early ones so a late-December call doesn't miss January's
 * Quadrantids.
 */
export function nearestShower(now: Date = new Date()): UpcomingShower | null {
  const t = now.getTime();
  const thisYear = now.getUTCFullYear();
  const candidates: Array<{ shower: MeteorShower; peakAt: Date }> = [];
  for (const year of [thisYear - 1, thisYear, thisYear + 1]) {
    for (const s of SHOWERS) {
      candidates.push({
        shower: s,
        peakAt: new Date(Date.UTC(year, s.peak.month - 1, s.peak.day, 6, 0, 0)),
      });
    }
  }
  // Pick the candidate with minimum absolute distance — but if two are
  // equally close, prefer the upcoming one.
  candidates.sort((a, b) => {
    const da = Math.abs(a.peakAt.getTime() - t);
    const db = Math.abs(b.peakAt.getTime() - t);
    if (da !== db) return da - db;
    // Tie-break: upcoming over passed
    return a.peakAt.getTime() - b.peakAt.getTime();
  });
  const nearest = candidates[0];
  if (!nearest) return null;
  const daysUntil = Math.round((nearest.peakAt.getTime() - t) / 86_400_000);
  const inWindow =
    daysUntil >= -nearest.shower.window.after &&
    daysUntil <= nearest.shower.window.before;
  return { shower: nearest.shower, peakAt: nearest.peakAt, daysUntil, inWindow };
}
