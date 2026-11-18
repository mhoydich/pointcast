# Metaverse district devnet

Run a standalone, single-host development network for PointCast's six architecture plates. A sequencer sends visit proposals over IPC to three separate validator processes. Each validator independently checks the parent ledger against the genesis fingerprint and keeps its own P-256 key and SQLite vote journal. Two signatures commit a visit.

The network uses the same BLAKE2b-256 block hashes, signature bytes and six plate IDs as the [public district lab](https://pointcast.xyz/metaverse/chain/). A transcript from this CLI can be imported and verified there.

## Run

Use Node 24 or newer. From the PointCast repository root, run this in one terminal.

```sh
node tools/metaverse-devnet/district.mjs init
node tools/metaverse-devnet/district.mjs start
```

Save the printed genesis fingerprint. The default data directory is `~/.local/share/pointcast-metaverse-devnet`. The sequencer listens on `127.0.0.1:46170`. To run another local network, set `DISTRICT_DIR` and `DISTRICT_PORT` in both terminals before initialization. Start a given data directory with one sequencer.

In a second terminal, record a visit and verify the history.

```sh
node tools/metaverse-devnet/district.mjs visit court-society first-court-visit
node tools/metaverse-devnet/district.mjs verify
node tools/metaverse-devnet/district.mjs export > district-ledger.json
node tools/metaverse-devnet/district.mjs verify district-ledger.json
```

Choose one of `architect-cut`, `southern-row`, `northern-row`, `missing-house`, `row-2030`, or `court-society`. The second argument is your request ID. Reuse it for retries and choose a fresh ID for a separate visit. A network holds up to 256 visits.

## Recover or inspect

Press Ctrl+C to stop the sequencer and its validators. Running `start` again reuses their keys, votes and committed visits. If the process stops between proposal reservation and commitment, startup prints the plate and request ID to run again. A validator writes its vote before responding and only releases one block digest per height. The sequencer checks signatures before committing. With one validator offline the remaining two can commit. With only one online the proposal stays pending until enough validators return.

Keep the data directory private to its operator. Each validator key is a local development key in a file readable by that operating-system user. Only the public ledger and genesis fingerprint are intended for sharing. The loopback API trusts processes on the same machine. This topology exercises signing, persistence and recovery under one operator. Independent validator operators, wide-area node transport, economic rules and production deployment are separate work. Visits carry no financial value and invoke no Tezos or Solana transactions.
