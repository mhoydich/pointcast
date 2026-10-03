// PointcastVerifier: the pointcast-chain consensus code (chain-core +
// pointcast-verifier, compiled to wasm32) driven over a three-function JSON
// ABI. No wasm-bindgen, no imports, no dependencies. Runs in browsers, Web
// Workers and Node 24.
//
//   import { PointcastVerifier } from "./verify.js";
//   const v = await PointcastVerifier.load("/verifier/pointcast_chain.wasm");
//   v.call("verifier.new", { params });          // -> { genesis_hash, ... }
//   v.call("verifier.push", { blocks });         // -> { checkpoints } | { fault, at_height, evidence }
//
// `call` returns the op's `ok` value and throws on `{"err": ...}`.
//
// Integers stay exact across this boundary. Chain values are u64, and
// JSON.parse turns any integer above 2^53 into the nearest double
// (u64::MAX becomes 18446744073709552000, which the wasm then refuses), so
// `call` and the worker use parseJson/stringifyJson below: an integer that
// is not an exact double comes back as a BigInt and is written back as the
// same digits. Read a node's JSON with `parseJson(await response.text())`,
// never `response.json()`, before handing it to `call`.
//
// Ops: version, verifier.new, verifier.push, verifier.status, verifier.state, verifier.account,
//      anchor.check, evidence.check, tx.wallet, body.hash (see crates/chain-wasm/src/ops.rs).

const enc = new TextEncoder();
const dec = new TextDecoder("utf-8", { fatal: true });

async function toBytes(src) {
  if (src instanceof Uint8Array) return src;
  if (src instanceof ArrayBuffer) return new Uint8Array(src);
  if (ArrayBuffer.isView(src)) return new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
  if (typeof Response !== "undefined" && src instanceof Response) {
    if (!src.ok) throw new Error(`verifier wasm: HTTP ${src.status}`);
    return new Uint8Array(await src.arrayBuffer());
  }
  if (typeof src === "string" || src instanceof URL) {
    const r = await fetch(src);
    if (!r.ok) throw new Error(`verifier wasm: HTTP ${r.status} for ${src}`);
    return new Uint8Array(await r.arrayBuffer());
  }
  throw new TypeError("PointcastVerifier.load: pass a URL, Response, ArrayBuffer or Uint8Array");
}

/**
 * JSON.parse, except that an integer literal which is not a safe integer
 * becomes a BigInt (exact) instead of a rounded double. Everything else
 * (strings, other numbers, nesting, "__proto__" as a plain own key, the
 * errors on malformed input) matches JSON.parse.
 */
export function parseJson(text) {
  if (typeof text !== "string") throw new TypeError("parseJson: expected a string");
  const n = text.length;
  const NUM = /-?(?:0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/y;
  let i = 0;
  const fail = (what) => { throw new SyntaxError(`JSON: ${what} at position ${i}`); };
  const ws = () => {
    for (let c = text.charCodeAt(i); c === 32 || c === 10 || c === 13 || c === 9; c = text.charCodeAt(++i));
  };
  const str = () => {
    const start = i;
    let plain = true;
    for (i++; ; i++) {
      const c = text.charCodeAt(i);
      if (c === 34) break;
      if (c === 92) { plain = false; i++; } // the escape is checked by JSON.parse below
      else if (c < 32 || Number.isNaN(c)) fail("bad or unterminated string");
    }
    i++;
    return plain ? text.slice(start + 1, i - 1) : JSON.parse(text.slice(start, i));
  };
  const val = () => {
    ws();
    const c = text.charCodeAt(i);
    if (c === 34) return str();
    if (c === 123) {
      const o = {};
      i++; ws();
      if (text.charCodeAt(i) === 125) { i++; return o; }
      for (;;) {
        ws();
        if (text.charCodeAt(i) !== 34) fail("expected a key");
        const k = str();
        ws();
        if (text.charCodeAt(i) !== 58) fail("expected ':'");
        i++;
        const v = val();
        if (k === "__proto__") Object.defineProperty(o, k, { value: v, writable: true, enumerable: true, configurable: true });
        else o[k] = v;
        ws();
        const d = text.charCodeAt(i);
        if (d === 44) { i++; continue; }
        if (d === 125) { i++; return o; }
        fail("expected ',' or '}'");
      }
    }
    if (c === 91) {
      const a = [];
      i++; ws();
      if (text.charCodeAt(i) === 93) { i++; return a; }
      for (;;) {
        a.push(val());
        ws();
        const d = text.charCodeAt(i);
        if (d === 44) { i++; continue; }
        if (d === 93) { i++; return a; }
        fail("expected ',' or ']'");
      }
    }
    if (text.startsWith("true", i)) { i += 4; return true; }
    if (text.startsWith("false", i)) { i += 5; return false; }
    if (text.startsWith("null", i)) { i += 4; return null; }
    NUM.lastIndex = i;
    const m = NUM.exec(text);
    if (!m) fail("unexpected character");
    i = NUM.lastIndex;
    const x = Number(m[0]);
    return m[1] || m[2] || Number.isSafeInteger(x) ? x : BigInt(m[0]);
  };
  const v = val();
  ws();
  if (i !== n) fail("unexpected trailing characters");
  return v;
}

/**
 * JSON.stringify for plain data, except that a BigInt is written as its
 * exact digits (JSON.stringify throws on BigInt). `indent` works as
 * JSON.stringify's `space` argument.
 */
export function stringifyJson(value, indent) {
  const gap = typeof indent === "number" ? " ".repeat(Math.max(0, Math.min(10, Math.floor(indent))))
    : typeof indent === "string" ? indent.slice(0, 10) : "";
  const go = (v, key, pad) => {
    if (v !== null && typeof v === "object" && typeof v.toJSON === "function") v = v.toJSON(key);
    switch (typeof v) {
      case "bigint": return v.toString();
      case "number": return JSON.stringify(v);
      case "string": return JSON.stringify(v);
      case "boolean": return v ? "true" : "false";
      case "object": {
        if (v === null) return "null";
        const inner = pad + gap;
        const [open, sep, close] = gap ? [`\n${inner}`, `,\n${inner}`, `\n${pad}`] : ["", ",", ""];
        if (Array.isArray(v)) {
          if (!v.length) return "[]";
          return `[${open}${v.map((x, k) => go(x, String(k), inner) ?? "null").join(sep)}${close}]`;
        }
        const parts = [];
        for (const k of Object.keys(v)) {
          const s = go(v[k], k, inner);
          if (s !== undefined) parts.push(`${JSON.stringify(k)}:${gap ? " " : ""}${s}`);
        }
        return parts.length ? `{${open}${parts.join(sep)}${close}}` : "{}";
      }
      default: return undefined; // undefined, functions and symbols, as JSON.stringify
    }
  };
  return go(value, "", "");
}

/** Lowercase hex sha256 of `bytes`, or null when WebCrypto is unavailable. */
export async function sha256Hex(bytes) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle) return null;
  const d = new Uint8Array(await subtle.digest("SHA-256", bytes));
  return Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("");
}

