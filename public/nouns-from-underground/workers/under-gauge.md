# Bench Miners cost labels

Draft supplement for the Bench timing owner and draft PR #8.

| Evidence | UI label | Tooltip |
| --- | --- | --- |
| Directly measured for this run | Measured | Recorded during this run. |
| Calculated from assumptions or extrapolated | Estimated | Calculated from available inputs and assumptions. |
| No usable cost evidence | Unknown | No cost value is available. |
| Supplied by a reviewer | Reviewer-reported | Provided by a reviewer. |

Display the label beside the cost and preserve its unit. For an unknown cost, display **Unknown** in the value slot so missing evidence never reads as zero. If a reviewer provides a value from a separate run, label it **Reviewer-reported**. When a value is recorded directly for the displayed run, use **Measured** and retain reviewer notes as supporting context.
