const t=document.querySelector("[data-mission-control]"),i="Guardrail: informational Nouns reenactment, not official replay, odds, betting, prediction, payout, or forced outcome.",e={goal:"watch",goalLabel:"Watch",goalTitle:"Make one result understandable in 30 seconds.",goalCopy:"Turn a score into a field, show the shape, explain the setup, and let the Nouns battle carry the energy.",goalProof:"Viewer can say the source result, field shape, and why this match feels like the game.",shape:"close",shapeLabel:"Close",field:"Windy kingdom rush",modifier:"small survivor gap and late-lane gust"};function g(){return{league:t.querySelector("[data-result-league]")?.value.trim()||"NBA",winner:t.querySelector("[data-result-winner]")?.value.trim()||"Celtics",loser:t.querySelector("[data-result-loser]")?.value.trim()||"Knicks",score:t.querySelector("[data-result-score]")?.value.trim()||"112-109"}}function l(){const a=g(),o=`${a.league}: ${a.winner} ${a.score} over ${a.loser}`,r=`/nouns-nation-battler/#mode=desk&reenact=${e.shape}`,s=new URL(r,window.location.origin).href,d=`HOST RUNDOWN
Open: ${o} becomes ${e.field}.
Goal: ${e.goalLabel} - ${e.goalTitle}
Field read: ${e.shapeLabel} shape with ${e.modifier}.
Callout 1: Explain how the result pressure maps into the Nouns field.
Callout 2: Watch for numbered Nouns, gang momentum, and banner context.
Signoff: This is an interpretive alt-broadcast setup, not an official replay.
${i}
Launch: ${s}`,u=`AGENT TASK: ${e.goalLabel} Sports Reenactment
Source result: ${o}
Shape: ${e.shape}
Field: ${e.field}
Objective: ${e.goalCopy}
Deliver: one headline, one short receipt, one poster or clip idea, three proof notes, and one next action.
Proof target: ${e.goalProof}
${i}`,p=`NOUNS ALT-CAST RECEIPT
${o}
Mission: ${e.goalLabel}
Field: ${e.field}
Modifier: ${e.modifier}
Watch: ${s}
${i}`,f=`PROOF CHECKLIST
[ ] Source result is visible: ${o}
[ ] Shape is visible: ${e.shape}
[ ] Field is visible: ${e.field}
[ ] Artifact says informational, not official replay.
[ ] Artifact avoids odds, betting, prediction, payout, and forced outcome language.
[ ] Human approval is required for sponsor or participant-credit routing.`,h=`LIVE RUN SHEET
00:00 Cold open - ${o} as ${e.field}.
00:20 Guardrail - user-entered result, interpretive Nouns setup, no official replay.
00:40 Field read - ${e.shapeLabel}: ${e.modifier}.
01:10 Nouns focus - name two numbered players, one gang, and the first pressure swing.
02:00 Agent lane - ask for headline, poster concept, sponsor-safe read, or QA note.
03:00 Share beat - copy the receipt and send viewers to ${s}
04:00 Proof check - confirm source result, shape, field, guardrail, and human approval path.
Close - The battle is inspired by the result; the sim outcome is not forced.`;t.querySelector('[data-mission-field="goalLabel"]').textContent=e.goalLabel,t.querySelector('[data-mission-field="headline"]').textContent=`${a.winner} ${a.score} over ${a.loser} becomes a ${e.field} mission.`,t.querySelector('[data-mission-field="summary"]').textContent=`${e.goalCopy} Field modifier: ${e.modifier}.`,t.querySelector("[data-mission-launch]").href=r,t.querySelector('[data-artifact="host"]').value=d,t.querySelector('[data-artifact="agent"]').value=u,t.querySelector('[data-artifact="share"]').value=p,t.querySelector('[data-artifact="proof"]').value=f,t.querySelector('[data-artifact="runsheet"]').value=h}function n(a){const o=t.querySelector(`[data-goal-option="${a}"]`);o&&(t.querySelectorAll("[data-goal-option]").forEach(r=>r.classList.toggle("is-active",r===o)),e.goal=o.dataset.goalOption||"watch",e.goalLabel=o.dataset.label||"Watch",e.goalTitle=o.dataset.title||e.goalTitle,e.goalCopy=o.dataset.copy||e.goalCopy,e.goalProof=o.dataset.proof||e.goalProof)}function c(a){const o=t.querySelector(`[data-shape-option="${a}"]`);o&&(t.querySelectorAll("[data-shape-option]").forEach(r=>r.classList.toggle("is-active",r===o)),e.shape=o.dataset.shapeOption||"close",e.shapeLabel=o.dataset.label||"Close",e.field=o.dataset.field||e.field,e.modifier=o.dataset.modifier||e.modifier)}t.querySelectorAll("[data-goal-option]").forEach(a=>{a.addEventListener("click",()=>{n(a.dataset.goalOption||"watch"),l()})});t.querySelectorAll("[data-shape-option]").forEach(a=>{a.addEventListener("click",()=>{c(a.dataset.shapeOption||"close"),l()})});t.querySelectorAll("[data-mission-sample]").forEach(a=>{a.addEventListener("click",()=>{t.querySelectorAll("[data-mission-sample]").forEach(o=>o.classList.toggle("is-active",o===a)),t.querySelector("[data-result-league]").value=a.dataset.league||"NBA",t.querySelector("[data-result-winner]").value=a.dataset.winner||"Celtics",t.querySelector("[data-result-loser]").value=a.dataset.loser||"Knicks",t.querySelector("[data-result-score]").value=a.dataset.score||"112-109",n(a.dataset.goal||"watch"),c(a.dataset.shape||"close"),l()})});t.querySelectorAll(".result-fields input").forEach(a=>a.addEventListener("input",l));t.querySelectorAll("[data-copy-artifact]").forEach(a=>{a.addEventListener("click",async()=>{const o=t.querySelector(`[data-artifact="${a.dataset.copyArtifact}"]`);try{await navigator.clipboard.writeText(o.value);const r=a.textContent;a.textContent="Copied",window.setTimeout(()=>{a.textContent=r},1400)}catch{o.focus(),o.select()}})});l();
