import review from '../../data/machine-room.json';
export const GET = () => new Response(JSON.stringify({schema:'pointcast.machine-room/v1',url:'https://pointcast.xyz/reviews/machine-room',...review,affiliateLinks:false,handsOn:false},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});
