import review from '../../data/ai-plans.json';
export const GET = () => new Response(JSON.stringify({schema:'pointcast.ai-plans/v1',url:'https://pointcast.xyz/reviews/ai-plans',...review,affiliateLinks:false,handsOn:false},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});
