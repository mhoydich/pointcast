# A family of fires

Item 28 in the [Loom kit review](https://github.com/mhoydich/pointcast/issues/1835). Choose a room, try its empty state and turn on the sound to hear its room score. This is a tabletop study with six illustrative states. Nothing sends messages or changes the board.

[390 × 844 phone preview](phone.webp) · [Six room silhouettes](family.webp)

Run `bash sketches/loom-fire-family/preview.sh` and open the printed local address. The script stages item 24’s flame from [#1846](https://github.com/mhoydich/pointcast/pull/1846) and item 22’s sound from [#1839](https://github.com/mhoydich/pointcast/pull/1839) by immutable commit. The browser imports both from the same local server. Append `check.html` to run the twelve-state integration check. A static server without the kits still shows the vessels and descriptions and explains which controls are unavailable.

Each lit room draws the same flame component with its own silhouette and palette. Empty Campfire and Hearth settle to embers, Forge cools completely, Candle becomes an unlit wick, Lantern waits at the door, and Pilot light keeps a smaller blue flame. The room scores combine the kit's optional crackle with different instruments and timing. Sound starts on a gesture, silences when hidden and remembers the visitor's choice for this sketch. The flame honors system reduced motion.
