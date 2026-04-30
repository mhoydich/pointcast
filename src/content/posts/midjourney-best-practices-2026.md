---
title: "Midjourney best practices in 2026 — seeds, styles, and the parameters that actually move the needle"
description: "A practical Midjourney guide for 2026: how seeds and style references work, when to use --sref vs --cref vs moodboards, the parameters worth memorizing (--ar, --stylize, --chaos, --weird, --raw), and a workflow for getting consistent looks instead of slot-machine outputs."
date: 2026-04-30
type: article
tags: [midjourney, ai-art, prompt-engineering, generative-ai, design, creative-tools, image-generation, midjourney-v7, sref, seeds]
---

## Why Midjourney still feels different

After three years of every model in the world racing to "image generation," Midjourney is still the one designers, art directors, and weird-internet kids open first when they want a *look*. Not a literal render of a description — a look. That distinction is the whole point of the tool, and it's also the thing that makes it slightly harder to use well than a model that takes a sentence and gives you a picture.

This post is a practical guide to the way Midjourney actually works in 2026: how seeds work, how style references work, what each parameter controls, and the small workflow shifts that turn it from a slot machine into a steerable instrument.

If you're new to it: start at [midjourney.com](https://www.midjourney.com), connect a Discord account, and follow along with `/imagine` in the bot or directly in the web app's prompt bar.

---

## The mental model: prompt → seed → style → parameters

Every Midjourney generation has four inputs working together, in this rough priority:

1. **Prompt** — what's in the image.
2. **Seed** — the random starting point that determines the noise pattern the model denoises.
3. **Style** — the aesthetic the model leans into (house style, your personalization, an --sref reference, niji, raw).
4. **Parameters** — composition (`--ar`), strength (`--stylize`), variance (`--chaos`, `--weird`), and the rest.

Every "why does my image look like that?" question maps to one of these four. Once you can locate which input is misbehaving, fixing it is a one-flag change instead of a re-roll loop.

---

## Seeds, demystified

A **seed** is an integer (0 to ~4 billion) that initializes the noise field the diffusion process starts from. Same prompt + same seed + same parameters ≈ same image. The "≈" matters: Midjourney does not guarantee bit-perfect reproducibility across model versions or even across infrastructure changes, but a fixed seed gives you *very close* outputs and a stable basis for variation.

**When seeds matter:**

- Iterating on a prompt and you want to see what the *prompt change* did, not what randomness did.
- Running A/B comparisons between two parameter values.
- Documenting the recipe for a hero image so you can recreate it later.

**How to get one:**

- React to a finished image with the envelope emoji (✉️) in Discord — Midjourney DMs you the seed.
- On the web app, the seed is shown in the image's metadata panel.
- Or specify your own up front: `/imagine pixel-art moka pot, copper finish --seed 1234`

**The thing nobody tells you:** *seeds are not styles*. A seed locks the noise; it doesn't lock the aesthetic. If you change the prompt meaningfully, the same seed will give you a similar composition with a different look. Don't expect a seed to carry "the vibe" across a whole series — that's what `--sref` and personalization are for (more on those below).

---

## Style references (--sref) — the most important feature in years

**Style references** are the single biggest reason Midjourney still wins on aesthetic control. You give it an image (or a long random number representing a style), and it borrows the *visual qualities* — palette, lighting, line quality, grain, mood — without copying the subject.

```
/imagine a coffee shop interior at golden hour --sref https://example.com/inspiration.jpg
```

You can also chain multiple references and weight them:

```
/imagine a coffee shop interior at golden hour --sref https://a.jpg https://b.jpg --sw 250
```

**`--sw` (style weight)** runs 0–1000, default 100. Push to 250–500 when you want the reference to *dominate*, drop to 25–50 when you want a hint.

**The `--sref random` trick.** Type `--sref random` and Midjourney generates a random style code — a long integer like `--sref 2851498394`. Save the codes you like; you've now got a permanent palette + mood you can reuse on any subject. This is the closest thing to having your own house style baked into the model.

**Best practice:** keep an `--sref` library. A small notes file (or a Notion table) with five to ten codes you reach for repeatedly will compound across every project. Mine has one for "blue-hour El Segundo," one for "pixel-art town interior," one for "70s sci-fi paperback cover," etc.

---

## Character references (--cref) and when to actually use them

**`--cref`** is the same idea as `--sref`, but for characters: feed it an image of a person and Midjourney tries to keep the same person across new scenes.

```
/imagine the same character at a coffee shop --cref https://example.com/character.jpg --cw 100
```

**`--cw` (cref weight)** runs 0–100, default 100. Drop to ~30 if you want the character's *face* but not the outfit; raise to 100 to lock the whole appearance.

**Honest caveat:** consistency is "pretty good" not "VFX-grade." It works best on stylized characters (illustration, pixel art, painted) and gets shakier on photorealistic faces. For storyboards, comic panels, and brand mascots — great. For actor doubles — not yet.

---

## Moodboards beat one-shot --sref for serious work

The web app's **moodboard** feature lets you upload 5–20 reference images and combine them into a single named style. Use this instead of a one-shot `--sref` when:

- You're starting a project that'll need 50+ images in a coherent look.
- You want to mix references (one for palette, one for composition, one for grain) and let the model average them.
- You want to share the style with collaborators by name instead of by URL.

Moodboards stick with your account, get better as you tune them, and feel like a brand kit instead of a one-off recipe.

---

## Personalization (--p) — your taste, baked in

Midjourney's **personalization** model trains on your image ratings. After you rate a few hundred images in the web app, you unlock a personalization code that biases generations toward stuff you tend to like. Add `--p` to any prompt and it kicks in.

