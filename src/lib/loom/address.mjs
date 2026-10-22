/**
 * The Loom address grammar — "anything with an address can be appended to."
 *
 * Every log on the Loom is keyed by one canonical address string. Messaging a
 * person, replying to a message, commenting on a page and pinning a note to a
 * place are the same operation, `append(to, message)`, against different kinds
 * of address. Canonicalisation is deliberately strict so that two spellings of
 * the same thing always land in the same log (that is what makes threads on
 * different sites stitch together).
 *
 *   https://site/path         url     any page, on PointCast or anywhere else
 *   pc:/court  pc:block/123   url     PointCast shorthand, expands to a URL
 *   @name                     handle  a person or agent by display handle
 *   agent:pci_<32 hex>        agent   a registered PointCast agent identity
 *   tz1…  KT1…  0x…           wallet  a Tezos or EVM address
 *   did:method:id             did     a decentralised identifier
 *   geo:33.918,-118.416       geo     a place, rounded to ~100 m
 *   sha256:<64 hex>           hash    a file or image, wherever it is hosted
 *   #topic                    topic   a public channel
 *   loom:<log>#<message id>   reply   one message; resolves to its log + parent
 */
export const SITE = 'https://pointcast.xyz';
/** Sites in the PointCast family. Their pages are "home" threads on the Loom. */
export const NETWORK = [
  { host: 'pointcast.xyz', name: 'PointCast', url: 'https://pointcast.xyz/' },
  { host: 'tonebloom.xyz', name: 'Tonebloom', url: 'https://tonebloom.xyz/' },
  { host: 'hoydich.wordpress.com', name: 'Hoydich (blog)', url: 'https://hoydich.wordpress.com/' },
  { host: 'mhoydich.github.io', name: 'mhoydich.github.io', url: 'https://mhoydich.github.io/' },
];
const HOME_HOSTS = new Set(NETWORK.map((n) => n.host));

const TRACKING = /^(utm_[a-z]+|fbclid|gclid|mc_cid|mc_eid|ref|ref_src)$/i;
const HANDLE = /^@([a-z0-9][a-z0-9_.-]{0,31})$/i;
const AGENT = /^agent:(pci_[0-9a-f]{32})$/i;
const TEZOS = /^(tz[1-4]|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/;
const EVM = /^0x[0-9a-fA-F]{40}$/;
const DID = /^did:[a-z0-9]{1,16}:[A-Za-z0-9._:%-]{1,120}$/;
const GEO = /^geo:(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/i;
const HASH = /^sha256:([0-9a-f]{64})$/i;
const TOPIC = /^#([a-z0-9][a-z0-9-]{0,39})$/i;
const REPLY = /^loom:([0-9a-f]{24})#(m_[0-9a-z]{6,24})$/;

export class AddressError extends Error {}

function canonicalUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new AddressError('address_invalid_url'); }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new AddressError('address_scheme');
  if (url.username || url.password) throw new AddressError('address_credentials');
  url.hash = '';
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) url.port = '';
  url.protocol = 'https:'; // http and https spellings of one page share a log
  for (const key of [...url.searchParams.keys()]) if (TRACKING.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  let path = url.pathname.replace(/\/{2,}/g, '/');
  if (path.length > 1) path = path.replace(/\/+$/, '').replace(/\/index\.html?$/i, '');
  url.pathname = path || '/';
  const out = url.toString();
  if (out.length > 400) throw new AddressError('address_too_long');
  return out;
}

/** Parse anything a caller might type into { kind, address, label, … }. */
export function parseAddress(input) {
  const raw = String(input ?? '').trim();
  if (!raw) throw new AddressError('address_required');
  if (raw.length > 420) throw new AddressError('address_too_long');
  let m;
  if ((m = raw.match(REPLY))) return { kind: 'reply', address: `loom:${m[1]}#${m[2]}`, logKey: m[1], parent: m[2], label: `reply ${m[2]}` };
  if (/^pc:block\/\d{1,7}$/i.test(raw)) return parseAddress(`${SITE}/b/${raw.split('/')[1]}`);
  if (/^pc:\//i.test(raw)) return parseAddress(`${SITE}${raw.slice(3)}`);
  if (/^https?:\/\//i.test(raw)) {
    const address = canonicalUrl(raw);
    const u = new URL(address);
    return { kind: 'url', address, host: u.hostname, home: HOME_HOSTS.has(u.hostname), label: `${u.hostname}${u.pathname === '/' ? '' : u.pathname}` };
  }
  if ((m = raw.match(HANDLE))) return { kind: 'handle', address: `@${m[1].toLowerCase()}`, label: `@${m[1].toLowerCase()}` };
  if ((m = raw.match(AGENT))) return { kind: 'agent', address: `agent:${m[1].toLowerCase()}`, label: `agent ${m[1].slice(0, 12).toLowerCase()}…` };
  if (TEZOS.test(raw)) return { kind: 'wallet', chain: 'tezos', address: raw, label: `${raw.slice(0, 6)}…${raw.slice(-4)}` };
  if (EVM.test(raw)) return { kind: 'wallet', chain: 'evm', address: raw.toLowerCase(), label: `${raw.slice(0, 6)}…${raw.slice(-4)}`.toLowerCase() };
  if (DID.test(raw)) return { kind: 'did', address: raw, label: raw.length > 28 ? `${raw.slice(0, 26)}…` : raw };
  if ((m = raw.match(GEO))) {
    const lat = Number(m[1]), lon = Number(m[2]);
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new AddressError('address_geo_range');
    const address = `geo:${lat.toFixed(3)},${lon.toFixed(3)}`;
    return { kind: 'geo', address, lat: Number(lat.toFixed(3)), lon: Number(lon.toFixed(3)), label: address.slice(4) };
  }
  if ((m = raw.match(HASH))) return { kind: 'hash', address: `sha256:${m[1].toLowerCase()}`, label: `sha256 ${m[1].slice(0, 10).toLowerCase()}…` };
  if ((m = raw.match(TOPIC))) return { kind: 'topic', address: `#${m[1].toLowerCase()}`, label: `#${m[1].toLowerCase()}` };
  // Bare hostnames ("example.com/page") are the most common thing people paste.
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(raw)) return parseAddress(`https://${raw}`);
  throw new AddressError('address_unrecognised');
}

/** Stable 24-hex key for a canonical address (KV key + reply addresses). */
export async function addressKey(address) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(address)));
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Pull every addressable thing out of free text: links, @handles, #topics. */
export function extractAddresses(text) {
  const body = String(text ?? '');
  const links = [...new Set((body.match(/https?:\/\/[^\s<>()"']+/gi) ?? []).map((s) => s.replace(/[.,;:!?]+$/, '')))];
  const mentions = [...new Set((body.match(/(?:^|[^\w@])@([a-z0-9][a-z0-9_.-]{0,31})/gi) ?? []).map((s) => `@${s.split('@')[1].toLowerCase().replace(/[.]+$/, '')}`))];
  const topics = [...new Set((body.match(/(?:^|[^\w#&])#([a-z][a-z0-9-]{1,39})/gi) ?? []).map((s) => `#${s.split('#')[1].toLowerCase()}`))];
  return { links, mentions, topics };
}
