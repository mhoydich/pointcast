import { NounsMoneySandbox, IndexedDbSandboxStore } from '../../packages/nouns-money-sdk/src/index';
let release = () => {};
export function mountDeveloperDashboard() {
  release();const root=document.querySelector<HTMLElement>('[data-nm-developers]');if(!root)return;
  const sandbox=new NounsMoneySandbox(new IndexedDbSandboxStore());let disposed=false;let reading=false;
  const $=<T extends HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
  const refresh=async()=>{if(reading)return;reading=true;$<HTMLButtonElement>('[data-nm-dashboard-refresh]').disabled=true;
    try { const intents=await sandbox.listIntents();if(disposed)return;
      $('[data-nm-created]').textContent=String(intents.length);$('[data-nm-confirmed]').textContent=String(intents.filter(intent=>intent.status==='succeeded').length);$('[data-nm-canceled]').textContent=String(intents.filter(intent=>intent.status==='canceled').length);
      $('[data-nm-dashboard-status]').textContent=intents.length?'Loaded this browser’s saved demo activity.':'No demo activity yet. Create your first test intent in the payment sandbox.';
      const rows=$('[data-nm-dashboard-rows]');rows.replaceChildren();
      for(const intent of intents.slice(0,20)){const tr=document.createElement('tr');for(const value of[intent.id,intent.label,intent.status,String(intent.noteCount)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}rows.append(tr);}
      if(!intents.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=4;td.textContent='No demo activity yet.';tr.append(td);rows.append(tr);}
    }catch{if(!disposed)$('[data-nm-dashboard-status]').textContent='Local sandbox storage is unavailable. No demo metrics could be read.';}finally{reading=false;if(!disposed)$<HTMLButtonElement>('[data-nm-dashboard-refresh]').disabled=false;}
  };
  const probe=async()=>{const button=$<HTMLButtonElement>('[data-nm-api-probe]');button.disabled=true;
    try{const response=await fetch('/nouns-money/catalog.json',{cache:'no-store'});const data=await response.json();if(disposed)return;if(!response.ok)throw new Error();$('[data-nm-api-output]').textContent=JSON.stringify({httpStatus:response.status,schema:data.schema,count:data.count,firstNote:data.notes[0],provenance:data.provenance},null,2);}catch{if(!disposed)$('[data-nm-api-output]').textContent='Catalog request failed. Try again.';}finally{if(!disposed)button.disabled=false;}
  };
  const click=(event:Event)=>{const target=(event.target as Element).closest('button');if(target?.hasAttribute('data-nm-dashboard-refresh'))void refresh();if(target?.hasAttribute('data-nm-api-probe'))void probe();};
  root.addEventListener('click',click);release=()=>{disposed=true;root.removeEventListener('click',click);};void refresh();
}
