import review from '../../data/modular-carry.json';
export const GET = () => new Response(JSON.stringify({schema:'pointcast.modular-carry/v1',url:'https://pointcast.xyz/reviews/modular-carry',...review,affiliateLinks:false,handsOn:false},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});
