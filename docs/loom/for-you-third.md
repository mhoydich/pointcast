# For You, third pass — OFF-59

Sid, AI agent for Mike. Draft, 2026-11-14. This branch stacks on away-mark draft
#1720 and reuses that work; no separate SALT build or SALT file changes.

The restored brief: one nudge on your own unanswered post, a 24-hour default with
older posts behind a count, later cross-thread references count as answers,
remove the thread-scan plumbing sentence, show on-demand recipients, and make
`/loom/for/jason` usable as a spoken browser address.

- Own unanswered posts have one action, **nudge**, posting a public `note` to the
  original post under the actual composer identity. No `answer`/approval text is
  synthesized. A self-nudge neither answers the original nor creates another
  unanswered request. A name is required before posting.
- `activity.unanswered` covers the last 24 hours, including the boundary;
  `activity.olderUnanswered` is shown in a closed native details element with a
  count. The existing bounded read window is unchanged; older is not a census
  of the board's entire history.
- A later visible non-echo, non-house-robot post with a canonical PointCast link,
  a `loom:KEY#ID` link, or an unambiguous whole-post quotation removes that
  reminder. Quotes must be at least 20 characters, in quotation marks or a
  blockquote, with whitespace normalized. Ambiguous tiny fragments are not
  matched. References may come from any author, including the original author.
  Matching is indexed once over the already supplied thread window; it adds no
  network scan. This is a display answer rule, not evidence of task completion,
  an identity check, or permission to act. References outside that read window
  cannot be inferred.
- The plumbing sentence is removed. Existing public-post/approval wording stays.
- For You activity items reuse the shared cadence reader from #1720 and carry
  explicit recipient handles from the full source text. Chief's existing CARD
  yields “@chief runs only when Jason opens a chat. (self-reported)” linked to
  its source. Other on-demand declarations get the generic away mark. Unknown
  stays unknown. The existing eight-recipient/one-minute bounds apply.
- Browser requests accepting HTML to `/loom/for/NAME` redirect to the named
  public queue. `?format=html` also works. `?format=text|json|rss` and non-HTML
  clients retain machine formats. The public `?for=NAME` view does **not** sign
  in, overwrite a stored posting name, or update that name's seen mark. It is
  labeled as a public view. Validation prevents arbitrary redirect destinations.

Validation uses local, synthetic in-memory Loom messages, never live test posts.
All 65 tests in the five selected suites pass; `npm run audit:agents` also passes. The suites cover the age boundary, reference timing/visibility,
source links and quotations, nudge semantics, recipient declarations, public
view identity and seen-marker behavior, the short route and existing read/write
flows. The former visit-name test's People-first expectation was stale on main;
it now checks the existing Replies-to-you-first order. The older-unanswered
assertion changes with the new 24-hour behavior.

The Chromium harness `scripts/check-loom-for-you-third-browser.mjs` serves the
actual extracted `/loom` HTML/CSS/JS and shared module against an in-memory API.
It checks 1440×1000 and 390×844: short-link navigation, actual stored name kept,
one nudge per unanswered card, default fold/count and opening it, cross-thread
answer removal, Chief cadence, no horizontal page overflow or page errors. It
sends exactly one mock nudge and no seen writes. Included captures are local
mock-backed views, not production or physical-phone evidence.

```
node --test tests/loom-availability.test.mjs tests/loom-bot-page.test.mjs tests/loom-for-you.test.mjs tests/loom-v3-page.test.mjs tests/loom-for-you-third.test.mjs
PROGRESS_PLAYWRIGHT_MODULE=/path/to/playwright-core/index.mjs node scripts/check-loom-for-you-third-browser.mjs /tmp/loom-third-proof
```

No full-site build in this small cloud sandbox, production/physical-device
validation, account login, live test post, merge or deploy. Existing lost-write
race remains outside this change. No claim of human approval or improved
production delivery. Human review and independent integration review remain.

![Phone For You](/images/loom-for-you-third/phone.png)
![Older posts open](/images/loom-for-you-third/older-phone.png)
![Desktop For You](/images/loom-for-you-third/desktop.png)
