"""Art for the "Seven apps on the devnet" block (0721): seven small marks on one
chain rail. Left to right: a row of bars under a ring (the Observatory), three
rings on a card (the Daily Mint), a folded sheet with a wax seal (the Notary), a
sealed envelope over a row of blocks, some of them not yet reached (Time
Capsules), three linked blocks with one flipped byte (Verify a block), a grid of
dots and a play triangle (the API Playground), and a bloom of petals (Checkpoint
Blooms). Abstract: bars, rings, sheets, blocks and petals only. No people, no
places, no type of any kind.

The bar heights and the petal lengths are the bytes of the devnet-2 genesis hash
(a720735b...), so the picture is a record of the chain these apps read.

Same recipe as scripts/generate-chain-pcv-py-art.py: geometry and colour are
presentation attributes and the <style> holds only animation, so librsvg/sharp
rasterize a clean still while browsers animate. A prefers-reduced-motion guard
turns the animation off.

  python3 scripts/generate-chain-apps-art.py media > public/images/chain/apps.svg
  python3 scripts/generate-chain-apps-art.py og > /tmp/apps-og.svg
  node -e "require('sharp')(require('fs').readFileSync('/tmp/apps-og.svg'),{density:160}).resize(1200,630).png({compressionLevel:9,quality:90}).toFile('public/images/og/b/0721.png')"

The OG card is committed, so scripts/generate-og-images.mjs keeps it. If the block
is renumbered, regenerate the card with the new id.
"""
import math
import sys

W, H = 1200, 630

# The devnet-2 genesis hash: src/data/chain-home.ts DEVNET_2_GENESIS.
GENESIS = 'a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280'

# FD ramp, as in the yard, bots and first-mints art.
BG, GRID, RING = '#EEF4FA', '#D5E3F2', '#C9DAEC'
EDGE, DEEP = '#0B3E73', '#185FA5'
WARM = '#E5663B'   # the seal, the flipped byte, the bloom's heart
OK = '#5FBF7F'     # the tip of the rail

BYTES = bytes.fromhex(GENESIS)
CELLS = [120 + 160 * i for i in range(7)]
CY = 290
RAIL = 482


def f(x):
    return f'{x:.1f}'


def scope(cx, cy, r, n):
    rings = ''.join(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r * (k + 1) / n)}"/>' for k in range(n))
    cross = (f'<line x1="{f(cx - r)}" y1="{f(cy)}" x2="{f(cx + r)}" y2="{f(cy)}"/>'
             f'<line x1="{f(cx)}" y1="{f(cy - r)}" x2="{f(cx)}" y2="{f(cy + r)}"/>')
    return f'<g fill="none" stroke="{RING}" stroke-width="1.2">{rings}{cross}</g>'


def grid(step):
    g = ''.join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>' for y in range(step, H, step))
    return f'<g stroke="{GRID}" stroke-width="1">{g}</g>'


def observatory(cx, cy, b):
    base = cy + 62
    x0 = cx - 67
    tall = (0, 0)
    out = [f'<line x1="{f(x0 - 8)}" y1="{base}" x2="{f(x0 + 142)}" y2="{base}" stroke="{EDGE}" stroke-width="2"/>']
    for k in range(7):
        h = 22 + b[k] / 255 * 84
        x = x0 + k * 20
        out.append(f'<rect x="{f(x)}" y="{f(base - h)}" width="14" height="{f(h)}" fill="none" stroke="{EDGE}" stroke-width="2"/>')
        if h > tall[1]:
            tall = (x + 7, h)
    out.append(f'<circle cx="{f(tall[0])}" cy="{f(base - tall[1] - 16)}" r="9" fill="none" stroke="{DEEP}" stroke-width="2"/>')
    out.append(f'<circle cx="{f(tall[0])}" cy="{f(base - tall[1] - 16)}" r="3" fill="{DEEP}"/>')
    return ''.join(out)


