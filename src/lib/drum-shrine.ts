export const SHRINE_NOUN_COUNT = 1200;

export function shrineState(at = new Date()) {
  const year = at.getUTCFullYear();
  const start = Date.UTC(year, 0, 0);
  const dayStart = Date.UTC(year, at.getUTCMonth(), at.getUTCDate());
  const dayOfYear = Math.floor((dayStart - start) / 86_400_000);
  const noun = (year * 7 + dayOfYear * 13) % SHRINE_NOUN_COUNT;
  const rotatesAt = new Date(Date.UTC(year, at.getUTCMonth(), at.getUTCDate() + 1)).toISOString();

  return {
    date: at.toISOString().slice(0, 10),
    dayOfYear,
    noun,
    nounImage: `https://noun.pics/${noun}.svg`,
    rotatesAt,
  };
}
