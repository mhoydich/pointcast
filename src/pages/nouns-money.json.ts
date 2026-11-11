import type { APIRoute } from 'astro';
import HUNDRED from '../data/nouns-money-hundred.json';
import FLOWERS from '../data/nouns-money-flowers.json';
import COLLECTED from '../../public/nouns-money/collected/manifest.json';
import COMMONS from '../data/currency-builder/commons-40.json';
import BARTER from '../data/currency-builder/barter-100.json';
import ALMANAC from '../data/currency-builder/almanac-52.json';
import { APP_CATALOG } from '../lib/nouns-money-app-catalog';
import { MONEY, NOTE_DESIGNS, NORDIC_STUDIES, CAMPAIGN_POSTERS } from '../lib/nouns-money';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...MONEY,
  collectedEdition: {
    title: 'Nouns Money · the collected edition', publishedAt: '2026-10-14',
    canonical: 'https://pointcast.xyz/nouns-money/',
    gallery: 'https://pointcast.xyz/nouns-money/gallery/',
    manifest: 'https://pointcast.xyz/nouns-money/collected/manifest.json',
    counts: { ...COLLECTED.counts, collectionGroups: COLLECTED.collections.length },
    countMeaning: 'Entries include fronts, backs, contact sheets, generated studies and paired editions. They are not a count of unique currencies.',
    collections: COLLECTED.collections.map(group => ({ ...group, url: `https://pointcast.xyz/nouns-money/gallery/#collection=${encodeURIComponent(group.id)}` })),
    paperDesk: 'https://pointcast.xyz/nouns-money/#paper-desk',
    regionalCraftSheets: 'https://pointcast.xyz/nouns-money/collected/regional/print-collection.html',
    downloads: COLLECTED.downloads,
    status: 'Browsable artwork and downloadable digital files. Archive previews are lower resolution than master files. Physical editions remain unverified.',
  },
  musicMaker: {
    title: 'Nouns Money Maker', canonical: 'https://pointcast.xyz/nouns-money/music/',
    currencies: 32, voices: 8, steps: 16, grooves: 4,
    sounds: ['Coin drops', 'Cash drawer', 'Paper snaps', 'Counting machine', 'Register bell', 'Card swipe', 'Coin shaker', 'Vault bass'],
    features: ['Keyboard and touch pads', 'Tempo and swing', 'Device-local loops', 'JSON loop files', 'Link sharing', 'Four-bar stereo WAV export'],
    audio: 'Original synthesized sounds. Playback begins with a user gesture; no microphone required.',
  },
  exchangeStudies: {
    title: 'Currency Builder · exchange studies', canonical: 'https://pointcast.xyz/currency-builder/',
    concepts: COMMONS.currencies.length + BARTER.currencies.length + ALMANAC.currencies.length,
    distinctSourceNouns: new Set([...COMMONS.currencies, ...BARTER.currencies, ...ALMANAC.currencies].map(entry => entry.nounId)).size,
    commons: { count: COMMONS.currencies.length, systems: COMMONS.themes.length, canonical: 'https://pointcast.xyz/currency-builder/commons/', machine: 'https://pointcast.xyz/currency-builder/commons.json' },
    globalBarter: { count: BARTER.currencies.length, regions: BARTER.regions.length, canonical: 'https://pointcast.xyz/currency-builder/barter/', machine: 'https://pointcast.xyz/currency-builder/barter.json', sources: 'Each concept cites its historical or contemporary reference.' },
    almanac: { count: ALMANAC.currencies.length, quarters: ALMANAC.quarters.length, canonical: 'https://pointcast.xyz/currency-builder/almanac/', machine: 'https://pointcast.xyz/currency-builder/almanac.json', sources: 'Each week cites a source for its natural or calendar event.' },
    engravedVariations: { count: COMMONS.currencies.length + BARTER.currencies.length + ALMANAC.currencies.length, canonical: 'https://pointcast.xyz/currency-builder/security/', meaning: 'Alternate faces of the same 192 concepts, with decorative fine lines and outlined lettering. Visual effects do not establish physical features.' },
    status: 'Concept artwork for discussion. No operating exchange system or manufactured edition is established.',
  },
  app: { canonical: 'https://pointcast.xyz/nouns-money/app/', catalog: 'https://pointcast.xyz/nouns-money/app/catalog.json', catalogCount: APP_CATALOG.length, brand: 'Michael Hoydich’s Currency Builder', motto: 'Design. Print. Produce. Profit.', status: 'iPhone-first web art catalog and local design-studio prototype', features: ['Collection browsing', 'Full-screen artwork', 'Device-local favorites', 'Browser print-sheet workshop', 'Local composition of existing artwork'], favorites: 'Design preferences only; browser storage with visit-only memory fallback. No account collection, ownership record or remote favorite writes.', designStudio: 'Arranges existing images; does not generate new artwork or manufacture an edition.', physicalProduction: 'Proposed. The Profit motto is not a return promise.', financialActivity: 'No purchases, minting, wallet connection, staking, backing or redemption enabled by this app.', offline: 'Connection required to load artwork; offline use is not promised.' },
  flowerStudies: { ...FLOWERS, count: FLOWERS.catalog.length, kind: 'Generated Nouns-inspired design studies, not exact-source Noun artwork', catalog: FLOWERS.catalog.map(plate => ({ ...plate, image: `https://pointcast.xyz/images/nouns-money/flowers-2026/${plate.file}.webp`, original: `https://pointcast.xyz/images/nouns-money/flowers-2026/${plate.file}.png` })) },
  nordic100Catalog: {...HUNDRED, specs:{trimMm:[150,75],rasterPx:[1800,900],bleedSvgMm:[156,81],colorSpace:'RGB; no printer-specific CMYK or physical proof verified'}, status:'Read-only art catalog; proposed Tezos mint, no tokens issued by this page', catalog:HUNDRED.catalog.map(note=>({...note,image:`https://pointcast.xyz/images/nouns-money/nordic-100/${note.file}.webp`,png:`https://pointcast.xyz/images/nouns-money/nordic-100/${note.file}.png`,svg:`https://pointcast.xyz/images/nouns-money/nordic-100/${note.file}.svg`}))},
  designs: NOTE_DESIGNS.map(note => ({...note, image: `https://pointcast.xyz/images/nouns-money/${note.file}.webp`, svg: `https://pointcast.xyz/images/nouns-money/${note.file}.svg`})),
  nordic2027Studies: { status: 'Generated visual interpretations from authentic Nouns references; not exact-source print masters or production-ready files', effects: 'Engraved, iridescent and translucent details are proposed visual effects, not verified material, authentication or security functionality', studies: NORDIC_STUDIES.map(note=>({...note,image:`https://pointcast.xyz/images/nouns-money/nordic-2027/${note.file}.webp`})) },
  campaignArt: { status: 'Generated concept posters; not evidence of physical production', posters: CAMPAIGN_POSTERS.map(poster=>({...poster,image:`https://pointcast.xyz/images/nouns-money/campaign/${poster.file}.webp`})) },
  journey: { status: 'Fictional read-only example; no submissions or transfer verification', serial: 'NM-001-DEMO', stops: ['First proof · imagined', 'Art table · imagined', 'A friend’s pocket · imagined'] },
  agentAccess: { method: 'GET', authentication: 'none', sideEffects: 'none', writeApi: false },
}, null, 2), {headers: {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300'}});