export class PointcastVerifier {
  /** Instantiate from a URL, Response, ArrayBuffer or Uint8Array. */
  static async load(src) {
    const bytes = await toBytes(src);
    const { instance } = await WebAssembly.instantiate(bytes, {});
    const v = new PointcastVerifier(instance, bytes);
    return v;
  }

  constructor(instance, bytes) {
    const x = instance.exports;
    for (const name of ["memory", "pc_alloc", "pc_free", "pc_call"]) {
      if (!(name in x)) throw new Error(`verifier wasm is missing export ${name}`);
    }
    this.exports = x;
    /** The exact bytes that were instantiated (hash these, not a re-download). */
    this.bytes = bytes;
  }

  /** sha256 of the instantiated wasm (hex), or null without WebCrypto. */
  sha256() {
    return sha256Hex(this.bytes);
  }

  // Copy a string into wasm memory; returns [ptr, len]. Caller frees.
  #put(str) {
    const b = enc.encode(str);
    if (b.length === 0) return [0, 0];
    const ptr = this.exports.pc_alloc(b.length);
    if (!ptr) throw new Error("verifier wasm: out of memory");
    new Uint8Array(this.exports.memory.buffer, ptr, b.length).set(b);
    return [ptr, b.length];
  }

  /** Run `op` with the raw JSON string `input`; returns the raw JSON reply. */
  callRaw(op, input) {
    const [opPtr, opLen] = this.#put(op);
    let inPtr = 0, inLen = 0;
    try {
      [inPtr, inLen] = this.#put(input);
      let packed;
      try {
        packed = this.exports.pc_call(opPtr, opLen, inPtr, inLen);
      } catch (trap) {
        // panic = "abort" in the wasm-release profile: a Rust panic traps here.
        this.poisoned = true;
        throw new Error(`verifier wasm trapped in ${op}: ${trap.message || trap}`);
      }
      packed = BigInt.asUintN(64, BigInt(packed));
      const ptr = Number(packed >> 32n), len = Number(packed & 0xffffffffn);
      if (!ptr) throw new Error("verifier wasm: no reply (out of memory)");
      // Read before freeing; memory.buffer may have grown during the call.
      const text = dec.decode(new Uint8Array(this.exports.memory.buffer, ptr, len).slice());
      this.exports.pc_free(ptr, len);
      return text;
    } finally {
      if (opLen) this.exports.pc_free(opPtr, opLen);
      if (inLen) this.exports.pc_free(inPtr, inLen);
    }
  }

  /**
   * Run `op` with `obj` (JSON data; BigInts allowed). Returns `ok`, throws on
   * `err`. Integers in the reply that are not exact doubles are BigInts.
   */
  call(op, obj = {}) {
    if (this.poisoned) throw new Error("verifier wasm trapped earlier; load a fresh instance");
    const reply = parseJson(this.callRaw(op, stringifyJson(obj)));
    if (reply && "err" in reply) throw new Error(`${op}: ${reply.err}`);
    return reply.ok;
  }

  /** See {@link parseJson}. */
  static parseJson(text) {
    return parseJson(text);
  }

  /** See {@link stringifyJson}. */
  static stringifyJson(value, indent) {
    return stringifyJson(value, indent);
  }
}

export default PointcastVerifier;
