/**
 * Neighborhoods within 25 miles of El Segundo.
 *
 * One source of truth, consumed by both `/beacon` (the detailed radius map)
 * and `/mesh` (the network overview). If you add a neighborhood, update
 * once here — both pages pick it up on the next build.
 *
 * Status legend:
 *   seed     — actively part of PointCast's growth today
 *   target   — primary first-wave extension candidate
 *   adjacent — reachable, depends on infrastructure / partners
 *
 * Distance is miles from the intersection of Main St + Grand Ave, El Segundo.
 * Bearing is rough compass direction.
 */
export interface Neighborhood {
  name: string;
  distance: number;
  bearing: string;
  why: string;
  status: 'seed' | 'target' | 'adjacent';
}

export const NEIGHBORHOODS: Neighborhood[] = [
  { name: 'Manhattan Beach',    distance: 3,  bearing: 'S',  why: 'Shared coastline, shared pickleball courts. Natural first extension of any El Segundo mesh.', status: 'target' },
  { name: 'Hermosa Beach',      distance: 5,  bearing: 'S',  why: 'The strand runs continuous. A single backhaul hop covers three towns.', status: 'target' },
  { name: 'Redondo Beach',      distance: 7,  bearing: 'S',  why: 'South Bay spine. Dense enough for a supernode to pay back fast.', status: 'target' },
  { name: 'Torrance',           distance: 7,  bearing: 'SE', why: 'Largest of the South Bay cities. Logical mesh hub for Gardena / Lomita / PV.', status: 'target' },
  { name: 'Palos Verdes',       distance: 10, bearing: 'S',  why: 'Hillside line-of-sight to Catalina. Microwave backhaul candidate.', status: 'adjacent' },
  { name: 'Westchester',        distance: 4,  bearing: 'N',  why: 'LAX-adjacent. Airport cargo backhaul has fiber; pay it forward to neighborhoods.', status: 'target' },
  { name: 'Playa del Rey',      distance: 3,  bearing: 'N',  why: 'Marina del Rey, Playa Vista, Culver. Tech-heavy, sympathetic audience.', status: 'target' },
  { name: 'Venice',             distance: 6,  bearing: 'N',  why: 'Makerspace culture. Obvious host for third-space network (per Block 0242).', status: 'target' },
  { name: 'Culver City',        distance: 7,  bearing: 'NE', why: 'Tech + arts. Sony, Amazon Studios, The Platform. Wallet-heavy, creative.', status: 'adjacent' },
  { name: 'Mar Vista',          distance: 6,  bearing: 'N',  why: 'Quiet residential, great for mesh node density.', status: 'target' },
  { name: 'Hawthorne',          distance: 4,  bearing: 'E',  why: 'SpaceX-adjacent. Industrial roofs + engineering talent.', status: 'adjacent' },
  { name: 'Inglewood',          distance: 7,  bearing: 'NE', why: 'SoFi, the Intuit Dome, the new Metro K line. Energy is real.', status: 'target' },
  { name: 'Santa Monica',       distance: 10, bearing: 'N',  why: 'Established mesh projects (Community Broadband). Peer, not dependent.', status: 'adjacent' },
  { name: 'Long Beach',         distance: 20, bearing: 'SE', why: 'Edge of the 25-mile circle. Port, downtown, big geography.', status: 'adjacent' },
  { name: 'Downtown LA',        distance: 17, bearing: 'NE', why: 'Arts District, Little Tokyo. 25-mile ring edge but cultural gravity.', status: 'adjacent' },
  { name: 'Compton',            distance: 11, bearing: 'E',  why: 'Underserved by broadband incumbents. High-impact mesh candidate.', status: 'target' },
  { name: 'Gardena',            distance: 8,  bearing: 'SE', why: 'South Bay workhorse town. Pickleball courts, diverse community.', status: 'seed' },
  { name: 'Lomita',             distance: 11, bearing: 'SE', why: 'Quiet, tight-knit. Third-space network compatible.', status: 'seed' },
  { name: 'El Segundo',         distance: 0,  bearing: '·',  why: 'Home. Pointcast HQ. Year-one beacon.', status: 'seed' },
];

/** Distance-sorted copy, nearest first. Useful for tables / radar views. */
export const NEIGHBORHOODS_BY_DISTANCE: Neighborhood[] = [...NEIGHBORHOODS].sort((a, b) => a.distance - b.distance);

export const RADIUS_MILES = 25;
export const RADIUS_METERS = Math.round(RADIUS_MILES * 1609.344);

/** The center point used for all radius math. Main + Grand, El Segundo. */
export const BEACON_CENTER = {
  lat: 33.9194,
  lng: -118.4088,
  placeName: 'El Segundo, California, USA',
};

/** Count neighborhoods by status. Useful for at-a-glance summaries. */
export function countByStatus(list: Neighborhood[] = NEIGHBORHOODS) {
  const c = { seed: 0, target: 0, adjacent: 0 } as Record<Neighborhood['status'], number>;
  for (const n of list) c[n.status] += 1;
  return c;
}
