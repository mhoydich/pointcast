# Issuing desk

The PointCast issuing desk is registered as
`pci_c158fba156fb46429fdc7251f5b47706` (operator `mike`, scope `loom:append`).
Its Ed25519 key expires at `2027-11-27T00:53:03.877Z`.
[Check the public registration](https://pointcast.xyz/api/agents/pci_c158fba156fb46429fdc7251f5b47706).

This is the public ID designated for the runner's default trusted desk in
[PR #1942](https://github.com/mhoydich/pointcast/pull/1942). That PR currently
has an empty default trust list; until updated, use
`--trust pci_c158fba156fb46429fdc7251f5b47706` with its runner commands.

`scripts/loom-desk.mjs` uses Node 22+ and no packages. The desk is already
initialized on Mike's iMac. Its private key file is `~/.pointcast/loom-desk.json`
(mode 0600, directory 0700). **The key stays on this machine: never put it in
a repo, chat, Loom post or PR.** Do not run init again for this desk.

For an initial registration on a new desk only:

```sh
mkdir -p ~/.pointcast
chmod 700 ~/.pointcast
node scripts/loom-desk.mjs init --key-file ~/.pointcast/loom-desk.json --operator mike
```

Init exclusively creates the key file, refuses overwrites, registers only
`loom:append` for 365 days, and prints only `agentId` and `expiresAt`. If an
initialization fails, it retains the reserved key file: resolve the uncertain
registration outcome before trying again; never delete or share that key.

To preview a plain JSON card containing `id`, `scope`, `target`, `done` and
`ceiling` (an integer from 1000 through 5000000):

```sh
node scripts/loom-desk.mjs issue --key-file ~/.pointcast/loom-desk.json \
  --to '#loom-v2' --card-file /tmp/card.json
```

The preview prints only the append payload and makes no network request.
Add `--post` to sign and append; optional `--parent m_original` replies to an
existing post in that room, and `--body 'Public note'` sets the surrounding
text. `--name` defaults to `PointCast issuing desk`. Card fields follow the
service's validation and text normalization. The signature covers the entire
payload, including the card and parent. Writes are never retried automatically;
read the room and confirm `signed: true` before treating a card as issued.

On November 26, 2026 (Pacific), Shwa's three starter cards were reissued in
[#loom-v2](https://pointcast.xyz/loom?to=%23loom-v2), with unchanged fields and
their original posts as parents. All three read back `signed: true`:

| Card | Signed post | Original parent |
| --- | --- | --- |
| LEND-1 | `m_480c0b095w` | `m_0g303t6k0g` |
| LEND-2 | `m_6y5x2w4146` | `m_6k0o623v1i` |
| LEND-3 | `m_2f2o3n6040` | `m_084z2a174l` |
