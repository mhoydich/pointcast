"""Art for the devnet restart block: one run of blocks that stops and is kept,
and a second run that starts from nothing.

The upper band is devnet-1 as it stood when the restart was announced: 819
sealed blocks, one tick each, in height order. A solid rule closes it — the
last block — and a frame encloses the whole run, because the run is kept as a
recording rather than deleted. The lower band is the chain that comes next: one
bright tick at height 1 and then dashes, because its genesis is not known yet.
The gap between the bands is the restart. Nothing crosses it.

Each tick's height comes from the bytes of devnet-1's tip hash and state root
at that moment (d0c2e541... and 30938dc8...), so the picture is the record. The
two seeds are consumed in order and never reused, so a tick's length is fixed
by where it sits in the run.

Abstract: ticks, rules, frames and dots only. No people, no places, no type.

Same recipe as scripts/generate-chain-daily-net-art.py: geometry and colour are
presentation attributes and the <style> holds only animation, so librsvg/sharp
rasterize a clean still while browsers animate.

  python3 scripts/generate-chain-reset-art.py media > public/images/chain/devnet-reset.svg
  python3 scripts/generate-chain-reset-art.py og 0700 > /tmp/og.svg
  node -e "require('sharp')(require('fs').readFileSync('/tmp/og.svg'),{density:160}).resize(1200,630).png({compressionLevel:9,quality:90}).toFile('public/images/og/b/0700.png')"

The OG card is committed, so scripts/generate-og-images.mjs keeps it. If the
block is renumbered, regenerate the card with the new id.
"""
import sys

W, H = 1200, 630

# devnet-1 as the sequencer reported it when the restart was announced,
# read with GET /status on 2026-10-06.
TIP_HASH = 'd0c2e541d2c3fba4ac15ccf5997ee3ac893882d529b98bfc004260e8882ed45d'
STATE_ROOT = '30938dc8ec04addc4bc229ccb9a782e1c8ba2cc8e3b8b22bfa7f8d5df5ea2525'
SEED = bytes.fromhex(TIP_HASH + STATE_ROOT)
HEIGHT = 819           # devnet-1's last block at announcement
NEXT_KNOWN = 1         # what is known about the next chain: that it starts at 1

# FD ramp, as in the yard, bots, first-mints, pcv and daily-net art.
BG, GRID, FAINT = '#EEF4FA', '#D5E3F2', '#B9CEE4'
EDGE, DEEP = '#0B3E73', '#185FA5'
OK = '#5FBF7F'   # the one tick that is known

PAD = 72
BAND_W = W - 2 * PAD
OLD_Y, OLD_H = 206, 150          # devnet-1's band
NEW_Y, NEW_H = 440, 86           # the next chain's band


def ticks(n, x0, width, y, h, seed_at):
    """n ticks evenly across `width`, each as long as its seed byte asks."""
    out = []
    step = width / n
    for i in range(n):
        b = SEED[(seed_at + i) % len(SEED)]
        # 0.34 to 1.0 of the band, so the run reads as a run and not as noise.
        frac = 0.34 + (b / 255) * 0.66
        hh = h * frac
        x = x0 + step * (i + 0.5)
        out.append((i, x, y + h - hh, hh))
    return out


def svg(body, extra_style=''):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" '
        f'aria-label="Abstract: an upper run of {HEIGHT} ticks closed by a solid rule and enclosed in a frame, '
        f'a gap, and a lower run that begins with one bright tick and continues as dashes">'
        f'<style>\n{extra_style}@keyframes sweep{{0%,6%{{opacity:0}}10%{{opacity:1}}44%,100%{{opacity:0}}}}\n'
        f'@keyframes stop{{0%,46%{{opacity:.25}}52%,100%{{opacity:1}}}}\n'
        f'@keyframes spark{{0%,58%{{opacity:0;transform:scaleY(0)}}66%{{opacity:1;transform:scaleY(1)}}'
        f'94%,100%{{opacity:1;transform:scaleY(1)}}}}\n'
        f'@keyframes dash{{0%,70%{{opacity:0}}82%,100%{{opacity:.55}}}}\n'
        f'.sw{{animation:sweep 11s linear infinite}}\n'
        f'.st{{animation:stop 11s ease-in-out infinite}}\n'
        f'.sp{{animation:spark 11s cubic-bezier(.3,.7,.3,1) infinite;transform-origin:center bottom}}\n'
        f'.ds{{animation:dash 11s ease-in-out infinite}}\n'
        f'@media (prefers-reduced-motion:reduce){{.sw,.st,.sp,.ds{{animation:none}}.sw{{opacity:0}}'
        f'.ds{{opacity:.55}}}}\n</style>'
        f'<rect width="{W}" height="{H}" fill="{BG}"/>'
        f'{body}</svg>'
    )


