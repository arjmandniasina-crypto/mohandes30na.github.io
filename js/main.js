(function(){'use strict';
/* ===== CONFIG ===== */
if (!window.PORTFOLIO_CONFIG) {
  throw new Error('Portfolio config missing. Ensure js/config.js loads before js/main.js.');
}
const { NAMES, TV_WALL_X, CAM, PJ, CONTACT, T, SITE, RESUME_PATH } = window.PORTFOLIO_CONFIG;
/* ===== STATE / HELPERS ===== */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const safeURL=value=>{const u=String(value||'#').trim();return /^(https?:\/\/|mailto:|tel:|#|\/|files\/)/i.test(u)?escapeHTML(u):'#'};
const safeImagePath=value=>String(value||'').replace(/[^a-zA-Z0-9_./-]/g,'');
const LS={g(k,d){try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},s(k,v){try{localStorage.setItem(k,String(v))}catch(e){}}};
let lang=LS.g('lang','');if(!T[lang]){const n=(navigator.language||'en').slice(0,2);lang=T[n]?n:'en'}
const st={mode:'intro',sec:-1,page:0,music:LS.g('music','0')==='1',vol:parseFloat(LS.g('vol','.3'))||0,q:LS.g('q','auto'),rm:LS.g('rm','')===''?matchMedia('(prefers-reduced-motion: reduce)').matches:LS.g('rm','0')==='1',darkTheme:LS.g('darkTheme','1')==='1'};
let seen=[];try{seen=JSON.parse(LS.g('seen','[]'))||[]}catch(e){seen=[]}
let LITE=/[?&]lite/.test(location.search)||(navigator.hardwareConcurrency||4)<=2||(navigator.deviceMemory||4)<=2;
const L=()=>T[lang],FONT=()=>lang==='fa'?'Vazirmatn,Tahoma,sans-serif':'"Cormorant Garamond",Georgia,serif';
function applyTheme(){document.documentElement.dataset.theme=st.darkTheme?'dark':'light';document.documentElement.style.colorScheme=st.darkTheme?'dark':'light';}
const dur=d=>st.rm?.01:d;
let tvOn=false,tvIdx=0,tvTimer=0,exReady=false,yaw=0,yawT=0,pitch=0,pitchT=0,flare=0,tvLight=null,drawLaptop=()=>{},drawTV=()=>{};
const keys={};
/* Project images are shared by the resume cards and the in-world TV. Cache each
   image once; if a file is missing, the TV keeps its color-gradient fallback. */
const tvProjectImageCache = new Map();
function getTVProjectImage(path){
 const src=safeImagePath(path);
 if(!src)return null;
 let entry=tvProjectImageCache.get(src);
 if(!entry){
  const image=new Image();
  entry={image,state:'loading'};
  tvProjectImageCache.set(src,entry);
  image.onload=()=>{entry.state='loaded';if(typeof drawTV==='function')drawTV()};
  image.onerror=()=>{entry.state='failed';console.warn('Could not load project image for TV: '+src)};
  image.src=src + (src.includes('?')?'&':'?') + 'v=' + (window.PORTFOLIO_ASSET_VERSION || Date.now().toString(36));
 }
 return entry.state==='loaded'?entry.image:null;
}
function drawImageCover(ctx,image,x,y,w,h){
 const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
 if(!iw||!ih)return;
 const scale=Math.max(w/iw,h/ih),sw=w/scale,sh=h/scale;
 const sx=(iw-sw)/2,sy=(ih-sh)/2;
 ctx.drawImage(image,sx,sy,sw,sh,x,y,w,h);
}
/* ===== SCENE ===== */
let renderer,scene,camera,fireLight,keyLight,sky,rain,shaft,dust,steam=[],hands={},clockM,bookM,notesM,bookRoot=null,bookCoverPivot=null,bookPageTurnPivot=null,bookPageTurnTween=null,bookIsOpen=false,bookAnimating=false,activityRoot=null,activityCoverPivot=null,activityIsOpen=false,activityAnimating=false,doorPivot=null,pick=[],gmat=[],pr=1,firePaint=()=>{},candleFlame=null,candleLight=null;
const cp={x:.5,y:1.7,z:9},lk={x:-2.5,y:1.2,z:-3};
const isSmallViewport=()=>window.matchMedia('(max-width: 767px)').matches;
const isLimitedDevice=()=>((navigator.deviceMemory||8)<=4)||((navigator.hardwareConcurrency||8)<=4);
function targetPixelRatio(){
 const dpr=window.devicePixelRatio||1;
 if(st.q==='low')return Math.min(dpr,.8);
 if(st.q==='high')return Math.min(dpr,1.5);
 if(isSmallViewport())return Math.min(dpr,1.0);
 if(isLimitedDevice())return Math.min(dpr,1.05);
 return Math.min(dpr,1.25);
}
function targetShadows(){
 if(st.q==='low')return false;
 if(st.q==='high')return true;
 return !isSmallViewport()&&!isLimitedDevice();
}
function applyRenderQuality(){
 if(!renderer)return;
 const nextPr=targetPixelRatio();
 if(Math.abs(nextPr-pr)>.01){pr=nextPr;renderer.setPixelRatio(pr);renderer.setSize(innerWidth,innerHeight,false);}
 const shadows=targetShadows();
 if(renderer.shadowMap.enabled!==shadows)renderer.shadowMap.enabled=shadows;
 if(keyLight){
  keyLight.castShadow=shadows;
  const size=st.q==='high'?1536:1024;
  if(keyLight.shadow.mapSize.x!==size){if(keyLight.shadow.map){keyLight.shadow.map.dispose();keyLight.shadow.map=null;}keyLight.shadow.mapSize.set(size,size);}
  keyLight.shadow.needsUpdate=true;
  renderer.shadowMap.needsUpdate=true;
 }
}
function build(){
 const cv=$('#c');
 renderer=new THREE.WebGLRenderer({canvas:cv,antialias:innerWidth>900&&st.q!=='low'&&!isLimitedDevice(),powerPreference:'high-performance',stencil:false,preserveDrawingBuffer:false});
 pr=targetPixelRatio();renderer.setPixelRatio(pr);renderer.setSize(innerWidth,innerHeight,false);
 renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
 renderer.shadowMap.enabled=targetShadows();renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;scene=new THREE.Scene();scene.background=new THREE.Color(0x161a20);
 camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.25,40);
 const gm=new THREE.DataTexture(new Uint8Array([150,190,230,255]),4,1,THREE.LuminanceFormat);gm.minFilter=gm.magFilter=THREE.NearestFilter;gm.needsUpdate=true;
 const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:new THREE.Color(c).convertSRGBToLinear(),roughness:.78,metalness:.015},o||{}));
 const rc={};function rbox(w,h,d){const k=w+'_'+h+'_'+d;if(rc[k])return rc[k];const m=Math.min(w,h,d);if(m<.05)return rc[k]=new THREE.BoxGeometry(w,h,d);
  const r=Math.min(.04,m*.3),hw=w/2-r,hh=h/2-r,hd=d/2-r,g=new THREE.BoxGeometry(w,h,d,3,3,3),p=g.attributes.position,n=g.attributes.normal,v=new THREE.Vector3(),c=new THREE.Vector3();
  const f=(a,s,q)=>Math.abs(a)<s-1e-6?Math.sign(a)*q:a;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);v.set(f(v.x,w/2,hw),f(v.y,h/2,hh),f(v.z,d/2,hd));c.set(Math.max(-hw,Math.min(hw,v.x)),Math.max(-hh,Math.min(hh,v.y)),Math.max(-hd,Math.min(hd,v.z)));v.sub(c);
   if(v.lengthSq()>1e-12){v.normalize();n.setXYZ(i,v.x,v.y,v.z);v.multiplyScalar(r)}v.add(c);p.setXYZ(i,v.x,v.y,v.z)}
  return rc[k]=g}
 const B=(w,h,d,x,y,z,c,ol,p)=>{const g=rbox(w,h,d),m=new THREE.Mesh(g,M(c));m.position.set(x,y,z);const volume=Math.abs(w*h*d),minDim=Math.min(w,h,d),maxDim=Math.max(w,h,d);m.castShadow=volume>=.075&&minDim>=.035&&maxDim>=.4;m.receiveShadow=volume>=.015;(p||scene).add(m);
  if(0&&ol&&Math.min(w,h,d)>=.12&&w*h*d>.05){const o=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x0e1b38,side:THREE.BackSide}));o.scale.set(1.05,1.04,1.05);o.raycast=function(){};m.add(o)}return m};
 const C=(rt,rb,h,x,y,z,c,p,s)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,s||20),M(c));m.position.set(x,y,z);const radius=Math.max(rt,rb);m.castShadow=radius>=.055&&h>=.16;m.receiveShadow=radius>=.025&&h>=.08;(p||scene).add(m);return m};
 const tex=(w,h,fn)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');fn(g,w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t};
 const glow=tex(64,64,(g)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.4,'rgba(255,255,255,.4)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64)});
 const spr=(c,x,y,z,s,o)=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:c,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:o||1}));m.position.set(x,y,z);m.scale.set(s,s,1);scene.add(m);return m};
 const plant=(x,z,s)=>{
  /* Same refined Monstera plant throughout the room: ceramic planter, soil, stems and lobed leaves. */
  const pot=C(.215*s,.155*s,.32*s,x,.16*s,z,0xc9c1b4,null,28);pot.material.roughness=.78;pot.material.metalness=.015;
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.202*s,.012*s,10,32),M(0xd8d0c3,{roughness:.72,metalness:.02}));rim.rotation.x=Math.PI/2;rim.position.set(x,.318*s,z);rim.castShadow=true;rim.receiveShadow=true;scene.add(rim);
  C(.188*s,.188*s,.014*s,x,.321*s,z,0x352d26,null,24);
  const leafCols=[0x244a35,0x2c583e,0x315f43,0x3b684a,0x28513a,0x426f4e,0x2b563c];
  const veinCols=[0x7f9c70,0x8ca77b,0x78976a];
  const leaves=[
   {a:-.24,h:.72,w:.31,t:-.24,b:.32,c:0},
   {a:.66,h:.78,w:.34,t:.16,b:.32,c:1},
   {a:1.48,h:.67,w:.30,t:.24,b:.34,c:2},
   {a:2.42,h:.80,w:.35,t:-.18,b:.31,c:3},
   {a:3.25,h:.68,w:.30,t:-.26,b:.33,c:4},
   {a:4.18,h:.76,w:.33,t:.13,b:.32,c:5},
   {a:5.25,h:.64,w:.29,t:.20,b:.34,c:6}
  ];
  leaves.forEach((L,i)=>{
   const ox=Math.sin(L.a)*.055*s,oz=Math.cos(L.a)*.055*s;
   const stem=C(.008*s,.005*s,.20*s,x+ox*.65,.405*s,z+oz*.65,leafCols[i],null,8);stem.rotation.z=Math.sin(L.a)*-.16;stem.rotation.x=Math.cos(L.a)*.12;
   const w=L.w*s,h=L.h*s,shape=new THREE.Shape();
   /* softly notched Monstera-like silhouette rather than spherical leaves */
   shape.moveTo(0,0);
   shape.bezierCurveTo(-w*.18,h*.10,-w*.49,h*.20,-w*.46,h*.33);
   shape.quadraticCurveTo(-w*.44,h*.40,-w*.24,h*.42);
   shape.quadraticCurveTo(-w*.43,h*.49,-w*.36,h*.57);
   shape.quadraticCurveTo(-w*.31,h*.63,-w*.16,h*.64);
   shape.bezierCurveTo(-w*.23,h*.77,-w*.12,h*.92,0,h);
   shape.bezierCurveTo(w*.12,h*.92,w*.23,h*.77,w*.16,h*.64);
   shape.quadraticCurveTo(w*.31,h*.63,w*.36,h*.57);
   shape.quadraticCurveTo(w*.43,h*.49,w*.24,h*.42);
   shape.quadraticCurveTo(w*.44,h*.40,w*.46,h*.33);
   shape.bezierCurveTo(w*.49,h*.20,w*.18,h*.10,0,0);shape.closePath();
   const group=new THREE.Group();group.position.set(x+ox,.325*s,z+oz);group.rotation.y=L.a;group.rotation.z=L.t;scene.add(group);
   const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape,16),M(leafCols[i],{roughness:.91,metalness:0,side:THREE.DoubleSide}));mesh.castShadow=false;mesh.receiveShadow=false;group.add(mesh);
   const veinGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,.01*h,.003),new THREE.Vector3(0,.26*h,.003),new THREE.Vector3(0,.52*h,.003),new THREE.Vector3(0,.77*h,.003),new THREE.Vector3(0,.96*h,.003)]);
   const vein=new THREE.Line(veinGeo,new THREE.LineBasicMaterial({color:veinCols[i%veinCols.length],transparent:true,opacity:.78}));group.add(vein);
  });
 };
 const pictureLoader=new THREE.TextureLoader();
 const paint=(x,y,z,w,h,ry,c1,c2,imagePath)=>{
  const frame=new THREE.Group();frame.position.set(x,y,z);frame.rotation.y=ry;scene.add(frame);
  B(w,h,.075,0,0,0,0x45362b,0,frame);B(w*.86,h*.84,.025,0,0,.045,0xc6b9a5,0,frame);
  const a='#'+new THREE.Color(c1).getHexString(),b='#'+new THREE.Color(c2).getHexString();
  const art=tex(256,192,(g,aw,ah)=>{const grad=g.createLinearGradient(0,0,0,ah);grad.addColorStop(0,a);grad.addColorStop(.55,'#a5a8ac');grad.addColorStop(1,b);g.fillStyle=grad;g.fillRect(0,0,aw,ah);
   const sun=g.createRadialGradient(168,55,2,168,55,44);sun.addColorStop(0,'rgba(250,226,190,.95)');sun.addColorStop(1,'rgba(250,226,190,0)');g.fillStyle=sun;g.fillRect(120,8,96,96);
   [['#727e88',.57],['#535e68',.69],['#343d48',.82]].forEach((a,i)=>{g.fillStyle=a[0];g.beginPath();g.moveTo(0,ah);g.lineTo(0,ah*a[1]);for(let xx=0;xx<=aw;xx+=6)g.lineTo(xx,ah*a[1]-Math.sin(xx*.027+i*1.6)*(9+i*4)-Math.cos(xx*.08+i)*3);g.lineTo(aw,ah);g.closePath();g.fill()});
   for(let i=0;i<42;i++){const xx=Math.random()*aw,yy=ah*(.66+Math.random()*.25);g.strokeStyle='rgba(244,217,177,.22)';g.lineWidth=.5+Math.random();g.beginPath();g.moveTo(xx,yy);g.lineTo(xx+3+Math.random()*16,yy-1);g.stroke()}
  });
  const canvas=new THREE.Mesh(new THREE.PlaneGeometry(w*.77,h*.73),new THREE.MeshBasicMaterial({map:art,toneMapped:false}));canvas.position.set(0,0,.064);frame.add(canvas);
  /* Optional personal artwork: when the file exists, it replaces the procedural fallback.
     Crop to cover the frame without stretching the photo; keep the generated art if loading fails. */
  if(imagePath){
   const imageUrl=imagePath+(imagePath.includes('?')?'&':'?')+'v='+(window.PORTFOLIO_ASSET_VERSION||'1');
   pictureLoader.load(imageUrl,texture=>{
    texture.encoding=THREE.sRGBEncoding;
    texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    const imageAspect=(texture.image.width||1)/(texture.image.height||1);
    const frameAspect=(w*.77)/(h*.73);
    if(imageAspect>frameAspect){
     texture.repeat.set(frameAspect/imageAspect,1);
     texture.offset.x=(1-texture.repeat.x)/2;
    }else{
     texture.repeat.set(1,imageAspect/frameAspect);
     texture.offset.y=(1-texture.repeat.y)/2;
    }
    texture.needsUpdate=true;canvas.material.map=texture;canvas.material.color.set(0xffffff);canvas.material.needsUpdate=true;
   },undefined,error=>console.warn('Could not load wall photo: '+imagePath,error));
  }
 };
 /* physically shaded lighting: soft daylight from the window, warm practicals, and contact shadows */
 scene.add(new THREE.AmbientLight(0xcbd0d8,.34));
 scene.add(new THREE.HemisphereLight(0xe3e7ef,0x55463a,.62));
 keyLight=new THREE.DirectionalLight(0xffdfbd,1.65);keyLight.position.set(-3.8,6.5,3.6);keyLight.castShadow=renderer.shadowMap.enabled;
 keyLight.shadow.mapSize.set(st.q==='high'?1536:1024,st.q==='high'?1536:1024);keyLight.shadow.camera.left=-7;keyLight.shadow.camera.right=7;keyLight.shadow.camera.top=7;keyLight.shadow.camera.bottom=-7;keyLight.shadow.camera.near=.5;keyLight.shadow.camera.far=22;keyLight.shadow.bias=-.00025;keyLight.shadow.normalBias=.025;keyLight.shadow.radius=3;keyLight.shadow.camera.updateProjectionMatrix();scene.add(keyLight);
 fireLight=new THREE.PointLight(0xff9b55,1.65,7);fireLight.position.set(3.75,.72,-1.2);scene.add(fireLight);
 const lampL=new THREE.PointLight(0xffc98c,1.15,4.6);lampL.position.set(-3.5,1.55,-3.1);scene.add(lampL);
 tvLight=new THREE.PointLight(0x8bbbe6,0,4.5);tvLight.position.set(TV_WALL_X,1.52,-3.02);scene.add(tvLight);
 /* room */
 const wt=tex(512,256,(g,w,h)=>{
  const bg=g.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#56585c');bg.addColorStop(.48,'#625d59');bg.addColorStop(1,'#484a50');g.fillStyle=bg;g.fillRect(0,0,w,h);
  for(let i=0;i<1200;i++){const x=Math.random()*w,y=Math.random()*h;g.fillStyle=Math.random()>.5?'rgba(255,244,226,.025)':'rgba(12,14,18,.035)';g.fillRect(x,y,.5+Math.random()*1.5,.5+Math.random()*1.5)}
  for(let i=0;i<95;i++){const x=Math.random()*w,y=Math.random()*h;g.strokeStyle=i%2?'rgba(255,236,211,.025)':'rgba(15,16,18,.035)';g.lineWidth=.5+Math.random();g.beginPath();g.moveTo(x,y);g.lineTo(x+4+Math.random()*20,y+Math.random()*2-1);g.stroke()}
 });
 wt.wrapS=wt.wrapT=THREE.RepeatWrapping;wt.repeat.set(5,2);
 /* Room shell with a true opening where the entrance door sits.  Keeping the same wall material preserves the approved realistic finish. */
 const wallMat=M(0xffffff,{map:wt,side:THREE.DoubleSide,roughness:.96,metalness:0});
 const wallPanel=(w,h,d,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wallMat);m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=false;scene.add(m);return m};
 wallPanel(10,3.5,.025,0,1.65,-3.9875);       // back wall
 wallPanel(.025,3.5,8,-4.9875,1.65,0);        // left wall
 wallPanel(.025,3.5,8,4.9875,1.65,0);         // right wall
 wallPanel(10,.025,8,0,3.3875,0);             // ceiling
 wallPanel(6.8,3.5,.025,-1.6,1.65,3.9875);   // entry wall, left of door
 wallPanel(1.8,3.5,.025,4.1,1.65,3.9875);    // entry wall, right of door
 wallPanel(1.4,1.06,.025,2.5,2.87,3.9875);   // entry wall above door
 const ft=tex(512,512,(g,w,h)=>{
  g.fillStyle='#76563f';g.fillRect(0,0,w,h);const plankH=64;
  for(let row=0;row<h/plankH;row++){
   const colors=['#79583f','#866448','#705039','#8b694c','#76563e','#826044'];g.fillStyle=colors[(row*7+3)%colors.length];g.fillRect(0,row*plankH,w,plankH-2);
   const offset=(row%2)*90;for(let x=offset;x<w;x+=180){g.fillStyle='rgba(37,23,16,.38)';g.fillRect(x,row*plankH,1.6,plankH-2);g.fillStyle='rgba(236,194,144,.13)';g.fillRect(x+3,row*plankH,1,plankH-2)}
   for(let i=0;i<46;i++){const x=Math.random()*w,y=row*plankH+Math.random()*(plankH-4),len=10+Math.random()*110;g.strokeStyle=i%3?'rgba(43,27,17,.12)':'rgba(236,201,161,.12)';g.lineWidth=.4+Math.random()*.8;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+len*.25,y-1,x+len*.7,y+1,x+len,y);g.stroke()}
   if(row%3===1){const x=20+Math.random()*(w-40),y=row*plankH+25;g.strokeStyle='rgba(46,29,20,.25)';g.beginPath();g.ellipse(x,y,7,2,0,0,Math.PI*2);g.stroke()}
  }
  g.strokeStyle='rgba(30,20,15,.3)';g.lineWidth=2;for(let y=0;y<h;y+=plankH)g.strokeRect(0,y,w,plankH)
 });
 ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(4,4);
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(10,8),M(0xffffff,{map:ft,roughness:.88,metalness:0}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;fl.castShadow=false;scene.add(fl);
 const WD=0x17285a;
 B(10,.9,.05,0,.45,-3.96,WD);B(6.8,.9,.05,-1.6,.45,3.96,WD);B(1.8,.9,.05,4.1,.45,3.96,WD);B(.05,.9,8,-4.96,.45,0,WD);B(.05,.9,8,4.96,.45,0,WD);
 B(10,.06,.1,0,.92,-3.94,0xf0e6d2);B(10,.12,.14,0,3.3,-3.92,0xf0e6d2);B(10,.12,.14,0,3.3,3.92,0xf0e6d2);B(.14,.12,8,-4.92,3.3,0,0xf0e6d2);B(.14,.12,8,4.92,3.3,0,0xf0e6d2);
 /* window + cinematic twilight city view */
 const skyT=tex(768,480,(g,w,h)=>{
  let seed=47;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
  const skyGrad=g.createLinearGradient(0,0,0,h);
  skyGrad.addColorStop(0,'#26344b');skyGrad.addColorStop(.24,'#46566b');skyGrad.addColorStop(.46,'#7a8290');skyGrad.addColorStop(.67,'#c4a09b');skyGrad.addColorStop(.82,'#e8bd9b');skyGrad.addColorStop(1,'#b28a7c');
  g.fillStyle=skyGrad;g.fillRect(0,0,w,h);
  /* low sun glow and atmospheric haze */
  let haze=g.createRadialGradient(410,292,8,410,292,250);haze.addColorStop(0,'rgba(255,220,180,.56)');haze.addColorStop(.38,'rgba(250,190,161,.22)');haze.addColorStop(1,'rgba(250,190,161,0)');g.fillStyle=haze;g.fillRect(120,70,590,400);
  /* soft, broken cloud bands */
  for(let i=0;i<44;i++){
   const x=rnd()*w,y=54+rnd()*245,span=28+rnd()*128,thick=3+rnd()*13;
   const cg=g.createLinearGradient(x,y-thick,x,y+thick);cg.addColorStop(0,'rgba(255,239,224,0)');cg.addColorStop(.5,'rgba(235,220,217,'+(.025+rnd()*.075)+')');cg.addColorStop(1,'rgba(57,71,93,0)');
   g.fillStyle=cg;g.beginPath();g.moveTo(x-span,y);g.bezierCurveTo(x-span*.62,y-thick,x-span*.25,y+thick*.5,x,y);g.bezierCurveTo(x+span*.25,y-thick*.7,x+span*.7,y+thick,x+span,y-thick*.15);g.lineTo(x+span,y+thick);g.bezierCurveTo(x+span*.4,y+thick*1.3,x-span*.45,y+thick*1.2,x-span,y+thick);g.closePath();g.fill();
  }
  /* quiet moon through thin haze */
  let moonGlow=g.createRadialGradient(624,102,4,624,102,78);moonGlow.addColorStop(0,'rgba(244,235,222,.26)');moonGlow.addColorStop(1,'rgba(244,235,222,0)');g.fillStyle=moonGlow;g.fillRect(535,18,178,178);
  g.fillStyle='rgba(240,232,216,.72)';g.beginPath();g.arc(624,102,13,0,Math.PI*2);g.fill();
  g.fillStyle='rgba(155,157,161,.16)';[[619,97,3],[630,105,2],[620,108,1.5]].forEach(a=>{g.beginPath();g.arc(a[0],a[1],a[2],0,Math.PI*2);g.fill()});
  /* distant low hills softened by atmosphere */
  const hill=g.createLinearGradient(0,280,0,380);hill.addColorStop(0,'rgba(82,98,115,.45)');hill.addColorStop(1,'rgba(63,73,89,.76)');g.fillStyle=hill;g.beginPath();g.moveTo(0,360);g.bezierCurveTo(105,300,160,323,250,344);g.bezierCurveTo(345,365,428,290,520,322);g.bezierCurveTo(620,348,684,310,768,333);g.lineTo(w,h);g.lineTo(0,h);g.closePath();g.fill();
  /* layered city silhouettes with individual blocks and lit windows */
  const layers=[
   {base:354,min:24,max:82,colors:['#566171','#5e6876','#4d5968'],win:.16},
   {base:393,min:38,max:112,colors:['#394555','#414b59','#323e4c'],win:.27},
   {base:444,min:32,max:126,colors:['#252f3a','#2b3540','#202a35'],win:.38}
  ];
  layers.forEach((L,li)=>{
   let x=-4;
   while(x<w+8){
    const bw=L.min+rnd()*(L.max-L.min),bh=24+rnd()*(li===0?34:li===1?65:88),top=L.base-bh;
    const col=L.colors[Math.floor(rnd()*L.colors.length)];
    g.fillStyle=col;g.fillRect(x,top,bw,h-top);
    /* slightly darker side face adds architectural depth */
    g.fillStyle='rgba(9,15,23,'+(.08+li*.035)+')';g.beginPath();g.moveTo(x+bw*.72,top);g.lineTo(x+bw,top-2);g.lineTo(x+bw,h);g.lineTo(x+bw*.72,h);g.closePath();g.fill();
    g.fillStyle='rgba(180,190,199,.13)';g.fillRect(x+2,top+2,Math.max(1,bw*.58),1);
    if(rnd()>.68&&li>0){g.fillStyle=col;g.fillRect(x+bw*.2,top-6,bw*.35,6);g.fillStyle='rgba(31,41,51,.75)';g.fillRect(x+bw*.28,top-11,1.3,6)}
    const cols=Math.max(1,Math.floor((bw-8)/8)),rows=Math.max(1,Math.floor((h-top-12)/11));
    for(let row=0;row<rows;row++)for(let colN=0;colN<cols;colN++){
     if(rnd()<L.win){const wx=x+4+colN*8,wy=top+7+row*11;g.fillStyle=rnd()>.2?'rgba(243,198,140,'+(.28+rnd()*.38)+')':'rgba(185,209,224,.32)';g.fillRect(wx,wy,2.3,4.2)}
    }
    /* roof parapet */g.fillStyle='rgba(19,27,37,.48)';g.fillRect(x,top,bw,2);
    x+=bw+2+rnd()*5;
   }
  });
  /* a few warm lights in the foreground and atmospheric window reflection */
  for(let i=0;i<24;i++){const x=rnd()*w,y=365+rnd()*95;g.fillStyle='rgba(255,190,117,'+(.12+rnd()*.22)+')';g.fillRect(x,y,1.5,3)}
  const reflection=g.createLinearGradient(0,250,0,h);reflection.addColorStop(0,'rgba(244,189,151,0)');reflection.addColorStop(1,'rgba(228,169,136,.07)');g.fillStyle=reflection;g.fillRect(0,250,w,h-250);
 });
 skyT.wrapS=THREE.ClampToEdgeWrapping;
 sky=new THREE.Mesh(new THREE.PlaneGeometry(2.4,1.5),new THREE.MeshBasicMaterial({map:skyT,toneMapped:false}));sky.position.set(-2.5,1.9,-3.97);sky.name='window';sky.castShadow=false;sky.receiveShadow=false;scene.add(sky);pick.push(sky);
 const rt=tex(128,256,(g)=>{g.strokeStyle='rgba(221,227,233,.24)';g.lineWidth=.8;for(let i=0;i<15;i++){const x=Math.random()*128,y=Math.random()*256;g.beginPath();g.moveTo(x,y);g.lineTo(x-1.5,y+16+Math.random()*9);g.stroke()}});
 rt.wrapS=rt.wrapT=THREE.RepeatWrapping;rt.repeat.set(1.6,1);
 rain=new THREE.Mesh(new THREE.PlaneGeometry(2.4,1.5),new THREE.MeshBasicMaterial({map:rt,transparent:true,opacity:.32,depthWrite:false,side:THREE.DoubleSide}));rain.position.set(-2.5,1.9,-3.95);rain.castShadow=false;rain.receiveShadow=false;scene.add(rain);
 const FR=0xf0e6d2;B(2.6,.1,.1,-2.5,2.7,-3.93,FR);B(2.6,.1,.1,-2.5,1.1,-3.93,FR);B(.1,1.7,.1,-3.75,1.9,-3.93,FR);B(.1,1.7,.1,-1.25,1.9,-3.93,FR);B(.05,1.5,.05,-2.5,1.9,-3.93,FR);B(2.4,.05,.05,-2.5,1.9,-3.93,FR);B(2.9,.06,.3,-2.5,1.05,-3.82,0x4d2d19);
 B(.6,2.5,.12,-4.05,1.8,-3.82,0x665b58);B(.6,2.5,.12,-.95,1.8,-3.82,0x665b58);B(3.8,.05,.05,-2.5,3.05,-3.82,0xb8c8e0);
 /* Window remains a scenic view only: no beam mesh or cool window spill light. */
 /* clock */
 clockM=C(.3,.3,.04,TV_WALL_X,2.6,-3.94,0xf2e2c0,null,24);clockM.rotation.x=Math.PI/2;clockM.name='clock';pick.push(clockM);
 ['h','m','s'].forEach((k,i)=>{const g=new THREE.Group();g.position.set(TV_WALL_X,2.6,-3.915+i*.01);scene.add(g);const l=[.14,.21,.24][i];B(.015,l,.01,0,l/2,0,i==2?0xc0392b:0x0e1b38,0,g);hands[k]=g});
 /* desk + laptop */
 B(2.6,.08,1.1,-2.5,.75,-3.3,0x85502e);[[-3.7,-3.7],[-1.3,-3.7],[-3.7,-2.9],[-1.3,-2.9]].forEach(p=>B(.08,.72,.08,p[0],.36,p[1],0x4d2d19));
 const laptopDeck=B(.72,.03,.46,-2.5,.8,-3.3,0x858b90);laptopDeck.material.roughness=.34;laptopDeck.material.metalness=.58;
 /* laptop keyboard deck: the existing screen/frame and screen canvas below are intentionally unchanged */
 B(.62,.004,.22,-2.5,.817,-3.392,0x3b3e40,0);
 const keyMat=M(0x242729,{roughness:.52,metalness:.12}),keyAltMat=M(0x333638,{roughness:.5,metalness:.12});
 const keyRows=[-3.468,-3.425,-3.382,-3.339];
 keyRows.forEach((z,row)=>{
  for(let col=0;col<11;col++){
   const x=-2.76+col*.052;
   const isAlt=(row===0&&col===0)||(row===0&&col===10)||(row===3&&(col===0||col===10));
   const key=new THREE.Mesh(new THREE.BoxGeometry(row===3&&col===5?.047:.035,.005,.025),isAlt?keyAltMat:keyMat);
   key.position.set(x,.822,z);key.castShadow=false;key.receiveShadow=false;scene.add(key);
  }
 });
 /* space bar */
 B(.205,.005,.018,-2.5,.822,-3.304,0x303335,0);
 /* sunken trackpad with a fine metallic outline */
 B(.222,.002,.096,-2.5,.818,-3.176,0x656b6f,0);
 B(.23,.002,.003,-2.5,.819,-3.225,0xb4b7b8,0);B(.23,.002,.003,-2.5,.819,-3.127,0xb4b7b8,0);
 B(.003,.002,.095,-2.617,.819,-3.176,0xb4b7b8,0);B(.003,.002,.095,-2.383,.819,-3.176,0xb4b7b8,0);
 const sc=new THREE.Group();sc.position.set(-2.5,.8,-3.52);sc.rotation.x=-.18;scene.add(sc);B(.72,.46,.02,0,.24,0,0x2c3038,0,sc);
 const lcv=document.createElement('canvas');lcv.width=512;lcv.height=320;const lg=lcv.getContext('2d'),lt=new THREE.CanvasTexture(lcv);lt.encoding=THREE.sRGBEncoding;
 const lm=new THREE.Mesh(new THREE.PlaneGeometry(.66,.41),new THREE.MeshBasicMaterial({map:lt,toneMapped:false}));lm.position.set(0,.24,.012);lm.name=NAMES.laptop;sc.add(lm);pick.push(lm);
 const img=$('#profile');
 drawLaptop=function(){const w=512,h=320;lg.clearRect(0,0,w,h);const r=lg.createLinearGradient(0,0,w,h);r.addColorStop(0,'#0b1230');r.addColorStop(1,'#25113f');lg.fillStyle=r;lg.fillRect(0,0,w,h);
  lg.save();lg.shadowColor='#27e6ff';lg.shadowBlur=22;lg.strokeStyle='#27e6ff';lg.lineWidth=4;lg.beginPath();lg.arc(256,92,56,0,7);lg.stroke();lg.restore();
  lg.save();lg.beginPath();lg.arc(256,92,52,0,7);lg.clip();let ok=false;
  try{if(img&&img.complete&&img.naturalWidth){const s=Math.max(104/img.naturalWidth,104/img.naturalHeight),iw=img.naturalWidth*s,ih=img.naturalHeight*s;lg.drawImage(img,256-iw/2,92-ih/2,iw,ih);ok=true}}catch(e){}
  if(!ok){lg.fillStyle='#3a4a7a';lg.fillRect(200,36,112,112);lg.fillStyle='#9fb3e8';lg.beginPath();lg.arc(256,80,20,0,7);lg.fill();lg.beginPath();lg.ellipse(256,150,40,34,0,0,7);lg.fill()}
  lg.restore();lg.direction=lang==='fa'?'rtl':'ltr';lg.textAlign='center';lg.fillStyle='#fff';lg.font='700 30px '+FONT();lg.fillText(L().title,256,214,470);lg.fillStyle='#9fd8ff';lg.font='400 16px '+FONT();lg.fillText(L().ldesc,256,250,470);lt.needsUpdate=true};
 if(img)img.addEventListener('load',drawLaptop);
 /* lamp, realistic Sina tea mug, writing pad, and desk accessories */
 C(.12,.14,.03,-3.55,.8,-3.2,0x2a2a30);C(.015,.015,.5,-3.55,1.05,-3.2,0x2a2a30);const sh=C(.05,.17,.2,-3.5,1.32,-3.2,0xf2b84b);sh.material.emissive.setHex(0x8a5a10);sh.rotation.z=.4;
 /* White ceramic tea mug on a cork coaster. The laptop and its screen above are intentionally untouched. */
 const coaster=C(.094,.094,.012,-1.7,.801,-3.1,0x9b7654,null,32);coaster.material.roughness=.97;
 const coasterRing=new THREE.Mesh(new THREE.TorusGeometry(.078,.0025,6,36),M(0x6c513b,{roughness:.95,metalness:0}));coasterRing.rotation.x=Math.PI/2;coasterRing.position.set(-1.7,.808,-3.1);scene.add(coasterRing);
 const mugProfile=[[0,0],[.045,0],[.055,.008],[.063,.03],[.072,.125],[.074,.145],[.065,.145],[.062,.128],[.055,.035],[.045,.018],[0,.018]].map(v=>new THREE.Vector2(v[0],v[1]));
 const mugMat=M(0xf3f0e9,{roughness:.24,metalness:0});
 const mug=new THREE.Mesh(new THREE.LatheGeometry(mugProfile,36),mugMat);mug.position.set(-1.7,.808,-3.1);mug.castShadow=true;mug.receiveShadow=true;scene.add(mug);
 const mugRim=new THREE.Mesh(new THREE.TorusGeometry(.069,.0055,10,36),M(0xfffdf7,{roughness:.2,metalness:0}));mugRim.rotation.x=Math.PI/2;mugRim.position.set(-1.7,.951,-3.1);mugRim.castShadow=true;scene.add(mugRim);
 const teaSurface=new THREE.Mesh(new THREE.CircleGeometry(.059,36),M(0x5b3521,{roughness:.2,metalness:0}));teaSurface.rotation.x=-Math.PI/2;teaSurface.position.set(-1.7,.936,-3.1);scene.add(teaSurface);
 const teaHighlight=new THREE.Mesh(new THREE.CircleGeometry(.018,24),new THREE.MeshBasicMaterial({color:0x927052,transparent:true,opacity:.32}));teaHighlight.rotation.x=-Math.PI/2;teaHighlight.position.set(-1.72,.937,-3.105);scene.add(teaHighlight);
 const mugHandle=new THREE.Mesh(new THREE.TorusGeometry(.036,.009,10,28),M(0xe8e4dc,{roughness:.27,metalness:0}));mugHandle.position.set(-1.615,.884,-3.1);mugHandle.castShadow=true;mugHandle.receiveShadow=true;scene.add(mugHandle);
 /* Small front-facing ceramic signature: "sina" */
 const mugLabelTex=tex(256,112,(g,w,h)=>{g.clearRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';g.fillStyle='#51473d';g.font='italic 78px Georgia, serif';g.fillText('sina',w/2,h/2+2)});
 const mugLabel=new THREE.Mesh(new THREE.PlaneGeometry(.108,.041),new THREE.MeshBasicMaterial({map:mugLabelTex,transparent:true,depthWrite:false,toneMapped:false}));mugLabel.position.set(-1.7,.879,-3.026);scene.add(mugLabel);
 /* Steam wisps: fine semi-transparent curves instead of glowing dots. */
 const steamTex=tex(96,160,(g,w,h)=>{
  g.clearRect(0,0,w,h);g.lineCap='round';g.lineJoin='round';
  for(let j=0;j<3;j++){
   const x=31+j*17;const grad=g.createLinearGradient(0,0,0,h);grad.addColorStop(0,'rgba(238,235,228,0)');grad.addColorStop(.18,'rgba(238,235,228,.16)');grad.addColorStop(.48,'rgba(245,242,235,.34)');grad.addColorStop(.78,'rgba(238,235,228,.22)');grad.addColorStop(1,'rgba(238,235,228,0)');
   g.strokeStyle=grad;g.lineWidth=4.8-j*.65;g.beginPath();g.moveTo(x,h-2);g.bezierCurveTo(x-11, h*.78, x+12,h*.68,x+1,h*.52);g.bezierCurveTo(x-10,h*.37,x+13,h*.25,x+4,3);g.stroke();
   g.strokeStyle='rgba(255,250,242,.12)';g.lineWidth=1.3;g.beginPath();g.moveTo(x-1,h-6);g.bezierCurveTo(x-7,h*.72,x+8,h*.61,x+2,h*.48);g.stroke();
  }
 });
 steam=[0,1,2].map(i=>{const mat=new THREE.SpriteMaterial({map:steamTex,color:0xe8e4dc,transparent:true,opacity:.3,depthWrite:false,blending:THREE.NormalBlending});const sp=new THREE.Sprite(mat);sp.position.set(-1.7,.98,-3.1+(i-1)*.002);sp.scale.set(.055,.16,1);sp.userData.steamOffset=i/3;scene.add(sp);return sp});
 /* A small artisan snow globe replaces the pencil cup: walnut plinth, brass trim, snowy base and miniature fir. */
 const globeBase=C(.088,.078,.048,-3.1,.824,-3.0,0x49372b,null,28);globeBase.material.roughness=.5;globeBase.material.metalness=.05;
 const globeTrim=new THREE.Mesh(new THREE.TorusGeometry(.082,.0055,10,32),M(0xb79a63,{roughness:.34,metalness:.58}));globeTrim.rotation.x=Math.PI/2;globeTrim.position.set(-3.1,.849,-3.0);globeTrim.castShadow=true;scene.add(globeTrim);
 const globeGroup=new THREE.Group();globeGroup.position.set(-3.1,.942,-3.0);scene.add(globeGroup);
 const snowGlobe=new THREE.Mesh(new THREE.SphereGeometry(.092,32,24),new THREE.MeshPhysicalMaterial({color:0xe3edf1,roughness:.035,metalness:0,transparent:true,opacity:.24,clearcoat:1,clearcoatRoughness:.04,side:THREE.FrontSide}));snowGlobe.castShadow=false;snowGlobe.receiveShadow=true;globeGroup.add(snowGlobe);
 const snowGround=new THREE.Mesh(new THREE.SphereGeometry(.055,18,12),M(0xf0eee7,{roughness:.96,metalness:0}));snowGround.scale.set(1,.28,1);snowGround.position.set(0,-.073,0);snowGround.castShadow=true;globeGroup.add(snowGround);
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.004,.006,.025,8),M(0x79553a,{roughness:.88,metalness:0}));trunk.position.set(0,-.055,0);globeGroup.add(trunk);
 [[.033,.037,-.044,0x315842],[.025,.032,-.022,0x3b6848],[.017,.029,-.002,0x477755]].forEach(([r,h,y,c])=>{const cone=new THREE.Mesh(new THREE.ConeGeometry(r,h,9,1),M(c,{roughness:.9,metalness:0}));cone.position.set(0,y,0);cone.castShadow=true;globeGroup.add(cone)});
 const star=new THREE.Mesh(new THREE.OctahedronGeometry(.008,0),M(0xd8bd7e,{roughness:.36,metalness:.28}));star.position.set(0,.016,0);globeGroup.add(star);
 [[-.047,-.006,.018],[.048,.018,.01],[-.031,.042,-.025],[.035,-.028,.036],[.055,-.039,-.01],[-.056,.01,-.01],[.014,.055,.03]].forEach(([x,y,z],i)=>{const flake=new THREE.Mesh(new THREE.SphereGeometry(i%2?.003:.0022,8,6),M(0xf5f4ee,{roughness:.75,metalness:0}));flake.position.set(x,y,z);globeGroup.add(flake)});
 /* The former mysterious yellow square is now a small leather writing notebook with a brass-edged cover and pen. */
 B(.225,.014,.155,-1.46,.802,-3.5,0xe0d6c4);
 B(.229,.006,.159,-1.46,.812,-3.5,0x654737);
 B(.009,.003,.157,-1.395,.817,-3.5,0xb79a65);
 B(.003,.004,.125,-1.548,.816,-3.5,0xa98a5b);
 const penGroup=new THREE.Group();penGroup.position.set(-1.46,.821,-3.5);penGroup.rotation.y=-.42;scene.add(penGroup);
 const penBody=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.19,10),M(0x353a3c,{roughness:.32,metalness:.28}));penBody.rotation.z=Math.PI/2;penBody.position.set(.01,0,.012);penBody.castShadow=true;penGroup.add(penBody);
 const penCap=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,.045,10),M(0xb79a65,{roughness:.27,metalness:.65}));penCap.rotation.z=Math.PI/2;penCap.position.set(-.083,0,.012);penGroup.add(penCap);
 const penNib=new THREE.Mesh(new THREE.ConeGeometry(.006,.025,10),M(0xb79a65,{roughness:.25,metalness:.7}));penNib.rotation.z=-Math.PI/2;penNib.position.set(.117,0,.012);penGroup.add(penNib);
 /* properly positioned desk chair — clear of the desktop and front legs */
 const deskChair=new THREE.Group();deskChair.position.set(-.72,0,-2.3);deskChair.rotation.y=.82;scene.add(deskChair);
 const chairLeather=M(0x55483e,{roughness:.92,metalness:0}),chairPad=M(0x716052,{roughness:.98,metalness:0}),chairMetal=M(0x343638,{roughness:.42,metalness:.55});
 B(.61,.13,.59,0,.49,0,0x4e4339,0,deskChair);B(.57,.12,.55,0,.575,-.005,0x716052,0,deskChair);
 B(.59,.56,.14,0,.88,.245,0x55483e,0,deskChair);B(.49,.43,.035,0,.88,.329,0x716052,0,deskChair);
 /* understated back seam */B(.012,.38,.008,0,.88,.35,0x8e7c68,0,deskChair);
 B(.11,.055,.47,-.365,.67,.02,0x343638,0,deskChair);B(.11,.055,.47,.365,.67,.02,0x343638,0,deskChair);
 B(.035,.17,.035,-.365,.585,.02,0x343638,0,deskChair);B(.035,.17,.035,.365,.585,.02,0x343638,0,deskChair);
 C(.045,.045,.25,0,.31,0,0x555658,deskChair,16);C(.075,.075,.07,0,.13,0,0x3a3b3c,deskChair,16);
 for(let i=0;i<5;i++){
  const a=i*Math.PI*2/5,ex=Math.sin(a)*.34,ez=Math.cos(a)*.27;
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(.022,.028,.37,10),chairMetal);rod.position.set(ex*.5,.11,ez*.5);rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(ex,.015,ez).normalize());rod.castShadow=true;deskChair.add(rod);
  const wheel=C(.052,.052,.045,ex,.055,ez,0x252729,deskChair,14);wheel.rotation.z=Math.PI/2;
 }
 /* full blue upholstered sofa in place of the incomplete bookcase */
 const blueSofa=new THREE.Group();blueSofa.position.set(-4.48,0,-1.82);blueSofa.rotation.y=Math.PI/2;scene.add(blueSofa);
 const blueFabric=M(0x294766,{roughness:.96,metalness:0});
 const blueSeat=M(0x355a7c,{roughness:.98,metalness:0});
 const blueBack=M(0x2b4b6b,{roughness:.98,metalness:0});
 const seam=M(0x536c82,{roughness:.93,metalness:0});
 B(2.18,.2,.83,0,.28,0,0x24384b,0,blueSofa); /* upholstered lower frame */
 B(2.02,.17,.69,0,.43,.045,0x355a7c,0,blueSofa);
 /* three individually padded seat cushions */
 [-.66,0,.66].forEach((x,i)=>{const cushion=B(.62,.14,.61,x,.555,.065,i===1?0x3d6385:0x385c7d,0,blueSofa);cushion.material.roughness=.99;
  B(.48,.009,.008,x,.626,.28,0x68829a,0,blueSofa);
 });
 /* back cushions are separated and softly rounded */
 [-.49,.49].forEach((x,i)=>{B(.94,.54,.18,x,.82,-.285,i?0x2d4f71:0x315575,0,blueSofa);B(.77,.012,.009,x,.91,-.188,0x516f8b,0,blueSofa)});
 /* rolled arms, front piping, feet and two loose throw pillows */
 B(.23,.44,.79,-.99,.58,0,0x294766,0,blueSofa);B(.23,.44,.79,.99,.58,0,0x294766,0,blueSofa);
 B(1.72,.014,.012,0,.478,.39,0x6c8599,0,blueSofa);
 [-.88,.88].forEach(x=>[-.29,.29].forEach(z=>C(.035,.03,.16,x,.09,z,0x393a3c,blueSofa,16)));
 const pillowA=B(.39,.34,.13,-.52,.76,-.105,0x9aa9b7,0,blueSofa);pillowA.rotation.z=.12;pillowA.rotation.x=-.1;
 const pillowB=B(.39,.34,.13,.48,.76,-.105,0x527391,0,blueSofa);pillowB.rotation.z=-.12;pillowB.rotation.x=.08;
 /* side table, story book, armchair, plants, paintings */
 B(.9,.05,.7,-4.2,.55,.8,0x85502e);B(.06,.55,.06,-4.6,.27,.5,0x4d2d19);B(.06,.55,.06,-4.6,.27,1.1,0x4d2d19);B(.06,.55,.06,-3.8,.27,.5,0x4d2d19);B(.06,.55,.06,-3.8,.27,1.1,0x4d2d19);
 /* physical MY STORY book: fixed burgundy leather, visible pages and a hinged cover */
 bookRoot=new THREE.Group();bookRoot.position.set(-4.2,0,.8);scene.add(bookRoot);
 B(.4,.055,.3,0,.605,0,0x522d27,0,bookRoot); /* bound book block */
 B(.378,.018,.278,0,.641,0,0xe2d8c5,0,bookRoot); /* page block */
 B(.012,.019,.272,-.187,.641,0,0xb7a990,0,bookRoot);B(.012,.019,.272,.187,.641,0,0xb7a990,0,bookRoot);
 const pageTex=tex(256,360,(g,w,h)=>{
  /* blank warm-white notebook paper: fine horizontal rules, no printed text */
  g.fillStyle='#f1eadb';g.fillRect(0,0,w,h);
  const edge=g.createLinearGradient(0,0,w,0);edge.addColorStop(0,'rgba(105,82,52,.10)');edge.addColorStop(.06,'rgba(255,255,255,0)');edge.addColorStop(.94,'rgba(255,255,255,0)');edge.addColorStop(1,'rgba(105,82,52,.08)');g.fillStyle=edge;g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(125,151,166,.33)';g.lineWidth=1;
  for(let y=24;y<h-12;y+=18){g.beginPath();g.moveTo(14,y);g.lineTo(w-14,y);g.stroke()}
  g.strokeStyle='rgba(190,110,101,.34)';g.lineWidth=1;g.beginPath();g.moveTo(29,12);g.lineTo(29,h-12);g.stroke();
 });
 const pageMat=M(0xffffff,{map:pageTex,roughness:.97,metalness:0});
 [-.095,.095].forEach(x=>{const page=new THREE.Mesh(new THREE.PlaneGeometry(.17,.26),pageMat);page.rotation.x=-Math.PI/2;page.position.set(x,.652,0);page.receiveShadow=true;bookRoot.add(page)});
 bookCoverPivot=new THREE.Group();bookCoverPivot.position.set(-.2,.656,0);bookRoot.add(bookCoverPivot);
 const coverSide=M(0x742129,{roughness:.9,metalness:0});
 bookM=new THREE.Mesh(new THREE.BoxGeometry(.4,.014,.3),coverSide);bookM.position.set(.2,0,0);bookM.name=NAMES.book;bookM.castShadow=false;bookM.receiveShadow=false;bookCoverPivot.add(bookM);pick.push(bookM);
 const coverTex=tex(256,192,(g,w,h)=>{
  const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#8d3036');gr.addColorStop(.55,'#742129');gr.addColorStop(1,'#4f171e');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.strokeStyle='#c8a56b';g.lineWidth=4;g.strokeRect(12,12,w-24,h-24);g.strokeStyle='rgba(220,186,120,.72)';g.lineWidth=1.5;g.strokeRect(20,20,w-40,h-40);
  g.fillStyle='#e8d1a1';g.textAlign='center';g.font='bold 23px Georgia';g.fillText('MY STORY',w/2,h/2+5);
  g.beginPath();g.arc(w/2,h/2-28,8,0,Math.PI*2);g.stroke();
 });
 const coverTop=new THREE.Mesh(new THREE.PlaneGeometry(.376,.276),M(0xffffff,{map:coverTex,roughness:.9,metalness:0}));coverTop.rotation.x=-Math.PI/2;coverTop.position.set(.2,.008,0);coverTop.castShadow=false;bookCoverPivot.add(coverTop);
 const insideTex=tex(256,192,(g,w,h)=>{
  /* inside of the book cover is also clean lined paper, with no placeholder copy */
  g.fillStyle='#f1eadb';g.fillRect(0,0,w,h);
  const edge=g.createLinearGradient(0,0,w,0);edge.addColorStop(0,'rgba(105,82,52,.10)');edge.addColorStop(.06,'rgba(255,255,255,0)');edge.addColorStop(.94,'rgba(255,255,255,0)');edge.addColorStop(1,'rgba(105,82,52,.08)');g.fillStyle=edge;g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(125,151,166,.34)';g.lineWidth=1;for(let y=18;y<h-8;y+=13){g.beginPath();g.moveTo(13,y);g.lineTo(w-13,y);g.stroke()}
  g.strokeStyle='rgba(190,110,101,.32)';g.beginPath();g.moveTo(30,8);g.lineTo(30,h-8);g.stroke();
 });
 const coverInside=new THREE.Mesh(new THREE.PlaneGeometry(.37,.27),M(0xffffff,{map:insideTex,roughness:.97,metalness:0}));coverInside.rotation.x=Math.PI/2;coverInside.position.set(.2,-.008,0);coverInside.castShadow=false;bookCoverPivot.add(coverInside);
 /* animated leaf: flips physically when moving between story chapters */
 bookPageTurnPivot=new THREE.Group();bookPageTurnPivot.position.set(0,.654,0);bookPageTurnPivot.visible=false;bookRoot.add(bookPageTurnPivot);
 const turningLeaf=new THREE.Mesh(new THREE.PlaneGeometry(.19,.268),M(0xffffff,{map:pageTex,roughness:.98,metalness:0,side:THREE.DoubleSide}));turningLeaf.rotation.x=-Math.PI/2;turningLeaf.position.set(.095,.002,0);turningLeaf.castShadow=false;turningLeaf.receiveShadow=true;bookPageTurnPivot.add(turningLeaf);
 /* tailored olive accent armchair, visibly separate from the blue sofa */
 const accentChair=new THREE.Group();accentChair.position.set(-2.95,0,.42);accentChair.rotation.y=.48;scene.add(accentChair);
 const olive=M(0x555b4b,{roughness:.98,metalness:0}),oliveLight=M(0x68705b,{roughness:.98,metalness:0}),oliveShadow=M(0x42493d,{roughness:.98,metalness:0});
 B(.86,.19,.79,0,.31,0,0x444a3e,0,accentChair);B(.78,.16,.68,0,.435,.035,0x5d6551,0,accentChair);
 B(.8,.57,.19,0,.76,-.29,0x4b5245,0,accentChair);B(.68,.44,.06,0,.77,-.175,0x68705b,0,accentChair);
 B(.19,.38,.74,-.445,.53,.025,0x4d5447,0,accentChair);B(.19,.38,.74,.445,.53,.025,0x4d5447,0,accentChair);
 B(.69,.035,.02,0,.52,.382,0x80856b,0,accentChair);
 [-.32,.32].forEach(x=>[-.27,.27].forEach(z=>C(.035,.03,.19,x,.105,z,0x343532,accentChair,12)));
 const olivePillow=B(.38,.31,.12,.12,.69,-.09,0x89866f,0,accentChair);olivePillow.rotation.z=-.1;olivePillow.rotation.x=.08;
 plant(-4.5,-3.5,1.2);plant(-4.5,3.3,1.4);paint(-4.96,2.1,.2,1,.9,Math.PI/2,0x3a5a9a,0xf2b84b,'images/wall-1.jpg');paint(-4.96,2.2,2.4,.9,.8,Math.PI/2,0x3a5a9a,0x2aa39a,'images/wall-2.jpg');
 /* hand-poured ivory candle on the side table, with wick and small live flame */
 const candleX=-4.48,candleZ=.58;
 const candleWax=C(.061,.064,.17,candleX,.665,candleZ,0xe6dfd0,null,24);candleWax.material.roughness=.94;
 C(.057,.06,.012,candleX,.753,candleZ,0xf0e8da,null,24);
 C(.005,.005,.032,candleX,.772,candleZ,0x282522,null,8);
 candleFlame=new THREE.Group();candleFlame.position.set(candleX,.782,candleZ);scene.add(candleFlame);
 const wickFlame=new THREE.Shape();wickFlame.moveTo(0,0);wickFlame.bezierCurveTo(-.025,.028,-.016,.057,.002,.083);wickFlame.bezierCurveTo(.017,.06,.031,.031,0,0);
 const flameOuter=new THREE.Mesh(new THREE.ShapeGeometry(wickFlame),new THREE.MeshBasicMaterial({color:0xff8a29,side:THREE.DoubleSide,toneMapped:false}));candleFlame.add(flameOuter);
 const innerFlameShape=new THREE.Shape();innerFlameShape.moveTo(0,0);innerFlameShape.bezierCurveTo(-.011,.02,-.008,.04,.002,.052);innerFlameShape.bezierCurveTo(.01,.035,.012,.018,0,0);
 const flameInner=new THREE.Mesh(new THREE.ShapeGeometry(innerFlameShape),new THREE.MeshBasicMaterial({color:0xffe3a1,side:THREE.DoubleSide,toneMapped:false}));flameInner.position.z=.002;candleFlame.add(flameInner);
 candleLight=new THREE.PointLight(0xffb85c,.22,1.5);candleLight.position.set(candleX,.82,candleZ);scene.add(candleLight);
 /* rug + notebook table */
 const rugTex=tex(512,384,(g,w,h)=>{
  g.fillStyle='#343b43';g.fillRect(0,0,w,h);g.fillStyle='#71604f';g.fillRect(12,12,w-24,h-24);g.fillStyle='#333b47';g.fillRect(22,22,w-44,h-44);g.fillStyle='#92775c';g.fillRect(29,29,w-58,h-58);g.fillStyle='#4a5360';g.fillRect(36,36,w-72,h-72);
  g.strokeStyle='rgba(202,173,130,.55)';g.lineWidth=2;g.strokeRect(17,17,w-34,h-34);g.strokeRect(31,31,w-62,h-62);
  for(let x=48;x<w-48;x+=18){g.fillStyle='rgba(198,162,115,.44)';g.beginPath();g.moveTo(x,43);g.lineTo(x+5,49);g.lineTo(x,55);g.lineTo(x-5,49);g.closePath();g.fill();g.beginPath();g.moveTo(x,h-43);g.lineTo(x+5,h-49);g.lineTo(x,h-55);g.lineTo(x-5,h-49);g.closePath();g.fill()}
  g.strokeStyle='rgba(209,180,139,.45)';g.lineWidth=3;g.beginPath();g.ellipse(w/2,h/2,72,94,0,0,Math.PI*2);g.stroke();g.beginPath();g.ellipse(w/2,h/2,54,72,0,0,Math.PI*2);g.stroke();
  g.fillStyle='rgba(187,150,109,.48)';g.beginPath();g.moveTo(w/2,h/2-42);g.lineTo(w/2+28,h/2);g.lineTo(w/2,h/2+42);g.lineTo(w/2-28,h/2);g.closePath();g.fill();
  for(let i=0;i<2600;i++){g.fillStyle=Math.random()>.5?'rgba(255,255,255,.025)':'rgba(0,0,0,.035)';g.fillRect(Math.random()*w,Math.random()*h,1,1)}
});
const rug=new THREE.Mesh(new THREE.PlaneGeometry(4.65,3.15),M(0xffffff,{map:rugTex,roughness:.98,metalness:0}));rug.rotation.x=-Math.PI/2;rug.position.set(-.3,.018,1.1);rug.receiveShadow=true;scene.add(rug);
 B(1.1,.05,.8,-1.2,.5,1.9,0x85502e);[[-1.7,1.6],[-.7,1.6],[-1.7,2.2],[-.7,2.2]].forEach(p=>B(.06,.5,.06,p[0],.25,p[1],0x4d2d19));
 /* physical activities journal: closed by default, opens only on click / section entry */
 activityRoot=new THREE.Group();activityRoot.position.set(-1.2,.55,1.9);activityRoot.rotation.y=.2;scene.add(activityRoot);
 B(.52,.035,.38,0,-.003,0,0x25324b,0,activityRoot); /* sturdy notebook base */
 B(.49,.012,.35,0,.02,0,0xe3d9c6,0,activityRoot); /* page block */
 const activityPageTex=tex(256,192,(g,w,h)=>{
  /* blank activity journal pages, matching the story book */
  g.fillStyle='#f1eadb';g.fillRect(0,0,w,h);
  const edge=g.createLinearGradient(0,0,w,0);edge.addColorStop(0,'rgba(105,82,52,.10)');edge.addColorStop(.06,'rgba(255,255,255,0)');edge.addColorStop(.94,'rgba(255,255,255,0)');edge.addColorStop(1,'rgba(105,82,52,.08)');g.fillStyle=edge;g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(125,151,166,.34)';g.lineWidth=1;for(let y=18;y<h-8;y+=13){g.beginPath();g.moveTo(13,y);g.lineTo(w-13,y);g.stroke()}
  g.strokeStyle='rgba(190,110,101,.32)';g.beginPath();g.moveTo(30,8);g.lineTo(30,h-8);g.stroke();
 });
 activityCoverPivot=new THREE.Group();activityCoverPivot.position.set(-.26,.027,0);activityRoot.add(activityCoverPivot);
 notesM=B(.52,.014,.38,.26,.004,0,0x263f69,0,activityCoverPivot);notesM.name=NAMES.notes;pick.push(notesM);
 const activityCoverTex=tex(256,192,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#496a92');gr.addColorStop(.55,'#263f69');gr.addColorStop(1,'#192b49');g.fillStyle=gr;g.fillRect(0,0,w,h);g.strokeStyle='#c7b28c';g.lineWidth=4;g.strokeRect(12,12,w-24,h-24);g.strokeStyle='rgba(224,203,157,.6)';g.lineWidth=1.5;g.strokeRect(21,21,w-42,h-42);g.fillStyle='#eadcbd';g.textAlign='center';g.font='bold 23px Georgia';g.fillText('ACTIVITIES',w/2,h/2+5);g.beginPath();g.arc(w/2,h/2-27,7,0,Math.PI*2);g.stroke()});
 const activityTop=new THREE.Mesh(new THREE.PlaneGeometry(.49,.35),M(0xffffff,{map:activityCoverTex,roughness:.92,metalness:0}));activityTop.rotation.x=-Math.PI/2;activityTop.position.set(.26,.012,0);activityTop.castShadow=false;activityCoverPivot.add(activityTop);
 const activityInside=new THREE.Mesh(new THREE.PlaneGeometry(.48,.34),M(0xffffff,{map:activityPageTex,roughness:.97,metalness:0}));activityInside.rotation.x=Math.PI/2;activityInside.position.set(.26,-.008,0);activityInside.castShadow=false;activityCoverPivot.add(activityInside);
 /* loose notes remain beside the journal, rather than merging into the lid */
 B(.3,.01,.22,-.8,.54,2.1,0xf4efe0).rotation.y=-.3;B(.3,.01,.22,-.78,.55,2.12,0xf8f3e8).rotation.y=-.1;
 /* fireplace — recessed masonry, real logs, layered animated flames */
 const stone=M(0x8f877b,{roughness:.94,metalness:0}),stoneLight=M(0xb4a898,{roughness:.91,metalness:0}),darkIron=M(0x262522,{roughness:.58,metalness:.22});
 B(.78,2.18,2.42,4.59,1.1,-1.2,0x776f66,1); /* built-in masonry mass */
 /* face surround is assembled as separate mantel, jambs and hearth */
 B(.14,.18,2.48,4.12,2.18,-1.2,0x51473e,1);B(.16,.16,2.34,4.105,2.29,-1.2,0x9b8c7b,1);
 B(.13,1.16,.17,4.12,.67,-1.78,0x9d9183,1);B(.13,1.16,.17,4.12,.67,-.62,0x9d9183,1);
 B(.22,.13,1.42,4.09,.065,-1.2,0x49433c,1); /* one continuous, uniformly coloured hearth base */
 /* dark refractory cavity faces the room; the flame plane sits just in front */
 B(.035,.9,1.04,4.185,.58,-1.2,0x111111,0);
 /* Uniform dark refractory lip only; the former two-tone bar and layered brown rods are removed. */
 const fireLog=C(.058,.058,.72,4.112,.17,-1.2,0x292725,null,20);fireLog.rotation.x=Math.PI/2;fireLog.material.roughness=.96;fireLog.material.metalness=0;
 /* canvas flame: layered tongues of fire, animated rather than flat glow sprites */
 const fireCanvas=document.createElement('canvas');fireCanvas.width=256;fireCanvas.height=320;const fireCtx=fireCanvas.getContext('2d');
 const fireTexture=new THREE.CanvasTexture(fireCanvas);fireTexture.encoding=THREE.sRGBEncoding;
 const firePlane=new THREE.Mesh(new THREE.PlaneGeometry(.88,.86),new THREE.MeshBasicMaterial({map:fireTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
 firePlane.position.set(4.145,.57,-1.2);firePlane.rotation.y=-Math.PI/2;firePlane.renderOrder=4;scene.add(firePlane);
 const drawTongue=(ctx,x,base,w,h,phase,outer,inner)=>{
  const wob=Math.sin(phase)*5,tip=x+wob;
  const grad=ctx.createLinearGradient(0,base-h,0,base);grad.addColorStop(0,outer);grad.addColorStop(.48,'rgba(255,105,27,.96)');grad.addColorStop(1,inner);
  ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(x-w*.42,base);ctx.bezierCurveTo(x-w*.78,base-h*.28,x-w*.12,base-h*.47,tip-w*.09,base-h);ctx.bezierCurveTo(x+w*.36,base-h*.7,x+w*.78,base-h*.39,x+w*.38,base-h*.12);ctx.quadraticCurveTo(x+w*.3,base-h*.03,x-w*.42,base);ctx.closePath();ctx.fill();
 };
 firePaint=function(t){
  const g=fireCtx;g.clearRect(0,0,256,320);
  const pulse=.94+.06*Math.sin(t*8.2);
  const glow=g.createRadialGradient(128,226,4,128,226,124);glow.addColorStop(0,'rgba(255,144,46,.36)');glow.addColorStop(.4,'rgba(240,70,19,.16)');glow.addColorStop(1,'rgba(220,56,12,0)');g.fillStyle=glow;g.fillRect(0,90,256,230);
  drawTongue(g,78,278,74,151*pulse,t*5.1,'rgba(255,80,18,.98)','rgba(255,173,44,.9)');
  drawTongue(g,125,282,90,208*(.94+.06*Math.sin(t*9.4+1.4)),t*4.4+1.1,'rgba(255,54,14,.98)','rgba(255,198,65,.94)');
  drawTongue(g,181,280,63,139*(.94+.07*Math.sin(t*10.7+2.1)),t*6.1+2,'rgba(240,65,15,.97)','rgba(255,148,32,.88)');
  drawTongue(g,126,284,40,135*(.92+.08*Math.sin(t*12.4)),t*7.2,'rgba(255,177,45,.98)','rgba(255,238,151,.95)');
  fireTexture.needsUpdate=true;
 };
 firePaint(0);
 /* Matching blue sofa opposite the TV: same proportions, upholstery, seams and pillows as the sofa by the laptop. */
 const so=new THREE.Group();so.position.set(TV_WALL_X,0,.68);so.rotation.y=Math.PI;scene.add(so);
 B(2.18,.2,.83,0,.28,0,0x24384b,0,so); /* upholstered lower frame */
 B(2.02,.17,.69,0,.43,.045,0x355a7c,0,so);
 [-.66,0,.66].forEach((x,i)=>{const cushion=B(.62,.14,.61,x,.555,.065,i===1?0x3d6385:0x385c7d,0,so);cushion.material.roughness=.99;
  B(.48,.009,.008,x,.626,.28,0x68829a,0,so);
 });
 [-.49,.49].forEach((x,i)=>{B(.94,.54,.18,x,.82,-.285,i?0x2d4f71:0x315575,0,so);B(.77,.012,.009,x,.91,-.188,0x516f8b,0,so)});
 B(.23,.44,.79,-.99,.58,0,0x294766,0,so);B(.23,.44,.79,.99,.58,0,0x294766,0,so);
 B(1.72,.014,.012,0,.478,.39,0x6c8599,0,so);
 [-.88,.88].forEach(x=>[-.29,.29].forEach(z=>C(.035,.03,.16,x,.09,z,0x393a3c,so,16)));
 const sofaPillowA=B(.39,.34,.13,-.52,.76,-.105,0x9aa9b7,0,so);sofaPillowA.rotation.z=.12;sofaPillowA.rotation.x=-.1;
 const sofaPillowB=B(.39,.34,.13,.48,.76,-.105,0x527391,0,so);sofaPillowB.rotation.z=-.12;sofaPillowB.rotation.x=.08;
 /* Centered wall-mounted television: clear of the wall trim, precisely between the desk and fireplace. */
 const tvX=TV_WALL_X;
 /* Subtle square-weave wallpaper inset: the clock and television share its exact center axis. */
 const tvWallpaperTex=tex(384,320,(g,w,h)=>{
  const bg=g.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#615b53');bg.addColorStop(.55,'#57534d');bg.addColorStop(1,'#4d4b47');g.fillStyle=bg;g.fillRect(0,0,w,h);
  const cell=48;
  for(let y=0,row=0;y<h;y+=cell,row++)for(let x=0,col=0;x<w;x+=cell,col++){
   g.fillStyle=(row+col)%2===0?'rgba(228,211,184,.038)':'rgba(22,22,20,.028)';g.fillRect(x,y,cell,cell);
   g.strokeStyle='rgba(222,207,183,.055)';g.lineWidth=1;g.strokeRect(x+.5,y+.5,cell-1,cell-1);
  }
  for(let i=0;i<850;i++){const x=Math.random()*w,y=Math.random()*h;g.fillStyle=Math.random()>.5?'rgba(255,246,228,.022)':'rgba(10,12,13,.03)';g.fillRect(x,y,.6+Math.random(),.6+Math.random())}
 });
 const tvWallPanel=new THREE.Mesh(new THREE.BoxGeometry(2.56,1.94,.024),M(0xffffff,{map:tvWallpaperTex,roughness:.98,metalness:0}));
 tvWallPanel.position.set(tvX,2.03,-3.966);tvWallPanel.castShadow=false;tvWallPanel.receiveShadow=false;scene.add(tvWallPanel);
 const tvFrameMat=0x87745d;
 B(2.66,.045,.045,tvX,3.02,-3.932,tvFrameMat,0); /* top moulding */
 B(2.66,.045,.045,tvX,1.04,-3.932,tvFrameMat,0); /* bottom moulding */
 B(.045,2.02,.045,tvX-1.31,2.03,-3.932,tvFrameMat,0);
 B(.045,2.02,.045,tvX+1.31,2.03,-3.932,tvFrameMat,0);
 B(1.58,.9,.15,tvX,1.55,-3.84,0x17191b,1); /* solid bezel sits fully in front of the wall */
 /* slim walnut media console aligned exactly below the TV */
 B(1.48,.28,.36,tvX,.30,-3.49,0x493426,1);
 B(1.64,.065,.44,tvX,.475,-3.47,0x6b4932,1);
 B(.62,.17,.018,tvX-.37,.30,-3.302,0x755238,0);B(.62,.17,.018,tvX+.37,.30,-3.302,0x755238,0);
 B(.032,.045,.012,tvX-.37,.30,-3.287,0xb79a65,0);B(.032,.045,.012,tvX+.37,.30,-3.287,0xb79a65,0);
 [tvX-.62,tvX+.62].forEach(x=>B(.07,.16,.08,x,.08,-3.46,0x302820,0));
 const tcv=document.createElement('canvas');tcv.width=512;tcv.height=288;const tg=tcv.getContext('2d'),tt=new THREE.CanvasTexture(tcv);tt.encoding=THREE.sRGBEncoding;
 const tvm=new THREE.Mesh(new THREE.PlaneGeometry(1.36,.765),new THREE.MeshBasicMaterial({map:tt,color:0x777777,toneMapped:false}));tvm.position.set(tvX,1.55,-3.75);tvm.name=NAMES.tv;scene.add(tvm);pick.push(tvm);
 function wrap(g,s,x,y,mw,lh){let line='';s.split(' ').forEach(w=>{const t=line?line+' '+w:w;if(g.measureText(t).width>mw&&line){g.fillText(line,x,y);y+=lh;line=w}else line=t});g.fillText(line,x,y)}
 drawTV=function(){
  const W=512,H=288;
  tg.clearRect(0,0,W,H);
  tvm.material.color.setHex(tvOn?0xffffff:0x555555);
  if(!tvOn){tg.fillStyle='#06080c';tg.fillRect(0,0,W,H);tt.needsUpdate=true;return}
  const p=PJ[tvIdx]||PJ[0];
  const projectImage=getTVProjectImage(p&&p.image);
  tg.direction=lang==='fa'?'rtl':'ltr';
  if(projectImage){
   /* The real project screenshot fills the TV instead of the old gradient. */
   drawImageCover(tg,projectImage,0,0,W,H);
   const shade=tg.createLinearGradient(0,H*.56,0,H);
   shade.addColorStop(0,'rgba(5,8,15,0)');shade.addColorStop(1,'rgba(5,8,15,.84)');
   tg.fillStyle=shade;tg.fillRect(0,0,W,H);
   tg.textAlign=lang==='fa'?'right':'left';tg.fillStyle='#fff';
   tg.font='600 25px '+FONT();
   const projectTitle=(p.title&&p.title[lang])||p.t||'';
   tg.fillText(projectTitle,lang==='fa'?W-22:22,H-39,W-62);
   tg.textAlign='right';tg.font='14px '+FONT();tg.fillStyle='rgba(255,255,255,.86)';
   tg.fillText((tvIdx+1)+' / '+PJ.length,W-18,24);
  }else{
   /* Keep a readable designed fallback when no project screenshot is available. */
   const r=tg.createLinearGradient(0,0,W,H);r.addColorStop(0,p.c[0]);r.addColorStop(1,p.c[1]);
   tg.fillStyle=r;tg.fillRect(0,0,W,H);tg.fillStyle='rgba(0,0,0,.3)';tg.fillRect(0,0,W,H);
   tg.textAlign='center';tg.fillStyle='#fff';tg.font='600 38px '+FONT();
   tg.fillText((p.title&&p.title[lang])||p.t,W/2,100,460);
   tg.font='400 20px '+FONT();wrap(tg,L().pj[tvIdx]||'',W/2,150,420,28);
   tg.font='16px '+FONT();tg.fillText((tvIdx+1)+' / '+PJ.length,W/2,H-22);
  }
  tg.fillStyle='rgba(0,0,0,.08)';for(let y=0;y<H;y+=4)tg.fillRect(0,y,W,1);
  tt.needsUpdate=true;
 };
 plant(4.4,-3.4,1.5); /* removed the small plant that cluttered the television area */
 /* Built-in walnut bookshelf replaces the former TV spot on the right wall. */
 const shelfWood=0x76543a, shelfEdge=0x956b48;
 B(.06,2.46,2.35,4.875,1.29,2.28,0x4b3427,1); /* rear panel, kept clear of wall trim */
 B(.46,2.46,.065,4.62,1.29,1.105,0x5a402e,1);
 B(.46,2.46,.065,4.62,1.29,3.455,0x5a402e,1);
 const shelfYs=[.12,.68,1.24,1.80,2.36];
 shelfYs.forEach((y,i)=>{
  B(.47,.055,2.30,4.62,y,2.28,i===4?shelfEdge:shelfWood,1);
  /* narrow front nosing gives each shelf a finished furniture edge */
  B(.035,.075,2.30,4.385,y+.008,2.28,0x9b754f,0);
 });
 const bookPalette=[0x7b3935,0x344b5b,0x92764e,0x59634f,0x29394b,0x9a7754,0x6b4a3b,0xc2b08d,0x3c5367,0x80564a];
 /* Upright books, staggered heights and muted leather spines. */
 for(let row=0;row<4;row++){
  let z=1.18;
  const baseY=shelfYs[row]+.055;
  const count=[26,23,26,23][row];
  for(let i=0;i<count;i++){
   const thick=.055+(i%3)*.006;
   const h=.29+((i*7+row*3)%7)*.023;
   const x=4.59+((i%4===0)?-.018:0);
   const book=B(.25,h,thick,x,baseY+h/2,z+thick/2,bookPalette[(i*3+row)%bookPalette.length],0);
   book.material.roughness=.94;
   if(i%4===1){B(.008,.19,thick+.002,x-.128,baseY+h*.56,z+thick/2,0xc4a36a,0)}
   z+=thick+.012;
  }
  /* short horizontal stacks at the shelf ends add a lived-in feel */
  if(row===1||row===3){
   const hz=3.25;
   B(.27,.045,.34,4.61,baseY+.025,hz,0x7a4438,0);
   B(.27,.045,.31,4.61,baseY+.07,hz-.01,0x3c5267,0);
   B(.27,.045,.28,4.61,baseY+.115,hz-.02,0x9b7c55,0);
  }
 }
 /* A small ceramic object and framed keepsake on the top shelf. */
 const shelfVase=C(.085,.105,.19,4.58,2.49,3.13,0xb7a48a,null,20);shelfVase.material.roughness=.84;
 const shelfVaseNeck=C(.052,.052,.055,4.58,2.61,3.13,0xc5b49a,null,20);shelfVaseNeck.material.roughness=.82;
 B(.16,.19,.025,4.70,2.49,1.43,0x6e5038,0);
 B(.125,.145,.012,4.68,2.49,1.445,0xd2c3a8,0);

 /* front wall: a real paneled door and an intentionally styled entry console */
 /* door casing and solid walnut door */
 B(.13,2.48,.13,1.73,1.24,3.86,0x332820,1);B(.13,2.48,.13,3.27,1.24,3.86,0x332820,1);B(1.67,.14,.13,2.5,2.46,3.86,0x332820,1);
 /* Door leaf is hinged at its left edge so the opening sequence can swing it inward. */
 doorPivot=new THREE.Group();doorPivot.position.set(1.81,0,3.81);scene.add(doorPivot);
 B(1.38,2.32,.07,.69,1.18,0,0x674a36,1,doorPivot);
 /* raised/inset panels are attached to the door and move with it */
 B(1.06,.83,.025,.69,1.72,-.045,0x3e3027,0,doorPivot);B(.98,.75,.018,.69,1.72,-.066,0x79583f,0,doorPivot);
 B(1.06,.69,.025,.69,.58,-.045,0x3e3027,0,doorPivot);B(.98,.61,.018,.69,.58,-.066,0x79583f,0,doorPivot);
 /* matching panels on the exterior face, so the entry looks finished before it opens */
 B(1.06,.83,.025,.69,1.72,.045,0x3e3027,0,doorPivot);B(.98,.75,.018,.69,1.72,.066,0x79583f,0,doorPivot);
 B(1.06,.69,.025,.69,.58,.045,0x3e3027,0,doorPivot);B(.98,.61,.018,.69,.58,.066,0x79583f,0,doorPivot);
 /* brass latch and lever on both faces stay attached to the door */
 const latchPlate=B(.08,.15,.018,.23,1.02,-.077,0x8a7048,0,doorPivot);latchPlate.material.roughness=.38;latchPlate.material.metalness=.55;
 const latchKnob=new THREE.Mesh(new THREE.SphereGeometry(.033,16,12),M(0xc7a568,{roughness:.32,metalness:.68}));latchKnob.position.set(.23,1.03,-.104);doorPivot.add(latchKnob);
 const lever=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.105,12),M(0xc7a568,{roughness:.32,metalness:.68}));lever.rotation.z=Math.PI/2;lever.position.set(.285,1.025,-.106);doorPivot.add(lever);
 const outerLatch=B(.08,.15,.018,.23,1.02,.077,0x8a7048,0,doorPivot);outerLatch.material.roughness=.38;outerLatch.material.metalness=.55;
 const outerKnob=new THREE.Mesh(new THREE.SphereGeometry(.033,16,12),M(0xc7a568,{roughness:.32,metalness:.68}));outerKnob.position.set(.23,1.03,.104);doorPivot.add(outerKnob);
 const outerLever=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.105,12),M(0xc7a568,{roughness:.32,metalness:.68}));outerLever.rotation.z=Math.PI/2;outerLever.position.set(.285,1.025,.106);doorPivot.add(outerLever);
 /* console table: framed top, open legs, drawer and brass pulls */
 B(1.68,.075,.56,-1,.55,3.54,0x8b6344,1);
 B(1.42,.27,.43,-1,.34,3.54,0x68462f,1);
 B(1.43,.15,.035,-1,.35,3.307,0x785139,0);
 B(1.43,.012,.012,-1,.43,3.286,0xb18b55,0);
 [-1.66,-.34].forEach(x=>[3.34,3.73].forEach(z=>B(.055,.50,.055,x,.275,z,0x4b3427,0)));
 [-1.22,-.78].forEach(x=>{const pull=new THREE.Mesh(new THREE.SphereGeometry(.022,12,10),M(0xc4a36a,{roughness:.34,metalness:.65}));pull.position.set(x,.35,3.282);scene.add(pull)});
 /* three clearly readable books, a key dish and a ceramic vase */
 const entryBook1=B(.31,.027,.205,-1.53,.605,3.51,0x763b35,0);entryBook1.rotation.y=.07;
 const entryBook2=B(.29,.027,.195,-1.52,.632,3.515,0x425b6b,0);entryBook2.rotation.y=-.04;
 const entryBook3=B(.27,.027,.185,-1.51,.659,3.52,0x9b8059,0);entryBook3.rotation.y=.055;
 B(.26,.008,.16,-1.51,.673,3.52,0xe1d4bb,0);
 C(.105,.095,.026,-1.02,.602,3.57,0x424748,null,24); /* shallow key dish */
 const trayRim=new THREE.Mesh(new THREE.TorusGeometry(.083,.006,8,24),M(0x9b835b,{roughness:.42,metalness:.45}));trayRim.rotation.x=Math.PI/2;trayRim.position.set(-1.02,.617,3.57);scene.add(trayRim);
 B(.105,.008,.018,-1.035,.621,3.56,0xc1a46b,0);B(.073,.008,.014,-.99,.625,3.585,0x8e9697,0);
 const vaseBody=new THREE.Mesh(new THREE.SphereGeometry(1,20,16),M(0x71827d,{roughness:.28,metalness:.08}));vaseBody.scale.set(.105,.13,.095);vaseBody.position.set(-.57,.72,3.55);vaseBody.castShadow=true;vaseBody.receiveShadow=true;scene.add(vaseBody);
 C(.042,.052,.11,-.57,.824,3.55,0x687a75,null,20);
 C(.05,.05,.018,-.57,.883,3.55,0xaab6ab,null,20);
 /* wall area left clean as requested; retain only the framed landscape nearby */
 /* keep the existing framed landscape and floor plant */
 paint(-1.2,1.9,3.94,1,.7,Math.PI,0x3a5a9a,0xf2b84b,'images/wall-3.jpg');plant(-3.9,3.5,1.2);
 /* pendant lamp */
 C(.01,.01,.8,-.3,3,.5,0x2a2a30);const pl=C(.1,.3,.25,-.3,2.5,.5,0xf2b84b);pl.material.emissive.setHex(0x8a5a10);spr(0xffe0b0,-.3,2.35,.5,1.2,.5);
 const bt=tex(64,64,g=>{const q=g.createRadialGradient(32,32,2,32,32,32);q.addColorStop(0,'rgba(0,0,0,.9)');q.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=q;g.fillRect(0,0,64,64)});
 [[2.4,.5,1.4,2.8],[-3.9,-.4,1.5,1.5],[-2.5,-3.2,3.2,1.8],[-4.5,-1.8,1.2,3.4],[4.5,2.3,1.3,2.4],[4.4,-1.2,1.5,3],[-1.35,-2.6,1.1,1.1],[3.5,.5,1.4,1.8],[-1.2,1.9,1.6,1.3],[-1,3.7,2.2,1.2],[-4.2,.8,1.3,1.1]].forEach(b=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(b[2],b[3]),new THREE.MeshBasicMaterial({map:bt,transparent:true,opacity:.5,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(b[0],.045,b[1]);scene.add(m)});
 /* dust */
 const dg=new THREE.BufferGeometry(),dp=new Float32Array(150);for(let i=0;i<50;i++){dp[i*3]=-3.5+Math.random()*2;dp[i*3+1]=Math.random()*2.6;dp[i*3+2]=-3.5+Math.random()*2.5}
 dg.setAttribute('position',new THREE.BufferAttribute(dp,3));dust=new THREE.Points(dg,new THREE.PointsMaterial({size:.025,color:0xbcd0ff,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(dust);
 /* ensure the room and furniture cast/receive soft shadows without shadowing emissive sprites */
 scene.traverse(o=>{if(o.isMesh){if(o!==sky&&o!==rain&&o!==shaft){o.castShadow=o.castShadow||false;o.receiveShadow=o.receiveShadow||false;}if(o.material&&o.material.transparent&&o.material.opacity<.8)o.castShadow=false;}});
 if(keyLight&&renderer.shadowMap.enabled)renderer.shadowMap.needsUpdate=true;
}
/* ===== CAMERA MOVES ===== */
let tl;
function go(c,d,cb){if(LITE){cb&&cb();return}if(tl)tl.kill();tl=gsap.timeline({onComplete:cb});const e='power2.inOut';
 tl.to(cp,{x:c.p[0],y:c.p[1],z:c.p[2],duration:dur(d),ease:e},0).to(lk,{x:c.t[0],y:c.t[1],z:c.t[2],duration:dur(d),ease:e},0)}
function liteShow(k){if(!LITE)return;$$('#lite .l').forEach((e,i)=>{e.classList.toggle('on',i===k);e.style.transform=i===k&&k>0?'scale(1.12)':'scale(1)';e.style.transformOrigin=['50% 50%','20% 60%','45% 75%','85% 55%'][i]})}
function glowObj(i,on){if(LITE)return;
 if(i===0&&bookRoot){if(typeof gsap!=='undefined')gsap.to(bookRoot.scale,{x:on?1.035:1,y:on?1.035:1,z:on?1.035:1,duration:st.rm?.01:.22,ease:'power2.out'});else bookRoot.scale.setScalar(on?1.035:1);}
 else if(i===1&&notesM)notesM.material.emissive.setHex(on?0x70582a:0);
 if(i===2&&!tvOn&&tvLight)tvLight.intensity=on?.5:0
}
function animateBookOpen(done){
 if(bookIsOpen&&!bookAnimating){if(done)done();return;}
 if(!bookCoverPivot||LITE){bookIsOpen=true;bookAnimating=false;if(done)done();return;}
 if(typeof gsap!=='undefined')gsap.killTweensOf(bookCoverPivot.rotation);
 bookAnimating=true;
 const finish=()=>{bookIsOpen=true;bookAnimating=false;if(done)done();};
 if(st.rm||typeof gsap==='undefined'){bookCoverPivot.rotation.z=1.42;finish();}
 else gsap.to(bookCoverPivot.rotation,{z:1.42,duration:.82,ease:'power2.out',onComplete:finish});
}
function animateBookClose(done){
 if(!bookCoverPivot||LITE){bookIsOpen=false;bookAnimating=false;if(done)done();return;}
 if(typeof gsap!=='undefined')gsap.killTweensOf(bookCoverPivot.rotation);
 bookIsOpen=false;bookAnimating=true;
 const finish=()=>{bookCoverPivot.rotation.z=0;bookIsOpen=false;bookAnimating=false;if(done)done();};
 if(st.rm||typeof gsap==='undefined'){finish();}
 else gsap.to(bookCoverPivot.rotation,{z:0,duration:.58,ease:'power2.inOut',onComplete:finish});
}
function animateActivityOpen(done){
 if(activityIsOpen&&!activityAnimating){if(done)done();return;}
 if(!activityCoverPivot||LITE){activityIsOpen=true;activityAnimating=false;if(done)done();return;}
 if(typeof gsap!=='undefined')gsap.killTweensOf(activityCoverPivot.rotation);
 activityAnimating=true;
 const finish=()=>{activityIsOpen=true;activityAnimating=false;if(done)done();};
 if(st.rm||typeof gsap==='undefined'){activityCoverPivot.rotation.z=1.38;finish();}
 else gsap.to(activityCoverPivot.rotation,{z:1.38,duration:.76,ease:'power2.out',onComplete:finish});
}
function animateActivityClose(done){
 if(!activityCoverPivot||LITE){activityIsOpen=false;activityAnimating=false;if(done)done();return;}
 if(typeof gsap!=='undefined')gsap.killTweensOf(activityCoverPivot.rotation);
 activityIsOpen=false;activityAnimating=true;
 const finish=()=>{activityCoverPivot.rotation.z=0;activityIsOpen=false;activityAnimating=false;if(done)done();};
 if(st.rm||typeof gsap==='undefined'){finish();}
 else gsap.to(activityCoverPivot.rotation,{z:0,duration:.54,ease:'power2.inOut',onComplete:finish});
}
function openStoryBook(){
 if(st.mode==='intro'||st.mode==='section')return;
 if(bookIsOpen&&!bookAnimating){openSec(0);return;}
 animateBookOpen(()=>{if(st.mode!=='section')openSec(0);});
}
function animateBookPageTurn(direction){
 if(!bookPageTurnPivot||LITE||(!bookIsOpen&&!bookAnimating))return;
 if(bookPageTurnTween&&typeof bookPageTurnTween.kill==='function')bookPageTurnTween.kill();
 if(st.rm||typeof gsap==='undefined'){bookPageTurnPivot.visible=false;bookPageTurnPivot.rotation.z=0;return;}
 bookPageTurnPivot.visible=true;
 bookPageTurnPivot.rotation.z=direction>0?0:-Math.PI;
 bookPageTurnTween=gsap.to(bookPageTurnPivot.rotation,{z:direction>0?-Math.PI:0,duration:.62,ease:'power2.inOut',onComplete:()=>{bookPageTurnPivot.visible=false;bookPageTurnPivot.rotation.z=0;bookPageTurnTween=null;}});
}
/* ===== UI ===== */
function hint(t){$('#hint').textContent=t||''}
let tt0=0;function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(tt0);tt0=setTimeout(()=>e.classList.remove('on'),3200)}
function renderMenu(){const l=L();$('#menu').innerHTML=l.menu.map((n,i)=>'<button data-i="'+i+'" aria-label="'+n+'">'+n+'</button>').join('')}
function renderAll(){const l=L(),h=document.documentElement;h.lang=lang;h.dir=lang==='fa'?'rtl':'ltr';document.title=(SITE.name||'Your Name')+' — Realistic 3D Portfolio';const srTitle=$('h1.sr');if(srTitle)srTitle.textContent=(SITE.name||'Your Name')+' — Realistic 3D Portfolio';const loaderTitle=$('#ld b');if(loaderTitle)loaderTitle.textContent=SITE.name||'Your Name';const ogTitle=$('meta[property="og:title"]');if(ogTitle)ogTitle.content=(SITE.name||'Your Name')+' — Realistic 3D Portfolio';renderMenu();$('#back').textContent=l.back;$('#hh').textContent=l.hint;
 $('#mst').textContent=l.set[0];$('#l1').textContent=l.set[1];$('#l2').textContent=l.set[2];$('#l3').textContent=l.set[3];$('#l4').textContent=l.set[4];$('#l5').textContent=l.set[5];$('#darkTheme').checked=st.darkTheme;applyTheme();
 $('#qualityRow').title=lang==='fa'?'کیفیت رندر را بین حالت خودکار، بالا و پایین تنظیم می‌کند.':'Adjusts render resolution between auto, high and low.';$('#motionRow').title=lang==='fa'?'حرکت دوربین و انیمیشن‌های رابط را کوتاه‌تر می‌کند.':'Shortens camera and interface animations.';$('#themeRow').title=lang==='fa'?'ظاهر پنل‌ها را بین تم تاریک و روشن تغییر می‌دهد.':'Switches the interface between dark and light themes.';
 ['cx','cs','cl'].forEach((id,i)=>$('#'+id).setAttribute('aria-label',[l.menu[3],l.set[0],'Language / زبان'][i]));
 drawLaptop();drawTV();if(st.mode==='section')renderPanel();if(st.mode==='desk')hint('')}
function renderPanel(flip){const l=L(),p=$('#panel');let h='';
 if(st.sec===0){const c=l.ch[st.page];h='<h2>'+l.menu[0]+'</h2><div class="bk"><div class="pg'+(flip?' flip':'')+'"><h3>'+escapeHTML(c[0])+'</h3><p>'+escapeHTML(c[1])+'</p></div><div class="nav"><button id="pv" '+(st.page?'':'disabled')+' aria-label="Prev">‹</button><span>'+(st.page+1)+' / '+l.ch.length+'</span><button id="nx" '+(st.page<l.ch.length-1?'':'disabled')+' aria-label="Next">›</button></div></div>'}
 else if(st.sec===1){h='<h2>'+l.menu[1]+'</h2><div class="tl">'+l.ac.map(a=>'<div><em>'+escapeHTML(a[0])+'</em><h3>'+escapeHTML(a[1])+'</h3><p>'+escapeHTML(a[2])+'</p></div>').join('')+'</div>'}
 else{h='<h2>'+l.menu[2]+'</h2><a class="btn" href="'+safeURL(RESUME_PATH)+'" download>'+l.dl+'</a>'+PJ.map((j,i)=>'<button class="card" data-p="'+i+'"><i class="card-art" data-project-art="'+i+'"></i><div><h3>'+escapeHTML((j.title&&j.title[lang])||j.t)+'</h3><p>'+escapeHTML(l.pj[i]||'')+'</p><div class="tg">'+(j.tags||[]).map(t=>'<span>'+escapeHTML(t)+'</span>').join('')+'</div><a href="'+safeURL(j.url)+'" target="_blank" rel="noopener">'+l.visit+'</a></div></button>').join('')+'<h2 class="contact-heading">'+l.contact+'</h2><div class="ct">'+CONTACT.map(c=>'<a href="'+safeURL(c.u)+'" target="_blank" rel="noopener">'+escapeHTML(c.n)+'</a>').join('')+'</div>'}
 const wasCollapsed=p.classList.contains('collapsed');
 const sectionName=st.sec===0?l.menu[0]:st.sec===1?l.menu[1]:l.menu[2];
 p.innerHTML='<div class="panel-toolbar"><span class="panel-context">'+sectionName+'</span><span class="panel-grip" aria-hidden="true"></span><button type="button" class="panel-collapse'+(wasCollapsed?' is-collapsed':'')+'" aria-label="'+(wasCollapsed?(lang==='fa'?'باز کردن پنل':'Expand details'):(lang==='fa'?'جمع کردن پنل':'Collapse details'))+'" aria-expanded="'+(!wasCollapsed)+'"><svg class="panel-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div><div class="panel-content'+(st.sec===2?' panel-projects':'')+'">'+h+'</div>';
 p.querySelectorAll('.card-art').forEach((art,index)=>{
  const project=PJ[index];
  if(!project) return;
  const fallback='linear-gradient(120deg,'+project.c[0]+','+project.c[1]+')';
  // Project screenshot is optional. The gradient remains visible underneath if no image exists.
  const artPath=safeImagePath(project.image);
  const assetVersion=window.PORTFOLIO_ASSET_VERSION||Date.now().toString(36);
  art.style.backgroundImage=artPath
    ? 'linear-gradient(0deg,rgba(0,0,0,.18),rgba(0,0,0,.02)),url("'+artPath+(artPath.includes('?')?'&':'?')+'v='+assetVersion+'"),'+fallback
    : fallback;
  art.style.backgroundSize='cover';
  art.style.backgroundPosition='center';
 });
 p.classList.toggle('collapsed',wasCollapsed);p.classList.add('on')}
function setTV(on){tvOn=on;clearInterval(tvTimer);if(tvLight)tvLight.intensity=on?1.2:0;drawTV();if(on)tvTimer=setInterval(()=>{tvIdx=(tvIdx+1)%PJ.length;drawTV()},4000)}
function hover(i){if(st.mode!=='desk'&&st.mode!=='hover')return;st.mode='hover';hint(L().desc[i]);if(i<3){glowObj(i,1);go(CAM[i].h,1.4);liteShow(i+1)}}
function unhover(){if(st.mode!=='hover')return;st.mode='desk';hint('');for(let i=0;i<3;i++)glowObj(i,0);go(CAM.desk,1.4);liteShow(0)}
function openSec(i){if(st.mode==='intro'||st.mode==='section')return;$('#panel').classList.remove('collapsed');for(let k=0;k<3;k++)glowObj(k,0);st.mode='section';st.sec=i;if(i===0){st.page=0;if(!bookIsOpen)animateBookOpen();}else if(i===1&&!activityIsOpen){animateActivityOpen();}hint('');exitHud();
 $('#menu').classList.add('off');$('#back').classList.add('on');go(openCam(i),1.6);liteShow(i+1);renderPanel();if(i===2){tvIdx=0;setTV(true)}
 if(seen.indexOf(i)<0){seen.push(i);LS.s('seen',JSON.stringify(seen));toast(L().ach+L().menu[i]);if(seen.length===3)setTimeout(()=>toast(L().full),3400)}}
function openCam(i){const c=CAM[i].o;return c}
function toDesk(){$('#panel').classList.remove('on','collapsed');$('#back').classList.remove('on');$('#menu').classList.remove('off');exitHud();setTV(false);animateBookClose();animateActivityClose();st.mode='desk';st.sec=-1;exReady=false;hint('');go(CAM.desk,1.6);liteShow(0)}
function exitHud(){$('#hud').classList.remove('on');for(const k in keys)keys[k]=0}
function enterExplore(){if(LITE||(st.mode!=='desk'&&st.mode!=='hover'))return;st.mode='explore';exReady=false;hint('');$('#menu').classList.add('off');$('#back').classList.add('on');$('#hud').classList.add('on');
 go({p:[.5,1.6,3.1],t:[.5,1.55,0]},1.6,()=>{const dx=lk.x-cp.x,dy=lk.y-cp.y,dz=lk.z-cp.z;yaw=yawT=Math.atan2(dx,-dz);pitch=pitchT=Math.asin(dy/Math.hypot(dx,dy,dz));exReady=true})}
function back(){if(st.mode==='section'||st.mode==='explore')toDesk()}
function flareFire(){flare=1}
/* events */
const menu=$('#menu');
menu.addEventListener('mouseover',e=>{const b=e.target.closest('button');if(b)hover(+b.dataset.i)});menu.addEventListener('focusin',e=>{const b=e.target.closest('button');if(b)hover(+b.dataset.i)});
menu.addEventListener('mouseleave',unhover);menu.addEventListener('focusout',unhover);
menu.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const i=+b.dataset.i;if(i===3){if(st.mode==='hover')st.mode='desk';enterExplore()}else{if(st.mode==='hover')st.mode='desk';openSec(i)}});
$('#panel').addEventListener('click',e=>{const t=e.target;const collapse=t.closest('.panel-collapse');if(collapse){const isCollapsed=$('#panel').classList.toggle('collapsed');collapse.classList.toggle('is-collapsed',isCollapsed);collapse.setAttribute('aria-expanded',String(!isCollapsed));collapse.setAttribute('aria-label',isCollapsed?(lang==='fa'?'باز کردن پنل':'Expand details'):(lang==='fa'?'جمع کردن پنل':'Collapse details'));return;}if(t.id==='pv'&&st.page>0){animateBookPageTurn(-1);st.page--;renderPanel(1)}else if(t.id==='nx'&&st.page<L().ch.length-1){animateBookPageTurn(1);st.page++;renderPanel(1)}
 else{const c=t.closest('.card');if(c&&!t.closest('a')){tvIdx=+c.dataset.p;setTV(true)}}});
