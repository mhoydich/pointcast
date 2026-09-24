/**
 * Layers deck host for the Radio panel. Loaded lazily by /js/pc-layers.js only
 * when the page was opened with ?radio=1 and the viewer opened the deck.
 *
 * The receiver owns their sound and screen:
 *  - a received mood only colours this page if the viewer ticked the box, for at
 *    most 30 s, through Layers' single token-guarded overlay slot (never saved);
 *  - its tune plays only if the viewer's Layers sound is already ON AIR, at no
 *    more than their own volume;
 *  - manual Layers edits, Off, Stop, Escape and leaving the page end it.
 */
import { createRadioPanel, injectRadioCSS } from '/layers-radio/radio-panel.js';
import { MOOD_COLORS } from '/layers-radio/radio-motifs.js';

let installed = null;

export function install(L) {
  if (installed || !L) return installed;
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const master = () => { const v = Number(L.state.master); return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.7; };

  const panel = createRadioPanel({
    host: 'deck',
    volume: master,
    effectsLabel: 'Let incoming moods colour this page for up to 30 s. Their tune plays only when my Layers sound is ON AIR. Never saved.',
    effectsDefault: false,
    onTransmit: seconds => L.duck(seconds),
    onListenChange: on => L.badge(on ? 'RX' : 'RADIO', on),
    onStop: () => L.clearMood(),
    onReceive(d, cs, effects) {
      const c = MOOD_COLORS[d.mood];
      L.ping(d.moodName, { hue: c.hue });              // a ripple if Waves is on; Morse only if ON AIR
      if (!effects) return;
      L.mood({ hue: c.hue, sky: reduced ? 0.35 : 0.55, ms: 30000 });
      const s = L.state;
      if (s.onAir) panel.audio.playMotif(d.mood, { gain: master() * 0.6 });
    },
    onPreview(moodId) { L.mood({ hue: MOOD_COLORS[moodId].hue, sky: 0.45, ms: 3000 }); },
  });

  L.addPanel({ id: 'radio', title: 'Radio · trial', el: panel.el });
  L.badge('RADIO', false);
  const stop = reason => panel.stop(reason);         // panel.stop also clears the mood via onStop
  addEventListener('pcl:stop', e => stop((e.detail && e.detail.reason) || 'stop'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop('page hidden'); });
  addEventListener('pagehide', () => stop('pagehide'));
  document.addEventListener('astro:after-swap', injectRadioCSS);
  installed = panel;
  return panel;
}
