/**
 * /.well-known/oauth-authorization-server — RFC 8414 OAuth 2.0 Authorization
 * Server Metadata.
 *
 * PointCast relays Google OAuth 2.0 at /api/auth/google/start (authorization
 * endpoint). We don't mint our own tokens — the callback exchanges the code
 * with Google at accounts.google.com/o/oauth2/token and stores the result in
 * a signed pc_session cookie. Token endpoint is therefore Google's, advertised
 * via redirect.
 *
 * Companion: /.well-known/openid-configuration (OIDC flavor),
 *            /.well-known/oauth-protected-resource (RFC 9728 for API access).
 */

export const onRequest: PagesFunction = async () => {
  const metadata = {
    issuer: 'https://pointcast.xyz',
    authorization_endpoint: 'https://pointcast.xyz/api/auth/google/start',
    token_endpoint: 'https://oauth2.googleapis.com/token',
    jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    scopes_supported: ['openid', 'email', 'profile'],
    token_endpoint_auth_methods_supported: ['client_secret_post'],
    code_challenge_methods_supported: ['S256'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    service_documentation: 'https://pointcast.xyz/for-agents',
    op_policy_uri: 'https://pointcast.xyz/robots.txt',
    op_tos_uri: 'https://pointcast.xyz/manifesto',
  };

  return new Response(JSON.stringify(metadata, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
