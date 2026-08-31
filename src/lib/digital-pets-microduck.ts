export const MICRODUCK_META = {
  schema: 'pointcast.future-book-companion/v1',
  id: 'future-book-001-companion-05',
  companionNumber: 5,
  fieldReportNumber: 1,
  blockId: '0579',
  title: 'The First Computer That Can Waddle',
  subtitle: 'Microduck, physical AI, and programming behavior with agents',
  route: '/digital-pets/microduck',
  jsonRoute: '/digital-pets/microduck.json',
  publishedAt: '2026-08-31T16:10:00-07:00',
  readingTime: '14 min',
  status: 'public-spec review of a pre-release product',
  description:
    'A full review of Microduck, its open software stack, how to program learned behavior with AI agents, and the consumer arc from apps to abilities.',
} as const;

export const MICRODUCK_SPECS = [
  { label: 'Body', value: '25 × 14 cm', note: 'Under 800 g; articulated legs, head, neck, and grasping beak.' },
  { label: 'Motion', value: '15 DoF', note: 'Neural policies run through a 50 Hz onboard control loop.' },
  { label: 'Compute', value: 'RK3566', note: 'Rockchip processor with AI accelerator, 1 GB RAM, and 32 GB storage.' },
  { label: 'Vision', value: 'Camera + ToF', note: 'Front camera and compact 8 × 8 time-of-flight depth matrix.' },
  { label: 'Orientation', value: '2 IMUs', note: 'One in the body and one in the head.' },
  { label: 'Interaction', value: 'Mic / speaker / NFC', note: 'Two NFC antennas and a generated voice unique to each unit.' },
  { label: 'Radios', value: 'Wi-Fi + Bluetooth', note: 'Gamepad control, local configuration, and networked development.' },
  { label: 'Power', value: 'Approximately 1 hour', note: 'Removable 2,600 mAh NP-F550 camera battery.' },
] as const;
export const MICRODUCK_MISSIONS = [
  {
    id: 'scout',
    label: 'Room Scout',
    goal: 'Find the red ball, approach it, and stop one body-length away.',
    verbs: ['gaze', 'get_frame', 'search_scan', 'walk_to', 'stop'],
    build: 'Vision target plus bounded approach controller.',
    reward: 'Target centered; distance reduced; collision and unstable pitch penalized.',
    gate: '20 randomized rooms; 95% clean stops; zero stair-edge entries.',
  },
  {
    id: 'bow',
    label: 'NFC Greeter',
    goal: 'When a familiar NFC tag taps the beak, bow once and quack softly.',
    verbs: ['nfc_read', 'stand', 'gaze', 'quack'],
    build: 'Event trigger plus head and neck motion policy.',
    reward: 'Smooth pose match; foot slip, joint speed, and repeat triggers penalized.',
    gate: '500 simulated taps; head pitch capped at 25 degrees; 10-second cooldown.',
  },
  {
    id: 'flock',
    label: 'Flock Mode',
    goal: 'Two ducks find the ball together; only the better-positioned duck kicks.',
    verbs: ['search_scan', 'broadcast', 'walk_to', 'yield', 'kick'],
    build: 'Shared task state plus local skill arbitration.',
    reward: 'Single clean kick and role clarity; duplicate motion and contact penalized.',
    gate: 'No double-kicks; radio-dropout recovery; local stop always wins.',
  },
] as const;

export const MICRODUCK_MODEL_HORIZON = [
  {
    layer: 'Microduck ONNX policies',
    role: 'Balance, walk, recover, kick, and grasp at 50 Hz on-device.',
    status: 'shipping stack',
  },
  {
    layer: 'General cloud or local language model',
    role: 'Interpret goals, select bounded skills, and write ordinary control software.',
    status: 'available now',
  },
  {
    layer: 'Claude Mythos 5',
    role: 'Advanced coding and research capability; a signal of how powerful software agents are becoming.',
    status: 'restricted access',
  },
  {
    layer: 'OpenAI Astra',
    role: 'Reported by OpenAI to show major gains in agentic coding and cybersecurity.',
    status: 'upcoming; not released',
  },
] as const;

export const MICRODUCK_CONSUMER_ARC = [
  { horizon: 'now', phase: 'Playable body', promise: 'Buy the character and control it immediately.' },
  { horizon: '1–2 years', phase: 'AI-authored skills', promise: 'Describe behavior and approve simulation evidence.' },
  { horizon: '2–4 years', phase: 'Ability market', promise: 'Install skills with provenance and hardware envelopes.' },
  { horizon: '4–7 years', phase: 'Household fleet', promise: 'Program the room through values, permissions, and limits.' },
] as const;

export const MICRODUCK_SOURCES = [
  { label: 'Pollen Robotics — Microduck product page', url: 'https://pollen-robotics.com/microduck/' },
  { label: 'Pollen Robotics — Microduck press kit', url: 'https://pollen-robotics.com/microduck/press-kit/' },
  { label: 'Pollen Robotics — Microduck runtime', url: 'https://github.com/pollen-robotics/microduck' },
  { label: 'Pollen Robotics — Microduck RL', url: 'https://github.com/pollen-robotics/microduck_rl' },
  { label: 'quackd — independent language-model planner', url: 'https://github.com/rokbenko/quackd' },
  { label: 'Anthropic — Claude Mythos', url: 'https://www.anthropic.com/claude/mythos' },
  {
    label: 'OpenAI — status and evaluation notes for Astra',
    url: 'https://openai.com/index/responding-next-frontier-critical-cyber-capabilities/',
  },
] as const;
