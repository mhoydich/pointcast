// Every visible word of the Nouns Money chain surfaces (flag NM_CHAIN_ENABLED).
//
// One place on purpose: tests/nouns-money-chain-copy.test.mjs and the build
// (assertNmChainReady in src/data/nouns-money-chain.ts) scan this module with
// the plan's "Never use" list, so a banned word here fails the build. The
// client scripts in public/nouns-money/chain/ receive these strings as JSON
// and carry no copy of their own.
//
// Words to use (plan §6): collect, hold, check; note, specimen, edition, copy.
// "{name}" placeholders are filled by fill() on the page.

/** On every chain surface, verbatim. */
export const NM_STANDARD_LINE =
  'Art on a test chain. No value, no redemption, may reset. Not $NOUNS. Not a claim on the Nouns treasury. No Nouns DAO endorsement. CC0.';

/** Replaces the live "No mint, token ownership…" line, only while the flag is on. */
export const NM_REPLACEMENT_LINE = 'A free devnet art record. No price, no balance, no redemption. Not transferable yet.';

/** The approved lines, verbatim, are the only text the scan excuses (they name what a note is not). */
export const NM_APPROVED_LINES = Object.freeze([NM_STANDARD_LINE, NM_REPLACEMENT_LINE]);

export const NM_COPY = Object.freeze({
  standardLine: NM_STANDARD_LINE,
  replacementLine: NM_REPLACEMENT_LINE,
  supporting: Object.freeze(['The serial is a catalog number.', 'Money is the title of the artwork.']),
  shelf: Object.freeze({
    kicker: 'NOUNS MONEY · DEVNET-2 · EDITION NOUNS-MONEY-27',
    title: 'Collect a copy on the test chain',
    dek: 'Each design has a specimen on the house shelf and ten copies anyone can collect, one a day per passkey. Your copy is recorded on pointcast-devnet-2 with the exact art hash of its note.',
    checking: 'Checking devnet-2…',
    copiesLeft: '{left} of {copies} copies left',
    allCollected: 'All {copies} copies collected',
    specimenHouse: 'specimen on the house shelf',
    specimenElsewhere: 'specimen held by {owner}',
    specimenMissing: 'specimen not on the shelf yet',
    notOpen: 'Edition not open on devnet-2 yet',
    unreadable: 'Devnet-2 did not answer',
    collectButton: 'Collect on devnet',
    walletLabel: 'Passkey wallet',
    walletNone: 'none yet',
    makeWallet: 'Make a passkey wallet',
    checkMyNote: 'Check my note in the Block Yard',
    noun: 'Noun #{nounId}',
  }),
  status: Object.freeze({
    loading: 'Loading…',
    offOrigin: 'Passkeys work only on pointcast.xyz. A passkey made here would be bound to that site, so this copy of the page asks nothing.',
    noGenesis: 'Not live: the devnet-2 genesis is not pinned in this build.',
    noWebauthn: 'This browser has no passkeys (WebAuthn).',
    wrongChain: 'The devnet is not the chain this page expects ({why}). Nothing will be signed.',
    unreadable: 'Devnet-2 did not answer ({why}). Nothing will be signed; try again in a minute.',
    notOpen: 'The Nouns Money edition is not open on devnet-2 yet. Nothing will be signed.',
    claimsClosed: 'Collecting is closed on devnet-2 right now. The shelf shows the edition as recorded; nothing will be signed.',
    ready: 'Ready. Pick a note to collect.',
    needWallet: 'Make a passkey wallet to collect a note.',
    waitingPasskey: 'Waiting for your passkey…',
    walletMade: 'Wallet made. It lives in your passkey; this browser only remembers which one.',
    noWallet: 'No wallet made: {why}',
    asking: 'Asking devnet-2 for a copy of Noun #{nounId}…',
    refused: 'Not collected: {why}',
    duplicate: 'Today’s claim is already yours: copy {copy} of Noun #{nounId}, waiting for your passkey. One a day per passkey (UTC days).',
    mismatch: 'Not collected: devnet-2 offered a recipe that does not match the published art record ({why}). Nothing was signed.',
    sending: 'Sending…',
    sent: 'Sent to devnet-2 as tx {tx}. The note is yours once a block includes it.',
    landed: 'Collected: {label}, Noun #{nounId}, copy {copy} of {copies}.',
    pending: 'Not in a block yet. The receipt keeps the tx hash; check again in a minute.',
  }),
  confirm: Object.freeze({
    title: 'Collect a Nouns Money note on pointcast-devnet-2',
    note: 'Noun #{nounId}, copy {copy} of {copies}, edition nouns-money-27',
    recipe: 'Recipe hash {hash}',
  }),
  receipt: Object.freeze({
    title: 'Receipt',
    note: 'Note',
    copy: 'Copy',
    recipeHash: 'Recipe hash',
    tx: 'Tx',
    serial: 'Serial',
    serialPending: 'assigned when a block includes the tx',
    owner: 'Owner',
    openNote: 'Open the note page',
  }),
  note: Object.freeze({
    kicker: 'NOUNS MONEY · DEVNET-2 · NOTE',
    title: 'Note {label}',
    reading: 'Reading devnet-2…',
    unreadable: 'Devnet-2 did not answer ({why}).',
    notOpen: 'The Nouns Money edition is not open on devnet-2 yet, so serial {serial} has no note.',
    notCollected: 'Serial {serial} has not been collected on devnet-2 yet.',
    unknownRecipe: 'Serial {serial} carries a recipe hash that matches no published Nouns Money recipe.',
    art: 'Art',
    owner: 'Owner',
    house: 'the house shelf',
    design: 'Design',
    copy: 'Copy',
    copySpecimen: 'specimen (copy 0)',
    collectedAt: 'Collected at block',
    chainHash: 'Recipe hash on devnet-2',
    publishedRecipe: 'Published recipe',
    artHash: 'Art file sha256',
    match: 'Hash match: the chain’s recipe hash, the published recipe and the art file agree.',
    noMatch: 'No match: {why}',
    serialOrder: 'Serial {serial} should be the specimen of design {expected}; devnet-2 records design {design}, copy {copy}.',
    specimenOwner: 'Serial {serial} is the specimen of design {expected}, which stays on the house shelf; devnet-2 records {owner} as its owner.',
    serialCopy: 'Serials above 100 are public copies (1 to 10) collected by a passkey account; devnet-2 records copy {copy} of design {design} for {owner}.',
    checkMyNote: 'Check my note in the Block Yard',
    backToShelf: 'Back to the collection',
    chainRecord: 'Published recipes (chain.json)',
    artAlt: 'Nouns Money note with CC0 Noun #{nounId}, {label}',
    designValue: 'Noun #{nounId} · {id}',
    problemRecipe: 'the published recipe does not hash to the chain’s recipe hash',
    problemArt: 'the art file’s sha256 differs from the one in the recipe',
  }),
});

/** Fill "{name}" placeholders. Unknown names stay visible, so a missing value is never silent. */
export function fill(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (whole, key) => (key in values ? String(values[key]) : whole));
}

/** Every string in the copy, flattened, for the honest-copy scan. */
export function allCopyStrings(value = NM_COPY) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap((v) => allCopyStrings(v));
  if (value && typeof value === 'object') return Object.values(value).flatMap((v) => allCopyStrings(v));
  return [];
}
