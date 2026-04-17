#!/usr/bin/env python3
"""
PointCast Ads — Second Pass v2 (with fixes)
Real Noun SVGs from noun.pics composited with Pillow
"""

import os
import math
import io
import cairosvg
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE = "/home/ubuntu/pointcast_ads"
NOUNS = f"{BASE}/nouns"
FONTS = f"{BASE}/fonts"
OUT   = f"{BASE}/output"
os.makedirs(OUT, exist_ok=True)

# ─── Brand Palette ────────────────────────────────────────────────────────────
CREAM      = "#f6f2e8"
INK        = "#1a1813"
TERRACOTTA = "#c94d2c"
SOFT_WARM  = "#c26a4a"
DARK_BG    = "#1a1510"

def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

C_CREAM  = hex2rgb(CREAM)
C_INK    = hex2rgb(INK)
C_TERRA  = hex2rgb(TERRACOTTA)
C_SOFT   = hex2rgb(SOFT_WARM)
C_WHITE  = (255, 255, 255)
C_DARK   = hex2rgb(DARK_BG)

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
    style = "italic" if italic else "normal"
    weight = 700 if bold else 400
    return get_font("Lora", size, style, weight)

def mono(size, bold=False):
    weight = 700 if bold else 400
    return get_font("JetBrains Mono", size, "normal", weight)

def outfit(size, bold=False):
    weight = 700 if bold else 400
    return get_font("Outfit", size, "normal", weight)

# ─── Noun loader ──────────────────────────────────────────────────────────────
_noun_cache = {}

def load_noun(noun_id, size):
    key = (noun_id, size)
    if key in _noun_cache:
        return _noun_cache[key]
    svg_path = f"{NOUNS}/{noun_id}.svg"
    png_data = cairosvg.svg2png(url=svg_path, output_width=size, output_height=size)
    img = Image.open(io.BytesIO(png_data)).convert("RGBA")
    _noun_cache[key] = img
    return img

# ─── Drawing helpers ──────────────────────────────────────────────────────────

def text_size(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]

def draw_text_centered(draw, text, font, y, width, color, letter_spacing=0):
    if letter_spacing == 0:
        tw, th = text_size(draw, text, font)
        x = (width - tw) // 2
        draw.text((x, y), text, font=font, fill=color)
    else:
        chars = list(text)
        total_w = 0
        widths = []
        for c in chars:
            bbox = draw.textbbox((0, 0), c, font=font)
            cw = bbox[2] - bbox[0]
            widths.append(cw)
            total_w += cw + letter_spacing
        total_w -= letter_spacing
        x = (width - total_w) // 2
        for c, cw in zip(chars, widths):
            draw.text((x, y), c, font=font, fill=color)
            x += cw + letter_spacing

def draw_broadcast_arcs_on_layer(img, cx, cy, n_arcs=7, max_r=400, color=C_TERRA,
                                  line_width=2, start_ang=195, end_ang=345):
    arc_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    arc_draw = ImageDraw.Draw(arc_layer)
    for i in range(n_arcs):
        r = int(max_r * (i + 1) / n_arcs)
        alpha = max(12, 160 - i * 20)
        arc_draw.arc([cx - r, cy - r, cx + r, cy + r],
                     start=start_ang, end=end_ang,
                     fill=color + (alpha,), width=line_width)
    return Image.alpha_composite(img, arc_layer)

def draw_corner_dots(draw, x0, y0, x1, y1, dot_r=8):
    corners = [(x0, y0), (x1, y0), (x0, y1), (x1, y1)]
    colors  = [C_TERRA, C_INK, C_INK, C_TERRA]
    for (cx, cy), col in zip(corners, colors):
        draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=col)

