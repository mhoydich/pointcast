"""Art for block 0724 (Start here, the plan, house and outside apart, and pcv.py's
state-root replay): four small marks on one chain rail, the same rail as
scripts/generate-chain-apps-art.py and generate-chain-apps-2-art.py draw.
Left to right: an open square with a short path into a row of blocks, the last
one ringed (Start here: a first key, one transaction, seen in its block); three
rails of blocks that grow longer, each ending in a ring, the last one dashed
where it stops (the plan: next month, next quarter, spring, markets parked);
three columns side by side, one tall, one half as tall and one a sliver, the
sliver ringed (who signs: house, keyless, outside, drawn to the chain-wide
counts 95, 51 and 2 read on 2026-10-21); and two stacks of the same blocks
joined block for block by short bars, an equals mark under them in a green
ring (pcv.py: a second implementation agreeing on every state root).
Abstract: blocks, rings, rails and bars only. No people, no places, no type of
any kind.

The tick lengths under the start blocks and the block widths in the two stacks
are the bytes of the devnet-2 genesis hash (a720735b...), so the picture is a
record of the chain these pages read.

Same recipe as scripts/generate-chain-apps-2-art.py: geometry and colour are
presentation attributes and the <style> holds only animation, so librsvg/sharp
rasterize a clean still while browsers animate. A prefers-reduced-motion guard
turns the animation off.

  python3 scripts/generate-chain-first-minute-art.py media > public/images/chain/first-minute.svg
  python3 scripts/generate-chain-first-minute-art.py og > /tmp/first-minute-og.svg
  node -e "require('sharp')(require('fs').readFileSync('/tmp/first-minute-og.svg'),{density:160}).resize(1200,630).png({compressionLevel:9,quality:90}).toFile('public/images/og/b/0724.png')"

The OG card is committed, so scripts/generate-og-images.mjs keeps it. If the block
is renumbered, regenerate the card with the new id.
"""
import sys

W, H = 1200, 630

# The devnet-2 genesis hash: src/data/chain-home.ts DEVNET_2_GENESIS.
GENESIS = 'a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280'

# Who signed, chain-wide, GET /stats/classes at block 3,790 on 2026-10-21: house, keyless, outside txs.
CLASSES = (95, 51, 2)

# FD ramp, as in the yard, bots, first-mints, apps and plan art.
BG, GRID, RING = '#EEF4FA', '#D5E3F2', '#C9DAEC'
EDGE, DEEP = '#0B3E73', '#185FA5'
WARM = '#E5663B'   # the first key, the outside sliver
OK = '#5FBF7F'     # the ring that agrees, the tip of the rail

BYTES = bytes.fromhex(GENESIS)
CELLS = [180, 470, 760, 1040]
CY = 280
RAIL = 506
SCALE = 1.55


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


def start(b):
    """An open square (a new key), a short path into three blocks, the last one ringed (seen in its block)."""
    out = []
    out.append(f'<rect x="-78" y="-46" width="22" height="22" fill="none" stroke="{WARM}" stroke-width="2.4"/>')
    out.append(f'<path d="M-67 -24v38h18" stroke="{WARM}" stroke-width="2" fill="none" stroke-dasharray="3 3"/>')
    xs = [-46, -12, 22]
    out.append(f'<line x1="-50" y1="14" x2="60" y2="14" stroke="{EDGE}" stroke-width="2"/>')
    for k, x in enumerate(xs):
        out.append(f'<rect x="{f(x)}" y="-12" width="26" height="26" fill="{BG}" stroke="{EDGE}" stroke-width="2"/>')
        out.append(f'<path d="M{f(x + 6)} -2h14M{f(x + 6)} 5h9" stroke="{DEEP}" stroke-width="2.2" fill="none"/>')
        tick = 10 + b[k] / 255 * 26
        out.append(f'<line x1="{f(x + 13)}" y1="14" x2="{f(x + 13)}" y2="{f(14 + tick)}" stroke="{DEEP}" stroke-width="2" stroke-dasharray="2 3"/>')
    cx = xs[2] + 13
    out.append(f'<circle cx="{f(cx)}" cy="1" r="20" fill="none" stroke="{OK}" stroke-width="2.6"/>')
    out.append(f'<circle cx="{f(xs[2] + 20)}" cy="-5" r="4" fill="{WARM}"/>')
    return ''.join(out)


