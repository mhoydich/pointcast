#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const baselinePath = resolve(root, 'src/data/civic-packet-watch.json');
const apiKey = process.env.FIRECRAWL_API_KEY;
const outputArg = process.argv.find((arg) => arg.startsWith('--output='));
const stamp = new Date().toISOString().replaceAll(':', '').replaceAll('.', '');
const outputPath = outputArg
  ? resolve(process.cwd(), outputArg.slice('--output='.length))
  : resolve(tmpdir(), `pointcast-civic-packet-watch-candidate-${stamp}.json`);

if (!apiKey) {
  console.error('FIRECRAWL_API_KEY is required. No source request was made and no file was written.');
  process.exit(1);
}

const sourceSpecs = [
  {
    id: 'es-agendas',
    url: 'https://www.elsegundo.gov/government/departments/city-clerk/agendas-minutes',
    prompt: 'Extract only upcoming public meeting rows. Preserve the official title, date and time, whether an agenda is included, agenda label and URL if present, event URL if present, and cancellation wording. Do not infer missing documents or summarize people.',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        meetings: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string' },
              dateText: { type: 'string' },
              status: { type: 'string' },
              agendaIncluded: { type: 'boolean' },
              agendaLabel: { type: ['string', 'null'] },
              agendaUrl: { type: ['string', 'null'] },
              eventUrl: { type: ['string', 'null'] },
            },
            required: ['title', 'dateText', 'status', 'agendaIncluded'],
          },
        },
      },
      required: ['meetings'],
    },
  },
  {
    id: 'es-rfp',
    url: 'https://www.elsegundo.gov/government/departments/city-clerk/bid-rfp',
    prompt: 'Extract only the current Bid/RFP table. Preserve reference number, title, start, close, status, detail URL, and any visible warning that bidders must check for addenda. Do not infer eligibility or deadlines.',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              reference: { type: 'string' },
              title: { type: 'string' },
              startText: { type: 'string' },
              closeText: { type: 'string' },
              status: { type: 'string' },
              detailUrl: { type: ['string', 'null'] },
            },
            required: ['reference', 'title', 'startText', 'closeText', 'status'],
          },
        },
        addendaWarning: { type: ['string', 'null'] },
      },
      required: ['opportunities'],
    },
  },
  {
    id: 'rfq-26-05-packet',
    url: 'https://www.elsegundo.gov/home/showpublisheddocument/13238/639195380156630000',
    prompt: 'Extract the formal schedule and high-level public-art opportunity facts from this official PDF. Preserve displayed dates and times exactly. Extract total budget, shortlist count, honorarium, and submission deadline. Do not extract personal contact details or application contents.',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        reference: { type: 'string' },
        title: { type: 'string' },
        questionsDeadline: { type: 'string' },
        answersExpected: { type: 'string' },
        submissionDeadline: { type: 'string' },
        totalBudgetUsd: { type: 'number' },
        shortlistCount: { type: 'number' },
        honorariumUsd: { type: 'number' },
      },
      required: ['reference', 'title', 'questionsDeadline', 'submissionDeadline'],
    },
  },
];

async function scrape(spec) {
  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: spec.url,
      formats: [{ type: 'json', prompt: spec.prompt, schema: spec.schema }],
      onlyMainContent: true,
      maxAge: 0,
      timeout: 60000,
      parsers: ['pdf'],
      location: { country: 'US', languages: ['en-US'] },
      removeBase64Images: true,
      blockAds: true,
      proxy: 'auto',
    }),
    signal: AbortSignal.timeout(75000),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) {
    throw new Error(`${spec.id}: Firecrawl ${response.status} ${payload.error || 'request failed'}`);
  }
  const extracted = payload.data?.json;
  if (!extracted || typeof extracted !== 'object') {
    throw new Error(`${spec.id}: Firecrawl returned no structured JSON`);
  }
  return {
    id: spec.id,
    url: spec.url,
    checkedAt: new Date().toISOString(),
    sourceStatus: payload.data?.metadata?.statusCode ?? null,
    firecrawlWarning: payload.warning ?? null,
    hash: createHash('sha256').update(JSON.stringify(extracted)).digest('hex'),
    extracted,
  };
}

const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
const results = [];
const failures = [];

for (const spec of sourceSpecs) {
  try {
    results.push(await scrape(spec));
  } catch (error) {
    failures.push({ id: spec.id, url: spec.url, error: error instanceof Error ? error.message : String(error) });
  }
}

const candidate = {
  candidateSchemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  publicBaseline: {
    schemaVersion: baseline.schemaVersion,
    checkedAt: baseline.checkedAt,
    signals: baseline.signals.length,
    sources: baseline.sources.length,
  },
  policy: {
    publication: 'human-review-required',
    robots: 'enforced-by-default',
    accessControlBypass: false,
    automaticPromotion: false,
    personalProfiles: false,
  },
  results,
  failures,
  reviewChecklist: [
    'Open every official source URL.',
    'Compare extracted dates and times character-for-character with the source.',
    'Preserve conflicts rather than choosing a value silently.',
    'Call the first observation baseline; compare later snapshots before using changed.',
    'Run node scripts/audit-civic-packet-watch.mjs after promoting reviewed data.',
  ],
};

await writeFile(outputPath, `${JSON.stringify(candidate, null, 2)}\n`, { flag: 'wx' });
console.log(`Civic Packet Watch candidate written to ${outputPath}`);
console.log(`sources_ok=${results.length} sources_failed=${failures.length} file=${basename(outputPath)}`);
if (failures.length) process.exitCode = 2;
