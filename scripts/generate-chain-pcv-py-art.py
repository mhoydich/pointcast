"""Art for the pcv.py block: two signal traces, braided, that meet at every
node. One trace is the Rust verifier, one is the Python verifier; they part a
little between nodes and agree exactly at each one, where a ring closes.
Behind them, faint concentric rings, like a scope face. Abstract: traces,
rings and dots only, no people, no places, no type.

The nodes are the 32 bytes of the devnet tip hash pcv.py verified (height
572, 916a739a...), so the picture is the record.

Same recipe as scripts/generate-chain-first-mints-art.py: geometry and colour
are presentation attributes and the <style> holds only animation, so
librsvg/sharp rasterize a clean still while browsers animate.

  python3 scripts/generate-chain-pcv-py-art.py media > public/images/chain/pcv-py.svg
  python3 scripts/generate-chain-pcv-py-art.py og 0694 > /tmp/og.svg
  node -e "require('sharp')(require('fs').readFileSync('/tmp/og.svg'),{density:160}).resize(1200,630).png({compressionLevel:9,quality:90}).toFile('public/images/og/b/0694.png')"

The OG card is committed, so scripts/generate-og-images.mjs keeps it. If the
block is renumbered, regenerate the card with the new id.
"""
import math, sys

W, H = 1200, 630

# The tip pcv.py verified on the live devnet: height 572.
TIP = '916a739af74ac5929e8dd4aabea8b0385e5e9ffed104beeff6a94ab6c056d166'

# FD ramp, as in the yard, bots and first-mints art.
BG, GRID, RING = '#EEF4FA', '#D5E3F2', '#C9DAEC'
EDGE, DEEP = '#0B3E73', '#185FA5'
WARM = '#E5663B'   # the second trace: a second lab, a second colour
OK = '#5FBF7F'     # agreement


def nodes(x0, x1, cy, amp):
    b = bytes.fromhex(TIP)
    step = (x1 - x0) / (len(b) - 1)
    return [(x0 + k * step, cy + (v - 128) / 128 * amp) for k, v in enumerate(b)]


def spline(pts, per=18):
    """Catmull-Rom through the nodes, sampled; returns [(x, y, t_in_segment)]."""
    out = []
    n = len(pts)
    for i in range(n - 1):
        p0 = pts[max(i - 1, 0)]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[min(i + 2, n - 1)]
        for s in range(per):
            t = s / per
            t2, t3 = t * t, t * t * t
            x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y, t))
    out.append((pts[-1][0], pts[-1][1], 0.0))
    return out


def strand(samples, sign, gap):
    """One trace: the shared curve, pushed apart between nodes, together at each node."""
    pts = []
    for x, y, t in samples:
        pts.append(f'{x:.1f},{y + sign * gap * math.sin(math.pi * t):.1f}')
    return ' '.join(pts)


def scope(cx, cy, r, n):
    rings = ''.join(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r * (k + 1) / n:.1f}"/>' for k in range(n))
    cross = (f'<line x1="{cx - r:.1f}" y1="{cy:.1f}" x2="{cx + r:.1f}" y2="{cy:.1f}"/>'
             f'<line x1="{cx:.1f}" y1="{cy - r:.1f}" x2="{cx:.1f}" y2="{cy + r:.1f}"/>')
    return f'<g fill="none" stroke="{RING}" stroke-width="1.2">{rings}{cross}</g>'


