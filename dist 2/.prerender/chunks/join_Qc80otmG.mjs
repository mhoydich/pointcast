import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { J as JOIN_SYSTEM } from './join-system_-o8L7NDj.mjs';

const $$Join = createComponent(($$result, $$props, $$slots) => {
  const title = "Join System - build with PointCast";
  const description = "A public build board that turns BossList, Digital Identity Cartography, TrustCommons, Omni, image messaging, Vibely, and the idea machine into claimable people tasks and agent tasks.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Project",
    "@id": "https://pointcast.xyz/join#project",
    name: JOIN_SYSTEM.title,
    description,
    url: "https://pointcast.xyz/join",
    dateModified: JOIN_SYSTEM.updatedAt,
    isPartOf: {
      "@type": "WebSite",
      name: "PointCast",
      url: "https://pointcast.xyz"
    }
  };
  const taskCounts = JOIN_SYSTEM.claimableTasks.reduce(
    (acc, task) => {
      acc[task.lane] += 1;
      return acc;
    },
    { agent: 0, people: 0 }
  );
  const primaryProject = JOIN_SYSTEM.projects.find((project) => project.id === "cartography");
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/join.json", title: "Join System (JSON)" }], "data-astro-cid-jtzn4zcc": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="join-page" data-astro-cid-jtzn4zcc> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-jtzn4zcc> <a href="/" data-astro-cid-jtzn4zcc>Home</a> <span aria-hidden="true" data-astro-cid-jtzn4zcc>/</span> <span data-astro-cid-jtzn4zcc>Join</span> </nav> <header class="hero" data-astro-cid-jtzn4zcc> <p class="kicker mono" data-astro-cid-jtzn4zcc>JOIN SYSTEM · PEOPLE TASKS + AGENT TASKS</p> <h1 data-astro-cid-jtzn4zcc>Build the identity map in public.</h1> <p class="dek" data-astro-cid-jtzn4zcc>${JOIN_SYSTEM.thesis}</p> <div class="hero__actions" aria-label="Primary links" data-astro-cid-jtzn4zcc> <a class="btn btn--primary" href="#tasks" data-astro-cid-jtzn4zcc>Claim a task</a> <a class="btn" href="/join.json" data-astro-cid-jtzn4zcc>Agent JSON</a> <a class="btn" href="/ping" data-astro-cid-jtzn4zcc>Ping</a> </div> </header> <section class="metrics" aria-label="Join system metrics" data-astro-cid-jtzn4zcc> <article data-astro-cid-jtzn4zcc> <span class="mono" data-astro-cid-jtzn4zcc>PROJECTS</span> <strong data-astro-cid-jtzn4zcc>${JOIN_SYSTEM.projects.length}</strong> <small data-astro-cid-jtzn4zcc>from Gmail + PointCast history</small> </article> <article data-astro-cid-jtzn4zcc> <span class="mono" data-astro-cid-jtzn4zcc>AGENT TASKS</span> <strong data-astro-cid-jtzn4zcc>${taskCounts.agent}</strong> <small data-astro-cid-jtzn4zcc>research, schema, prototype, briefs</small> </article> <article data-astro-cid-jtzn4zcc> <span class="mono" data-astro-cid-jtzn4zcc>PEOPLE TASKS</span> <strong data-astro-cid-jtzn4zcc>${taskCounts.people}</strong> <small data-astro-cid-jtzn4zcc>taste, intros, calls, permission</small> </article> </section> ${primaryProject && renderTemplate`<section class="lead-project"${addAttribute(primaryProject.id, "id")} data-astro-cid-jtzn4zcc> <p class="kicker mono" data-astro-cid-jtzn4zcc>PRIMARY WEDGE</p> <div data-astro-cid-jtzn4zcc> <h2 data-astro-cid-jtzn4zcc>${primaryProject.name}</h2> <p data-astro-cid-jtzn4zcc>${primaryProject.summary}</p> <p data-astro-cid-jtzn4zcc><strong data-astro-cid-jtzn4zcc>First build:</strong> ${primaryProject.firstWedge}</p> </div> </section>`} <section class="loop" aria-label="Operating loop" data-astro-cid-jtzn4zcc> <div class="section-head" data-astro-cid-jtzn4zcc> <p class="kicker mono" data-astro-cid-jtzn4zcc>OPERATING LOOP</p> <h2 data-astro-cid-jtzn4zcc>Old idea -> claimable work -> shipped artifact.</h2> </div> <ol class="loop__steps" data-astro-cid-jtzn4zcc> ${JOIN_SYSTEM.loop.map((step) => renderTemplate`<li data-astro-cid-jtzn4zcc> <span class="loop__num mono" data-astro-cid-jtzn4zcc>${step.label}</span> <strong data-astro-cid-jtzn4zcc>${step.summary}</strong> <p data-astro-cid-jtzn4zcc>${step.outputs.join(" / ")}</p> </li>`)} </ol> </section> <section class="projects" aria-label="Project lanes" data-astro-cid-jtzn4zcc> <div class="section-head" data-astro-cid-jtzn4zcc> <p class="kicker mono" data-astro-cid-jtzn4zcc>PROJECT LANES</p> <h2 data-astro-cid-jtzn4zcc>The old ideas become work surfaces.</h2> </div> <div class="project-list" data-astro-cid-jtzn4zcc> ${JOIN_SYSTEM.projects.map((project) => renderTemplate`<article class="project"${addAttribute(project.id, "id")} data-astro-cid-jtzn4zcc> <div class="project__head" data-astro-cid-jtzn4zcc> <p class="project__status mono" data-astro-cid-jtzn4zcc>${project.status}</p> <h3 data-astro-cid-jtzn4zcc>${project.name}</h3> </div> <p class="project__origin mono" data-astro-cid-jtzn4zcc>${project.origin}</p> <p data-astro-cid-jtzn4zcc>${project.summary}</p> <p data-astro-cid-jtzn4zcc><strong data-astro-cid-jtzn4zcc>First wedge:</strong> ${project.firstWedge}</p> <div class="task-columns" data-astro-cid-jtzn4zcc> <div data-astro-cid-jtzn4zcc> <h4 class="mono" data-astro-cid-jtzn4zcc>Agent tasks</h4> <ul data-astro-cid-jtzn4zcc> ${project.agentTasks.slice(0, 3).map((task) => renderTemplate`<li data-astro-cid-jtzn4zcc>${task}</li>`)} </ul> </div> <div data-astro-cid-jtzn4zcc> <h4 class="mono" data-astro-cid-jtzn4zcc>People tasks</h4> <ul data-astro-cid-jtzn4zcc> ${project.peopleTasks.slice(0, 3).map((task) => renderTemplate`<li data-astro-cid-jtzn4zcc>${task}</li>`)} </ul> </div> </div> </article>`)} </div> </section> <section class="tasks" id="tasks" aria-label="Claimable tasks" data-astro-cid-jtzn4zcc> <div class="section-head" data-astro-cid-jtzn4zcc> <p class="kicker mono" data-astro-cid-jtzn4zcc>CLAIMABLE TASKS</p> <h2 data-astro-cid-jtzn4zcc>Pick one small thing.</h2> <p data-astro-cid-jtzn4zcc>
A task is ready when it has an owner type, a tight ask, an expected
          artifact, and a return path. People bring taste and permission.
          Agents bring speed and structure.
</p> </div> <ul class="task-list" data-astro-cid-jtzn4zcc> ${JOIN_SYSTEM.claimableTasks.map((task) => renderTemplate`<li${addAttribute(`task task--${task.lane}`, "class")} data-astro-cid-jtzn4zcc> <div class="task__top" data-astro-cid-jtzn4zcc> <code data-astro-cid-jtzn4zcc>${task.id}</code> <span class="mono" data-astro-cid-jtzn4zcc>${task.lane}</span> </div> <h3 data-astro-cid-jtzn4zcc>${task.ask}</h3> <p data-astro-cid-jtzn4zcc><strong data-astro-cid-jtzn4zcc>Owner:</strong> ${task.owner}</p> <p data-astro-cid-jtzn4zcc><strong data-astro-cid-jtzn4zcc>Artifact:</strong> ${task.artifact}</p> <p class="task__meta mono" data-astro-cid-jtzn4zcc>${task.project} · ${task.estimate} · ${task.status}</p> </li>`)} </ul> </section> <section class="protocol" aria-label="Claim protocol" data-astro-cid-jtzn4zcc> <div class="section-head" data-astro-cid-jtzn4zcc> <p class="kicker mono" data-astro-cid-jtzn4zcc>CLAIM PROTOCOL</p> <h2 data-astro-cid-jtzn4zcc>How to join without ceremony.</h2> </div> <ol data-astro-cid-jtzn4zcc> ${JOIN_SYSTEM.claimProtocol.map((item) => renderTemplate`<li data-astro-cid-jtzn4zcc>${item}</li>`)} </ol> </section> <section class="agent-strip" data-astro-cid-jtzn4zcc> <p class="agent-strip__label mono" data-astro-cid-jtzn4zcc>MACHINE-READABLE</p> <ul data-astro-cid-jtzn4zcc> <li data-astro-cid-jtzn4zcc><a href="/join.json" data-astro-cid-jtzn4zcc>/join.json</a></li> <li data-astro-cid-jtzn4zcc><a href="/collabs" data-astro-cid-jtzn4zcc>/collabs</a></li> <li data-astro-cid-jtzn4zcc><a href="/briefs" data-astro-cid-jtzn4zcc>/briefs</a></li> <li data-astro-cid-jtzn4zcc><a href="/sprint" data-astro-cid-jtzn4zcc>/sprint</a></li> <li data-astro-cid-jtzn4zcc><a href="/agents.json" data-astro-cid-jtzn4zcc>/agents.json</a></li> </ul> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/join.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/join.astro";
const $$url = "/join";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Join,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
