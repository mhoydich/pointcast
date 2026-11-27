/**
 * Cross-platform haptics for the Campfire Drum Circle.
 *
 * Spec: pointcast.sensory.mcp/v1
 * Haptics are OFF until a caller passes the boolean true. This module never
 * reads or writes storage. Patterns are short on purpose: a phone may buzz,
 * an iPhone may tick an unofficial switch, and every other device gets a
 * visual stand-in only after the person opts in.
 */

export const SPEC = 'pointcast.sensory.mcp/v1';
export const HAPTICS_DEFAULT = false;

export const PLATFORMS = Object.freeze(['web-vibration', 'ios-taptic', 'visual', 'none']);

/** Pulses stay under 80ms and whole patterns under 600ms. */
export const HAPTIC_LIMITS = Object.freeze({
  minPulseMs: 1,
  maxPulseMs: 80,
  minGapMs: 10,
  maxGapMs: 200,
  maxSteps: 15,
  maxTotalMs: 600,
  reducedPulseMs: 12,
});

export const HAPTIC_PATTERNS = Object.freeze([
  Object.freeze({
    id: 'hand',
    label: 'Hand drum',
    detail: 'One soft hit on the low skin in front of you.',
    intensity: 'soft',
    vibration: Object.freeze([18]),
  }),
  Object.freeze({
    id: 'frame',
    label: 'Frame drum',
    detail: 'A tap, a short wait, and a fuller ring to your left.',
    intensity: 'medium',
    vibration: Object.freeze([12, 48, 20]),
  }),
  Object.freeze({
    id: 'shaker',
    label: 'Shaker',
    detail: 'Three light seeds across the fire.',
    intensity: 'light',
    vibration: Object.freeze([8, 28, 8, 28, 8]),
  }),
  Object.freeze({
    id: 'log',
    label: 'Log drum',
    detail: 'Two wood tones to your right.',
    intensity: 'medium',
    vibration: Object.freeze([14, 40, 22]),
  }),
  Object.freeze({
    id: 'ember',
    label: 'Ember',
    detail: 'One crackle from the center of the fire.',
    intensity: 'feather',
    vibration: Object.freeze([10]),
  }),
]);

const byId = new Map(HAPTIC_PATTERNS.map((pattern) => [pattern.id, pattern]));

export function patternProblem(vibration) {
  if (!Array.isArray(vibration) || vibration.length < 1 || vibration.length > HAPTIC_LIMITS.maxSteps || vibration.length % 2 === 0) {
    return 'pattern must be an odd-length list of 1 to 15 millisecond values';
  }
  let total = 0;
  for (let i = 0; i < vibration.length; i += 1) {
    const value = vibration[i];
    if (!Number.isInteger(value)) return 'pattern values must be integers';
    total += value;
    if (i % 2 === 0) {
      if (value < HAPTIC_LIMITS.minPulseMs || value > HAPTIC_LIMITS.maxPulseMs) return 'a pulse must be 1 to 80 ms';
    } else if (value < HAPTIC_LIMITS.minGapMs || value > HAPTIC_LIMITS.maxGapMs) return 'a gap must be 10 to 200 ms';
  }
  if (total > HAPTIC_LIMITS.maxTotalMs) return 'a pattern must finish within 600 ms';
  return '';
}

for (const pattern of HAPTIC_PATTERNS) {
  const problem = patternProblem(pattern.vibration);
  if (problem) throw new Error(`haptic ${pattern.id}: ${problem}`);
}

export function patternById(id) {
  return byId.get(String(id || '')) || null;
}

/** Collapse a rhythm to one short pulse when the person asked for less motion. */
export function vibrationFor(pattern, { reducedMotion = false } = {}) {
  const source = pattern?.vibration;
  if (patternProblem(source)) return [];
  if (reducedMotion) return [Math.min(HAPTIC_LIMITS.reducedPulseMs, source[0])];
  return source.slice();
}

/** Onset times for an iPhone switch tick. Even indexes are pulses. */
export function tickTimes(pattern) {
  if (patternProblem(pattern)) return [];
  const times = [];
  let cursor = 0;
  for (let i = 0; i < pattern.length; i += 1) {
    if (i % 2 === 0) times.push(cursor);
    cursor += pattern[i];
  }
  return times;
}

export function detectPlatform({ vibrate, ios = false } = {}) {
  if (typeof vibrate === 'function') return 'web-vibration';
  if (ios) return 'ios-taptic';
  return 'visual';
}

