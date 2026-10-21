#!/usr/bin/env python3
"""Draw public/images/chain/plan.svg, the art of the /chain/plan wire block.

Abstract on purpose (PointCast art is objects, weather and signal; no people,
no places, no text): three rails for the three horizons, each a row of block
squares that gets longer, a ring at the head of each rail, a dashed branch off
the last rail that stops short (the parked market town), and one small open
square before the first rail (the first key the house did not make). Shapes
only, no text, no images, no links; the pulse stops under
prefers-reduced-motion.

    python3 scripts/generate-chain-plan-art.py
"""
from pathlib import Path

W, H = 1200, 630
BG, GRID, RING = "#EEF4FA", "#D5E3F2", "#C9DAEC"
INK, MID = "#0B3E73", "#185FA5"

out = []
out.append(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
    'aria-label="Three rails of block squares that grow longer from top to bottom, each ending in a ring, with a dashed branch '
    'off the last rail that stops short, and one open square standing apart at the start">'
)
out.append(
    "<style>.node{transform-box:fill-box;transform-origin:center;animation:pulse 5.6s ease-in-out infinite}"
    ".n0{animation-delay:0.0s}.n1{animation-delay:1.2s}.n2{animation-delay:2.4s}.n3{animation-delay:3.6s}"
    "@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@media (prefers-reduced-motion:reduce){.node{animation:none}}</style>"
)
out.append(f'<rect width="{W}" height="{H}" fill="{BG}"/>')
out.append(f'<g stroke="{GRID}" stroke-width="1">' + "".join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>' for y in range(45, H, 45)) + "</g>")

rails = [(185, 5), (315, 9), (445, 14)]  # (y, blocks): next month, next quarter, by spring
x0, size, gap = 250, 34, 18
for i, (y, n) in enumerate(rails):
    end = x0 + n * (size + gap) - gap
    g = [f'<g class="node n{i}">']
    g.append(f'<line x1="{x0 - 30}" y1="{y + size // 2}" x2="{end + 40}" y2="{y + size // 2}" stroke="{INK}" stroke-width="2"/>')
    for k in range(n):
        x = x0 + k * (size + gap)
        fill = MID if k < 2 and i == 0 else BG
        g.append(f'<rect x="{x}" y="{y}" width="{size}" height="{size}" fill="{fill}" stroke="{INK}" stroke-width="2"/>')
    g.append(f'<circle cx="{end + 64}" cy="{y + size // 2}" r="16" fill="none" stroke="{MID}" stroke-width="3"/>')
    g.append("</g>")
    out.append("".join(g))
    if i == 2:
        # the parked branch: dashed, rising off the last rail, stopping short of a faint ring
        bx = x0 + 6 * (size + gap) + size // 2
        out.append(
            f'<path d="M{bx} {y} L{bx + 90} {y - 70} L{bx + 260} {y - 70}" fill="none" stroke="{RING}" stroke-width="3" stroke-dasharray="6 8"/>'
        )
        out.append(f'<circle cx="{bx + 300}" cy="{y - 70}" r="14" fill="none" stroke="{RING}" stroke-width="3" stroke-dasharray="4 6"/>')

# the first outside key: one open square, apart, before the first rail
out.append(f'<g class="node n3"><rect x="136" y="{rails[0][0]}" width="{size}" height="{size}" fill="none" stroke="{MID}" stroke-width="3" stroke-dasharray="5 5"/></g>')
out.append(f'<g fill="none" stroke="{RING}" stroke-width="1.2"><circle cx="153" cy="{rails[0][0] + size // 2}" r="34"/><circle cx="153" cy="{rails[0][0] + size // 2}" r="58"/></g>')
out.append("</svg>")

dest = Path(__file__).resolve().parent.parent / "public/images/chain/plan.svg"
dest.write_text("".join(out) + "\n")
print(dest, dest.stat().st_size, "bytes")
