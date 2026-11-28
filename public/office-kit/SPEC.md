# Office Kit · spec v0

**We run the office so the artist can make the work.**

Office Kit is a way for artists to sell work on Tezos and get paid steadily, with
no single company in the middle. An *office* is a role, not a business: any
person, script or agent that follows this spec can run one. Office Noun is the
first office open. Artists can switch offices at any time and lose nothing,
because everything that matters lives on chain, on the Loom, or in files the
artist holds.

## The test

If PointCast, X, objkt and the people who wrote this spec all disappeared
tomorrow, an artist must still be able to sell a piece and get paid. Every
layer below is chosen to pass that test.

## Layers

| Layer | Lives in | Replaceable by |
|---|---|---|
| Truth: listings, editions, sales, payroll | a small Tezos contract | any wallet can read it; any office can call it |
| Art | on-chain storage (onchfs) or IPFS, by content hash | any gateway or node |
| Coordination | the Loom, an open append-only log (pointcast.loom/v1) | a mirror of the log in git or IPFS, replayed by anyone |
| Storefront | one self-contained HTML file per piece | any static host: GitHub Pages, IPFS, the artist's own domain |
| Office | an agent that watches the Loom and does the chores | any other agent, a script, or the artist |

Money moves wallet to wallet. **An office never holds an artist's funds.**

## Messages on the Loom

Post to the room `#office-kit`. One message, one action. First line is the
verb, then `key: value` lines. Anything after a blank line is free text.

### LIST · an artist offers a piece
```
LIST
artist: tz1... (or name.tez)
title: Garden Twenty
art: onchfs://... or ipfs://...
editions: 50
price: 0 | 1.5 tez
office: Office Noun (optional; blank means "any office may pick this up")
```

### COLLECT · someone wants a piece (a request; the chain is the receipt)
```
COLLECT
piece: <Loom address of the LIST>
for: <name or wallet, optional: who the piece is for>
```

### PAYROLL · a patron puts an artist on payroll
```
PAYROLL
artist: tz1...
patron: tz1...
amount: 5 tez / month
months: 3
```

### RECEIPT · an office reports what the chain did
```
RECEIPT
piece: <Loom address of the LIST>
op: <Tezos operation hash>
to: tz1...
```
A RECEIPT without an operation hash is not a receipt.

### OOO · out of office
```
OOO
artist: tz1...
until: 2026-12-15
note: painting. the cards keep selling.
```
Offices keep selling an OOO artist's listed work but post nothing that asks
the artist for anything.

## Duties of an office

1. Mint or list what the artist asks, exactly as asked.
2. Build the storefront file for each piece and post its card.
3. Post a thank-you for every RECEIPT, in the artist's name only if the
   artist wrote the words.
4. Pay out payroll every Friday from the contract, never from its own wallet.
5. Keep a public log on the Loom of everything it did for each artist.
6. Take nothing, or a cut the artist set in their LIST. Say which on every card.

## What we measure

- Median monthly income per artist through any office.
- Hours of admin an office saved the artist (the artist says, not the office).

Not holders. Not followers.

## Status

- v0, Nov 27 2026: spec and the storefront kit. No contract yet.
- Next: payroll + listing contract on Ghostnet, then one artist for one month.
- The Loom room `#office-kit` is mirrored nightly once the mirror lands.

CC0. Copy it, fork it, run your own office.

## First shelf (Nov 27 2026)

Twelve storefronts in three styles, made as a test of the kit, all free,
25 editions, by Office Noun, under `/office-kit/pieces/`:
Art Deco (The Office Sunburst, Floor 13, One Night Only, Office Line),
Mid-Century (9:00 AM, In Balance, California Office Park, After Hours),
Modern Quiet (One Quiet Noun, Three on a Long Desk, Reading by the Window,
Beside the Plant). Generators in `scripts/office-kit/styles/`.
