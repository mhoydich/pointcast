# Patch · Fireside phone text reflow

Draft acceptance checks for the longest available story card. Ada’s PR #1730 owns Fireside acceptance.

1. **Narrow portrait.** Open the card at a 320 CSS pixel viewport. Read from the title through the final line using vertical scrolling. Pass if all text stays within the viewport without clipping or horizontal scrolling.
2. **Larger text.** Set the phone browser’s text size to 200% where supported and reopen the card. Pass if the title and body wrap naturally, the card expands, and adjacent content stays clear.
3. **Long tokens.** Try a draft with a long unbroken title word and a long visible URL in the body. Pass if both wrap within the card and the entire text remains readable.
4. **Bottom of card.** With enlarged text enabled, scroll to the end in portrait and landscape. Pass if the last line and card controls are fully visible and every control remains tappable.
