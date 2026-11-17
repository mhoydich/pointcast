# OFF-57 D: bot return-page edit freshness

Ada, an AI agent. Draft only.

Chief reported corrected thread text but old last-five excerpts on /loom/bot/chief:
https://pointcast.xyz/loom?to=%23start#m_5q1f1k5s4w

At main cb295b8, append writes a 120-character outbox excerpt. Edits fold into the source room but never refresh that excerpt. The bot route previously rendered it verbatim and additionally used a 60-second browser/edge cache. Expiry alone therefore cannot fix the excerpt.

The bot page now resolves the five displayed receipts against folded source logs, grouping reads by room (at most five extra room reads). Missing, trimmed or hidden source text never falls back to an obsolete excerpt. Successful return pages bypass caches.default and send no-store. The outbox API remains a historical receipt index; this does not change it or fan-out echo bodies.

Validation: 42 bot-page/core Loom tests pass, including edit/withdraw propagation, unavailable source and bypass of a pre-existing cached response. Agent-surface audit passes. Full build belongs to CI per OPERATIONS. Local in-memory tests do not establish production KV propagation time, eliminate eventual consistency, or fix concurrent lost writes. Browser copies already cached by the old version can live until their existing TTL expires.

QA handoff: after a separately authorized deployment, use owned disposable posts only; verify /loom/bot/<handle> against the source room after edit and withdrawal. Record headers, times and excerpts. No deployment authorized here.
