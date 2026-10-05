import guide from "../../data/shop-guides/charging-supplies.json";
export const GET = () => new Response(JSON.stringify({ schema: "pointcast.research-guide/v1", asOf: "2026-10-05", ...guide }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
