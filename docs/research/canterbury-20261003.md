# Canterbury research and editorial pack

Prepared 3 October 2026. Companion implementation data: `src/data/canterbury.json`.

The JSON contains six original, accessible introductions and deliberately separate plot reveals, three reading paths, three paired questions, three journey anchors, four sourced Middle English lines with original glosses, and a source register. The summaries and interpretive questions were written for this experience; they are not copied from a modern translation.

## Frame copy ready to use

**A company on the road. A world inside every tale.**

Chaucer imagines pilgrims traveling from Southwark toward Thomas Becket’s shrine at Canterbury. At the Tabard Inn, the Host proposes a storytelling contest: two tales from each traveler on the outward journey and two on the return, with a meal for the winner. Stories soon become replies, challenges and performances. [Harvard’s framing summary](https://chaucer.fas.harvard.edu/summary-framing-narrative).

We have 24 surviving tales, including unfinished ones. The announced contest is never completed. The work survives in ten linked fragments, and the ordering of those fragments is disputed. The six selected tales and reading paths in this experience are editorial invitations, not a reconstructed final order. [Harvard’s tale catalogue](https://chaucer.fas.harvard.edu/pages/text-and-translations), [Harvard on the fragments](https://chaucer.fas.harvard.edu/fragments-or-groups-tales).

**A note on voices.** Geoffrey Chaucer wrote the work. Its first-person pilgrim narrator is a literary persona; the other pilgrims are characters, and the tales they tell can complicate their own claims. A narrator’s praise, a pilgrim’s boast or a tale’s moral should not automatically be treated as the author’s opinion. [E. Talbot Donaldson, “Chaucer the Pilgrim”](https://chaucer.fas.harvard.edu/e-talbot-donaldson-chaucer-pilgrim).

## Geography and illustration

Use **Southwark / Tabard → Rochester → Canterbury** as the schematic’s three real anchors. Harvard’s scholarly maps divide the route into Southwark–Rochester and Rochester–Canterbury. These are reconstructions of the literary journey, not documentation that the fictional company actually traveled. Do not reproduce those copyrighted map images. [Harvard, “The Road to Canterbury”](https://chaucer.fas.harvard.edu/road-canterbury).

Suggested map caption: **“An illustrated journey, not to scale. Real places anchor an imagined company; the tale windows follow our reading paths, not fixed historical stopping points.”**

Canterbury was a real pilgrimage destination; the Cathedral explicitly distinguishes Chaucer’s fictional pilgrims from real travelers. Avoid presenting a modern designated Pilgrims’ Way as the company’s precise medieval itinerary. [Canterbury Cathedral, “Pilgrimage”](https://www.canterbury-cathedral.org/worship/pilgrimage/).

The six tale scenes are different story worlds, not towns on the Kent road: imagined ancient Athens (Knight), Oxford (Miller), Arthurian Britain (Wife), an unspecified widow’s farmyard (Nun’s Priest), Flanders (Pardoner), and coastal Brittany (Franklin). Their direct primary-text sources and line ranges appear in the JSON. An arrival illustration should be labeled imaginative; it must not imply that Chaucer wrote a completed arrival, contest winner or return journey.

Art notes: a portrait of the Nun’s Priest should depict a priest, not a nun. Distinguish Alisoun, the Miller’s young fictional wife, from Alisoun, the Wife of Bath who tells a different tale. Avoid implying that an illustrated portrait records the appearance of a real pilgrim. Original images can evoke manuscript illumination without reproducing a historical manuscript portrait.

## Spoilers and sensitive material

Keep `premise` and `question` visible. Put each `reveal` behind an explicitly labeled **“Reveal the story’s turns”** control. A content note must be available before the reveal. Do not automatically expose endings when filtering themes, choosing routes or opening a paired comparison.

The Wife’s tale begins with rape, not a consensual encounter. Her prologue also describes domestic abuse. The ending should not be described as erasing the opening violence; the victim disappears from the subsequent narrative. Primary reference: [Wife of Bath, III.887–888](https://chaucer.fas.harvard.edu/pages/wife-baths-prologue-and-tale-0); surrounding tale III.857–1264.

The Miller’s humor is adult and includes unwanted sexual touching as well as scatological humiliation and physical injury. Do not reduce its note to “cheeky romance.” Primary reference: [Miller, I.3276–3287](https://chaucer.fas.harvard.edu/pages/millers-prologue-and-tale).

The Franklin’s tale involves sexual pressure, Dorigen’s suicidal thoughts and a catalogue of classical examples involving rape and suicide. Keep these content notes even if the accessible summary omits that catalogue. The question of generosity can coexist with a question about Dorigen’s agency. Primary reference: [Franklin, V.1355–1456](https://chaucer.fas.harvard.edu/pages/franklins-prologue-and-tale).

The Nun’s Priest’s tale contains misogynistic claims followed by a joking qualification and a shift of responsibility to the rooster’s words. Avoid turning that rhetorical performance into an endorsed factual statement about women. Primary reference: [Nun’s Priest, VII.3253–3266](https://chaucer.fas.harvard.edu/pages/prologue-tale-and-epilogue-nuns-priest).

Suggested collection-level note: **“These are six selected tales, not the whole collection. Some stories contain sexual violence, coercion and misogyny; individual notes help you choose. The wider collection also includes antisemitism. The Prioress’s Tale, excluded here, repeats the false blood-libel accusation against Jews. Its prejudice is not historical evidence.”** [Harvard’s contextual discussion of the Prioress’s Tale](https://chaucer.fas.harvard.edu/pages/prioress-tale).

## Text and rights

The JSON sampler contains exactly four **separate** lines from the General Prologue: I.12, I.16, I.27 and I.46. Label them “Four lines from the General Prologue” or “A small Middle English sampler,” with the numbers shown; do not lay them out as one continuous stanza. Their Middle English spellings and punctuation were checked against [Harvard’s primary text](https://chaucer.fas.harvard.edu/pages/general-prologue-0), which credits the Riverside edition. Their accessible glosses are newly written contextual aids; label the mode **“Our accessible gloss”**, not “Chaucer in modern English” or a full translation.

“Fredom” at I.46 is glossed in its contextual sense of generosity, not modern political freedom. The additional Knight reference in that gloss supplies the surrounding sentence’s context. Line I.16 likewise completes the preceding geographical phrase, rather than standing as a complete original sentence.

Chaucer’s medieval text is public domain. Do not copy Harvard’s interlinear modern English translations or its critical apparatus into the product. The source links are reading destinations; the accessible prose on PointCast is original summary and interpretation. An optional verified public-domain full-text link is [W. W. Skeat’s Middle English edition, Project Gutenberg 22120](https://www.gutenberg.org/ebooks/22120), whose catalogue identifies the editor, language and public-domain status in the USA. That edition’s fragment order differs from some modern editions; a source link should not silently claim one definitive sequence.

All factual source links in the JSON were successfully opened. Harvard’s endpoint naming is significant: `knights-tale-0` and `wife-baths-prologue-and-tale-0` are the primary texts; the versions without the final `-0` lead to different summary/index content. No modern translation has been materialized or licensed for this pack.

## Interpretive status

The paired questions and reading paths are this experience’s editorial interpretations, grounded in the stories. Present them as questions to explore, not claims that scholars unanimously agree on a single meaning. Avoid a scored “right moral” quiz. Reader choices can reveal how a tale changes when attention moves from its storyteller to the people inside it.

## Implementation note

The implemented schematic adds a clearly imaginative Story Worlds branch between Rochester and Canterbury. It supplies no distances or historical tale locations. The source register additionally includes the British Library’s “Knight v Snail” for the manuscript-margin context. Fourteen separately generated original artworks and forty WebP renditions have verified dimensions and checksums in `public/images/canterbury/provenance.json`.
