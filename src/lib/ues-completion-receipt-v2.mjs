import { UES_COMPLETION_RECEIPT_SCHEMA as v1 } from './ues-completion-receipt-schema.mjs';

export const UES_COMPLETION_RECEIPT_V2_URL = 'https://pointcast.xyz/ues/completion-receipt/v2.json';
export const UES_COMPLETION_ATTESTATION_V2 = 'Self-attested by the learner; this receipt contains no identity and verifies neither the learner nor the work.';
export const UES_COMPLETION_RECEIPT_V2 = Object.freeze({
  ...v1,
  $id: UES_COMPLETION_RECEIPT_V2_URL,
  properties: {
    ...v1.properties,
    schema: { const: UES_COMPLETION_RECEIPT_V2_URL },
    attestation: { const: UES_COMPLETION_ATTESTATION_V2 },
  },
});
