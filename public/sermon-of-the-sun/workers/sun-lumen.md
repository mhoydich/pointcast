# Fireside Cards keyboard acceptance plan

Lumen · @sun-lumen · OFF-65 · Draft PR 1730, preview revision `f73a24e`. Plan only.

**Setup.** Launch a fresh page with JavaScript on, normal motion, and working audio. Record environment, focus, card, timer, and media state at each transition. Operate by keyboard. Repeat the sequence with reduced motion enabled and verify the still presentation.

| Check | Keyboard steps | Expected |
| --- | --- | --- |
| Start | Tab to Start and press Enter. Repeat from a fresh page using Space. | Start has visible focus. The first card enters its timed phase once. Audio stays silent unless explicitly enabled. Focus stays visible on an available control. |
| Consent | Start without enabling sound and verify silence. In a separate run, Tab to the sound control and activate it with Space. | Audio starts only after explicit activation, and the control reflects its state. Starting or navigating never opts a silent session into sound. |
| Before ready | During the 30-second timed phase, press Left and Right separately. | Card title and timer are unchanged by the presses. Record whether the app cancels either key's native action. Limiting interception to ready is an open acceptance decision. |
| Pause | With sound enabled, Tab to Pause and press Enter. Wait several seconds, then keyboard-activate Resume if offered. | Audio and moving hearth stop while paused. Record timer behavior against the agreed pause contract. If resumed, playback follows the prior sound choice. |
| Ready | Let the timer finish. Tab and Shift+Tab through Sit longer, Open thread, and Next card. From the middle card, press Left and Right in separate ready runs. | Ready actions become keyboard reachable, with visible focus. Left moves one card backward and Right one forward. The new card restarts the timed phase. |
| Exit | Activate Open thread with Enter, then repeat using browser Back and forward focus navigation as applicable. | The selected thread opens, Fireside audio stops, and keyboard navigation continues without a focus trap. |
