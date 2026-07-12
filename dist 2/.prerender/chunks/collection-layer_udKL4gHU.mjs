import { M as MORNING_OCEAN_TOKENS } from './morning-ocean__lLVjAWo.mjs';
import { Z as ZEN_CAT_GENESIS_COLLECTIBLES, a as ZEN_CAT_WORLD_COLLECTIBLES } from './zen-cat-collectibles_BLrr4dOT.mjs';

const COLLECTION_SOURCES = [
  {
    id: "mint",
    label: "Mint Receipts",
    key: "pc:mint-studio:receipts",
    href: "/mint-studio",
    empty: "No mint receipts yet.",
    color: "#bf6f54"
  },
  {
    id: "harbor",
    label: "Harbor Watchlist",
    key: "pc:harbor-log:watchlist",
    href: "/harbor-log",
    empty: "No ocean vessels watched yet.",
    color: "#3f7681"
  },
  {
    id: "passport",
    label: "Cat Passport",
    key: "pc:cat-passport:stamps",
    href: "/cat-passport",
    empty: "No passport stamps yet.",
    color: "#b84f55"
  },
  {
    id: "gallery",
    label: "Gallery Shows",
    key: "pc:gallery-wall:shows",
    href: "/gallery-wall",
    empty: "No curated walls yet.",
    color: "#875c9e"
  },
  {
    id: "ritual",
    label: "Ritual Marks",
    key: "pc:ritual-clock:marks",
    href: "/ritual-clock",
    empty: "No daily ritual marks yet.",
    color: "#c38b35"
  },
  {
    id: "exchange",
    label: "Exchange Notes",
    key: "pc:exchange-table:wishes",
    href: "/exchange-table",
    empty: "No exchange notes yet.",
    color: "#7b8b53"
  },
  {
    id: "provenance",
    label: "Provenance Proofs",
    key: "pc:provenance-ledger:exports",
    href: "/provenance-ledger",
    empty: "No proof sheets yet.",
    color: "#586c8c"
  },
  {
    id: "atlas",
    label: "World Atlas",
    key: "pc:world-atlas:stamps",
    href: "/world-atlas",
    empty: "No atlas stamps yet.",
    color: "#267f78"
  },
  {
    id: "referrals",
    label: "Invite Ledger",
    key: "pc:referral-garden:invites",
    href: "/referral-garden",
    empty: "No invite receipts yet.",
    color: "#7d6aa8"
  },
  {
    id: "sats",
    label: "Sats Path",
    key: "pc:sats-path:checks",
    href: "/sats-path",
    empty: "No readiness checkpoints yet.",
    color: "#c39b39"
  },
  {
    id: "ocean",
    label: "Morning Ocean",
    key: "pc:morning-ocean:collection",
    href: "/morning-ocean",
    empty: "No Morning Ocean cards yet.",
    color: "#6b8e99"
  },
  {
    id: "cats",
    label: "Zen Cats",
    key: "pc:zen-cats:collection",
    href: "/zen-cats",
    empty: "No daily cats collected yet.",
    color: "#d28c7a"
  },
  {
    id: "journey",
    label: "Journey Prints",
    key: "pc:zen-cats:journey",
    href: "/zen-cats#journey",
    empty: "No journey prints yet.",
    color: "#6d8a55"
  }
];
const FEATURED_COLLECTIBLE_IMAGES = [
  ...ZEN_CAT_GENESIS_COLLECTIBLES.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.title,
    collection: "Zen Cats Genesis",
    imageUrl: item.imageUrl,
    tone: item.mood
  })),
  ...MORNING_OCEAN_TOKENS.slice(0, 8).map((item) => ({
    id: `morning-${item.tokenId}`,
    title: item.title,
    collection: "Morning Ocean",
    imageUrl: item.imageUrl,
    tone: item.mood
  }))
];
const CURATOR_THEMES = [
  { id: "first-light", title: "First Light Reserve", mood: "quiet capital, clean receipts, low sun", wall: "ivory walls, blue shadow, brass rail" },
  { id: "indigo-cat", title: "Indigo Cat Salon", mood: "deep textile blue, coral eyes, botanical hush", wall: "ink-blue velvet and pale maple" },
  { id: "harbor-wealth", title: "Harbor Wealth Studies", mood: "boats, scale, patient motion, earned surplus", wall: "salt white plaster and dark walnut" },
  { id: "gem-route", title: "Gem Route Atelier", mood: "world cats, gemstone color, landmark memory", wall: "travertine, linen, lacquered coral" },
  { id: "proof-garden", title: "Proof Garden", mood: "local proofs, stamps, show cards, calm custody", wall: "green-gray paper and polished nickel" },
  { id: "night-vault", title: "Night Vault", mood: "constellations, saved objects, cold storage energy", wall: "charcoal room with soft moon glass" }
];
const RITUAL_SLOTS = [
  {
    id: "dawn",
    label: "Dawn Cat",
    hour: "06:30",
    action: "Collect calm",
    href: "/zen-cats",
    storageKey: "pc:zen-cats:collection",
    color: "#d28c7a"
  },
  {
    id: "harbor",
    label: "Harbor Watch",
    hour: "08:10",
    action: "Watch vessel",
    href: "/harbor-log",
    storageKey: "pc:harbor-log:watchlist",
    color: "#3f7681"
  },
  {
    id: "studio",
    label: "Studio Receipt",
    hour: "13:40",
    action: "Draft mint",
    href: "/mint-studio",
    storageKey: "pc:mint-studio:receipts",
    color: "#bf6f54"
  },
  {
    id: "night",
    label: "Night Sky",
    hour: "21:00",
    action: "Read chart",
    href: "/observatory",
    storageKey: "pc:observatory:name",
    color: "#586c8c"
  }
];
const EXCHANGE_LANES = [
  { id: "seeking", label: "Seeking", tone: "pieces, stamps, routes, or proofs worth hunting" },
  { id: "offering", label: "Offering", tone: "extras, show slots, attention, introductions, or work" },
  { id: "watching", label: "Watching", tone: "signals that are not ready to move yet" }
];
const atlasCoordinates = [
  [468, 206],
  [802, 248],
  [790, 258],
  [450, 306],
  [500, 340],
  [542, 276],
  [526, 286],
  [508, 276],
  [494, 288],
  [496, 270],
  [502, 282],
  [474, 270],
  [454, 248],
  [424, 216],
  [420, 190],
  [512, 240],
  [514, 266],
  [184, 262],
  [166, 330],
  [216, 370],
  [306, 436],
  [288, 470],
  [344, 392],
  [560, 392],
  [620, 392],
  [720, 396],
  [780, 424],
  [828, 468],
  [828, 512],
  [760, 520]
];
const ATLAS_STOPS = ZEN_CAT_WORLD_COLLECTIBLES.slice(0, 30).map((item, index) => {
  const [x, y] = atlasCoordinates[index] || [500, 300];
  const fallbackImage = ZEN_CAT_GENESIS_COLLECTIBLES[index % ZEN_CAT_GENESIS_COLLECTIBLES.length].imageUrl;
  return {
    id: item.id,
    number: item.number,
    title: item.title,
    city: item.city,
    country: item.country,
    landmark: item.landmark,
    cat: item.cat,
    gem: item.gem,
    mood: item.mood,
    rarity: item.rarity,
    x,
    y,
    imageUrl: fallbackImage,
    color: item.palette.accent
  };
});

export { ATLAS_STOPS as A, CURATOR_THEMES as C, EXCHANGE_LANES as E, FEATURED_COLLECTIBLE_IMAGES as F, RITUAL_SLOTS as R, COLLECTION_SOURCES as a };