$('#back').onclick=back;$('#cx').onclick=()=>{if(st.mode==='hover')st.mode='desk';enterExplore()};
function mod(id,on){$(id).classList.toggle('on',on)}
$('#cs').onclick=()=>mod('#ms',1);$('#cl').onclick=()=>mod('#ml',1);
$$('.md').forEach(m=>{m.addEventListener('click',e=>{if(e.target===m||e.target.classList.contains('x'))m.classList.remove('on')})});
$$('[data-l]').forEach(b=>b.onclick=()=>{lang=b.dataset.l;LS.s('lang',lang);mod('#ml',0);renderAll()});
$('#mus').checked=st.music;$('#vol').value=st.vol;$('#qs').value=st.q;$('#rm').checked=st.rm;
let ac,mg,musicFilter,themeTimer=0,themeStep=0,themeNext=0;
/* Original procedural theme: a gentle, warm 16-note motif with soft sustained harmony. */
const THEME_NOTES=[523.25,659.25,783.99,659.25,587.33,523.25,440.00,523.25,392.00,523.25,659.25,587.33,523.25,493.88,440.00,392.00];
const THEME_CHORDS=[[261.63,329.63,392.00],[220.00,261.63,329.63],[174.61,220.00,261.63],[196.00,246.94,293.66]];
function ensureAudio(){
 if(ac)return;
 ac=new(window.AudioContext||window.webkitAudioContext)();
 mg=ac.createGain();mg.gain.value=0;
 musicFilter=ac.createBiquadFilter();musicFilter.type='lowpass';musicFilter.frequency.value=3200;musicFilter.Q.value=.45;
 mg.connect(musicFilter);musicFilter.connect(ac.destination);
}
function playThemeTone(freq,at,duration,level,wave){
 const osc=ac.createOscillator(),env=ac.createGain();osc.type=wave||'sine';osc.frequency.setValueAtTime(freq,at);
 env.gain.setValueAtTime(.0001,at);env.gain.exponentialRampToValueAtTime(Math.max(.0002,level),at+.025);env.gain.exponentialRampToValueAtTime(.0001,at+duration);
 osc.connect(env);env.connect(mg);osc.start(at);osc.stop(at+duration+.035);
}
function scheduleTheme(){
 if(!ac||!st.music||ac.state==='closed')return;
 const beat=.43;
 while(themeNext<ac.currentTime+.24){
  const i=themeStep%16;
  playThemeTone(THEME_NOTES[i],themeNext,.31,.052,'triangle');
  if(i%4===0){const chord=THEME_CHORDS[Math.floor(i/4)%THEME_CHORDS.length];chord.forEach((f,j)=>playThemeTone(f,themeNext,1.62,j===0?.024:.014,'sine'));}
  themeStep++;themeNext+=beat;
 }
}
function startTheme(){
 ensureAudio();if(ac.state==='suspended')ac.resume();if(themeTimer)return;
 themeStep=0;themeNext=ac.currentTime+.08;themeTimer=setInterval(scheduleTheme,80);scheduleTheme();
}
function stopTheme(){
 if(themeTimer){clearInterval(themeTimer);themeTimer=0;}
 if(mg&&ac&&ac.state!=='closed'){mg.gain.cancelScheduledValues(ac.currentTime);mg.gain.setTargetAtTime(0,ac.currentTime,.09);}
}
function audio(){
 try{
  ensureAudio();
  if(st.music){if(ac.state==='suspended')ac.resume();mg.gain.cancelScheduledValues(ac.currentTime);mg.gain.setTargetAtTime(Math.max(.001,st.vol*.72),ac.currentTime,.08);startTheme();}
  else stopTheme();
 }catch(e){console.warn('Audio is unavailable in this browser.',e);}
}
$('#mus').onchange=e=>{st.music=e.target.checked;LS.s('music',st.music?1:0);audio()};$('#vol').oninput=e=>{st.vol=+e.target.value;LS.s('vol',st.vol);audio()};
/* If music was previously enabled, resume it on the first user gesture (browser autoplay policy). */
document.addEventListener('pointerdown',()=>{if(st.music&&!themeTimer)audio();},{once:true});
$('#qs').onchange=e=>{st.q=e.target.value;LS.s('q',st.q);applyRenderQuality();};
$('#rm').onchange=e=>{st.rm=e.target.checked;LS.s('rm',st.rm?1:0)};
$('#darkTheme').onchange=e=>{st.darkTheme=e.target.checked;LS.s('darkTheme',st.darkTheme?1:0);applyTheme()};
const MOVE_KEYS={ArrowUp:'f',ArrowDown:'b',ArrowLeft:'tl',ArrowRight:'tr',KeyW:'f',KeyS:'b',KeyA:'sl',KeyD:'sr',w:'f',W:'f',s:'b',S:'b',a:'sl',A:'sl',d:'sr',D:'sr'};
addEventListener('keydown',e=>{if(e.key==='Escape'){const m=$$('.md.on');if(m.length)m.forEach(x=>x.classList.remove('on'));else back();return}
 if(st.mode!=='explore')return;const k=MOVE_KEYS[e.code]||MOVE_KEYS[e.key];if(k){keys[k]=1;e.preventDefault()}});
