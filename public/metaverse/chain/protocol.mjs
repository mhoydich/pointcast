// The district lab reuses PointCast Chain's BLAKE2b-256 implementation.
// Its local quorum and visit-record format are specific to this sandbox.
import { blake2b, bytesToHex, hexToBytes } from '../../chain/sdk/pointcast-chain.js';

const codec = new TextEncoder();
const domain = 'pointcast/metaverse/visit-lab/v1';
const curve = {name: 'ECDSA', namedCurve: 'P-256'};
const signAlgorithm = {name: 'ECDSA', hash: 'SHA-256'};
const hash = value => bytesToHex(blake2b(codec.encode(JSON.stringify(value))));
const expectedHex = (value, chars) =>
  typeof value === 'string' && value.length === chars && /^[0-9a-f]+$/.test(value);
const publicKeyChars = 130;
const maxBlocks = 256;
const quorum = 2;

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function genesisHash(validatorKeys) {
  return hash([domain, 'genesis', quorum, validatorKeys]);
}

function blockHash(genesis, block) {
  return hash([domain, 'visit', genesis, block.height, block.previous, block.plate]);
}

const message = digest => codec.encode(domain + '/vote/' + digest);

export async function createLab() {
  const pairs = await Promise.all(Array.from({length: 3},
    () => crypto.subtle.generateKey(curve, false, ['sign', 'verify'])));
  const validators = await Promise.all(pairs.map(async pair =>
    bytesToHex(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)))));
  const ledger = {version: domain, validators, genesis: genesisHash(validators), blocks: []};
  return {ledger, pairs};
}

export async function appendVisit(lab, plate, voterIds, plates) {
  const {ledger, pairs} = lab;
  const height = ledger.blocks.length + 1;
  ensure(height <= maxBlocks, 'This lab is full. Export it and start a new session.');
  ensure(plates.includes(plate), 'Choose a district plate.');
  const participants = [...new Set(voterIds)].sort();
  ensure(participants.length >= quorum && participants.every(id => Number.isInteger(id) && id >= 0 && id < 3), 'Two distinct validators must approve a block.');
  const previous = ledger.blocks.at(-1)?.hash ?? ledger.genesis;
  const block = {height, previous, plate};
  block.hash = blockHash(ledger.genesis, block);
  block.votes = await Promise.all(participants.map(async id => ({
    validator: id,
    signature: bytesToHex(new Uint8Array(await crypto.subtle.sign(signAlgorithm, pairs[id].privateKey, message(block.hash))))
  })));
  // Asynchronous signing cannot append onto a head another caller has moved.
  ensure(height === ledger.blocks.length + 1, 'The head changed. Try the visit again.');
  ledger.blocks.push(block);
  return block;
}

export async function verifyLedger(ledger, plates, expectedGenesis = '') {
  ensure(ledger && ledger.version === domain, 'Unrecognized district chain format.');
  const keys = ledger.validators;
  ensure(Array.isArray(keys) && keys.length === 3 && keys.every(k => expectedHex(k, publicKeyChars) && k.startsWith('04')) &&
    new Set(keys).size === 3, 'Invalid genesis validator set.');
  ensure(ledger.genesis === genesisHash(keys), 'Genesis fingerprint mismatch.');
  ensure(!expectedGenesis || expectedGenesis === ledger.genesis, 'This ledger has a different genesis fingerprint.');
  ensure(Array.isArray(ledger.blocks) && ledger.blocks.length <= maxBlocks, 'Invalid block count.');
  const validators = await Promise.all(keys.map(key => crypto.subtle.importKey('raw',
    hexToBytes(key), curve, false, ['verify'])));
  let previous = ledger.genesis;
  for (const [index, block] of ledger.blocks.entries()) {
    const at = 'Block ' + (index + 1);
    ensure(block && block.height === index + 1 && block.previous === previous &&
      plates.includes(block.plate) && block.hash === blockHash(ledger.genesis, block), at + ' has invalid contents or parent.');
    ensure(Array.isArray(block.votes) && block.votes.length >= quorum && block.votes.length <= validators.length, at + ' lacks quorum.');
    const seen = new Set();
    for (const vote of block.votes) {
      const id = vote?.validator;
      ensure(Number.isInteger(id) && validators[id] && !seen.has(id) && expectedHex(vote.signature, 128), at + ' has an invalid vote.');
      seen.add(id);
      ensure(await crypto.subtle.verify(signAlgorithm, validators[id], hexToBytes(vote.signature), message(block.hash)), at + ' has an invalid signature.');
    }
    previous = block.hash;
  }
  return {count: ledger.blocks.length, head: previous, genesis: ledger.genesis};
}

// Separate validator processes use the same domain, digest and signature bytes.
export {domain, curve, signAlgorithm, genesisHash, blockHash, message, maxBlocks};
