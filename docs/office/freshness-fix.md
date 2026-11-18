# Office local freshness and end guard

Sid, Mike's AI agent · 2026-11-17 PT · correction to PR1783 head8204f99.

Default watch-off pages previously kept their initially lit desks until another
read, and a response completing past the cutoff could paint them again. This
fix preserves source provenance and opt-in room sound. The later dependency
integration below refreshes the exact lock. No dependency module, room-controls implementation, database or1724 edit.

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
- Twenty-six local Chromium cases at390/1440px, using explicitly synthetic loopback test
  data only: watch-off page held open past15 minutes; experiment cutoff (including
  stopping existing opt-in watch); late JSON deliberately ignoring abort; hidden
  timers then foreground/pageshow. Each checks exactly one initial source-read
  invocation, no writes/page errors and sound still off. No live Loom writes,
  invented production activity, physical-phone or heard-audio claim.

The same browser harness against the unmodified8204f99 app fails the idle case
(one lit desk remains when zero is expected); the repaired app passes all twenty-six.

Commands:

```
python scripts/prepare-office-composite.py
node --test tests/office-integration/*.test.mjs
PROGRESS_PLAYWRIGHT_MODULE=/path/to/playwright-core/index.mjs node scripts/check-office-freshness-browser.mjs
```

CI runs all focused Node tests, compiles the Worker and builds the site. Full
cloud builds stay in CI per OPERATIONS. Terra independently rereviews the new
exact head; this author does not label it CLEAN. Release remains with root Shwa.

## Follow-up: focus and reading state

Terra's rereview of97eeb18 found that local repainting lost focus and closed
expanded source details. The same integration now binds stable control keys to
desk handles/source URLs, remembers detail state and focus before painting, and
restores both after painting and room-control changes. No new source read or
observation is made. Keys do not depend on changing age/status labels.

A source that still exists keeps keyboard focus. If cutoff legitimately removes
the focused evidence link, focus moves to its existing evidence section instead
of the body; the removed control is not recreated. Unaffected navigation/controls
keep focus, and an idle page with no focused control does not gain focus.

The browser cases include desk source/summary and evidence source focus,
open details through evidence/post aging, cutoff and visibility/pageshow, and the
removed-evidence fallback. All retain the one-initial-read/no-writes/silent-arrival
assertions. The97eeb18 app fails the added focus/detail regression.

## Final targeted follow-up: failed reads and resize

Terra's review of4432280 found the two remaining unguarded replacement paths.
The common synchronous withViewState boundary now wraps both successful paints
and failed-read clearing. Failure removes old lit content and falls back to the
reader's floor/activity/evidence section. It does not restore stale controls or
start a retry. Resize replaces only SVG geometry, keeping the exact existing
thread source-link nodes and focus. No dependency-lock or sound/watch edit.

The26 browser cases include automatic failed reads with focus on desk, evidence,
activity and thread sources, plus resize preserving thread-node identity while
geometry changes. Overlay thread sources are normally visually suppressed; the
loopback fixture surfaces the actual controls to exercise that renderer path.
Failure tests permit precisely the initial read plus one existing opt-in watch
read, then verify no retry; all other cases permit only the initial read.
The4432280 app fails the new failed-read focus regression.


## Corrected data contract integration · Nov17 PT

The pinned1778 head is116e295d1c0493829dacfb983cd1a5a0739814c9;
1775 is84699717d4311cdd90da565f66f4e0534c5a5c43. Ada owns these modules.
The additive parentContext API exports only validated older immediate parents
needed by fresh resolved replies. Integration adds that context to the
room-qualified parent lookup only. Fresh events alone still supply desk timestamps,
activity and chime IDs; context never lights its author or becomes a new post.
Both edge endpoints still require eligible declarations. Reply edges retain their
source timestamp and locally expire on that deadline, even when the author has
a newer post. Missing/invalid/future-to-observation edge times fail closed.
The existing one-shot alarm handles this without network reads.

Validation of the assembled dependencies:15 Node tests, plus28 Chromium cases
at390/1440px. The two new browser cases use actual provider adapters with local
mock HTTP bodies, then the actual integration projection and app/renderers:
a one-minute reply to a20-minute parent draws the real edge, the parent stays
unlit/absent from fresh activity, only the reply author lights, a head-confirmed
conflicting draft lights the1770 warning, and the edge ages out without another
read. Every existing expiry, late-response, focus/details, visibility and resize
case remains in the suite. Provider assembly makes exactly13 GETs; browser source
reads remain one unless a pre-existing opt-in watch test explicitly expects two.
The new adapter regression fails with the previous fresh-events-only lookup.
No physical-device, heard-audio, live qualifying reply or release-clearance claim.
CI and exact assembled head are reported in the linked Loom receipt after push.
