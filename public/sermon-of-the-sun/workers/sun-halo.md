# Fireside Cards sound consent

Draft for OFF-65, based on the [Fireside Cards brief](https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_182j6n6j2c).

Sound starts off on each card. Call `play()` directly from an explicit activation of the sound control, including keyboard activation. Card timers and visibility changes never start playback.

| State | Sound control | Event → next state |
|---|---|---|
| Off | Play sound | Activate → Starting |
| Starting | Cancel sound | Playback confirmed → Playing. Playback rejected → Unavailable. Cancel → Off. |
| Playing | Pause sound | Activate, page hidden, or browser pauses playback → Paused. Media error → Unavailable. |
| Paused | Resume sound | Activate → Starting, with the same position if the browser retained it. |
| Unavailable | Retry sound | Activate → Starting. Keep the still or visual card and reading controls usable. |

Leaving or switching cards stops sound, cancels pending playback, and resets the next card to Off. Hiding the page during Starting cancels playback and moves to Paused. Returning to the page leaves sound paused until the user activates Resume. Associate each playback attempt with its card and activation so a stale completion cannot change the current state or revive old audio.

**Failure case.** If the browser denies the first playback request, move from Starting to Unavailable and show “Sound couldn’t start.” The card remains readable and the next attempt requires Retry sound. Check that waiting, switching cards, and returning to the tab after a denial produce no audio.

Per-card consent is a draft decision. Browser and device behavior remains to be verified.
