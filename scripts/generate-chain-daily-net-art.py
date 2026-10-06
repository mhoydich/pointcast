"""Art for the Daily Net block: a roll of check rings, one per checkpoint.

The devnet sets a checkpoint every 10 blocks. On the day the Daily Net opened
it had sealed 60 of them, №10 to №600, and one key had signed one: claude-code
attested №590 (included in block 600) and the devnet found it agreed with its
own block hash and state root. So the roll is 60 ring sets in height order:
every checkpoint nobody has signed is faint and left open, №590 is closed in
deep blue around a green core, and №600, the day checkpoint still waiting for
a key, is a dashed ring.

Each ring set's ring count and the angle of its opening come from the bytes of
№590's block hash and state root (6b178129... and ee69d7f5...), so the
picture is the record. Abstract: rings, arcs and dots only, no people, no
places, no type.

Same recipe as scripts/generate-chain-pcv-py-art.py: geometry and colour are
presentation attributes and the <style> holds only animation, so librsvg/sharp
rasterize a clean still while browsers animate.

  python3 scripts/generate-chain-daily-net-art.py media > public/images/chain/daily-net.svg
  python3 scripts/generate-chain-daily-net-art.py og 0695 > /tmp/og.svg
  node -e "require('sharp')(require('fs').readFileSync('/tmp/og.svg'),{density:160}).resize(1200,630).png({compressionLevel:9,quality:90}).toFile('public/images/og/b/0695.png')"

The OG card is committed, so scripts/generate-og-images.mjs keeps it. If the
block is renumbered, regenerate the card with the new id.
"""
import math, sys

W, H = 1200, 630

# Checkpoint №590 as the devnet stored it, read with GET /checkpoints/590/witnesses.
BLOCK_HASH = '6b1781296c67661ec97f03d29f66336773e2760ff5f5d6a42581261a0eebabec'
STATE_ROOT = 'ee69d7f539e6c8697336e1ad2fb3901e8151a96e2c884db602b1ab2f767611d6'
SEED = bytes.fromhex(BLOCK_HASH + STATE_ROOT)

INTERVAL = 10
HEIGHTS = list(range(INTERVAL, 601, INTERVAL))   # №10 … №600: 60 checkpoints
WITNESSED = {590}                                # signed by one key, agreed with this server
WAITING = 600                                    # the day checkpoint, sealed, no key yet

# FD ramp, as in the yard, bots, first-mints and pcv art.
BG, GRID, FAINT = '#EEF4FA', '#D5E3F2', '#B9CEE4'
EDGE, DEEP = '#0B3E73', '#185FA5'
OK = '#5FBF7F'   # agreement


def arc(cx, cy, r, start, gap):
    """A ring left open by `gap` degrees, starting at `start` degrees."""
    a0 = math.radians(start + gap / 2)
    a1 = math.radians(start + 360 - gap / 2)
    x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
    x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
    return f'M{x0:.1f},{y0:.1f} A{r:.1f},{r:.1f} 0 1 1 {x1:.1f},{y1:.1f}'


def ring_set(k, h, cx, cy, r, s, animate):
    b = SEED[k % len(SEED)]
    n = 2 + b % 3                      # 2 to 4 rings
    start = b * 360 / 256              # where the opening sits
    cls = f' class="rs rs{k}"' if animate else ''
    out = [f'<g{cls}>']
    if h in WITNESSED:
        for j in range(n):
            rr = r * (j + 1) / n
            w = (2.6 if j == n - 1 else 1.6) * s
            draw = ' class="close" pathLength="1"' if animate and j == n - 1 else ''
            out.append(f'<circle{draw} cx="{cx:.1f}" cy="{cy:.1f}" r="{rr:.1f}" fill="none" stroke="{DEEP}" stroke-width="{w:.2f}"/>')
        out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r * 0.3:.1f}" fill="{OK}"/>')
    elif h == WAITING:
        for j in range(n - 1):
            out.append(f'<path d="{arc(cx, cy, r * (j + 1) / n, start, 46)}" fill="none" stroke="{FAINT}" stroke-width="{1.4 * s:.2f}" stroke-linecap="round"/>')
        out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="none" stroke="{DEEP}" stroke-width="{1.8 * s:.2f}" stroke-dasharray="{4 * s:.1f} {5 * s:.1f}"/>')
        out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{2.6 * s:.1f}" fill="{DEEP}"/>')
    else:
        for j in range(n):
            out.append(f'<path d="{arc(cx, cy, r * (j + 1) / n, start + j * 23, 46)}" fill="none" stroke="{FAINT}" stroke-width="{1.4 * s:.2f}" stroke-linecap="round"/>')
        out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{2.2 * s:.1f}" fill="{FAINT}"/>')
    out.append('</g>')
    return ''.join(out)


