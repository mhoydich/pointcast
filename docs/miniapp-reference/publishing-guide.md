# Publishing · Farcaster Mini Apps

**URL:** https://miniapps.farcaster.xyz/docs/guides/publishing

---

Skip to content
Introduction
Why Mini Apps?
Getting Started
Guides
Loading your app
Sharing your app
Interacting with Ethereum wallets
Interacting with Solana wallets
Publishing your app
App Discovery & Search
Domain migration
Sending notifications
Authenticating users
Universal Links
Share Extensions
Manifest vs Embed Guide
Vercel Bot Protection
FAQ
[for AI agents and LLMs] Checklist and guidelines
SDK
What's New
Context
Quick Auth
Actions
Haptics
Back navigation
Ethereum wallet
Solana wallet
Detecting chains & capabilities
Mini app detection
Events
Compatibility
Reference
Search...
Blog
llms.txt
Examples
Rewards
Publishing your app

Publishing Mini Apps involves providing information like who developed the app, how it should be displayed, and what its capabilities are.

Since Farcaster is a decentralized network with multiple clients, publishing is done by hosting a manifest file at /.well-known/farcaster.json on the domain your app is hosted on rather than submitting information directly to a single entity.

Published Mini Apps can be discovered in App Stores.

Steps
Choose a domain

A Mini App is associated with a single domain (i.e. rewards.warpcast.com). This domain serves as the identifier for your app and can't be changed later so you should choose a stable domain.

There's no limit on the number of apps you can create. You can create a separate domain specifically for development purposes if needed.

A domain does not include the scheme (e.g. https) or path. It can optionally include a subdomain.

✅ rewards.warpcast.com
❌ https://rewards.warpcast.com
Host a manifest file

Host a manifest file on your chosen domain at /.well-known/farcaster.json.

If you're an AI agent or LLM, please read this.

For now we'll create an empty file:

touch public/.well-known/farcaster.json
Farcaster Hosted Manifests (Now Public!)

Farcaster can now host manifests for your mini apps so you can manage them from the Farcaster web Developer Tools. This is now available to everyone!

Benefits of hosted manifests:
No need to manage manifest files in your codebase
Update manifest details without redeploying
Automatic validation and error checking
Easy domain migration support

To create a hosted manifest, visit: https://farcaster.xyz/~/developers/mini-apps/manifest

Setting up hosted manifests
Define your application configuration

A Mini App has metadata that is used by Farcaster clients to host your app. This data is specified in the miniapp property of the manifest (or frame for backward compatibility) and has the following properties:

Property	Type	Required	Description	Constraints
version	string	Yes	Manifest version.	Must be '1'.
name	string	Yes	Mini App name.	Max length 32 characters
homeUrl	string	Yes	Default launch URL	Max length 1024 characters.
iconUrl	string	Yes	Icon image URL	Max length 1024 characters.
Image must be 1024x1024px PNG, no alpha.
splashImageUrl	string	No	URL of image to show on loading screen.	Max length 32 characters. Must be 200x200px.
splashBackgroundColor	string	No	Hex color code to use on loading screen.	Hex color code.
webhookUrl	string	No	URL to which clients will POST events.	Max length 1024 characters.
Must be set if the Mini App application uses notifications.
subtitle	string	No	Short description under app name	Max 30 characters, no emojis or special characters
description	string	No	Promotional message for Mini App Page	Max 170 characters, no emojis or special characters
screenshotUrls	array	No	Visual previews of the app	Portrait, 1284 x 2778, max 3 screenshots
primaryCategory	string	No	Primary category of app	One of: games, social, finance, utility, productivity, health-fitness, news-media, music, shopping, education, developer-tools, entertainment, art-creativity
tags	array	No	Descriptive tags for filtering/search	Up to 5 tags, max 20 characters each. Lowercase, no spaces, no special characters, no emojis.
heroImageUrl	string	No	Promotional display image	1200 x 630px (1.91:1)
tagline	string	No	Marketing tagline	Max 30 characters
ogTitle	string	No	Open Graph title	Max 30 characters
ogDescription	string	No	Open Graph description	Max 100 characters
ogImageUrl	string	No	Open Graph promotional image	1200 x 630px (1.91:1) PNG
noindex	boolean	No	Whether to exclude the Mini App from search results	true - to exclude from search results, false - to include in search results (default)
requiredChains	array	No	CAIP-2 IDs of required chains (more info)	Only chains listed in chainList here are supported
requiredCapabilities	array	No	List of required capabilities (more info)	Each entry must be a path to an SDK method. Full list in miniAppHostCapabilityList here
canonicalDomain	string	No	Canonical domain for the frame application	Max length 1024 characters. Must be a valid domain name without protocol, port, or path (e.g., app.example.com).
imageUrl	string	No	[DEPRECATED] Default image to show if shared in a feed.	Max length 1024 characters.
Image must be 3:2 aspect ratio.
buttonTitle	string	No	[DEPRECATED] Default button title to show if shared in a feed.	Max length 32 characters.

