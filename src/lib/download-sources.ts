import directory from '../data/download-sources.json';

export type DownloadSource = {
  name: string;
  url: string;
  rights: string;
  note: string;
  /** Search URL on the source's own site. `{q}` is replaced with the visitor's query. */
  search?: string;
  /** Set when the source is also wired into the live finder on /downloads/. */
  finder?: string;
};

export type DownloadShelf = { id: string; title: string; dek: string; entries: DownloadSource[] };

// The curated directory lives in src/data/download-sources.json. To add a
// source: official site only, state the rights in the source's own words,
// and re-run tests/downloads-desk.test.mjs.
export const DOWNLOAD_SHELVES = directory.shelves as DownloadShelf[];
export const DOWNLOAD_SOURCE_COUNT = DOWNLOAD_SHELVES.reduce((sum, shelf) => sum + shelf.entries.length, 0);
export const DOWNLOAD_SOURCES_REVIEWED = directory.reviewed;
export const DOWNLOAD_SOURCES_RULE = directory.rule;

// The four keyless, CORS-open collections the finder queries from the
// visitor's browser. Nothing is proxied through or stored on PointCast.
export const FINDER_SOURCES = [
  { id: 'aic', label: 'Art Institute of Chicago', short: 'Chicago', rights: 'CC0', api: 'https://api.artic.edu/api/v1/artworks/search' },
  { id: 'cma', label: 'Cleveland Museum of Art', short: 'Cleveland', rights: 'CC0', api: 'https://openaccess-api.clevelandart.org/api/artworks/' },
  { id: 'met', label: 'The Metropolitan Museum of Art', short: 'The Met', rights: 'CC0', api: 'https://collectionapi.metmuseum.org/public/collection/v1/search' },
  { id: 'nasa', label: 'NASA Image Library', short: 'NASA', rights: 'NASA media', api: 'https://images-api.nasa.gov/search' },
] as const;

export const FINDER_STARTERS = ['hummingbird', 'lighthouse', 'pacific coast', 'garden', 'bell', 'drum', 'fog', 'moon', 'dog', 'wave'];

// PointCast's own take-away files: printed matter and machine-readable feeds.
export const POINTCAST_TO_GO = {
  print: [
    { name: 'A Calendar Is a Treaty — field edition', url: '/downloads/a-calendar-is-a-treaty-field-edition.pdf', format: 'PDF · 9.7 MB', note: 'The noticing calendar, laid out to print and carry.' },
    { name: 'My Pet Has Retained Counsel — the brief', url: '/downloads/my-pet-has-retained-counsel-brief.pdf', format: 'PDF · 0.8 MB', note: 'The digital-pets campaign brief, as filed.' },
  ],
  feeds: [
    { name: 'Art catalog', url: '/downloads.json', format: 'JSON', note: 'Every picture on this page with sizes, hashes, and the source directory.' },
    { name: 'All blocks', url: '/blocks.json', format: 'JSON', note: 'The whole wire, newest first.' },
    { name: 'Feed', url: '/feed.xml', format: 'RSS', note: 'For a feed reader. JSON Feed at /feed.json.' },
    { name: 'Agent manifest', url: '/agents.json', format: 'JSON', note: 'What the town exposes to visiting agents.' },
    { name: 'llms.txt', url: '/llms.txt', format: 'Text', note: 'The short index for language models. Long form at /llms-full.txt.' },
    { name: 'Connectors', url: '/connectors', format: 'Page', note: 'Add PointCast to Claude, ChatGPT, or any MCP client.' },
  ],
};
