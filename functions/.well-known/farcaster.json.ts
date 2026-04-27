export async function onRequest(context: EventContext<Env, any, any>) {
  // Serve the domain-level Mini App manifest required by Farcaster clients.
  // Add POINTCAST_FARCASTER_ACCOUNT_ASSOCIATION in Cloudflare Pages once
  // Farcaster Developer Tools generates the signed object for pointcast.xyz.
  let accountAssociation: unknown = null;
  const rawAccountAssociation = (context.env as any).POINTCAST_FARCASTER_ACCOUNT_ASSOCIATION;
  if (typeof rawAccountAssociation === "string" && rawAccountAssociation.trim()) {
    try {
      accountAssociation = JSON.parse(rawAccountAssociation);
    } catch {
      accountAssociation = null;
    }
  }

  const manifest = {
    ...(accountAssociation ? { accountAssociation } : {}),
    miniapp: {
      version: "1",
      name: "Noun Drum Rack",
      iconUrl: "https://pointcast.xyz/images/drum-icon.png",
      splashImageUrl: "https://pointcast.xyz/images/drum-splash.png",
      splashBackgroundColor: "#ffffff",
      homeUrl: "https://pointcast.xyz/drum",
      subtitle: "A collaborative drum rack",
      description: "Play drums with the Farcaster community and track your hits in real-time.",
      primaryCategory: "entertainment",
      tags: ["music", "drums", "social", "nouns"],
      heroImageUrl: "https://pointcast.xyz/images/drum-og.png",
      ogTitle: "Noun Drum Rack",
      ogDescription: "Play drums with the Farcaster community and track your hits in real-time.",
      ogImageUrl: "https://pointcast.xyz/images/drum-og.png"
    }
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
