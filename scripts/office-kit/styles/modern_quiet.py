# Office Kit style generator, CC0. Written by a Claude worker on Nov 27 2026.
# Expects real Noun PNGs at /tmp/nm/n{3,5,9,14,21}.png (from https://noun.pics/<id>.png) and writes to /tmp/kitart/modern/.
import math
from PIL import Image, ImageDraw, ImageFont

OUT = "/tmp/kitart/modern"
W, H, S = 1600, 1000, 2  # draw at 2x, downscale for smooth shapes

CREAM = (245, 240, 230)
CLAY = (217, 119, 87)
CHAR = (43, 42, 39)
SAGE = (168, 181, 150)
SAGE_DK = (128, 146, 114)
SAGE_LT = (216, 223, 204)
SAND = (232, 220, 196)
SAND_DK = (205, 187, 152)

F_TITLE = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
F_SMALL = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"

NOUNS = {
    "n3": "/tmp/nm/n3.png", "n5": "/tmp/nm/n5.png", "n9": "/tmp/nm/n9.png",
    "n14": "/tmp/nm/n14.png", "n21": "/tmp/nm/n21.png",
}


def load_noun(path, scale):
    """Resize to 32x32 NEAREST, make top-left colour transparent, scale up NEAREST."""
    im = Image.open(path).convert("RGBA").resize((32, 32), Image.NEAREST)
    bg = im.getpixel((0, 0))
    px = im.load()
    for y in range(32):
        for x in range(32):
            if px[x, y] == bg:
                px[x, y] = (0, 0, 0, 0)
    return im.resize((32 * scale, 32 * scale), Image.NEAREST)


_fonts = {}


def font(path, size):
    key = (path, size)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(path, size * S)
    return _fonts[key]


def R(v):
    return int(round(v * S))


def box(b):
    return [R(v) for v in b]


def rr(d, b, r, fill):
    d.rounded_rectangle(box(b), radius=R(r), fill=fill)


def el(d, b, fill):
    d.ellipse(box(b), fill=fill)


def hair(d, x0, x1, y, width=1, fill=CHAR):
    d.line([(R(x0), R(y)), (R(x1), R(y))], fill=fill, width=R(width))


def vline(d, x, y0, y1, width=1, fill=CHAR):
    d.line([(R(x), R(y0)), (R(x), R(y1))], fill=fill, width=R(width))


def leaf(d, bx, by, L, Wd, ang_deg, fill):
    """Leaf as a rotated ellipse, starting at base (bx, by) and pointing along ang."""
    a = math.radians(ang_deg)
    cx = bx + math.cos(a) * L / 2
    cy = by + math.sin(a) * L / 2
    pts = []
    for i in range(72):
        t = 2 * math.pi * i / 72
        x = L / 2 * math.cos(t)
        y = Wd / 2 * math.sin(t)
        xr = x * math.cos(a) - y * math.sin(a)
        yr = x * math.sin(a) + y * math.cos(a)
        pts.append((R(cx + xr), R(cy + yr)))
    d.polygon(pts, fill=fill)


def text(d, x, y, s, fnt, fill=CHAR, track=0.0):
    cx = x
    for ch in s:
        d.text((R(cx), R(y)), ch, font=fnt, fill=fill, anchor="ls")
        cx += fnt.getlength(ch) / S + track


def corner(d):
    text(d, 90, 96, "OFFICE KIT · CC0", font(F_SMALL, 19), CHAR, track=4)


def title(d, x, y, s):
    text(d, x, y, s, font(F_TITLE, 44), CHAR, track=0.2)


def place_on(sprite, cx, base_y):
    """Place a sprite so its visible bottom sits on base_y and its visible centre is at cx."""
    l, t, r, b = sprite.getbbox()
    x = int(round(cx - (l + r) / 2))
    y = int(round(base_y - b))
    return sprite, x, y


def finish(canvas, sprites, name):
    img = canvas.resize((W, H), Image.LANCZOS).convert("RGBA")
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for sp, x, y in sprites:
        layer.paste(sp, (x, y), sp)
    img = Image.alpha_composite(img, layer).convert("RGB")
    img.save(f"{OUT}/{name}.png", "PNG", optimize=True)
    print("wrote", f"{OUT}/{name}.png", img.size)


