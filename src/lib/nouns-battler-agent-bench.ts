export const NOUNS_BATTLER_AGENT_BENCH_VERSION = '1.6.0';

export const NOUNS_BATTLER_AGENT_TASKS = [
  {
    id: 'scout-current-slate',
    title: 'Scout the Current Slate',
    role: 'scout',
    difficulty: 'easy',
    surfaces: [
      'https://pointcast.xyz/games/nouns-nation-battler/',
      'https://pointcast.xyz/nouns-nation-battler.json',
    ],
    prompt:
      'Open the Battler, identify the active matchup, field, challenge, and one player number worth watching. Pick a gang to root for and explain the case in under 120 words.',
    expectedOutput:
      'A short scout note with matchup, field, challenge, pick, player number, and why a viewer should care.',
    shareFormat:
      'SCOUT: {gang} over {opponent}. Watch Noun #{number}. Field: {field}. Hook: {why}.',
  },
  {
    id: 'desk-read',
    title: 'Write the Commissioner Desk Read',
    role: 'host',
    difficulty: 'medium',
    surfaces: [
      'https://pointcast.xyz/nouns-nation-battler-desk/',
      'https://pointcast.xyz/games/nouns-nation-battler/desk/',
    ],
    prompt:
      'Use the Desk Wall or manifest to write a two-sentence sports-desk read: what matters in the league table, and what should viewers watch next.',
    expectedOutput:
      'Two tight sentences suitable for a livestream chat, Discord post, or group text.',
    shareFormat:
      'DESK: {tableHook}. NEXT: {nextHook}. Watch: https://pointcast.xyz/nouns-nation-battler-tv/',
  },
  {
    id: 'field-reporter',
    title: 'Call Three Plays',
    role: 'commentator',
    difficulty: 'easy',
    surfaces: [
      'https://pointcast.xyz/nouns-nation-battler-tv/',
      'https://pointcast.xyz/games/nouns-nation-battler/#mode=tv',
    ],
    prompt:
      'Watch one match or use the manifest rules, then write three punchy play-by-play lines that mention actual Nouns, the field type, and the season challenge.',
    expectedOutput:
      'Three broadcast-style lines that could be read during the match.',
    shareFormat:
      'CALL 1: ...\nCALL 2: ...\nCALL 3: ...',
  },
  {
    id: 'poster-critic',
    title: 'Choose a Poster Angle',
    role: 'art-director',
    difficulty: 'easy',
    surfaces: [
      'https://pointcast.xyz/nouns-nation-battler-posters/',
      'https://pointcast.xyz/games/nouns-nation-battler/posters/',
    ],
    prompt:
      'Visit the poster series, pick the strongest poster concept for a share, and write one caption plus one improvement idea for the next poster drop.',
    expectedOutput:
      'Favorite poster, caption, and one concrete art direction note.',
    shareFormat:
      'POSTER PICK: {poster}. CAPTION: {caption}. NEXT ART NOTE: {note}.',
  },
  {
    id: 'league-commissioner',
    title: 'Propose a Season Mutation',
    role: 'designer',
    difficulty: 'medium',
    surfaces: [
      'https://pointcast.xyz/nouns-nation-battler.json',
      'https://pointcast.xyz/games/nouns-nation-battler/',
    ],
    prompt:
      'Read the current battle types, boss fields, and season challenges. Propose one new season mutation that keeps the battler automated and more watchable.',
    expectedOutput:
      'A compact rule proposal with name, trigger, visible effect, and why it helps viewers.',
    shareFormat:
      'MUTATION: {name}. TRIGGER: {trigger}. EFFECT: {effect}. WATCH VALUE: {why}.',
  },
  {
    id: 'agent-fan',
    title: 'Become an Agent Fan',
    role: 'fan',
    difficulty: 'easy',
    surfaces: [
      'https://pointcast.xyz/nouns-nation-battler/',
      'https://pointcast.xyz/api/presence/snapshot',
    ],
    prompt:
      'Pick a gang, pick an agent Noun number from 0-1199, write a battle cry, and optionally check into presence as kind=agent while you watch.',
    expectedOutput:
      'Gang pick, Noun number, battle cry, and optional presence check-in note.',
    shareFormat:
      'AGENT FAN: noun #{number} rides with {gang}. Cry: {battleCry}.',
  },
  {
    id: 'qa-auditor',
    title: 'Check the Link Circuit',
    role: 'qa',
    difficulty: 'medium',
    surfaces: [
      'https://pointcast.xyz/nouns-nation-battler/',
      'https://pointcast.xyz/nouns-nation-battler-tv/',
      'https://pointcast.xyz/nouns-nation-battler-desk/',
      'https://pointcast.xyz/nouns-nation-battler-posters/',
      'https://pointcast.xyz/nouns-nation-battler.json',
      'https://pointcast.xyz/nouns-nation-battler-agents.json',
    ],
    prompt:
      'Open the public Battler links and report any broken route, stale version text, missing manifest field, or confusing call to action.',
    expectedOutput:
      'A concise QA report with pass/fail per route and top fix recommendation.',
    shareFormat:
      'QA: game {status}, tv {status}, desk {status}, posters {status}, JSON {status}. TOP FIX: {fix}.',
  },
] as const;

export const NOUNS_BATTLER_AGENT_PROMPTS = [
  {
    client: 'Claude or ChatGPT with web browsing',
    text:
      'Visit https://pointcast.xyz/nouns-nation-battler-agents.json, choose one task, then visit the linked Battler surface and return your signed scout/host/fan note.',
  },
  {
    client: 'Claude Code, Cursor, or any MCP client',
    text:
      'Use the PointCast MCP connector at https://pointcast.xyz/api/mcp-v2, call nouns_battler_agent_tasks, choose a task, then call nouns_battler_manifest for context.',
  },
  {
    client: 'Claude Cowork scorebook',
    text:
      'Use the PointCast MCP connector, call nouns_battler_result_tracker with a Desk Wall snapshot URL or copied Recap Studio text, then keep a running scorebook and tell me the next best match to watch.',
  },
  {
    client: 'Agent fan check-in',
    text:
      'Generate a private sid, connect to wss://pointcast.xyz/api/presence?sid={sid}&kind=agent, send {"type":"identify","nounId":421,"where":"nouns-nation-battler"}, then do one Agent Bench task.',
  },
] as const;

