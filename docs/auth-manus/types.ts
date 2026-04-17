/**
 * PointCast Multi-Provider Authentication Types
 * @file src/lib/auth/types.ts
 *
 * These types are shared between the Cloudflare Pages Functions backend
 * and the Astro frontend. They define the canonical shape of all auth-related
 * data structures stored in Cloudflare KV and passed over the API.
 */

// ---------------------------------------------------------------------------
// Provider Identifiers
// ---------------------------------------------------------------------------

/** All supported authentication providers. */
export type AuthProvider =
  | 'google'
  | 'apple'
  | 'metamask'   // Ethereum / SIWE
  | 'phantom'    // Solana / SIWS
  | 'kukai'      // Tezos / Beacon SDK
  | 'temple'     // Tezos / Beacon SDK
  | 'umami';     // Tezos / Beacon SDK

/** Grouping for UI rendering and flow selection. */
export type ProviderCategory = 'social' | 'tezos' | 'ethereum' | 'solana';

export const PROVIDER_CATEGORY_MAP: Record<AuthProvider, ProviderCategory> = {
  google: 'social',
  apple: 'social',
  kukai: 'tezos',
  temple: 'tezos',
  umami: 'tezos',
  metamask: 'ethereum',
  phantom: 'solana',
};

// ---------------------------------------------------------------------------
// KV Data Structures
// ---------------------------------------------------------------------------

/**
 * A single identity link, stored within the User object.
 * Represents a verified connection between a PointCast user and a provider.
 */
export interface UserIdentity {
  /** The authentication provider. */
  provider: AuthProvider;
  /**
   * The provider's unique identifier for this user.
   * - Google/Apple: The `sub` claim from the OIDC id_token.
   * - MetaMask: The checksummed Ethereum address (0x...).
   * - Phantom: The Base58-encoded Solana public key.
   * - Tezos wallets: The Tezos address (tz1..., tz2..., tz3...).
   */
  providerId: string;
  /** Unix timestamp when this identity was linked. */
  linkedAt: number;
}

/**
 * User preferences, migrated from localStorage on first sign-in.
 * All fields are optional to support partial migration.
 */
export interface UserPreferences {
  drumName?: string;
  noun?: string;
}

/**
 * The canonical PointCast User object.
 * KV Key: `user:{userId}`
 */
export interface User {
  /** Unique PointCast user ID. Format: `usr_{ulid}` */
  id: string;
  /** Unix timestamp of account creation. */
  createdAt: number;
  /** All linked provider identities. A user may have multiple. */
  identities: UserIdentity[];
  /** User preferences, synced from localStorage on first sign-in. */
  preferences: UserPreferences;
}

/**
 * Active server-side session.
 * KV Key: `session:{sessionId}`
 * KV TTL: Set to match `expiresAt` for automatic eviction.
 */
export interface Session {
  /** Unique session ID. Format: `sess_{uuid}` */
  id: string;
  /** The PointCast user this session belongs to. */
  userId: string;
  /** Unix timestamp when the session was created. */
  createdAt: number;
  /** Unix timestamp when the session expires. */
  expiresAt: number;
  /** Which provider was used to establish this session. */
  provider: AuthProvider;
}

/**
 * Temporary OAuth state stored in KV during the authorization code flow.
 * KV Key: `oauth_state:{state}`
 * KV TTL: 5 minutes.
 */
export interface OAuthState {
  /** The nonce to include in the OIDC request and verify in the id_token. */
  nonce: string;
  /** localStorage preferences to migrate on first sign-in. */
  preferences?: UserPreferences;
}

/**
 * Temporary nonce stored in KV for Web3 signature challenges.
 * KV Key: `nonce:{nonce}`
 * KV TTL: 5 minutes.
 */
export interface Web3Nonce {
  /** The provider this nonce was issued for. */
  provider: AuthProvider;
  /** Unix timestamp when the nonce was issued. */
  issuedAt: number;
}

// ---------------------------------------------------------------------------
// API Request / Response Shapes
// ---------------------------------------------------------------------------

/**
 * Request body for Web3 signature verification.
 * POST /api/auth/web3/verify
 */
export interface Web3VerifyRequest {
  provider: AuthProvider;
  /** The raw signature hex string. */
  signature: string;
  /** The original message that was signed (SIWE/SIWS/Beacon payload). */
  message: string;
  /** The nonce that was embedded in the message. */
  nonce: string;
  /** For Tezos: the signer's public key (needed for verifySignature). */
  publicKey?: string;
  /** localStorage preferences to migrate on first sign-in. */
  preferences?: UserPreferences;
}

/**
 * Standard API response for auth endpoints.
 */
export interface AuthApiResponse {
  success: boolean;
  /** Populated on success. */
  user?: Pick<User, 'id' | 'preferences'>;
  /** Populated on error. */
  error?: string;
}

// ---------------------------------------------------------------------------
// Frontend Auth State
// ---------------------------------------------------------------------------

/**
 * The auth state available to Astro components and client-side scripts.
 * This is populated by reading the session cookie and fetching /api/auth/me.
 */
export interface ClientAuthState {
  isAuthenticated: boolean;
  user?: Pick<User, 'id' | 'preferences' | 'identities'>;
  /** Whether the current session was established via a Web3 provider. */
  isWeb3: boolean;
}
