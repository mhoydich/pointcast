DRUM Token — Deployment Notes
This document covers everything needed to deploy the DRUM Token contract and integrate the signed-voucher claim flow into a backend service.
﻿
1. Contract Overview
The DRUM Token is a hand-rolled FA1.2 fungible token on Tezos, written in SmartPy v0.24.1. It extends the standard FA1.2 interface with a signed-voucher claim flow that allows a trusted backend signer to authorise token mints without requiring the admin to be online for every issuance.
Storage Field
	
Type
	
Description


admin
	
address
	
Contract administrator


signer
	
key
	
Ed25519 public key trusted to sign vouchers


paused
	
bool
	
Global pause flag


total_supply
	
nat
	
Total tokens in circulation


ledger
	
big_map[address, {balance, approvals}]
	
Token balances and allowances


used_nonces
	
big_map[nat, unit]
	
Replay-protection registry


metadata
	
big_map[string, bytes]
	
TZIP-016 contract metadata
﻿
2. Compiling the Contract
Install SmartPy and run the compiler:
Bash
pip install smartpy-tezos
python drum_token.py
To compile to Michelson and produce the initial storage:
Bash
python -m smartpy compile drum_token.py main.DrumToken 'main.DrumToken(admin=sp.address("tz1YourAdminAddress"), signer=sp.key("edpkYourSignerPublicKey"))' output/
This produces output/step_000_cont_0_contract.tz (Michelson) and output/step_000_cont_0_storage.tz (initial storage).
﻿
3. Initial Storage — JSON (Micheline format)
When originating via Taquito or octez-client, the initial storage in Micheline JSON is:
JSON
{
  "prim": "Pair",
  "args": [
    { "string": "tz1YourAdminAddress" },
    {
      "prim": "Pair",
      "args": [
        { "prim": "Pair", "args": [ [], [] ] },
        {
          "prim": "Pair",
          "args": [
            { "prim": "False" },
            {
              "prim": "Pair",
              "args": [
                [],
                {
                  "prim": "Pair",
                  "args": [
                    { "string": "edpkYourSignerPublicKey" },
                    { "int": "0" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
Recommendation: Always use the SmartPy compiler output (step_000_cont_0_storage.tz) as the authoritative initial storage, as it reflects the exact Michelson field ordering. The JSON above is illustrative.
﻿
4. Voucher Payload Specification
The contract verifies a signature over a packed Michelson record. The record fields are sorted alphabetically by SmartPy, so the Michelson layout is:
Plain Text
pair nat (pair timestamp (pair nat address))
  %amount  %expiry  %nonce  %recipient
The backend must pack data in exactly this order before signing.
Field
	
Michelson Type
	
Description


amount
	
nat
	
Number of DRUM tokens to mint


expiry
	
timestamp
	
UNIX timestamp after which the voucher is invalid


nonce
	
nat
	
Unique identifier; prevents replay attacks


recipient
	
address
	
Tezos address of the token recipient
﻿
5. Node.js Voucher-Signing Example
Prerequisites
Bash
npm install @taquito/taquito @taquito/signer @taquito/michel-codec
sign_voucher.js
JavaScript
const { InMemorySigner } = require('@taquito/signer');
const { packDataBytes } = require('@taquito/michel-codec');

/**
 * Generates a signed DRUM voucher that can be submitted to the claim entrypoint.
 *
 * @param {string} secretKey  - Backend signer's secret key (edsk...)
 * @param {string} recipient  - Tezos address of the token recipient (tz1...)
 * @param {number} amount     - Number of DRUM tokens to mint
 * @param {number} nonce      - Unique nonce (use a monotonic counter or UUID-derived nat)
 * @param {number} expiryUnix - Expiry as a UNIX timestamp (seconds since epoch)
 * @returns {Promise<{sig: string, publicKey: string}>}
 */
async function generateVoucherSignature(secretKey, recipient, amount, nonce, expiryUnix) {
  const signer = new InMemorySigner(secretKey);
  const publicKey = await signer.publicKey();

  // Michelson type: pair nat (pair timestamp (pair nat address))
  // Field order: amount, expiry, nonce, recipient  (alphabetical)
  const payloadType = {
    prim: 'pair',
    args: [
      { prim: 'nat',       annots: ['%amount'] },
      { prim: 'pair', args: [
        { prim: 'timestamp', annots: ['%expiry'] },
        { prim: 'pair', args: [
          { prim: 'nat',     annots: ['%nonce'] },
          { prim: 'address', annots: ['%recipient'] }
        ]}
      ]}
    ]
  };

  const payloadData = {
    prim: 'Pair',
    args: [
      { int: amount.toString() },
      { prim: 'Pair', args: [
        { int: expiryUnix.toString() },
        { prim: 'Pair', args: [
          { int: nonce.toString() },
          { string: recipient }
        ]}
      ]}
    ]
  };

  // Pack to bytes (equivalent to sp.pack in SmartPy)
  const packed = packDataBytes(payloadData, payloadType);

  // Sign the packed bytes
  // InMemorySigner.sign() prepends the 0x03 generic-signature watermark.
  // For raw Michelson-packed data, pass the hex string directly.
  const { sig, prefixSig } = await signer.sign(packed.bytes);

  return { sig: prefixSig, publicKey };
}

// ---- Example usage ----
(async () => {
  const BACKEND_SECRET_KEY = 'edsk_YOUR_BACKEND_SECRET_KEY';
  const RECIPIENT          = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
  const AMOUNT             = 50;
  const NONCE              = 42;                                  // Must be unique per voucher
  const EXPIRY             = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  const { sig, publicKey } = await generateVoucherSignature(
    BACKEND_SECRET_KEY, RECIPIENT, AMOUNT, NONCE, EXPIRY
  );

  console.log('Signer Public Key (store in contract):', publicKey);
  console.log('\nVoucher Parameters:');
  console.log('  recipient:', RECIPIENT);
  console.log('  amount:   ', AMOUNT);
  console.log('  nonce:    ', NONCE);
  console.log('  expiry:   ', EXPIRY);
  console.log('  signature:', sig);
})();
﻿
6. Calling the Claim Entrypoint (Taquito)
Once the backend has produced a voucher, the frontend submits it:
JavaScript
const { TezosToolkit } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');

const Tezos = new TezosToolkit('https://ghostnet.ecadinfra.com' );
Tezos.setProvider({ signer: new InMemorySigner('edsk_RECIPIENT_SECRET_KEY') });

const contract = await Tezos.wallet.at('KT1_DRUM_TOKEN_CONTRACT_ADDRESS');

// Taquito maps entrypoint parameters alphabetically (matching Michelson layout):
// claim(amount, expiry, nonce, recipient, signature)
const op = await contract.methods.claim(
  AMOUNT,
  EXPIRY,
  NONCE,
  RECIPIENT,
  SIGNATURE
).send();

await op.confirmation(1);
console.log('Claim confirmed. Operation hash:', op.opHash);
Note on parameter order: Taquito resolves method parameters by their Michelson field order, which is alphabetical for SmartPy records: amount, expiry, nonce, recipient, signature. Always verify against the compiled Michelson if in doubt.
﻿
7. Security Checklist
The following items should be reviewed before mainnet deployment.
Item
	
Status


Signer key is stored in a secure HSM or secrets manager
	
Verify before deploy


Nonce is a monotonically increasing counter or cryptographically unique value
	
Required


Voucher expiry is set to the shortest acceptable window (e.g., 15 minutes)
	
Recommended


set_signer is called immediately after origination to confirm key rotation works
	
Recommended


Contract metadata URI is pinned to IPFS and set via metadata big_map
	
Recommended


Admin address is a multisig or hardware wallet
	
Recommended


Contract has been audited before handling significant value
	
Required for mainnet
﻿
8. Error Reference
Error Code
	
Entrypoint
	
Cause


FA1.2_Paused
	
transfer, approve, claim
	
Contract is paused


FA1.2_InsufficientBalance
	
transfer, admin_burn
	
Sender has insufficient balance


FA1.2_NotAllowed
	
transfer
	
Allowance is insufficient for delegated transfer


FA1.2_UnsafeAllowanceChange
	
approve
	
Changing a non-zero allowance without first setting it to zero


Fa1.2_NotAdmin
	
admin_mint, admin_burn, set_signer, set_paused
	
Caller is not the admin


Claim_WrongSender
	
claim
	
sp.sender does not match recipient


Claim_Expired
	
claim
	
sp.now > expiry


Claim_NonceReplay
	
claim
	
Nonce has already been used


Claim_InvalidSignature
	
claim
	
Signature does not verify against the signer key