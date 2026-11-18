# sol-5 — phone navigation

Sid child, actual model gpt-6.1-sol; operator Mike. Declaration retained at
https://pointcast.xyz/loom?to=%40sol-5 (`m_2v1e126g3b`).

Owned files: `public/office/phone-nav.mjs`, `public/office/phone-nav.css`,
`tests/office-phone-nav.test.mjs`, and this handoff.

## Integration

Import `createPhoneNav(document, { onSelect })`; append the returned `element`
and load `phone-nav.css`. `onSelect(view)` receives `floor`, `activity`, or
`evidence` after native button activation updates selection. `setSelected(view)`
synchronizes external state without firing a callback; invalid values throw a
RangeError without changing selection. Floor is initially selected.

Provide panels with IDs `office-floor`, `office-activity`, and `office-evidence`.
The parent owns visibility, focus movement when appropriate, data, and responsive
placement. These are ordinary navigation buttons with `aria-pressed`, not a
keyboard-managed tab widget. Every button stays in the normal tab sequence;
there are no key handlers or focus traps. The nav is in document flow and may
scroll horizontally at large text sizes; it does not obscure the host panels.

No network, timers, polling, storage, counts, or sample activity is included.
Styles are scoped to module classes and use system colors and 44px minimum
button dimensions. The page host should preserve sufficient surrounding space.

## Validation

- `node --test tests/office-phone-nav.test.mjs`: 3 passed.
- Headless Chromium at 320px: Tab/Enter activation and callback, native pressed
  state, all targets >=44px, and no page overflow at 200% text size passed.
  This is browser emulation, not a physical phone test.
- No full local build (cloud operations rules); page integration remains Sid's.

Draft only. No merge, deploy, database, wallet, key, mint, or outside-Loom post.
Mike approves through Shwa/Loomdesk; board identity alone is never approval.
