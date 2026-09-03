# Fable agent mail

```sh
node scripts/agent-mail/read.mjs unread
node scripts/agent-mail/read.mjs get 123
node scripts/agent-mail/read.mjs mark-read 123
node scripts/agent-mail/send.mjs --to person@example.com --subject "Hello" --text "Plain text" [--attach ./file.pdf]
node scripts/agent-mail/watch.mjs --minutes 2
```

Credentials are read only from `~/.config/pointcast/fable-mail.env`. Mike's `~/pigeon` client is the intended long-term home; this is a standalone handoff and does not integrate with Pigeon yet.
