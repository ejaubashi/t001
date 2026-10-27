// Original procedural geometry: cross-sections swept through a folded spatial spine.
// Shared geometry feeds Canvas and SVG so the exported drawing matches the screen.
export function filamentGeometry(width,height,{phase=0,pointer={x:.5,y:.5},influence=0,layers=1}={}){
 const paths=[],count=width<600?150:240,steps=76;
 for(let i=0;i<count;i++){
  const t=i/(count-1),u=t*Math.PI*2;
  const cx=.08+.84*t,cy=.49+.18*Math.sin(u*1.3+phase*.3);
  const radius=(.085+.13*Math.pow(Math.sin(Math.PI*t),.7))*(.8+.2*Math.cos(u*2.5+phase));
  const twist=u*1.7+phase*.36,points=[];
  for(let j=0;j<=steps;j++){
   const a=j/steps*Math.PI*2;
   const fold=1+.20*Math.sin(a*3+u*2+phase)+.08*Math.sin(a*5-u*3);
   const r=radius*fold,px=Math.cos(a)*r,py=Math.sin(a)*r;
   let x=cx+px*Math.cos(twist)*.63+py*Math.sin(twist)*.18;
   let y=cy+py*Math.cos(twist)*1.05-px*Math.sin(twist)*.95;
   const z=Math.cos(a+twist)*r*.7+Math.sin(u*1.5)*.05;
   x=.5+(x-.5)*(1+z*.7);y=.5+(y-.5)*(1+z*.7);
   const dx=x-pointer.x,dy=y-pointer.y,d=Math.hypot(dx,dy),force=Math.exp(-d*d*32)*influence;
   x+=dx*force*.25;y+=dy*force*.3;
   points.push([x*width,y*height]);
  }
  const shade=.34+.44*(.5+.5*Math.sin(twist+.9));
  paths.push({points,opacity:shade,color:i%29<2&&layers>1?'#ff9584':'#ff493f'});
 }
 return paths;
}
export function paintFilament(ctx,paths,width,height){
 ctx.clearRect(0,0,width,height);ctx.lineWidth=.55;
 for(const {points,opacity,color} of paths){ctx.strokeStyle=color;ctx.globalAlpha=opacity;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();}ctx.globalAlpha=1;
}
export function filamentSVG(paths,width,height,encounters){
 const lines=paths.map(({points,opacity,color})=>`<path d="${points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')}Z" fill="none" stroke="${color}" stroke-opacity="${opacity.toFixed(3)}" stroke-width=".55"/>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width*2}" height="${(height+55)*2}" viewBox="0 0 ${width} ${height+55}"><rect width="100%" height="100%" fill="#100b0c"/>${lines}<text x="24" y="${height+30}" fill="#ff786e" font-family="monospace" font-size="9">FOCUS / LIVING FILAMENT / ${encounters} ENCOUNTERS</text></svg>`;
}
