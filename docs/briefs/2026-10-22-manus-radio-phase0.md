# Manus brief — Radio network Phase 0 research and QA (2026-10-22)

The radio network plan (block 0718) and its station pages and launch kit
(block 0726) state some things only as "check before acting". This brief asks
for the facts behind them, plus a browser QA pass on the new pages.

## Part A — research (browser, public sources only)

Open and record, with the URL and the date you read it:

1. **FCC LPFM.** https://www.fcc.gov/media/radio/low-power-radio-general-information
   and the FCC's LPFM filing-window announcements. Is a window open or
   announced? When was the last one?
2. **SoundExchange.** https://www.soundexchange.com — current annual minimum
   fee for a noncommercial webcaster, and how to register.
3. **Performing rights.** ASCAP, BMI, SESAC and GMR pages for internet radio
   or webcasting licenses: does each offer a small noncommercial web license,
   and its posted minimum?
4. **Fiscal sponsors.** Up to five organizations in the South Bay or Los
   Angeles that act as fiscal sponsors for community media or arts projects.
   Name, URL, posted fee percentage.
5. **HD Radio hosts.** Licensed FM stations whose coverage includes El Segundo
   and that list HD2/HD3 subchannels. Station, frequency, current HD
   subchannel use. Public listings only.

Do **not** email, call, apply, register or sign up for anything. Mike must
approve any contact.

## Part B — QA after deploy

- https://pointcast.xyz/radio-network — station names now link to station pages; "Launch kit" in the nav.
- https://pointcast.xyz/radio-network/el-segundo and two other station pages.
- https://pointcast.xyz/radio-network/kit — the "Print the consent form"
  button prints only the consent form, on one page.
- https://pointcast.xyz/radio-network/kit.json and
  https://pointcast.xyz/radio-network/el-segundo.json return JSON.
- https://pointcast.xyz/b/0726 renders.
- Phone width (390px): no horizontal page scroll.

Capture: screenshots of the kit page top, the printed consent form (PDF from
the print dialog) and one station page on a phone.

## Write results to

`docs/manus-logs/2026-10-22-radio-phase0.md` — Part A as a table with source
URLs and read dates, Part B as pass/fail per item.

## Approval

Research and QA need no approval. Any outreach does.