def art(frame_inset=0):
    p = []
    x0 = PAD + frame_inset
    bw = BAND_W - 2 * frame_inset

    # A faint baseline grid: the band each run sits on.
    for y in (OLD_Y + OLD_H, NEW_Y + NEW_H):
        p.append(f'<line x1="{x0}" y1="{y}" x2="{x0 + bw}" y2="{y}" stroke="{GRID}" stroke-width="2"/>')

    # ---- devnet-1: the whole run, kept. Two paths, not 819 elements: every
    # tick of a colour is one M/V pair, so the file stays small enough to ship.
    base = OLD_Y + OLD_H
    seg = {FAINT: [], DEEP: []}
    for i, x, y, h in ticks(HEIGHT, x0, bw - 26, OLD_Y, OLD_H, 0):
        seg[DEEP if i % 7 == 0 else FAINT].append(f'M{x:.1f},{y:.0f}V{base}')
    for c, d in seg.items():
        p.append(f'<path d="{"".join(d)}" fill="none" stroke="{c}" stroke-width="1.1"/>')
    # the sweep that reads the run
    p.append(f'<g class="sw"><rect x="{x0}" y="{OLD_Y - 8}" width="{bw * 0.1:.1f}" height="{OLD_H + 16}" fill="{DEEP}" opacity=".12"/></g>')
    # the last block: a solid rule that closes the run
    sx = x0 + bw - 20
    p.append(f'<g class="st"><line x1="{sx:.1f}" y1="{OLD_Y - 14}" x2="{sx:.1f}" y2="{OLD_Y + OLD_H + 14}" stroke="{EDGE}" stroke-width="5"/></g>')
    # the frame: the run is enclosed, not erased
    p.append(
        f'<rect x="{x0 - 20}" y="{OLD_Y - 30}" width="{bw + 40}" height="{OLD_H + 60}" fill="none" '
        f'stroke="{EDGE}" stroke-width="2.5"/>'
    )
    # four corner dots: the pin that keeps the recording readable
    for cx in (x0 - 20, x0 + bw + 20):
        for cy in (OLD_Y - 30, OLD_Y + OLD_H + 30):
            p.append(f'<circle cx="{cx}" cy="{cy}" r="4.5" fill="{EDGE}"/>')

    # ---- the gap. Nothing crosses it; a row of dots marks it.
    gy = (OLD_Y + OLD_H + 30 + NEW_Y) / 2
    for i in range(9):
        cx = x0 + bw * (i + 0.5) / 9
        p.append(f'<circle cx="{cx:.1f}" cy="{gy:.1f}" r="2.6" fill="{FAINT}"/>')

    # ---- the next chain: one known tick, then dashes.
    for i in range(NEXT_KNOWN):
        x = x0 + 14 + i * 9
        p.append(
            f'<g class="sp"><line x1="{x:.1f}" y1="{NEW_Y}" x2="{x:.1f}" y2="{NEW_Y + NEW_H}" '
            f'stroke="{OK}" stroke-width="5"/></g>'
        )
    p.append(
        f'<g class="ds"><line x1="{x0 + 40}" y1="{NEW_Y + NEW_H}" x2="{x0 + bw - 4}" y2="{NEW_Y + NEW_H}" '
        f'stroke="{DEEP}" stroke-width="3" stroke-dasharray="7 13" stroke-linecap="round"/></g>'
    )
    # an open bracket on the left: the new run has a start and no end yet
    p.append(
        f'<path d="M{x0 - 20},{NEW_Y - 22} L{x0 - 20},{NEW_Y + NEW_H + 22} M{x0 - 20},{NEW_Y - 22} '
        f'L{x0 + 24},{NEW_Y - 22} M{x0 - 20},{NEW_Y + NEW_H + 22} L{x0 + 24},{NEW_Y + NEW_H + 22}" '
        f'fill="none" stroke="{EDGE}" stroke-width="2.5"/>'
    )
    return ''.join(p)


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'media'
    if mode == 'og':
        # The OG card: the same picture, a little tighter, no animation needed
        # for the raster but kept so the SVG is one file.
        sys.stdout.write(svg(art(frame_inset=22)))
    else:
        sys.stdout.write(svg(art()))


if __name__ == '__main__':
    main()
