import type { APIRoute } from 'astro';

const invitation = {
  schema: 'https://pointcast.xyz/schemas/field-invitation/v1',
  id: 'PC-FIELD-001',
  status: 'live',
  title: 'Find the seat nobody designed',
  dek: 'Look for something that was not sold as furniture, but quietly gives a person permission to stop.',
  question: 'What makes an object become a place?',
  durationSeconds: 90,
  url: 'https://pointcast.xyz/field',
  jsonUrl: 'https://pointcast.xyz/field.json',
  image: 'https://pointcast.xyz/images/og/b/0546.png',
  qualities: [
    { id: 'shade', label: 'Shade' },
    { id: 'view', label: 'A view' },
    { id: 'shape', label: 'The right shape' },
    { id: 'convenience', label: 'Convenience' },
    { id: 'evidence', label: 'Evidence of others' },
  ],
  places: [
    { id: 'near-the-water', label: 'Near the water' },
    { id: 'on-my-block', label: 'On my block' },
    { id: 'between-places', label: 'Between places' },
    { id: 'somewhere-else', label: 'Somewhere else' },
  ],
  receipt: {
    title: 'An unofficial seat',
    nextQuestion: 'Does comfort appear before permission?',
    storage: 'on-device',
    publicSubmission: false,
    publicCount: false,
    photoUpload: false,
  },
  sources: [
    {
      title: 'The Billion Little New Yorkers',
      url: 'https://pointcast.xyz/beach-commons/v16',
    },
    {
      title: 'Ask the Beach',
      url: 'https://pointcast.xyz/beach-commons/v17',
    },
  ],
  successSignal: {
    completedFieldReceipts: 25,
    returningParticipants: 5,
    contributionsChangingNextEdition: 3,
    note: 'Targets for a future consented public-participation version; this release stores no public responses.',
  },
} as const;

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...invitation,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    },
  );
