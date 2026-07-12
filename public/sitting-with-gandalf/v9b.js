/* ---------------------------------------------------------------------------
 * Sitting with Gandalf — V9b · Painted Hall
 *
 * V9b is V9's Council Hall flow with a painted room layer. Same five
 * companions, same council prompts, same Letter mechanic + V9 Journal
 * (`sitting-with-gandalf-journal-v9` — V9b reads/writes the same notebook).
 * The only difference is the room view: a nano-banana-generated painterly
 * background replaces V9's procedural pixel-art, framed by a brass plaque,
 * a soft canvas-grain overlay, and a subtle vignette.
 *
 * This module is intentionally tiny. It does not own state. It listens for
 * mutations on `body[data-v9-room]` (which V9's logic already sets when a
 * doorway is clicked) and reflects the active companion into:
 *   - the painted-room img src
 *   - the brass plaque (mark / name / room title)
 *
 * It also wires the painted ↔ pixel "flip" button which toggles
 * `body[data-v9b-flip="pixel"]` so visitors can compare the two renderings
 * of the same room without leaving V9b.
 *
 * Loaded as a separate <script> after v9.js so DOM is guaranteed present.
 * --------------------------------------------------------------------------- */
(function () {
  "use strict";

  // Companion table — name + plaque-mark + room title + painted asset.
  // Mirrors V9's companions[] but only the bits we need for the painted layer.
  // Authoring note: keep this in sync with v9.js if companion list changes.
  var COMPANIONS = {
    gandalf:   { mark: "G", name: "Gandalf",   room: "Warm hearth",          src: "assets/v9b/gandalf.png" },
    frodo:     { mark: "F", name: "Frodo",     room: "Candlelit hobbit-hole", src: "assets/v9b/frodo.png" },
    samwise:   { mark: "S", name: "Samwise",   room: "Green garden",          src: "assets/v9b/samwise.png" },
    aragorn:   { mark: "A", name: "Aragorn",   room: "Stone watchpost",       src: "assets/v9b/aragorn.png" },
    galadriel: { mark: "L", name: "Galadriel", room: "Silver mirror-light",   src: "assets/v9b/galadriel.png" }
  };

  var DEFAULT_COMPANION = "gandalf";

  function $(id) { return document.getElementById(id); }

  function isV9bActive() {
    return document.body && document.body.dataset.version === "v9b";
  }

  function setPaintedRoom(companionId) {
    var c = COMPANIONS[companionId] || COMPANIONS[DEFAULT_COMPANION];
    var img = $("v9bPaintedRoom");
    var mark = $("v9bPlaqueMark");
    var name = $("v9bPlaqueName");
    var room = $("v9bPlaqueRoom");
    if (!img || !mark || !name || !room) return;

    // Only update src when it actually changed (avoid network thrash).
    var nextSrc = c.src;
    if (!img.src || img.src.indexOf(nextSrc) === -1) {
      img.style.opacity = "0";
      img.src = nextSrc;
      img.alt = c.room + " — painted by Manus / Nano Banana for PointCast V9b";
      img.addEventListener("load", function fadeIn() {
        img.style.opacity = "1";
        img.removeEventListener("load", fadeIn);
      });
    }
    mark.textContent = c.mark;
    name.textContent = c.name;
    room.textContent = c.room;
  }

  function syncFromBody() {
    var room = (document.body && document.body.dataset.v9Room) || DEFAULT_COMPANION;
    setPaintedRoom(room);
  }

  function wireFlipButton() {
    var btn = $("v9bFlipButton");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var body = document.body;
      var current = body.dataset.v9bFlip || "painted";
      body.dataset.v9bFlip = current === "pixel" ? "painted" : "pixel";
      // Announce for screen readers.
      btn.setAttribute(
        "aria-pressed",
        body.dataset.v9bFlip === "pixel" ? "true" : "false"
      );
    });
  }

  function init() {
    syncFromBody();
    wireFlipButton();

    // Watch for v9-room and version changes — v9 logic flips these and we
    // mirror state into the painted layer.
    if (window.MutationObserver) {
      var observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i += 1) {
          var attr = mutations[i].attributeName;
          if (attr === "data-v9-room" || attr === "data-version") {
            // Reset flip when version actually changes (don't carry pixel
            // mode across version boundaries).
            if (attr === "data-version" && document.body.dataset.v9bFlip) {
              if (!isV9bActive()) {
                delete document.body.dataset.v9bFlip;
              }
            }
            syncFromBody();
          }
        }
      });
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["data-version", "data-v9-room"]
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
