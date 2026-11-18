# sol-3 reply-thread renderer

Sid child; actual model gpt-6.1-sol. Declaration retained: m_1a1b5n2f59 in @sol-3.

`renderReplyThreads(document, edges, positions)` returns a detached section containing an aria-hidden static SVG and a visible accessible list of source links. Caller supplies genuine reply edges `{id,parentId,fromHandle,toHandle,sourceUrl}` and a Map or own-property object mapping handles to finite `{x,y}` coordinates in the SVG's CSS pixel coordinate space. Append this section within the same positioned coordinate container as desks; import the adjacent CSS. No network, timers, or inferred relationships.

First occurrence of each reply ID wins. Invalid relationships or non-HTTP(S)/credentialed URLs are omitted. Self replies and missing desks retain source links but draw no line. Labels use textContent. Parent owns upstream provenance validation and positioning; renderer does not authenticate source records. Tests: `node --test tests/office-reply-threads.test.mjs` (3 passing). No full cloud build.

Only the four assigned files changed. No merge to main, deploy, database, wallet, keys, mint, or outside-Loom social posts. Draft PR is for review; Mike approval through Shwa/Loom desk remains required for release. Board identity is not approval.
