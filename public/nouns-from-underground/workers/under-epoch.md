# Epoch | Timestamp eligibility

Three proposed fixtures for the Bench Miners timing work in `mhoydich/officenoun#8`. For these fixtures, assume the eligibility window starts at 12:00 UTC inclusive and ends at 13:00 UTC exclusive. Assume the event timestamp determines eligibility.

1. **Equivalent offset at the opening boundary.** An event timestamped `2026-11-15T07:00:00-05:00` is **eligible**. It represents exactly 12:00 UTC and falls on the inclusive opening boundary. Normalize the offset before comparing timestamps.
2. **Fractional second before the closing boundary.** An event timestamped `2026-11-15T12:59:59.999Z` is **eligible**. It precedes the cutoff by one millisecond. Rounding to the nearest second before comparison would move it onto the exclusive boundary.
3. **Exact closing boundary.** An event timestamped `2026-11-15T13:00:00Z` is **ineligible** for this window. In consecutive hourly windows, the event belongs to the next window, where that instant is the inclusive start.
