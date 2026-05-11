# Music engine audit · 2026-05-10

## Summary
PR #547 (f22a31b) correctly extracted a shared scheduler and fixed the headline pause/stop/seek bugs Codex caught earlier — the three cast pages (`cast-music-pro`, `cast-studio`, `cast-real`) plus `cast-make` and `drum-school` now route through `src/lib/audio-scheduler.ts` for sequenced playback. But a handful of real issues survived the cleanup or were introduced by it: most notably a play-button-does-nothing state-machine bug in `cast-music-pro` after natural end-of-queue, a missing `touchstart` on `cast-make`'s long-press-to-save slots, complete absence of `visibilitychange` handling (iOS Safari users coming back from tab-switch get a silent app), and per-lesson AudioNode leaks in `drum-academy` (which never adopted the shared scheduler at all). None are crashing; several are user-visible.

## Findings

### [BUG] cast-music-pro: play button is dead after queue exhausts with repeat=off
- **Where:** src/pages/cast-music-pro.astro:1075, 1576
- **What:** When `advance(crossfade)` reaches the end of the queue with `repeatMode === 'off'`, it sets `playing = false; setPlayIcon(false); return;` — but `qIdx` is left at the last track. The play button handler at line 1576 reads `if (playing) pause(); else resume();`. So the next click calls `resume()`, which calls `sched.resume()` (no-op: no parked timers, all sources stopped by `stopAll()` two lines up at 1071) — context resumes but nothing is scheduled. User sees the play icon flip back, no audio, no progress.
- **Repro:** Load a 1-track queue, let it play through to the end with repeat off, click play → nothing happens.
- **Fix:** In the play button handler, also gate on whether the current schedule is live. Simplest: `if (playing) pause(); else if (sched && sched.timerCount > 0) resume(); else play();` — fall through to `play()` when there's nothing parked. Or in the queue-exhaustion branch of `advance()`, set `qIdx = 0` and leave `playing = false` so the next click is treated as a fresh start.

### [RACE] scheduler: pause/resume are not awaited at call sites; rapid toggles can interleave suspend/resume
- **Where:** src/lib/audio-scheduler.ts:80-91; called bare (no `await`) in cast-music-pro.astro:1052/1059, cast-studio.astro:1057/1062, cast-real.astro:752/757
- **What:** `pause()` and `resume()` are async (they await `ctx.suspend()`/`resume()`), but every caller fires them sync. JS is single-threaded so the *synchronous* parts (timer parking, timer re-arming) interleave correctly, but the underlying `AudioContext.state` transition is in-flight when the next call's loop runs. The math in `arm(t)` reads `ctx.currentTime` which is frozen-during-suspend, so remaining-time is still correct — but a fast pause-then-resume can leave the context in a transient `interrupted`/`suspended-pending` state that some Safari versions reject from. The Promise rejections are swallowed silently.
- **Repro:** Code-level only; hard to hit but real on iOS Safari where state transitions are slower.
- **Fix:** Make the button handlers async: `playButton.addEventListener('click', async () => { if (playing) await pause(); else await resume(); })`. Also debounce the toggle so rapid clicks within ~50ms collapse to one. Alternatively, queue them inside the scheduler: track a `private pending: Promise<void>` and chain calls so the second await sees the first's completion.

### [BUG] cast-real: `Soundfont.instrument()` sync throws are not caught
- **Where:** src/pages/cast-real.astro:507
- **What:** `loadInstrument` checks `(window as any).Soundfont` exists, then calls `(window as any).Soundfont.instrument(c, name, opts)`. If `soundfont-player` throws synchronously inside `.instrument` — e.g. malformed instrument name, internal assertion failure on a new CDN-served URL format, or an unexpected `c` object — the `async` wrapper turns it into a rejection, but `inFlight.set(name, p)` at line 523 still runs because `p` is the `.then().catch()` chain on a promise that already rejected. So the rejected promise stays cached in `inFlight` until something else awaits it. Worse: `inFlight.delete(name)` inside the `.catch` runs only because of the `.catch` clause — verified safe. Wait — actually the bigger issue: if `Soundfont.instrument` throws *synchronously*, the throw happens BEFORE the `withTimeout(fetchPromise, ...)` call gets `fetchPromise`. The line `const fetchPromise = (window as any).Soundfont.instrument(...)` throws straight into the surrounding `async loadInstrument`, which rejects. The `inFlight.set(name, p)` never runs. Two calls in a row try to load → each rejects independently, each toasts an error. Not a crash, but noisy.
- **Repro:** Code-level — possible if soundfont-player ships a breaking minor and CDN rolls forward (we pin `0.12.0`, so unlikely until a manual bump).
- **Fix:** Wrap the call: `let fetchPromise: Promise<any>; try { fetchPromise = (window as any).Soundfont.instrument(c, name, {...}); } catch (err) { console.error('soundfont sync throw', err); toast('Soundfont library error'); return null; }`. Costs three lines; protects against future regressions.

