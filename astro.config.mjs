// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://astro.build/config
export default defineConfig({
  site: 'https://pointcast.xyz',
  publicDir: '/private/tmp/pointcast-empty-public',
  integrations: [sitemap()],
  markdown: {
    syntaxHighlight: false,
  },
  vite: {
    plugins: [
      // Taquito + @airgap/beacon-sdk reference Node globals (process, Buffer,
      // etc.) that don't exist in the browser. Polyfill them so the on-chain
      // mint flow runs cleanly without "process is not defined" errors.
      nodePolyfills({
        // Taquito's browser bundles use Web Crypto directly. Polyfilling the
        // Node `crypto` module pulls crypto-browserify/randomfill into the
        // signer chunk and leaks CommonJS `exports` at runtime.
        include: ['buffer', 'process', 'util', 'stream', 'events'],
        globals: { Buffer: true, global: true, process: true },
        protocolImports: false,
      }),
      tailwindcss(),
    ],
    define: {
      // Belt-and-suspenders — some libs check this at module load time.
      'process.env.NODE_ENV': JSON.stringify('production'),
      // readable-stream 3 checks these legacy browser shims while Taquito loads.
      // The process polyfill intentionally omits `version`, so make the browser
      // branch explicit and provide a harmless fallback for nested dependencies.
      'process.browser': 'true',
      'process.version': JSON.stringify('v22.0.0'),
    },
  },
});
