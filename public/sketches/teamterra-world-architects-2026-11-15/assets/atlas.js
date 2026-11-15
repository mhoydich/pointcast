(() => {
  'use strict';
  const data = window.TEAMTERRA;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fold = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const safeURL = s => { try {const u = new URL(s);return /^https?:$/.test(u.protocol) ? esc(u.href) : '#';} catch {return '#';} };
  const extIcon = '<svg class="arrow-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13 13 3M4 3h9v9"/></svg>';
  const records = data.practices;
  let region = 'All', filtered = records, selected = records.find(d=>d.city==='Dakar')?.id || records[0]?.id;
  $('#total-practices').textContent=records.length;
  $('#total-countries').textContent=new Set(records.map(d=>d.iso2)).size;
  const svg = d3.select('#world-map');
  const width=1000,height=560;
  const projection=d3.geoEqualEarth().fitExtent([[14,14],[width-14,height-14]],{type:'Sphere'});
  const path=d3.geoPath(projection);
  const mapLayer=svg.append('g').attr('class','map-layer');
  mapLayer.append('path').datum({type:'Sphere'}).attr('d',path).attr('class','world-sphere');
  const countries=mapLayer.append('g').selectAll('path').data(data.world.features).join('path').attr('d',path).attr('class','country');
  mapLayer.append('path').datum(d3.geoGraticule10()).attr('d',path).attr('class','graticule');
  const pinLayer=mapLayer.append('g');
  let transform=d3.zoomIdentity;
  const tip=$('#map-tip');
  const zoom=d3.zoom().scaleExtent([1,8]).extent([[0,0],[width,height]]).translateExtent([[-150,-150],[width+150,height+150]]).filter(event=>event.type!=='wheel' && !event.button).on('zoom',event=>{transform=event.transform;mapLayer.attr('transform',transform);sizePins();hideTip();});
  svg.call(zoom).on('dblclick.zoom',null);
  function sizePins(){const pixelScale=width/Math.max(1,svg.node().getBoundingClientRect().width);pinLayer.selectAll('.pin').attr('transform',d=>{const p=projection(d.coordinates);return `translate(${p[0]},${p[1]}) scale(${1/transform.k})`;});pinLayer.selectAll('.pin-dot').attr('r',4.5*pixelScale).style('stroke-width',1.3*pixelScale);pinLayer.selectAll('.pin-ring').attr('r',8*pixelScale).style('stroke-width',pixelScale);pinLayer.selectAll('.pin-hit').attr('r',(matchMedia('(pointer:coarse)').matches?22:17)*pixelScale);}
  function hideTip(){tip.hidden=true;}
  function showTip(event,d){tip.textContent=`${d.name} · ${d.city}`;tip.hidden=false;const wrap=$('.map-wrap').getBoundingClientRect();const p=event.currentTarget.getBoundingClientRect();const x=Math.min(Math.max(8,p.x-wrap.x),Math.max(8,wrap.width-240));const y=Math.max(8,p.y-wrap.y-42);tip.style.left=`${x}px`;tip.style.top=`${y}px`;}
  function countryCode(d){const p=d.properties;return p.ISO_A2_EH||p.iso2||p.ISO_A2||p.iso_a2;}
  function draw(){
    const codes=new Set(filtered.map(d=>d.iso2));
    countries.classed('mapped',d=>codes.has(countryCode(d)));
    const pins=pinLayer.selectAll('.pin').data(filtered.filter(d=>d.coordinates),d=>d.id).join(enter=>{
      const g=enter.append('g').attr('class','pin').attr('role','button').attr('tabindex',0);
      g.append('circle').attr('class','pin-hit').attr('r',17);
      g.append('circle').attr('class','pin-ring').attr('r',10);
      g.append('circle').attr('class','pin-dot').attr('r',5);
      g.append('title');return g;
    });
    pins.attr('aria-label',d=>`${d.name}, ${d.city}, ${d.country}. View sources.`).attr('aria-pressed',d=>String(d.id===selected)).classed('selected',d=>d.id===selected)
      .on('click',(event,d)=>{event.stopPropagation();choose(d.id,false);hideTip();})
      .on('keydown',(event,d)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(d.id,true);}})
      .on('pointerenter',showTip).on('pointerleave',hideTip).on('blur',hideTip);
    pins.select('title').text(d=>`${d.name} — ${d.city}, ${d.country}`);
    pins.select('.pin-ring').attr('display',d=>d.id===selected?null:'none');
    sizePins();
    const n=filtered.length,p=filtered.filter(d=>d.coordinates).length,c=codes.size;
    $('#result-count').textContent=`${n} ${n===1?'practice':'practices'} · ${c} ${c===1?'country':'countries'}${p<n?` · ${n-p} without a map point`:''}`;
    $('#directory').innerHTML=n?filtered.map(d=>`<button type="button" class="practice-card" data-id="${esc(d.id)}" aria-pressed="${d.id===selected}"><span><span class="card-name">${esc(d.name)}</span><span class="card-place">${esc(d.city)} · ${esc(d.country)}</span></span><span class="card-arrow" aria-hidden="true">${extIcon}</span></button>`).join(''):'<p class="empty-results">No matching practices in this first sample. Try another name or clear the filters.</p>';
    $('#directory').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.id,true)));
    detail();
  }
  function detail(){
    const d=filtered.find(x=>x.id===selected);
    if(!d){$('#practice-detail').innerHTML='<div class="empty-detail"><h2>No matching record.</h2><p>The source sample is intentionally small. Clear the filters to return to the full atlas.</p></div>';return;}
    const people=d.associated_architects||[];
    const notes=d.notes||[];
    $('#practice-detail').innerHTML=`<div class="detail-tag"><span>Selected practice</span><span>${esc(d.region)}</span></div><h2 id="detail-title" tabindex="-1">${esc(d.name)}</h2><p class="place">${esc(d.city)}, ${esc(d.country)}</p><p class="precision">${d.locality?`${esc(d.locality)} · `:''}${d.coordinates?'Approximate city point':'Map point not established'}</p><a class="site-link" href="${safeURL(d.website)}" target="_blank" rel="noopener">Visit the practice ${extIcon}</a><p class="source-label">Primary evidence · 15 Nov 2026</p><ul class="source-links">${d.sources.map((s,i)=>`<li><a href="${safeURL(s.url)}" target="_blank" rel="noopener">${esc(s.title||`Official source ${i+1}`)} ${extIcon}</a><span>${esc(s.evidence||'Public practice source.')}</span></li>`).join('')}</ul>${people.length?`<details><summary>${people.length} sourced ${people.length===1?'name':'names'} associated with this practice</summary><ul class="people">${people.map(p=>`<li><a href="${safeURL(p.source_url||d.website)}" target="_blank" rel="noopener">${esc(p.name)}</a><br><span>${esc(p.relationship||'Association reported by the practice')}</span></li>`).join('')}</ul><p class="small">Partial relationships, not a staff list or current registration check.</p></details>`:''}<details><summary>Location and source notes</summary><ul class="detail-notes"><li>This record shows one selected public office city. It does not describe every office.</li><li>License and registration status: not assessed.</li>${notes.map(n=>`<li>${esc(n)}</li>`).join('')}<li>${d.coordinate_source?`City point: <a href="${safeURL(d.coordinate_source)}" target="_blank" rel="noopener">${esc(d.coordinate_provider)} ${extIcon}</a>. ${esc(d.coordinate_precision)} precision.`:'No verified geographic point has been assigned.'}</li></ul></details>`;
  }
  function choose(id,focus){selected=id;draw();if(focus){$('#detail-title')?.focus({preventScroll:true});$('.inspector').scrollIntoView({block:'nearest',behavior:'auto'});}}
  function applyFilters(fit=false){const q=fold($('#search').value.trim());filtered=records.filter(d=>(region==='All'||d.region===region)&&fold([d.name,d.city,d.country,...(d.associated_architects||[]).map(p=>p.name)].join(' ')).includes(q));if(!filtered.some(d=>d.id===selected))selected=filtered[0]?.id;draw();if(fit)fitResults();}
  function fitResults(){const points=filtered.filter(d=>d.coordinates).map(d=>projection(d.coordinates));if(!points.length||filtered.length===records.length){svg.call(zoom.transform,d3.zoomIdentity);return;}const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);const k=Math.min(5,.72/Math.max((x1-x0)/width,(y1-y0)/height,.14));svg.call(zoom.transform,d3.zoomIdentity.translate(width/2-k*(x0+x1)/2,height/2-k*(y0+y1)/2).scale(k));}
  $('#search').addEventListener('input',()=>applyFilters(false));
  document.querySelectorAll('[data-region]').forEach(b=>b.addEventListener('click',()=>{region=b.dataset.region;document.querySelectorAll('[data-region]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));applyFilters(true);}));
  $('#clear-filters').addEventListener('click',()=>{region='All';$('#search').value='';document.querySelectorAll('[data-region]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.region==='All')));applyFilters(true);});
  $('#zoom-in').addEventListener('click',()=>svg.call(zoom.scaleBy,1.5));$('#zoom-out').addEventListener('click',()=>svg.call(zoom.scaleBy,1/1.5));$('#reset-map').addEventListener('click',()=>svg.call(zoom.transform,d3.zoomIdentity));$('#fit-map').addEventListener('click',fitResults);
  $('#registry-list').innerHTML=data.registry_sources.map(r=>`<article class="registry-item"><div><strong>${esc(r.jurisdiction)}</strong>${esc(r.authority)}</div><div>${r.entry_urls.map((u,i)=>`<a href="${safeURL(u)}" target="_blank" rel="noopener">${i?'Additional entry':'Official register'} ${extIcon}</a>`).join('')}<p>${esc(r.access_notes)}</p></div></article>`).join('');
  draw();
  new ResizeObserver(sizePins).observe(svg.node());
})();