function defaultSchedule(fn, ms) {
  if (ms <= 0) {
    fn();
    return 0;
  }
  return setTimeout(fn, ms);
}

/**
 * Hidden switch for iPhone Safari. Toggling it can tick the Taptic Engine.
 * The path is unofficial and may stop working. The control is not in the
 * tab order and has no accessible name of its own.
 */
export function mountIosTapticSwitch(doc) {
  if (!doc?.body || typeof doc.createElement !== 'function') return null;
  const input = doc.createElement('input');
  input.type = 'checkbox';
  input.id = 'campfire-taptic';
  input.tabIndex = -1;
  input.setAttribute('switch', '');
  input.setAttribute('aria-hidden', 'true');
  const label = doc.createElement('label');
  label.htmlFor = 'campfire-taptic';
  label.setAttribute('aria-hidden', 'true');
  const holder = doc.createElement('div');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:fixed;left:-200px;top:0;width:1px;height:1px;overflow:hidden;';
  holder.append(input, label);
  doc.body.append(holder);
  return function clickSwitch() {
    try {
      label.click();
      return true;
    } catch {
      return false;
    }
  };
}

function defaultCancel(id) {
  if (id) clearTimeout(id);
}

export function createHapticPlayer({
  vibrate,
  clickSwitch,
  reducedMotion = false,
  platform,
  schedule = defaultSchedule,
  cancel = defaultCancel,
} = {}) {
  let enabled = false;
  let latched = false;
  let timers = [];
  const mode = platform || detectPlatform({
    vibrate,
    ios: typeof clickSwitch === 'function',
  });

  function clearTimers() {
    for (const id of timers) {
      try { cancel(id); } catch { /* a missed cancel should not keep buzzing */ }
    }
    timers = [];
  }

  function setEnabled(value) {
    const next = value === true;
    if (!next) clearTimers();
    if (!next && latched && typeof vibrate === 'function') {
      try { vibrate(0); } catch { /* cancelling a pulse is best-effort */ }
    }
    if (!next) latched = false;
    enabled = next;
    return enabled;
  }

  function pulse(id) {
    const pattern = patternById(id);
    if (!pattern) return { fired: false, reason: 'unknown-pattern' };
    if (!enabled) return { fired: false, reason: 'haptics-off' };
    const seq = vibrationFor(pattern, { reducedMotion: reducedMotion === true });
    if (mode === 'none') {
      return { fired: false, reason: 'no-haptic-hardware', platform: 'none', reducedMotion: reducedMotion === true };
    }
    if (mode === 'visual') {
      return { fired: true, platform: 'visual', visual: true, pattern: seq, reducedMotion: reducedMotion === true };
    }
    if (mode === 'web-vibration') {
      if (typeof vibrate !== 'function') return { fired: false, reason: 'vibrate-unavailable', platform: mode };
      try {
        const result = vibrate(seq);
        if (result === false) return { fired: false, reason: 'vibrate-rejected', platform: mode, pattern: seq };
        latched = true;
        return { fired: true, platform: mode, pattern: seq, reducedMotion: reducedMotion === true };
      } catch (err) {
        return { fired: false, reason: 'vibrate-failed', message: err?.message || String(err) };
      }
    }
    if (mode === 'ios-taptic') {
      if (typeof clickSwitch !== 'function') return { fired: false, reason: 'taptic-unavailable', platform: mode };
      const ticks = tickTimes(seq);
      try {
        clearTimers();
        for (const at of ticks) {
          const id = schedule(() => {
            if (!enabled) return;
            clickSwitch();
          }, at);
          if (id) timers.push(id);
        }
        latched = true;
        return { fired: true, platform: mode, ticks, reducedMotion: reducedMotion === true };
      } catch (err) {
        return { fired: false, reason: 'taptic-failed', message: err?.message || String(err) };
      }
    }
    return { fired: false, reason: 'unknown-platform', platform: mode };
  }

  return {
    setEnabled,
    pulse,
    enabled: () => enabled,
    platform: () => mode,
  };
}

export function describePattern(pattern, { reducedMotion = false } = {}) {
  return {
    id: pattern.id,
    label: pattern.label,
    detail: pattern.detail,
    intensity: pattern.intensity,
    vibration: vibrationFor(pattern, { reducedMotion }),
    ticks: tickTimes(vibrationFor(pattern, { reducedMotion })),
    reducedMotion: reducedMotion === true,
  };
}
