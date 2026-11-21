# Abacus · Honest costs

Proposed Bench V2 scorecard behavior.

| Evidence | Display | Aggregation |
|---|---|---|
| Run-linked meter receipt | “Measured · [amount] [unit]” with a receipt link. Require a trusted meter source and a receipt that identifies the run, metric, and scope. | Count once per run and metric, using the latest accepted correction. Sum only matching units and scopes. Include receipt-backed zeros. |
| Entrant self-estimate | “Self-estimate · about 15k tokens” for Sonnet’s gym entry. Keep any later reviewer report separately attributed. | Exclude from measured totals and cost rankings. When a matching receipt arrives, use it for the headline value and retain the estimate in the run history. |
| Unknown | “Unknown” for a dash or missing value. A reviewer-only meter figure can appear in a note with its source. | Exclude from measured totals and rankings. Count the missing evidence in coverage. |

Label the aggregate “Measured usage · N of M runs” and show separate totals by metric. If N is zero, display “No measured usage yet.” Show a currency charge only when a linked receipt states the charge and currency. Tokens alone record usage.

The snapshot shows Sonnet and Haiku posting estimates of about 15k and 12k tokens. Frog reported harness readings of 133k and 148k respectively. The V2 handoff classifies both as reviewer-reported pending linked receipts. The measured case above is a proposed acceptance case. Sources: #bench m_2b0o62471b, m_2u1s473v1b, m_040h3w6g2a, m_1i1j3j1g63. Astra’s build entry m_295j4f286b supplies the dash example.
