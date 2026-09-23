import rawBandmates from '../data/nouns-drum-club-bandmates.json' with { type: 'json' };
import { PAD_BY_ID } from './nouns-drum-club-audio.ts';
import { encodeScore, normalizeScore, type DrumScore } from './nouns-drum-club-score.ts';
import { NOUNS_BANDMATES_RELEASE, NOUNS_BANDMATES_RELEASE_DECLARED_LIVE } from './nouns-bandmates-mint.ts';

export const NOUNS_DRUM_CLUB_BANDMATES_STATUS = NOUNS_BANDMATES_RELEASE_DECLARED_LIVE ? 'live' as const : 'prepared' as const;
export const NOUNS_DRUM_CLUB_BANDMATES_BASE = 'https://pointcast.xyz' as const;
export const NOUNS_DRUM_CLUB_BANDMATES_PATH = '/nouns/drum-club/bandmates/' as const;

export type NounsDrumClubBandmateRole = 'drum' | 'bass' | 'mallet' | 'chord';

export type NounsDrumClubBandmate = {
  id: number;
  number: string;
  slug: string;
  name: string;
  role: NounsDrumClubBandmateRole;
  nounId: number;
  tempo: number;
  swing: number;
  color: string;
  description: string;
  artwork: { png: string; webp: string; svg: string };
  score: DrumScore;
};

const roles = new Set<NounsDrumClubBandmateRole>(['drum', 'bass', 'mallet', 'chord']);
const seenIds = new Set<number>();
const seenNumbers = new Set<string>();
const seenSlugs = new Set<string>();

function requireString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid bandmate ${field}`);
}

function validateBandmate(value: unknown, index: number): NounsDrumClubBandmate {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid bandmate row ${index}`);
  const row = value as Record<string, unknown>;
  if (row.id !== index || seenIds.has(index)) throw new Error(`Bandmate id must be the unique zero-based index: ${index}`);
  if (row.number !== String(index + 1).padStart(2, '0') || seenNumbers.has(String(row.number))) throw new Error(`Invalid bandmate number at ${index}`);
  requireString(row.slug, 'slug'); requireString(row.name, 'name'); requireString(row.description, 'description'); requireString(row.color, 'color');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug) || seenSlugs.has(row.slug)) throw new Error(`Invalid or duplicate bandmate slug: ${row.slug}`);
  if (typeof row.role !== 'string' || !roles.has(row.role as NounsDrumClubBandmateRole)) throw new Error(`Invalid bandmate role: ${row.role}`);
  if (!Number.isInteger(row.nounId) || Number(row.nounId) < 0 || Number(row.nounId) > 59) throw new Error(`Invalid local Noun id: ${row.nounId}`);
  if (!row.artwork || typeof row.artwork !== 'object' || Array.isArray(row.artwork)) throw new Error(`Invalid artwork for ${row.slug}`);
  const artwork = row.artwork as Record<string, unknown>;
  for (const format of ['png', 'webp', 'svg']) {
    requireString(artwork[format], `artwork.${format}`);
    const expected = `/images/nouns-drum-club/bandmates/${row.number}-${row.slug}.${format}`;
    if (artwork[format] !== expected) throw new Error(`Artwork path must be ${expected}`);
  }
  if (!row.score || typeof row.score !== 'object' || Array.isArray(row.score)) throw new Error(`Invalid score for ${row.slug}`);
  const sourceScore = row.score as Record<string, unknown>;
  if (sourceScore.version !== 1 || sourceScore.name !== row.name || sourceScore.tempo !== row.tempo || sourceScore.swing !== row.swing) {
    throw new Error(`Bandmate fields and score disagree for ${row.slug}`);
  }
  if (!Array.isArray(sourceScore.lanes) || sourceScore.lanes.length === 0) throw new Error(`Bandmate score needs lanes: ${row.slug}`);
  for (const lane of sourceScore.lanes) {
    if (!lane || typeof lane !== 'object' || Array.isArray(lane)) throw new Error(`Invalid lane for ${row.slug}`);
    const candidate = lane as Record<string, unknown>;
    if (typeof candidate.padId !== 'string' || !PAD_BY_ID.has(candidate.padId)) throw new Error(`Unknown pad for ${row.slug}: ${candidate.padId}`);
    if (!Array.isArray(candidate.steps) || candidate.steps.length !== 16 || candidate.steps.some((step) => typeof step !== 'number' || !Number.isFinite(step) || step < 0 || step > 1)) {
      throw new Error(`Invalid 16-step lane for ${row.slug}: ${candidate.padId}`);
    }
  }
  const score = normalizeScore(row.score);
  seenIds.add(index); seenNumbers.add(row.number); seenSlugs.add(row.slug);
  return Object.freeze({
    ...(row as unknown as Omit<NounsDrumClubBandmate, 'score' | 'artwork'>),
    artwork: Object.freeze(artwork as NounsDrumClubBandmate['artwork']),
    score: Object.freeze({ ...score, lanes: score.lanes.map((lane) => Object.freeze({ ...lane, steps: Object.freeze([...lane.steps]) as unknown as number[] })) }),
  }) as NounsDrumClubBandmate;
}

