# PointCast WalletConnect Diagnosis: MetaMask Pairing Failure

**Author:** Manus AI (via delegation from Claude session, 2026-04-17)
**Task ID:** `9MSNEGn8CCtFzsYG8UsmUt` · https://manus.im/app/9MSNEGn8CCtFzsYG8UsmUt

## TL;DR

A user reported MetaMask pairing failed on pointcast.xyz. Manus investigated four overlapping failure modes and concluded: **drop MetaMask from `WalletConnect.astro` until the Zora/Base decision is made**. Resurfacing it later requires a proper EVM integration (Wagmi or Zora SDK) — the current WalletConnect v2 deep-link path is brittle on mobile and misleading on desktop.

## 1. What is most likely broken — and why it's compound, not singular

The MetaMask pairing failure is caused by **four overlapping issues**:

| Failure mode | Severity | Explanation |
|---|---|---|
| `window.ethereum` is `undefined` on mobile Safari | Critical | Mobile browsers don't support extensions — `window.ethereum` is never injected. Calling `.request()` throws immediately. |
| WalletConnect v2 deep-link silently drops the connect prompt | High | MetaMask mobile opens via the `wc:` URI but the Connect modal never appears — a long-standing MetaMask-mobile bug. |
| Missing Base chain config (error 4902) | Medium | `wallet_switchEthereumChain` to Base (0x2105 / 8453) fails with 4902 if the chain isn't added; fallback to `wallet_addEthereumChain` is missing. |
| Beacon SDK script load race + EIP-1193 provider injection gaps | Medium | Beacon SDK and any EVM provider compete for script-load order; if MetaMask checks happen before provider injection settles, you get false negatives. |

## 2. Strategic recommendation: Drop MetaMask

> "With 100% of current tokens on Tezos and the Zora/Base decision still pending, surfacing MetaMask is pure noise. It creates a broken UX path that undermines trust without providing any current utility. The right time to add it is after the Zora architectural decision is made and a proper EVM integration (with Wagmi or the Zora SDK) is scoped."

**Mike's instinct to drop it is correct.** Keep the Tezos/Kukai path as the sole connect flow until Zora is scoped.

## 3. If you keep it: corrected `connectMetaMaskAndSwitchToBase()`

The hardened function must include:

- `undefined` guard for `window.ethereum` (handles mobile Safari gracefully)
- `wallet_switchEthereumChain` to Base (`0x2105` / 8453)
- `4902` catch block that falls back to `wallet_addEthereumChain` with correct Base mainnet RPC + explorer params
- Error code handling for `4001` (user rejected) and `-32002` (request already pending)

```ts
async function connectMetaMaskAndSwitchToBase(): Promise<string | null> {
  const eth = (window as any).ethereum;
  if (!eth) {
    // Mobile Safari, no extension installed, etc.
    showTezosOnlyModal();
    return null;
  }
  try {
    const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }], // Base mainnet
      });
    } catch (err: any) {
      if (err?.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x2105',
            chainName: 'Base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org'],
          }],
        });
      } else { throw err; }
    }
    return accounts[0] ?? null;
  } catch (err: any) {
    if (err?.code === 4001) return null;       // user rejected — silent
    if (err?.code === -32002) return null;     // request already pending — silent
    console.error('[metamask] connect failed', err);
    return null;
  }
}
```

## 4. If you drop it: user-facing copy

Polite "Tezos Only (For Now)" modal:

> **Tezos only — for now.**
> PointCast tokens live on Tezos today. Connect with a Tezos wallet (Kukai or Temple) to collect, mint, or earn DRUM.
>
> **[Connect Kukai]**  **[What's Tezos? →](https://tezos.com/learn/wallets)**
>
> *Base/EVM support arrives with the Zora drop — subscribe via Farcaster to catch the switch.*

## Suggested follow-ups (not yet actioned)

- Generate the full markdown (this doc is the condensed version based on Manus screenshots)
- Provide a test harness for the `connectMetaMaskAndSwitchToBase()` function
- Build a Wagmi + Zora SDK scaffold when Mike decides on poster vs. coin vs. skip
