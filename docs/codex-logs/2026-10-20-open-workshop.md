# Pacific Utility — Open Workshop

User explicitly requested local manufacturing specs, public results, tasks for Grok bots/interns, signups/feedback and public access, continuing authorized PointCast publication.

- Added a complete static workshop with six preliminary product briefs, make/buy BOMs, assembly concepts, validation gates, official-source local candidates and twelve tasks.
- Mirrored manufacturing Markdown, BOM/RFQ CSVs, structured data and agent guide.
- Linked live intake and reviewed results to the now-public Light Works Site. Contact data and pending entries are never mirrored to PointCast.
- Updated Block 0715 and collection navigation. No new channel/schema or backend changes.
- Existing Site migrated to Vinext/D1 with bounded intake, one-use tokens, owner-only review, public consent checks, withdrawal and read-only MCP tools. Local integration/UI and build checks passed there.
- Static PointCast HTML and JSON checked locally. Full Astro build delegated to existing CI because this environment uses GitHub repository tools, not the iMac worktree.
- Latest main CI run 39368095381 built successfully but skipped Cloudflare deployment. Operations requires scripts/deploy.sh on the configured deploy machine; merge is not live. Do not claim the PointCast routes are live until deployment smoke checks pass.