### [RISK] cast-real: truncated MP3s would load silently as zero-length buffers
- **Where:** src/pages/cast-real.astro:507-525
- **What:** `soundfont-player` fetches per-pitch MP3 banks and decodes them via the browser's `decodeAudioData`. On a partial response (CDN edge dropped the connection halfway, mobile network glitch), some browsers return a successfully-decoded buffer for whatever bytes did arrive — possibly a fraction of a second of audio, or silence. The page-level loader can't tell garbage-buffer from successful, so songs play missing notes with no toast.
- **Repro:** Throttle DevTools network to "Slow 3G", interrupt mid-load; sometimes the loader resolves with an incomplete instrument.
- **Fix:** After load, sanity-check: `if (!inst || typeof inst.play !== 'function') return null;` already exists implicitly. Additional check: pick one known pitch range and assert the resulting AudioBuffer is at least ~50ms long: `const probe = inst.play('C4', c.currentTime + 100); if (!probe) ...`. Practically, the simpler fix is to add `Cache-Control` + integrity checks via a Service Worker, which is a larger change — for now, log to `console.warn` when an instrument has zero loaded note keys (the soundfont-player exposes `.buffers` or similar).

### [BUG] cast-make: long-press-to-save slots ignores `touchstart`
- **Where:** src/pages/cast-make.astro:757-768
- **What:** Slot buttons bind `mousedown` for press-and-hold-600ms-to-save, and a separate `click` for tap-to-load. On iOS Safari, `mousedown` does fire for touches but at unreliable latency, and `mouseleave` (line 762) never fires for touches — so a finger that hovers, lifts, and clicks elsewhere can leave `pressTimer` armed forever (next mousedown overwrites it; still, the 600ms hold semantics are flaky on mobile).
- **Repro:** On an iPhone, try to long-press a slot button to save → either the save fires inconsistently or doesn't fire.
- **Fix:** Mirror the pattern drum-school uses for its tap pads — bind both events: `btn.addEventListener('touchstart', e => { e.preventDefault(); savedViaLongPress = false; pressTimer = window.setTimeout(...); }, { passive: false }); btn.addEventListener('touchend', () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } });`. Also clear on `touchcancel`.

### [BUG] all music pages: no visibilitychange handling — iOS users come back to silence
- **Where:** src/pages/cast-music-pro.astro, cast-studio.astro, cast-real.astro, cast-make.astro, drum-school.astro, drum-academy.astro (none of them listen)
- **What:** iOS Safari auto-suspends the AudioContext when the user switches tabs or backgrounds the browser. When they return, `ctx.state` is `'interrupted'` (Safari) or `'suspended'` (some configs). The shared scheduler doesn't know to re-arm; pages still believe they're "playing" (the `playing` flag is true, play icon shows pause). User comes back to a paused track with no indication.
- **Repro:** Start a track on cast-music-pro, switch to another tab for 30s, come back → progress bar frozen, no audio, play icon still shows pause.
- **Fix:** In each `ac()` factory (or one common bootstrap), add `document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx && ctx.state !== 'running' && playing) { sched?.resume(); } });`. Also handle the explicit Safari `'interrupted'` state by listening to `ctx.onstatechange` and re-arming on resume.

### [LEAK] drum-academy: every play/stop cycle leaks AudioNodes
- **Where:** src/pages/drum-academy.astro:483-486 (lesson 2), 658-661 (lesson 4), 734-738 (lesson 5), and lesson 3 similarly
- **What:** Each lesson's `stop()` calls `osc?.stop()` on the oscillators but doesn't `disconnect()` the gain, analyser, merger, or `outGain` nodes. The next `start()` creates a fresh chain and connects it to `c.destination`, but the prior nodes stay connected to the destination via the dangling graph. After 20 play/stop cycles on lesson 2, the AudioContext is holding 20 stale analyser+merger+gain triplets. Browsers eventually GC them, but the graph cost is real and accumulating.
- **Repro:** Open lesson 2, hammer play/stop 30 times, check `performance.memory.usedJSHeapSize` — grows monotonically.
- **Fix:** In each lesson's `stop()`, after the `stop()` calls, do `try { gain?.disconnect(); merger?.disconnect(); analyser?.disconnect(); outGain?.disconnect(); } catch {}` then null them out. Better: refactor drum-academy to use the shared scheduler's `trackSource` pattern, which already handles disconnect on `stopAll()`.

