import { env } from "cloudflare:workers";
import { evictDurableObject, runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { blake2b } from "@noble/hashes/blake2.js";
import worker from "../src/index";
import { bytesToHex, hexToBytes, importAttestor, joinDigest, parseClaim, playerForKey, requestDigest, roomDigest, sessionDigest } from "../src/attest";

const domain = { chain_id: "pointcast-dev", genesis: "22".repeat(32) };
const testKey = "04".repeat(32);
const vector = {
  ...domain, sender: "tz1c8PEDNfj6UxoQM2XCyfTHM5KbGGgoqDrH", nonce: 17, room: "drum-hall",
  players: ["pca1Cs6Mg7h5Keyg5fJvNwhyKzfopxRWNceVU", "tz1c8PEDNfj6UxoQM2XCyfTHM5KbGGgoqDrH", "tz2UahS9YSVKUxvbsNGWcLnAG1P8MDBuk625"],
  beat_hash: bytesToHex(blake2b(new TextEncoder().encode("demo-beat"), { dkLen: 32 })), duration: 120, ended_at_ms: "1790000000000",
};
const stub = (room: string) => env.DRUM_ATTEST_ROOM.getByName(`${domain.chain_id}:${domain.genesis}:${room}`);
const rawPost = (room: string, body: unknown, ip = "192.0.2.1") => worker.fetch(new Request(`https://pointcast.test/api/drum/attest?room=${room}`, {
  method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip }, body: JSON.stringify(body),
}), env);
async function authorized(body: Record<string, unknown>, seed = testKey) {
  const signer = await importAttestor(seed);
  return { ...body, public_key: signer.publicKeyHex, request_signature: bytesToHex(await signer.sign(requestDigest(parseClaim(body)))) };
}
const post = async (room: string, body: Record<string, unknown>) => rawPost(room, await authorized(body));

async function evidence(room: string, player: string, nonce = 1) {
  const end = Date.now() - 100;
  const body = { ...domain, sender: player, players: [player], nonce, room, beat_hash: "00".repeat(32), duration: 10, ended_at_ms: end };
  await runInDurableObject(stub(room), async (_instance, state) => {
    for (const time of [end - 10000, end]) state.storage.sql.exec("INSERT OR IGNORE INTO evidence VALUES (?, ?, ?)", player, Math.floor(time / 1000), time);
  });
  return body;
}

