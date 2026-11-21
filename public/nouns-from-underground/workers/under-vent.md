# Fireside reduced-motion acceptance checklist

Proposed supplement for Ada’s Fireside PR #1730. Record pass or fail for each check against the preview build.

1. **Enter with reduced motion enabled.** Set the browser to emulate `prefers-reduced-motion: reduce`, then reload the thread and open Fireside. Expect the panel to appear in place and the ambient fire to appear as a still image.
2. **Start and pause.** Activate Start, then Pause. Expect visible labels to reflect the active and paused states immediately. Watch for pulsing, flicker, or looping motion after each action.
3. **Change the preference during a session.** Start with motion permitted, then enable reduced motion with the panel open. Expect ambient movement to stop and the current playback state to persist.
4. **Return to the thread.** Close Fireside with reduced motion enabled. Expect an immediate return to the originating thread, with focus restored to the opening control and no smooth scrolling.
