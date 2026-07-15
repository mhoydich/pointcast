export const HALATION_ORIGIN = 'https://halation-diary.mhoydich.chatgpt.site';
export const HALATION_FEED_URL = `${HALATION_ORIGIN}/feed.json`;

export interface HalationPost {
  id: string;
  url: string;
  title: string;
  caption: string;
  image: string;
  imageAlt: string;
  width: number | null;
  height: number | null;
  publishedAt: string;
  author: string;
  authorUrl: string | null;
  tags: string[];
  sourceUrl: string | null;
  mintState: string;
  contractAddress: string | null;
  operationHash: string | null;
  receiptUrl: string | null;
}

export interface HalationSignal {
  source: string;
  total: number;
  minted: number;
  publishedOnly: number;
  posts: HalationPost[];
}

/**
 * Build-safe snapshot. The live Pages Function replaces this in the browser,
 * but PointCast still renders a complete station if Halation is temporarily
 * unreachable during a static build.
 */
export const HALATION_SNAPSHOT: HalationPost[] = [
  {
    id: 'making-moves-77ef33be465d',
    url: `${HALATION_ORIGIN}/p/making-moves-77ef33be465d`,
    title: 'making moves',
    caption: 'broadcasting in 2026',
    image: `${HALATION_ORIGIN}/api/images/tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw/3db17fdda58356e1c2a1069ca00a828d1c2878e395fdbb2eae1f12029b51064f`,
    imageAlt: 'another day at the office',
    width: 1024,
    height: 1536,
    publishedAt: '2026-07-15T15:18:30.541Z',
    author: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw',
    authorUrl: `${HALATION_ORIGIN}/w/tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`,
    tags: ['blue skies'],
    sourceUrl: 'https://2018gardentime.tumblr.com/post/781575808813842432',
    mintState: 'minted 1/1',
    contractAddress: 'KT1DseZT5wuphFLmdhyhmGRfnNhKs58HQhAE',
    operationHash: 'opJzKS17mEyrfxggisE44Dp4M9J1yzk7oY3CfS2pUe3Lua9UAHC',
    receiptUrl: 'https://tzkt.io/opJzKS17mEyrfxggisE44Dp4M9J1yzk7oY3CfS2pUe3Lua9UAHC',
  },
  {
    id: 'wednesday-57a47b491765',
    url: `${HALATION_ORIGIN}/p/wednesday-57a47b491765`,
    title: 'wednesday',
    caption: 'we might be on to things',
    image: `${HALATION_ORIGIN}/api/images/tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw/90265fa275a61197f21d3fbb1689c8972987cda7a6a5fb34b8bd04ae8d971ef3`,
    imageAlt: 'A cat portrait rendered as a soft, vivid image study.',
    width: 1232,
    height: 928,
    publishedAt: '2026-07-15T15:14:05.713Z',
    author: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw',
    authorUrl: `${HALATION_ORIGIN}/w/tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`,
    tags: ['blue skies'],
    sourceUrl: 'https://open.spotify.com/track/4xR3MAscflQ262kMeiKshQ',
    mintState: 'minted 1/1',
    contractAddress: 'KT1DseZT5wuphFLmdhyhmGRfnNhKs58HQhAE',
    operationHash: 'ooub3uUeFQEZhPrWuUN1aiDfSN6HiNNLccbGcZPCWaLSALYEMC6',
    receiptUrl: 'https://tzkt.io/ooub3uUeFQEZhPrWuUN1aiDfSN6HiNNLccbGcZPCWaLSALYEMC6',
  },
  {
    id: 'music-el-segundo-california-5d67069f9e0f',
    url: `${HALATION_ORIGIN}/p/music-el-segundo-california-5d67069f9e0f`,
    title: 'music el segundo california',
    caption: 'keep going',
    image: `${HALATION_ORIGIN}/api/images/tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw/8b79ca3a0849fc68c1f27cca23be98b7a4f2d5718e4bf20a011b85f35395c7d3`,
    imageAlt: 'Monochrome glitch artwork built from music notes and magazine texture.',
    width: 1600,
    height: 1600,
    publishedAt: '2026-07-14T20:35:51.668Z',
    author: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw',
    authorUrl: `${HALATION_ORIGIN}/w/tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`,
    tags: ['today'],
    sourceUrl: 'https://open.spotify.com/track/1OIigmKerSiw9creKBH0UH',
    mintState: 'minted 1/1',
    contractAddress: 'KT1DseZT5wuphFLmdhyhmGRfnNhKs58HQhAE',
    operationHash: 'op2jxLsScUnQMCoAmBv6g1R6CssNfHrJsujay49bvB8HWPZ9DaJ',
    receiptUrl: 'https://tzkt.io/op2jxLsScUnQMCoAmBv6g1R6CssNfHrJsujay49bvB8HWPZ9DaJ',
  },
  {
    id: 'lamp-store-2b96f000f70f',
    url: `${HALATION_ORIGIN}/p/lamp-store-2b96f000f70f`,
    title: 'lamp store',
    caption: 'another day in el segundo',
    image: `${HALATION_ORIGIN}/api/images/tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw/9e87ac0e7643e4c2d5b22323b531cb893b13569d58c1317986ecaf3498ebe7a4`,
    imageAlt: 'A warm lamp store interior with many glowing fixtures.',
    width: 1232,
    height: 928,
    publishedAt: '2026-07-14T20:30:17.173Z',
    author: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw',
    authorUrl: `${HALATION_ORIGIN}/w/tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw`,
    tags: ['tuesday', 'snoop', 'spotify'],
    sourceUrl: null,
    mintState: 'minted 1/1',
    contractAddress: 'KT1DseZT5wuphFLmdhyhmGRfnNhKs58HQhAE',
    operationHash: 'oot5Td4Phq2UmvKtnxfg7GAYqZa3P1vEQqLyXQWCHQvgWRN8JBh',
    receiptUrl: 'https://tzkt.io/oot5Td4Phq2UmvKtnxfg7GAYqZa3P1vEQqLyXQWCHQvgWRN8JBh',
  },
];

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function postSlug(url: string, fallback: string): string {
  try {
    return new URL(url).pathname.split('/').filter(Boolean).pop() || fallback;
  } catch {
    return fallback;
  }
}

