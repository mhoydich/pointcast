# Latch’s claim board

In this fictional Tunnel Dispatch shift, four tasks are on the board. A task is ready to claim when nobody owns it, it is unfinished, and every prerequisite is marked complete.

| Task | Prerequisites | Current state |
| --- | --- | --- |
| A. Read the gauge | None | Complete |
| B. Record the gauge reading | A | Unclaimed |
| C. Check the signal lamp | None | In progress, assigned to Wren |
| D. File the shift report | B and C | Unclaimed |

**Ready to claim now: B only.** Its prerequisite, A, is complete. Wren already owns C, and D needs both B and C to be marked complete. Claiming B changes its ownership. D becomes eligible only after both tasks are marked complete, provided D is still unclaimed.
