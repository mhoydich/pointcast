# PointCast: care made tangible

Design direction for Michael Hoydich · October 27, 2026

Drafted in the existing Still Light task with independent contributions from Astra and Sol. This is a proposed design standard and build sequence, not a claim of user research or release approval. No purchases, new subscriptions, external paid generation, repository edits, merges or deployments were made for this review.

## The goal

A beautifully made place where care becomes something you can hold, inhabit and offer.

The world includes cards, candles, altars, shrines, prayer, healing intentions, positive energy, meditation, sound and visual experiences. Chakra and meridian explorations can have their own explicitly named traditional contexts. The breadth remains; the quality of composition, interaction and receiving care gives the world coherence.

Polish is an acceptance criterion at every step: how a name wraps, how a flame warms the scene, where a ripple begins, how an artwork arrives, how a gong stops, and what a recipient sees first.

## One visual language, distinct places

- **Shared frame:** warm gallery precision, generous space, clear typography, carefully drawn controls and restrained navigation. Colorful artwork retains its character.
- **Cards:** paper, printed pigment, beautiful dedications, an exact sender preview and a graceful receiving experience.
- **Altars and shrines:** wax, ceramic, reflected light and a small set of authored compositions. Objects share lighting direction, scale and shadow logic.
- **Meditation:** water, horizon, mineral color and subtle spatial movement. Guidance is paced and optional; stillness is complete in its own right.
- **Spiritual exploration:** distinguish named traditions and secular reflection. Explain the intended practice without implying a physiological measurement, diagnosis or guaranteed medical effect.

Use an existing open-source expressive serif for prayers and dedications, paired with Inter for navigation and controls. Tune long names, dates, body text and captions as carefully as hero headings. Establish a shared spacing scale, edge treatments, icon family, contrast rules and typography roles before building more pages.

## The 2027 experience we should pursue

The experience responds coherently to a person's explicit choices. Choosing an artwork can influence a scene's accent and light; placing a candle can influence its reflection; choosing a short quiet moment can shape pacing. These are deliberate, local interactions with clear controls and useful defaults. They do not require a paid model call during every visit or inference about a person's emotions.

1. **The Offered Light.** A card opens into a small scene: artwork, dedication, candle. A recipient may simply read or light it. The sender sees exactly what will be received, including whether sound is available. Start with the existing image/text export and a complete local prototype of receiving; persistent shared links require a separately designed delivery/privacy mechanism.
2. **The Personal Altar.** Arrange image, light and words through three carefully composed layouts. Artwork contributes to the atmosphere. Begin with local save/reset and explicit control; later consider shared remembrance spaces with clear ownership and consent.
3. **The Inner Landscape.** One excellent short meditation through water, light and optional sound, with adjustable pace and readable guidance. Add distinct prayer traditions and traditional energy practices as authored experiences with context; do not collapse them into one interchangeable wellness menu.

## Craft contract

| Dimension | Proposed standard | How we judge it |
|---|---|---|
| Composition | Each viewport has a deliberate focal point and balanced content; the ritual is readily reachable. | Review at 360, 390, 768 and 1440 pixels, plus narrow/landscape/large-text cases. |
| Typography | Clear roles, controlled line length, intentional wrapping, consistent spacing; body contrast at least 4.5:1. | Inspect real text, long names, multilingual characters and 200% enlargement. |
| Touch and access | Targets at least 48 CSS pixels where practical; visible focus; logical order; meaningful names/states. | Keyboard and real-iPhone/VoiceOver core-flow checks. |
| Feedback | Immediate visible acknowledgement; small control transitions generally 120–220 ms. | Observe direct manipulation and interrupted/repeated input. |
| Atmosphere | Consequential motion: ignition, illumination, reflection and ripple. Intentional settling can take 700–1,200 ms. | Review sequences in context, including a designed still response for reduced motion. |
| Artwork | Preserve the intended composition; define loading, decode, reveal and failure states. | Review selected crops and aspect ratios; slow/failed load and rapid selection changes. |
| Sound | Explicit consent, bounded voices, smooth attack/release, comfortable mute and coherent perceived loudness. | Offline signal checks plus actual listening on phone speakers/headphones. Gain numbers alone are insufficient. |
| Interruption | Hidden pages stop atmospheric work and sound; returning does not restart audio unexpectedly. | Background, lock, navigate, return and repeat before natural sound decay ends. |
| Receiving | Recipient understands the gesture immediately; no reply, account or public contribution required for the initial gift. | Walk the recipient journey independently of the creator's form. |
| Privacy | Personal words remain local until deliberately shared. Sharing has an exact preview; counts remain separate and optional. | Inspect requests, storage, cancellation, export and failure states using synthetic data. |
| Performance | Bound animation work, decode art intentionally and use responsive assets. Add heavier rendering only when it improves the scene and survives device checks. | Measure actual target-device behavior; do not certify performance from source inspection. |

