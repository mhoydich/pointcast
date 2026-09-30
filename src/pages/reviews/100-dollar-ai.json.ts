import guide from '../../data/100-dollar-ai.json';
export const GET=()=>new Response(JSON.stringify({schema:'pointcast.ai-challenge/v1',url:'https://pointcast.xyz/reviews/100-dollar-ai',...guide},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});
