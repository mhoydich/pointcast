#!/usr/bin/env python3
"""Office Kit v0: make one self-contained storefront for one piece.

Writes <out>/<slug>/index.html and <out>/<slug>/card-<n>.png. The HTML has
the X/Open Graph card tags, the art inlined, and a collect link. Drop the
folder on any static host. CC0.

X keeps a card image for days, so every time the count changes, run this
again with a new --left: it writes a new card-<n>.png and points the page at
it, and the office shares the page with ?n=<n> so X fetches the new card.

  python3 scripts/office-kit/make_piece.py \
    --art public/nouns-money/collected/gallery/art-fa95dc9778dd14.webp \
    --title "Garden Twenty" --artist "Nouns Money" --wallet officenoun.tez \
    --editions 50 --left 50 --price "free" \
    --base https://pointcast.xyz/office-kit/pieces \
    --out public/office-kit/pieces
"""
import argparse, base64, html, io, json, os, re
from PIL import Image, ImageDraw, ImageFont

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
CREAM, INK, RED = (244, 236, 220), (28, 40, 60), (196, 48, 40)


def font(size):
    try:
        return ImageFont.truetype(FONT, size)
    except OSError:
        return ImageFont.load_default()


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "piece"


def make_card(art, title, artist, left, editions, price, office):
    W, H = 1200, 630
    card = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(card)
    k = min(700 / art.width, 520 / art.height)
    a = art.resize((int(art.width * k), int(art.height * k)), Image.LANCZOS)
    card.paste(a, (40 + (700 - a.width) // 2, 40 + (520 - a.height) // 2))
    x = 780
    d.text((x, 48), "OFFICE KIT", font=font(22), fill=RED)
    y = 96
    f = font(40)
    for line in wrap(title, 16):
        d.text((x, y), line, font=f, fill=INK)
        y += 48
    d.text((x, y + 10), f"by {artist}", font=font(22), fill=INK)
    d.rectangle([x, 330, W - 40, 332], fill=INK)
    d.text((x, 350), f"{left} of {editions} left", font=font(30), fill=INK)
    d.text((x, 395), price, font=font(30), fill=RED)
    d.text((x, 470), f"office: {office}", font=font(18), fill=INK)
    d.text((x, 498), "artist keeps 100%", font=font(18), fill=INK)
    d.text((40, 585), "art. no promise of value. cc0 kit.", font=font(16), fill=INK)
    return card


def wrap(text, n):
    words, lines, cur = text.split(), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > n and cur:
            lines.append(cur)
            cur = w
        else:
            cur = (cur + " " + w).strip()
    lines.append(cur)
    return lines[:4]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--art", required=True)
    p.add_argument("--title", required=True)
    p.add_argument("--artist", required=True)
    p.add_argument("--wallet", required=True, help="artist tz address or .tez")
    p.add_argument("--editions", type=int, required=True)
    p.add_argument("--left", type=int, required=True)
    p.add_argument("--price", default="free")
    p.add_argument("--office", default="Office Noun")
    p.add_argument("--collect", default="", help="collect URL (objkt token page or contract call page)")
    p.add_argument("--base", required=True, help="public URL of the pieces folder")
    p.add_argument("--out", required=True)
    a = p.parse_args()

    slug = slugify(a.title)
    folder = os.path.join(a.out, slug)
    os.makedirs(folder, exist_ok=True)
    art = Image.open(a.art).convert("RGB")

    n = a.editions - a.left  # card number = how many collected so far
    card_name = f"card-{n}.png"
    make_card(art, a.title, a.artist, a.left, a.editions, a.price, a.office).save(
        os.path.join(folder, card_name), optimize=True)

    buf = io.BytesIO()
    show = art.copy()
    show.thumbnail((1600, 1600))
    show.save(buf, "WEBP", quality=88)
    art_uri = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()

    url = f"{a.base.rstrip('/')}/{slug}/"
    img = f"{a.base.rstrip('/')}/{slug}/{card_name}"
    desc = f"{a.left} of {a.editions} left · {a.price} · by {a.artist} · artist keeps 100%"
    state = {"spec": "office-kit/v0", "title": a.title, "artist": a.artist,
             "wallet": a.wallet, "editions": a.editions, "left": a.left,
             "price": a.price, "office": a.office, "collect": a.collect}
    e = html.escape
    collect = (f'<a class="btn" href="{e(a.collect)}">collect</a>' if a.collect
               else '<span class="btn off">collect opens when the contract is live</span>')

    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(a.title)} · {e(a.artist)} · Office Kit</title>
<meta name="description" content="{e(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{e(url)}">
<meta property="og:title" content="{e(a.title)} · {e(a.artist)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{e(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(a.title)} · {e(a.artist)}">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{e(img)}">
<script type="application/json" id="office-kit">{json.dumps(state)}</script>
<style>
body{{margin:0;background:#f4ecdc;color:#1c283c;font:16px/1.5 ui-monospace,Menlo,monospace}}
main{{max-width:760px;margin:0 auto;padding:24px}}
img{{width:100%;height:auto;display:block;border:2px solid #1c283c}}
h1{{font-size:28px;margin:20px 0 4px}}
.row{{display:flex;gap:16px;flex-wrap:wrap;margin:12px 0}}
.btn{{display:inline-block;background:#c43028;color:#f4ecdc;padding:12px 20px;text-decoration:none;font-weight:700}}
.off{{background:#8a8a8a}}
small{{opacity:.75}}
</style></head><body><main>
<img src="{art_uri}" alt="{e(a.title)} by {e(a.artist)}">
<h1>{e(a.title)}</h1>
<div>by {e(a.artist)} · <small>{e(a.wallet)}</small></div>
<div class="row"><b>{a.left} of {a.editions} left</b><b>{e(a.price)}</b></div>
<div class="row">{collect}</div>
<p><small>The artist keeps 100%. Money goes wallet to wallet; the office
never holds it. Office: {e(a.office)}. Art, no promise of value.
This page is one self-contained file: save it, host it anywhere.
Office Kit spec v0, CC0.</small></p>
</main></body></html>
"""
    with open(os.path.join(folder, "index.html"), "w") as fh:
        fh.write(page)
    print(json.dumps({"page": url, "share": f"{url}?n={n}", "card": img}))


if __name__ == "__main__":
    main()