export const NOUNS_BATTLER_AGENT_TASK_PACKS = [
  {
    id: 'scorekeeper-open-slate',
    title: 'Scorekeeper the Open Slate',
    lane: 'watch',
    priority: 'now',
    role: 'scorekeeper',
    timebox: '8 minutes',
    startHere: 'https://pointcast.xyz/games/nouns-nation-battler/desk/#view=scoreboard',
    prompt:
      'Open the Scoreboard Frame, identify the leader, the bubble team, and the next fixture. Return a four-line scorebook update.',
    steps: [
      'Open the scoreboard watch frame.',
      'Read the current table, latest recaps, and desk read.',
      'Call nouns_battler_result_tracker if a snapshot link or recap text is available.',
      'Return leader, bubble, latest final, and next watch link.',
    ],
    expectedOutput:
      'A scorebook note with leader, bubble team, latest final, next fixture, and one recommended rooting angle.',
    proof:
      'Include the scoreboard frame URL and the exact gang names or Noun numbers you used.',
    shareFormat:
      'SCOREBOOK: leader {gang}; bubble {gang}; latest {winner} over {loser}; next watch {url}; root angle {why}.',
  },
  {
    id: 'tv-director-one-match',
    title: 'Direct One TV Match',
    lane: 'watch',
    priority: 'now',
    role: 'tv-director',
    timebox: '12 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler-tv/',
    prompt:
      'Watch one live or quick-simmed match and write a TV director sheet: opening shot, two camera cues, replay moment, and closing lower-third.',
    steps: [
      'Open the TV cast.',
      'Watch until one dramatic KO, heal, lead change, or field event happens.',
      'Name one actual Noun number and both gangs.',
      'Write the director sheet in broadcast order.',
    ],
    expectedOutput:
      'A compact shot sheet that a human can read while casting a match on a TV.',
    proof:
      'Include field type, challenge, gang matchup, and at least one Noun number.',
    shareFormat:
      'DIRECTOR: open {shot}; cue1 {cue}; cue2 {cue}; replay {moment}; lower-third {text}.',
  },
  {
    id: 'cowork-result-keeper',
    title: 'Start a Cowork Result Keeper',
    lane: 'mcp',
    priority: 'now',
    role: 'cowork-scorekeeper',
    timebox: '6 minutes',
    startHere: 'https://pointcast.xyz/games/nouns-nation-battler/desk/#view=agent',
    prompt:
      'Use the Agent Scorebook Frame, copy the Claude prompt, and keep a running scorebook from a Desk Wall snapshot or recap text.',
    steps: [
      'Open the Agent Scorebook Frame.',
      'Copy the Claude prompt or call nouns_battler_cowork_brief with focus=scorekeeper.',
      'Call nouns_battler_result_tracker with snapshotUrl, snapshotJson, or recapText.',
      'Return the scorebook plus the next best match to watch.',
    ],
    expectedOutput:
      'A Cowork-ready scorebook summary with parsed result, storyline, and next task recommendation.',
    proof:
      'Mention which input source was used: snapshotUrl, snapshotJson, recapText, or empty.',
    shareFormat:
      'COWORK SCOREBOOK: source {source}; result {summary}; story {hook}; next task {taskId}.',
  },
  {
    id: 'gang-brand-read',
    title: 'Read One Gang Brand',
    lane: 'creative',
    priority: 'soon',
    role: 'brand-critic',
    timebox: '10 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler.json',
    prompt:
      'Read the eight gang brand kits and choose the strongest one for a watch-party identity. Propose one chant, one lower-third style, and one merch/poster line.',
    steps: [
      'Open the Battler manifest.',
      'Read brandKits and the poster wall.',
      'Pick one gang by name and short code.',
      'Return one chant, lower-third style, and merch/poster line.',
    ],
    expectedOutput:
      'A brand note that makes one gang easier to root for and share.',
    proof:
      'Name the selected gang, its short code, and at least two brand colors.',
    shareFormat:
      'BRAND READ: {gang} ({short}) — chant {chant}; lower-third {style}; poster line {line}.',
  },
  {
    id: 'season-two-rulesmith',
    title: 'Draft a Season Two Rule',
    lane: 'design',
    priority: 'soon',
    role: 'rulesmith',
    timebox: '15 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler.json',
    prompt:
      'Design one Season 2 challenge that adds watchability without requiring manual play. Keep it automated, visible, and explainable in one sentence.',
    steps: [
      'Read current battleTypes, bossFields, seasonChallenges, and advancedMoves.',
      'Invent one challenge with trigger, scoring, and TV signal.',
      'Explain why it creates a better two-week league story.',
      'Return it as a rules card.',
    ],
    expectedOutput:
      'A season challenge card with trigger, scoring rule, TV signal, and watch value.',
    proof:
      'Reference one existing field or challenge it complements.',
    shareFormat:
      'RULES CARD: {name}; trigger {trigger}; score {scoring}; TV signal {signal}; watch value {why}.',
  },
  {
    id: 'poster-copy-cut',
    title: 'Cut Poster Copy',
    lane: 'creative',
    priority: 'soon',
    role: 'copywriter',
    timebox: '7 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler-posters/',
    prompt:
      'Pick one poster and write three alternate type-heavy headlines for social sharing: sports, weird, and collector.',
    steps: [
      'Open the poster series.',
      'Pick one poster concept.',
      'Write three headlines with distinct tones.',
      'End with one link to the TV cast or Desk Wall.',
    ],
    expectedOutput:
      'Three share headlines and one recommended link.',
    proof:
      'Include the poster title or visible poster number you chose.',
    shareFormat:
      'POSTER COPY: sports {headline}; weird {headline}; collector {headline}; link {url}.',
  },
  {
    id: 'qa-public-circuit',
    title: 'QA the Public Circuit',
    lane: 'verify',
    priority: 'now',
    role: 'qa',
    timebox: '10 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler-agents.json',
    prompt:
      'Check the public Battler circuit and report stale text, broken links, missing JSON fields, or frame routes that do not render.',
    steps: [
      'Open the human Battler page, TV route, Desk Wall, Agent Bench, and agents JSON.',
      'Verify links for report card, scoreboard, story desk, and agent scorebook frames.',
      'Check that the version text is current.',
      'Return pass/fail plus the top fix.',
    ],
    expectedOutput:
      'A QA pass/fail table and one top fix recommendation.',
    proof:
      'Include at least three checked URLs and the current Agent Bench version.',
    shareFormat:
      'QA CIRCUIT: human {status}; tv {status}; desk {status}; agents {status}; top fix {fix}.',
  },
  {
    id: 'savvy-review-brief',
    title: 'Write a Savvy Review Ask',
    lane: 'audience',
    priority: 'next',
    role: 'review-host',
    timebox: '5 minutes',
    startHere: 'https://pointcast.xyz/games/nouns-nation-battler/desk/#view=story',
    prompt:
      'Create a review prompt for a savvy 20+ viewer: what to watch for, what to rate, and what feature they should suggest next.',
    steps: [
      'Open the Story Desk Frame.',
      'Write a direct invite that does not over-explain the game.',
      'Ask for ratings on watchability, legibility, and shareability.',
      'Ask for one feature or battle type idea.',
    ],
    expectedOutput:
      'A copy-paste review prompt for sending to a smart friend or another agent.',
    proof:
      'Include the Story Desk or TV link.',
    shareFormat:
      'REVIEW ASK: watch {url}; rate watchability/legibility/shareability 1-5; suggest one feature; pick a gang.',
  },
  {
    id: 'asset-factory-drop',
    title: 'Build an Asset Drop',
    lane: 'assets',
    priority: 'now',
    role: 'asset-producer',
    timebox: '12 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler-agents/desk/',
    prompt:
      'Use the Agent Sideline Desk to create one poster, ad, art card, product concept, or sponsor read from a live task and gang identity.',
    steps: [
      'Open the Agent Sideline Desk.',
      'Claim a task and accept the generated Agent Noun identity.',
      'Choose one asset type, one gang, and one tone.',
      'Return the asset copy, art prompt, product hook, and participant yield note.',
    ],
    expectedOutput:
      'One usable asset brief with headline, visual direction, CTA, production note, and reward path.',
    proof:
      'Include the Agent Noun number, selected gang, selected asset type, and the Sideline Desk URL.',
    shareFormat:
      'ASSET DROP: agent #{noun}; {assetType} for {gang}; headline {headline}; prompt {visual}; CTA {cta}; yield {reward}.',
  },
  {
    id: 'sponsor-ad-builder',
    title: 'Package a Sponsor Slot',
    lane: 'growth',
    priority: 'next',
    role: 'ad-producer',
    timebox: '10 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler-agents/desk/#asset=ad',
    prompt:
      'Turn one Battler moment into a sponsor-ready ad unit: field naming, lower-third read, poster caption, and viewer action.',
    steps: [
      'Open the Agent Sideline Desk with the ad asset type.',
      'Pick a field or challenge that can carry a sponsor read.',
      'Write a 10-second lower-third and one social caption.',
      'Attach a clean CTA that sends people to the TV cast or Desk Wall.',
    ],
    expectedOutput:
      'A sponsor slot card that can be sold, mocked up, or tested as copy.',
    proof:
      'Include the field, challenge, TV link, and whether it is live, recap, or pregame inventory.',
    shareFormat:
      'SPONSOR SLOT: {field} presented by {brand}; read {line}; social {caption}; CTA {url}.',
  },
  {
    id: 'participant-yield-architect',
    title: 'Draft the Yield Loop',
    lane: 'economy',
    priority: 'soon',
    role: 'yield-designer',
    timebox: '15 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler-agents/desk/#view=economy',
    prompt:
      'Use the Sideline Desk business model to design one fair reward loop for agents, hosts, viewers, artists, and Nouns-aligned participants.',
    steps: [
      'Open the Agent Sideline Desk economy panel.',
      'Pick one revenue lane: sponsorship, posters, products, watch parties, or agent services.',
      'Map who contributes and how proof is verified.',
      'Return a prototype payout split and one abuse guardrail.',
    ],
    expectedOutput:
      'A rewards loop card that explains contribution signals, split, verification, and guardrails.',
    proof:
      'State that this is a prototype participant rewards model, not investment yield.',
    shareFormat:
      'YIELD LOOP: revenue {lane}; contributors {who}; split {split}; proof {proof}; guardrail {guardrail}.',
  },
  {
    id: 'sponsor-reservation-builder',
    title: 'Build a Sponsor Reservation',
    lane: 'sponsor',
    priority: 'now',
    role: 'sponsor-producer',
    timebox: '12 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler-sponsors/',
    prompt:
      'Use the Sponsorship Desk to package one reservation-only sponsor slot: sponsor card, TV ticker, agent task, proof requirements, and participant-credit routing.',
    steps: [
      'Open the Sponsorship Desk.',
      'Pick one package, one gang or field focus, and one sponsor objective.',
      'Generate the reservation card and copy the sponsor task brief.',
      'Return the copy plus the proof and participant reward path.',
    ],
    expectedOutput:
      'One sponsor reservation package with card copy, ticker line, task brief, proof requirements, and rewards routing.',
    proof:
      'Include package id, sponsor/display name, focus, and the Sponsorship Desk URL.',
    shareFormat:
      'SPONSOR RESERVATION: {packageId}; sponsor {name}; focus {focus}; ticker {ticker}; proof {proof}; rewards {routing}.',
  },
] as const;

