// Official integration references:
// https://developers.google.com/youtube/iframe_api_reference
// https://developers.google.com/youtube/player_parameters
// https://support.google.com/youtube/answer/171780
const API_URL = 'https://www.youtube.com/iframe_api';
const TIMEOUT_MS = 15000;
const apiRequests = new WeakMap();

function failure(code, message) {
  return Object.assign(new Error(message), { code });
}

/** Share an in-flight API request, removing it when its last caller cancels. */
function acquireAPI(win) {
  if (typeof win.YT?.Player === 'function') {
    return { promise: Promise.resolve(win.YT), cancel() {} };
  }
  let request = apiRequests.get(win);
  const fresh = !request;
  if (fresh) {
    request = { waiters: new Set(), done: false, script: null, timer: null };
    apiRequests.set(win, request);
  }
  let waiter;
  const promise = new Promise((resolve, reject) => {
    waiter = { resolve, reject };
    request.waiters.add(waiter);
  });

  if (fresh) {
    const previous = win.onYouTubeIframeAPIReady;
    const script = win.document.createElement('script');
    request.script = script;
    const finish = (error, api = null) => {
      if (request.done) return;
      request.done = true;
      win.clearTimeout(request.timer);
      script.removeEventListener('error', scriptFailed);
      script.remove();
      if (win.onYouTubeIframeAPIReady === ready) {
        if (previous === undefined) delete win.onYouTubeIframeAPIReady;
        else win.onYouTubeIframeAPIReady = previous;
      }
      if (apiRequests.get(win) === request) apiRequests.delete(win);
      for (const subscriber of request.waiters) {
        if (error) subscriber.reject(error);
        else subscriber.resolve(api);
      }
      request.waiters.clear();
    };
    const scriptFailed = () => finish(failure('api-load', 'The YouTube player API could not load.'));
    const ready = () => {
      if (request.done) return;
      if (typeof win.YT?.Player === 'function') finish(null, win.YT);
      else scriptFailed();
      // Preserve an existing integration's callback without letting its error
      // strand this module's already-settled callers.
      if (typeof previous === 'function') {
        try { previous.call(win); } catch { /* Another integration owns its callback. */ }
      }
    };
    request.finish = finish;
    win.onYouTubeIframeAPIReady = ready;
    script.src = API_URL;
    script.async = true;
    script.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    script.addEventListener('error', scriptFailed);
    request.timer = win.setTimeout(() => finish(failure('api-timeout', 'The YouTube player API took too long to load.')), TIMEOUT_MS);
    try { (win.document.head || win.document.documentElement).append(script); }
    catch { scriptFailed(); }
  }

  return {
    promise,
    cancel() {
      if (!request.waiters.delete(waiter)) return;
      waiter.resolve(null);
      if (!request.waiters.size) request.finish(null);
    },
  };
}

/**
 * Loading is explicit: construction makes no requests, and load() never plays.
 * load(id) resolves true at onReady, or false on destroy/supersession. Failures
 * reject Error with .code and call onError(code). YouTube error codes remain
 * numbers; adapter failures use invalid-video-id/api-load/api-timeout/
 * player-timeout/player-create. onState receives the numeric YouTube state.
 * onReady() fires once per load. destroy() is idempotent and permits later load.
 * The caller owns a visible container and must destroy before hiding it.
 */
export function createVideoPlayer({ container, onState, onError, onReady } = {}) {
  const doc = container?.ownerDocument;
  const win = doc?.defaultView;
  if (!win || container.nodeType !== 1) throw new TypeError('A player container element is required.');
  let current = null;

  const notify = (callback, value) => {
    try { callback?.(value); } catch { /* Consumer callbacks must not leak player resources. */ }
  };
  function release(record) {
    record.api?.cancel(); record.api = null;
    win.clearTimeout(record.timer); record.timer = null;
    const player = record.player; record.player = null;
    if (player) { try { player.destroy(); } catch { /* Removal below is the final teardown. */ } }
    record.iframe?.remove(); record.iframe = null;
  }
  function destroy() {
    const record = current;
    current = null;
    if (!record) return;
    release(record);
    if (!record.settled) { record.settled = true; record.resolve(false); }
  }
  function fail(record, error) {
    if (current !== record) return;
    current = null;
    release(record);
    if (!record.settled) { record.settled = true; record.reject(error); }
    notify(onError, error.code);
  }

  async function load(videoId) {
    destroy();
    const record = { player: null, iframe: null, api: null, timer: null, settled: false, ready: false };
    current = record;
    return new Promise((resolve, reject) => {
      record.resolve = resolve; record.reject = reject;
      if (typeof videoId !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        fail(record, failure('invalid-video-id', 'A valid 11-character YouTube video ID is required.'));
        return;
      }
      record.api = acquireAPI(win);
      record.api.promise.then(api => {
        if (current !== record || !api) return;
        record.api = null;
        try {
          const iframe = doc.createElement('iframe');
          record.iframe = iframe;
          const url = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
          url.search = new URLSearchParams({
            enablejsapi: '1', autoplay: '0', controls: '1', playsinline: '1', origin: win.location.origin,
          }).toString();
          iframe.title = 'YouTube karaoke video';
          iframe.width = '640'; iframe.height = '360';
          iframe.style.cssText = 'display:block;width:100%;height:auto;aspect-ratio:16 / 9;min-width:200px;min-height:200px;border:0';
          iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
          iframe.setAttribute('allow', 'encrypted-media; fullscreen; picture-in-picture');
          iframe.setAttribute('allowfullscreen', '');
          iframe.src = url.href;
          container.append(iframe);
          record.timer = win.setTimeout(() => fail(record, failure('player-timeout', 'The karaoke video player took too long to become ready.')), TIMEOUT_MS);
          const player = new api.Player(iframe, {
            events: {
              onReady() {
                if (current !== record || record.ready) return;
                record.ready = true; record.settled = true;
                win.clearTimeout(record.timer); record.timer = null;
                resolve(true); notify(onReady);
              },
              onStateChange(event) {
                if (current === record && typeof event.data === 'number') notify(onState, event.data);
              },
              onError(event) {
                if (current !== record || typeof event.data !== 'number') return;
                fail(record, failure(event.data, `YouTube could not play this video (error ${event.data}).`));
              },
            },
          });
          // onReady may synchronously cause the consumer to switch songs.
          if (current === record) record.player = player;
          else { try { player.destroy(); } catch { /* The iframe is already removed. */ } }
        } catch {
          fail(record, failure('player-create', 'The karaoke video player could not be created.'));
        }
      }, error => fail(record, error));
    });
  }
  return { load, destroy };
}
