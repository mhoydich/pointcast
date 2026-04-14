---
title: "PointCast.xyz"
description: "A warm editorial publishing platform built with Astro, Tailwind, and Claude — inspired by Seeing the Future's dispatch design language."
date: 2026-04-12
tags: [web, design, nouns, astro, editorial]
stack: [Astro, Tailwind CSS, Cloudflare Pages, Claude]
link: "https://pointcast.xyz"
---

## The build

PointCast.xyz was designed and coded entirely through human-AI collaboration. Mike set the creative direction — the editorial warmth, the Nouns identity, the dispatch format. Claude handled the implementation across every file.

The site went from zero to deployed in a single session. No Figma. No wireframes. The design emerged through iteration.

---

## Design language

The visual system draws from two sources:

**The Seeing the Future dispatch** — warm paper tones, serif headlines, progressive disclosure, numbered observation cards. The kind of reading experience that respects your attention.

**Nouns DAO culture** — noggles as identity, CC0 ethos, pixel-art accents. Building in public, sharing freely.

The result is editorial warmth with nounish soul. Light mode by default, dark mode that responds to your system preference.

---

## Typography

Three fonts, each with a clear job:

- **Lora** — Serif headlines. Italic titles. The editorial anchor.
- **Outfit** — Body text. Clean, readable, stays out of the way.
- **JetBrains Mono** — Metadata, kickers, timestamps. The data layer.

Londrina Solid appears only for the PointCast brand name — a nod to the Nouns typographic tradition.

---

## Technical stack

**Astro 6** — Content-first architecture. Zero JS by default. Content collections with Zod schemas for type-safe markdown.

**Tailwind CSS 4** — Design tokens via `@theme` block. Light/dark mode through CSS custom properties and `prefers-color-scheme`.

**Cloudflare Pages** — Global edge deployment. Builds in under a second.

**Mobile snap-scroll** — On mobile, articles split at section breaks into swipeable cards with progress dots. Desktop gets long-scroll.

---

## What's next

- RSS feed
- Per-post OG images
- Search
- Commenting system
