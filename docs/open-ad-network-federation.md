# PointCast Open Ad Network federation

The reciprocal layer shares PointCast's checked-in house inventory across independently designed properties. It is a small exchange of clearly labeled doors, not a behavioral advertising system.

## Active publishers

- `pointcast` — `pointcast.xyz` (native Astro rail)
- `industrynext` — `www.industrynext.xyz`
- `allworthy` — `allworthy.xyz`
- `passportz` — `passportz.xyz`
- `common-hours` — `common-hours.mhoydich.chatgpt.site`, including `/stampz`

The authoritative registry and campaign inventory are published at `https://pointcast.xyz/ads.json`.

## Portable mount

```html
<div
  data-pointcast-network
  data-publisher="YOUR-PUBLISHER-ID"
  data-placement="site-footer"
  data-context="optional page context"
></div>
<script async src="https://pointcast.xyz/open-ad-network.js"></script>
```

The script uses Shadow DOM so the unit does not leak styles into its host. It excludes campaigns owned by the current publisher, chooses one creative from page context plus a daily deterministic rotation, and appends explicit UTM attribution.

## Measurement and privacy

- An impression requires at least 50% viewability for one second.
- Impressions are deduplicated per creative, page, placement, publisher, and browser session.
- The event log stores creative ID, event type, public publisher ID, public placement ID, time, and a random event key.
- No cookie, IP address, user agent, fingerprint, wallet address, cross-site visitor identifier, or behavioral profile is stored.
- `Do Not Track` and the local `pc:no-track` preference disable events.
- Publisher origins are allowlisted; unknown cross-site posts are rejected.
- Tez reservation and settlement remain prototype-only.

The public report is available at `https://pointcast.xyz/ads/report`, with JSON at `https://pointcast.xyz/api/ad-metrics?days=30`.
