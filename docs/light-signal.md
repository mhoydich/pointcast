# The light signal (v0)

Light Companion (`/light/`) moves one kind of event between people: a light
was lit, or a light was snuffed. This note defines that event. The code is
`src/lib/light-signal.mjs`.

## Shape

```json
{
  "v": 0,
  "kind": "lit",
  "circle": "lc_3f9a0c1e5b7d2a4860c1e5b7d2a4863f",
  "member": "k3m9x2pa",
  "at": 1794400320000,
  "expires": 1794441600000
}
```

| field     | meaning |
|-----------|---------|
| `v`       | Format version. `0`. |
| `kind`    | `"lit"` or `"snuffed"`. |
| `circle`  | A reference derived from the circle link by a one-way hash. It names the circle on a carrier. It is not the link and cannot be used to open, join or change the circle. |
| `member`  | The member's id inside that circle. Eight characters. |
| `at`      | When it happened. UTC milliseconds. |
| `expires` | When a lit light fades on its own. UTC milliseconds, at most 26 hours after `at`. `null` on a snuffed signal. |

One encoded signal is at most 200 bytes.

## Rules

- A signal carries no name, no colour, no text and no location.
- For one member, the signal with the latest `at` wins. A tie goes to snuffed.
- A lit signal past its `expires` reads as not lit. No "expired" event is sent,
  so a receiver that was offline still ends up right.
- A receiver drops anything `isLightSignal()` rejects.
- `encodeLightSignal()` writes the keys in a fixed order with no spaces, so the
  text can be hashed or signed by a later carrier without a second format.

## What carries it today

HTTP only. A browser reads `GET /api/light` every 15 seconds and the response
includes one current signal per member that has ever lit a light
(`signals`). Lighting and snuffing are `POST /api/light`. The server keeps the
latest state per member; it does not keep a log of signals.

## What could carry it later

The shape was kept this small so that another carrier can move it unchanged:
a relay, a local radio link, or a physical "place" that senses a lit flame and
emits `lit` when the flame is there and `snuffed` when it is not. None of
those exist. Nothing here implements Nostr, Bluetooth or AT Protocol.

A carrier that is not private to the circle should add its own protection
(for example, encrypting the signal to the circle). v0 does not define that.

## What it is not

A light signal says a person chose to light a light. It does not say anything
about how they are, and a missing signal does not mean anything is wrong.
Light Companion is not an emergency or monitoring service and cannot call for
help.
