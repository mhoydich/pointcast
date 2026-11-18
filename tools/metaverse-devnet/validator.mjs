// A dedicated process per validator. Only this process opens its key and vote journal.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { curve, signAlgorithm, message, blockHash, maxBlocks, verifyLedger } from '../../public/metaverse/chain/protocol.mjs';
import { plates } from './plates.mjs';

const [mode, directory, slot] = process.argv.slice(2);
const id = Number(slot);
if (![0, 1, 2].includes(id)) throw new Error('Invalid validator ID');
const prefix = join(directory, 'validator-' + id);

if (mode === 'init') {
  const pair = await crypto.subtle.generateKey(curve, true, ['sign', 'verify']);
  const privateKey = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
  writeFileSync(prefix + '.key', Buffer.from(privateKey), { flag: 'wx', mode: 0o600 });
  const raw = await crypto.subtle.exportKey('raw', pair.publicKey);
  process.stdout.write(Buffer.from(raw).toString('hex'));
} else if (mode === 'run' && process.send) {
  const genesis = JSON.parse(readFileSync(join(directory, 'genesis.json'), 'utf8'));
  const privateKey = await crypto.subtle.importKey('pkcs8', readFileSync(prefix + '.key'), curve, false, ['sign']);
  const db = new DatabaseSync(prefix + '.sqlite');
  db.exec('PRAGMA busy_timeout=4000; CREATE TABLE IF NOT EXISTS votes(height INTEGER PRIMARY KEY, digest TEXT NOT NULL, signature TEXT NOT NULL)');
  const find = db.prepare('SELECT * FROM votes WHERE height=?');
  const save = db.prepare('INSERT OR IGNORE INTO votes VALUES(?,?,?)');

  async function vote({ ledger, plate }) {
    if (!plates.includes(plate)) throw new Error('Unknown district plate');
    const { count, head } = await verifyLedger(ledger, plates, genesis.genesis);
    if (count >= maxBlocks) throw new Error('Ledger is full');
    const height = count + 1;
    const digest = blockHash(genesis.genesis, { height, previous: head, plate });
    const signature = Buffer.from(await crypto.subtle.sign(signAlgorithm, privateKey, message(digest))).toString('hex');
    // A unique height per pinned validator prevents double signing, including
    // concurrent requests and restarts. A signature leaves only after commit.
    save.run(height, digest, signature);
    const recorded = find.get(height);
    if (recorded.digest !== digest) throw new Error('Conflicting proposal at height ' + height);
    return { validator: id, signature: recorded.signature };
  }
  process.on('message', async request => {
    try { process.send({ id: request.id, vote: await vote(request) }); }
    catch (error) { process.send({ id: request.id, error: error.message }); }
  });
  process.on('disconnect', () => process.exit(0));
} else {
  throw new Error('Use district.mjs to start the network');
}
