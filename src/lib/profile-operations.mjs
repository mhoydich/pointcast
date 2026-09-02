export function utf8ToHex(value) {
  return Array.from(new TextEncoder().encode(String(value ?? '')))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function pagePayload(params) {
  if (!Number.isInteger(params.tokenId) || params.tokenId < 0) throw new Error('Invalid profile token id.');
  if (params.bio.length > 280) throw new Error('Bio must be 280 characters or fewer.');
  if (params.links.length > 8) throw new Error('Add no more than 8 links.');
  if (!Number.isInteger(params.nounSeed) || params.nounSeed < 0 || params.nounSeed >= 1200) throw new Error('Choose a Noun seed from 0–1199.');
  return {
    page: {
      bio: utf8ToHex(params.bio),
      links: params.links.map(({ label, url }) => utf8ToHex(JSON.stringify({
        label: String(label || url).trim().slice(0, 80),
        url: String(url).trim(),
      }))),
      name: utf8ToHex(String(params.name).trim().slice(0, 64)),
      noun_seed: params.nounSeed,
    },
    token_id: params.tokenId,
  };
}

export async function claimProfileHandleWith(params, adapter) {
  const handle = String(params.handle || '').trim().toLowerCase();
  if (!/^[a-z0-9-]{3,24}$/.test(handle)) throw new Error('Use 3–24 lowercase letters, numbers, or hyphens.');
  const address = await adapter.connect();
  const contract = await adapter.at(params.contract);
  const operation = await contract.methodsObject.claim(utf8ToHex(handle)).send({ amount: 0, mutez: true });
  return { address, opHash: operation.opHash, confirmation: operation.confirmation(1) };
}

export async function setProfilePageWith(params, adapter) {
  const payload = pagePayload(params);
  const address = await adapter.connect();
  const contract = await adapter.at(params.contract);
  const operation = await contract.methodsObject.set_page(payload).send({ amount: 0, mutez: true });
  return { address, opHash: operation.opHash, confirmation: operation.confirmation(1) };
}
