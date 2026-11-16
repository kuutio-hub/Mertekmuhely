import {fmt,number,close,route,makeRound,similar,correct,answerText,topics,geometry,measures} from './engine.mjs';
import {diagram,cellGrid,escape as e,heroArt} from './diagrams.mjs';

const main=document.querySelector('#main'), printable=document.querySelector('#print');
const keys={config:'mm-config-v1',session:'mm-session-v1',errors:'mm-errors-v1'};
const defaults={mode:'practice',branch:'measure',level:'exam',physics:false,thresholds:[40,60,75,90]};
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Private browsing may limit storage. */}};
const data=await Promise.all(['segedlet.json','archivum.json'].map(async p=>{
 const response=await fetch(new URL(p,import.meta.url));if(!response.ok)throw new Error(p);return response.json();
})).catch(()=>null);
if(!data)main.innerHTML='<div class="panel"><h2>A feladatadatok nem töltődtek be</h2><p>Nyisd meg az alkalmazást webkiszolgálón, például GitHub Pagesen.</p></div>';
else startApp(data);

function startApp([reference,archive]){
 const {scales,sections}=reference;
 let config={...defaults,...read(keys.config,{})}, session=read(keys.session,null), history=read(keys.errors,[]);
 let locked=false, convertState={group:'hossz',from:'m',to:'cm',value:'2,35',predict:false,guess:'',mixed:false,second:'',secondUnit:'',decompose:false};
 const labels={measure:'Mértékegységek',geo:'Geometria',mixed:'Vegyes matematika',physics:'Fizika'};
 const levels={basic:'Alapozó',exam:'Felvételi szint',hard:'Kihívás'};
 const randomId=()=>Array.from(crypto.getRandomValues(new Uint8Array(5)),x=>x.toString(36).padStart(2,'0')).join('');
 const stamp=(c)=>['MM1',c.mode==='exam'?'v':'g',c.branch,c.level,c.physics?'1':'0',c.seed,c.focus??'',(c.review??[]).join('.'),c.template?.replaceAll('-','_')??''].join('-');
 const decode=code=>{
   const [version,mode,branch,level,physics,seed,focus,review,template,...extra]=code.trim().split('-');
   if(version!=='MM1'||!['v','g'].includes(mode)||!Object.hasOwn(labels,branch)||!Object.hasOwn(levels,level)||!['0','1'].includes(physics)||!seed?.match(/^[a-z0-9]{10}$/)||extra.length||template&&!/^[a-z0-9_]+$/.test(template)||focus&&!Object.hasOwn(topics,focus)||review&&!review.split('.').every(x=>Object.hasOwn(topics,x)))return null;
   return {mode:mode==='v'?'exam':'practice',branch,level,physics:physics==='1',seed,focus:focus||null,review:review?review.split('.'):[],template:template?.replaceAll('_','-')};
 };
 const page=()=>location.hash.slice(1)||'kezdolap';
 const button=(label,action,primary=false,attrs='')=>'<button class="btn '+(primary?'primary':'')+'" type="button" data-action="'+action+'" '+attrs+'>'+e(label)+'</button>';
 const link=(label,url,primary=false)=>'<a class="btn '+(primary?'primary':'')+'" href="'+url+'">'+e(label)+'</a>';
 const title=(name,description='')=>'<div class="narrow"><h2>'+e(name)+'</h2>'+(description?'<p class="muted">'+e(description)+'</p>':'')+'</div>';
 const options=(values,current)=>values.map(([v,label])=>'<option value="'+e(v)+'" '+(v===current?'selected':'')+'>'+e(label)+'</option>').join('');
 const checked=b=>b?'checked':'';
 const submit=label=>'<button class="btn primary" type="submit">'+e(label)+'</button>';
 const state=()=>session?.entries[session.index];
 const task=()=>session?.tasks[session.index];
 const persist=()=>save(keys.session,session);
 const active=()=>session&&!session.done;
 function begin(c){
   const tasks=makeRound(c,scales);
   session={c,tasks,index:0,entries:tasks.map(()=>({values:{},notes:'',hint:false,assisted:false,flag:false,feedback:false})),done:false,deadline:c.mode==='exam'?Date.now()+45*60000:null};
   persist();if(page()==='feladatsor')render();else location.hash='feladatsor';
 }
 function home(){
   const cards=[
    ['↔','Mértékegységek','Hossz, tömeg, idő, terület, térfogat és űrtartalom.','#gyakorlas?measure'],
    ['△','Geometria','Szögek, pontok, testnézetek, felszín és térfogat.','#gyakorlas?geo'],
    ['◷','Próbafelvételi','10 feladat · 45 perc · 50 pont','#gyakorlas?exam']
   ];
   return '<section class="hero"><div class="hero-copy"><span class="eyebrow">Matekfelvételi · 7–8. osztály</span><h1>Gyakorolj.<br><em>Értsd is.</em></h1><p>Válts mértékegységet, rajzolj a rácson, és készülj a nyolcadikos matekfelvételire.</p><div class="actions">'+link(active()?'Feladatsor folytatása':'Gyakorlás indítása',active()?'#feladatsor':'#gyakorlas',true)+'<a class="btn secondary" href="#atvalto">Átváltó</a></div></div><div class="hero-art">'+heroArt+'</div></section><div class="section-head"><h2>Mit gyakorolsz ma?</h2></div><div class="grid">'+cards.map(([icon,name,desc,url])=>'<a class="card card-link" href="'+url+'"><span class="icon" aria-hidden="true">'+icon+'</span><h3>'+name+'</h3><p>'+desc+'</p><span class="arrow" aria-hidden="true">→</span></a>').join('')+'</div>';
 }
 function setup(){
   const preset=page().split('?')[1];
   const c={...config,...(preset==='exam'?{mode:'exam'}:preset&&Object.hasOwn(labels,preset)?{mode:'practice',branch:preset}:{})};
   return title('Új feladatsor','Válassz témát és nehézséget. Minden indítás új feladatokat ad.')+
   '<form id="setup" class="panel narrow"><div class="form-grid"><label class="field">Mód<select name="mode">'+options([['practice','Gyakorlás'],['exam','Próbafelvételi · 45 perc']],c.mode)+'</select></label><label class="field">Témakör<select name="branch">'+options(Object.entries(labels),c.branch)+'</select></label><label class="field">Nehézség<select name="level">'+options(Object.entries(levels),c.level)+'</select></label><label class="field">Kiemelt témakör<select name="focus">'+focusOptions(c.branch,c.focus,c.physics)+'</select></label></div><label class="check"><input type="checkbox" name="physics" '+checked(c.physics)+'> Fizika feladatokkal is</label><details class="thresholds"><summary>Jegyhatárok beállítása</summary><p class="muted">A gyakorlójegy minimális százalékai.</p><div class="form-grid">'+c.thresholds.map((n,i)=>'<label class="field">'+(i+2)+'-es jegy<input name="threshold'+i+'" type="number" min="1" max="100" value="'+n+'" required></label>').join('')+'</div></details><p class="error" id="setup-error" role="alert"></p>'+submit('Indítás')+'</form>'+
   '<form id="restore" class="panel narrow"><label class="field">Feladatsor megnyitása kóddal<input name="code" required placeholder="MM1-…"></label><p class="error" id="restore-error" role="alert"></p>'+submit('Megnyitás')+'</form>';
 }
 function focusOptions(branch,current,physics=false){
   const group=branch==='measure'?measures:branch==='geo'?geometry:branch==='physics'?['fizika']:Object.keys(topics).filter(x=>x!=='fizika');
   if(physics&&!group.includes('fizika'))return options([['','Vegyes'],...[...group,'fizika'].map(x=>[x,topics[x]])],current);
   return options([['','Vegyes'],...group.map(x=>[x,topics[x]])],current);
 }
 function syncSetup(form,refreshFocus=false){
   const exam=form.elements.mode.value==='exam';
   for(const key of ['branch','level','focus','physics'])form.elements[key].disabled=exam;
   form.querySelector('.thresholds').hidden=exam;
   if(refreshFocus)form.elements.focus.innerHTML=focusOptions(form.elements.branch.value,form.elements.focus.value,form.elements.physics.checked);
 }
 function fieldUi(f,i,entry){
   const v=entry.values[i], suffix=f.unit?' ('+e(f.unit)+')':'', pts='<span class="muted"> · '+f.points+' pont</span>';
   if(f.type==='number')return '<label class="field"><span>'+e(f.label)+suffix+pts+'</span><input type="text" inputmode="decimal" data-value="'+i+'" value="'+e(v)+'" autocomplete="off" spellcheck="false"></label>';
   if(f.type==='choice')return '<fieldset class="choices"><legend>'+e(f.label)+pts+'</legend>'+f.choices.map(c=>'<label><input type="radio" name="opt-'+i+'" data-value="'+i+'" value="'+e(c)+'" '+checked(v===c)+'>'+e(c)+'</label>').join('')+'</fieldset>';
   if(f.type==='point')return '<div><p><strong>'+e(f.label)+'</strong>'+pts+'</p><p id="point-value" class="muted">'+(v?'Kijelölt pont: ('+e(v.replace(',', '; '))+')':'Kattints a rácson egy pontra, vagy add meg a koordinátákat.')+'</p><div class="form-grid"><label class="field">x<input type="number" min="-6" max="6" step="1" data-coord="0" value="'+e(v?.split(',')[0])+'"></label><label class="field">y<input type="number" min="-6" max="6" step="1" data-coord="1" value="'+e(v?.split(',')[1])+'"></label></div></div>';
   return '<div><p><strong>'+e(f.label)+'</strong>'+pts+'</p>'+cellGrid(f,v??[],true)+'</div>';
 }
 function score(t,entry){return t.fields.reduce((sum,f,i)=>sum+(correct(f,entry.values[i])?f.points:0),0);}
 function feedback(t,entry){
   const total=score(t,entry);
   return '<div class="feedback '+(total===t.points?'':'bad')+'" role="status"><strong>'+total+' / '+t.points+' pont</strong><p>'+e(t.explanation)+'</p><ul>'+t.fields.map((f,i)=>{
     const v=entry.values[i],right=correct(f,v),note=!right&&f.type==='number'?Object.entries(f.wrong??{}).find(([key])=>close(number(v),Number(key)))?.[1]:'';
     return '<li><strong>'+e(f.label)+'</strong> – '+(right?'helyes':'helyes válasz: '+e(answerText(f)))+(note?' '+e(note):'')+'</li>';
   }).join('')+'</ul>'+(t.fields.some(f=>f.type==='cells')?cellGrid(t.fields.find(f=>f.type==='cells'),t.fields.find(f=>f.type==='cells').answer):'')+'</div>';
 }
 const isFilled=entry=>Object.values(entry.values).some(v=>Array.isArray(v)?v.length>0:String(v??'').length>0);
 function navButtons(){
   return session.entries.map((en,i)=>'<button type="button" data-action="goto" data-index="'+i+'" class="'+(isFilled(en)?'filled ':'')+(i===session.index?'current ':'')+(en.flag?'flagged':'')+'" aria-label="'+(i+1)+'. feladat'+(en.flag?', megjelölve':'')+'" '+(i===session.index?'aria-current="step"':'')+'>'+(i+1)+'</button>').join('');
 }
 function quiz(){
   if(!session)return title('Feladatsor')+link('Új feladatsor','#gyakorlas',true);
   if(session.done)return results();
   const t=task(),en=state(), practice=session.c.mode==='practice',i=session.index,pointIndex=t.fields.findIndex(x=>x.type==='point');
   return '<div class="quiz"><section class="panel"><div class="row"><span class="eyebrow">'+(i+1)+'. feladat / '+session.tasks.length+'</span><span class="tag">'+e(topics[t.topic])+' · '+t.points+' pont</span></div><h2 class="task-title">'+e(t.prompt)+'</h2>'+
   diagram(t.diagram,{interactive:pointIndex>=0,selection:en.values[pointIndex],solution:en.feedback&&pointIndex>=0?t.fields[pointIndex].answer:''})+
   '<div class="stack">'+t.fields.map((f,k)=>fieldUi(f,k,en)).join('')+'</div><details '+(en.notes?'open':'')+'><summary>Piszkozat</summary><label class="field"><span>Saját számolás</span><textarea rows="4" data-notes>'+e(en.notes)+'</textarea></label></details>'+
   (en.hint?'<div class="feedback">'+e(t.hint)+'</div>':'')+
   (en.feedback?feedback(t,en)+'<div class="actions">'+button('Hasonló feladat','similar')+link('Kapcsolódó segédlet','#segedlet?'+sectionFor(t.topic))+'</div>':'')+
   '<div class="actions" style="margin-top:15px">'+button('Előző','prev',false,i===0?'disabled':'')+(practice?button('Tipp','hint',false,en.hint?'disabled':'')+button('Ellenőrzés','check',true):'')+button('Következő','next',!practice,i===session.tasks.length-1?'disabled':'')+'</div></section>'+
   '<aside class="panel side"><h3>'+(practice?'Gyakorlás':'Próbafelvételi')+'</h3>'+(practice?'':'<p class="tag" id="clock" aria-live="off"></p>')+'<div class="qnav">'+navButtons()+'</div><p class="muted" id="progress">'+session.entries.filter(isFilled).length+' / '+session.tasks.length+' megkezdve</p><div class="stack">'+button(en.flag?'Jelölés levétele':'Visszatérek rá','flag')+button('Beadás','finish',true)+button('Feladatsor nyomtatása','print-quiz')+'</div><details><summary>Feladatsorkód</summary><input class="code" readonly value="'+e(stamp(session.c))+'" aria-label="Feladatsorkód"></details></aside></div>';
 }
 function sectionFor(t){return ({koordinata:'szogek-koordinatak',szamolas:'szamolas',logika:'szamolas',adat:'szamolas',arany:'szamolas',szoveg:'szamolas'})[t]??t;}
 function remember(t,en){
   const total=score(t,en), existing=history.find(h=>h.id===t.id);
   if(total<t.points&&isFilled(en)){
     if(existing){existing.misses++;existing.last=Date.now();existing.mastered=false;}
     else history.unshift({id:t.id,topic:t.topic,misses:1,last:Date.now(),mastered:false});
   }else if(total===t.points&&existing&&!en.assisted){existing.mastered=true;existing.last=Date.now();}
   history=history.slice(0,100);save(keys.errors,history);
 }
 function end(force=false){
   if(!active())return;
   const empty=session.entries.filter((en,i)=>session.tasks[i].fields.some((_,k)=>en.values[k]===undefined||en.values[k]===''||Array.isArray(en.values[k])&&!en.values[k].length)).length;
   if(!force&&empty&&!confirm(empty+' feladatban maradt üres rész. Beadod így is?'))return;
   session.done=true;session.entries.forEach((en,i)=>remember(session.tasks[i],en));persist();render();
 }
 function results(){
   const {tasks,entries,c}=session,earned=tasks.reduce((a,t,i)=>a+score(t,entries[i]),0),max=tasks.reduce((a,t)=>a+t.points,0);
   const pct=earned/max*100,grade=1+(c.thresholds??config.thresholds).filter(x=>pct>=x).length;
   const independent=tasks.reduce((a,t,i)=>a+(entries[i].assisted?0:score(t,entries[i])),0);
   return title('Eredmény')+'<div class="panel"><div class="result-number">'+earned+' / '+max+' pont</div><p>'+fmt(Math.round(pct*10)/10)+'%'+(c.mode==='practice'?' · Gyakorlójegy: '+grade+' – '+['elégtelen','elégséges','közepes','jó','jeles'][grade-1]+' · Önállóan '+independent+' pont':'')+'</p><div class="actions">'+link('Új feladatsor','#gyakorlas',true)+button('Feladatsor nyomtatása','print-quiz')+button('Javítókulcs nyomtatása','print-key')+link('Hibafüzet','#hibafuzet')+'</div><details><summary>Feladatsorkód</summary><input class="code" readonly value="'+e(stamp(c))+'"></details></div>'+
   '<div class="panel"><h3>Feladatonkénti javítás</h3>'+tasks.map((t,i)=>'<details><summary>'+(i+1)+'. '+e(topics[t.topic])+' · '+score(t,entries[i])+'/'+t.points+' pont'+(entries[i].assisted?' · segítséggel':'')+'</summary><p>'+e(t.prompt)+'</p>'+diagram(t.diagram,{solution:t.fields.find(x=>x.type==='point')?.answer})+feedback(t,entries[i])+'<div class="actions">'+button('Hasonló feladat','similar',false,'data-index="'+i+'"')+link('Segédlet','#segedlet?'+sectionFor(t.topic))+'</div></details>').join('')+'</div>';
 }
 function study(){
   const errors=history.filter(h=>!h.mastered).sort((a,b)=>b.misses-a.misses||b.last-a.last);
   return title('Hibafüzet','Gyakorold újra a visszatérő hibákat. A lista ezen a böngészőn marad.')+
   '<div class="panel narrow">'+(errors.length?'<div class="actions">'+button('Ismétlő kör indítása','review',true)+'</div><div class="stack">'+errors.map(h=>'<div class="row"><span>'+e(topics[h.topic])+' · '+h.misses+' elakadás</span>'+button('Hasonló feladat','redo',false,'data-template="'+e(h.id)+'"')+'</div>').join('')+'</div>':'<p>A hibafüzet üres. A beadott feladatsorok hibái itt jelennek meg.</p>')+'</div>';
 }
 function scaleView(s,path=[]){
   const ids=new Set(path.flatMap(p=>[p.from,p.to]));
   return '<div class="scale" aria-label="'+e(s.title)+' skála">'+s.units.map((u,i)=>{
     const st=s.steps[i],edge=st&&path.find(p=>p.from===st.fromUnit&&p.to===st.toUnit||p.to===st.fromUnit&&p.from===st.toUnit);
     return '<span class="unit" title="'+e(u.name)+'" '+(ids.has(u.symbol)?'data-active':'')+'>'+e(u.symbol)+'</span>'+(st?'<span class="step" '+(edge?'data-active':'')+'>'+(edge?.factor<1?'← ÷':'×')+fmt(st.factor)+(edge?.factor<1?'':' →')+'</span>':'');
   }).join('')+'</div>';
 }
 function referenceBody(item){
   if(item.units)return scaleView(item)+'<p>'+e(item.rule)+'</p><p><strong>Példa:</strong> '+e(item.example)+'</p>';
   return '<div class="table-wrap"><table><thead><tr>'+item.columns.map(c=>'<th scope="col">'+e(c)+'</th>').join('')+'</tr></thead><tbody>'+item.rows.map(r=>'<tr>'+r.map((v,i)=>i===0?'<th scope="row">'+e(v)+'</th>':'<td>'+e(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 }
 function referencePage(){
   const selected=page().split('?')[1];
   return title('Nyomtatható segédlet','Válaszd ki, mely fejezeteket szeretnéd kinyomtatni vagy PDF-be menteni.')+
   '<div class="panel"><div class="row"><p>'+e(reference.scaleInstructions.forward)+' '+e(reference.scaleInstructions.backward)+'</p>'+button('Kijelöltek nyomtatása','print-reference',true)+'</div></div>'+
   [...scales,...sections].map(item=>'<section id="ref-'+item.id+'" class="panel"><div class="row"><h3>'+e(item.title)+'</h3><label class="check"><input type="checkbox" data-print-section="'+item.id+'" '+checked(reference.printDefaults.selectedIds.includes(item.id)||selected===item.id)+'> Nyomtatásba</label></div>'+referenceBody(item)+'</section>').join('');
 }
 function converter(){
   const c=convertState, all=c.group==='combined'?scales.filter(s=>['terfogat','urtartalom'].includes(s.id)):scales.filter(s=>s.id===c.group);
   const units=all.flatMap(s=>s.units).map(u=>[u.symbol,u.symbol+' · '+u.name]);
   if(!units.some(([z])=>z===c.from))c.from=units[0][0];
   if(!units.some(([z])=>z===c.to))c.to=units.at(-1)[0];
   if(!units.some(([z])=>z===c.secondUnit))c.secondUnit=units[1]?.[0]??units[0][0];
   return title('Mértékegység-átváltó','Add meg a két egységet. A kiemelt nyilak megmutatják, hogyan jutottál az eredményhez.')+
   '<form id="converter" class="panel narrow"><label class="field">Mennyiség<select name="group">'+options([...scales.map(s=>[s.id,s.title]),['combined','Térfogat ↔ űrtartalom']],c.group)+'</select></label><div class="form-grid"><label class="field">Kiinduló érték<input name="value" inputmode="decimal" value="'+e(c.value)+'" required></label><label class="field">Kiinduló egység<select name="from">'+options(units,c.from)+'</select></label>'+(c.mixed?'<label class="field">Második érték<input name="second" inputmode="decimal" value="'+e(c.second)+'" required></label><label class="field">Második egység<select name="secondUnit">'+options(units,c.secondUnit)+'</select></label>':'')+'<label class="field">Célegység<select name="to">'+options(units,c.to)+'</select></label></div><label class="check"><input name="mixed" type="checkbox" '+checked(c.mixed)+'> Két egységből álló bemenet</label><label class="check"><input name="decompose" type="checkbox" '+checked(c.decompose)+'> Mutasd vegyes alakban is</label><label class="check"><input name="predict" type="checkbox" '+checked(c.predict)+'> Előbb én adom meg az eredményt</label>'+(c.predict?'<label class="field">Saját eredmény<input name="guess" inputmode="decimal" value="'+e(c.guess)+'" required></label>':'')+'<div class="actions" style="margin-top:12px">'+submit(c.predict?'Ellenőrzés':'Átváltás')+button('Egységek felcserélése','swap',false,c.mixed?'disabled':'')+button('Adj hasonló feladatot','converter-task')+'</div></form><div id="converted" class="narrow" aria-live="polite"></div><div class="panel narrow">'+all.map(s=>'<div data-converter-scale="'+s.id+'"><h3>'+e(s.title)+'</h3>'+scaleView(s)+'</div>').join('')+'</div>';
 }
 function convert(form){
   const c=Object.assign(convertState,Object.fromEntries(new FormData(form)));
   for(const key of ['mixed','predict','decompose'])c[key]=form.elements[key].checked;
   const a=number(c.value),b=c.mixed?number(c.second):0,path=route(scales,c.from,c.to),extra=c.mixed?route(scales,c.secondUnit,c.to):[];
   const out=main.querySelector('#converted'),product=p=>p.reduce((n,x)=>n*x.factor,1),result=a*product(path??[])+b*product(extra??[]);
   if(!Number.isFinite(result)||!Number.isFinite(a)||!Number.isFinite(b)||!path||!extra){out.innerHTML='<p class="feedback bad">Adj meg érvényes számot és összeillő egységeket.</p>';return;}
   const method=(v,from,steps)=>{
     const strings=[fmt(v)+' '+from];let current=v;
     for(const step of steps){current*=step.factor;strings.push(fmt(current)+' '+step.to);}
     return strings.join(' = ');
   };
   const parts=[];
   if(c.decompose){
     const str=scales.find(s=>s.units.some(u=>u.symbol===c.to)),u=str.units.find(x=>x.symbol===c.to);
     let remaining=Math.abs(result*u.factorToBase);
     str.units.forEach((part,i)=>{
       const size=part.factorToBase,qty=i===str.units.length-1?remaining:Math.floor(remaining/size+1e-12);
       if(qty>0)parts.push(fmt(qty)+' '+part.symbol);
       remaining=Math.max(0,remaining-qty*size);
     });
     if(result<0&&parts.length)parts[0]='−('+parts[0];
     if(result<0&&parts.length)parts[parts.length-1]+=')';
   }
   out.innerHTML='<div class="panel"><div class="result-number">'+e(fmt(result)+' '+c.to)+'</div>'+
   (c.predict?'<p><strong>'+(close(number(c.guess),result)?'Helyes.':'Nézd meg a lépéseket.')+'</strong></p>':'')+
   '<p>'+e(method(a,c.from,path))+'</p>'+(c.mixed?'<p>'+e(method(b,c.secondUnit,extra))+'</p>':'')+
   (parts.length?'<p><strong>Vegyes alak:</strong> '+e(parts.join(' '))+'</p>':'')+'</div>';
   for(const node of main.querySelectorAll('[data-converter-scale]')){
     const s=scales.find(x=>x.id===node.dataset.converterScale);node.innerHTML='<h3>'+e(s.title)+'</h3>'+scaleView(s,[...path,...extra]);
   }
 }
 function archives(){
   return title('Eredeti felvételik · 2005–2026','Év szerinti hivatkozások az Oktatási Hivatal rendes és pótló feladatlapjaihoz, valamint javítókulcsaihoz.')+
   '<div class="grid">'+archive.map(a=>'<a class="card card-link" href="'+e(a.url)+'" target="_blank" rel="noopener noreferrer"><h3>'+e(a.year)+'</h3><span>Feladatlapok és javítókulcsok ↗</span></a>').join('')+'</div>';
 }
 function print(kind){
   if(kind==='reference'){
     const ids=[...main.querySelectorAll('[data-print-section]:checked')].map(x=>x.dataset.printSection);
     if(!ids.length){alert('Jelölj ki legalább egy fejezetet.');return;}
     printable.innerHTML='<h1>Felvételi segédlet</h1><p>'+e(reference.scaleInstructions.forward+' '+reference.scaleInstructions.backward)+'</p>'+[...scales,...sections].filter(x=>ids.includes(x.id)).map(x=>'<section class="sheet-item"><h2>'+e(x.title)+'</h2>'+referenceBody(x)+'</section>').join('');
   }else if(session){
     const {tasks,c}=session,key=kind==='key';
     printable.innerHTML='<h1>'+(key?'Javítókulcs':'Feladatsor')+'</h1><p>'+e(stamp(c))+(c.mode==='exam'?' · 45 perc':'')+' · '+tasks.reduce((a,t)=>a+t.points,0)+' pont</p>'+tasks.map((t,i)=>'<section class="sheet-item"><h3>'+(i+1)+'. '+e(t.prompt)+' ('+t.points+' pont)</h3>'+diagram(t.diagram,{solution:key?t.fields.find(f=>f.type==='point')?.answer:''})+t.fields.map(f=>'<p>'+e(f.label)+' · '+f.points+' pont '+(key?e(answerText(f)):f.type==='choice'?e(f.choices.join(' / ')):'........................')+'</p>'+(f.type==='cells'?cellGrid(f,key?f.answer:[]):'')).join('')+(key?'<p>'+e(t.explanation)+'</p>':'<div class="write-space"></div>')+'</section>').join('');
   }
   window.print();
 }
 function render(){
   const root=page().split('?')[0];
   document.querySelectorAll('nav a').forEach(a=>{if(a.hash==='#'+root||root==='feladatsor'&&a.hash==='#gyakorlas')a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
   main.innerHTML=({kezdolap:home,gyakorlas:setup,feladatsor:quiz,atvalto:converter,segedlet:referencePage,hibafuzet:study,archivum:archives})[root]?.()??home();
   if(root==='gyakorlas')syncSetup(main.querySelector('#setup'));
   if(root==='atvalto'&&!convertState.predict)convert(main.querySelector('#converter'));
   if(root==='segedlet'&&page().includes('?'))requestAnimationFrame(()=>document.getElementById('ref-'+page().split('?')[1])?.scrollIntoView());
   tick();
 }
 function tick(){
   if(locked||!active()||!session.deadline)return;
   const left=Math.max(0,Math.ceil((session.deadline-Date.now())/1000)),clock=main.querySelector('#clock');
   if(clock)clock.textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0')+' hátra';
   if(!left){locked=true;try{end(true);}finally{locked=false;}}
 }
 function setValue(index,value){
   state().values[index]=value;persist();
   const progress=main.querySelector('#progress');if(progress)progress.textContent=session.entries.filter(isFilled).length+' / '+session.tasks.length+' megkezdve';
   const nav=main.querySelector('.qnav [data-index="'+session.index+'"]');if(nav)nav.classList.toggle('filled',isFilled(state()));
 }
 function selectPoint(value,index){
   setValue(index,value);
   main.querySelectorAll('[data-point]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.point===value)));
   const label=main.querySelector('#point-value');if(label)label.textContent=value?'Kijelölt pont: ('+value.replace(',', '; ')+')':'Adj meg két egész koordinátát −6 és 6 között.';
 }
 function startSimilar(id){
   const seed=randomId(),t=similar(id,seed,scales);if(!t)return;
   const branch=t.topic==='fizika'?'physics':geometry.includes(t.topic)?'geo':measures.includes(t.topic)?'measure':'mixed';
   if(page()==='feladatsor'&&active()&&session.c.mode==='practice'){
     session.sideTask??={original:session.tasks[session.index],originalEntry:structuredClone(state()),index:session.index};
     session.tasks[session.index]=t;session.entries[session.index]={values:{},notes:'',hint:false,assisted:false,flag:false,feedback:false};persist();render();
   }else begin({...config,mode:'practice',branch,focus:t.topic,template:id,seed});
 }
 function restoreSide(){
   if(!session.sideTask)return;
   const {original,originalEntry,index}=session.sideTask;session.tasks[index]=original;session.entries[index]=originalEntry;delete session.sideTask;persist();
 }
 main.addEventListener('input',ev=>{
   const el=ev.target;
   if(page()==='feladatsor'&&active()){
     if(el.matches('[data-value]'))setValue(el.dataset.value,el.value);
     if(el.matches('[data-notes]')){state().notes=el.value;persist();}
     if(el.matches('[data-coord]')){
       const coords=[...main.querySelectorAll('[data-coord]')].map(x=>x.value),i=task().fields.findIndex(f=>f.type==='point');
       const valid=coords.every(v=>v!==''&&Number.isInteger(Number(v))&&Math.abs(Number(v))<=6);
       selectPoint(valid?coords.map(Number).join(','):'',i);
     }
   }
   if(el.form?.id==='converter'&&el.name==='value'&&!el.form.elements.predict.checked)convert(el.form);
 });
 main.addEventListener('change',ev=>{
   const el=ev.target;
   if(el.form?.id==='setup'&&['mode','branch','physics'].includes(el.name))syncSetup(el.form,true);
   if(el.form?.id==='converter'){
     const form=el.form,oldGroup=convertState.group;
     Object.assign(convertState,Object.fromEntries(new FormData(form)));
     for(const key of ['mixed','predict','decompose'])convertState[key]=form.elements[key].checked;
     if(['group','mixed','predict'].includes(el.name)||oldGroup!==convertState.group)render();
     else if(!convertState.predict)convert(form);
   }
 });
 main.addEventListener('submit',ev=>{
   ev.preventDefault();const form=ev.target,values=Object.fromEntries(new FormData(form));
   if(form.id==='converter'){convert(form);return;}
   if(form.id==='setup'){
     const thresholds=values.mode==='exam'?config.thresholds:Array.from({length:4},(_,i)=>Number(values['threshold'+i]));
     if(thresholds.some((t,i)=>!Number.isInteger(t)||t<1||t>100||i&&t<=thresholds[i-1])){main.querySelector('#setup-error').textContent='A jegyhatárok növekvő egész százalékok legyenek, 1 és 100 között.';return;}
     config={...config,mode:values.mode,branch:values.branch??config.branch,level:values.level??config.level,focus:values.focus||null,physics:values.physics==='on',thresholds};
     if(active()&&!confirm('Van egy megkezdett feladatsor. Lecseréled az újra?'))return;
     save(keys.config,config);begin({...config,seed:randomId(),review:[]});return;
   }
   if(form.id==='restore'){
     const c=decode(values.code);if(!c){main.querySelector('#restore-error').textContent='A feladatsorkód formátuma hibás.';return;}
     if(active()&&!confirm('Megnyitod a kódhoz tartozó sort a mostani helyett?'))return;
     begin({...c,thresholds:config.thresholds});
   }
 });
 main.addEventListener('click',ev=>{
   const el=ev.target.closest('[data-action],[data-point],[data-cell]');if(!el)return;
   if(el.dataset.point!==undefined&&active()){
     const i=task().fields.findIndex(f=>f.type==='point'),v=el.dataset.point;
     selectPoint(v,i);const coords=v.split(',');main.querySelectorAll('[data-coord]').forEach((x,k)=>x.value=coords[k]);return;
   }
   if(el.dataset.cell!==undefined&&active()){
     const i=task().fields.findIndex(f=>f.type==='cells'),values=new Set(state().values[i]??[]),cell=Number(el.dataset.cell);
     if(values.has(cell))values.delete(cell);else values.add(cell);
     setValue(i,[...values]);el.setAttribute('aria-pressed',String(values.has(cell)));el.textContent=values.has(cell)?'■':'·';return;
   }
   const action=el.dataset.action;
   if(action==='swap'){[convertState.from,convertState.to]=[convertState.to,convertState.from];render();return;}
   if(action==='converter-task'){const key=convertState.group==='combined'?'terfogat':convertState.group;if(!active()||confirm('Új feladatsor indul a megkezdett helyett. Folytatod?'))begin({...config,mode:'practice',branch:'measure',focus:key,seed:randomId()});return;}
   if(action==='review'){
     if(active()&&!confirm('Új ismétlő kör indul a megkezdett feladatsor helyett. Folytatod?'))return;
     begin({...config,mode:'practice',branch:'mixed',focus:null,physics:history.some(h=>h.topic==='fizika'&&!h.mastered),review:history.filter(h=>!h.mastered).slice(0,4).map(h=>h.topic),seed:randomId()});return;
   }
   if(action==='redo'){if(!active()||confirm('Új feladatsor indul a megkezdett helyett. Folytatod?'))startSimilar(el.dataset.template);return;}
   if(action==='print-reference'){print('reference');return;}
   if(action==='print-quiz'||action==='print-key'){print(action==='print-key'?'key':'quiz');return;}
   if(action==='similar'){const t=session.tasks[el.dataset.index??session.index];startSimilar(t.id);return;}
   if(!active())return;
   const en=state(), practice=session.c.mode==='practice';
   if(action==='finish'){restoreSide();end();return;}
   if(action==='goto'||action==='prev'||action==='next'){restoreSide();session.index=action==='goto'?Number(el.dataset.index):session.index+(action==='prev'?-1:1);}
   if(action==='hint'&&practice){en.hint=true;en.assisted=true;}
   if(action==='check'&&practice){en.feedback=true;if(session.sideTask)remember(task(),en);}
   if(action==='flag')en.flag=!en.flag;
   persist();render();if(['goto','prev','next'].includes(action))main.querySelector('.task-title')?.scrollIntoView({block:'nearest'});
 });
 window.addEventListener('hashchange',()=>{render();main.focus({preventScroll:true});if(!location.hash.startsWith('#segedlet?'))window.scrollTo(0,0);});
 setInterval(tick,500);
 render();
}
