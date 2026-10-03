"""Block Yard art for the /chain launch block: abstract stacked iso cubes (one
stack per block, one cube per transaction) with a pulsing anchor beacon.

Geometry and colour are presentation attributes; the <style> holds only
animation, so librsvg/sharp rasterize a clean still while browsers animate.
No people, no places: objects and signal only.

  python3 scripts/generate-chain-yard-art.py media > public/images/chain/block-yard.svg
  python3 scripts/generate-chain-yard-art.py og 0660 > /tmp/og.svg
  node -e "require('sharp')(require('fs').readFileSync('/tmp/og.svg'),{density:160}).resize(1200,630).png({compressionLevel:9,quality:90}).toFile('public/images/og/b/0660.png')"

The OG card is committed, so scripts/generate-og-images.mjs keeps it. If the
block is renumbered, regenerate the card with the new id.
"""
import math, sys

W, H = 1200, 630
S = 30.0                      # cube edge on screen (set per output)
CW, CH = S * math.cos(math.radians(30)), S * 0.5

def set_scale(v):
    global S, CW, CH
    S = v
    CW, CH = S * math.cos(math.radians(30)), S * 0.5

# FD ramp + one verify green.
BG, GRID = '#EEF4FA', '#D5E3F2'
TILE, TILE_EDGE = '#E2ECF7', '#C3D6EB'
TOP, LEFT, RIGHT, EDGE = '#D9E7F5', '#185FA5', '#0B3E73', '#0B3E73'
PLATE_TOP, PLATE_L, PLATE_R = '#C9DBEE', '#7FA6CF', '#5A86B5'
OK = '#5FBF7F'
BEACON = '#185FA5'

# Plots: (i, j, txs). Serpentine rows of 9, spaced 1.6 units. Anchor plot gets a beacon.
GAP = 1.6
ROW = [2, 0, 1, 0, 3, 1, 0, 2, 1]
ROW2 = [0, 1, 4, 0, 0, 1, 0, 2, 3]
ROW3 = [1, 0, 2, 1, 0, 4, 1, 0, 2]
plots = []
for r, row in enumerate([ROW, ROW2, ROW3]):
    cols = list(range(len(row)))
    if r % 2 == 1:
        cols = cols[::-1]
    for c, t in zip(cols, row):
        plots.append((c * GAP, r * GAP * 1.25, t))
ANCHOR = 23            # index into plots (sequence order): row 3, the 4-cube stack
TIP = len(plots) - 1   # last plot drops in

def P(a, b, c, ox, oy):
    return (ox + (a - b) * CW, oy + (a + b) * CH - c * S)

def poly(pts, fill, extra=''):
    d = ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    return f'<polygon points="{d}" fill="{fill}"{extra}/>'

def cube(i, j, k, h, ox, oy, top, left, right, stroke=EDGE, sw=1):
    t = [P(i, j, k + h, ox, oy), P(i + 1, j, k + h, ox, oy), P(i + 1, j + 1, k + h, ox, oy), P(i, j + 1, k + h, ox, oy)]
    l = [P(i, j + 1, k + h, ox, oy), P(i + 1, j + 1, k + h, ox, oy), P(i + 1, j + 1, k, ox, oy), P(i, j + 1, k, ox, oy)]
    r = [P(i + 1, j, k + h, ox, oy), P(i + 1, j + 1, k + h, ox, oy), P(i + 1, j + 1, k, ox, oy), P(i + 1, j, k, ox, oy)]
    s = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"'
    return poly(l, left, s) + poly(r, right, s) + poly(t, top, s), t

def build(ox, oy, animate=True):
    out = []
    # Ground tiles under every plot (drawn first).
    for (i, j, _t) in plots:
        pts = [P(i - .15, j - .15, 0, ox, oy), P(i + 1.15, j - .15, 0, ox, oy), P(i + 1.15, j + 1.15, 0, ox, oy), P(i - .15, j + 1.15, 0, ox, oy)]
        out.append(poly(pts, TILE, f' stroke="{TILE_EDGE}" stroke-width="1"'))
    # Painter's order: far to near.
    order = sorted(range(len(plots)), key=lambda n: (plots[n][0] + plots[n][1], plots[n][0]))
    beacon = ''
    for n in order:
        i, j, t = plots[n]
        g = []
        if t == 0:
            svg, top = cube(i + .08, j + .08, 0, .22, ox, oy, PLATE_TOP, PLATE_L, PLATE_R, stroke=PLATE_R)
            g.append(svg)
            top_face = top
        else:
            for k in range(t):
                svg, top = cube(i + .08, j + .08, k, .84 if k == t - 1 else 1, ox, oy, TOP, LEFT, RIGHT)
                if n == TIP and k == t - 1 and animate:
                    g.append(f'<g class="drop">{svg}</g>')
                else:
                    g.append(svg)
                top_face = top
        # Verify overlay on the stack's top face: transparent in the still.
        if animate:
            d = ' '.join(f'{x:.1f},{y:.1f}' for x, y in top_face)
            g.append(f'<polygon class="v v{order.index(n) % 24}" points="{d}" fill="{OK}" opacity="0"/>')
        out.append(''.join(g))
        if n == ANCHOR:
            top_y = min(y for _x, y in top_face)
            cx = sum(x for x, _y in top_face) / 4
            mast_top = top_y - 3.1 * S
            rings = (f'<ellipse cx="0" cy="0" rx="46" ry="23" fill="none" stroke="{BEACON}" stroke-width="2" opacity=".55"/>')
            if animate:
                rings += ''.join(f'<ellipse class="ring r{q}" cx="0" cy="0" rx="46" ry="23" fill="none" stroke="{BEACON}" stroke-width="2.5" opacity="0"/>' for q in range(3))
            beacon = (f'<line x1="{cx:.1f}" y1="{top_y + 4:.1f}" x2="{cx:.1f}" y2="{mast_top:.1f}" stroke="#FFFFFF" stroke-width="7" stroke-linecap="square"/>'
                      f'<line x1="{cx:.1f}" y1="{top_y + 4:.1f}" x2="{cx:.1f}" y2="{mast_top:.1f}" stroke="{EDGE}" stroke-width="3"/>'
                      f'<g transform="translate({cx:.1f} {mast_top:.1f})">{rings}'
                      f'<rect x="-6" y="-6" width="12" height="12" fill="{BEACON}" stroke="{EDGE}" stroke-width="2"/>'
                      f'<rect class="lamp" x="-3" y="-3" width="6" height="6" fill="#FFFFFF"/></g>')
            out.append(beacon)
    return ''.join(out)

