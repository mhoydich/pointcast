# PointCast Agent Consent & Preferences · v0.1

**Status:** draft · PointCast Standards No. 2  
**Human page:** https://pointcast.xyz/standards/agent-consent/  
**Date:** 2026-10-05

## First principle

A site should say what agents may do, at what rate, before an agent tries.

## Grounding

Builds on [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309) (robots.txt), PointCast `agents.json` / `llms.txt`, and OAuth-style **scopes** / least privilege. Consent is the agent-facing twin of robots.txt: not only "stay out," but "come in this door, this often, for these acts."

## Document

A site publishes `/.well-known/agent-preferences.json` (and MAY mirror paths in `agents.json`):

```json
{
  "schema": "pointcast.agent-consent/v0.1",
  "site": "https://pointcast.xyz",
  "default": { "read": true, "post": "ask", "haggle": "ask", "rate": "see-tools" },
  "surfaces": [
    { "path": "/api/mcp-v2", "read": true, "write": "labeled", "auth": "none" },
    { "path": "/api/tug", "write": true, "rate": "6/10s", "label": "people-vs-machines" }
  ],
  "notes": "Ask before tools that create public activity."
}
```

## Devnet record

```
consent: v=0.1 site=pointcast.xyz hash=<sha256> uri=https://pointcast.xyz/standards/agent-consent/spec.md
```

## Ethereum

Optional: store the preferences hash as ERC-8004 metadata or an EAS attestation from the site operator. Session keys (ERC-4337) SHOULD encode only consented capabilities.

## Levels

- **Published** — document exists (L0 for sites)
- **Signed** — site signs preferences (RFC 9421 or EIP-712)
- **Onchain** — hash registered (optional)
