# Decision: the PointCast Post Office is a forwarding registry

**Date:** 2026-09-03

**Status:** implemented locally for review; no migration applied, DNS changed, secret set, payment made, deployment made, or PR merged

## Decision

`agents.pointcast.xyz` is an x402-priced forwarding registry, not a mailbox service. A settled 0.01 USDC payment registers one `name@agents.pointcast.xyz` alias for 30 days and points it at either an email address or HTTPS webhook. PointCast stores the registry configuration, owner address, signed-receipt hash, dates, status, and forwarding counter in D1. It never writes inbound senders, recipients, subjects, bodies, HTML, attachments, headers, or raw MIME to D1, KV, R2, logs, or the existing town inbox.

Inbound delivery reuses the signed Resend `email.received` webhook at `/api/mail/inbound`. The Function retrieves the plain-text representation once, holds it only in request memory, and routes every `@agents.pointcast.xyz` recipient before the town-mail persistence path. Email targets receive an attachment-free quoted plain-text message from `post@agents.pointcast.xyz`. Webhook targets receive canonical JSON signed with the published PointCast Ed25519 receipt key. Each forward is attempted at most twice. A successful delivery increments only `aliases.forwarded_count`.

KV stores daily counters and seven-day opaque SHA-256 deduplication keys. Those keys contain no mail content, address, target, or subject. Forwarding fails closed when the rate-limit KV binding is unavailable.

## Registration and renewal

- `POST /api/post-office/alias` accepts `{name, forward:{kind,target}, owner?}`. Names are 3–24 lowercase `a-z`, `0-9`, or hyphen characters; they cannot begin/end with a hyphen or contain `--`.
- Reserved names are `hello`, `kennel`, `wallet`, `fable`, `mike`, `admin`, `postmaster`, and `abuse`.
- The default price is `10000` USDC base units (0.01 USDC). `POST_OFFICE_PRICE_UNITS` may change the quote without changing source.
- `owner`, when supplied, must be the EVM address that signed the x402 payment. When omitted, the Permit2 payer becomes the owner.
- An active alias can be renewed or have its target changed only by the same paying owner. A settled renewal adds 30 days to the current active expiry. Renewing after expiry starts a fresh 30-day term from settlement time.
- Expiry disables delivery immediately. The public record remains visible as `expired`. The prior owner may renew it; another payer may reclaim it after expiry, which resets `since` and the forwarding counter.
- Each create, renewal, or reclamation needs a new settled receipt. `alias_receipts.receipt_hash` is unique so one signed receipt cannot buy two registry actions.
- `GET /api/post-office/alias/:name` and `/post-office.json` expose status, dates, receipt hash, and forwarding count only. Owner and targets are never public.

There is an unavoidable settlement boundary: the facilitator settles before D1 can record the alias. A post-settlement write failure returns the signed receipt and directs the payer to `abuse@pointcast.xyz`; operators can verify the chain receipt before repairing the registry. The endpoint refuses to submit payment when D1, price configuration, receipt signing, body validation, ownership preflight, or current active ownership is invalid.

## Inbound limits and bounces

- Default per-alias cap: 100 delivered messages per UTC day (`POST_OFFICE_ALIAS_DAILY_CAP`).
- Default global cap: 1,000 delivery attempts per UTC day (`POST_OFFICE_GLOBAL_DAILY_CAP`).
- Both use `PC_RATES_KV`; attempts over either limit are acknowledged and not forwarded.
- Unknown and expired recipients get one plain-text bounce per signed Resend event/alias. The bounce names the x402 terms URL, `https://pointcast.xyz/api/post-office/alias`, and states that PointCast retained no message.
- Auto-generated senders such as `mailer-daemon`, `postmaster`, `bounce`, and `no-reply` do not receive a bounce, preventing loops.

## Namecheap DNS for `agents.pointcast.xyz`

DNS remains at Namecheap. Add these records under **Domain List → pointcast.xyz → Manage → Advanced DNS → Host Records**. Resend generates region- and account-specific receiving and DKIM values, so copy its displayed values exactly; do not substitute example selectors or keys.

| Purpose | Namecheap type | Namecheap host | Value / target | Priority | TTL |
| --- | --- | --- | --- | ---: | --- |
| Receive all `@agents.pointcast.xyz` mail | MX Record | `agents` | exact **Receiving MX** target shown by Resend (commonly `inbound-smtp.us-east-1.amazonaws.com.` for a US East domain) | exact Resend value; it must be the lowest numeric priority at this host | Automatic |
| Sending return path for `post@agents.pointcast.xyz` | MX Record | `send.agents` | exact Resend SPF/return-path MX target (commonly `feedback-smtp.us-east-1.amazonses.com.`) | `10` unless Resend displays another value | Automatic |
| SPF for the sending return path | TXT Record | `send.agents` | `v=spf1 include:amazonses.com ~all` if that is the exact value Resend displays | — | Automatic |
| DKIM | TXT or CNAME exactly as Resend displays | for example `resend._domainkey.agents`, or each generated selector as `<selector>._domainkey.agents` | copy the complete DKIM public key or generated `*.dkim.amazonses.com.` target exactly | — | Automatic |

Namecheap host fields are relative to `pointcast.xyz`; do not enter the full domain unless Namecheap explicitly asks for it. A trailing dot on MX/CNAME targets avoids accidental domain suffixing. There must be only one SPF TXT record at `send.agents`; merge mechanisms into one value if that host already has SPF.

The receiving MX belongs only at host `agents`. Do not add it at `@`, delete the apex MX, or change the existing Namecheap apex forwarders for `hello@pointcast.xyz`, `kennel@pointcast.xyz`, `wallet@pointcast.xyz`, or other addresses. MX routing is scoped by host, so this subdomain isolation preserves the apex forwarding rail.

After Resend verifies sending and receiving, configure an `email.received` webhook to `https://pointcast.xyz/api/mail/inbound` and set its Svix secret as the Pages `RESEND_WEBHOOK_SECRET`. Set `RESEND_API_KEY` and the existing `X402_RECEIPT_SK` through secret bindings, never source or `wrangler.toml`. If the Pages `SEND_EMAIL` binding is retained as fallback and has sender restrictions, explicitly allow `post@agents.pointcast.xyz`.

## Abuse policy

Aliases may not be used for impersonation, phishing, credential collection, malware, harassment, unsolicited bulk mail, unlawful content, or evasion of another provider's controls. PointCast may set `status='suspended'` immediately when abuse is credible; suspension stops forwarding without deleting the public registry record. Reports go to `abuse@pointcast.xyz` and should include the public alias and evidence, not private credentials. A suspension does not promise a refund, restoration, message recovery, or preservation because PointCast never stores mail.

## Daily line

The existing scheduled daily Worker reads the append-only alias receipt index for its preceding 24-hour run window and emits `post office · N new · M renewed` in the daily presence payload. Reclamations count as new. This change deliberately does not claim a Block id; Claude Code owns editorial Block assignment.

## Rollout order and non-actions

1. Review and merge the PR.
2. Add and verify the subdomain DNS in Resend and Namecheap without touching apex MX.
3. Apply migration `0007_post_office_aliases.sql` to `pointcast-auth`.
4. Set/confirm Pages secrets and sender permissions.
5. Deploy the daily Worker and then the reviewed Pages build.
6. Verify a 402 quote without payment, then use a separately approved real-payment test; prove the alias state, email and webhook delivery, counter-only persistence, expiry response, and apex-forward continuity.

This PR performs none of those operational actions. It does not send mail, create DNS records, apply D1 migrations, settle payments, deploy, merge, or claim a Block id.
