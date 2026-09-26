"""Hoydich Entertainment cap — broadcast-sunset patch + front mockup.

Outputs (next to this file):
  hat-patch.png   flat, embroidery-friendly patch art on transparency
  hat-mockup.png  front view of a two-tone cap wearing the patch

    python3 designs/annual-report/hat/hat.py [--scale 1.0]
"""
import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from flux_cover import (COBALT, CORAL, CREAM, GOLD, MINT, NAVY, ORANGE,  # noqa: E402
                        PAPER, SKY, font, smooth)

SS = 3  # supersampling for clean edges


def rgba(col, a=255):
    return np.array((*col, a), np.float32)


def paint(img, mask, col):
    m = mask[..., None].astype(np.float32)
    img[:] = img * (1 - m) + rgba(col) * m


def patch_art(size, phase=None):
    """Circular patch, 6 thread colours + navy twill.

    phase in [0, 1) animates it: rings travel out from the sun and the swell
    rolls toward the viewer; both wrap seamlessly at phase 1.
    """
    n = size * SS
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
    x, y = xs / n, ys / n
    cx, cy = 0.5, 0.5
    rr = np.hypot(x - cx, y - cy)
    img = np.zeros((n, n, 4), np.float32)

    inside = rr < 0.44
    paint(img, rr < 0.5, GOLD)          # merrowed border
    paint(img, rr < 0.465, NAVY)        # border inner stitch gap
    paint(img, inside, NAVY)

    hz = 0.60
    sx, sy, sr = 0.5, 0.56, 0.13
    rs = np.hypot(x - sx, y - sy)
    sky = inside & (y < hz)
    # signal rings (satin stitch bands)
    rings = [(0.155, 0.185, ORANGE), (0.205, 0.235, CORAL),
             (0.255, 0.290, MINT), (0.305, 0.335, COBALT), (0.350, 0.380, GOLD),
             (0.395, 0.425, SKY)]
    wob = 0.006 * np.sin(np.arctan2(y - sy, x - sx) * 5)
    if phase is None:
        for a, b, col in rings:
            paint(img, sky & (rs + wob > a) & (rs + wob < b), col)
    else:
        # one ring spacing per sixth of the loop; colours roll with the rings
        sp, r0 = 0.048, 0.155
        u = (rs + wob - r0) / sp - 6 * phase
        k = np.floor(u).astype(int)
        ring = sky & (u - k < 0.62) & (rs + wob > sr + 0.02) & (rs + wob < 0.43)
        for i, (_, _, col) in enumerate(rings):
            paint(img, ring & (np.mod(k, 6) == i), col)
    # sun with scanline slots
    sun = sky & (rs < sr)
    paint(img, sun & (y < sy + 0.005), GOLD)
    slots = ((y - sy) * 55) % 1.0 < 0.45 + 0.5 * smooth(sy, hz, y)
    paint(img, sun & (y >= sy + 0.005) & ~slots, ORANGE)

    # sea: wavy swell lines + glitching gold reflection
    sea = inside & (y >= hz + 0.012)
    d = np.maximum(y - hz, 1e-3)
    p = 0.0 if phase is None else phase
    sw = 7.0 * np.log(d / 0.004) + 0.35 * np.sin(x * 22 + np.log(d) * 3 + 2 * np.pi * p) \
        - 6 * p  # six bands per loop keeps the %2 / %3 colour cycles seamless
    band = np.floor(sw).astype(int)
    t = sw - np.floor(sw)
    line = sea & (t < 0.5)
    reflw = 0.03 + 0.20 * (d / 0.4)
    offs = 0.02 * np.sin(band * np.pi * 2 / 3)
    refl = np.abs(x - sx + offs) < reflw * (0.5 + 0.5 * np.cos(band * np.pi / 3) ** 2)
    paint(img, line & ~refl & (band % 2 == 0), SKY)
    paint(img, line & ~refl & (band % 2 == 1), COBALT)
    paint(img, line & refl & (band % 3 == 0), GOLD)
    paint(img, line & refl & (band % 3 == 1), ORANGE)
    paint(img, line & refl & (band % 3 == 2), CREAM)
    paint(img, inside & (np.abs(y - hz - 0.004) < 0.004), CREAM)  # horizon stitch

    im = Image.fromarray(img.clip(0, 255).astype(np.uint8), "RGBA")
    return im.resize((size, size), Image.LANCZOS)


def superellipse_top(x, a, b, p=2.6):
    return b * np.clip(1 - np.abs(x / a) ** p, 0, 1) ** (1 / p)


def cap_base(scale):
    return mockup(scale, None, bare=True)