addEventListener('keyup',e=>{const k=MOVE_KEYS[e.code]||MOVE_KEYS[e.key];if(k)keys[k]=0});
addEventListener('blur',()=>{for(const k in keys)keys[k]=0});
$$('#hud button').forEach(b=>{const k=b.dataset.k;b.addEventListener('pointerdown',e=>{keys[k]=1;e.preventDefault()});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=0))});
function walk(d){cp.x=Math.max(-4.4,Math.min(4.4,cp.x+Math.sin(yawT)*d));cp.z=Math.max(-3.4,Math.min(3.6,cp.z-Math.cos(yawT)*d))}
function strafe(d){cp.x=Math.max(-4.4,Math.min(4.4,cp.x+Math.cos(yawT)*d));cp.z=Math.max(-3.4,Math.min(3.6,cp.z+Math.sin(yawT)*d))}
/* pointer on canvas */
const drag={down:false,moved:false,x:0,y:0,lx:0,ly:0};
function onPick(e){const r=$('#c').getBoundingClientRect(),v=new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1),rc=new THREE.Raycaster();rc.setFromCamera(v,camera);const h=rc.intersectObjects(pick,false)[0];
 if(!h){flareFire();return}const n=h.object.name;if(st.mode==='intro')return;
 if(n===NAMES.laptop){if(st.mode!=='desk'&&st.mode!=='hover')back()}
 else if(n===NAMES.book)openStoryBook();else if(n===NAMES.notes)openSec(1);else if(n===NAMES.tv)openSec(2);
 else if(n==='clock'||n==='window'){flareFire()}}
