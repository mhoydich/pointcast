import desk from '../../../data/ues-project-briefs.json';
export const GET = () => new Response(JSON.stringify(desk,null,2), {headers:{'Content-Type':'application/json; charset=utf-8'}});
