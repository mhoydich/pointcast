#!/usr/bin/env python3
"""Reusable browser test for any spatial-kit hub (Playwright + headless Chrome + IWER).

Usage:
  python3 scripts/spatial/serve.py 8101 &
  python3 scripts/spatial/e2e.py --url http://localhost:8101/vr/ --out ./report [--world-global pointcastTown]
                 [--min-links 12] [--min-visible 6] [--iwer /path/to/iwer.min.js] [--skip-xr]
                 [--hostile-url URL] [--skip-hostile] [--cycles 20]

Needs Playwright for Python, Chrome, and IWER (npm i --no-save iwer). Not run in CI. The page must expose its world on window[--world-global] or via
the 'spatial:ready' CustomEvent (detail.world), which this script captures into window.__spatialWorld.

Checks (each one fails if the matching kit fix is missing):
  load       1280x800 and 390x844: no console/page errors, the lower half of the canvas is not blank,
             at least --min-visible place anchors project inside the view, horizontal FOV >= 60,
             list link count, budget (60 calls / 100k triangles), only same-origin requests.
  loop       the render loop stops when the canvas is scrolled off screen and resumes when back.
  contexts   --cycles create/dispose cycles leave at most 2 live WebGL contexts.
  hostile    a manifest with javascript:/data: URLs (kit fixture page) never sets window.__pwned,
             from the list or from the in-scene Open button, for places and portals.
  xr         IWER Meta Quest 3: Enter VR (double call = one session, no error), no bounded-floor
             request, controller select opens the panel, in-VR budget with the panel open, ground
             teleport, mid-fade teleport is queued, snap turn 30 degrees, session end restores the page
             and hides the panel, sessiongranted enters VR, gaze with no controllers opens a panel and
             never moves the rig or navigates, real IWER hand pinch select, synthetic third and fourth
             input sources (transient-pointer) connect with no ray and can select.
  motion     prefers-reduced-motion: a move is instant; without it the glide takes at most 400 ms.
Writes results.json and screenshots into --out. Emulator only: not a headset test.
"""
import argparse, json, math, os, sys, time
from urllib.parse import urlparse, urljoin
from playwright.sync_api import sync_playwright

BUDGET = {"calls": 60, "triangles": 100_000}
HERE = os.path.dirname(os.path.abspath(__file__))

CAPTURE = """
document.addEventListener('spatial:ready', (e) => { window.__spatialWorld = e.detail && e.detail.world; });
"""
# Count WebGL contexts the page creates, so tests can see how many are still alive.
CTX_COUNT = """
(() => { const orig = HTMLCanvasElement.prototype.getContext; window.__glctx = [];
  HTMLCanvasElement.prototype.getContext = function (type, ...a) { const c = orig.call(this, type, ...a);
    if (c && /webgl/.test(type) && !window.__glctx.includes(c)) window.__glctx.push(c); return c; }; })();
"""
XR_INIT = """
(() => {
  const d = new IWER.XRDevice(IWER.metaQuest3);
  d.installRuntime({ forceInstall: true });
  window.__xrdevice = d;
  const orig = navigator.xr.requestSession.bind(navigator.xr);
  window.__reqs = [];
  navigator.xr.requestSession = (mode, init) => { window.__reqs.push({ mode, init: JSON.parse(JSON.stringify(init || {})) }); return orig(mode, init); };
})();
"""
# Aim an IWER controller or hand (target = world point, from = position in rig space).
AIM = """
([W, which, target, from]) => {
  const w = eval(W); const d = window.__xrdevice;
  const V = w.camera.position.constructor, Q = w.camera.quaternion.constructor;
  w.rig.updateMatrixWorld(true);
  const t = w.rig.worldToLocal(new V(target[0], target[1], target[2]));
  const o = new V(from[0], from[1], from[2]);
  const q = new Q().setFromUnitVectors(new V(0, 0, -1), t.clone().sub(o).normalize());
  const dev = which === 'hand' ? d.hands.right : d.controllers.right;
  dev.position.set(o.x, o.y, o.z); dev.quaternion.set(q.x, q.y, q.z, q.w);
  return [t.x, t.y, t.z];
}
"""
# Point the headset (gaze) at a world point.
AIM_HEAD = """
([W, target]) => {
  const w = eval(W), d = window.__xrdevice;
  const V = w.camera.position.constructor, Q = w.camera.quaternion.constructor;
  w.rig.updateMatrixWorld(true);
  const t = w.rig.worldToLocal(new V(target[0], target[1], target[2]));
  const o = new V(d.position.x, d.position.y, d.position.z);
  const q = new Q().setFromUnitVectors(new V(0, 0, -1), t.clone().sub(o).normalize());
  d.quaternion.set(q.x, q.y, q.z, q.w);
}
"""

