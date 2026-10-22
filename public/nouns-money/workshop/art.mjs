import {normalize,THEMES,nounSvg,escapeXml as x} from './model.mjs';

function rosette(cx,cy,radius,ink,phase=0){
  let paths='';
  for(let ring=0;ring<8;ring++){
    const pts=[];
    for(let i=0;i<=360;i++){
      const a=i*Math.PI/180;
      const r=radius-ring*4+(7+ring*.5)*Math.cos(20*a+phase);
      pts.push(`${(cx+Math.cos(a)*r).toFixed(2)},${(cy+Math.sin(a)*r).toFixed(2)}`);
    }
    paths+=`<path d="M${pts.join('L')}Z" fill="none" stroke="${ink}" stroke-width="1.15"/>`;
  }return paths;
}
function waves(x0,y0,width,count,ink){
  return Array.from({length:count},(_,i)=>`<path d="M ${x0} ${y0+i*8} ${Array.from({length:8},(_,j)=>`q ${width/32} ${-12-i*.2} ${width/16} 0 t ${width/16} 0`).join(' ')}" fill="none" stroke="${ink}" stroke-width="1" opacity=".4"/>`).join('');
}
function landscape(theme,ink,paper,accent){
  if(theme==='pacific')return `<circle cx="900" cy="335" r="128" fill="${accent}" opacity=".1"/>${Array.from({length:17},(_,i)=>`<path d="M${730+i*20} 453V${290-Math.sin(i/16*Math.PI)*70}" stroke="${accent}" stroke-width="2"/>`).join('')}<path d="M350 470 Q600 340 800 470T1450 450" fill="${paper}" stroke="${ink}" stroke-width="3"/>${waves(350,485,1100,13,ink)}<path d="M1150 451v-119l-70 100h70l60-18z" fill="${paper}" stroke="${accent}" stroke-width="4"/><path d="M1080 461h145l-28 24h-94z" fill="${accent}"/>`;
  if(theme==='workshop')return `<g fill="${paper}" stroke="${accent}" stroke-width="3"><path d="M460 550V390l150-90v90l150-90v90l150-90v250z"/><path d="M950 550V350h80v-130h40v130h90v-95h40v95h150v200z"/></g>${Array.from({length:9},(_,i)=>`<path d="M${480+i*44} 430v85" stroke="${accent}" opacity=".4"/>`).join('')}${Array.from({length:6},(_,i)=>`<path d="M${975+i*60} 390v120" stroke="${ink}" opacity=".4"/>`).join('')}<path d="M400 570h1000M440 580h1320M490 590h1150" stroke="${ink}" opacity=".4"/>${rosette(1200,250,62,accent)}<path d="M1047 200q-25-25 0-50m150 85q-25-25 0-50" fill="none" stroke="${ink}" stroke-width="2"/>`;
  return `<g fill="${paper}" stroke="${accent}" stroke-width="3"><path d="M485 330q205-80 415 30q210-110 415-30v225q-205-80-415 15q-210-95-415-15z"/><path d="M900 360v210"/></g>${Array.from({length:14},(_,i)=>`<path d="M520 ${365+i*12}q165-57 340 15m80 0q175-72 340-15" fill="none" stroke="${ink}" stroke-width="1.3" opacity=".6"/>`).join('')}<path d="M478 557l-25 35q245-66 447 12q210-78 448-12l-25-35" fill="none" stroke="${accent}" stroke-width="2"/>${rosette(900,260,46,accent)}<path d="M520 286v-45l45-30l45 30v25m510-5v-45l45-30l45 30v60" fill="none" stroke="${ink}" stroke-width="2"/>`;
}
export function compose(input,data,side='front',namespace='note'){
  const d=normalize(input),t=THEMES[d.theme],{paper,ink,accent}=d.colors;
  if(!['front','back'].includes(side))throw new Error('Unknown note face.');
  const id=String(namespace).replace(/[^a-z0-9_-]/gi,'')+'-'+side;
  const specimen=input.specimen?.id||'SPECIMEN';
  const no=String(d.edition.number).padStart(2,'0');
  const label=x(d.edition.label);
  const seed=Object.values(d.asset.seed).join(' / ');
  let art;
  if(side==='front'){
    art=`<g transform="translate(10 0)"><ellipse cx="490" cy="420" rx="270" ry="265" fill="${paper}" stroke="${accent}" stroke-width="3"/>${Array.from({length:14},(_,i)=>`<ellipse cx="490" cy="420" rx="${257-i*4}" ry="${252-i*4}" fill="none" stroke="${accent}" stroke-width=".8" opacity="${.85-i*.025}"/>`).join('')}<g clip-path="url(#${id}-cameo)">${Array.from({length:40},(_,i)=>`<path d="M215 ${190+i*12}h550" stroke="${accent}" opacity=".14"/>`).join('')}</g><g transform="translate(298 218) scale(1.2)">${nounSvg(d.asset.seed,data)}</g><text x="490" y="708" class="mono" text-anchor="middle" font-size="13" letter-spacing="3">ORIGINAL NOUNS · NEW POSSIBILITIES</text></g>
    <text x="892" y="210" class="mono" font-size="15" letter-spacing="3">${x(t.eyebrow)}</text>
    ${t.lines.map((line,i)=>`<text x="885" y="${320+i*118}" font-family="Georgia,serif" font-weight="bold" font-size="118" letter-spacing="-4">${line}</text>`).join('')}
    <path d="M895 603h630" stroke="${accent}" stroke-width="2"/><text x="895" y="645" class="mono" font-size="16" letter-spacing="3">${x(t.name.toUpperCase())}</text><text x="895" y="680" class="mono" font-size="13" letter-spacing="2">${label} / STUDY ${no}</text>
    ${rosette(1610,610,63,accent)}<text x="1610" y="623" font-family="Georgia,serif" font-size="40" text-anchor="middle">${no}</text>`;
  }else{
    art=`${waves(100,200,1600,9,accent)}${landscape(d.theme,ink,paper,accent)}<text x="900" y="188" class="mono" text-anchor="middle" font-size="16" letter-spacing="4">${x(t.name.toUpperCase())} / REVERSE STUDY</text><rect x="450" y="595" width="900" height="70" fill="${paper}"/><text x="900" y="646" font-family="Georgia,serif" font-weight="bold" font-size="52" text-anchor="middle">${x(t.back.join(' '))}</text><text x="900" y="691" font-family="Georgia,serif" font-style="italic" font-size="24" text-anchor="middle">${x(t.motto)}</text>${rosette(205,448,85,accent)}${rosette(1595,448,85,accent)}<text x="205" y="468" font-family="Georgia,serif" font-size="62" text-anchor="middle">${no}</text><text x="1595" y="468" font-family="Georgia,serif" font-size="62" text-anchor="middle">${t.mark}</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180mm" height="84mm" viewBox="0 0 1800 840" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${x(t.name)} — ${side} of collectible art specimen</title><desc id="${id}-desc">Original Nouns pixel artwork, ${label}, study ${no}. Collectible art, no cash value. ${x(specimen)} is a repeatable design fingerprint, not a registered serial.</desc><metadata>${x(JSON.stringify(input))}</metadata><defs><pattern id="${id}-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8L8 0" stroke="${accent}" stroke-width=".6" opacity=".14"/></pattern><clipPath id="${id}-cameo"><ellipse cx="490" cy="430" rx="216" ry="222"/></clipPath><style>.mono{font-family:'Courier New',monospace}</style></defs><rect width="1800" height="840" fill="${paper}"/><g fill="${ink}"><rect x="20" y="20" width="1760" height="800" fill="none" stroke="${ink}" stroke-width="2"/><rect x="30" y="30" width="1740" height="780" fill="none" stroke="${accent}" stroke-width=".8"/><rect x="45" y="45" width="1710" height="750" fill="url(#${id}-hatch)"/><rect x="60" y="60" width="1680" height="720" fill="${paper}" stroke="${accent}" stroke-width="1.5"/>
    ${[0,1,2,3].map((n)=>`<g transform="translate(${n%2?1740:60} ${n>1?780:60}) rotate(${n===0?0:n===1?90:n===2?270:180})"><path d="M0 55V0h55M8 50V8h42M16 44V16h28" fill="none" stroke="${accent}" stroke-width="2"/></g>`).join('')}
    <path d="M100 134H1700M100 727H1700" stroke="${accent}" stroke-width="1.5"/>
    <text x="105" y="111" class="mono" font-size="16" letter-spacing="3">NMW / PAPER STUDIES</text><text x="900" y="116" font-family="Georgia,serif" font-size="45" font-weight="bold" text-anchor="middle" letter-spacing="10">NOUNS MONEY</text><text x="1695" y="111" class="mono" text-anchor="end" font-size="16" letter-spacing="3">${x(t.place)}</text>
    ${art}
    <text x="105" y="759" class="mono" font-size="13" letter-spacing="1.8">COLLECTIBLE ART · NO CASH VALUE</text><text x="900" y="759" class="mono" text-anchor="middle" font-size="13" letter-spacing="1.5">${x(specimen)} · ${side.toUpperCase()}</text><text x="1695" y="759" class="mono" text-anchor="end" font-size="12" letter-spacing="1">CC0 NOUNS / ${seed}</text>
    </g></svg>`;
}