def draw_on_air_badge(img, x, y, font_size=18):
    draw = ImageDraw.Draw(img)
    f = mono(font_size, bold=True)
    text = "ON AIR"
    bbox = draw.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad_x, pad_y = 14, 8
    dot_r = 6
    pill_w = tw + pad_x * 2 + dot_r * 2 + 10
    pill_h = th + pad_y * 2
    draw.rounded_rectangle([x, y, x + pill_w, y + pill_h], radius=pill_h//2, fill=C_INK)
    dot_cx = x + pad_x + dot_r
    dot_cy = y + pill_h // 2
    draw.ellipse([dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r], fill=C_TERRA)
    tx = dot_cx + dot_r + 8
    ty = y + pad_y - 1
    draw.text((tx, ty), text, font=f, fill=C_CREAM)

def draw_wordmark(draw, x, y, font_size=60, color_main=C_INK, color_dot=C_TERRA):
    f = lora(font_size, italic=True, bold=True)
    f_dot = lora(font_size, italic=False, bold=True)
    draw.text((x, y), "Point", font=f, fill=color_main)
    bbox = draw.textbbox((x, y), "Point", font=f)
    x2 = bbox[2]
    draw.text((x2, y), "\u00b7", font=f_dot, fill=color_dot)
    bbox2 = draw.textbbox((x2, y), "\u00b7", font=f_dot)
    x3 = bbox2[2]
    draw.text((x3, y), "Cast", font=f, fill=color_main)
    bbox3 = draw.textbbox((x3, y), "Cast", font=f)
    return bbox3[2] - x

def wordmark_width(font_size):
    tmp = Image.new("RGBA", (2000, 400))
    d = ImageDraw.Draw(tmp)
    f = lora(font_size, italic=True, bold=True)
    f_dot = lora(font_size, italic=False, bold=True)
    b1 = d.textbbox((0, 0), "Point", font=f)
    b2 = d.textbbox((0, 0), "\u00b7", font=f_dot)
    b3 = d.textbbox((0, 0), "Cast", font=f)
    return (b1[2] - b1[0]) + (b2[2] - b2[0]) + (b3[2] - b3[0])

def paste_noun(img, noun_id, size, x, y, center=False):
    noun = load_noun(noun_id, size)
    if center:
        x = x - size // 2
        y = y - size // 2
    img.paste(noun, (x, y), noun)

def draw_ruled_line(draw, x0, x1, y, color=C_INK, width=1):
    draw.line([(x0, y), (x1, y)], fill=color, width=width)

def draw_thick_rule(draw, x0, x1, y, color=C_INK):
    draw.line([(x0, y), (x1, y)], fill=color, width=4)
    draw.line([(x0, y + 3), (x1, y + 3)], fill=color, width=1)

def wrap_text(draw, text, font, max_width):
    words = text.split()
    lines = []
    current = ""
    for w in words:
        test = (current + " " + w).strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] > max_width:
            if current:
                lines.append(current)
            current = w
        else:
            current = test
    if current:
        lines.append(current)
    return lines