def world_expr(g):
    return f"(window.{g} || window.__spatialWorld)" if g else "window.__spatialWorld"

def lower_half_stats(png_path):
    """Sample a 16x6 grid over the lower half of the view (ground and buildings, not sky)."""
    from PIL import Image
    im = Image.open(png_path).convert("RGB")
    w, h = im.size
    px = [im.getpixel((int(w * (i + 0.5) / 16), int(h * 0.5 + h * 0.5 * (j + 0.5) / 6))) for i in range(16) for j in range(6)]
    lum = [0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2] for p in px]
    mean = sum(lum) / len(lum)
    std = math.sqrt(sum((l - mean) ** 2 for l in lum) / len(lum))
    distinct = len(set(px))
    return {"samples": len(px), "distinct": distinct, "lumStd": round(std, 2), "pass": distinct >= 6 and std > 3}

def launch(p):
    return p.chromium.launch(executable_path="/usr/bin/google-chrome",
                             args=["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
                                   "--ignore-gpu-blocklist"])

def is_noise(text):
    return "GL Driver Message" in text or "GPU stall" in text

def attach_errors(pg):
    errors = []
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" and not is_noise(m.text) else None)
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    return errors

def wait_world(pg, W):
    pg.wait_for_function(f"{W} && {W}.info && {W}.info().calls > 0", timeout=30000)

VISIBLE = """(W) => { const w = eval(W); const V = w.camera.position.constructor; w.camera.updateMatrixWorld(true);
  let n = 0; const ids = [];
  for (const p of w.places) { if (!p.object) continue; const v = p.object.getWorldPosition(new V()); v.y = 1.2; v.project(w.camera);
    if (v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1) { n++; ids.push(p.id); } }
  return { n, ids }; }"""

def plain_load(p, url, out, w, h, wg, min_links, min_visible, tag):
    b = launch(p)
    ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
    pg = ctx.new_page()
    errors = attach_errors(pg)
    origin = urlparse(url).netloc
    requests = []
    pg.on("request", lambda r: requests.append(r.url))
    pg.add_init_script(CAPTURE)
    t0 = time.time()
    pg.goto(url, wait_until="load")
    W = world_expr(wg)
    wait_world(pg, W)
    ready_s = round(time.time() - t0, 2)
    pg.wait_for_timeout(2500)
    info = pg.evaluate(f"{W}.info()")
    links = pg.evaluate("document.querySelectorAll('nav.spatial-list a[href]').length")
    vis = pg.evaluate(VISIBLE, W)
    fov = pg.evaluate(f"(() => {{ const c = {W}.camera; return {{ vfov: c.fov, hfov: 2 * Math.atan(Math.tan(c.fov * Math.PI / 360) * c.aspect) * 180 / Math.PI, aspect: c.aspect }}; }})()")
    shot = os.path.join(out, f"load-{tag}-{w}x{h}.png")
    pg.locator("canvas.spatial-canvas").screenshot(path=shot)
    pg.screenshot(path=os.path.join(out, f"page-{tag}-{w}x{h}.png"), full_page=False)
    cs = lower_half_stats(shot)
    b.close()
    foreign = [u for u in requests if not u.startswith(("data:", "blob:")) and urlparse(u).netloc != origin]
    res = {"viewport": f"{w}x{h}", "readySeconds": ready_s, "info": info, "links": links, "visiblePlaces": vis,
           "camera": {k: round(v, 2) for k, v in fov.items()}, "consoleErrors": errors, "canvasLowerHalf": cs,
           "requests": len(requests), "foreignRequests": foreign,
           "checks": {"noErrors": not errors, "canvasNotBlank": cs["pass"], "links": links >= min_links,
                      "placesInView": vis["n"] >= min_visible, "hfovAtLeast60": fov["hfov"] >= 59.9,
                      "calls": info["calls"] <= BUDGET["calls"], "triangles": info["triangles"] <= BUDGET["triangles"],
                      "sameOriginOnly": not foreign}}
    res["pass"] = all(res["checks"].values())
    return res

