/**
 * /operating-mode.schema.json — JSON Schema for /operating-mode.json.
 *
 * Codex 2026-05-07 review (PR 3 — agent discovery surfaces). Defines the
 * shape of the operating-mode payload so agents and automation can
 * validate updates before posting them. The schema's `$id` matches the
 * URL it's served at, per JSON Schema convention.
 *
 * Schema is hand-maintained alongside the data file. Either evolve in
 * lockstep or version the schema (`$id` includes a date suffix) before
 * shipping a breaking change.
 */
import type { APIRoute } from 'astro';

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://pointcast.xyz/operating-mode.schema.json',
  title: 'PointCast Operating Mode',
  description:
    "Hand-curated snapshot of work in flight on PointCast. Agents (cc, codex, manus) update src/data/operating-mode.json when sprints open, ship, or pivot. The homepage's IN FLIGHT column reads from this file at build time. /operating-mode.json mirrors it for agent consumption.",
  type: 'object',
  required: ['updatedAt', 'updatedBy', 'inFlight'],
  additionalProperties: false,
  properties: {
    $schema: {
      type: 'string',
      const: 'https://pointcast.xyz/operating-mode.schema.json',
      description: 'JSON Schema reference; matches the route this schema is served at.',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'ISO timestamp of the last hand-edit. Should match what surfaces in the homepage IN FLIGHT eyebrow.',
    },
    updatedBy: {
      type: 'string',
      enum: ['mh', 'cc', 'codex', 'manus'],
      description: 'Resident slug for the agent or human who last touched the file.',
    },
    note: {
      type: 'string',
      description: 'Optional human-readable note about how this file is maintained.',
    },
    inFlight: {
      type: 'array',
      maxItems: 12,
      description:
        'Items currently in motion. Order matters — first item is most prominent on the homepage.',
      items: {
        type: 'object',
        required: ['id', 'title', 'kind', 'ref', 'owner', 'stage'],
        additionalProperties: false,
        properties: {
          id: {
            type: 'string',
            pattern: '^[a-z0-9-]{2,64}$',
            description: 'Stable slug for cross-referencing across briefs / receipts.',
          },
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 160,
            description: 'Human-readable headline (one line, plain text).',
          },
          kind: {
            type: 'string',
            enum: ['PR', 'PLAN', 'BRIEF', 'SPIKE', 'REVIEW', 'INCIDENT', 'TICKET'],
            description: 'What kind of work is in flight. PR is most common; PLAN is queued; SPIKE is exploratory.',
          },
          ref: {
            type: 'string',
            pattern: '^([0-9]{1,5}|tbd)$',
            description: "GitHub PR number, ticket id, or 'tbd' if not yet filed.",
          },
          url: {
            type: ['string', 'null'],
            format: 'uri',
            description: 'Canonical URL for the work item, or null if not yet linkable.',
          },
          owner: {
            type: 'string',
            enum: ['mh', 'cc', 'codex', 'manus'],
            description: 'Resident currently driving the item.',
          },
          stage: {
            type: 'string',
            enum: ['drafting', 'review', 'merging', 'shipped', 'queued', 'blocked', 'paused'],
            description: 'Lifecycle position. Items with stage=shipped should drop off within a day.',
          },
        },
      },
    },
  },
  examples: [
    {
      $schema: 'https://pointcast.xyz/operating-mode.schema.json',
      updatedAt: '2026-05-07T17:35:00Z',
      updatedBy: 'cc',
      inFlight: [
        {
          id: 'studio-v2-publish',
          title: 'Studio v2.3 — real publish via PC_STUDIO_KV',
          kind: 'PR',
          ref: '464',
          url: 'https://github.com/mhoydich/pointcast/pull/464',
          owner: 'cc',
          stage: 'review',
        },
      ],
    },
  ],
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(schema, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/schema+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
