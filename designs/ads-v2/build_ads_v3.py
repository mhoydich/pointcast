#!/usr/bin/env python3
"""
PointCast Ads — Second Pass v3 (final polish)
Real Noun SVGs from noun.pics composited with Pillow
"""

import os
import math
import io
import cairosvg
from PIL import Image, ImageDraw, ImageFont

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE = "/home/ubuntu/pointcast_ads"
NOUNS = f"{BASE}/nouns"
FONTS = f"{BASE}/fonts"
OUT   = f"{BASE}/output"
os.makedirs(OUT, exist_ok=True)

# ─── Brand Palette ────────────────────────────────────────────────────────────
def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

C_CREAM  = hex2rgb("f6f2e8")
C_INK    = hex2rgb("1a1813")
C_TERRA  = hex2rgb("c94d2c")
C_SOFT   = hex2rgb("c26a4a")
C_DARK   = hex2rgb("1a1510")

# ─── Font helpers ─────────────────────────────────────────────────────────────
FONT_FILES = {
    ("JetBrains Mono", "normal", 400): f"{FONTS}/ef66fbb1.ttf",
    ("JetBrains Mono", "normal", 700): f"{FONTS}/7be4b885.ttf",
    ("Lora", "italic", 400):           f"{FONTS}/44048c9f.ttf",
    ("Lora", "italic", 700):           f"{FONTS}/30214c21.ttf",
    ("Lora", "normal", 400):           f"{FONTS}/73534c3b.ttf",
    ("Lora", "normal", 700):           f"{FONTS}/5ef18c55.ttf",
    ("Outfit", "normal", 400):         f"{FONTS}/a60f908a.ttf",
    ("Outfit", "normal", 700):         f"{FONTS}/b6c097ec.ttf",
}

def get_font(family, size, style="normal", weight=400):
    key = (family, style, weight)
    path = FONT_FILES.get(key)
    if path and os.path.exists(path):
        return ImageFont.truetype(path, size)
    for k, p in FONT_FILES.items():
        if k[0] == family and os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def lora(size, italic=False, bold=False):
    return get_font("Lora", size, "italic" if italic else "normal", 700 if bold else 400)

def mono(size, bold=False):
    return get_font("JetBrains Mono", size, "normal", 700 if bold else 400)

def outfit(size, bold=False):
    return get_font("Outfit", size, "normal", 700 if bold else 400)

# ─── Noun loader ──────────────────────────────────────────────────────────────
_noun_cache = {}

def load_noun(noun_id, size):
    key = (noun_id, size)
    if key in _noun_cache:
        return _noun_cache[key]
    png_data = cairosvg.svg2png(url=f"{NOUNS}/{noun_id}.svg", output_width=size, output_height=size)
    img = Image.open(io.BytesIO(png_data)).convert("RGBA")
    _noun_cache[key] = img
    return img

# ─── Drawing helpers ──────────────────────────────────────────────────────────

def tw(draw, text, font):
    b = draw.textbbox((0, 0), text, font=font)
    return b[2] - b[0], b[3] - b[1]

