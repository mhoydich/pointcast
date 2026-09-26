# Hoydich Entertainment — annual report cover

`hoydich-annual-report-cover.jpg` (2400×3600, 2:3 poster) is rendered by
`flux_cover.py`: a warped height field drawn as contour stripes, with
stochastic riso-style grain, a blue/green/red "hero" contour, dark ink
zones, a moiré patch and slice-shift glitching on the right.

```
pip install numpy pillow
python3 designs/annual-report/flux_cover.py            # full size
python3 designs/annual-report/flux_cover.py --seed 7   # different glitch/grain
python3 designs/annual-report/flux_cover.py --scale 0.4 --out /tmp/preview.png
```

Caption text ("Hoydich Entertainment" / "Annual Report"), chip colors and the vertical wordmark live in `compose()`.
Type is Space Grotesk (SIL OFL, see `SpaceGrotesk-OFL.txt`).
