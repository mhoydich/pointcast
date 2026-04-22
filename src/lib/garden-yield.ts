/**
 * Garden value-yield system.
 *
 * Block 0331 names the planting palette. This file adds the operating
 * layer: site presets, plant fit scores, value metrics, and establishment
 * loops that can be rendered by /garden-yield and mirrored by
 * /garden-yield.json for agents.
 */
import { NATIVE_PLANTING_PALETTE } from './local';

export type GardenYieldSiteId = 'balcony' | 'parkway' | 'yard' | 'repair-patch';
export type GardenYieldSun = 'full' | 'part' | 'soft';
export type GardenYieldDrainage = 'fast' | 'mixed' | 'heavy';
export type GardenYieldWater = 'low' | 'medium';
export type GardenYieldMetricId =
  | 'pollinator'
  | 'waterFit'
  | 'habitat'
  | 'seasonal'
  | 'careEase';

export type GardenYieldMetric = {
  id: GardenYieldMetricId;
  label: string;
  short: string;
  read: string;
};

export type GardenYieldSite = {
  id: GardenYieldSiteId;
  label: string;
  areaSqFt: number;
  sun: GardenYieldSun;
  drainage: GardenYieldDrainage;
  water: GardenYieldWater;
  wildness: number;
  read: string;
};

export type GardenYieldPlant = {
  slug: string;
  role: string;
  minSqFt: number;
  containerFit: boolean;
  sun: GardenYieldSun[];
  drainage: GardenYieldDrainage[];
  water: GardenYieldWater[];
  wildness: number;
  bestFor: GardenYieldSiteId[];
  quantityPer12SqFt: number;
  placement: string;
  establishment: string;
  maintenance: string;
  value: string[];
  scores: Record<GardenYieldMetricId, number>;
};

export type GardenYieldLoopStep = {
  phase: string;
  timing: string;
  action: string;
  check: string;
};

export const GARDEN_YIELD_SOURCE_BLOCK = {
  id: '0331',
  title: 'Native planting palette for El Segundo',
  url: 'https://pointcast.xyz/b/0331',
  jsonUrl: 'https://pointcast.xyz/b/0331.json',
} as const;
export const GARDEN_YIELD_METRICS: GardenYieldMetric[] = [
  {
    id: 'pollinator',
    label: 'Pollinator traffic',
    short: 'Pollinators',
    read: 'Bloom, host-plant value, and small-insect usefulness.',
  },
  {
    id: 'waterFit',
    label: 'Water fit',
    short: 'Water',
    read: 'How well the kit belongs in a dry coastal, fast-draining setup.',
  },
  {
    id: 'habitat',
    label: 'Habitat structure',
    short: 'Structure',
    read: 'Shelter, edge, seedhead, berry, and scrub mass value.',
  },
  {
    id: 'seasonal',
    label: 'Seasonal signal',
    short: 'Season',
    read: 'How clearly the planting changes across the local year.',
  },
  {
    id: 'careEase',
    label: 'Care ease',
    short: 'Care',
    read: 'Low-maintenance fit after establishment.',
  },
];

export const GARDEN_YIELD_SITES: GardenYieldSite[] = [
  {
    id: 'balcony',
    label: 'Balcony pot',
    areaSqFt: 8,
    sun: 'full',
    drainage: 'fast',
    water: 'low',
    wildness: 42,
    read: 'A compact container set: low plants first, one visible bloom, no oversized scrub.',
  },
  {
    id: 'parkway',
    label: 'Parkway strip',
    areaSqFt: 24,
    sun: 'full',
    drainage: 'mixed',
    water: 'low',
    wildness: 62,
    read: 'A street-edge patch that can look a little loose while staying legible.',
  },
  {
    id: 'yard',
    label: 'Dry yard edge',
    areaSqFt: 64,
    sun: 'full',
    drainage: 'mixed',
    water: 'low',
    wildness: 70,
    read: 'A layered coastal-scrub edge with anchor shrubs, bloom, and shelter.',
  },
  {
    id: 'repair-patch',
    label: 'Repair patch',
    areaSqFt: 36,
    sun: 'part',
    drainage: 'fast',
    water: 'medium',
    wildness: 82,
    read: 'A loose restoration grammar for tired soil: fast bloom, nitrogen help, cover, structure.',
  },
];

