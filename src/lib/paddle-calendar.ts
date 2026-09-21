// The 2026 Paddle Calendar — a sourced reference on the Court channel.
// One dataset (src/data/paddle-calendar.json) feeds the page, the JSON twin,
// the test, and the Rally copy at tez-rally.pages.dev/paddle-calendar/.
// Every release carries its sources and a confidence mark; forecasts carry
// the thing they rest on. Nothing here is inside information.

import data from '../data/paddle-calendar.json';

export const PADDLE_CALENDAR_URL = 'https://pointcast.xyz/paddle-calendar';
export const PADDLE_CALENDAR_JSON_URL = 'https://pointcast.xyz/paddle-calendar.json';
export const PADDLE_CALENDAR_RALLY_URL = 'https://tez-rally.pages.dev/paddle-calendar/';
export const PADDLE_CALENDAR_BLOCK = '0596';
export const PADDLE_FUND_CAP_USD = 200;

export type Build = 'foam' | 'hybrid' | 'poly' | 'rib' | 'unknown';
export type Release = (typeof data.releases)[number];

export const PADDLE_CALENDAR = data;
export const RELEASES = data.releases as Release[];

// Validated categorical palette (dataviz validator, light surface): fixed
// order, colour follows the build and never its rank.
export const BUILDS: Record<Build, { label: string; short: string; color: string }> = {
  foam: { label: 'Full foam (Gen 4)', short: 'FOAM', color: '#3B6D11' },
  hybrid: { label: 'Honeycomb + foam (Gen 3)', short: 'GEN 3', color: '#185FA5' },
  poly: { label: 'Polymer honeycomb', short: 'POLY', color: '#B5651D' },
  rib: { label: 'Carbon rib', short: 'RIB', color: '#993556' },
  unknown: { label: 'Not stated', short: 'N/S', color: '#8A8883' },
};

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

export const tierOf = (msrp: number | null): 'floor' | 'middle' | 'top' | 'none' =>
  msrp == null ? 'none' : msrp <= 120 ? 'floor' : msrp < 230 ? 'middle' : 'top';

export const priceLabel = (r: Release): string =>
  ('msrpLabel' in r && r.msrpLabel) ? String(r.msrpLabel) : r.msrp == null ? 'price n/a' : `$${Number.isInteger(r.msrp) ? r.msrp : r.msrp.toFixed(2)}`;

export const hostOf = (url: string): string => new URL(url).hostname.replace(/^www\./, '');

const priced = RELEASES.filter((r) => r.msrp != null).map((r) => r.msrp as number).sort((a, b) => a - b);

export const PADDLE_CALENDAR_STATS = {
  releases: RELEASES.length,
  brands: new Set(RELEASES.map((r) => r.brand)).size,
  foam: RELEASES.filter((r) => r.build === 'foam').length,
  medianUsd: priced[Math.floor(priced.length / 2)],
  underFundCap: RELEASES.filter((r) => r.msrp != null && (r.msrp as number) <= PADDLE_FUND_CAP_USD).length,
  tourOnly: RELEASES.filter((r) => r.usap === 'no' || r.usap === 'split').length,
};

export const PADDLE_CALENDAR_BRIEF = {
  name: 'The 2026 Paddle Calendar',
  status: 'sourced reference — dates carry a precision, entries carry a confidence, forecasts carry a basis',
  url: PADDLE_CALENDAR_URL,
  rally: PADDLE_CALENDAR_RALLY_URL,
  channel: 'CRT',
  block: PADDLE_CALENDAR_BLOCK,
  stats: PADDLE_CALENDAR_STATS,
  builds: BUILDS,
  ...data,
};
