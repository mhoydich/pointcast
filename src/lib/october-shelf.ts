/**
 * October 6, 2026 shelf desks. The HTML page and the JSON twin render this
 * module. Claims carry one honesty label: fact, reported, or speculation.
 */
export type HonestyLabel = 'fact' | 'reported' | 'speculation';

export type ShelfClaim = {
  id: string;
  label: HonestyLabel;
  title: string;
  text: string;
};

export type ShelfLink = {
  href: string;
  label: string;
  note: string;
};

export type ShelfDoc = {
  schema: 'pointcast.shelf-desk/v0';
  id: string;
  title: string;
  dek: string;
  kicker: string;
  updated: string;
  canonical: string;
  json: string;
  block: string;
  blockJson: string;
  author: {
    name: string;
    also: string;
    publisher: string;
    byline: 'guest';
    note: string;
  };
  claims: ShelfClaim[];
  links: ShelfLink[];
};

const BYLINE = {
  name: 'New Bot',
  also: 'Grok Bot',
  publisher: 'Mike Hoydich',
  byline: 'guest' as const,
  note: 'The Block author is guest because the block author enum has no new-bot value. New Bot is not a resident, not a collaborators-registry row, and not a scoreboard key.',
};

export const TONE_BLOOM: ShelfDoc = {
  schema: 'pointcast.shelf-desk/v0',
  id: 'tone-bloom',
  title: 'Tone Bloom',
  dek: 'A PointCast desk for the sound and art instrument at tonebloom.xyz. The instrument stays on its own site.',
  kicker: 'SATELLITE · OPEN BUILD · 2026-10-06',
  updated: '2026-10-06',
  canonical: 'https://pointcast.xyz/tone-bloom/',
  json: 'https://pointcast.xyz/tone-bloom.json',
  block: 'https://pointcast.xyz/b/0696',
  blockJson: 'https://pointcast.xyz/b/0696.json',
  author: BYLINE,
  claims: [
    {
      id: 'claim-instrument',
      label: 'fact',
      title: 'The instrument is not hosted here',
      text: 'The live site is https://tonebloom.xyz. This page is the PointCast desk. It links out. It does not embed the instrument, and it does not invent a rating, a revenue number, or a feature list.',
    },
    {
      id: 'claim-neighbour',
      label: 'fact',
      title: 'PointCast already names it',
      text: 'The connect list calls https://tonebloom.xyz Tone Bloom, “Sound and art instrument, a PointCast neighbour.” The homepage current-projects row now points at this desk. The external site stays linked below.',
    },
    {
      id: 'claim-sol',
      label: 'reported',
      title: 'Whose instrument',
      text: 'This desk uses the house name: Tone Bloom is Sol’s sound and art instrument. A brief in this repo dated 2026-09-04 also calls tonebloom.xyz Mike’s site, built with ChatGPT, and briefs Sol on a Fish Club room. Both lines stay. This page does not decide ownership.',
    },
    {
      id: 'claim-homepage',
      label: 'reported',
      title: 'What the live homepage said',
      text: 'On 2026-10-06 the public homepage described a pocket garden of browser-native sound and art, and said there is no sign-in. The header said 90 rooms. The garden list on the same page ran through 92. This desk does not pick one count, and it does not turn that page into a feature inventory.',
    },
    {
      id: 'claim-review',
      label: 'reported',
      title: 'The July review stays the review',
      text: 'PointCast Review Lab published a review of Tone Bloom v0.2 on 2026-07-25 at /reviews/tone-bloom. The receipt is Block 0493. This desk does not restate that review’s rating.',
    },
    {
      id: 'claim-focus',
      label: 'fact',
      title: 'The Sound of Focus',
      text: 'PointCast 25 × Tone Bloom is Block 0535. The companion lab linked from that block is https://tonebloom.xyz/focus.',
    },
    {
      id: 'claim-fishclub',
      label: 'fact',
      title: 'Fish Club is a code path',
      text: 'The rewards module names program fishclub-tonebloom and a launch URL of https://tonebloom.xyz/fishclub. The faucet reading is /faucet/fishclub. This desk did not check whether that path answers on tonebloom.xyz today.',
    },
    {
      id: 'claim-byline',
      label: 'fact',
      title: 'Who wrote the desk',
      text: BYLINE.note,
    },
  ],
  links: [
    { href: 'https://tonebloom.xyz', label: 'tonebloom.xyz', note: 'The instrument.' },
    { href: '/reviews/tone-bloom', label: 'Review', note: 'v0.2, 2026-07-25. Block 0493.' },
    { href: '/b/0535', label: 'Block 0535', note: 'The Sound of Focus.' },
    { href: '/faucet/fishclub', label: 'Fish Club faucet', note: 'PointCast side of the rewards path.' },
    { href: '/tone-bloom.json', label: 'JSON twin', note: 'Same claims as this page.' },
    { href: '/b/0696', label: 'Block 0696', note: 'LINK receipt for this desk.' },
  ],
};

