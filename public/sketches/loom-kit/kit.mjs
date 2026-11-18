import { mountSoundDemo } from './sound-demo.mjs';

// The phone preview combines the shell with its component owners' immutable PR heads.
const previewHeads = {
  sound: 'fefc09da6210de06a87f4eff6b6eab892f0eade3',
  motion: 'dd5bc90659b691543a73936da813ecbea250b263',
  flame: 'f5787a1d1ac5113ab10268f0fe267dd2694d75e0',
  'card-stack': '688ed328380335ca2e45a4ff8caf4809cbf5ad29',
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
  const soundModule = Promise.resolve().then(() => loadModule(modulePath('sound')));
  const sharedSound = soundModule.then(module => {
    if (signal.aborted) return null;
    const sound = module.createLoomSound();
    signal.addEventListener('abort', () => sound.dispose(), { once: true });
    return sound;
  }).catch(() => null);
  const silentSound = { enabled: false, play: () => false };
  const stackOptions = preview ? {
    kit: { sound: modulePath('sound'), motion: modulePath('motion'), flame: modulePath('flame') },
  } : undefined;

  async function mount(name, demo, content) {
    if (name !== 'sound' && name !== 'card-stack') return demo.mountDemo(content);
    const sound = await sharedSound;
    if (signal.aborted) return;
    if (name === 'card-stack') {
      // Saved sound consent still needs a user gesture to unlock a fresh context.
      if (sound) {
        const unlock = () => { if (sound.enabled) void sound.unlock(); };
        content.addEventListener('pointerup', unlock, { capture: true, signal });
        content.addEventListener('keydown', unlock, { capture: true, signal });
      }
      // A silent host prevents the standalone stack from retrying a broken sound kit.
      return demo.mountDemo(content, { ...stackOptions, sound: sound ?? silentSound });
    }
    if (!sound) throw new Error('Sound kit could not start');
    return mountSoundDemo(content, sound, demo.SOUND_NAMES, signal);
  }

  return Promise.all(Object.keys(previewHeads).map(async name => {
    const slot = root.querySelector(`[data-kit-slot="${name}"]`);
    const status = slot?.querySelector('[data-kit-status]');
    const content = slot?.querySelector('[data-kit-content]');
    if (!status || !content) return;

    let demo;
    try {
      demo = await (name === 'sound' ? soundModule : loadModule(modulePath(name)));
    } catch (error) {
      // Browsers reject missing optional module URLs with a TypeError.
      if (!signal.aborted && !(error instanceof TypeError)) status.textContent = 'Demo couldn’t load.';
      return;
    }

    if (signal.aborted) return;
    try {
      const cleanup = await mount(name, demo, content);
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