def loop_and_contexts(p, url, wg, cycles):
    b = launch(p)
    pg = b.new_page(viewport={"width": 390, "height": 844})
    errors = attach_errors(pg)
    pg.add_init_script(CTX_COUNT)
    pg.add_init_script(CAPTURE)
    pg.goto(url, wait_until="load")
    W = world_expr(wg)
    wait_world(pg, W)
    r = {"checks": {}}
    def frames_in(ms):
        a = pg.evaluate(f"{W}.frameCount"); pg.wait_for_timeout(ms); return pg.evaluate(f"{W}.frameCount") - a
    on1 = frames_in(1000)
    pg.evaluate("document.body.style.minHeight = '400vh'; window.scrollTo(0, document.body.scrollHeight)")
    pg.wait_for_timeout(400)
    off = frames_in(1000)
    pg.evaluate(f"{W}.root.scrollIntoView()")
    pg.wait_for_timeout(400)
    on2 = frames_in(1000)
    r["loop"] = {"framesOnScreen1s": on1, "framesOffScreen1s": off, "framesBack1s": on2}
    r["checks"]["loopPausesOffScreen"] = on1 > 0 and off <= 1 and on2 > 0
    # create/dispose cycles with the page's own manifest: contexts must be released
    kit_url = urljoin(url, "../spatial/spatial.mjs")
    res = pg.evaluate(f"""(async (n) => {{
        const kit = await import({json.dumps(kit_url)});
        const m = {W}.manifest;
        for (let i = 0; i < n; i++) {{
          const div = document.createElement('div'); document.body.appendChild(div);
          const w = await kit.createWorld({{ mount: div, manifest: m }});
          await new Promise(r => requestAnimationFrame(() => r()));
          w.dispose(); div.remove();
        }}
        await new Promise(r => setTimeout(r, 300));
        return {{ created: window.__glctx.length, live: window.__glctx.filter(c => !c.isContextLost()).length }};
    }})({cycles})""")
    r["contexts"] = {"cycles": cycles, **res}
    r["checks"]["contextsReleased"] = res["live"] <= 2
    r["consoleErrors"] = [e for e in errors if "Too many active WebGL contexts" in e or "pageerror" in e]
    r["checks"]["noContextWarnings"] = not r["consoleErrors"]
    r["pass"] = all(r["checks"].values())
    b.close()
    return r

def hostile(p, hurl, out):
    """Kit fixture with javascript:/data: URLs in places and a portal. Nothing may run."""
    b = launch(p)
    pg = b.new_page(viewport={"width": 1280, "height": 800})
    errors = attach_errors(pg)
    pg.add_init_script(CAPTURE)
    pg.goto(hurl, wait_until="load")
    W = world_expr("")
    wait_world(pg, W)
    r = {"url": hurl, "checks": {}}
    hrefs = pg.evaluate("Array.from(document.querySelectorAll('nav.spatial-list a')).map(a => a.getAttribute('href'))")
    nolink = pg.evaluate("document.querySelectorAll('nav.spatial-list .spatial-nolink').length")
    injected = pg.evaluate("document.querySelectorAll('main img, main b, main script').length")
    for i in range(pg.evaluate("document.querySelectorAll('nav.spatial-list li').length")):
        el = pg.locator("nav.spatial-list li").nth(i).locator("a, span.spatial-nolink").first
        try:
            el.click(timeout=1500); pg.keyboard.press("Enter")
        except Exception:
            pass
    pg.wait_for_timeout(300)
    after_list = pg.evaluate("window.__pwned || null")
    opens = []
    for pid in ["js", "data", "mixed", "evil-portal"]:
        pg.evaluate(f"{W}.select('{pid}', 'api')")
        pg.wait_for_timeout(150)
        st = pg.evaluate(f"""(() => {{ const w = {W}; const b = w.scene.getObjectByName('button:OPEN'); const V = w.camera.position.constructor;
            const v = b.getWorldPosition(new V()).project(w.camera); const c = w.renderer.domElement.getBoundingClientRect();
            return {{ openVisible: b.visible, panel: w.panelOpen, x: c.left + (v.x + 1) / 2 * c.width, y: c.top + (1 - v.y) / 2 * c.height }}; }})()""")
        pg.mouse.click(st["x"], st["y"])
        pg.wait_for_timeout(250)
        opens.append({"id": pid, "panel": st["panel"], "openVisible": st["openVisible"], "pwned": pg.evaluate("window.__pwned || null")})
    r.update({"hrefs": hrefs, "nolinkItems": nolink, "injectedElements": injected, "pwnedAfterList": after_list,
              "openAttempts": opens, "urlAfter": pg.url, "consoleErrors": errors})
    bad = [h for h in hrefs if h and "".join(h.split()).lower().startswith(("javascript:", "data:", "vbscript:"))]
    r["checks"]["noDangerousHref"] = not bad
    r["checks"]["dangerousShownAsText"] = nolink >= 4
    r["checks"]["listNeverRuns"] = after_list is None
    r["checks"]["openNeverRuns"] = all(o["pwned"] is None and not o["openVisible"] and o["panel"] for o in opens)
    r["checks"]["noInjection"] = injected == 0
    r["checks"]["stayedOnPage"] = pg.url == hurl
    pg.screenshot(path=os.path.join(out, "hostile-fixture.png"))
    r["pass"] = all(r["checks"].values())
    b.close()
    return r

