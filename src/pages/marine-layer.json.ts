import type { APIRoute } from 'astro';
import {
  FIRST_MARINE_FORMAT,
  MARINE_LAYER_PRINCIPLES,
  MARINE_LAYER_SESSIONS,
  MARINE_LAYER_STEWARDSHIP,
} from '../lib/marineLayer';
import {
  BURN_OFF_DEFINITION,
  DECK_CEILING_FT,
  DECK_COVERS,
  HOLD_MINUTES,
  formatClock,
  latestJudged,
  resolveSeason,
  summariseByMonth,
} from '../lib/burnoff';
import type { BurnOffRecord } from '../lib/burnoff';
import rawRecord from '../lib/burnoff-record.json';

const record = rawRecord as unknown as BurnOffRecord;
const season = resolveSeason(record.days);
const latest = latestJudged(season);
const months = summariseByMonth(season);

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/marine-layer.json',
    name: 'Marine Layer',
    subtitle: 'A place-based meditative program, and the fog log that keeps it honest.',
    paperNumber: 'UES-WP-2026-01',
    track: 'Track 07 · air',
    thesis:
      'Eight weeks of sitting in eight El Segundo places, paired with a twelve-month record of what the sky actually did on those mornings. The curriculum tells you where to sit. The record tells you what was over you while you sat there.',
    authors: [{ name: 'The Marine Layer Cohort', dept: 'University of El Segundo', email: 'cohort@pointcast.xyz' }],

    burnOff: {
      question: 'When did the marine layer break?',
      definition: BURN_OFF_DEFINITION,
      rule: {
        deckCovers: DECK_COVERS,
        deckCeilingFeet: DECK_CEILING_FT,
        holdMinutes: HOLD_MINUTES,
        states: ['opened', 'never', 'no-layer', 'no-record'],
        stateMeanings: {
          opened: 'The deck broke at a time we can name and it stayed broken.',
          never: 'It was still grey when we stopped watching at 2pm.',
          'no-layer': 'There was nothing over you at dawn to burn off.',
          'no-record': 'The station did not report enough of the morning to judge.',
        },
        appliedAt: 'read time — nothing is written down as a status, because this site has no cron',
        source: 'src/lib/burnoff.ts',
      },
      station: {
        id: record.station,
        name: record.stationName,
        note: record.stationNote,
        archive: record.source,
        timezone: record.timezone,
      },
      record: {
        fetchedAt: record.fetchedAt,
        firstDate: record.firstDate,
        lastDate: record.lastDate,
        dayCount: record.dayCount,
        note: 'Committed to git and never fetched at build time. Refresh with `node scripts/fetch-burnoff.mjs`.',
      },
      latest: latest
        ? {
            date: latest.date,
            state: latest.state,
            openedAtMinute: latest.openedAtMinute,
            openedAt: latest.openedAtMinute === null ? null : formatClock(latest.openedAtMinute),
            sunriseMinute: latest.sunriseMinute,
            sunrise: formatClock(latest.sunriseMinute),
            lowestCeilingFeet: latest.lowestCeilingFt,
          }
        : null,
      months,
      days: season.map((day) => ({
        date: day.date,
        state: day.state,
        openedAtMinute: day.openedAtMinute,
        sunriseMinute: day.sunriseMinute,
        lowestCeilingFeet: day.lowestCeilingFt,
        observations: day.observationCount,
      })),
    },

    sessions: MARINE_LAYER_SESSIONS,
    firstSitFormat: FIRST_MARINE_FORMAT,
    stewardship: MARINE_LAYER_STEWARDSHIP,
    principles: MARINE_LAYER_PRINCIPLES,

    counts: {
      sessions: MARINE_LAYER_SESSIONS.length,
      formatSegments: FIRST_MARINE_FORMAT.length,
      stewardshipRoles: MARINE_LAYER_STEWARDSHIP.length,
      principles: MARINE_LAYER_PRINCIPLES.length,
      recordedDays: season.length,
      openedDays: season.filter((d) => d.state === 'opened').length,
      neverOpenedDays: season.filter((d) => d.state === 'never').length,
      noLayerDays: season.filter((d) => d.state === 'no-layer').length,
      unjudgedDays: season.filter((d) => d.state === 'no-record').length,
    },

    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/marine-layer',
    parent: 'https://pointcast.xyz/university-of-el-segundo',
    citation:
      'University of El Segundo. (2026). Marine Layer: A Place-Based Meditative Program. UES-WP-2026-01. https://pointcast.xyz/marine-layer',
    // Only routes that render. /geology and /commons are cited by sibling
    // wings but have no page in this repo — geology exists as JSON only.
    related: {
      ues: 'https://pointcast.xyz/university-of-el-segundo',
      oceanWing: 'https://pointcast.xyz/ocean-wing',
      fire: 'https://pointcast.xyz/fire',
      localStarCommons: 'https://pointcast.xyz/local-star-commons',
      commonForms: 'https://pointcast.xyz/common-forms',
      course: 'https://pointcast.xyz/ues/marine-layer-weather-light-daily-seeing',
      geologyJson: 'https://pointcast.xyz/geology.json',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
