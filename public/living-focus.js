const palette=['#d4f195','#d7adff','#ff996e','#82cdd6','#eaca86'];
let marks=[];
export function mountLivingFocus(root,{projects,base,index,onSelect}){
 const stage=root.querySelector('.living-stage'),canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
 const cards=[...root.querySelectorAll('.living-fragment')],pref=matchMedia('(prefers-reduced-motion:reduce)');
 const slots=[[.54,.48,36,0],[.19,.24,16,-9],[.82,.21,15,8],[.15,.65,14,7],[.83,.68,18,-7],[.43,.13,10,5],[.43,.86,12,-5],[.88,.44,9,12],[.23,.89,8,-10]];
 let active=index,raf=0,last=0,energy=0,hoverTimer,disposed=false,w=1,h=1,pointer={x:.5,y:.5},inside=false;
 let nodes=cards.map(()=>({x:0,y:0,vx:0,vy:0,tx:0,ty:0,angle:0,visible:false,init:false}));
 const visited=new Set();
 function trace(i){if(visited.has(i))return;visited.add(i);const n=visited.size;marks.push({x:.18+((i*37+n*13)%67)/100,y:.16+((i*19+n*23)%67)/100,r:.045+(i%5)*.012,color:palette[i%palette.length],seed:i});marks=marks.slice(-60);root.querySelector('.imprint-count').textContent=`${String(visited.size).padStart(2,'0')} works encountered`;}
 function draw(){
  if(!ctx)return;ctx.clearRect(0,0,w,h);
  for(let k=0;k<marks.length;k++){
   const m=marks[k];ctx.strokeStyle=m.color;ctx.globalAlpha=.32;ctx.lineWidth=.65;
   for(let ring=0;ring<5;ring++){ctx.beginPath();for(let j=0;j<=100;j++){const a=j/100*Math.PI*2,r=m.r*(1+ring*.19)*(1+.14*Math.sin(a*3+m.seed));const x=m.x*w+Math.cos(a)*r*w,y=m.y*h+Math.sin(a)*r*h;if(!j)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
   if(k){const prev=marks[k-1];ctx.globalAlpha=.15;ctx.beginPath();ctx.moveTo(prev.x*w,prev.y*h);ctx.bezierCurveTo(m.x*w,prev.y*h,prev.x*w,m.y*h,m.x*w,m.y*h);ctx.stroke();}
  }
  ctx.globalAlpha=1;
 }
 function frame(time){raf=0;if(disposed)return;const dt=Math.min((time-last)/16.67||1,2);last=time;let moving=false;
  cards.forEach((card,i)=>{const n=nodes[i];if(!n.visible)return;let tx=n.tx,ty=n.ty;
   if(inside&&!pref.matches){const dx=n.tx-pointer.x*w,dy=n.ty-pointer.y*h,dist=Math.hypot(dx,dy)||1;const force=Math.max(0,1-dist/(w*.3));if(i!==active){tx+=dx/dist*force*20;ty+=dy/dist*force*20;}else{tx+=(pointer.x-.5)*6;ty+=(pointer.y-.5)*6;}}
   if(pref.matches){n.x=tx;n.y=ty;n.vx=n.vy=0;}else{n.vx=(n.vx+(tx-n.x)*.045*dt)*(.76**dt);n.vy=(n.vy+(ty-n.y)*.045*dt)*(.76**dt);n.x+=n.vx*dt;n.y+=n.vy*dt;}
   card.style.transform=`translate3d(${n.x}px,${n.y}px,0) translate(-50%,-50%) rotate(${n.angle}deg)`;
   if(Math.abs(tx-n.x)+Math.abs(ty-n.y)+Math.abs(n.vx)+Math.abs(n.vy)>.1)moving=true;
  });
  if(energy){draw();energy=0;}if(moving)wake();
 }
 function wake(){if(!raf&&!disposed)raf=requestAnimationFrame(frame);}
 function layout(){w=stage.clientWidth;h=stage.clientHeight;const dpr=Math.min(devicePixelRatio,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx?.setTransform(dpr,0,0,dpr,0,0);
  cards.forEach((card,i)=>{const relative=(i-active+projects.length)%projects.length;const slot=relative<=4?relative:relative>=projects.length-4?projects.length-relative+4:-1;const n=nodes[i];n.visible=slot>=0;card.hidden=!n.visible;card.tabIndex=n.visible?0:-1;card.classList.toggle('is-current',i===active);card.setAttribute('aria-pressed',i===active);if(!n.visible)return;
   const [x,y,size,angle]=slots[slot];n.tx=x*w;n.ty=y*h;n.angle=i===active?0:angle;card.style.width=`${size}%`;card.style.zIndex=i===active?'5':'2';if(!n.init||pref.matches){n.x=n.tx;n.y=n.ty;n.init=true;}
  });energy=1;wake();
 }
 function select(i){active=i;trace(i);layout();root.style.setProperty('--living-accent',palette[i%palette.length]);}
 function move(e){const r=stage.getBoundingClientRect();pointer={x:(e.clientX-r.left)/w,y:(e.clientY-r.top)/h};inside=true;wake();}
 function leave(){inside=false;clearTimeout(hoverTimer);wake();}
 function hover(e){const card=e.target.closest('.living-fragment');if(!card||e.pointerType==='touch')return;clearTimeout(hoverTimer);const i=Number(card.dataset.livingIndex);if(i!==active)hoverTimer=setTimeout(()=>{if(!document.body.classList.contains('project-open'))onSelect(i)},850);}
 function out(e){if(e.target.closest('.living-fragment')&&!e.target.closest('.living-fragment').contains(e.relatedTarget))clearTimeout(hoverTimer);}
 function click(e){const card=e.target.closest('.living-fragment');if(card){clearTimeout(hoverTimer);const i=Number(card.dataset.livingIndex);if(i!==active){e.preventDefault();e.stopPropagation();onSelect(i);}else{e.preventDefault();root.querySelector('[data-focus-open]').click();}}
  if(e.target.closest('[data-save-imprint]'))save();
  if(e.target.closest('[data-reset-imprint]')){marks=[];visited.clear();trace(active);energy=1;wake();}
 }
 function save(){
  const paths=marks.map((m,k)=>{let lines='';for(let ring=0;ring<5;ring++){let d='';for(let j=0;j<=100;j++){const a=j/100*Math.PI*2,r=m.r*(1+ring*.19)*(1+.14*Math.sin(a*3+m.seed));d+=`${j?'L':'M'}${(m.x*1400+Math.cos(a)*r*1400).toFixed(2)},${(m.y*1000+Math.sin(a)*r*1000).toFixed(2)} `;}lines+=`<path d="${d}Z" fill="none" stroke="${m.color}" stroke-width="1"/>`;}return lines;}).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1000" viewBox="0 0 1400 1000"><rect width="1400" height="1000" fill="#111310"/>${paths}<text x="48" y="940" fill="#e9ecdf" font-family="monospace" font-size="14">FOCUS / A COMPOSITION OF YOUR EXPLORATION / ${marks.length} ENCOUNTERS</text></svg>`;
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));const a=document.createElement('a');a.href=url;a.download='focus-your-imprint.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 stage.addEventListener('pointermove',move);stage.addEventListener('pointerleave',leave);stage.addEventListener('pointerover',hover);stage.addEventListener('pointerout',out);root.addEventListener('click',click);
 const ro=new ResizeObserver(layout);ro.observe(stage);pref.addEventListener('change',layout);select(active);
 return {select,dispose(){disposed=true;cancelAnimationFrame(raf);clearTimeout(hoverTimer);ro.disconnect();pref.removeEventListener('change',layout);stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerleave',leave);stage.removeEventListener('pointerover',hover);stage.removeEventListener('pointerout',out);root.removeEventListener('click',click);}};
}
