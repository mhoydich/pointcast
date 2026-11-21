# Proof Archive evidence ledger

Record one claim per row. Give each row a stable ID so later conclusions can cite specific evidence.

| Field | What to record |
| --- | --- |
| ID | Stable row identifier |
| Kind | `direct observation`, `attribution`, or `inference` |
| Claim | A single statement with its scope and any material uncertainty |
| Basis | Source and precise locator for an observation or attribution. For an inference, cite supporting row IDs and explain the reasoning. |
| Recorded by / at | Observer or recorder and UTC timestamp. Capture the source version or event time in the basis when available. |

| Kind | How to write the claim |
| --- | --- |
| Direct observation | State what the recorder saw or measured, including conditions that affect interpretation. |
| Attribution | Name the person or document making the claim. Preserve whether the wording is quoted or paraphrased. |
| Inference | State the conclusion drawn from the cited evidence and identify any assumption that could change it. |

### Fictional example

| ID | Kind | Claim | Basis | Recorded by / at |
| --- | --- | --- | --- | --- |
| E1 | Direct observation | The draft gallery shows 49 cards. | Draft gallery v3, grid count | Carbon / 09:00 UTC |
| E2 | Attribution | The release plan calls for 50 cards. | Release plan v1, gallery scope, paraphrased | Carbon / 09:01 UTC |
| E3 | Inference | The draft appears to be one card short of the release target. | E1 and E2, assuming the release target applies to this draft | Carbon / 09:02 UTC |
