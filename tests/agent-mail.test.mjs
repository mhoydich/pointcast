import assert from 'node:assert/strict';
import test from 'node:test';

import { imapOptions, loadMailEnv, parseEnvText, smtpOptions } from '../scripts/agent-mail/_shared.mjs';
import { fetchById, listUnread, markRead } from '../scripts/agent-mail/read.mjs';
import { sendAgentMail } from '../scripts/agent-mail/send.mjs';
import { pollUnread } from '../scripts/agent-mail/watch.mjs';

const values = {
  IMAP_HOST: 'imap.example.test',
  IMAP_PORT: '993',
  IMAP_USER: 'fable@pointcast.xyz',
  IMAP_PASS: 'not-a-real-secret',
  SMTP_HOST: 'smtp.example.test',
  SMTP_PORT: '465',
};

class FakeImap {
  constructor(config) { this.config = config; this.marked = []; this.closed = false; }
  async connect() {}
  async mailboxOpen(name) { assert.equal(name, 'INBOX'); }
  async search() { return [17]; }
  async *fetch() {
    yield {
      uid: 17,
      flags: new Set(),
      envelope: {
        subject: 'Town hello',
        date: new Date('2026-09-03T17:00:00.000Z'),
        messageId: '<town-17@example.test>',
        from: [{ name: 'Resident', address: 'resident@example.test' }],
        to: [{ name: 'Fable', address: 'fable@pointcast.xyz' }],
      },
    };
  }
  async fetchOne(id) {
    return {
      uid: id,
      flags: new Set(['\\Seen']),
      envelope: { subject: 'Town hello', from: [], to: [] },
      source: Buffer.from('Subject: Town hello\r\n\r\nA plain note.'),
    };
  }
  async messageFlagsAdd(id, flags) { this.marked.push({ id, flags }); return true; }
  async logout() { this.closed = true; }
}

test('agent mail config parsing never needs process env and validates both rails', () => {
  const parsed = parseEnvText(`
    # local only
    IMAP_HOST=imap.example.test
    IMAP_PORT="993"
    IMAP_USER='fable@pointcast.xyz'
    IMAP_PASS=private-value
    SMTP_HOST=smtp.example.test
    SMTP_PORT=465
  `);
  assert.equal(parsed.IMAP_USER, 'fable@pointcast.xyz');
  assert.equal(imapOptions(parsed).secure, true);
  assert.equal(smtpOptions(parsed).secure, true);
  assert.throws(() => imapOptions({}), /IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS/u);
});

test('missing agent mail env file fails clearly without leaking credentials', async () => {
  await assert.rejects(loadMailEnv('/tmp/pointcast-mail-file-that-does-not-exist.env'), /Agent mail config is missing/u);
});

test('agent IMAP commands list, fetch, mark, and watch with a fake client', async () => {
  const clients = [];
  const options = { values, createClient: (config) => { const client = new FakeImap(config); clients.push(client); return client; } };
  const unread = await listUnread(options);
  assert.equal(unread[0].id, 17);
  assert.equal(unread[0].from[0].address, 'resident@example.test');
  assert.equal(clients[0].config.auth.user, 'fable@pointcast.xyz');
  assert.equal(clients[0].closed, true);

  const fetched = await fetchById(17, options);
  assert.match(fetched.source, /A plain note\./u);
  assert.deepEqual(await markRead(17, options), { id: 17, markedRead: true });

  const seen = new Set();
  assert.equal((await pollUnread(seen, options)).length, 1);
  assert.equal((await pollUnread(seen, options)).length, 0);
});

test('agent SMTP send pins the Fable address and appends a receipt through fakes', async () => {
  const sent = [];
  const receipts = [];
  const result = await sendAgentMail({
    to: 'resident@example.test',
    subject: 'A plain note',
    text: 'Hello from Fable.',
  }, {
    values,
    createTransport: (config) => ({
      async sendMail(message) {
        sent.push({ config, message });
        return { messageId: 'smtp-1' };
      },
    }),
    appendReceipt: async (receipt) => { receipts.push(receipt); },
  });
  assert.equal(sent[0].message.from, 'Fable <fable@pointcast.xyz>');
  assert.equal(sent[0].message.html, undefined);
  assert.equal(sent[0].config.auth.pass, 'not-a-real-secret');
  assert.equal(receipts[0].messageId, 'smtp-1');
  assert.equal(result.ok, true);
});
