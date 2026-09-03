import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const MAIL_ENV_PATH = join(homedir(), '.config', 'pointcast', 'fable-mail.env');
export const MAIL_LOG_PATH = join(homedir(), '.config', 'pointcast', 'fable-mail.log');

export function parseEnvText(source) {
  const values = {};
  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(?:export\s+)?([A-Z][A-Z0-9_]*)=(.*)$/u);
    if (!match) continue;
    let value = match[2].trim();
    if (
      value.length >= 2
      && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

export async function loadMailEnv(path = MAIL_ENV_PATH) {
  let source;
  try {
    source = await readFile(path, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      throw new Error(`Agent mail config is missing: ${path}`);
    }
    throw new Error(`Agent mail config could not be read: ${path}`);
  }
  return parseEnvText(source);
}

export function requireMailValues(values, names) {
  const missing = names.filter((name) => !values[name]);
  if (missing.length > 0) {
    throw new Error(`Agent mail config is missing required fields: ${missing.join(', ')}`);
  }
  return values;
}

function portNumber(raw, name) {
  const port = Number.parseInt(raw, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Agent mail config has an invalid ${name}`);
  }
  return port;
}

export function imapOptions(values) {
  requireMailValues(values, ['IMAP_HOST', 'IMAP_PORT', 'IMAP_USER', 'IMAP_PASS']);
  const port = portNumber(values.IMAP_PORT, 'IMAP_PORT');
  return {
    host: values.IMAP_HOST,
    port,
    secure: port === 993,
    auth: { user: values.IMAP_USER, pass: values.IMAP_PASS },
    logger: false,
  };
}

export function smtpOptions(values) {
  requireMailValues(values, ['SMTP_HOST', 'SMTP_PORT', 'IMAP_USER', 'IMAP_PASS']);
  const port = portNumber(values.SMTP_PORT, 'SMTP_PORT');
  return {
    host: values.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: values.IMAP_USER, pass: values.IMAP_PASS },
  };
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      args._.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

export function jsonLine(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value)}\n`);
}
