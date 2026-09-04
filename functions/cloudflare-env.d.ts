declare namespace Cloudflare {
  interface Env {
    VISITS?: KVNamespace;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    PASSKEY_ALLOWED_ORIGINS?: string;
    SEND_EMAIL?: SendEmail;
    KENNEL_DAILY?: Fetcher;
    RESEND_API_KEY?: string;
    RESEND_WEBHOOK_SECRET?: string;
    PC_RATES_KV?: KVNamespace;
    POINTCAST_BROADCAST_EMAIL?: string;
    SPOTIFY_CLIENT_ID?: string;
    SPOTIFY_CLIENT_SECRET?: string;
    SPOTIFY_TOKEN_ENCRYPTION_KEY?: string;
    SHOPIFY_CLIENT_ID?: string;
    SHOPIFY_CLIENT_SECRET?: string;
    POINTCAST_INTEGRATION_ENCRYPTION_KEY?: string;
    POINTCAST_25_CHECKOUT_URL?: string;
    KENNEL_CLUB_CLAIM_SECRET_KEY?: string;
    KENNEL_CLUB_CLAIM_DAILY_CAP?: string;
    X402_PAY_TO?: string;
    X402_FACILITATOR_URL?: string;
    X402_PRICE_UNITS?: string;
    X402_ASSET?: string;
    X402_RECEIPT_SK?: string;
    X402_RECEIPT_AGENT_ID?: string;
    X402_MODE?: string;
    POST_OFFICE_PRICE_UNITS?: string;
    POST_OFFICE_ALIAS_DAILY_CAP?: string;
    POST_OFFICE_GLOBAL_DAILY_CAP?: string;
  }
}
