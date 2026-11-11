# Manus brief: real-phone QA of Prayer Fire (2026-11-11)

Owner: Claude Code. Tracks TASKS.md "Baby Bonfire: Prayer Fire". Run after the pull request is merged and deployed; before that, the same path works on a Pages preview. This page plays a film and recorded sound, which no other Baby Bonfire page does, so it has only been run by script in headless Chrome. Nobody has heard it and it has not been on a phone.

## Open these URLs

1. https://pointcast.xyz/baby-bonfire/prayer/
2. https://pointcast.xyz/baby-bonfire/ (the section "One screen, for now", under "The idea")
3. https://pointcast.xyz/baby-bonfire.json (the `screens` entry)

## Accounts and tools

None. The page is public. Use an iPhone (Safari) first, then an Android phone (Chrome) and one desktop browser. Have headphones and the phone's own speaker both to hand.

## What to check and capture

- First screen, phone: the unlit fireplace, the title, one button. Nothing plays and nothing sounds before a tap. Screenshot.
- Tap "Light the fire": the film starts, a bowl sounds, a fire crackle and a quiet music bed come in. On iPhone, do this twice: once with the ring/silent switch on silent and once off. Say whether sound plays in each case.
- The mix: say plainly whether the fire, the bowl, the gong and the music bed sit well together, and name any that is too loud, too quiet or clicks where it loops. The fire loops about every 25 seconds and the music about every 75. Listen through two loops of each.
- The film loop: it runs forward then backward, about twelve seconds in all. Say whether the turn-around is visible, and whether the flame stays in the same place on the screen while the picture moves.
- Pick each of the eight chips in turn (Money, The business, A win, Game day, Someone, Thanks, A change, Just sit). The placeholder in the text box should change. "Just sit" should disable the box.
- Type a short line and tap "Offer it to the fire": the words should fly to the flame one at a time, each with a note. Then four lines appear, about thirteen seconds apart, with "In" and "Out" above them. A gong closes it and the page returns to the lit fire. Record the screen for one full run.
- Press and hold on the fire: it should brighten and crackle harder, and on Android the phone should buzz lightly. On iPhone say whether anything is felt at all.
- The gong button and the sound button at the top right. Sound off should silence everything at once; sound on should bring it back.
- Lock the phone for a minute during a sit and unlock it. Say what state the page is in and whether sound resumes.
- Reduced motion (system setting on): the film should hold still, no sparks, and the sit should still run with sound.
- A screen reader (VoiceOver or TalkBack), one run: the chips should read as a group of radio buttons and each line of the sit should be announced.
- The footer: "You have brought N things to this fire" should count up by one per finished sit and survive a reload. In private browsing, say whether it still counts within the visit.
- Console and network (desktop): note any error. Every request should be to pointcast.xyz, under /baby-bonfire/prayer/ plus /favicon.svg.
- Data: on a phone connection, note how long it takes from the tap to sound. The seven media files are about 2.6 MB in all.

## Where to write the result

`docs/manus-logs/2026-11-11-prayer-fire-qa.md`: one section per check with what you saw and heard, device and browser names and versions, the screen recording, and console errors verbatim.

## Approvals

Read-only QA; nothing here needs Mike's approval. Do not post about it anywhere public. Do not light anything.
