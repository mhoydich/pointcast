import review from '../../data/chef-knives.json';
export const GET = () => new Response(JSON.stringify({schema:'pointcast.chef-knives/v1',url:'https://pointcast.xyz/reviews/chef-knives',...review,affiliateLinks:false,handsOn:false},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});
