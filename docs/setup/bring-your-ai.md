# Bring your AI to PointCast

Provider documentation checked September 9, 2026. These are supported client routes, not proof that every provider/account has completed a live PointCast installation.

## Product boundary

The AI stays in the app or agent its owner already uses. That app supplies inference under its own plan and limits; PointCast supplies public content and tools at `https://pointcast.xyz/api/mcp-v2`. PointCast does not consume a transferable AI subscription allowance, accept provider credentials, or claim to install a published plugin.

The `/connectors` page leads with Claude and ChatGPT, keeps a copyable public invitation, and places coding/API/hosted-agent setup in an advanced section. `/agent-kit.md` and `/connectors.json` expose the same setup data. Existing `/api/mcp` clients remain supported.

## Verified provider routes

| Client | Plan/access | Setup and limits | Official source |
| --- | --- | --- | --- |
| Claude | Free permits one custom connector; Pro, Max, Team, Enterprise also support them | Customize → Connectors → Add custom connector. Team/Enterprise owner adds it first. Remote endpoints must be reachable from Anthropic’s cloud. | [Custom connectors](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp) |
| ChatGPT | Plus, Pro, Business, Enterprise, Education developer mode on web | Settings → Security and login → Developer mode; Plugins → +; add MCP URL with No Authentication. Free/Go are not listed as eligible for this custom route; use the public invitation where web access is available. | [Developer mode](https://developers.openai.com/api/docs/guides/developer-mode) |
| Codex | ChatGPT account access under its plan, or separately billed API access | Add the remote MCP server in Codex app settings or with `codex mcp add pointcast-v2 --url https://pointcast.xyz/api/mcp-v2`. Local Codex setup does not install tools into ordinary ChatGPT conversations. | [MCP setup](https://learn.chatgpt.com/docs/extend/mcp), [sign-in methods](https://learn.chatgpt.com/docs/auth), [plans](https://learn.chatgpt.com/docs/pricing) |
| Claude Code | Pro/Max; current Team seats; Enterprise seat/settings apply | Claude-account connectors are available when that subscription login is active. Alternatively, add the HTTP server directly. API-key authentication does not import Claude-account connectors. | [MCP setup](https://code.claude.com/docs/en/mcp), [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan), [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) |
| Gemini Spark — additional candidate | Qualifying Google AI Pro/Ultra Spark access; custom-app restrictions below | Custom MCP apps require US, 18+, personal Google account, English, Keep Activity on. Add on web; use inside Spark tasks on web/mobile. Validate PointCast end to end before promoting alongside the primary cards. | [Custom apps](https://support.google.com/gemini/answer/17209137), [Spark eligibility](https://support.google.com/gemini/answer/17094507?hl=en) |
| Gemini CLI — additional candidate | Free Google-account access, Google AI Pro/Ultra, or separate API access | Uses remote MCP; validate PointCast setup before adding a primary onboarding card. | [Plans](https://geminicli.com/plans/), [MCP](https://geminicli.com/docs/tools/mcp-server/) |

Plan availability is guidance, not an entitlement check. A self-selected provider or plan in PointCast is not verified by an MCP request or visit code.

## Private profile visit confirmation

`/me#ai-companion` lets the profile owner issue a one-time visit code and copy its generated prompt into a configured AI client. The client calls `pointcast_pair`. A successful result records a private visit that the owner can see after returning to the profile.

This is not ongoing authorization, an AI-provider account link, or permission to read private profile data. A copied prompt is not a confirmed visit. Optional gentler instructions belong to the owner’s selected preference and prompt; they do not change an AI’s permanent behavior. Do not publish visit codes or ask for provider tokens.

Anonymous exploration stays available without a profile. Public participation tools still require explicit user intent and appropriate approval. One-time visit confirmation is a separate private action.

## API and hosted agents

An existing agent can keep its model provider API key on its own host and call the same public PointCast MCP/JSON routes. Its host owns the inference billing, schedule, and execution. PointCast does not host that agent or request its provider key through this onboarding.

Provider subscription access does not imply API access. [Anthropic documents separate subscription/API billing](https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-do-i-have-to-pay-separately-to-use-the-claude-api-and-console); [OpenAI documents separate Codex subscription/API authentication and billing](https://learn.chatgpt.com/docs/auth).

Do not implement borrowed subscription-token routing. [Anthropic’s credential policy](https://code.claude.com/docs/en/legal-and-compliance) prohibits third-party apps collecting/intermediating Claude account tokens. It separately permits end users to sign into an unmodified hosted Claude Code binary under documented conditions; that is a distinct hosted-agent product, not this public connector.

## Later integration work

A published PointCast plugin can bundle MCP tools and optional instructions. [OpenAI’s universal plugin directory](https://learn.chatgpt.com/docs/plugins) spans supported ChatGPT/Codex surfaces; [Claude plugins](https://support.claude.com/en/articles/13837440-use-plugins-in-claude) support paid plans. Listing, review, and actual install are separate work.

Persistent private profile access would need explicit scopes, server-enforced authorization, revocation, and compatible OAuth discovery/PKCE. It is not granted by the visit mechanism. See [OpenAI’s MCP authentication contract](https://developers.openai.com/plugins/build/auth). The current Sign in with ChatGPT beta is documented for supported partners, not general PointCast eligibility or subscription inference reuse.

Keep an optional friendly experience in a user-visible skill or prompt. MCP server instructions should describe tool workflows rather than attempt to change the model’s personality, per [OpenAI’s MCP guidance](https://developers.openai.com/plugins/build/mcp-server).

## Verification before calling a client connection working

1. Add the public endpoint in the actual provider client and confirm a real `town_map` or `blocks_recent` call succeeds.
2. Check that cited PointCast pages resolve and that the provider’s tool panel identifies PointCast.
3. For profile confirmation, issue a code as the signed-in owner, use the generated prompt, and verify the confirmed visit in that same profile. A label selected by the owner remains self-reported.
4. Confirm reuse/expiry cannot create another visit and that the public endpoint does not return private profile data.

The existing Firecrawl information remains supplemental retrieval guidance. It is not part of subscription access and was not re-researched for this change.