## Source findings to address

Reviewed source: `mhoydich/pointcast`, branch `codex/still-light-mobile-cards-20261027`, application commit `1c8f7ea54ccd83a678a93317fbf428731d74a115`. Findings below are code/visual-review observations, not new physical-device results.

- Still Light places the full portrait artwork and artwork selector before the mobile ritual. Compose the opening so art establishes atmosphere while the first action is readily available.
- Equal-height desktop cards contain very different amounts of content. Give candle, water and prayer scenes individually composed layouts within a shared system.
- Water ripples always start at a fixed central position. Pointer interactions should originate at the touch location; keyboard activation should retain an intentional central origin.
- Artwork replacement has no explicit decode/reveal/error choreography. Define those states as part of the design.
- Still Light stops oscillators abruptly on mute/retrigger. Introduce short gain ramps and evaluate perceived loudness across timbres through listening.
- The two pages and overview use related but separate typography, color and material treatments. Unify foundations while allowing meaningful differences between a gift, a shrine and a meditation.

Existing strengths to retain: silence on arrival, deliberate sharing, names staying page-local, reduced-motion behavior, distinctive generated art and the considerate message “There is no need to reply.”

## First complete design pass

**Build the Offered Light from creation through receiving, using one finished mobile candle scene as its foundation.**

Deliverables:

1. A reference board with typography, materials, lighting, icons and interaction states. Figma tooling is available in this session; its specific account plan/limits have not been verified. A local HTML/CSS reference sheet is also sufficient and requires no new service.
2. High-fidelity mobile and desktop compositions for arrival, creating, previewing and receiving. Include silence, loading, error, long-text and reduced-motion states.
3. A working prototype: touch-accurate water, refined candle illumination, decoded artwork transitions, finished audio envelopes and exact recipient preview. Preserve the current sharing/export capabilities while treating persistent shared scenes as a separate feature.
4. A critique pass and actual phone/listening verification. Apply the resulting foundations to the other experiences after the slice meets the standard.

This is a way to establish and replicate the high bar across the full vision. It is not a request to remove the broader collection.

## How the agents work together

- **Michael:** aesthetic direction, taste and final product decisions.
- **Astra:** visual and experiential direction; critique composition, emotional coherence and what makes each experience distinctive.
- **Sol:** design-system and engineering contracts; responsive behavior, implementation quality, performance and accessibility.
- **This coordinating thread:** product decisions, prototypes, integration, verification and one coherent handoff.
- **Independent review:** examine the actual combined result, not just each contributor's component. Explicit review holds remain in effect.

Use one approved reference, shared tokens, defined file ownership and one integrator. Parallel work should deepen a coherent direction. It should not create several unrelated visual systems.

## Tools and spending

The existing 25 artworks, available open fonts, CSS/SVG, Web Audio, local rendering and current design tooling are enough for the next substantial improvement. New runtime AI services, voice generation, subscriptions or purchased assets are not needed for this pass. Current tool availability does not establish a paid-plan entitlement or a guarantee of unlimited usage; no purchase or paid external job is initiated by this brief.

## Release boundary

The existing PointCast integration remains in draft PR #1555. The motion overview is a separate delivered artifact. Existing review/iPhone/native-sharing/audio/accessibility checks remain open as recorded in the device handoff. This direction does not clear those holds or authorize a competing deployment. Coordinate any eventual release through the repository's existing lock and `scripts/deploy.sh` process, then verify actual pages and assets.
