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
  const name = String(params.name).trim();
  if (new TextEncoder().encode(name).length > 64) throw new Error('Name must fit in 64 UTF-8 bytes.');
  if (new TextEncoder().encode(params.bio).length > 512) throw new Error('Bio must fit in 512 UTF-8 bytes.');
  const links = params.links.map(({ label, url }) => JSON.stringify({
    label: String(label || url).trim().slice(0, 80),
    url: String(url).trim(),
  }));
  if (links.some((link) => new TextEncoder().encode(link).length > 256)) throw new Error('Each link label and URL must fit in 256 UTF-8 bytes.');
  return {
    page: {
      bio: utf8ToHex(params.bio),
      links: links.map(utf8ToHex),
      name: utf8ToHex(name),
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
