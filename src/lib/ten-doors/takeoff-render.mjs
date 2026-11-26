/** Original canvas illustration. No image, font or network resources. */
export const PAD_COLORS = ['#efaa96','#edc96b','#a5d4b5','#91c9d8','#b3b9e5','#e8b4c8','#a7d7cc','#c7c4a3'];
const SKIES = [
  ['#f3c3a7','#c2bfdf','#52769e'], ['#d6e6d3','#b6d5e1','#477d9a'],
  ['#f5d597','#edc2b0','#627d9d'], ['#d0d6ef','#b7c7e0','#456e98'],
  ['#e9b9cb','#bab5d9','#4d6594'],
];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function flightPoint(p, lane, w, h) {
  const q = p < .18 ? .18 * (p/.18)**1.65 : .18 + .82 * (1-(1-(p-.18)/.82)**1.08);
  // Higher notes climb higher; small runway offsets keep a chord's planes
  // individually legible instead of drawing several jets on top of one another.
  const a={x:w*(.90-lane*.010),y:h*(.84-lane*.004)},b={x:w*(.74-lane*.005),y:h*.84},c={x:w*.43,y:h*(.34-lane*.035)},d={x:-w*.10,y:h*(.40-lane*.035)};
  const t=clamp(q,0,1),u=1-t;
  return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y,
    angle:Math.atan2(3*u*u*(b.y-a.y)+6*u*t*(c.y-b.y)+3*t*t*(d.y-c.y),3*u*u*(b.x-a.x)+6*u*t*(c.x-b.x)+3*t*t*(d.x-c.x))};
}
function plane(g,x,y,angle,color,scale,alpha=1) {
  g.save();g.translate(x,y);g.rotate(angle);g.scale(scale,scale);g.globalAlpha=alpha;
  g.shadowColor='#283b5c38';g.shadowBlur=6;g.shadowOffsetY=4;
  // Rounded enamel wings and tail, authored for this instrument.
  g.fillStyle=color;g.beginPath();g.moveTo(6,-4);g.quadraticCurveTo(-4,-9,-13,-24);g.quadraticCurveTo(-18,-27,-17,-20);g.lineTo(-10,-2);g.closePath();g.fill();
  g.beginPath();g.moveTo(7,4);g.quadraticCurveTo(-4,9,-13,24);g.quadraticCurveTo(-18,27,-17,20);g.lineTo(-10,2);g.closePath();g.fill();
  g.beginPath();g.moveTo(-19,-3);g.lineTo(-29,-14);g.quadraticCurveTo(-33,-16,-31,-10);g.lineTo(-26,2);g.closePath();g.fill();
  const body=g.createLinearGradient(0,-10,0,11);body.addColorStop(0,'#fffefa');body.addColorStop(.47,'#f4f7fb');body.addColorStop(1,'#a7b7cf');g.fillStyle=body;
  g.beginPath();g.moveTo(-29,-4);g.quadraticCurveTo(-7,-10,18,-7);g.quadraticCurveTo(34,-5,34,0);g.quadraticCurveTo(32,7,17,8);g.quadraticCurveTo(-9,10,-29,4);g.quadraticCurveTo(-34,0,-29,-4);g.fill();
  g.shadowBlur=0;g.strokeStyle='#ffffffdb';g.lineWidth=1.5;g.beginPath();g.moveTo(-24,-4);g.quadraticCurveTo(2,-8,24,-4);g.stroke();
  g.fillStyle='#547e9f';g.beginPath();g.ellipse(22,-1,5,2.7,.22,0,Math.PI*2);g.fill();
  g.fillStyle='#91b3cb';for(let i=0;i<3;i++){g.beginPath();g.ellipse(9-i*7,-1,1.6,2.1,0,0,Math.PI*2);g.fill();}
  g.strokeStyle='#ffffff8c';g.lineWidth=1;g.beginPath();g.moveTo(-10,6);g.lineTo(-14,21);g.stroke();g.restore();
}

