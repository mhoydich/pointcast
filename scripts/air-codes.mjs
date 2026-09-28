#!/usr/bin/env node
/**
 * air-codes.mjs — print the air_codes INSERT for Field Reports spot codes.
 *
 * Spot codes are the ?c= on a spot's group link. They are never committed:
 * this prints SQL to stdout, you save it to an untracked file (or a temp
 * file) and apply it with wrangler, and the code stays in the group chat.
 * code_hash is keyed by the AIR_CODE_PEPPER Pages secret (codeHash() in
 * functions/_lib/air-kinds.mjs), so a hash is useless without the secret.
 *
 * Usage:
 *   AIR_CODE_PEPPER=… node scripts/air-codes.mjs courts=<CODE> beach=<CODE> \
 *     [--from 2026-10-01] [--to 2026-10-31] > /tmp/air-codes.sql
 *   npx wrangler d1 execute pointcast-auth --remote --file /tmp/air-codes.sql
 *   rm /tmp/air-codes.sql
 *
 * Codes: 8 to 16 letters and digits, random (not a word or a weekday); they
 * are case-insensitive. Dates are LA days, inclusive (default: today to +31).
 * Set the same pepper first: npx wrangler pages secret put AIR_CODE_PEPPER.
 *
 * Exit codes: 0 printed, 3 bad args or no pepper.
 */
import config from '../src/data/air-spots.json' with { type: 'json' };
import { codeHash, spotOf } from '../functions/_lib/air-kinds.mjs';

const fail = (msg) => { console.error(`air-codes: ${msg}`); process.exit(3); };
const day = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(d);
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const pepper = process.env.AIR_CODE_PEPPER || '';
if (!pepper) fail('set AIR_CODE_PEPPER (the same value as the Pages secret)');

const args = process.argv.slice(2);
let from = day(new Date());
let to = day(new Date(Date.now() + 31 * 86_400_000));
const pairs = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--from' || a === '--to') {
    const v = args[++i] || '';
    if (!DAY_RE.test(v)) fail(`${a} takes YYYY-MM-DD`);
    if (a === '--from') from = v; else to = v;
  } else {
    const [spot, code] = a.split('=');
    if (!spotOf(config, spot)) fail(`unknown spot "${spot}"`);
    if (!/^[A-Za-z0-9]{8,16}$/.test(code || '')) fail(`the ${spot} code must be 8 to 16 letters and digits`);
    pairs.push([spot, code.toUpperCase()]);
  }
}
if (!pairs.length) fail('give at least one spot=CODE');
if (from > to) fail('--from is after --to');

const rows = await Promise.all(pairs.map(async ([spot, code]) => `  ('${spot}', '${await codeHash(spot, code, pepper)}', '${from}', '${to}')`));
process.stdout.write(`-- Field Reports spot codes, ${from} to ${to}. Do not commit this file.\nINSERT OR IGNORE INTO air_codes (spot, code_hash, valid_from, valid_to) VALUES\n${rows.join(',\n')};\n`);
