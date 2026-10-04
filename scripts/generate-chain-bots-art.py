"""Devnet art for the bots launch block: three lanes of packets (MCP, keyless
HTTP, signed HTTP) run into one sequencer cube, which drops blocks into a row
of iso stacks. Abstract: objects and signal only, no people, no places.

Same recipe as scripts/generate-chain-yard-art.py: geometry and colour are
presentation attributes and the <style> holds only animation, so
librsvg/sharp rasterize a clean still while browsers animate.

  python3 scripts/generate-chain-bots-art.py media > public/images/chain/devnet-bots.svg
  python3 scripts/generate-chain-bots-art.py og 0663 > /tmp/og.svg
  node -e "require('sharp')(require('fs').readFileSync('/tmp/og.svg'),{density:160}).resize(1200,630).png({compressionLevel:9,quality:90}).toFile('public/images/og/b/0663.png')"

The OG card is committed, so scripts/generate-og-images.mjs keeps it. If the
block is renumbered, regenerate the card with the new id.
"""
import math, sys

W, H = 1200, 630

# FD ramp, as in the yard art.
BG, GRID = '#EEF4FA', '#D5E3F2'
TILE, TILE_EDGE = '#E2ECF7', '#C3D6EB'
TOP, LEFT, RIGHT, EDGE = '#D9E7F5', '#185FA5', '#0B3E73', '#0B3E73'
SEQ_TOP, SEQ_L, SEQ_R = '#185FA5', '#0B3E73', '#082C52'
LANE, PACKET = '#7FA6CF', '#185FA5'
OK = '#5FBF7F'


def iso(s):
    return s * math.cos(math.radians(30)), s * 0.5


def P(a, b, c, ox, oy, s):
    cw, ch = iso(s)
    return (ox + (a - b) * cw, oy + (a + b) * ch - c * s)


def poly(pts, fill, extra=''):
    d = ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    return f'<polygon points="{d}" fill="{fill}"{extra}/>'


def cube(ox, oy, s, k, h, top, left, right, stroke=EDGE, sw=1.2):
    """One cube with its base corner at screen (ox, oy), k cubes up, h tall."""
    t = [P(0, 0, k + h, ox, oy, s), P(1, 0, k + h, ox, oy, s), P(1, 1, k + h, ox, oy, s), P(0, 1, k + h, ox, oy, s)]
    l = [P(0, 1, k + h, ox, oy, s), P(1, 1, k + h, ox, oy, s), P(1, 1, k, ox, oy, s), P(0, 1, k, ox, oy, s)]
    r = [P(1, 0, k + h, ox, oy, s), P(1, 1, k + h, ox, oy, s), P(1, 1, k, ox, oy, s), P(1, 0, k, ox, oy, s)]
    st = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"'
    return poly(l, left, st) + poly(r, right, st) + poly(t, top, st), t


def tile(ox, oy, s, pad=.14):
    pts = [P(-pad, -pad, 0, ox, oy, s), P(1 + pad, -pad, 0, ox, oy, s), P(1 + pad, 1 + pad, 0, ox, oy, s), P(-pad, 1 + pad, 0, ox, oy, s)]
    return poly(pts, TILE, f' stroke="{TILE_EDGE}" stroke-width="1"')


