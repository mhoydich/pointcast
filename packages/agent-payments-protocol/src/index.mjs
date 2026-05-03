/**
 * @pointcast/agent-payments-protocol — reference implementation of the
 * pointcast.agent-payments/v1 spec.
 *
 * Re-exports everything from ./signing.mjs and ./discover.mjs so consumers
 * can `import { signSpend, verifySpend, discover } from '@pointcast/agent-payments-protocol'`.
 */

export {
  SIGNING_ALG,
  SPEC_VERSION,
  MANIFEST_FIELDS,
  buildManifest,
  signManifest,
  verifyManifest,
  signSpend,
  verifySpend,
} from './signing.mjs';

export {
  discover,
  fetchReceipts,
  verifyReceiptByUrl,
} from './discover.mjs';
