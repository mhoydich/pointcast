// Build Taquito origination parameters locally. The caller chooses a network in its own wallet.
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const textBytes = value => Array.from(new TextEncoder().encode(value), b => b.toString(16).padStart(2, '0')).join('');
const integer = value => ({ int: String(value) });
const string = value => ({ string: value });
const bytes = value => ({ bytes: textBytes(value) });
const pair = (a, b) => ({ prim: 'Pair', args: [a, b] });
const entry = (key, value) => ({ prim: 'Elt', args: [key, value] });

async function validAddress(address) {
  if (!/^(tz[1-4]|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) return false;
  let n = 0n;
  for (const c of address) n = n * 58n + BigInt(alphabet.indexOf(c));
  const decoded = [];
  for (; n; n >>= 8n) decoded.unshift(Number(n & 255n));
  if (decoded.length !== 27) return false;
  const payload = new Uint8Array(decoded.slice(0, -4));
  const hash = await crypto.subtle.digest('SHA-256', await crypto.subtle.digest('SHA-256', payload));
  return decoded.slice(-4).every((byte, index) => byte === new Uint8Array(hash)[index]);
}

export async function prepare(code, collection, plates, admin, treasury) {
  if (!await validAddress(admin) || !await validAddress(treasury)) throw new Error('Enter valid Tezos public addresses for both roles.');
  if (plates.length !== 6) throw new Error('All six district metadata files are required.');
  const assetRows = (makeValue) => plates.map((plate, id) => entry(integer(id), makeValue(plate, id)));
  const document = (key, value) => entry(string(key), bytes(JSON.stringify(value)));
  const fields = {
    administrator: string(admin), treasury: string(treasury), ledger: [], operators: [],
    next_token_id: integer(plates.length), paused: {prim: 'True'},
    cards: assetRows(() => pair(integer(0), pair({prim:'False'}, pair(integer(0), string('district'))))),
    supply: assetRows(() => integer(0)),
    metadata: [entry(string(''), bytes('tezos-storage:collection')), document('collection', collection),
      ...plates.map((plate, id) => document('plate-' + id, plate))],
    token_metadata: assetRows((plate, id) => pair(integer(id), [entry(string(''), bytes('tezos-storage:plate-' + id))]))
  };
  function assemble(type) {
    const field = type.annots?.find(label => label.startsWith('%'))?.slice(1);
    if (Object.hasOwn(fields, field)) return fields[field];
    if (type.prim === 'pair') return pair(...type.args.map(assemble));
    throw new Error('Unrecognized contract storage field.');
  }
  const type = code.find(instruction => instruction.prim === 'storage').args[0];
  return { code, init: assemble(type), balance: 0 };
}