def frames(pg, n=6):
    pg.wait_for_timeout(int(n * 40))

def xr_boot(p, url, wg, iwer, hand=False):
    b = launch(p)
    pg = b.new_page(viewport={"width": 1280, "height": 800})
    errors = attach_errors(pg)
    pg.add_init_script(path=iwer)
    pg.add_init_script(XR_INIT)
    pg.add_init_script(CAPTURE)
    pg.goto(url, wait_until="load")
    W = world_expr(wg)
    wait_world(pg, W)
    if hand:
        pg.evaluate("window.__xrdevice.primaryInputMode = 'hand'")
    return b, pg, errors, W

def cam_xz(pg, W):
    return pg.evaluate(f"(() => {{ const w = {W}; const v = w.camera.getWorldPosition(new w.camera.position.constructor()); return [v.x, v.z]; }})()")

NEAREST = """(W) => { const w = eval(W); const V = w.camera.position.constructor; const c = w.camera.getWorldPosition(new V());
  const p = w.places.filter(x => x.object).sort((m, n) => m.object.getWorldPosition(new V()).distanceTo(c) - n.object.getWorldPosition(new V()).distanceTo(c))[0];
  const v = p.object.getWorldPosition(new V()); const yaw = p.object.rotation.y; const sd = p.object.userData.standDistance ?? 1.8;
  return { id: p.id, x: v.x, z: v.z, spot: [v.x + Math.sin(yaw) * sd, 0.05, v.z + Math.cos(yaw) * sd] }; }"""

