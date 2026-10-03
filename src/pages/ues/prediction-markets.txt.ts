import course from '../../data/prediction-curriculum.json';
import landscape from '../../data/prediction-landscape.json';
export const prerender = true;
export function GET() {
  const lines = [course.title,'Checked '+landscape.asOf,'Free, unaccredited education. Synthetic paper exercises only. No live trades, accounts or venue feeds.',course.quizNotice,''];
  for (const [i,m] of course.modules.entries()) {
    lines.push(`${i+1}. ${m.title} (${m.level}, about ${m.minutes} min)`,...m.objectives.map(x=>'Goal: '+x),'',...m.paragraphs,'','SYNTHETIC EXAMPLE: '+m.workedExample.title,...m.workedExample.paragraphs,'','PAPER EXERCISE: '+m.paperExercise.title,...m.paperExercise.steps.map((x,j)=>`${j+1}. ${x}`),'','LEARNING CHECK: '+m.checkpoint.question,...m.checkpoint.options.map((x,j)=>`${j+1}. ${x}`),'Answer: '+m.checkpoint.options[m.checkpoint.correctIndex],m.checkpoint.explanation,'');
  }
  lines.push('2026 LANDSCAPE',...landscape.adFinding.paragraphs,'');
  for(const v of landscape.venues) lines.push(v.name,v.summary,'Interface: '+v.api,'Rights: '+v.rights,'US / California: '+v.eligibility,'Course use: '+v.courseUse,'');
  lines.push('2027 SCENARIOS — NOT FORECASTS');
  for(const s of landscape.scenarios) lines.push(s.title,s.description,'Triggers: '+s.triggers,'Uncertainty: '+s.uncertainty,'Paper exercise: '+s.exercise,'');
  lines.push('SOURCE LEDGER');
  for(const s of landscape.sources) lines.push(s.title,s.url,s.publisher+'; checked '+s.checked,s.supports,s.caveat||'','');
  lines.push('SOURCE GAPS',...landscape.gaps);
  return new Response(lines.join('\n')+'\n',{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=0, must-revalidate'}});
}
