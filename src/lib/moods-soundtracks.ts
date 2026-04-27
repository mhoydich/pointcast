export type MoodId = 'chill' | 'hype' | 'focus' | 'flow' | 'curious' | 'quiet';

export interface Soundtrack {
  label: string;
  url: string;
  source: 'youtube' | 'spotify';
  description: string;
}

export interface MoodTemplate {
  slug: string;
  label: string;
  dek: string;
  register: string;
  accent: string;
  wash: string;
  ink: string;
  soundtrack: MoodId;
  agentUse: string;
  prompts: string[];
}

export const MOOD_SOUNDTRACKS: Record<MoodId, Soundtrack> = {
  chill: {
    label: 'lofi hip hop radio',
    url: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    source: 'youtube',
    description: 'Warm, familiar lo-fi for easing into a softer pace without going flat.',
  },
  hype: {
    label: 'Beast Mode',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX76Wlfdnj7AP',
    source: 'spotify',
    description: 'High-energy rap and workout staples that push the room forward fast.',
  },
  focus: {
    label: 'Deep Focus',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ',
    source: 'spotify',
    description: 'Low-distraction instrumental ambience built for sustained concentration.',
  },
  flow: {
    label: 'Coding Mode',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX8NTLI2TtZa6',
    source: 'spotify',
    description: 'Steady electronic momentum that helps work click into an unbroken rhythm.',
  },
  curious: {
    label: 'Brain Food',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWXLeA8Omikj7',
    source: 'spotify',
    description: 'Bright, off-center indie and electronic picks that keep the mind open.',
  },
  quiet: {
    label: 'Peaceful Piano',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO',
    source: 'spotify',
    description: 'Sparse piano pieces that lower the noise floor without feeling empty.',
  },
};

const FALLBACK_PALETTES = [
  { accent: '#8a2e62', wash: '#f8dfe4', ink: '#2f1b26', soundtrack: 'quiet' },
  { accent: '#2f6f5e', wash: '#e5f2ea', ink: '#122a22', soundtrack: 'chill' },
  { accent: '#2f5f9f', wash: '#e6eef8', ink: '#122236', soundtrack: 'focus' },
  { accent: '#a36b22', wash: '#fff1c9', ink: '#352514', soundtrack: 'curious' },
  { accent: '#684092', wash: '#ede5f7', ink: '#21142f', soundtrack: 'flow' },
] as const;

