import review from '../../data/bags-south-bay.json';
export const GET = () => new Response(JSON.stringify({schema:'pointcast.bags-desk-review/v1',url:'https://pointcast.xyz/reviews/bags',...review,affiliateLinks:false,handsOn:false},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});
