export const atariBbs = {
  schema: 'pointcast.atari-bbs-museum/v2',
  title: 'Death Star BBS — Atari BBS Museum',
  path: '/atari-bbs',
  researchedAt: '2026-09-29',
  description: 'Mike Hoydich, Overlord, and the Atari 130XE: an original photograph, a remembered community, and a playable tribute to Death Star BBS.',
  primarySource: 'https://hoydich.wordpress.com/2013/09/10/death-star-bbs-1987/',
  facts: [
    { value: '1987', label: 'Launch · Mike’s account' },
    { value: '130XE', label: 'Atari computer' },
    { value: '300', label: 'Baud at launch' },
    { value: 'FoReM', label: 'BBS software' },
  ],
  timeline: [
    { year: '1987', title: 'A board comes online.', text: 'Mike and Frank launch Death Star: Overlord and Freddie, a 130XE, and less than 1 MB of storage.', source: 'https://hoydich.wordpress.com/2013/09/10/death-star-bbs-1987/' },
    { year: '2013', title: 'A post becomes a reunion.', text: 'Mike publishes his recollection and a list of caller handles. Old friends begin finding the thread.', source: 'https://hoydich.wordpress.com/2013/09/10/death-star-bbs-1987/' },
    { year: '2014', title: 'Freddie remembers the games.', text: 'Frank recalls modified FoReM software, 38-column dash, archery, and a simulated conversation.', source: 'https://hoydich.wordpress.com/2013/09/10/death-star-bbs-1987/#comments' },
    { year: '2026', title: 'Another door opens.', text: 'PointCast gathers the story and photographs, builds a new ATASCII tribute, and opens Death Star Computer Club.', source: '/atari-bbs' },
  ],
  sources: [
    { id: '01', title: 'Death Star BBS – 1987', publisher: 'Michael Hoydich · WordPress · September 10, 2013', url: 'https://hoydich.wordpress.com/2013/09/10/death-star-bbs-1987/', note: 'Primary personal account; caller recollections appear in the comments.' },
    { id: '02', title: 'Michael Hoydich’s founder bio', publisher: 'Y Combinator · Think Gaming', url: 'https://www.ycombinator.com/companies/think-gaming', note: 'Also names Deathstar and the 130XE, but gives 1988 and 2400 baud. The detailed WordPress account supplies this exhibit’s launch date and speed; the discrepancy remains unresolved.' },
    { id: '03', title: '130XE: How Atari’s New 8-Bit Does It', publisher: 'Jack Powell · ANTIC · July 1985', url: 'https://www.atarimagazines.com/v4n3/130XE.php', note: 'Contemporary coverage of the 130XE’s 128K RAM and bank switching.' },
    { id: '04', title: 'Atari BBS Connect', publisher: 'Southern Amis · preservation community', url: 'https://www.southernamis.com/ataribbsconnect', note: 'Explore preserved Atari BBS culture, including Alcatraz. External boards are operated independently.' },
  ],
  images: [
    { src: '/images/atari-bbs/bbs-rig.jpg', title: 'Mike’s BBS rig', credit: 'From Michael Hoydich’s personal WordPress archive', source: 'https://hoydich.wordpress.com/2013/09/10/death-star-bbs-1987/', license: 'Personal archive; no open license asserted', note: 'Original archive image; exact photograph date unconfirmed.' },
    { src: '/images/atari-bbs/atari-130xe.jpg', title: 'Atari 130XE', credit: 'Multicherry / Wikimedia Commons', source: 'https://commons.wikimedia.org/wiki/File:Atari_130XE_Reshot.jpg', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', note: '2011 retouched hardware photograph, displayed without further editing. This is a reference specimen, not Mike’s individual computer.' },
    { src: '/images/atari-bbs/atascii.gif', title: 'ATASCII character matrix', credit: 'Kim Slawson; corrections by Dpla-fr / Wikimedia Commons', source: 'https://commons.wikimedia.org/wiki/File:Atascii-character-set-00toFF-2x.gif', license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', note: 'Modern emulator rendering of normal and inverse characters, displayed without editing.' },
  ],
  community: { name: 'Death Star Computer Club', path: '/atari-bbs/club/', api: '/api/atari-club', signIn: '/auth?returnTo=%2Fatari-bbs%2Fclub%2F', membership: 'Voluntary, with a signed-in PointCast account', channels: ['general', 'memories', 'workshop'], artworkCount: 10, artworks: '/atari-bbs/club.json', badges: ['first-carrier', 'first-transmission', 'pixel-builder', 'night-shift'], merchandise: 'Concept images only' },
  terminal: { path: '/atari-bbs/death-star/', display: '40 by 24 ATASCII cells', game: 'Five-arrow archery', handleStorage: 'Browser-local only' },
  recreation: { status: 'New browser tribute', originalSoftwareRecovered: false, networkConnection: false, game: '38-column dash', bestTimeStorage: 'Browser-local only' },
};
