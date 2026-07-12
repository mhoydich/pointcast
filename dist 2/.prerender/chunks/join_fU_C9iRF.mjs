import { J as JOIN_SYSTEM } from './join-system_-o8L7NDj.mjs';

const GET = async () => {
  const payload = {
    $schema: "https://pointcast.xyz/join.json",
    name: JOIN_SYSTEM.title,
    id: JOIN_SYSTEM.id,
    status: JOIN_SYSTEM.status,
    updatedAt: JOIN_SYSTEM.updatedAt,
    source: JOIN_SYSTEM.source,
    homepage: "https://pointcast.xyz/join",
    thesis: JOIN_SYSTEM.thesis,
    loop: JOIN_SYSTEM.loop,
    projects: JOIN_SYSTEM.projects.map((project) => ({
      ...project,
      url: `https://pointcast.xyz/join#${project.id}`
    })),
    claimableTasks: JOIN_SYSTEM.claimableTasks.map((task) => ({
      ...task,
      claimUrl: "https://pointcast.xyz/ping",
      projectUrl: `https://pointcast.xyz/join#${task.project}`
    })),
    claimProtocol: JOIN_SYSTEM.claimProtocol,
    related: {
      collabs: "https://pointcast.xyz/collabs",
      briefs: "https://pointcast.xyz/briefs",
      sprint: "https://pointcast.xyz/sprint",
      agents: "https://pointcast.xyz/agents.json",
      ping: "https://pointcast.xyz/ping",
      block: "https://pointcast.xyz/b/0435"
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
