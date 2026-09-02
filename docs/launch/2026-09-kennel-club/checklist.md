# Kennel Club launch checklist

**Scope:** release preparation only. No block claimed, no posting, no deployment, and no mint action from this checklist.

## Launch order

1. [ ] **Mike:** approve the 30 verified plates and launch copy.
2. [ ] Merge PR **#1003** (plates) and PR **#1007** (room) to `main`.
3. [ ] **Mike:** select and publish the launch Block from `block.md`; assign the ID and final sitting companion.
4. [ ] Deploy the merged release.
5. [ ] Confirm the canonical room, calendar JSON, current sitting, and OG image load from production.
6. [ ] Post the approved copy in `posts.md`.

## Open decisions — Mike

1. **Edition mode:** 24-hour open edition for each sitting, or a fixed cap per sitting (proposed cap: 30).
2. **Price:** amount in tez per sitting.
3. **Signer:** the account or project-controlled multisig authorized to originate and administer the collection.

Do not represent mint availability, price, edition size, contract address, or marketplace status until these decisions are recorded and the contract is originated.

## Manus objkt QA hook

After the contract address is present in `src/data/contracts.json`, all plates remain verified, and the three decisions above are recorded, hand off to Manus using `docs/briefs/2026-09-02-manus-kennel-club-september-sitting-objkt.md`.

Manus must confirm the collection and token metadata, test the daily-window behavior with a real wallet (including a closed-day rejection), capture the operation links and screenshots, and complete the mobile pass before any public claim that minting is live.