# ═══════════════════════════════════════════════════════════════════════════════
# AD 1 — 1080×1080 Instagram Square: THE DRUM ROOM
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad1():
    W, H = 1080, 1080
    img = Image.new("RGBA", (W, H), C_CREAM)
    draw = ImageDraw.Draw(img)

    margin = 32

    # Outer border
    draw.rectangle([margin, margin, W - margin, H - margin], outline=C_INK, width=3)
    draw_corner_dots(draw, margin, margin, W - margin, H - margin, dot_r=10)

    # Top: "Tap together." italic serif
    f_top = lora(76, italic=True, bold=False)
    draw_text_centered(draw, "Tap together.", f_top, 55, W, C_INK)

    # Rule below title
    draw_ruled_line(draw, margin + 20, W - margin - 20, 155, C_INK, width=2)

    # 2×2 Noun grid
    noun_ids = [42, 272, 672, 901]
    labels   = ["KICK", "SNARE", "HI-HAT", "BELL"]
    noun_size = 320
    grid_top = 168
    cell_w = (W - 2 * margin) // 2
    cell_h = 380  # height per cell including label

    for i, (nid, label) in enumerate(zip(noun_ids, labels)):
        col = i % 2
        row = i // 2
        cell_x0 = margin + col * cell_w
        cell_y0 = grid_top + row * cell_h
        cell_x1 = cell_x0 + cell_w
        cell_y1 = cell_y0 + cell_h

        # Cell bg
        bg_col = (246, 242, 232, 255) if (col + row) % 2 == 0 else (238, 232, 218, 255)
        draw.rectangle([cell_x0, cell_y0, cell_x1, cell_y1], fill=bg_col)
        draw.rectangle([cell_x0, cell_y0, cell_x1, cell_y1], outline=C_INK, width=1)

        # Noun centered in cell, leaving room for label at bottom
        noun_area_h = cell_h - 52  # reserve 52px for label
        noun_cx = cell_x0 + cell_w // 2
        noun_cy = cell_y0 + noun_area_h // 2

        paste_noun(img, nid, noun_size, noun_cx, noun_cy, center=True)

        # Label strip at bottom of cell
        label_y0 = cell_y1 - 48
        draw.rectangle([cell_x0, label_y0, cell_x1, cell_y1],
                       fill=C_TERRA if (col + row) % 2 == 0 else C_INK)
        f_label = mono(20, bold=True)
        label_color = C_CREAM
        draw_text_centered(draw, label, f_label, label_y0 + 14, W, label_color, letter_spacing=3)
        # Re-center within cell (not full width)
        # Redo: center within cell
        bbox = draw.textbbox((0, 0), label, font=f_label)
        lw = bbox[2] - bbox[0]
        lx = cell_x0 + (cell_w - lw) // 2
        # clear and redraw centered in cell
        draw.rectangle([cell_x0, label_y0, cell_x1, cell_y1],
                       fill=C_TERRA if (col + row) % 2 == 0 else C_INK)
        draw.text((lx, label_y0 + 14), label, font=f_label, fill=label_color)

    # Bottom strip
    strip_y = grid_top + 2 * cell_h + 8
    draw.rectangle([margin, strip_y, W - margin, H - margin], fill=C_INK)
    f_bottom = mono(24, bold=True)
    draw_text_centered(draw, "POINTCAST.XYZ", f_bottom, strip_y + 12, W, C_CREAM, letter_spacing=4)
    f_drum = mono(16, bold=False)
    draw_text_centered(draw, "D R U M", f_drum, strip_y + 46, W, C_TERRA, letter_spacing=10)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# AD 2 — 1080×1920 Instagram Story: BROADCAST YOURSELF
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad2():
    W, H = 1080, 1920
    img = Image.new("RGBA", (W, H), C_CREAM)

    # Subtle warm tint at bottom (very light)
    gradient = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(gradient)
    for y in range(H):
        t = max(0, (y - H * 0.6) / (H * 0.4))
        alpha = int(18 * t)
        g_draw.line([(0, y), (W, y)], fill=C_TERRA + (alpha,))
    img = Image.alpha_composite(img, gradient)

    # Broadcast arcs centered at ~45% height
    arc_cx = W // 2
    arc_cy = int(H * 0.44)
    img = draw_broadcast_arcs_on_layer(img, arc_cx, arc_cy, n_arcs=8, max_r=620,
                                        line_width=2, start_ang=195, end_ang=345)

    draw = ImageDraw.Draw(img)
    margin = 40

    # Outer border
    draw.rectangle([margin, margin, W - margin, H - margin], outline=C_INK, width=3)
    draw_corner_dots(draw, margin, margin, W - margin, H - margin, dot_r=12)

    # ON AIR badge top right
    draw_on_air_badge(img, W - margin - 210, margin + 28, font_size=22)

    # Top kicker
    f_kicker = mono(20, bold=True)
    kicker = "A PERSONAL SIGNAL FROM THE OPEN WEB"
    draw = ImageDraw.Draw(img)
    draw_text_centered(draw, kicker, f_kicker, margin + 28, W, C_TERRA, letter_spacing=2)

    # Rule
    draw_ruled_line(draw, margin + 30, W - margin - 30, margin + 75, C_INK, width=1)

    # Big Noun centered
    noun_size = 580
    paste_noun(img, 567, noun_size, arc_cx, arc_cy, center=True)

    draw = ImageDraw.Draw(img)

    # "Broadcast yourself." italic serif — positioned below noun
    text_y = arc_cy + noun_size // 2 + 50
    f_main = lora(92, italic=True, bold=False)
    draw_text_centered(draw, "Broadcast", f_main, text_y, W, C_INK)
    draw_text_centered(draw, "yourself.", f_main, text_y + 108, W, C_INK)

    # Thin terracotta rule
    rule_y = text_y + 230
    draw.line([(W // 2 - 200, rule_y), (W // 2 + 200, rule_y)], fill=C_TERRA, width=2)

    # Bottom wordmark strip
    strip_y = H - margin - 110
    draw.rectangle([margin, strip_y, W - margin, H - margin], fill=C_INK)
    f_wm = mono(28, bold=True)
    draw_text_centered(draw, "POINTCAST.XYZ", f_wm, strip_y + 32, W, C_CREAM, letter_spacing=5)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# AD 3 — 1500×500 Twitter/Farcaster Banner: NOW BROADCASTING
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad3():
    W, H = 1500, 500
    img = Image.new("RGBA", (W, H), C_CREAM)
    draw = ImageDraw.Draw(img)

    # Top mono strip
    strip_h = 50
    draw.rectangle([0, 0, W, strip_h], fill=C_INK)
    f_strip = mono(18, bold=True)
    strip_text = "VOL. 01 · NO. 01 · NOW BROADCASTING FROM THE OPEN WEB"
    draw_text_centered(draw, strip_text, f_strip, 15, W, C_CREAM, letter_spacing=2)

    content_top = strip_h + 12
    margin = 28

    # Left panel: broadcast arcs + wordmark
    left_panel_w = 380
    arc_cx = margin + 30
    arc_cy = content_top + (H - content_top) // 2

    img = draw_broadcast_arcs_on_layer(img, arc_cx, arc_cy, n_arcs=5, max_r=280,
                                        line_width=2, start_ang=200, end_ang=340)
    draw = ImageDraw.Draw(img)

    # Wordmark
    wm_y = content_top + 30
    wm_size = 52
    draw_wordmark(draw, margin + 10, wm_y, font_size=wm_size)

    # Tagline below wordmark
    f_tag = outfit(18)
    draw.text((margin + 10, wm_y + 70), "Broadcast yourself.", font=f_tag, fill=C_SOFT)

    # Vertical divider
    div_x = left_panel_w + margin
    draw.line([(div_x, content_top + 10), (div_x, H - margin - 10)], fill=C_INK, width=2)

    # 5 Nouns horizontal in right panel
    noun_ids = [127, 272, 455, 672, 787]
    noun_size = 210
    right_w = W - div_x - margin - 220  # leave room for ON AIR badge
    spacing = right_w // 5
    noun_y_center = content_top + (H - content_top - margin) // 2

    for i, nid in enumerate(noun_ids):
        nx = div_x + 20 + i * spacing + spacing // 2
        paste_noun(img, nid, noun_size, nx, noun_y_center, center=True)

    # ON AIR badge right
    draw_on_air_badge(img, W - margin - 195, strip_h + 18, font_size=18)

    # Outer frame
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, strip_h, W - 1, H - 1], outline=C_INK, width=2)
    draw.line([(0, H - 4), (W, H - 4)], fill=C_TERRA, width=3)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# AD 4 — 1200×1500 Poster: THE TIMES YOU MISSED
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad4():
    W, H = 1200, 1500
    img = Image.new("RGBA", (W, H), C_CREAM)
    draw = ImageDraw.Draw(img)

    margin = 48
    y = margin

    # Double outer border
    draw.rectangle([margin - 8, margin - 8, W - margin + 8, H - margin + 8], outline=C_INK, width=1)
    draw.rectangle([margin, margin, W - margin, H - margin], outline=C_INK, width=3)
    draw_corner_dots(draw, margin, margin, W - margin, H - margin, dot_r=10)

    y += 20

    # Top kicker
    f_kicker = mono(16, bold=True)
    kicker = "THE OPEN WEB GAZETTE  ·  EDITION NO. 1  ·  POINTCAST.XYZ"
    draw_text_centered(draw, kicker, f_kicker, y, W, C_TERRA, letter_spacing=2)
    y += 38

    # Thick rule
    draw_thick_rule(draw, margin + 10, W - margin - 10, y)
    y += 16

    # POINTCAST masthead
    f_mast = lora(116, italic=False, bold=True)
    draw_text_centered(draw, "POINTCAST", f_mast, y, W, C_INK)
    y += 128

    # Double rule
    draw_thick_rule(draw, margin + 10, W - margin - 10, y)
    y += 6
    draw_ruled_line(draw, margin + 10, W - margin - 10, y + 4, C_INK, width=1)
    y += 18

    # "THE TIMES YOU MISSED"
    f_sub = mono(24, bold=True)
    draw_text_centered(draw, "THE TIMES YOU MISSED", f_sub, y, W, C_INK, letter_spacing=5)
    y += 48

    draw_ruled_line(draw, margin + 10, W - margin - 10, y, C_INK, width=1)
    y += 22

    # 4 columns layout
    cols_data = [
        (42,  "THE DRUM ROOM",    "Four walls, one groove. The rhythm section never sleeps."),
        (127, "VIOLENT CRIMES",   "A dispatch from the edge. The story they didn't want told."),
        (567, "NOUNS GENERATOR",  "Pixel by pixel, a new face emerges from the on-chain ether."),
        (672, "HAPPY FRIDAY",     "End-of-week transmissions from the open web. Tune in."),
    ]

    col_gap = 18
    n_cols = 4
    col_w = (W - 2 * margin - (n_cols - 1) * col_gap) // n_cols
    noun_size = 190
    col_h = 620
    col_y_start = y

    for i, (nid, headline, body) in enumerate(cols_data):
        cx = margin + i * (col_w + col_gap)

        # Column box
        draw.rectangle([cx, col_y_start, cx + col_w, col_y_start + col_h], outline=C_INK, width=1)

        # Noun icon
        noun_x = cx + (col_w - noun_size) // 2
        noun_y = col_y_start + 18
        paste_noun(img, nid, noun_size, noun_x, noun_y)

        # Rule below noun
        draw_ruled_line(draw, cx + 8, cx + col_w - 8, noun_y + noun_size + 12, C_INK, width=1)

        # Headline
        f_head = lora(28, italic=False, bold=True)
        head_lines = wrap_text(draw, headline, f_head, col_w - 16)
        hy = noun_y + noun_size + 24
        for line in head_lines:
            bbox = draw.textbbox((0, 0), line, font=f_head)
            lw = bbox[2] - bbox[0]
            draw.text((cx + (col_w - lw) // 2, hy), line, font=f_head, fill=C_INK)
            hy += 34

        # Terracotta rule under headline
        draw_ruled_line(draw, cx + 8, cx + col_w - 8, hy + 4, C_TERRA, width=1)
        hy += 16

        # Body text
        f_body = outfit(17)
        body_lines = wrap_text(draw, body, f_body, col_w - 16)
        for line in body_lines:
            draw.text((cx + 8, hy), line, font=f_body, fill=C_INK)
            hy += 24

        # Column number at bottom
        f_num = mono(14)
        num_text = f"0{i+1}"
        draw.text((cx + col_w - 28, col_y_start + col_h - 28), num_text, font=f_num, fill=C_SOFT)

    y = col_y_start + col_h + 20

    # Thick rule
    draw_thick_rule(draw, margin + 10, W - margin - 10, y)
    y += 22

    # Big italic serif URL
    f_url = lora(88, italic=True, bold=False)
    draw_text_centered(draw, "pointcast.xyz", f_url, y, W, C_INK)
    y += 104

    draw_ruled_line(draw, margin + 10, W - margin - 10, y, C_INK, width=1)
    y += 18

    # WELCOME ABOARD
    f_welcome = mono(26, bold=True)
    draw_text_centered(draw, "WELCOME ABOARD", f_welcome, y, W, C_TERRA, letter_spacing=6)
    y += 55

    # Terracotta accent bar at bottom
    bar_y = H - margin - 36
    draw.rectangle([margin, bar_y, W - margin, H - margin], fill=C_TERRA)
    f_bar = mono(14, bold=True)
    draw_text_centered(draw, "BROADCAST · DISCOVER · CONNECT · POINTCAST.XYZ", f_bar,
                       bar_y + 10, W, C_CREAM, letter_spacing=2)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# AD 5 — 1080×1080 Die-cut Sticker: /901.svg
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad5():
    W, H = 1080, 1080
    img = Image.new("RGBA", (W, H), C_CREAM)
    draw = ImageDraw.Draw(img)

    cx, cy = W // 2, H // 2
    outer_r = 492
    inner_r = 432
    ring_r  = 462

    # Outer ink circle
    draw.ellipse([cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r], fill=C_INK)

    # Inner cream circle
    draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r], fill=C_CREAM)

    # Terracotta ring line
    draw.ellipse([cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r],
                 outline=C_TERRA, width=5)

    # Ring text
    ring_text = "✦ POINTCAST.XYZ ✦ BROADCAST YOURSELF ✦"
    f_ring = mono(24, bold=True)
    ring_radius = 450
    chars = list(ring_text)
    n = len(chars)
    angle_step = 360 / n
    start_angle = -90

    for i, c in enumerate(chars):
        angle = math.radians(start_angle + i * angle_step)
        rx = cx + ring_radius * math.cos(angle)
        ry = cy + ring_radius * math.sin(angle)
        char_img = Image.new("RGBA", (60, 60), (0, 0, 0, 0))
        char_draw = ImageDraw.Draw(char_img)
        char_draw.text((5, 5), c, font=f_ring, fill=C_CREAM)
        rot_angle = math.degrees(angle) + 90
        char_img = char_img.rotate(-rot_angle, expand=True, resample=Image.BICUBIC)
        px = int(rx - char_img.width // 2)
        py = int(ry - char_img.height // 2)
        img.paste(char_img, (px, py), char_img)

    # Noun centered — clipped to inner circle
    noun_size = 620
    noun_img = load_noun(901, noun_size)

    # Create circular mask
    mask = Image.new("L", (noun_size, noun_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([0, 0, noun_size, noun_size], fill=255)

    # Apply mask to noun
    noun_rgba = noun_img.copy()
    # Use inner circle radius to clip
    clip_r = inner_r
    clip_mask = Image.new("L", (noun_size, noun_size), 0)
    clip_draw = ImageDraw.Draw(clip_mask)
    margin_clip = (noun_size - 2 * clip_r) // 2
    clip_draw.ellipse([margin_clip, margin_clip, noun_size - margin_clip, noun_size - margin_clip], fill=255)
    noun_rgba.putalpha(clip_mask)

    nx = cx - noun_size // 2
    ny = cy - noun_size // 2
    img.paste(noun_rgba, (nx, ny), noun_rgba)

    # CC0 attribution
    draw = ImageDraw.Draw(img)
    f_attr = mono(15)
    draw_text_centered(draw, "CC0 · NOUNS DAO", f_attr, cy + inner_r - 40, W, C_SOFT)

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
        r = int(C_DARK[0] * (1 - t * 0.3) + 50 * t * 0.3)
        g = int(C_DARK[1] * (1 - t * 0.3) + 30 * t * 0.3)
        b = int(C_DARK[2] * (1 - t * 0.3) + 12 * t * 0.3)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    cx, cy = W // 2, H // 2

    # Concentric broadcast arcs
    img = draw_broadcast_arcs_on_layer(img, cx, cy - 60, n_arcs=12, max_r=1400,
                                        line_width=3, start_ang=195, end_ang=345)
    draw = ImageDraw.Draw(img)

    # Subtle grid
    for gx in range(0, W, 320):
        draw.line([(gx, 0), (gx, H)], fill=(255, 255, 255, 6))
    for gy in range(0, H, 180):
        draw.line([(0, gy), (W, gy)], fill=(255, 255, 255, 6))

    # Huge Point·Cast wordmark
    wm_size = 190
    wm_w = wordmark_width(wm_size)
    wm_x = (W - wm_w) // 2
    wm_y = cy - 120
    draw_wordmark(draw, wm_x, wm_y, font_size=wm_size,
                  color_main=C_CREAM, color_dot=C_TERRA)

    # Tagline
    f_tag = outfit(44)
    draw_text_centered(draw, "Broadcast yourself.", f_tag, wm_y + 220, W, C_SOFT)

    # Terracotta rule
    rule_y = wm_y + 282
    draw.line([(cx - 420, rule_y), (cx + 420, rule_y)], fill=C_TERRA, width=2)

    # URL
    f_url = mono(30, bold=True)
    draw_text_centered(draw, "POINTCAST.XYZ", f_url, rule_y + 18, W, C_CREAM, letter_spacing=5)

    # ON AIR badge top right
    draw_on_air_badge(img, W - 300, 52, font_size=28)

    # Noun mascot bottom-right
    noun_size = 300
    paste_noun(img, 672, noun_size, W - noun_size - 70, H - noun_size - 70)

    # Corner dots
    draw = ImageDraw.Draw(img)
    dot_margin = 60
    draw_corner_dots(draw, dot_margin, dot_margin, W - dot_margin, H - dot_margin, dot_r=14)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    ads = [
        ("Ad 1: THE DRUM ROOM (1080×1080)",          build_ad1, "ad1_drum_room_1080x1080.png"),
        ("Ad 2: BROADCAST YOURSELF (1080×1920)",     build_ad2, "ad2_broadcast_yourself_1080x1920.png"),
        ("Ad 3: NOW BROADCASTING (1500×500)",        build_ad3, "ad3_now_broadcasting_1500x500.png"),
        ("Ad 4: THE TIMES YOU MISSED (1200×1500)",   build_ad4, "ad4_times_you_missed_1200x1500.png"),
        ("Ad 5: DIE-CUT STICKER (1080×1080)",        build_ad5, "ad5_sticker_1080x1080.png"),
        ("Ad 6: DESKTOP WALLPAPER (2560×1440)",      build_ad6, "ad6_wallpaper_2560x1440.png"),
    ]

    for label, fn, filename in ads:
        print(f"Building {label}...")
        result = fn()
        result.save(f"{OUT}/{filename}")
        print(f"  Saved → {filename}")

    print("\nAll 6 ads built successfully!")