export const GARDEN_YIELD_PLANTS: GardenYieldPlant[] = [
  {
    slug: 'seacliff-buckwheat',
    role: 'anchor',
    minSqFt: 8,
    containerFit: true,
    sun: ['full', 'part'],
    drainage: ['fast', 'mixed'],
    water: ['low'],
    wildness: 64,
    bestFor: ['parkway', 'yard', 'repair-patch'],
    quantityPer12SqFt: 0.8,
    placement: 'Use as the sunny anchor where drainage is real and flowerheads can stay visible.',
    establishment: 'Plant in the cool season, water deeply but infrequently through the first dry stretch.',
    maintenance: 'Let dry seedheads stand; shape lightly only after bloom.',
    value: ['host-plant symbolism', 'pollinator magnet', 'dune grammar'],
    scores: {
      pollinator: 96,
      waterFit: 88,
      habitat: 72,
      seasonal: 84,
      careEase: 76,
    },
  },
  {
    slug: 'beach-suncups',
    role: 'low bloom',
    minSqFt: 3,
    containerFit: true,
    sun: ['full'],
    drainage: ['fast'],
    water: ['low'],
    wildness: 46,
    bestFor: ['balcony', 'parkway', 'repair-patch'],
    quantityPer12SqFt: 2.4,
    placement: 'Put at the front edge or in sandy pockets where small yellow flowers can read low.',
    establishment: 'Use lean soil and avoid burying it under taller neighbors.',
    maintenance: 'Refresh with light reseeding or replacement if the patch thins out.',
    value: ['ground-level bloom', 'dune signal', 'container scale'],
    scores: {
      pollinator: 74,
      waterFit: 92,
      habitat: 46,
      seasonal: 80,
      careEase: 72,
    },
  },
  {
    slug: 'deerweed',
    role: 'repair',
    minSqFt: 10,
    containerFit: false,
    sun: ['full', 'part'],
    drainage: ['fast', 'mixed'],
    water: ['low', 'medium'],
    wildness: 86,
    bestFor: ['parkway', 'yard', 'repair-patch'],
    quantityPer12SqFt: 0.9,
    placement: 'Use where a looser restoration look is welcome and soil needs help.',
    establishment: 'Give room for airy stems and expect fast seasonal change.',
    maintenance: 'Cut back selectively after seed if it overwhelms smaller neighbors.',
    value: ['soil repair', 'insect food', 'fast early structure'],
    scores: {
      pollinator: 82,
      waterFit: 84,
      habitat: 78,
      seasonal: 76,
      careEase: 70,
    },
  },
  {
    slug: 'coyote-brush',
    role: 'structure',
    minSqFt: 18,
    containerFit: false,
    sun: ['full', 'part', 'soft'],
    drainage: ['fast', 'mixed', 'heavy'],
    water: ['low', 'medium'],
    wildness: 72,
    bestFor: ['yard', 'repair-patch', 'parkway'],
    quantityPer12SqFt: 0.45,
    placement: 'Set on the rear edge, wind side, or slope where evergreen mass is useful.',
    establishment: 'Water to settle roots, then step down to dry-season resilience.',
    maintenance: 'Choose a compact form for tight spots; prune after flowering if needed.',
    value: ['wind buffer', 'late-season pollen', 'small wildlife shelter'],
    scores: {
      pollinator: 78,
      waterFit: 82,
      habitat: 94,
      seasonal: 66,
      careEase: 82,
    },
  },
  {
    slug: 'lemonade-berry',
    role: 'large scrub',
    minSqFt: 36,
    containerFit: false,
    sun: ['full', 'part', 'soft'],
    drainage: ['fast', 'mixed', 'heavy'],
    water: ['low', 'medium'],
    wildness: 66,
    bestFor: ['yard'],
    quantityPer12SqFt: 0.22,
    placement: 'Reserve for a larger yard edge, privacy run, or slope with real room.',
    establishment: 'Plant young and let the root system claim its space before expecting mass.',
    maintenance: 'Prune for path clearance, not for a clipped-product shape.',
    value: ['bird value', 'privacy', 'coastal scrub mass'],
    scores: {
      pollinator: 72,
      waterFit: 78,
      habitat: 96,
      seasonal: 72,
      careEase: 80,
    },
  },
  {
    slug: 'coast-sunflower',
    role: 'bright note',
    minSqFt: 8,
    containerFit: true,
    sun: ['full', 'part'],
    drainage: ['fast', 'mixed'],
    water: ['low', 'medium'],
    wildness: 58,
    bestFor: ['balcony', 'parkway', 'yard', 'repair-patch'],
    quantityPer12SqFt: 1.2,
    placement: 'Place where informal yellow bloom can carry the patch from across the sidewalk.',
    establishment: 'Give sun, drainage, and enough room for a relaxed shape.',
    maintenance: 'Deadhead lightly if you want longer bloom; leave some seedheads for texture.',
    value: ['visual signal', 'pollinator traffic', 'fast gratification'],
    scores: {
      pollinator: 88,
      waterFit: 82,
      habitat: 62,
      seasonal: 92,
      careEase: 74,
    },
  },
];

export const GARDEN_YIELD_LOOP: GardenYieldLoopStep[] = [
  {
    phase: 'Read the site',
    timing: 'Before buying',
    action: 'Map sun, drainage, wind, foot traffic, and how wild the place is allowed to look.',
    check: 'If water sits after rain, raise the planting or choose the heavier-drainage plants.',
  },
  {
    phase: 'Plant with rain',
    timing: 'Nov-Feb',
    action: 'Install smaller plants into cool soil, mulch lightly with mineral material, and water deeply to settle roots.',
    check: 'Roots should be firm before the first long dry stretch.',
  },
  {
    phase: 'Step water down',
    timing: 'First spring-summer',
    action: 'Water less often but more deeply. Do not train roots to expect constant surface water.',
    check: 'Leaf curl at noon is less important than overnight recovery.',
  },
  {
    phase: 'Let value stay visible',
    timing: 'Year two',
    action: 'Keep seedheads, flowerheads, and loose scrub texture where they help insects and birds.',
    check: 'Prune for paths, safety, and neighbor legibility, not for catalog neatness.',
  },
];

export const GARDEN_YIELD_CONTEXT = {
  name: 'Garden value-yield system',
  url: 'https://pointcast.xyz/garden-yield',
  jsonUrl: 'https://pointcast.xyz/garden-yield.json',
  purpose:
    'Turn the El Segundo native planting palette from Block 0331 into an interactive site-fit, value-score, and establishment planner.',
  sourcePalette: NATIVE_PLANTING_PALETTE.map((plant) => ({
    slug: plant.slug,
    name: plant.name,
    scientific: plant.scientific,
    form: plant.form,
  })),
} as const;
