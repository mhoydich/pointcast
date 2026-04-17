export async function onRequest(context: EventContext<Env, any, any>) {
  // Serve the domain-level Mini App manifest required by Farcaster clients.
  // This is a static response, so it has no environment dependencies.
  const manifest = {
    accountAssociation: {
      // You must replace these values with a signature generated via Warpcast Developer Tools
      // https://farcaster.xyz/~/developers/mini-apps/manifest
      header: "eyJmaWQiOjE2NTU5NSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDBmMTIzNDU2Nzg5MGFiY2RlZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NTYifQ",
      payload: "eyJkb21haW4iOiJwb2ludGNhc3QueHl6In0",
      signature: "MHgwZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NTY3ODkwYWJjZGVmMTIzNDU2Nzg5MGFiY2RlZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NTY3ODkwYWJjZGVmMTIzNDU2Nzg5MGFiY2RlZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NTY3ODkwYWJjZGVmMWI"
    },
    miniapp: {
      version: "1",
      name: "Noun Drum Rack",
      iconUrl: "https://pointcast.xyz/drum-icon.png", // Must be 1024x1024px PNG, no alpha
      splashImageUrl: "https://pointcast.xyz/drum-splash.png", // Must be 200x200px
      splashBackgroundColor: "#ffffff",
      homeUrl: "https://pointcast.xyz/drum",
      subtitle: "A collaborative drum rack",
      description: "Play drums with the Farcaster community and track your hits in real-time.",
      primaryCategory: "entertainment",
      tags: ["music", "drums", "social", "nouns"],
      ogTitle: "Noun Drum Rack",
      ogDescription: "Play drums with the Farcaster community and track your hits in real-time.",
      ogImageUrl: "https://pointcast.xyz/drum-og.png"
    }
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
