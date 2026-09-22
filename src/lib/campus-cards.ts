/**
 * Campus Cards: place cards for the ten University of California campuses,
 * one set at a time. Unofficial, places only, CC0. The data file is the
 * single source for the contract's Set 01 token metadata, the art
 * generator (scripts/campus-cards-art.mjs), and these pages.
 */
import data from '../data/campus-cards.json';
import contracts from '../data/contracts.json';

export const CAMPUS_CARDS = data;
export const CAMPUS_CARDS_CANONICAL = 'https://pointcast.xyz/campus-cards';
export const CAMPUS_CARDS_CONTRACT = String((contracts as any).campus_cards?.mainnet ?? '');
export const CAMPUS_CARDS_LIVE = CAMPUS_CARDS_CONTRACT.startsWith('KT1');

export type RarityKey = keyof typeof data.rarities;

export type CampusCard = (typeof data.sets)[number]['cards'][number] & {
  tokenId: number;
  setId: string;
  setTitle: string;
  campus: string;
  place: string;
  number: string;
  rarityLabel: string;
  rarityColor: string;
  cap: number;
  priceMutez: number;
  priceTez: string;
  edition: string;
  svg: string;
  png: string;
  url: string;
};

export function tez(mutez: number): string {
  return `${(mutez / 1e6).toLocaleString('en-US', { maximumFractionDigits: 6 })} ꜩ`;
}

// Token ids are assigned in set order: Set 01 cards are 0..11, and later
// sets continue from the contract's next_token_id via add_card.
export const CAMPUS_CARD_LIST: CampusCard[] = (() => {
  let tokenId = 0;
  const out: CampusCard[] = [];
  for (const set of data.sets) {
    const campus = data.campuses.find((c) => c.slug === set.campus)!;
    for (const card of set.cards) {
      const rarity = data.rarities[card.rarity as RarityKey];
      const base = `${String(card.n).padStart(2, '0')}-${card.slug}`;
      out.push({
        ...card,
        tokenId: tokenId++,
        setId: set.id,
        setTitle: set.title,
        campus: campus.name,
        place: campus.place,
        number: `${String(card.n).padStart(2, '0')}/${String(set.cards.length).padStart(2, '0')}`,
        rarityLabel: rarity.label,
        rarityColor: rarity.color,
        cap: rarity.cap,
        priceMutez: rarity.priceMutez,
        priceTez: tez(rarity.priceMutez),
        edition: rarity.cap ? `${rarity.cap} max` : 'open edition',
        svg: `/images/campus-cards/${set.id}/${base}.svg`,
        png: `/images/campus-cards/${set.id}/${base}.png`,
        url: `/campus-cards/${card.slug}`,
      });
    }
  }
  return out;
})();

export function cardPayload(card: CampusCard) {
  return {
    tokenId: card.tokenId,
    title: card.title,
    set: card.setTitle,
    campus: card.campus,
    place: card.place,
    number: card.number,
    rarity: card.rarityLabel,
    edition: card.edition,
    cap: card.cap,
    priceMutez: card.priceMutez,
    flavor: card.flavor,
    image: { svg: `https://pointcast.xyz${card.svg}`, png: `https://pointcast.xyz${card.png}` },
    url: `https://pointcast.xyz${card.url}`,
  };
}

export function seriesPayload() {
  return {
    name: data.name,
    tagline: data.tagline,
    notice: data.notice,
    license: data.license,
    contract: { ...data.contract, address: CAMPUS_CARDS_CONTRACT || null, live: CAMPUS_CARDS_LIVE },
    mint: CAMPUS_CARDS_LIVE
      ? { entrypoint: 'mint', params: '{ token_id: nat, quantity: nat }', amount: 'quantity * card price in mutez', maxPerMint: 10 }
      : null,
    rarities: data.rarities,
    campuses: data.campuses,
    cards: CAMPUS_CARD_LIST.map(cardPayload),
    canonical: CAMPUS_CARDS_CANONICAL,
  };
}
