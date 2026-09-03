import { ImapFlow } from 'imapflow';
import { pathToFileURL } from 'node:url';

import { imapOptions, jsonLine, loadMailEnv } from './_shared.mjs';

function addresses(items) {
  return (items ?? []).map((item) => ({
    name: item.name || null,
    address: item.address || null,
  }));
}

export function messageJson(message, includeSource = false) {
  const envelope = message.envelope ?? {};
  const output = {
    id: message.uid,
    flags: [...(message.flags ?? [])],
    date: envelope.date instanceof Date ? envelope.date.toISOString() : envelope.date ?? null,
    subject: envelope.subject ?? '',
    messageId: envelope.messageId ?? null,
    from: addresses(envelope.from),
    to: addresses(envelope.to),
    cc: addresses(envelope.cc),
  };
  if (includeSource) output.source = Buffer.from(message.source ?? '').toString('utf8');
  return output;
}

async function withInbox(values, createClient, action) {
  const client = createClient(imapOptions(values));
  await client.connect();
  try {
    await client.mailboxOpen('INBOX');
    return await action(client);
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function listUnread(options = {}) {
  const values = options.values ?? await loadMailEnv();
  const createClient = options.createClient ?? ((config) => new ImapFlow(config));
  return withInbox(values, createClient, async (client) => {
    const ids = await client.search({ seen: false }, { uid: true });
    if (ids.length === 0) return [];
    const messages = [];
    for await (const message of client.fetch(ids, {
      uid: true,
      envelope: true,
      flags: true,
    }, { uid: true })) {
      messages.push(messageJson(message));
    }
    return messages;
  });
}

export async function fetchById(id, options = {}) {
  const values = options.values ?? await loadMailEnv();
  const createClient = options.createClient ?? ((config) => new ImapFlow(config));
  return withInbox(values, createClient, async (client) => {
    const message = await client.fetchOne(id, {
      uid: true,
      envelope: true,
      flags: true,
      source: true,
    }, { uid: true });
    if (!message) throw new Error(`No INBOX message found for id ${id}`);
    return messageJson(message, true);
  });
}

export async function markRead(id, options = {}) {
  const values = options.values ?? await loadMailEnv();
  const createClient = options.createClient ?? ((config) => new ImapFlow(config));
  return withInbox(values, createClient, async (client) => {
    const changed = await client.messageFlagsAdd(id, ['\\Seen'], { uid: true });
    return { id, markedRead: Boolean(changed) };
  });
}

async function main() {
  const [command = 'unread', rawId] = process.argv.slice(2);
  if (command === 'unread') return jsonLine(await listUnread());
  const id = Number.parseInt(rawId, 10);
  if (!Number.isInteger(id) || id < 1) throw new Error('A positive IMAP message id is required');
  if (command === 'get') return jsonLine(await fetchById(id));
  if (command === 'mark-read') return jsonLine(await markRead(id));
  throw new Error('Usage: read.mjs unread | get <id> | mark-read <id>');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    jsonLine({ ok: false, error: error instanceof Error ? error.message : String(error) }, process.stderr);
    process.exitCode = 1;
  });
}
