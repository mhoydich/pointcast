const CARD_ROSTER = [
  { id: 42, note: "the canonical battler card — originals first" },
  { id: 137, note: "phase-1 launch card" },
  { id: 333, note: "bell tones, clean face" },
  { id: 420, note: "roster default challenger — classic meme Noun" },
  { id: 69, note: "short-head pop" },
  { id: 7, note: "low-ID collector bait" },
  { id: 888, note: "palindromic ID, strong glasses" },
  { id: 101, note: "high-timbre drum card" },
  { id: 256, note: "2^8, nice round power-of-two" },
  { id: 512, note: "2^9, larger pow-of-two" },
  { id: 999, note: "triple-digit max pop" },
  { id: 1024, note: "2^10 — developer friendly" },
  { id: 555, note: "shaker drum card — triples" },
  { id: 169, note: "perfect square (13²)" },
  { id: 729, note: "perfect cube (9³)" },
  { id: 11, note: "single-digit double-ups" },
  { id: 66, note: "mirror of 99" },
  { id: 333, note: "triple threes — high-focus rolls" },
  { id: 1111, note: "quad one, maximal clean" },
  { id: 314, note: "pi Noun" },
  { id: 1200, note: "edge of the roster — guaranteed valid" }
];
function dayIndexForDate(date = /* @__PURE__ */ new Date()) {
  const ms = date.getTime();
  return Math.floor(ms / 864e5);
}
function pickCardOfTheDay(date = /* @__PURE__ */ new Date()) {
  const dayIndex = dayIndexForDate(date);
  const rosterIndex = (dayIndex % CARD_ROSTER.length + CARD_ROSTER.length) % CARD_ROSTER.length;
  const entry = CARD_ROSTER[rosterIndex];
  const isoDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  )).toISOString().slice(0, 10);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date) + " (UTC)";
  return {
    id: entry.id,
    note: entry.note,
    date: isoDate,
    dateLabel,
    rosterIndex
  };
}

export { pickCardOfTheDay as p };
