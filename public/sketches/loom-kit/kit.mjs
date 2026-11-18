import { mountSoundDemo } from './sound-demo.mjs';

const modules = {
  sound: '../../loom/kit/sound.mjs',
  motion: '../../loom/kit/motion.mjs',
  flame: '../../loom/kit/flame.mjs',
  'card-stack': '../../loom/kit/card-stack.mjs',
};

// The phone preview combines the shell with its component owners' immutable PR heads.
const previewHeads = {
  sound: 'fefc09da6210de06a87f4eff6b6eab892f0eade3',
  motion: 'dd5bc90659b691543a73936da813ecbea250b263',
  flame: 'fb24cd9c3f4b1607d62b58f7b30777f692fa28c0',
};

export function mountKit(root, loadModule = path => import(path)) {
  const preview = root.location?.origin === 'https://raw.githack.com' &&
    /^\/mhoydich\/pointcast\/[^/]+\/public\/sketches\/loom-kit\/(?:index\.html)?$/.test(root.location.pathname);
  const view = root.defaultView;
  const lifetime = new view.AbortController();
  const { signal } = lifetime;
  view.addEventListener('pagehide', event => {
    if (!event.persisted) lifetime.abort();
  }, { signal });

  return Promise.all(Object.entries(modules).map(async ([name, path]) => {
    const slot = root.querySelector(`[data-kit-slot="${name}"]`);
    const status = slot?.querySelector('[data-kit-status]');
    const content = slot?.querySelector('[data-kit-content]');
    if (!status || !content) return;

    let demo;
    try {
      const head = preview && previewHeads[name];
      const source = head
        ? `https://raw.githack.com/mhoydich/pointcast/${head}/public/loom/kit/${name}.mjs`
        : path;
      demo = await loadModule(source);
    } catch (error) {
      // Browsers reject missing optional module URLs with a TypeError.
      if (!signal.aborted && !(error instanceof TypeError)) status.textContent = 'Demo couldn’t load.';
      return;
    }

    if (signal.aborted) return;
    try {
      const cleanup = name === 'sound' && typeof demo.mountDemo !== 'function'
        ? mountSoundDemo(content, demo)
        : await demo.mountDemo(content);
      if (signal.aborted) {
        if (typeof cleanup === 'function') cleanup();
        return;
      }
      if (typeof cleanup === 'function') signal.addEventListener('abort', () => cleanup(), { once: true });
    } catch {
      if (signal.aborted) return;
      content.replaceChildren();
      content.hidden = true;
      status.textContent = 'Demo couldn’t start.';
      return;
    }
    if (name === 'motion') {
      const title = content.querySelector(':scope > .lm-motion-demo > h3.lm-motion-title:first-child');
      if (title && title.textContent.trim() === slot.querySelector(':scope > h2')?.textContent.trim()) title.hidden = true;
    }
    status.hidden = true;
    content.hidden = false;
  }));
}

if (typeof document !== 'undefined') mountKit(document);
