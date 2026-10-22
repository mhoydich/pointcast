"""Art for the "Witness and Channels" block (0722): three small marks on one chain
rail, the same rail as scripts/generate-chain-apps-art.py draws for the first
seven apps. Left to right: a row of blocks with a ring on one of them and a flag
above it (Witness in your browser: a replay that ends in one signed checkpoint),
a stack of stations with one claimed, one open, and three arcs of broadcast
leaving the top (Channels), and two identical sheets joined by an equals bar
inside a green ring (the one SDK file, the same bytes in every place it is
served). Abstract: blocks, rings, slabs, arcs and sheets only. No people, no
places, no type of any kind.

The tick lengths under the blocks, the bars on the sheets and the slab widths are
the bytes of the devnet-2 genesis hash (a720735b...), so the picture is a record
of the chain these apps read.

Same recipe as scripts/generate-chain-apps-art.py: geometry and colour are
presentation attributes and the <style> holds only animation, so librsvg/sharp
rasterize a clean still while browsers animate. A prefers-reduced-motion guard
turns the animation off.

  python3 scripts/generate-chain-apps-2-art.py media > public/images/chain/apps-2.svg
  python3 scripts/generate-chain-apps-2-art.py og > /tmp/apps-2-og.svg
  node -e "require('sharp')(require('fs').readFileSync('/tmp/apps-2-og.svg'),{density:160}).resize(1200,630).png({compressionLevel:9,quality:90}).toFile('public/images/og/b/0722.png')"

The OG card is committed, so scripts/generate-og-images.mjs keeps it. If the block
is renumbered, regenerate the card with the new id.
"""
import math
import sys

W, H = 1200, 630

# The devnet-2 genesis hash: src/data/chain-home.ts DEVNET_2_GENESIS.
GENESIS = 'a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280'

# FD ramp, as in the yard, bots, first-mints and apps art.
BG, GRID, RING = '#EEF4FA', '#D5E3F2', '#C9DAEC'
EDGE, DEEP = '#0B3E73', '#185FA5'
WARM = '#E5663B'   # the flag, the claimed station, the transmitter
OK = '#5FBF7F'     # the ring that agrees, the tip of the rail

BYTES = bytes.fromhex(GENESIS)
CELLS = [210, 600, 990]
CY = 286
RAIL = 506
SCALE = 1.7


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


def witness(b):
    """Four blocks side by side, a tick of replay under each, a ring on the third and a flag over it."""
    out = []
    xs = [-64 + k * 34 for k in range(4)]
    out.append(f'<line x1="-72" y1="14" x2="72" y2="14" stroke="{EDGE}" stroke-width="2"/>')
    for k, x in enumerate(xs):
        out.append(f'<rect x="{f(x)}" y="-12" width="26" height="26" fill="{BG}" stroke="{EDGE}" stroke-width="2"/>')
        out.append(f'<path d="M{f(x + 6)} -2h14M{f(x + 6)} 5h9" stroke="{DEEP}" stroke-width="2.2" fill="none"/>')
        tick = 10 + b[k] / 255 * 26
        out.append(f'<line x1="{f(x + 13)}" y1="14" x2="{f(x + 13)}" y2="{f(14 + tick)}" stroke="{DEEP}" stroke-width="2" stroke-dasharray="2 3"/>')
    cx = xs[2] + 13
    out.append(f'<circle cx="{f(cx)}" cy="1" r="20" fill="none" stroke="{OK}" stroke-width="2.6"/>')
    out.append(f'<line x1="{f(cx)}" y1="-24" x2="{f(cx)}" y2="-66" stroke="{EDGE}" stroke-width="2.2"/>')
    out.append(f'<polygon points="{f(cx)},-66 {f(cx + 30)},-56 {f(cx)},-46" fill="{WARM}" stroke="{WARM}" stroke-width="1.5" stroke-linejoin="round"/>')
    out.append(f'<path d="M-72 62h110M24 62l-8 -6M24 62l-8 6" stroke="{EDGE}" stroke-width="2" fill="none"/>')
    return ''.join(out)


