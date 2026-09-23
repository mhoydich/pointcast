/**
 * Campus Cards mint desk, pure half. No Node APIs: the /desk console runs
 * this in the browser and scripts/campus-cards-mint-desk.mjs runs it in Node.
 * Every function takes the series (src/data/campus-cards.json) explicitly.
 */
export const CID = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,})$/;
export const hex = (s) => Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, '0')).join('');

export function cards(SERIES) {
  const out = [];
  let tokenId = 0;
  for (const set of SERIES.sets) {
    const campus = SERIES.campuses.find((c) => c.slug === set.campus);
    for (const card of set.cards) {
      const base = `${String(card.n).padStart(2, '0')}-${card.slug}`;
      out.push({ ...card, tokenId: tokenId++, set, campus, base, svg: `public/images/campus-cards/${set.id}/${base}.svg`, png: `public/images/campus-cards/${set.id}/${base}.png` });
    }
  }
  return out;
}

export function tokenMetadata(SERIES, card, pins) {
  const rarity = SERIES.rarities[card.rarity];
  const img = pins.images?.[card.tokenId] ?? {};
  const svg = img.svg?.cid ? `ipfs://${img.svg.cid}` : `ipfs://PLACEHOLDER_${card.base}.svg`;
  const png = img.png?.cid ? `ipfs://${img.png.cid}` : `ipfs://PLACEHOLDER_${card.base}.png`;
  return {
    name: `Campus Cards · ${card.campus.name} · ${String(card.n).padStart(2, '0')} ${card.title}`,
    description: `${card.flavor} ${card.set.title}, card ${card.n} of ${card.set.cards.length}. ${SERIES.notice}`,
    symbol: SERIES.symbol,
    decimals: 0,
    artifactUri: svg,
    displayUri: png,
    thumbnailUri: png,
    rights: 'CC0-1.0',
    isBooleanAmount: false,
    shouldPreferSymbol: false,
    tags: ['campus-cards', card.set.campus, card.rarity, 'pixel-art', 'pointcast'],
    attributes: [
      { name: 'Set', value: card.set.title },
      { name: 'Campus', value: card.campus.name },
      { name: 'Place', value: card.campus.place },
      { name: 'Card', value: `${String(card.n).padStart(2, '0')}/${String(card.set.cards.length).padStart(2, '0')}` },
      { name: 'Rarity', value: rarity.label },
      { name: 'Edition', value: rarity.cap ? `${rarity.cap} max` : 'open' },
    ],
    formats: [
      { uri: svg, mimeType: 'image/svg+xml', fileName: `${card.base}.svg`, dimensions: { value: '400x560', unit: 'px' } },
      { uri: png, mimeType: 'image/png', fileName: `${card.base}.png`, dimensions: { value: '1200x1680', unit: 'px' } },
    ],
    creators: [SERIES.creator],
    minter: SERIES.creator,
  };
}

export function contractMetadata(SERIES) {
  return {
    name: SERIES.name,
    description: `${SERIES.tagline} ${SERIES.notice}`,
    version: '1.0.0',
    license: { name: SERIES.license },
    homepage: 'https://pointcast.xyz/campus-cards',
    authors: ['PointCast <https://pointcast.xyz>'],
    interfaces: ['TZIP-012', 'TZIP-016', 'TZIP-021'],
  };
}

function annotated(type, value, fields = new Map()) {
  const name = type?.annots?.find((a) => a.startsWith('%'))?.slice(1);
  if (name) fields.set(name, { type, value });
  if (type?.prim === 'pair') {
    if (value?.prim !== 'Pair' || value.args?.length !== 2 || type.args?.length !== 2) throw new Error('Compiled storage shape does not match its type.');
    annotated(type.args[0], value.args[0], fields);
    annotated(type.args[1], value.args[1], fields);
  }
  return fields;
}

export function prepareStorage(SERIES, code, template, pins, { admin, treasury }) {
  const storageType = code.find((i) => i?.prim === 'storage').args[0];
  const storage = structuredClone(template);
  const f = annotated(storageType, storage);
  const need = (name, prim) => {
    const field = f.get(name);
    if (!field || field.type.prim !== prim) throw new Error(`Compiled storage is missing %${name}:${prim}`);
    return field.value;
  };
  need('administrator', 'address').string = admin;
  need('treasury', 'address').string = treasury;
  need('paused', 'bool').prim = 'True';
  const all = cards(SERIES);
  const complete = CID.test(pins.contract?.cid || '') && all.every((c) => CID.test(pins.tokens?.[c.tokenId]?.cid || ''));
  const meta = need('metadata', 'big_map');
  meta[0].args[1].bytes = hex(`ipfs://${pins.contract?.cid || '__CAMPUS_CARDS_CONTRACT_CID__'}`);
  const tokens = need('token_metadata', 'big_map');
  if (tokens.length !== all.length) throw new Error(`Compiled token_metadata has ${tokens.length} entries; series has ${all.length}. Recompile the contract.`);
  for (const entry of tokens) {
    const id = Number(entry.args[0].int);
    const cid = pins.tokens?.[id]?.cid || `__CAMPUS_CARDS_TOKEN_${id}_CID__`;
    entry.args[1].args[1] = [{ prim: 'Elt', args: [{ string: '' }, { bytes: hex(`ipfs://${cid}`) }] }];
  }
  return { storage, storageType, complete };
}


/** Every file the pinning step uploads, in dependency order: images, then token JSON, then contract JSON. */
export function pinPlan(SERIES, pins = {}) {
  const plan = [];
  for (const card of cards(SERIES)) {
    for (const [kind, mimeType] of [['svg', 'image/svg+xml'], ['png', 'image/png']]) {
      plan.push({ key: `images.${card.tokenId}.${kind}`, done: CID.test(pins.images?.[card.tokenId]?.[kind]?.cid || ''), url: '/' + card[kind].replace(/^public\//, ''), mimeType, name: `campus-cards-${card.base}.${kind}` });
    }
  }
  for (const card of cards(SERIES)) plan.push({ key: `tokens.${card.tokenId}`, done: CID.test(pins.tokens?.[card.tokenId]?.cid || ''), json: () => tokenMetadata(SERIES, card, pins), name: `campus-cards-token-${card.tokenId}.json` });
  plan.push({ key: 'contract', done: CID.test(pins.contract?.cid || ''), json: () => contractMetadata(SERIES), name: 'campus-cards-contract.json' });
  return plan;
}

export function pinsComplete(SERIES, pins = {}) {
  return pinPlan(SERIES, pins).every((step) => step.done);
}
