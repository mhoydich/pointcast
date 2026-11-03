# Manus brief: PMM sound and haptics, real-device QA

Filed 2026-10-23 by Claude Code, from the PMM sound-and-haptics design sprint (PR #1535). This is the phase-1 lab only: `/pmm/sound/` is a standalone page, and the PMM app itself doesn't use the new sounds yet.

**When to run:** after the PR merges and `scripts/deploy.sh` reports the new tip live. Run `npm run audit:publishing` first. Until then, nothing is at the URL.

**Approval:** none needed from Mike. The page can't send, spend or post anything, and it doesn't load or upload any audio.

## URLs to open

- https://pointcast.xyz/pmm/sound/ (the lab)
- https://pointcast.xyz/pmm/ (the live app, for comparison: today's two-note blips)
- The previews, as a fallback if live audio misbehaves: https://pointcast.xyz/pmm/sound/previews/connect.wav and https://pointcast.xyz/pmm/sound/previews/receive-from-hyped.wav

## Devices and accounts

- An iPhone with Safari. A recent iOS is fine, and an older one too if you have it.
- An Android phone with Chrome. Vibration only works here.
- Bluetooth headphones or earbuds. AirPods on the iPhone are ideal.
- A desktop browser.
- No logins.

## Checks

### 1. Nothing plays before a tap

On each phone, open the lab and wait 5 seconds without touching it. There must be silence and no vibration. Then tap `boot` under section 2. It should play: a noise sweep and a rising chord, about 1.2 s.

### 2. iOS silent switch and unlock

On the iPhone:

1. Switch the ring/silent switch to silent, or Control Centre silent mode on newer phones, and tap `send`, `receive` and `connect`.
2. Write down whether you hear sound. Web Audio on iOS normally obeys the silent switch, and that's the behaviour we expect. Either result is useful, but say which.
3. Turn silent off.
4. Lock the phone for 10 seconds, unlock it and return to Safari. Tap `receive`. It must play on the first tap, or at worst the second. If it takes more than two taps, note that as a bug.
5. Start a phone call or play a video in another app, come back, and tap `receive` again.

### 3. Android vibration

On Android Chrome, with HAPTICS ticked:

1. Tap each of `send`, `receive`, `fail` and `connect`. Each should vibrate differently: send is one tiny tick, fail is two heavy pulses, connect is three.
2. Set THEM to `hyped`, then `low`, and tap `receive`. Hyped should be a quick triple flutter; low should be one longer thump.
3. Untick HAPTICS and confirm the phone stops vibrating.
4. Check whether the phone vibrates with media volume at zero. That's expected, but please note it.

### 4. Bluetooth latency

With Bluetooth headphones connected, tap `send` and `react` repeatedly. Record whether the sound arrives noticeably after the tap. Under about 150 ms feels fine; a clear lag over 250 ms is a finding. Repeat with the phone speaker for comparison.

Optional: film the screen and listen through the earbuds held to the phone's microphone. The coloured sweep bar under the caption starts on the tap, so frames give a rough figure.

### 5. Loudness on the phone speaker

1. Set phone media volume to about 70% and the lab VOLUME to 80% (the default).
2. Play every button in section 2. Anything harsh, piercing or clearly louder than its neighbours is a finding; name the event and the ME/THEM moods.
3. Set the lab VOLUME to 100% and play `boot`, `connect` and `their-mood`. There must be no crackle or distortion.
4. Compare with the live app's blip at https://pointcast.xyz/pmm/. Say whether the new cues are quieter, about the same, or louder.

### 6. Fatigue demo

Press PLAY 200 in section 3 and listen for at least 30 seconds. Then answer three questions:

- Does it become annoying?
- Do the counters show "folded" going up?
- Does BURST 20 make exactly one sound?

### 7. Background sound

1. Tick MESSAGES SOUND WHILE HIDDEN, start PLAY 200, and switch to another tab or app. Note whether you hear anything. Phone browsers often suspend audio in the background regardless, so either result is useful; record it.
2. Untick the box and repeat. It must be silent.

### 8. Atmosphere bed

Tick ATMOSPHERE BED and listen for 20 seconds.

- It should be a very quiet, slow drone, built from both moods.
- It must stop within a second when you untick it or untick SOUND.
- Note any hum or buzz on the phone speaker, which can struggle with notes this low.

### 9. Captions and layout

1. At 390 px, every tap must update the caption box: it names the event, the moods and the duration.
2. There must be no sideways scrolling.
3. With VoiceOver or TalkBack on, the caption should be read out after each tap.

## What to capture

For each check, record pass or fail, the device, the OS version and the browser. Also capture:

- a screen recording (with sound) of checks 2 and 5 on the iPhone;
- the Android vibration notes from check 3;
- one screenshot of the lab at phone width.

## Where to write the result

`docs/manus-logs/2026-10-23-pmm-sound-qa.md`. Comment on PR #1535 if it's still open, otherwise on the phase-2 integration PR.
