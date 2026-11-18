// Local development network, Node 24+. No npm dependencies.
import { DatabaseSync } from 'node:sqlite';
import { execFileSync, fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { domain, genesisHash, blockHash, maxBlocks, verifyLedger } from '../../public/metaverse/chain/protocol.mjs';
import { plates } from './plates.mjs';

process.umask(0o077);
const [command, operand, arg] = process.argv.slice(2);
const directory = resolve(process.env.DISTRICT_DIR || join(homedir(), '.local', 'share', 'pointcast-metaverse-devnet'));
const port = Number(process.env.DISTRICT_PORT || 46170);
const origin = 'http://127.0.0.1:' + port;
const validator = fileURLToPath(new URL('./validator.mjs', import.meta.url));
const genesisFile = () => JSON.parse(readFileSync(join(directory, 'genesis.json'), 'utf8'));

function initialize() {
  mkdirSync(dirname(directory), { recursive: true });
  const stage = mkdtempSync(directory + '.new-');
  try {
    const validators = [0, 1, 2].map(id => execFileSync(process.execPath,
      [validator, 'init', stage, String(id)], { encoding: 'utf8' }));
    const ledger = { version: domain, validators, genesis: genesisHash(validators), blocks: [] };
    writeFileSync(join(stage, 'genesis.json'), JSON.stringify(ledger, null, 2));
    renameSync(stage, directory);
    console.log('Genesis', ledger.genesis);
  } finally { rmSync(stage, { recursive: true, force: true }); }
}

function signer(id) {
  const child = fork(validator, ['run', directory, String(id)], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
  const requests = new Map();
  child.on('message', result => requests.get(result.id)?.(result));
  child.on('error', () => {});
  child.on('exit', () => {
    for (const finish of [...requests.values()]) finish({ error: 'Validator unavailable' });
  });
  return {
    child,
    vote(ledger, plate) {
      if (!child.connected) return Promise.reject(new Error('Validator unavailable'));
      const id = randomUUID();
      return new Promise((resolve, reject) => {
        const finish = result => {
          clearTimeout(timeout);
          requests.delete(id);
          if (result.error) reject(new Error(result.error));
          else resolve(result.vote);
        };
        const timeout = setTimeout(() => finish({ error: 'Validator timed out' }), 8000);
        requests.set(id, finish);
        child.send({ id, ledger, plate }, error => { if (error) finish({ error: error.message }); });
      });
    }
  };
}

async function serve() {
  const genesis = genesisFile();
  await verifyLedger(genesis, plates, genesis.genesis);
  const db = new DatabaseSync(join(directory, 'ledger.sqlite'));
  db.exec('PRAGMA busy_timeout=4000; CREATE TABLE IF NOT EXISTS proposals(height INTEGER PRIMARY KEY, request TEXT UNIQUE NOT NULL, plate TEXT NOT NULL, committed TEXT)');
  const rows = db.prepare('SELECT committed FROM proposals WHERE committed IS NOT NULL ORDER BY height');
  const ledger = () => ({ ...genesis, blocks: rows.all().map(row => JSON.parse(row.committed)) });
  await verifyLedger(ledger(), plates, genesis.genesis);
  const peers = [0, 1, 2].map(signer);
  async function record(plate, request) {
    if (!plates.includes(plate) || typeof request !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(request))
      throw new Error('Use a district plate ID and 1–80 alphanumeric request ID, hyphens or underscores.');
    const seen = db.prepare('SELECT plate,committed FROM proposals WHERE request=?').get(request);
    if (seen && seen.plate !== plate) throw new Error('Request ID already used for another plate');
    if (seen?.committed) return JSON.parse(seen.committed);
    const chain = ledger();
    const previous = chain.blocks.at(-1)?.hash ?? chain.genesis;
    const height = chain.blocks.length + 1;
    if (height > maxBlocks) throw new Error('Ledger is full');
    // Reserve one immutable proposal before requesting signatures. Retries can
    // finish an interrupted write without voting for another hash at this height.
    db.prepare('INSERT OR IGNORE INTO proposals VALUES(?,?,?,NULL)').run(height, request, plate);
    const pending = db.prepare('SELECT * FROM proposals WHERE height=?').get(height);
    if (pending.request !== request) throw new Error('Pending request: retry visit ' + pending.plate + ' ' + pending.request);
    const votes = (await Promise.allSettled(peers.map(peer => peer.vote(chain, plate))))
      .filter(result => result.status === 'fulfilled').map(result => result.value);
    const block = { height, previous, plate, hash: blockHash(chain.genesis, { height, previous, plate }), votes };
    chain.blocks.push(block);
    await verifyLedger(chain, plates, genesis.genesis);
    db.prepare('UPDATE proposals SET committed=? WHERE height=? AND committed IS NULL').run(JSON.stringify(block), height);
    return JSON.parse(db.prepare('SELECT committed FROM proposals WHERE height=?').get(height).committed);
  }

  let queue = Promise.resolve();
  const server = createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      if (req.headers.host !== '127.0.0.1:' + port || req.headers.origin) throw new Error('CLI requests only');
      if (req.method === 'GET' && req.url === '/ledger') return res.end(JSON.stringify(ledger()));
      if (req.method !== 'POST' || req.url !== '/visit' || req.headers['content-type'] !== 'application/json') throw new Error('Unknown request');
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 1024) throw new Error('Request too large');
      }
      const { plate, request } = JSON.parse(body);
      const next = queue.then(() => record(plate, request));
      queue = next.catch(() => {});
      res.end(JSON.stringify(await next));
    } catch (error) { res.statusCode = 400; res.end(JSON.stringify({ error: error.message })); }
  });
  const stop = () => {
    for (const peer of peers) peer.child.kill();
    server.close();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  server.once('error', error => { stop(); console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => {
    console.log('District devnet listening on ' + origin + ' with genesis ' + genesis.genesis);
    const pending = db.prepare('SELECT * FROM proposals WHERE committed IS NULL').get();
    if (pending) console.log('Resume interrupted proposal with visit', pending.plate, pending.request);
  });
}

async function readRemote(path, options) {
  const response = await fetch(origin + path, options);
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Network request failed');
  return json;
}
try {
  if (command === 'init') initialize();
  else if (command === 'start') await serve();
  else if (command === 'visit') console.log(JSON.stringify(await readRemote('/visit', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ plate: operand, request: arg })
  }), null, 2));
  else if (command === 'export') console.log(JSON.stringify(await readRemote('/ledger'), null, 2));
  else if (command === 'verify') {
    const ledger = operand ? JSON.parse(readFileSync(operand, 'utf8')) : await readRemote('/ledger');
    console.log(await verifyLedger(ledger, plates, genesisFile().genesis));
  } else throw new Error('Commands: init | start | visit PLATE REQUEST_ID | export | verify [FILE]');
} catch (error) { console.error(error.message); process.exitCode = 1; }
