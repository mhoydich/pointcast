// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Minimal PointCast node config. Set `site` to your deployed URL so
// federation pointers (home, nodeJsonUrl, etc.) resolve correctly.
export default defineConfig({
  site: 'https://your-node.example',
  integrations: [sitemap()],
});
