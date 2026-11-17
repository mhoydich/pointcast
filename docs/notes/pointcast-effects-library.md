# PointCast Effects: an evolving library

Version 0.1.0 starts with existing PointCast work and keeps each app in control of adoption. The immutable source directory is `public/pointcast-effects/v0.1.0/`. It exposes the browser global `PointCastEffects` and has no runtime dependencies, network, storage, identity, samples or paid inference.

## Current collection

| Effect | Entry point | Status |
|---|---|---|
| Bell, gong, bowl, chime | `createAudio` | Implemented; listening/device approval outstanding |
| Pointer and keyboard water ripple | `createRipple` | Implemented; device validation outstanding |
| Candle state | `createCandle` | Experimental visual helper |
| Decoded artwork transition | `createArtworkTransition` | Experimental visual helper |

See the versioned README and registry for the actual API. The Offered Light prototype uses the audio/ripple core; the playground exercises all four helpers. The prototype retains its existing scene-specific candle and artwork orchestration, so the experimental helpers are not presented as deployed replacements for those paths.

## Innovate without silently changing existing apps

1. Give each experiment a source/provenance note, a focused playground example and a behavior contract.
2. Define normal, loading, error, interrupted, silent, keyboard and reduced-motion states. Keep user data and delivery outside the effect.
3. Run `npm run test:pointcast-effects`. Add tests for actual lifecycle or integration risks, rather than mirroring every line of code.
4. Compare the visual result and listen on real target devices. Record device/OS, contrast/large-text results, interruption behavior and any remaining limitations.
5. Have an independent reviewer approve the combined result. Record an entry in the change log and update the registry.
6. Publish a new immutable version directory for accepted changes; let each consumer opt into that version. Do not replace existing apps' engines as part of a library experiment.
7. Follow the existing repository review and deployment process. No scheduled self-publishing or competing release is introduced.

## Next experiments

- Refined flame illumination and reflected light with a complete static counterpart.
- A common artwork palette/reveal contract across cards and shrines.
- Auditioned, loudness-balanced procedural sound recipes with documented envelopes.
- A small set of water materials that remain responsive under touch and reduced motion.

These are a development queue, not completed functionality. Additional voices, runtime AI APIs, subscriptions and purchased assets are not needed for this iteration.

## Reuse and provenance

`pointcast-effects-reuse-inventory.md` records inspected source files, hashes, adaptations and exclusions. Small Shrines supplied lifecycle ideas; Still Light supplied one-shot sound direction. Broad import of `chimes.ts` was avoided because it attaches global listeners and includes network/session behavior. Existing games and other apps remain unchanged.

## Change log

- **0.1.0, October 27, 2026:** first reusable core, experimental visual helpers, registry, source audit, workshop playground, creator/recipient prototype and tests. Explicit sound enable; 30 ms user-stop release; immediate hidden/pagehide cleanup; late-resume and replacement guards; bounded strikes/ripples; decode-before-reveal; exact deliberate sharing; no personal-data transmission. Browser/audio mocks do not establish device approval.
