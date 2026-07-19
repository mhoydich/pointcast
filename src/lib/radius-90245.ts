export const RADIUS_CENTER = {
  name: 'El Segundo, California',
  postalCode: '90245',
  latitude: 33.9192,
  longitude: -118.4165,
  maximumMiles: 25,
} as const;

export const RADIUS_SOURCES = [
  {
    id: 'itu-p525',
    title: 'ITU-R P.525-5 · Calculation of free-space attenuation',
    url: 'https://www.itu.int/rec/R-REC-P.525-5-202411-I/en',
    use: 'Free-space basic transmission loss.',
  },
  {
    id: 'nist-c',
    title: 'NIST · Definitions of SI base units',
    url: 'https://www.nist.gov/si-redefinition/definitions-si-base-units',
    use: 'Exact speed of light in vacuum: 299,792,458 m/s.',
  },
  {
    id: 'ssc-command-plan',
    title: 'Space Systems Command · Command Plan',
    url: 'https://www.ssc.spaceforce.mil/Portals/3/Documents/SSC_Command_Plan_2024_Final_04_02_2025_.pdf',
    use: 'Local context: Space Systems Command is headquartered in El Segundo.',
  },
] as const;

export type RadiusLinkInput = {
  distanceMiles: number;
  frequencyGHz: number;
  transmitPowerDbm: number;
  combinedGainDbi: number;
  bandwidthMHz: number;
  noiseFigureDb: number;
  extraLossDb: number;
};

export type RadiusLinkResult = RadiusLinkInput & {
  distanceKm: number;
  wavelengthMeters: number;
  freeSpacePathLossDb: number;
  receivedPowerDbm: number;
  noiseFloorDbm: number;
  snrDb: number;
  shannonCapacityMbps: number;
  propagationDelayMicroseconds: number;
  firstFresnelRadiusMeters: number;
  linkState: 'strong' | 'workable' | 'edge' | 'below-noise';
};

export type RadiusPreset = RadiusLinkInput & {
  id: string;
  label: string;
  kicker: string;
  note: string;
};

export const RADIUS_PRESETS: RadiusPreset[] = [
  {
    id: 'field-sensor',
    label: 'Field sensor',
    kicker: '915 MHz · narrowband',
    note: 'A low-rate sensor thought experiment across the local field layer.',
    distanceMiles: 8,
    frequencyGHz: 0.915,
    transmitPowerDbm: 20,
    combinedGainDbi: 6,
    bandwidthMHz: 0.2,
    noiseFigureDb: 6,
    extraLossDb: 9,
  },
  {
    id: 'rooftop-mesh',
    label: 'Rooftop mesh',
    kicker: '5.8 GHz · 20 MHz',
    note: 'A line-of-sight rooftop model with directional gain and an obstruction allowance.',
    distanceMiles: 4.5,
    frequencyGHz: 5.8,
    transmitPowerDbm: 26,
    combinedGainDbi: 28,
    bandwidthMHz: 20,
    noiseFigureDb: 6,
    extraLossDb: 12,
  },
  {
    id: 'satcom-thought',
    label: 'Satcom thought experiment',
    kicker: '26 GHz · 50 MHz',
    note: 'A free-space Ka-range exercise. Rain, oxygen, pointing error, and regulation are deliberately outside this model.',
    distanceMiles: 25,
    frequencyGHz: 26,
    transmitPowerDbm: 35,
    combinedGainDbi: 44,
    bandwidthMHz: 50,
    noiseFigureDb: 7,
    extraLossDb: 18,
  },
];

const SPEED_OF_LIGHT_MPS = 299_792_458;
const METERS_PER_MILE = 1_609.344;

const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, finite(value, minimum)));

export function normalizeRadiusInput(input: Partial<RadiusLinkInput>): RadiusLinkInput {
  return {
    distanceMiles: clamp(input.distanceMiles ?? 8, 0.1, RADIUS_CENTER.maximumMiles),
    frequencyGHz: clamp(input.frequencyGHz ?? 2.4, 0.1, 40),
    transmitPowerDbm: clamp(input.transmitPowerDbm ?? 20, -20, 60),
    combinedGainDbi: clamp(input.combinedGainDbi ?? 12, -10, 80),
    bandwidthMHz: clamp(input.bandwidthMHz ?? 1, 0.01, 200),
    noiseFigureDb: clamp(input.noiseFigureDb ?? 6, 0, 30),
    extraLossDb: clamp(input.extraLossDb ?? 8, 0, 80),
  };
}

