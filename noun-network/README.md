# How to Noun your WiFi

A noun-node keeps a local copy of the Loom, shares lines with nearby nodes, and serves Nouns TV when the TV files are installed. The local network works with the internet off. [The Noun Network v0 thread](https://pointcast.xyz/loom?to=%23noun-network)

1. **Make a guest network.** Create a guest Wi-Fi network named `nouns-yourplace`, such as `nouns-elsegundo-main`. Use the guest side for the node and screens. Guest devices need to be able to reach one another for discovery and syncing.
2. **Start a node.** Join the guest Wi-Fi from a computer you can leave on. Run the commands below. The node advertises `_noun._tcp` using Bonjour/mDNS.
3. **Put a screen on it.** With Nouns TV installed in `noun-network/tv/`, open the node's guest-network address and port in a TV browser or cast it. The planned native Apple TV client uses Bonjour discovery. The four TV modes in the Loom plan are Gallery, Note of the Day, Town Map, and Local Board.
4. **Name your place.** Choose a public `geo:lat,lon` address rounded to three decimal places. Use it as the `address` when you post to the room for your shop, porch, or counter.
5. **Link a neighbor.** Put both nodes on the same reachable guest LAN. They discover each other and pull missing lines. The Loom plan calls for OpenWrt with 802.11s or batman-adv for multi-hop Wi-Fi. Where mDNS cannot cross a link, set `NOUN_PEERS` to reachable peer URLs.
6. **Bridge if you want.** On an online node, set `NOUN_BRIDGE` to a JSON array of public Loom addresses. The bridge reads PointCast into the local mesh. Local posting and syncing continue while PointCast is unreachable.

## House rules

- Guest network only. Keep the node off your private network.
- Check your ISP's terms before sharing a connection beyond your household. The mesh can run offline.
- Keep personal details off the board. Lines are public to people who can reach the node or its peers.
- Use whole Nouns and CC0 art.
- Art notes have no cash value.

## Run noun-node

Requires Node.js 20.10 or newer on the 20.x line, or a newer major release.

```sh
cd noun-network/node
npm ci
npm start
npm test
```

The server listens on port 8080 by default. Run it on a guest-only host or use network controls to keep HTTP and mDNS on the guest side. Set `NOUN_HOST` to a guest IPv4 address to bind HTTP there, `NOUN_PORT` for a different port, or `NOUN_MDNS=0` to turn discovery off. `NOUN_PEERS` takes comma-separated HTTP URLs. For example, `NOUN_BRIDGE='["#noun-network","geo:33.918,-118.416"]' npm start` enables a read-only bridge.

By default the node stores its private device key and append-only `lines.jsonl` in `.noun-node/` relative to the working directory. Override it with `NOUN_DATA_DIR`. Use a separate directory per running node and keep it outside the TV folder.

## HTTP and wire format

| Request | Response |
| --- | --- |
| `GET /have` | JSON object mapping each address to its highest local sequence number |
| `GET /lines?to=%23local&since=0` | JSON array of lines after the given local sequence number, in ascending order |
| `POST /lines` | Send JSON with `address`, `sender`, `body`, and optional `image` for the node to sign, or send a signed line to import it. Returns the stored line with status 201, or 200 for a duplicate. Invalid signatures return 400. |

A line contains `address`, `sender`, `time`, `body`, `image` (a string reference or null), `sig`, and `seq`. The device signs the UTF-8 JSON array `["noun-line/v1", address, sender, time, body, image, nonce]` with Ed25519. The signature string joins the base64url SPKI public key, nonce, and base64url signature with dots. The signature establishes the device that signed the content. Anyone who can reach the node can submit a line with a display name of their choosing.

Each node assigns its own increasing `seq` per address as it appends. Peers track each remote cursor separately and deduplicate by `sig`. Local sequence numbers and ordering can differ even when nodes have converged on the same lines. The bridge signs imported Loom append operations with the bridge device key and labels the sender with `Loom:`. Bridge copies retain the append text and image reference. Edits and withdrawals on the upstream Loom do not change copies in the local append-only log. Multiple bridging devices can import separate signed copies of the same upstream line.

Code is [MIT-licensed](node/LICENSE).
