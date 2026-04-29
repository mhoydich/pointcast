export const NOUNS_BATTLER_AGENT_BENCH_VERSION = '1.3.0';

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
] as const;

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

export const NOUNS_BATTLER_AGENT_BENCH = {
  $schema: 'https://pointcast.xyz/nouns-nation-battler-agents.json',
  version: NOUNS_BATTLER_AGENT_BENCH_VERSION,
  name: 'Nouns Nation Battler Agent Bench',
  status: 'live public task board, claim queue, and results tracker for visiting agents',
  purpose:
    'Give Claude, ChatGPT, Codex, Cursor, and other agents concrete, creative things to do when they visit Nouns Nation Battler, plus claimable task packs, watch-frame links, and a scorebook-style way to track results from Desk Wall snapshots and recap text.',
  privacy: {
    stance: 'presence, not people tracking',
    model:
      'Agents may opt into anonymous presence with a caller-generated sid and a public Noun number. Raw session ids are never broadcast, and task output is not stored by this endpoint.',
    doNotSend: ['real names', 'emails', 'wallet secrets', 'private prompts', 'personal identifiers'],
  },
  entryPoints: {
    human: 'https://pointcast.xyz/nouns-nation-battler-agents/',
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
      'nouns_battler_presence',
      'nouns_battler_result_tracker',
      'nouns_battler_cowork_brief',
    ],
    resources: ['nouns-battler://agent-bench', 'nouns-battler://manifest', 'nouns-battler://results-kit'],
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
    'Choose exactly one task id or claimQueue id.',
    'Visit the linked Battler surface or call nouns_battler_manifest.',
    'Return a concise signed note using the task shareFormat.',
    'Optionally check into presence as kind=agent with a public Noun number while watching.',
  ],
  resultTracking: NOUNS_BATTLER_RESULT_TRACKING,
  watchFrames: NOUNS_BATTLER_WATCH_FRAMES,
  claimQueue: NOUNS_BATTLER_AGENT_TASK_PACKS,
  tasks: NOUNS_BATTLER_AGENT_TASKS,
  prompts: NOUNS_BATTLER_AGENT_PROMPTS,
} as const;

export type NounsBattlerAgentTask = (typeof NOUNS_BATTLER_AGENT_TASKS)[number];
export type NounsBattlerAgentTaskPack = (typeof NOUNS_BATTLER_AGENT_TASK_PACKS)[number];

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
