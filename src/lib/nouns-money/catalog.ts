/** Stable identifiers refer to artworks, never issued currency or token ownership. */
export const SOURCE_NOTES = Array.from({ length: 100 }, (_, nounId) => {
  const serial = String(nounId).padStart(3, '0');
  const specimenId = `NM27-${String(nounId + 1).padStart(6, '0')}`;
  const file = `Nouns-Money-2027-Noun-${serial}-${specimenId}`;
  return { id: `nm100-${serial}`, nounId, name: `Nouns Money · Noun #${nounId}`, specimenId, image: `/images/nouns-money/nordic-100/${file}.webp`, svg: `/images/nouns-money/nordic-100/${file}.svg` };
});
export const SOURCE_CATALOG = {
  schema: 'pointcast.nouns-money.catalog/v1', mode: 'collectible-art', count: SOURCE_NOTES.length,
  notes: SOURCE_NOTES, provenance: '/images/nouns-money/source-100/provenance.json',
  meaning: 'Collected artwork preferences. No mint, token ownership, money balance, transfer or redemption.',
};
