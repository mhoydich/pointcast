import review from '../../data/home-robots.json';
export const GET = () => new Response(JSON.stringify({schema:'pointcast.home-robots/v1',url:'https://pointcast.xyz/reviews/home-robots',...review,affiliateLinks:false,handsOn:false},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});
