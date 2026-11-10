import {calculate,MODELS} from './core.mjs';
const $=id=>document.getElementById(id);let overrides={};
const defaults={al:24.13,k1:41.19,k2:41.19,acd:3.5,iol:20,target:0};
function current(){return Object.fromEntries(Object.keys(defaults).map(k=>[k,Number($(k).value)]))}
function settings(){const type=$('model').value;return overrides[type]||structuredClone(MODELS[type])}
function editConstants(){const v=settings();const root=$('constant-inputs');root.innerHTML='';for(const [group,keys] of [['modified',['a0','a1','a2','a3']],['original',['a0','a1','a2']]])for(const key of keys){const box=document.createElement('div');const lbl=document.createElement('label');const id=`c-${group}-${key}`;lbl.htmlFor=id;lbl.textContent=`${group==='modified'?'Modified':'Original'} ${key}`;const field=document.createElement('input');field.id=id;field.type='number';field.step='any';field.value=v[group][key];field.addEventListener('input',()=>{const copy=structuredClone(settings());if(field.value.trim()!=='')copy[group][key]=Number(field.value);overrides[$('model').value]=copy;update()});box.append(lbl,field);root.append(box)}}
const fmt=(n,d=2)=>`${n>=0?'+':''}${n.toFixed(d)} D`;
function renderTable(id,rows,target){$(id).innerHTML=rows.map(row=>`<tr class="${Math.abs(row.refraction-target)<=0.25?'closest':''}"><td>${row.power.toFixed(2)}</td><td>${fmt(row.refraction)}</td></tr>`).join('')}
function update(){const e=$('error');e.hidden=true;try{const v=current();if(Object.keys(defaults).some(k=>$(k).value.trim()===''))throw Error('모든 항목을 입력해 주세요.');const r=calculate(v,settings());$('mean-k').textContent=r.k.toFixed(2)+' D';$('radius').textContent=r.R.toFixed(3);
 for(const [prefix,o] of [['mod',r.modified],['orig',r.original]]){$(`${prefix}-ideal`).textContent=fmt(o.ideal);$(`${prefix}-ref`).textContent=fmt(o.atSelected);$(`${prefix}-elp`).textContent=`ELP ${o.elp.toFixed(3)} mm`;renderTable(`${prefix}-table`,o.table,v.target)}
 }catch(ex){e.textContent=ex.message;e.hidden=false;for(const id of ['mod-ideal','mod-ref','orig-ideal','orig-ref','mod-elp','orig-elp'])$(id).textContent='—';for(const id of ['mod-table','orig-table'])$(id).innerHTML=''}}
$('model').addEventListener('change',()=>{editConstants();update()});for(const k of Object.keys(defaults))$(k).addEventListener('input',update);
$('reset').addEventListener('click',()=>{Object.entries(defaults).forEach(([k,v])=>$(k).value=v);$('model').value='za9003';editConstants();update()});$('restore-constants').addEventListener('click',()=>{delete overrides[$('model').value];editConstants();update()});editConstants();update();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
