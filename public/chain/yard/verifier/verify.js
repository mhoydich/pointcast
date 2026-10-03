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

  /** Run `op` with `obj` (JSON-serialisable). Returns `ok`, throws on `err`. */
  call(op, obj = {}) {
    if (this.poisoned) throw new Error("verifier wasm trapped earlier; load a fresh instance");
    const reply = JSON.parse(this.callRaw(op, JSON.stringify(obj)));
    if (reply && "err" in reply) throw new Error(`${op}: ${reply.err}`);
    return reply.ok;
  }
}

export default PointcastVerifier;
