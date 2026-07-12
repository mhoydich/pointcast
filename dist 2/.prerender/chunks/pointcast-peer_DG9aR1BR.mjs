import { b as buildProtocolManifest } from './protocol_Dbeq-_zC.mjs';

const GET = async () => {
  const manifest = buildProtocolManifest();
  return new Response(
    JSON.stringify(
      {
        name: manifest.name,
        version: manifest.version,
        status: manifest.status,
        updatedAt: manifest.updatedAt,
        origin: manifest.origin,
        route: manifest.discovery.route,
        manifest: manifest.discovery.json,
        client: manifest.client.human,
        friendDemo: manifest.client.demo,
        chainMessenger: manifest.client.chainMessenger,
        block: manifest.discovery.block,
        relay: manifest.relayPrototype.endpoint,
        peer: {
          id: "peer:web:pointcast.xyz",
          label: "PointCast",
          accepts: [manifest.packetMediaType],
          transports: ["local-log", "https", "encrypted-relay", "webrtc-signaling", "jsonl-export", "tezos-proof"],
          agentReadable: true
        }
      },
      null,
      2
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