class Inbox {
  private events: Record<string, unknown>[] = [];
  constructor(readonly socket: WebSocket) {
    socket.addEventListener("message", event => { if (typeof event.data === "string") this.events.push(JSON.parse(event.data)); });
    socket.accept();
  }
  async next(type: string, seq?: number) {
    for (let i = 0; i < 300; i++) {
      const event = this.events.find(event => event.type === type && (seq === undefined || event.seq === seq));
      if (event) return event;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error(`missing ${type}`);
  }
}

async function connect(room: string) {
  const response = await worker.fetch(new Request(`https://pointcast.test/api/drum/chain-room?room=${room}`, {
    headers: { Upgrade: "websocket", Origin: "https://pointcast.xyz" },
  }), env);
  expect(response.status).toBe(101);
  if (!response.webSocket) throw new Error("no websocket");
  return new Inbox(response.webSocket);
}

async function authenticate(client: Inbox, room: string, seed = testKey) {
  const challenge = await client.next("challenge");
  const signer = await importAttestor(seed);
  const digest = joinDigest(domain.chain_id, domain.genesis, room, String(challenge.challenge));
  expect(bytesToHex(digest)).toBe(challenge.digest);
  client.socket.send(JSON.stringify({ v: 1, type: "auth", public_key: signer.publicKeyHex, signature: bytesToHex(await signer.sign(digest)) }));
  const authenticated = await client.next("authenticated");
  expect(authenticated.player).toBe(playerForKey(hexToBytes(signer.publicKeyHex, 32)));
  return String(authenticated.player);
}

describe("canonical chain-core attestation", () => {
  it("matches independent Rust session, room and signature fixtures", async () => {
    const senderKey = await importAttestor("01".repeat(32));
    expect(playerForKey(hexToBytes(senderKey.publicKeyHex))).toBe("tz1c8PEDNfj6UxoQM2XCyfTHM5KbGGgoqDrH");
    const claim = parseClaim(vector);
    expect(bytesToHex(sessionDigest(claim))).toBe("6b06d91e270a9d3d62cded90357c33d7fce646b217d3e7fe3d125e7d66ad1638");
    expect(bytesToHex(roomDigest(claim))).toBe("b11314f7929f11cc89379697dcb3f1608838d9e0e5653a0e5f83cf3579b1744d");
    const signer = await importAttestor(testKey);
    expect(bytesToHex(await signer.sign(roomDigest(claim)))).toBe("06e49ae2bb804e7fae7389191ae14fa4e447b1ac8d9d338a83ac00b6be582629f22613d3166a826f01775705585440034d71f456c5ae30e88dc2472b24343b09");
  });
  it("rejects unsafe integers, overflow, unsorted players and invalid hex", () => {
    for (const nonce of [-1, Number.MAX_SAFE_INTEGER + 1, "18446744073709551616"]) expect(() => parseClaim({ ...vector, nonce })).toThrow();
    expect(() => parseClaim({ ...vector, players: [...vector.players].reverse() })).toThrow();
    expect(() => parseClaim({ ...vector, genesis: "zz".repeat(32) })).toThrow();
    expect(() => parseClaim([])).toThrow();
  });
});

describe("room authority and replay controls", () => {
  it("stays disabled for unconfigured rooms and never normalizes a malformed room", async () => {
    expect((await post("unknown", vector)).status).toBe(503);
    expect((await post("../drum-hall", vector)).status).toBe(400);
    const response = await stub("secure-test").fetch("https://pointcast.test/api/drum/attest?room=secure-test");
    expect(await response.json()).toMatchObject({ identities: ["direct-tz1-ed25519"], ...domain });
  });
  it("authenticates the socket's key, records server-time hits, and refuses anonymous frames", async () => {
    const client = await connect("secure-test");
    const player = await authenticate(client, "secure-test");
    client.socket.send(JSON.stringify({ v: 1, type: "hit", pad: "kick", velocity: 1, seq: 1, clientAt: 0, player: "tz1forged" }));
    const hit = await client.next("hit");
    expect(hit.player).toBe(player);
    expect(hit.serverAt).toBeGreaterThan(0);
    const rows = await runInDurableObject(stub("secure-test"), async (_instance, state) => state.storage.sql.exec<{ player: string }>("SELECT player FROM evidence").toArray());
    expect(rows).toEqual([{ player }]);
    await evictDurableObject(stub("secure-test"));
    client.socket.send(JSON.stringify({ v: 1, type: "hit", pad: "snare", velocity: 1, seq: 2 }));
    expect(await client.next("hit", 2)).toMatchObject({ player });
    client.socket.close(1000);
    const anonymous = await connect("spoof-test");
    const closed = new Promise<number>(resolve => anonymous.socket.addEventListener("close", event => resolve(event.code)));
    anonymous.socket.send(JSON.stringify({ v: 1, type: "hit", pad: "kick", velocity: 1, seq: 1, player }));
    expect(await closed).toBe(1008);
  });
  it("attests a complete server-observed played interval through the real WebSocket", async () => {
    const room = "played-test";
    const client = await connect(room);
    const player = await authenticate(client, room);
    client.socket.send(JSON.stringify({ v: 1, type: "hit", pad: "kick", velocity: 1, seq: 1 }));
    await client.next("hit", 1);
    await new Promise(resolve => setTimeout(resolve, 9200));
    client.socket.send(JSON.stringify({ v: 1, type: "hit", pad: "snare", velocity: 1, seq: 2 }));
    const last = await client.next("hit", 2);
    const claim = { ...domain, room, sender: player, players: [player], nonce: 1, duration: 10, ended_at_ms: Number(last.serverAt), beat_hash: "00".repeat(32) };
    expect((await post(room, claim)).status).toBe(200);
    client.socket.close(1000);
  });
  it("cannot replay a join signature on a second connection", async () => {
    const first = await connect("replay-test");
    const second = await connect("replay-test");
    const challenge = await first.next("challenge");
    await second.next("challenge");
    const signer = await importAttestor(testKey);
    const signature = bytesToHex(await signer.sign(joinDigest(domain.chain_id, domain.genesis, "replay-test", String(challenge.challenge))));
    const closed = new Promise<number>(resolve => second.socket.addEventListener("close", event => resolve(event.code)));
    second.socket.send(JSON.stringify({ v: 1, type: "auth", public_key: signer.publicKeyHex, signature }));
    expect(await closed).toBe(1008);
    first.socket.close(1000);
  });
  it("rejects domain changes, missing evidence, unsupported controllers and wrong time windows", async () => {
    const player = playerForKey(hexToBytes((await importAttestor(testKey)).publicKeyHex));
    const body = await evidence("domain-test", player);
    for (const change of [{ genesis: "33".repeat(32) }, { chain_id: "other-chain" }, { room: "secure-test" }, { players: ["pcp1unsupported"], sender: "pcp1unsupported" }, { ended_at_ms: Date.now() + 30000 }, { ended_at_ms: Date.now() - 300001 }, { duration: 300 }]) {
      expect((await post("domain-test", { ...body, ...change })).status).toBe(403);
    }
    expect((await post("body-test", { ...body, room: "body-test" })).status).toBe(403);
  });
  it("returns an idempotent receipt, verifies under the registered key, and refuses nonce or interval reuse", async () => {
    const player = playerForKey(hexToBytes((await importAttestor(testKey)).publicKeyHex));
    const body = await evidence("overlap-test", player);
    const response = await post("overlap-test", body);
    expect(response.status).toBe(200);
    const receipt = await response.json<{ attestor: string; signature: string; room_digest: string }>();
    const key = await crypto.subtle.importKey("raw", hexToBytes(receipt.attestor), "Ed25519", false, ["verify"]);
    expect(await crypto.subtle.verify("Ed25519", key, hexToBytes(receipt.signature), roomDigest(parseClaim(body)))).toBe(true);
    await evictDurableObject(stub("overlap-test"));
    expect(await (await post("overlap-test", body)).json()).toEqual(receipt);
    expect((await post("overlap-test", { ...body, beat_hash: "11".repeat(32) })).status).toBe(409);
    expect((await post("overlap-test", { ...body, nonce: 2 })).status).toBe(409);
  });
  it("cannot consume a victim's observations without proof over that exact claim", async () => {
    const player = playerForKey(hexToBytes((await importAttestor(testKey)).publicKeyHex));
    const body = await evidence("proof-test", player);
    expect((await rawPost("proof-test", body)).status).toBe(403);
    expect((await rawPost("proof-test", await authorized(body, "05".repeat(32)))).status).toBe(403);
    const proof = await authorized(body);
    expect((await rawPost("proof-test", { ...proof, beat_hash: "11".repeat(32) })).status).toBe(403);
    expect((await post("proof-test", body)).status).toBe(200);
  });
  it("requires each co-player's exact-claim consent before consuming their interval", async () => {
    const victim = await importAttestor(testKey);
    const host = await importAttestor("05".repeat(32));
    const player = playerForKey(hexToBytes(victim.publicKeyHex));
    const sender = playerForKey(hexToBytes(host.publicKeyHex));
    const body = await evidence("consent-test", player);
    const hostEvidence = await evidence("consent-test", sender);
    const end = Math.min(Number(body.ended_at_ms), Number(hostEvidence.ended_at_ms));
    await runInDurableObject(stub("consent-test"), async (_instance, state) => {
      state.storage.sql.exec("DELETE FROM evidence");
      for (const identity of [player, sender]) for (const time of [end - 10000, end]) state.storage.sql.exec("INSERT INTO evidence VALUES (?, ?, ?)", identity, Math.floor(time / 1000), time);
    });
    const multi = { ...body, sender, players: [sender, player].sort(), ended_at_ms: end };
    const hostProof = await authorized(multi, "05".repeat(32));
    expect((await rawPost("consent-test", hostProof)).status).toBe(403);
    // A victim can still attest their own interval after the host's failed attempt.
    expect((await post("consent-test", { ...body, ended_at_ms: end })).status).toBe(200);
    const noConsumed = await runInDurableObject(stub("consent-test"), async (_instance, state) => state.storage.sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM consumed WHERE player = ?", sender).one().n);
    expect(noConsumed).toBe(0);
    // Separate room fixture demonstrates valid consent for the complete multi-player claim.
    const valid = { ...multi, room: "multi-test" };
    await runInDurableObject(stub("multi-test"), async (_instance, state) => {
      for (const identity of [player, sender]) for (const time of [end - 10000, end]) state.storage.sql.exec("INSERT INTO evidence VALUES (?, ?, ?)", identity, Math.floor(time / 1000), time);
    });
    const victimProof = await authorized(valid);
    const approved = { ...await authorized(valid, "05".repeat(32)), player_proofs: [{ public_key: victimProof.public_key, request_signature: victimProof.request_signature }] };
    expect((await rawPost("multi-test", approved)).status).toBe(200);
  });
  it("keeps invalid public requests out of the authorized signing and upgrade quotas", async () => {
    const player = playerForKey(hexToBytes((await importAttestor(testKey)).publicKeyHex));
    const body = await evidence("quota-test", player);
    for (let i = 0; i < 31; i++) await rawPost("quota-test", body, "192.0.2.9");
    expect((await rawPost("quota-test", body, "192.0.2.9")).status).toBe(429);
    expect((await rawPost("quota-test", await authorized(body), "192.0.2.10")).status).toBe(200);
    const rows = await runInDurableObject(stub("quota-test"), async (_instance, state) => state.storage.sql.exec<{ bucket: string; count: number }>("SELECT bucket, count FROM rate WHERE bucket IN ('signing', 'upgrades')").toArray());
    expect(rows).toEqual([{ bucket: "signing", count: 1 }]);
  });
  it("atomically reserves a played interval under concurrent nonces", async () => {
    const player = playerForKey(hexToBytes((await importAttestor(testKey)).publicKeyHex));
    const body = await evidence("concurrent-test", player);
    const responses = await Promise.all([post("concurrent-test", body), post("concurrent-test", { ...body, nonce: 2 })]);
    expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
  });
  it("shares hit budget by key and throttles room exhaustion without closing honest sockets", async () => {
    const room = "hit-quota-test";
    const first = await connect(room);
    const second = await connect(room);
    const honest = await connect(room);
    const attacker = await authenticate(first, room);
    await authenticate(second, room);
    await authenticate(honest, room, "05".repeat(32));
    const minute = Math.floor(Date.now() / 60000);
    await runInDurableObject(stub(room), async (_instance, state) => {
      state.storage.sql.exec("INSERT INTO rate VALUES (?, ?, ?)", `player:${attacker}`, minute, 480);
    });
    for (const client of [first, second]) {
      client.socket.send(JSON.stringify({ v: 1, type: "hit", pad: "kick", velocity: 1, seq: 1 }));
      expect(await client.next("rate-limit")).toMatchObject({ retryAfterMs: 60000 });
      expect(client.socket.readyState).toBe(WebSocket.OPEN);
    }
    honest.socket.send(JSON.stringify({ v: 1, type: "hit", pad: "kick", velocity: 1, seq: 1 }));
    expect(await honest.next("hit", 1)).toMatchObject({ seq: 1 });
    await runInDurableObject(stub(room), async (_instance, state) => {
      state.storage.sql.exec("UPDATE rate SET count = 18000 WHERE bucket = 'hits'");
    });
    honest.socket.send(JSON.stringify({ v: 1, type: "hit", pad: "kick", velocity: 1, seq: 2 }));
    await honest.next("rate-limit");
    expect(honest.socket.readyState).toBe(WebSocket.OPEN);
    for (const client of [first, second, honest]) client.socket.close(1000);
  });
  it("closes an expired idle challenge through the durable alarm", async () => {
    const room = "expiry-test";
    const client = await connect(room);
    await client.next("challenge");
    const closed = new Promise<number>(resolve => client.socket.addEventListener("close", event => resolve(event.code)));
    await runInDurableObject(stub(room), async (_instance, state) => {
      for (const socket of state.getWebSockets()) {
        const attachment = socket.deserializeAttachment() as Record<string, unknown>;
        attachment.challengeUntil = Date.now() - 1;
        socket.serializeAttachment(attachment);
      }
    });
    expect(await runDurableObjectAlarm(stub(room))).toBe(true);
    expect(await closed).toBe(1008);
  });
  it("bounds untrusted request bodies", async () => {
    const response = await worker.fetch(new Request("https://pointcast.test/api/drum/attest?room=body-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: "x".repeat(16385) }), env);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "body-too-large" });
  });
});
