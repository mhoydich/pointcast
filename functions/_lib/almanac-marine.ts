/**
 * Marine-layer read for the Daily Almanac. Same oracle as /marine-layer.
 * A failure is the card's "did not answer" line. This does not write.
 */
import { answerMarine, type MarineDeps } from '../../src/lib/marine-oracle.ts';

export function marineForCard(date: string) {
  const deps: MarineDeps = {
    fetch: (url) => fetch(url, { headers: { 'User-Agent': 'PointCast Almanac (pointcast.xyz/almanac)' } }),
    now: new Date(),
    cached: async (_url, _ttl, load) => load(),
  };
  return answerMarine({ date }, deps);
}
