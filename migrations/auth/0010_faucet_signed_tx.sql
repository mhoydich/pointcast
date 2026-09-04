PRAGMA foreign_keys = ON;

-- Sign first, then settle. A delivery now signs its ERC-20 transfer, writes the
-- transaction's identity onto the rows it took, and only then broadcasts, so a
-- timeout or a lost RPC response is a question the chain can answer instead of
-- a guess the ledger has to make.
--
-- `nonce` is the spigot nonce the transaction was signed for: once the wallet
-- has moved past it and the node has never heard of our hash, that transaction
-- is dead and the drips are safely owed again. `signed_tx` is the raw signed
-- transaction, kept so a send that stalls in the mempool can be re-broadcast
-- verbatim — same signature, same hash, so at most one of them can ever mine.
--
-- Both are NULL on `held` rows and on every row written before this migration.
-- functions/api/faucet/_claims.ts adds the same two columns by guarded ALTER
-- on first request, for deploys that never run migrations.
ALTER TABLE faucet_claims ADD COLUMN nonce INTEGER;
ALTER TABLE faucet_claims ADD COLUMN signed_tx TEXT;
