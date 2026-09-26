"""Hoydich Entertainment annual report cover — contour-flux poster.

Generates a grainy, risograph-style warped stripe field inside a framed
poster layout. Deterministic for a given SEED.

    python3 designs/annual-report/flux_cover.py [--scale 1.0] [--seed 2026]
"""
import argparse
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))

PAPER = (243, 240, 234)
INK = (22, 22, 20)
BLUE = (38, 78, 222)
RED = (238, 58, 58)
GREEN = (28, 168, 92)
PINK = (242, 170, 168)
ICE = (176, 196, 238)
WHITE = (250, 246, 240)
SILVER = (178, 176, 170)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def gauss(x, y, cx, cy, sx, sy):
    return np.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2))


def field(x, y, rng):
    """Scalar height field whose iso-lines become the stripes."""
    # domain warp
    wx = x + 0.07 * np.sin(4.1 * y + 0.6) + 0.03 * np.sin(11 * y + 3 * x)
    wy = y + 0.05 * np.sin(3.3 * x + 1.7) + 0.02 * np.sin(9 * x - 4 * y)
    f = 1.15 * wy
    f += 0.22 * np.sin(2.6 * np.pi * wx + 2.2 * wy + 0.4)
    # the S-shaped tongue pushing in from the upper left
    f -= 0.32 * gauss(wx, wy, 0.42, 0.40, 0.20, 0.13)
    f += 0.24 * gauss(wx, wy, 0.20, 0.26, 0.16, 0.18)
    f += 0.18 * gauss(wx, wy, 0.66, 0.18, 0.14, 0.20)
    # a sag in the lower middle and a ridge low right
    f -= 0.12 * gauss(wx, wy, 0.55, 0.78, 0.22, 0.08)
    f += 0.10 * gauss(wx, wy, 0.85, 0.66, 0.12, 0.16)
    return f


