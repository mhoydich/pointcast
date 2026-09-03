import { appendFile, mkdir, stat } from 'node:fs/promises';
import { dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import nodemailer from 'nodemailer';

import {
  MAIL_LOG_PATH,
  jsonLine,
  loadMailEnv,
  parseArgs,
  smtpOptions,
} from './_shared.mjs';

const FABLE_FROM = 'Fable <fable@pointcast.xyz>';

async function writeReceipt(receipt, path = MAIL_LOG_PATH) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await appendFile(path, `${JSON.stringify(receipt)}\n`, { encoding: 'utf8', mode: 0o600 });
}

export async function sendAgentMail(message, options = {}) {
  if (!message.to || !message.subject || !message.text) {
    throw new Error('Mail requires non-empty to, subject, and text values');
  }
  const values = options.values ?? await loadMailEnv();
  const createTransport = options.createTransport ?? ((config) => nodemailer.createTransport(config));
  const appendReceipt = options.appendReceipt ?? writeReceipt;
  const transport = createTransport(smtpOptions(values));
  const attachments = [];
  if (message.attachment) {
    const info = await stat(message.attachment);
    if (!info.isFile()) throw new Error(`Attachment is not a file: ${message.attachment}`);
    attachments.push({ filename: basename(message.attachment), path: message.attachment });
  }

  const result = await transport.sendMail({
    from: FABLE_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
    attachments,
  });
  const receipt = {
    at: new Date().toISOString(),
    messageId: result.messageId || null,
    from: 'fable@pointcast.xyz',
    to: message.to,
    subject: message.subject,
    attachment: message.attachment ? basename(message.attachment) : null,
  };
  await appendReceipt(receipt);
  return { ok: true, ...receipt };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await sendAgentMail({
    to: typeof args.to === 'string' ? args.to : '',
    subject: typeof args.subject === 'string' ? args.subject : '',
    text: typeof args.text === 'string' ? args.text : '',
    attachment: typeof args.attach === 'string' ? args.attach : undefined,
  });
  jsonLine(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    jsonLine({ ok: false, error: error instanceof Error ? error.message : String(error) }, process.stderr);
    process.exitCode = 1;
  });
}
