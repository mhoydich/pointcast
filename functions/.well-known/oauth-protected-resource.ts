/**
 * /.well-known/oauth-protected-resource — RFC 9728 OAuth 2.0 Protected
 * Resource Metadata.
 *
 * Tells agents which authorization servers can issue tokens accepted by
 * pointcast.xyz APIs, what scopes are supported, and how to present bearer
 * tokens. Currently most APIs are OPEN (no auth required) but we advertise
 * Google + pointcast-relay as the two authorization servers if a caller
 * wants to authenticate (e.g. to associate a request with an identity).
 *
 * Spec: https://www.rfc-editor.org/rfc/rfc9728
 */

export const onRequest: PagesFunction = async () => {
  const metadata = {
    resource: 'https://pointcast.xyz',
    authorization_servers: [
      'https://pointcast.xyz',            // PointCast's relay (see oauth-authorization-server)
      'https://accounts.google.com',      // Google's primary OIDC issuer (delegated auth)
    ],
    scopes_supported: ['openid', 'email', 'profile'],
    bearer_methods_supported: ['header', 'cookie'],
    resource_documentation: 'https://pointcast.xyz/for-agents',
    resource_policy_uri: 'https://pointcast.xyz/robots.txt',
    resource_name: 'PointCast — a living broadcast from El Segundo',
    resource_tos_uri: 'https://pointcast.xyz/manifesto',
    resource_signing_alg_values_supported: ['RS256'],
    // Authentication is OPTIONAL for most endpoints (ping, presence, drop,
    // drum, polls, feedback). When present, it's consumed via pc_session
    // cookie or Authorization: Bearer header.
    authentication_required: false,
    open_apis: [
      'https://pointcast.xyz/api/ping',
      'https://pointcast.xyz/api/presence/snapshot',
      'https://pointcast.xyz/api/drop',
      'https://pointcast.xyz/api/drum',
      'https://pointcast.xyz/api/poll',
      'https://pointcast.xyz/api/feedback',
    ],
  };

  return new Response(JSON.stringify(metadata, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
