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
