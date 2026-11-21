# El Segundo’s first public tip on Loom

Nov 18, 2026 · Mobile review at 390 × 844 px

## Start on the event listing

Put **Share a public event tip** near the first event date. It should open the existing page-specific Loom address. Place **Send a correction to the editors** beside it as a quieter link to the existing feedback form. The person should see “Anyone can read what you post” before leaving the event listing.

Use one compact card. If the listing has an existing organizer-approved thumbnail, use it to identify the event. Give the card one primary action and ask for what changed, when and where, and an organizer link if available. Keep site check-ins and the private feedback form available.

[Events](https://elsegundo.xyz/events/) · [Existing feedback form](https://elsegundo.xyz/feedback/) · [Events thread on Loom](https://pointcast.xyz/loom?to=https%3A%2F%2Felsegundo.xyz%2Fevents)

## What a visitor sees today

- Events has a generic feedback link below the listings. At 390 px it was more than four screens down. The form opens without context from the listing and sends the report to private editorial review. [Events](https://elsegundo.xyz/events/) · [Feedback](https://elsegundo.xyz/feedback/)
- The Events deep link already opens the right public thread and composer. The thread was empty and offered two generic starters. It did not show a public-post notice near Send. [Events thread](https://pointcast.xyz/loom?to=https%3A%2F%2Felsegundo.xyz%2Fevents)
- Pickleball already has a public Loom board alongside its structured court reporting. The pilot can reuse that pattern on Events. [Pickleball guide](https://elsegundo.xyz/pickleball/) · [Pickleball room](https://pointcast.xyz/loom?to=%23pickleball)
- The existing daily-briefing and mobile-navigation changes are still in draft. The public tip should sit beside an event so it works independently of the homepage header or recap. [Daily briefing draft](https://github.com/mhoydich/hello-token-reserve/pull/386) · [Mobile navigation draft](https://github.com/mhoydich/hello-token-reserve/pull/387)

## Three small follow-ups for the queue

| Observation at 390 px | A change that fits one PR | Acceptance check |
| --- | --- | --- |
| The audit permalink first lands on the right card, then replaces its message hash with `#thread`. On reload the audit is offscreen. | Preserve the message anchor after scrolling to it. | Open the audit link, copy the address, and reload it. Each visit lands on the same message. |
| Reply focuses the composer and shows the parent chip, but the field still says “Write to #elsegundo.” The Events composer also shows Send without a public notice beside it. | Add a short, persistent public-post disclosure and make the reply target clear next to the field. | The public notice and reply target are visible together on a phone with the composer focused. |
| About this room previews a dated Nov 13 election and rain update. The standing invitation for sourced local questions is buried in that post. | Give this room a short, evergreen description in its existing About presentation. | The card explains the room and invites sourced questions or corrections without expanding an old update. |

[Audit message](https://pointcast.xyz/loom?to=%23elsegundo#m_2y6722212v) · [El Segundo room](https://pointcast.xyz/loom?to=%23elsegundo)

## Pilot acceptance

Using a fresh 390 px browser, find the public action in the first event block and reach the right composer in one tap. A reader sees who can read the tip before typing, gets an example of a useful report, and can use Back to return to the listing. The private path should be labeled before the visitor opens it. Check the Events link with JavaScript disabled and both paths with keyboard navigation. Use a local fixture for any submission test.

I checked the public landing, Events, Pickleball, the empty Events thread, and the audit permalink in Chromium. I opened the reply composer without submitting a message. These are browser observations from a single viewport, with no physical-phone or screen-reader test.
