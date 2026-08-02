# Saturday Signal Nouns — Mainnet handoff

This is a 50-token FA2. Token IDs 0–49 are distinct Nouns CC0 field editions. `mint_signal(token_id)` accepts exactly 0 mutez, caps each field at 100 editions, and permits one mint per wallet per token.

Compile with SmartPy 0.24.1. Mainnet constructor: administrator `tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`, contract metadata `https://pointcast.xyz/collectibles/saturday-signal-stamps/contract.json`, the 50 raw UTF-8 metadata URIs emitted by `make_signal_token_metadata()`, `edition_cap=100`, `max_token_id=49`.

The final origination must be reviewed and signed in Mike's own Kukai wallet. Never request or handle a seed phrase or private key. After signing, verify the applied operation and KT1 on TzKT before changing `src/data/saturday-signal-stamps-contract.json` to `live: true`.

Post-origination proof: verify entrypoints and storage on TzKT; simulate nonzero payment rejection; approve one zero-price test mint; confirm the same wallet cannot repeat that token; resolve metadata and compare artifact SHA-256; publish the exact KT1 on the collection page.
