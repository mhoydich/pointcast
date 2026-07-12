const CHANNELS = {
  FD: {
    code: "FD",
    slug: "front-door",
    name: "Front Door",
    purpose: "AI, interfaces, agent-era thinking.",
    color600: "#185FA5",
    color800: "#0B3E73",
    color50: "#EEF4FA"
  },
  CRT: {
    code: "CRT",
    slug: "court",
    name: "Court",
    purpose: "Pickleball — matches, paddles, drills.",
    color600: "#3B6D11",
    color800: "#24460A",
    color50: "#F0F5E9"
  },
  SPN: {
    code: "SPN",
    slug: "spinning",
    name: "Spinning",
    purpose: "Music, playlists, listening notes.",
    color600: "#993C1D",
    color800: "#6A2810",
    color50: "#FBEFEA"
  },
  GF: {
    code: "GF",
    slug: "good-feels",
    name: "Good Feels",
    purpose: "Cannabis/hemp, product drops, brand ops.",
    color600: "#993556",
    color800: "#6B2139",
    color50: "#FAEAF0"
  },
  GDN: {
    code: "GDN",
    slug: "garden",
    name: "Garden",
    purpose: "Balcony, birds, wildlife, quiet noticing.",
    color600: "#0F6E56",
    color800: "#074638",
    color50: "#E7F4EF"
  },
  ESC: {
    code: "ESC",
    slug: "el-segundo",
    name: "El Segundo",
    purpose: "ESCU fiction, local, community.",
    color600: "#534AB7",
    color800: "#332C7C",
    color50: "#EEEDF7"
  },
  FCT: {
    code: "FCT",
    slug: "faucet",
    name: "Faucet",
    purpose: "Free daily claims, giveaways.",
    color600: "#BA7517",
    color800: "#834F0A",
    color50: "#FBF1E1"
  },
  VST: {
    code: "VST",
    slug: "visit",
    name: "Visit",
    purpose: "Human and agent visit log entries.",
    color600: "#5F5E5A",
    color800: "#38373A",
    color50: "#EFEFEE"
  },
  BTL: {
    code: "BTL",
    slug: "battler",
    name: "Battler",
    purpose: "Nouns Battler — deterministic duels. Every match is a block.",
    color600: "#8A2432",
    // oxblood — the one primary that doesn't collide with the existing 8
    color800: "#551620",
    color50: "#FBEAEE"
  },
  BDY: {
    code: "BDY",
    slug: "birthday",
    name: "Birthday",
    purpose: "Birthdays celebrated on PointCast — one block per person per year, one Noun per person forever. Indexed at /cake.",
    color600: "#D86440",
    // coral — warm + festive, distinct from FCT amber + GF pink
    color800: "#8E3F25",
    color50: "#FCEEE8"
  }
};
const CHANNEL_LIST = Object.values(CHANNELS);
function getChannel(key) {
  const upper = key.toUpperCase();
  if (upper in CHANNELS) return CHANNELS[upper];
  return CHANNEL_LIST.find((c) => c.slug === key.toLowerCase());
}

export { CHANNELS as C, CHANNEL_LIST as a, getChannel as g };
