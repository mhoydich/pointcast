const WEBP_DATA_PREFIX = 'data:image/webp;base64,';
// Pinned with sha256sum from the original Hearth kit WebP before embedding it.
const EXPECTED_SHA256 = 'd895c36bf6948e74f507048663409a4fbfce84be4e02092f4128a886f516ee1b';

const CHECK_STATUS = {
  verified: 'WebP decoded · SHA-256 matched',
  unavailable: 'Image verification is unavailable in this browser.',
  failed: 'Image verification failed. Practice decisions are disabled.',
};

const DECISION_TEXT = {
  approve: 'Approved in this dry run.',
  hold: 'Held in this dry run.',
  pass: 'Passed in this dry run.',
};

export async function verifyArt(image, subtle = globalThis.crypto?.subtle) {
  if (typeof subtle?.digest !== 'function' || typeof image.decode !== 'function') return 'unavailable';

  try {
    const source = image.getAttribute('src');
    if (!source?.startsWith(WEBP_DATA_PREFIX)) return 'failed';

    await image.decode();
    if (!image.naturalWidth || image.currentSrc !== source) return 'failed';

    const bytes = Uint8Array.from(atob(source.slice(WEBP_DATA_PREFIX.length)), byte => byte.charCodeAt(0));
    const hash = new Uint8Array(await subtle.digest('SHA-256', bytes));
    const digest = Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('');
    const imageIsCurrent = image.currentSrc === source && image.getAttribute('src') === source;
    return imageIsCurrent && digest === EXPECTED_SHA256 ? 'verified' : 'failed';
  } catch {
    return 'failed';
  }
}

async function initializeDeck(deck) {
  const check = deck.querySelector('#art-status');
  const actions = deck.querySelector('#decision-actions');
  check.textContent = 'Checking image and SHA-256…';
  const verification = await verifyArt(deck.querySelector('#art'));
  check.textContent = CHECK_STATUS[verification];
  check.dataset.verification = verification;
  if (verification !== 'verified') return;

  const receipt = deck.querySelector('#decision');
  const result = deck.querySelector('#decision-result');
  const approve = actions.querySelector('[data-decision="approve"]');

  for (const button of actions.querySelectorAll('[data-decision]')) {
    button.addEventListener('click', () => {
      if (actions.disabled) return;
      result.textContent = DECISION_TEXT[button.dataset.decision];
      actions.disabled = true;
      actions.hidden = true;
      receipt.hidden = false;
      result.focus();
    });
  }

  deck.querySelector('#reset').addEventListener('click', () => {
    receipt.hidden = true;
    result.textContent = '';
    actions.hidden = false;
    actions.disabled = false;
    approve.focus();
  });

  actions.disabled = false;
}

const deck = globalThis.document?.querySelector('[data-approval-deck]');
if (deck) void initializeDeck(deck);