def plan(b):
    """Three rails of blocks that grow longer, a ring at the head of each; the last rail ends dashed (parked)."""
    out = []
    for k, (y, n) in enumerate([(-48, 3), (-8, 5), (32, 7)]):
        x0 = -76
        end = x0 + n * 20
        out.append(f'<line x1="{x0 - 6}" y1="{y + 6}" x2="{end + 8}" y2="{y + 6}" stroke="{EDGE}" stroke-width="2"/>')
        for i in range(n):
            dash = ' stroke-dasharray="3 3"' if k == 2 and i >= n - 2 else ''
            out.append(f'<rect x="{x0 + i * 20}" y="{y}" width="12" height="12" fill="{BG}" stroke="{DEEP}" stroke-width="1.8"{dash}/>')
        if k < 2:
            out.append(f'<circle cx="{end + 16}" cy="{y + 6}" r="8" fill="none" stroke="{OK}" stroke-width="2.2"/>')
        else:
            out.append(f'<path d="M{end + 8} {y + 6}l14 -10" stroke="{DEEP}" stroke-width="2" fill="none" stroke-dasharray="3 3"/>')
    return ''.join(out)


def classes(b):
    """Three columns on one floor: house, keyless, outside, heights to the chain-wide counts; the sliver ringed."""
    out = []
    top = max(CLASSES)
    floor = 62
    full = 118
    xs = [-62, -14, 34]
    out.append(f'<line x1="-78" y1="{floor}" x2="78" y2="{floor}" stroke="{EDGE}" stroke-width="2"/>')
    for k, (x, n) in enumerate(zip(xs, CLASSES)):
        h = max(3.0, full * n / top)
        fill = WARM if k == 2 else (DEEP if k == 0 else BG)
        out.append(f'<rect x="{x}" y="{f(floor - h)}" width="30" height="{f(h)}" fill="{fill}" stroke="{EDGE}" stroke-width="2"/>')
        if k == 1:
            for i in range(int(h // 12)):
                out.append(f'<path d="M{x + 6} {f(floor - 8 - i * 12)}h18" stroke="{DEEP}" stroke-width="1.6" fill="none"/>')
    out.append(f'<circle cx="{xs[2] + 15}" cy="{floor - 2}" r="16" fill="none" stroke="{OK}" stroke-width="2.4"/>')
    return ''.join(out)


def replay(b):
    """Two stacks of the same blocks, joined block for block by short bars; an equals mark in a green ring below."""
    out = []
    ys = [-60, -36, -12, 12]
    for k, y in enumerate(ys):
        w = 34 + b[8 + k] / 255 * 22
        for sx in (-74, 74 - w):
            out.append(f'<rect x="{f(sx)}" y="{y}" width="{f(w)}" height="16" fill="{BG}" stroke="{EDGE}" stroke-width="2"/>')
            out.append(f'<path d="M{f(sx + 6)} {y + 8}h{f(w - 18)}" stroke="{DEEP}" stroke-width="2.2" fill="none"/>')
        out.append(f'<path d="M{f(-74 + w)} {y + 8}H{f(74 - w)}" stroke="{OK}" stroke-width="2" fill="none" stroke-dasharray="2 4"/>')
    out.append(f'<path d="M-12 47h24M-12 59h24" stroke="{EDGE}" stroke-width="3" fill="none"/>')
    out.append(f'<circle cx="0" cy="53" r="22" fill="none" stroke="{OK}" stroke-width="2.6"/>')
    return ''.join(out)


GLYPHS = [start, plan, classes, replay]


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
                 + ''.join(f'.n{k}{{animation-delay:{k * 0.9:.1f}s}}' for k in range(len(CELLS)))
                 + '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}'
                 '@media (prefers-reduced-motion:reduce){.node{animation:none}}'
                 '</style>')
    body = [f'<rect width="{W}" height="{H}" fill="{BG}"/>', grid(45), scope(600, 315, 300, 6)]
    for i, (cx, fn) in enumerate(zip(CELLS, GLYPHS)):
        body.append(f'<g transform="translate({cx} {CY}) scale({SCALE})">{fn(BYTES[(i * 5) % 32:] + BYTES)}</g>')
    body.append(rail(animate))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
            f'aria-label="Four small marks on one chain rail: an open square leading into a row of blocks with the last one ringed, three rails of blocks that grow longer, three columns of very different heights with the smallest ringed, and two matching stacks of blocks joined by an equals mark">'
            f'{style}{"".join(body)}</svg>')


if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'media'
    sys.stdout.write(svg(which == 'media'))