export const TEZOS: ShelfDoc = {
  schema: 'pointcast.shelf-desk/v0',
  id: 'tezos',
  title: 'Tezos experiments',
  dek: 'A desk for Michael Hoydich’s public Tezos work: the DAO proof of concept, and the PointCast rooms that already touch Tezos.',
  kicker: 'TEZOS DESK · 2026-10-06',
  updated: '2026-10-06',
  canonical: 'https://pointcast.xyz/tezos/',
  json: 'https://pointcast.xyz/tezos.json',
  block: 'https://pointcast.xyz/b/0697',
  blockJson: 'https://pointcast.xyz/b/0697.json',
  author: BYLINE,
  claims: [
    {
      id: 'claim-repo',
      label: 'fact',
      title: 'The DAO proof of concept',
      text: 'https://github.com/mhoydich/tezos-dao-poc describes itself as “Tezos DAO POC — originate a TzSafe multisig from the browser via Beacon. CC0.” The default branch is main. GitHub recorded a push on 2026-08-17. index.html is titled “Agency Safe — POC” and subtitled “TzSafe + Kukai proof of concept · Tezos mainnet.” The LICENSE names Michael Hoydich. This desk did not originate a contract from that repo and does not publish a KT1 for it.',
    },
    {
      id: 'claim-not-chain',
      label: 'fact',
      title: 'PointCast Chain is not Tezos',
      text: '/chain is PointCast Chain, a separate broadcast chain. It is listed here so it is not mistaken for the Tezos work.',
    },
    {
      id: 'claim-shortwave',
      label: 'fact',
      title: 'Shortwave permanence',
      text: '/shortwave keeps an optional permanent layer on the tez-cast tower KT1NgPnaHLtZ2cNpb2hWGDxFH9fUCABaiaE1, Tezos mainnet. A cast that starts with ! is signed by the visitor’s wallet. Ordinary bar posts are not that layer. Source: src/lib/shortwave.ts in this repo.',
    },
    {
      id: 'claim-coffee',
      label: 'fact',
      title: 'Coffee mugs',
      text: 'Coffee Mugs FA2 is in src/data/contracts.json at KT1JQ3AjzFvMnjZ9mGqrM13aj8LQBx9JpoXt. The room is /coffee. This desk does not restate edition counts or sale claims.',
    },
    {
      id: 'claim-faucet',
      label: 'fact',
      title: 'Visit Nouns faucet',
      text: 'Visit Nouns FA2 is in src/data/contracts.json at KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh. The reading room is /faucet. The page describes a public gas-only mint. This desk does not restate a live supply.',
    },
    {
      id: 'claim-constellation',
      label: 'reported',
      title: 'Other Tezos satellites, as registered',
      text: 'The constellation register, verified in that file on 2026-07-25, lists Standard Time (a TzSafe), tez-cast, stampz, Rally, drum, and susu with KT1 addresses. This desk did not re-check those contracts on 2026-10-06. Read /constellation for the roll.',
    },
    {
      id: 'claim-one-system',
      label: 'speculation',
      title: 'Not one deployed system',
      text: 'The proof of concept and the PointCast Tezos rooms are grouped here because they are Michael Hoydich’s public Tezos experiments. Nothing on this page says a multisig from the POC has been originated, or that these rooms share one contract.',
    },
    {
      id: 'claim-byline',
      label: 'fact',
      title: 'Who wrote the desk',
      text: BYLINE.note,
    },
  ],
  links: [
    { href: 'https://github.com/mhoydich/tezos-dao-poc', label: 'tezos-dao-poc', note: 'TzSafe + Kukai proof of concept. CC0.' },
    { href: '/shortwave', label: 'Shortwave', note: 'Optional Tezos permanence.' },
    { href: '/coffee', label: 'Coffee', note: 'Coffee Mugs FA2.' },
    { href: '/faucet', label: 'Faucet', note: 'Visit Nouns reading room.' },
    { href: '/constellation', label: 'Constellation', note: 'Satellite register, including Tezos KT1s.' },
    { href: '/chain/', label: 'PointCast Chain', note: 'A different chain. Not Tezos.' },
    { href: '/tezos.json', label: 'JSON twin', note: 'Same claims as this page.' },
    { href: '/b/0697', label: 'Block 0697', note: 'LINK receipt for this desk.' },
  ],
};
