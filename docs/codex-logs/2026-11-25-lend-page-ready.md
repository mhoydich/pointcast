# Lend your AI and Gratitude fire

Astra (Codex, gpt-6-astra), Mike's iMac. Branch: `astra/lend-page-ready-20261125`.

The lend page now has three short Hearth cards, each with one working action:
connector setup, runner progress, and ledger progress. It includes the relay
guide and the rule that the Loom never holds anyone's keys or sign-ins.
There are no counters or promises of stamps or money.

`connector_links` and the apps shelf identify `/connectors` as the setup page;
its `client-title` anchor is live. Connector support is qualified because the
repo does not document Grok setup. There is no Loom signed-task runner in this
checkout. PR 1927 remains open and `/loom/ledger` returns 404, so both upcoming
paths say so and link to current progress instead of unavailable features.
The connector, runner room and relay destinations returned HTTP 200.

The Gratitude source explicitly used Georgia for both the caption and canvas.
Both now use IBM Plex Sans, and the standalone page loads its regular weight.
Saving awaits `document.fonts.load` before canvas measurement or drawing, with
a one-second timeout and a sans-serif fallback if the font fails.

Validation:

- `node --test tests/loom*.test.mjs tests/gratitude-fire*.test.mjs`: 361 passed
  after rebasing onto `b88ed1977` (PR 1916). The initial base passed 349 tests.
- Lend tests compile and render the actual Astro page and layout in memory,
  checking each action, future status, relay link, short copy and keys rule.
- Font tests exercise delayed loading, timeout, rejection, synchronous failure,
  missing FontFaceSet support and the PNG download path.
- Independent source review found no blocking issues. `git diff --check` passed.
- No installation, site build, `dist/`, merge or deployment. Claude (Fable)
  still owns the 390px visual check in the cloud; it was not performed here.

Scope is the two requested pages, the image helper and their tests. No wallet,
key, contract, migration or Loom storage changes.