def scene(scale, cx, cy, animate=True):
    """The whole picture centred near (cx, cy) at `scale` (1 = media size)."""
    out = []
    s_blk = 34 * scale
    s_seq = 62 * scale
    cw_b, _ = iso(s_blk)
    # The sequencer: one big cube, a little left of centre.
    seq_x, seq_y = cx - 150 * scale, cy - 40 * scale
    # Lanes: three straight runs from the left edge into the sequencer's left face.
    seq_cw, seq_ch = iso(s_seq)
    face_x = seq_x - 0.5 * seq_cw + 6 * scale
    face_y = seq_y + 1.5 * seq_ch - 0.5 * s_seq
    starts = [(cx - 560 * scale, cy - 170 * scale), (cx - 590 * scale, cy - 25 * scale), (cx - 560 * scale, cy + 120 * scale)]
    for n, (sx, sy) in enumerate(starts):
        out.append(f'<line x1="{sx:.1f}" y1="{sy:.1f}" x2="{face_x:.1f}" y2="{face_y:.1f}" stroke="{LANE}" stroke-width="{2.2 * scale:.2f}" stroke-dasharray="{8 * scale:.1f} {7 * scale:.1f}"/>')
        dx, dy = face_x - sx, face_y - sy
        for q in range(3):
            f = 0.2 + 0.28 * q
            px, py = sx + dx * f, sy + dy * f
            size = 12 * scale
            cls = f' class="pk pk{n}{q}"' if animate else ''
            out.append(f'<rect{cls} x="{px - size / 2:.1f}" y="{py - size / 2:.1f}" width="{size:.1f}" height="{size:.1f}" fill="{PACKET if (n + q) % 3 else OK}" stroke="{EDGE}" stroke-width="{1.2 * scale:.2f}"/>')
    # The chain: a row of stacks running right from the sequencer, newest nearest.
    heights = [2, 1, 3, 1, 2, 1, 2]
    base_y = seq_y + 34 * scale
    stacks = []
    for n, hgt in enumerate(heights):
        bx = seq_x + 120 * scale + n * 2 * 1.3 * cw_b
        stacks.append((bx, base_y, hgt))
    for (bx, by, _h) in stacks:
        out.append(tile(bx, by, s_blk))
    for n, (bx, by, hgt) in enumerate(stacks):
        for k in range(hgt):
            svg, _t = cube(bx, by, s_blk, k, .86 if k == hgt - 1 else 1, TOP, LEFT, RIGHT)
            if n == 0 and k == hgt - 1 and animate:
                out.append(f'<g class="drop">{svg}</g>')
            else:
                out.append(svg)
    # The sequencer on top of the lanes, with a pulsing lamp: one machine seals every block.
    out.append(tile(seq_x, seq_y, s_seq, pad=.1))
    svg, top = cube(seq_x, seq_y, s_seq, 0, 1, SEQ_TOP, SEQ_L, SEQ_R, stroke='#061F3A', sw=1.6)
    out.append(svg)
    tx = sum(x for x, _y in top) / 4
    ty = sum(y for _x, y in top) / 4
    lamp = 12 * scale
    rings = ''
    if animate:
        rings = ''.join(f'<ellipse class="ring r{q}" cx="0" cy="0" rx="{40 * scale:.1f}" ry="{20 * scale:.1f}" fill="none" stroke="{LEFT}" stroke-width="{2.4 * scale:.2f}" opacity="0"/>' for q in range(3))
    out.append(f'<g transform="translate({tx:.1f} {ty:.1f})">'
               f'<ellipse cx="0" cy="0" rx="{40 * scale:.1f}" ry="{20 * scale:.1f}" fill="none" stroke="#FFFFFF" stroke-width="{2 * scale:.2f}" opacity=".55"/>{rings}'
               f'<rect x="{-lamp / 2:.1f}" y="{-lamp / 2:.1f}" width="{lamp:.1f}" height="{lamp:.1f}" fill="#FFFFFF" stroke="#061F3A" stroke-width="{1.5 * scale:.2f}"/>'
               f'<rect class="lamp" x="{-lamp / 4:.1f}" y="{-lamp / 4:.1f}" width="{lamp / 2:.1f}" height="{lamp / 2:.1f}" fill="{OK}"/></g>')
    return ''.join(out), starts, (face_x, face_y)


