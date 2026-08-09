/* eslint-disable */
// Mirrors what `wrangler types --include-runtime=false` emits for this Worker.
// Regenerate with `npm run types` in this directory after changing bindings.
interface __BaseEnv_Env {
	BLOOM_ROOM: DurableObjectNamespace<import("./src/index").BloomPartyRoom>;
}
declare namespace Cloudflare {
	interface GlobalProps {
		mainModule: typeof import("./src/index");
		durableNamespaces: "BloomPartyRoom";
	}
	interface Env extends __BaseEnv_Env {}
}
interface Env extends __BaseEnv_Env {}
