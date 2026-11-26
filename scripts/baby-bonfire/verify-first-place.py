#!/usr/bin/env python3
"""Second, independent check of the Baby Bonfire first place kit.

    pip install trimesh numpy rtree pillow
    python3 scripts/baby-bonfire/verify-first-place.py [--renders DIR]

Reads the STL files and params.json under public/baby-bonfire/first-place/files/ and checks,
without using any of the generator's code:

  1. each mesh is one closed, consistently wound body (trimesh: watertight, winding, one body)
  2. its bounding box is what params.json says it should be
  3. its volume equals the volume worked out by hand from params.json
  4. points inside and outside it agree with a plain description of the shape, so every
     feature is where params.json puts it
  5. the thinnest stretch of plastic, measured by casting a ray inward from every triangle
  6. sitting the way it prints, no face overhangs by more than 45 degrees

With --renders it also writes shaded pictures of every part, for a person to look at.
This script is not run in CI. It exits 1 if any check fails.
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parents[2]
FILES = ROOT / "public/baby-bonfire/first-place/files"
P = json.loads((FILES / "params.json").read_text())
MARGIN = 0.06  # mm: a round edge drawn with straight segments strays by less than this
failures = []


def check(ok, text):
    print(f"    {'ok  ' if ok else 'FAIL'} {text}")
    if not ok:
        failures.append(text)


# ---- numbers that follow from params.json (worked out again here, on purpose) ------------------
tile, bay, landing, tag, feet = P["tile"], P["bay"], P["landing"], P["tagRecess"], P["feet"]
puck, shell, lid, mesh = P["puck"], P["shell"], P["lid"], P["mesh"]
A = tile["size"] / 2
R = tile["cornerRadius"]
T = tile["bodyHeight"]
CT, CB = tile["topChamfer"], tile["bottomChamfer"]
RP = puck["diameter"] / 2
SEAT = puck["seatChamfer"]
RB = RP + bay["clearance"]
LI, WD = bay["leadIn"], bay["wallDepth"]
SD = WD + SEAT
RT = tag["stickerDiameter"] / 2 + tag["clearance"]
RG, GW, GD = landing["ringDiameter"] / 2, landing["grooveWidth"] / 2, landing["grooveDepth"]
RF, FH, FT = feet["diameter"] / 2, feet["height"], feet["taper"]
FOOT = A - feet["inset"]
FEET = [(FOOT, FOOT), (-FOOT, FOOT), (-FOOT, -FOOT), (FOOT, -FOOT)]
RC = RP - shell["wall"]
RLO = RC - lid["lipClearance"]
RLI = RLO - lid["lipWall"]
LT, LH, LC, LL = lid["thickness"], lid["lipHeight"], lid["topChamfer"], lid["lipLeadIn"]


def ngon(n):
    """Area of a regular n-gon over the area of its circumscribed circle."""
    return n / (2 * math.pi) * math.sin(2 * math.pi / n)


def frustum(r1, r2, h):
    return math.pi * h * (r1 * r1 + r1 * r2 + r2 * r2) / 3


def slab(u0, u1, h):
    """Rounded square whose corner radius goes from u0 to u1 over height h (straight sides fixed)."""
    c = A - R
    k = mesh["cornerSegments"]
    kappa = 2 * k * math.sin(math.pi / (2 * k))
    return h * (4 * c * c + 8 * c * (u0 + u1) / 2 + kappa * (u0 * u0 + u0 * u1 + u1 * u1) / 3)


K_ROUND, K_SMALL, K_FOOT = ngon(mesh["roundSegments"]), ngon(mesh["smallSegments"]), ngon(mesh["footSegments"])


def volume_tile():
    body = slab(R - CB, R, CB) + slab(R, R, T - CB - CT) + slab(R, R - CT, CT)
    hole = K_ROUND * (frustum(RB + LI, RB, LI) + math.pi * RB * RB * (WD - LI) + frustum(RB, RB - SEAT, SEAT)
                      + math.pi * (RB - SEAT) ** 2 * (T - SD))
    groove = K_ROUND * 2 * math.pi * RG * GW * GD
    recess = K_SMALL * math.pi * RT * RT * tag["depth"]
    four_feet = 4 * K_FOOT * frustum(RF, RF - FT, FH)
    return body - hole - groove - recess + four_feet


def volume_blank():
    h, c = puck["blankHeight"], puck["topChamfer"]
    return K_ROUND * (frustum(RP - SEAT, RP, SEAT) + math.pi * RP * RP * (h - SEAT - c) + frustum(RP, RP - c, c))


def volume_shell():
    h = shell["height"]
    return K_ROUND * (frustum(RP - SEAT, RP, SEAT) + math.pi * RP * RP * (h - SEAT) - math.pi * RC * RC * (h - shell["floor"]))


def volume_lid():
    m, w = mesh["ventEndSegments"], lid["ventWidth"] / 2
    slot = 2 * w * (lid["ventOuter"] - lid["ventInner"]) + m * w * w * math.sin(math.pi / m)
    plate = K_ROUND * (frustum(RP - LC, RP, LC) + math.pi * RP * RP * (LT - LC)) - lid["vents"] * slot * LT
    lip = K_ROUND * (math.pi * (RLO * RLO - RLI * RLI) * (LH - LL) + frustum(RLO, RLO - LL, LL) - math.pi * RLI * RLI * LL)
    return plate + lip


# ---- a plain description of each shape: is a point in the plastic? ------------------------------
# d > 0 answers for a shape made slightly smaller everywhere, d < 0 for one made slightly larger.

def in_tile(pts, d):
    x, y, z = pts[:, 0], -pts[:, 1], T - pts[:, 2]  # back to the way the tile is used
    inset = np.maximum(0, np.maximum(CB - z, z - (T - CT)))
    c = A - R
    qx, qy = np.abs(x) - c, np.abs(y) - c
    edge = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - (R - inset)
    body = (z >= d) & (z <= T - d) & (edge <= -d)
    foot = np.zeros(len(pts), bool)
    for fx, fy in FEET:
        radius = RF + FT * np.clip(z / FH, -1, 0)
        foot |= (z >= -FH + d) & (z <= d) & (np.hypot(x - fx, y - fy) <= radius - d)
    rho = np.hypot(x - bay["x"], y - bay["y"])
    hole_r = np.where(z >= T - LI, RB + (z - (T - LI)), np.where(z >= T - WD, RB, np.where(z >= T - SD, RB - ((T - WD) - z), RB - SEAT)))
    hole = rho < hole_r + d
    rho = np.hypot(x - landing["x"], y - landing["y"])
    groove = (z > T - GD - d) & (np.abs(rho - RG) < GW * np.clip((z - (T - GD)) / GD, 0, 1) + d)
    recess = (np.hypot(x - tag["x"], y - tag["y"]) < RT + d) & (z < tag["depth"] + d)
    return (body | foot) & ~hole & ~groove & ~recess


def in_blank(pts, d):
    rho, z = np.hypot(pts[:, 0], pts[:, 1]), pts[:, 2]
    h, c = puck["blankHeight"], puck["topChamfer"]
    radius = np.minimum(RP, np.minimum(RP - SEAT + z, RP - c + (h - z)))
    return (z >= d) & (z <= h - d) & (rho <= radius - d)


def in_shell(pts, d):
    rho, z = np.hypot(pts[:, 0], pts[:, 1]), pts[:, 2]
    h = shell["height"]
    outer = (z >= d) & (z <= h - d) & (rho <= np.minimum(RP, RP - SEAT + z) - d)
    cavity = (z > shell["floor"] - d) & (rho < RC + d)
    return outer & ~cavity


def in_lid(pts, d):
    x, y, z = pts[:, 0], pts[:, 1], pts[:, 2]
    rho = np.hypot(x, y)
    plate = (z >= d) & (z <= LT - d) & (rho <= np.minimum(RP, RP - LC + z) - d)
    lip = (z >= LT - abs(d)) & (z <= LT + LH - d) & (rho >= RLI + d) & (rho <= np.minimum(RLO, RLO - LL + (LT + LH - z)) - d)
    slot = np.zeros(len(pts), bool)
    for i in range(lid["vents"]):
        a = 2 * math.pi * i / lid["vents"]
        along = x * math.cos(a) + y * math.sin(a)
        across = -x * math.sin(a) + y * math.cos(a)
        nearest = np.clip(along, lid["ventInner"], lid["ventOuter"])
        slot |= np.hypot(along - nearest, across) < lid["ventWidth"] / 2 + d
    return (plate & ~slot) | lip


PARTS = [
    ("place-tile.stl", [tile["size"], tile["size"], T + FH], volume_tile, in_tile, 1),
    ("puck-blank.stl", [puck["diameter"], puck["diameter"], puck["blankHeight"]], volume_blank, in_blank, 0),
    ("puck-shell.stl", [puck["diameter"], puck["diameter"], shell["height"]], volume_shell, in_shell, 0),
    ("puck-lid.stl", [puck["diameter"], puck["diameter"], LT + LH], volume_lid, in_lid, lid["vents"]),
]


def thinnest(m):
    """Shortest path through plastic, going straight in from the middle of every triangle."""
    origins = m.triangles_center - m.face_normals * 1e-4
    hits, ray, _ = m.ray.intersects_location(origins, -m.face_normals, multiple_hits=False)
    dist = np.full(len(m.faces), np.inf)
    dist[ray] = np.linalg.norm(hits - origins[ray], axis=1)
    return float(dist.min()), m.triangles_center[int(dist.argmin())]


def render(m, path, yaw, pitch, size=900, flip=False):
    """Shaded picture with a depth buffer. flip turns the part over first (half a turn about x)."""
    from PIL import Image

    v = m.vertices.copy()
    if flip:
        v = v * [1, -1, -1]
    v = v - (v.max(0) + v.min(0)) / 2
    cy, sy, cp, sp = math.cos(yaw), math.sin(yaw), math.cos(pitch), math.sin(pitch)
    rot = np.array([[cy, -sy, 0], [sy * sp, cy * sp, cp], [-sy * cp, -cy * cp, sp]])  # rows: right, up, toward the eye
    w = v @ rot.T
    scale = (size * 0.86) / (2 * np.abs(w[:, :2]).max())
    px = w[:, 0] * scale + size / 2
    py = size / 2 - w[:, 1] * scale
    depth = np.full((size, size), -np.inf)
    shade = np.zeros((size, size))
    normals = np.cross(w[m.faces[:, 1]] - w[m.faces[:, 0]], w[m.faces[:, 2]] - w[m.faces[:, 0]])
    normals /= np.linalg.norm(normals, axis=1)[:, None]
    light = np.array([-0.35, 0.55, 0.76])
    light /= np.linalg.norm(light)
    for f, n in zip(m.faces, normals):
        if n[2] <= 0:
            continue
        xs, ys, zs = px[f], py[f], w[f, 2]
        x0, x1 = max(int(xs.min()), 0), min(int(xs.max()) + 1, size - 1)
        y0, y1 = max(int(ys.min()), 0), min(int(ys.max()) + 1, size - 1)
        if x1 < x0 or y1 < y0:
            continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        den = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
        if abs(den) < 1e-12:
            continue
        a = ((ys[1] - ys[2]) * (gx - xs[2]) + (xs[2] - xs[1]) * (gy - ys[2])) / den
        b = ((ys[2] - ys[0]) * (gx - xs[2]) + (xs[0] - xs[2]) * (gy - ys[2])) / den
        c = 1 - a - b
        zz = a * zs[0] + b * zs[1] + c * zs[2]
        block = depth[y0:y1 + 1, x0:x1 + 1]
        hit = (a >= -1e-6) & (b >= -1e-6) & (c >= -1e-6) & (zz > block)
        block[hit] = zz[hit]
        shade[y0:y1 + 1, x0:x1 + 1][hit] = 0.30 + 0.70 * max(0.0, float(n @ light))
    solid = np.isfinite(depth)
    img = np.zeros((size, size, 3))
    img[...] = np.array([23, 21, 46]) / 255
    img[solid] = shade[solid][:, None] * np.array([243, 233, 216]) / 255
    # dark lines where the surface steps or folds: the depth stops changing at a steady rate there
    dz = np.where(solid, depth, depth[solid].min() - 50)
    bend = np.zeros_like(dz)
    bend[1:-1, :] += np.abs(dz[2:, :] - 2 * dz[1:-1, :] + dz[:-2, :])
    bend[:, 1:-1] += np.abs(dz[:, 2:] - 2 * dz[:, 1:-1] + dz[:, :-2])
    img[bend > 0.12] *= 0.3
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(path)


def main():
    renders = Path(sys.argv[sys.argv.index("--renders") + 1]) if "--renders" in sys.argv else None
    if renders:
        renders.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(11)
    worst = (math.inf, "")
    for name, size, volume, inside, handles in PARTS:
        print(f"  {name}")
        raw = (FILES / name).read_bytes()
        count = int.from_bytes(raw[80:84], "little")
        check(len(raw) == 84 + 50 * count and not raw[:5].lower() == b"solid", f"binary STL, {count} triangles, {len(raw)} bytes")
        check(len(raw) < 1_000_000, "under 1 MB")
        m = trimesh.load(FILES / name, process=True)
        check(len(m.faces) == count, "no triangle was dropped or merged on load")
        check(m.is_watertight, "watertight: every edge is shared by exactly two triangles")
        check(m.is_winding_consistent, "winding is consistent")
        check(m.is_volume and m.volume > 0, "encloses a positive volume")
        check(len(m.split(only_watertight=False)) == 1, "one body")
        check(m.euler_number == 2 - 2 * handles, f"{handles} hole(s) through it (Euler number {m.euler_number})")
        check(float(m.area_faces.min()) > 1e-6, f"no empty triangles (smallest {m.area_faces.min():.4f} mm2)")
        box = m.bounds[1] - m.bounds[0]
        check(np.allclose(box, size, atol=1e-3) and abs(m.bounds[0][2]) < 1e-6, f"bounding box {box.round(3).tolist()} mm, flat on z = 0, as params.json says")
        want = volume()
        check(abs(m.volume - want) < 1e-4 * want, f"volume {m.volume:.2f} mm3 matches the hand calculation {want:.2f} mm3")
        pts = m.bounds[0] - 1 + rng.random((40000, 3)) * (box + 2)
        got = m.contains(pts)
        surely_in, surely_out = inside(pts, MARGIN), ~inside(pts, -MARGIN)
        check(bool(got[surely_in].all()) and not bool(got[surely_out].any()),
              f"40,000 test points: {int(surely_in.sum())} well inside are inside, {int(surely_out.sum())} well outside are outside")
        thin, where = thinnest(m)
        print(f"         thinnest path through plastic by ray: {thin:.2f} mm near {where.round(1).tolist()}")
        # printing: faces that look down and are not on the bed. 0 degrees is a plumb wall, 90 a ceiling.
        down = (m.face_normals[:, 2] < -1e-6) & (m.triangles_center[:, 2] > 1e-3)
        steepest = float(np.degrees(np.arcsin(np.clip(-m.face_normals[down, 2], 0, 1))).max()) if down.any() else 0.0
        check(steepest <= 45.01, f"as it prints, no face overhangs by more than 45 degrees (steepest {steepest:.1f}), so nothing bridges")
        worst = min(worst, (thin, name))
        if renders:
            stem = name[:-4]
            if stem == "place-tile":
                render(m, renders / "place-tile-top.png", math.radians(-28), math.radians(38), flip=True)
                render(m, renders / "place-tile-underside.png", math.radians(28), math.radians(38))
                render(m, renders / "place-tile-plan-top.png", 0, math.radians(89.9), flip=True)
                render(m, renders / "place-tile-plan-underside.png", 0, math.radians(89.9))
                render(m, renders / "place-tile-side.png", 0, math.radians(4), flip=True)
            elif stem == "puck-lid":
                render(m, renders / "puck-lid-as-printed.png", math.radians(-28), math.radians(38))
                render(m, renders / "puck-lid-as-used.png", math.radians(-28), math.radians(38), flip=True)
            else:
                render(m, renders / f"{stem}.png", math.radians(-28), math.radians(38))
                render(m, renders / f"{stem}-side.png", 0, math.radians(4))
    print(f"  thinnest path through plastic across all parts, by ray: {worst[0]:.2f} mm ({worst[1]})")
    if failures:
        print(f"\n{len(failures)} check(s) FAILED")
        sys.exit(1)
    print("\nAll checks passed.")


if __name__ == "__main__":
    main()
