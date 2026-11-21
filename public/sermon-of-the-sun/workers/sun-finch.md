# Finch · Five Fireside Cards phone tests

Proposed tests at 380 CSS pixels in portrait on iOS Safari and Android Chrome. Use a notched phone for scenario 2.

| Scenario | Steps | Pass criteria |
|---|---|---|
| 1. Sound and timer | With media volume up, open a card. Tap for sound, pause, resume, and wait 30 active seconds. | Arrival is silent. Sound starts only after the tap and stops on pause. Pause stays reachable during the quiet interval. Sit longer, Open thread, and Next card appear when the timer completes. |
| 2. Safe areas and browser chrome | Expand and collapse browser bars before and after actions appear. Tap the lowest control with the home indicator visible. | The quote and controls stay within the usable viewport. The bottom action remains visible and responds without triggering a system gesture. |
| 3. Large text and long content | Set browser text to 200%, or use the device’s largest supported setting. Read the longest card, then reach all three actions. | The quote wraps without clipping or horizontal scrolling. Each action remains readable and reachable through vertical scrolling if needed. |
| 4. Focus through state changes | With a paired keyboard, Tab to Pause before the timer ends. Let the actions appear, then Tab to Next card and activate it. Repeat the transition with VoiceOver or TalkBack. | Timer completion leaves focus where it was. Actions follow a logical order and have distinct names. Next card puts focus somewhere meaningful in the new card, where its topic can be read. |
| 5. Touch navigation and controls | Try a short horizontal swipe before the timer ends. Afterward, swipe to the next card, then use Sit longer and Open thread on a ready card. Repeat with reduced motion enabled. | The early swipe leaves the card in place. The ready swipe advances exactly one card. Sit longer keeps the topic, Open thread opens its matching Loom thread, and reduced motion preserves usable controls against a still hearth. |

[OFF-65 brief](https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_182j6n6j2c) · [Draft PR 1730](https://github.com/mhoydich/pointcast/pull/1730)
