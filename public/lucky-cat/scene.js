import * as THREE from './vendor/three.module.min.js';
import {createCatModel} from './cat-model.js';
import {CATS} from './catalog.js';
export function createCatScene(container,{onPet=()=>{},reducedMotion=false}={}){
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch(e){container.innerHTML='<p class="scene-error">Your cat is taking a little 3D nap.<br>The luck game still works below.</p>';return{pet(){},setColor(){},setMotion(){},setPlaying(){}};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;container.appendChild(renderer.domElement);
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(33,1,.1,70);camera.position.set(6.4,5.1,11.3);camera.lookAt(0,1.8,0);
 scene.add(new THREE.HemisphereLight(0xffefd0,0x325b49,2.4));const light=new THREE.DirectionalLight(0xffe6b7,4.2);light.position.set(-4,8,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-6,right:6,top:6,bottom:-6});light.shadow.bias=-.001;light.shadow.normalBias=.035;scene.add(light);const fill=new THREE.DirectionalLight(0xd2fff1,2.2);fill.position.set(5,4,-4);scene.add(fill);
 const world=new THREE.Group();scene.add(world);const cream=new THREE.MeshStandardMaterial({color:0xffe4b0,roughness:.43,metalness:.08});const pink=new THREE.MeshStandardMaterial({color:0xf39891,roughness:.48});const dark=new THREE.MeshStandardMaterial({color:0x173729,roughness:.6});const gold=new THREE.MeshStandardMaterial({color:0xecc45c,roughness:.3,metalness:.55});const coral=new THREE.MeshStandardMaterial({color:0xd96052,roughness:.4});const mint=new THREE.MeshStandardMaterial({color:0xa6c7a3,roughness:.55});
 const materials={cream,pink,dark,gold,coral,mint};
 function mesh(geo,mat,pos,scale=[1,1,1],parent=world){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const sphereGeo=new THREE.SphereGeometry(1,40,28);
 function ball(mat,pos,scale,parent){return mesh(sphereGeo,mat,pos,scale,parent);}
 function tube(points,mat,radius=.025,parent=world){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(new THREE.TubeGeometry(curve,20,radius,8,false),mat,[0,0,0],[1,1,1],parent);}
 mesh(new THREE.CylinderGeometry(2.75,2.85,.28,80),mint,[0,.16,0]);mesh(new THREE.CylinderGeometry(2.68,2.68,.06,80),new THREE.MeshStandardMaterial({color:0xcfe5bd,roughness:.65}),[0,.33,0]);mesh(new THREE.TorusGeometry(2.76,.055,8,100),gold,[0,.2,0]).rotation.x=Math.PI/2;
 for(const x of [-1.8,1.8])for(const z of [-1.3,1.3])ball(new THREE.MeshStandardMaterial({color:0x263a2d}),[x,-.1,z],[.25,.25,.25]);
 let design=CATS[0],model=createCatModel(design),cat=model.group;cat.position.y=.35;world.add(cat);
 function setDesign(next){if(!next||design.id===next.id)return;world.remove(cat);model.dispose();design=next;model=createCatModel(next);cat=model.group;cat.position.y=.35;world.add(cat);}
 // A small sculptural desk garden around the ceramic cat.
 const potMat=new THREE.MeshStandardMaterial({color:0xcfac7c,roughness:.7});mesh(new THREE.CylinderGeometry(.4,.3,.56,24),potMat,[-1.72,.64,-.58]);mesh(new THREE.CylinderGeometry(.32,.32,.04,24),dark,[-1.72,.94,-.58]);
 const greens=[0x6eab72,0xa0c372,0x4c8360].map(color=>new THREE.MeshStandardMaterial({color,roughness:.65}));
 for(let i=0;i<7;i++){const a=i*2.4;const end=[-1.72+Math.cos(a)*(.4+(i%3)*.14),1.4+(i%3)*.27,-.58+Math.sin(a)*.35];tube([[-1.72,.93,-.58],[-1.72,1.17,-.58],end],greens[2],.035);const leaf=ball(greens[i%3],end,[.18,.38,.075]);leaf.rotation.z=Math.cos(a)*-.8;leaf.rotation.y=a;}
 const crystalMat=new THREE.MeshStandardMaterial({color:0xa598d7,roughness:.3,metalness:.15});for(let i=0;i<3;i++){const c=mesh(new THREE.ConeGeometry(.18,.57+i*.2,5),crystalMat,[1.67+i*.17,.65+i*.1,.52-i*.13]);c.rotation.z=-.2+i*.23;mesh(new THREE.CylinderGeometry(.18,.18,.2+i*.1,5),crystalMat,[1.67+i*.17,.42,.52-i*.13]);}
 const bookMats=[coral,gold,greens[1]];for(let i=0;i<3;i++){const book=mesh(new THREE.BoxGeometry(.76,.13,.55),bookMats[i],[-1.5,.42+i*.13,.86]);book.rotation.y=.15*(i-1);mesh(new THREE.BoxGeometry(.7,.065,.52),new THREE.MeshStandardMaterial({color:0xffe8be}),[-1.5,.425+i*.13,.867]).rotation.y=.15*(i-1);}
 // Floating abstract stars, deliberately outside the interactive spark layer.
 const stars=[];for(let i=0;i<6;i++){const a=i*1.28;const star=mesh(new THREE.OctahedronGeometry(.065+(i%2)*.035),gold,[Math.cos(a)*2,2.3+(i%3)*.44,Math.sin(a)*1.2]);star.scale.y=1.65;stars.push(star);}
 let drag=false,startX=0,downX=0,downY=0,rotationTarget=-.12,petUntil=0,playing=false,motion=reducedMotion,lastTime=0;
 const ray=new THREE.Raycaster();const pointer=new THREE.Vector2();
 renderer.domElement.addEventListener('pointerdown',e=>{drag=true;startX=e.clientX;downX=e.clientX;downY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
 renderer.domElement.addEventListener('pointermove',e=>{if(drag){rotationTarget+=((e.clientX-startX)/250);rotationTarget=Math.max(-.7,Math.min(.7,rotationTarget));startX=e.clientX;}});
 renderer.domElement.addEventListener('pointerup',e=>{drag=false;if(Math.hypot(e.clientX-downX,e.clientY-downY)<8&&!playing){const b=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-((e.clientY-b.top)/b.height)*2+1);ray.setFromCamera(pointer,camera);if(ray.intersectObject(cat,true).length){pet();onPet();}}});renderer.domElement.addEventListener('pointercancel',()=>{drag=false;});
 function pet(){petUntil=performance.now()+1250;}
 const resize=()=>{const {width,height}=container.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.position.set(width<430?5.4:6.4,4.9,width<430?12.8:11.3);camera.lookAt(0,1.75,0);camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(container);resize();
 function animate(t){requestAnimationFrame(animate);if(document.hidden||t-lastTime<1000/40)return;lastTime=t;world.rotation.y+=(rotationTarget-world.rotation.y)*.065;const secs=t/1000;cat.position.y=.35+(!motion?Math.sin(secs*1.8)*.025:0);model.wave(secs,t<petUntil,motion);stars.forEach((s,i)=>{if(!motion){s.rotation.y=secs*.5+i;s.position.y=2.3+(i%3)*.44+Math.sin(secs*1.3+i)*.07;}});renderer.render(scene,camera);}
 requestAnimationFrame(animate);
 return{pet,capture(next){setDesign(typeof next==='string'?CATS.find(c=>c.color===next)||CATS[0]:next);const rotation=world.rotation.y,position=camera.position.clone(),hidden=world.children.filter(child=>child!==cat&&child.visible);hidden.forEach(child=>child.visible=false);world.rotation.y=-.12;cat.position.y=0;camera.position.set(.7,2.05,6.2);camera.lookAt(0,1.4,0);renderer.render(scene,camera);const image=renderer.domElement.toDataURL('image/png');hidden.forEach(child=>child.visible=true);world.rotation.y=rotation;cat.position.y=.35;camera.position.copy(position);camera.lookAt(0,1.75,0);return image;},setDesign,setColor(color){setDesign(CATS.find(c=>c.color===color)||CATS[0]);},setMotion(v){motion=v;},setPlaying(v){playing=v;}};
}
