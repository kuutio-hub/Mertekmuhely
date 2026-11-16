export const fmt = n => new Intl.NumberFormat('hu-HU',{maximumSignificantDigits:12}).format(n);
export const close = (a,b) => Number.isFinite(a) && Math.abs(a-b) <= Math.max(1e-13,Math.abs(b)*1e-11);
export function number(text) {
  const s=String(text??'').trim().replace(/[−]/g,'-');
  const m=s.match(/^([+-]?(?:\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:[.,]\d+)?|[+-]?[.,]\d+)(?:\s*\/\s*([+-]?\d+))?$/);
  return m ? Number(m[1].replace(/\s/g,'').replace(',','.')) / (m[2]===undefined?1:Number(m[2])) : NaN;
}
export function random(seed) {
  let s=2166136261; for(const c of seed) s=Math.imul(s^c.charCodeAt(0),16777619);
  return (a,b)=>{s=(Math.imul(1664525,s)+1013904223)|0;return a+Math.floor((s>>>0)/4294967296*(b-a+1));};
}
export const pick=(r,items)=>items[r(0,items.length-1)];
export function shuffle(r,items) {
  const a=[...items];
  for(let i=a.length-1;i>0;i--){const j=r(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;
}
export const bridges=[
  {from:'m³',to:'l',factor:1000},
  {from:'dm³',to:'l',factor:1},
  {from:'cm³',to:'ml',factor:1}
];
export function route(scales,from,to) {
  if(from===to)return [];
  const edges=scales.flatMap(s=>s.steps.map(x=>({from:x.fromUnit,to:x.toUnit,factor:x.factor}))).concat(bridges);
  const all=edges.flatMap(e=>[e,{from:e.to,to:e.from,factor:1/e.factor}]);
  const queue=[{unit:from,path:[]}],seen=new Set([from]);
  for(const {unit,path} of queue)for(const e of all.filter(x=>x.from===unit)){
    if(seen.has(e.to))continue;
    const next=[...path,e];if(e.to===to)return next;
    seen.add(e.to);queue.push({unit:e.to,path:next});
  }
  return null;
}
const n=(label,answer,unit='',wrong={})=>({label,answer,unit,wrong,type:'number'});
const option=(r,label,answer,choices)=>({label,answer,choices:shuffle(r,[...new Set(choices)]),type:'choice'});
const point=(label,x,y)=>({label,answer:x+','+y,type:'point'});
const cells=(label,answer,cols,rows)=>({label,answer,cols,rows,type:'cells'});
const q=(prompt,fields,hint,explanation,diagram)=>({prompt,fields,hint,explanation,diagram});
const shape=(points,edges,labels=[],angle)=>({type:'shape',points,edges,labels,angle});
const tri=(labels,angle)=>shape({A:[55,172],B:[303,172],C:[120,42]},['AB','BC','CA'],labels,angle);
const box=(labels)=>shape({A:[50,165],B:[230,165],C:[300,114],D:[120,114],E:[50,85],F:[230,85],G:[300,34],H:[120,34]},['AB','BC','CD','DA','EF','FG','GH','HE','AE','BF','CG','DH'],labels);
const formula=(a,u)=>fmt(a)+' '+u;
const templates=[];
function define(id,topic,level,build){templates.push({id,topic,level,build});}
for(const id of ['hossz','tomeg','terulet','terfogat','urtartalom','ido','szog']){
  define('egyenes-'+id,id,1,(r,s)=>{
    const scale=s.find(x=>x.id===id), i=r(0,scale.units.length-2),j=r(i+1,Math.min(i+2,scale.units.length-1));
    const rev=r(0,1), a=scale.units[rev?j:i],b=scale.units[rev?i:j],value=r(2,85)/(rev?1:pick(r,[1,10]));
    const ratio=a.factorToBase/b.factorToBase, answer=value*ratio;
    return q(formula(value,a.symbol)+' = … '+b.symbol,[n('Hiányzó érték',answer,b.symbol,{[value/ratio]:'Úgy tűnik, megfordítottad a művelet irányát.'})],
      rev?'Nagyobb egység felé oszd el a mérőszámot.':'Kisebb egység felé szorozd meg a mérőszámot.',
      formula(value,a.symbol)+' = '+fmt(value)+(rev?' ÷ '+fmt(1/ratio):' × '+fmt(ratio))+' = '+formula(answer,b.symbol)+'.');
  });
  define('hiany-'+id,id,2,(r,s)=>{
    const scale=s.find(x=>x.id===id),i=r(0,scale.units.length-2),a=scale.units[i].symbol,b=scale.units[i+1].symbol,k=scale.steps[i].factor;
    const x=r(2,35), z=r(1,8), y=r(1,9), target=x*k+z*k+y;
    return q(formula(x,a)+' + … '+b+' = '+formula(target,b),[n('Az első tag átváltva',x*k,b),n('A hiányzó tag',z*k+y,b)],
       'Az összeadás előtt hozd a tagokat azonos egységre.',
       formula(x,a)+' = '+formula(x*k,b)+'. A hiányzó tag: '+fmt(target)+' − '+fmt(x*k)+' = '+formula(z*k+y,b)+'.');
  });
}
define('negyzetes','terulet',2,(r)=>{
 const x=r(2,95),val=x/100,a=x*100,b=a+pick(r,[-1,1])*r(2,18);
 return q('Melyik terület nagyobb?',[option(r,'Nagyobb terület',a>b?formula(val,'m²'):formula(b,'cm²'),[formula(val,'m²'),formula(b,'cm²'),'Egyenlők'])],
 '1 m² = 100 cm × 100 cm. Hozd az adatokat cm²-re.',formula(val,'m²')+' = '+formula(a,'cm²')+'. Hasonlítsd össze '+fmt(b)+' cm²-rel.');
});
define('liter-hid','terfogat',2,r=>{
 const x=r(22,95),y=r(1,Math.floor(x/10)-1),all=x*100,res=all-y*1000;
 return q(formula(x/10,'dm³')+' = '+formula(y,'l')+' + … ml',[n('Teljes mennyiség',all,'ml'),n('Maradék',res,'ml',{[all]:'A teljes mennyiséget jól kaptad meg. Még vond le a megadott litereket.'})],
 '1 dm³ = 1 l. Válts mindent milliliterre.',fmt(all)+' ml − '+fmt(y*1000)+' ml = '+fmt(res)+' ml.');
});
define('ora-hiba','ido',2,r=>{
 const h=r(0,8),p=pick(r,[15,30,45]),x=h+p/60;
 return q('Írd fel '+fmt(x)+' óra időtartamot óra és perc alakban.',[n('Egész órák',h,'óra'),n('Maradék percek',p,'perc',{[Math.round((x-h)*100)]:'Az óra törtrészét 60-nal szorozzuk 100 helyett.'})],
 'A tizedes rész egy egész órának a törtrésze.','A tört rész '+fmt(x-h)+' óra. '+fmt(x-h)+' × 60 = '+p+' perc.');
});
define('meretarany','hossz',3,r=>{
 const cm=r(2,12),scale=pick(r,[25000,50000,100000]),detour=r(2,9)/10,total=cm*scale/100000+detour;
 return q('A térkép méretaránya 1 : '+fmt(scale)+'. A térképen '+cm+' cm-es szakaszhoz tartozó úthoz '+fmt(detour)+' km kerülőt adunk.',
 [n('A szakasz valós hossza',cm*scale,'cm'),n('A szakasz valós hossza kilométerben',cm*scale/100000,'km'),n('Út a kerülővel',total,'km')],
 'Előbb a térkép méretarányával számolj, majd válts kilométerre.',
 cm+' × '+fmt(scale)+' = '+fmt(cm*scale)+' cm; ez '+fmt(cm*scale/100000)+' km. A kerülővel '+fmt(total)+' km.');
});
define('csomag','tomeg',3,r=>{
 const kg=r(2,8),dkg=r(5,45),g=r(5,16)*50,count=r(2,6),each=kg*1000+dkg*10,total=each*count+g;
 return q(count+' csomag készül. Egy csomagban '+kg+' kg és '+dkg+' dkg áru van. A teljes üres láda '+g+' g.',
 [n('Egy csomag tömege',each,'g'),n('A csomagok együtt',each*count,'g'),n('A megrakott láda tömege',total/1000,'kg')],
 'A darabonkénti tömeget először fejezd ki grammban.',
 fmt(each)+' g × '+count+' + '+g+' g = '+fmt(total)+' g = '+fmt(total/1000)+' kg.');
});
define('egyseg-valasztas','hossz',1,r=>{
 const cm=r(4,9)*25;
 const opts=[formula(cm/100,'m'),formula(cm/10,'m'),formula(cm*10,'m')];
 return q('Melyik egyenlő '+formula(cm,'cm')+'-rel?',[option(r,'Egyenlő hossz',opts[0],opts)],
 'Egy méterben száz centiméter van.',fmt(cm)+' ÷ 100 = '+formula(cm/100,'m')+'.');
});
define('menetrend','ido',3,r=>{
 const a=r(12,58),b=r(3,58),x=r(6,Math.min(20,a+b));
 return q('Az út 23:'+String(60-a).padStart(2,'0')+'-kor indult és másnap 00:'+String(b).padStart(2,'0')+'-kor ért véget. Útközben '+x+' perc szünet volt. Add meg az eltelt időket.',
 [n('Éjfélig eltelt idő',a,'perc'),n('Teljes idő',a+b,'perc'),n('Mozgásban töltött idő',a+b-x,'perc')],
 'Bontsd ketté az időtartamot éjfélnél.',a+' + '+b+' = '+(a+b)+' perc telt el. A szünet levonása után '+(a+b-x)+' perc marad.');
});
define('kifolyik','urtartalom',3,r=>{
 const total=r(6,18), portion=pick(r,[150,250,350]), count=r(3,10), remain=total*1000-portion*count;
 return q('Egy '+total+' dm³-es edény tele van. Kiveszünk '+count+' adag vizet. Egy adag '+portion+' ml. Mennyi marad?',
 [n('Eredeti mennyiség',total*1000,'ml'),n('Kivett mennyiség',portion*count,'ml'),n('Maradék',remain/1000,'l')],
 'Először minden adatot ml-ben használj.',fmt(total*1000)+' − '+fmt(portion*count)+' = '+fmt(remain)+' ml, azaz '+fmt(remain/1000)+' l.');
});
define('asztal','terulet',3,r=>{
 const a=r(12,23)*10,b=r(6,11)*10,k=r(1,5),total=a*b/10000;
 return q('Egy '+a+' cm × '+b+' cm-es téglalap alakú lapból '+fmt(k/10)+' m²-t levágnak.',
 [n('Eredeti terület',a*b,'cm²'),n('Levágott terület',k*1000,'cm²'),n('Maradék',total-k/10,'m²')],
 'A két területet azonos egységben vond ki.',fmt(total)+' m² − '+fmt(k/10)+' m² = '+fmt(total-k/10)+' m².');
});
define('tartaly','terfogat',3,r=>{
 const a=r(3,8)*10,b=r(2,5)*10,c=r(2,6)*10,fill=pick(r,[25,50,60,75,80]),v=a*b*c/1000,w=v*fill/100;
 return q('Az ABCDEFGH tartály belső méretei az ábrán láthatók. A tartály '+fill+'%-ig van tele.',
 [n('Teljes űrtartalom',v,'l'),n('Víz mennyisége',w,'l'),n('Szabad hely',v-w,'l')],
 'Az AB, BC és AE élek szorzata cm³-ben adja a teljes térfogatot.',
 fmt(a*b*c)+' cm³ = '+fmt(v)+' l. Ennek '+fill+'%-a '+fmt(w)+' l. Üresen marad '+fmt(v-w)+' l.',box([['AB',a+' cm'],['BC',b+' cm'],['AE',c+' cm']]));
});
define('szogek','sik',1,r=>{
 const a=r(35,55),b=r(40,65),c=180-a-b;
 return q('Számítsd ki az ACB szöget.',[n('∠ACB',c,'°')],'A háromszög belső szögeinek összege 180°.',
 '180° − '+a+'° − '+b+'° = '+c+'°.',tri([], [['BAC',a+'°'],['ABC',b+'°'],['ACB','?']]));
});
define('trapez','sik',2,r=>{
 const a=r(10,20),c=r(4,9),m=r(3,9),area=(a+c)*m/2;
 const fig=shape({A:[42,164],B:[302,164],C:[245,56],D:[101,56]},['AB','BC','CD','DA'],[['AB',a+' cm'],['CD',c+' cm']]);
 const direct=r(0,1);
 fig.points.H=[101,164];fig.edges.push('DH');fig.labels.push(['DH',direct?m+' cm':'? cm']);
 return direct?q('Az AB és CD párhuzamos, a DH szakasz a trapéz magassága. Számítsd ki a területet.',
 [n('Átlagos alaphossz',(a+c)/2,'cm'),n('Terület',area,'cm²')],
 'Az alapok átlagát szorozd a magassággal.',fmt((a+c)/2)+' × '+m+' = '+fmt(area)+' cm².',fig):
 q('Az AB és CD párhuzamos. A trapéz területe '+fmt(area)+' cm². Mekkora a DH magasság?',
 [n('Átlagos alaphossz',(a+c)/2,'cm'),n('DH magasság',m,'cm')],
 'A terület az átlagos alaphossz és a magasság szorzata.',fmt(area)+' ÷ '+fmt((a+c)/2)+' = '+m+' cm.',fig);
});
define('azonos','sik',2,r=>{
 const a=r(20,70),b=(180-a)/2;
 return q('Az ABC háromszögben AB = AC. Az A csúcsnál lévő szög '+a+'°. Határozd meg a másik két szöget.',
 [n('∠ABC',b,'°'),n('∠ACB',b,'°')],'Az AB és AC szárakkal szemközti szögek egyenlők.',
 'A két alapszög összege '+(180-a)+'°. Egyenként '+fmt(b)+'°.',tri([['AB','≡'],['AC','≡']],[['BAC',a+'°'],['ABC','?'],['ACB','?']]));
});
define('magassag','sik',3,r=>{
 const a=r(6,20),h=r(4,13),area=a*h/2;
 return q('Az ABC háromszög területe '+fmt(area)+' cm². Számítsd ki az AB oldalhoz tartozó magasságot.',
 [n('A terület kétszerese',2*area,'cm²'),n('Az AB oldal',a,'cm'),n('Magasság',h,'cm')],
 'A háromszög területe alapszor magasság osztva kettővel.',
 fmt(2*area)+' ÷ '+a+' = '+h+' cm.',tri([['AB',a+' cm']]));
});
define('tukor','koordinata',1,r=>{
 const x=pick(r,[-1,1])*r(1,4),y=pick(r,[-1,1])*r(1,4),axis=pick(r,['x','y']);
 const target=axis==='x'?[x,-y]:[-x,y];
 return q('Jelöld be A pont tükörképét az '+axis+' tengelyre.',[point('A tükörképe',...target)],
 'A tengelytől mért távolság változatlan marad.', 'A tükörkép ('+target.join('; ')+').',{type:'grid',points:{A:[x,y]}});
});
define('derks','koordinata',2,r=>{
 const x=r(-4,-1),y=r(-4,-1),u=r(1,4),v=r(1,4);
 return q('Az AC legyen vízszintes, a BC függőleges. Jelöld C-t, majd add meg az ABC háromszög területét.',
 [point('C helye',u,y),n('A háromszög területe',(u-x)*(v-y)/2,'egység²')],
 'C x-koordinátája B-től, y-koordinátája A-tól származik.',
 'C = ('+u+'; '+y+'). T = '+(u-x)+' × '+(v-y)+' ÷ 2.',{type:'grid',points:{A:[x,y],B:[u,v]}});
});
define('felezo','koordinata',3,r=>{
 const x=r(-4,-1),y=r(-4,-1),u=x+2*r(2,4),v=y+2*r(2,4),mx=(x+u)/2,my=(y+v)/2;
 return q('Jelöld be az AB szakasz F felezőpontját, majd add meg a koordinátáit.',
 [point('F helye',mx,my),n('F x-koordinátája',mx),n('F y-koordinátája',my)],
 'A megfelelő koordináták átlaga adja a felezőpontot.',
 'F = ('+mx+'; '+my+').',{type:'grid',points:{A:[x,y],B:[u,v]},segments:['AB']});
});
define('el','ter',1,r=>{
 const a=r(4,12),b=r(3,9),c=r(2,8);
 return q('Add meg a téglatest térfogatát.',[n('Térfogat',a*b*c,'cm³')],
 'Az egy csúcsból induló három él hosszát kell összeszorozni.',
 a+' × '+b+' × '+c+' = '+a*b*c+' cm³.',box([['AB',a+' cm'],['BC',b+' cm'],['AE',c+' cm']]));
});
define('szemben','ter',2,r=>{
 const faces=[['ABCD','EFGH'],['ABFE','DCGH'],['ADHE','BCGF']], [a,b]=pick(r,faces);
 return q('Melyik lap van az '+a+' lappal szemközt?',[option(r,'Szemközti lap',b,[b,...faces.filter(f=>f[0]!==a).map(f=>f[0])]),n('Közös csúcsok száma',0)],
 'A szemközti lapok párhuzamosak, és nincs közös csúcsuk.',
 'Az '+a+' lappal az '+b+' lap van szemközt. A közös csúcsok száma 0.',box([]));
});
define('takart','ter',3,r=>{
 const heights=Array.from({length:2},()=>Array.from({length:3},()=>r(0,3)));
 heights[0][r(0,2)]=3;
 const count=heights.flat().reduce((a,b)=>a+b,0), edge=r(2,4), front=Array.from({length:3},(_,i)=>Math.max(...heights.map(row=>row[i]))), mask=[];
 for(let i=0;i<3;i++)for(let j=0;j<front[i];j++)mask.push((2-j)*3+i);
 return q('A felülnézeti rács számai a kockaoszlopok magasságát mutatják. Alulról nézve rajzold meg az elölnézetet. Egy kocka éle '+edge+' cm.',
 [cells('Elölnézet',mask.sort((a,b)=>a-b),3,3),n('Kockák száma',count),n('Térfogat',count*edge**3,'cm³')],
 'Minden oszlopban a két egymás mögötti torony közül a magasabb határozza meg az elölnézetet.',
 'Az elölnézet balról mért magasságai '+front.join(', ')+'. '+count+' × '+edge+'³ = '+count*edge**3+' cm³.',{type:'stacks',heights});
});
define('ragasztas','ter',3,r=>{
 const e=r(2,7),count=r(2,6), surface=(4*count+2)*e**2;
 return q(count+' darab '+e+' cm élű kockát egy sorba ragasztunk teljes oldallapoknál. Mekkora a test felszíne?',
 [n('Egy lap területe',e**2,'cm²'),n('Eltakart lapok száma',2*(count-1)),n('Külső felszín',surface,'cm²')],
 'Minden illesztésnél két lap kerül belülre.',
 count+' × 6 − 2 × '+(count-1)+' = '+(4*count+2)+' külső lap. A felszín '+surface+' cm².',{type:'stacks',heights:[Array(count).fill(1)]});
});
define('tort','szamolas',1,r=>{
 const a=r(1,7),b=r(1,5),s=2*a+3*b;
 return q('Add össze a törteket: '+a+'/6 + '+b+'/4.',[n('Összeg (törtként is megadható)',s/12)],
 'A 6 és a 4 közös nevezője lehet 12.',(2*a)+'/12 + '+(3*b)+'/12 = '+s+'/12.');
});
define('atlag','szamolas',2,r=>{
 const a=r(2,18),b=r(2,18),c=r(2,18),m=r(10,17),d=4*m-a-b-c;
 return q('Négy szám átlaga '+m+'. Három érték: '+[a,b,c].join(', ')+'. Melyik a negyedik szám?',
 [n('A négy szám összege',4*m),n('A negyedik szám',d)],'Az átlag és a darabszám szorzata az összeg.',
 '4 × '+m+' − ('+[a,b,c].join(' + ')+') = '+d+'.');
});
define('esetek','logika',2,r=>{
 const a=r(3,8),b=r(2,6),x=r(1,b);
 return q(a+' felsőt és '+b+' nadrágot lehet párosítani. Az egyik felső '+x+' nadrággal nem párosítható; más megkötés nincs.',
 [n('Párosítások korlátozás nélkül',a*b),n('Megengedett párosítások',a*b-x)],
 'Először számold meg az összes párost, majd vond ki a tiltottakat.',a+' × '+b+' − '+x+' = '+(a*b-x)+'.');
});
define('diagram','adat',2,r=>{
 const values=Array.from({length:4},()=>r(2,12)),sum=values.reduce((a,b)=>a+b,0);
 return q('Az ábra egy iskolai gyűjtés adatait mutatja. Olvasd le a második nap eredményét és számíts átlagot.',
 [n('Kedd',values[1],'db'),n('Napi átlag',sum/4,'db')],
 'Olvasd le mind a négy oszlopot. Az összeget oszd néggyel.',
 '('+values.join(' + ')+') ÷ 4 = '+fmt(sum/4)+' db.',{type:'bars',values});
});
define('arany','arany',2,r=>{
 const small=r(2,4),big=small+r(1,4),unit=r(3,12);
 return q('Két osztály '+small+' : '+big+' arányban osztozik '+(small+big)*unit+' füzeten.',
 [n('Kisebb rész',small*unit,'db'),n('Nagyobb rész',big*unit,'db')],
 'Először az egy arányrésznyi mennyiséget számold ki.',
 (small+big)*unit+' ÷ '+(small+big)+' = '+unit+'. A részek '+small*unit+' és '+big*unit+' füzet.');
});
define('kedvezmeny','arany',3,r=>{
 const a=r(12,69)*100,p=pick(r,[10,15,20,25,30]),d=a*p/100;
 return q('Egy termék '+a+' Ft-ba kerül. Először '+p+'%-kal olcsóbb lesz, majd az új árat 10%-kal megemelik.',
 [n('Első engedmény',d,'Ft'),n('Ár az engedmény után',a-d,'Ft'),n('Végső ár',Math.round((a-d)*1.1*100)/100,'Ft')],
 'A két változáshoz külön alap tartozik.',
 fmt(a-d)+' Ft × 1,1 = '+formula((a-d)*1.1,'Ft')+'.');
});
define('maradek','szoveg',3,r=>{
 const k=r(4,24),a=4*k,b=3*k;
 return q('Egy pénzösszeg negyedét az első napon, a maradék harmadát a második napon költötték el. Ezután '+(2*k)+' ezer forint maradt.',
 [n('A második nap végére maradt rész az eredeti összeg százalékában',50,'%'),n('Kiinduló összeg',a,'ezer Ft'),n('Az első nap végére maradt összeg',b,'ezer Ft')],
 'A második napon a maradék kétharmada marad meg.',
 'Az eredeti összeg 3/4 × 2/3 = 1/2 része maradt. Az induló összeg '+a+' ezer Ft.');
});
define('sebesseg','fizika',1,r=>{
 const a=r(2,25);
 return q('Váltsd át '+fmt(a*3.6)+' km/h-t m/s-ba.',[n('Sebesség',a,'m/s')],'Km/h-ról m/s-ra oszd el az értéket 3,6-tal.',fmt(a*3.6)+' ÷ 3,6 = '+a+' m/s.');
});
define('suruseg','fizika',2,r=>{
 const a=r(10,49),v=r(2,15)*10;
 return q('A test térfogata '+v+' cm³, a tömege '+a*v/10+' g. Számítsd ki a sűrűséget.',
 [n('Sűrűség',a/10,'g/cm³'),n('Sűrűség másik egységben',a*100,'kg/m³')],
 'A sűrűség a tömeg és a térfogat hányadosa.',fmt(a/10)+' g/cm³ = '+fmt(a*100)+' kg/m³.');
});
define('ut','fizika',3,r=>{
 const t=r(2,5),v=r(12,20),rest=pick(r,[15,30,45]),d=v*(t+rest/60);
 return q('A biciklis '+fmt(d)+' km-t tesz meg '+t+' óra alatt, majd '+rest+' percet pihen. Az átlagba a pihenő is beleszámít.',
 [n('Pihenő időtartama',rest/60,'óra'),n('Teljes idő',t+rest/60,'óra'),n('Átlagsebesség',v,'km/h')],
 'Az összes megtett utat oszd a mozgás és a pihenés idejének összegével.',fmt(d)+' ÷ '+fmt(t+rest/60)+' = '+v+' km/h.');
});
export const topics={hossz:'Hosszúság',tomeg:'Tömeg',terulet:'Terület',terfogat:'Térfogat',urtartalom:'Űrtartalom',ido:'Idő',szog:'Szögmérték',sik:'Síkgeometria',koordinata:'Koordinátageometria',ter:'Térgeometria',szamolas:'Alapműveletek',logika:'Logika és kombinatorika',adat:'Diagramok',arany:'Arány és százalék',szoveg:'Szöveges feladatok',fizika:'Fizika'};
export const geometry=['sik','koordinata','ter'];
export const measures=['hossz','tomeg','terulet','terfogat','urtartalom','ido','szog'];
function generate(t,r,scales,weight=t.level) {
 const item=t.build(r,scales);
 for(const [i,f] of item.fields.entries()) f.points=Math.floor(weight/item.fields.length)+(i<weight%item.fields.length?1:0);
 return {...item,id:t.id,topic:t.topic,level:t.level,points:weight};
}
export function similar(id,seed,scales){
 const t=templates.find(x=>x.id===id);
 return t?generate(t,random(seed),scales):null;
}
export function makeRound(config,scales) {
 const r=random(config.seed), result=[];
 const poolFor=keys=>templates.filter(x=>keys.includes(x.topic));
 if(config.mode==='exam') {
   const groups=[
    [['szamolas'],4],[measures,4],[['logika'],5],[['adat'],5],[['koordinata'],5],
    [['arany'],5],[['sik'],4],[['szamolas','sik','arany'],4],[['ter'],7],[['szoveg'],7]
   ];
   for(const [keys,points] of groups) {
     const all=poolFor(keys).filter(x=>!result.some(y=>y.id===x.id));
     result.push(generate(pick(r,all),r,scales,points));
   }
 } else {
   const keys=config.branch==='geo'?geometry:config.branch==='physics'?['fizika']:config.branch==='mixed'?Object.keys(topics).filter(x=>x!=='fizika'):measures;
   if(config.physics&&!keys.includes('fizika'))keys.push('fizika');
   const pool=poolFor(keys), used=new Set(), counts={};
   const keyTargets=config.branch==='measure'?shuffle(r,[...measures]):[...keys];
   const levels=config.level==='basic'?[1,1,1,2,1,2,1,2,2,3]:config.level==='hard'?[2,2,3,2,3,2,3,2,3,3]:[1,2,1,2,1,2,1,2,3,3];
   for(const [i,lev] of levels.entries()) {
     const focus=config.focus??(i<4?config.review?.[i]:null);
     const target=config.focus??(config.physics&&i===9?'fizika':config.branch==='measure'&&i<keyTargets.length?keyTargets[i]:null);
     const newItems=pool.filter(x=>!used.has(x.id));
     const candidates=newItems.length?newItems:pool;
     const ranked=shuffle(r,candidates).map(x=>({x,cost:Math.abs(lev-x.level)*(focus||i===9&&target==='fizika'?5:100)+(counts[x.topic]??0)+(target&&x.topic!==target?18:0)+(focus&&x.topic!==focus?30:0)})).sort((a,b)=>a.cost-b.cost);
     const t=(i===0&&pool.find(x=>x.id===config.template))||ranked[0].x;
     used.add(t.id);counts[t.topic]=(counts[t.topic]??0)+1;
     result.push(generate(t,r,scales));
   }
 }
 return result;
}
export function correct(field,value) {
 if(field.type==='number')return close(number(value),field.answer);
 if(field.type==='cells')return Array.isArray(value)&&JSON.stringify([...value].sort((a,b)=>a-b))===JSON.stringify(field.answer);
 return value===field.answer;
}
export function answerText(f) {
 if(f.type==='point')return '('+f.answer.replace(',', '; ')+')';
 if(f.type==='cells')return Array.from({length:f.cols},(_,i)=>f.answer.filter(x=>x%f.cols===i).length).join(', ')+' mező oszloponként';
 if(f.type==='choice')return f.answer;
 return fmt(f.answer)+(f.unit?' '+f.unit:'');
}
