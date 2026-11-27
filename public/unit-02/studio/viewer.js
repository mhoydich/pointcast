'use strict';
(() => {
  const el = name => document.getElementById(name);
  const status = el('status'), canvas = el('model');
  const dot = (a,b) => a.reduce((sum,v,i)=>sum+v*b[i],0);
  const minus = (a,b) => a.map((v,i)=>v-b[i]);
  const plus = (a,b) => a.map((v,i)=>v+b[i]);
  const times = (a,s) => a.map(v=>v*s);
  const norm = a => times(a,1/(Math.hypot(...a)||1));
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const identity = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  const multiply = (a,b) => {
    const c=new Float32Array(16);
    for(let j=0;j<4;j++)for(let i=0;i<4;i++)
      c[4*j+i]=a[i]*b[4*j]+a[4+i]*b[4*j+1]+a[8+i]*b[4*j+2]+a[12+i]*b[4*j+3];
    return c;
  };
  function transform(p,m){return p.map((_,i)=>m[i]*p[0]+m[4+i]*p[1]+m[8+i]*p[2]+m[12+i]);}
  function nodeMatrix(n) {
    if(n.matrix)return n.matrix;
    const [x,y,z,w]=n.rotation||[0,0,0,1], [a,b,c]=n.scale||[1,1,1],t=n.translation||[0,0,0];
    return [(1-2*(y*y+z*z))*a,2*(x*y+z*w)*a,2*(x*z-y*w)*a,0,
      2*(x*y-z*w)*b,(1-2*(x*x+z*z))*b,2*(y*z+x*w)*b,0,
      2*(x*z+y*w)*c,2*(y*z-x*w)*c,(1-2*(x*x+y*y))*c,0,...t,1];
  }
  function lookAt(eye,target,up=[0,1,0]) {
    const z=norm(minus(eye,target)),x=norm(cross(up,z)),y=cross(z,x);
    return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
  }
  function ortho(l,r,b,t,n,f){return [2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1];}
  function perspective(fov,aspect,n,f){let s=1/Math.tan(fov/2);return [s/aspect,0,0,0,0,s,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0];}
  function boundsCorners(a,b) {
    const list=[];for(const x of [a[0],b[0]])for(const y of [a[1],b[1]])for(const z of [a[2],b[2]])list.push([x,y,z]);
    return list;
  }
  const vs = `#version 300 es
  layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNorm;layout(location=2) in vec4 aColor;
  uniform mat4 vp,model,lightVP;out vec3 worldPos;out vec3 worldNorm;out vec4 lightPos;out vec4 color;
  void main(){vec4 pos=model*vec4(aPos,1.);worldPos=pos.xyz;worldNorm=transpose(inverse(mat3(model)))*aNorm;color=aColor;lightPos=lightVP*pos;gl_Position=vp*pos;}`;
  const fs = `#version 300 es
  precision highp float;uniform sampler2D depthTex;uniform vec3 eye;uniform vec3 lightDir;uniform vec4 base;
  uniform float metal,rough,ground,inside;uniform vec3 emit;in vec3 worldPos;in vec3 worldNorm;in vec4 lightPos;in vec4 color;out vec4 frag;
  float shadow(vec3 n){vec3 p=lightPos.xyz/lightPos.w*.5+.5;if(p.z>=1.||p.z<=0.||p.x<0.||p.y<0.||p.x>1.||p.y>1.)return 1.;
    float bias=max(.00022,.0013*(1.-max(dot(n,lightDir),0.)));float sum=0.;
    for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++){float d=texture(depthTex,p.xy+vec2(i,j)*.00088).r;sum+=(p.z-bias>d)?0.:1.;}return sum/9.;}
  vec3 toSRGB(vec3 c){return mix(12.92*c,1.055*pow(max(c,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),c));}
  void main(){vec3 n=normalize(worldNorm);if(!gl_FrontFacing)n=-n;
    float sh=shadow(n);
    if(ground>.5){float fading=1.-smoothstep(5.5,12.,length(worldPos.xz));float ink=(1.-sh)*.23;
      float contact=.10*exp(-pow(abs(worldPos.x)/3.45,4.)-pow(abs(worldPos.z)/1.33,4.));
      vec2 g=abs(fract(worldPos.xz+.5)-.5)/max(fwidth(worldPos.xz),vec2(.0001));
      float grid=(1.-min(min(g.x,g.y),1.))*.047*fading;
      float alpha=clamp(ink+contact+grid,0.,.40);
      frag=vec4(.17,.215,.195,alpha);return;}
    vec3 paint=base.rgb*color.rgb;vec3 v=normalize(eye-worldPos),h=normalize(lightDir+v);
    float lighting=max(dot(n,lightDir),0.);float rim=max(dot(n,normalize(vec3(.6,.45,-.8))),0.);
    float sky=clamp(n.y*.5+.5,0.,1.);vec3 ambient=mix(vec3(.36,.36,.33),vec3(.7,.74,.77),sky);
    float indoors=inside>.5?.25:0.;vec3 irradiance=ambient+indoors+lighting*(.27+sh*.59)*vec3(1.06,1.,.93)+.17*rim;
    float shininess=mix(72.,9.,rough);float gloss=pow(max(dot(n,h),0.),shininess)*(.03+.34*metal)*(sh*.7+.3);
    vec3 c=paint*irradiance*(1.-metal*.12)+gloss*mix(vec3(.9),paint,.5*metal)+emit;
    frag=vec4(toSRGB(clamp(c,0.,1.)),base.a*color.a);}`;
  const shadowVS=`#version 300 es
    layout(location=0) in vec3 aPos;uniform mat4 vp,model;void main(){gl_Position=vp*model*vec4(aPos,1.);}`;
  const shadowFS=`#version 300 es
    precision highp float;void main(){}`;
  async function start() {
    const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:false});
    if(!gl)throw Error('This 3D view needs WebGL 2. Open the file in Safari, Chrome, Edge, or Firefox with hardware acceleration enabled.');
    const response = await fetch('./station.glb.gz');
    if (!response.ok) throw new Error('The model could not be loaded. Reload to try again.');
    const payload = new Uint8Array(await response.arrayBuffer());
    const isGzip = payload[0] === 0x1f && payload[1] === 0x8b;
    let bytes = payload;
    if (isGzip) {
      const stream = new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'));
      bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    }
    const dv=new DataView(bytes.buffer);if(dv.getUint32(0,true)!==0x46546c67)throw Error('The embedded 3D model could not be read.');
    const jsonLength=dv.getUint32(12,true),g=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+jsonLength)));
    const bin=20+jsonLength+8;
    function program(v,f) {
      const p=gl.createProgram();[[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]].forEach(([kind,src])=>{
        const s=gl.createShader(kind);gl.shaderSource(s,src);gl.compileShader(s);
        if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);
      });gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;
    }
    const mainP=program(vs,fs),shadowP=program(shadowVS,shadowFS);
    const locations=(p,keys)=>Object.fromEntries(keys.split(' ').map(k=>[k,gl.getUniformLocation(p,k)]));
    const u=locations(mainP,'vp model lightVP eye lightDir base metal rough ground inside emit depthTex');
    const su=locations(shadowP,'vp model');
    const gpu=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,gpu);gl.bufferData(gl.ARRAY_BUFFER,bytes.subarray(bin),gl.STATIC_DRAW);
    const indexGPU=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexGPU);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,bytes.subarray(bin),gl.STATIC_DRAW);
    const prims=[],geometry=new Map(),dimensions={VEC2:2,VEC3:3,VEC4:4,SCALAR:1};
    const offsetFor=a=>(g.bufferViews[a.bufferView].byteOffset||0)+(a.byteOffset||0);
    function geom(meshIndex,pi) {
      const key=meshIndex+'/'+pi;if(geometry.has(key))return geometry.get(key);
      const raw=g.meshes[meshIndex].primitives[pi],attrs=raw.attributes;
      const pos=g.accessors[attrs.POSITION];const vao=gl.createVertexArray();gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER,gpu);
      [['POSITION',0],['NORMAL',1],['COLOR_0',2]].forEach(([attr,id])=>{
        if(attrs[attr]===undefined)return;
        const a=g.accessors[attrs[attr]],bv=g.bufferViews[a.bufferView];
        gl.enableVertexAttribArray(id);gl.vertexAttribPointer(id,dimensions[a.type],a.componentType,!!a.normalized,bv.byteStride||0,offsetFor(a));
      });
      const ia=raw.indices!==undefined?g.accessors[raw.indices]:null;
      if(ia)gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexGPU);gl.bindVertexArray(null);
      const out={vao,count:ia?ia.count:pos.count,indexType:ia&&ia.componentType,indexOffset:ia&&offsetFor(ia),mode:raw.mode??4,
        normal:attrs.NORMAL!==undefined,vertexColor:attrs.COLOR_0!==undefined, corners:boundsCorners(pos.min,pos.max),material:raw.material};
      geometry.set(key,out);return out;
    }
    const recognized=['Near shell','Far shell','Roof','Ends','Scale figure','Chassis','Running gear','Access steps','Floor','Cabin'];
    const bounding=(points)=>[0,1,2].map(i=>[Math.min(...points.map(p=>p[i])),Math.max(...points.map(p=>p[i]))]);
    function walk(ni,parent,path) {
      const n=g.nodes[ni],matrix=multiply(parent,nodeMatrix(n)),name=n.name||'';
      const match=recognized.find(k=>name===k||name.startsWith(k+'.')||name.startsWith(k+' /')||name.startsWith(k+' '));
      const group=match||path;
      if(n.mesh!==undefined)g.meshes[n.mesh].primitives.forEach((p,pi)=>{
        const q=geom(n.mesh,pi),m=g.materials?.[q.material]||{},pbr=m.pbrMetallicRoughness||{};
        const base=Array.from(pbr.baseColorFactor||[1,1,1,1]);if((m.name||'').toLowerCase().includes('glass'))base[3]=Math.min(base[3],.37);
        const corners=q.corners.map(v=>transform(v,matrix)),b=bounding(corners),center=b.map(pair=>(pair[0]+pair[1])*.5);
        const e=times(m.emissiveFactor||[0,0,0],m.extensions?.KHR_materials_emissive_strength?.emissiveStrength||1);
        prims.push({q,group,matrix,base,center,corners,metal:pbr.metallicFactor??1,rough:pbr.roughnessFactor??1,emit:e});
      });
      (n.children||[]).forEach(i=>walk(i,matrix,group));
    }
    for(const n of g.scenes[g.scene||0].nodes)walk(n,identity,'');
    const groundVao=gl.createVertexArray();gl.bindVertexArray(groundVao);
    const groundBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,groundBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-60,-.012,-60,-60,-.012,60,60,-.012,60,-60,-.012,-60,60,-.012,60,60,-.012,-60]),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);gl.bindVertexArray(null);
    const shTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,shTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,2048,2048,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
    for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);
    for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.NEAREST);
    const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shTex,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('The graphics driver could not create a depth buffer.');
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    const lightDir=norm([-.48,.98,.52]),lightVP=multiply(ortho(-8,8,-7.5,7.5,.2,39),lookAt(plus([0,1.3,0],times(lightDir,15)),[0,1.3,0]));
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
    gl.vertexAttrib3f(1,0,1,0);gl.vertexAttrib4f(2,1,1,1,1);
    const config={
      Exterior:{angle:[-.53,.27],caption:'The boarding stair and antenna mast are deployed.',index:'01'},
      Cutaway:{angle:[-.39,.43],caption:'The near wall and roof lift away to expose the cabin arrangement.',index:'02'},
      Inside:{caption:'Standing eye level in the aft aisle, looking toward the broadcast desk.',index:'03'},
      Plan:{angle:[0,Math.PI/2-.0001],caption:'Overhead view of the entry, broadcast workspace and sleeping berths.',index:'04'},
      'Running gear':{angle:[-.54,.31],caption:'Track belts and road wheels flank the low chassis.',index:'05'}
    };
    let mode='Exterior',yaw=-.53,pitch=.27,zoom=1,pending=0,dirtyShadow=true,visible=[],center=[0,1.3,0],fit=3,visibleCorners=[];
    let interiorFoV=70;
    const cabinEye=[3.7,2.81,1.0],cabinLook=[-.65,2.4,-.55];
    function eyeAngles(){const dir=norm(minus(cabinLook,cabinEye));yaw=Math.atan2(dir[0],dir[2]);pitch=Math.asin(dir[1]);}
    function visibleIn(group) {
      if(group==='Scale figure')return mode==='Cutaway'||mode==='Plan';
      if(mode==='Running gear')return ['Running gear','Chassis'].includes(group);
      if(mode==='Cutaway'||mode==='Plan')return !['Near shell','Roof'].includes(group);
      return true;
    }
    function orientedCamera(){return [Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];}
    function fitCurrent() {
      const dir=orientedCamera(),x=norm(cross([0,1,0],dir)),y=cross(dir,x),aspect=Math.max(.2,canvas.clientWidth/Math.max(canvas.clientHeight,1));
      const toScreen=visibleCorners.map(p=>[dot(p,x),dot(p,y),dot(p,dir)]),bounds=[0,1,2].map(j=>{
        let a=Infinity,b=-Infinity;for(const p of toScreen){a=Math.min(a,p[j]);b=Math.max(b,p[j]);}return [a,b];});
      const mid=bounds.map(pair=>(pair[0]+pair[1])/2);
      center=plus(plus(times(x,mid[0]),times(y,mid[1])),times(dir,mid[2]));
      fit=Math.max((bounds[0][1]-bounds[0][0])*.57/aspect,(bounds[1][1]-bounds[1][0])*.59,.4);
    }
    function setMode(next) {
      mode=next;zoom=1;interiorFoV=70;
      if(mode==='Inside')eyeAngles();else [yaw,pitch]=config[mode].angle;
      visible=prims.filter(o=>visibleIn(o.group));visibleCorners=visible.flatMap(o=>o.corners);
      if(mode!=='Inside'&&visibleCorners.length)fitCurrent();dirtyShadow=true;
      for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',b.dataset.mode===mode);
      el('caption').textContent=config[mode].caption;el('index').textContent=config[mode].index;el('viewname').textContent=(mode==='Running gear'?'CHASSIS':mode).toUpperCase();
      document.querySelector('.scale').hidden=mode==='Inside';
      document.querySelector('.scale').style.display=mode==='Inside'?'none':'grid';
      const act=mode==='Inside'?'look':'orbit';document.querySelector('.hint .mouse').textContent='Drag to '+act+' · Scroll to zoom';document.querySelector('.hint .touch').textContent='Drag to '+act+' · Pinch to zoom';
      requestDraw();
    }
    function drawGeom(o,loc,material) {
      gl.uniformMatrix4fv(loc.model,false,o.matrix);
      if(material){gl.uniform4fv(u.base,o.base);gl.uniform1f(u.metal,o.metal);gl.uniform1f(u.rough,o.rough);gl.uniform3fv(u.emit,o.emit);}
      gl.bindVertexArray(o.q.vao);
      if(o.q.indexType)gl.drawElements(o.q.mode,o.q.count,o.q.indexType,o.q.indexOffset);else gl.drawArrays(o.q.mode,0,o.q.count);
    }
    function draw(){
      pending=0;const aspect=canvas.width/canvas.height,dir=orientedCamera();
      const interior=mode==='Inside';const eye=interior?cabinEye:plus(center,times(dir,18));
      const view=interior?lookAt(eye,plus(eye,dir)):lookAt(eye,center);
      const h=fit/zoom;const projection=interior?perspective(interiorFoV*Math.PI/180,aspect,.025,55):ortho(-h*aspect,h*aspect,-h,h,.04,70);
      const vp=multiply(projection,view);
      if(dirtyShadow){
        gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.viewport(0,0,2048,2048);gl.clear(gl.DEPTH_BUFFER_BIT);gl.disable(gl.BLEND);
        gl.useProgram(shadowP);gl.uniformMatrix4fv(su.vp,false,lightVP);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.1,2.0);
        for(const o of visible)if(o.base[3]>.8)drawGeom(o,su,false);
        gl.disable(gl.POLYGON_OFFSET_FILL);gl.bindFramebuffer(gl.FRAMEBUFFER,null);dirtyShadow=false;
      }
      gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.useProgram(mainP);gl.uniformMatrix4fv(u.vp,false,vp);gl.uniformMatrix4fv(u.lightVP,false,lightVP);
      gl.uniform3fv(u.eye,eye);gl.uniform3fv(u.lightDir,lightDir);gl.uniform1f(u.inside,interior?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shTex);gl.uniform1i(u.depthTex,0);
      gl.disable(gl.BLEND);gl.depthMask(true);gl.uniform1f(u.ground,0);
      for(const o of visible)if(o.base[3]>=.995)drawGeom(o,u,true);
      gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);if(!interior){gl.uniformMatrix4fv(u.model,false,identity);gl.uniform1f(u.ground,1);gl.bindVertexArray(groundVao);gl.drawArrays(gl.TRIANGLES,0,6);gl.uniform1f(u.ground,0);}
      for(const o of visible.filter(o=>o.base[3]<.995).sort((a,b)=>dot(minus(eye,b.center),dir)-dot(minus(eye,a.center),dir)))drawGeom(o,u,true);
      gl.depthMask(true);gl.bindVertexArray(null);gl.disable(gl.BLEND);
      if(!interior){
        const scaleRatio=canvas.clientHeight/(2*h);let metres=1;
        if(scaleRatio<35)metres=2;else if(scaleRatio>135)metres=.5;
        el('scaleLine').style.width=(scaleRatio*metres)+'px';el('scaleText').textContent=metres+' m';
      }
    }
    function requestDraw(){if(!pending)pending=requestAnimationFrame(draw);}
    function resize(){
      const r=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
      const w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;if(visibleCorners.length&&mode!=='Inside'){const oldYaw=yaw,oldPitch=pitch;[yaw,pitch]=config[mode].angle;fitCurrent();yaw=oldYaw;pitch=oldPitch;}requestDraw();}
    }
    const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
    function adjustZoom(k){if(mode==='Inside')interiorFoV=clamp(interiorFoV/k,34,100);else zoom=clamp(zoom*k,.38,7);requestDraw();}
    function orbit(dx,dy){
      if(mode==='Inside'){yaw-=dx*.004;pitch=clamp(pitch+dy*.004,-1.42,1.42);}
      else{yaw-=dx*.006;pitch=clamp(pitch+dy*.006,-.2,Math.PI/2-.0001);}requestDraw();
    }
    const touches=new Map();let pinch=0;
    canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);touches.set(e.pointerId,[e.clientX,e.clientY]);canvas.classList.add('dragging');pinch=touches.size===2?Math.hypot(...minus(...touches.values())):0;});
    const release=e=>{touches.delete(e.pointerId);pinch=0;if(!touches.size)canvas.classList.remove('dragging');};
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
    canvas.addEventListener('pointermove',e=>{if(!touches.has(e.pointerId))return;
      const p=[e.clientX,e.clientY],d=minus(p,touches.get(e.pointerId));touches.set(e.pointerId,p);
      if(touches.size===2){const span=Math.hypot(...minus(...touches.values()));if(pinch>1&&span>1)adjustZoom(span/pinch);pinch=span;}else if(touches.size===1)orbit(...d);
    });
    canvas.addEventListener('wheel',e=>{e.preventDefault();adjustZoom(Math.exp(-clamp(e.deltaY,-300,300)*.0019));},{passive:false});
    canvas.addEventListener('dblclick',()=>setMode(mode));
    canvas.addEventListener('keydown',e=>{
      const actions={ArrowLeft:()=>orbit(-12,0),ArrowRight:()=>orbit(12,0),ArrowUp:()=>orbit(0,-12),ArrowDown:()=>orbit(0,12),'+':()=>adjustZoom(1.2),'=':()=>adjustZoom(1.2),'-':()=>adjustZoom(1/1.2),Home:()=>setMode(mode)};
      if(actions[e.key]){e.preventDefault();actions[e.key]();}
    });
    el('home').onclick=()=>setMode(mode);el('in').onclick=()=>adjustZoom(1.24);el('out').onclick=()=>adjustZoom(1/1.24);
    for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>setMode(b.dataset.mode);
    new ResizeObserver(resize).observe(canvas);resize();setMode('Exterior');status.hidden=true;
  }
  start().catch(error => {
    console.error(error);
    status.textContent = error.message;
  });
})();