def draw_centered(draw, text, font, y, W, color, ls=0):
    if ls == 0:
        w, _ = tw(draw, text, font)
        draw.text(((W - w) // 2, y), text, font=font, fill=color)
    else:
        chars = list(text)
        widths = [tw(draw, c, font)[0] for c in chars]
        total = sum(widths) + ls * (len(chars) - 1)
        x = (W - total) // 2
        for c, cw in zip(chars, widths):
            draw.text((x, y), c, font=font, fill=color)
            x += cw + ls

def draw_arcs(img, cx, cy, n=7, max_r=400, color=None, lw=2, sa=195, ea=345):
    if color is None:
        color = C_TERRA
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(n):
        r = int(max_r * (i + 1) / n)
        alpha = max(10, 160 - i * 20)
        d.arc([cx - r, cy - r, cx + r, cy + r], start=sa, end=ea,
              fill=color + (alpha,), width=lw)
    return Image.alpha_composite(img, layer)

def corner_dots(draw, x0, y0, x1, y1, r=8):
    for (cx, cy), col in zip([(x0,y0),(x1,y0),(x0,y1),(x1,y1)],
                              [C_TERRA, C_INK, C_INK, C_TERRA]):
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=col)

def on_air(img, x, y, fs=18):
    draw = ImageDraw.Draw(img)
    f = mono(fs, bold=True)
    text = "ON AIR"
    b = draw.textbbox((0, 0), text, font=f)
    tw_, th = b[2]-b[0], b[3]-b[1]
    px, py, dr = 14, 8, 6
    pw = tw_ + px*2 + dr*2 + 10
    ph = th + py*2
    draw.rounded_rectangle([x, y, x+pw, y+ph], radius=ph//2, fill=C_INK)
    dcx = x + px + dr
    dcy = y + ph//2
    draw.ellipse([dcx-dr, dcy-dr, dcx+dr, dcy+dr], fill=C_TERRA)
    draw.text((dcx+dr+8, y+py-1), text, font=f, fill=C_CREAM)

def wordmark(draw, x, y, fs=60, cm=None, cd=None):
    if cm is None: cm = C_INK
    if cd is None: cd = C_TERRA
    fi = lora(fs, italic=True, bold=True)
    fd = lora(fs, italic=False, bold=True)
    draw.text((x, y), "Point", font=fi, fill=cm)
    b1 = draw.textbbox((x, y), "Point", font=fi)
    x2 = b1[2]
    draw.text((x2, y), "\u00b7", font=fd, fill=cd)
    b2 = draw.textbbox((x2, y), "\u00b7", font=fd)
    x3 = b2[2]
    draw.text((x3, y), "Cast", font=fi, fill=cm)
    b3 = draw.textbbox((x3, y), "Cast", font=fi)
    return b3[2] - x

def wm_width(fs):
    tmp = Image.new("RGBA", (2000, 400))
    d = ImageDraw.Draw(tmp)
    fi = lora(fs, italic=True, bold=True)
    fd = lora(fs, italic=False, bold=True)
    b1 = d.textbbox((0,0),"Point",font=fi)
    b2 = d.textbbox((0,0),"\u00b7",font=fd)
    b3 = d.textbbox((0,0),"Cast",font=fi)
    return (b1[2]-b1[0])+(b2[2]-b2[0])+(b3[2]-b3[0])

def paste_noun(img, nid, size, x, y, center=False):
    n = load_noun(nid, size)
    if center:
        x -= size//2; y -= size//2
    img.paste(n, (x, y), n)

def hline(draw, x0, x1, y, color=None, w=1, width=None):
    if color is None: color = C_INK
    if width is not None: w = width
    draw.line([(x0,y),(x1,y)], fill=color, width=w)

def thick_rule(draw, x0, x1, y):
    draw.line([(x0,y),(x1,y)], fill=C_INK, width=4)
    draw.line([(x0,y+3),(x1,y+3)], fill=C_INK, width=1)

def wrap(draw, text, font, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = (cur+" "+w).strip()
        b = draw.textbbox((0,0), test, font=font)
        if b[2]-b[0] > max_w:
            if cur: lines.append(cur)
            cur = w
        else:
            cur = test
    if cur: lines.append(cur)
    return lines


# ═══════════════════════════════════════════════════════════════════════════════
# AD 1 — 1080×1080 Instagram Square: THE DRUM ROOM
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad1():
    W, H = 1080, 1080
    img = Image.new("RGBA", (W, H), C_CREAM)
    draw = ImageDraw.Draw(img)
    m = 32

    # Border + corners
    draw.rectangle([m, m, W-m, H-m], outline=C_INK, width=3)
    corner_dots(draw, m, m, W-m, H-m, r=10)

    # Title
    f_title = lora(76, italic=True)
    draw_centered(draw, "Tap together.", f_title, 52, W, C_INK)

    # Rule
    hline(draw, m+20, W-m-20, 152, width=2)

    # 2×2 grid
    noun_ids = [42, 272, 672, 901]
    labels   = ["KICK", "SNARE", "HI-HAT", "BELL"]
    label_colors = [C_TERRA, C_INK, C_INK, C_TERRA]
    noun_size = 300
    grid_top = 162
    cell_w = (W - 2*m) // 2
    cell_h = 370

    for i, (nid, label, lc) in enumerate(zip(noun_ids, labels, label_colors)):
        col = i % 2
        row = i // 2
        cx0 = m + col * cell_w
        cy0 = grid_top + row * cell_h
        cx1 = cx0 + cell_w
        cy1 = cy0 + cell_h

        # Cell bg
        bg = (246, 242, 232) if (col+row)%2==0 else (238, 232, 218)
        draw.rectangle([cx0, cy0, cx1, cy1], fill=bg)
        draw.rectangle([cx0, cy0, cx1, cy1], outline=C_INK, width=1)

        # Noun: centered in upper portion of cell
        noun_area_h = cell_h - 56
        ncx = cx0 + cell_w // 2
        ncy = cy0 + noun_area_h // 2
        paste_noun(img, nid, noun_size, ncx, ncy, center=True)

        # Label bar at bottom of cell
        bar_y = cy1 - 52
        draw.rectangle([cx0, bar_y, cx1, cy1], fill=lc)

        # Label text centered within THIS cell
        f_lbl = mono(21, bold=True)
        lw, lh = tw(draw, label, f_lbl)
        lx = cx0 + (cell_w - lw) // 2
        ly = bar_y + (52 - lh) // 2
        draw.text((lx, ly), label, font=f_lbl, fill=C_CREAM)

    # Bottom strip
    strip_y = grid_top + 2*cell_h + 8
    draw.rectangle([m, strip_y, W-m, H-m], fill=C_INK)
    draw_centered(draw, "POINTCAST.XYZ", mono(24, bold=True), strip_y+12, W, C_CREAM, ls=4)
    draw_centered(draw, "D R U M", mono(16), strip_y+46, W, C_TERRA, ls=10)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# AD 2 — 1080×1920 Instagram Story: BROADCAST YOURSELF
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad2():
    W, H = 1080, 1920
    img = Image.new("RGBA", (W, H), C_CREAM)

    # Very subtle warm tint at bottom
    g = Image.new("RGBA", (W, H), (0,0,0,0))
    gd = ImageDraw.Draw(g)
    for y in range(H):
        t = max(0, (y - H*0.65) / (H*0.35))
        gd.line([(0,y),(W,y)], fill=C_TERRA+(int(14*t),))
    img = Image.alpha_composite(img, g)

    # Broadcast arcs
    arc_cx, arc_cy = W//2, int(H*0.42)
    img = draw_arcs(img, arc_cx, arc_cy, n=8, max_r=640, lw=2, sa=195, ea=345)

    draw = ImageDraw.Draw(img)
    m = 40

    # Border
    draw.rectangle([m, m, W-m, H-m], outline=C_INK, width=3)
    corner_dots(draw, m, m, W-m, H-m, r=12)

    # ON AIR
    on_air(img, W-m-215, m+28, fs=22)

    # Top kicker
    draw = ImageDraw.Draw(img)
    draw_centered(draw, "A PERSONAL SIGNAL FROM THE OPEN WEB",
                  mono(20, bold=True), m+28, W, C_TERRA, ls=2)
    hline(draw, m+30, W-m-30, m+76, width=1)

    # Big Noun
    noun_size = 580
    paste_noun(img, 567, noun_size, arc_cx, arc_cy, center=True)

    draw = ImageDraw.Draw(img)

    # "Broadcast yourself."
    text_y = arc_cy + noun_size//2 + 55
    f_main = lora(96, italic=True)
    draw_centered(draw, "Broadcast", f_main, text_y, W, C_INK)
    draw_centered(draw, "yourself.", f_main, text_y+112, W, C_INK)

    # Terracotta rule
    rule_y = text_y + 238
    draw.line([(W//2-220, rule_y),(W//2+220, rule_y)], fill=C_TERRA, width=2)

    # Bottom strip
    strip_y = H-m-115
    draw.rectangle([m, strip_y, W-m, H-m], fill=C_INK)
    draw_centered(draw, "POINTCAST.XYZ", mono(28, bold=True), strip_y+34, W, C_CREAM, ls=5)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# AD 3 — 1500×500 Twitter/Farcaster Banner: NOW BROADCASTING
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad3():
    W, H = 1500, 500
    img = Image.new("RGBA", (W, H), C_CREAM)
    draw = ImageDraw.Draw(img)

    # Top strip
    sh = 50
    draw.rectangle([0, 0, W, sh], fill=C_INK)
    draw_centered(draw, "VOL. 01 · NO. 01 · NOW BROADCASTING FROM THE OPEN WEB",
                  mono(18, bold=True), 15, W, C_CREAM, ls=2)

    m = 28
    ct = sh + 12

    # Left: arcs + wordmark
    arc_cx, arc_cy = m+30, ct + (H-ct)//2
    img = draw_arcs(img, arc_cx, arc_cy, n=5, max_r=260, lw=2, sa=200, ea=340)
    draw = ImageDraw.Draw(img)

    wm_y = ct + 28
    wordmark(draw, m+10, wm_y, fs=52)
    draw.text((m+10, wm_y+70), "Broadcast yourself.", font=outfit(18), fill=C_SOFT)

    # Divider
    div_x = 400
    draw.line([(div_x, ct+10),(div_x, H-m-10)], fill=C_INK, width=2)

    # 5 Nouns
    noun_ids = [127, 272, 455, 672, 787]
    noun_size = 215
    right_w = W - div_x - m - 210
    spacing = right_w // 5
    ny_center = ct + (H-ct-m)//2

    for i, nid in enumerate(noun_ids):
        nx = div_x + 20 + i*spacing + spacing//2
        paste_noun(img, nid, noun_size, nx, ny_center, center=True)

    # ON AIR
    on_air(img, W-m-198, sh+18, fs=18)

    # Frame
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, sh, W-1, H-1], outline=C_INK, width=2)
    draw.line([(0, H-4),(W, H-4)], fill=C_TERRA, width=3)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# AD 4 — 1200×1500 Poster: THE TIMES YOU MISSED
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad4():
    W, H = 1200, 1500
    img = Image.new("RGBA", (W, H), C_CREAM)
    draw = ImageDraw.Draw(img)
    m = 48
    y = m

    # Double border
    draw.rectangle([m-8, m-8, W-m+8, H-m+8], outline=C_INK, width=1)
    draw.rectangle([m, m, W-m, H-m], outline=C_INK, width=3)
    corner_dots(draw, m, m, W-m, H-m, r=10)

    y += 20
    draw_centered(draw, "THE OPEN WEB GAZETTE  ·  EDITION NO. 1  ·  POINTCAST.XYZ",
                  mono(16, bold=True), y, W, C_TERRA, ls=2)
    y += 38
    thick_rule(draw, m+10, W-m-10, y)
    y += 16

    # Masthead
    draw_centered(draw, "POINTCAST", lora(116, bold=True), y, W, C_INK)
    y += 130

    thick_rule(draw, m+10, W-m-10, y)
    y += 6
    hline(draw, m+10, W-m-10, y+4)
    y += 20

    draw_centered(draw, "THE TIMES YOU MISSED", mono(24, bold=True), y, W, C_INK, ls=5)
    y += 50
    hline(draw, m+10, W-m-10, y)
    y += 22

    # 4 columns
    cols_data = [
        (42,  "THE DRUM ROOM",    "Four walls, one groove. The rhythm section never sleeps."),
        (127, "VIOLENT CRIMES",   "A dispatch from the edge. The story they didn't want told."),
        (567, "NOUNS GENERATOR",  "Pixel by pixel, a new face emerges from the on-chain ether."),
        (672, "HAPPY FRIDAY",     "End-of-week transmissions from the open web. Tune in."),
    ]
    gap = 18
    n_cols = 4
    col_w = (W - 2*m - (n_cols-1)*gap) // n_cols
    noun_size = 195
    col_h = 640
    col_y0 = y

    for i, (nid, headline, body) in enumerate(cols_data):
        cx = m + i*(col_w+gap)
        draw.rectangle([cx, col_y0, cx+col_w, col_y0+col_h], outline=C_INK, width=1)

        # Noun
        nx = cx + (col_w-noun_size)//2
        ny = col_y0 + 18
        paste_noun(img, nid, noun_size, nx, ny)
        hline(draw, cx+8, cx+col_w-8, ny+noun_size+12)

        # Headline
        f_h = lora(28, bold=True)
        head_lines = wrap(draw, headline, f_h, col_w-16)
        hy = ny+noun_size+24
        for line in head_lines:
            lw_, _ = tw(draw, line, f_h)
            draw.text((cx+(col_w-lw_)//2, hy), line, font=f_h, fill=C_INK)
            hy += 34
        hline(draw, cx+8, cx+col_w-8, hy+4, color=C_TERRA)
        hy += 16

        # Body
        f_b = outfit(17)
        for line in wrap(draw, body, f_b, col_w-16):
            draw.text((cx+8, hy), line, font=f_b, fill=C_INK)
            hy += 24

        # Column number
        draw.text((cx+col_w-28, col_y0+col_h-28), f"0{i+1}", font=mono(14), fill=C_SOFT)

    y = col_y0 + col_h + 20
    thick_rule(draw, m+10, W-m-10, y)
    y += 22

    draw_centered(draw, "pointcast.xyz", lora(88, italic=True), y, W, C_INK)
    y += 106
    hline(draw, m+10, W-m-10, y)
    y += 18
    draw_centered(draw, "WELCOME ABOARD", mono(26, bold=True), y, W, C_TERRA, ls=6)

    # Bottom bar
    bar_y = H-m-36
    draw.rectangle([m, bar_y, W-m, H-m], fill=C_TERRA)
    draw_centered(draw, "BROADCAST · DISCOVER · CONNECT · POINTCAST.XYZ",
                  mono(14, bold=True), bar_y+10, W, C_CREAM, ls=2)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# AD 5 — 1080×1080 Die-cut Sticker: /901.svg
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad5():
    W, H = 1080, 1080
    img = Image.new("RGBA", (W, H), C_CREAM)
    draw = ImageDraw.Draw(img)

    cx, cy = W//2, H//2
    outer_r = 492
    inner_r = 432
    ring_r  = 462

    # Outer ink circle
    draw.ellipse([cx-outer_r, cy-outer_r, cx+outer_r, cy+outer_r], fill=C_INK)
    # Inner cream circle
    draw.ellipse([cx-inner_r, cy-inner_r, cx+inner_r, cy+inner_r], fill=C_CREAM)
    # Terracotta ring
    draw.ellipse([cx-ring_r, cy-ring_r, cx+ring_r, cy+ring_r], outline=C_TERRA, width=5)

    # Ring text — ASCII only for reliable rendering
    ring_text = "* POINTCAST.XYZ * BROADCAST YOURSELF * NOUNS DAO *"
    f_ring = mono(24, bold=True)
    chars = list(ring_text)
    n = len(chars)
    angle_step = 360 / n
    start_angle = -90

    for i, c in enumerate(chars):
        angle_deg = start_angle + i * angle_step
        angle_rad = math.radians(angle_deg)
        rx = cx + ring_r * math.cos(angle_rad)
        ry = cy + ring_r * math.sin(angle_rad)

        char_img = Image.new("RGBA", (80, 80), (0,0,0,0))
        char_draw = ImageDraw.Draw(char_img)
        char_draw.text((10, 10), c, font=f_ring, fill=C_CREAM)
        rot = angle_deg + 90
        char_img = char_img.rotate(-rot, expand=True, resample=Image.BICUBIC)
        px = int(rx - char_img.width//2)
        py = int(ry - char_img.height//2)
        img.paste(char_img, (px, py), char_img)

    # Noun clipped to inner circle
    noun_size = 660
    noun_img = load_noun(901, noun_size)

    # Create circular clip mask
    clip_mask = Image.new("L", (noun_size, noun_size), 0)
    clip_draw = ImageDraw.Draw(clip_mask)
    # The inner circle has radius inner_r; noun_size > inner_r*2 so we clip
    pad = (noun_size - inner_r*2) // 2
    clip_draw.ellipse([pad, pad, noun_size-pad, noun_size-pad], fill=255)
    noun_img.putalpha(clip_mask)

    nx = cx - noun_size//2
    ny = cy - noun_size//2
    img.paste(noun_img, (nx, ny), noun_img)

    # CC0 attribution inside circle at bottom
    draw = ImageDraw.Draw(img)
    draw_centered(draw, "CC0 - NOUNS DAO", mono(15), cy+inner_r-42, W, C_SOFT)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# AD 6 — 2560×1440 Desktop Wallpaper
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad6():
    W, H = 2560, 1440
    img = Image.new("RGBA", (W, H), C_DARK)
    draw = ImageDraw.Draw(img)

    # Dark warm gradient
    for y in range(H):
        t = y / H
        r = int(C_DARK[0] + (50-C_DARK[0])*t*0.35)
        g = int(C_DARK[1] + (30-C_DARK[1])*t*0.35)
        b = int(C_DARK[2] + (12-C_DARK[2])*t*0.35)
        draw.line([(0,y),(W,y)], fill=(r,g,b,255))

    cx, cy = W//2, H//2

    # Broadcast arcs
    img = draw_arcs(img, cx, cy-60, n=12, max_r=1400, lw=3, sa=195, ea=345)
    draw = ImageDraw.Draw(img)

    # Subtle grid
    for gx in range(0, W, 320):
        draw.line([(gx,0),(gx,H)], fill=(255,255,255,5))
    for gy in range(0, H, 180):
        draw.line([(0,gy),(W,gy)], fill=(255,255,255,5))

    # Wordmark
    fs = 190
    ww = wm_width(fs)
    wx = (W-ww)//2
    wy = cy - 120
    wordmark(draw, wx, wy, fs=fs, cm=C_CREAM, cd=C_TERRA)

    # Tagline
    draw_centered(draw, "Broadcast yourself.", outfit(44), wy+220, W, C_SOFT)

    # Rule
    ry = wy+282
    draw.line([(cx-420, ry),(cx+420, ry)], fill=C_TERRA, width=2)

    # URL
    draw_centered(draw, "POINTCAST.XYZ", mono(30, bold=True), ry+18, W, C_CREAM, ls=5)

    # ON AIR
    on_air(img, W-300, 52, fs=28)

    # Noun mascot
    noun_size = 300
    paste_noun(img, 672, noun_size, W-noun_size-70, H-noun_size-70)

    # Corner dots
    draw = ImageDraw.Draw(img)
    corner_dots(draw, 60, 60, W-60, H-60, r=14)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    ads = [
        ("Ad 1: THE DRUM ROOM (1080×1080)",         build_ad1, "ad1_drum_room_1080x1080.png"),
        ("Ad 2: BROADCAST YOURSELF (1080×1920)",    build_ad2, "ad2_broadcast_yourself_1080x1920.png"),
        ("Ad 3: NOW BROADCASTING (1500×500)",       build_ad3, "ad3_now_broadcasting_1500x500.png"),
        ("Ad 4: THE TIMES YOU MISSED (1200×1500)",  build_ad4, "ad4_times_you_missed_1200x1500.png"),
        ("Ad 5: DIE-CUT STICKER (1080×1080)",       build_ad5, "ad5_sticker_1080x1080.png"),
        ("Ad 6: DESKTOP WALLPAPER (2560×1440)",     build_ad6, "ad6_wallpaper_2560x1440.png"),
    ]
    for label, fn, filename in ads:
        print(f"Building {label}...")
        result = fn()
        result.save(f"{OUT}/{filename}")
        print(f"  Saved → {filename}")
    print("\nAll 6 ads complete!")
