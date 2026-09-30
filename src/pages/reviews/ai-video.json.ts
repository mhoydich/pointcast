import review from '../../data/ai-video.json';
export const GET = () => new Response(JSON.stringify({schema:'pointcast.ai-video/v1',url:'https://pointcast.xyz/reviews/ai-video',...review,affiliateLinks:false,handsOn:false},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});