### [LEAK] drum-academy: RAF tickers run after stop
- **Where:** src/pages/drum-academy.astro:415-427 (lesson 1 startMeters), 503-535 (lesson 2 drawScope), and similar in 3/4/5
- **What:** Each lesson's `drawScope`/`startMeters` calls `requestAnimationFrame(tick)` recursively, gated on `if (playing) requestAnimationFrame(tick)`. But `playing` is captured via closure inside the IIFE — and lesson 1's `startMeters` has no `playing` check at all, so once started it animates forever.
- **Repro:** Open lesson 1, click play once, click stop. The meter visual keeps animating (and re-reading from the analyser) at 60fps until you navigate away.
- **Fix:** Lesson 1 needs `if (!playing) return;` early-exit in its `tick`. All lessons should also store the RAF id and `cancelAnimationFrame(rafId)` in their `stop()`.

### [BUG] cast-music-pro: rapid prev/next during in-flight schedule can desync UI
- **Where:** src/pages/cast-music-pro.astro:1070-1086
- **What:** `advance(true)` calls `stopAll(); ... play();`. `play()` calls `ac()`, schedules sources, then schedules the next auto-advance. If the user mashes next-next-next before each `play()` finishes its sync schedule loop, you get the right end-state (qIdx advances), but the `setAmbient(t.color)` / `render()` / `updateBar()` calls each happen for each advance, causing a flash of intermediate tracks in the UI. Not strictly a bug but feels janky.
- **Repro:** Mash the next button five times in 200ms.
- **Fix:** Debounce next/prev to ~120ms. Or short-circuit: if `advance()` is called while a prior `play()` is still within 50ms of `trackStartCtxTime`, skip the render/setAmbient.

### [POLISH] cast-make: WAV export sample rate hardcoded to 44.1kHz, not matching live ctx
- **Where:** src/pages/cast-make.astro:550-557
- **What:** `renderToWav` creates an `OfflineAudioContext` at 44100 Hz. The live `AudioContext` from `ac()` uses the device's native rate (often 48000 on modern hardware, 44100 on older Macs/iPhones). Exported WAV will sound *very* slightly different from the live preview if the device rate differs — pitch is preserved, but any rate-dependent rounding in oscillator phase / convolver IRs / noise buffer indexing diverges. Most ears can't tell, but it's a footgun.
- **Repro:** Compare a 96bpm export waveform against a screen-recorded live playback on a 48kHz MacBook Pro — slightly different.
- **Fix:** Match the live ctx's rate: `const sampleRate = (ctx?.sampleRate) || 44100;` at line 550. Document the file's actual sample rate in the export filename, e.g. `cast-make-${kit}-${bpm}bpm-${sr}hz-${date}.wav`.

### [POLISH] cast-make: 16-bit PCM conversion uses asymmetric multipliers
- **Where:** src/pages/cast-make.astro:586-589
- **What:** `s < 0 ? Math.round(s * 32768) : Math.round(s * 32767)` — using `32768` for negatives correctly hits -32768 at -1.0, and `32767` for positives correctly hits 32767 at +1.0. But the asymmetric multipliers introduce a half-LSB DC offset and slight asymmetric distortion. Industry standard (and what most encoders do) is `Math.max(-32768, Math.min(32767, Math.round(s * 32767)))` for both signs. The current code is technically correct at peaks but mildly nonstandard mid-range.
- **Repro:** Compare a near-silence segment of the export to one from another encoder; the noise floor differs by 0.5 LSB.
- **Fix:** `let v = Math.round(s * 32767); v = Math.max(-32768, Math.min(32767, v)); view.setInt16(p, v, true);`. Saves a branch too.

