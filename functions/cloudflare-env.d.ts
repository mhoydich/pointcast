declare namespace Cloudflare {
  interface Env {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    PASSKEY_ALLOWED_ORIGINS?: string;
    SEND_EMAIL?: SendEmail;
    PC_RATES_KV?: KVNamespace;
    POINTCAST_BROADCAST_EMAIL?: string;
    SPOTIFY_CLIENT_ID?: string;
    SPOTIFY_CLIENT_SECRET?: string;
    SPOTIFY_TOKEN_ENCRYPTION_KEY?: string;
    SHOPIFY_CLIENT_ID?: string;
    SHOPIFY_CLIENT_SECRET?: string;
    POINTCAST_INTEGRATION_ENCRYPTION_KEY?: string;
    POINTCAST_25_CHECKOUT_URL?: string;
  }
}
