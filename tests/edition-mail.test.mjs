import assert from 'node:assert/strict';
import test from 'node:test';

import { FIRST_EDITION as MORNING_FIRST_EDITION, toJsonFeed } from '../functions/_lib/morning.mjs';
import { normalizeEmail as authNormalizeEmail } from '../functions/api/auth/email/_shared.ts';
import {
  CONFIRM_RESEND_MS,
  CONFIRM_TTL_MS,
  EDITION_FROM,
  EDITION_SENDER,
  EDITION_SLOTS,
  FIRST_EDITION,
  MAIL_OFF_NOTE,
  PRUNE_SENT_PENDING_MS,
  SEND_HOUR,
  SIGNUP_COPY,
  SITE,
  SUB_SOURCES,
  TOKEN_RE,
  confirmEmail,
  confirmUrl,
  editionEmail,
  editionLink,
  escapeHtml,
  frozenItem,
  mailReadiness,
  newToken,
  normalizeEmail,
  parseSource,
  reportLink,
  sha256Hex,
  shouldSend,
  timingSafeEqual,
  unsubscribeUrl,
} from '../functions/_lib/edition-mail.mjs';

const DAY = '2026-10-18';
const TOKEN = 'A'.repeat(20) + '_-' + 'b'.repeat(21);

const LABELS = ['Sky · 6.100', 'Courts · 7.500', 'Beach · 6.200', 'Town · 7.100', 'Almanac', 'Shop', 'Station'];
function slots(n = EDITION_SLOTS, line = (i) => `Line ${i + 1} for the paper.`) {
  return Array.from({ length: n }, (_, i) => ({ id: `s${i}`, label: LABELS[i % LABELS.length], line: line(i) }));
}
function feedFor(edition) {
  return toJsonFeed([{ date: DAY, frozen: true, frozenAt: Date.parse('2026-10-18T13:45:10Z'), reporterLine: 'On the air yesterday: Guest 3348', slots: slots(), ...edition }]);
}
const item = (edition = {}) => frozenItem(feedFor(edition), DAY);

test('edition mail: the constants decided in the spec', () => {
  assert.equal(FIRST_EDITION, MORNING_FIRST_EDITION, 'pinned to morning.mjs');
  assert.equal(EDITION_SENDER, 'morning@pointcast.xyz');
  assert.equal(EDITION_FROM, 'PointCast Morning Edition <morning@pointcast.xyz>');
  assert.ok(EDITION_FROM.includes(`<${EDITION_SENDER}>`));
  assert.equal(SITE, 'https://pointcast.xyz');
  assert.equal(SEND_HOUR, 6);
  assert.equal(EDITION_SLOTS, 7);
  assert.equal(CONFIRM_TTL_MS, 172_800_000);
  assert.equal(CONFIRM_RESEND_MS, 60_000);
  assert.equal(PRUNE_SENT_PENDING_MS, 2_592_000_000);
  assert.deepEqual([...SUB_SOURCES], ['morning', 'receipt', 'card', 'rss', 'other']);
  assert.deepEqual(Object.keys(SIGNUP_COPY).sort(), ['check-email', 'on-list']);
  for (const line of [...Object.values(SIGNUP_COPY), MAIL_OFF_NOTE]) {
    assert.ok(!line.includes('!'), line);
    assert.ok(!/(^|\s)(I|my)\s/.test(line), line);
  }
});

test('edition mail: shouldSend keeps exactly one of the two crons, across Nov 1', () => {
  for (const day of ['2026-10-18', '2026-11-01', '2026-11-02']) {
    const a = shouldSend(Date.parse(`${day}T13:45:00Z`));
    const b = shouldSend(Date.parse(`${day}T14:45:00Z`));
    assert.equal(a.day, day);
    assert.equal(b.day, day);
    assert.equal([a, b].filter((g) => g.send).length, 1, day);
    for (const g of [a, b]) assert.equal(g.reason, g.send ? null : 'not-6am');
  }
  assert.equal(shouldSend(Date.parse('2026-10-18T13:45:00Z')).send, true, 'PDT: 13:45Z is 6:45 AM');
  assert.equal(shouldSend(Date.parse('2026-11-01T14:45:00Z')).send, true, 'PST: 14:45Z is 6:45 AM');
  for (const t of ['13:45', '14:45']) {
    assert.deepEqual(shouldSend(Date.parse(`2026-10-02T${t}:00Z`)), { send: false, day: '2026-10-02', reason: 'before-first-edition' });
  }
  assert.equal(shouldSend(Date.parse('2026-10-03T13:45:00Z')).send, true, 'the first edition day sends');
});

