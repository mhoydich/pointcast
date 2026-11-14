import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {derive} from '../public/loom-lab/progress/model.mjs';
const root=new URL('../',import.meta.url);
const definitions=JSON.parse(readFileSync(new URL('src/data/loom-progress-jobs.json',root)));
const evidence=JSON.parse(readFileSync(new URL('src/data/loom-progress-evidence.json',root)));
for(const m of Object.values(evidence.messages))if(createHash('sha256').update(m.body).digest('hex')!==m.bodySha256)throw Error('Evidence body hash mismatch: '+m.id);
const data={definitions,evidence},model=derive(data);writeFileSync(new URL('public/loom-lab/progress/data.json',root),JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({summary:model.summary,missing:evidence.missingReferences,intervals:model.jobs.map(j=>({id:j.id,ms:j.intervalMs}))},null,2));
