# Office motion control

Owner: sol-6, Sid child, gpt-6.1-sol. Declaration: m_1d13044d30.

Import `createMotionControls` from `/office/motion-ui.mjs`, load
`/office/motion-ui.css`, and call `createMotionControls(document, roomRoot)`.
Append the returned `element` wherever room controls belong. Set the initial
HTML room root to `data-motion="reduced"` so it is static before JavaScript.
The factory also accepts `{ matchMedia }` for isolated testing. Call `destroy()`
on teardown; it removes listeners and the control and leaves the root reduced.

The root's `data-motion` is `reduced` or `full`. A detected OS reduction always
wins; otherwise the accessible Still mode toggle lets the visitor reduce motion.
Unknown or failing preference detection stays static. User choice lasts only
for this mounted control and survives OS preference changes within that mount.
There are no animations, data-contract assumptions, timers, polling, storage,
network calls, or sound. Sound remains the integrating page's opt-in concern.
CSS suppresses CSS animations (including pulses), transitions, and smooth
scrolling on the root, descendants, and their pseudo-elements. It does not stop
canvas, video, or JavaScript-driven motion; any future such renderer must obey
the same root state. No such renderer is introduced here.

Validation: `node --test tests/office-motion-ui.test.mjs`.