def xr_tests(p, url, out, wg, iwer):
    r = {"checks": {}}
    b, pg, errors, W = xr_boot(p, url, wg, iwer)
    page_eye = pg.evaluate(f"{W}.camera.position.y")
    btn = pg.locator(".spatial-enter button", has_text="Enter VR")
    btn.wait_for(timeout=10000)
    dbl = pg.evaluate(f"""(async () => {{ const w = {W}; const s = await Promise.allSettled([w.enterVR(), w.enterVR()]);
        return {{ results: s.map(x => x.status), reqs: window.__reqs.length, mode: w.mode, status: document.querySelector('.spatial-status').textContent }}; }})()""")
    frames(pg, 10)
    r["enterVR"] = {**dbl, "presenting": pg.evaluate(f"{W}.renderer.xr.isPresenting"), "ref": pg.evaluate(f"{W}.referenceSpaceType"),
                    "requested": pg.evaluate("window.__reqs")}
    feats = r["enterVR"]["requested"][0]["init"].get("optionalFeatures", []) if r["enterVR"]["requested"] else []
    r["checks"]["enterVR"] = r["enterVR"]["presenting"] is True
    r["checks"]["doubleEnterOneSession"] = dbl["results"] == ["fulfilled", "fulfilled"] and dbl["reqs"] == 1 and "Could not" not in dbl["status"]
    r["checks"]["noBoundedFloor"] = "bounded-floor" not in feats
    pg.screenshot(path=os.path.join(out, "xr-quest3-enter.png"))

    tgt = pg.evaluate(NEAREST, W)
    pg.evaluate(f"window.__sel = []; {W}.on('select', (pl, how) => window.__sel.push([pl.id, how])); void 0")
    pg.evaluate(AIM, [W, "controller", [tgt["x"], 1.2, tgt["z"]], [0.2, 1.4, -0.2]])
    frames(pg, 8)
    hover = pg.evaluate(f"{W}.scene.getObjectByName('hover-highlight').visible")
    pg.evaluate("window.__xrdevice.controllers.right.updateButtonValue('trigger', 1)"); frames(pg, 6)
    pg.evaluate("window.__xrdevice.controllers.right.updateButtonValue('trigger', 0)"); frames(pg, 10)
    sel = pg.evaluate("window.__sel")
    r["infoInVRPanelOpen"] = pg.evaluate(f"{W}.info()")
    r["select"] = {"target": tgt["id"], "hover": hover, "events": sel, "panel": pg.evaluate(f"{W}.panelOpen")}
    r["checks"]["controllerSelectOpensPanel"] = r["select"]["panel"] and [tgt["id"], "controller"] in sel
    r["checks"]["xrBudgetPanelOpen"] = r["infoInVRPanelOpen"]["calls"] <= BUDGET["calls"] and r["infoInVRPanelOpen"]["triangles"] <= BUDGET["triangles"]
    pg.screenshot(path=os.path.join(out, "xr-quest3-panel.png"))

    before = pg.evaluate(f"{W}.rig.position.toArray()")
    gpt = pg.evaluate(f"""(() => {{ const w = {W}; const c = w.camera.getWorldPosition(new w.camera.position.constructor());
        const yaw = w.rig.rotation.y; return [c.x - Math.sin(yaw) * 2.5 + Math.cos(yaw) * 1.2, 0, c.z - Math.cos(yaw) * 2.5 - Math.sin(yaw) * 1.2]; }})()""")
    pg.evaluate(f"{W}.hidePanel()")
    pg.evaluate(AIM, [W, "controller", gpt, [0.2, 1.3, -0.2]]); frames(pg, 8)
    ring = pg.evaluate(f"{W}.scene.getObjectByName('teleport-marker').visible")
    pg.evaluate("window.__xrdevice.controllers.right.updateButtonValue('trigger', 1)"); frames(pg, 4)
    pg.evaluate("window.__xrdevice.controllers.right.updateButtonValue('trigger', 0)")
    pg.wait_for_timeout(500)
    after = cam_xz(pg, W)
    err = math.hypot(after[0] - gpt[0], after[1] - gpt[2])
    r["teleport"] = {"target": gpt, "markerShown": ring, "rigBefore": before, "viewerAfter": after, "errorM": round(err, 3),
                     "fadeVisible": pg.evaluate(f"{W}.scene.getObjectByName('fade').visible")}
    r["checks"]["groundTeleport"] = err < 0.25 and not r["teleport"]["fadeVisible"]
    c0 = cam_xz(pg, W)
    pg.evaluate(f"{W}.moveTo({c0[0] + 1}, {c0[1]}); {W}.moveTo({c0[0] + 2}, {c0[1] - 1}); void 0")
    pg.wait_for_timeout(700)
    c1 = cam_xz(pg, W)
    r["queuedTeleport"] = {"from": c0, "to": c1, "expected": [c0[0] + 2, c0[1] - 1]}
    r["checks"]["midFadeTeleportQueued"] = math.hypot(c1[0] - c0[0] - 2, c1[1] - c0[1] + 1) < 0.05

    y0 = pg.evaluate(f"{W}.rig.rotation.y")
    pg.evaluate("window.__xrdevice.controllers.right.updateAxes('thumbstick', 0.95, 0)"); frames(pg, 10)
    y1 = pg.evaluate(f"{W}.rig.rotation.y")
    pg.evaluate("window.__xrdevice.controllers.right.updateAxes('thumbstick', 0, 0)"); frames(pg, 6)
    pg.evaluate("window.__xrdevice.controllers.right.updateAxes('thumbstick', -0.95, 0)"); frames(pg, 10)
    y2 = pg.evaluate(f"{W}.rig.rotation.y")
    pg.evaluate("window.__xrdevice.controllers.right.updateAxes('thumbstick', 0, 0)"); frames(pg, 4)
    d1, d2 = math.degrees(y1 - y0), math.degrees(y2 - y1)
    r["snapTurn"] = {"firstDeg": round(d1, 3), "secondDeg": round(d2, 3)}
    r["checks"]["snapTurn30"] = abs(d1 + 30) < 0.01 and abs(d2 - 30) < 0.01

    # a teleport asked for right before the session ends still lands
    ce = cam_xz(pg, W)
    pg.evaluate(f"{W}.moveTo({ce[0] + 1.5}, {ce[1]}); {W}.select('{tgt['id']}', 'api'); {W}.renderer.xr.getSession().end(); void 0")
    pg.wait_for_function(f"{W}.mode === 'page'", timeout=10000)
    frames(pg, 10)
    ca = cam_xz(pg, W)
    r["teleportAtSessionEnd"] = {"from": ce, "after": ca, "expected": [ce[0] + 1.5, ce[1]]}
    r["checks"]["teleportSurvivesSessionEnd"] = math.hypot(ca[0] - ce[0] - 1.5, ca[1] - ce[1]) < 0.05
    end = pg.evaluate(f"""(() => {{ const w = {W}; const c = w.renderer.domElement; return {{ mode: w.mode, presenting: w.renderer.xr.isPresenting,
        camY: w.camera.position.y, rigY: w.rig.position.y, canvasW: c.width, panelOpen: w.panelOpen,
        enterVisible: !!document.querySelector('.spatial-enter button'), running: w.running, info: w.info() }}; }})()""")
    pg.screenshot(path=os.path.join(out, "xr-quest3-after-exit.png"))
    r["exit"] = end
    r["checks"]["sessionEndRestores"] = (end["mode"] == "page" and not end["presenting"] and abs(end["camY"] - page_eye) < 1e-6
                                         and end["rigY"] == 0 and end["enterVisible"] and end["running"] and not end["panelOpen"])
    pg.evaluate("navigator.xr.dispatchEvent(new Event('sessiongranted'))")
    try:
        pg.wait_for_function(f"{W}.mode === 'vr'", timeout=5000); granted = True
    except Exception:
        granted = False
    r["checks"]["sessionGrantedEnters"] = granted
    if granted:
        pg.evaluate(f"{W}.renderer.xr.getSession().end()"); pg.wait_for_function(f"{W}.mode === 'page'", timeout=5000)
    r["consoleErrors"] = list(errors)
    b.close()

    # gaze only: controllers disconnected. Dwell opens a panel and never moves or navigates.
    b, pg, errors, W = xr_boot(p, url, wg, iwer)
    pg.locator(".spatial-enter button", has_text="Enter VR").click()
    pg.wait_for_function(f"{W}.mode === 'vr'"); frames(pg, 10)
    pg.evaluate("window.__xrdevice.controllers.left.connected = false; window.__xrdevice.controllers.right.connected = false")
    pg.wait_for_timeout(400)
    reticle = pg.evaluate(f"{W}.scene.getObjectByName('gaze-reticle').visible")
    tgt = pg.evaluate(NEAREST, W)
    pg.evaluate(f"window.__mv = []; window.__dw = []; {W}.on('move', m => window.__mv.push(m.how)); {W}.on('dwell', pl => window.__dw.push(pl.id)); void 0")
    url0 = pg.url
    rig0 = pg.evaluate(f"{W}.rig.position.toArray()")
    pg.evaluate(AIM_HEAD, [W, tgt["spot"]]); pg.wait_for_timeout(2000)
    rig1 = pg.evaluate(f"{W}.rig.position.toArray()")
    pg.evaluate(AIM_HEAD, [W, [tgt["x"], 1.2, tgt["z"]]]); pg.wait_for_timeout(2000)
    panel = pg.evaluate(f"{W}.panelOpen")
    ob = pg.evaluate(f"(() => {{ const w = {W}; const v = w.scene.getObjectByName('button:OPEN').getWorldPosition(new w.camera.position.constructor()); return [v.x, v.y, v.z]; }})()")
    pg.evaluate(AIM_HEAD, [W, ob]); pg.wait_for_timeout(2500)
    portal = pg.evaluate(f"(() => {{ const w = {W}; const p = w.portals[0]; if (!p) return null; const v = p.object.getWorldPosition(new w.camera.position.constructor()); return [v.x, 1.1, v.z]; }})()")
    if portal:
        pg.evaluate(AIM_HEAD, [W, portal]); pg.wait_for_timeout(2000)
    rig2 = pg.evaluate(f"{W}.rig.position.toArray()")
    r["gaze"] = {"reticle": reticle, "target": tgt["id"], "rigStart": rig0, "rigAfterSpot": rig1, "rigEnd": rig2,
                 "moves": pg.evaluate("window.__mv"), "dwells": pg.evaluate("window.__dw"), "panelAfterDwell": panel,
                 "urlChanged": pg.url != url0, "stillInVR": pg.evaluate(f"{W}.mode") == "vr"}
    r["checks"]["gazeOpensPanelOnly"] = bool(reticle and panel and tgt["id"] in r["gaze"]["dwells"] and rig0 == rig1 == rig2
                                            and not r["gaze"]["moves"] and not r["gaze"]["urlChanged"] and r["gaze"]["stillInVR"])
    r["consoleErrors"] += errors
    b.close()

    # hands: real IWER pinch, then synthetic third and fourth sources (transient-pointer)
    b, pg, errors, W = xr_boot(p, url, wg, iwer, hand=True)
    pg.evaluate(f"window.__in = []; {W}.on('input', e => window.__in.push(e)); window.__sel = []; {W}.on('select', (pl, how) => window.__sel.push([pl.id, how])); void 0")
    pg.locator(".spatial-enter button", has_text="Enter VR").click()
    pg.wait_for_function(f"{W}.mode === 'vr'"); pg.wait_for_timeout(600)
    tgt = pg.evaluate(NEAREST, W)
    pg.evaluate(AIM, [W, "hand", [tgt["x"], 1.2, tgt["z"]], [0.2, 1.4, -0.2]]); pg.wait_for_timeout(400)
    pg.evaluate("window.__xrdevice.hands.right.updatePinchValue(1)"); pg.wait_for_timeout(300)
    pg.evaluate("window.__xrdevice.hands.right.updatePinchValue(0)"); pg.wait_for_timeout(400)
    pinch = pg.evaluate("window.__sel.slice()")
    r["handPinch"] = {"target": tgt["id"], "selects": pinch}
    r["checks"]["handPinchSelect"] = [tgt["id"], "hand"] in pinch
    pg.evaluate(f"{W}.hidePanel(); window.__sel.length = 0; void 0")
    extra = pg.evaluate(f"""(async () => {{
        const w = {W}; const s = w.renderer.xr.getSession(); const srcs = [...s.inputSources];
        const right = srcs.find(x => x.handedness === 'right') || srcs[0];
        const fakes = [0, 1].map(i => ({{ targetRayMode: 'transient-pointer', handedness: 'none', profiles: [],
            targetRaySpace: right.targetRaySpace, gripSpace: null, hand: null, gamepad: null }}));
        const ev = new Event('inputsourceschange'); ev.added = fakes; ev.removed = []; ev.session = s; s.dispatchEvent(ev);
        await new Promise(r => setTimeout(r, 200));
        const connected = window.__in.filter(e => e.connected && e.mode === 'transient-pointer').map(e => e.slot);
        const rays = [2, 3].map(i => w.renderer.xr.getController(i).children.find(c => c.name === 'ray')?.visible ?? null);
        await new Promise(res => s.requestAnimationFrame((t, frame) => {{
          const se = new Event('select'); se.inputSource = fakes[1]; se.frame = frame; s.dispatchEvent(se); res(); }}));
        await new Promise(r => setTimeout(r, 200));
        return {{ inputs: window.__in, transientSlots: connected, rayVisible: rays, selects: window.__sel.slice() }};
    }})()""")
    r["extraSources"] = extra
    r["checks"]["thirdFourthSourcesConnect"] = sorted(extra["transientSlots"]) == [2, 3] and extra["rayVisible"] == [False, False]
    r["checks"]["transientSelect"] = [tgt["id"], "transient"] in extra["selects"]
    r["consoleErrors"] += errors
    b.close()

    r["checks"]["noErrors"] = not r["consoleErrors"]
    r["pass"] = all(r["checks"].values())
    return r

