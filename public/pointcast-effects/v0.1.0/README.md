# PointCast Effects 0.1

A dependency-free classic browser script. Load `pointcast-effects.js` before the host controller; it exposes `window.PointCastEffects`. The registry is an inventory, not a runtime loader. There is no network, storage, identity, or external media in the library.

## Sound

```js
const sound = PointCastEffects.createAudio({ onState: state => console.log(state) });
button.addEventListener('click', async () => {
  if (await sound.enable()) sound.ring('bowl');
});
// Later: sound.ring('bell'); sound.setMuted(true); sound.setMuted(false);
// On unmount: sound.dispose();
```

Call `enable()` directly from an explicit user gesture. It creates and resumes the audio context only then; it resolves to a boolean. `ring(family)` returns false until ready, while muted or hidden, for an unknown family, or after disposal. Families are `bell`, `gong`, `bowl`, and `chime`. `mute()` is shorthand for `setMuted(true)`. `stop()` closes the current session; a new gesture and `enable()` are required to resume. Hiding the page stops the session; `pagehide` stops it; call `dispose()` on unmount. Up to three strikes can overlap; each strike has three procedural partials. State callback receives `{status, muted, error}` where status is `idle`, `starting`, `ready`, `error`, or `disposed`. `contextFactory` and `document` can be injected for tests. No audible quality or device compatibility is implied by mock tests.

## Ripple

```js
const ripple = PointCastEffects.createRipple(surface, {
  reducedMotion: () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  onRipple: ({x, y}) => console.log(x, y)
});
// On unmount: ripple.dispose();
```

Pointer down starts at the pointer and Enter/Space starts in the center. `trigger(event?)` can start one programmatically; omit the event for the center. Reduced motion suppresses the visual while still calling `onRipple`; without a callback it follows the system preference. `clear()` removes active ripples. Supply host CSS, for example:

```css
.ripple-surface { position: relative; overflow: hidden; }
.pointcast-ripple { position: absolute; pointer-events: none; width: 1rem; height: 1rem; border: 1px solid currentColor; border-radius: 50%; transform: translate(-50%, -50%) scale(0); animation: pointcast-ripple 900ms ease-out forwards; }
@keyframes pointcast-ripple { to { transform: translate(-50%, -50%) scale(8); opacity: 0; } }
```

Animation end removes the element; a 1.6-second fallback also cleans up if animation is absent or interrupted. At most three are retained.

## Development

Run `npm run test:pointcast-effects` from the project root. This initial library adapts lifecycle patterns from `pc-still-light/src/lib/small-shrines-audio.ts` and procedural strike ideas from `src/lib/still-light-client.ts`; see `docs/notes/pointcast-effects-reuse-inventory.md` for the source audit and redistribution caveat. Artwork transitions and candle state are available as experimental visual helpers below. Add experiments independently, evaluate accessibility, lifecycle and real-device behavior, then promote stable interfaces into the registry. No automatic deployment or paid services are involved.

## Experimental visual effects

Load `visual-effects.js` after the core script. The optional `visual-effects.css` contains scoped classes for a candle and stacked artwork; adapt these to the host's layout. These helpers are experimental and have not been validated as replacements for any existing scene.

`createCandle(button, {root, onChange})` initializes from the button's `aria-pressed` state, toggles on click, and synchronizes `root`'s `data-lit` and the button's `aria-pressed` without changing its accessible label. The returned object has `setLit(boolean)`, `getState()` (a boolean), and `dispose()`. `root` defaults to the button. Use `.pc-candle-wax` and a descendant `.pc-candle-flame` for the optional style. The helper does not play audio.

`createArtworkTransition({current, next, status, reducedMotion, onState})` takes two image elements, with `next` overlaying `current` (see `.pc-artwork-stack` and `.pc-artwork-next`). `set({src, alt, title})` decodes an image before revealing it and resolves to the decoded image or `null`. A newer request invalidates an older one; a failed decode leaves the current image intact. The fade takes 750 ms, or completes immediately when reduced motion is requested. The optional `status` element receives loading or failure text, and `onState` receives `{loading, error, art}` where `art` is the most recently committed data or `null`. `clear()` cancels an in-flight transition and clears status; `dispose()` cancels and prevents further work. Hosts should call `clear()` on visibility changes if desired and `dispose()` on unmount. Passing a `reducedMotion` callback allows testing or application preferences; otherwise the system preference is used.
