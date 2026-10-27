import { filamentGeometry, paintFilament, filamentSVG } from './filament.js';
export function mountLivingFocus(root,{projects,base,index,onSelect}){
 const stage=root.querySelector('.living-stage'),canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
 const cards=[...root.querySelectorAll('.living-fragment')],pref=matchMedia('(prefers-reduced-motion:reduce)');

 let pinned=-1;
 let active=index,raf=0,last=0,energy=0,hoverTimer,disposed=false,w=1,h=1,pointer={x:.5,y:.5},inside=false;
 let nodes=cards.map(()=>({x:0,y:0,vx:0,vy:0,tx:0,ty:0,angle:0,visible:true,init:false,reveal:0,lastSeen:-10000}));
 const visited=new Set();
 let phase=index*.37,targetPhase=phase,sculpturePointer={x:.5,y:.5},influence=0,paths=[],lastDraw=0;
 function trace(i){if(visited.has(i))return;visited.add(i);root.querySelector(`[data-focus-select="${i}"]`)?.classList.add('encountered');root.querySelector('.imprint-count').textContent=`${String(visited.size).padStart(2,'0')} ${visited.size===1?'work':'works'} encountered`;}
 function draw(){
  if(!ctx)return;
  paths=filamentGeometry(w,h,{phase,pointer:sculpturePointer,influence,layers:visited.size});
  paintFilament(ctx,paths,w,h);
 }
 function frame(time){raf=0;if(disposed)return;const dt=Math.min((time-last)/16.67||1,2);last=time;let moving=false;
  const targetInfluence=inside&&!pref.matches ? .8 : 0;
  const shapeDelta=Math.abs(targetPhase-phase)+Math.abs(targetInfluence-influence)+Math.abs(pointer.x-sculpturePointer.x)+Math.abs(pointer.y-sculpturePointer.y);
  if(pref.matches){phase=targetPhase;influence=0;sculpturePointer={x:.5,y:.5};}
  else if(shapeDelta>.002){const blend=1-Math.pow(.91,dt);phase+=(targetPhase-phase)*blend;influence+=(targetInfluence-influence)*blend;sculpturePointer.x+=(pointer.x-sculpturePointer.x)*blend;sculpturePointer.y+=(pointer.y-sculpturePointer.y)*blend;energy=1;moving=true;}

  cards.forEach((card,i)=>{const n=nodes[i];let tx=n.tx,ty=n.ty;
   const near=inside&&Math.hypot(n.tx-pointer.x*w,n.ty-pointer.y*h)<Math.max(w*.14,70);
   if(near){n.lastSeen=time;trace(i);}
   const focused=document.activeElement===card;
   const targetReveal=(near||pinned===i||focused||time-n.lastSeen<1400)?1:0;
   n.reveal=pref.matches?targetReveal:n.reveal+(targetReveal-n.reveal)*Math.min(1,dt*(targetReveal ? .24 : .10));
   if(Math.abs(n.reveal-targetReveal)>.005||(!near&&time-n.lastSeen<1450))moving=true;
   if(Math.abs(n.reveal-targetReveal)<.005)n.reveal=targetReveal;
   card.style.opacity=n.reveal;card.style.visibility=n.reveal>.01?'visible':'hidden';card.style.pointerEvents=n.reveal>.35?'auto':'none';card.tabIndex=n.reveal>.35?0:-1;

   if(inside&&!pref.matches){const dx=n.tx-pointer.x*w,dy=n.ty-pointer.y*h,dist=Math.hypot(dx,dy)||1;const force=Math.max(0,1-dist/(w*.3));if(i!==active){tx+=dx/dist*force*20;ty+=dy/dist*force*20;}else{tx+=(pointer.x-.5)*6;ty+=(pointer.y-.5)*6;}}
   if(pref.matches){n.x=tx;n.y=ty;n.vx=n.vy=0;}else{n.vx=(n.vx+(tx-n.x)*.045*dt)*(.76**dt);n.vy=(n.vy+(ty-n.y)*.045*dt)*(.76**dt);n.x+=n.vx*dt;n.y+=n.vy*dt;}
   card.style.transform=`translate3d(${n.x}px,${n.y}px,0) translate(-50%,-50%) rotate(${n.angle}deg) scale(${.86+n.reveal*.14})`;
   if(Math.abs(tx-n.x)+Math.abs(ty-n.y)+Math.abs(n.vx)+Math.abs(n.vy)>.1)moving=true;
  });
  if(energy&&(time-lastDraw>32||pref.matches)){draw();energy=0;lastDraw=time;}else if(energy)moving=true;if(moving)wake();
 }
 function wake(){if(!raf&&!disposed)raf=requestAnimationFrame(frame);}
 function layout(){w=stage.clientWidth;h=stage.clientHeight;const dpr=Math.min(devicePixelRatio,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx?.setTransform(dpr,0,0,dpr,0,0);
  const cols=w<600?3:5,rows=Math.ceil(cards.length/cols);
  cards.forEach((card,i)=>{const n=nodes[i];card.hidden=false;card.classList.toggle('is-current',i===active);card.setAttribute('aria-pressed',i===active);
   const row=Math.floor(i/cols),col=i%cols;
   const x=.12+col/(cols-1)*.76+(row%2?.015:-.015),y=.13+row/(rows-1)*.74;
   n.tx=x*w;n.ty=y*h;n.angle=((i*7)%9)-4;card.style.width=w<600?'24%':'13%';card.style.zIndex=i===active?'5':'2';if(!n.init||pref.matches){n.x=n.tx;n.y=n.ty;n.init=true;}
  });energy=1;wake();
 }
 function select(i,reveal=true){pinned=reveal?i:-1;active=i;trace(i);targetPhase=i*.37+visited.size*.15;layout();root.style.setProperty('--living-accent','#d9c7a0');}
 function move(e){if(e.pointerType==='touch')return;pinned=-1;const r=stage.getBoundingClientRect();pointer={x:(e.clientX-r.left)/w,y:(e.clientY-r.top)/h};inside=true;wake();}
 function leave(){inside=false;clearTimeout(hoverTimer);wake();}
 function hover(e){const card=e.target.closest('.living-fragment');if(!card||e.pointerType==='touch')return;clearTimeout(hoverTimer);const i=Number(card.dataset.livingIndex);if(i!==active)hoverTimer=setTimeout(()=>{if(!document.body.classList.contains('project-open'))onSelect(i)},850);}
 function out(e){if(e.target.closest('.living-fragment')&&!e.target.closest('.living-fragment').contains(e.relatedTarget))clearTimeout(hoverTimer);}
 function click(e){const card=e.target.closest('.living-fragment');if(card){clearTimeout(hoverTimer);const i=Number(card.dataset.livingIndex);e.preventDefault();e.stopPropagation();onSelect(i);root.querySelector('[data-focus-open]').click();}
  if(e.target===stage||e.target.closest('.living-axis')){const r=stage.getBoundingClientRect();pointer={x:(e.clientX-r.left)/w,y:(e.clientY-r.top)/h};inside=true;const nearest=nodes.reduce((best,n,i)=>Math.hypot(n.tx-e.clientX+r.left,n.ty-e.clientY+r.top)<best.d?{i,d:Math.hypot(n.tx-e.clientX+r.left,n.ty-e.clientY+r.top)}:best,{i:0,d:Infinity});pinned=nearest.i;wake();}
  if(e.target.closest('[data-save-imprint]'))save();
  if(e.target.closest('[data-reset-imprint]')){visited.clear();root.querySelectorAll('.encountered').forEach(el=>el.classList.remove('encountered'));trace(active);targetPhase=active*.37+.15;energy=1;wake();}
 }
 function save(){
  const svg=filamentSVG(paths,w,h,visited.size);
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));const a=document.createElement('a');a.href=url;a.download='focus-your-imprint.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 stage.addEventListener('pointermove',move);stage.addEventListener('pointerleave',leave);stage.addEventListener('pointerover',hover);stage.addEventListener('pointerout',out);root.addEventListener('click',click);
 const ro=new ResizeObserver(layout);ro.observe(stage);pref.addEventListener('change',layout);select(active,false);
 return {select,dispose(){disposed=true;cancelAnimationFrame(raf);clearTimeout(hoverTimer);ro.disconnect();pref.removeEventListener('change',layout);stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerleave',leave);stage.removeEventListener('pointerover',hover);stage.removeEventListener('pointerout',out);root.removeEventListener('click',click);}};
}
