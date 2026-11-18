const modules = {
  sound: '../../loom/kit/sound.mjs',
  motion: '../../loom/kit/motion.mjs',
  flame: '../../loom/kit/flame.mjs',
  'card-stack': '../../loom/kit/card-stack.mjs',
};

export function mountKit(root, loadModule = path => import(path)) {
  return Promise.all(Object.entries(modules).map(async ([name, path]) => {
    const slot = root.querySelector(`[data-kit-slot="${name}"]`);
    const status = slot?.querySelector('[data-kit-status]');
    const content = slot?.querySelector('[data-kit-content]');
    if (!status || !content) return;

    let demo;
    try {
      demo = await loadModule(path);
    } catch (error) {
      // Browsers reject missing optional module URLs with a TypeError.
      if (!(error instanceof TypeError)) status.textContent = 'Demo couldn’t load.';
      return;
    }

    try {
      await demo.mountDemo(content);
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
