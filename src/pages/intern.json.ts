import type { APIRoute } from 'astro';
import sourceCatalog from '../data/intern-role-library.json';
import { normalizeRoleLibrary } from '../lib/intern-role-library.mjs';
const catalog = normalizeRoleLibrary(sourceCatalog);
export const GET: APIRoute = () => new Response(JSON.stringify({title:'PointCast Intern role library + project desk',status:'historical_role_library_and_educational_project_briefs',applicationsOpen:false,opportunities:[],work:[],descriptionCheckedAt:catalog.verifiedAt,counts:catalog.counts,programReferences:catalog.program_references,roles:catalog.roles.map(role=>({...role,url:`https://pointcast.xyz/intern/roles/${role.slug}/`})),lab:'https://pointcast.xyz/communications-lab/',briefs:'https://pointcast.xyz/communications-lab/briefs.json',pendingTerms:['Pay','Hours','Hiring entity','Supervisor','Eligibility','Agreements','Privacy']},null,2),{headers:{'Content-Type':'application/json; charset=utf-8'}});
