/**
 * /knock.json — machine-readable contract for the random-door gate.
 *
 * The interactive page fetches /explore.json at runtime, removes routes that
 * would loop back into discovery, and opens one of the remaining rooms.
 */
import type { APIRoute } from 'astro';

const excludedRoutes = ['/knock', '/explore', '/404'];

export const GET: APIRoute = () => {
  const payload = {
    $schema: 'https://pointcast.xyz/knock.json',
    name: 'PointCast random-door gate',
    status: 'live',
    human: 'https://pointcast.xyz/knock',
    action: {
      label: 'knock',
      method: 'client-side random selection',
      destinationSource: 'https://pointcast.xyz/explore.json',
      destinationField: 'features[].slug',
      excludedRoutes,
      fallbackRoutes: ['/drum', '/cast', '/about', '/now'],
      navigationDelayMs: 1100,
    },
    guarantees: [
      'No login is required.',
      'The gate does not persist visitor state.',
      'The destination is selected in the visitor client.',
    ],
    related: {
      townMap: 'https://pointcast.xyz/explore',
      townMapJson: 'https://pointcast.xyz/explore.json',
      agentManifest: 'https://pointcast.xyz/agents.json',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      Link: '<https://pointcast.xyz/knock>; rel="alternate"; type="text/html", <https://pointcast.xyz/explore.json>; rel="item-source"; type="application/json"',
    },
  });
};
