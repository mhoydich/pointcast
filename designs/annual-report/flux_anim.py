"""Animated flux poster — looping GIF of the contour-flux field.

The stripes breathe back and forth, the warp drifts, glitch slices jump
and the riso grain re-rolls every frame. The loop is seamless: every
moving term runs on a single phase that wraps at the last frame.

    python3 designs/annual-report/flux_anim.py [--width 600] [--frames 36]
"""
import argparse
import os

import numpy as np
from PIL import Image, ImageDraw

from flux_cover import font, gauss, smooth

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


def field(x, y, ph):
    c, s = np.cos(ph), np.sin(ph)
    wx = x + 0.07 * np.sin(4.1 * y + 0.6 + ph) + 0.03 * np.sin(11 * y + 3 * x - 2 * ph)
    wy = y + 0.05 * np.sin(3.3 * x + 1.7 - ph) + 0.02 * np.sin(9 * x - 4 * y + ph)
    f = 1.15 * wy
    f += 0.22 * np.sin(2.6 * np.pi * wx + 2.2 * wy + 0.4 + 0.5 * s)
    f -= 0.32 * gauss(wx, wy, 0.42 + 0.03 * c, 0.40 + 0.02 * s, 0.20, 0.13)
    f += 0.24 * gauss(wx, wy, 0.20 - 0.02 * s, 0.26 + 0.02 * c, 0.16, 0.18)
    f += 0.18 * gauss(wx, wy, 0.66 + 0.02 * s, 0.18, 0.14, 0.20)
    f -= 0.12 * gauss(wx, wy, 0.55 - 0.03 * c, 0.78, 0.22, 0.08)
    f += 0.10 * gauss(wx, wy, 0.85, 0.66 + 0.03 * s, 0.12, 0.16)
    return f


def render_frame(w, h, ph, rng, glitch_rng):
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    x, y = xs / w, ys / h

    shift = np.zeros(h, np.float32)
    r = 0
    while r < h:
        bh = int(glitch_rng.integers(max(2, h // 400), max(4, h // 60)))
        amt = glitch_rng.normal(0, 0.012) if glitch_rng.random() < 0.55 else 0.0
        shift[r:r + bh] = amt * (0.3 + 1.2 * (r / h))
        r += bh
    gx = x + shift[:, None] * smooth(0.52, 0.80, x) * smooth(0.18, 0.40, y)

    N = 44.0
    f = field(gx, y * 1.35, ph)
    s = f * N + 1.6 * np.sin(ph)  # contours breathe
    band = np.floor(s)
    t = s - band
    b = band.astype(np.int32)

    prof = 0.5 + 0.5 * np.cos(2 * np.pi * (t - 0.5))
    coverage = smooth(0.25, 0.85, prof)

    dark = smooth(0.35, 0.75, gauss(x, y, 0.08, 0.05, 0.30, 0.22) * 1.2
                  + gauss(x, y, 0.95, 0.10, 0.30, 0.25) * 1.3
                  + gauss(x, y, 1.02, 0.62, 0.20, 0.40)
                  + gauss(x, y, 0.02, 0.60, 0.07, 0.20) * 0.8)

    cool = np.array([BLUE, WHITE, BLUE, ICE, BLUE, WHITE], np.float32)[b % 6]
    hot = np.array([RED, PINK, WHITE, PINK, RED, WHITE], np.float32)[b % 6]
    pick = (((b >= 21) & (b <= 29)) | ((b >= 36) & (b <= 39)))[..., None]
    line = np.where(pick, hot, cool)
    for k, col in ((16, BLUE), (17, BLUE), (18, GREEN), (19, RED), (20, RED)):
        m = band == k
        line[m] = col
        coverage[m] = np.where(t[m] < 0.9, 0.97, coverage[m])

    bg_pick = (dark > rng.random(dark.shape))[..., None]
    bg = np.where(bg_pick, np.array(INK, np.float32), np.array(PAPER, np.float32))
    coverage *= 1 - 0.35 * dark

    f2 = field(gx * 1.3 + 0.2, y * 1.1 - 0.1, -ph) + 0.9 * x
    t2 = (f2 * 38) % 1.0
    moire = gauss(x, y, 0.42, 0.74, 0.22, 0.10)
    flip = (t2 < 0.5) & (moire > rng.random(moire.shape) * 0.9 + 0.1)
    coverage = np.where(flip, 1 - coverage, coverage)

    on = coverage > rng.random((h, w))
    img = np.where(on[..., None], line, bg)
    haze = gauss(x, y, 0.55, 0.52, 0.30, 0.12) * 0.55
    speck = rng.random((h, w)) < haze * 0.5
    img[speck] = img[speck] * 0.45 + np.array(SILVER) * 0.55
    return np.clip(img, 0, 255).astype(np.uint8)


def frame_chrome(W, H, scale):
    """Static poster frame: paper, caption, chips, vertical wordmark."""
    L, T, R, B = [int(v * scale) for v in (160, 190, 2240, 3220)]
    poster = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(poster)
    fp = os.path.join(HERE, "SpaceGrotesk.ttf")
    big = font(fp, max(10, int(64 * scale)), 700)
    mid = font(fp, max(9, int(58 * scale)), 500)
    side = font(fp, max(9, int(56 * scale)), 600)
    d.text((L, int(3280 * scale)), "Hoydich Entertainment", font=big, fill=INK)
    d.text((L, int(3370 * scale)), "Annual Report", font=mid, fill=INK)
    cw, cy = int(118 * scale), int(3290 * scale)
    d.rectangle([R - 2 * cw - int(30 * scale), cy, R - cw - int(30 * scale), cy + cw], fill=BLUE)
    d.rectangle([R - cw, cy, R, cy + cw], fill=RED)
    label = "HOYDICH"
    tw = int(d.textlength(label, font=side))
    tmp = Image.new("RGBA", (tw + 6, int(80 * scale)), (0, 0, 0, 0))
    ImageDraw.Draw(tmp).text((0, 0), label, font=side, fill=RED)
    tmp = tmp.rotate(90, expand=True)
    poster.paste(tmp, (R + int(28 * scale), T), tmp)
    return poster, (L, T, R, B)


def main(width, frames, fps, seed, out):
    scale = width / 2400
    W, H = width, int(3600 * scale)
    chrome, (L, T, R, B) = frame_chrome(W, H, scale)
    rng = np.random.default_rng(seed)
    imgs = []
    for i in range(frames):
        ph = 2 * np.pi * i / frames
        glitch_rng = np.random.default_rng(seed * 1000 + i // 3)  # slices jump every 3 frames
        art = render_frame(R - L, B - T, ph, rng, glitch_rng)
        fr = chrome.copy()
        fr.paste(Image.fromarray(art), (L, T))
        imgs.append(fr)
    pal = imgs[0].quantize(colors=24, method=Image.MEDIANCUT)
    q = [im.quantize(palette=pal, dither=Image.NONE) for im in imgs]
    q[0].save(out, save_all=True, append_images=q[1:], loop=0,
              duration=int(1000 / fps), optimize=True, disposal=1)
    print("wrote", out, f"{os.path.getsize(out) / 1e6:.1f} MB")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--width", type=int, default=600)
    ap.add_argument("--frames", type=int, default=36)
    ap.add_argument("--fps", type=int, default=12)
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument("--out", default=os.path.join(HERE, "hoydich-flux.gif"))
    a = ap.parse_args()
    main(a.width, a.frames, a.fps, a.seed, a.out)
