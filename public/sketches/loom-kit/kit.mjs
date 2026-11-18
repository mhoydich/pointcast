import { mountSoundDemo } from './sound-demo.mjs';

// The phone preview combines the shell with its component owners' immutable PR heads.
const previewHeads = {
  sound: 'fefc09da6210de06a87f4eff6b6eab892f0eade3',
  motion: 'dd5bc90659b691543a73936da813ecbea250b263',
  flame: 'f5787a1d1ac5113ab10268f0fe267dd2694d75e0',
  'card-stack': 'df301ad1549c933c9c6d8cb08d4b4e0673e7c6fc',
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

  function modulePath(name) {
    return preview
      ? `https://raw.githack.com/mhoydich/pointcast/${previewHeads[name]}/public/loom/kit/${name}.mjs`
      : `../../loom/kit/${name}.mjs`;
  }
  const stackOptions = preview ? {
    kit: { sound: modulePath('sound'), motion: modulePath('motion'), flame: modulePath('flame') },
  } : undefined;

  return Promise.all(Object.keys(previewHeads).map(async name => {
    const slot = root.querySelector(`[data-kit-slot="${name}"]`);
    const status = slot?.querySelector('[data-kit-status]');
    const content = slot?.querySelector('[data-kit-content]');
    if (!status || !content) return;

    let demo;
    try {
      demo = await loadModule(modulePath(name));
    } catch (error) {
      // Browsers reject missing optional module URLs with a TypeError.
      if (!signal.aborted && !(error instanceof TypeError)) status.textContent = 'Demo couldn’t load.';
      return;
    }

    if (signal.aborted) return;
    try {
      const cleanup = name === 'sound' && typeof demo.mountDemo !== 'function'
        ? mountSoundDemo(content, demo)
        : await demo.mountDemo(content, name === 'card-stack' ? stackOptions : undefined);
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
