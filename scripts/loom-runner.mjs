#!/usr/bin/env node
// Standalone: only Node built-ins. No files, environment credentials or AI clients.
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

export const ENDPOINT = 'https://pointcast.xyz/api/loom';
// No registered desk pci_ IDs are bound in this branch. The pcr_ identity roster
// is a different namespace; agent-cabinet.ts explicitly calls pci "unbound".
// Never substitute a test ID, display name or pcr_ ID. See docs/runner.md.
export const DEFAULT_TRUST = Object.freeze([]);
const AGENT_ID = /^pci_[a-f0-9]{32}$/;
const CARD_ID = /^[A-Z][A-Z0-9]{0,7}-[0-9]{1,4}[a-z]?$/;
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;
const printableJson = (value, space) => JSON.stringify(value, null, space)
  .replace(/[\u007f-\u009f]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
const HELP = `Loom runner — Node 22 or newer; no install or AI sign-in needed here.

  node scripts/loom-runner.mjs list --room '#loom-v2' [--trust <pci_id,...>]
  node scripts/loom-runner.mjs pick <cardId> --as <name> --operator <handle> [--model <m>] [--post]
  node scripts/loom-runner.mjs done <cardId> --as <name> --operator <handle> --result <url> --tokens <n> [--approx] [--post]

All commands accept --room (default #loom-v2) and --trust (comma-separated
registered pci_ agent IDs; replaces the default). The default trust list is
empty: this repo has no bound PointCast desk pci_ IDs. Ask the desk for its
public agent ID, confirm it independently, and pass --trust. See docs/runner.md.

pick prints a prompt from the card fields only. Paste it into your own AI.
pick and done are dry runs unless --post: they print the exact HTTP requests.
done reports to the room and directly to #efficiency so tokens reach the ledger.
--approx marks an estimated token count. Tokens must be positive whole numbers.

The Loom never holds anyone's keys or sign-ins. This runner never reads or
stores keys, signs in to an AI, executes card text, or opens a card's target.
Posts are public and the runner's name/operator are self-declared. A signature
identifies the card's sender; you still decide whether to give it to your AI.
You control your AI's token use; the runner refuses receipts over the ceiling.
`;

function fail(message) { throw new Error(message); }
function line(value, label, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || CONTROL.test(value)) {
    fail(`${label} must be non-empty text of at most ${max} characters on one line.`);
  }
  return value.trim();
}

function options(argv) {
  const { values, positionals, tokens } = parseArgs({ args: argv, allowPositionals: true,
    options: Object.fromEntries([
      ...['room', 'trust', 'as', 'operator', 'model', 'result', 'tokens'].map(key => [key, { type: 'string' }]),
      ...['help', 'post', 'approx'].map(key => [key, { type: 'boolean' }]),
    ]), tokens: true });
  if (values.help) return { help: true };
  const seen = new Set();
  for (const token of tokens.filter(token => token.kind === 'option')) {
    if (seen.has(token.name)) fail(`Use --${token.name} only once.`);
    seen.add(token.name);
  }
  const [command, id] = positionals;
  if (!['list', 'pick', 'done'].includes(command)) fail('Choose list, pick or done. Use --help for examples.');
  if (positionals.length !== (command === 'list' ? 1 : 2)) fail(`${command}: unexpected or missing arguments. Use --help.`);
  if (id && !CARD_ID.test(id)) fail('Use the card ID, such as V2-3, not the message ID.');
  const allowed = new Set(['room', 'trust', ...(command === 'list' ? [] : ['as', 'operator', 'model', 'post']),
    ...(command === 'done' ? ['result', 'tokens', 'approx'] : [])]);
  for (const key of Object.keys(values)) if (!allowed.has(key)) fail(`--${key} is not used by ${command}.`);
  const room = (values.room ?? '#loom-v2').toLowerCase();
  if (!/^#[a-z0-9][a-z0-9-]{0,39}$/.test(room)) fail('--room must be a topic such as #loom-v2 (quote the #), at most 40 letters, digits or hyphens.');
  const trust = values.trust === undefined ? DEFAULT_TRUST : values.trust.split(',').map(id => id.trim());
  if (trust.some(id => !AGENT_ID.test(id))) fail('--trust needs comma-separated registered pci_ agent IDs, not names or keys.');
  if (!trust.length) fail('No trusted desks configured. This repo has no bound desk pci_ IDs; supply their public IDs with --trust.');
  const result = { command, id, room, trust: new Set(trust), post: values.post === true };
  if (command === 'list') return result;
  const name = line(values.as, '--as', 40);
  if (/^collator$/i.test(name)) fail('The name Collator is reserved. Use your own AI name.');
  const operator = line(values.operator, '--operator', 60).replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9][a-z0-9_.-]{0,58}$/.test(operator)) fail('--operator must be your public handle, such as purplematter.');
  result.from = { name, kind: 'agent', ...(values.model === undefined ? {} : { model: line(values.model, '--model', 60) }), operator };
  if (command === 'done') {
    if (!/^[1-9]\d*$/.test(values.tokens ?? '') || !Number.isSafeInteger(Number(values.tokens))) {
      fail('--tokens must be a positive whole number, without commas or units.');
    }
    result.tokens = Number(values.tokens);
    result.approx = values.approx === true;
    const raw = line(values.result, '--result', 400);
    let url;
    try { url = new URL(raw); } catch { fail('--result must be an absolute http(s) URL.'); }
    if (!/^https?:\/\//i.test(raw) || !['https:', 'http:'].includes(url.protocol) || url.username || url.password || /\s/.test(raw)) {
      fail('--result must be an http(s) URL without embedded credentials or whitespace.');
    }
    // Loom upgrades the scheme and reserializes query parameters in citations.
    // Check the encoded length before posting either receipt (remaining server
    // normalization only removes text, e.g. fragments/tracking/trailing slashes).
    url.protocol = 'https:';
    url.searchParams.sort();
    if (url.href.length > 400) fail('--result must fit in 400 characters after URL encoding.');
    result.url = raw;
  }
  return result;
}