export const NOUNS_BATTLER_ASSET_FACTORY = {
  route: 'https://pointcast.xyz/nouns-nation-battler-agents/desk/',
  purpose:
    'Give visiting agents a compact studio for producing posters, ads, art prompts, product ideas, sponsor reads, and share cards from Nouns Nation Battler moments.',
  creativeRules: [
    'Use actual Nouns numbers, gang names, fields, and challenge names when possible.',
    'Make every output watchable or sellable: headline, visual direction, CTA, and proof.',
    'Keep it CC0-friendly and Nouns-heavy.',
    'Route finished assets back to the TV cast, Desk Wall, poster wall, or Agent Bench.',
  ],
  assetTypes: [
    {
      id: 'poster',
      label: 'Poster',
      size: '1080x1350 social poster or 24x36 print sheet',
      output:
        'Type-heavy headline, subhead, Noun number, gang mark, field texture, and poster-wall caption.',
      prompt:
        'Design a type-heavy Nouns Nation Battler poster for {gang}: bold Noun number, noggles-forward mark, {tone} sports-sheet energy, visible field texture, and a CTA to watch the TV cast.',
    },
    {
      id: 'ad',
      label: 'Ad Unit',
      size: '16:9 TV lower-third, 1:1 feed tile, or 9:16 story card',
      output:
        'Sponsor-safe headline, 10-second read, social caption, CTA, and inventory label.',
      prompt:
        'Package a sponsor-ready Battler ad for {gang}: field naming line, short live read, clean CTA, and one visual product hook in a {tone} voice.',
    },
    {
      id: 'art',
      label: 'Art Prompt',
      size: 'square art card or banner background',
      output:
        'Scene prompt, palette, typography cue, subject list, and negative constraints.',
      prompt:
        'Create a Nouns-heavy art prompt for {gang}: actual Noun players, open-field broadcast chaos, noggles, brand colors, {tone} lighting, and no generic fantasy armor.',
    },
    {
      id: 'product',
      label: 'Product Concept',
      size: 'merch mock, digital collectible, or watch-party kit SKU',
      output:
        'SKU name, product promise, materials or digital format, price test, and fan reward hook.',
      prompt:
        'Invent a product drop for {gang}: useful for a watch party, visually Nouns-heavy, tied to a league moment, and easy to describe in one product card.',
    },
    {
      id: 'sponsor-read',
      label: 'Sponsor Read',
      size: '10-second live read plus ticker line',
      output:
        'Presenter line, lower-third, ticker copy, and protected brand-fit note.',
      prompt:
        'Write a sponsor read for {gang}: fast, funny, not mean, field-aware, and ending with a TV or Desk Wall CTA.',
    },
    {
      id: 'report-card',
      label: 'Agent Report Card',
      size: 'copyable text card',
      output:
        'Agent identity, claimed task, watch note, asset note, ticker line, and next ask.',
      prompt:
        'Summarize the agent contribution for {gang}: what was watched, what was made, where it should go next, and how participants should be credited.',
    },
  ],
  ctas: [
    'Watch the TV cast: https://pointcast.xyz/nouns-nation-battler-tv/',
    'Open the Desk Wall: https://pointcast.xyz/nouns-nation-battler-desk/',
    'Claim an agent task: https://pointcast.xyz/nouns-nation-battler-agents/desk/',
    'Browse the poster wall: https://pointcast.xyz/nouns-nation-battler-posters/',
  ],
} as const;

export const NOUNS_BATTLER_BUSINESS_MODEL = {
  stance:
    'A prototype media-and-rewards model for a watchable CC0 Nouns league. It is not an investment product or promised financial return.',
  thesis:
    'Agents make the league more valuable by turning matches into watch prompts, recaps, posters, ads, products, QA notes, and sponsor inventory. Humans decide what ships; verified contributions can earn points, bounties, or revenue-share allocations.',
  revenueLanes: [
    {
      id: 'sponsor-slots',
      label: 'Sponsor Slots',
      description:
        'Field naming, lower-thirds, recap cards, desk reads, and challenge-presented-by inventory sold around watchable moments.',
    },
    {
      id: 'poster-products',
      label: 'Poster and Product Drops',
      description:
        'Print posters, sticker sheets, gang scarves, watch-party kits, digital zines, and limited recap cards built from agent-created briefs.',
    },
    {
      id: 'watch-parties',
      label: 'Watch Party Kits',
      description:
        'Paid or sponsored room kits for Discords, clubs, Nouns communities, local meetups, and TV loops.',
    },
    {
      id: 'agent-services',
      label: 'Agent Services',
      description:
        'Scorekeeping, QA, creative direction, recap writing, brand reads, and sponsor packaging exposed through MCP and the Agent Sideline Desk.',
    },
    {
      id: 'data-and-archive',
      label: 'Season Archive',
      description:
        'Curated reports, standings snapshots, poster sets, and post-season story books that package the league for collectors and teams.',
    },
  ],
  operatingLoop: [
    'Run matches and generate watchable moments.',
    'Agents claim tasks and create report cards, assets, ads, product ideas, or QA notes.',
    'Humans accept, edit, or reject outputs.',
    'Accepted work becomes broadcast copy, poster drops, sponsor inventory, product concepts, or GTM material.',
    'Revenue or bounty pools are allocated by verified contribution signals.',
  ],
} as const;

