# Manus brief · 2026-11-15 · phone QA for today's launches

**From:** Claude Code (Mike's agent). **For:** Manus (a real browser on a real phone).
**Write the result to:** `docs/manus-logs/2026-11-15-phone-qa-launches.md`, and post one line with the link to the Loom at `#officenoun-tasks`.

Nothing here needs Mike's approval, **except** step 2's "post the line". That puts a public line on the Loom under a name you choose. Use the name "Manus QA". Use a throwaway Phantom wallet with **zero** funds, never Mike's.

## Devices

An iPhone with iOS Safari is required. Add Android Chrome if you can. Do each page in light mode, then in dark mode.

## 1 · pointcast.xyz/loom (For you dashboard and hearth gate cards)

- Open https://pointcast.xyz/loom?as=manusqa
- Screenshot: the tiles, the Up next card, an open panel, and a "Quick reply" opened.
- If a "Needs your yes" card shows, tap **Yes** once only. Check that the hearth lights, the film plays inline and a bowl sound plays. **Don't tap the second time**, because that posts.
- Log: sideways scrolling, clipped text, tap targets smaller than a fingertip, sound on the first tap, and the film playing inline (not full screen).

## 2 · officenoun.xyz/faucets (the water cooler, Phantom)

- Open https://officenoun.xyz/faucets/
- Tap two nouns. A drop should fall and a plink should play.
- Tap **connect phantom**:
  - Phantom app installed: it should open Phantom's browser, or connect.
  - Not installed: the note should say to install it or paste an address.
- With a zero-funds test wallet: connect, pick one tap, tick "prove the address is mine", then tap **sign up for drips** twice. Check that Phantom shows a **message to sign** (not a transaction) ending "this moves nothing.", and that the line then appears in https://pointcast.xyz/loom?to=%23supreme-one#thread
- Screenshot: the cooler, the Phantom prompt and the posted line.
- **Stop and report if Phantom ever asks to approve a transaction.** It must only ever ask to sign a message.

## 3 · officenoun.xyz/pools (redesign, tabs)

- Open https://officenoun.xyz/pools/
- Tap each of the six tabs and a river chip. Reload on `#weather` and check it stays on Weather.
- Clock in as "Manus QA" and take one Pump ticket.
- Screenshot: the hero tiles, the sticky tab bar while scrolling, and one ticket.

## 4 · officenoun.xyz/kit/ui (Office UI kit)

- Open https://officenoun.xyz/kit/ui/
- Tap a Copy button, then paste into Notes to check it copied.
- Switch the demo tabs, tap "Light it" on the hearth card, then "Hold" twice.
- Screenshot the hearth lit.

## 5 · elsegundo.xyz (new homepage)

- Open https://elsegundo.xyz/
- Check that all six right-now tiles fill with live numbers and the edition cards swipe sideways.
- Check the Say hi card renders. Don't tap it unless you're in El Segundo.
- Screenshot the top of the page and the tiles.

## For each page, log

- pass or fail
- console or visible errors
- sideways scroll (yes or no)
- anything unreadable in dark mode
- tap-target misses
- screenshots

Keep it to plain facts. Mark anything you couldn't check as "not checked", and say why.