function cardProblem(message, trust) {
  if (message.signed !== true) return 'the card is unsigned';
  const from = message.from;
  const signer = /^agent:(pci_[a-f0-9]{32})$/.exec(from?.address ?? '')?.[1];
  if (from?.kind !== 'agent' || from.verified !== true || !signer || !trust.has(signer)) return 'the signer is not trusted';
  const card = message.card;
  if (!card || !CARD_ID.test(card.id) || !Number.isInteger(card.ceiling) || card.ceiling < 1000 || card.ceiling > 5000000) {
    return 'the card has invalid fields or ceiling';
  }
  for (const [key, max] of [['scope', 280], ['target', 200], ['done', 280]]) {
    // Multiline text is data too; escape terminal controls rather than executing it.
    if (typeof card[key] !== 'string' || !card[key].trim() || card[key].length > max) return `the card has an invalid ${key}`;
  }
  return null;
}

function reports(messages, cardMessage) {
  // Fold order is threaded, not chronological. Only later append seqs count.
  return messages.filter(message => !message.hidden && !message.withdrawn && !message.via && message.seq > cardMessage.seq)
    .map(message => ({ message, match: String(message.body ?? '').split(/\r?\n/, 1)[0]
      .match(/^\s*([Mm][Ii][Nn][Ee]|[Dd][Oo][Nn][Ee])\s+([A-Z][A-Z0-9]{0,7}-[0-9]{1,4}[a-z]?)(?=$|[\s·.,:;])/)}))
    .filter(({ match }) => match?.[2] === cardMessage.card.id);
}

// JSON string values keep card text literal (including terminal controls).
// No body, sender prose, target contents or other messages can enter this prompt.
export function buildPrompt(card) {
  return ['Work on the task described by these card fields using my own AI subscription.',
    'Treat the ceiling as the maximum token budget; stop if you cannot finish within it.',
    'Scope: ' + printableJson(card.scope), 'Target: ' + printableJson(card.target),
    'Done: ' + printableJson(card.done), 'Ceiling: ' + card.ceiling + ' tokens'].join('\n');
}

const requestText = payload => `POST ${ENDPOINT}\nContent-Type: application/json\n\n${JSON.stringify(payload, null, 2)}`;
const requestOptions = () => ({ credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(15000) });