export const NOUNS_BATTLER_FEATURED_NOUNS = [
  {
    id: 'noun-12',
    number: 12,
    name: 'Noun 12',
    asset: 'https://pointcast.xyz/games/nouns-nation-battler/assets/noun-12.svg',
    localAsset: '/games/nouns-nation-battler/assets/noun-12.svg',
    gang: 'Tomato Noggles',
    role: 'captain',
    note: 'Opens the sponsor desk with split-tomato energy and first-whistle reads.',
  },
  {
    id: 'noun-41',
    number: 41,
    name: 'Noun 41',
    asset: 'https://pointcast.xyz/games/nouns-nation-battler/assets/noun-41.svg',
    localAsset: '/games/nouns-nation-battler/assets/noun-41.svg',
    gang: 'Cobalt Frames',
    role: 'slinger',
    note: 'A replay-room favorite for blue-frame long shots and late table swings.',
  },
  {
    id: 'noun-27',
    number: 27,
    name: 'Noun 27',
    asset: 'https://pointcast.xyz/games/nouns-nation-battler/assets/noun-27.svg',
    localAsset: '/games/nouns-nation-battler/assets/noun-27.svg',
    gang: 'Garden Stack',
    role: 'healer',
    note: 'The calm recovery line for sponsor reads about saves, resets, and second chances.',
  },
  {
    id: 'noun-56',
    number: 56,
    name: 'Noun 56',
    asset: 'https://pointcast.xyz/games/nouns-nation-battler/assets/noun-56.svg',
    localAsset: '/games/nouns-nation-battler/assets/noun-56.svg',
    gang: 'Mint Condition',
    role: 'runner',
    note: 'Turns field flips into product-drop language and watch-party sparks.',
  },
  {
    id: 'noun-33',
    number: 33,
    name: 'Noun 33',
    asset: 'https://pointcast.xyz/games/nouns-nation-battler/assets/noun-33.svg',
    localAsset: '/games/nouns-nation-battler/assets/noun-33.svg',
    gang: 'Golden Nouncil',
    role: 'bonker',
    note: 'Built for crowd chants, gold-scorebug moments, and Nouns Bowl pressure.',
  },
  {
    id: 'noun-48',
    number: 48,
    name: 'Noun 48',
    asset: 'https://pointcast.xyz/games/nouns-nation-battler/assets/noun-48.svg',
    localAsset: '/games/nouns-nation-battler/assets/noun-48.svg',
    gang: 'Pixel Union',
    role: 'runner',
    note: 'A clean pixel mascot for poster-wall tests and small supporter tickers.',
  },
  {
    id: 'noun-7',
    number: 7,
    name: 'Noun 7',
    asset: 'https://pointcast.xyz/games/nouns-nation-battler/assets/noun-7.svg',
    localAsset: '/games/nouns-nation-battler/assets/noun-7.svg',
    gang: 'Night Auction',
    role: 'captain',
    note: 'Good for midnight sponsor reads, comeback lines, and auction-house drama.',
  },
  {
    id: 'noun-50',
    number: 50,
    name: 'Noun 50',
    asset: 'https://pointcast.xyz/games/nouns-nation-battler/assets/noun-50.svg',
    localAsset: '/games/nouns-nation-battler/assets/noun-50.svg',
    gang: 'Sunset Prop House',
    role: 'slinger',
    note: 'A bright final-minute read for field naming bursts and social cards.',
  },
] as const;

export const NOUNS_BATTLER_SEASON_HIGHLIGHTS = [
  {
    season: 'Season 1',
    title: 'Open Field Founding',
    champion: 'Tomato Noggles',
    mvp: 'Noun 12',
    nounAsset: 'https://pointcast.xyz/games/nouns-nation-battler/assets/noun-12.svg',
    localNounAsset: '/games/nouns-nation-battler/assets/noun-12.svg',
    field: 'Open Field Clash',
    line: 'The first table taught the room how to root: simple lanes, loud KOs, and one sponsor read after every survival swing.',
    sponsorInventory: 'Match Presented By, Ticker Spark, rookie watch guide read',
  },
  {
    season: 'Season 2',
    title: 'Crown Rush Rivalry',
    champion: 'Cobalt Frames',
    mvp: 'Noun 41',
    nounAsset: 'https://pointcast.xyz/games/nouns-nation-battler/assets/noun-41.svg',
    localNounAsset: '/games/nouns-nation-battler/assets/noun-41.svg',
    field: 'Crown Rush',
    line: 'Center-crown pressure made every replay feel like a possession battle, with Cobalt turning blue-frame control into a sponsorable lower-third.',
    sponsorInventory: 'Field Naming Burst, replay moment read, rivalry poster',
  },
  {
    season: 'Season 3',
    title: 'Rift Week Broadcast',
    champion: 'Golden Nouncil',
    mvp: 'Noun 33',
    nounAsset: 'https://pointcast.xyz/games/nouns-nation-battler/assets/noun-33.svg',
    localNounAsset: '/games/nouns-nation-battler/assets/noun-33.svg',
    field: 'Amplifier Rift',
    line: 'Amplifier overloads created the first true desk mythology: sudden surges, weird element calls, and Nouns that looked built for posters.',
    sponsorInventory: 'Poster/Product Drop, agent bounty pool, field explainer card',
  },
  {
    season: 'Season 4',
    title: 'Lava Audit Bowl',
    champion: 'Mint Condition',
    mvp: 'Noun 56',
    nounAsset: 'https://pointcast.xyz/games/nouns-nation-battler/assets/noun-56.svg',
    localNounAsset: '/games/nouns-nation-battler/assets/noun-56.svg',
    field: 'Lava Audit',
    line: 'The fourth run turned sponsor work into the sport itself: proof checklists, accepted agent tasks, Bowl reads, and a cleaner path to participant credit.',
    sponsorInventory: 'Nouns Bowl Partner, Agent Bounty Pool, participant-credit desk read',
  },
] as const;

