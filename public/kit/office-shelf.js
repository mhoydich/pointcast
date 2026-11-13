/* office shelf. CC0. from the Office Noun Tezos desk kit (officenoun.xyz/kit/).
   display only: shows what a Tezos wallet holds (its collection), read from the public
   TzKT indexer. no wallet connect, no sign-in, no keys, no write calls, no tracking.
   <div data-office-shelf data-wallet="tz1..."></div>
   token names and urls are untrusted: everything is built with createElement and
   textContent, and urls are only used after they parse as https:. */
(function () {
  "use strict";

  var VERSION = "1.0.0";
  var ADDRESS = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
  var CONTRACT = /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/;
  var TOKEN_ID = /^\d{1,20}$/;
  var DEFAULT_API = "https://api.tzkt.io";
  var NAME_MAX = 80;
  var ALIAS_MAX = 40;
  var MAX_COUNT = 1e9;
  var TIMEOUT_MS = 15000;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.setAttribute("class", className);
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  // returns a normalised https: url string, or "" if it is not one.
  function safeHttps(value) {
    if (typeof value !== "string" || !value) return "";
    try {
      var url = new URL(value);
      return url.protocol === "https:" ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  // ipfs://{cid}[/path] only. the result must parse to https://ipfs.io/ipfs/...
  function ipfsUrl(uri) {
    var match = /^ipfs:\/\/([A-Za-z0-9]{46,100})((?:\/[^?#]*)?)$/.exec(uri);
    if (!match) return "";
    var path = match[2];
    if (path && (/\.\./.test(path) || /%2e/i.test(path) || /@/.test(path) || /\\/.test(path) || /\/\//.test(path))) return "";
    try {
      var url = new URL("https://ipfs.io/ipfs/" + match[1] + path);
      if (url.protocol !== "https:" || url.hostname !== "ipfs.io" || url.pathname.indexOf("/ipfs/") !== 0) return "";
      return url.href;
    } catch (error) {
      return "";
    }
  }

  function resolveImage(value, ipfsOnly) {
    if (typeof value !== "string") return "";
    var uri = value.trim();
    if (/^ipfs:/i.test(uri)) return ipfsUrl(uri);
    return ipfsOnly ? "" : safeHttps(uri);
  }

  function cleanText(value, max, fallback) {
    var text = typeof value === "string" ? value : "";
    text = text.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
    if (!text) return fallback;
    return text.length > max ? text.slice(0, max - 1) + "…" : text;
  }

  // returns a whole number in [0, MAX_COUNT), or null.
  function toCount(value) {
    if (value === null || value === undefined || value === "" || typeof value === "boolean") return null;
    var n = Number(value);
    return Number.isFinite(n) && n >= 0 && n < MAX_COUNT ? Math.floor(n) : null;
  }

  function shortAddress(address) {
    return address.slice(0, 6) + "…" + address.slice(-4);
  }

  function formatTime(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) return "an unknown time";
    return date.toISOString().slice(0, 16).replace("T", " ") + " utc";
  }

  function formatNumber(n) {
    if (n === null || n === undefined) return "—";
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function clampLimit(value) {
    var n = parseInt(value, 10);
    if (!isFinite(n)) n = 12;
    return Math.min(48, Math.max(1, n));
  }

  function pickImage(meta, ipfsOnly) {
    if (!meta || typeof meta !== "object") return "";
    var keys = ["displayUri", "thumbnailUri", "image", "artifactUri"];
    for (var i = 0; i < keys.length; i++) {
      if (resolveImage(meta[keys[i]], ipfsOnly)) return meta[keys[i]];
    }
    return "";
  }

  // one shelf item from a TzKT token balance row, or null if the row is unusable.
  function fromBalance(row, ipfsOnly) {
    if (!row || typeof row !== "object") return null;
    var token = row.token && typeof row.token === "object" ? row.token : null;
    if (!token) return null;
    var contract = token.contract && typeof token.contract === "object" ? token.contract : {};
    var meta = token.metadata && typeof token.metadata === "object" ? token.metadata : {};
    return {
      contract: typeof contract.address === "string" ? contract.address : "",
      alias: typeof contract.alias === "string" ? contract.alias : "",
      tokenId: token.tokenId === undefined || token.tokenId === null ? "" : String(token.tokenId),
      name: typeof meta.name === "string" ? meta.name : "",
      image: pickImage(meta, ipfsOnly),
      balance: toCount(row.balance)
    };
  }

  // accepts a snapshot-shaped object; returns a clean copy or null.
  function normalise(raw, wallet) {
    if (!raw || typeof raw !== "object" || raw.wallet !== wallet) return null;
    var items = Array.isArray(raw.items) ? raw.items : [];
    return {
      wallet: wallet,
      at: typeof raw.at === "string" ? raw.at : "",
      held: toCount(raw.held),
      items: items.filter(function (t) { return t && typeof t === "object"; }).map(function (t) {
        return {
          contract: typeof t.contract === "string" ? t.contract : "",
          alias: typeof t.alias === "string" ? t.alias : "",
          tokenId: t.tokenId === undefined || t.tokenId === null ? "" : String(t.tokenId),
          name: typeof t.name === "string" ? t.name : "",
          image: typeof t.image === "string" ? t.image : "",
          balance: toCount(t.balance)
        };
      })
    };
  }

  // the only two urls the shelf ever requests. both are GET reads of public data.
  function requestUrls(api, wallet, limit, includeOwn) {
    var base = api + "/v1";
    var list = base + "/tokens/balances?account=" + wallet + "&balance.gt=0" +
      (includeOwn ? "" : "&token.firstMinter.ne=" + wallet) +
      "&sort.desc=lastTime&limit=" + limit + "&select=balance,lastTime,token";
    return { account: base + "/accounts/" + wallet, list: list };
  }

  function getJson(url, signal) {
    var options = { method: "GET", credentials: "omit", referrerPolicy: "no-referrer" };
    if (signal) options.signal = signal;
    return fetch(url, options).then(function (response) {
      if (!response || !response.ok) throw new Error("bad response");
      return response.json();
    });
  }

  // both requests share one 15 s budget; on timeout they are aborted and this rejects.
  function fetchLive(config) {
    var urls = requestUrls(config.api, config.wallet, config.limit, config.includeOwn);
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var signal = controller ? controller.signal : null;
    var timer;
    var timeout = new Promise(function (resolve, reject) {
      timer = setTimeout(function () {
        if (controller) { try { controller.abort(); } catch (error) { /* ignore */ } }
        reject(new Error("timeout"));
      }, TIMEOUT_MS);
    });
    var work = Promise.all([getJson(urls.account, signal), getJson(urls.list, signal)]);
    work.then(function () { clearTimeout(timer); }, function () { clearTimeout(timer); });
    return Promise.race([work, timeout]).then(function (parts) {
      var account = parts[0] && typeof parts[0] === "object" ? parts[0] : {};
      var rows = Array.isArray(parts[1]) ? parts[1] : [];
      var items = [];
      rows.forEach(function (row) {
        var item = fromBalance(row, config.ipfsOnly);
        if (item) items.push(item);
      });
      return { wallet: config.wallet, at: new Date().toISOString(), held: toCount(account.activeTokensCount), items: items };
    });
  }

  function externalLink(href, className) {
    var a = el("a", className);
    a.setAttribute("href", href);
    a.setAttribute("rel", "noopener noreferrer");
    a.setAttribute("referrerpolicy", "no-referrer");
    return a;
  }

  function stat(label, value) {
    var wrap = el("div", "td-stat");
    wrap.appendChild(el("dt", "td-stat-label", label));
    wrap.appendChild(el("dd", "td-stat-value", value));
    return wrap;
  }

  function card(item, ipfsOnly) {
    var linkable = CONTRACT.test(item.contract) && TOKEN_ID.test(item.tokenId);
    var href = linkable ? safeHttps("https://objkt.com/tokens/" + item.contract + "/" + item.tokenId) : "";
    var li = el("li", "td-item");
    var box = href ? externalLink(href, "td-card") : el("div", "td-card");
    box.setAttribute("data-td-key", item.contract + "/" + item.tokenId);

    var frame = el("span", "td-frame");
    var src = resolveImage(item.image, ipfsOnly);
    if (src) {
      var img = el("img", "td-img");
      img.setAttribute("src", src);
      img.setAttribute("alt", "");
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      img.setAttribute("referrerpolicy", "no-referrer");
      frame.appendChild(img);
    } else {
      frame.setAttribute("class", "td-frame td-frame-empty");
    }
    box.appendChild(frame);
    box.appendChild(el("span", "td-name", cleanText(item.name, NAME_MAX, "untitled")));
    var from = cleanText(item.alias, ALIAS_MAX, "");
    box.appendChild(el("span", "td-meta", "×" + formatNumber(item.balance) + (from ? " · " + from : "")));
    li.appendChild(box);
    return li;
  }

  // the status element is created once at mount and stays in the page; only its text changes.
  function render(root, config, data, statusText) {
    var status = config.status;
    var content = document.createDocumentFragment();
    content.appendChild(el("h2", "td-title", config.title));

    var profile = externalLink("https://objkt.com/users/" + config.wallet, "td-address");
    profile.textContent = shortAddress(config.wallet);
    var addressLine = el("p", "td-address-line");
    addressLine.appendChild(profile);
    content.appendChild(addressLine);

    if (data) {
      var stats = el("dl", "td-stats");
      stats.appendChild(stat("held", formatNumber(data.held)));
      stats.appendChild(stat("on the shelf", formatNumber(Math.min(data.items.length, config.limit))));
      content.appendChild(stats);

      if (data.items.length) {
        var list = el("ul", "td-grid");
        data.items.slice(0, config.limit).forEach(function (item) {
          list.appendChild(card(item, config.ipfsOnly));
        });
        content.appendChild(list);
      }
    }

    var keep = [];
    for (var i = 0; i < root.childNodes.length; i++) if (root.childNodes[i] !== status) keep.push(root.childNodes[i]);
    keep.forEach(function (node) { root.removeChild(node); });
    root.insertBefore(content, status);
    status.textContent = statusText;
  }

  function readSnapshot(id, wallet) {
    if (!id) return null;
    var node = document.getElementById(id);
    if (!node) return null;
    try {
      return normalise(JSON.parse(node.textContent), wallet);
    } catch (error) {
      return null;
    }
  }

  function mount(root) {
    if (!root || root.getAttribute("data-shelf-mounted") === "1") return;
    root.setAttribute("data-shelf-mounted", "1");
    var existing = root.getAttribute("class") || "";
    var classes = (" " + existing + " ");
    var add = [];
    if (classes.indexOf(" tezos-desk ") === -1) add.push("tezos-desk");
    if (classes.indexOf(" office-shelf ") === -1) add.push("office-shelf");
    if (add.length) root.setAttribute("class", (existing + " " + add.join(" ")).trim());

    var wallet = (root.getAttribute("data-wallet") || "").trim();
    if (!ADDRESS.test(wallet)) {
      root.textContent = "";
      var none = el("p", "td-status", "no wallet set.");
      none.setAttribute("role", "status");
      none.setAttribute("aria-live", "polite");
      root.appendChild(none);
      return;
    }

    var apiAttr = (root.getAttribute("data-api") || "").trim();
    var config = {
      wallet: wallet,
      title: cleanText(root.getAttribute("data-title"), 80, "the shelf"),
      limit: clampLimit(root.getAttribute("data-limit")),
      api: (safeHttps(apiAttr) || DEFAULT_API).replace(/\/+$/, ""),
      ipfsOnly: (root.getAttribute("data-images") || "").trim().toLowerCase() === "ipfs",
      includeOwn: (root.getAttribute("data-include") || "").trim().toLowerCase() === "all",
      status: el("p", "td-status")
    };
    config.status.setAttribute("role", "status");
    config.status.setAttribute("aria-live", "polite");
    root.textContent = "";
    root.appendChild(config.status);

    var snapshot = readSnapshot(root.getAttribute("data-snapshot"), wallet);
    render(root, config, snapshot, snapshot ? "snapshot from " + formatTime(snapshot.at) + "." : "loading.");

    var request;
    try {
      request = fetchLive(config);
    } catch (error) {
      request = Promise.reject(error);
    }
    request.then(function (live) {
      render(root, config, live, live.items.length ? "live. as of " + formatTime(live.at) + "." : "live. nothing on the shelf yet.");
    }, function () {
      if (snapshot) render(root, config, snapshot, "the chain did not answer. showing the snapshot from " + formatTime(snapshot.at) + ".");
      else render(root, config, null, "the chain did not answer. the full collection is on objkt.");
    });
  }

  function mountAll() {
    var nodes = document.querySelectorAll("[data-office-shelf]");
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  window.OfficeShelf = {
    mount: mount,
    version: VERSION,
    _test: { safeHttps: safeHttps, ipfsUrl: ipfsUrl, resolveImage: resolveImage, cleanText: cleanText, toCount: toCount, fromBalance: fromBalance, normalise: normalise, requestUrls: requestUrls, clampLimit: clampLimit }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll);
  else mountAll();
})();
