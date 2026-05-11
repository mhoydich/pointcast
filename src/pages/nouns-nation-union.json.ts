import type { APIRoute } from 'astro';
import {
  NOUNS_STATE_ARTIFACT_KINDS,
  NOUNS_STATE_FOUNDING_DROPS,
  NOUNS_STATE_LEAGUE_FORMAT,
  NOUNS_STATE_LEAGUE_PARTICIPATION,
  NOUNS_STATE_LEAGUE_REGIONS,
  NOUNS_STATE_LEAGUE_TEAMS,
  NOUNS_STATE_LEAGUE_VERSION,
  buildNounsStateCampaignPack,
  buildNounsStateAgencyPosterRun,
  buildNounsStateDropGallery,
  buildNounsStateManusArtifactRun,
  buildNounsStateNightSlate,
  buildNounsStateArtifactPack,
} from '../lib/nouns-state-league';

const manus50 = buildNounsStateManusArtifactRun();
const agency50 = buildNounsStateAgencyPosterRun();
const stateNightSlates = NOUNS_STATE_LEAGUE_REGIONS.map((region) => buildNounsStateNightSlate(region));
const foundingDrops = NOUNS_STATE_FOUNDING_DROPS.map((drop) => {
  const team = NOUNS_STATE_LEAGUE_TEAMS.find((item) => item.code === drop.code);
  return {
    ...drop,
    team,
    campaignPack: team ? buildNounsStateCampaignPack(team, drop) : '',
    gallery: team ? buildNounsStateDropGallery(team, drop) : null,
  };
});

export const GET: APIRoute = () => new Response(JSON.stringify({
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  version: NOUNS_STATE_LEAGUE_VERSION,
  name: NOUNS_STATE_LEAGUE_FORMAT.name,
  human: 'https://pointcast.xyz/nouns-nation-union/',
  artifacts: 'https://pointcast.xyz/nouns-nation-union/artifacts/',
  battler: 'https://pointcast.xyz/nouns-nation-battler/',
  manifest: 'https://pointcast.xyz/nouns-nation-battler.json',
  summary: 'A 50-state Nouns Nation Battler expansion concept where each US state has a state-rooted Nouns team, field, signature move, fan ritual, and contribution lane.',
  format: NOUNS_STATE_LEAGUE_FORMAT,
  participation: NOUNS_STATE_LEAGUE_PARTICIPATION,
  stateNight: {
    human: 'https://pointcast.xyz/nouns-nation-union/state-night/',
    goalPreset: 'https://pointcast.xyz/goal?preset=nouns-union-state-night#setup',
    regions: stateNightSlates.map((slate) => slate.region),
    sampleSlate: stateNightSlates.find((slate) => slate.region === 'Pacific') ?? stateNightSlates[0],
    guardrail: 'Fictional Nouns sports broadcast only; no official sports marks, no live-result claim, no betting, no checkout, no promised payout, and human approval before sponsor or participant-credit work.',
  },
  artifactStudio: {
    human: 'https://pointcast.xyz/nouns-nation-union/artifacts/',
    goalPreset: 'https://pointcast.xyz/goal?preset=nouns-union-manus-50#setup',
    model: 'ChatGPT image-generation prompt desk',
    guardrail: 'Use original Nouns-style art direction; do not use official sports marks, real league logos, betting claims, or official relationship claims.',
    kinds: NOUNS_STATE_ARTIFACT_KINDS,
    foundingDrops,
    dropGallery: foundingDrops.map((drop) => drop.gallery).filter(Boolean),
    manus50,
    agency50,
    packs: NOUNS_STATE_LEAGUE_TEAMS.map((team) => buildNounsStateArtifactPack(team)),
  },
  teams: NOUNS_STATE_LEAGUE_TEAMS,
}, null, 2), {
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=300',
  },
});
