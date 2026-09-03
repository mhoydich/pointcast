import { pathToFileURL } from 'node:url';

import { jsonLine, parseArgs } from './_shared.mjs';
import { listUnread } from './read.mjs';

export async function pollUnread(seen, options = {}) {
  const messages = await listUnread(options);
  const fresh = messages.filter((message) => !seen.has(message.id));
  for (const message of fresh) seen.add(message.id);
  return fresh;
}

export async function watch(options = {}) {
  const minutes = options.minutes ?? 2;
  if (!Number.isFinite(minutes) || minutes <= 0) throw new Error('Poll minutes must be greater than zero');
  const seen = new Set();
  let stopped = false;
  let wake = null;
  const stop = () => {
    stopped = true;
    wake?.();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    while (!stopped) {
      try {
        for (const message of await pollUnread(seen, options)) jsonLine(message);
      } catch (error) {
        jsonLine({ ok: false, error: error instanceof Error ? error.message : String(error) }, process.stderr);
      }
      if (!stopped) {
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, minutes * 60_000);
          wake = () => {
            clearTimeout(timer);
            resolve();
          };
        });
        wake = null;
      }
    }
  } finally {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const minutes = args.minutes === undefined ? 2 : Number(args.minutes);
  await watch({ minutes });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    jsonLine({ ok: false, error: error instanceof Error ? error.message : String(error) }, process.stderr);
    process.exitCode = 1;
  });
}
