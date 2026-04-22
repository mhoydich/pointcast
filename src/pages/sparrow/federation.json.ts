/**
 * /sparrow/federation.json — v0.32
 *
 * Editorially-maintained starter seeds for the /sparrow/friends
 * federation surface. Replaces the hard-coded STARTERS array in
 * friends.astro so curation is a data edit, not a code deploy (well,
 * it's still a deploy, but the edit lives in one obvious place).
 *
 * Shape: sparrow-federation-v1
 *   {
 *     schema, version, curated_at,
 *     starters: [ { hex, alias, note? } ],
 *     notes: { ... }
 *   }
 *
 * The friends page fetches this on load, falls back to an internal
 * seed if the fetch fails (offline, CDN hiccup, etc). Alias + note
 * are display-only; the relationship that matters is still the
 * pubkey + whatever the signer resolves via NIP-01 kind-0.
 */

import type { APIRoute } from 'astro';

interface Starter {
  hex: string;
  alias: string;
  note?: string;
}

const starters: Starter[] = [
  {
    hex: '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
    alias: 'jack',
    note: 'jack dorsey · writes about Nostr + payments',
  },
  {
    hex: '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d',
    alias: 'fiatjaf',
    note: 'fiatjaf · Nostr protocol author',
  },
  // Edit in place to curate. Adding a line ships a new federation.json.
  // No code change needed in friends.astro.
];

export const GET: APIRoute = async () => {
  const body = {
    schema: 'sparrow-federation-v1',
    version: '0.32',
    curated_at: '2026-04-21',
    curator: 'pointcast.xyz editorial',
    docs: 'https://pointcast.xyz/sparrow.json · nostr.federation_json',
    starters,
    notes: {
      scope: 'Starter seeds are suggestions — following them is one click, unfollowing is one click. Not a bootstrap list, not a whitelist.',
      caveat: 'Aliases here are editorial labels. Once a starter is followed, Sparrow\'s NIP-01 kind-0 lookup takes over and the alias can be replaced by the subject\'s own display_name.',
      editing: 'Want your pubkey added? Open an issue / PR on the pointcast.xyz repo or ping via /api/ping.',
    },
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=900',
      'access-control-allow-origin': '*',
    },
  });
};
