import guide from "../data/shop-guides/camera-history.json";
export const GET = () => new Response(JSON.stringify({schema:"pointcast.research-guide/v1",...guide}),{headers:{"Content-Type":"application/json; charset=utf-8"}});