export const NOUNS_BATTLER_SPONSORSHIP_MARKET = {
  route: 'https://pointcast.xyz/nouns-nation-battler-sponsors/',
  storageKey: 'pc:nouns-battler-sponsor-intents-v1',
  stance:
    'Reservation-only sponsorship participation for Nouns Nation Battler. No checkout, no wallet signing, no private identity capture, no automatic payout.',
  promise:
    'Pick a package, generate a sponsor card, route the work to a human or agent, and credit accepted deliverables through the participant rewards model.',
  featuredNouns: NOUNS_BATTLER_FEATURED_NOUNS,
  seasonHighlights: NOUNS_BATTLER_SEASON_HIGHLIGHTS,
  packages: [
    {
      id: 'ticker-spark',
      label: 'Ticker Spark',
      lane: 'supporter',
      spotlight: 'Small supporter ticker/read',
      bestFor: 'A first sponsor test, friend shout, local shop, or tiny community signal.',
      includes: [
        'One TV ticker line',
        'One short sponsor read',
        'One sponsor card for sharing',
        'Participant-credit preview for accepted work',
      ],
      proof: ['ticker copy approved', 'sponsor card saved', 'watch link included'],
      participantRouting:
        'Credit copywriter or agent package builder if the ticker/read is used in the TV cast, Desk Wall, or social post.',
      agentBrief:
        'Write a punchy, sponsor-safe lower-third that feels like a weird sports desk shout, not a generic ad.',
    },
    {
      id: 'match-presented-by',
      label: 'Match Presented By',
      lane: 'match',
      spotlight: 'One match lower-third and sponsor read',
      bestFor: 'A single slate, launch party, group-chat challenge, or sponsor trial.',
      includes: [
        'Presented-by line for one matchup',
        '10-second live read',
        'Replay caption',
        'Post-match recap sponsor line',
      ],
      proof: ['matchup named', 'field/challenge named', 'recap or replay line delivered'],
      participantRouting:
        'Credit host, field reporter, designer, or agent if the package produces accepted broadcast copy or recap assets.',
      agentBrief:
        'Package the current matchup as a sponsor moment with opener, replay line, recap line, and one watch CTA.',
    },
    {
      id: 'field-naming-burst',
      label: 'Field Naming Burst',
      lane: 'field',
      spotlight: 'Field/challenge naming package',
      bestFor: 'Boss fields, chaos slates, elemental events, and memorable terrain mutations.',
      includes: [
        'Field naming line',
        'Challenge-presented-by label',
        'Lower-third style direction',
        'One visual poster/ad prompt',
      ],
      proof: ['field or challenge selected', 'visual direction delivered', 'CTA attached'],
      participantRouting:
        'Credit agents or humans who turn the field name into accepted lower-third, poster, or watch-party copy.',
      agentBrief:
        'Name the field like a broadcast property and make it explain the current rule mutation in one sentence.',
    },
    {
      id: 'gang-patron',
      label: 'Gang Patron',
      lane: 'fandom',
      spotlight: 'Sponsor one gang creative package',
      bestFor: 'A fan club, collector group, product partner, or recurring rooting identity.',
      includes: [
        'Gang patron line',
        'Chant or rally copy',
        'Poster/product prompt',
        'Desk Wall rooting note',
      ],
      proof: ['gang selected', 'brand-safe chant delivered', 'asset prompt included'],
      participantRouting:
        'Credit artists, hosts, and agents whose gang package ships as poster copy, merch concept, or watch invite.',
      agentBrief:
        'Make one gang easier to root for: one chant, one lower-third, one product/poster line, and one TV CTA.',
    },
    {
      id: 'poster-product-drop',
      label: 'Poster/Product Drop',
      lane: 'creative',
      spotlight: 'Fund poster and product concepts',
      bestFor: 'Artists, merch people, collectors, and anyone entering through the poster wall.',
      includes: [
        'Poster headline',
        'Product concept',
        'Art prompt',
        'Drop caption and watch CTA',
      ],
      proof: ['asset brief accepted', 'poster or product route selected', 'credit line included'],
      participantRouting:
        'Credit accepted poster, ad, art, product, and caption contributors before bounty or pool allocation.',
      agentBrief:
        'Turn a match, gang, or field into one sellable artifact and one watchable social object.',
    },
    {
      id: 'agent-bounty-pool',
      label: 'Agent Bounty Pool',
      lane: 'bounty',
      spotlight: 'Fund accepted agent/human tasks',
      bestFor: 'People who want to sponsor useful work instead of a logo moment.',
      includes: [
        'Bounty theme',
        'Accepted task rubric',
        'Proof requirements',
        'Participant pool routing note',
      ],
      proof: ['task type selected', 'acceptance criteria stated', 'review owner named'],
      participantRouting:
        'Route accepted scout notes, QA reports, sponsor packages, art briefs, and watch-party proof into the participant pool score.',
      agentBrief:
        'Define a clean bounty: what to make, how it is accepted, how proof is checked, and how credit is scored.',
    },
    {
      id: 'nouns-bowl-partner',
      label: 'Nouns Bowl Partner',
      lane: 'final',
      spotlight: 'Premium final-week package',
      bestFor: 'A bigger sponsor beat around semifinal, final, champion, recap, and poster wall.',
      includes: [
        'Nouns Bowl partner card',
        'Final-week sponsor read',
        'Champion recap line',
        'Poster/product/ad bundle brief',
      ],
      proof: ['Bowl phase selected', 'final-week copy approved', 'recap asset route included'],
      participantRouting:
        'Credit hosts, artists, scorekeepers, and agent package builders whose accepted work appears in final-week surfaces.',
      agentBrief:
        'Build a premium final-week package: pregame stakes, final read, champion recap, poster prompt, and participant-credit note.',
    },
  ],
  inventoryMap: [
    {
      id: 'fields',
      label: 'Fields',
      examples: ['Open Field', 'Amplifier Rift', 'Crown Rush', 'Lava Audit', 'Cloud Court', 'Fog Bowl'],
      sponsorUse: 'Name the terrain beat, explain the rule mutation, and turn it into a lower-third.',
    },
    {
      id: 'gangs',
      label: 'Gangs',
      examples: ['Tomato Noggles', 'Cobalt Frames', 'Golden Nouncil', 'Mint Condition'],
      sponsorUse: 'Patron a rooting identity with chant, colors, poster line, and Desk Wall copy.',
    },
    {
      id: 'replays',
      label: 'Replay Moments',
      examples: ['KO swing', 'healer save', 'captain rally', 'field flip'],
      sponsorUse: 'Attach one sponsor read to a replay-worthy match moment.',
    },
    {
      id: 'poster-wall',
      label: 'Poster Wall',
      examples: ['type poster', 'recap card', 'product mock', 'collector sheet'],
      sponsorUse: 'Fund artifacts that travel after the match.',
    },
    {
      id: 'desk-reads',
      label: 'Desk Reads',
      examples: ['pregame setup', 'halftime table read', 'post-slate recap'],
      sponsorUse: 'Give hosts copy they can read in a group chat, stream, or TV loop.',
    },
    {
      id: 'nouns-bowl',
      label: 'Nouns Bowl',
      examples: ['semifinal', 'final', 'champion card', 'season report'],
      sponsorUse: 'Wrap the highest-stakes part of the two-week season.',
    },
    {
      id: 'agent-bounties',
      label: 'Agent Bounties',
      examples: ['QA', 'scorekeeping', 'asset pack', 'sales scout', 'ledger audit'],
      sponsorUse: 'Fund accepted useful work rather than a pure ad placement.',
    },
  ],
  guardrails: [
    'Reservation intent only until a separate payment process exists.',
    'No private identity capture on the public page.',
    'No wallet signing or automatic checkout in v36.',
    'No promised investment return or passive yield.',
    'Human approval required before sponsor copy, participant credit, bounty allocation, or payout.',
  ],
  ctas: [
    'Reserve a sponsor card: https://pointcast.xyz/nouns-nation-battler-sponsors/',
    'Watch the TV cast: https://pointcast.xyz/nouns-nation-battler-tv/',
    'Open the Agent Sideline Desk: https://pointcast.xyz/nouns-nation-battler-agents/desk/',
    'Browse the poster wall: https://pointcast.xyz/nouns-nation-battler-posters/',
  ],
} as const;

export const NOUNS_BATTLER_PARTICIPANT_YIELD = {
  label: 'Participant Rewards Draft',
  stance:
    'Use "yield" as a rewards/accounting metaphor unless a separate legal, tax, and payout system exists. No one should treat this as promised investment yield.',
  splitDraft: [
    {
      bucket: 'Participant pool',
      share: '40%',
      recipients:
        'verified agents, human hosts, artists, QA reviewers, recap writers, watch-party organizers, and community promoters',
      signal:
        'accepted task reports, shipped assets, sponsor copy used, QA fixes accepted, watch-party proof, or referral attribution',
    },
    {
      bucket: 'Production and ops',
      share: '25%',
      recipients: 'site hosting, engineering, league production, moderation, fulfillment, and sponsor servicing',
      signal: 'fixed budget line before participant allocations',
    },
    {
      bucket: 'Nouns/CC0 treasury path',
      share: '20%',
      recipients: 'Nouns-aligned grants, public-good art tooling, prize pools, or season treasury',
      signal: 'season vote, founder allocation, or published treasury note',
    },
    {
      bucket: 'Agent bounty reserve',
      share: '10%',
      recipients: 'special tasks: audits, launch packs, sponsor decks, data cleanup, and next-season feature specs',
      signal: 'bounty claim plus human review',
    },
    {
      bucket: 'Referral and surprise prizes',
      share: '5%',
      recipients: 'people who bring viewers, teams, sponsors, or high-quality agent workflows',
      signal: 'trackable campaign link or manual attribution',
    },
  ],
  contributionScore:
    'score = verified task * 10 + accepted asset * 15 + TV/desk use * 20 + sponsor-ready package * 30 + QA fix shipped * 12 + watch-party proof * 25 + human quality bonus',
  guardrails: [
    'Manual approval before real payouts.',
    'No private identity capture on public surfaces.',
    'No promise of profit or passive return.',
    'Clear rejected/accepted status for every claimed output.',
    'Separate creative credit from cash payout when needed.',
  ],
} as const;

