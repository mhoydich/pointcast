#!/usr/bin/env python3
"""
PointCast Ads — Contact Sheet
Shows all 6 ads at small scale on a single canvas
"""

import os
from PIL import Image, ImageDraw, ImageFont

BASE = "/home/ubuntu/pointcast_ads"
OUT  = f"{BASE}/output"

# Brand colors
C_INK   = (26, 24, 19)
C_CREAM = (246, 242, 232)
C_TERRA = (201, 77, 44)
C_SOFT  = (194, 106, 74)

FONT_FILES = {
    "mono_bold": f"{BASE}/fonts/7be4b885.ttf",
    "mono":      f"{BASE}/fonts/ef66fbb1.ttf",
    "lora_bold": f"{BASE}/fonts/5ef18c55.ttf",
    "lora_italic": f"{BASE}/fonts/44048c9f.ttf",
}

def get_font(key, size):
    path = FONT_FILES.get(key)
    if path and os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()

# Load all ads
ads = [
    ("ad1_drum_room_1080x1080.png",          "1. THE DRUM ROOM",           "1080×1080 Instagram Square"),
    ("ad2_broadcast_yourself_1080x1920.png", "2. BROADCAST YOURSELF",      "1080×1920 Instagram Story"),
    ("ad3_now_broadcasting_1500x500.png",    "3. NOW BROADCASTING",        "1500×500 Twitter/Farcaster Banner"),
    ("ad4_times_you_missed_1200x1500.png",   "4. THE TIMES YOU MISSED",    "1200×1500 Poster"),
    ("ad5_sticker_1080x1080.png",            "5. DIE-CUT STICKER",         "1080×1080 Sticker"),
    ("ad6_wallpaper_2560x1440.png",          "6. DESKTOP WALLPAPER",       "2560×1440 Wallpaper"),
]

# Contact sheet layout: 3 columns × 2 rows
# Each thumbnail max 480px wide
THUMB_W = 480
MARGIN  = 40
GAP     = 32
LABEL_H = 56
COLS    = 3
ROWS    = 2

# Calculate thumbnail heights preserving aspect ratio
thumbnails = []
for filename, title, subtitle in ads:
    path = f"{OUT}/{filename}"
    img = Image.open(path).convert("RGB")
    ratio = img.height / img.width
    th = int(THUMB_W * ratio)
    thumb = img.resize((THUMB_W, th), Image.LANCZOS)
    thumbnails.append((thumb, title, subtitle))

# Find max thumb height per row
row_heights = []
for row in range(ROWS):
    max_h = 0
    for col in range(COLS):
        idx = row * COLS + col
        if idx < len(thumbnails):
            max_h = max(max_h, thumbnails[idx][0].height)
    row_heights.append(max_h)

# Header height
HEADER_H = 100

# Total canvas size
total_w = MARGIN * 2 + COLS * THUMB_W + (COLS - 1) * GAP
total_h = MARGIN + HEADER_H + sum(row_heights) + ROWS * LABEL_H + (ROWS - 1) * GAP + MARGIN

sheet = Image.new("RGB", (total_w, total_h), C_CREAM)
draw = ImageDraw.Draw(sheet)

# Header
draw.rectangle([0, 0, total_w, HEADER_H + MARGIN], fill=C_INK)
f_title = get_font("lora_italic", 42)
f_sub   = get_font("mono_bold", 18)

# "Point·Cast" wordmark
title_text = "Point\u00b7Cast"
b = draw.textbbox((0, 0), title_text, font=f_title)
tw = b[2] - b[0]
draw.text(((total_w - tw) // 2, 22), title_text, font=f_title, fill=C_CREAM)

sub_text = "AD CONTACT SHEET  ·  SECOND PASS  ·  REAL NOUNS CC0"
b2 = draw.textbbox((0, 0), sub_text, font=f_sub)
sw = b2[2] - b2[0]
draw.text(((total_w - sw) // 2, 72), sub_text, font=f_sub, fill=C_TERRA)

# Terracotta rule below header
draw.line([(0, HEADER_H + MARGIN), (total_w, HEADER_H + MARGIN)], fill=C_TERRA, width=2)

# Place thumbnails
f_label = get_font("mono_bold", 16)
f_sublabel = get_font("mono", 13)

y_offset = MARGIN + HEADER_H + GAP // 2

for row in range(ROWS):
    x_offset = MARGIN
    row_h = row_heights[row]

    for col in range(COLS):
        idx = row * COLS + col
        if idx >= len(thumbnails):
            break
        thumb, title, subtitle = thumbnails[idx]

        # Thumbnail border
        bx0 = x_offset - 2
        by0 = y_offset - 2
        bx1 = x_offset + THUMB_W + 2
        by1 = y_offset + thumb.height + 2
        draw.rectangle([bx0, by0, bx1, by1], outline=C_INK, width=2)

        # Paste thumbnail
        sheet.paste(thumb, (x_offset, y_offset))

        # Label below thumbnail
        label_y = y_offset + thumb.height + 8
        b = draw.textbbox((0, 0), title, font=f_label)
        lw = b[2] - b[0]
        draw.text((x_offset + (THUMB_W - lw) // 2, label_y), title,
                  font=f_label, fill=C_INK)

        b2 = draw.textbbox((0, 0), subtitle, font=f_sublabel)
        sw = b2[2] - b2[0]
        draw.text((x_offset + (THUMB_W - sw) // 2, label_y + 22), subtitle,
                  font=f_sublabel, fill=C_SOFT)

        x_offset += THUMB_W + GAP

    y_offset += row_h + LABEL_H + GAP

# Bottom attribution
draw.line([(MARGIN, total_h - MARGIN - 30), (total_w - MARGIN, total_h - MARGIN - 30)],
          fill=C_INK, width=1)
f_attr = get_font("mono", 13)
attr_text = "All Noun SVGs: noun.pics (CC0 Public Domain)  ·  pointcast.xyz"
b = draw.textbbox((0, 0), attr_text, font=f_attr)
aw = b[2] - b[0]
draw.text(((total_w - aw) // 2, total_h - MARGIN - 22), attr_text,
          font=f_attr, fill=C_SOFT)

# Save
out_path = f"{OUT}/contact_sheet_all_ads.png"
sheet.save(out_path, quality=95)
print(f"Contact sheet saved: {out_path}")
print(f"Size: {sheet.size[0]}×{sheet.size[1]}")
