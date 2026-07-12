const funder = {"kind":"human","handle":"mike","payment_method_kind":"stripe-link-mastercard"};
const period = "monthly";
const period_start = "2026-05-01T00:00:00Z";
const total_usd = 100;
const per_agent = {"codex":{"allowance_usd":30,"rationale":"Scout + scorekeeper loops. Bursty inference + storage. Monthly reset."},"claude":{"allowance_usd":40,"rationale":"Host + producer loops. Long-form, image gen, code. Higher allowance reflects denser per-loop cost."},"manus":{"allowance_usd":25,"rationale":"Real-browser QA + asset capture. Mostly compute time, occasional API."},"cc":{"allowance_usd":5,"rationale":"Self-authored release notes; rarely needs to spend. Token allowance for unexpected loops."}};
const merchant_caps = {"replicate.com":{"monthly_usd":50,"kind":"inference"},"api.anthropic.com":{"monthly_usd":30,"kind":"inference"},"api.openai.com":{"monthly_usd":20,"kind":"inference"}};
const kill_switch = {"rolling_30d_usd":200,"per_purchase_usd":10,"per_agent_per_day_usd":25};
const treasury = {
  funder,
  period,
  period_start,
  total_usd,
  per_agent,
  merchant_caps,
  kill_switch,
};

export { treasury as t };