def channels(b):
    """A stack of four stations (one claimed, one open and dashed), and three arcs of broadcast over the top."""
    out = []
    ys = [-34, -8, 18, 44]
    for k, y in enumerate(ys):
        w = 74 + b[4 + k] / 255 * 22
        dash = ' stroke-dasharray="4 4"' if k == 2 else ''
        out.append(f'<rect x="-70" y="{y}" width="{f(w)}" height="18" fill="{BG}" stroke="{EDGE}" stroke-width="2"{dash}/>')
        out.append(f'<circle cx="-58" cy="{y + 9}" r="4" fill="{WARM if k == 1 else DEEP}" opacity="{1 if k != 2 else 0.35}"/>')
        out.append(f'<path d="M-44 {y + 9}h{f(w - 38)}" stroke="{DEEP}" stroke-width="2.4" fill="none" opacity="{0.9 if k != 2 else 0.35}"/>')
    tx, ty = 40, -66
    for r in (20, 36, 52):
        a0, a1 = math.radians(-70), math.radians(10)
        x1, y1 = tx + r * math.cos(a0), ty + r * math.sin(a0)
        x2, y2 = tx + r * math.cos(a1), ty + r * math.sin(a1)
        out.append(f'<path d="M{f(x1)} {f(y1)}A{r} {r} 0 0 1 {f(x2)} {f(y2)}" fill="none" stroke="{DEEP}" stroke-width="2.4" stroke-linecap="round" opacity="{1 - 0.22 * (r // 20 - 1):.2f}"/>')
    out.append(f'<circle cx="{tx}" cy="{ty}" r="6" fill="{WARM}"/>')
    return ''.join(out)


def sdk(b):
    """Two identical sheets with the same bars on both, an equals bar between them, a green ring round it."""
    out = []
    for sx in (-78, 14):
        out.append(f'<path d="M{sx} -62h42l22 22v84h-64z" fill="{BG}" stroke="{EDGE}" stroke-width="2"/>')
        out.append(f'<path d="M{sx + 42} -62v22h22" fill="none" stroke="{EDGE}" stroke-width="2"/>')
        for k in range(6):
            w = 14 + b[10 + k] / 255 * 36
            out.append(f'<path d="M{sx + 8} {f(-26 + k * 11)}h{f(w)}" stroke="{DEEP}" stroke-width="3" fill="none"/>')
    out.append(f'<path d="M-12 -7h24M-12 7h24" stroke="{EDGE}" stroke-width="3" fill="none"/>')
    out.append(f'<circle cx="0" cy="0" r="24" fill="none" stroke="{OK}" stroke-width="2.6"/>')
    out.append(f'<path d="M-78 66h64M14 66h64" stroke="{EDGE}" stroke-width="2" fill="none"/>')
    out.append(f'<path d="M-78 66v-8M-14 66v-8M14 66v-8M78 66v-8" stroke="{EDGE}" stroke-width="2" fill="none"/>')
    return ''.join(out)


GLYPHS = [witness, channels, sdk]


def rail(animate):
    out = [f'<line x1="40" y1="{RAIL}" x2="1160" y2="{RAIL}" stroke="{EDGE}" stroke-width="2"/>']
    for k in range(0, 36):
        x = 52 + k * 31.5
        out.append(f'<rect x="{f(x)}" y="{RAIL - 5}" width="10" height="10" fill="{BG}" stroke="{DEEP}" stroke-width="1.5"/>')
    for k, cx in enumerate(CELLS):
        cls = f' class="node n{k}"' if animate else ''
        out.append(f'<g{cls}><rect x="{cx - 14}" y="{RAIL - 14}" width="28" height="28" fill="{BG}" stroke="{EDGE}" stroke-width="2.5"/>'
                   f'<rect x="{cx - 5}" y="{RAIL - 5}" width="10" height="10" fill="{EDGE}"/></g>')
        out.append(f'<line x1="{cx}" y1="{RAIL - 14}" x2="{cx}" y2="{CY + 128}" stroke="{DEEP}" stroke-width="1.5" stroke-dasharray="2 5"/>')
    out.append(f'<circle cx="1160" cy="{RAIL}" r="9" fill="{OK}"/>')
    out.append(f'<circle cx="1160" cy="{RAIL}" r="16" fill="none" stroke="{OK}" stroke-width="2"/>')
    return ''.join(out)


def svg(animate):
    style = ''
    if animate:
        style = ('<style>'
                 '.node{transform-box:fill-box;transform-origin:center;animation:pulse 5.6s ease-in-out infinite}'
                 + ''.join(f'.n{k}{{animation-delay:{k * 0.9:.1f}s}}' for k in range(3))
                 + '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}'
                 '@media (prefers-reduced-motion:reduce){.node{animation:none}}'
                 '</style>')
    body = [f'<rect width="{W}" height="{H}" fill="{BG}"/>', grid(45), scope(600, 315, 300, 6)]
    for i, (cx, fn) in enumerate(zip(CELLS, GLYPHS)):
        body.append(f'<g transform="translate({cx} {CY}) scale({SCALE})">{fn(BYTES[(i * 5) % 32:] + BYTES)}</g>')
    body.append(rail(animate))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
            f'aria-label="Three small marks on one chain rail: a row of blocks with a ring on one and a flag above it, a stack of stations with arcs of broadcast over it, and two identical sheets joined by an equals bar">'
            f'{style}{"".join(body)}</svg>')


if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'media'
    sys.stdout.write(svg(which == 'media'))
