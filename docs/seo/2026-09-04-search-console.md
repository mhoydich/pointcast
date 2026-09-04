# Search Console and Bing setup — 2026-09-04

## Google Search Console

- Added the URL-prefix property `https://pointcast.xyz/` under `mhoydich@gmail.com` and verified it with the deployed HTML verification file.
- Google Search Console reported **Ownership auto verified** with the **HTML file** method.
- The verification-file download control in Chrome returned `ERR_BLOCKED_BY_CLIENT`; this did not prevent verification.

## Sitemap status

| Sitemap | Google Search Console | Bing Webmaster Tools |
| --- | --- | --- |
| `https://pointcast.xyz/sitemap-index.xml` | Success; 0 discovered pages shown | Imported; Success; 1 URL discovered |
| `https://pointcast.xyz/sitemap-discovery.xml` | Success; 887 discovered pages | Imported; Success; 889 URLs discovered |
| `https://pointcast.xyz/sitemap-blocks.xml` | Success; 357 discovered pages | Imported; Success; 357 URLs discovered |

## URL inspection and indexing requests

Google accepted an indexing request for each of these URLs and placed each in its priority crawl queue:

- `https://pointcast.xyz/`
- `https://pointcast.xyz/almanac`
- `https://pointcast.xyz/el-segundo`
- `https://pointcast.xyz/agent-readiness`
- `https://pointcast.xyz/kennel-club`
- `https://pointcast.xyz/collect`

There were no remaining requested URLs and no daily-request cap message. At inspection time, the homepage and `/collect` were indexed. `/almanac` was reported as an alternate page whose selected canonical is `https://pointcast.xyz/almanac/`; the three newly restored routes were unknown to Google. The property-level Performance, Indexing, Experience, and Enhancements reports were still processing, so no coverage totals or error counts were available. The URL Inspection UI did not display the reported stale April homepage snippet.

## Bing Webmaster Tools

- Signed in with the existing Google account and imported the verified Google Search Console property.
- Bing imported all three submitted sitemaps. Its dashboard reports are processing and may take up to 48 hours.

## IndexNow

- The Bing IndexNow setup was available. A public ownership key file was added and deployed in PR #1069.
- The deployed key file was checked at the canonical site before submission.
- A batch containing the six URLs above was submitted to `https://api.indexnow.org/indexnow`; the endpoint returned HTTP `202` (accepted). This is a submission acknowledgement, not an indexing guarantee.

## Blockers

No login wall blocked the setup. The only browser issue was the Chrome client extension blocking the Google verification-file download; verification completed after deployment.