test('edition mail: frozenItem takes only a frozen, whole edition for that day', () => {
  const ok = item();
  assert.ok(ok);
  assert.equal(ok.id, `morning:${DAY}`);
  assert.equal(item({ provisional: true }), null, 'provisional');
  assert.equal(item({ frozen: false }), null, 'unfrozen');
  assert.equal(item({ slots: slots(6) }), null, '6 slots');
  assert.equal(item({ slots: slots(8) }), null, '8 slots');
  assert.equal(item({ slots: slots(7, (i) => (i === 3 ? '' : 'x')) }), null, 'an empty line');
  assert.equal(item({ slots: slots(7, (i) => (i === 3 ? '   ' : 'x')) }), null, 'a blank line');
  assert.equal(item({ slots: slots().map((s, i) => (i === 0 ? { ...s, label: '' } : s)) }), null, 'an empty label');
  assert.equal(item({ slots: slots().map((s, i) => (i === 0 ? { ...s, line: 5 } : s)) }), null, 'a non-string line');
  assert.equal(frozenItem(feedFor({}), '2026-10-17'), null, 'wrong id');
  assert.equal(frozenItem(null, DAY), null);
  assert.equal(frozenItem({ items: 'x' }, DAY), null);
  assert.equal(frozenItem({ items: [{ id: `morning:${DAY}` }] }, DAY), null, 'no _pointcast');
});

