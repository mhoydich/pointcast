import desk from '../../../data/ues-project-briefs.json';
export function getStaticPaths() { return desk.projects.map(project=>({params:{slug:project.slug},props:{project}})); }
export const GET = ({props}: {props:{project:typeof desk.projects[number]}}) => new Response(JSON.stringify({version:desk.version,updatedAt:desk.updatedAt,status:desk.status,implementationStatus:desk.implementationStatus,applicationsOpen:false,admissionsOpen:false,...props.project},null,2),{headers:{'Content-Type':'application/json; charset=utf-8'}});