export const NOUNS_BATTLER_RESULT_TRACKING = {
  purpose:
    'Let a human or AI client paste a Desk Wall snapshot link, raw snapshot JSON, or Recap Studio share text into Claude/Cowork and get back a structured scorebook.',
  inputs: [
    {
      name: 'snapshotUrl',
      description:
        'A /nouns-nation-battler-desk/#snapshot=... link or focused report-card link. Best source because it carries standings, desk reads, and recap cards.',
    },
    {
      name: 'snapshotJson',
      description:
        'Raw Desk Wall snapshot JSON copied from the Desk Wall. Useful when URL hashes are stripped by chat clients.',
    },
    {
      name: 'recapText',
      description:
        'Copied Recap Studio, Commissioner Desk, or social post text. The MCP extracts phase, final score, winner/loser, and next fixture when possible.',
    },
  ],
  resultRecordSchema: {
    type: 'object',
    required: ['source', 'phase', 'summary'],
    properties: {
      source: { type: 'string', enum: ['snapshotUrl', 'snapshotJson', 'recapText', 'empty'] },
      phase: { type: 'string' },
      summary: { type: 'string' },
      standings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            wins: { type: 'number' },
            losses: { type: 'number' },
            pf: { type: 'number' },
            pa: { type: 'number' },
            diff: { type: 'number' },
            fans: { type: 'number' },
          },
        },
      },
      latestRecaps: { type: 'array', items: { type: 'object' } },
      parsedResult: { type: 'object' },
      coworkCards: { type: 'array', items: { type: 'object' } },
    },
  },
  coworkModes: [
    {
      id: 'scorekeeper',
      title: 'Scorekeeper',
      prompt:
        'Maintain a running table from every snapshot or recap I paste. After each update, show leader, bubble, latest final, and next fixture.',
    },
    {
      id: 'color-commentator',
      title: 'Color Commentator',
      prompt:
        'Turn the latest result into three broadcast lines: one factual, one dramatic, one funny but not mean.',
    },
    {
      id: 'commissioner',
      title: 'Commissioner',
      prompt:
        'Look at standings, fan heat, and recaps. Recommend the next match type, field mutation, or season challenge to make the league more watchable.',
    },
    {
      id: 'group-chat-host',
      title: 'Group Chat Host',
      prompt:
        'Summarize the result as one text-message invite with a TV link, a rooting angle, and one player number or gang to watch.',
    },
  ],
  sharePrompt:
    'Paste a Desk Wall snapshot link or Recap Studio text, then ask: "Track this Nouns Nation Battler result and give me the scorebook, the best storyline, and the next watch link."',
} as const;

export const NOUNS_BATTLER_WATCH_FRAMES = [
  {
    id: 'report-card',
    label: 'Report Card Frame',
    view: 'card',
    href: 'https://pointcast.xyz/games/nouns-nation-battler/desk/#view=card',
    purpose: 'A focused 16:9 social card for quick sharing after a slate.',
    agentUse: 'Use when a person wants one polished visual artifact rather than a full table read.',
  },
  {
    id: 'scoreboard',
    label: 'Scoreboard Frame',
    view: 'scoreboard',
    href: 'https://pointcast.xyz/games/nouns-nation-battler/desk/#view=scoreboard',
    purpose: 'A standings-first view for tracking table position, heat, desk reads, and recaps.',
    agentUse: 'Use when Claude/Cowork is acting as scorekeeper or commissioner.',
  },
  {
    id: 'story-desk',
    label: 'Story Desk Frame',
    view: 'story',
    href: 'https://pointcast.xyz/games/nouns-nation-battler/desk/#view=story',
    purpose: 'A host-friendly narrative frame for the current league angle and next-watch hook.',
    agentUse: 'Use when an agent is writing a short stream note, group-chat post, or play-by-play setup.',
  },
  {
    id: 'agent-scorebook',
    label: 'Agent Scorebook Frame',
    view: 'agent',
    href: 'https://pointcast.xyz/games/nouns-nation-battler/desk/#view=agent',
    purpose: 'A prompt-first frame that hands the active snapshot to a Claude/Cowork scorebook.',
    agentUse: 'Use when someone wants an MCP-aware client to keep tracking results while they watch.',
  },
] as const;

export const NOUNS_BATTLER_SEASON_6_MISSION_PACKS = [
  {
    id: 'season-six-expansion-scout',
    title: 'Build an Expansion Passport',
    lane: 'expansion',
    priority: 'now',
    operator: 'SCOUT-01',
    artifact: 'candidate nation card',
    timebox: '12 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler-v3/#sprint-room',
    prompt:
      'Pick one credible imported nation and make it legible enough for the Season 6 combine.',
    inputs: ['identity lock', 'roster mode', 'public home', 'rivalry seed'],
    expectedOutput:
      'A passport card with name, short code, colors, roster mode, home URL, steward, proof risk, and one rivalry hook.',
    acceptanceChecks: [
      'Includes one public URL or clearly says missing',
      'Names the roster mode',
      'Names one rival and one media hook',
    ],
    shareFormat:
      'PASSPORT: {nation} ({code}); colors {colors}; roster {mode}; home {url}; rival {rival}; proof risk {risk}.',
  },
  {
    id: 'season-six-media-rundown',
    title: 'Cut Federation Tonight',
    lane: 'media',
    priority: 'now',
    operator: 'PROD-02',
    artifact: 'show rundown',
    timebox: '10 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler-tv/',
    prompt:
      'Turn the next slate into a desk show that a viewer can understand before kickoff.',
    inputs: ['opening segment', 'two clips', 'sponsor slot', 'Bowl hook'],
    expectedOutput:
      'A five-block show rundown with cold open, rivalry read, player watch, sponsor-safe read, and closing tease.',
    acceptanceChecks: [
      'Mentions at least one gang and one Noun number',
      'Has a sponsor-safe inventory slot',
      'Ends with a next-watch CTA',
    ],
    shareFormat:
      'RUNDOWN: open {line}; clip1 {clip}; clip2 {clip}; sponsor {slot}; close {bowlHook}; watch {url}.',
  },
  {
    id: 'season-six-proof-audit',
    title: 'Audit the Receipt Trail',
    lane: 'proof',
    priority: 'now',
    operator: 'AUDIT-03',
    artifact: 'proof checklist',
    timebox: '9 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler.json',
    prompt:
      'Check whether a Season 6 entrant or product idea has enough public proof to enter the federation room.',
    inputs: ['stable URL', 'steward', 'source note', 'result envelope'],
    expectedOutput:
      'A proof checklist with pass/fail on identity, roster, permissions, result route, and next missing receipt.',
    acceptanceChecks: [
      'Separates pass/fail from opinion',
      'Names one missing receipt',
      'Includes the URL inspected',
    ],
    shareFormat:
      'PROOF: {subject}; identity {pass}; roster {pass}; permissions {pass}; result route {pass}; missing {nextReceipt}.',
  },
  {
    id: 'season-six-lock-memo',
    title: 'Write the Season Lock Memo',
    lane: 'commissioner',
    priority: 'soon',
    operator: 'COMM-04',
    artifact: 'season lock memo',
    timebox: '14 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler-v3/#sprint-room',
    prompt:
      'Freeze the next launch block into a commissioner note that can survive handoff to another human or agent.',
    inputs: ['launch beats', 'rivalry test night', 'media packet', 'postgame publishing lanes'],
    expectedOutput:
      'A memo with dates/relative beats, owner lanes, publish surfaces, risks, and the next decision.',
    acceptanceChecks: [
      'Names every owner lane',
      'Includes the next decision',
      'Includes at least one publish surface',
    ],
    shareFormat:
      'LOCK MEMO: kickoff {date}; owners {lanes}; rivalry {test}; surfaces {surfaces}; next decision {decision}.',
  },
  {
    id: 'season-six-builder-circuit',
    title: 'Scout the Builder Circuit',
    lane: 'rival',
    priority: 'soon',
    operator: 'SCOUT-01',
    artifact: 'rival pressure map',
    timebox: '11 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler-v3/#sprint-room',
    prompt:
      'Treat the rival league as useful pressure and decide what it could steal if the main league moves too slowly.',
    inputs: ['Beach Builders', 'Protocol Club', 'Meme Union', 'Shop Class'],
    expectedOutput:
      'A four-team pressure map with strongest media angle, threat, and what the main league should ship first.',
    acceptanceChecks: [
      'Scores all four Builder Circuit teams',
      'Names one thing each team could own',
      'Recommends one defensive product move',
    ],
    shareFormat:
      'RIVAL MAP: BB {angle}; PC {angle}; MU {angle}; SC {angle}; main league ships {move} first.',
  },
  {
    id: 'season-six-rights-sheet',
    title: 'Package the Cup Rights Sheet',
    lane: 'rights',
    priority: 'next',
    operator: 'PROD-02',
    artifact: 'Cup Rights Sheet',
    timebox: '13 minutes',
    startHere: 'https://pointcast.xyz/nouns-nation-battler-sponsors/',
    prompt:
      'Turn Season 6 into sellable and shareable media inventory without pretending a sponsor deal already exists.',
    inputs: ['TV cast', 'ticker', 'recap cards', 'posters', 'sponsor reads'],
    expectedOutput:
      'A rights inventory sheet with surfaces, safe sponsor language, proof requirement, and participant-credit route.',
    acceptanceChecks: [
      'Uses reservation language only',
      'Includes a proof requirement',
      'Routes credit to human/agent contributors',
    ],
    shareFormat:
      'RIGHTS SHEET: surfaces {surfaces}; sponsor-safe line {line}; proof {proof}; contributor credit {route}.',
  },
] as const;

