import course from '../../data/prediction-curriculum.json';
import landscape from '../../data/prediction-landscape.json';
export const prerender = true;
export function GET() {
  return new Response(JSON.stringify({schemaVersion:1,course,landscape},null,2)+'\n',{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=0, must-revalidate'}});
}
