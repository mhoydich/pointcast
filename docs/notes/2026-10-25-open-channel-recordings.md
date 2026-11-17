# Open Channel recorded narration rollout

The user requested less robotic narration and approved producing one take for each of the 54 existing authored lines. The rollout uses static ElevenLabs audio files for the three character stories and the Pitch Room and Story Booth prompts. User answers and notes are not part of the generation catalog, and playback does not call a generation service.

## Current readiness

The catalog remains incomplete. The draft contains eight prepared clips out of 54; the remaining clips are pending. Recorded narration is not enabled, and this note does not assert publication or completed listening review. Public wording and `/open-channel.json` derive their active-provider claims from `getRecordingCoverage()`. Device voices remain the active source until the entire text-matched catalog is ready. Partial assets do not produce a partial switch to recorded voices.

The manifest and assets are maintained separately from the UI. Exact text and local asset paths are checked by `narration-catalog.mjs`; asset tests also verify each included file. The production build must wait for the intended release state, and a complete narration release requires all 54 valid clips plus playback checks.

## Preferences and playback

`voice-settings.mjs` now stores preferences under `pointcast-open-channel-voice-v2`. A legacy v1 preference can supply a device voice URI, but its browser source does not override the first complete recording rollout. A `hasSeenRecordings` flag marks that transition. Once recorded voices have been offered, subsequent explicit source choices are preserved across reloads.

If coverage becomes temporarily incomplete, the visible source returns to device voices while the previous preferred source remains saved. Changing the device voice during that interval does not erase a preference for recordings. Initialization, migration and changing settings never start playback.

Existing controllers route only authored catalog text to the shared narrator. Recorded playback has normal speed and pitch, with immediate Stop and cancellation on scene or prompt changes, dictation, hidden tabs and page exit. A failed recording shows recovery guidance; it does not silently switch to a device voice. Dictation remains an optional browser service and may send microphone audio to that browser provider. PointCast does not record microphone audio.

## Disclosure and release checks

Dessa is not connected. These are authored stories and worksheets, not generated conversations, delivery scoring, or emotion recognition. When the catalog is complete, pages label ElevenLabs narration and explain that user answers are not sent to ElevenLabs. Until then, pages identify device voices and metadata identifies the incomplete prepared catalog.

The preference tests cover first-use defaults, migration from legacy browser preferences, explicit post-upgrade choices, temporary coverage loss, unavailable storage and no autoplay. Existing controller and narrator tests cover recorded playback without browser synthesis, cancellation, stale callbacks and unchanged draft/export behavior. A publishable narration release still needs the complete assets, browser playback review, the normal build and review gates, deployment through `scripts/deploy.sh`, and live verification.