const cvEl=$('#c');
cvEl.addEventListener('pointerdown',e=>{drag.down=true;drag.moved=false;drag.x=drag.lx=e.clientX;drag.y=drag.ly=e.clientY;try{cvEl.setPointerCapture(e.pointerId)}catch(x){}});
cvEl.addEventListener('pointermove',e=>{if(!drag.down)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6)drag.moved=true;
 if(drag.moved&&(st.mode==='desk'||st.mode==='hover')){drag.down=false;enterExplore();return}
 if(st.mode==='explore'&&exReady){yawT-=(e.clientX-drag.lx)*.004;pitchT=Math.max(-1,Math.min(1,pitchT+(e.clientY-drag.ly)*.003))}drag.lx=e.clientX;drag.ly=e.clientY});
cvEl.addEventListener('pointerup',e=>{if(drag.down&&!drag.moved)onPick(e);drag.down=false});
cvEl.addEventListener('wheel',e=>{if(st.mode==='desk'||st.mode==='hover')enterExplore();else if(st.mode==='explore'&&exReady)walk(-e.deltaY*.004)},{passive:true});
/* ===== LOOP ===== */
let last=0,ema=16,slow=0,raf=0,t0=0;
let lastRenderAt=0;
function frame(ts){
 raf=requestAnimationFrame(frame);
 const small=isSmallViewport(),targetFps=st.q==='low'?30:(small?45:60),minFrameMs=1000/targetFps;
 if(lastRenderAt&&ts-lastRenderAt<minFrameMs)return;
 const dt=Math.min((ts-last)/1000||.016,.1);last=ts;lastRenderAt=ts;t0+=dt;
 ema=ema*.95+dt*1000*.05;
 if(st.q==='auto'&&ema>27){
  if(++slow>=45){
   const floor=small?.75:.85;
   if(pr>floor+.01){pr=Math.max(floor,pr-.15);renderer.setPixelRatio(pr);renderer.setSize(innerWidth,innerHeight,false);}
   else if(renderer.shadowMap.enabled&&keyLight&&!small){renderer.shadowMap.enabled=false;keyLight.castShadow=false;}
   slow=0;
  }
 }else slow=0;
 if(st.mode==='explore'&&exReady){yaw+=(yawT-yaw)*.12;pitch+=(pitchT-pitch)*.12;const s=1.4*dt;if(keys.tl)yawT-=s;if(keys.tr)yawT+=s;if(keys.f)walk(1.6*dt);if(keys.b)walk(-1.6*dt);if(keys.sl)strafe(-1.6*dt);if(keys.sr)strafe(1.6*dt);
  const cs=Math.cos(pitch);lk.x=cp.x+Math.sin(yaw)*cs;lk.y=cp.y+Math.sin(pitch);lk.z=cp.z-Math.cos(yaw)*cs}
 let fx=0,fy=0;if(st.mode==='desk'&&!st.rm){fx=Math.sin(t0*.5)*.015;fy=Math.sin(t0*.8)*.012}
 camera.position.set(cp.x+fx,cp.y+fy,cp.z);camera.lookAt(lk.x+fx*.5,lk.y,lk.z);
 sky.material.map.offset.x=camera.position.x*.01;rain.material.map.offset.y-=dt*1.1;
 flare=Math.max(0,flare-dt*.8);const fk=1+.07*Math.sin(t0*8.7)+.045*Math.sin(t0*14.1)+flare*1.2;fireLight.intensity=1.38*fk;firePaint(t0);if(candleFlame){const cf=1+.065*Math.sin(t0*17.2)+.035*Math.sin(t0*29.7);candleFlame.scale.set(cf,cf,1);if(candleLight)candleLight.intensity=.19+.025*Math.sin(t0*18.3)}
 steam.forEach((s,i)=>{const p=((t0*.29+(s.userData.steamOffset||i/3))%1);s.position.y=.955+p*.34;s.position.x=-1.7+Math.sin(t0*1.35+i*1.9)*(.009+p*.014);s.position.z=-3.1+(i-1)*.002;s.scale.set(.043+p*.026,.12+p*.095,1);s.material.rotation=Math.sin(t0*1.45+i*1.7)*.13;s.material.opacity=.36*(1-p)*Math.min(1,.18+p*3.4)});
 const a=dust.geometry.attributes.position.array;for(let i=0;i<50;i++){a[i*3+1]+=dt*.03;a[i*3]+=Math.sin(t0+i)*dt*.01;if(a[i*3+1]>2.6)a[i*3+1]=0}dust.geometry.attributes.position.needsUpdate=true;
 const d=new Date(),sec=d.getSeconds(),mi=d.getMinutes()+sec/60,hr=(d.getHours()%12)+mi/60;hands.s.rotation.z=-sec/60*6.283;hands.m.rotation.z=-mi/60*6.283;hands.h.rotation.z=-hr/12*6.283;
 if(renderer.shadowMap.enabled&&st.mode==='intro')renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera)}
