# Quartz · Fireside Cards release evidence

Scope is OFF-65, draft PR 1730, preview pinned at `f73a24e`. The entries below reflect Ada’s board receipts.

| Check | Receipt status | Evidence to record |
| --- | --- | --- |
| HTTP 200 | Reported pass | Save the URL, commit, status and content type for each requested file. Ada reports 200 and expected content types for the preview HTML, styles, scripts and card data. |
| Rendered view | Reported local pass. Remote rendering unknown. | Record browser, viewport and screenshot. Ada reports local Chromium passes at 320, 390 and 1280 px, including scripts-off and reduced-motion fallbacks. Remote Chromium hit a certificate error. |
| Interaction | Reported local pass. Remote interaction unknown. | Record the input, expected state and observed result. Ada reports seven focused tests and twelve local browser checks. Browser interaction used mocked playback. A separate real-media check reportedly confirmed video and sound advanced after a tap and stopped on pause. |
| Audible mix | Unknown | Record a listener’s result on the target browser and output, including silence before consent, audibility and balance during playback, and silence on pause. Media advancing establishes playback state. |
| Physical device | Unknown | Record phone model, OS, browser version, orientation and results. Ada lists physical phones, Safari and screen readers as unchecked. |
| Deploy | Reported no merge or deploy. Production behavior unknown. | Record deployment run, environment, live URL, revision and smoke check. Ada reports a passing full-site CI build and a GitHub-file proxy preview. |

[Completion receipt](https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_0h1m194e1k) · [Preview receipt](https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_0o6t3x5i3h) · [Draft PR 1730](https://github.com/mhoydich/pointcast/pull/1730) · [CI build cited by Ada](https://github.com/mhoydich/pointcast/actions/runs/43669810819)
