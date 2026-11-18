import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TAU = Math.PI * 2;
const RAD = 0.65;
const STEP = 1.33;

function offsets(count) {
  const points = [{ x: 0, z: 0 }];
  for (let radius = 1; points.length < count; radius++) {
    let q = radius, r = -radius;
    for (const [dq, dr] of [[0,1],[-1,1],[-1,0],[0,-1],[1,-1],[1,0]]) {
      for (let i = 0; i < radius && points.length < count; i++) {
        points.push({ x: (q + r * .5) * STEP, z: r * .866 * STEP });
        q += dq;
        r += dr;
      }
    }
  }
  const center = points.reduce((sum,p) => ({x:sum.x+p.x,z:sum.z+p.z}),{x:0,z:0});
  return points.map((p,i) => ({
    x: p.x - center.x/count + .055*Math.sin(i*4.7),
    z: p.z - center.z/count + .055*Math.sin(i*3.1)
  }));
}

function arrange(authors, messages) {
  const buckets = new Map(authors.map(a => [a.key, {author:a, messages:[]}]));
  messages.forEach(m => buckets.get(m.authorKey)?.messages.push(m));
  const islands = [...buckets.values()].filter(g => g.messages.length);
  for (const island of islands) {
    island.points = offsets(island.messages.length);
    island.radius = Math.max(...island.points.map(p => Math.hypot(p.x,p.z))) + RAD + .44;
  }
  const placed = [];
  for (const island of [...islands].sort((a,b) => b.radius-a.radius)) {
    let bestScore = Infinity;
    let best = {x:0,z:0};
    for (const anchor of placed) {
      const distance = island.radius + anchor.radius + .46;
      for (let k = 0; k < 40; k++) {
        const angle = k * TAU / 40 + .31;
        const x = anchor.x + distance*Math.cos(angle);
        const z = anchor.z + distance*Math.sin(angle);
        if (placed.some(p => Math.hypot(x-p.x,z-p.z) < p.radius+island.radius+.43)) continue;
        const score = x*x*.70 + z*z;
        if (score < bestScore) { bestScore = score; best = {x,z}; }
      }
    }
    Object.assign(island,best);
    placed.push(island);
  }
  return islands;
}

function outline(points) {
  const samples = points.flatMap(p => Array.from({length:14},(_,i) => ({
    x: p.x + Math.cos(i*TAU/14) * (RAD+.31),
    z: p.z + Math.sin(i*TAU/14) * (RAD+.31)
  }))).sort((a,b) => a.x-b.x || a.z-b.z);
  function half(ordered) {
    const hull = [];
    for (const p of ordered) {
      while (hull.length>1) {
        const a=hull.at(-2), b=hull.at(-1);
        if ((b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x)>0) break;
        hull.pop();
      }
      hull.push(p);
    }
    return hull.slice(0,-1);
  }
  return half(samples).concat(half(samples.slice().reverse()));
}

const vertex = `
varying vec3 vN;
varying vec3 vEye;
varying vec3 vLocal;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  vN = normalize(normalMatrix * normal);
  vEye = -mv.xyz;
  vLocal = position;
  gl_Position = projectionMatrix * mv;
}`;

