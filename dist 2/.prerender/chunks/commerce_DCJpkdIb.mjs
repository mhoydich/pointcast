const COMMERCE_VERSION = "commerce-hub-v1-2026-05-05";
const CHECKOUT_POLICY = {
  mode: "outbound-only",
  summary: "PointCast is a discovery, merchandising, and agent-readable routing layer. PointCast does not sell, fulfill, process payment, or collect card/PII.",
  payment: "external-checkout",
  pii: "none-collected"
};
const SCHEMA_AVAILABILITY = {
  "in-stock": "https://schema.org/InStock",
  "out-of-stock": "https://schema.org/OutOfStock",
  preorder: "https://schema.org/PreOrder",
  discontinued: "https://schema.org/Discontinued"
};
function schemaAvailability(availability) {
  return SCHEMA_AVAILABILITY[availability] ?? "https://schema.org/LimitedAvailability";
}
function checkoutHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "external checkout";
  }
}
function pairingsUrls(moods = []) {
  return moods.map((mood) => `https://pointcast.xyz/pairings/${mood}`);
}
function sourceKind(product) {
  const brand = String(product.brand || "").toLowerCase();
  const host = checkoutHost(product.url);
  if (brand === "good feels" || host === "getgoodfeels.com") return "good-feels";
  if (brand.includes("pointcast") || host.endsWith(".myshopify.com")) return "pointcast-merch";
  return "external";
}
function sourceLabel(kind) {
  if (kind === "good-feels") return "Good Feels";
  if (kind === "pointcast-merch") return "PointCast Merch";
  return "External Shop";
}

export { CHECKOUT_POLICY as C, sourceLabel as a, schemaAvailability as b, checkoutHost as c, COMMERCE_VERSION as d, pairingsUrls as p, sourceKind as s };
