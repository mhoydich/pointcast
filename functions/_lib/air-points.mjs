// Pure parts of the Field Reports game layer — the price list, the daily cap,
// badges, stamps and stamp traits — kept in a plain module so tests run them
// under node without the Pages runtime. Points are a score, never cash, and
// never depend on what a report says: "0 waiting" and "5+" pay the same.

import { inHours, laDate, laParts, weekOf, windowIdx } from './air-reading.mjs';

export const POINTS = Object.freeze({ report: 6, 'first-light': 4, confirm: 3, cant: 1, byline: 10 });
export const DAILY_CAP = 30;
export const STILL_TRUE_AT = 10;

/** Badges written in the MVP, plus byline (PR 2). Labels are what the stamp prints. */
export const BADGES = Object.freeze({
  'first-light': { label: 'FIRST LIGHT', rule: 'First on-site report of the day at a spot, in its open hours' },
  'morning-crew': { label: 'MORNING CREW', rule: '3+ phones report or confirm on site at one spot within 30 minutes' },
  'still-true': { label: 'STILL TRUE', rule: `Give ${STILL_TRUE_AT} on-site confirmations` },
  byline: { label: 'BYLINE', rule: 'A report of yours runs in a frozen Morning Edition' },
});

// air_points.ref values. UNIQUE (owner, action, ref) is what makes each pay once.
export const reportRef = (spot, kind, day, idx) => `${spot}:${kind}:${day}:${idx}`;
/** A `payEvery: 'week'` kind's ref: one award per spot, kind and LA Monday-week (weekOf in air-reading.mjs). */
export const weeklyRef = (spot, kind, day) => `${spot}:${kind}:w${weekOf(day)}`;
export const firstLightRef = (spot, day) => `${spot}:${day}`;
export const bylineRef = (date) => `morning:${date}`;

/**
 * Pure: whether a report may take First Light. A real answer ("Can't say" never
 * opens the day) inside the spot's open hours (`spot.hours`, LA time). A report
 * outside hours files, pays and stamps as usual; it just never opens the day,
 * so a 00:01 report from bed leaves First Light to the first one after 6:00.
 * The caller checks this before it claims air_firsts.
 */
export function firstLightOpen({ spot, value, observedAt }) {
  return value !== 'cant' && inHours(spot?.hours, observedAt);
}

/**
 * Pure: the air_points rows a report earns, before the cap: [{action, ref, units, day}].
 * Remote reports earn nothing. "cant" pays 1 in place of the report's `units`.
 * `units` is the kind's `points` (absent or not a whole number ≥ 0: 6).
 * `payEvery: 'week'` pays once per spot, kind and LA Monday-week (weeklyRef);
 * otherwise once per decay window (reportRef). UNIQUE (owner, action, ref) in
 * air_points is what makes either pay once.
 * `firstLight` means the caller's INSERT OR IGNORE INTO air_firsts changed a row.
 */
export function reportAwards({ spot, kind, value, onsite, observedAt, decayMin, firstLight = false, units = POINTS.report, payEvery = null }) {
  if (!onsite) return [];
  const day = laDate(observedAt);
  const ref = payEvery === 'week' ? weeklyRef(spot, kind, day) : reportRef(spot, kind, day, windowIdx(observedAt, decayMin));
  const pay = Number.isInteger(units) && units >= 0 ? units : POINTS.report;
  const out = [value === 'cant' ? { action: 'cant', ref, units: POINTS.cant, day } : { action: 'report', ref, units: pay, day }];
  if (firstLight) out.push({ action: 'first-light', ref: firstLightRef(spot, day), units: POINTS['first-light'], day });
  return out;
}

/** Pure: a confirm's rows before the cap. On site only; a "cant" verdict pays 1, the others 3. */
export function confirmAwards({ reportId, verdict, onsite, at }) {
  if (!onsite) return [];
  const action = verdict === 'cant' ? 'cant' : 'confirm';
  return [{ action, ref: reportId, units: POINTS[action], day: laDate(at) }];
}

/** Pure: the byline row for a frozen edition, dated the edition date. */
export function bylineAwards(date) {
  return [{ action: 'byline', ref: bylineRef(date), units: POINTS.byline, day: date }];
}

/** min(units, cap − spent), never below zero. `spent` is the owner's sum for the day. */
export function capUnits(units, spent, cap = DAILY_CAP) {
  return Math.max(0, Math.min(units, cap - spent));
}

/** Pure: cap a list of awards in order against what the owner already earned today. */
export function applyCap(awards, spent) {
  let used = spent;
  const out = awards.map((a) => {
    const units = capUnits(a.units, used);
    used += units;
    return { ...a, units };
  });
  return { awards: out, total: used - spent };
}