function resize(){if(!renderer)return;applyRenderQuality();renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<1?72:55;camera.updateProjectionMatrix()}
addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{if(!renderer)return;if(document.hidden){cancelAnimationFrame(raf);raf=0}else if(!raf){last=performance.now();raf=requestAnimationFrame(frame)}});
/* ===== BOOT ===== */
function boot(){
 if(!LITE){try{if(typeof THREE==='undefined'||typeof gsap==='undefined')throw new Error('libs');build();resize()}catch(err){console.error(err);LITE=true}}
 if(LITE){document.body.classList.add('lite');if(typeof gsap==='undefined')window.gsap={to(){return this},timeline(o){return{to(){return this},kill(){}}}}}
 renderAll();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{try{drawLaptop();drawTV()}catch(e){}});
 const bar=$('#bar');let p={v:0};
 function finish(){const ld=$('#ld');ld.style.opacity=0;setTimeout(()=>ld.remove(),1100);
  if(LITE){st.mode='desk';$('#menu').classList.remove('off');return}
  /* Begin outside the entrance, swing the door inward, travel through the doorway, then settle at the familiar desk view. */
  cp.x=2.5;cp.y=1.58;cp.z=5.85;lk.x=2.5;lk.y=1.42;lk.z=3.81;
  if(doorPivot)doorPivot.rotation.y=0;
  raf=requestAnimationFrame(frame);
  const k=st.rm?0.01:1,dd=d=>st.rm?0.01:d,at=t=>t*k;
  if(!doorPivot){go(CAM.desk,st.rm?.01:2.4,()=>{st.mode='desk';$('#menu').classList.remove('off')});return}
  tl=gsap.timeline({onComplete:()=>{doorPivot.rotation.y=0;st.mode='desk';if(renderer&&renderer.shadowMap.enabled)renderer.shadowMap.needsUpdate=true;$('#menu').classList.remove('off')}});
  tl.to(doorPivot.rotation,{y:1.32,duration:dd(.48),ease:'power2.inOut'},0)
    .to(cp,{x:2.5,y:1.58,z:2.55,duration:dd(1.35),ease:'power2.inOut'},at(.15))
    .to(lk,{x:2.35,y:1.42,z:-.25,duration:dd(1.35),ease:'power2.inOut'},at(.15))
    .to(doorPivot.rotation,{y:0,duration:dd(.48),ease:'power2.inOut'},at(1.25))
    .to(cp,{x:CAM.desk.p[0],y:CAM.desk.p[1],z:CAM.desk.p[2],duration:dd(.95),ease:'power2.inOut'},at(1.48))
    .to(lk,{x:CAM.desk.t[0],y:CAM.desk.t[1],z:CAM.desk.t[2],duration:dd(.95),ease:'power2.inOut'},at(1.48))}
 const step=()=>{p.v+=.10;bar.style.width=Math.min(100,p.v*100)+'%';if(p.v<1)setTimeout(step,35);else finish()};step()}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',boot);else boot();
addEventListener('error',()=>{const ld=$('#ld');if(ld&&st.mode==='intro'&&!window.__booted){window.__booted=1}});
})();
