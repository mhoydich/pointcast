# PointCast Daily email scheduler

This is the daily update lane for PointCast. It is intentionally two pieces:

- `/email-scheduler` and `/email-scheduler.json` on the main site define the public contract.
- `workers/pointcast-daily-email` is the scheduled sender.

The worker defaults to dry-run. It only sends live email when a provider key, send-mode flag, and opt-in audience are all present.

## Daily cadence

Cron: `30 16 * * *`

That is 16:30 UTC daily. On April 30, 2026, it is 9:30 AM in `America/Los_Angeles`. Cloudflare cron runs in UTC, so update the cron if a fixed Pacific wall-clock send matters after daylight saving time changes.

## Live setup

1. Verify `pointcast.xyz` in Resend using the outbound setup in `docs/setup/email-pointcast.md`.
2. Deploy the worker:

   ```bash
   cd workers/pointcast-daily-email
   npx wrangler deploy
   ```

3. Bind secrets:

   ```bash
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put DAILY_EMAIL_OPS_TOKEN
   ```

4. Add an opt-in audience:

   ```toml
   DAILY_EMAIL_TO = "person@example.com"
   ```

   Or bind `DAILY_EMAIL_AUDIENCE_KV` and write `sub:<email>` records:

   ```json
   { "email": "person@example.com", "active": true, "source": "manual-opt-in" }
   ```

5. Switch live mode only after `/preview` and `/dry-run` look right:

   ```toml
   DAILY_EMAIL_SEND_MODE = "live"
   ```

## Preview checks

```bash
curl https://pointcast.xyz/email-scheduler.json
curl https://pointcast-daily-email.<account>.workers.dev/health
curl https://pointcast-daily-email.<account>.workers.dev/preview
curl https://pointcast-daily-email.<account>.workers.dev/dry-run \
  -H "Authorization: Bearer $DAILY_EMAIL_OPS_TOKEN"
```

## Send contract

- Provider: Resend.
- From: `hello@pointcast.xyz` by default.
- Source surfaces: `/blocks.json`, `/sprints.json`, `/nouns-nation-battler.json`, `/nouns-nation.json`.
- Audience: explicit opt-in only.
- No provider or no live flag means no send.

## Test send

`/send-test` requires `DAILY_EMAIL_OPS_TOKEN`:

```bash
curl -X POST "https://pointcast-daily-email.<account>.workers.dev/send-test?to=person@example.com" \
  -H "Authorization: Bearer $DAILY_EMAIL_OPS_TOKEN"
```

In dry-run mode, this returns the provider as `dry-run` and sends nothing.
