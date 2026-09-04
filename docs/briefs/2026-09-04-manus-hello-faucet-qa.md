# Manus brief — HELLO faucet, real-user QA on a phone

**Date filed:** 2026-09-04 PT
**Filed by:** Claude Code (cc)
**Type:** real-user QA, browser, no purchases
**Run after:** the sign-first delivery fix (Astra's findings on issue #1052) is merged and deployed. Until then, do the claim half only.

## URLs to open

- https://pointcast.xyz/ — the front door; the "TODAY" strip sits under the claim door
- https://pointcast.xyz/faucet/hello — the faucet
- https://pointcast.xyz/api/faucet/hello — the live desk JSON (public)
- https://pointcast.xyz/api/today — the rounds JSON (personal with a session)

## Accounts and tools

- A Google account that has not claimed today (a fresh throwaway is fine)
- A phone browser (iOS Safari and Android Chrome, one run each) and one desktop run
- Any Ethereum address to paste for the send half (a MetaMask account, an exchange deposit address; nothing needs to be signed)

## What to do

1. **Front door, signed out.** The strip shows the El Segundo weather line (temperature, sky, sunset) and five chips. Screenshot.
2. **Sign in with Google** from the strip's "Sign in" link. Confirm you land back on the front door and the strip now reads "0 of 2 tracked rounds done today".
3. **Faucet, claim.** Open `/faucet/hello`. The desk says "Claim today's HELLO — free". Press it. Expect "1 HELLO is in your ledger" and the button reads "Claimed today". Screenshot. Reload: the "You are owed 1 HELLO" block and the ledger line ("held for you") are there.
4. **Back to the front door.** The HELLO chip is now filled and the strip reads "1 of 2 tracked rounds done today". Screenshot.
5. **Second claim.** Press claim again in another tab if possible. Expect "You already claimed today's drip".
6. **Send half (only after the fix is deployed).** Paste an address, press "Send my 1 HELLO". Expect either "1 HELLO sent to 0x…" with a receipt link, or "Ethereum didn't confirm the send yet … settles itself". Open the Etherscan link, screenshot the transaction, note the hash. Reload: the ledger line reads "sent to 0x…" with the receipt link.
7. **Live panel.** The four counters and the spigot line show numbers, not dashes. Screenshot.
8. **Bad paste.** Type `0x123` and press send: expect the plain-English address message, no request made. Type the HELLO contract address `0x1fda96405dd8ee22631abcf4f61282eae802012f`: expect refusal.

## Capture

- Screenshots for steps 1, 3, 4, 6, 7 on each device
- The tx hash from step 6
- Any wording that confused you, any button that did nothing, any layout break on the phone (the desk is white-on-blue; the send row stacks on narrow screens)

## Write the result to

`docs/manus-logs/2026-09-04-hello-faucet-qa.md`, plus a one-paragraph comment on issue #1052.

## Mike approval

None needed. Nothing here buys, signs, or moves anything of value; the send is a valueless token and the spigot pays gas. Do not attempt to set secrets or touch Cloudflare.
