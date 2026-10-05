"""Art for the First Mints block: one small card per First Mint in the
rehearsal, in serial order, each in its own recipe's background and ink,
with concentric rings whose arcs are set by the recipe's trait bytes. The
cards "mint" one after another in the animated media version. Abstract:
rings, tiles and signal bars only, no people, no places, no type.

Reads public/chain/yard/first-mints/mints.json, so the picture is the data.
Same recipe as scripts/generate-chain-bots-art.py: geometry and colour are
presentation attributes and the <style> holds only animation, so
librsvg/sharp rasterize a clean still while browsers animate.

  python3 scripts/generate-chain-first-mints-art.py media > public/images/chain/first-mints.svg
  python3 scripts/generate-chain-first-mints-art.py og 0689 > /tmp/og.svg
  node -e "require('sharp')(require('fs').readFileSync('/tmp/og.svg'),{density:160}).resize(1200,630).png({compressionLevel:9,quality:90}).toFile('public/images/og/b/0689.png')"

The OG card is committed, so scripts/generate-og-images.mjs keeps it. If the
block is renumbered, regenerate the card with the new id.
"""
import json, math, os, sys

W, H = 1200, 630
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MINTS = os.path.join(ROOT, 'public', 'chain', 'yard', 'first-mints', 'mints.json')

# FD ramp, as in the yard and bots art.
BG, GRID = '#EEF4FA', '#D5E3F2'
EDGE, DEEP = '#0B3E73', '#185FA5'
OK = '#5FBF7F'

# First Mint palettes (pointcast-chain sdk/first-mint.js, BG_V1 and INK_V1).
BG_V1 = ['#d5d7e1', '#e1d7d5', '#185fa5', '#0a6c9f', '#2f8f4e', '#e0a100', '#e5663b', '#c0262d',
         '#d6457a', '#7152a4', '#1f2a33', '#07172c', '#f3ead7', '#f9c56c', '#9fb8c8', '#111111']
INK_V1 = ['#111111', '#ffffff', '#f3ead7', '#f9c56c', '#07172c', '#185fa5', '#2f8f4e', '#c0262d',
          '#d6457a', '#7152a4', '#e0a100', '#e5663b', '#0a6c9f', '#1f2a33', '#9fb8c8', '#e1d7d5']


def load():
    with open(MINTS) as f:
        rows = json.load(f)
    out = []
    for m in rows:
        if m.get('collection') != 'first-mints':
            continue
        b = bytes.fromhex(m['recipe_hex'])
        out.append({'serial': m['serial'], 'traits': list(b[1:5]), 'bg': BG_V1[b[5]], 'ink': INK_V1[b[8]],
                    'pattern': b[6], 'text_len': int.from_bytes(b[10:14], 'big')})
    out.sort(key=lambda r: r['serial'])
    return out


def arc(cx, cy, r, a0, a1):
    """An arc path from angle a0 to a1 (degrees, clockwise from 12 o'clock)."""
    x0 = cx + r * math.sin(math.radians(a0))
    y0 = cy - r * math.cos(math.radians(a0))
    x1 = cx + r * math.sin(math.radians(a1))
    y1 = cy - r * math.cos(math.radians(a1))
    large = 1 if (a1 - a0) % 360 > 180 else 0
    return f'M{x0:.1f} {y0:.1f}A{r:.1f} {r:.1f} 0 {large} 1 {x1:.1f} {y1:.1f}'


