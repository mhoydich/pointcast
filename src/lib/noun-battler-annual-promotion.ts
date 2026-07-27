export const NOUN_BATTLER_ANNUAL_CAMPAIGN = {
  id: 'PC-NOUN-BATTLER-ANNUAL-2026',
  label: 'The Battle Record — Noun Battler Annual 2026',
  advertiser: 'PointCast Sports Desk',
  creativeCount: 3,
  placement: 'Opening-week homepage feature and sitewide PointCast contextual rotation',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'A first-party editorial campaign for the free Noun Battler annual. Placement is selected from page context, not visitor behavior; no paid media, odds, wagering, wallet action, or saved league result is involved.',
} as const;

export const NOUN_BATTLER_PROMO_DISPATCHES = [
  {
    id: 'PC-NOUN-BATTLER-ANNUAL-001',
    label: 'Cover story',
    headline: 'The box score became a civilization.',
    copy: 'Three deterministic buttons grew into eight gangs, fourteen league days, sixty Nouns under the lights, and one very long scorebook.',
    shareCopy:
      'Noun Battler did the thing every imaginary sport wants to do: invented a rule, a league, a press box, weather, factions, and one very long scorebook. The Battle Record is its playable magazine history.\n\nhttps://pointcast.xyz/noun-battler-annual',
    href: '/noun-battler-annual',
    cta: 'Read the annual',
    image: '/noun-battler-annual/plates/01-first-box-score.jpg',
    alt: 'The First Box Score editorial plate from The Battle Record.',
    tone: 'signal',
    contexts: ['noun', 'nouns', 'battle', 'battler', 'sport', 'sports', 'history', 'magazine', 'press', 'annual', 'home', 'pointcast'],
  },
  {
    id: 'PC-NOUN-BATTLER-ANNUAL-002',
    label: 'League dispatch',
    headline: 'Thirty aside. Eight gangs. Weather everywhere.',
    copy: 'The Nouns Nation league turned a tiny duel into a 30-v-30 civic spectacle with roles, fields, playoffs, rival desks, and a Nouns Bowl.',
    shareCopy:
      'Thirty Nouns aside. Eight gangs. Fourteen league days. Weather that refuses to stay neutral. PointCast made a sports annual for the browser league that accidentally became an institution.\n\nhttps://pointcast.xyz/noun-battler-annual#league',
    href: '/noun-battler-annual#league',
    cta: 'Scout the eight gangs',
    image: '/noun-battler-annual/plates/02-thirty-against-thirty.jpg',
    alt: 'Thirty Against Thirty stadium plate from The Battle Record.',
    tone: 'play',
    contexts: ['game', 'games', 'league', 'team', 'gang', 'play', 'arcade', 'drum', 'tv', 'field', 'score', 'nouns'],
  },
  {
    id: 'PC-NOUN-BATTLER-ANNUAL-003',
    label: 'Press-box challenge',
    headline: 'Run the tape. Argue with the desk.',
    copy: 'Choose two gangs and a field, then let the annual issue a deterministic quarter-by-quarter projection with a printable box score.',
    shareCopy:
      'The press box is open: pick two Noun Battler gangs, choose the field, and run a deterministic projection. No odds, no wagers, no saved state—just a printable argument with the desk.\n\nhttps://pointcast.xyz/noun-battler-annual#lab',
    href: '/noun-battler-annual#lab',
    cta: 'Run the matchup lab',
    image: '/noun-battler-annual/plates/03-league-remembers.jpg',
    alt: 'The League Remembers archive plate from The Battle Record.',
    tone: 'field',
    contexts: ['agent', 'agents', 'data', 'lab', 'archive', 'scorebook', 'replay', 'report', 'json', 'desk', 'field', 'nouns'],
  },
] as const;

export const NOUN_BATTLER_PROMO_LINKS = {
  canonical: 'https://pointcast.xyz/noun-battler-annual',
  machineEdition: 'https://pointcast.xyz/noun-battler-annual.json',
  shareKit: 'https://pointcast.xyz/noun-battler-annual/share',
  shareKitJson: 'https://pointcast.xyz/noun-battler-annual/share.json',
  pressFiling: 'https://pointcast.xyz/press/noun-battler-annual-publishes-browser-league-history',
  campaignReceipt: 'https://pointcast.xyz/ads.json',
  campaignReport: 'https://pointcast.xyz/ads/report',
} as const;
