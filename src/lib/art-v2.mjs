const text = (value) => typeof value === 'string' ? value : '';
const dimension = (value) => Number.isFinite(value) && value > 0 ? Math.round(value) : null;
const privateReference = /(?:\/Users\/|\/home\/|\/tmp\/|\/private\/|\/var\/folders\/|\/Volumes\/|\b[a-z]:[\\/]|file:\/\/|sediment:\/\/|library-file:|project-file:|\b(?:ownerAccessEvidence|privateOwnerEvidence|privateProof|accountId|ownerEmail)\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)/i;
function publicText(value) {
  const content = text(value);
  if (privateReference.test(content)) throw new TypeError('Public gallery text failed privacy validation.');
  return content;
}

function publicAssetUrl(value) {
  const input = text(value).trim();
  return /^\/images\/art-v2\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.webp$/i.test(input) ? input : null;
}

function publicUrl(value) {
  const input = text(value).trim();
  try {
    const url = new URL(input);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function publicJobUrl(value) {
  const publicValue = publicUrl(value);
  if (!publicValue) return null;
  const url = new URL(publicValue);
  if (!['www.midjourney.com', 'midjourney.com'].includes(url.hostname) || url.port) return null;
  const match = url.pathname.match(/^\/(?:app\/)?jobs\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i);
  if (!match) return null;
  const result = new URL(`https://www.midjourney.com/jobs/${match[1].toLowerCase()}`);
  const index = url.searchParams.get('index');
  if (index && /^[0-3]$/.test(index)) result.searchParams.set('index', index);
  return result.href;
}

function publicCatalogUrl(value) {
  const publicValue = publicUrl(value);
  if (!publicValue) return null;
  const url = new URL(publicValue);
  if (url.hostname !== 'github.com' || url.port) return null;
  const match = url.pathname.match(/^\/mhoydich\/pointcast\/blob\/([0-9a-f]{40})\/src\/content\/gallery\/([a-z0-9][a-z0-9_-]*)\.json$/i);
  if (!match) return null;
  return `https://github.com/mhoydich/pointcast/blob/${match[1].toLowerCase()}/src/content/gallery/${match[2]}.json`;
}

const sha256 = (value) => /^[0-9a-f]{64}$/i.test(text(value)) ? value.toLowerCase() : null;

/** Explicit projection: owner evidence and any other private input fields stay out of public output. */
export function toPublicManifest(input) {
  return {
    title: publicText(input?.title) || 'A second seeing',
    description: publicText(input?.description),
    createdAt: publicText(input?.createdAt),
    status: publicText(input?.status) || 'review',
    url: 'https://pointcast.xyz/art/v2/',
    works: (Array.isArray(input?.works) ? input.works : []).map((work) => ({
      id: publicText(work.id),
      number: Number.isFinite(work.number) ? work.number : null,
      title: publicText(work.title),
      category: publicText(work.category) || 'Uncategorized',
      source: {
        jobUrl: publicJobUrl(work.source?.jobUrl),
        catalogUrl: publicCatalogUrl(work.source?.catalogUrl),
        prompt: publicText(work.source?.prompt),
        promptKind: work.source?.promptKind === 'fragment' ? 'fragment' : 'unavailable',
        generationDate: publicText(work.source?.generationDate),
        attribution: publicText(work.source?.attribution),
        referenceRole: publicText(work.source?.referenceRole),
        visualFamily: publicText(work.source?.visualFamily),
        sha256: sha256(work.source?.sha256),
        asset: publicAssetUrl(work.source?.asset),
        thumbnail: publicAssetUrl(work.source?.thumbnail),
        thumbnailWidth: dimension(work.source?.thumbnailWidth),
        width: dimension(work.source?.width),
        height: dimension(work.source?.height),
        rightsStatus: publicText(work.source?.rightsStatus) || 'Review pending',
      },
      v2: work.v2 ? {
        title: publicText(work.v2.title),
        caption: publicText(work.v2.caption),
        asset: publicAssetUrl(work.v2.asset),
        thumbnail: publicAssetUrl(work.v2.thumbnail),
        thumbnailWidth: dimension(work.v2.thumbnailWidth),
        width: dimension(work.v2.width),
        height: dimension(work.v2.height),
        prompt: publicText(work.v2.prompt),
        generator: publicText(work.v2.generator),
        generatedAt: publicText(work.v2.generatedAt),
        sha256: sha256(work.v2.sha256),
        masterSha256: sha256(work.v2.masterSha256),
      } : null,
      // This gallery is a review edition. No purchase or chain configuration is published.
      commerce: {
        status: 'unavailable',
        priceMutez: 1000000,
        network: null,
        tokenId: null,
        contract: null,
        listingUrl: null,
      },
    })),
  };
}

export function normalizeSearch(value) {
  return text(value).normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase().trim();
}

export function matchesWork(work, { category = 'all', query = '' } = {}) {
  if (category !== 'all' && work.category !== category) return false;
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const haystack = normalizeSearch([
    work.id, String(work.number ?? ''), String(work.number ?? '').padStart(2, '0'),
    work.title, work.category, work.source?.prompt, work.v2?.title, work.v2?.caption, work.v2?.prompt,
  ].join(' '));
  return tokens.every((token) => haystack.includes(token));
}

export function normalizeView(value) {
  return ['paired', 'source', 'v2'].includes(value) ? value : 'paired';
}

export function stepIndex(current, direction, length) {
  return length > 0 ? ((current + direction) % length + length) % length : -1;
}
