// office shelf: display-only wallet shelf. runs the browser script in a tiny fake DOM.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = process.env.SHELF_SCRIPT || path.join(here, "..", "public", "kit", "office-shelf.js");
const source = await readFile(SCRIPT_PATH, "utf8");
const WALLET = "tz1UWibBbQXvuSkThsLUGAaL4R5j7X3PSCKj";
const KT = "KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton";

class Node {
  constructor(tag) { this.tagName = tag; this.attrs = {}; this.childNodes = []; this._text = ""; this.parentNode = null; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  appendChild(c) {
    if (c.tagName === "#fragment") { [...c.childNodes].forEach((n) => this.appendChild(n)); return c; }
    c.parentNode = this; this.childNodes.push(c); return c;
  }
  insertBefore(c, ref) {
    const nodes = c.tagName === "#fragment" ? [...c.childNodes] : [c];
    const i = this.childNodes.indexOf(ref);
    nodes.forEach((n) => (n.parentNode = this));
    this.childNodes.splice(i < 0 ? this.childNodes.length : i, 0, ...nodes);
    return c;
  }
  removeChild(c) { this.childNodes = this.childNodes.filter((n) => n !== c); return c; }
  set textContent(v) { this.childNodes = []; this._text = String(v); }
  get textContent() { return this._text + this.childNodes.map((n) => n.textContent).join(""); }
  all() { return this.childNodes.flatMap((n) => [n, ...n.all()]); }
  contains(n) { return this.all().includes(n); }
  querySelectorAll(sel) { const m = /^\[([\w-]+)\]$/.exec(sel); return m ? this.all().filter((n) => n.getAttribute(m[1]) !== null) : []; }
}

function harness({ attrs = {}, respond }) {
  const root = new Node("div");
  Object.assign(root.attrs, { "data-office-shelf": "", ...attrs });
  const body = new Node("body");
  body.appendChild(root);
  const calls = [];
  const document = {
    readyState: "complete",
    createElement: (t) => new Node(t),
    createDocumentFragment: () => new Node("#fragment"),
    querySelectorAll: (sel) => body.querySelectorAll(sel),
    getElementById: (id) => body.all().find((n) => n.getAttribute("id") === id) || null,
    addEventListener() {}
  };
  const fetch = (url, opts) => {
    calls.push({ url, opts });
    return Promise.resolve(respond(url)).then((data) => ({ ok: data !== undefined, json: async () => data }));
  };
  const window = {};
  const ctx = { window, document, fetch, URL, AbortController, setTimeout, clearTimeout, Promise, Number, Math, String, Date, JSON, Array };
  vm.runInNewContext(source, ctx);
  return { root, calls, shelf: window.OfficeShelf };
}

const settle = () => new Promise((r) => setTimeout(r, 20));
const find = (root, tag) => root.all().filter((n) => n.tagName === tag);

const ROWS = [
  { balance: "24", lastTime: "2026-11-12T00:00:00Z", token: { contract: { alias: "hic et nunc NFTs", address: KT }, tokenId: "886608", metadata: { name: "a piece", displayUri: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG" } } },
  { balance: "1", token: { contract: { address: KT }, tokenId: "1", metadata: { name: "<img src=x onerror=alert(1)>", displayUri: "javascript:alert(1)" } } },
  { balance: "1", token: { contract: { address: "not-a-contract" }, tokenId: "../../x", metadata: { name: "‮evil", image: "http://plain.example/x.png" } } },
  null,
  { balance: "1" }
];

test("only GET reads of public TzKT data, no credentials, no referrer", async () => {
  const { calls } = harness({ attrs: { "data-wallet": WALLET }, respond: (u) => (u.includes("/accounts/") ? { activeTokensCount: 37 } : ROWS) });
  await settle();
  assert.equal(calls.length, 2);
  for (const c of calls) {
    assert.ok(c.url.startsWith("https://api.tzkt.io/v1/"), c.url);
    assert.equal(c.opts.method, "GET");
    assert.equal(c.opts.credentials, "omit");
    assert.equal(c.opts.referrerPolicy, "no-referrer");
    assert.equal(c.opts.body, undefined);
  }
  assert.ok(calls[1].url.includes("token.firstMinter.ne=" + WALLET), "own mints are left off by default");
});

test("renders the collection, untrusted metadata only as text, unsafe links dropped", async () => {
  const { root } = harness({ attrs: { "data-wallet": WALLET }, respond: (u) => (u.includes("/accounts/") ? { activeTokensCount: 37 } : ROWS) });
  await settle();
  const cards = root.all().filter((n) => n.getAttribute("data-td-key") !== null);
  assert.equal(cards.length, 3);
  assert.equal(cards[0].tagName, "a");
  assert.equal(cards[0].getAttribute("href"), `https://objkt.com/tokens/${KT}/886608`);
  assert.equal(cards[0].getAttribute("rel"), "noopener noreferrer");
  assert.equal(cards[2].tagName, "div", "bad contract/token id gets no link");
  const imgs = find(root, "img");
  assert.equal(imgs.length, 1, "javascript: and http: images are dropped");
  assert.ok(imgs[0].getAttribute("src").startsWith("https://ipfs.io/ipfs/"));
  assert.equal(imgs[0].getAttribute("referrerpolicy"), "no-referrer");
  assert.ok(root.textContent.includes("<img src=x onerror=alert(1)>"), "markup shown as text");
  assert.ok(!root.textContent.includes("‮"), "bidi controls stripped");
  assert.ok(root.textContent.includes("live. as of"));
  assert.ok(root.textContent.includes("37"));
});

test("no connect, no sign-in, no forms or buttons anywhere", async () => {
  const { root } = harness({ attrs: { "data-wallet": WALLET }, respond: (u) => (u.includes("/accounts/") ? {} : ROWS) });
  await settle();
  for (const tag of ["button", "form", "input", "iframe", "script"]) assert.equal(find(root, tag).length, 0, tag);
  assert.ok(!/connect|sign in|sign-in/i.test(root.textContent));
  assert.ok(!/beacon|taquito|requestPermissions|requestSignPayload/i.test(source), "no wallet libraries or signing calls in the script");
  assert.ok(!/localStorage|sessionStorage|document\.cookie|sendBeacon|XMLHttpRequest/.test(source), "no storage or tracking");
});

test("failure: chain down shows a plain message", async () => {
  const { root } = harness({ attrs: { "data-wallet": WALLET }, respond: () => undefined });
  await settle();
  assert.ok(root.textContent.includes("the chain did not answer"));
});

test("bad wallet attribute: no requests at all", async () => {
  const { root, calls } = harness({ attrs: { "data-wallet": "tz1<script>" }, respond: () => [] });
  await settle();
  assert.equal(calls.length, 0);
  assert.ok(root.textContent.includes("no wallet set."));
});

test("data-api must be https, data-limit is clamped, data-include=all keeps own mints", async () => {
  const { calls } = harness({ attrs: { "data-wallet": WALLET, "data-api": "http://evil.example", "data-limit": "999", "data-include": "all" }, respond: (u) => (u.includes("/accounts/") ? {} : []) });
  await settle();
  assert.ok(calls.every((c) => c.url.startsWith("https://api.tzkt.io/")));
  assert.ok(calls[1].url.includes("limit=48"));
  assert.ok(!calls[1].url.includes("firstMinter"));
});

test("helpers", () => {
  const { shelf } = harness({ attrs: {}, respond: () => [] });
  const t = shelf._test;
  assert.equal(t.ipfsUrl("ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/../x"), "");
  assert.equal(t.safeHttps("javascript:alert(1)"), "");
  assert.equal(t.toCount("1e12"), null);
  assert.equal(t.toCount("-1"), null);
  assert.equal(t.clampLimit("0"), 1);
});