def dailymint(cx, cy, b):
    out = [f'<rect x="{f(cx - 42)}" y="{f(cy - 66)}" width="84" height="122" fill="{BG}" stroke="{EDGE}" stroke-width="2"/>']
    for k, r in enumerate((14, 26, 38)):
        out.append(f'<circle cx="{f(cx)}" cy="{f(cy - 14)}" r="{r}" fill="none" stroke="{DEEP}" stroke-width="{2 + (b[k] % 2)}" opacity="{0.55 + 0.15 * k:.2f}"/>')
    out.append(f'<circle cx="{f(cx)}" cy="{f(cy - 14)}" r="4" fill="{WARM}"/>')
    out.append(f'<path d="M{f(cx - 28)} {f(cy + 34)}h56M{f(cx - 28)} {f(cy + 44)}h36" stroke="{EDGE}" stroke-width="3" fill="none"/>')
    return ''.join(out)


def notary(cx, cy, b):
    out = [
        f'<path d="M{f(cx - 40)} {f(cy - 64)}h50l30 30v94h-80z" fill="{BG}" stroke="{EDGE}" stroke-width="2"/>',
        f'<path d="M{f(cx + 10)} {f(cy - 64)}v30h30" fill="none" stroke="{EDGE}" stroke-width="2"/>',
        f'<path d="M{f(cx - 28)} {f(cy - 26)}h44M{f(cx - 28)} {f(cy - 12)}h56M{f(cx - 28)} {f(cy + 2)}h38" stroke="{DEEP}" stroke-width="3" fill="none"/>',
        f'<circle cx="{f(cx + 20)}" cy="{f(cy + 32)}" r="20" fill="{WARM}" opacity="0.92"/>',
        f'<circle cx="{f(cx + 20)}" cy="{f(cy + 32)}" r="12" fill="none" stroke="{BG}" stroke-width="2.5"/>',
        f'<circle cx="{f(cx + 20)}" cy="{f(cy + 32)}" r="4" fill="{BG}"/>',
    ]
    return ''.join(out)


def capsules(cx, cy, b):
    out = [
        f'<rect x="{f(cx - 54)}" y="{f(cy - 12)}" width="108" height="72" fill="{BG}" stroke="{EDGE}" stroke-width="2"/>',
        f'<path d="M{f(cx - 54)} {f(cy - 12)}l54 40 54 -40" fill="none" stroke="{EDGE}" stroke-width="2"/>',
        f'<circle cx="{f(cx)}" cy="{f(cy + 28)}" r="8" fill="{WARM}"/>',
    ]
    for k in range(5):
        x = cx - 58 + k * 25
        dash = ' stroke-dasharray="3 3"' if k >= 3 else ''
        out.append(f'<rect x="{f(x)}" y="{f(cy - 58)}" width="20" height="18" fill="none" stroke="{DEEP}" stroke-width="2"{dash}/>')
    return ''.join(out)


def verify(cx, cy, b):
    out = []
    xs = [cx - 56, cx, cx + 56]
    for a, c in zip(xs, xs[1:]):
        out.append(f'<line x1="{f(a + 17)}" y1="{f(cy)}" x2="{f(c - 17)}" y2="{f(cy)}" stroke="{EDGE}" stroke-width="2"/>')
    for k, x in enumerate(xs):
        out.append(f'<rect x="{f(x - 17)}" y="{f(cy - 17)}" width="34" height="34" fill="{BG}" stroke="{EDGE}" stroke-width="2"/>')
        out.append(f'<path d="M{f(x - 9)} {f(cy - 5)}h18M{f(x - 9)} {f(cy + 3)}h12" stroke="{DEEP}" stroke-width="2.5" fill="none"/>')
    out.append(f'<circle cx="{f(xs[1])}" cy="{f(cy)}" r="26" fill="none" stroke="{OK}" stroke-width="2.5"/>')
    out.append(f'<rect x="{f(xs[2] + 6)}" y="{f(cy + 6)}" width="9" height="9" fill="{WARM}"/>')
    out.append(f'<path d="M{f(cx - 70)} {f(cy + 52)}h30M{f(cx - 30)} {f(cy + 52)}h20M{f(cx)} {f(cy + 52)}h44M{f(cx + 54)} {f(cy + 52)}h16" stroke="{DEEP}" stroke-width="3" fill="none"/>')
    return ''.join(out)