def roll(x0, y0, w, h, cols, r, s, animate):
    rows = math.ceil(len(HEIGHTS) / cols)
    dx = w / cols
    dy = h / rows
    rails = ''.join(f'<line x1="{x0 + dx / 2:.1f}" y1="{y0 + dy * (i + 0.5):.1f}" x2="{x0 + w - dx / 2:.1f}" y2="{y0 + dy * (i + 0.5):.1f}"/>' for i in range(rows))
    out = [f'<g stroke="{GRID}" stroke-width="{1.2 * s:.2f}">{rails}</g>']
    for k, h_ in enumerate(HEIGHTS):
        cx = x0 + dx * (k % cols + 0.5)
        cy = y0 + dy * (k // cols + 0.5)
        out.append(ring_set(k, h_, cx, cy, r, s, animate))
    return ''.join(out)


def grid(x0, y0, w, h, step):
    g = ''.join(f'<line x1="{x0}" y1="{y:.1f}" x2="{x0 + w}" y2="{y:.1f}"/>' for y in [y0 + k * step for k in range(int(h // step) + 1)])
    return f'<g stroke="{GRID}" stroke-width="1" opacity=".55">{g}</g>'


def style(n):
    rules = [
        '.rs{animation:scan 12s ease-in-out infinite}',
        '.close{animation:close 12s cubic-bezier(.3,.7,.3,1) infinite}',
    ]
    rules += [f'.rs{k}{{animation-delay:{k * 0.12:.2f}s}}' for k in range(n)]
    return ('<style>\n' + '\n'.join(rules) + '\n'
            '@keyframes scan{0%{opacity:.55}6%{opacity:1}14%{opacity:1}24%{opacity:.8}100%{opacity:.8}}\n'
            '@keyframes close{0%{stroke-dasharray:0 1}70%{stroke-dasharray:0 1}82%{stroke-dasharray:1 0}100%{stroke-dasharray:1 0}}\n'
            '@media (prefers-reduced-motion:reduce){.rs,.close{animation:none}}\n'
            '</style>')


def media_svg():
    n = len(HEIGHTS)
    art = roll(60, 45, W - 120, H - 90, 12, 34, 1.0, True)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
            f'aria-label="Abstract: a roll of {n} check rings in rows, one per checkpoint; all but two are faint and left open, '
            f'one is closed in deep blue around a green core, and the last is a dashed ring">'
            f'{style(n)}<defs><clipPath id="frame"><rect width="{W}" height="{H}"/></clipPath></defs>'
            f'<g clip-path="url(#frame)"><rect width="{W}" height="{H}" fill="{BG}"/>{grid(0, 15, W, H, 40)}{art}</g></svg>\n')


def og_svg(block='0695'):
    # Static card in the generator's blockCard grammar, art on the right (as 0663, 0689 and 0694).
    art = roll(580, 80, 560, 440, 10, 23, 0.72, False)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<rect width="{W}" height="{H}" fill="#FFFFFF"/>
<rect x="560" y="60" width="600" height="480" fill="{BG}"/>
{grid(560, 80, 600, 440, 40)}
{art}
<rect x="560" y="60" width="600" height="480" fill="none" stroke="{DEEP}" stroke-width="1.5"/>
<rect x="0" y="0" width="24" height="{H}" fill="{DEEP}"/>
<text x="80" y="100" font-family="JetBrains Mono, ui-monospace, monospace" font-size="22" font-weight="500" letter-spacing="3.2" fill="{EDGE}">CH.FD · № {block} · LINK</text>
<text x="80" y="138" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" font-weight="400" letter-spacing="2.5" fill="#5F5E5A">10.05.26 · DEVNET · NO VALUE</text>
<text x="80" y="250" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">The Daily Net:</text>
<text x="80" y="312" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">bots check in,</text>
<text x="80" y="374" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="500" fill="#12110E">agents witness.</text>
<text x="80" y="440" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="400" fill="#38373A">First witness: claude-code, block 600.</text>
<text x="80" y="474" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="400" fill="#38373A">A witness is a claim, not proof.</text>
<line x1="80" y1="{H - 70}" x2="{W - 80}" y2="{H - 70}" stroke="#C4C2BC" stroke-width="1"/>
<text x="80" y="{H - 35}" font-family="JetBrains Mono, ui-monospace, monospace" font-size="14" font-weight="500" letter-spacing="2.5" fill="#5F5E5A">POINTCAST.XYZ/CHAIN/NET</text>
</svg>
'''


if __name__ == '__main__':
    which = sys.argv[1]
    sys.stdout.write(media_svg() if which == 'media' else og_svg(sys.argv[2] if len(sys.argv) > 2 else '0695'))
