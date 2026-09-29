import review from '../../data/playstation-2026.json';
export const GET = () => new Response(JSON.stringify({schema:'pointcast.game-buying-guide/v1',url:'https://pointcast.xyz/reviews/playstation-2026',...review,affiliateLinks:false,handsOn:false},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});
