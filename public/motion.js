const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');

// Native scroll positions remain authoritative: keyboard, anchors, touch and history
// continue to work. Only fine-pointer wheel input receives the reference's inertia.
export function installSmoothWheel() {
  let active=null, target=0, animated=0, frame=0;
  function stop(){cancelAnimationFrame(frame);frame=0;active=null;}
  function position(el){return el===window?scrollY:el.scrollTop;}
  function limit(el){return el===window?document.documentElement.scrollHeight-innerHeight:el.scrollHeight-el.clientHeight;}
  function tick(){if(!active)return;const next=animated+(target-animated)*.15;const y=Math.abs(target-next)<.3?target:next;animated=y;if(active===window)window.scrollTo({top:y,behavior:'instant'});else active.scrollTo({top:y,behavior:'instant'});if(Math.abs(target-animated)>.3)frame=requestAnimationFrame(tick);else stop();}
  window.addEventListener('wheel',e=>{
    if(reduce.matches||!fine.matches||innerWidth<650||e.ctrlKey||e.metaKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||e.target.closest('dialog'))return;
    const scroller=e.target.closest('.project-scroll')||window;
    if(document.body.classList.contains('project-open')&&scroller===window)return;
    const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
    if(!pixels)return;
    if(active!==scroller){stop();active=scroller;target=position(scroller);animated=target;}
    const next=Math.max(0,Math.min(limit(scroller),target+pixels*1.25));
    if(next===position(scroller)&&!frame)return;
    e.preventDefault();target=next;if(!frame)frame=requestAnimationFrame(tick);
  },{passive:false});
  window.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ','Escape'].includes(e.key))stop();});
  window.addEventListener('pointerdown',stop);
  window.addEventListener('popstate',stop);
  reduce.addEventListener('change',stop);
  return stop;
}

// Capture visible cards before a Grid/Gallery layout change, then animate their
// media to the new rectangles. The actual articles retain focus and semantics.
export function captureCards(){
  if(reduce.matches||innerWidth<650)return [];
  return [...document.querySelectorAll('.tile')].filter(el=>el.dataset.index==='0').map(el=>{
    const media=el.querySelector('.media'),rect=media.getBoundingClientRect();
    if(rect.bottom<0||rect.top>innerHeight)return null;
    const clone=media.cloneNode(true);clone.querySelectorAll('video').forEach(v=>{const src=media.querySelector('video')?.src;if(src){v.src=src;v.muted=true;v.play().catch(()=>{});}});
    return {slug:el.dataset.project,rect,clone};
  }).filter(Boolean);
}
export function moveCards(cards){
  cards.forEach(({slug,rect,clone},i)=>{
    const target=document.querySelector(`.tile[data-project="${CSS.escape(slug)}"] .media`);
    if(!target)return;const next=target.getBoundingClientRect();if(next.bottom<0||next.top>innerHeight)return;
    Object.assign(clone.style,{position:'fixed',left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,margin:0,zIndex:45,transformOrigin:'0 0',pointerEvents:'none'});
    clone.classList.add('motion-ghost');clone.setAttribute('aria-hidden','true');document.body.append(clone);target.style.visibility='hidden';
    const end=`translate(${next.left-rect.left}px,${next.top-rect.top}px) scale(${next.width/rect.width},${next.height/rect.height})`;
    const animation=clone.animate([{transform:'translate(0,0) scale(1)'},{transform:end}],{duration:1100,delay:i*45,easing:'cubic-bezier(.76,0,.24,1)',fill:'both'});
    const cleanup=()=>{clone.querySelectorAll('video').forEach(v=>v.pause());clone.remove();target.style.visibility='';};animation.finished.then(cleanup,cleanup);
  });
}

const vertex = `
attribute vec2 a_uv;
uniform vec4 u_rect;
uniform vec2 u_view;
uniform float u_turn;
uniform float u_bend;
varying vec2 v_uv;
varying float v_light;
void main(){
 vec2 uv=a_uv;v_uv=uv;
 float pi=3.14159265;
 vec3 p=vec3((uv.x-.5)*u_rect.z,(.5-uv.y)*u_rect.w,0.0);
 float wave=sin(pi*uv.x)*(.75+.25*sin(pi*uv.y));
 p.z+=u_bend*wave*u_rect.z*.45;
 float cy=cos(u_turn),sy=sin(u_turn);
 p=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);
 float lean=-.4*sin(u_turn);
 p=vec3(p.x,p.y*cos(lean)-p.z*sin(lean),p.y*sin(lean)+p.z*cos(lean));
 float perspective=1100.0/(1100.0-p.z);
 vec2 pixel=u_rect.xy+u_rect.zw*.5+vec2(p.x,-p.y)*perspective;
 gl_Position=vec4(pixel.x/u_view.x*2.0-1.0,1.0-pixel.y/u_view.y*2.0,0.0,1.0);
 v_light=.78+.22*abs(cy)-u_bend*cos(pi*uv.x)*.12;
}`;
const fragment = `
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_uv;
varying float v_light;
void main(){vec2 uv=v_uv;if(!gl_FrontFacing)uv.x=1.0-uv.x;vec4 c=texture2D(u_image,uv);gl_FragColor=vec4(c.rgb*v_light,c.a);}`;
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('Profile motion shader failed');}return s;}
const catmull=(a,b,c,d,t)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);

