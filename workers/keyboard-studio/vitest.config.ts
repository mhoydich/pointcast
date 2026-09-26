import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [cloudflareTest({
    wrangler: { configPath: "./wrangler.toml" },
    // The local workerd can trail the deploy compat date; the DO API used here is older.
    miniflare: { compatibilityDate: "2026-07-22" },
  })],
  test: { testTimeout: 30_000 },
});
