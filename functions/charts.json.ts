import { handleCharts } from './api/charts.ts';

// The agent-readable twin of /charts: the same three public charts, consensus, movement and fresh releases.
export const onRequest: PagesFunction<{ VISITS?: KVNamespace }> = ({ request, env }) => handleCharts(request, env);