const surface = `
varying vec3 vN;
varying vec3 vEye;
varying vec3 vLocal;
uniform float uLevel;
uniform vec3 uTint;
void main() {
  vec3 softN = normalize(vN);
  vec3 hardN = normalize(cross(dFdx(-vEye),dFdy(-vEye)));
  vec3 n = normalize(mix(softN,hardN,.68));
  vec3 light = normalize(vec3(-.46,.81,.55));
  vec3 eye = normalize(vEye);
  float lit = max(dot(n, light),0.);
  float facing = clamp(dot(softN,eye),0.,1.);
  float rim = pow(1.-facing,2.05);
  float vein = sin(11.*vLocal.x + 4.*sin(5.*vLocal.z) + 6.*vLocal.y) +
               .63*sin(13.*vLocal.z - 2.*vLocal.x + 4.*sin(6.*vLocal.y));
  float seam = exp(-abs(vein)*14.);
  float bloom = .5 + .5*sin(7.*vLocal.x + 2.*sin(4.*vLocal.y) + 8.*vLocal.z);
  float inner = pow(clamp(dot(n,normalize(vec3(.15,.68,-.7)))*.5+.5,0.,1.),2.);
  float glint = pow(max(dot(reflect(-light,n),eye),0.),21.);
  vec3 base = mix(vec3(.003,.024,.020),uTint, .065+.82*pow(lit,1.48));
  base *= .84 + .20*bloom;
  base += vec3(.005,.056,.032)*seam*(.26+lit);
  base += vec3(.016,.17,.091) * inner;
  base += vec3(.20,.73,.42)*rim + vec3(.49,.60,.44)*glint;
  gl_FragColor = vec4(base*uLevel,.95);
  #include <colorspace_fragment>
}`;

function cellForm() {
  const shape = new THREE.IcosahedronGeometry(RAD, 2);
  const p = shape.attributes.position;
  for (let i=0; i<p.count; i++) {
    const x=p.getX(i)/RAD, y=p.getY(i)/RAD, z=p.getZ(i)/RAD;
    const swell=1+.125*Math.sin(3.2*x+1.7*z)*Math.cos(3*y-.7*x)+.077*Math.cos(4*z-2*y);
    p.setXYZ(i,x*swell*RAD,y*swell*RAD*.87,z*swell*RAD);
  }
  shape.computeBoundingSphere();
  return shape;
}

function contactTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d');
  const grad = context.createRadialGradient(32,32,4,32,32,32);
  grad.addColorStop(0,'rgba(0,5,4,0.7)');
  grad.addColorStop(.45,'rgba(0,4,3,0.47)');
  grad.addColorStop(1,'rgba(0,3,2,0)');
  context.fillStyle=grad; context.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(canvas);
}

function gridTexture() {
  const tile = document.createElement('canvas');
  tile.width = tile.height = 128;
  const ctx = tile.getContext('2d');
  ctx.fillStyle = '#131b1c';
  ctx.fillRect(0,0,128,128);
  ctx.fillStyle = '#202a2a';
  ctx.fillRect(0,0,1,128); ctx.fillRect(0,0,128,1);
  ctx.fillStyle = '#303937';
  ctx.fillRect(0,0,2,2);
  const texture=new THREE.CanvasTexture(tile);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}

