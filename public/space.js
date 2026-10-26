// The themed scene is independent of routing: gallery/project links and native
// touch scrolling continue to work while the stars and pointer effects run.
export function createSpaceMode({texts, reduced}) {
  const starsCanvas=document.querySelector('#stars');
  const effects=document.createElement('canvas');effects.id='space-effects';effects.setAttribute('aria-hidden','true');document.body.append(effects);
  const crawl=document.createElement('dialog');crawl.id='space-crawl';crawl.setAttribute('aria-label','Star Wars opening crawl');
  const close=document.createElement('button');close.className='crawl-close pill';close.textContent='Back';close.setAttribute('aria-label','Close opening crawl');
  const stage=document.createElement('div');stage.className='crawl-stage';const copy=document.createElement('div');copy.className='crawl-copy';
  const title=document.createElement('h2');title.textContent='A portfolio, far away…';copy.append(title);
  texts.forEach(text=>{const p=document.createElement('p');p.textContent=text;copy.append(p);});stage.append(copy);crawl.append(close,stage);document.body.append(crawl);
  const ctx=starsCanvas.getContext('2d'),fx=effects.getContext('2d');
  let active=false,frame=0,width=0,height=0,last=0,particles=[],pointer=null,previous=null,down=false,dragged=false,suppressClick=false,trail=[],cuts=new Map(),held=false;
  function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);for(const canvas of [starsCanvas,effects]){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}ctx?.setTransform(dpr,0,0,dpr,0,0);fx?.setTransform(dpr,0,0,dpr,0,0);particles=Array.from({length:420},()=>({x:(Math.random()-.5)*width*2.8,y:(Math.random()-.5)*height*2.8,z:Math.random()*1600+100,r:Math.random()+.2}));}
  function draw(now){if(!active)return;const dt=Math.min(50,now-last||16)/16;last=now;ctx?.clearRect(0,0,width,height);fx?.clearRect(0,0,width,height);
    if(ctx)for(const p of particles){if(!reduced.matches)p.z-=.8*dt;if(p.z<50){p.z=1700;p.x=(Math.random()-.5)*width*2.8;p.y=(Math.random()-.5)*height*2.8;}const scale=650/p.z,x=width/2+p.x*scale,y=height/2+p.y*scale;if(x<0||x>width||y<0||y>height)continue;ctx.beginPath();ctx.fillStyle=`rgba(255,255,255,${Math.min(.9,.15+scale*.4)})`;ctx.arc(x,y,Math.min(2.1,p.r*scale),0,Math.PI*2);ctx.fill();}
    trail=trail.filter(p=>now-p.time<350);
    if(fx&&!reduced.matches){for(let i=1;i<trail.length;i++){const a=trail[i-1],b=trail[i];fx.beginPath();fx.moveTo(a.x,a.y);fx.lineTo(b.x,b.y);fx.strokeStyle=`rgba(103,183,255,${(1-(now-b.time)/350)*.65})`;fx.lineWidth=3;fx.shadowColor='#238dff';fx.shadowBlur=18;fx.stroke();}
      if(pointer&&!crawl.open){const x=pointer.x,y=pointer.y;for(const [line,blur,color] of [[12,24,'#338bff'],[5,12,'#86c8ff'],[2,3,'#fff']]){fx.beginPath();fx.moveTo(x,y);fx.lineTo(x+18,y+105);fx.lineWidth=line;fx.lineCap='round';fx.strokeStyle=color;fx.shadowColor='#239aff';fx.shadowBlur=blur;fx.stroke();}fx.shadowBlur=0;}}
    if(!reduced.matches)frame=requestAnimationFrame(draw);
  }
  function cut(media,a,b){if(reduced.matches)return;const rect=media.getBoundingClientRect();if(!rect.width||!rect.height)return;let mask=cuts.get(media);if(!mask){const canvas=document.createElement('canvas');canvas.width=400;canvas.height=Math.round(400*rect.height/rect.width);const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);mask={canvas,context};cuts.set(media,mask);}const {canvas,context}=mask;context.globalCompositeOperation='destination-out';context.strokeStyle='#000';context.lineWidth=7;context.lineCap='round';context.beginPath();context.moveTo((a.x-rect.left)/rect.width*canvas.width,(a.y-rect.top)/rect.height*canvas.height);context.lineTo((b.x-rect.left)/rect.width*canvas.width,(b.y-rect.top)/rect.height*canvas.height);context.stroke();const url=`url(${canvas.toDataURL()})`;media.style.maskImage=url;media.style.webkitMaskImage=url;media.classList.add('space-cut');}
  function showCrawl(hold=false){if(!active||crawl.open||document.body.classList.contains('project-open'))return;held=hold;crawl.showModal();document.body.classList.add('crawl-open');copy.style.animation='none';void copy.offsetWidth;copy.style.animation='';close.focus();}
  function hideCrawl(){if(crawl.open)crawl.close();held=false;document.body.classList.remove('crawl-open');}
  close.addEventListener('click',hideCrawl);crawl.addEventListener('close',()=>{held=false;document.body.classList.remove('crawl-open');});
  window.addEventListener('keydown',e=>{if(e.code!=='KeyF'||e.repeat||e.metaKey||e.ctrlKey||e.altKey||e.target.closest('input,textarea,select,[contenteditable]'))return;if(active){e.preventDefault();showCrawl(true);}});
  window.addEventListener('keyup',e=>{if(e.code==='KeyF'&&held)hideCrawl();});window.addEventListener('blur',()=>{down=false;pointer=null;if(held)hideCrawl();});
  document.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;return;}if(e.target.closest('[data-crawl]'))showCrawl();},true);
  window.addEventListener('pointerdown',e=>{if(!active||crawl.open||e.button!==0||e.pointerType==='touch')return;down=true;dragged=false;previous={x:e.clientX,y:e.clientY};});
  window.addEventListener('pointermove',e=>{if(!active||crawl.open)return;const next={x:e.clientX,y:e.clientY,time:performance.now()};pointer=next;if(previous&&Math.hypot(next.x-previous.x,next.y-previous.y)>3){trail.push(next);if(down&&e.pointerType!=='touch'){dragged=true;const media=document.elementFromPoint(next.x,next.y)?.closest('.media');if(media)cut(media,previous,next);}}previous=next;},{passive:true});
  window.addEventListener('pointerup',()=>{if(down&&dragged){suppressClick=true;setTimeout(()=>suppressClick=false,100);}down=false;});document.documentElement.addEventListener('pointerleave',()=>pointer=null);
  window.addEventListener('resize',()=>{if(active){resize();cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);}});reduced.addEventListener('change',()=>{if(active){cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);}});
  return {start(){active=true;resize();cancelAnimationFrame(frame);last=0;frame=requestAnimationFrame(draw);},stop(){active=false;cancelAnimationFrame(frame);hideCrawl();fx?.clearRect(0,0,width,height);cuts.forEach((_,media)=>{media.style.maskImage='';media.style.webkitMaskImage='';media.classList.remove('space-cut');});cuts.clear();pointer=null;previous=null;trail=[];down=false;},showCrawl};
}
