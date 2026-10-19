'use strict';
const DB_NAME='jet-producao-web', DB_VERSION=1, STORE='records';
let db, selectedPhoto=null, currentGps=null;
const $=id=>document.getElementById(id);
const nowISO=()=>new Date().toISOString();
const localDate=(iso)=>{const d=new Date(iso);return d.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});};
const monthKey=(iso)=>{const d=new Date(iso);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;};
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(STORE)){const s=d.createObjectStore(STORE,{keyPath:'id'});s.createIndex('createdAt','createdAt');s.createIndex('category','category');}};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function tx(mode='readonly'){return db.transaction(STORE,mode).objectStore(STORE)}
function getAll(){return new Promise((res,rej)=>{const r=tx().getAll();r.onsuccess=()=>res(r.result.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));r.onerror=()=>rej(r.error);});}
function putRecord(record){return new Promise((res,rej)=>{const r=tx('readwrite').put(record);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
function deleteRecord(id){return new Promise((res,rej)=>{const r=tx('readwrite').delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
function clearRecords(){return new Promise((res,rej)=>{const r=tx('readwrite').clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
function showPage(page){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===`page-${page}`));document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.page===page));if(page==='historico')renderHistory();if(page==='metricas')renderMetrics();}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));

const SHIFT_KEY='jet-active-shift-v1';
function readActiveShift(){try{return JSON.parse(localStorage.getItem(SHIFT_KEY)||'null')}catch{return null}}
function updateShiftUI(){
 const active=readActiveShift(),status=$('shiftStatus'),badge=$('shiftBadge');
 $('startShiftBtn').disabled=!!active;$('endShiftBtn').disabled=!active;
 if(active){const started=new Date(active.startedAt);status.textContent=`Turno ${active.shift} iniciado em ${started.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}.`;badge.textContent='Turno ativo';}
 else{status.textContent='Nenhum turno iniciado.';badge.textContent='Turno encerrado';}
}
function formatDuration(ms){if(!Number.isFinite(ms)||ms<0)return 'indisponível';const mins=Math.floor(ms/60000);return `${Math.floor(mins/60)}h ${mins%60}min`;}
async function writeShiftEvent(category, active, endedAt=''){
 const timestamp=category==='Início de turno'?active.startedAt:endedAt;
 const record={id:crypto.randomUUID?crypto.randomUUID():`shift-${Date.now()}-${Math.random()}`,createdAt:timestamp||nowISO(),category,asset:'',shift:active.shift,reason:category,notes:category==='Início de turno'?'Turno iniciado.':`Turno encerrado. Início: ${new Date(active.startedAt).toLocaleString('pt-BR')}. Duração: ${formatDuration(new Date(endedAt)-new Date(active.startedAt))}.`,gps:null,photo:null};
 await putRecord(record);
}
$('startShiftBtn').addEventListener('click',async()=>{
 if(readActiveShift())return;
 const shift=$('shift').value||'Outro',active={id:Date.now().toString(),shift,startedAt:nowISO()};
 try{localStorage.setItem(SHIFT_KEY,JSON.stringify(active));await writeShiftEvent('Início de turno',active);updateShiftUI();$('formStatus').textContent='Turno iniciado e registrado no histórico.';await refreshCounts();}
 catch(e){localStorage.removeItem(SHIFT_KEY);$('shiftStatus').textContent='Não foi possível iniciar o turno. Verifique o armazenamento.';console.error(e);}
});
$('endShiftBtn').addEventListener('click',async()=>{
 const active=readActiveShift();if(!active)return;
 if(!confirm('Encerrar o turno atual?'))return;
 try{const endedAt=nowISO();await writeShiftEvent('Fim de turno',active,endedAt);localStorage.removeItem(SHIFT_KEY);updateShiftUI();$('formStatus').textContent=`Turno encerrado. Duração: ${formatDuration(new Date(endedAt)-new Date(active.startedAt))}.`;await refreshCounts();}
 catch(e){$('shiftStatus').textContent='Não foi possível encerrar o turno. Tente novamente.';console.error(e);}
});

$('photo').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f){selectedPhoto=null;$('preview').classList.add('hidden');return;}if(!f.type.startsWith('image/')){alert('Selecione uma imagem.');return;}try{selectedPhoto=await compressImage(f);$('preview').src=URL.createObjectURL(selectedPhoto);$('preview').classList.remove('hidden');}catch(err){selectedPhoto=f;$('preview').src=URL.createObjectURL(f);$('preview').classList.remove('hidden');}});
function compressImage(file){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const scale=Math.min(1,1600/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);c.toBlob(b=>b?resolve(b):reject(new Error('Falha ao processar imagem')),'image/jpeg',.78);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Imagem inválida'));};img.src=url;});}
$('gpsBtn').addEventListener('click',()=>{if(!('geolocation'in navigator)){ $('gpsStatus').textContent='GPS não suportado neste navegador.';return;} $('gpsStatus').textContent='Obtendo localização…';navigator.geolocation.getCurrentPosition(p=>{currentGps={latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:Math.round(p.coords.accuracy)};$('latitude').value=currentGps.latitude;$('longitude').value=currentGps.longitude;$('accuracy').value=currentGps.accuracy;$('gpsStatus').textContent=`${currentGps.latitude.toFixed(6)}, ${currentGps.longitude.toFixed(6)} (±${currentGps.accuracy} m)`;},e=>{$('gpsStatus').textContent=({1:'Permita a localização nas configurações do navegador.',2:'Não foi possível determinar a localização.',3:'Tempo esgotado ao obter GPS.'})[e.code]||'Falha no GPS.';},{enableHighAccuracy:true,timeout:15000,maximumAge:0});});
$('recordForm').addEventListener('submit',async e=>{e.preventDefault();const record={id:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`,createdAt:nowISO(),category:$('category').value,asset:$('asset').value.trim(),shift:(readActiveShift()?.shift||$('shift').value),reason:$('reason').value.trim(),notes:$('notes').value.trim(),gps:currentGps,photo:selectedPhoto?await blobToDataURL(selectedPhoto):null};try{await putRecord(record);$('formStatus').textContent='Registro salvo neste dispositivo.';$('recordForm').reset();selectedPhoto=null;currentGps=null;$('preview').classList.add('hidden');$('gpsStatus').textContent='Ainda não capturada.';$('latitude').value='';$('longitude').value='';$('accuracy').value='';await refreshCounts();}catch(err){$('formStatus').textContent='Não foi possível salvar. Verifique o espaço disponível no dispositivo.';console.error(err);}});
function blobToDataURL(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(blob);});}
function dataURLToBlob(data){if(!data)return null;const [head,b64]=data.split(',');const mime=(head.match(/data:(.*?);/)||[])[1]||'image/jpeg';const bin=atob(b64),arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return new Blob([arr],{type:mime});}
function escapeHTML(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function renderHistory(){const all=await getAll(),q=$('search').value.toLowerCase(),cat=$('filterCategory').value,month=$('filterMonth').value;const list=all.filter(r=>(!q||[r.category,r.asset,r.reason,r.notes,r.shift].join(' ').toLowerCase().includes(q))&&(!cat||r.category===cat)&&(!month||monthKey(r.createdAt)===month));$('recordCount').textContent=`${list.length} registro${list.length===1?'':'s'}`;if(!list.length){$('records').innerHTML='<div class="empty">Nenhum registro encontrado.</div>';return;}$('records').innerHTML=list.map(r=>`<article class="record">${r.photo?`<img src="${r.photo}" alt="Foto do registro">`:''}<div class="record-main"><h3>${escapeHTML(r.category)}${r.asset?' · '+escapeHTML(r.asset):''}</h3><p>${localDate(r.createdAt)} · ${escapeHTML(r.shift||'')}</p><p>${escapeHTML(r.reason||r.notes||'Sem comentário')}</p><div class="record-actions"><button class="small-btn" data-view="${r.id}">Detalhes</button><button class="small-btn" data-telegram="${r.id}">📤 Telegram</button><button class="small-btn" data-copy-caption="${r.id}">📋 Copiar legenda</button><button class="small-btn" data-delete="${r.id}">Excluir</button></div></div></article>`).join('');$('records').querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>showDetail(b.dataset.view));$('records').querySelectorAll('[data-telegram]').forEach(b=>b.onclick=()=>shareRecordToTelegram(b.dataset.telegram));$('records').querySelectorAll('[data-copy-caption]').forEach(b=>b.onclick=()=>copyRecordCaption(b.dataset.copyCaption));$('records').querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(confirm('Excluir este registro?')){await deleteRecord(b.dataset.delete);renderHistory();refreshCounts();}});}
$('search').addEventListener('input',renderHistory);$('filterCategory').addEventListener('change',renderHistory);$('filterMonth').addEventListener('change',renderHistory);

function recordShareText(r){
 const clean=v=>String(v??'').trim();
 let notes=clean(r.notes),address=clean(r.address);
 const embedded=notes.match(/(?:^|\|\s*)Endereço:\s*([^|\n]+)/i);
 if(!address&&embedded) address=embedded[1].trim();
 notes=notes.replace(/(?:^|\|\s*)Endereço:\s*[^|\n]+/ig,'').replace(/\s*\|\s*/g,' · ').replace(/^\s*[·|]+\s*|\s*[·|]+\s*$/g,'').trim();
 // Remove agent/address data from the comment if stored elsewhere in the record.
 const agentMatch=notes.match(/(?:^|\s*[·|]\s*)Agente:\s*([^|·\n]+)/i);
 const agent=clean(r.agent|| (agentMatch&&agentMatch[1]));
 if(agentMatch) notes=notes.replace(/(?:^|\s*[·|]\s*)Agente:\s*[^|·\n]+/i,'').replace(/^\s*[·|]+\s*|\s*[·|]+\s*$/g,'').trim();
 const category=clean(r.reason||r.category).replace(/^Time Mark\s*[·—-]\s*/i,'')||'Registro';
 const asset=clean(r.asset);
 const lines=[`🛴 ${asset?`PATINETE ${asset}`:'REGISTRO JET'} — ${category.toUpperCase()}`,`🕐 ${new Date(r.createdAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · ${new Date(r.createdAt).toLocaleDateString('pt-BR')}`];
 if(address && address.toLowerCase()!=='indisponível') lines.push(`📍 ${address}`);
 if(r.gps){const lat=Number(r.gps.latitude),lon=Number(r.gps.longitude);const coord=Number.isFinite(lat)&&Number.isFinite(lon)?`${lat.toFixed(6)}, ${lon.toFixed(6)}`:`${r.gps.latitude}, ${r.gps.longitude}`;lines.push(`📌 ${coord}${r.gps.accuracy!=null?` (±${Math.round(Number(r.gps.accuracy))} m)`:''}`);lines.push(`🗺️ https://maps.google.com/?q=${r.gps.latitude},${r.gps.longitude}`);}
 if(agent) lines.push(`👤 Agente: ${agent}`);
 if(notes) lines.push(`📝 ${notes}`);
 lines.push('📷 Registro fotográfico JET');
 return lines.join('\n');
}

async function copyRecordCaption(id){
 try{const r=(await getAll()).find(x=>x.id===id);if(!r)return;const text=recordShareText(r);if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);}else{const ta=document.createElement('textarea');ta.value=text;ta.readOnly=true;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();if(!ok)throw new Error('copy failed');}alert('Legenda copiada. No Telegram, anexe a foto e cole o texto no campo Legenda antes de enviar.');}
 catch(e){const r=(await getAll()).find(x=>x.id===id);if(!r)return;prompt('Copie a legenda abaixo:',recordShareText(r));}
}
async function shareRecordToTelegram(id){
 try{
  const r=(await getAll()).find(x=>x.id===id);if(!r)return;const text=recordShareText(r);
  if(r.photo){const blob=dataURLToBlob(r.photo);const file=new File([blob],`JET-${String(r.category||'registro').replace(/[^a-z0-9_-]/gi,'-')}-${r.createdAt.slice(0,10)}.jpg`,{type:blob.type||'image/jpeg'});
   if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){await navigator.share({title:'JET Produção · Registro',text,files:[file]});return;}
   const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
   alert('A foto foi baixada. O Telegram será aberto com o texto; anexe a foto baixada e escolha o tópico do grupo.');
  }
  const url='https://t.me/share/url?url='+encodeURIComponent(r.gps?`https://maps.google.com/?q=${r.gps.latitude},${r.gps.longitude}`:'')+'&text='+encodeURIComponent(text);window.open(url,'_blank','noopener');
 }catch(e){if(e.name!=='AbortError')alert('Não foi possível abrir o compartilhamento. Tente novamente pelo menu de compartilhamento do navegador.');}
}

const REPORT_VEHICLE='URL9G77';
const REPORT_AGENT='Jonathan Borges';
const REPORT_GROUPS=[
 {key:'alarme',title:'🚨 Patinete encontrado em alarme',match:r=>/alarme/i.test(reportType(r))&&!/fora.?de.?zona|fora.?da.?zona/i.test(reportType(r))},
 {key:'descarregado',title:'🔋 Patinete descarregado',match:r=>/descarregado|bateria baixa|sem carga/i.test(reportType(r))},
 {key:'fora',title:'📍 Patinete além da zona',match:r=>/fora.?de.?zona|fora.?da.?zona|além da zona/i.test(reportType(r))},
 {key:'vandalizado',title:'🛠️ Patinete vandalizado',match:r=>/vandaliz|rompido|sino furtado/i.test(reportType(r))}
];
function reportType(r){return String(r.reason||r.category||'').replace(/^Time Mark\s*[·—-]\s*/i,'').trim();}
function reportIsShiftEvent(r){return /^(início|fim) de turno$/i.test(String(r.category||''));}
function reportCode(r){return String(r.asset||'').trim()||'Sem identificação';}
function reportHasPhoto(r){return !!r.photo;}
function reportHasEvidence(r){return reportHasPhoto(r)&&!!r.gps;}
function reportIsPoint(r){return /ponto arrumado|zona organizada|colocado em ponto|ponto organizado/i.test([r.category,r.reason,r.notes].join(' '));}
function reportObservation(r){
 let note=String(r.notes||'').trim();
 note=note.replace(/(?:^|\s*[·|]\s*)Agente:\s*[^|·\n]+/ig,'')
          .replace(/(?:^|\s*[·|]\s*)Endereço:\s*[^|·\n]+/ig,'')
          .replace(/\s*\|\s*/g,' · ').replace(/^\s*[·|]+\s*|\s*[·|]+\s*$/g,'').trim();
 if(!note) note=String(r.reason||'').trim();
 return note.replace(/^Time Mark\s*[·—-]\s*/i,'').trim()||'Sem observações registradas';
}
function reportStatusIcons(r){return '📷 🟢';}
function makeShiftReport(records,today){
 const tasks=records.filter(r=>!reportIsShiftEvent(r));
 const lines=[
  'Boa noite, encerramento de patrulhamento feito de moto, finalizando o turno.',
  '',
  `Veículo: ${REPORT_VEHICLE}`,
  '',
  'Resumo de Atividades',
  `- Total de Tarefas Realizadas: ${tasks.length} registros`,
  ''
 ];
 const used=new Set();
 for(const group of REPORT_GROUPS){
  const matches=tasks.filter(r=>group.match(r));
  if(!matches.length)continue;
  lines.push(group.title);
  matches.forEach(r=>{lines.push(`- ${reportCode(r)} ${reportStatusIcons(r)}`);used.add(r.id);});
  lines.push('');
 }
 const other=tasks.filter(r=>!used.has(r.id)&&!reportIsPoint(r));
 if(other.length){
  lines.push('📋 Outras ocorrências');
  other.forEach(r=>{lines.push(`- ${reportCode(r)} ${reportStatusIcons(r)}`);used.add(r.id);});
  lines.push('');
 }
 lines.push('📝 Observações das ocorrências');
 const observationRecords=tasks.filter(r=>used.has(r.id)||reportIsPoint(r));
 const seenNotes=new Set();
 observationRecords.forEach(r=>{
  const note=reportObservation(r),line=`- ${reportCode(r)}: ${note}`;
  // Keep separate notes for repeated codes when they describe different events.
  if(!seenNotes.has(line)){lines.push(line);seenNotes.add(line);}
 });
 if(seenNotes.size===0)lines.push('- Nenhuma observação registrada.');
 const pointRecords=tasks.filter(reportIsPoint);
 const pointCodes=new Set(pointRecords.map(reportCode));
 const pointPhotos=pointRecords.filter(reportHasPhoto).length;
 lines.push('',`🛠️ Pontos Organizados: ${pointCodes.size}`,`📷 Evidências de pontos: ${pointPhotos} foto(s)`,'',`Agente de prevenção: ${REPORT_AGENT}`);
 return lines.join('\n');
}
async function copyShiftReport(){
 const status=$('shiftReportStatus');
 try{
  const all=await getAll();
  const today=new Date();
  const key=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const records=all.filter(r=>{const d=new Date(r.createdAt);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`===key;}).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  if(!records.some(r=>!reportIsShiftEvent(r))){status.textContent='Não há tarefas registradas hoje para montar o relatório.';return;}
  const report=makeShiftReport(records,today);
  if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(report);}else{const ta=document.createElement('textarea');ta.value=report;ta.readOnly=true;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();if(!ok)throw new Error('copy failed');}
  status.textContent=`Relatório completo com ${records.filter(r=>!reportIsShiftEvent(r)).length} tarefa(s) copiado no formato de encerramento de turno.`;
 }catch(e){
  const all=await getAll();const today=new Date();
  const records=all.filter(r=>{const d=new Date(r.createdAt);return d.toDateString()===today.toDateString();}).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  if(records.some(r=>!reportIsShiftEvent(r)))prompt('Copie o relatório completo e cole no Telegram:',makeShiftReport(records,today));
  else status.textContent='Não há tarefas registradas hoje para montar o relatório.';
 }
}
$('copyShiftReportBtn').addEventListener('click',copyShiftReport);

async function showDetail(id){const r=(await getAll()).find(x=>x.id===id);if(!r)return;$('detailBody').innerHTML=`<div class="detail-grid"><div><small>Categoria</small>${escapeHTML(r.category)}</div><div><small>Data e hora</small>${localDate(r.createdAt)}</div><div><small>Patinete/ponto</small>${escapeHTML(r.asset||'—')}</div><div><small>Turno</small>${escapeHTML(r.shift||'—')}</div><div><small>Motivo</small>${escapeHTML(r.reason||'—')}</div><div><small>Comentário / observações</small>${escapeHTML(r.notes||'—')}</div>${r.address?`<div><small>Endereço por extenso</small>${escapeHTML(r.address)}</div>`:''}${r.gps?`<div><small>GPS</small>${r.gps.latitude}, ${r.gps.longitude} (±${r.gps.accuracy} m)<br><a target="_blank" rel="noopener" href="https://maps.google.com/?q=${r.gps.latitude},${r.gps.longitude}">Abrir no mapa</a></div>`:''}${r.photo?`<img class="detail-photo" src="${r.photo}" alt="Foto anexada">`:''}</div>`;$('detailDialog').showModal();}
$('closeDialog').onclick=()=>$('detailDialog').close();$('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog'))$('detailDialog').close();});
async function renderMetrics(){const month=$('metricsMonth').value||monthKey(nowISO());$('metricsMonth').value=month;const records=(await getAll()).filter(r=>monthKey(r.createdAt)===month);const days=new Set(records.map(r=>r.createdAt.slice(0,10))).size;$('mTotal').textContent=records.length;$('mDays').textContent=days;$('mAverage').textContent=days?(records.length/days).toFixed(1).replace('.',','):'0';const counts={};records.forEach(r=>counts[r.category]=(counts[r.category]||0)+1);const max=Math.max(1,...Object.values(counts));$('categoryStats').innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([name,n])=>`<div class="bar-row"><span>${escapeHTML(name)}</span><strong>${n}</strong><div class="bar-track"><div class="bar-fill" style="width:${n/max*100}%"></div></div></div>`).join('')||'<p>Nenhum registro neste mês.</p>';}
$('metricsMonth').value=monthKey(nowISO());$('metricsMonth').addEventListener('change',renderMetrics);
$('exportBtn').addEventListener('click',async()=>{try{const all=await getAll();const data={format:'JET-PWA-BACKUP',version:2,exportedAt:nowISO(),photosIncluded:true,records:all};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`jet-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);$('backupStatus').textContent=`Backup com ${all.length} registro(s) e fotos incluídas gerado. Confira Downloads/Arquivos.`;}catch(e){$('backupStatus').textContent='Erro ao exportar backup.';}});
$('importFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.format!=='JET-PWA-BACKUP'||!Array.isArray(data.records))throw new Error('Formato inválido');const existing=new Set((await getAll()).map(r=>r.id));let added=0,skipped=0;for(const raw of data.records){if(!raw||!raw.id||!raw.createdAt||!raw.category){skipped++;continue;}if(existing.has(raw.id)){skipped++;continue;}const r={...raw,photo:raw.photo||null,gps:raw.gps||null,address:raw.address||''};await putRecord(r);existing.add(r.id);added++;}$('backupStatus').textContent=`Importação concluída: ${added} novo(s) registro(s), ${skipped} ignorado(s).`;await refreshCounts();}catch(err){$('backupStatus').textContent='Arquivo inválido ou incompatível com o backup JET.';}e.target.value='';});
$('clearBtn').addEventListener('click',async()=>{if(confirm('Tem certeza? Todos os registros e fotos locais serão apagados.')){if(confirm('Última confirmação: você já fez backup?')){await clearRecords();await refreshCounts();$('backupStatus').textContent='Dados locais apagados.';}}});
async function refreshCounts(){const n=(await getAll()).length;$('recordCount').textContent=`${n} registro${n===1?'':'s'}`;if($('page-historico').classList.contains('active'))renderHistory();if($('page-metricas').classList.contains('active'))renderMetrics();}
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(console.warn);
(async()=>{try{db=await openDB();await refreshCounts();}catch(e){alert('O armazenamento local não pôde ser iniciado neste navegador. Abra a aplicação em HTTPS e tente novamente.');console.error(e);}})();

// PIN local padrão 3633. Proteção de interface, não criptografia dos dados.
(()=>{
 const gate=document.getElementById('pinGate'),form=document.getElementById('pinGateForm'),input=document.getElementById('pinGateInput'),msg=document.getElementById('pinMessage'),btn=document.getElementById('pinGateSubmit'),reset=document.getElementById('pinReset');
 const DEFAULT_PIN='3633', PIN_KEY='jet-access-pin';
 let pin=localStorage.getItem(PIN_KEY)||DEFAULT_PIN;
 localStorage.setItem(PIN_KEY,pin);
 function show(){gate.classList.remove('hidden');input.value='';input.setAttribute('inputmode','numeric');input.setAttribute('autocomplete','off');msg.textContent='Digite seu PIN para continuar.';btn.textContent='Entrar';reset.classList.remove('hidden');}
 form.addEventListener('submit',e=>{e.preventDefault();if(input.value===pin){gate.classList.add('hidden');msg.textContent='';input.value='';}else{msg.textContent='PIN incorreto. Use “Esqueci o PIN” para restaurar o PIN padrão.';input.value='';input.focus();}});
 reset.addEventListener('click',()=>{if(confirm('Restaurar o PIN padrão 3633? Seus registros locais serão mantidos.')){pin=DEFAULT_PIN;localStorage.setItem(PIN_KEY,pin);input.value='';msg.textContent='PIN restaurado. Digite 3633 para entrar.';input.focus();}});
 show();
})();
