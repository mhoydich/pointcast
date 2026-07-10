// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://astro.build/config
export default defineConfig({
  site: 'https://pointcast.xyz',
  integrations: [sitemap()],
  vite: {
    plugins: [
      // Taquito + @airgap/beacon-sdk reference Node globals (process, Buffer,
      // etc.) that don't exist in the browser. Polyfill them so the on-chain
      // mint flow runs cleanly without "process is not defined" errors.
      nodePolyfills({
        include: ['buffer', 'process', 'util', 'stream', 'events', 'crypto'],
        globals: { Buffer: true, global: true, process: true },
        protocolImports: false,
      }),
      tailwindcss(),
    ],
    define: {
      // Belt-and-suspenders — some libs check this at module load time.
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  },
});
