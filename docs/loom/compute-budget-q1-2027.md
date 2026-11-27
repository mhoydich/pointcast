# A solo studio’s compute budget for Q1 2027

**Recommendation.** Start January with $200 a month. Try Claude Max and ChatGPT Pro 100 with Codex on real studio jobs. Assign each job from the desks’ accepted work and review results. At a $500 ceiling this leaves $300 for measured bottlenecks. At a $1,000 ceiling, leave $800 uncommitted until a week’s receipts show which limit delayed approved work. Dollars per accepted job and hours lost waiting are the missing numbers.

**Documented US monthly prices, November 27, 2026.** Claude Max is $100 and Ultra is $200. ChatGPT Pro with Codex is $100, $200 or $500 depending on allowance and features. For a job that specifically needs Gemini in Google’s tools, AI Pro is $19.99. The X Subscription bundles Grok and Cursor. Premium is $30, Super is $100 and Ultra is $200. Trial either against a named job before adding another recurring bill. [Claude](https://claude.com/pricing) · [ChatGPT](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers) · [Gemini](https://gemini.google/subscriptions/?currencyCode=USD) · [Grok](https://x.ai/news/x-subscription)

**What the GPU markets price.** Gamma updated these nine Yes quotes at 08:43 UTC on November 27. The table gives the hourly rental threshold whose bid/ask midpoint was closest to 50¢ for each chip and month. Each market settles on the monthly average of the daily Ornn index. The full 14:27 UTC recheck picked the same thresholds. [Morning quotes and afternoon recheck](./compute-budget-quote-capture.txt)

| GPU | Jan | Feb | Mar |
| --- | ---: | ---: | ---: |
| H100 | [$3.00](https://polymarket.com/event/h100-average-rental-price-in-january-2027) | [$3.00](https://polymarket.com/event/h100-average-rental-price-in-february-2027) | [$3.00](https://polymarket.com/event/h100-average-rental-price-in-march-2027) |
| B200 | [$9.50](https://polymarket.com/event/b200-average-rental-price-in-january-2027) | [$9.00](https://polymarket.com/event/b200-average-rental-price-in-february-2027) | [$9.00](https://polymarket.com/event/b200-average-rental-price-in-march-2027) |
| B300 | [$11.50](https://polymarket.com/event/b300-average-rental-price-in-january-2027) | [$11.00](https://polymarket.com/event/b300-average-rental-price-in-february-2027) | [$11.00](https://polymarket.com/event/b300-average-rental-price-in-march-2027) |

**Illustrative rental.** Runpod Secure Cloud listed one H100 SXM at $4.39/hour, B200 at $8.99 and B300 at $10.49. A 20-hour H100 batch would cost $87.80 before storage or tax. Rent for a specific open-model job with a measured runtime. A coding subscription supplies hosted tools with usage limits and no reserved chip. [Runpod rates](https://www.runpod.io/pricing)

**Three rules for the efficiency desk**

1. Before a run, read the latest claim and search open PRs. The efficiency desk reported that a second session repeated a 3D-pages job it estimated at 149,000 tokens. The post gave no usage log. [Duplicate-work receipt](https://pointcast.xyz/loom/classic?to=%23efficiency#m_256m1n5v3g)
2. On a returning job, pass the last message ID, commit and failing check. Read only what changed. [Room-read lesson](https://pointcast.xyz/loom/classic?to=%23efficiency#m_6s3y3z1s5u)
3. After three unsuccessful attempts, stop and record the blocker, measured usage and next owner. Reopen when new evidence changes the job. [Desk stop rule](https://pointcast.xyz/loom/classic?to=%23best-practices#m_2l051w4v4d)
