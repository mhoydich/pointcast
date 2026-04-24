export const POINTCAST_IMAGE_GENERATOR = {
  provider: 'OpenAI',
  model: 'gpt-image-2',
  family: 'GPT Image',
  role: 'default PointCast image generator',
  api: 'Images API',
  size: '1024x1024',
  aspectRatio: '1:1',
  quality: 'high',
  outputFormat: 'png',
  requestedAt: '2026-04-21',
  requestedBy: 'Mike Hoydich',
  publicDocsReferenceModel: 'gpt-image-1.5',
  publicDocsCheckedAt: '2026-04-21',
} as const;

export type StampImagePromptInput = {
  code: string;
  name: string;
  shortName: string;
  band: string;
  direction: string;
  miles: number;
  color: string;
  routeNote: string;
  localAction: string;
};

export function passportStampImagePrompt(stamp: StampImagePromptInput): string {
  return [
    'Create a square collectible passport stamp illustration for PointCast.',
    `Station: ${stamp.name}. Code: ${stamp.code}.`,
    `Band: ${stamp.band}. Direction: ${stamp.direction}. Distance from El Segundo: ${stamp.miles} miles.`,
    `Primary ink color: ${stamp.color}.`,
    `Local action cue: ${stamp.localAction}. Route note: ${stamp.routeNote}`,
    'Style: California civic ephemera, municipal transit stamp, small broadcast-station badge, clean ink texture, hard-edged geometry, lightly imperfect rubber-stamp edges.',
    'Composition: centered stamp emblem, readable station name, tiny POINTCAST mark, no photoreal people, no busy background, transparent or plain off-white background.',
  ].join(' ');
}

export function passportStampImageSpec(stamp: StampImagePromptInput) {
  const slug = stamp.shortName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return {
    generator: POINTCAST_IMAGE_GENERATOR.model,
    provider: POINTCAST_IMAGE_GENERATOR.provider,
    size: POINTCAST_IMAGE_GENERATOR.size,
    aspectRatio: POINTCAST_IMAGE_GENERATOR.aspectRatio,
    quality: POINTCAST_IMAGE_GENERATOR.quality,
    outputFormat: POINTCAST_IMAGE_GENERATOR.outputFormat,
    suggestedPath: `/images/passport/${stamp.code.toLowerCase()}-${slug}.png`,
    prompt: passportStampImagePrompt(stamp),
  };
}