def reduced_motion(p, url, out, wg):
    res = {}
    for rm in ("reduce", "no-preference"):
        b = launch(p)
        ctx = b.new_context(viewport={"width": 1280, "height": 800}, reduced_motion=rm)
        pg = ctx.new_page()
        pg.add_init_script(CAPTURE)
        pg.goto(url, wait_until="load")
        W = world_expr(wg)
        wait_world(pg, W)
        pg.wait_for_timeout(500)
        pt = pg.evaluate(f"""(() => {{ const w = {W}; const V = w.camera.position.constructor; const c = w.camera.getWorldPosition(new V());
            const yaw = w.rig.rotation.y; let g = null; for (const d of [3, 5, 8, 12]) {{ g = new V(c.x - Math.sin(yaw) * d, 0, c.z - Math.cos(yaw) * d).project(w.camera); if (Math.abs(g.y) < 0.95) break; }}
            const r = w.renderer.domElement.getBoundingClientRect(); return [r.left + (g.x + 1) / 2 * r.width, r.top + (1 - g.y) / 2 * r.height]; }})()""")
        start = pg.evaluate(f"{W}.camera.getWorldPosition(new {W}.camera.position.constructor()).toArray()")
        pg.evaluate(f"""window.__mv = null; {W}.on('move', (m) => {{
            const w = {W}, V = w.camera.position.constructor, t0 = performance.now();
            const at = () => w.camera.getWorldPosition(new V());
            window.__mv = {{ x: m.x, z: m.z, sync: at().toArray(), frames: 0, arrivedMs: null }};
            const tick = () => {{ const p = at(); window.__mv.frames++;
                if (Math.hypot(p.x - m.x, p.z - m.z) < 1e-3) {{ window.__mv.arrivedMs = performance.now() - t0; return; }}
                if (performance.now() - t0 < 3000) requestAnimationFrame(tick); }};
            if (Math.hypot(window.__mv.sync[0] - m.x, window.__mv.sync[2] - m.z) < 1e-6) window.__mv.arrivedMs = 0; else requestAnimationFrame(tick);
        }}); void 0""")
        pg.mouse.click(pt[0], pt[1])
        pg.wait_for_function("window.__mv && window.__mv.arrivedMs !== null", timeout=5000)
        mv = pg.evaluate("window.__mv")
        rmFlag = pg.evaluate(f"{W}.reducedMotion")
        b.close()
        target = [mv["x"], mv["z"]]
        early = mv["sync"]
        res[rm] = {"reducedMotionFlag": rmFlag, "start": start, "target": target, "atMoveEvent": early,
                   "arrivedMs": round(mv["arrivedMs"], 1), "framesToArrive": mv["frames"],
                   "instant": abs(early[0] - target[0]) < 1e-6 and abs(early[2] - target[1]) < 1e-6}
    res["checks"] = {"reducedIsInstant": res["reduce"]["reducedMotionFlag"] and res["reduce"]["instant"],
                     "defaultGlides": (not res["no-preference"]["instant"]) and res["no-preference"]["arrivedMs"] <= 400 + 100}
    res["pass"] = all(res["checks"].values())
    return res

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--world-global", default="")
    ap.add_argument("--min-links", type=int, default=1)
    ap.add_argument("--min-visible", type=int, default=1)
    ap.add_argument("--iwer", default=os.path.join(HERE, "..", "..", "node_modules", "iwer", "build", "iwer.min.js"),
                    help="path to IWER's browser build; get it with: npm i --no-save iwer")
    ap.add_argument("--skip-xr", action="store_true")
    ap.add_argument("--hostile-url", default="", help="default: <origin>/__fixtures/hostile/ (scripts/spatial/serve.py serves it)")
    ap.add_argument("--skip-hostile", action="store_true")
    ap.add_argument("--cycles", type=int, default=20)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    results = {"url": a.url, "date": time.strftime("%Y-%m-%d %H:%M:%S"), "budget": BUDGET,
               "note": "Headless Chrome with SwiftShader; XR via IWER (Meta Quest 3 profile). Emulator only, not a headset."}
    def guard(name, fn, *args):
        try:
            return fn(*args)
        except Exception as e:  # keep going; record the failure
            return {"pass": False, "error": f"{type(e).__name__}: {e}"[:600], "checks": {}}
    with sync_playwright() as p:
        results["load"] = [plain_load(p, a.url, a.out, 1280, 800, a.world_global, a.min_links, a.min_visible, "desktop"),
                           plain_load(p, a.url, a.out, 390, 844, a.world_global, a.min_links, a.min_visible, "phone")]
        results["loopAndContexts"] = guard("loop", loop_and_contexts, p, a.url, a.world_global, a.cycles)
        if not a.skip_hostile:
            results["hostile"] = guard("hostile", hostile, p, a.hostile_url or urljoin(a.url, "/__fixtures/hostile/"), a.out)
        if not a.skip_xr:
            if not os.path.exists(a.iwer):
                results["xr"] = {"pass": False, "error": f"IWER not found at {a.iwer}", "checks": {}}
            else:
                results["xr"] = guard("xr", xr_tests, p, a.url, a.out, a.world_global, a.iwer)
        results["reducedMotion"] = guard("motion", reduced_motion, p, a.url, a.out, a.world_global)
    sections = [x for x in ("loopAndContexts", "hostile", "xr", "reducedMotion") if x in results]
    results["pass"] = all(x["pass"] for x in results["load"]) and all(results[s]["pass"] for s in sections)
    with open(os.path.join(a.out, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    summary = {"pass": results["pass"], "load": [(x["viewport"], x["pass"], x["info"], x["visiblePlaces"]["n"], [k for k, v in x["checks"].items() if not v]) for x in results["load"]]}
    for s in sections:
        summary[s] = results[s].get("error") or [k for k, v in results[s]["checks"].items() if not v] or "all pass"
    print(json.dumps(summary, indent=1))
    return 0 if results["pass"] else 1

if __name__ == "__main__":
    sys.exit(main())
