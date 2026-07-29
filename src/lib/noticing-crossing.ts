export interface CrossingSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  usedFor: string;
}

export const CROSSING_ISSUE = {
  schema: 'pointcast.noticing-issue/v1',
  id: 'what-i-keep-noticing-03-animal-crossing',
  issue: '03',
  season: 'How we live together',
  desk: 'Study Of',
  format: 'Digital Anthropology · Field study',
  title: 'Animal Crossing is a gift economy',
  shortTitle: 'The nicest town you know has a mortgage attached',
  dek:
    'A town of loans, fruit, furniture, letters, visiting hours, and favors: what Animal Crossing understands about the things money cannot finish.',
  thesis:
    'Animal Crossing is not a gift economy because money disappears. It is a gift economy because money leaves so much unfinished.',
  url: 'https://pointcast.xyz/noticing/animal-crossing-gift-economy',
  jsonUrl: 'https://pointcast.xyz/noticing/animal-crossing-gift-economy.json',
  blockUrl: 'https://pointcast.xyz/b/0523',
  publishedAt: '2026-07-27T21:19:00-07:00',
  readingTime: '11 min',
  altitudes: ['home', 'town', 'network'],
  reportingBoundary:
    'This is an independent editorial study of Animal Crossing: New Horizons, not a Nintendo publication or endorsement. Game mechanics are separated from published player research and PointCast interpretation. Specific features, online requirements, and platform terms can change; player communities are more varied than any one theory of play.',
  credits: {
    director: 'Michael Hoydich',
    writingAndDesign: 'Codex / OpenAI',
    imageSystem: 'OpenAI image generation · poster-image-engine',
    source:
      'Michael Hoydich chat directive, 2026-07-27: continue What I Keep Noticing with Issue 03; make the magazine visual, connective, special, clever, warm, and worth anticipating.',
  },
  images: [
    {
      id: 'town-made-of-favors',
      src: '/images/noticing/animal-crossing-issue-03/town-made-of-favors.webp',
      width: 1536,
      height: 1024,
      alt:
        'A hand-built miniature island town at sunset with a public square, open gate, parcels, peaches, a blue chair, and red thread joining each object',
      caption:
        'Plate 01 · A Town Made of Favors. Price can move an object. A favor gives it a route and a person.',
    },
    {
      id: 'pocket-is-the-economy',
      src: '/images/noticing/animal-crossing-issue-03/pocket-is-the-economy.webp',
      width: 1536,
      height: 1024,
      alt:
        'Two hands exchange a wrapped parcel over a graph-paper grid containing a peach, shell, chair, shirt, watering can, fossil, and brass token',
      caption:
        'Plate 02 · The Pocket Is the Economy. The empty square matters because somebody else may know what belongs there.',
    },
    {
      id: 'gate-makes-a-public',
      src: '/images/noticing/animal-crossing-issue-03/gate-makes-a-public.webp',
      width: 1536,
      height: 1024,
      alt:
        'Two miniature islands at blue hour connected by a ferry, an open garden gate, glowing paths, parcels, and abstract wooden visitors',
      caption:
        'Plate 03 · The Gate Makes a Public. An island becomes a town when another person can arrive.',
    },
  ],
  opening: [
    'A peach on your own island is inventory. A peach carried through somebody else’s gate is a visit, a favor, a joke, an apology, a shortcut, or proof that you remembered.',
    'Animal Crossing: New Horizons contains a shop, a bank-like savings account, fluctuating turnip prices, home loans, labor, scarcity, and a prodigious amount of buying. It is not an escape from markets. It is a market wrapped around a social question: once you can acquire an object, what are you going to do with it?',
    'The game’s most durable answer is to give it away. Mail the shirt. Drop the recipe. Bring the fruit. Water the flowers. Leave a spare chair near the airport. Open the gate and wait through the loading screens because a friend said they needed one thing you happen to have.',
    'The gift does not abolish the price. It changes what the object is for.',
  ],
  economies: [
    {
      id: 'market',
      number: '01',
      label: 'Market',
      proposition: 'Price makes objects comparable.',
      note:
        'Shops, catalogs, loans, and turnip speculation give almost everything a number and keep daily play moving.',
    },
    {
      id: 'debt',
      number: '02',
      label: 'Debt',
      proposition: 'The mortgage gives the day a horizon.',
      note:
        'Home expansion converts collecting into a long project, but the game’s debt does not chase the player with a deadline.',
    },
    {
      id: 'commons',
      number: '03',
      label: 'Commons',
      proposition: 'The museum turns private finding into public memory.',
      note:
        'A caught creature or recovered fossil can be sold once or donated into a collection every resident and visitor can inhabit.',
    },
    {
      id: 'gift',
      number: '04',
      label: 'Gift',
      proposition: 'A useful object becomes a relationship.',
      note:
        'Fruit, recipes, furniture, flowers, and clothing can travel without a negotiated price and return later in another form.',
    },
    {
      id: 'reputation',
      number: '05',
      label: 'Reputation',
      proposition: 'The town remembers how it felt to have you there.',
      note:
        'Player-made rituals—guest books, free piles, tours, celebrations—create the norms the software only partly specifies.',
    },
  ],
  essays: [
    {
      number: '01',
      kicker: 'A mortgage with no clock',
      title: 'The game begins with a bill and immediately makes money strange.',
      paragraphs: [
        'Animal Crossing is often described as gentle because its colors are soft and its neighbors are pleased to see you. The more interesting gentleness is administrative. You receive a large housing debt, but no collector comes to the door. There is no interest meter racing while you sleep, no eviction date, and no failure screen for spending the afternoon arranging flowers instead of earning.',
        'The debt still works. It gives fish, fruit, shells, fossils, and crafted objects a shared destination. It turns wandering into a project and makes the next room imaginable. Yet the absence of punishment changes the emotional meaning of the number. The loan is a horizon, not an emergency.',
        'This is not a model for an actual mortgage. It is a design decision about tempo. The game asks what effort feels like when urgency is removed but progress remains visible. You can be industrious without being afraid.',
        'That distinction makes room for generosity. A system that consumes every object as repayment would leave no spare chair for a friend.',
      ],
    },
    {
      number: '02',
      kicker: 'Price is not meaning',
      title: 'A peach becomes more valuable when it stops being for sale.',
      paragraphs: [
        'Inside one island, a piece of fruit has a shop price, a crafting use, and a place in the pocket. Across islands, it gains biography. Native fruit differs, so a common object in one town can be a useful arrival in another. The gate turns uneven distribution into a reason to visit.',
        'This is the game’s quiet economic trick. Scarcity could produce pure competition. Instead it often produces a message: I have the thing you need. Players wrap objects, stage free piles, mail surprises, host cataloging sessions, water each other’s flowers, and invent rules for exchange that are friendlier—or occasionally harsher—than the software requires.',
        'Anthropologists have spent a century warning that a gift is not simply a free commodity. Giving, receiving, and returning can create bonds, expectations, status, gratitude, and debt. The social relation is not a side effect of the transfer. It is part of what moves.',
        'Animal Crossing miniaturizes that complexity. A digital chair has no nutritional value and almost no marginal cost, yet the right chair arriving from the right person can feel unusually specific. The item says: I noticed your room. I remembered your color. I spent five minutes of my life carrying this toward you.',
      ],
    },
    {
      number: '03',
      kicker: 'The loading screen is a threshold',
      title: 'Visiting is inefficient on purpose, and that may be why it matters.',
      paragraphs: [
        'Nintendo describes New Horizons as a place to invite friends and family, visit other islands, collect fruit, browse shops, admire museums, and gather for coffee. Official support material also makes the limits plain: one shared island per system, bounded resident roles, separate systems and copies for many forms of multiplayer, and an online membership for online features.',
        'Opening a gate is not the same as dropping a file into a group chat. Someone has to announce availability. Someone travels. The host may clean up, set out objects, plan a tour, or wait by the entrance. The software turns exchange into hospitality by giving it a threshold.',
        'Research on player stories found that flexible tasks, socially meaningful activities, rewards for interaction, and the overlap between game-authored and player-authored narratives helped create positive social encounters. Another large survey during the first pandemic year described the game as a site of routine substitution and social connection.',
        'The evidence should not be romanticized. A separate study found little support for the idea that in-game socializing by itself reduced loneliness. A town can host contact without curing isolation. Warm software is still software, and a visit is not the same as care that survives the screen.',
      ],
    },
    {
      number: '04',
      kicker: 'The nicest town is still a platform',
      title: 'A gift economy can live inside a commercial machine.',
      paragraphs: [
        'The island is owned, distributed, updated, and bounded by a company. Its objects are licensed data. Its online doors depend on hardware, accounts, connectivity, memberships, and continuing service. A single console’s shared island can also concentrate unusual power in the first resident. Cozy aesthetics do not dissolve platform governance.',
        'Nor do gifts eliminate markets. Players built sophisticated trading systems, price lists, catalog exchanges, and speculative turnip networks. Economic analysis of the game can easily teach scarcity, arbitrage, substitution, and other market lessons. The same peach can be a commodity at noon and a present at twelve-oh-five.',
        'That coexistence is the useful lesson. Real households, neighborhoods, clubs, and online communities are not pure economies either. We buy dinner and cook for friends. We invoice for work and answer a neighbor’s question for free. We pay taxes and borrow library books. Price, redistribution, obligation, and generosity overlap.',
        'Animal Crossing gives those systems friendly edges and places them in one pocket. The question is not whether the island escapes commerce. The question is why, after all the buying, the memorable part is so often leaving something for someone else.',
      ],
    },
  ],
  evidenceDesk: [
    {
      label: 'Official game structure',
      value:
        'Nintendo describes building, customizing, collecting, and visiting other islands; current support pages specify shared-island and multiplayer limits.',
    },
    {
      label: 'Observed game mechanic',
      value:
        'Objects move through shops, loans, donation, mail, pockets, display, and player-to-player transfer. This essay interprets those mechanics; it is not internal telemetry.',
    },
    {
      label: 'Published player research',
      value:
        'Studies report positive social dynamics, player-authored routines, and pandemic-era connection, while findings on loneliness remain mixed.',
    },
    {
      label: 'Anthropological lens',
      value:
        'Gift exchange is treated as relationship, reciprocity, and obligation—not merely an item priced at zero.',
    },
    {
      label: 'Useful limit',
      value:
        'The town remains commercial software with hardware, account, service, and governance boundaries. One style of generous play cannot represent every player community.',
    },
  ],
  pocketLab: {
    title: 'Pack a pocket',
    note:
      'Choose one ordinary thing, one person, and one reason. The instrument shows how quickly inventory becomes a social sentence.',
    objects: ['native fruit', 'spare chair', 'watering can', 'duplicate fossil'],
    people: ['new neighbor', 'old friend', 'first-time visitor', 'future self'],
    reasons: ['to unblock', 'to celebrate', 'to surprise', 'to remember'],
  },
  townRules: [
    'Keep one empty square in your pocket.',
    'Bring something ordinary from your town.',
    'Ask before taking what is arranged with care.',
    'A price is information, not the whole value.',
    'Leave the gate open long enough for arrival to feel possible.',
    'Return a gift sideways: help someone else.',
    'Make the town easier to enter than it was for you.',
  ],
  closing: [
    'The island is not generous by itself. It supplies the fruit, the pocket, the gate, the mailbox, the museum, the debt, and the little burst of ceremony when an object changes hands. Players decide what those mechanisms mean.',
    'That is why the gift economy is real without being pure. It lives in the margin between what the software prices and what a person notices.',
    'A peach is inventory. Then somebody needs one. A town begins.',
  ],
  next: {
    title: 'How to calendar a life',
    label: 'Published next · Utility · Issue 04',
    dek:
      'The calendar as a humane agreement with your future attention—not a warehouse for other people’s urgency.',
    date: '2026-07-29T10:16:14-07:00',
    dateLabel: 'Published · Jul 29',
    url: '/noticing/how-to-calendar-a-life',
  },
} as const;

