/**
 * The per-request unfurl plan for one HTML page — pure, so the middleware
 * and the tests share it. Returns the og:image to write (or '' to leave the
 * page's own art alone) and any extra head tags (motion loops, or image
 * tags for a page that shipped none).
 */
import { lightBucket, liveBucket } from './light.mjs';
import { cardPath, liveRoomFor, motionFor, wantsOwnCard } from './rooms.mjs';
import { SITE, isGeneratedCard, liveCardUrl, pageCardUrl, quartetCardUrl, quartetSeat, withBucket } from './urls.mjs';
import { quartetWords } from './cards.mjs';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** The four-seat keyboard games and which card each wears. */
const QUARTET_PAGES = { '/keyboard-quartet': 'quartet', '/keyboard-rush': 'rush' };

/**
 * Words a page's unfurl should wear for this request, or null to leave its
 * own. Only /keyboard-quartet invites today, and only from a seat number.
 */
export function unfurlWords({ pathname, search = '' }) {
  const game = QUARTET_PAGES[cardPath(pathname)];
  return game ? quartetWords(quartetSeat(search), game) : null;
}

export function planUnfurl({ pathname, search = '', currentImage = '', missing = false, now = new Date() }) {
  const path = cardPath(pathname);
  // The homepage keeps its request-time Kennel Club card (injectTodayDogMetadata).
  if (!path || path === '/') return { image: '', headHtml: '' };

  let image = '';
  const room = liveRoomFor(path);
  if (room) image = liveCardUrl(room, liveBucket(now));
  else if (QUARTET_PAGES[path]) image = quartetCardUrl(quartetSeat(search), lightBucket(now), SITE, QUARTET_PAGES[path]);
  else if (currentImage && isGeneratedCard(currentImage)) image = withBucket(currentImage, lightBucket(now));
  else if (missing || wantsOwnCard(path, currentImage)) image = pageCardUrl(path, lightBucket(now));

  let headHtml = '';
  if (missing && image) {
    headHtml += `<meta property="og:image" content="${esc(image)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:image" content="${esc(image)}" />`;
  }
  const motion = motionFor(path);
  if (motion) {
    const src = new URL(motion.src, SITE).href;
    headHtml += `<meta property="og:video" content="${esc(src)}" /><meta property="og:video:secure_url" content="${esc(src)}" /><meta property="og:video:type" content="video/mp4" /><meta property="og:video:width" content="1200" /><meta property="og:video:height" content="630" />`;
  }
  return { image, headHtml };
}
