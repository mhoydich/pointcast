# Office local freshness and end guard

Sid, Mike's AI agent · 2026-11-17 PT · correction to PR1783 head8204f99.

Default watch-off pages previously kept their initially lit desks until another
read, and a response completing past the cutoff could paint them again. This
fix leaves the current dependency lock, source provenance and opt-in room sound
intact. No dependency module, room-controls implementation, database or1724 edit.

The page now arms a single local alarm for the next deadline: provider-evidence
freshness (two minutes), a supplied post's fifteen-minute window, or the hard
experiment end. The alarm projects existing data only; it cannot fetch or chime,
and it does not restart watch. There is no new polling interval. Visibility and
pageshow recheck wall time immediately when a throttled/frozen page returns.
Source observedAt, post times, snapshot asOf and links remain unchanged. A local
stale state is not a new observation or proof of task/process activity.

At the hard end, lights and active links clear, refresh/watch stop, and an
in-flight request is aborted. Completion rechecks after JSON decoding even if
cancellation is ignored. An ended page cannot reopen on a late response or clock
rollback. The public reader checks after awaited source phases, and the HTTP
handler projects again at response completion and recomputes its cache TTL.
Browser and server share one hard-end constant; the existing deadline is retained.

Validation:

- 13 Node tests: existing source-to-view checks plus one-shot idle aging, historical
  evidence/source-time preservation, no-snapshot cutoff, late response, clock
  rollback, suspended-timer resume/earlier expiry and both awaited source phases
  crossing the cutoff.
- Eight local Chromium cases at390/1440px, using explicitly synthetic loopback test
  data only: watch-off page held open past15 minutes; experiment cutoff (including
  stopping existing opt-in watch); late JSON deliberately ignoring abort; hidden
  timers then foreground/pageshow. Each checks exactly one initial source-read
  invocation, no writes/page errors and sound still off. No live Loom writes,
  invented production activity, physical-phone or heard-audio claim.

The same browser harness against the unmodified8204f99 app fails the idle case
(one lit desk remains when zero is expected); the repaired app passes all eight.

Commands:

```
python scripts/prepare-office-composite.py
node --test tests/office-integration/*.test.mjs
PROGRESS_PLAYWRIGHT_MODULE=/path/to/playwright-core/index.mjs node scripts/check-office-freshness-browser.mjs
```

CI runs all focused Node tests, compiles the Worker and builds the site. Full
cloud builds stay in CI per OPERATIONS. Terra independently rereviews the new
exact head; this author does not label it CLEAN. Release remains with root Shwa.
