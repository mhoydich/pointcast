/**
 * The Base rail: x402 v2 "exact" USDC on Base mainnet, settled through the
 * Coinbase CDP facilitator, with the Bazaar discovery extension so a settled
 * payment lists the route in the CDP x402 Bazaar.
 *
 * This sits beside the Etherlink rail in x402-gate.ts; it does not replace it.
 * It stays closed until CDP_API_KEY_ID and CDP_API_KEY_SECRET are set as Pages
 * secrets. Pattern mirrors The Wild (the-wild-x402 lib/x402-server.ts), which
 * has settled real Base payments through the same SDK versions.
 */
import { createCdpFacilitatorClient } from '@coinbase/cdp-sdk/x402';
import {
  type FacilitatorClient,
  type HTTPAdapter,
  type HTTPRequestContext,
  type RouteConfig,
  x402HTTPResourceServer,
  x402ResourceServer,
} from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { bazaarResourceServerExtension } from '@x402/extensions/bazaar';
import { createPublicClient, fallback, getAddress, http, isAddressEqual, parseAbi, type Address, type Hex } from 'viem';
import { base } from 'viem/chains';

export const BASE_NETWORK = 'eip155:8453' as const;
export const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
export const BASE_FACILITATOR = 'https://api.cdp.coinbase.com/platform/v2/x402' as const;
export const BASE_DEFAULT_PAY_TO = '0x48e8479b4906d45fbe702a18ac2454f800238b37' as const;
export const BASE_PRICE_UNITS = '10000'; // 0.01 USDC

export interface BaseRailEnv {
  CDP_API_KEY_ID?: string;
  CDP_API_KEY_SECRET?: string;
  X402_BASE_PAY_TO?: string;
  X402_BASE_ENABLED?: string;
}

export type BaseRailConfig =
  | { ready: true; payTo: Address; apiKeyId: string; apiKeySecret: string }
  | { ready: false; state: 'disabled' | 'awaiting_configuration'; missing: string[] };

const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);

export function baseRailConfig(env: BaseRailEnv): BaseRailConfig {
  if (clean(env.X402_BASE_ENABLED) === 'false') return { ready: false, state: 'disabled', missing: [] };
  const apiKeyId = clean(env.CDP_API_KEY_ID);
  const apiKeySecret = clean(env.CDP_API_KEY_SECRET);
  const missing = [!apiKeyId && 'CDP_API_KEY_ID', !apiKeySecret && 'CDP_API_KEY_SECRET'].filter(Boolean) as string[];
  if (!apiKeyId || !apiKeySecret) return { ready: false, state: 'awaiting_configuration', missing };
  let payTo: Address;
  try { payTo = getAddress(clean(env.X402_BASE_PAY_TO) ?? BASE_DEFAULT_PAY_TO); }
  catch { return { ready: false, state: 'awaiting_configuration', missing: ['X402_BASE_PAY_TO (invalid)'] }; }
  return { ready: true, payTo, apiKeyId, apiKeySecret };
}

/** Anything with the facilitator client's verify/settle/getSupported surface (tests inject one). */
export type FacilitatorLike = FacilitatorClient;

export interface BaseRoute {
  /** e.g. 'GET /api/oracle/paddles' */
  route: string;
  config: Omit<RouteConfig, 'accepts'>;
}

const servers = new Map<string, Promise<x402HTTPResourceServer>>();

/** Build (once per isolate, per route + config) the SDK server for one paid route. */
export function baseServer(
  cfg: Extract<BaseRailConfig, { ready: true }>,
  route: BaseRoute,
  facilitator?: FacilitatorLike,
): Promise<x402HTTPResourceServer> {
  const key = `${route.route}|${cfg.payTo}|${cfg.apiKeyId}|${facilitator ? 'injected' : 'cdp'}`;
  const cached = servers.get(key);
  if (cached) return cached;
  const client = facilitator ?? createCdpFacilitatorClient({ apiKeyId: cfg.apiKeyId, apiKeySecret: cfg.apiKeySecret, baseUrl: BASE_FACILITATOR });
  const resourceServer = new x402ResourceServer(client as FacilitatorClient)
    .register(BASE_NETWORK, new ExactEvmScheme())
    .registerExtension(bazaarResourceServerExtension);
  const http402 = new x402HTTPResourceServer(resourceServer, {
    [route.route]: {
      ...route.config,
      accepts: { scheme: 'exact', network: BASE_NETWORK, payTo: cfg.payTo, price: '$0.01', maxTimeoutSeconds: 60 },
    } as RouteConfig,
  });
  const promise = http402.initialize().then(() => http402);
  promise.catch(() => servers.delete(key));
  servers.set(key, promise);
  return promise;
}

