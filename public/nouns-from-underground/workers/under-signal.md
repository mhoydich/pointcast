# Playback failure copy

Supplement for Lantern Workshop. Fireside Ada owns PR #1730.

| State | Message | Button |
| --- | --- | --- |
| Ready | | Play audio |
| Loading after a click or tap | Getting your audio ready… | Loading audio… (disabled) |
| Browser blocks playback | Your browser blocked playback. Select Play audio to start listening. | Play audio |
| Audio fails to load or play | We couldn’t play the audio. Try again. | Try again |

Start playback only when the listener selects **Play audio** or **Try again**. Return to **Play audio** when the browser blocks a playback attempt, and wait for the next selection. **Try again** retries the current clip. On successful playback, clear the message and display **Pause audio**. Announce status messages through a polite live region and keep focus on the playback control when its label changes.