def bbox_origin(width, height, cx, cy):
    xs, ys = [], []
    for (i, j, t) in plots:
        for a, b, c in [(i - .2, j - .2, 0), (i + 1.2, j + 1.2, 0), (i + 1.2, j - .2, 0), (i - .2, j + 1.2, 0), (i, j, max(t, 1))]:
            x, y = P(a, b, c, 0, 0)
            xs.append(x); ys.append(y)
    # beacon headroom
    ys.append(min(ys) - 3.6 * S)
    return cx - (min(xs) + max(xs)) / 2, cy - (min(ys) + max(ys)) / 2

STYLE = """<style>
.v{animation:v 7.2s linear infinite}
""" + ''.join(f'.v{n}{{animation-delay:{n * .22:.2f}s}}\n' for n in range(24)) + """.ring{animation:ring 2.7s ease-out infinite}
.r1{animation-delay:.9s}.r2{animation-delay:1.8s}
.lamp{animation:lamp 1.35s steps(1,end) infinite}
.drop{animation:drop 3.6s cubic-bezier(.25,.8,.35,1) infinite}
@keyframes v{0%{opacity:0}4%{opacity:.92}62%{opacity:.92}70%{opacity:0}100%{opacity:0}}
@keyframes ring{0%{transform:scale(.25);opacity:.95}100%{transform:scale(2.1);opacity:0}}
@keyframes lamp{0%{opacity:1}50%{opacity:.15}}
@keyframes drop{0%{transform:translate(0,-120px);opacity:0}22%{transform:translate(0,0);opacity:1}100%{transform:translate(0,0);opacity:1}}
@media (prefers-reduced-motion:reduce){.v,.ring,.lamp,.drop{animation:none}}
</style>"""

def media_svg():
    set_scale(40.0)
    ox, oy = bbox_origin(W, H, W / 2, H / 2 - 8)
    grid = ''.join(f'<line x1="{x}" y1="0" x2="{x - 1100}" y2="{1100 * 0.5774:.1f}" stroke="{GRID}" stroke-width="1"/>' for x in range(0, W + 1100, 70))
    grid += ''.join(f'<line x1="{x}" y1="0" x2="{x + 1100}" y2="{1100 * 0.5774:.1f}" stroke="{GRID}" stroke-width="1"/>' for x in range(-1100, W, 70))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
            f'aria-label="Abstract isometric cubes stacked in rows, one stack per block, with a beacon pulsing over one stack">'
            f'{STYLE}<defs><clipPath id="frame"><rect width="{W}" height="{H}"/></clipPath></defs>'
            f'<g clip-path="url(#frame)"><rect width="{W}" height="{H}" fill="{BG}"/>{grid}{build(ox, oy)}</g></svg>\n')

def og_svg(block='0660'):
    # Static card in the generator's blockCard grammar, art on the right.
    set_scale(29.0)
    ox, oy = bbox_origin(640, 470, 870, 330)
    art = build(ox, oy, animate=False)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs><clipPath id="art"><rect x="560" y="60" width="600" height="480"/></clipPath></defs>
<rect width="{W}" height="{H}" fill="#FFFFFF"/>
<rect x="560" y="60" width="600" height="480" fill="{BG}"/>
<g clip-path="url(#art)">{art}</g>
<rect x="560" y="60" width="600" height="480" fill="none" stroke="#185FA5" stroke-width="1.5"/>
<rect x="0" y="0" width="24" height="{H}" fill="#185FA5"/>
<text x="80" y="100" font-family="JetBrains Mono, ui-monospace, monospace" font-size="22" font-weight="500" letter-spacing="3.2" fill="#0B3E73">CH.FD · № {block} · LINK</text>
<text x="80" y="138" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" font-weight="400" letter-spacing="2.5" fill="#5F5E5A">10.03.26 · LOCAL BUILD · NOT PUBLIC</text>
<text x="80" y="250" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">A chain where</text>
<text x="80" y="312" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">every block is</text>
<text x="80" y="374" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">a broadcast.</text>
<text x="80" y="440" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="400" fill="#38373A">Replay it in your browser.</text>
<text x="80" y="474" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="400" fill="#38373A">Press verify. Watch it turn green.</text>
<line x1="80" y1="{H - 70}" x2="{W - 80}" y2="{H - 70}" stroke="#C4C2BC" stroke-width="1"/>
<text x="80" y="{H - 35}" font-family="JetBrains Mono, ui-monospace, monospace" font-size="14" font-weight="500" letter-spacing="2.5" fill="#5F5E5A">POINTCAST.XYZ/CHAIN</text>
</svg>
'''

if __name__ == '__main__':
    which = sys.argv[1]
    sys.stdout.write(media_svg() if which == 'media' else og_svg(sys.argv[2] if len(sys.argv) > 2 else '0660'))
