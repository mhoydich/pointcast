/** Minimum stored drinking-water plan; household tanks are not credited. */
export function planWater(people, days) {
  if (!Number.isInteger(people) || people < 1 || people > 12 || ![3, 7, 14].includes(days)) {
    throw new RangeError('Choose 1–12 people and 3, 7 or 14 days.');
  }
  const gallons = people * days;
  const jugs = Math.ceil(gallons / 5);
  const weekender = days === 3 && people <= 2;
  const baseJugs = weekender ? 2 : 6;
  return { gallons, jugs, baseJugs, extraJugs: Math.max(0, jugs - baseJugs), kit: weekender ? 'The Weekender' : 'The Fortnight' };
}
