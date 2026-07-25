/**
 * /.well-known/agents.json — conventional discovery alias for /agents.json.
 *
 * The alias has been advertised in robots.txt, agents.json, and the CORS
 * applies-list since April, but the _redirects 200-rewrite that was meant
 * to serve it never fires in production (Pages Functions middleware
 * matches every route, so the static-layer rewrite is skipped). This
 * makes the alias a real prerendered file instead — same content, same
 * build, no redirect machinery involved.
 */
export { GET } from '../agents.json.ts';