def grid(x0, y0, w, h, step):
    g = ''.join(f'<line x1="{x0}" y1="{y:.1f}" x2="{x0 + w}" y2="{y:.1f}"/>' for y in [y0 + k * step for k in range(int(h // step) + 1)])
    return f'<g stroke="{GRID}" stroke-width="1">{g}</g>'


def traces(x0, x1, cy, amp, gap, s, animate):
    pts = nodes(x0, x1, cy, amp)
    samples = spline(pts)
    a_cls = ' class="tr"' if animate else ''
    b_cls = ' class="tr"' if animate else ''
    pl = ' pathLength="1"' if animate else ''
    out = [
        f'<polyline{a_cls}{pl} points="{strand(samples, 1, gap)}" fill="none" stroke="{DEEP}" stroke-width="{5 * s:.2f}" stroke-linejoin="round" stroke-linecap="round"/>',
        f'<polyline{b_cls}{pl} points="{strand(samples, -1, gap)}" fill="none" stroke="{WARM}" stroke-width="{3 * s:.2f}" stroke-linejoin="round" stroke-linecap="round"/>',
    ]
    for k, (x, y) in enumerate(pts):
        big = k % 4 == 0
        r = (9 if big else 6) * s
        cls = f' class="nd nd{k}"' if animate else ''
        out.append(f'<g{cls}><circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{BG}" stroke="{EDGE}" stroke-width="{1.6 * s:.2f}"/>'
                   f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r * 0.42:.1f}" fill="{OK}"/></g>')
    return ''.join(out)


def style(n):
    rules = [
        '.tr{animation:draw 9s cubic-bezier(.3,.7,.3,1) infinite}',
        '.nd{animation:agree 9s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}',
    ]
    rules += [f'.nd{k}{{animation-delay:{k * 0.11:.2f}s}}' for k in range(n)]
    return ('<style>\n' + '\n'.join(rules) + '\n'
            '@keyframes draw{0%{stroke-dasharray:0 1}40%{stroke-dasharray:1 0}100%{stroke-dasharray:1 0}}\n'
            '@keyframes agree{0%{opacity:.25;transform:scale(.6)}8%{opacity:1;transform:scale(1.15)}14%{transform:scale(1)}100%{opacity:1;transform:scale(1)}}\n'
            '@media (prefers-reduced-motion:reduce){.tr,.nd{animation:none}}\n'
            '</style>')


def media_svg():
    n = len(bytes.fromhex(TIP))
    art = traces(70, W - 70, H / 2, 190, 16, 1.0, True)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
            f'aria-label="Abstract: two braided signal traces, one blue and one orange, that meet at {n} ringed nodes and agree at every one, over the faint rings of a scope face">'
            f'{style(n)}<defs><clipPath id="frame"><rect width="{W}" height="{H}"/></clipPath></defs>'
            f'<g clip-path="url(#frame)"><rect width="{W}" height="{H}" fill="{BG}"/>{grid(0, 15, W, H, 40)}'
            f'{scope(W / 2, H / 2, 290, 5)}{art}</g></svg>\n')


def og_svg(block='0694'):
    # Static card in the generator's blockCard grammar, art on the right (as 0663 and 0689).
    art = traces(590, 1130, 300, 150, 11, 0.75, False)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<rect width="{W}" height="{H}" fill="#FFFFFF"/>
<rect x="560" y="60" width="600" height="480" fill="{BG}"/>
{grid(560, 80, 600, 440, 40)}
{scope(860, 300, 200, 4)}
{art}
<rect x="560" y="60" width="600" height="480" fill="none" stroke="{DEEP}" stroke-width="1.5"/>
<rect x="0" y="0" width="24" height="{H}" fill="{DEEP}"/>
<text x="80" y="100" font-family="JetBrains Mono, ui-monospace, monospace" font-size="22" font-weight="500" letter-spacing="3.2" fill="{EDGE}">CH.FD · № {block} · LINK</text>
<text x="80" y="138" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" font-weight="400" letter-spacing="2.5" fill="#5F5E5A">10.05.26 · DEVNET · NO VALUE</text>
<text x="80" y="250" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">Verify the devnet</text>
<text x="80" y="312" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">in Python, a second</text>
<text x="80" y="374" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">implementation.</text>
<text x="80" y="440" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="400" fill="#38373A">Written by Codex, reviewed by Claude.</text>
<text x="80" y="474" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="400" fill="#38373A">572 live blocks, 0 faults.</text>
<line x1="80" y1="{H - 70}" x2="{W - 80}" y2="{H - 70}" stroke="#C4C2BC" stroke-width="1"/>
<text x="80" y="{H - 35}" font-family="JetBrains Mono, ui-monospace, monospace" font-size="14" font-weight="500" letter-spacing="2.5" fill="#5F5E5A">POINTCAST.XYZ/CHAIN/BOTS</text>
</svg>
'''


if __name__ == '__main__':
    which = sys.argv[1]
    sys.stdout.write(media_svg() if which == 'media' else og_svg(sys.argv[2] if len(sys.argv) > 2 else '0694'))