/** Pure: badge ids earned by this event. `onsiteConfirmsGiven` counts the owner's on-site confirms. */
export function badgesFor({ firstLight = false, crewMember = false, onsiteConfirmsGiven = 0, byline = false }) {
  const out = [];
  if (firstLight) out.push('first-light');
  if (crewMember) out.push('morning-crew');
  if (onsiteConfirmsGiven >= STILL_TRUE_AT) out.push('still-true');
  if (byline) out.push('byline');
  return out;
}

// air_stamps rows: UNIQUE (owner, kind, ref, day). Badges are earned once (day '-').
export const placeStamp = (spot, day) => ({ kind: 'place', ref: spot, day });
export const crewStamp = (spot, day) => ({ kind: 'crew', ref: spot, day });
export const badgeStamp = (badge) => ({ kind: 'badge', ref: badge, day: '-' });

/**
 * What outranks what on a receipt, highest first. A crew stamp ranks as
 * morning-crew. 'assignment' is the display-only ASSIGNMENT stamp a filled
 * seat slams beside the place stamp (assignReceiptStamp in air-assign.mjs):
 * never an air_stamps row, it carries its own text.
 */
export const RECEIPT_ORDER = Object.freeze(['assignment', 'morning-crew', 'first-light', 'still-true', 'place']);

/**
 * Pure: the stamps a receipt slams, from what one report or confirm wrote or
 * already held ([{kind, ref, day, fresh}]). Two at most: the place stamp (new
 * or already held today; it is the receipt's stamp) and the highest NEW badge
 * by RECEIPT_ORDER, where the dated crew stamp beats the MORNING CREW badge.
 * Every other new stamp is only counted: `more`, "+2 more in your book". All
 * of them are in air_stamps already; only the display is capped.
 * → { slam: [place?, top?], more }
 */
export function receiptStamps(held) {
  const rank = (s) => {
    const i = RECEIPT_ORDER.indexOf(s.kind === 'badge' ? s.ref : s.kind === 'crew' ? 'morning-crew' : s.kind);
    return i < 0 ? RECEIPT_ORDER.length : i;
  };
  const place = held.find((s) => s.kind === 'place') ?? null;
  const top = held.filter((s) => s.fresh && s !== place)
    .sort((a, b) => rank(a) - rank(b) || Number(b.kind === 'crew') - Number(a.kind === 'crew'))[0] ?? null;
  const slam = [place, top].filter(Boolean);
  return { slam, more: held.filter((s) => s.fresh && !slam.includes(s)).length };
}

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** "FRI 02 OCT 2026" for '2026-10-02'. */
export function dayStamp(day) {
  const [y, m, d] = day.split('-').map(Number);
  return `${DOW[new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()]} ${String(d).padStart(2, '0')} ${MON[m - 1]} ${y}`;
}

/** What a stamp prints: "COURTS · FRI 02 OCT 2026", "MORNING CREW · COURTS · …", the badge label, or an ASSIGNMENT stamp's own text. */
export function stampText(stamp, short) {
  if (stamp.kind === 'assignment') return stamp.text;
  if (stamp.kind === 'badge') return BADGES[stamp.ref]?.label ?? stamp.ref.toUpperCase();
  const place = `${short} · ${dayStamp(stamp.day)}`;
  return stamp.kind === 'crew' ? `${BADGES['morning-crew'].label} · ${place}` : place;
}

/**
 * Trait keys a rarity rating must never score. `answer` is what the reporter
 * said: a score that rewarded rare answers would pay for content, and "0
 * waiting" must stay worth what "5+" is (badges doc §5: the reporter's own
 * value is never rated). Condition traits, when they come, are read off the
 * nearest agent row, never off `answer`.
 */
export const UNRATED_TRAITS = Object.freeze(['answer']);

/**
 * Pure: the traits every air_stamps.meta_json carries, for a future public
 * rarity rating. `observedAt` is the report's time (a confirm's `at` for a
 * confirm stamp; `answer` is then the confirmed value). `crewSize` is the
 * crew's n for crew stamps, else null. `prevOnsiteAt` is the newest earlier
 * on-site human report at the spot (any kind), or null when there is none.
 * `geo` is the location tick (PR 3); false until then.
 * `answer` is the reporter's bucket, kept only for the trait line on the card
 * ("1–4 WAITING"). It is in UNRATED_TRAITS: rarity must never rate it.
 * → {spot, kind, weekday (0-6 LA, Sun 0), hour (LA), crewSize, firstLight, deadAirHours, geo, answer}
 */
export function stampTraits({ spot, kind, answer, observedAt, crewSize = null, firstLight = false, prevOnsiteAt = null, geo = false }) {
  const { weekday, hour } = laParts(observedAt);
  const deadAirHours = prevOnsiteAt == null ? null : Math.max(0, Math.floor((observedAt - prevOnsiteAt) / 3_600_000));
  return { spot, kind, weekday, hour, crewSize: crewSize ?? null, firstLight: firstLight === true, deadAirHours, geo: geo === true, answer };
}
