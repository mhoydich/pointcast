---
title: "NYC Mesh — The People's Internet"
description: "How a volunteer-run mesh network became the blueprint for community-owned infrastructure. 2,000+ nodes, zero corporate gatekeepers."
date: 2026-04-14
type: article
tags: [infrastructure, community, mesh, internet, web3, nyc]
---

## The premise

What if your internet wasn't owned by anyone? Not Verizon, not Spectrum, not some Valley-funded "disruptor" with a Series B and a burn rate. What if your neighborhood just... built it?

That's NYC Mesh. A volunteer-run, community-owned wireless network spanning all five boroughs of New York City. Over 2,000 active nodes. No paid employees. No monthly bills — just a suggested donation. No data selling, no content blocking, no throttling.

It started in 2014 when Brian Hall, a burned-out programmer, wanted to do something that mattered. The initial rallying cry was simple: everyone hated Time Warner Cable.

---

## How it actually works

The architecture is elegant in its simplicity.

**Supernodes** sit in data centers connected directly to internet exchange points — the raw backbone of the internet, no ISP middleman. These are BGP-capable routers (Mikrotik CCR series, Linux servers) that peer with the global internet directly.

**Hubs** are high points — rooftops, tall buildings — equipped with Ubiquiti sector antennas (airMAX protocol) that broadcast to surrounding nodes. Each hub serves dozens of nearby connections.

**Nodes** are individual members. A volunteer crew comes to your rooftop, mounts a directional antenna (typically a Ubiquiti LiteBeam or NanoStation), points it at the nearest hub, and you're on the mesh. Your node connects to other nodes, which connect to hubs, which connect to supernodes, which connect to the internet.

No single point of failure. If one path goes down, traffic routes through another. That's the mesh.

---

## The numbers

Some things worth noting:

- **2,000+** active member nodes across NYC
- **1,500+** new node requests per year since 2018
- **30** core volunteers maintain the entire network
- **$0** monthly fee (donations encouraged)
- **10 Gbps** fiber connections available for building-wide installs
- **3** supernodes operational, each peering at major IXPs

The equipment cost for a typical install runs $100–$300. Compare that to a year of Spectrum.

---

## Why it matters

NYC Mesh isn't just a cheaper way to get WiFi. It's a proof of concept for a different model of infrastructure — one that's:

**Community-owned.** No shareholders extracting value. No private equity rolling up local ISPs. The network belongs to the people who use it.

**Privacy-respecting.** No deep packet inspection. No behavioral advertising. No selling your browsing history to data brokers. The network is neutral by design.

**Resilient.** When Hurricane Sandy knocked out commercial internet across lower Manhattan, mesh networks kept working. When your ISP has an outage, your mesh neighbors keep you connected.

**Open.** The code is on GitHub. The docs are public. The hardware is off-the-shelf. Anyone can fork NYC Mesh's playbook and build one in their city.

---

## The design lesson

There's something deeply interesting about NYC Mesh from a systems design perspective. It's infrastructure that behaves like a community.

Traditional ISPs are hierarchical — traffic flows up through your provider, through their provider, to the backbone, and back down. It's a tree. NYC Mesh is a graph. Every node strengthens the network. Every new member makes everyone else's connection more resilient.

This is the same principle behind the most interesting things being built right now: mesh protocols, peer-to-peer systems, community-governed DAOs, open-source projects where contributors are users are maintainers. The pattern is always the same — distributed ownership creates antifragile systems.

NYC Mesh proved you don't need a billion-dollar ISP to connect a city. You need antennas, rooftops, and neighbors who give a damn.

---

## Links

- [nycmesh.net](https://www.nycmesh.net/) — Main site
- [NYC Mesh Map](https://map.nycmesh.net/) — Live node map
- [NYC Mesh Docs](https://docs.nycmesh.net/) — Technical documentation
- [GitHub](https://github.com/nycmeshnet) — Open source tools
- [NYC Mesh Wiki](https://wiki.nycmesh.net/) — Community knowledge base

---

*The best infrastructure is the kind you barely notice — until you realize no corporation controls it.*
