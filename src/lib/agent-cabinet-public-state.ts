import preparedPublication from '../data/agent-cabinet-publication.json';
import committedPublication from '../data/agent-cabinet-verified-publication.json';
import provenance from '../data/agent-cabinet-provenance.json';
import { canonicalJson } from './x402';

const OPERATION_HASH = /^o[1-9A-HJ-NP-Za-km-z]{50}$/u;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export const AGENT_CABINET_COMMITTED_PUBLICATION: unknown = committedPublication;

/** One fail-closed predicate is shared by static discovery and the paid API. */
export function isVerifiedAgentCabinetPublication(value: unknown): boolean {
  const candidate = record(value);
  const publisher = record(candidate?.publisherAuthorization);
  if (!candidate || !publisher
    || candidate.schema !== 'pointcast.agent-cabinet.verified-publication/v1'
    || candidate.status !== 'minted' || candidate.verified !== true
    || candidate.mainnetApproved !== true || candidate.requestable !== true
    || candidate.network !== 'mainnet' || candidate.chainId !== preparedPublication.chainId
    || candidate.contract !== preparedPublication.contract
    || candidate.administrator !== preparedPublication.administrator
    || candidate.inventoryRecipient !== preparedPublication.inventoryRecipient
    || candidate.editionSupply !== preparedPublication.editionSupply
    || candidate.editionsPerObject !== preparedPublication.editionsPerObject
    || canonicalJson(candidate.tokenMap) !== canonicalJson(preparedPublication.tokenMap)
    || canonicalJson(candidate.creatorAuthorization) !== canonicalJson(preparedPublication.creatorAuthorization)
    || typeof candidate.operationHash !== 'string' || !OPERATION_HASH.test(candidate.operationHash)
    || !Number.isSafeInteger(candidate.level) || Number(candidate.level) < 1
    || typeof candidate.verifiedAt !== 'string' || !Number.isFinite(Date.parse(candidate.verifiedAt))
    || publisher.status !== 'approved'
    || publisher.administrator !== preparedPublication.administrator
    || publisher.operationHash !== candidate.operationHash
    || !Array.isArray(candidate.inventoryEvidence)
    || candidate.inventoryEvidence.length !== provenance.items.length) return false;

  const evidence = candidate.inventoryEvidence.map(record);
  return provenance.items.every((item) => evidence.some((entry) => entry
    && entry.slug === item.slug
    && String(entry.tokenId) === String(item.id)
    && entry.metadataSha256 === item.metadataSha256
    && entry.artifactSha256 === item.artifactSha256
    && entry.totalSupply === item.editions
    && entry.inventoryBalance === item.editions
    && Number(entry.confirmations) >= 2));
}

export const AGENT_CABINET_PUBLICATION_LIVE = isVerifiedAgentCabinetPublication(committedPublication);

export function publicationMatchesCommitted(value: unknown, committed: unknown = committedPublication): boolean {
  return isVerifiedAgentCabinetPublication(value)
    && isVerifiedAgentCabinetPublication(committed)
    && canonicalJson(value) === canonicalJson(committed);
}
