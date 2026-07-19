export const UES_COMPLETION_RECEIPT_SCHEMA_URL = 'https://pointcast.xyz/ues/completion-receipt/v1';

export const UES_COMPLETION_RECEIPT_SCHEMA = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: UES_COMPLETION_RECEIPT_SCHEMA_URL,
  title: 'University of El Segundo self-attested course completion receipt',
  description:
    'A private, learner-downloaded record of self-attested course completion. It is not academic credit, accreditation, verified identity, an on-chain record, or a financial credential.',
  type: 'object',
  additionalProperties: false,
  required: [
    'schema',
    'kind',
    'program',
    'courseCode',
    'completedModules',
    'completedModuleCount',
    'finalOutcome',
    'startedAt',
    'completedAt',
    'attestation',
    'disclaimer',
  ],
  properties: {
    schema: { const: UES_COMPLETION_RECEIPT_SCHEMA_URL },
    kind: { const: 'self-attested-course-completion' },
    program: { const: 'University of El Segundo' },
    courseCode: {
      type: 'string',
      pattern: '^[A-Z][A-Z0-9]{1,7}-[A-Z0-9]{1,8}$',
      description: 'A public catalog code, never a learner identifier.',
    },
    courseTitle: {
      type: 'string',
      minLength: 1,
      description: 'The public catalog title added by the course room when the receipt is downloaded.',
    },
    courseUrl: {
      type: 'string',
      format: 'uri',
      description: 'The public course-room URL added by the course room when the receipt is downloaded.',
    },
    completedModules: {
      type: 'array',
      minItems: 4,
      maxItems: 6,
      uniqueItems: true,
      items: { type: 'integer', minimum: 1, maximum: 6 },
    },
    completedModuleCount: {
      type: 'integer',
      minimum: 4,
      maximum: 6,
      description: 'The number of entries in completedModules.',
    },
    finalOutcome: { const: true },
    startedAt: { type: 'string', format: 'date-time' },
    completedAt: { type: 'string', format: 'date-time' },
    attestation: {
      const: 'Self-attested by the learner; no identity was collected or verified.',
    },
    disclaimer: {
      const: 'Not academic credit, accreditation, verified identity, an on-chain record, or a financial credential.',
    },
  },
});