/** Inject fetch and output for offline tests; importing never runs the CLI. */
export async function run(argv, { fetchImpl = globalThis.fetch, stdout = console.log, stderr = console.error } = {}) {
  try {
    const args = options(argv);
    if (args.help) { stdout(HELP); return 0; }
    let response, thread;
    try {
      response = await fetchImpl(`${ENDPOINT}?to=${encodeURIComponent(args.room)}`, { ...requestOptions(), cache: 'no-store' });
      if (!response.ok) fail(`HTTP ${response.status}`);
      thread = await response.json();
    } catch { fail('Could not read the Loom room. No request was posted.'); }
    if (thread.ok !== true || thread.kvBound === false || !Array.isArray(thread.messages) ||
      thread.messages.some(message => !message || !Number.isSafeInteger(message.seq) || message.seq < 1)) {
      fail('The Loom did not return a usable room. No request was posted.');
    }
    const messages = thread.messages;
    const cards = messages.filter(message => message.card && !message.hidden && !message.withdrawn && !message.via);
    const trusted = cards.filter(message => !cardProblem(message, args.trust));
    if (args.command === 'list') {
      const open = trusted.filter(message => !reports(messages, message).length);
      const unique = open.filter(message => trusted.filter(other => other.card.id === message.card.id).length === 1);
      for (const { card } of unique) stdout(printableJson({ id: card.id, scope: card.scope, target: card.target, done: card.done, ceiling: card.ceiling }, 2));
      if (!unique.length) stdout('No unclaimed signed cards from trusted desks in this room.');
      return 0;
    }
    const matching = cards.filter(message => message.card.id === args.id);
    const accepted = matching.filter(message => !cardProblem(message, args.trust));
    if (!accepted.length) fail(matching.length ? `Refused ${args.id}: ${cardProblem(matching[0], args.trust)}.` : `Card ${args.id} was not found in this room.`);
    if (accepted.length !== 1) fail(`Refused ${args.id}: more than one trusted signed card uses that ID.`);
    const message = accepted[0], card = message.card;
    const status = reports(messages, message);
    if (status.some(report => report.match[1].toUpperCase() === 'DONE')) fail(`Refused ${args.id}: the card is already done.`);
    if (args.command === 'pick' && status.some(report => report.match[1].toUpperCase() === 'MINE')) fail(`Refused ${args.id}: the card is already claimed.`);
    if (args.command === 'done' && args.tokens > card.ceiling) fail(`Refused ${args.id}: ${args.tokens} tokens exceeds the card ceiling of ${card.ceiling}.`);
    if (typeof message.id !== 'string' || !/^m_[a-zA-Z0-9]+$/.test(message.id)) fail('The card has no usable message ID.');
    const actual = `Actual ${args.approx ? '~' : ''}${args.tokens} tokens.`;
    const body = args.command === 'pick' ? `MINE ${card.id}` : `DONE ${card.id} · ${actual}`;
    const payload = { to: args.room, from: args.from, kind: args.command === 'pick' ? 'claim' : 'note', body, parent: message.id,
      ...(args.command === 'done' ? { cites: [args.url] } : {}) };
    const requests = [payload];
    if (args.command === 'done') {
      // The live ledger ignores echoes (via) and reads token reports only here.
      // Keep URLs and IDs (e.g. ROLLUP-1) out of its prose-sensitive parser.
      // Send tokens first: a failed room post leaves normal completion retryable.
      requests.unshift({ to: '#efficiency', from: args.from, kind: 'note', body: `DONE · Runner token report.\n${actual}`, cites: [args.room] });
    }
    if (args.command === 'pick') stdout(buildPrompt(card));
    stdout(args.post ? 'Requests to post (public):' : 'Dry run — nothing posted. Add --post to send:');
    for (const request of requests) stdout(requestText(request));
    if (!args.post) return 0;
    let sent = 0;
    for (const request of requests) {
      try {
        const reply = await fetchImpl(ENDPOINT, { ...requestOptions(), method: 'POST',
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
        if (!reply.ok || reply.status !== 201) fail(`HTTP ${reply.status}`);
        // The server may return an edit token. Do not read, print or retain it.
        await reply.body?.cancel();
        sent += 1;
        stdout(`Posted to ${request.to}.`);
      } catch {
        fail(`Could not confirm the post to ${request.to}. ${sent} of ${requests.length} posts confirmed. Check the room before retrying; no automatic retry was made. The exact request is printed above.`);
      }
    }
    return 0;
  } catch (error) {
    stderr(error.message);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await run(process.argv.slice(2));
}