def card(m, x, y, w, h, s, cls=''):
    """One mini card: background, frame, faint rings, trait arcs, a signal bar."""
    out = [f'<g{cls}>']
    out.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{m["bg"]}" stroke="{EDGE}" stroke-width="{1.4 * s:.2f}"/>')
    pad = 5 * s
    out.append(f'<rect x="{x + pad:.1f}" y="{y + pad:.1f}" width="{w - 2 * pad:.1f}" height="{h - 2 * pad:.1f}" fill="none" stroke="{m["ink"]}" stroke-opacity=".4" stroke-width="{.8 * s:.2f}"/>')
    cx, cy = x + w / 2, y + h * 0.4
    r0 = w * 0.34
    sw = w * 0.055
    rings = [r0 * (1 - k * 0.22) for k in range(4)]
    out.append(f'<g fill="none" stroke="{m["ink"]}" stroke-width="{sw:.2f}" stroke-opacity=".18">'
               + ''.join(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}"/>' for r in rings) + '</g>')
    # Trait bytes set where each arc starts and how far it sweeps, so every card differs.
    out.append(f'<g fill="none" stroke="{m["ink"]}" stroke-width="{sw:.2f}" stroke-linecap="round">')
    for k, r in enumerate(rings):
        t = m['traits'][k]
        start = (t * 37 + k * 53) % 360
        sweep = 110 + (t * 29 + m['serial'] * 11) % 200
        out.append(f'<path d="{arc(cx, cy, r, start, start + sweep)}"/>')
    out.append('</g>')
    # A centre tile and a row of signal bars sized by the words' length.
    c = w * 0.07
    out.append(f'<rect x="{cx - c:.1f}" y="{cy - c:.1f}" width="{2 * c:.1f}" height="{2 * c:.1f}" fill="{m["ink"]}"/>')
    bars = max(1, min(12, m['text_len']))
    bw = (w - 2 * pad - 8 * s) / 12
    by = y + h * 0.8
    for k in range(bars):
        bh = (4 + (m['traits'][k % 4] + k * 7) % 9) * s
        out.append(f'<rect x="{x + pad + 4 * s + k * bw:.1f}" y="{by - bh:.1f}" width="{bw * 0.62:.1f}" height="{bh:.1f}" fill="{m["ink"]}"/>')
    out.append('</g>')
    return ''.join(out)


def wall(mints, cols, x0, y0, w, h, gap, s, animate):
    out = []
    for n, m in enumerate(mints):
        r, c = divmod(n, cols)
        x = x0 + c * (w + gap)
        y = y0 + r * (h + gap)
        cls = f' class="m m{n}"' if animate else ''
        out.append(card(m, x, y, w, h, s, cls))
    return ''.join(out)


def style(n):
    rules = ['.m{animation:mint 7.2s cubic-bezier(.25,.8,.35,1) infinite;transform-box:fill-box;transform-origin:50% 50%}']
    rules += [f'.m{k}{{animation-delay:{k * 0.25:.2f}s}}' for k in range(n)]
    return ('<style>\n' + '\n'.join(rules) + '\n'
            '@keyframes mint{0%{opacity:.18;transform:translate(0,-10px) scale(.96)}6%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:1;transform:translate(0,0) scale(1)}}\n'
            '@media (prefers-reduced-motion:reduce){.m{animation:none}}\n'
            '</style>')


def grid():
    g = ''.join(f'<line x1="{x}" y1="0" x2="{x - 1100}" y2="{1100 * 0.5774:.1f}" stroke="{GRID}" stroke-width="1"/>' for x in range(0, W + 1100, 70))
    g += ''.join(f'<line x1="{x}" y1="0" x2="{x + 1100}" y2="{1100 * 0.5774:.1f}" stroke="{GRID}" stroke-width="1"/>' for x in range(-1100, W, 70))
    return g


def media_svg():
    mints = load()
    cols = 8
    rows = -(-len(mints) // cols)
    w, h, gap = 104, 139, 14
    tw, th = cols * w + (cols - 1) * gap, rows * h + (rows - 1) * gap
    x0, y0 = (W - tw) / 2, (H - th) / 2
    art = wall(mints, cols, x0, y0, w, h, gap, 1.0, True)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
            f'aria-label="Abstract wall of {len(mints)} small cards in serial order, each a different colour with concentric ring arcs, a centre tile and a row of signal bars">'
            f'{style(len(mints))}<defs><clipPath id="frame"><rect width="{W}" height="{H}"/></clipPath></defs>'
            f'<g clip-path="url(#frame)"><rect width="{W}" height="{H}" fill="{BG}"/>{grid()}{art}</g></svg>\n')


def og_svg(block='0689'):
    # Static card in the generator's blockCard grammar, art on the right (as 0660 and 0663).
    mints = load()
    cols = 6
    rows = -(-len(mints) // cols)
    w, h, gap = 78, 104, 12
    tw, th = cols * w + (cols - 1) * gap, rows * h + (rows - 1) * gap
    x0, y0 = 560 + (600 - tw) / 2, 60 + (480 - th) / 2
    art = wall(mints, cols, x0, y0, w, h, gap, 0.75, False)
    n = len(mints)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<rect width="{W}" height="{H}" fill="#FFFFFF"/>
<rect x="560" y="60" width="600" height="480" fill="{BG}"/>
{art}
<rect x="560" y="60" width="600" height="480" fill="none" stroke="{DEEP}" stroke-width="1.5"/>
<rect x="0" y="0" width="24" height="{H}" fill="{DEEP}"/>
<text x="80" y="100" font-family="JetBrains Mono, ui-monospace, monospace" font-size="22" font-weight="500" letter-spacing="3.2" fill="{EDGE}">CH.FD · № {block} · LINK</text>
<text x="80" y="138" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" font-weight="400" letter-spacing="2.5" fill="#5F5E5A">10.05.26 · REHEARSAL · NO VALUE</text>
<text x="80" y="250" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">First Mints:</text>
<text x="80" y="312" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">{n} cards, minted</text>
<text x="80" y="374" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">on a rehearsal.</text>
<text x="80" y="440" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="400" fill="#38373A">Only the recipe is on chain.</text>
<text x="80" y="474" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="400" fill="#38373A">Public dev keys. Verify in your browser.</text>
<line x1="80" y1="{H - 70}" x2="{W - 80}" y2="{H - 70}" stroke="#C4C2BC" stroke-width="1"/>
<text x="80" y="{H - 35}" font-family="JetBrains Mono, ui-monospace, monospace" font-size="14" font-weight="500" letter-spacing="2.5" fill="#5F5E5A">POINTCAST.XYZ/CHAIN/MINTS</text>
</svg>
'''


if __name__ == '__main__':
    which = sys.argv[1]
    sys.stdout.write(media_svg() if which == 'media' else og_svg(sys.argv[2] if len(sys.argv) > 2 else '0689'))
