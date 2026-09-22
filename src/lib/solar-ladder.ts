// Small Solar — a low-cost solar ladder for El Segundo, on the El Segundo channel.
// One dataset (src/data/solar-ladder.json) feeds the room at /solar, the JSON
// twin at /solar.json, the block, and the test. Four rungs from one panel to a
// block, storage that is and is not a battery, five ways to move the power, and
// shelves of vendors we verified on a stated day. We point, the vendor sells.
// Nothing here is electrical advice or inside information.

import data from '../data/solar-ladder.json';

export const SOLAR_URL = 'https://pointcast.xyz/solar';
export const SOLAR_JSON_URL = 'https://pointcast.xyz/solar.json';
export const SOLAR_BLOCK = data.meta.block;

export const SOLAR = data;
export type Rung = (typeof data.rungs)[number];
export type Shelf = (typeof data.sources.shelves)[number];
export type SourceItem = Shelf['items'][number];
export type Rule = (typeof data.rules)[number];

export const RUNGS = data.rungs as Rung[];
export const SHELVES = data.sources.shelves as Shelf[];
export const SOURCE_COUNT = SHELVES.reduce((n, s) => n + s.items.length, 0);

export const hostOf = (url: string): string => new URL(url).hostname.replace(/^www\./, '');
export const usd = (n: number): string => (n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`);
export const range = (pair: readonly number[], fmt: (n: number) => string = String): string =>
  pair[0] === pair[1] ? fmt(pair[0]) : `${fmt(pair[0])}–${fmt(pair[1])}`;
export const watts = (w: number): string => (w >= 1000 ? `${(w / 1000).toFixed(w % 1000 === 0 ? 0 : 1)} kW` : `${w} W`);

export const shelfById = (id: string): Shelf | undefined => SHELVES.find((s) => s.id === id);

// Sizing: what the calculator on the page does, exposed for the JSON twin and the test.
// panels (W) = daily kWh / (peak-sun hours × system efficiency) × 1000
// battery (kWh) = nightly kWh × autonomy days / usable depth
export const sizeFor = (dailyKwh: number, nightlyKwh: number = dailyKwh * 0.6) => {
  const s = data.sizing;
  return {
    panelsW: Math.ceil((dailyKwh / (s.peakSunHours * s.systemEfficiency)) * 1000 / 50) * 50,
    batteryKwh: Math.ceil(((nightlyKwh * s.autonomyDays) / s.usableDepth) * 10) / 10,
  };
};

export const SOLAR_STATS = {
  rungs: RUNGS.length,
  shelves: SHELVES.length,
  sources: SOURCE_COUNT,
  rules: data.rules.length,
  peakSunHours: data.meta.peakSunHours,
  cheapestRungUsd: RUNGS[0].budget[0],
  houseRungUsd: RUNGS[2].budget,
};

export const SOLAR_BRIEF = {
  name: data.meta.name,
  subtitle: data.meta.subtitle,
  status: 'field guide — rungs are budgets, prices carry the day they were seen, every link is the seller or the agency',
  url: SOLAR_URL,
  channel: data.meta.channel,
  block: SOLAR_BLOCK,
  asOf: data.meta.asOf,
  place: data.meta.place,
  license: data.meta.license,
  rule: data.meta.rule,
  stats: SOLAR_STATS,
  sizing: { ...data.sizing, example: { fridgeAndInternet: sizeFor(1.6, 1.0) } },
  rungs: RUNGS,
  storage: data.storage,
  distribution: data.distribution,
  safety: data.safety,
  sources: data.sources,
  rules: data.rules,
  learn: data.learn,
  method: data.method,
};
