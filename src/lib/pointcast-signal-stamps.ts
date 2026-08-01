import teamsSource from '../data/pointcast-signal-stamps.json';
import contractSource from '../data/saturday-signal-stamps-contract.json';

export const SATURDAY_SIGNAL_STAMPS = {
  spec: 'pointcast.saturday-signal-stamps/v1', title: 'Saturday Signal Stamps', issue: 'College 50 / Field Edition 2026',
  publishedAt: '2026-08-01T00:00:00-07:00', canonical: 'https://pointcast.xyz/25/collect/signal-stamps',
  socialImage: 'https://pointcast.xyz/images/pointcast-signal-stamps/social-card.png',
  collectionSheet: '/images/pointcast-signal-stamps/collection-sheet.png', provenance: '/collectibles/saturday-signal-stamps/provenance/manifest.json',
  contractMetadata: '/collectibles/saturday-signal-stamps/contract.json',
  dek: 'Fifty unofficial field spirits, composed from local materials and campus design research. Take a stamp, wear a profile, hang a wallpaper, or collect a free Tezos edition.',
  boundary: 'Unofficial editorial artwork. PointCast is not affiliated with or endorsed by any school, conference, athletic program, or design school. No official logos or mascot artwork are used.',
  license: 'CC0 1.0 Universal — public-domain dedication where legally possible.',
  press: ['ChatGPT image generation · three art-direction masters','Midjourney · two visual studies','Qwen-Image · one print-lab study','PointCast composite press · 150 final field assets'],
  trendLens: ['imperfect by design','tactile texture','neo-deco geometry','playful surrealism','local flavor'],
} as const;

export const SATURDAY_SIGNAL_CONTRACT = contractSource;
export const SATURDAY_SIGNAL_TEAMS = teamsSource.map((team) => ({ ...team, fieldNumber: team.id + 1,
  stampUrl: `/images/pointcast-signal-stamps/stamps/${team.slug}.png`, profileUrl: `/images/pointcast-signal-stamps/profiles/${team.slug}.png`,
  wallpaperUrl: `/images/pointcast-signal-stamps/wallpapers/${team.slug}.webp`, metadataUrl: `/collectibles/saturday-signal-stamps/metadata/${team.id}.json`,
}));
export const SATURDAY_SIGNAL_CONFERENCES = Array.from(new Set(SATURDAY_SIGNAL_TEAMS.map((team) => team.conference))).sort();
