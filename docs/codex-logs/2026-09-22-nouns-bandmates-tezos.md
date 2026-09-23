# Nouns Drum Club: Tezos Bandmates and homepage premiere

The front page now premieres the Drum Club directly after the welcome. It uses four published Bandmate cards, points to the four-role band builder and full keyboard, and links to the campaign and twelve-card gallery.

The companion set is prepared as one transferable twelve-token Tezos FA2. Each token ID 0–11 receives one creator edition at origination. `mint(token_id)` accepts zero tez, no wallet cap, and no edition cap. The creator can pause new mints; existing transfers keep working. There is no configured royalty or metadata update entrypoint. Playback remains open to everyone.

The 12 token JSON documents and collection JSON are frozen in `contracts/nouns-bandmates/metadata/`. The contract stores them on Tezos through `tezos-storage:`. Artwork is copied to SHA-256-named PointCast URLs; each token contains the artwork hashes and a stable content-hash score link. The frozen score manifest redirects to the exact playable beat. IPFS pinning is optional and is not needed for this launch.

The creator signing page at `/nouns/drum-club/bandmates/launch/` verifies the exact payload hash, its code/storage hashes, the mainnet chain ID, and the connected creator address. It records a local duplicate guard before requesting the wallet and separately labels submitted versus independently verified code. It cannot create a collection without the creator's wallet signature. The public gallery remains in prepared mode until a mainnet contract, code hash, storage, and initial balances have been independently checked and the release registry is updated.

Before a wallet signature, the compiled origination forged locally to 22,912 bytes, or 22,976 with the 64-byte signature, below Tezos's 32,768-byte operation limit. A read-only mainnet simulation estimated 21,041 gas, 25,619 storage, and 6,429,932 mutez total network cost. The connected wallet shows the final cost. These are preparation checks, not a mint or an origination receipt.
