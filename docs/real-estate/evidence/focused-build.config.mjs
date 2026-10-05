import pointcast from '/Users/michaelhoydich/pc-real-estate/astro.config.mjs';
export default {
  ...pointcast,
  srcDir: '/tmp/real-estate-empty-src',
  outDir: '/tmp/real-estate-focused-dist',
  cacheDir: '/tmp/real-estate-focused-cache',
  integrations: [...pointcast.integrations, {
    name: 'real-estate-focused-validation',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        for (const [pattern, entry] of [
          ['/real-estate', 'real-estate.astro'],
          ['/real-estate.json', 'real-estate.json.ts'],
          ['/real-estate/methodology.json', 'real-estate/methodology.json.ts'],
          ['/real-estate/openapi.json', 'real-estate/openapi.json.ts'],
        ]) injectRoute({ pattern, entrypoint: `/Users/michaelhoydich/pc-real-estate/src/pages/${entry}`, prerender: true });
      },
      'astro:build:setup': ({ vite }) => {
        vite.build.copyPublicDir = false;
        for (const environment of Object.values(vite.environments ?? {})) {
          if (environment.build) environment.build.copyPublicDir = false;
        }
      },
    },
  }],
};
