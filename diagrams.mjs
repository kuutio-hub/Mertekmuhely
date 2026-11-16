export const escape = value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const palette={dark:'#203e35',soft:'#b7c9ba',fill:'#e1eadb'};
function line(a,b,other=''){
 return '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" '+other+'/>';
}
function text(x,y,value,other=''){
 return '<text x="'+x+'" y="'+y+'" '+other+'>'+escape(value)+'</text>';
}
const frame=(content,label,view='0 0 360 215')=>'<div class="diagram"><svg viewBox="'+view+'" role="group" aria-label="'+escape(label)+'" xmlns="http://www.w3.org/2000/svg"><g font-family="system-ui,sans-serif" font-size="12" fill="'+palette.dark+'">'+content+'</g></svg></div>';
function shape(d){
 const {points:p}=d, solid='stroke="#2c5647" stroke-width="2"';
 const center=Object.values(p).reduce(([sx,sy],[x,y])=>[sx+x/Object.keys(p).length,sy+y/Object.keys(p).length],[0,0]);
 let out=Object.keys(p).length===3?'<polygon points="'+Object.values(p).map(a=>a.join(',')).join(' ')+'" fill="#dcead9"/>':'';
 for(const edge of d.edges)out+=line(p[edge[0]],p[edge[1]],solid+(Object.keys(p).length===8&&['CD','DA','DH'].includes(edge)?' stroke-dasharray="5 4"':''));
 for(const [key,label] of d.labels){
   const [a,b]=[p[key[0]],p[key[1]]],x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;
   const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),sign=(-dy*(x-center[0])+dx*(y-center[1]))>=0?1:-1;
   const ox=-dy/len*12*sign,oy=dx/len*12*sign;
   if(label==='≡'){
     out+=line([x-ox/2,y-oy/2],[x+ox/2,y+oy/2],solid);
   }else{
     const first=[a[0]+ox,a[1]+oy],last=[b[0]+ox,b[1]+oy],thin='stroke="#607c67" stroke-width="1"';
     out+=line(a,first,thin)+line(b,last,thin)+line(first,last,thin);
     out+=text(x+ox*1.75,y+oy*1.55+4,label,'text-anchor="middle" font-weight="650" paint-order="stroke" stroke="#f4f7ee" stroke-width="4"');
   }
 }
 for(const [key,label] of d.angle??[]){
   const [a,b,c]=[p[key[0]],p[key[1]],p[key[2]]],u=Math.atan2(a[1]-b[1],a[0]-b[0]),v=Math.atan2(c[1]-b[1],c[0]-b[0]);
   const delta=Math.atan2(Math.sin(v-u),Math.cos(v-u)),radius=20;
   const loc=(angle,length)=>[b[0]+Math.cos(angle)*length,b[1]+Math.sin(angle)*length];
   const start=loc(u,radius),end=loc(u+delta,radius),mid=loc(u+delta/2,37);
   out+='<path d="M '+start.join(' ')+' A 20 20 0 0 '+(delta>0?1:0)+' '+end.join(' ')+'" fill="none" stroke="#855221" stroke-width="1.7"/>';
   out+=text(mid[0],mid[1]+4,label,'text-anchor="middle" fill="#764918" font-weight="700"');
 }
 for(const [tag,[x,y]] of Object.entries(p)){
   out+='<circle cx="'+x+'" cy="'+y+'" r="2.6" fill="#203e35"/>';
   out+=text(x+(x<center[0]?-10:10),y+(y<center[1]?-6:12),tag,'text-anchor="middle" font-weight="750"');
 }
 out+=text(14,204,'Vázlat, nem méretarányos','font-size="10" fill="#52655c"');
 return frame(out,'Geometriai vázlat. '+d.labels.map(([k,v])=>k+' '+v).join(', ')+(d.angle??[]).map(([k,v])=>', '+k+' szög '+v).join(''));
}
function grid(d,{interactive=false,selection='',solution=''}){
 const pos=(x,y)=>[180+x*16,105-y*16], range=Array.from({length:13},(_,i)=>i-6);
 let out='';
 for(const i of range){
   const style=i===0?'stroke="#547567" stroke-width="1.8"':'stroke="#cadaCB" stroke-width=".85"';
   out+=line(pos(i,-6),pos(i,6),style)+line(pos(-6,i),pos(6,i),style);
   if(i&&i%2===0){out+=text(pos(i,0)[0],116,i,'font-size="8" text-anchor="middle"');out+=text(183,pos(0,i)[1]+3,i,'font-size="8"');}
 }
 out+=text(282,106,'x')+text(180,7,'y');
 for(const edge of d.segments??[])out+=line(pos(...d.points[edge[0]]),pos(...d.points[edge[1]]),'stroke="#477565" stroke-width="2"');
 if(interactive)for(const y of range.slice().reverse())for(const x of range){
   const p=pos(x,y),key=x+','+y;
   out+='<g class="plot-target" data-point="'+key+'" role="button" tabindex="-1" aria-label="('+x+'; '+y+')" aria-pressed="'+(selection===key)+'"><circle cx="'+p[0]+'" cy="'+p[1]+'" r="8" fill="transparent"/><circle class="point" cx="'+p[0]+'" cy="'+p[1]+'" r="2.5"/></g>';
 }
 for(const [name,coords] of Object.entries(d.points)){
   const [x,y]=pos(...coords);out+='<circle cx="'+x+'" cy="'+y+'" r="4" fill="#203e35" pointer-events="none"/>'+text(x+6,y-5,name,'font-weight="750" pointer-events="none"');
 }
 if(solution){
   const [x,y]=pos(...solution.split(',').map(Number));out+='<circle cx="'+x+'" cy="'+y+'" r="6" fill="none" stroke="#a04723" stroke-width="2"/>';
 }
 return frame(out,'Koordináta-rács. '+Object.entries(d.points).map(([k,v])=>k+' ('+v.join('; ')+')').join(', '));
}
function stacks(d){
 const size=30,left=(360-d.heights[0].length*size)/2,top=38;
 let out='';
 d.heights.forEach((row,y)=>row.forEach((height,x)=>{
   const a=left+x*size,b=top+y*size;
   out+='<rect x="'+a+'" y="'+b+'" width="30" height="30" fill="'+(height?'#d5e5d6':'#fffefa')+'" stroke="#527765"/>';
   out+=text(a+15,b+19,height,'text-anchor="middle" font-weight="700"');
 }));
 const bottom=top+d.heights.length*size;
 out+=line([180,bottom+23],[180,bottom+7],'stroke="#527765" stroke-width="2"')+line([180,bottom+7],[176,bottom+12],'stroke="#527765"')+line([180,bottom+7],[184,bottom+12],'stroke="#527765"');
 out+=text(180,bottom+37,'Elölnézet innen','text-anchor="middle" font-weight="700"');
 return frame(out,'Felülnézet, a magasságok soronként: '+d.heights.map(row=>row.join(', ')).join(' / '),'0 0 360 '+(bottom+49));
}
function bars(d){
 const base=182,top=18,k=(base-top)/12;
 let out='';
 for(let i=0;i<=12;i++){
   const y=base-i*k;out+=line([45,y],[330,y],'stroke="#c7d6c7"')+text(36,y+4,i,'text-anchor="end" font-size="10"');
 }
 d.values.forEach((v,i)=>{
   out+='<rect x="'+(65+i*67)+'" y="'+(base-v*k)+'" width="37" height="'+v*k+'" fill="#477565"/>';
   out+=text(83+i*67,200,['Hétfő','Kedd','Szerda','Csütörtök'][i],'text-anchor="middle"');
 });
 return frame(out,'Oszlopdiagram, hétfőtől csütörtökig. Adatok: '+d.values.join(', ')+' darab.');
}
export function diagram(d,options={}){
 if(!d)return '';
 if(d.type==='shape')return shape(d);
 if(d.type==='grid')return grid(d,options);
 if(d.type==='stacks')return stacks(d);
 return bars(d);
}
export function cellGrid(f,values=[],interactive=false){
 return '<div class="cell-grid" style="grid-template-columns:repeat('+f.cols+',1fr)">'+Array.from({length:f.cols*f.rows},(_,i)=>
  '<button type="button" class="cell" '+(interactive?'data-cell="'+i+'"':'disabled')+' aria-pressed="'+values.includes(i)+'" aria-label="'+(Math.floor(i/f.cols)+1)+'. sor, '+(i%f.cols+1)+'. oszlop">'+(values.includes(i)?'■':'·')+'</button>').join('')+'</div>';
}
export const heroArt='<svg viewBox="0 0 420 284" aria-hidden="true" fill="none"><path d="M37 215H390M94 260V26" stroke="#78a287" stroke-width="1.5" opacity=".55"/><path d="M94 215 242 64 347 215Z" stroke="#ecf5ac" stroke-width="3" fill="#3c6751"/><path d="M242 64v151" stroke="#c0d796" stroke-width="2" stroke-dasharray="5 6"/><path d="M242 198h17v17" stroke="#c0d796" stroke-width="2"/><path d="M120 189a37 37 0 0 1 11 26" stroke="#edf5b4" stroke-width="2"/><g fill="#edf5b4" font-family="Georgia" font-style="italic" font-size="21"><text x="72" y="232">A</text><text x="352" y="231">B</text><text x="248" y="57">C</text><text x="145" y="204">α</text><text x="255" y="148">m</text></g><circle cx="94" cy="215" r="4" fill="#edf5b4"/><circle cx="242" cy="64" r="4" fill="#edf5b4"/><circle cx="347" cy="215" r="4" fill="#edf5b4"/></svg>';
