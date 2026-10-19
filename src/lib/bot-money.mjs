export const BOT_MONEY_DATE = '2026-10-19';
export const BOT_MONEY_URL = 'https://pointcast.xyz/bot-money/';
export const BOT_MONEY_SOURCES = [
  { id: 'openai', title: 'OpenAI — Powering product discovery in ChatGPT', url: 'https://openai.com/index/powering-product-discovery-in-chatgpt/', date: 'Published March 24, 2026', claim: 'Structured product discovery and merchant-owned checkout; a public catalog does not guarantee shopping inclusion.' },
  { id: 'stripe', title: 'Stripe — Shared payment tokens', url: 'https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens?agent-seller=agent', date: 'Living documentation · checked October 19, 2026', claim: 'Seller, currency, amount and expiry can constrain a token. Additional customer authentication can still be required; eligibility and integration apply.' },
  { id: 'ap2', title: 'AP2 — Agent Payments Protocol specification', url: 'https://ap2-protocol.org/ap2/specification/', date: 'Version 0.2 · checked October 19, 2026', claim: 'Checkout and payment mandates connect authorization with signed receipts. Dispute procedures and agent-to-agent delegation are outside the current specification.' },
  { id: 'delivery', title: 'Shopify — Digital Products', url: 'https://help.shopify.com/en/manual/products/digital-service-product/digital-downloads', date: 'Living documentation · checked October 19, 2026', claim: 'Digital files and links can have automatic or manual fulfillment and access limits. This is a category example, not a PointCast integration.' },
  { id: 'partner-access', title: 'OpenAI — Commerce onboarding', url: 'https://developers.openai.com/commerce/guides/get-started', date: 'Living documentation · checked October 19, 2026', claim: 'Product-feed onboarding requires approved partner access.' },
];

export const BOT_MONEY_PRODUCTS = [
  {
    sku: 'pc-first-offer-kit', version: '1.0.0', name: 'First Offer Kit',
    description: 'A practical starter kit for turning one useful file or skill into a clear offer for people and their assistants.',
    url: `${BOT_MONEY_URL}#first-offer-kit`, status: 'available',
    price: { status: 'free', amount: 0, currency: 'USD' },
    license: { name: 'MIT', url: 'https://pointcast.xyz/downloads/first-offer-kit-1.0.0/LICENSE.txt', summary: 'Personal and commercial adaptation and redistribution with the included copyright and permission notice. No trademark rights.' },
    delivery: { mode: 'direct-download', format: 'application/zip', url: 'https://pointcast.xyz/downloads/first-offer-kit-1.0.0.zip', bytes: 29620, sha256: '97aa5ed7e67e2d6a89b26a5794b2c59605e368d38d9d72a153e37d7234257826', accountRequired: false, paymentRequired: false },
    contents: ['Offer worksheet', 'Three fictional worked examples', 'Editable HTML offer page', 'Three original SVG offer cards', 'PointCast product JSON and agent Markdown templates', 'Cost and time CSV', 'Acceptance checklist', 'Receipt template', 'Spending-permission checklist'],
    limitations: ['Templates require your editing and factual review.', 'Example offers and amounts are fictional; they are not available purchases.', 'No customers, earnings, legal compliance or shopping-platform inclusion are promised.', 'No checkout, payment integration, hosting or support service is included.'],
    humanApproval: ['Review and approve claims, prices, capacity, rights and terms before publishing your own offer.', 'Approve any real purchase or external commitment separately.'],
  },
  {
    sku: 'pc-offer-page-sprint', version: 'proposal-1', name: 'Offer Page Sprint',
    description: 'An inquiry about a bounded design service: one static offer page, three graphics, a matching catalog entry and a fulfillment checklist.',
    url: `${BOT_MONEY_URL}#offer-sprint`, status: 'inquiry-only',
    price: { status: 'not-set', amount: null, currency: 'USD' },
    license: { name: 'To be agreed in a written scope', url: null },
    delivery: { mode: 'not-scheduled', formats: ['HTML', 'SVG', 'JSON', 'Markdown'], url: null, paymentRequired: false },
    inquiry: 'mailto:hello@pointcast.xyz?subject=Offer%20Page%20Sprint%20inquiry',
    limitations: ['No booking or checkout is open.', 'Capacity, final scope, turnaround, revision limit, price and terms require written agreement before work starts.'],
    humanApproval: ['A person must approve the final scope and commercial terms. An inquiry does not create an order.'],
  },
];

export function botMoneyManifest() {
  return {
    schema: 'pointcast.bot-money/v1', version: '1.0.0', updatedAt: BOT_MONEY_DATE,
    title: 'Internet money for the rest of us', url: BOT_MONEY_URL,
    description: 'A free offer kit, a sandbox for earning, buying and gifting, and explicitly speculative 2027/2028 design scenarios.',
    author: 'Codex for PointCast', license: 'Product-specific; see each product license.',
    products: BOT_MONEY_PRODUCTS,
    learningWorkflow: { url: 'https://pointcast.xyz/internship-lab/', manifest: 'https://pointcast.xyz/internship-lab/program.json', status: 'educational-local-workflow', applicationsOpen: false, privateIntakeConfigured: false, automaticDeployment: false, description: 'Draft an interest note, complete onboarding, track a First Offer Kit assignment, prepare evidence, rehearse review and export a handoff. Current-page memory only. Nothing is submitted or deployed.' },
    demo: { url: `${BOT_MONEY_URL}#offer-desk`, status: 'sandbox', currency: 'valueless demo credits', realFunds: false, realWorkPerformed: false, paymentProcessing: false, storage: 'in-memory in this page; reset or reload clears it', receipt: 'downloadable simulation record, never proof of payment', approval: 'Explicit human action for each simulated record; policies are demonstration logic only.' },
    scenarios: [{ year: 2027, status: 'speculative-design-scenario', prediction: false }, { year: 2028, status: 'speculative-design-scenario', prediction: false }],
    agentAccess: { catalog: 'https://pointcast.xyz/bot-money.json', method: 'GET', kit: 'https://pointcast.xyz/agent-kit.md', manifest: 'https://pointcast.xyz/agents.json', existingMcp: 'https://pointcast.xyz/api/mcp-v2', newMcpTools: [], protocolComplianceClaim: false, shoppingPlatformApprovalClaim: false, guidance: 'Inspect the offer and its limits. Download the free kit only at the person’s request. Ask a person before publishing, contacting anyone, spending money or accepting commercial terms.' },
    sources: BOT_MONEY_SOURCES,
  };
}
