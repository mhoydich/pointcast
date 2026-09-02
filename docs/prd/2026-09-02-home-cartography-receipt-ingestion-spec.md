# Home Cartography — Receipt Ingestion Spec

Status: draft v0. Owner lane: Terra. Sibling surfaces: `/cartography/home`, `/cartography/home/demo`.

## Goal

Answer the cold-start problem for Home Cartography without a device or a walkthrough: **receipts first, camera second.** Most of a household's high-value items already have a paper trail sitting in email, an Amazon order history export, or a retailer account. Parse that trail before asking anyone to photograph anything. The camera/barcode pass (see the field kit) then fills in what receipts can't reach — gifts, cash purchases, inherited items, anything bought before the inbox existed.

## Sources

| Source | What it yields |
|---|---|
| Gmail / Apple Mail order confirmation emails | Merchant, order date, line items, price paid, order id, sometimes serial/model number, shipping address (confirms "this household") |
| Amazon order history export (`.csv`/`.json` from Amazon's own data-export tool) | Full purchase history in one file: date, item title, price, quantity, order id — no per-email parsing needed |
| Apple account purchase history (App Store/hardware) | Device model, serial (via AppleCare/Find My linkage), purchase date, price, AppleCare term |
| Best Buy / Home Depot account order history pages | Merchant, date, line items, price, sometimes serial for registered appliances/tools |
| Photographed paper receipts (register receipts, invoices with no digital twin) | Merchant, date, line items, price — OCR'd locally; weakest field coverage (no order id, rarely a serial) |

## Extracted fields → index schema

Maps onto the three-part index shape from `home-cartography.ts` (`item` / `provenance` / `document`):

| Extracted field | Index field | Notes |
|---|---|---|
| Merchant / retailer name | `item.retailer` | Normalized against a small alias table (e.g. "AMZN Mktp" → "Amazon") |
| Order date | `item.purchased`, `provenance.date` | ISO date |
| Line item description | `item.name` | Raw text kept in `document.rawText` for re-parsing later |
| Price paid | `item.pricePaidUsd`, `provenance.priceUsd` | Per-line-item price, not order total, when the order has multiple items |
| Serial / model number | `item.serial` | Present in ~15-20% of emails (mostly electronics/appliances); absent from paper receipts almost always |
| Warranty term | `item.warrantyUntil` | Derived from manufacturer default term when the email/product page states one; otherwise left null until confirmed |
| Order id | `provenance.orderId`, `document.sourceId` | Primary key for re-matching if the same email is re-ingested |
| Source document | `document.type` (`email` \| `export-row` \| `account-history` \| `photographed-receipt`), `document.uri` | `uri` is a local reference (message id, file path) — never a hosted copy unless the user opts in |

## Reconciliation with the camera pass

Every item ends up in one of three states:

- **matched** — a receipt/order-history row and a camera-located item agree on **merchant + date + price** (date within ±3 days to absorb shipping/billing lag, price within a few dollars for tax/rounding). The item record carries both `provenance` and a `location`.
- **needs-camera** — a receipt exists but no located item matches it yet. Surfaced as a to-do during the room sweep ("we have a receipt for a KitchenAid stand mixer, have we seen it?").
- **provenance-unknown** — a camera-located item has no matching receipt after ingestion. Common for gifts, cash buys, and pre-email-era purchases. Not a failure state — it's expected and should stay visibly flagged rather than silently backfilled with guesses.

Match rule of thumb, in order: exact order id (if the camera pass ever captures one, e.g. from a still-attached shipping label) → merchant + date + price within tolerance → merchant + item-name fuzzy match + price within tolerance. Anything below that confidence threshold stays `needs-camera` rather than auto-matching wrong.

## Privacy posture

- **Read-only mail scopes only.** No send, no delete, no label-write access requested for ingestion — Gmail/IMAP read scope, nothing broader.
- **Local-first parsing option.** Default path: parsing runs on-device (or in a user-controlled process); raw email/receipt content never has to leave the machine to produce the structured `item`/`provenance`/`document` rows.
- **Nothing leaves the device without explicit opt-in.** Any sync of the index to a hosted PointCast surface (for the MCP server, cross-device access, etc.) is a separate, explicit action — never a side effect of running ingestion.
- **Delete-everything.** One action removes the local index, any cached parsed documents, and revokes the mail read scope. No soft-delete, no "recoverable for 30 days" — gone means gone.

## Coverage target

Expect **60-70% of high-value items** (electronics, appliances, furniture, bikes, tools over ~$100) to be identified before any camera/walking pass, for a household with a few years of email history and at least one Amazon account. Coverage is lower for: households that shop mostly in cash/local stores, items older than the inbox, and gifted items. The camera pass exists specifically to close that remaining 30-40%, plus everything with zero paper trail.

## Open questions

- Where does OCR for photographed paper receipts run — fully local model, or an opt-in cloud OCR call — and what's the accuracy delta?
- How do we normalize retailer name variants (email "from" domains, statement descriptors, account-history labels) into one canonical `retailer` value without a large hand-built alias table?
- Multi-item orders: how much per-line-item price accuracy can we get from HTML email parsing vs. just falling back to "order total, N items, split evenly"?
- Do we ever attempt automatic re-matching when a `needs-camera` item is later located, or does that always require a manual confirm to protect the "no wrong auto-match" rule?
- Should warranty-term defaults (e.g. "Best Buy = 1 year standard") live in this ingestion layer or in a separate, retailer-agnostic warranty-rules table?
