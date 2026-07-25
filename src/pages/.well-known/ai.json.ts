/**
 * /.well-known/ai.json — secondary discovery alias for /agents.json.
 *
 * Same story as /.well-known/agents.json: advertised everywhere, but the
 * _redirects rewrite never applied in production. Served as a real
 * prerendered file so agents following the well-known convention land on
 * the manifest without a detour.
 */
export { GET } from '../agents.json.ts';