export function calculateRadiusLink(input: Partial<RadiusLinkInput>): RadiusLinkResult {
  const normalized = normalizeRadiusInput(input);
  const distanceKm = normalized.distanceMiles * METERS_PER_MILE / 1_000;
  const distanceMeters = distanceKm * 1_000;
  const frequencyHz = normalized.frequencyGHz * 1_000_000_000;
  const wavelengthMeters = SPEED_OF_LIGHT_MPS / frequencyHz;
  const freeSpacePathLossDb = 92.45
    + 20 * Math.log10(distanceKm)
    + 20 * Math.log10(normalized.frequencyGHz);
  const receivedPowerDbm = normalized.transmitPowerDbm
    + normalized.combinedGainDbi
    - normalized.extraLossDb
    - freeSpacePathLossDb;
  const noiseFloorDbm = -174
    + 10 * Math.log10(normalized.bandwidthMHz * 1_000_000)
    + normalized.noiseFigureDb;
  const snrDb = receivedPowerDbm - noiseFloorDbm;
  const snrLinear = 10 ** (snrDb / 10);
  const shannonCapacityMbps = normalized.bandwidthMHz * Math.log2(1 + Math.max(0, snrLinear));
  const propagationDelayMicroseconds = distanceMeters / SPEED_OF_LIGHT_MPS * 1_000_000;
  const firstFresnelRadiusMeters = Math.sqrt(wavelengthMeters * distanceMeters / 4);
  const linkState = snrDb >= 20
    ? 'strong'
    : snrDb >= 10
      ? 'workable'
      : snrDb >= 0
        ? 'edge'
        : 'below-noise';

  return {
    ...normalized,
    distanceKm,
    wavelengthMeters,
    freeSpacePathLossDb,
    receivedPowerDbm,
    noiseFloorDbm,
    snrDb,
    shannonCapacityMbps,
    propagationDelayMicroseconds,
    firstFresnelRadiusMeters,
    linkState,
  };
}

export function serializeRadiusInput(input: RadiusLinkInput): URLSearchParams {
  const normalized = normalizeRadiusInput(input);
  return new URLSearchParams({
    d: normalized.distanceMiles.toFixed(2),
    f: normalized.frequencyGHz.toFixed(3),
    p: normalized.transmitPowerDbm.toFixed(1),
    g: normalized.combinedGainDbi.toFixed(1),
    b: normalized.bandwidthMHz.toFixed(2),
    n: normalized.noiseFigureDb.toFixed(1),
    l: normalized.extraLossDb.toFixed(1),
  });
}

export function radiusInputFromSearch(search: URLSearchParams): RadiusLinkInput {
  const optionalNumber = (key: string) => {
    const value = search.get(key);
    return value === null || value.trim() === '' ? undefined : Number(value);
  };

  return normalizeRadiusInput({
    distanceMiles: optionalNumber('d'),
    frequencyGHz: optionalNumber('f'),
    transmitPowerDbm: optionalNumber('p'),
    combinedGainDbi: optionalNumber('g'),
    bandwidthMHz: optionalNumber('b'),
    noiseFigureDb: optionalNumber('n'),
    extraLossDb: optionalNumber('l'),
  });
}

export const RADIUS_PACKET = {
  schema: 'https://pointcast.xyz/schemas/radius-90245-v1.json',
  name: 'RADIUS / 90245',
  canonical: 'https://pointcast.xyz/ues/radius',
  description: 'An interactive free-space RF link bench centered on El Segundo and bounded to the University of El Segundo 25-mile field layer.',
  center: RADIUS_CENTER,
  presets: RADIUS_PRESETS,
  sources: RADIUS_SOURCES,
  formulas: {
    freeSpacePathLoss: '92.45 + 20 log10(distance km) + 20 log10(frequency GHz)',
    receivedPower: 'transmit power + combined antenna gain - extra loss - free-space path loss',
    noiseFloor: '-174 + 10 log10(bandwidth Hz) + noise figure',
    shannonCapacity: 'bandwidth × log2(1 + linear SNR)',
    midpointFresnelRadius: 'sqrt(wavelength × distance / 4)',
    propagationDelay: 'distance / 299792458 m/s',
  },
  boundary: 'Educational free-space reference only. It is not a site survey, spectrum authorization, safety analysis, or deployment recommendation.',
} as const;