// Geometry describes grouping only. Positions inside an island do not indicate relationships.
export function drawField(canvas, model, selected, onPick) {
  const gl = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
  gl.setPixelRatio(Math.min(window.devicePixelRatio || 1,2));
  gl.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#121a1b');
  const camera = new THREE.OrthographicCamera(-6,6,6,-6,.1,150);
  const controls = new OrbitControls(camera,canvas);
  controls.enablePan = controls.enableDamping = false;
  controls.minZoom=.65; controls.maxZoom=6;
  controls.minPolarAngle=.06; controls.maxPolarAngle=Math.PI*.46;
  controls.rotateSpeed=.8;
  const geometrySet = new Set(), materialSet = new Set(), textureSet = new Set();
  function add(geometry,material,kind=THREE.Mesh) {
    geometrySet.add(geometry); materialSet.add(material);
    const node = new kind(geometry,material); scene.add(node); return node;
  }
  function lacquer(color, opacity=1) {
    return new THREE.MeshBasicMaterial({color, transparent:opacity<1, opacity, side:THREE.DoubleSide});
  }
  const islands = arrange(model.authors || [], model.messages || []);
  const form=cellForm(); geometrySet.add(form);
  const wireframe = new THREE.EdgesGeometry(form, 24);
  geometrySet.add(wireframe);
  const traces = new THREE.LineBasicMaterial({color:'#b4f2cc',transparent:true,opacity:.055,depthWrite:false});
  materialSet.add(traces);
  const cells=[], byId=new Map(), bounds=new THREE.Box3();
  let picked=null;
  const contact=contactTexture(); textureSet.add(contact);
  const shadowMat=new THREE.MeshBasicMaterial({map:contact,transparent:true,depthWrite:false});
  const shadowGeo=new THREE.PlaneGeometry(2.12,2.0);
  materialSet.add(shadowMat); geometrySet.add(shadowGeo);
  for (const [j,group] of islands.entries()) {
    const tint = new THREE.Color().setHSL(.408 + .072*(.5+.5*Math.sin(j*3.3)),.61,.4);
    group.skin = new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:surface,
      uniforms:{uLevel:{value:1}, uTint:{value:tint}}, transparent:true});
    const outlinePoints = outline(group.points);
    const perimeter = outlinePoints.map(p=>new THREE.Vector3(group.x+p.x,.105,group.z+p.z));
    const curve=new THREE.CatmullRomCurve3(perimeter,true);
    const copper = new THREE.MeshBasicMaterial({color:'#b27d56'});
    group.copper=copper;
    add(new THREE.TubeGeometry(curve,Math.max(48,perimeter.length*3),.018,6,true),copper);
    const shape=new THREE.Shape();
    outlinePoints.forEach((p,i)=> i ? shape.lineTo(p.x,-p.z) : shape.moveTo(p.x,-p.z));
    shape.closePath();
    const base = add(new THREE.ShapeGeometry(shape),lacquer('#25332f'));
    base.rotation.x=-Math.PI/2;
    base.position.set(group.x,.075,group.z);
    perimeter.forEach(p=>bounds.expandByPoint(p));
    group.messages.forEach((message,i)=>{
      const p=group.points[i];
      const shadow=add(shadowGeo,shadowMat);
      shadow.rotation.x=-Math.PI/2;
      shadow.position.set(group.x+p.x+.09,.089,group.z+p.z+.09);
      const cell=add(form,group.skin);
      cell.position.set(group.x+p.x,.67+.055*Math.sin(i*2.1),group.z+p.z);
      cell.rotation.y=i*2.4+j*.48;
      cell.rotation.z=.14*Math.sin(i*3.8+j);
      cell.userData.messageId=message.id; cell.userData.island=group;
      const veins=new THREE.LineSegments(wireframe,traces);
      veins.scale.setScalar(1.003);
      cell.add(veins);
      cells.push(cell); byId.set(message.id,cell);
    });
  }
  // Dashed links encode only recorded replies whose endpoints are visible.
  const linkMaterial=new THREE.LineDashedMaterial({color:'#c2d4bf',transparent:true,opacity:.68,dashSize:.11,gapSize:.10});
  materialSet.add(linkMaterial);
  for (const message of model.messages || []) {
    const a=byId.get(message.parent), b=byId.get(message.id);
    if (!a || !b || a===b) continue;
    const mid=a.position.clone().lerp(b.position,.5);
    mid.y+=Math.min(1.85,.7+a.position.distanceTo(b.position)*.10);
    const arc=new THREE.QuadraticBezierCurve3(a.position,mid,b.position);
    add(new THREE.BufferGeometry().setFromPoints(arc.getPoints(40)),linkMaterial,THREE.Line).computeLineDistances();
  }
  const pathGroup = new THREE.Group();
  scene.add(pathGroup);
  const pathMaterial = new THREE.MeshBasicMaterial({ color: '#ffcc83', transparent: true, depthTest: false, depthWrite: false });
  materialSet.add(pathMaterial);
  const mutedSkin = new THREE.ShaderMaterial({
    vertexShader: vertex, fragmentShader: surface,
    uniforms: { uLevel: {value: .055}, uTint: {value: new THREE.Color('#72857a')} },
    transparent: true
  });
  materialSet.add(mutedSkin);
  let trailCells = [], trailBadges = [];
  const pathGeometries = [], badgeMaterials = [], badgeTextures = [];

  function clearPath() {
    pathGroup.clear();
    for (const resources of [pathGeometries, badgeMaterials, badgeTextures]) {
      for (const resource of resources) resource.dispose();
      resources.length = 0;
    }
    trailBadges = [];
  }

  function addStepBadge(cell, index) {
    const stamp = document.createElement('canvas');
    stamp.width = stamp.height = 96;
    const ctx = stamp.getContext('2d');
    ctx.beginPath();
    ctx.arc(48, 48, 40, 0, TAU);
    ctx.fillStyle = '#202820';
    ctx.fill();
    ctx.strokeStyle = '#ffcc83';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#fff0d5';
    ctx.font = 'bold 51px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), 48, 50);
    const texture = new THREE.CanvasTexture(stamp);
    texture.colorSpace = THREE.SRGBColorSpace;
    badgeTextures.push(texture);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
    badgeMaterials.push(material);
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(cell.position);
    sprite.position.y += .76;
    sprite.renderOrder = 5;
    sprite.userData.messageId = cell.userData.messageId;
    pathGroup.add(sprite);
    trailBadges.push(sprite);
  }

  function connectSteps(start, end) {
    const midpoint = start.position.clone().lerp(end.position, .5);
    midpoint.y += Math.min(2.2, .9 + start.position.distanceTo(end.position) * .13);
    const curve = new THREE.QuadraticBezierCurve3(start.position, midpoint, end.position);
    const edge = new THREE.TubeGeometry(curve, 40, .034, 6, false);
    const link = new THREE.Mesh(edge, pathMaterial);
    link.renderOrder = 2;
    pathGroup.add(link);
    pathGeometries.push(edge);
  }

  function setTrail(ids = []) {
    const next = [...new Set(ids || [])].map(id => byId.get(id)).filter(Boolean);
    if (next.length === trailCells.length && next.every((cell, i) => cell === trailCells[i])) return;
    clearPath();
    trailCells = next;
    for (const [index, cell] of trailCells.entries()) {
      if (index) connectSteps(trailCells[index - 1], cell);
      addStepBadge(cell, index);
    }
    for (const cell of cells) {
      const muted = trailCells.length > 0 && !trailCells.includes(cell);
      cell.material = muted ? mutedSkin : cell.userData.island.skin;
      cell.children[0].visible = !muted;
    }
    linkMaterial.opacity = next.length ? .14 : .68;
    setSelected(picked?.userData.messageId);
  }

  const selectMat=new THREE.LineBasicMaterial({color:'#e1ffe9',transparent:true,opacity:.93,depthTest:false});
  const selection=add(new THREE.BufferGeometry().setFromPoints(Array.from({length:65},(_,i)=>
    new THREE.Vector3(Math.cos(i*TAU/64)*RAD*1.21,Math.sin(i*TAU/64)*RAD*1.21,0)
  )),selectMat,THREE.Line);
  selection.renderOrder=3;
  if (bounds.isEmpty()) bounds.set(new THREE.Vector3(-2,0,-2),new THREE.Vector3(2,1,2));
  const center=bounds.getCenter(new THREE.Vector3()); center.y=.55;
  const size=bounds.getSize(new THREE.Vector3());
  const span=Math.max(size.x,size.z,4);
  const texture=gridTexture(); textureSet.add(texture);
  texture.repeat.set(span*1.55,span*1.55);
  const floor=add(new THREE.PlaneGeometry(span*4,span*4),new THREE.MeshBasicMaterial({map:texture}));
  floor.rotation.x=-Math.PI/2;
  floor.position.set(center.x,0,center.z);
  scene.fog=new THREE.FogExp2('#121a1b',.18/span);
  let raf=0, dead=false, lostContext=false;
  function render() {
    if (dead || lostContext || raf) return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      if (selection.visible) selection.quaternion.copy(camera.quaternion);
      if (trailBadges.length) {
        const unitsPerPixel = (camera.top - camera.bottom) / (camera.zoom * Math.max(1, canvas.clientHeight));
        const badgeSize = THREE.MathUtils.clamp(unitsPerPixel * 26, .29, 1.65);
        for (const badge of trailBadges) badge.scale.setScalar(badgeSize);
      }
      gl.render(scene,camera);
    });
  }
  function setSelected(id) {
    picked=byId.get(id);
    selection.visible=!!picked;
    if (picked) selection.position.copy(picked.position);
    for (const group of islands) {
      const on=group===picked?.userData.island;
      if (trailCells.length) {
        const onPath = trailCells.some(cell => cell.userData.island === group);
        group.skin.uniforms.uLevel.value = on ? 1.2 : 1;
        group.copper.color.set(onPath ? '#c99666' : '#414b43');
      } else {
        group.skin.uniforms.uLevel.value = on || !picked ? 1 : .47;
        group.copper.color.set(on ? '#ecab78' : '#906a4f');
      }
    }
    render();
  }
  const azimuth=.17;
  const offset=new THREE.Vector3(Math.sin(azimuth)*.62,.90,Math.cos(azimuth)*.62).normalize();
  const right=new THREE.Vector3(offset.z,0,-offset.x).normalize();
  const up=offset.clone().cross(right);
  const samples=cells.flatMap(cell=>[-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>
    cell.position.clone().sub(center).add(new THREE.Vector3(x*.96,y*.73,z*.96))))));
  const halfX=Math.max(1.4,...samples.map(v=>Math.abs(v.dot(right))));
  const halfY=Math.max(1.4,...samples.map(v=>Math.abs(v.dot(up))));
  function resize() {
    const box=canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const ratio=box.width/box.height;
    const half=Math.max(halfX/ratio,halfY)*1.15;
    camera.left=-half*ratio; camera.right=half*ratio;
    camera.top=half; camera.bottom=-half;
    camera.updateProjectionMatrix();
    gl.setSize(Math.round(box.width),Math.round(box.height),false);
    render();
  }
  function reset() {
    camera.far=span*12; camera.zoom=1;
    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(offset,span*1.9);
    camera.updateProjectionMatrix(); controls.update(); render();
  }
  function rotate(angle) {
    const delta=camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0,1,0),angle);
    camera.position.copy(controls.target).add(delta); controls.update(); render();
  }
  function zoom(factor) {
    if (!Number.isFinite(factor) || factor<=0) return;
    camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,controls.minZoom,controls.maxZoom);
    camera.updateProjectionMatrix(); render();
  }
  const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
  let press=null;
  function down(e) {
    press=(e.button===0 && e.isPrimary) ? {id:e.pointerId,x:e.clientX,y:e.clientY} : null;
  }
  function move(e) {
    if (press && Math.hypot(e.clientX-press.x,e.clientY-press.y)>5) press=null;
  }
  function release(e) {
    if (!press || press.id!==e.pointerId) return;
    press=null;
    const box=canvas.getBoundingClientRect();
    mouse.set((e.clientX-box.left)/box.width*2-1,1-(e.clientY-box.top)/box.height*2);
    ray.setFromCamera(mouse,camera);
    const hit = trailCells.length
      ? ray.intersectObjects(trailBadges, false)[0] || ray.intersectObjects(trailCells, false)[0]
      : ray.intersectObjects(cells, false)[0];
    if(hit) onPick?.(hit.object.userData.messageId);
  }
  function cancel() { press=null; }
  function lose(e) { e.preventDefault(); lostContext=true; }
  function restore() { lostContext=false; render(); }
  const listeners={pointerdown:down,pointermove:move,pointerup:release,pointercancel:cancel,
    webglcontextlost:lose, webglcontextrestored:restore};
  for (const [name,fn] of Object.entries(listeners)) canvas.addEventListener(name,fn);
  controls.addEventListener('change',render);
  const observer=new ResizeObserver(resize); observer.observe(canvas);
  resize();reset();setSelected(selected);
  return {setSelected,setTrail,resize,reset,rotate,zoom,destroy(){
    dead=true; cancelAnimationFrame(raf); observer.disconnect();
    controls.removeEventListener('change',render); controls.dispose();
    for(const [name,fn] of Object.entries(listeners)) canvas.removeEventListener(name,fn);
    clearPath();
    for(const store of [geometrySet,materialSet,textureSet]) for(const item of store) item.dispose();
    gl.dispose();gl.forceContextLoss();
  }};
}