### [A11Y] cast-make: long-press save has no keyboard equivalent
- **Where:** src/pages/cast-make.astro:755-768
- **What:** The slot buttons can be tabbed to (they're `<button>` elements), but there's no keyboard binding for save. Tap=load is wired via the click handler; long-press=save only fires on mousedown+timer. Keyboard users can never save.
- **Repro:** Tab to a slot button, hit Enter → loads (or saves if empty). Now tab to a filled slot → you can only load, never overwrite.
- **Fix:** Add Shift+Enter or a dedicated "save" button alongside the slot. Or expose long-press as a contextual menu accessible via Shift+F10 / context-key.

### [PERF] cast-music-pro: `plays` localStorage grows by track-id count (bounded but not capped)
- **Where:** src/pages/cast-music-pro.astro:905, 1137
- **What:** `plays: Record<string, number>` adds an entry per unique track id ever played. TRACKS list is ~30 tracks today, so the dict is bounded for now. But if Mike ever adds dynamic playlist sources (Manus generates new tracks, etc.) this becomes unbounded.
- **Repro:** Code-level only at current track count.
- **Fix:** Cap at 200 entries: when adding a new key, drop the lowest-count entry. Or, since this drives only "Wrapped" stats, keep top-50 by count. Comment now so the future-Mike sees the design intent.

## Punch list
1. **Fix `cast-music-pro` play-button-after-queue-exhaust** — single-line guard in the play handler; user-visible, easy.
2. **Add `visibilitychange` handler across all music pages** — affects every iOS user who tab-switches; ~5 lines per page or one shared helper.
3. **Add `touchstart`/`touchend` to cast-make slot buttons** — mobile users currently can't save compositions.
4. **Wrap `Soundfont.instrument()` in try/catch** — cheap insurance against a future soundfont-player bump.
5. **Make all `sched.pause()` / `sched.resume()` call sites async + awaited** — eliminates the rapid-toggle race; also debounce the play button.
6. **Disconnect AudioNodes in drum-academy `stop()` paths + cancel stray RAFs** — leak grows with session length.
7. **Match `OfflineAudioContext` rate to live `ctx.sampleRate` in cast-make WAV export** — quality fix.
8. **Symmetric int16 conversion in WAV encoder** — minor; do alongside #7.
9. **Cap `plays` dict at 200 entries** — futureproofing only; defer.
10. **Truncated-MP3 sanity check in cast-real loader** — defer until a user reports it; current toast UX is acceptable.

## What I checked but did NOT find an issue with
- The scheduler's `arm()` `setTimeout` math — `Math.max(0, (atCtxTime - ctx.currentTime) * 1000)` is correct across pause/resume cycles because `ctx.currentTime` freezes during suspend.
- Re-entrant `stopAll()` safety — clearing `sources` and `timers` while an `'ended'` listener fires on a tracked source is safe (delete on empty Set is no-op; `try/catch` around `s.stop()` handles already-stopped nodes).
- Re-entrant `schedule()` inside a scheduled `fn()` — the comment at line 56 of `audio-scheduler.ts` correctly removes the timer from the array before invoking the callback.
- `schedule()` callback throws — wrapped in `try { t.fn(); } catch {}` at line 58; one bad callback won't break the scheduler.
- `AudioContext.suspend()` / `resume()` rejections — both wrapped in `try/catch`, swallowed; scheduler state stays consistent regardless of outcome.
- `cast-music-pro` localStorage schema drift — `lsGet<T>` falls back to default on `JSON.parse` failure; existing users with stale schemas get re-initialized cleanly.
- `cast-make` composition schema drift — `validateComp()` rejects malformed loaded data and falls back to default; correctly versioned in `encodeComp` with `v: 1`.
- `cast-music-pro` `userPlaylists` 50-cap — properly enforced at line 1597.
- `cast-music-pro` `recentlyPlayed` 24-cap — properly enforced at line 1136.
- `cast-music-pro` URL hash sync — `replaceState` doesn't fire `hashchange`, so no recursive loop in the listener.
- `cast-real` stale-load guard — `if (currentSongIdx !== idx) return;` after the async `loadKitForSong` correctly handles user-switched-songs-mid-load.
- `drum-school` Beat Keeper round restart — `clearPending()` correctly clears both timers and audio sources before the next round arms.
- All music-page `ac()` factories are lazy and gated through user-gesture handlers (play buttons) — no pre-gesture AudioContext creation.
- `cast-make` chord-bar keyboard accessibility — `role=button`, `tabindex=0`, Enter/Space handler in place.
- `drum-school` tap pads — properly bind both `mousedown` and `touchstart` with `e.preventDefault()` to avoid double-fire.
