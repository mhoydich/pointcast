// Vessels and places are original drawings. All moving light is supplied by item 24.
const path = (d, fill, stroke = 'none', width = 1) =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
const rect = (x,y,w,h,fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const ellipse = (cx,cy,rx,ry,fill) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
const line = (d, stroke, width) => path(d, 'none', stroke, width);

function trees(points, fill) {
  return points.map(([x, y, h]) => {
    const b = y+h;
    return path(`M${x} ${y} l${-h*.19} ${h*.58} h${h*.08} L${x-h*.26} ${b} H${x+h*.26} L${x+h*.11} ${y+h*.58} h${h*.08}Z`,fill);
  }).join('');
}

function campfire() {
  const shore=path('M0 123 54 105 117 120 173 97 221 111 279 88 360 122V224H0Z','#30413c')+
    path('M0 146 55 136 105 145 170 131 243 149 315 129 360 133V224H0Z','#23322f');
  const forest=trees([[0,35,107],[21,55,76],[43,70,60],[61,91,45],[294,75,62],[319,51,91],[345,23,117],[366,3,151]],'#152c28');
  const ground=path('M0 172Q70 147 137 159T260 160Q321 145 360 154V224H0Z','#18221e');
  const logs=path('M142 172l67 12-5 5-66-12Z','#a27656','#c4976a')+
    path('M140 183l62-18 8 4-62 19Z','#696147','#b69068')+
    line('M146 185l55-15m-40 8 35 7','#322d23');
  return shore+forest+ground+logs;
}
function hearth() {
  const mantel=rect(40,42,280,139,'#714b38')+rect(46,48,268,135,'url(#brick)')+
    path('M77 178V112C77 66 119 55 180 55S283 66 283 112V178Z','#302723','#ab805d',4)+
    path('M83 178V114C83 75 118 63 180 63S277 75 277 114V178Z','#272422')+
    rect(30,33,300,10,'#bd9975')+rect(40,44,280,4,'#604735')+
    path('M35 177H325L339 190H21Z','#906e53')+rect(21,190,318,6,'#5f4839');
  return rect(0,0,360,224,'url(#panels)')+mantel+
    line('M129 170h101m-89-8h77','#79664d',5)+line('M140 173v-12m78 12v-12','#2b241e',3);
}
function forge() {
  const hood=path('M147 0h66v21l42 24v8H105v-8l42-24Z','#544b40','#837260')+
    line('M113 45h134M153 5v15m54-15v15','#8d7b62')+rect(110,53,140,4,'#282520');
  return rect(0,0,360,224,'url(#forge-wall)')+hood+
    line('M45 39v64m-7-1q7 11 14 0m-7-3v-5M307 29v43m-5 1 5 12 5-12','#97856a',2)+
    path('M107 165h147l-9 16H119Z','#8e7860','#b19470')+rect(119,182,126,8,'#493f35')+
    path('M133 191h14l-5 33h-10Zm82 0h14l1 33h-10Z','#51493a')+
    path('M18 181h59l-5 7-14 4 1 5H41l2-7-9-1Z','#97958a')+rect(36,198,32,26,'#54483a');
}
function candle() {
  return path('M49 177V98Q49 40 110 21Q180 1 250 21Q311 40 311 98V177','#27293a','#494650')+
    path('M64 177V99Q65 50 117 34Q180 14 243 34Q295 50 296 99V177','#232536','#444353')+
    rect(0,175,360,49,'#37343a')+line('M0 177h360','#73635f')+
    ellipse(180,179,33,6,'#282323')+ellipse(180,177,26,3,'#9f8b69')+
    path('M171 175v-46q3-3 10-1t8 0v47q-8 3-18 0Z','#d6bf8f')+
    line('M175 134v14m9-17v6','#a58c63',2)+line('M180 129v-5','#3c362f',2);
}
function lantern() {
  return path('M0 149 45 107 91 142 145 99 190 133 264 83 360 137V224H0Z','#34474a')+
    path('M0 174 82 141 127 153 226 135 273 156 360 133V224H0Z','#233738')+
    path('M0 199q121-37 190-14t170-11v50H0Z','#192a2a')+
    line('M156 89v-32a24 24 0 0 1 48 0v32','#c7ae82',2.5)+
    path('M155 91q5-12 16-15h18q13 5 17 15l8 5h-68Z','#847153','#c3aa80')+
    path('M150 100h60l-4 58q-23 10-52 0Z','#454138','#a89678',2)+
    line('M155 102l7 53m43-53-6 53','#e0cba1',1.5)+
    path('M152 157q26 8 56 0l6 13q-34 8-67 0Z','#776247','#b59b74');
}
function pilot() {
  return rect(20,32,320,160,'#283644')+path('M29 41h302v142H29Z','#202d38','#53606c')+
    line('M43 56h89m-89 4h89m98 103h85','#48545f')+
    [45,315].map(x=>[48,176].map(y=>ellipse(x,y,2.1,2.1,'#9b9b94')+line(`M${x-1} ${y+1}l2-2`,'#4d5763')).join('')).join('')+
    path('M21 150h144q7 0 7-7v-10h16v19q0 13-15 13H21Z','#657077','#939898')+
    rect(170,127,20,7,'#9a9281')+line('M173 129h14','#484b4d');
}
export const drawings = [campfire,hearth,forge,candle,lantern,pilot];

export const materials = `<defs>
  <pattern id="brick" width="40" height="20" patternUnits="userSpaceOnUse"><path d="M0 0h40M0 10h40M11 0v10m20 0v10" fill="none" stroke="#996c4c" stroke-width="1.5"/></pattern>
  <pattern id="panels" width="67" height="224" patternUnits="userSpaceOnUse"><path d="M2 0v224m3-224v224" stroke="#574839" fill="none"/></pattern>
  <pattern id="forge-wall" width="48" height="22" patternUnits="userSpaceOnUse"><path d="M0 0h48M0 11h48M4 0v11m24 0v11" fill="none" stroke="#414340"/></pattern>
</defs>`;
