import type { APIRoute } from 'astro';
import sourceCatalog from '../../../data/intern-role-library.json';
import { normalizeRoleLibrary } from '../../../lib/intern-role-library.mjs';
const catalog = normalizeRoleLibrary(sourceCatalog);
export function getStaticPaths() { return catalog.roles.map(role => ({params:{slug:role.slug},props:{role}})); }
export const GET: APIRoute = ({ props }) => new Response(JSON.stringify({...props.role,descriptionCheckedAt:catalog.verifiedAt,applicationsOpen:false,url:`https://pointcast.xyz/intern/roles/${props.role.slug}/`},null,2),{headers:{'Content-Type':'application/json; charset=utf-8'}});
