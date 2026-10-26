// Shared media planes for Grid/Gallery transitions. Each plane retains its
// texture while its vertices travel between the two DOM layouts.
let activeCleanup=()=>{};
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const visible=r=>r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;
function collect(){return [...document.querySelectorAll('.tile,.gallery-preview-item')].filter(el=>!document.querySelector('.gallery.project-hover')||!el.matches('.tile:not(.highlight)')).map(el=>{const media=el.querySelector('.media');return {key:el.dataset.project+':'+el.dataset.index,media,rect:media.getBoundingClientRect(),source:media.querySelector('img,video')};});}
export function captureLayout(){activeCleanup();if(reduced.matches||innerWidth<650)return [];return collect().filter(x=>visible(x.rect)&&getComputedStyle(x.media).opacity!=='0');}
const vertex=`
attribute vec2 a_uv;
uniform vec4 u_from;uniform vec4 u_to;uniform vec2 u_view;
uniform float u_progress;uniform float u_exit;
varying vec2 v_uv;varying float v_shade;
void main(){
 v_uv=a_uv;vec2 direction=(u_to.xy+u_to.zw*.5)-(u_from.xy+u_from.zw*.5);
 vec2 lead=mix(1.0-a_uv,a_uv,step(vec2(0.0),direction));
 float stagger=length(lead*vec2(.77,.63))*.225;
 float p=clamp(u_progress/(1.0-stagger),0.0,1.0);p=1.0-(1.0-p)*(1.0-p);
 vec2 a=u_from.xy+a_uv*u_from.zw;vec2 b=u_to.xy+a_uv*u_to.zw;
 vec2 pixel=mix(a,b,p);
 float curve=sin(a_uv.x*3.14159265)*sin(a_uv.y*3.14159265);
 float envelope=4.0*u_progress*(1.0-u_progress);
 float lift=envelope*(curve*.5+stagger*2.0)*75.0;
 if(u_exit>.5){float pinch=1.0-clamp(distance(a,vec2(u_view.x,u_view.y*.5))/length(u_view),0.0,1.0);pixel.y+=(u_view.y*.5-a.y)*p*.45;lift=envelope*(pinch-.5)*160.0;}
 pixel=(pixel-u_view*.5)*(1000.0/(1000.0-lift))+u_view*.5;
 gl_Position=vec4(pixel.x/u_view.x*2.0-1.0,1.0-pixel.y/u_view.y*2.0,0.0,1.0);
 v_shade=1.0+envelope*(curve-.5)*.2;
}`;
const fragment=`precision mediump float;uniform sampler2D u_image;uniform float u_alpha;varying vec2 v_uv;varying float v_shade;void main(){vec4 c=texture2D(u_image,v_uv);gl_FragColor=vec4(c.rgb*v_shade,c.a*u_alpha);}`;
function compile(gl,type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Media shader failed');return shader;}
function ease(p){return 1-Math.pow(1-p,4);}
export function flowToLayout(old){
 if(!old.length||reduced.matches)return;
 document.querySelector('#main')?.classList.remove('route-enter');
 const canvas=document.createElement('canvas');canvas.className='media-flow-canvas';canvas.setAttribute('aria-hidden','true');const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(!gl)return;
 let program,buffer,frame=0,planes=[],hidden=[],shaders=[],disposed=false;
 const cleanup=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);hidden.forEach(el=>el.style.visibility='');planes.forEach(p=>{gl.deleteTexture(p.texture);if(p.source?.tagName==='VIDEO'&&!p.source.isConnected){p.source.pause();p.source.removeAttribute('src');p.source.load();}});if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));canvas.remove();gl.getExtension('WEBGL_lose_context')?.loseContext();};activeCleanup=cleanup;
 try{
  program=gl.createProgram();shaders=[compile(gl,gl.VERTEX_SHADER,vertex),compile(gl,gl.FRAGMENT_SHADER,fragment)];shaders.forEach(s=>gl.attachShader(program,s));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Media flow failed');gl.useProgram(program);
  buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const vertices=[];for(let y=0;y<16;y++)for(let x=0;x<32;x++){const l=x/32,r=(x+1)/32,t=y/16,b=(y+1)/16;vertices.push(l,t,l,b,r,t,r,t,l,b,r,b);}gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);const uv=gl.getAttribLocation(program,'a_uv');gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  const uniforms=Object.fromEntries(['from','to','view','progress','exit','alpha','image'].map(k=>[k,gl.getUniformLocation(program,'u_'+k)]));
  const next=collect(),nextMap=new Map(next.map(x=>[x.key,x])),oldKeys=new Set(old.map(x=>x.key));
  const entries=old.map(item=>{const target=nextMap.get(item.key);return {...item,to:target?.rect||{left:item.rect.left+innerWidth,top:item.rect.top,width:item.rect.width,height:item.rect.height},target,exit:!target,incoming:false};});
  next.filter(item=>visible(item.rect)&&!oldKeys.has(item.key)).forEach(item=>entries.push({...item,to:item.rect,rect:{left:item.rect.left+innerWidth,top:item.rect.top,width:item.rect.width,height:item.rect.height},target:item,exit:false,incoming:true}));
  for(const entry of entries){const source=entry.source;if(!source||(source.tagName==='IMG'?!source.complete||!source.naturalWidth:source.readyState<2))continue;const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);planes.push({...entry,texture});if(entry.target){entry.target.media.style.visibility='hidden';hidden.push(entry.target.media);}}
  if(!planes.length){cleanup();return;}const dpr=Math.min(devicePixelRatio,2);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;gl.viewport(0,0,canvas.width,canvas.height);document.body.append(canvas);const start=performance.now();
  function draw(now){const elapsed=now-start;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform2f(uniforms.view,innerWidth,innerHeight);for(const p of planes){const duration=p.exit?750:1500;const raw=Math.min(1,Math.max(0,(elapsed-(p.incoming?80:0))/duration));const progress=ease(raw);const a=p.rect,b=p.to;gl.uniform4f(uniforms.from,a.left,a.top,a.width,a.height);gl.uniform4f(uniforms.to,b.left,b.top,b.width,b.height);gl.uniform1f(uniforms.progress,progress);gl.uniform1f(uniforms.exit,p.exit?1:0);gl.uniform1f(uniforms.alpha,p.exit?1-Math.pow(raw,3):p.incoming?Math.min(1,raw*5):1);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,p.texture);if(p.source.tagName==='VIDEO'&&p.source.readyState>=2)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,p.source);gl.uniform1i(uniforms.image,0);gl.drawArrays(gl.TRIANGLES,0,vertices.length/2);}if(elapsed<1600)frame=requestAnimationFrame(draw);else cleanup();}frame=requestAnimationFrame(draw);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cleanup();},{once:true});
 }catch{cleanup();}
}