export function normalizeHalationFeed(input: unknown): HalationPost[] {
  const items = input && typeof input === 'object' && Array.isArray((input as any).items)
    ? (input as any).items
    : [];

  return items.flatMap((item: any, index: number) => {
    const url = stringValue(item?.url) ?? stringValue(item?.id);
    const image = stringValue(item?.image) ?? stringValue(item?.attachments?.[0]?.url);
    if (!url || !image) return [];

    const content = stringValue(item?.content_text) ?? '';
    const caption = content.split(/\n\nStatus:/i)[0]?.trim() || '';
    const operationHash = stringValue(item?._halation?.operation_hash);
    const mintState = stringValue(item?._halation?.mint_state) ?? 'published — not minted';
    const title = stringValue(item?.title) ?? 'untitled frame';
    const suppliedAlt = stringValue(item?.attachments?.[0]?.title);
    const imageAlt = suppliedAlt && !/^image titled\b/i.test(suppliedAlt)
      ? suppliedAlt
      : `Halation image diary frame titled ${title}.`;
    const tags = Array.isArray(item?.tags)
      ? item.tags.filter((tag: unknown): tag is string => typeof tag === 'string').slice(0, 8)
      : [];

    return [{
      id: postSlug(url, `halation-${index + 1}`),
      url,
      title,
      caption,
      image,
      imageAlt,
      width: numberValue(item?._halation?.image_width),
      height: numberValue(item?._halation?.image_height),
      publishedAt: stringValue(item?.date_published) ?? new Date(0).toISOString(),
      author: stringValue(item?.authors?.[0]?.name) ?? 'Halation',
      authorUrl: stringValue(item?.authors?.[0]?.url),
      tags,
      sourceUrl: stringValue(item?._halation?.source_url) ?? stringValue(item?.external_url),
      mintState,
      contractAddress: stringValue(item?._halation?.contract_address),
      operationHash,
      receiptUrl: operationHash ? `https://tzkt.io/${operationHash}` : null,
    } satisfies HalationPost];
  }).sort((a: HalationPost, b: HalationPost) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export function toHalationSignal(posts: HalationPost[], source = HALATION_FEED_URL): HalationSignal {
  const minted = posts.filter((post) => /^minted\b/i.test(post.mintState)).length;
  return {
    source,
    total: posts.length,
    minted,
    publishedOnly: posts.length - minted,
    posts,
  };
}

export async function fetchHalationSignal(fetcher: typeof fetch = fetch): Promise<HalationSignal> {
  try {
    const response = await fetcher(HALATION_FEED_URL, {
      headers: { Accept: 'application/feed+json, application/json' },
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) throw new Error(`Halation feed returned ${response.status}`);
    const posts = normalizeHalationFeed(await response.json());
    if (!posts.length) throw new Error('Halation feed contained no usable image posts');
    return toHalationSignal(posts);
  } catch {
    return toHalationSignal(HALATION_SNAPSHOT, 'pointcast:halation-snapshot');
  }
}
