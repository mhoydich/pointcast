import review from '../../data/balm-shelf.json';
export const GET = () => new Response(JSON.stringify({schema:'pointcast.balm-shelf/v1',url:'https://pointcast.xyz/reviews/balm-shelf',...review,affiliateLinks:false,handsOn:false,medicalAdvice:false},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});