export function mountProfileCard(sources){
  const anchors=[...document.querySelectorAll('.profile-card-anchor')];
  if(anchors.length<3||reduce.matches||innerWidth<650)return ()=>{};
  const canvas=document.createElement('canvas');canvas.className='profile-motion-canvas';canvas.setAttribute('aria-hidden','true');
  let gl,program,buffer,frame=0,disposed=false,progress=null,previous=0,bend=0,textures=[],width=0,height=0,lastSignature='';
  const loaded=[];
  try{
    gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(!gl)return ()=>{};
    program=gl.createProgram();const vs=shader(gl,gl.VERTEX_SHADER,vertex),fs=shader(gl,gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Motion program failed');
    gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    const mesh=[];for(let y=0;y<16;y++)for(let x=0;x<32;x++){const l=x/32,r=(x+1)/32,t=y/16,b=(y+1)/16;mesh.push(l,t,l,b,r,t,r,t,l,b,r,b);}
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.STATIC_DRAW);const uv=gl.getAttribLocation(program,'a_uv');gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    const uniforms=Object.fromEntries(['rect','view','turn','bend','image'].map(n=>[n,gl.getUniformLocation(program,'u_'+n)]));
    const images=sources.slice(0,8).map(src=>{const img=new Image();loaded.push(img);img.onload=()=>{if(disposed)return;const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);textures.push(texture);lastSignature='';if(!canvas.isConnected){document.body.append(canvas);document.documentElement.classList.add('profile-card-ready');}};img.src=src;return img;});
    function draw(){
      if(disposed)return;frame=requestAnimationFrame(draw);
      if(document.hidden||document.body.classList.contains('project-open'))return;
      if(innerWidth<650||reduce.matches){canvas.style.display='none';document.documentElement.classList.remove('profile-card-ready');return;}
      if(!textures.length)return;canvas.style.display='';document.documentElement.classList.add('profile-card-ready');
      if(width!==innerWidth||height!==innerHeight){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio,2);canvas.width=width*dpr;canvas.height=height*dpr;gl.viewport(0,0,canvas.width,canvas.height);lastSignature='';}
      const rects=anchors.map(el=>el.getBoundingClientRect());const knots=rects.map((r,i)=>r.top+scrollY+(i?r.height/2:0)-height/2);
      let desired=0;for(let i=0;i<knots.length-1;i++){if(scrollY>=knots[i])desired=i+Math.max(0,Math.min(1,(scrollY-knots[i])/(knots[i+1]-knots[i])));}
      if(progress===null)progress=desired;progress+=(desired-progress)*.12;if(Math.abs(desired-progress)<.00001)progress=desired;
      bend+=((progress-previous)*40-bend)*.12;previous=progress;const segment=Math.min(Math.floor(progress),rects.length-2),t=progress-segment;
      const get=(i,key)=>rects[Math.max(0,Math.min(i,rects.length-1))][key];const values=['left','top','width','height'].map(key=>catmull(get(segment-1,key),get(segment,key),get(segment+1,key),get(segment+2,key),t));
      const index=Math.min(textures.length-1,Math.floor(progress/(rects.length-1)*textures.length));const signature=[...values,progress,bend,index].map(n=>n.toFixed(4)).join(',');if(signature===lastSignature)return;lastSignature=signature;
      canvas.dataset.progress=progress.toFixed(3);canvas.dataset.texture=String(index);
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform4f(uniforms.rect,...values);gl.uniform2f(uniforms.view,width,height);gl.uniform1f(uniforms.turn,progress*Math.PI);gl.uniform1f(uniforms.bend,Math.max(-1,Math.min(1,bend)));gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,textures[index]);gl.uniform1i(uniforms.image,0);gl.drawArrays(gl.TRIANGLES,0,mesh.length/2);
    }
    frame=requestAnimationFrame(draw);
  }catch{canvas.remove();document.documentElement.classList.remove('profile-card-ready');}
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();canvas.style.display='none';document.documentElement.classList.remove('profile-card-ready');disposed=true;cancelAnimationFrame(frame);});
  return ()=>{disposed=true;cancelAnimationFrame(frame);loaded.forEach(img=>img.onload=null);textures.forEach(t=>gl?.deleteTexture(t));if(buffer)gl?.deleteBuffer(buffer);if(program)gl?.deleteProgram(program);canvas.remove();document.documentElement.classList.remove('profile-card-ready');};
}
