import { filterStores, filterProducts, readFilters, writeFilters, projectPoint } from '../lib/dispensary-atlas.mjs';

function mountAtlas() {
 const root = document.querySelector<HTMLElement>('[data-atlas]');
 const blob = document.querySelector('#atlas-data');
 if (!root || !blob || root.dataset.mounted) return;
 root.dataset.mounted = 'true';
 const data = JSON.parse(blob.textContent || '{}');
 const get = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
 const stores = data.stores;
 let state = readFilters(new URLSearchParams(location.search), {stores, products:data.products});
 let page = 0;
 const pageSize = 18;
 let selectedId = get<HTMLSelectElement>('[data-map-record]').value;
 let visible = stores;
 let zoom = 1;
 const controls: Record<string,string> = {q:'#store-q',jurisdiction:'#jurisdiction',status:'#license-status',pq:'#product-q',brand:'#product-brand',category:'#product-category',store:'#product-store'};
 for (const [key, selector] of Object.entries(controls)) get<HTMLInputElement|HTMLSelectElement>(selector).value = state[key];
 const setText = (selector: string, value: unknown) => { get(selector).textContent = String(value ?? ''); };
 function inspect(id: string) {
  const record = visible.find((s:any) => s.id === id);
  if (!record) { get('[data-record-detail]').hidden = true; return; }
  selectedId = id;
  get('[data-record-detail]').hidden = false;
  get<HTMLSelectElement>('[data-map-record]').value = id;
  setText('[data-detail-name]',record.name);
  setText('[data-detail-status]',`${record.licenseStatus} license`);
  setText('[data-detail-license]',record.licenseNumber);
  setText('[data-detail-address]',record.address);
  setText('[data-detail-jurisdiction]',record.jurisdiction+(record.jurisdictionNote ? ` (${record.jurisdictionNote})` : ''));
  setText('[data-detail-distance]',`${record.distanceMiles.toFixed(2)} geodesic miles`);
  setText('[data-detail-designation]',record.designation);
  setText('[data-detail-coordinates]',`${record.lat}, ${record.lon}`);
  setText('[data-detail-note]',record.profile?.coverage ?? 'Registry record only. Operating hours, current assortment and store revenue are not independently established.');
  get<HTMLAnchorElement>('[data-detail-registry]').href = record.registryUrl;
  const menu = get<HTMLAnchorElement>('[data-detail-menu]');
  menu.hidden = !record.profile?.menuUrl;
  if (record.profile?.menuUrl) menu.href = record.profile.menuUrl;
  root.querySelectorAll<SVGCircleElement>('[data-pin]').forEach(pin=>pin.dataset.selected=String(pin.dataset.pin===id));
  const point = projectPoint(record,data.center);
  if(point) get<SVGElement>('[data-map]').style.transformOrigin=`${point.x/7.6}% ${point.y/7.6}%`;
 }
 function renderStores(rebuildOptions: boolean) {
  visible = filterStores(stores,state,data.center,data.radiusMiles);
  const pages = Math.max(1,Math.ceil(visible.length/pageSize));
  page = Math.max(0,Math.min(page,pages-1));
  const ids = new Set(visible.map((s:any)=>s.id));
  const pageIds = new Set(visible.slice(page*pageSize,(page+1)*pageSize).map((s:any)=>s.id));
  root.querySelectorAll<HTMLElement>('[data-store-row]').forEach(row=>row.hidden=!pageIds.has(row.dataset.storeRow));
  root.querySelectorAll<SVGCircleElement>('[data-pin]').forEach(pin=>{pin.toggleAttribute('hidden',!ids.has(pin.dataset.pin));});
  setText('[data-store-count]',`${visible.length} ${state.status==='all'?'retailer license records, all statuses':`${state.status} retailer license records`} · within 25 miles`);
  setText('[data-page-label]',`${visible.length ? page*pageSize+1 : 0}–${Math.min((page+1)*pageSize,visible.length)} of ${visible.length}`);
  get<HTMLButtonElement>('[data-page="previous"]').disabled=page===0;
  get<HTMLButtonElement>('[data-page="next"]').disabled=page===pages-1;
  get('[data-store-empty]').hidden=visible.length>0;
  const picker=get<HTMLSelectElement>('[data-map-record]');
  picker.disabled=visible.length===0;
  if(rebuildOptions){
   picker.replaceChildren(...visible.map((record:any)=>{const option=document.createElement('option');option.value=record.id;option.textContent=`${record.name} — ${record.licenseNumber}`;return option;}));
   if(!ids.has(selectedId)) selectedId=visible[0]?.id;
   inspect(selectedId);
  }
 }
 function renderProducts() {
  const products=filterProducts(data.products,{q:state.pq,brand:state.brand,category:state.category,store:state.store});
  const ids=new Set(products.map((p:any)=>p.id));
  root.querySelectorAll<HTMLElement>('[data-product]').forEach(card=>card.hidden=!ids.has(card.dataset.product));
  setText('[data-product-count]',`${products.length} of ${data.products.length} public observations · checked ${data.checkedOn} · stock unverified`);
  get('[data-product-empty]').hidden=products.length>0;
 }
 function updateURL() {
  const query=writeFilters(state);
  history.replaceState(null,'',`${location.pathname}${query?'?'+query:''}${location.hash}`);
 }
 function readControls() {
  const params=new URLSearchParams();
  for(const [key,selector] of Object.entries(controls)) params.set(key,get<HTMLInputElement|HTMLSelectElement>(selector).value);
  state=readFilters(params,{stores,products:data.products});
  page=0;renderStores(true);renderProducts();updateURL();
  get('[data-share-box]').hidden=true;
 }
 root.querySelectorAll<HTMLFormElement>('form').forEach(form=>{form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',readControls);form.addEventListener('change',readControls);});
 get<HTMLSelectElement>('[data-map-record]').addEventListener('change',e=>inspect((e.target as HTMLSelectElement).value));
 root.addEventListener('click',event=>{
  const target=event.target as Element;
  const record=target.closest<HTMLElement>('[data-inspect]');
  const pin=target.closest<SVGCircleElement>('[data-pin]');
  if(record){inspect(record.dataset.inspect!);get('[data-map-record]').focus();}
  if(pin)inspect(pin.dataset.pin!);
  const pageControl=target.closest<HTMLElement>('[data-page]');
  if(pageControl){page+=pageControl.dataset.page==='next'?1:-1;renderStores(false);}
  const zoomControl=target.closest<HTMLElement>('[data-zoom]');
  if(zoomControl){zoom=zoomControl.dataset.zoom==='reset'?1:Math.max(1,Math.min(2,zoom+(zoomControl.dataset.zoom==='in'?.25:-.25)));get<SVGElement>('[data-map]').style.transform=`scale(${zoom})`;}
 });
 get('[data-share]').addEventListener('click',()=>{updateURL();const box=get('[data-share-box]');box.hidden=false;const input=get<HTMLInputElement>('[data-share-url]');input.value=location.href;input.focus();input.select();});
 window.addEventListener('popstate',()=>{state=readFilters(new URLSearchParams(location.search),{stores,products:data.products});for(const [key,selector] of Object.entries(controls))get<HTMLInputElement|HTMLSelectElement>(selector).value=state[key];page=0;renderStores(true);renderProducts();});
 renderStores(true);renderProducts();
}
mountAtlas();
