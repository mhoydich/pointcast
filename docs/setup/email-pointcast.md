# Email for pointcast.xyz — setup playbook

**Audience:** Mike, executing dashboard-side.

**Context:** cc doesn't have DNS or mailbox creation rights (those are account-level, not repo-level). This doc lays out the exact clicks + commands you run.

---

## What you're setting up

Three receive addresses that forward to Gmail, plus a stub for outbound (cc-sent notes) when you pick a provider.

- `hello@pointcast.xyz` → forwards to `mhoydich@gmail.com`
- `mike@pointcast.xyz` → forwards to `mhoydich@gmail.com`
- `claude@pointcast.xyz` → forwards to `mhoydich@gmail.com`

Wildcard fallback optional: `*@pointcast.xyz` → `mhoydich@gmail.com` (catch-all). Enable for zero-surprise routing.

---

## Step 1 — Cloudflare Email Routing (incoming only, free)

You're already on Cloudflare for pointcast.xyz. Use their Email Routing product.

1. **Open:** https://dash.cloudflare.com → pointcast.xyz → Email → Email Routing
2. **Enable Email Routing.** Cloudflare will auto-add MX + TXT + SPF records. Accept the prompts — these are safe additions, no existing DNS is overwritten. (Confirm in the DNS tab after: you should see `pointcast.xyz MX isaac.mx.cloudflare.net` + two peers, and a `v=spf1 include:_spf.mx.cloudflare.net ~all` TXT record.)
3. **Create routes.** Email Routing → Routing rules → "Create address":
   - Custom address: `hello` → Action: Send to an email → `mhoydich@gmail.com` → Save
   - Repeat for `mike` and `claude`.
4. **Verify Gmail destination.** Cloudflare sends a verification email to `mhoydich@gmail.com` the first time. Click the link, confirm, done.
5. **Optional catch-all.** Routing rules → "Catch-all address" → Send to → `mhoydich@gmail.com`. Catches anything-else@pointcast.xyz.

**Test:** From another account, email `hello@pointcast.xyz` with subject "test 1". Should land in Gmail within 60s. If it bounces, DNS hasn't propagated yet — wait 10 min and retry.

**Cost:** Free. Cloudflare Email Routing is free for any Cloudflare-managed domain.

---

## Step 2 — Outbound sending (paid, your choice of provider)

Cloudflare Email Routing is RECEIVE-ONLY. To SEND from `hello@pointcast.xyz` or `claude@pointcast.xyz` (including the "CC mhoydich@gmail.com the sprint notes" request), you need an SMTP/API provider.

### Recommended providers (pick one)

| Provider | Free tier | Paid starts | Notes |
|----------|-----------|-------------|-------|
| **Resend** | 3000/mo, 100/day | $20/mo, 50k/mo | Cleanest API, best docs for TypeScript/Cloudflare. **Recommend.** |
| **Postmark** | 100/mo | $15/mo, 10k/mo | Enterprise-grade deliverability, high reputation. |
| **Mailgun** | ✗ (30-day trial) | $15/mo, 10k/mo | Traditional SMTP, older but robust. |
| **SendGrid** | 100/day forever | $19.95/mo, 50k/mo | Owned by Twilio, full-featured but heavier. |
| **AWS SES** | 200/day within AWS | $0.10/1000 | Cheapest at scale; more setup friction. |

Resend is the right pick for PointCast. Cloudflare Pages + Resend is one of their most-documented integrations.

### Setup for Resend (example — similar for others)

1. **Create account:** https://resend.com → sign up with `mhoydich@gmail.com`.
2. **Add domain:** Resend → Domains → Add → `pointcast.xyz`. Resend gives you 3 DNS records (1 MX for their sender, 1 TXT SPF, 1 TXT DKIM). Add these to Cloudflare DNS (pointcast.xyz → DNS). Wait for verification (usually <5 min).
3. **API key:** Resend → API Keys → Create → scope: "Sending access". Copy the key, store it as a Cloudflare Pages secret:
   ```
   Cloudflare → pointcast → Settings → Environment variables → Add variable
     Name: RESEND_API_KEY
     Value: re_XXXXXXXXXXXX
     Environment: Production
     Encrypt: ✓
   ```
4. **Verified sender address:** Resend uses `delivered-at@yourdomain` or any `*@pointcast.xyz`. Plan to send from `claude@pointcast.xyz` (cc's notes) and `hello@pointcast.xyz` (bot-to-human).

---

## Step 3 — cc sends sprint notes via code

Once RESEND_API_KEY is bound, cc can wire the outbound path. Proposed shape:

- `functions/api/send-note.ts` — Cloudflare Function that POSTs to Resend with a retro's markdown body rendered as HTML.
- Hook: a GitHub Action on push to `main` in `docs/sprints/2026-04-*.md` calls this function.
- Payload:
  ```json
  {
    "from": "claude@pointcast.xyz",
    "to": "mhoydich@gmail.com",
    "cc": "mhoydich@gmail.com",
    "subject": "[sprint] 15:30 tv-presence-constellation",
    "html": "<rendered markdown>"
  }
  ```
- Or cc runs a local CLI script post-deploy that reads the latest retro and emails it. Simpler; less reliable.

**cc ships this code AFTER Step 2 is done and `RESEND_API_KEY` is bound.** Drop a ping in chat once setup lands and cc picks up the coding.

---

## Step 4 — Verify end-to-end

### Inbound test
```
$ echo "test body" | mail -s "inbound test" hello@pointcast.xyz
# wait 60s → check Gmail
```

### Outbound test (post-Step 2)
```
$ curl -X POST https://pointcast.xyz/api/send-note \
    -H 'Content-Type: application/json' \
    -d '{"to":"mhoydich@gmail.com","subject":"outbound test","body":"hello from pointcast"}'
# → Gmail inbox shows email from claude@pointcast.xyz
```

---

## What cc can do before email infrastructure exists

- Write retros to `docs/sprints/` (already happening).
- Write the stub `functions/api/send-note.ts` with the Resend integration, so it's ready the moment `RESEND_API_KEY` is bound. (Can ship next tick if you want.)
- Add a `mailto:hello@pointcast.xyz` link in `/for-agents` and `/about` so visitors can contact the site once routing is active.

## What cc cannot do

- Create DNS records (Cloudflare account auth needed).
- Create email addresses (dashboard UI or API with your credentials).
- Verify Gmail as a destination (confirmation link goes to your inbox).
- Add secrets to Cloudflare Pages (account-level access needed).

These are your ~10-minute windows.

---

Filed by cc, 2026-04-19 18:00 PT, sprint `email-setup-playbook`.
