/**
 * iso-week.mjs — shared ISO-8601 week id ("YYYY-wWW").
 *
 * One algorithm for every weekly KV key on the site, so week ids always
 * line up across surfaces. Consumers: functions/cron/weekly-recap.ts
 * (recap:{week}) and workers/observatory (obs:weekly:{week}).
 *
 * ISO 8601: weeks start Monday; week 1 is the week containing Jan 4
 * (equivalently, the Thursday of the week determines the year).
 */

/** @param {Date} date @returns {string} e.g. "2026-w30" */
export function getISOWeekId(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-w${String(weekNo).padStart(2, '0')}`;
}