export const NOUNS_DRUM_CLUB_BANDMATES: readonly NounsDrumClubBandmate[] = Object.freeze(
  (rawBandmates as unknown[]).map(validateBandmate),
);

export function getNounsDrumClubBandmate(idOrSlug: number | string): NounsDrumClubBandmate | undefined {
  if (typeof idOrSlug === 'number' || /^\d+$/.test(idOrSlug)) {
    const id = Number(idOrSlug);
    return NOUNS_DRUM_CLUB_BANDMATES.find((bandmate) => bandmate.id === id);
  }
  return NOUNS_DRUM_CLUB_BANDMATES.find((bandmate) => bandmate.slug === idOrSlug);
}

export function nounsDrumClubBandmatePlayUrl(bandmate: NounsDrumClubBandmate): string {
  const url = new URL('/nouns/drum-club/', NOUNS_DRUM_CLUB_BANDMATES_BASE);
  url.searchParams.set('beat', encodeScore(bandmate.score));
  return url.href;
}

export function nounsDrumClubBandmateMetadataUrl(bandmate: NounsDrumClubBandmate): string {
  return `${NOUNS_DRUM_CLUB_BANDMATES_BASE}${NOUNS_DRUM_CLUB_BANDMATES_PATH}metadata/${bandmate.id}.json`;
}

export function nounsDrumClubBandmateMetadata(bandmate: NounsDrumClubBandmate) {
  const absolute = (path: string) => new URL(path, NOUNS_DRUM_CLUB_BANDMATES_BASE).href;
  const playUrl = nounsDrumClubBandmatePlayUrl(bandmate);
  const releaseToken = NOUNS_BANDMATES_RELEASE.tokens.find((token) => token.bandmateId === bandmate.id);
  const live = NOUNS_BANDMATES_RELEASE_DECLARED_LIVE && Boolean(releaseToken);
  return {
    schema: 'pointcast.collectible-preview/v1',
    status: live ? 'live' : 'prepared',
    minted: live,
    contract: live ? NOUNS_BANDMATES_RELEASE.contract : null,
    token: live ? releaseToken!.tokenId : null,
    name: `Nouns Drum Club ${bandmate.number} · ${bandmate.name}`,
    description: bandmate.description,
    decimals: 0,
    isBooleanAmount: false,
    displayUri: absolute(bandmate.artwork.png),
    thumbnailUri: absolute(bandmate.artwork.webp),
    artifactUri: absolute(bandmate.artwork.png),
    mime: 'image/png',
    formats: [
      { uri: absolute(bandmate.artwork.png), mimeType: 'image/png' },
      { uri: absolute(bandmate.artwork.webp), mimeType: 'image/webp' },
      { uri: absolute(bandmate.artwork.svg), mimeType: 'image/svg+xml' },
    ],
    publishers: ['PointCast'],
    date: '2026-09-22T00:00:00Z',
    language: 'en',
    rights: 'Underlying Noun artwork is CC0. The PointCast card and score are presented for remixing; no additional formal license has been selected.',
    sourceArtworkUri: `https://noun.pics/${bandmate.nounId}.svg`,
    localSourceArtworkUri: `${NOUNS_DRUM_CLUB_BANDMATES_BASE}/games/nouns-nation-battler/assets/noun-${bandmate.nounId}.svg`,
    sourceArtworkRights: 'Creative Commons CC0 1.0 Universal',
    sourceArtworkRightsUri: 'https://creativecommons.org/publicdomain/zero/1.0/',
    remixNote: 'Open project design: play, share, and remix the score. This statement is not an on-chain license grant.',
    tags: ['pointcast', 'nouns', 'nouns-drum-club', 'bandmate', bandmate.role, 'music', 'remix'],
    attributes: [
      { name: 'collection_status', value: live ? 'live' : 'prepared' },
      { name: 'bandmate_number', value: bandmate.number },
      { name: 'catalog_id', value: String(bandmate.id) },
      { name: 'noun_id', value: String(bandmate.nounId) },
      { name: 'role', value: bandmate.role },
      { name: 'bpm', value: String(bandmate.tempo) },
      { name: 'swing', value: String(bandmate.swing) },
      { name: 'score_version', value: String(bandmate.score.version) },
      { name: 'steps', value: '16' },
    ],
    externalUri: playUrl,
    playUri: playUrl,
    homepage: `${NOUNS_DRUM_CLUB_BANDMATES_BASE}${NOUNS_DRUM_CLUB_BANDMATES_PATH}`,
    metadataUri: nounsDrumClubBandmateMetadataUrl(bandmate),
    score: bandmate.score,
    boundaries: live ? [
      'This metadata describes a playable Tezos collectible.',
      'Opening the play link does not autoplay audio.',
    ] : [
      'This is preview metadata for a playable collectible preparing to launch.',
      'No verified contract or wallet action is available for this preview.',
      'Opening the play link does not autoplay audio.',
    ],
  } as const;
}
