import { registerHooks } from 'node:module';
import { timingSafeEqual } from 'node:crypto';
registerHooks({ resolve(specifier, context, next) { if (specifier === 'cloudflare:workers') return { url: new URL('./worker-base.mjs', import.meta.url).href, shortCircuit: true }; return next(specifier, context); } });
Object.defineProperty(crypto.subtle, 'timingSafeEqual', { value: (a, b) => timingSafeEqual(new Uint8Array(a), new Uint8Array(b)) });