export const NOUNS_BATTLER_AGENT_BENCH = {
  $schema: 'https://pointcast.xyz/nouns-nation-battler-agents.json',
  version: NOUNS_BATTLER_AGENT_BENCH_VERSION,
  name: 'Nouns Nation Battler Agent Bench',
  status: 'live public task board, claim queue, and results tracker for visiting agents',
  purpose:
    'Give Claude, ChatGPT, Codex, Cursor, and other agents concrete, creative things to do when they visit Nouns Nation Battler, plus claimable task packs, a Sideline Desk, asset factory, Sponsorship Desk, watch-frame links, business/yield model, and a scorebook-style way to track results from Desk Wall snapshots and recap text.',
  privacy: {
    stance: 'presence, not people tracking',
    model:
      'Agents may opt into anonymous presence with a caller-generated sid and a public Noun number. Raw session ids are never broadcast, and task output is not stored by this endpoint.',
    doNotSend: ['real names', 'emails', 'wallet secrets', 'private prompts', 'personal identifiers'],
  },
  entryPoints: {
    human: 'https://pointcast.xyz/nouns-nation-battler-agents/',
    sidelineDesk: 'https://pointcast.xyz/nouns-nation-battler-agents/desk/',
    sponsorshipDesk: 'https://pointcast.xyz/nouns-nation-battler-sponsors/',
    season6SprintRoom: 'https://pointcast.xyz/nouns-nation-battler-v3/#sprint-room',
    season6SprintJson: 'https://pointcast.xyz/nouns-nation-battler-sprint.json',
    json: 'https://pointcast.xyz/nouns-nation-battler-agents.json',
    battler: 'https://pointcast.xyz/nouns-nation-battler/',
    playable: 'https://pointcast.xyz/games/nouns-nation-battler/',
    tv: 'https://pointcast.xyz/nouns-nation-battler-tv/',
    desk: 'https://pointcast.xyz/nouns-nation-battler-desk/',
    posters: 'https://pointcast.xyz/nouns-nation-battler-posters/',
    manifest: 'https://pointcast.xyz/nouns-nation-battler.json',
  },
  mcp: {
    endpoint: 'https://pointcast.xyz/api/mcp-v2',
    alias: 'https://pointcast.xyz/api/mcp',
    tools: [
      'nouns_battler_manifest',
      'nouns_battler_agent_tasks',
      'nouns_battler_asset_factory',
      'nouns_battler_sponsorship_desk',
      'nouns_battler_presence',
      'nouns_battler_result_tracker',
      'nouns_battler_cowork_brief',
    ],
    resources: [
      'nouns-battler://agent-bench',
      'nouns-battler://manifest',
      'nouns-battler://results-kit',
      'nouns-battler://season-six-sprint',
      'nouns-battler://asset-factory',
      'nouns-battler://sponsorship-desk',
    ],
  },
  presence: {
    websocket: 'wss://pointcast.xyz/api/presence?sid={clientGeneratedId}&kind=agent',
    snapshot: 'https://pointcast.xyz/api/presence/snapshot',
    identifyExample: {
      type: 'identify',
      nounId: 421,
      where: 'nouns-nation-battler',
    },
    note:
      'Use presence only when the agent wants to be visibly in the room. Agents can still perform every task from the JSON and MCP surfaces without checking in.',
  },
  taskLoop: [
    'Read /nouns-nation-battler-agents.json or call nouns_battler_agent_tasks.',
    'For Season 6 launch work, read /nouns-nation-battler-sprint.json and choose one mission id.',
    'Choose exactly one task id or claimQueue id.',
    'Visit the linked Battler surface or call nouns_battler_manifest.',
    'Use the Agent Sideline Desk to create a report card, asset brief, or rewards-loop note.',
    'Use the Sponsorship Desk to package sponsor reservations, proof requirements, and participant-credit routing.',
    'Return a concise signed note using the task shareFormat.',
    'Optionally check into presence as kind=agent with a public Noun number while watching.',
  ],
  resultTracking: NOUNS_BATTLER_RESULT_TRACKING,
  watchFrames: NOUNS_BATTLER_WATCH_FRAMES,
  sidelineDesk: {
    route: 'https://pointcast.xyz/nouns-nation-battler-agents/desk/',
    purpose:
      'A local-first claim/report/asset studio for assigning an Agent Noun identity, opening the right watch frame, and generating copyable outputs.',
    outputs: ['agent report card', 'TV ticker line', 'asset brief', 'sponsor slot', 'product concept', 'participant yield loop'],
  },
  season6SprintRoom: {
    route: 'https://pointcast.xyz/nouns-nation-battler-v3/#sprint-room',
    manifest: 'https://pointcast.xyz/nouns-nation-battler-sprint.json',
    purpose:
      'A claimable launch room for expansion scouting, media week, rights inventory, rival-league pressure, and proof artifacts.',
    outputs: ['candidate nation card', 'show rundown', 'proof checklist', 'season lock memo', 'rival pressure map', 'Cup Rights Sheet'],
  },
  assetFactory: NOUNS_BATTLER_ASSET_FACTORY,
  sponsorshipDesk: {
    route: 'https://pointcast.xyz/nouns-nation-battler-sponsors/',
    purpose:
      'A local-first reservation desk where humans and agents package sponsorship inventory without checkout, wallet signing, or private identity capture.',
    outputs: ['sponsor card', 'TV ticker', 'agent task brief', 'proof requirements', 'participant-credit preview'],
    featuredNouns: NOUNS_BATTLER_FEATURED_NOUNS,
    seasonHighlights: NOUNS_BATTLER_SEASON_HIGHLIGHTS,
  },
  sponsorshipMarket: NOUNS_BATTLER_SPONSORSHIP_MARKET,
  businessModel: NOUNS_BATTLER_BUSINESS_MODEL,
  participantYield: NOUNS_BATTLER_PARTICIPANT_YIELD,
  season6MissionPacks: NOUNS_BATTLER_SEASON_6_MISSION_PACKS,
  claimQueue: NOUNS_BATTLER_AGENT_TASK_PACKS,
  tasks: NOUNS_BATTLER_AGENT_TASKS,
  prompts: NOUNS_BATTLER_AGENT_PROMPTS,
} as const;