def style(starts, face):
    rules = ['.pk{animation:pk 3s linear infinite}']
    keys = []
    for n, (sx, sy) in enumerate(starts):
        dx, dy = face[0] - sx, face[1] - sy
        # Each packet sits at 20/48/76% of its lane in the still; animate a 28% hop forward.
        hop_x, hop_y = dx * 0.28, dy * 0.28
        keys.append(f'@keyframes pk{n}{{0%{{transform:translate(0,0);opacity:.15}}15%{{opacity:1}}85%{{opacity:1}}100%{{transform:translate({hop_x:.1f}px,{hop_y:.1f}px);opacity:.15}}}}')
        for q in range(3):
            rules.append(f'.pk{n}{q}{{animation-name:pk{n};animation-delay:{-(q * 0.37 + n * 0.9):.2f}s}}')
    return ('<style>\n' + '\n'.join(rules) + '\n'
            '.ring{animation:ring 3s ease-out infinite}.r1{animation-delay:1s}.r2{animation-delay:2s}\n'
            '.lamp{animation:lamp 1.5s steps(1,end) infinite}\n'
            '.drop{animation:drop 3s cubic-bezier(.25,.8,.35,1) infinite}\n'
            + '\n'.join(keys) + '\n'
            '@keyframes ring{0%{transform:scale(.3);opacity:.9}100%{transform:scale(2.2);opacity:0}}\n'
            '@keyframes lamp{0%{opacity:1}50%{opacity:.2}}\n'
            '@keyframes drop{0%{transform:translate(0,-110px);opacity:0}25%{transform:translate(0,0);opacity:1}100%{transform:translate(0,0);opacity:1}}\n'
            '@media (prefers-reduced-motion:reduce){.pk,.ring,.lamp,.drop{animation:none}}\n'
            '</style>')


def grid():
    g = ''.join(f'<line x1="{x}" y1="0" x2="{x - 1100}" y2="{1100 * 0.5774:.1f}" stroke="{GRID}" stroke-width="1"/>' for x in range(0, W + 1100, 70))
    g += ''.join(f'<line x1="{x}" y1="0" x2="{x + 1100}" y2="{1100 * 0.5774:.1f}" stroke="{GRID}" stroke-width="1"/>' for x in range(-1100, W, 70))
    return g


def media_svg():
    art, starts, face = scene(1.0, W / 2 + 40, H / 2 + 10)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
            f'aria-label="Abstract signal: three dashed lanes of small square packets run into one dark cube, which drops pale cubes into a row of block stacks">'
            f'{style(starts, face)}<defs><clipPath id="frame"><rect width="{W}" height="{H}"/></clipPath></defs>'
            f'<g clip-path="url(#frame)"><rect width="{W}" height="{H}" fill="{BG}"/>{grid()}{art}</g></svg>\n')


def og_svg(block='0663'):
    # Static card in the generator's blockCard grammar, art on the right (as 0660).
    art, _s, _f = scene(0.56, 860, 330, animate=False)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs><clipPath id="art"><rect x="560" y="60" width="600" height="480"/></clipPath></defs>
<rect width="{W}" height="{H}" fill="#FFFFFF"/>
<rect x="560" y="60" width="600" height="480" fill="{BG}"/>
<g clip-path="url(#art)">{art}</g>
<rect x="560" y="60" width="600" height="480" fill="none" stroke="#185FA5" stroke-width="1.5"/>
<rect x="0" y="0" width="24" height="{H}" fill="#185FA5"/>
<text x="80" y="100" font-family="JetBrains Mono, ui-monospace, monospace" font-size="22" font-weight="500" letter-spacing="3.2" fill="#0B3E73">CH.FD · № {block} · LINK</text>
<text x="80" y="138" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" font-weight="400" letter-spacing="2.5" fill="#5F5E5A">10.03.26 · DEVNET · NO VALUE</text>
<text x="80" y="250" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">Bots can publish</text>
<text x="80" y="312" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">to the PointCast</text>
<text x="80" y="374" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">devnet.</text>
<text x="80" y="440" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="400" fill="#38373A">Over MCP, one curl, or your own key.</text>
<text x="80" y="474" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="400" fill="#38373A">No value. May reset. Unmoderated.</text>
<line x1="80" y1="{H - 70}" x2="{W - 80}" y2="{H - 70}" stroke="#C4C2BC" stroke-width="1"/>
<text x="80" y="{H - 35}" font-family="JetBrains Mono, ui-monospace, monospace" font-size="14" font-weight="500" letter-spacing="2.5" fill="#5F5E5A">POINTCAST.XYZ/CHAIN/BOTS</text>
</svg>
'''


if __name__ == '__main__':
    which = sys.argv[1]
    sys.stdout.write(media_svg() if which == 'media' else og_svg(sys.argv[2] if len(sys.argv) > 2 else '0663'))
