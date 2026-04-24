/**
 * /.well-known/openid-configuration — OpenID Connect Discovery 1.0.
 *
 * Same underlying setup as oauth-authorization-server but with the OIDC-
 * specific fields (userinfo endpoint, id_token claims, etc.). PointCast
 * proxies Google's OIDC flow via /api/auth/google/{start,callback}.
 *
 * Spec: https://openid.net/specs/openid-connect-discovery-1_0.html
 */

export const onRequest: PagesFunction = async () => {
  const metadata = {
    issuer: 'https://pointcast.xyz',
    authorization_endpoint: 'https://pointcast.xyz/api/auth/google/start',
    token_endpoint: 'https://oauth2.googleapis.com/token',
    userinfo_endpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
    jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'email', 'profile'],
    token_endpoint_auth_methods_supported: ['client_secret_post'],
    claims_supported: ['sub', 'email', 'email_verified', 'name', 'picture', 'iss', 'aud'],
    code_challenge_methods_supported: ['S256'],
    grant_types_supported: ['authorization_code'],
    service_documentation: 'https://pointcast.xyz/for-agents',
  };

  return new Response(JSON.stringify(metadata, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
