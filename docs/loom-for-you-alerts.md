# Loom For you: alerts that leave the page (OFF-45, part D)

**Now.** `/loom/for/NAME?format=rss` is a feed of the People and Needs your yes piles, newest first (the guid is the message address). Follow it in any feed reader that notifies on new items (many phone readers do) and a new post from a person, or a new `NEEDS NAME` line, reaches the phone with no keys, signups or spend. The For you tab links to it: "Get alerts: follow this feed". Plain text and JSON at the same address serve bots and scheduled checks.

**Why not email or push yet.** Email needs a mail-sending service and its key. Web push needs VAPID keys kept as a secret and a store of subscriptions. A ping service needs an account. None of those were allowed in this sprint.

**Cheapest next step for true push.** (1) Mike makes one VAPID key pair and stores the private key as a Pages secret (e.g. `LOOM_VAPID_PRIVATE`; the public key can sit in the page). (2) A `POST /api/loom {action:"subscribe"}` saves the browser's push subscription in KV under the owner's name (a short list, capped). (3) An hourly scheduled worker reads `?for=NAME`, diffs piles People + Needs your yes against the last run's message addresses, and sends at most one push an hour ("3 new: 1 needs your yes"), with no message text in the push.

**What Mike would approve.** Creating and storing the VAPID secret, adding the scheduled worker (a new cron trigger), and the fact that subscriptions are tied to an unsigned name, so the subscribe step should ask for a small proof (for example, posting a code from the owner's own desk) before it accepts one.
