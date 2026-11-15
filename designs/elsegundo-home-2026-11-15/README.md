# elsegundo.xyz homepage redesign (draft, Nov 15 2026)

Mike asked for the elsegundo.xyz homepage to be redone in the same direction as officenoun.xyz/doors and the PointCast Loom For you dashboard (#1741). Mike gave the green light to build and ship it.

elsegundo.xyz is built from `mhoydich/hello-token-reserve` (Netlify), not this repo. The session that made this draft could not attach that repo, so the draft is parked here for a session that can.

## What is here

`index.html` is a self-contained, static mock. It uses today's real homepage content as a snapshot (Nov 15, 9:12 AM PT read). Open it in a browser to see it.

Sections:
- **Hero.** A green "Live" label, then "El Segundo, / today." in two tones, then two pills.
- **Right now.** Six tiles: weather, high tide, sunset, AQI, waves, and a dark Right now tile.
- **In this edition.** The seven cover lines as swipeable cards.
- **The wire and More stories.** Rounded grouped lists.
- **Around here, this week.** Sourced notes. Each shows a one-line summary, and "Read the note" opens the full text and source.
- **What's on.** Date cards.
- **Saturday bonfire.** The Baby Bonfire hearth (media from pointcast.xyz/baby-bonfire/prayer/media/). It lights on tap with fire.mp3. Reduced motion keeps the still image.
- **Anything you need.** Search plus a grid of icon tiles.
- **Around town, together.** A dark band with the Say hi buttons and progress meters for hellos and page reads.
- **On the Loom.** `<pointcast-loom to="#elsegundo">` from pointcast.xyz/loom/embed.js, capped in height.
- **Everything on the site.** Folded groups, then the Ideas cards.

## To port into hello-token-reserve

1. **Live data.** Replace the snapshot values with the homepage's existing data hooks: the live strip, the wire list (`#wire-list`), the events list, the cover lines, the check-in counts and the say-hi POST. In the mock, "Say hi" only marks the button; it must call the site's real check-in endpoint.
2. **Styles.** Keep the site's brand: the ES mark, the cream paper and the navy and blue. Move the CSS into `home.css` (or a new sheet) and drop the system-font stack if the site already ships its own fonts.
3. **Bonfire copy.** It only says "Saturdays at sunset, starting December 5". Pull the time and place from /events/bonfire/ rather than inventing them.
4. **Agent surfaces.** Keep every link from the current "Everything on the site" list. agents.txt, llms.txt and the RSS feed must stay linked.
5. **QA.** Run a Manus phone check (iOS Safari) for the hearth video and audio on tap, the swipe row, the Loom embed height and dark mode.

## Attribution

The copy is the current homepage's own text, plus short section headlines. Nothing is written in Mike's voice.