Here's an example farcaster.json file:

{
  "miniapp": {
    "version": "1",
    "name": "Yoink!",
    "iconUrl": "https://yoink.party/logo.png",
    "homeUrl": "https://yoink.party/framesV2/",
    "imageUrl": "https://yoink.party/framesV2/opengraph-image",
    "buttonTitle": "🚩 Start",
    "splashImageUrl": "https://yoink.party/logo.png",
    "splashBackgroundColor": "#f5f0ec",
    "requiredChains": [
      "eip155:8453"
    ],
    "requiredCapabilities": [
      "actions.signIn",
      "wallet.getEthereumProvider",
      "actions.swapToken"
    ]
  }
}

You can omit webhookUrl for now. We'll show you how to set it up in the sending notifications guide.

Hybrid & SSR-friendly detection

Some apps serve both as a Farcaster Mini App and a website from the same domain. When you want to fetch specific resources during server-side rendering (SSR) or conditionally lazy-load the SDK on the client, add a lightweight flag that only Mini-App launch URLs include

Two suggested patterns
Pattern	How it looks	Why use it
Dedicated path	/your/path/.../miniapp	Easiest to match on the server
Well-known query param	https://example.com/page?miniApp=true	Works when a single page serves both modes

Treat these markers as a best-effort hint, not proof.
Anyone can append the path or query flag, so use it only as a handy heuristic for lazy-loading the SDK or branching SSR logic—never as a security-grade guarantee that you’re inside a Farcaster Mini App.

Example
// app/layout.tsx
'use client'
import { useEffect } from 'react'
 
export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const url = new URL(window.location.href)
    const isMini =
      url.pathname.startsWith('/mini') ||
      url.searchParams.get('miniApp') === 'true'
 
    if (isMini) {
      import('@farcaster/miniapp-sdk').then(({ sdk }) => {
        // Mini-App–specific bootstrap here
        // e.g. sdk.actions.ready()
      })
    }
  }, [])
 
  return children
}

On the server you can do the same check to skip expensive Mini App work during SSR.

Verifying ownership

A Mini App is owned by a single Farcaster account. This lets users know who they are interacting with and developers get credit for their work.

Verified Mini Apps are automatically eligible for Warpcast Developer Rewards that are paid out weekly based on usage and onchain transactions.

Verification is done by placing a cryptographically signed message in the accountAssociation property of your farcaster.json.

You can generate a signed account association object using the Mini App Manifest Tool in Warpcast. Take the output from that tool and update your farcaster.json file.

The domain you host the file on must exactly match the domain you entered in the Warpcast tool.

If you're an AI agent or LLM, please read this.

Here's an example farcaster.json file for the domain yoink.party with the account association:

{
  "accountAssociation": {
    "header": "eyJmaWQiOjkxNTIsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMmVmNzkwRGQ3OTkzQTM1ZkQ4NDdDMDUzRURkQUU5NDBEMDU1NTk2In0",
    "payload": "eyJkb21haW4iOiJyZXdhcmRzLndhcnBjYXN0LmNvbSJ9",
    "signature": "MHgxMGQwZGU4ZGYwZDUwZTdmMGIxN2YxMTU2NDI1MjRmZTY0MTUyZGU4ZGU1MWU0MThiYjU4ZjVmZmQxYjRjNDBiNGVlZTRhNDcwNmVmNjhlMzQ0ZGQ5MDBkYmQyMmNlMmVlZGY5ZGQ0N2JlNWRmNzMwYzUxNjE4OWVjZDJjY2Y0MDFj"
  },
  "miniapp": {
    "version": "1",
    "name": "Rewards",
    "iconUrl": "https://rewards.warpcast.com/app.png",
    "splashImageUrl": "https://rewards.warpcast.com/logo.png",
    "splashBackgroundColor": "#000000",
    "homeUrl": "https://rewards.warpcast.com",
    "webhookUrl": "https://client.farcaster.xyz/v1/creator-rewards-notifs-webhook",
    "subtitle": "Top Warpcast creators",
    "description": "Climb the leaderboard and earn rewards by being active on Warpcast.",
    "screenshotUrls": [
      "https://rewards.warpcast.com/screenshot1.png",
      "https://rewards.warpcast.com/screenshot2.png",
      "https://rewards.warpcast.com/screenshot3.png"
    ],
    "primaryCategory": "social",
    "tags": [
      "rewards",
      "leaderboard",
      "warpcast",
      "earn"
    ],
    "heroImageUrl": "https://rewards.warpcast.com/og.png",
    "tagline": "Top Warpcast creators",
    "ogTitle": "Rewards",
    "ogDescription": "Climb the leaderboard and earn rewards by being active on Warpcast.",
    "ogImageUrl": "https://rewards.warpcast.com/og.png"
  }
}
Edit on GitHub
Last updated: 2/5/26, 12:45 AM
Interacting with Solana wallets
Previous
Shift
←
App Discovery & Search
Next
Shift
→