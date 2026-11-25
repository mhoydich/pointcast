# Nouns TV for Apple TV

In Xcode create a tvOS App with the SwiftUI lifecycle, targeting tvOS 17 or newer. Replace its generated app and content view with NounsTV.swift and Feed.swift. Add all five image files in ../tv/art to the app target as individual resources in Copy Bundle Resources. Keep their filenames.

Add these target Info.plist entries:

| Key | Type | Value |
| --- | --- | --- |
| NSBonjourServices | Array of strings | _noun._tcp |
| NSLocalNetworkUsageDescription | String | Find your local Noun Network node and read its public board. |
| NSAppTransportSecurity → NSAllowsLocalNetworking | Boolean | YES |
| NounPlace | String | The node's exact geo:lat,lon address |

Run on an Apple TV on the node's WiFi and allow local network access. Use the remote to focus a mode and press Select. The client browses Bonjour, resolves a service to its HTTP port, and polls the node every thirty seconds. Public Loom supplies the configured room when the local feed is unavailable.