def mockup(scale, patch, bare=False):
    W, H = int(2400 * scale), int(2000 * scale)
    n_w, n_h = W * SS, H * SS
    ys, xs = np.mgrid[0:n_h, 0:n_w].astype(np.float32)
    X = (xs - n_w / 2) / n_w  # -0.5..0.5
    Y = ys / n_w
    img = np.zeros((n_h, n_w, 4), np.float32)
    img[:] = rgba(PAPER)

    base = 0.50      # crown base (centre)
    a, b = 0.27, 0.34
    base_y = base + 0.05 * np.clip(1 - (X / a) ** 2, 0, 1)  # base dips toward viewer
    crown_top = base + 0.05 - superellipse_top(X, a, b, 2.2)
    crown = (Y > crown_top) & (Y < base_y) & (np.abs(X) < a)

    # brim
    # pre-curved visor seen from slightly above: a crescent under the crown
    wb = a * 1.04
    brim_top = base_y - 0.01 + 0.035 * np.abs(X / wb) ** 10  # taper the tips
    brim_bot = base + 0.012 + 0.17 * np.clip(1 - (X / wb) ** 2, 0, 1) ** 0.6
    brim = (np.abs(X) < wb) & (Y > brim_top) & (Y < brim_bot) & ~crown

    # soft floor shadow
    sh = np.exp(-((X / 0.30) ** 2 + ((Y - 0.705) / 0.03) ** 2))
    img[..., :3] *= (1 - 0.22 * sh)[..., None]

    # crown: cream with round shading
    shade = 1 - 0.30 * (np.abs(X) / a) ** 3 - 0.12 * np.clip((base_y - Y) / b, 0, 1) ** 4
    cr = rgba(CREAM)[:3] * shade[..., None]
    img[crown, :3] = cr[crown]

    # panel seams + top button
    for s in (-1, 1):
        for k in (0.42, 0.80):
            sx_ = s * a * k * np.clip((Y - (base + 0.05 - b)) / b, 0, 1) ** 0.6
            seam = crown & (np.abs(X - sx_) < 0.0016)
            img[seam, :3] *= 0.80
    top_y = base + 0.05 - b
    btn = crown & (np.hypot(X, (Y - top_y) * 2.2) < 0.022)
    img[btn, :3] = rgba(NAVY)[:3]
    # eyelets
    for s in (-1, 1):
        ex, ey = s * 0.165, base - 0.20
        e = np.hypot(X - ex, Y - ey)
        img[(e < 0.011) & crown, :3] = rgba(NAVY)[:3] * 1.4
        img[(e < 0.005) & crown, :3] = rgba(NAVY)[:3] * 0.6

    # brim: navy with shading + gold stitch rows
    bshade = 0.85 + 0.25 * (1 - np.abs(X) / wb)
    bc = rgba(NAVY)[:3] * bshade[..., None] + 6
    img[brim, :3] = bc[brim]
    for i, off in enumerate((0.014, 0.026, 0.038, 0.050)):
        yy = brim_bot - off
        dash = ((X * 260) % 1.0) < 0.6
        stitch = brim & (np.abs(Y - yy) < 0.0014) & dash & (np.abs(X) < wb - 0.02 - i * 0.004)
        img[stitch, :3] = rgba(GOLD)[:3]

    out = Image.fromarray(img.clip(0, 255).astype(np.uint8), "RGBA")
    out = out.resize((W, H), Image.LANCZOS)
    return out if bare else decorate(out, scale, patch, base)


def decorate(out, scale, patch, base=0.50):
    """Place the patch and side embroidery on a rendered cap."""
    out = out.copy()
    W = out.width
    # patch on the front crown, slightly squashed for curvature
    pw = int(0.215 * W)
    ph = int(pw * 0.92)
    p = patch.resize((pw, ph), Image.LANCZOS)
    px = W // 2 - pw // 2
    py = int((base - 0.12) * W) - ph // 2
    # drop shadow
    shadow = Image.new("RGBA", p.size, (0, 0, 0, 0))
    shadow.putalpha(p.getchannel("A").point(lambda v: v * 0.25))
    out.alpha_composite(shadow, (px + int(4 * scale), py + int(6 * scale)))
    out.alpha_composite(p, (px, py))

    # tiny side embroidery on the right panel
    d = ImageDraw.Draw(out)
    f = font(os.path.join(os.path.dirname(HERE), "SpaceGrotesk.ttf"), int(34 * scale), 700)
    txt = "HOYDICH"
    tw = int(d.textlength(txt, font=f))
    tmp = Image.new("RGBA", (tw + 8, int(50 * scale)), (0, 0, 0, 0))
    ImageDraw.Draw(tmp).text((0, 0), txt, font=f, fill=(*COBALT, 255))
    tmp = tmp.rotate(-14, expand=True, resample=Image.BICUBIC)
    out.alpha_composite(tmp, (int(W * (0.5 + 0.175)), int((base - 0.06) * W)))
    return out.convert("RGB")


def gif(scale, frames, fps, out):
    """Looping GIF: rings pulse out of the sun, swell rolls in."""
    base = cap_base(scale)
    psize = int(0.215 * base.width * 1.5)
    imgs = [decorate(base, scale, patch_art(psize, i / frames)) for i in range(frames)]
    # cap shading tones + the exact thread colours, so no thread goes muddy
    tones = base.convert("RGB").quantize(colors=96, method=Image.MEDIANCUT)
    cols = tones.getpalette()[:96 * 3]
    for c in (NAVY, CREAM, GOLD, ORANGE, CORAL, SKY, COBALT, MINT):
        cols += list(c)
    pal = Image.new("P", (1, 1))
    pal.putpalette(cols + [0] * (768 - len(cols)))
    q = [im.quantize(palette=pal, dither=Image.NONE) for im in imgs]
    q[0].save(out, save_all=True, append_images=q[1:], loop=0,
              duration=int(1000 / fps), optimize=True, disposal=1)
    print("wrote", out, f"{os.path.getsize(out) / 1e6:.1f} MB")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--outdir", default=HERE)
    ap.add_argument("--gif", action="store_true", help="render hat-loop.gif instead")
    ap.add_argument("--frames", type=int, default=48)
    ap.add_argument("--fps", type=int, default=16)
    a = ap.parse_args()
    if a.gif:
        gif(a.scale if a.scale != 1.0 else 0.4, a.frames, a.fps,
            os.path.join(a.outdir, "hat-loop.gif"))
        sys.exit()
    patch = patch_art(int(1200 * max(a.scale, 0.5)))
    patch.save(os.path.join(a.outdir, "hat-patch.png"))
    mockup(a.scale, patch).save(os.path.join(a.outdir, "hat-mockup.png"))
    print("wrote", a.outdir)
