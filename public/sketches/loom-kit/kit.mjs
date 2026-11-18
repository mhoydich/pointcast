import { mountSoundDemo } from './sound-demo.mjs';

const modules = {
  sound: '../../loom/kit/sound.mjs',
  motion: '../../loom/kit/motion.mjs',
  flame: '../../loom/kit/flame.mjs',
  'card-stack': '../../loom/kit/card-stack.mjs',
};

export function mountKit(root, loadModule = path => import(path)) {
  // The phone preview combines the shell with the sound owner's immutable PR head.
  // PointCast and local builds always use the module supplied beside the sketch.
  const preview = root.location?.origin === 'https://raw.githack.com' &&
    /^\/mhoydich\/pointcast\/[^/]+\/public\/sketches\/loom-kit\/(?:index\.html)?$/.test(root.location.pathname);
  return Promise.all(Object.entries(modules).map(async ([name, path]) => {
    const slot = root.querySelector(`[data-kit-slot="${name}"]`);
    const status = slot?.querySelector('[data-kit-status]');
    const content = slot?.querySelector('[data-kit-content]');
    if (!status || !content) return;

    let demo;
    try {
      const source = name === 'sound' && preview
        ? 'https://raw.githack.com/mhoydich/pointcast/fefc09da6210de06a87f4eff6b6eab892f0eade3/public/loom/kit/sound.mjs'
        : path;
      demo = await loadModule(source);
    } catch (error) {
      // Browsers reject missing optional module URLs with a TypeError.
      if (!(error instanceof TypeError)) status.textContent = 'Demo couldn’t load.';
      return;
    }

    try {
      if (name === 'sound' && typeof demo.mountDemo !== 'function') mountSoundDemo(content, demo);
      else await demo.mountDemo(content);
    } catch {
      content.replaceChildren();
      content.hidden = true;
      status.textContent = 'Demo couldn’t start.';
      return;
    }
    status.hidden = true;
    content.hidden = false;
  }));
}

if (typeof document !== 'undefined') mountKit(document);