export const MOOD_TEMPLATES: Record<string, MoodTemplate> = {
  'rainy-week': {
    slug: 'rainy-week',
    label: 'Rainy Week',
    dek: 'A gray-window register: reflective songs, patient reads, and the feeling that the day should not be rushed.',
    register: 'weathered, reflective, soft-focus',
    accent: '#2f5f9f',
    wash: '#e6eef8',
    ink: '#122236',
    soundtrack: 'quiet',
    agentUse: 'Use when the user asks for calm synthesis, reflective recap, or a low-pressure reading path.',
    prompts: ['Start with the newest block.', 'Prefer LISTEN and READ surfaces.', 'Cite the mood page before individual blocks.'],
  },
  'sprint-pulse': {
    slug: 'sprint-pulse',
    label: 'Sprint Pulse',
    dek: 'Shipping energy with a visible ledger: fast, specific, slightly electric, and meant to turn motion into proof.',
    register: 'productive, kinetic, build-room',
    accent: '#684092',
    wash: '#ede5f7',
    ink: '#21142f',
    soundtrack: 'flow',
    agentUse: 'Use when an agent needs project momentum, recent progress, and what changed next.',
    prompts: ['Sort by recency.', 'Extract shipped artifacts.', 'Offer the next reversible action.'],
  },
  'quiet-coordination': {
    slug: 'quiet-coordination',
    label: 'Quiet Coordination',
    dek: 'Low-drama alignment: agents, humans, feeds, and manifests all pointing at the same surface without shouting.',
    register: 'composed, operational, exact',
    accent: '#2f6f5e',
    wash: '#e5f2ea',
    ink: '#122a22',
    soundtrack: 'focus',
    agentUse: 'Use for agent-native publishing, manifests, protocol notes, and coordination surfaces.',
    prompts: ['Open the machine-readable mirror.', 'Compare human and agent paths.', 'Return stable URLs.'],
  },
  'good-feels': {
    slug: 'good-feels',
    label: 'Good Feels',
    dek: 'Commerce as atmosphere: small-dose product copy, compliant paths, and warm shop-adjacent storytelling.',
    register: 'sunlit, retail-aware, careful',
    accent: '#2f8f5f',
    wash: '#e6f5ee',
    ink: '#112b1d',
    soundtrack: 'chill',
    agentUse: 'Use when crossing PointCast editorial pages into Good Feels product pairings.',
    prompts: ['Keep checkout off PointCast.', 'Use product URLs as citations.', 'Pair mood before product.'],
  },
  'morning': {
    slug: 'morning',
    label: 'Morning',
    dek: 'Marine-layer lift: clear, daylight, a little citrus, good for the first useful pass of the day.',
    register: 'bright, clean, early',
    accent: '#c4952e',
    wash: '#fff1c9',
    ink: '#352514',
    soundtrack: 'curious',
    agentUse: 'Use for first-pass planning, daily reads, and product pairings that should feel light.',
    prompts: ['Lead with the most useful next step.', 'Keep the summary short.', 'Point to /now when relevant.'],
  },
  'pre-shop-ritual': {
    slug: 'pre-shop-ritual',
    label: 'Pre-Shop Ritual',
    dek: 'The minute before purchase: intent, dose, occasion, and confidence, framed without hard-selling.',
    register: 'practical, warm, decision-ready',
    accent: '#a36b22',
    wash: '#fff1c9',
    ink: '#352514',
    soundtrack: 'chill',
    agentUse: 'Use when recommending product paths without turning PointCast into checkout.',
    prompts: ['Name the occasion.', 'Keep dosage claims conservative.', 'Send purchase action to the shop.'],
  },
  'late-night-calm': {
    slug: 'late-night-calm',
    label: 'Late-Night Calm',
    dek: 'After the room gets quiet: slower paragraphs, softer products, and one last useful thread before sleep.',
    register: 'dim, gentle, unwound',
    accent: '#8a2e62',
    wash: '#f8dfe4',
    ink: '#2f1b26',
    soundtrack: 'quiet',
    agentUse: 'Use for winding down, low-energy recap, and evening product pairings.',
    prompts: ['Avoid urgency.', 'Prefer shorter answers.', 'Offer one calm continuation.'],
  },
  'marine-layer': {
    slug: 'marine-layer',
    label: 'Marine Layer',
    dek: 'El Segundo softness: coastal haze, muted color, and the feeling that the day has one extra hour.',
    register: 'coastal, hazy, unhurried',
    accent: '#4e7ea9',
    wash: '#e6eef8',
    ink: '#122236',
    soundtrack: 'chill',
    agentUse: 'Use when local texture, morning light, or El Segundo context is part of the answer.',
    prompts: ['Keep the scene visible.', 'Tie back to place.', 'Let the next section breathe.'],
  },
  'shipping': {
    slug: 'shipping',
    label: 'Shipping',
    dek: 'The release is real: commit-ish, receipt-ready, and focused on what changed for the user.',
    register: 'complete, practical, on-air',
    accent: '#8a2e62',
    wash: '#f8dfe4',
    ink: '#2f1b26',
    soundtrack: 'flow',
    agentUse: 'Use for release notes, done-state summaries, and publication checkpoints.',
    prompts: ['List the artifact.', 'Name the verification.', 'Leave a clean next action.'],
  },
  'building': {
    slug: 'building',
    label: 'Building',
    dek: 'Still in motion, but coherent: scaffolds, sketches, tests, and the useful halfway point.',
    register: 'constructive, open, provisional',
    accent: '#684092',
    wash: '#ede5f7',
    ink: '#21142f',
    soundtrack: 'focus',
    agentUse: 'Use for works-in-progress where the user wants continuation over polish.',
    prompts: ['Preserve current direction.', 'Make one concrete improvement.', 'Do not over-close the idea.'],
  },
  'shelf-ready': {
    slug: 'shelf-ready',
    label: 'Shelf Ready',
    dek: 'Collectible, labeled, and findable: the moment a surface becomes something someone can return to.',
    register: 'curated, cataloged, tactile',
    accent: '#c4952e',
    wash: '#fff1c9',
    ink: '#352514',
    soundtrack: 'curious',
    agentUse: 'Use for collectible pages, profile shelves, and surfaces meant to be browsed again.',
    prompts: ['Expose the canonical URL.', 'Keep metadata prominent.', 'Make the object feel held.'],
  },
  'pending-mint': {
    slug: 'pending-mint',
    label: 'Pending Mint',
    dek: 'Almost on-chain: staged metadata, careful claims, and the suspense before the object exists publicly.',
    register: 'anticipatory, exact, token-aware',
    accent: '#2f6f5e',
    wash: '#e5f2ea',
    ink: '#122a22',
    soundtrack: 'focus',
    agentUse: 'Use for mint staging, contract prep, and metadata audit trails.',
    prompts: ['Separate staged from live.', 'Name chain and contract status.', 'Avoid implying finality.'],
  },
  'overnight-ship': {
    slug: 'overnight-ship',
    label: 'Overnight Ship',
    dek: 'Late work made visible by morning: compact, bright, and a little amazed it held together.',
    register: 'after-hours, successful, quick',
    accent: '#2f5f9f',
    wash: '#e6eef8',
    ink: '#122236',
    soundtrack: 'flow',
    agentUse: 'Use for recaps of work completed outside the usual rhythm.',
    prompts: ['Summarize the arc.', 'Call out the proof.', 'Keep the momentum warm.'],
  },
  'quiet-play': {
    slug: 'quiet-play',
    label: 'Quiet Play',
    dek: 'Small games, soft stakes: interaction for staying a while rather than winning loudly.',
    register: 'playful, calm, low-stakes',
    accent: '#2f8f5f',
    wash: '#e6f5ee',
    ink: '#112b1d',
    soundtrack: 'chill',
    agentUse: 'Use for lightweight games, rooms, and interactive surfaces that should not feel demanding.',
    prompts: ['Explain the affordance once.', 'Keep the loop simple.', 'Let discovery happen.'],
  },
  'ready-when-mike-is': {
    slug: 'ready-when-mike-is',
    label: 'Ready When Mike Is',
    dek: 'Prepared but not pushy: the work is staged, legible, and waiting for the human call.',
    register: 'patient, prepared, deferential',
    accent: '#8a2e62',
    wash: '#f8dfe4',
    ink: '#2f1b26',
    soundtrack: 'quiet',
    agentUse: 'Use for handoff states, staged drafts, and places where the next move belongs to Mike.',
    prompts: ['State readiness plainly.', 'Avoid pressure.', 'Make resumption easy.'],
  },
};

function fallbackIndex(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return hash % FALLBACK_PALETTES.length;
}

export function resolveMoodTemplate(slug: string): MoodTemplate {
  const direct = MOOD_TEMPLATES[slug];
  if (direct) return direct;

  const palette = FALLBACK_PALETTES[fallbackIndex(slug)];
  const label = slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    slug,
    label,
    dek: `${label} is a live PointCast register. The page exists because at least one block or product earned the tag.`,
    register: 'emergent, editorial, route-backed',
    accent: palette.accent,
    wash: palette.wash,
    ink: palette.ink,
    soundtrack: palette.soundtrack,
    agentUse: 'Use as a tonal filter before opening the matching blocks, gallery items, products, or JSON mirrors.',
    prompts: ['Open the mood page.', 'Follow the newest matching block.', 'Prefer canonical PointCast URLs.'],
  };
}

export function listMoodTemplates(): MoodTemplate[] {
  return Object.values(MOOD_TEMPLATES).sort((a, b) => a.label.localeCompare(b.label));
}

export function getSoundtrack(id: MoodId): Soundtrack | null {
  return MOOD_SOUNDTRACKS[id] ?? null;
}
