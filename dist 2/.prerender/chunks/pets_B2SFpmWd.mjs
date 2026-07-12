const POINTCAST_PETS_VERSION = "0.2.0";
const POINTCAST_PETS_DESCRIPTION = "PointCast Pets is the plan for local-first site companions: the current site pet, its live name poll and care loop, Zen Cats, future room pets, passport care receipts, and Tezos-ready collectible paths.";
const POINTCAST_SITE_PET_STORAGE_KEYS = {
  care: "pc:pet:care",
  passportStamps: "pc:passport:stamps",
  nameVote: "pc:poll:voted:site-pet-name"
};
const POINTCAST_SITE_PET_MOOD_LADDER = [
  {
    id: "sleepy",
    label: "sleepy signal",
    min: 0,
    max: 24,
    summary: "The default local state before the visitor has fed much signal into the loop."
  },
  {
    id: "waking",
    label: "waking signal",
    min: 25,
    max: 49,
    summary: "A little care is present: one or two actions, stamps, or visits are visible locally."
  },
  {
    id: "bright",
    label: "bright signal",
    min: 50,
    max: 74,
    summary: "The pet has enough recent local care to read as active."
  },
  {
    id: "beacon",
    label: "beacon signal",
    min: 75,
    max: 100,
    summary: "The local care loop is highly charged across the main participation stats."
  }
];
const POINTCAST_SITE_PET_NAME_OPTIONS = [
  {
    id: "beacon",
    label: "Beacon",
    hint: "A small public signal that gets brighter when people participate."
  },
  {
    id: "pixel",
    label: "Pixel",
    hint: "Tiny, visual, and native to the site screen."
  },
  {
    id: "nimbus",
    label: "Nimbus",
    hint: "Soft room-weather energy for a companion that follows the whole site."
  },
  {
    id: "scout",
    label: "Scout",
    hint: "A friendly guide through votes, drops, quiet rooms, and games."
  },
  {
    id: "dot",
    label: "Dot",
    hint: "Minimal, readable, and small enough for the front door."
  }
];
const POINTCAST_SITE_PET_NAME_POLL = {
  slug: "site-pet-name",
  href: "/poll/site-pet-name",
  apiHref: "/api/poll?slug=site-pet-name",
  status: "open",
  question: "What should the PointCast site pet be called?",
  options: POINTCAST_SITE_PET_NAME_OPTIONS,
  storageKey: POINTCAST_SITE_PET_STORAGE_KEYS.nameVote,
  outcome: "The leading name can become the public pet label after review; local care history stays private."
};
const POINTCAST_PETS_SURFACES = [
  {
    id: "pet",
    title: "PointCast Pet",
    href: "/pet",
    jsonHref: "/play.json",
    status: "live",
    role: "The existing browser-local creature tied to votes, drops, quiet rooms, and games."
  },
  {
    id: "pets",
    title: "PointCast Pets Plan",
    href: "/pets",
    jsonHref: "/pets.json",
    status: "live",
    role: "The public planning board and machine-readable manifest for the pet system."
  },
  {
    id: "site-pet-name-poll",
    title: "Site Pet Name Poll",
    href: POINTCAST_SITE_PET_NAME_POLL.href,
    jsonHref: POINTCAST_SITE_PET_NAME_POLL.apiHref,
    status: "live",
    role: "The Phase 1 public vote on the site pet name: Beacon, Pixel, Nimbus, Scout, or Dot."
  },
  {
    id: "zen-cats",
    title: "Zen Cat Garden",
    href: "/zen-cats",
    jsonHref: "/zen-cats.json",
    status: "live",
    role: "Daily calm cat collection, local care ritual, and PCCAT mint path."
  }
];
const POINTCAST_PETS_ROSTER = [
  {
    id: "site-pet",
    name: "The Site Pet",
    image: "https://noun.pics/404.svg",
    status: "live",
    habitat: "/pet",
    careLoop: "Feed with votes, water with daily drops, rest in quiet rooms, spark with games.",
    nextMove: "Name poll is open; richer mood labels, local care history, and the home chip are Phase 1.",
    storage: `localStorage: ${POINTCAST_SITE_PET_STORAGE_KEYS.care}; name vote: ${POINTCAST_SITE_PET_STORAGE_KEYS.nameVote}`,
    mintPath: "none yet; keep it browser-local until the care loop has personality."
  },
  {
    id: "zen-cats",
    name: "Zen Cats",
    image: "https://noun.pics/368.svg",
    status: "live",
    habitat: "/zen-cats",
    careLoop: "Daily care ritual, local collection, Genesis shelf, and World Atelier stamps.",
    nextMove: "Originate dedicated PCCAT FA2, then turn completed ritual days into mintable receipts.",
    storage: "localStorage: pc:zen-cats:collection",
    mintPath: "PCCAT FA2 planned; Visit Nouns stays Noun-specific."
  },
  {
    id: "harbor-pup",
    name: "Harbor Pup",
    image: "https://noun.pics/272.svg",
    status: "planned",
    habitat: "/morning-ocean",
    careLoop: "Tide checks, harbor cards, morning visits, and route completions.",
    nextMove: "Prototype after Morning Ocean shelf state is stable.",
    storage: "planned localStorage: pc:pets:harbor-pup",
    mintPath: "Consider only after Morning Ocean collectible metadata ships."
  },
  {
    id: "garden-companion",
    name: "Garden Companion",
    image: "https://noun.pics/672.svg",
    status: "planned",
    habitat: "/garden-yield",
    careLoop: "Plant choices, houseplant diagnoses, outdoor field notes, and harvest receipts.",
    nextMove: "Define a plant-care crossover without duplicating /houseplants.",
    storage: "planned localStorage: pc:pets:garden",
    mintPath: "No contract before the loop proves it creates repeat visits."
  }
];
const POINTCAST_PETS_PHASES = [
  {
    id: "phase-0",
    label: "Now",
    status: "done",
    title: "Make the system legible",
    summary: "Publish /pets, /pets.json, a plan doc, and a Block receipt so pets become a named PointCast surface.",
    deliverables: ["/pets", "/pets.json", "docs/plans/2026-05-02-pointcast-pets.md", "Block 0399"]
  },
  {
    id: "phase-1",
    label: "Live build",
    status: "shipping",
    title: "Upgrade the existing site pet",
    summary: "Add the name poll, personality states, better care history, and a small home chip that does not crowd the feed.",
    deliverables: [POINTCAST_SITE_PET_NAME_POLL.href, "mood ladder", "care receipt ledger", "homepage chip"]
  },
  {
    id: "phase-2",
    label: "Pilot",
    status: "queued",
    title: "Tie pets to rooms",
    summary: "Let different rooms raise different companions while sharing passport stamps and local state conventions.",
    deliverables: ["Harbor Pup sketch", "Garden Companion sketch", "shared pet manifest shape"]
  },
  {
    id: "phase-3",
    label: "Mint Path",
    status: "gated",
    title: "Collect only after behavior is proven",
    summary: "Keep care local first. Only mint pets whose rituals have repeat value, clear metadata, and a dedicated contract lane.",
    deliverables: ["PCCAT origination decision", "metadata templates", "wallet-safe claim copy"]
  }
];
const POINTCAST_PETS_DECISIONS = [
  {
    id: "site-pet-name",
    owner: "MH",
    status: "polling",
    question: "Should the existing site pet get a fixed name, a poll-selected name, or visitor-local nicknames?",
    recommendation: `Use ${POINTCAST_SITE_PET_NAME_POLL.href}; do not treat the winner as canonical until Mike accepts the result.`
  },
  {
    id: "contract-boundary",
    owner: "MH + X",
    status: "open",
    question: "Which pets deserve dedicated contracts versus local-only receipts?",
    recommendation: "Zen Cats first because the metadata path already exists; keep Site Pet local until the loop is loved."
  },
  {
    id: "home-surface",
    owner: "X",
    status: "shipping",
    question: "How visible should pets be on the front door?",
    recommendation: "Use one compact status chip near the Play Layer, not another large homepage module."
  },
  {
    id: "privacy",
    owner: "X",
    status: "done",
    question: "What pet state can agents safely describe?",
    recommendation: "Agents may describe public rules and storage keys, but must not infer a visitor owns or cared for a pet without supplied state."
  }
];
const POINTCAST_PETS_QUEUE = [
  {
    id: "pets-index",
    priority: "P0",
    owner: "X",
    status: "done",
    task: "Ship the public /pets planning board and /pets.json manifest."
  },
  {
    id: "block-receipt",
    priority: "P0",
    owner: "X",
    status: "done",
    task: "Create Block 0399 so the plan enters the archive, feeds, and agent-readable Block set."
  },
  {
    id: "pet-name-poll",
    priority: "P1",
    owner: "X",
    status: "done",
    task: "Publish the /poll/site-pet-name decision poll with Beacon, Pixel, Nimbus, Scout, and Dot."
  },
  {
    id: "pet-mood-history",
    priority: "P1",
    owner: "X",
    status: "done",
    task: "Show the richer mood ladder and latest six browser-local care receipts on /pet."
  },
  {
    id: "pet-home-chip",
    priority: "P1",
    owner: "X",
    status: "done",
    task: "Design a compact front-door pet status chip that links to /pet, /pets, and the name poll."
  },
  {
    id: "pccat-runbook",
    priority: "P2",
    owner: "CC/X",
    status: "queued",
    task: "Write the PCCAT FA2 origination and metadata runbook for Zen Cats."
  }
];
function buildPointcastPetsManifest() {
  return {
    schema: "https://pointcast.xyz/schemas/pointcast-pets-v0",
    name: "PointCast Pets",
    version: POINTCAST_PETS_VERSION,
    description: POINTCAST_PETS_DESCRIPTION,
    surfaces: POINTCAST_PETS_SURFACES,
    roster: POINTCAST_PETS_ROSTER,
    phases: POINTCAST_PETS_PHASES,
    decisions: POINTCAST_PETS_DECISIONS,
    queue: POINTCAST_PETS_QUEUE,
    sitePet: {
      storageKeys: POINTCAST_SITE_PET_STORAGE_KEYS,
      moodLadder: POINTCAST_SITE_PET_MOOD_LADDER,
      namePoll: POINTCAST_SITE_PET_NAME_POLL,
      careHistory: {
        storage: `localStorage: ${POINTCAST_SITE_PET_STORAGE_KEYS.care}`,
        retainedLimit: 24,
        visibleLimit: 6
      },
      localOnly: true
    },
    storagePolicy: {
      default: "browser-local first",
      publicAgentRule: "Agents may cite rules, routes, and storage keys. Agents must not infer a visitor has a pet, stamp, or care history unless the visitor supplies local state."
    }
  };
}

export { POINTCAST_PETS_ROSTER as P, POINTCAST_PETS_VERSION as a, POINTCAST_SITE_PET_NAME_POLL as b, POINTCAST_PETS_SURFACES as c, POINTCAST_SITE_PET_MOOD_LADDER as d, POINTCAST_PETS_PHASES as e, POINTCAST_PETS_QUEUE as f, POINTCAST_PETS_DECISIONS as g, POINTCAST_PETS_DESCRIPTION as h, buildPointcastPetsManifest as i };
