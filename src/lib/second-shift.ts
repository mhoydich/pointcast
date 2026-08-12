export const SECOND_SHIFT_GAME_URL =
  'https://el-segundo-2026-atlas.mhoydich.chatgpt.site/second-shift';

export const SECOND_SHIFT_SOURCE =
  'Michael Hoydich chat directive, 2026-08-12: create a list of things that should be manufactured locally; create an interesting El Segundo Cookie Clicker-like game around this concept; yep public and put on PointCast as well.';

export const SECOND_SHIFT_ORDERS = [
  {
    id: 'window-latches',
    name: 'Window latches',
    note: 'The marine layer found the old ones.',
    requirementOperations: 28,
    rewardCredits: 18,
  },
  {
    id: 'water-filter-bodies',
    name: 'Water filter bodies',
    note: 'The tap should work before the coffee.',
    requirementOperations: 42,
    rewardCredits: 28,
  },
  {
    id: 'school-desk-brackets',
    name: 'School desk brackets',
    note: 'Twenty-four wobbling desks. One good jig.',
    requirementOperations: 64,
    rewardCredits: 40,
  },
  {
    id: 'cargo-bike-racks',
    name: 'Cargo bike racks',
    note: 'Three blocks is still a commute.',
    requirementOperations: 92,
    rewardCredits: 55,
  },
  {
    id: 'clinic-cart-casters',
    name: 'Clinic cart casters',
    note: 'Useful things should roll.',
    requirementOperations: 128,
    rewardCredits: 72,
  },
  {
    id: 'solar-mounting-rails',
    name: 'Solar mounting rails',
    note: 'Keep tomorrow on the roof.',
    requirementOperations: 166,
    rewardCredits: 90,
  },
] as const;

export const SECOND_SHIFT_UPGRADES = [
  {
    id: 'jig',
    name: 'Cut a jig',
    costCredits: 14,
    effect: '+1 operation every press',
  },
  {
    id: 'cad',
    name: 'Share the CAD',
    costCredits: 28,
    effect: 'A neighboring shop joins the line',
  },
  {
    id: 'teach',
    name: 'Teach the shift',
    costCredits: 32,
    effect: 'Every fifth press gets an apprentice echo',
  },
  {
    id: 'offcuts',
    name: 'Sort the offcuts',
    costCredits: 42,
    effect: 'All unfinished orders need 18% less stock',
  },
  {
    id: 'microgrid',
    name: 'Rooftop microgrid',
    costCredits: 58,
    effect: 'Adds clean power and settles the marine layer',
  },
] as const;

export const SECOND_SHIFT_EVENTS = [
  {
    id: 'school-bus',
    afterCompletedOrders: 1,
    prompt: 'A school bus is at the roll-up.',
    choices: [
      { id: 'cut', label: 'Keep cutting', effect: '+30 operations now' },
      { id: 'teach', label: 'Stop + teach', effect: 'Bring the apprentice echo online' },
    ],
  },
  {
    id: 'offcut-pallet',
    afterCompletedOrders: 3,
    prompt: 'A pallet of mixed offcuts arrives.',
    choices: [
      { id: 'use', label: 'Use it now', effect: '+48 shop credits' },
      { id: 'sort', label: 'Sort by alloy', effect: 'Reduce remaining stock requirements by 18%' },
    ],
  },
  {
    id: 'marine-layer',
    afterCompletedOrders: 5,
    prompt: 'The marine layer covers the rooftops.',
    choices: [
      { id: 'grid', label: 'Pull from grid', effect: '+0.75 automatic operations per second' },
      { id: 'reschedule', label: 'Reschedule cuts', effect: '+1 operation per press' },
      {
        id: 'microgrid',
        label: 'Keep the line moving',
        effect: 'The automatic line continues without interruption',
        condition: 'Rooftop microgrid already online',
      },
    ],
  },
] as const;

export const SECOND_SHIFT = {
  name: 'Second Shift',
  subtitle: 'El Segundo Makes the Morning',
  description:
    'A finite local-manufacturing clicker: make six ordinary needs before dawn, then teach the town to keep the line moving without you.',
  canonical: 'https://pointcast.xyz/second-shift',
  machine: 'https://pointcast.xyz/second-shift.json',
  game: SECOND_SHIFT_GAME_URL,
  block: 'https://pointcast.xyz/b/0571',
  socialImage: 'https://pointcast.xyz/images/second-shift/social-card.png',
  concept: {
    rule: 'Make what is bulky, breakable, repairable, or needed by morning.',
    objective: 'Finish six local orders and leave useful knowledge in more than one shop.',
    ending: 'The game ends with a dawn receipt after all six orders are complete.',
  },
  runtime: {
    nominalShiftSeconds: 420,
    timerBoundary: 'The clock continues into overtime; it does not create a failure state.',
    manualInput: ['Make button', 'Space key outside interactive controls'],
    optionalAudio: 'Browser-generated Web Audio tones, enabled by the visitor.',
    progressStorage: 'localStorage: el-segundo-second-shift-v1',
  },
  boundary: {
    productionCapacityAudit: false,
    supplierDirectory: false,
    procurementOffer: false,
    accountRequired: false,
    serverGameState: false,
    telemetryAddedForThisGame: false,
    simulatedOutputs: [
      'operations, credits, and shop count',
      '412 truck miles avoided on the dawn receipt',
      'offcut retention percentage on the dawn receipt',
    ],
    note:
      'Second Shift is a browser game and editorial proposition, not evidence that any listed item is currently produced locally or that a measured logistics saving occurred.',
  },
  provenance: {
    requestedBy: 'Michael Hoydich',
    implementedBy: 'Codex / OpenAI',
    requestedAt: '2026-08-12',
    source: SECOND_SHIFT_SOURCE,
    pointcastBlock: '0571',
  },
} as const;
