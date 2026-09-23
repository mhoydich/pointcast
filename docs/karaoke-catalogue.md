# Karaoke starter set

The `/karaoke/` starter shelf is a data-driven, seven-song set, not a licensed native music catalogue. `src/data/karaoke-catalogue.json` holds stable share IDs, titles, artists/arrangements, fixed YouTube video IDs, publishers, editorial notes, and a source-check date. Original Bell Choir songs remain separate and local.

## Adding songs later

1. Select an identifiable karaoke publisher and an on-screen-lyrics version. A search result, catalogue listing, or audio-only Topic release is not proof of usable karaoke.
2. Test the actual embedded player in the page and confirm playback. Embedding, region, age/account, and publisher restrictions can change. Do not circumvent a restriction or rehost a blocked track.
3. Credit the actual karaoke publisher and arrangement. Disclose alternate songs, vocal guides when known, and explicit-language notices. `sourceChecked` records the source review date, not a permanent availability guarantee or a rights grant.
4. Add the entry with a unique stable `id` and 11-character `videoId`. Never accept arbitrary iframe HTML or URLs. Do not add commercial lyric/audio files or transcriptions.
5. Run `node --test tests/karaoke*.test.mjs`, build, then verify the deployed source. The current seven-entry test is an intentional starter-set bound; expand it deliberately when the catalogue grows.

## September 23, 2026 selection checks

All seven selected publisher players reached real playback in Chrome on the local page. This verifies technical playback at that time, not a public-performance licence or universal availability. Physical microphone/speaker singing quality was not tested.

| Artist / song | Karaoke publisher | YouTube video ID |
| --- | --- | --- |
| Frank Ocean — Thinkin’ ’Bout You | Zoom Karaoke Official | `pU-GuIx4mgU` |
| Bon Iver song — Skinny Love, Birdy arrangement | Zoom Karaoke Official | `WQxIR_oevRs` |
| Weezer — Island in the Sun | Zoom Karaoke Official | `8HIQMWMJaVc` |
| Billy Joel — This Night | Zoom Karaoke Official | `nGAYrhBogsM` |
| Post Malone — Wow. | Vocal Star Karaoke | `-LffMS8oiD4` |
| Kanye West — Heartless | Mr Entertainer Karaoke | `VcaOg14k0e8` |
| Guns N’ Roses — Knockin’ on Heaven’s Door | Zoom Karaoke Official | `PdSQfMp2Hgs` |

Requested Pink + White did not yield a sufficiently clear publisher lyric-video candidate; Undone has a distribution restriction on KaraFun. The selected publisher uploads for Holocene (`7GhWLAClpcQ`), An Innocent Man (`3WPXa-yPZVc`, `Qf13m0K9E3Y`), Ghost Town (`XL7SsjfXEMA`), and November Rain (`cb0JK8Mih3I`, `dTZaIqTMAlA`) returned YouTube error 150 in the embedded player. These are reasons for the disclosed starter substitutions, not claims that the songs are unavailable everywhere. Sing King versions of Wow and Skinny Love also returned 150; other publishers' versions worked.

## Interaction and privacy boundaries

- No YouTube connection until the user loads a player; no autoplay. The visible privacy-enhanced iframe keeps native controls, branding, lyrics, ads, and provider links. YouTube receives connection/playback data when loaded; no promise of anonymous playback is made.
- Video loading closes pitch practice and stops bells. Pitch practice, song/mode changes, backgrounding, and page exit destroy the external player and cancel pending loads. Errors never produce a completion/reflection state.
- Flowers are manual local reflections, not pitch scores. Nouns represent people around this screen, preserve avatar choices until reload, and cheer only on a local tap. No remote rooms, wallets, recording, live AI, or simulated participants.
- Authentic Noun SVGs reuse existing repository assets. No new image generation or music downloading is involved.

References: [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference), [player parameters](https://developers.google.com/youtube/player_parameters), [KaraFun Undone availability](https://www.karafun.com/karaoke/weezer/undone-the-sweater-song/).
