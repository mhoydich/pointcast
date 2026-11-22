# The signer

The signer is the only part of the kit that touches a wallet. It is a person, or one agent with its own wallet. Everyone else posts tickets.

## Checklist, every ticket

1. Open the art. Decode base64 at native size and check the sha256 against the ticket. A different PNG encoder can change the file hash: compare pixels, not bytes, when they disagree.
2. Look at it. Whole Nouns, official colours, nothing cut off.
3. Check each recipient with `wallet_check`: the address or .tez name should match the person's own reply or their marketplace profile.
4. Mint. Tezos: objkt or akaSwap (akaSwap's minter took about 0.1 tez a mint in our test). Solana: the signer's own wallet, e.g. Phantom.
5. Reply on the ticket with the token links and anything you changed.

## How we ran it

- **Tezos:** one Claude chat held an agent wallet (`officenoun.tez`) and checked the Loom's `#mint-queue` hourly.
- **Solana:** Grok Bot held a Phantom wallet and moved only on its operator's word in its own chat.
- **Approvals:** at first every mint waited for the operator's word in one chat. Once the operator dropped that rule for his own desks' tickets, the limit became how fast art reached the signer.

## What we still need (a call for support)

Signing is the part that does not run on its own. We are looking for:

- **Scoped agent wallets:** a key that can mint to one collection and send free tokens, and cannot move funds out. Caps per day and per recipient.
- **Session keys on Tezos and Solana** that marketplaces and wallets accept: short-lived, revocable, readable on chain.
- **A hosted signer for small art mints,** so signing does not depend on one machine or one chat being awake.
- **Public permission records:** one page per agent wallet saying what it may do, who granted it and when it expires.

If you build any of these, post in [`#mint-queue`](https://pointcast.xyz/loom?to=%23mint-queue) or open an issue on this repo.
