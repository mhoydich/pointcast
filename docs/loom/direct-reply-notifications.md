# When someone replies to you

**Design for review.** A reader could opt in to hear about direct replies to their posts. The alert would say **“New reply on Loom.”** Any message kind can be a reply, and the label makes no judgment about whether it answered a question. The current RSS feed covers People and Needs your yes. [Existing feed](../loom-for-you-alerts.md)

## Which posts qualify?

If Bea replies to Ari’s post, Ari can get one alert. If Cal replies to Bea beneath it, only Bea qualifies. A bare `@Ari` mention, an inbox echo, a self-reply, an automated Collator line, and an edit generate zero alerts. Use the accepted reply’s immediate parent in the original log. The existing For you tests deliberately count both Bea and Cal under Ari’s activity. That ancestry rule and the unsigned “seen” mark are unsuitable for delivery. [Activity tests](../../tests/loom-for-you.test.mjs) · [Reply and echo handling](../../src/lib/loom/service.mjs)

## Who can opt in?

Start off. Bind the parent’s author at posting time and each destination to the same verified holder and generation. For the pilot, accept replies only from a different authenticated principal. A matching name or address, a public For you URL, and a typed `@handle` confer no ownership. Skip historical unsigned parents. On transfer or sign-out, stop the affected subscriptions and discard pending deliveries. [Identity design](identity.md)

- **Web push.** Explain what this browser will receive before asking for permission on a tap. Offer **Keep off** on a shared phone. Permission belongs to the browser and subscription consent belongs to the holder. Show the device and an **Off** control. Denied or unsupported? Keep reading For you.
- **Webhook.** The signed-in holder chooses a destination separately and proves control through a challenge. Require the public HTTPS destination checks and signed deliveries proposed for inbox wakes. A receiver gets an opaque event ID and can resolve it through the holder’s authorized view. [Webhook prerequisites](wake-on-events.md)

## What happens after a reply?

Commit the eligible reply and a pending event together. Start at opt-in with future replies. Deduplicate by original log, reply ID and subscription. Retry temporary failures with backoff under the same event ID. The webhook receiver deduplicates that ID. Use it as the push notification tag to collapse a retry. A push receipt cannot prove someone saw it. A crash after sending may cause a repeat. On expiry or exhausted retries, show the missed delivery and keep the reply available in Loom. Disable and erase revoked endpoints, including push responses 404/410. [Current append path](../../src/lib/loom/service.mjs)

Before each send and on open, recheck consent, holder generation, and visibility of both posts. Drop queued alerts after withdrawal, moderation or loss of access. A delivered lock-screen alert can outlive deletion. Show only “New reply on Loom,” without author, room, snippet or address. Opening it resolves the original reply after authentication or shows “Reply unavailable.” [Folded thread view](../../src/lib/loom/fold.mjs)

## One reader, 390 pixels

Walk through these proposed screens on paper with one tester. Use a tally of simulated alerts and keep browser permissions and delivery off.

1. In **For you → Reply alerts**, Ari previews “New reply on Loom” and chooses **This phone** or **Keep off**.
2. After opt-in, Bea’s direct reply adds one to the tally. Tapping it opens Bea’s reply beneath Ari’s original post. Replay its event ID, mention Ari, then reply to Bea. The tally stays at one.
3. Choose **Off** for this phone. Replay the event and add a new direct reply. Expect zero new alerts.

**Pilot gate.** Keep both channels off until holder binding, durable events, destination revocation and the visibility checks pass in fixtures. Then ask one consenting tester per day whether the ping reached the right device and opened the expected reply. Enabling either channel needs a separate implementation review.
