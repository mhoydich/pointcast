(function () {
  "use strict";
  var screen = document.getElementById("screen"),
    buttons = document.querySelectorAll("button");
  var art = [
    "01-acid-assembly",
    "04-garden-twenty",
    "06-pink-orbit",
    "10-golden-cosmos",
  ];
  var titles = [
    "Acid Assembly",
    "Garden Twenty",
    "Pink Orbit",
    "Golden Cosmos",
  ];
  var mode = 0,
    slide = 0,
    places = [],
    board = [],
    source = "Connecting";
  function coords(a) {
    var m = /^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(a);
    return m && Math.abs(+m[1]) <= 90 && Math.abs(+m[2]) <= 180
      ? [+m[1], +m[2]]
      : null;
  }
  var match = /[?&]to=([^&]+)/.exec(location.search),
    room;
  try {
    room = match && decodeURIComponent(match[1]);
  } catch (_) {}
  if (!coords(room)) room = "geo:33.9192,-118.4165";
  document.getElementById("place").textContent = room;
  function el(parent, tag, css, text) {
    var node = document.createElement(tag);
    node.className = css || "";
    if (text != null) node.textContent = text;
    parent.appendChild(node);
    return node;
  }
  function picture(parent, path, alt, css) {
    var img = el(parent, "img", css);
    img.src = "art/" + path;
    img.alt = alt;
  }
  function draw() {
    screen.textContent = "";
    if (mode < 2) {
      var index = mode ? Math.floor(Date.now() / 86400000) % art.length : slide;
      var wrap = mode ? el(screen, "div", "daily") : screen;
      picture(
        el(wrap, "div", "art"),
        art[index] + ".webp",
        titles[index],
        mode ? "" : "pan",
      );
      if (mode) {
        var aside = el(wrap, "aside");
        picture(aside, "qr.png", "QR code for nounsmoney.xyz");
        el(aside, "b", "", "nounsmoney.xyz");
      }
      var caption = el(screen, "div", "caption");
      el(caption, "strong", "", titles[index]);
      el(
        caption,
        "span",
        "meta",
        "NM-A-00" + art[index].slice(0, 2) + "  ·  no cash value",
      );
      return;
    }
    el(screen, "div", "meta", source);
    if (mode === 3) {
      board
        .slice()
        .reverse()
        .slice(0, 5)
        .forEach(function (line) {
          var row = el(screen, "div", "row");
          el(
            row,
            "b",
            "",
            line.sender || (line.from && line.from.name) || "Local node",
          );
          el(row, "span", "", line.body);
        });
      if (!board.length)
        el(
          screen,
          "p",
          "",
          source === "Connecting"
            ? "Reading this place…"
            : "No lines to display for this place.",
        );
      return;
    }
    var panel = el(screen, "div", "daily"),
      map = el(panel, "div", "map"),
      list = el(panel, "div", "maplist");
    var points = places.map(function (p) {
      return coords(p.address);
    });
    var center = coords(room),
      xs = [center[1]],
      ys = [center[0]];
    points.forEach(function (p) {
      xs.push(p[1]);
      ys.push(p[0]);
    });
    function position(v, values) {
      var lo = Math.min.apply(null, values),
        hi = Math.max.apply(null, values);
      return hi === lo ? 50 : 10 + (80 * (v - lo)) / (hi - lo);
    }
    el(list, "b", "", "Posted nearby");
    places.forEach(function (p, i) {
      var pin = el(map, "span", "pin", i + 1);
      pin.style.left = position(points[i][1], xs) + "%";
      pin.style.top = 100 - position(points[i][0], ys) + "%";
      el(list, "p", "", i + 1 + " · " + p.body.slice(0, 85));
    });
    if (!places.length) el(list, "p", "", "No mapped lines yet.");
    el(screen, "div", "meta", "North ↑   ·   " + room);
  }
  function select(i) {
    mode = (i + 4) % 4;
    for (var j = 0; j < 4; j++)
      buttons[j].setAttribute("aria-pressed", j === mode);
    document.getElementById("title").textContent = buttons[mode].textContent;
    buttons[mode].focus();
    draw();
  }
  Array.prototype.forEach.call(buttons, function (b, i) {
    b.onclick = function () {
      select(i);
    };
  });
  document.onkeydown = function (e) {
    if (e.keyCode >= 37 && e.keyCode <= 40) {
      e.preventDefault();
      select(mode + (e.keyCode <= 38 ? -1 : 1));
    }
  };
  function json(url, done) {
    var x = new XMLHttpRequest();
    x.open("GET", url);
    x.timeout = 5000;
    x.onload = function () {
      var data;
      try {
        if (x.status === 200) data = JSON.parse(x.responseText);
      } catch (_) {}
      done(data);
    };
    x.onerror = x.ontimeout = function () {
      done(null);
    };
    x.send();
  }
  function lines(address, done) {
    var q = "?to=" + encodeURIComponent(address) + "&since=0";
    json("/lines" + q, function (data) {
      var rows = data && (data.lines || (Array.isArray(data) && data));
      if (Array.isArray(rows)) return done(rows, "Local node");
      json("https://pointcast.xyz/api/loom" + q, function (publicData) {
        done(publicData && publicData.messages, "Public Loom");
      });
    });
  }
  function refresh() {
    lines(room, function (rows, name) {
      if (Array.isArray(rows)) {
        board = rows;
        source = name;
      } else source = "Feed unavailable";
      places = board.length
        ? [{ address: room, body: board[board.length - 1].body }]
        : [];
      if (mode >= 2) draw();
      json("/have", function (data) {
        var have = data && (data.have || data.addresses || data);
        var addresses = Array.isArray(have)
          ? have.map(function (a) {
              return a.address || a;
            })
          : Object.keys(have || {});
        addresses = addresses
          .filter(function (a) {
            return a !== room && coords(a);
          })
          .slice(0, 4);
        var pending = addresses.length;
        if (!pending) return setTimeout(refresh, 30000);
        addresses.forEach(function (a) {
          lines(a, function (other) {
            if (other && other.length)
              places.push({ address: a, body: other[other.length - 1].body });
            if (mode === 2) draw();
            if (!--pending) setTimeout(refresh, 30000);
          });
        });
      });
    });
  }
  select(0);
  refresh();
  setInterval(function () {
    slide = (slide + 1) % art.length;
    if (mode < 2) draw();
  }, 20000);
})();
