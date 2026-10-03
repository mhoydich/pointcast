"""Hoydich Entertainment annual report cover — "broadcast sunset".

A sun setting into the Pacific transmits warped signal rings across the
sky; below the horizon the swell is drawn in perspective and the sun's
reflection glitches as slice-shifted rows. Riso-style stochastic grain. Deterministic for a given SEED.

    python3 designs/annual-report/flux_cover.py [--scale 1.0] [--seed 2026]
"""
import argparse
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))

PAPER = (246, 240, 226)
NAVY = (17, 20, 37)
CREAM = (250, 242, 220)
GOLD = (255, 177, 27)
ORANGE = (255, 112, 46)
CORAL = (238, 74, 92)
SKY = (99, 167, 255)
COBALT = (36, 66, 204)
MINT = (37, 217, 150)
SILVER = (184, 180, 170)

HORIZON = 0.64
SUN = (0.64, 0.555)  # x, y (unit panel coords); sits on the horizon
SUN_R = 0.105


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def gauss(x, y, cx, cy, sx, sy):
    return np.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2))


def palette_pick(cycle, idx):
    arr = np.array(cycle, np.float32)
    return arr[np.mod(idx, len(arr))]


def render_art(w, h, seed):
    """Broadcast sunset: signal rings off a setting sun, swell below."""
    rng = np.random.default_rng(seed)
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    x = xs / w
    y = ys / h
    a = h / w  # aspect, so rings stay round
    sx, sy = SUN

    # ---------------- sky: warped rings radiating from the sun ----------
    wx = x + 0.035 * np.sin(6.0 * y * a + 1.3) + 0.015 * np.sin(17 * y * a + 4 * x)
    wy = y + 0.025 * np.sin(5.0 * x + 0.7) + 0.010 * np.sin(15 * x - 3 * y)
    r = np.hypot(wx - sx, (wy - sy) * a)
    # rings flatten and drift as they travel (wind in the signal)
    r += 0.06 * gauss(x, y, 0.18, 0.22, 0.25, 0.20) - 0.04 * gauss(x, y, 0.85, 0.12, 0.2, 0.15)
    N = 30.0
    s_sky = (r - SUN_R) * N
    band_sky = np.floor(s_sky).astype(np.int32)
    t_sky = s_sky - np.floor(s_sky)

    sky_cycle = [GOLD, ORANGE, CORAL, ORANGE, CREAM, CORAL,
                 CREAM, SKY, CREAM, SKY, COBALT, SKY, CREAM, SKY, COBALT, SKY]
    sky_line = palette_pick(sky_cycle, np.clip(band_sky, 0, 10**6))
    # hero ring: a mint / cobalt / gold edge a few rings out
    for k, col in ((5, MINT), (6, COBALT), (7, GOLD)):
        sky_line[band_sky == k] = col
    hero_sky = (band_sky >= 5) & (band_sky <= 7)

    # night closes in with distance from the sun
    sky_dark = smooth(0.30, 0.62, r) * 0.95

    # ---------------- sea: perspective swell under the horizon ----------
    d = np.maximum(y - HORIZON, 0) + 1e-4
    rows = np.arange(h)
    shift = np.zeros(h, np.float32)
    rr = int(HORIZON * h)
    while rr < h:
        bh = int(rng.integers(max(2, h // 500), max(4, h // 90)))
        shift[rr:rr + bh] = rng.normal(0, 0.018) * (0.4 + 3.0 * (rr / h - HORIZON))
        rr += bh
    gx = x + shift[rows][:, None]
    swell = 11.0 * np.log(d / 0.004) + 0.9 * np.sin(9 * gx + 3 * np.log(d)) \
        + 0.5 * np.sin(23 * gx - 2 * np.log(d) + 1.0)
    band_sea = np.floor(swell).astype(np.int32)
    t_sea = swell - np.floor(swell)

    sea_cycle = [SKY, COBALT, CREAM, COBALT, MINT, COBALT, SKY, COBALT]
    sea_line = palette_pick(sea_cycle, band_sea)
    # the sun's reflection: a glitching gold column that widens toward us
    col_w = 0.05 + 0.35 * (d / (1 - HORIZON))
    refl = np.abs(gx - sx) < col_w * (0.55 + 0.45 * np.sin(swell * 1.7) ** 2)
    refl_cycle = np.array([GOLD, ORANGE, CORAL, GOLD, CREAM], np.float32)
    sea_line = np.where(refl[..., None], refl_cycle[np.mod(band_sea, 5)], sea_line)
    sea_dark = 0.55 + 0.4 * smooth(0.15, 0.0, d)

    # ---------------- combine -------------------------------------------
    is_sea = (y > HORIZON)[..., None]
    line = np.where(is_sea, sea_line, sky_line)
    t = np.where(y > HORIZON, t_sea, t_sky)
    dark = np.where(y > HORIZON, sea_dark * (1 - refl * 0.6), sky_dark)

    prof = 0.5 + 0.5 * np.cos(2 * np.pi * (t - 0.5))
    coverage = smooth(0.22, 0.85, prof)
    coverage = np.where(hero_sky & (y <= HORIZON), np.where(t < 0.92, 0.97, coverage), coverage)
    coverage *= 1 - 0.3 * dark

    # the sun disk itself, cut with retro scanline slots near its base
    rs = np.hypot(x - sx, (y - sy) * a)
    in_sun = (rs < SUN_R) & (y <= HORIZON)
    slot = ((y - (sy - 0.01)) * 90) % 1.0 < smooth(sy - 0.02, HORIZON, y) * 0.7
    sun_col = np.where((y < sy)[..., None], np.array(GOLD, np.float32), np.array(ORANGE, np.float32))
    line = np.where(in_sun[..., None], sun_col, line)
    coverage = np.where(in_sun, np.where(slot, 0.0, 0.98), coverage)
    dark = np.where(in_sun, 0.9, dark)

    # interference: a second, smaller transmitter XORed in, low left sky
    r2 = np.hypot(x - 0.16, (y - 0.46) * a)
    t2 = (r2 * 46) % 1.0
    patch = gauss(x, y, 0.20, 0.44, 0.16, 0.08) * (y <= HORIZON)
    flip = (t2 < 0.5) & (patch > rng.random(patch.shape) * 0.9 + 0.1)
    coverage = np.where(flip, 1 - coverage, coverage)

    # ---------------- grain ---------------------------------------------
    bg_pick = (dark > rng.random(dark.shape))[..., None]
    bg = np.where(bg_pick, np.array(NAVY, np.float32), np.array(CREAM, np.float32))
    on = coverage > rng.random((h, w))
    img = np.where(on[..., None], line, bg).astype(np.float32)

    # horizon haze
    haze = gauss(x, y, sx, HORIZON, 0.45, 0.03) * 0.5
    speck = rng.random((h, w)) < haze
    img[speck] = img[speck] * 0.4 + np.array(SILVER) * 0.6

    img = np.clip(img + rng.normal(0, 7, (h, w, 1)), 0, 255)
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
    big = font(fp, int(92 * scale), 700)
    mid = font(fp, int(58 * scale), 500)
    side = font(fp, int(56 * scale), 600)

    y1, y2 = int(3268 * scale), int(3380 * scale)
    d.text((L, y1), "Hoydich Entertainment", font=big, fill=NAVY)
    d.text((L, y2), "Annual Report", font=mid, fill=NAVY)

    # three signal dots (bottom right): sun, sky, sea
    dr = int(46 * scale)
    cy = int(3322 * scale)
    for i, col in enumerate((GOLD, SKY, MINT)):
        cx = R - dr - i * int(122 * scale)
        d.ellipse([cx - dr, cy - dr, cx + dr, cy + dr], fill=col)

    # vertical wordmark, right gutter
    label = "HOYDICH"
    tw = int(d.textlength(label, font=side))
    th = int(80 * scale)
    tmp = Image.new("RGBA", (tw + 10, th), (0, 0, 0, 0))
    ImageDraw.Draw(tmp).text((0, 0), label, font=side, fill=ORANGE)
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