class RequestAdapter implements HTTPAdapter {
  constructor(private readonly request: Request) {}
  getHeader(name: string) { return this.request.headers.get(name) ?? undefined; }
  getMethod() { return this.request.method; }
  getPath() { return new URL(this.request.url).pathname; }
  getUrl() { return this.request.url; }
  getAcceptHeader() { return this.request.headers.get('Accept') ?? ''; }
  getUserAgent() { return this.request.headers.get('User-Agent') ?? ''; }
  getQueryParams() {
    const out: Record<string, string> = {};
    new URL(this.request.url).searchParams.forEach((v, k) => { out[k] = v; });
    return out;
  }
  getQueryParam(name: string) { return new URL(this.request.url).searchParams.get(name) ?? undefined; }
}

export function baseRequestContext(request: Request): HTTPRequestContext {
  const adapter = new RequestAdapter(request);
  return {
    adapter,
    path: adapter.getPath(),
    method: adapter.getMethod(),
    paymentHeader: adapter.getHeader('payment-signature') ?? adapter.getHeader('x-payment'),
  };
}

export const BASE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Payment-Signature, X-Payment',
  'Access-Control-Expose-Headers': 'Payment-Required, Payment-Response, X-Payment-Response',
  'Cache-Control': 'private, no-store',
};

export function baseJson(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: { ...BASE_HEADERS, ...extra } });
}

export function protocolResponse(i: { status: number; headers: Record<string, string>; body?: unknown }): Response {
  return new Response(JSON.stringify(i.body ?? {}, null, 2), { status: i.status, headers: { ...BASE_HEADERS, ...i.headers } });
}

/** The payer + EIP-3009 nonce a Base "exact" payment signs, read without trusting it. */
export function eip3009Identity(header: string | undefined | null): { from: Address; to: Address; value: string; nonce: Hex } | null {
  if (!header) return null;
  try {
    const decoded = JSON.parse(atob(header)) as Record<string, any>;
    const auth = decoded?.payload?.authorization;
    if (decoded?.x402Version !== 2 || decoded?.accepted?.network !== BASE_NETWORK || !auth) return null;
    if (!/^0x[0-9a-fA-F]{64}$/.test(String(auth.nonce)) || !/^\d+$/.test(String(auth.value))) return null;
    return { from: getAddress(auth.from), to: getAddress(auth.to), value: String(auth.value), nonce: auth.nonce as Hex };
  } catch {
    return null;
  }
}

/** Terms we will settle: Base, exact, USDC, one cent, to our address. Fails closed. */
export function termsOk(
  cfg: Extract<BaseRailConfig, { ready: true }>,
  requirements: { network?: string; scheme?: string; asset?: string; amount?: string; payTo?: string },
  identity: { to: Address; value: string } | null,
): boolean {
  try {
    return requirements.network === BASE_NETWORK && requirements.scheme === 'exact'
      && isAddressEqual(getAddress(String(requirements.asset)), BASE_USDC)
      && requirements.amount === BASE_PRICE_UNITS
      && isAddressEqual(getAddress(String(requirements.payTo)), cfg.payTo)
      && !!identity && identity.value === BASE_PRICE_UNITS && isAddressEqual(identity.to, cfg.payTo);
  } catch {
    return false;
  }
}

const USDC_ABI = parseAbi(['function authorizationState(address authorizer, bytes32 nonce) view returns (bool)']);

/** Has this EIP-3009 authorization been used on Base? null when every RPC failed. */
export async function authorizationUsed(from: Address, nonce: Hex): Promise<boolean | null> {
  try {
    const client = createPublicClient({
      chain: base,
      transport: fallback([
        http('https://base-rpc.publicnode.com'),
        http('https://base.llamarpc.com'),
        http('https://mainnet.base.org'),
      ]),
    });
    return await client.readContract({ address: BASE_USDC, abi: USDC_ABI, functionName: 'authorizationState', args: [from, nonce] });
  } catch {
    return null;
  }
}