export function createTakeoffRenderer(canvas) {
  const win=canvas.ownerDocument.defaultView;
  let g=null,w=1,h=1;
  try {g=canvas.getContext('2d');}catch{}
  if(!g){canvas.hidden=true;canvas.parentElement.querySelector('.to-scene-fallback').hidden=false;}
  function resize(){
    if(!g)return;
    const rect=canvas.getBoundingClientRect();const nw=Math.max(1,rect.width),nh=Math.max(1,rect.height);
    if(nw===w&&nh===h)return;
    w=nw;h=nh;const dpr=Math.min(win.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);g.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  function draw(state,{time=0,still=false,bursts=[]}={}){
    if(!g)return;resize();
    const sky=SKIES[state.planIndex];const gradient=g.createLinearGradient(0,0,0,h);gradient.addColorStop(0,sky[0]);gradient.addColorStop(.65,sky[1]);gradient.addColorStop(1,sky[2]);g.fillStyle=gradient;g.fillRect(0,0,w,h);
    // A warm sun, distant haze, clouds and the Pacific coast.
    g.fillStyle='#fff3cfb0';g.beginPath();g.arc(w*.76,h*.27,Math.min(w,h)*.12,0,Math.PI*2);g.fill();
    for(let i=0;i<4;i++){
      const drift=still?0:Math.sin(time/14000+i)*w*.015;const x=w*(.10+i*.26)+drift,y=h*(.12+(i%2)*.17);const s=Math.max(9,w*.025);
      g.fillStyle='#fffaf04d';g.beginPath();g.ellipse(x,y,s*2.5,s*.6,0,0,Math.PI*2);g.ellipse(x+s*.6,y-s*.45,s*1.4,s*.8,0,0,Math.PI*2);g.fill();
    }
    g.fillStyle='#5f81a45c';g.beginPath();g.moveTo(0,h*.57);g.quadraticCurveTo(w*.3,h*.51,w*.52,h*.64);g.lineTo(w,h*.62);g.lineTo(w,h);g.lineTo(0,h);g.fill();
    const sea=g.createLinearGradient(0,h*.57,0,h);sea.addColorStop(0,sky[2]);sea.addColorStop(1,'#263f6a');g.fillStyle=sea;g.beginPath();g.moveTo(0,h*.58);g.quadraticCurveTo(w*.25,h*.57,w*.55,h*.72);g.lineTo(w*.82,h);g.lineTo(0,h);g.fill();
    for(let i=0;i<9;i++){g.fillStyle='#dceef225';g.fillRect((i*47)%Math.max(1,w*.52),h*(.64+(i%5)*.055),12+(i%3)*13,1.2);}
    g.fillStyle='#a7ae9a';g.beginPath();g.moveTo(w*.32,h);g.quadraticCurveTo(w*.48,h*.77,w*.68,h*.76);g.quadraticCurveTo(w*.84,h*.71,w,h*.77);g.lineTo(w,h);g.fill();
    g.fillStyle='#d0c4a2';g.beginPath();g.moveTo(w*.4,h);g.quadraticCurveTo(w*.5,h*.82,w*.7,h*.83);g.lineTo(w,h*.82);g.lineTo(w,h);g.fill();
    // Tiny original town blocks and a short departure strip.
    for(let i=0;i<15;i++){const x=w*(.53+(i%8)*.062),y=h*(.78+Math.floor(i/8)*.055);g.fillStyle=i%3?'#e8e1cb':'#6d837e';g.fillRect(x,y,5+(i%3)*2,4+(i%4)*2);}
    g.fillStyle='#3e4b63';g.fillRect(w*.65,h*.86,w*.4,h*.055);
    g.strokeStyle='#eee7c5aa';g.lineWidth=1.4;g.setLineDash([6,8]);g.beginPath();g.moveTo(w*.7,h*.887);g.lineTo(w,h*.887);g.stroke();g.setLineDash([]);
    for(let i=0;i<7;i++){g.fillStyle='#ffe5a1';g.beginPath();g.arc(w*(.68+i*.05),h*.925,1.3,0,Math.PI*2);g.fill();}
    if(state.mode==='guide'){
      const targets=[0,1,2];
      for(const i of targets){const lane=state.goalLanes?.[i];if(lane===undefined)continue;const clear=state.arrived.includes(lane);const x=w*(.12+i*.15),y=h*(.31-i*.045),r=Math.min(13,w*.025);
        g.strokeStyle=clear?'#fff4c5':'#fff9ef8c';g.lineWidth=clear?2.5:1.5;g.fillStyle=clear?'#fff4c555':'#fffaf015';g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();g.stroke();g.fillStyle=clear?'#fff9d9':'#fffdf3';g.font=`700 ${Math.max(8,r*.8)}px ui-monospace,monospace`;g.textAlign='center';g.textBaseline='middle';g.fillText(clear?'✓':String(lane+1),x,y+.5);
      }
    }
    if(!still){
      for(const p of state.planes){
        const progress=p.ageMs/p.durationMs;const color=PAD_COLORS[p.lane];
        for(let i=0;i<12;i++){const a=clamp(progress-.19+i*.016,0,1),b=clamp(a+.016,0,progress);if(b<=a)continue;const pa=flightPoint(a,p.lane,w,h),pb=flightPoint(b,p.lane,w,h);g.globalAlpha=(i/12)*.5;g.strokeStyle=color;g.lineWidth=1+i*.23;g.lineCap='round';g.beginPath();g.moveTo(pa.x,pa.y);g.lineTo(pb.x,pb.y);g.stroke();}
        g.globalAlpha=1;
        const pos=flightPoint(progress,p.lane,w,h);const fade=progress>.88?(1-progress)/.12:1;
        if(progress<.2){g.fillStyle='#1a284128';g.beginPath();g.ellipse(pos.x,h*.88,22,3.2,0,0,Math.PI*2);g.fill();}
        plane(g,pos.x,pos.y,pos.angle,color,w<500?.74:1,fade);
      }
      for(const burst of bursts){const age=(time-burst.at)/850;if(age<0||age>1)continue;for(let i=0;i<7;i++){const angle=i*Math.PI*2/7;const distance=8+age*28;const x=w*.12+Math.cos(angle)*distance,y=h*.24+Math.sin(angle)*distance;g.globalAlpha=1-age;g.fillStyle=PAD_COLORS[burst.lane];g.save();g.translate(x,y);g.rotate(angle+age);g.fillRect(-2,-2,4,4);g.restore();}g.globalAlpha=1;}
    }
    if(!state.planes.length){plane(g,w*.89,h*.835,Math.PI,PAD_COLORS[state.planIndex],w<500?.68:.87,.9);}
  }
  return {available:Boolean(g),draw,resize};
}