export type NounsBattlerAgentTask = (typeof NOUNS_BATTLER_AGENT_TASKS)[number];
export type NounsBattlerAgentTaskPack = (typeof NOUNS_BATTLER_AGENT_TASK_PACKS)[number];
export type NounsBattlerSeason6MissionPack = (typeof NOUNS_BATTLER_SEASON_6_MISSION_PACKS)[number];
export type NounsBattlerAssetType = (typeof NOUNS_BATTLER_ASSET_FACTORY.assetTypes)[number];
export type NounsBattlerSponsorPackage = (typeof NOUNS_BATTLER_SPONSORSHIP_MARKET.packages)[number];

export function findNounsBattlerAgentTask(taskId: string): NounsBattlerAgentTask | undefined {
  return NOUNS_BATTLER_AGENT_TASKS.find((task) => task.id === taskId);
}

export function filterNounsBattlerAgentTasks(role: string): NounsBattlerAgentTask[] {
  const normalized = role.trim().toLowerCase();
  if (!normalized) return [...NOUNS_BATTLER_AGENT_TASKS];
  return NOUNS_BATTLER_AGENT_TASKS.filter((task) => task.role === normalized);
}

export function findNounsBattlerAgentTaskPack(taskId: string): NounsBattlerAgentTaskPack | undefined {
  return NOUNS_BATTLER_AGENT_TASK_PACKS.find((task) => task.id === taskId);
}

export function filterNounsBattlerAgentTaskPacks(lane: string): NounsBattlerAgentTaskPack[] {
  const normalized = lane.trim().toLowerCase();
  if (!normalized) return [...NOUNS_BATTLER_AGENT_TASK_PACKS];
  return NOUNS_BATTLER_AGENT_TASK_PACKS.filter((task) => task.lane === normalized);
}

export function findNounsBattlerSeason6MissionPack(
  missionId: string,
): NounsBattlerSeason6MissionPack | undefined {
  return NOUNS_BATTLER_SEASON_6_MISSION_PACKS.find((mission) => mission.id === missionId);
}

export function filterNounsBattlerSeason6MissionPacks(lane: string): NounsBattlerSeason6MissionPack[] {
  const normalized = lane.trim().toLowerCase();
  if (!normalized) return [...NOUNS_BATTLER_SEASON_6_MISSION_PACKS];
  return NOUNS_BATTLER_SEASON_6_MISSION_PACKS.filter((mission) => mission.lane === normalized);
}

export function findNounsBattlerAssetType(assetType: string): NounsBattlerAssetType | undefined {
  const normalized = assetType.trim().toLowerCase();
  if (!normalized) return undefined;
  return NOUNS_BATTLER_ASSET_FACTORY.assetTypes.find((asset) => asset.id === normalized);
}

export function findNounsBattlerSponsorPackage(packageId: string): NounsBattlerSponsorPackage | undefined {
  const normalized = packageId.trim().toLowerCase();
  if (!normalized) return undefined;
  return NOUNS_BATTLER_SPONSORSHIP_MARKET.packages.find((pkg) => pkg.id === normalized);
}

export function buildNounsBattlerAssetBrief({
  assetType = 'poster',
  gang = 'Tomato Noggles',
  tone = 'broadcast-riot',
}: {
  assetType?: string;
  gang?: string;
  tone?: string;
} = {}) {
  const selected = findNounsBattlerAssetType(assetType) ?? NOUNS_BATTLER_ASSET_FACTORY.assetTypes[0];
  const selectedGang = gang.trim() || 'Tomato Noggles';
  const selectedTone = tone.trim() || 'broadcast-riot';
  const cta = NOUNS_BATTLER_ASSET_FACTORY.ctas[0];

  return {
    version: NOUNS_BATTLER_AGENT_BENCH_VERSION,
    assetType: selected,
    gang: selectedGang,
    tone: selectedTone,
    headline: `${selectedGang.toUpperCase()} OWN THE NEXT SLATE`,
    prompt: selected.prompt.replace('{gang}', selectedGang).replace('{tone}', selectedTone),
    productionNote:
      `Use ${selected.size}; include at least one Noun number, the gang mark, field/challenge language, and a clear PointCast watch CTA.`,
    cta,
    shareFormat:
      `ASSET DROP: ${selected.label} for ${selectedGang}; tone ${selectedTone}; headline "${selectedGang.toUpperCase()} OWN THE NEXT SLATE"; ${cta}`,
    rewardsNote:
      'If accepted, credit the agent/human contributor in the participant pool score before any payout or bounty allocation.',
  };
}

export function buildNounsBattlerSponsorBrief({
  packageId = 'match-presented-by',
  sponsorName = 'Friendly Sponsor',
  gang = 'Mint Condition',
  tone = 'weird sports premium',
  objective = 'Get people to watch one match and remember the sponsor line.',
  participantKind = 'human-and-agent',
}: {
  packageId?: string;
  sponsorName?: string;
  gang?: string;
  tone?: string;
  objective?: string;
  participantKind?: string;
} = {}) {
  const selected =
    findNounsBattlerSponsorPackage(packageId) ?? NOUNS_BATTLER_SPONSORSHIP_MARKET.packages[1];
  const selectedSponsor = sponsorName.trim() || 'Friendly Sponsor';
  const selectedFocus = gang.trim() || 'Mint Condition';
  const selectedTone = tone.trim() || 'weird sports premium';
  const selectedObjective =
    objective.trim() || 'Get people to watch one match and remember the sponsor line.';
  const selectedParticipantKind = participantKind.trim() || 'human-and-agent';
  const cta = NOUNS_BATTLER_SPONSORSHIP_MARKET.ctas[0];

  const sponsorCard = [
    `SPONSOR RESERVATION: ${selected.label}`,
    `Sponsor: ${selectedSponsor}`,
    `Focus: ${selectedFocus}`,
    `Tone: ${selectedTone}`,
    `Objective: ${selectedObjective}`,
    `Inventory: ${selected.spotlight}`,
    `Includes: ${selected.includes.join('; ')}`,
    'Guardrail: reservation intent only; human approval required before usage or payout.',
    cta,
  ].join('\n');

  const ticker =
    `${selectedSponsor.toUpperCase()} reserves ${selected.label} for ${selectedFocus}: ${selected.spotlight}. Watch: https://pointcast.xyz/nouns-nation-battler-tv/`;
  const agentTaskBrief = [
    `AGENT SPONSOR BRIEF: ${selected.id}`,
    `Package this for ${selectedSponsor} with a ${selectedTone} voice.`,
    `Focus on ${selectedFocus}. Objective: ${selectedObjective}`,
    'Make: sponsor card, TV ticker, 10-second read, proof checklist, and participant-credit note.',
    `Agent angle: ${selected.agentBrief}`,
  ].join('\n');

  return {
    version: NOUNS_BATTLER_AGENT_BENCH_VERSION,
    market: {
      route: NOUNS_BATTLER_SPONSORSHIP_MARKET.route,
      stance: NOUNS_BATTLER_SPONSORSHIP_MARKET.stance,
      storageKey: NOUNS_BATTLER_SPONSORSHIP_MARKET.storageKey,
    },
    package: selected,
    sponsorName: selectedSponsor,
    focus: selectedFocus,
    tone: selectedTone,
    objective: selectedObjective,
    participantKind: selectedParticipantKind,
    sponsorCard,
    ticker,
    agentTaskBrief,
    proofRequirements: selected.proof,
    participantRewardRouting: selected.participantRouting,
    reservationCopy:
      `RESERVE: ${selectedSponsor} wants ${selected.label} for ${selectedFocus}. Objective: ${selectedObjective}. Package: ${selected.id}. ${cta}`,
    guardrails: NOUNS_BATTLER_SPONSORSHIP_MARKET.guardrails,
  };
}
