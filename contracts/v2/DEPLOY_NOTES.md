Here is the complete, tested, and passing contract. Zero errors — only deprecation warnings emitted by the fa2_lib internals themselves (not your code).
What was confirmed
The contract was compiled and all test assertions executed against SmartPy v0.24.1 (the version pip install smartpy-tezos resolves to today, matching what smartpy.io runs). Every test case passes:
Free mint, open editions, per-noun supply counter
Paid mint with exact-amount enforcement (under- and over-payment both rejected)
max_noun_id boundary enforcement
Royalty cap at 2500 bps
Non-admin rejection on all six admin setters
FA2 transfer (TZIP-12 standard)
set_max_noun_id + subsequent mint rejection
Critical API changes (v0.16 → v0.24) — the root cause of your error
Breaking change
	
v0.16
	
v0.24.1


Import path
	
import fa2_lib
	
from smartpy.templates import fa2_lib as fa2


Class name
	
fa2_lib.Fa2MultiAsset
	
Does not exist → use main.Fungible + mixins


__init__ signature (the crash)
	
Fa2MultiAsset.__init__(self, metadata=…, token_metadata=[], ledger={})
	
main.Fungible.__init__(self, metadata, ledger, token_metadata) — positional, different order


Module system
	
Classes at top level
	
All classes inside @sp.module


Control flow
	
sp.if / sp.for / sp.local
	
Native Python if / for / assignment


Membership
	
container.contains(key)
	
key in container; not in unsupported → not (key in container)


Int → string
	
sp.build_string(n) (removed)
	
string_utils.from_int(sp.to_int(n))


Empty map literal
	
sp.map()
	
{} cast with sp.cast({}, sp.map[K, V])


Test failure arg
	
_should_fail=True
	
_valid=False, _exception="ERROR_STRING"
Royalties delta from spec
You asked for "20% royalties, TZIP-21 compliant, objkt auto-honors." Here is exactly what was implemented and one important caveat:
What is stored: On first mint of each noun_id, the contract packs a sp.record(decimals=4, shares={administrator: royalty_bps}) into token_info["royalties"] as Michelson bytes. objkt's indexer reads this key directly from token_metadata.
The caveat: royalty_bps in storage is the source-of-truth for future mints only. Tokens already minted have their royalties frozen in their packed bytes. Calling set_royalty_bps does not retroactively update them. This is the closest equivalent to "adjustable royalty_bps" that is cleanly expressible in the current API — if you need mutable royalties on already-minted tokens, you would need to add an admin entrypoint that re-packs and overwrites token_metadata[noun_id].token_info["royalties"] for each affected token.
Files attached
visit_nouns_fa2.py — paste directly into smartpy.io IDE and hit Run
DEPLOY_NOTES.md — init storage JSON, post-origination checklist, full entrypoint reference, and royalties design notes