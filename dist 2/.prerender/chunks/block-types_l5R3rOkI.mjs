const BLOCK_TYPES = {
  READ: {
    code: "READ",
    label: "READ",
    footerHint: "readingTime",
    description: "Long-form text — essay, dispatch, article."
  },
  LISTEN: {
    code: "LISTEN",
    label: "LISTEN",
    footerHint: "externalLink",
    description: "Audio embed — Spotify, SoundCloud, or a single track."
  },
  WATCH: {
    code: "WATCH",
    label: "WATCH",
    footerHint: "duration",
    description: "Video embed with external link and runtime."
  },
  MINT: {
    code: "MINT",
    label: "MINT",
    footerHint: "edition",
    description: "Paid edition on Tezos FA2. Price in tez, supply, mint button."
  },
  FAUCET: {
    code: "FAUCET",
    label: "FAUCET",
    footerHint: "claimStatus",
    description: "Free daily claim. One per wallet per day, gas only."
  },
  NOTE: {
    code: "NOTE",
    label: "NOTE",
    footerHint: "location",
    description: "Short observation, tweet-sized. Often location-tagged."
  },
  VISIT: {
    code: "VISIT",
    label: "VISIT",
    footerHint: "agent",
    description: "Visit-log entry. Shows the visitor vendor or geo."
  },
  LINK: {
    code: "LINK",
    label: "LINK",
    footerHint: "destination",
    description: "External link — destination domain shown as the footer signal."
  },
  TALK: {
    code: "TALK",
    label: "TALK",
    footerHint: "duration",
    description: "Voice Dispatch — 10-60 sec audio block. Recorded via /talk, played via /listen. RFC 0001."
  },
  BIRTHDAY: {
    code: "BIRTHDAY",
    label: "BIRTHDAY",
    footerHint: "birthday",
    description: "Birthday card — open-edition FA2 token keyed to one person per year. Free, gas-only, indexed at /cake."
  }
};
const BLOCK_TYPE_LIST = Object.values(BLOCK_TYPES);

export { BLOCK_TYPE_LIST as B, BLOCK_TYPES as a };