# 1. One Noun alone under a clay sun, lots of space
def piece_1():
    c = Image.new("RGB", (W * S, H * S), CREAM)
    d = ImageDraw.Draw(c)
    el(d, (610, 130, 990, 510), CLAY)            # clay sun
    el(d, (560, 782, 1040, 826), SAGE_LT)        # soft shadow blob
    hair(d, 260, 1340, 800, 1)                   # hairline ground rule
    corner(d)
    title(d, 120, 900, "One quiet noun")
    sp = load_noun(NOUNS["n3"], 14)
    finish(c, [place_on(sp, 800, 800)], "modern-1")


# 2. Three Nouns on a long desk
def piece_2():
    c = Image.new("RGB", (W * S, H * S), CREAM)
    d = ImageDraw.Draw(c)
    el(d, (1080, 110, 1420, 400), SAGE_LT)      # sage blob, upper right
    rr(d, (160, 640, 1440, 668), 12, SAND)       # desk top
    rr(d, (220, 668, 244, 860), 6, SAND_DK)      # legs
    rr(d, (1356, 668, 1380, 860), 6, SAND_DK)
    hair(d, 160, 1440, 890, 1)
    corner(d)
    title(d, 160, 948, "Three on a long desk")
    sprites = [
        place_on(load_noun(NOUNS["n5"], 11), 420, 640),
        place_on(load_noun(NOUNS["n9"], 11), 800, 640),
        place_on(load_noun(NOUNS["n14"], 11), 1180, 640),
    ]
    finish(c, sprites, "modern-2")


# 3. A Noun reading by a window shape
def piece_3():
    c = Image.new("RGB", (W * S, H * S), CREAM)
    d = ImageDraw.Draw(c)
    rr(d, (900, 160, 1280, 700), 190, SAGE_LT)                       # arch window
    d.rounded_rectangle(box((900, 160, 1280, 700)), radius=R(190),
                        outline=CHAR, width=R(6))
    vline(d, 1090, 190, 700, 4)
    hair(d, 900, 1280, 430, 4)
    el(d, (1010, 230, 1060, 280), CLAY)                              # a small sun in the glass
    rr(d, (300, 760, 900, 782), 6, SAND_DK)                          # table
    rr(d, (340, 782, 362, 860), 5, SAND_DK)
    rr(d, (838, 782, 860, 860), 5, SAND_DK)
    rr(d, (700, 726, 830, 760), 4, CLAY)                             # book
    rr(d, (712, 706, 818, 726), 4, SAGE)                             # book on top
    hair(d, 120, 1480, 900, 1)
    corner(d)
    title(d, 120, 952, "Reading by the window")
    finish(c, [place_on(load_noun(NOUNS["n21"], 13), 470, 760)], "modern-3")


# 4. A Noun beside a tall plant made of simple shapes
def piece_4():
    c = Image.new("RGB", (W * S, H * S), CREAM)
    d = ImageDraw.Draw(c)
    rr(d, (980, 130, 1240, 700), 130, SAND)                          # wall niche
    hair(d, 120, 1480, 790, 1)                                       # floor
    vline(d, 1110, 300, 640, 8, SAGE_DK)                             # stem
    for bx, by, L, ang, col in [
        (1110, 600, 130, -30, SAGE),
        (1110, 540, 120, -150, SAGE_DK),
        (1110, 470, 150, -50, SAGE),
        (1110, 400, 130, -130, SAGE_DK),
        (1110, 330, 110, -70, SAGE),
        (1110, 270, 80, -100, SAGE_DK),
    ]:
        leaf(d, bx, by, L, 56, ang, col)
    d.polygon([(R(1040), R(640)), (R(1180), R(640)), (R(1160), R(790)), (R(1060), R(790))],
              fill=CLAY)                                              # pot
    rr(d, (1030, 622, 1190, 648), 6, CLAY)                           # pot rim
    corner(d)
    title(d, 120, 900, "Beside the plant")
    finish(c, [place_on(load_noun(NOUNS["n5"], 12), 560, 790)], "modern-4")


if __name__ == "__main__":
    piece_1()
    piece_2()
    piece_3()
    piece_4()
