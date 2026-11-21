// Smoke test: start the server over stdio, list tools, render a Noun, write a ticket (no posting).
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "kit-test", version: "0.0.1" });
await client.connect(new StdioClientTransport({ command: "node", args: ["server.mjs"] }));
const { tools } = await client.listTools();
console.log("tools:", tools.map(t => t.name).join(", "));

const r = await client.callTool({ name: "noun_render", arguments: { seed_text: "officenoun", scale: 4 } });
const info = JSON.parse(r.content[0].text);
console.log("render:", info.traits, info.svg.length, "bytes");

const bad = await client.callTool({ name: "noun_render", arguments: { glasses: "glasses-square-red" } });
console.log("glasses alone refused:", bad.isError === true);

const t = await client.callTool({ name: "mint_ticket", arguments: { desk: "test desk", title: "Test note", line: "a smoke test", edition: 1, art: "https://example.com/a.png" } });
console.log(JSON.parse(t.content[0].text).ticket);
await client.close();
