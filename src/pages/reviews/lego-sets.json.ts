import review from '../../data/lego-sets.json';
export const GET = () => new Response(JSON.stringify({schema:'pointcast.lego-desk-review/v1',url:'https://pointcast.xyz/reviews/lego-sets',...review,affiliateLinks:false,handsOn:false},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});
