# Nouns Drum Club Bandmates FA2

This directory contains the immutable TZIP-16 collection document and the twelve
TZIP-21 token documents used by the Nouns Drum Club Bandmates FA2 preparation.
They are compiled into the contract storage at origination. There is no metadata
update entrypoint.

## Local compile and review

Run the compile script with an explicit temporary output directory:

```sh
scripts/compile-nouns-bandmates.sh /tmp/nouns-bandmates-compile
```

It runs the SmartPy scenarios and produces these review inputs:

```text
/tmp/nouns-bandmates-compile/nouns_bandmates_fa2_compile/step_003_cont_0_contract.json
/tmp/nouns-bandmates-compile/nouns_bandmates_fa2_compile/step_003_cont_0_storage.json
```

Build the launch manifest and locally forge a size preflight:

```sh
node scripts/nouns-bandmates-launch-package.mjs \
  /tmp/nouns-bandmates-compile/nouns_bandmates_fa2_compile
```

The command validates the administrator, `paused=false`, token IDs 0–11, and
one initial edition of each token assigned to the administrator. It rejects a
payload larger than the 32,768-byte operation limit and writes an
`awaiting-user-signature` manifest. It does not sign, broadcast, or access a
wallet.

## Mint and verification behavior

`mint(token_id)` accepts only zero tez and the twelve predefined IDs. It is
public and has no per-wallet cap while collecting is open. The administrator
can pause or reopen minting; pausing does not freeze ordinary FA2 transfers.

After a user signs and an origination is independently confirmed, verify the
chain ID, originated address, storage administrator, `paused` state, all twelve
initial balances and supplies, and the canonical hash of the RPC
`script.code`. Only then may a release registry change from prepared to live.
