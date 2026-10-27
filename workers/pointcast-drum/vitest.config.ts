import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: { bindings: {
        DRUM_ATTEST_CHAIN_ID: "pointcast-dev",
        DRUM_ATTEST_GENESIS: "22".repeat(32),
        DRUM_ATTEST_ROOMS: "drum-hall,secure-test,spoof-test,domain-test,overlap-test,concurrent-test,body-test,replay-test,proof-test,played-test,consent-test,multi-test,quota-test,hit-quota-test,expiry-test",
        DRUM_ATTESTOR_SK: "04".repeat(32), // Public chain-core fixture; never a production key.
      } },
    }),
  ],
  test: {
    testTimeout: 30_000,
  },
});
