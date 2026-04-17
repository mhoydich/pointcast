#!/usr/bin/env python3
"""
PointCast Ads — Second Pass
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
WHITE      = "#ffffff"
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
# Font file mapping (from Google Fonts download)
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
    # fallback
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
    """Load a Noun SVG and return a PIL Image at given size (square)."""
    key = (noun_id, size)
    if key in _noun_cache:
        return _noun_cache[key]
    svg_path = f"{NOUNS}/{noun_id}.svg"
    png_data = cairosvg.svg2png(url=svg_path, output_width=size, output_height=size)
    img = Image.open(io.BytesIO(png_data)).convert("RGBA")
    _noun_cache[key] = img
    return img

# ─── Drawing helpers ──────────────────────────────────────────────────────────

def draw_text_centered(draw, text, font, y, width, color, letter_spacing=0):
    """Draw horizontally centered text with optional letter spacing."""
    if letter_spacing == 0:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        x = (width - tw) // 2
        draw.text((x, y), text, font=font, fill=color)
    else:
        # Manual letter spacing
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

def draw_broadcast_arcs(draw, cx, cy, n_arcs=5, max_r=300, color=C_TERRA, width=2, alpha_start=200):
    """Draw concentric broadcast arcs (semicircle, opening upward)."""
    for i in range(n_arcs):
        r = int(max_r * (i + 1) / n_arcs)
        alpha = int(alpha_start * (1 - i / n_arcs))
        arc_color = color + (alpha,)
        bbox = [cx - r, cy - r, cx + r, cy + r]
        draw.arc(bbox, start=200, end=340, fill=arc_color, width=width)

def draw_corner_dots(draw, x0, y0, x1, y1, dot_r=8):
    """Draw corner-dot rectangles: warm+ink alternating at corners."""
    corners = [(x0, y0), (x1, y0), (x0, y1), (x1, y1)]
    colors  = [C_TERRA, C_INK, C_INK, C_TERRA]
    for (cx, cy), col in zip(corners, colors):
        draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=col)

def draw_on_air_badge(img, x, y, font_size=18):
    """Draw ON AIR pill badge at position (x,y) top-left."""
    draw = ImageDraw.Draw(img)
    f = mono(font_size, bold=True)
    text = "ON AIR"
    bbox = draw.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad_x, pad_y = 14, 8
    dot_r = 6
    pill_w = tw + pad_x * 2 + dot_r * 2 + 8
    pill_h = th + pad_y * 2
    # pill background
    draw.rounded_rectangle([x, y, x + pill_w, y + pill_h], radius=pill_h//2, fill=C_INK)
    # red dot
    dot_cx = x + pad_x + dot_r
    dot_cy = y + pill_h // 2
    draw.ellipse([dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r], fill=C_TERRA)
    # text
    tx = dot_cx + dot_r + 8
    ty = y + pad_y
    draw.text((tx, ty), text, font=f, fill=C_CREAM)

def draw_wordmark(draw, x, y, font_size=60, color_main=C_INK, color_dot=C_TERRA):
    """Draw Point·Cast wordmark with terracotta dot separator."""
    f = lora(font_size, italic=True, bold=True)
    f_dot = lora(font_size, italic=False, bold=True)
    # "Point"
    draw.text((x, y), "Point", font=f, fill=color_main)
    bbox = draw.textbbox((x, y), "Point", font=f)
    x2 = bbox[2]
    # "·"
    draw.text((x2, y), "·", font=f_dot, fill=color_dot)
    bbox2 = draw.textbbox((x2, y), "·", font=f_dot)
    x3 = bbox2[2]
    # "Cast"
    draw.text((x3, y), "Cast", font=f, fill=color_main)
    bbox3 = draw.textbbox((x3, y), "Cast", font=f)
    return bbox3[2] - x  # total width

def wordmark_width(draw, font_size):
    """Measure wordmark width without drawing."""
    f = lora(font_size, italic=True, bold=True)
    f_dot = lora(font_size, italic=False, bold=True)
    tmp = Image.new("RGBA", (1, 1))
    d = ImageDraw.Draw(tmp)
    b1 = d.textbbox((0, 0), "Point", font=f)
    b2 = d.textbbox((0, 0), "·", font=f_dot)
    b3 = d.textbbox((0, 0), "Cast", font=f)
    return (b1[2] - b1[0]) + (b2[2] - b2[0]) + (b3[2] - b3[0])

def paste_noun(img, noun_id, size, x, y, center=False):
    """Paste a Noun onto img at (x,y). If center=True, x,y is the center point."""
    noun = load_noun(noun_id, size)
    if center:
        x = x - size // 2
        y = y - size // 2
    img.paste(noun, (x, y), noun)

def draw_ruled_line(draw, x0, x1, y, color=C_INK, width=1):
    draw.line([(x0, y), (x1, y)], fill=color, width=width)

def draw_thick_rule(draw, x0, x1, y, color=C_INK):
    draw.line([(x0, y), (x1, y)], fill=color, width=4)
    draw.line([(x0, y+2), (x1, y+2)], fill=color, width=1)

# ═══════════════════════════════════════════════════════════════════════════════
# AD 1 — 1080×1080 Instagram Square: THE DRUM ROOM
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad1():
    W, H = 1080, 1080
    img = Image.new("RGBA", (W, H), C_CREAM)
    draw = ImageDraw.Draw(img)

    # Outer border
    margin = 32
    draw.rectangle([margin, margin, W - margin, H - margin], outline=C_INK, width=3)

    # Corner dots on outer border
    draw_corner_dots(draw, margin, margin, W - margin, H - margin, dot_r=10)

    # Top section: "Tap together." italic serif
    top_text = "Tap together."
    f_top = lora(72, italic=True, bold=False)
    draw_text_centered(draw, top_text, f_top, 60, W, C_INK)

    # Thin rule below title
    draw_ruled_line(draw, margin + 20, W - margin - 20, 155, C_INK, width=2)

    # 2×2 Noun grid
    noun_ids = [42, 272, 672, 901]
    labels   = ["KICK", "SNARE", "HI-HAT", "BELL"]
    noun_size = 340
    grid_top = 175
    cell_w = (W - 2 * margin) // 2
    cell_h = 380

    for i, (nid, label) in enumerate(zip(noun_ids, labels)):
        col = i % 2
        row = i // 2
        cx = margin + col * cell_w + cell_w // 2
        cy = grid_top + row * cell_h + noun_size // 2 + 10

        # Cell background alternating subtle tint
        cell_x0 = margin + col * cell_w
        cell_y0 = grid_top + row * cell_h
        cell_x1 = cell_x0 + cell_w
        cell_y1 = cell_y0 + cell_h
        if (col + row) % 2 == 0:
            draw.rectangle([cell_x0, cell_y0, cell_x1, cell_y1], fill=(246, 242, 232, 255))
        else:
            draw.rectangle([cell_x0, cell_y0, cell_x1, cell_y1], fill=(240, 234, 220, 255))

        # Cell border
        draw.rectangle([cell_x0, cell_y0, cell_x1, cell_y1], outline=C_INK, width=1)

        # Noun
        paste_noun(img, nid, noun_size, cx, cy, center=True)

        # Label
        f_label = mono(22, bold=True)
        draw_text_centered(draw, label, f_label, cy + noun_size // 2 + 12, W,
                           C_TERRA if col == 0 else C_INK)

    # Bottom strip
    strip_y = H - margin - 70
    draw.rectangle([margin, strip_y, W - margin, H - margin], fill=C_INK)

    # Bottom text
    f_bottom = mono(22, bold=True)
    draw_text_centered(draw, "POINTCAST.XYZ", f_bottom, strip_y + 14, W, C_CREAM, letter_spacing=4)
    f_drum = mono(18, bold=False)
    draw_text_centered(draw, "DRUM", f_drum, strip_y + 42, W, C_TERRA, letter_spacing=8)

    # Thin rule above bottom strip
    draw_ruled_line(draw, margin + 20, W - margin - 20, strip_y - 4, C_INK, width=1)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# AD 2 — 1080×1920 Instagram Story: BROADCAST YOURSELF
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad2():
    W, H = 1080, 1920
    img = Image.new("RGBA", (W, H), C_CREAM)
    draw = ImageDraw.Draw(img)

    # Subtle warm gradient overlay at bottom
    for y in range(H // 2, H):
        alpha = int(30 * (y - H // 2) / (H // 2))
        draw.line([(0, y), (W, y)], fill=(201, 77, 44, alpha))

    # Outer border
    margin = 40
    draw.rectangle([margin, margin, W - margin, H - margin], outline=C_INK, width=3)
    draw_corner_dots(draw, margin, margin, W - margin, H - margin, dot_r=12)

    # ON AIR badge top right
    draw_on_air_badge(img, W - margin - 200, margin + 30, font_size=22)

    # Top kicker
    f_kicker = mono(20, bold=True)
    kicker = "A PERSONAL SIGNAL FROM THE OPEN WEB"
    draw_text_centered(draw, kicker, f_kicker, margin + 30, W, C_TERRA, letter_spacing=2)

    # Horizontal rule
    draw_ruled_line(draw, margin + 30, W - margin - 30, margin + 75, C_INK, width=1)

    # Broadcast arcs behind noun (centered at ~55% height)
    arc_cx = W // 2
    arc_cy = int(H * 0.52)

    # Draw arcs on a separate RGBA layer for alpha
    arc_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    arc_draw = ImageDraw.Draw(arc_layer)
    for i in range(7):
        r = 120 + i * 90
        alpha = max(20, 180 - i * 25)
        arc_draw.arc([arc_cx - r, arc_cy - r, arc_cx + r, arc_cy + r],
                     start=190, end=350, fill=C_TERRA + (alpha,), width=3)
    img = Image.alpha_composite(img, arc_layer)
    draw = ImageDraw.Draw(img)

    # Big Noun centered
    noun_size = 560
    paste_noun(img, 567, noun_size, arc_cx, arc_cy, center=True)

    # "Broadcast yourself." italic serif
    f_main = lora(88, italic=True, bold=False)
    draw = ImageDraw.Draw(img)
    draw_text_centered(draw, "Broadcast", f_main, arc_cy + noun_size // 2 + 40, W, C_INK)
    draw_text_centered(draw, "yourself.", f_main, arc_cy + noun_size // 2 + 140, W, C_INK)

    # Bottom wordmark strip
    strip_y = H - margin - 100
    draw.rectangle([margin, strip_y, W - margin, H - margin], fill=C_INK)
    f_wm = mono(26, bold=True)
    draw_text_centered(draw, "POINTCAST.XYZ", f_wm, strip_y + 30, W, C_CREAM, letter_spacing=5)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# AD 3 — 1500×500 Twitter/Farcaster Banner: NOW BROADCASTING
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad3():
    W, H = 1500, 500
    img = Image.new("RGBA", (W, H), C_CREAM)
    draw = ImageDraw.Draw(img)

    # Top mono strip
    strip_h = 48
    draw.rectangle([0, 0, W, strip_h], fill=C_INK)
    f_strip = mono(18, bold=True)
    strip_text = "VOL. 01 · NO. 01 · NOW BROADCASTING FROM THE OPEN WEB"
    draw_text_centered(draw, strip_text, f_strip, 14, W, C_CREAM, letter_spacing=2)

    # Main content area
    margin = 28
    content_top = strip_h + 10

    # Left: wordmark + broadcast arcs
    wm_x = margin + 20
    wm_y = content_top + 30

    # Broadcast arcs behind wordmark
    arc_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    arc_draw = ImageDraw.Draw(arc_layer)
    arc_cx = wm_x + 20
    arc_cy = wm_y + 80
    for i in range(5):
        r = 60 + i * 55
        alpha = max(15, 140 - i * 25)
        arc_draw.arc([arc_cx - r, arc_cy - r, arc_cx + r, arc_cy + r],
                     start=200, end=340, fill=C_TERRA + (alpha,), width=2)
    img = Image.alpha_composite(img, arc_layer)
    draw = ImageDraw.Draw(img)

    # Wordmark
    wm_size = 56
    draw_wordmark(draw, wm_x, wm_y, font_size=wm_size)

    # Divider line
    div_x = 420
    draw.line([(div_x, content_top + 10), (div_x, H - margin - 10)], fill=C_INK, width=2)

    # 5 Nouns horizontal
    noun_ids = [127, 272, 455, 672, 787]
    noun_size = 220
    nouns_area_w = W - div_x - margin - 20
    spacing = nouns_area_w // 5
    nouns_y = content_top + (H - content_top - margin - noun_size) // 2 + content_top // 2

    for i, nid in enumerate(noun_ids):
        nx = div_x + 10 + i * spacing + spacing // 2
        ny = (H - noun_size) // 2 + 20
        paste_noun(img, nid, noun_size, nx, ny, center=True)

    # ON AIR badge right side
    draw_on_air_badge(img, W - margin - 200, strip_h + 20, font_size=18)

    # Bottom border
    draw.line([(0, H - 3), (W, H - 3)], fill=C_INK, width=3)
    draw.line([(0, H - 1), (W, H - 1)], fill=C_TERRA, width=1)

    # Outer frame
    draw.rectangle([0, strip_h, W - 1, H - 1], outline=C_INK, width=2)

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

    # Outer border double rule
    draw.rectangle([margin - 8, margin - 8, W - margin + 8, H - margin + 8], outline=C_INK, width=1)
    draw.rectangle([margin, margin, W - margin, H - margin], outline=C_INK, width=3)
    draw_corner_dots(draw, margin, margin, W - margin, H - margin, dot_r=10)

    y += 20

    # Top kicker
    f_kicker = mono(16, bold=True)
    kicker = "THE OPEN WEB GAZETTE  ·  EDITION NO. 1  ·  POINTCAST.XYZ"
    draw_text_centered(draw, kicker, f_kicker, y, W, C_TERRA, letter_spacing=2)
    y += 36

    # Thick rule
    draw_thick_rule(draw, margin + 10, W - margin - 10, y)
    y += 14

    # POINTCAST masthead
    f_mast = lora(110, italic=False, bold=True)
    draw_text_centered(draw, "POINTCAST", f_mast, y, W, C_INK)
    y += 120

    # Subtitle rule
    draw_thick_rule(draw, margin + 10, W - margin - 10, y)
    y += 8
    draw_ruled_line(draw, margin + 10, W - margin - 10, y + 4, C_INK, width=1)
    y += 20

    # "THE TIMES YOU MISSED" subtitle
    f_sub = mono(22, bold=True)
    draw_text_centered(draw, "THE TIMES YOU MISSED", f_sub, y, W, C_INK, letter_spacing=5)
    y += 44

    draw_ruled_line(draw, margin + 10, W - margin - 10, y, C_INK, width=1)
    y += 20

    # 4 columns
    cols = [
        (42,  "THE DRUM ROOM",    "Four walls, one groove. The rhythm section never sleeps."),
        (127, "VIOLENT CRIMES",   "A dispatch from the edge. The story they didn't want told."),
        (567, "NOUNS GENERATOR",  "Pixel by pixel, a new face emerges from the on-chain ether."),
        (672, "HAPPY FRIDAY",     "End-of-week transmissions from the open web. Tune in."),
    ]

    col_w = (W - 2 * margin - 3 * 20) // 4
    noun_size = 180
    col_y_start = y

    for i, (nid, headline, body) in enumerate(cols):
        cx = margin + i * (col_w + 20)

        # Column border
        draw.rectangle([cx, col_y_start, cx + col_w, col_y_start + 560], outline=C_INK, width=1)

        # Noun icon
        noun_x = cx + (col_w - noun_size) // 2
        noun_y = col_y_start + 16
        paste_noun(img, nid, noun_size, noun_x, noun_y)

        # Thin rule below noun
        draw_ruled_line(draw, cx + 8, cx + col_w - 8, noun_y + noun_size + 10, C_INK, width=1)

        # Headline
        f_head = lora(26, italic=False, bold=True)
        # Word-wrap headline
        words = headline.split()
        lines = []
        current = ""
        for w in words:
            test = (current + " " + w).strip()
            bbox = draw.textbbox((0, 0), test, font=f_head)
            if bbox[2] - bbox[0] > col_w - 16:
                if current:
                    lines.append(current)
                current = w
            else:
                current = test
        if current:
            lines.append(current)

        hy = noun_y + noun_size + 22
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=f_head)
            lw = bbox[2] - bbox[0]
            draw.text((cx + (col_w - lw) // 2, hy), line, font=f_head, fill=C_INK)
            hy += 32

        # Body text
        f_body = outfit(17)
        body_words = body.split()
        body_lines = []
        current = ""
        for w in body_words:
            test = (current + " " + w).strip()
            bbox = draw.textbbox((0, 0), test, font=f_body)
            if bbox[2] - bbox[0] > col_w - 16:
                if current:
                    body_lines.append(current)
                current = w
            else:
                current = test
        if current:
            body_lines.append(current)

        by = hy + 12
        for line in body_lines:
            draw.text((cx + 8, by), line, font=f_body, fill=C_INK)
            by += 22

    y = col_y_start + 580

    # Horizontal rule
    draw_thick_rule(draw, margin + 10, W - margin - 10, y)
    y += 18

    # Big italic serif URL
    f_url = lora(80, italic=True, bold=False)
    draw_text_centered(draw, "pointcast.xyz", f_url, y, W, C_INK)
    y += 96

    draw_ruled_line(draw, margin + 10, W - margin - 10, y, C_INK, width=1)
    y += 16

    # WELCOME ABOARD mono
    f_welcome = mono(24, bold=True)
    draw_text_centered(draw, "WELCOME ABOARD", f_welcome, y, W, C_TERRA, letter_spacing=6)
    y += 50

    # Bottom terracotta accent bar
    draw.rectangle([margin, H - margin - 30, W - margin, H - margin], fill=C_TERRA)
    f_bar = mono(14, bold=True)
    draw_text_centered(draw, "BROADCAST · DISCOVER · CONNECT · POINTCAST.XYZ", f_bar,
                       H - margin - 22, W, C_CREAM, letter_spacing=2)

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# AD 5 — 1080×1080 Die-cut Sticker: /901.svg
# ═══════════════════════════════════════════════════════════════════════════════

def build_ad5():
    W, H = 1080, 1080
    img = Image.new("RGBA", (W, H), C_CREAM)
    draw = ImageDraw.Draw(img)

    cx, cy = W // 2, H // 2
    outer_r = 490
    inner_r = 430

    # Outer ink circle
    draw.ellipse([cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r], fill=C_INK)

    # Inner cream circle
    draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r], fill=C_CREAM)

    # Terracotta ring
    ring_r = 460
    draw.ellipse([cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r],
                 outline=C_TERRA, width=6)

    # Ring text around the circle
    ring_text = "✦ POINTCAST.XYZ ✦ BROADCAST YOURSELF ✦"
    f_ring = mono(26, bold=True)
    ring_radius = 445

    # Calculate total arc length needed
    chars = list(ring_text)
    n = len(chars)
    angle_step = 360 / n
    start_angle = -90  # start at top

    for i, c in enumerate(chars):
        angle = math.radians(start_angle + i * angle_step)
        # Position on ring
        rx = cx + ring_radius * math.cos(angle)
        ry = cy + ring_radius * math.sin(angle)
        # Rotate character
        char_img = Image.new("RGBA", (60, 60), (0, 0, 0, 0))
        char_draw = ImageDraw.Draw(char_img)
        char_draw.text((5, 5), c, font=f_ring, fill=C_INK)
        # Rotate to face outward
        rot_angle = math.degrees(angle) + 90
        char_img = char_img.rotate(-rot_angle, expand=True, resample=Image.BICUBIC)
        # Paste centered at (rx, ry)
        px = int(rx - char_img.width // 2)
        py = int(ry - char_img.height // 2)
        img.paste(char_img, (px, py), char_img)

    # Big Noun centered
    noun_size = 600
    paste_noun(img, 901, noun_size, cx, cy, center=True)

    # Small "NOUNS DAO" attribution at bottom
    draw = ImageDraw.Draw(img)
    f_attr = mono(16)
    draw_text_centered(draw, "CC0 · NOUNS DAO", f_attr, cy + noun_size // 2 + 20, W, C_SOFT)

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
        r = int(C_DARK[0] + (40 - C_DARK[0]) * t * 0.4)
        g = int(C_DARK[1] + (25 - C_DARK[1]) * t * 0.4)
        b = int(C_DARK[2] + (10 - C_DARK[2]) * t * 0.4)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    cx, cy = W // 2, H // 2

    # Concentric broadcast arcs (large, centered)
    arc_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    arc_draw = ImageDraw.Draw(arc_layer)
    for i in range(12):
        r = 200 + i * 130
        alpha = max(8, 80 - i * 6)
        arc_draw.arc([cx - r, cy - r, cx + r, cy + r],
                     start=195, end=345, fill=C_TERRA + (alpha,), width=3)
    img = Image.alpha_composite(img, arc_layer)
    draw = ImageDraw.Draw(img)

    # Huge Point·Cast wordmark center
    wm_size = 180
    # Measure wordmark
    wm_w = wordmark_width(draw, wm_size)
    wm_x = (W - wm_w) // 2
    wm_y = cy - 110
    draw_wordmark(draw, wm_x, wm_y, font_size=wm_size,
                  color_main=C_CREAM, color_dot=C_TERRA)

    # Tagline below
    f_tag = outfit(42)
    draw_text_centered(draw, "Broadcast yourself.", f_tag, wm_y + 210, W, C_SOFT)

    # Thin terracotta rule below tagline
    rule_y = wm_y + 270
    rule_len = 400
    draw.line([(cx - rule_len // 2, rule_y), (cx + rule_len // 2, rule_y)],
              fill=C_TERRA, width=2)

    # URL
    f_url = mono(28, bold=True)
    draw_text_centered(draw, "POINTCAST.XYZ", f_url, rule_y + 20, W, C_CREAM, letter_spacing=4)

    # ON AIR badge top right
    draw_on_air_badge(img, W - 280, 50, font_size=26)

    # Small Noun mascot bottom-right corner
    noun_size = 280
    paste_noun(img, 672, noun_size, W - noun_size - 60, H - noun_size - 60)

    # Corner dots on full canvas
    dot_margin = 60
    draw = ImageDraw.Draw(img)
    draw_corner_dots(draw, dot_margin, dot_margin, W - dot_margin, H - dot_margin, dot_r=14)

    # Subtle grid lines (very faint)
    for gx in range(0, W, 320):
        draw.line([(gx, 0), (gx, H)], fill=(255, 255, 255, 8))
    for gy in range(0, H, 180):
        draw.line([(0, gy), (W, gy)], fill=(255, 255, 255, 8))

    return img.convert("RGB")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("Building Ad 1: THE DRUM ROOM (1080×1080)...")
    ad1 = build_ad1()
    ad1.save(f"{OUT}/ad1_drum_room_1080x1080.png")
    print("  Saved.")

    print("Building Ad 2: BROADCAST YOURSELF (1080×1920)...")
    ad2 = build_ad2()
    ad2.save(f"{OUT}/ad2_broadcast_yourself_1080x1920.png")
    print("  Saved.")

    print("Building Ad 3: NOW BROADCASTING (1500×500)...")
    ad3 = build_ad3()
    ad3.save(f"{OUT}/ad3_now_broadcasting_1500x500.png")
    print("  Saved.")

    print("Building Ad 4: THE TIMES YOU MISSED (1200×1500)...")
    ad4 = build_ad4()
    ad4.save(f"{OUT}/ad4_times_you_missed_1200x1500.png")
    print("  Saved.")

    print("Building Ad 5: DIE-CUT STICKER (1080×1080)...")
    ad5 = build_ad5()
    ad5.save(f"{OUT}/ad5_sticker_1080x1080.png")
    print("  Saved.")

    print("Building Ad 6: DESKTOP WALLPAPER (2560×1440)...")
    ad6 = build_ad6()
    ad6.save(f"{OUT}/ad6_wallpaper_2560x1440.png")
    print("  Saved.")

    print("\nAll 6 ads built successfully!")
