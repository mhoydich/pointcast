# Hoydich Entertainment — annual report cover

`hoydich-annual-report-cover.jpg` (2400×3600, 2:3 poster) is rendered by
`flux_cover.py`. The concept is a **broadcast sunset**: a sun setting into
the Pacific sends warped signal rings across the sky (with a mint / cobalt /
gold hero ring and a small interfering second transmitter). Below the
horizon the swell is drawn in perspective, and the sun's reflection glitches
as slice-shifted rows. Everything is printed with stochastic riso-style grain.

```
pip install numpy pillow
python3 designs/annual-report/flux_cover.py            # full size
python3 designs/annual-report/flux_cover.py --seed 7   # different glitch/grain
python3 designs/annual-report/flux_cover.py --scale 0.4 --out /tmp/preview.png
```

The palette constants, `HORIZON`, `SUN` and `SUN_R` sit at the top of the
script. The caption ("Hoydich Entertainment" / "Annual Report"), the three
signal dots and the vertical wordmark are in `compose()`.
Type is Space Grotesk (SIL OFL, see `SpaceGrotesk-OFL.txt`).

## Hat

`hat/hat.py` renders the matching cap:

- `hat/hat-patch.png`: a flat circular patch in six thread colours on navy twill, with a gold merrowed border, sun, signal rings, swell and reflection. It's on transparency so it can go straight to an embroidery vendor.
- `hat/hat-mockup.png`: a front view of a cream crown with a navy visor, gold visor stitching, the patch on the front panel and a small cobalt HOYDICH on the right panel.

```
python3 designs/annual-report/hat/hat.py
```