export const CROSSING_SOURCES: readonly CrossingSource[] = [
  {
    id: 'S01',
    title: 'Animal Crossing: New Horizons',
    publisher: 'Nintendo',
    url: 'https://www.nintendo.com/us/store/products/animal-crossing-new-horizons-switch/',
    usedFor:
      'Current official description of island building, collecting, shops, museum visits, coffee, and local or online visiting.',
  },
  {
    id: 'S02',
    title: 'Save Data and Multiplayer Support FAQ',
    publisher: 'Nintendo Support',
    url:
      'https://en-americas-support.nintendo.com/app/answers/detail/a_id/48899/~/save-data-and-multiplayer-support-faq-%28animal-crossing%3A-new-horizons%29',
    usedFor:
      'Current shared-island, same-system, local-wireless, online-play, account, and membership boundaries.',
  },
  {
    id: 'S03',
    title: 'How to Start a Local or Online Multiplayer Game',
    publisher: 'Nintendo Support',
    url: 'https://en-americas-support.nintendo.com/app/answers/detail/a_id/49136/',
    usedFor:
      'Current visitor flow and the visibility of player-created names, chat, bulletin posts, and custom designs.',
  },
  {
    id: 'S04',
    title: 'Animal Crossing: New Horizons — Official site',
    publisher: 'Nintendo',
    url: 'https://animalcrossing.nintendo.com/new-horizons/',
    usedFor:
      'Official framing of exploration, crafting, customization, community creation, and sharing an island with friends.',
  },
  {
    id: 'S05',
    title:
      'Players’ Stories and Secrets in Animal Crossing: New Horizons—Exploring Design Factors for Positive Emotions and Social Interactions',
    publisher: 'Proceedings of the ACM on Human-Computer Interaction',
    url: 'https://doi.org/10.1145/3474711',
    usedFor:
      'Survey and interview evidence on positive interactions, flexible tasks, social rewards, and player-generated narratives.',
  },
  {
    id: 'S06',
    title:
      'Coconuts, Custom-Play & COVID-19: Social Isolation, Serious Leisure and Personas in Animal Crossing: New Horizons',
    publisher: 'Persona Studies',
    url: 'https://ojs.deakin.edu.au/index.php/ps/article/view/970',
    usedFor:
      'Nearly 2,000 player responses about routine substitution and social connectivity during pandemic isolation.',
  },
  {
    id: 'S07',
    title: 'New Social Horizons: Anxiety, Isolation, and Animal Crossing During the COVID-19 Pandemic',
    publisher: 'Frontiers in Virtual Reality',
    url:
      'https://www.frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2021.627350/full',
    usedFor:
      'A counterweight to easy wellbeing claims: the study found minimal evidence that in-game socialization alone reduced loneliness.',
  },
  {
    id: 'S08',
    title: 'Designing the Virtual Museum with Animal Crossing: New Horizons',
    publisher: 'Cambridge University Press / Public Humanities',
    url:
      'https://www.cambridge.org/core/journals/public-humanities/article/designing-the-virtual-museum-with-animal-crossing-new-horizons/93606C8166446F088E4B7528694E773B',
    usedFor:
      'The museum as a participatory collection and a bridge between virtual encounter, curiosity, and real cultural institutions.',
  },
  {
    id: 'S09',
    title: 'Gifts',
    publisher: 'Open Encyclopedia of Anthropology',
    url: 'https://www.anthroencyclopedia.com/entry/gifts',
    usedFor:
      'Anthropological context on objects, persons, reciprocity, obligation, status, and the complexity of supposedly free gifts.',
  },
  {
    id: 'S10',
    title: 'Ten Economic Lessons Learned from Animal Crossing During the Lockdown',
    publisher: 'The Journal of Private Enterprise / SSRN',
    url: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6380999',
    usedFor:
      'The counter-reading of Animal Crossing as a useful illustration of markets, scarcity, substitution, and exchange.',
  },
] as const;
