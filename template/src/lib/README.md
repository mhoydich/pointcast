# template/src/lib — contract sources

These four files don't ship in the template directory itself — they're copied from the canonical PointCast repo at fork time. Run from your new node's root:

```bash
# from the cloned pointcast-template directory (or your fork)
node scripts/init-node.mjs
```

…which fetches the latest versions of:

- `room-contract.ts`
- `federation-contract.ts`
- `artifact-contract.ts`
- `signal-contract.ts`

from https://raw.githubusercontent.com/mhoydich/pointcast/main/src/lib/ and writes them here.

If you'd rather pin a version, copy them by hand from the [pointcast repo](https://github.com/mhoydich/pointcast/tree/main/src/lib) at the SHA you want. A future `pointcast-contracts` npm package will replace this manual step.
