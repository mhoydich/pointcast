POINTCAST — THE $100 AI CHALLENGE

Five inspectable outputs from one Codex session. Commissioned by Mike Hoydich.
Live article: https://pointcast.xyz/reviews/100-dollar-ai

To run the downloaded pages locally, serve this folder over HTTP:
  python3 -m http.server 8000
Then open http://localhost:8000/one-good-hour.html (or another HTML file).
The bill splitter uses an ES module, so opening file:// directly may not work.
The navigation link back to PointCast is a site-relative link in the standalone demos.

Files:
- one-good-hour.html: fictional brand and campaign kit
- split-the-afternoon.html + split-core.mjs: working local bill splitter
- split-core.test.mjs: run with node --test split-core.test.mjs
- room-memo.txt + document-desk.html: synthetic source and clause-linked summary
- weekend.html: researched, unbooked itinerary with official sources
- one-good-hour.mp4 + short.html: finished silent short and transcript
- render-short.mjs: original renderer; requires sharp and FFmpeg
- receipt.json: scoped observed token delta and API-equivalent estimate, not an invoice
- events.json: timestamped artifact-work checkpoints
- protocol.txt: acceptance rules set before artifact production
- manifest.json: SHA-256 hashes and file sizes, excluding this manifest and the ZIP

Actual billed cost, human editing time and saved hours are not established.
No private source documents, credentials, stock footage or licensed soundtrack are included.