def playground(cx, cy, b):
    out = []
    for r in range(3):
        for c in range(3):
            x = cx - 52 + c * 22
            y = cy - 30 + r * 22
            out.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="5" fill="{DEEP if (r + c) % 2 == 0 else EDGE}"/>')
    out.append(f'<polygon points="{f(cx + 20)},{f(cy - 52)} {f(cx + 20)},{f(cy + 8)} {f(cx + 62)},{f(cy - 22)}" fill="none" stroke="{EDGE}" stroke-width="2.5" stroke-linejoin="round"/>')
    out.append(f'<path d="M{f(cx - 56)} {f(cy + 52)}h112" stroke="{EDGE}" stroke-width="2" fill="none"/>')
    out.append(f'<path d="M{f(cx - 56)} {f(cy + 52)}v-8M{f(cx + 56)} {f(cy + 52)}v-8" stroke="{EDGE}" stroke-width="2" fill="none"/>')
    return ''.join(out)


def bloom(cx, cy, b):
    out = [f'<circle cx="{f(cx)}" cy="{f(cy)}" r="58" fill="none" stroke="{RING}" stroke-width="1.5"/>']
    for k in range(8):
        ang = k * 45
        ry = 30 + b[8 + k] / 255 * 24
        out.append(f'<ellipse cx="{f(cx)}" cy="{f(cy - ry * 0.62)}" rx="11" ry="{f(ry)}" transform="rotate({ang} {f(cx)} {f(cy)})" fill="none" stroke="{DEEP}" stroke-width="2" opacity="0.9"/>')
    out.append(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="9" fill="{WARM}"/>')
    out.append(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="18" fill="none" stroke="{EDGE}" stroke-width="2"/>')
    return ''.join(out)


GLYPHS = [observatory, dailymint, notary, capsules, verify, playground, bloom]


def rail(animate):
    out = [f'<line x1="40" y1="{RAIL}" x2="1160" y2="{RAIL}" stroke="{EDGE}" stroke-width="2"/>']
    for k in range(0, 36):
        x = 52 + k * 31.5
        out.append(f'<rect x="{f(x)}" y="{RAIL - 5}" width="10" height="10" fill="{BG}" stroke="{DEEP}" stroke-width="1.5"/>')
    for k, cx in enumerate(CELLS):
        cls = f' class="node n{k}"' if animate else ''
        out.append(f'<g{cls}><rect x="{cx - 14}" y="{RAIL - 14}" width="28" height="28" fill="{BG}" stroke="{EDGE}" stroke-width="2.5"/>'
                   f'<rect x="{cx - 5}" y="{RAIL - 5}" width="10" height="10" fill="{EDGE}"/></g>')
        out.append(f'<line x1="{cx}" y1="{RAIL - 14}" x2="{cx}" y2="{CY + 76}" stroke="{DEEP}" stroke-width="1.5" stroke-dasharray="2 5"/>')
    out.append(f'<circle cx="1160" cy="{RAIL}" r="9" fill="{OK}"/>')
    out.append(f'<circle cx="1160" cy="{RAIL}" r="16" fill="none" stroke="{OK}" stroke-width="2"/>')
    return ''.join(out)


def svg(animate):
    style = ''
    if animate:
        style = ('<style>'
                 '.node{transform-box:fill-box;transform-origin:center;animation:pulse 5.6s ease-in-out infinite}'
                 + ''.join(f'.n{k}{{animation-delay:{k * 0.7:.1f}s}}' for k in range(7))
                 + '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}'
                 '@media (prefers-reduced-motion:reduce){.node{animation:none}}'
                 '</style>')
    body = [f'<rect width="{W}" height="{H}" fill="{BG}"/>', grid(45), scope(600, 315, 300, 6)]
    for i, (cx, fn) in enumerate(zip(CELLS, GLYPHS)):
        body.append(f'<g>{fn(cx, CY, BYTES[(i * 3) % 32:] + BYTES)}</g>')
    body.append(rail(animate))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
            f'aria-label="Seven small marks on one chain rail: bars under a ring, rings on a card, a sealed sheet, an envelope over blocks, linked blocks with one changed byte, a grid with a play triangle and a bloom of petals">'
            f'{style}{"".join(body)}</svg>')


if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'media'
    sys.stdout.write(svg(which == 'media'))
