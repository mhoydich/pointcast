# /cast-make-pro audit · 2026-05-11

## Summary

`/cast-make-pro` (PR #569, `e4f39c5`) was Codex's biggest single ship of the overnight sprint — 2,170 lines, 10 new features over `/cast-make` v1, no review before merge. This audit reads the file end-to-end and finds **eight issues**: three are bug regressions of items the 2026-05-10 audit already caught in sibling pages (the new page was authored before those fixes landed), one is a unique-to-pro math bug that effectively disables the swing feature, one is an A11Y gap, and three are minor polish items.

The good news first: the pages's headline architecture is sound. It correctly adopts `src/lib/audio-scheduler.ts` (every oscillator wraps in `sched.trackSource`, auto-loop scheduled in ctx-time). It uses `pointerdown`/`pointerup`/`pointercancel`/`pointerleave` for slot buttons — better than `cast-make`'s `mousedown`+`touchstart` pattern. Undo/redo is well-implemented with proper snapshot/clone semantics and a 30-step cap. The composition validator + version-2 share encoder accept v1 inputs gracefully.

The bad news: `/cast-make-pro` was branched from the pre-audit `/cast-make` snapshot, so it ships with `pause-not-pause` cousin bugs the audit caught in PRs #547 → #568 → #574 already fixed in the sibling pages.

## Findings

### [BUG] swing offset formula multiplies `step` twice
- **Where:** `src/pages/cast-make-pro.astro:1158-1161`
- **What:**
  ```ts
  function swingOffset(stepIndex: number, step: number, swing: number): number {
    if (stepIndex % 2 === 0) return 0;
    return step * ((swing - 50) / 50) * step * 0.3;
  }
  ```
  The `step * step` term squares the per-16th duration. At 100 BPM, `step ≈ 0.15s` so `step² ≈ 0.0225`. Even at max slider value (66, the slider's `min=0 max=66`), the offset is `0.0225 × 0.32 × 0.3 ≈ 0.002s` — about 2ms. Inaudible. The swing feature is effectively a no-op.
- **Repro:** Open `/cast-make-pro`, set BPM to 100, play, slide swing from 50 → 66 → 0. No audible groove change.
- **Fix:** Remove the second `step` multiplier and increase the magnitude so the feature is audible:
  ```ts
  return step * ((swing - 50) / 50) * 0.5; // max ~37ms shuffle at 100bpm, 0.32*0.5*step
  ```

### [BUG] no `visibilitychange` handler
- **Where:** `src/pages/cast-make-pro.astro` (entire file — never bound)
- **What:** Same iOS-Safari-tab-switch bug PR #568 fixed in the other six music pages. iOS auto-suspends the AudioContext when the tab backgrounds; without a `visibilitychange` listener, the page comes back silent while `playing === true` and the play button still says STOP.
- **Repro:** Open `/cast-make-pro` on iOS, hit play, switch tabs for 20s, come back → no audio, UI thinks it's still playing.
- **Fix:** In `ac()` factory (after `sched = createAudioScheduler(ctx)`):
  ```ts
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ctx && ctx.state !== 'running' && playing) {
      sched?.resume();
    }
  });
  ```

### [BUG] empty slot click can't save (no keyboard save path)
- **Where:** `src/pages/cast-make-pro.astro:1949-1989`
- **What:** Slot buttons load on click. They only save via 650ms long-press (pointerdown timer). Empty slots toast `"Slot N is empty. Long-press to save."` — keyboard users (Tab → Enter) have NO save path at all. PR #574 fixed this in `/cast-make` v1 by adding Shift+Click as a save trigger; the pro page predates that fix.
- **Repro:** Tab to slot 1, hit Enter → "empty, long-press to save." There's no way for a keyboard user to save.
- **Fix:** In the click handler at line 1986:
  ```ts
  btn.addEventListener('click', (e) => {
    if (savedViaLongPress) { savedViaLongPress = false; return; }
    if (e.shiftKey) { saveSlot(n); return; }
    const filled = !!localStorage.getItem(SAVE_KEY(n));
    if (filled) loadSlot(n); else saveSlot(n);
  });
  ```
  Also update the title attribute to mention Shift+Click.

### [POLISH] OfflineAudioContext sample rate hardcoded to 44100
- **Where:** `src/pages/cast-make-pro.astro:1618`
- **What:** `renderStemToWav` creates `OfflineAudioContext(2, ceil(sampleRate * dur), 44100)`. On 48kHz devices (most modern Macs, iPhones), the exported WAV is rendered at a different rate than the live preview — pitch is preserved but rate-dependent rounding in oscillator phase / noise buffer indexing / impulse responses diverges. Audit item #7 fixed this in `/cast-make` v1 (PR #574); same regression here in the pro page's stem renderer.
- **Repro:** On a 48kHz device, render a stem and compare to a screen-recorded live playback — subtle but real divergence.
- **Fix:** `const sampleRate = (ctx && ctx.sampleRate) || 44100;` (lift the live ctx's rate; falls back to 44100 if `ac()` hasn't fired yet).

### [POLISH] 16-bit PCM conversion uses asymmetric multipliers
- **Where:** `src/pages/cast-make-pro.astro:1653-1654`
- **What:** Same `s < 0 ? Math.round(s * 32768) : Math.round(s * 32767)` asymmetric form that audit item #8 cleaned up in `/cast-make` v1 (PR #574). Industry standard is symmetric `Math.round(s * 32767)` + clamp.
- **Repro:** Render a near-silence stem and compare to one from a standard encoder — noise floor differs by 0.5 LSB.
- **Fix:** Same as the `/cast-make` v1 fix:
  ```ts
  const s = Math.max(-1, Math.min(1, chans[ch][i]));
  let v = Math.round(s * 32767);
  v = Math.max(-32768, Math.min(32767, v));
  view.setInt16(p, v, true); p += 2;
  ```

### [UX] stem export shows no per-stem progress
- **Where:** `src/pages/cast-make-pro.astro:1661-1700` (`exportStems`)
- **What:** The export renders 6 stems sequentially via OfflineAudioContext. At 4 bars × ~3s each = ~18s of synchronous-feeling work behind a single "rendering 6 stems" toast and a static "rendering 6 stems" button label. Users will hit cmd+R thinking it's frozen.
- **Repro:** Click "↓ stems → zip" → button label doesn't change for 15-20 seconds.
- **Fix:** Update the button label inside the for-loop:
  ```ts
  for (const [idx, stem] of STEMS.entries()) {
    btn.innerHTML = `<span class="cpro__btn-icon">⌛</span> rendering ${idx + 1}/${STEMS.length} (${stem})`;
    const blob = await renderStemToWav(comp, stem);
    files.push({ name: `${base}-${stem}.wav`, blob });
  }
  ```
  Adds maybe a paint per stem; cheap, visibly better.

### [POLISH] `sameComp` JSON-stringify equality is fragile + expensive
- **Where:** `src/pages/cast-make-pro.astro:1555-1557`
- **What:** `JSON.stringify(a) === JSON.stringify(b)` works because JS preserves insertion order, but it's not formally guaranteed and gets expensive: a Composition with 8 bars × 3 lanes × 16 steps in `drums`, plus chords, leadPhrases, etc., is ~3-5KB per stringify. Called on every mutation. Fine today, would be slow at higher densities.
- **Repro:** Code-level only.
- **Fix:** A purpose-built deep-equal would be faster but is extra code. Practical fix: skip the no-op-detection by always pushing the snapshot — the worst case is undo restoring you to an identical state, which is harmless. Or just defer: it's not a real problem at current sizes.

### [POLISH] swing slider range is asymmetric (0-66) with 50 default
- **Where:** `src/pages/cast-make-pro.astro:84` (`min="0" max="66" value="50"`)
- **What:** Slider range 0-66 with 50 as "straight" means users have 50 units of rush (negative swing) but only 16 units of shuffle (positive swing). The spec said "0-50%" — Codex picked a range that's neither symmetric nor matches the spec. Doesn't matter much once the formula bug above is fixed, but worth normalizing.
- **Repro:** Slide swing all the way left vs right — leftward range is 3× the rightward range.
- **Fix:** Either bump max to 100 (symmetric, 50-100 = shuffle, 0-50 = rush) and adjust labels, or restrict to 50-100 (no rush, just optional shuffle). I'd lean toward 50-100 for usability — most users want "more swing" not "anti-swing."

## What I checked but did NOT find an issue with
- **Scheduler adoption.** Every oscillator/buffer-source goes through `sched.trackSource()` via the `Voice` abstraction. Stop/Next properly call `sched.stopAll()`. No source leaks observed.
- **`pointerdown` / `pointerup` / `pointercancel` / `pointerleave` on slots.** Unified pointer events correctly handle both mouse + touch, no `touchstart`-only iPhone bug from PR #547.
- **Undo/redo correctness.** Snapshots taken before mutate, no-op detect via deep equal, 30-step cap, redo cleared on new commit. Clean.
- **Version-2 share encoder accepts v1 inputs.** `decodeComp` handles both shapes, auto-copying bar-0 drum patterns to bars 1-3 when reading a v1 payload.
- **Composition validator (`normalizeComp`)** clamps + defaults all fields; corrupted localStorage falls back to defaults cleanly.
- **Auto-loop ctx-time scheduling.** `sched!.schedule(() => playOnce(), start + songSec(comp))` uses AudioContext-time so it parks on pause (the page doesn't have pause-resume distinction — only stop-and-restart — so this is moot but still correct).
- **Multi-stem ZIP fallback.** If the bundled `createZip` fails, the loop falls back to downloading 6 separate WAVs with a toast. Defensive.
- **Drum-paint pointer drag.** `pointerdown` + `pointerenter` painting works correctly across cells. Pointer capture is implicit since each cell is its own button.

## Punch list — fix before next ship

1. **Swing formula bug** — remove squared `step`, scale the magnitude up. Single-line fix, makes the feature audible.
2. **`visibilitychange` handler** — 4 lines in `ac()` factory.
3. **Empty-slot click saves** + Shift+Click save path — keyboard accessibility.
4. **Stem export progress indicator** — button label updates per-stem inside the loop.
5. **OfflineAudioContext sample rate** match `ctx.sampleRate`.
6. **Symmetric int16 conversion** in the stem WAV encoder.
7. **Swing slider range** — bump to 50-100 or 0-100 symmetric.
8. **`sameComp` equality** — defer (no real impact today).

Items 1, 2, 3 are user-visible bugs. Items 4-7 are POLISH/UX. Item 8 is theoretical.

---

*Auditor: Claude · 2026-05-11 morning sprint follow-up.*
*Base SHA: `3f0117c` (post-PR #576 `/music-poster`).*
*Audit method: end-to-end read of `src/pages/cast-make-pro.astro` (2,170 lines), pattern-matched against the prior 2026-05-10 audit's punch list.*