test('edition mail: editionEmail lays out the paper, escapes HTML and carries both unsubscribe headers', () => {
  const evil = item({ slots: slots(7, (i) => (i === 1 ? 'Rack <script>alert(1)</script> & co "q" \'s' : `Line ${i}.`)) });
  const mail = editionEmail(evil, TOKEN);
  assert.equal(mail.subject, evil.title);
  assert.deepEqual(mail.headers, {
    'List-Unsubscribe': `<${unsubscribeUrl(TOKEN)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  });
  assert.ok(!mail.html.includes('<script>'), 'no raw script in html');
  assert.ok(mail.html.includes('Rack &lt;script&gt;alert(1)&lt;/script&gt; &amp; co &quot;q&quot; &#39;s'));
  assert.ok(mail.text.includes('Rack <script>alert(1)</script> & co'), 'text stays plain');
  assert.ok(!/<img/i.test(mail.html), 'no images');

  const lines = mail.text.split('\n');
  assert.equal(lines[0], evil._pointcast.masthead);
  assert.equal(lines[1], 'On the air yesterday: Guest 3348');
  assert.equal(lines[2], '');
  assert.equal(lines[3], 'Sky · 6.100');
  assert.equal(lines[4], 'Line 0.');
  assert.equal(lines[5], '');
  assert.equal(lines.slice(-6).join('\n'), [
    'Reporters earn points, never cash, and never for what a report says.',
    'No link, no commission.',
    '',
    `Read it on the site: https://pointcast.xyz/morning?d=${DAY}&src=em`,
    'Report from a court: https://pointcast.xyz/r?src=em',
    `Unsubscribe: https://pointcast.xyz/api/morning/unsubscribe?t=${TOKEN}`,
  ].join('\n'));
  for (const s of evil._pointcast.slots) assert.ok(lines.includes(s.label), s.label);

  const textLinks = mail.text.match(/https:\/\/pointcast\.xyz[^\s"<]*/g);
  const htmlLinks = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  assert.equal(htmlLinks.length, 3);
  for (const link of [...textLinks, ...htmlLinks]) {
    if (link.startsWith(`${SITE}/api/morning/unsubscribe`)) assert.equal(link, unsubscribeUrl(TOKEN));
    else assert.match(link, /[?&]src=em(&|$)/, link);
  }
  assert.ok(!/utm_|[?&]ref=/.test(mail.text + mail.html), 'no tracking parameters but src=em');
});

test('edition mail: the reporter line is left out when empty', () => {
  const mail = editionEmail(item({ reporterLine: '' }), TOKEN);
  const lines = mail.text.split('\n');
  assert.equal(lines[1], '');
  assert.equal(lines[2], 'Sky · 6.100');
  assert.ok(!mail.text.includes('On the air'));
  assert.ok(!mail.html.includes('On the air'));
});

test('edition mail: confirmEmail holds the confirm link and the plain copy', () => {
  const raw = newToken();
  const mail = confirmEmail(raw);
  assert.equal(mail.subject, 'Confirm the PointCast Morning Edition');
  assert.equal(confirmUrl(raw), `https://pointcast.xyz/api/morning/confirm?t=${raw}`);
  assert.equal(mail.text, [
    'Open this link to get the Morning Edition by email at 6:45 AM each day:',
    '',
    confirmUrl(raw),
    '',
    'The link works for 48 hours. If you did not ask for this, ignore this email and nothing more will be sent.',
    '',
    'PointCast · El Segundo · https://pointcast.xyz/morning',
  ].join('\n'));
  assert.ok(mail.html.includes(`href="${confirmUrl(raw)}"`));
  assert.ok(!/<img/i.test(mail.html));
});

test('edition mail: link helpers', () => {
  assert.equal(editionLink(DAY), `https://pointcast.xyz/morning?d=${DAY}&src=em`);
  assert.equal(reportLink(), 'https://pointcast.xyz/r?src=em');
  assert.equal(unsubscribeUrl(TOKEN), `https://pointcast.xyz/api/morning/unsubscribe?t=${TOKEN}`);
  assert.equal(escapeHtml(`<a href="x">&'</a>`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  assert.equal(escapeHtml(null), '');
});

test('edition mail: normalizeEmail agrees with the sign-in rule in _shared.ts', () => {
  const samples = [
    ' Mike@PointCast.xyz ', 'a@b.co', 'no-at-sign.example', 'two@@x.co', 'sp ace@x.co', 'x@y', 'a@b.',
    '@b.co', `${'a'.repeat(250)}@b.co`, 'ok.name+tag@sub.example.org', '', 42, null, undefined, '\tTAB@X.CO\n',
  ];
  for (const s of samples) assert.equal(normalizeEmail(s), authNormalizeEmail(s), JSON.stringify(s));
  assert.equal(normalizeEmail(' Mike@PointCast.xyz '), 'mike@pointcast.xyz');
  assert.equal(normalizeEmail('x@y'), null);
});

test('edition mail: parseSource', () => {
  for (const s of SUB_SOURCES) assert.equal(parseSource(s), s);
  for (const s of ['', 'RSS', 'email', null, undefined, 3, ['rss']]) assert.equal(parseSource(s), 'morning', String(s));
});

test('edition mail: tokens, hashes and constant-time compare', async () => {
  const a = newToken();
  const b = newToken();
  assert.match(a, TOKEN_RE);
  assert.match(b, TOKEN_RE);
  assert.notEqual(a, b);
  assert.equal(a.length, 43);
  assert.ok(!TOKEN_RE.test(`${a}x`));
  assert.ok(!TOKEN_RE.test(a.slice(1)));
  assert.ok(!TOKEN_RE.test(`${a.slice(1)}=`));
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(timingSafeEqual('abc', 'abc'), true);
  assert.equal(timingSafeEqual('abc', 'abd'), false);
  assert.equal(timingSafeEqual('abc', 'abcd'), false);
  assert.equal(timingSafeEqual('', ''), true);
  assert.equal(timingSafeEqual(null, null), false);
  assert.equal(timingSafeEqual('1', 1), false);
  assert.equal(timingSafeEqual(undefined, 'x'), false);
});

test('edition mail: mailReadiness, all four branches', () => {
  const binding = { send: async () => ({}) };
  assert.deepEqual(mailReadiness({ RESEND_API_KEY: 're_test' }), { configured: true, via: 'resend', reason: null, note: null });
  assert.deepEqual(mailReadiness({ RESEND_API_KEY: 're_test', SEND_EMAIL: binding }), { configured: true, via: 'resend', reason: null, note: null });
  assert.deepEqual(mailReadiness({ SEND_EMAIL: binding, MORNING_SEND_EMAIL_READY: 'true' }), { configured: true, via: 'send_email', reason: null, note: null });
  assert.deepEqual(mailReadiness({ SEND_EMAIL: binding, MORNING_SEND_EMAIL_READY: 'false' }), { configured: false, via: null, reason: 'send-email-not-onboarded', note: MAIL_OFF_NOTE });
  assert.deepEqual(mailReadiness({ SEND_EMAIL: binding }), { configured: false, via: null, reason: 'send-email-not-onboarded', note: MAIL_OFF_NOTE });
  assert.deepEqual(mailReadiness({ MORNING_SEND_EMAIL_READY: 'true' }), { configured: false, via: null, reason: 'no-mail-sender', note: MAIL_OFF_NOTE });
  assert.deepEqual(mailReadiness({ RESEND_API_KEY: '' }), { configured: false, via: null, reason: 'no-mail-sender', note: MAIL_OFF_NOTE });
  assert.deepEqual(mailReadiness({}), { configured: false, via: null, reason: 'no-mail-sender', note: MAIL_OFF_NOTE });
  assert.deepEqual(mailReadiness(undefined), { configured: false, via: null, reason: 'no-mail-sender', note: MAIL_OFF_NOTE });
});
