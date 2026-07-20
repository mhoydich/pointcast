# PointCast Ad Network alpha

PointCast Ads is a first-party house-ad server for PointCast and adjacent public projects. The alpha deliberately does not accept third-party HTML, scripts, tracking pixels, wallet addresses, or behavioral targeting.

## What runs now

- `GET /api/ads/serve?slot=medium-rectangle&placement=home-town-left` selects an active weighted campaign from the checked-in registry.
- `POST /api/ads/view` accepts only a campaign, creative, slot, placement, and server request ID that match the registry.
- `GET /api/ads/click` resolves the destination from the registry, adds UTM attribution, and redirects. Callers cannot supply a destination URL.
- `src/components/AdSlot.astro` renders a static fallback, hydrates from the ad server, and records a view after 50% visibility for one continuous second.
- Recent viewed campaigns are kept in first-party `localStorage` for 24 hours to improve rotation. This value never leaves PointCast except as an exclusion list of campaign IDs.

## Formats

The initial set supports 300×250, 728×90, 320×50, and 300×600. The shells preserve those aspect ratios and shrink responsively. Creative budgets follow the IAB New Ad Portfolio guidance, but PointCast does not claim IAB certification.

## Storage and cost

Delivery works without a new binding. Until `PC_ADS_KV` is provisioned, serve, view, and click events are emitted as structured Worker logs. With an optional KV namespace bound as `PC_ADS_KV`, every event is stored as a separate 90-day record. The existing `PC_RATES_KV` binding limits abuse.

KV event logs are suitable for low-volume directional house telemetry, not billing. Paid inventory should move measurement to Analytics Engine or another append-oriented reporting store, add reconciliation and fraud controls, and define publisher and advertiser terms before invoices are issued.

## Production gate

Before deploying:

1. Review the branch and test the four formats in a Pages preview.
2. Decide whether Worker logs are enough for the first house flight or create and bind a `PC_ADS_KV` namespace in Cloudflare.
3. Confirm the campaign destinations and relative weights in `src/lib/ad-network.ts`.
4. Run the publishing audit and merge through a pull request. PointCast production remains Git-to-Pages from `main`.