def render_art(w, h, seed):
    rng = np.random.default_rng(seed)
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    x = xs / w
    y = ys / h

    # --- glitch: slice-shift rows on the right half ---------------------
    rows = np.arange(h)
    shift = np.zeros(h, np.float32)
    r = 0
    while r < h:
        bh = int(rng.integers(max(2, h // 400), max(4, h // 60)))
        amt = rng.normal(0, 0.012) if rng.random() < 0.55 else 0.0
        shift[r:r + bh] = amt * (0.3 + 1.2 * (r / h))
        r += bh
    glitch_mask = smooth(0.52, 0.80, x) * smooth(0.18, 0.40, y)
    gx = x + shift[rows][:, None] * glitch_mask

    f = field(gx, y * 1.35, rng)

    N = 44.0
    s = f * N
    band = np.floor(s)
    t = s - band

    # soft stripe profile -> stochastic (grainy) coverage
    prof = 0.5 + 0.5 * np.cos(2 * np.pi * (t - 0.5))  # 1 at stripe center
    coverage = smooth(0.25, 0.85, prof)

    # --- region selectors ------------------------------------------------
    # dark: where the background between stripes turns black
    dark = smooth(0.35, 0.75, gauss(x, y, 0.08, 0.05, 0.30, 0.22) * 1.2
                  + gauss(x, y, 0.95, 0.10, 0.30, 0.25) * 1.3
                  + gauss(x, y, 1.02, 0.62, 0.20, 0.40)
                  + gauss(x, y, 0.02, 0.60, 0.07, 0.20) * 0.8)

    # per-band colour choice
    b = band.astype(np.int32)
    cool_cycle = np.array([BLUE, WHITE, BLUE, ICE, BLUE, WHITE], np.float32)
    warm_cycle = np.array([RED, PINK, WHITE, PINK, RED, WHITE], np.float32)
    cool = cool_cycle[b % len(cool_cycle)]
    hot = warm_cycle[b % len(warm_cycle)]
    # warm family = a run of bands just past the hero edge, so colour
    # changes follow the contours instead of cutting across them
    pick = ((b >= 21) & (b <= 29)) | ((b >= 36) & (b <= 39))
    pick = pick[..., None].astype(np.float32)
    line = cool * (1 - pick) + hot * pick

    # the signature thick edge: blue / green / red bands along one contour
    for k, col in ((16, BLUE), (17, BLUE), (18, GREEN), (19, RED), (20, RED)):
        m = band == k
        line[m] = col
        coverage[m] = np.where(t[m] < 0.9, 0.97, coverage[m])

    # background colour
    bg_pick = (dark > rng.random(dark.shape)).astype(np.float32)[..., None]
    bg = np.array(PAPER, np.float32) * (1 - bg_pick) + np.array(INK, np.float32) * bg_pick

    # in the dark zones stripes are thinner and cooler
    coverage *= (1 - 0.35 * dark)

    # --- moiré: a second stripe set XORed in, lower middle ---------------
    f2 = field(gx * 1.3 + 0.2, y * 1.1 - 0.1, rng) * 1.0 + 0.9 * x
    t2 = (f2 * 38) % 1.0
    moire = gauss(x, y, 0.42, 0.74, 0.22, 0.10)
    flip = (t2 < 0.5) & (moire > rng.random(moire.shape) * 0.9 + 0.1)
    coverage = np.where(flip, 1 - coverage, coverage)

    # --- grain -----------------------------------------------------------
    noise = rng.random((h, w)).astype(np.float32)
    on = coverage > noise
    img = np.where(on[..., None], line, bg)

    # silver haze through the middle (fine speckle)
    haze = gauss(x, y, 0.55, 0.52, 0.30, 0.12) * 0.55
    speck = rng.random((h, w)) < haze * 0.5
    img[speck] = img[speck] * 0.45 + np.array(SILVER) * 0.55

    # overall paper tooth
    tooth = rng.normal(0, 7, (h, w, 1))
    img = np.clip(img + tooth, 0, 255)
    return img.astype(np.uint8)


def font(path, size, weight):
    f = ImageFont.truetype(path, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def compose(scale, seed, out):
    W, H = int(2400 * scale), int(3600 * scale)
    L, T, R, B = int(160 * scale), int(190 * scale), int(2240 * scale), int(3220 * scale)
    poster = Image.new("RGB", (W, H), PAPER)
    art = render_art(R - L, B - T, seed)
    poster.paste(Image.fromarray(art), (L, T))

    d = ImageDraw.Draw(poster)
    fp = os.path.join(HERE, "SpaceGrotesk.ttf")
    big = font(fp, int(64 * scale), 700)
    mid = font(fp, int(58 * scale), 500)
    side = font(fp, int(56 * scale), 600)

    y1, y2 = int(3280 * scale), int(3370 * scale)
    d.text((L, y1), "Hoydich Entertainment", font=big, fill=INK)
    d.text((L, y2), "Annual Report", font=mid, fill=INK)

    # colour chips (bottom right)
    cw = int(118 * scale)
    cy = int(3290 * scale)
    d.rectangle([R - 2 * cw - int(30 * scale), cy, R - cw - int(30 * scale), cy + cw], fill=BLUE)
    d.rectangle([R - cw, cy, R, cy + cw], fill=RED)

    # vertical wordmark, right gutter
    label = "HOYDICH"
    tw = int(d.textlength(label, font=side))
    th = int(80 * scale)
    tmp = Image.new("RGBA", (tw + 10, th), (0, 0, 0, 0))
    ImageDraw.Draw(tmp).text((0, 0), label, font=side, fill=RED)
    tmp = tmp.rotate(90, expand=True)
    poster.paste(tmp, (R + int(28 * scale), T), tmp)

    poster.save(out, quality=94)
    print("wrote", out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument("--out", default=os.path.join(HERE, "hoydich-annual-report-cover.png"))
    a = ap.parse_args()
    compose(a.scale, a.seed, a.out)
