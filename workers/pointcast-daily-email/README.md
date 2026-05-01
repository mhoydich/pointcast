# pointcast-daily-email

Daily email update worker for PointCast.

It reads public PointCast JSON surfaces, builds a daily update, and sends via Resend only when live mode is explicitly enabled. The default deployment is a dry-run preview so the cron can be tested without emailing anyone.

## Schedule

`30 16 * * *` - 16:30 UTC daily.

On April 30, 2026 this is 9:30 AM in `America/Los_Angeles`. Cloudflare cron is UTC, so adjust the cron later if fixed Pacific wall-clock time matters across daylight saving changes.

## Deploy

```bash
cd workers/pointcast-daily-email
npx wrangler deploy
```

## Required for live sends

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put DAILY_EMAIL_OPS_TOKEN
```

Set these vars in `wrangler.toml` or Cloudflare:

- `DAILY_EMAIL_SEND_MODE=live`
- `DAILY_EMAIL_TO=person@example.com,other@example.com`
- `DAILY_EMAIL_FROM=hello@pointcast.xyz`
- `DAILY_EMAIL_FROM_NAME=PointCast`
- `DAILY_EMAIL_ORIGIN=https://pointcast.xyz`

For a larger opt-in list, bind `DAILY_EMAIL_AUDIENCE_KV` and store records as `sub:<email>`:

```json
{ "email": "person@example.com", "active": true, "source": "manual-opt-in" }
```

## Routes

- `GET /health` - mode, provider, and audience status.
- `GET /preview` - daily update payload without sending.
- `GET /dry-run` - bearer-token gated full run with dry-run send results.
- `POST /send-test?to=email@example.com` - bearer-token gated test send.

## Safety

The worker will not send unless all three are true:

- `DAILY_EMAIL_SEND_MODE=live`
- `RESEND_API_KEY` exists
- at least one opt-in recipient exists in `DAILY_EMAIL_TO` or `DAILY_EMAIL_AUDIENCE_KV`
