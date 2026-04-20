# Codex brief — VOICE.md enforcement

**Audience:** Codex acting as PR-review specialist.

**Context:** PointCast just landed VOICE.md (repo root) + author/source schema fields (`src/content.config.ts`). The rule: default author is `cc`; any block attributed to `mike` (or `mh+cc` or `guest`) MUST include a non-empty `source` field. Mike does not pre-review every block — this is the structural protection against false-attribution.

The voice-audit sprint (2026-04-18) handled the existing catalog. Going forward, every PR that touches `src/content/blocks/*.json` needs this check.

---

## Task V-1 — One-shot grep audit

Before any PR-by-PR enforcement, do a full-catalog audit confirming the voice-audit sprint cleaned everything up.

```bash
# Every block file should pass this:
for f in src/content/blocks/*.json; do
  author=$(jq -r '.author // "cc"' "$f")
  source=$(jq -r '.source // ""' "$f")
  if [[ "$author" != "cc" && -z "$source" ]]; then
    echo "VIOLATION: $f — author=$author has no source"
  fi
done
```

**Deliverable:** Run the grep. Report 0 violations (expected) or list whatever turns up. If there are any violations, open one-per-file PRs with either (a) source filled in from chat history if you can find it, or (b) author downgraded to `cc` and content rewritten to remove invented Mike-voice.

---

## Task V-2 — PR-time check

Add a CI gate (or pre-commit hook, depending on what's available) that runs the same check on every PR touching `src/content/blocks/*.json`. PR fails when any block has author non-cc and source empty.

**Deliverable:** A `.github/workflows/voice-check.yml` (or equivalent) that runs the grep above on every PR.

---

## Task V-3 — Light voice review

Beyond the structural check, do an editorial pass: even when the schema passes, does the prose actually sound like the named author?

- A block with `author: 'mike'` should sound like Mike (lowercase-comfortable, conversational, short sentences, no academic framing). If it doesn't, flag for cc rewrite.
- A block with `author: 'cc'` should sound editorial, not first-person Mike. Watch for slips like "I had a great match yesterday" without an `mh+cc` author + chat source.

**Deliverable:** Per audited PR, either approve or comment with specific lines that need a voice change.

---

## Task V-4 — Update the AGENTS.md and the for-agents page

VOICE.md needs to be referenced from:
- `AGENTS.md` (already partially done — Claude Code's "Reads on every session" line. Add a separate VOICE section with the rule.)
- `src/pages/for-agents.astro` (add a one-line "Voice rule: VOICE.md applies to all blocks" in the agents-readable manifest)
- `public/llms.txt` (add a `## Voice` section)

**Deliverable:** PR with the three doc updates. Single PR is fine.

---

## Submission

- One PR per task. Tag MH for review. Do not merge without approval.
- If V-1 turns up violations, prioritize fixing those before V-2 ships (don't gate the codebase against itself).

— Claude Code, sprint `voice-audit`, 2026-04-18 cron tick
