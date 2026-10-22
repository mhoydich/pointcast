#!/usr/bin/env node
// Projects El Segundo Civil Service posts (src/data/civil-service.ts) into the
// shared jobs catalog (public/opportunities/catalog.json) as closed, proposed,
// unpaid field-task records. Re-run after adding or editing posts:
//   node scripts/sync-civil-service-jobs.mjs
// Records keep the catalog's gates: applicationsEnabled false, no availability
// claim, no intake here. Sign-up happens on /civil-service itself.
import { readFileSync, writeFileSync } from 'node:fs';
import { CIVIL_SERVICE_POSTS, OFFER_CLOCK_DAYS, postNotice } from '../src/data/civil-service.ts';

const NOTICE_DATES = { 'ESCS-001': '2026-10-05', 'ESCS-002': '2026-10-22' };
const REVIEWED_AT = '2026-10-22';
const WHO = { neighbor: 'Neighbors (people in the 90245 radius)', agent: 'AI agents', either: 'Neighbors or AI agents' };
const path = new URL('../public/opportunities/catalog.json', import.meta.url);
const catalog = JSON.parse(readFileSync(path, 'utf8'));

const records = CIVIL_SERVICE_POSTS.map((post) => ({
  id: `civil-service-${post.code.toLowerCase()}`,
  title: `${post.code} · ${post.title}`,
  owner: 'pointcast',
  sites: ['pointcast'],
  project: 'civil-service',
  status: 'proposed',
  kind: 'volunteer-field-task',
  compensationKind: 'unpaid',
  compensation: `Unpaid. ${post.points} PointCast passport points and a public receipt; points are not money or wages.`,
  description: post.duty,
  sourceUrl: `https://pointcast.xyz/civil-service#${post.code}`,
  sourceDate: NOTICE_DATES[postNotice(post)],
  reviewedAt: REVIEWED_AT,
  availabilityVerifiedAt: null,
  applicationsEnabled: false,
  expectations: `Who: ${WHO[post.who]}. Receipt: ${post.receipt}. File one small piece of the duty as a public receipt within ${OFFER_CLOCK_DAYS} days of taking the post.`,
  terms: `Not an application and not employment. Taking a post happens with a public handle on pointcast.xyz/civil-service (${postNotice(post)}); this catalog accepts no applications. Independent PointCast project from Hoydich Enterprises; not affiliated with, endorsed by, or speaking for the City of El Segundo or any government agency. No real public employment is offered.`,
  firstBrief: null,
  skills: post.receiptFields.join(', '),
}));

// Text-level splice so the rest of the hand-edited catalog keeps its exact
// formatting (JSON.stringify would rewrite floats like 40000.0).
const ANCHOR = '\n  ],\n  "availableProjectRoutes"';
let text = readFileSync(path, 'utf8');
const end = text.indexOf(ANCHOR);
if (end < 0) throw new Error('catalog layout changed: opportunities array end not found');
const firstOurs = text.indexOf('\n    {\n      "id": "civil-service-');
let head = firstOurs >= 0 && firstOurs < end ? text.slice(0, text.lastIndexOf(',', firstOurs)) : text.slice(0, end);
const block = records.map((r) => JSON.stringify(r, null, 2).replace(/^/gm, '    ')).join(',\n');
text = head + ',\n' + block + text.slice(end);
const parsed = JSON.parse(text);
if (parsed.opportunities.filter((r) => r.project === 'civil-service').length !== records.length) throw new Error('splice failed');
writeFileSync(path, text);
console.log(`civil-service: ${records.length} records synced (${parsed.opportunities.length} total)`);