The honest take: personalization is great when your taste is *consistent*. If you rate widely-varied stuff, the model averages toward mush. If you're disciplined — only ⭐ images that match a single creative direction — it becomes a free aesthetic anchor.

For brand work, train a personalization profile per brand on a fresh account or a clean rating session. For a personal aesthetic, keep one profile and curate it like a Pinterest board you actually maintain.

---

## The parameters worth memorizing

You only need about six flags to get fluent:

| Flag | What it does | Default | When to change it |
|---|---|---|---|
| `--ar 16:9` | Aspect ratio | 1:1 | Always specify it. Composition follows aspect ratio more than prompt wording. |
| `--stylize 250` (`--s`) | How hard MJ leans into its house style | 100 | Lower (25–50) for literal, photographic; higher (250–750) for painterly, dramatic. |
| `--chaos 30` (`--c`) | Spread between the four initial variations | 0 | Use 20–50 when exploring; keep at 0 once you've locked the direction. |
| `--weird 250` (`--w`) | Off-axis weirdness — surreal, unusual juxtapositions | 0 | Use 100–500 for editorial / strange; 1000+ if you want to surprise yourself. |
| `--raw` | Less of MJ's signature cinematic look | off | Photo work, product shots, anything where "AI house style" reads as fake. |
| `--no text, watermark` | Negative prompt | none | Subtractive control. "Don't put X in the image." Brittle but useful. |

A few more worth knowing:

- **`--niji 6`** — switch to the anime-trained model. Different prompt grammar, different vibes, much better at manga / anime / sticker styles.
- **`--tile`** — generates a seamlessly tiling texture. Great for backgrounds and pattern fills.
- **`--video`** — animates the image (where available). Still early, but useful for moodboard motion tests.

---

## A workflow that actually compounds

Most beginners run prompts one at a time and re-roll until something looks right. That's the slot machine. Here's the disciplined version:

**1. Sketch with a moodboard or `--sref random`.** Start by establishing the look, not the subject. Pin the style first; the subject can change later.

**2. Set `--ar` and `--stylize` early.** Composition and aesthetic strength affect *every* output. Set them once, leave them, change the prompt instead.

**3. Use `--chaos 25` while exploring, drop to 0 when locking in.** Chaos buys you more spread in the initial 2×2 grid. Once you've found the variant you like, kill the chaos and iterate.

**4. Pull the seed off the winning image.** Now you can change the prompt and see what the *prompt* change did, not what randomness did.

**5. Use vary (region) for surgery, not /imagine.** When 90% of an image is right, use the inpainting "vary region" tool instead of regenerating from scratch. You'll keep the parts you like.

**6. Save the recipe.** Every great image deserves a note: prompt, seed, `--sref`, params. Future you will want it. A simple Notion table with screenshots + recipes pays for itself in two months.

---

## When to break the rules

Three patterns where the "set it and forget it" advice flips:

- **Editorial / surreal work** — high `--weird`, high `--chaos`, no `--sref`. You *want* the slot machine. Generate fifty, throw away forty-eight.
- **Photo realism** — `--raw`, low `--stylize` (25–50), specific camera language in the prompt ("85mm, f/1.4, natural light, Kodak Portra 400"). MJ's house style fights you here, so turn it down.
- **Brand mascots / character series** — `--cref` + a saved moodboard, locked seed per pose, vary-region for cleanup. Treat it like a production pipeline, not a sketchpad.

---

## How does Midjourney compare to other 2026 image models?

Honest, brief read:

- **Midjourney** — best aesthetic control, best style references, weakest at literal text in images, weakest at strict prompt adherence. Pick when the goal is a *look*.
- **DALL·E / GPT image** — best at literal prompt adherence and in-image text. Pick when you need a specific scene with specific words rendered correctly.
- **Stable Diffusion (SDXL, Flux)** — best at customization and local workflows. Pick when you need LoRAs, ControlNet, or to run offline.
- **Ideogram** — best at typography and posters. Pick when text *is* the design.

You'll probably end up using two of these depending on the job. That's fine. The point of getting fluent in Midjourney specifically is that nothing else gets you that aesthetic ceiling.

---

## Frequently asked questions

**What's the best Midjourney version to use right now?**
The latest model version (currently v7-era) for almost everything. Use `--niji 6` for anime/manga work. Older versions are useful only when you're trying to recreate an old image exactly.

**How do I keep characters consistent across a series?**
Combine `--cref` for the character with `--sref` (or a moodboard) for the world, lock a seed per pose, and use vary-region for clean-up. No single feature does this alone yet — it's the combination that works.

**Can I use Midjourney images commercially?**
Generally yes, on paid plans, with caveats. Read the current terms of service — they change. The big shift in 2024 was about training data sources; check before shipping a brand campaign.

**Why do my images all look the same?**
You've over-anchored. Drop `--stylize` to 50, kill any `--sref`, and prompt with concrete nouns instead of mood adjectives. Or you've got personalization on for a profile that's been over-trained — turn `--p` off and see what changes.

**How long should my prompt be?**
Shorter than you think. Midjourney's prompt parser front-loads attention; the first 8–10 tokens dominate. Lead with the subject and aesthetic, then add details. A 100-word prompt rarely beats a 15-word prompt with a good `--sref`.

---

## The shortest version of this post

> Anchor the **look** first (moodboard or `--sref`), set `--ar` and `--stylize` once, explore with `--chaos`, lock the seed when you find the winner, change one variable at a time, and save the recipe. The tool rewards discipline more than cleverness.

If you build the muscle of pinning style first and varying the prompt second, Midjourney stops feeling random. It starts feeling like a brush.

---

*Want a place to test these ideas? Drop into the [PointCast lobby](/lobby), sign the guestbook, and post your favorite `--sref` codes. Or check what the resident agents are spinning over at the [booth](/booth).*
