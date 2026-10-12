(() => {
  'use strict';
  const $ = (q) => document.querySelector(q);
  const STORAGE_DATA = 'bean-note-data-v1';
  const STORAGE_PREFS = 'bean-note-prefs-v1';
  const flavors = ['초콜릿','견과','캐러멜','베리','시트러스','플로럴','열대과일','클린'];
  const sampleData = [
    ['2026-08','구지 우라가','모닝 웨이브','에티오피아','내추럴','핸드드립',19000,200,42,4.6,91,82,2,5,2,'베리, 플로럴, 열대과일'],
    ['2026-09','구지 우라가','모닝 웨이브','에티오피아','내추럴','핸드드립',19000,200,51,4.7,93,86,2,5,2,'베리, 플로럴, 열대과일'],
    ['2026-10','구지 우라가','모닝 웨이브','에티오피아','내추럴','핸드드립',19500,200,58,4.8,95,89,2,5,2,'베리, 플로럴, 열대과일'],
    ['2026-08','엘 파라이소 리치','브라운 포레스트','콜롬비아','무산소','핸드드립',24000,200,29,4.4,86,73,2,4,3,'리치, 열대과일, 플로럴'],
    ['2026-09','엘 파라이소 리치','브라운 포레스트','콜롬비아','무산소','핸드드립',24000,200,34,4.5,89,77,2,4,3,'리치, 열대과일, 플로럴'],
    ['2026-10','엘 파라이소 리치','브라운 포레스트','콜롬비아','무산소','핸드드립',25000,200,31,4.4,87,74,2,4,3,'리치, 열대과일, 플로럴'],
    ['2026-08','세하두 클래식','오크 로스터스','브라질','내추럴','에스프레소',14500,200,63,4.2,82,79,4,2,4,'초콜릿, 견과, 캐러멜'],
    ['2026-09','세하두 클래식','오크 로스터스','브라질','내추럴','에스프레소',14500,200,68,4.3,84,81,4,2,4,'초콜릿, 견과, 캐러멜'],
    ['2026-10','세하두 클래식','오크 로스터스','브라질','내추럴','에스프레소',15000,200,72,4.3,85,83,4,2,4,'초콜릿, 견과, 캐러멜'],
    ['2026-08','키암부 AA','하프문 커피','케냐','워시드','핸드드립',18000,200,37,4.5,88,76,2,5,3,'베리, 시트러스, 클린'],
    ['2026-09','키암부 AA','하프문 커피','케냐','워시드','핸드드립',18500,200,43,4.6,90,80,2,5,3,'베리, 시트러스, 클린'],
    ['2026-10','키암부 AA','하프문 커피','케냐','워시드','핸드드립',18500,200,49,4.7,92,84,2,5,3,'베리, 시트러스, 클린']
  ].map((d,i)=>({id:`sample-${i}`,month:d[0],name:d[1],roaster:d[2],origin:d[3],process:d[4],brew:d[5],price:d[6],weight:d[7],sales:d[8],rating:d[9],sentiment:d[10],repurchase:d[11],roast:d[12],acidity:d[13],body:d[14],flavors:d[15]}));
  const defaultPrefs = {purpose:'핸드드립',budget:15000,roast:2,acidity:4,body:3,flavors:['베리','플로럴','시트러스']};
  let data = load(STORAGE_DATA, sampleData);
  let prefs = load(STORAGE_PREFS, defaultPrefs);
  let selectedMonth = '';
  const won = new Intl.NumberFormat('ko-KR');

  function load(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(fallback)?(Array.isArray(v)&&v.length?v:fallback):({...fallback,...v});}catch{return Array.isArray(fallback)?[...fallback]:{...fallback};}}
  function save(){localStorage.setItem(STORAGE_DATA,JSON.stringify(data));localStorage.setItem(STORAGE_PREFS,JSON.stringify(prefs));$('#lastSaved').textContent=`마지막 저장 ${new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}`;}
  function clamp(n,min,max){return Math.min(max,Math.max(min,Number(n)||0));}
  function currentRows(){return data.filter(r=>r.month===selectedMonth);}
  function months(){return [...new Set(data.map(r=>r.month).filter(Boolean))].sort();}
  function previousMonth(){const all=months();const i=all.indexOf(selectedMonth);return i>0?all[i-1]:null;}
  function beanKey(r){return `${r.roaster}::${r.name}`;}
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function flavorArray(v){return String(v||'').split(/[,/·|]/).map(x=>x.trim()).filter(Boolean);}
  function price100(r){return r.weight?Math.round(r.price/r.weight*100):r.price;}
  function avg(rows,key){return rows.length?rows.reduce((s,r)=>s+(Number(r[key])||0),0)/rows.length:0;}
  function deltaText(now,prev,suffix='',digits=0){if(!prev)return '이전 달 데이터 없음';const d=now-prev;const sign=d>0?'+':'';return `${sign}${d.toFixed(digits)}${suffix} 이전 달 대비`;}

  function scoreRow(row){
    const closeness=(a,b)=>Math.max(0,100-Math.abs(a-b)*25);
    const selected=prefs.flavors||[];const notes=flavorArray(row.flavors);
    const flavorScore=selected.length?selected.filter(f=>notes.some(n=>n.includes(f)||f.includes(n))).length/selected.length*100:70;
    const purposeScore=prefs.purpose==='상관없음'||row.brew==='상관없음'?85:(row.brew===prefs.purpose?100:35);
    const taste=(closeness(row.roast,prefs.roast)+closeness(row.acidity,prefs.acidity)+closeness(row.body,prefs.body)+flavorScore+purposeScore)/5;
    const reaction=clamp((row.rating/5*100)*.5+row.sentiment*.25+row.repurchase*.25,0,100);
    const prior=data.filter(r=>beanKey(r)===beanKey(row)&&r.month<row.month).sort((a,b)=>b.month.localeCompare(a.month))[0];
    const momentum=prior&&prior.sales?clamp(50+((row.sales-prior.sales)/prior.sales)*100,0,100):50;
    const p100=price100(row);const value=p100<=prefs.budget?100:clamp(100-(p100-prefs.budget)/prefs.budget*120,0,100);
    const score=Math.round(taste*.5+reaction*.25+momentum*.15+value*.1);
    const matches=selected.filter(f=>notes.some(n=>n.includes(f)||f.includes(n)));
    const reasons=[];
    if(matches.length)reasons.push(`좋아하는 ${matches.slice(0,2).join('·')} 향미`);
    if(row.rating>=4.5)reasons.push(`평점 ${row.rating.toFixed(1)}점의 좋은 반응`);
    if(prior&&row.sales>prior.sales)reasons.push(`판매량 ${Math.round((row.sales-prior.sales)/prior.sales*100)}% 증가`);
    if(p100<=prefs.budget)reasons.push('예산 안의 가격');
    if(!reasons.length)reasons.push('취향 지표가 고르게 맞음');
    return {...row,score,taste,reaction,momentum,value,p100,reasons};
  }

  function renderMonthOptions(){const all=months();if(!selectedMonth||!all.includes(selectedMonth))selectedMonth=all.at(-1)||new Date().toISOString().slice(0,7);$('#monthSelect').innerHTML=all.map(m=>`<option value="${m}" ${m===selectedMonth?'selected':''}>${m.replace('-','년 ')}월</option>`).join('');}
  function renderMetrics(){const rows=currentRows(),prev=data.filter(r=>r.month===previousMonth());const sales=rows.reduce((s,r)=>s+r.sales,0),prevSales=prev.reduce((s,r)=>s+r.sales,0);const rating=avg(rows,'rating'),prevRating=avg(prev,'rating'),rep=avg(rows,'repurchase'),prevRep=avg(prev,'repurchase');$('#salesMetric').textContent=won.format(sales);$('#ratingMetric').textContent=rating.toFixed(1);$('#repurchaseMetric').textContent=Math.round(rep);$('#beanMetric').textContent=rows.length;setDelta('#salesDelta',deltaText(sales,prevSales,'봉'),sales-prevSales);setDelta('#ratingDelta',deltaText(rating,prevRating,'점',1),rating-prevRating);setDelta('#repurchaseDelta',deltaText(rep,prevRep,'%p',0),rep-prevRep);}
  function setDelta(sel,text,d){const el=$(sel);el.textContent=text;el.classList.toggle('down',d<0);}
  function renderRecommendation(){const ranked=currentRows().map(scoreRow).sort((a,b)=>b.score-a.score);const top=ranked[0];$('#rankingList').innerHTML=ranked.slice(0,5).map((r,i)=>`<li><span class="rank-number">${i+1}</span><span class="rank-copy"><b>${esc(r.name)}</b><small>${esc(r.roaster)} · ${esc(r.reasons[0])}</small></span><span class="rank-score">${r.score}</span></li>`).join('');if(!top)return;$('#topScore').textContent=top.score;$('#scoreCircle').style.strokeDashoffset=320-(320*top.score/100);$('#topRoaster').textContent=top.roaster;$('#topName').textContent=top.name;$('#topTags').innerHTML=[top.origin,top.process,...flavorArray(top.flavors).slice(0,3)].map(x=>`<span>${esc(x)}</span>`).join('');$('#topReason').textContent=`${top.reasons.join(', ')} 조건이 맞아 이번 달 가장 먼저 추천합니다.`;$('#topReaction').textContent=`★ ${top.rating.toFixed(1)} · 긍정 ${Math.round(top.sentiment)}%`;$('#topPrice').textContent=`${won.format(top.p100)}원`;$('#topBrew').textContent=top.brew;$('#confidenceLabel').textContent=`취향 일치도 ${Math.round(top.taste)}%`;}
  function renderPreferences(){$('#purposePref').value=prefs.purpose;$('#budgetPref').value=prefs.budget;$('#roastPref').value=prefs.roast;$('#acidityPref').value=prefs.acidity;$('#bodyPref').value=prefs.body;$('#budgetValue').textContent=`${won.format(prefs.budget)}원`;$('#roastValue').textContent=['','매우 약하게','약배전','중배전','강배전','매우 강하게'][prefs.roast];$('#acidityValue').textContent=['','거의 없이','은은하게','균형 있게','선명하게','아주 선명하게'][prefs.acidity];$('#bodyValue').textContent=['','가볍게','부드럽게','균형 있게','묵직하게','아주 묵직하게'][prefs.body];$('#flavorPrefs').innerHTML=flavors.map(f=>`<button class="${prefs.flavors.includes(f)?'active':''}" data-flavor="${f}">${f}</button>`).join('');}
  function renderTable(){const q=$('#tableSearch').value.trim().toLowerCase();const rows=currentRows().map(scoreRow).sort((a,b)=>b.score-a.score).filter(r=>!q||[r.name,r.roaster,r.origin,r.flavors].some(v=>String(v).toLowerCase().includes(q)));$('#emptyTable').hidden=rows.length>0;$('#beanTable').innerHTML=rows.map(r=>`<tr data-id="${esc(r.id)}"><td class="bean-name"><b>${esc(r.name)}</b><small>${esc(r.flavors)}</small></td><td>${esc(r.roaster)}</td><td>${esc(r.origin)} · ${esc(r.process)}</td><td>${won.format(r.sales)}봉</td><td>★ ${r.rating.toFixed(1)}</td><td>${Math.round(r.sentiment)}%</td><td>${Math.round(r.repurchase)}%</td><td>${won.format(r.p100)}원</td><td><span class="score-pill">${r.score}점</span></td><td><button class="delete-button" data-delete="${esc(r.id)}">삭제</button></td></tr>`).join('');}
  function renderChart(){const canvas=$('#salesChart'),box=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;canvas.width=Math.max(600,box.width*dpr);canvas.height=box.height*dpr;const c=canvas.getContext('2d');c.scale(dpr,dpr);const w=canvas.width/dpr,h=canvas.height/dpr,p={l:40,r:16,t:16,b:36};c.clearRect(0,0,w,h);const series=months().map(m=>({m,v:data.filter(r=>r.month===m).reduce((s,r)=>s+r.sales,0)}));const max=Math.max(...series.map(x=>x.v),1)*1.15;c.strokeStyle='#e2dfd5';c.fillStyle='#8b8f86';c.font='9px Noto Sans KR';for(let i=0;i<=4;i++){const y=p.t+(h-p.t-p.b)*i/4;c.beginPath();c.moveTo(p.l,y);c.lineTo(w-p.r,y);c.stroke();c.fillText(Math.round(max*(4-i)/4),4,y+3);}if(!series.length)return;const gap=(w-p.l-p.r)/Math.max(series.length,1);const bw=Math.min(42,gap*.55);series.forEach((s,i)=>{const x=p.l+gap*i+(gap-bw)/2,y=p.t+(h-p.t-p.b)*(1-s.v/max);c.fillStyle=s.m===selectedMonth?'#d96f45':'#b7c9b7';roundRect(c,x,y,bw,h-p.b-y,7);c.fill();c.fillStyle='#72776f';c.textAlign='center';c.fillText(s.m.slice(5)+'월',x+bw/2,h-13);c.fillStyle='#343a34';c.font='700 9px DM Sans';c.fillText(s.v,x+bw/2,y-7);c.font='9px Noto Sans KR';});c.textAlign='left';}
  function roundRect(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
  function render(){renderMonthOptions();renderMetrics();renderPreferences();renderRecommendation();renderTable();requestAnimationFrame(renderChart);}

  function normalKey(v){return String(v||'').toLowerCase().replace(/[\s_()%-]/g,'');}
  const aliases={month:['월','기준월','month'],name:['원두명','상품명','원두','bean','name'],roaster:['로스터리','판매처','브랜드','roaster'],origin:['원산지','산지','origin'],process:['가공','가공방식','process'],brew:['추출','추천추출','음용방식','brew'],price:['가격','판매가','price'],weight:['중량','중량g','weight'],sales:['판매수량','판매량','sales'],rating:['평점','별점','rating'],sentiment:['긍정반응','긍정률','sentiment'],repurchase:['재구매','재구매의향','repurchase'],roast:['로스팅','배전도','roast'],acidity:['산미','acidity'],body:['바디','body'],flavors:['향미','노트','플레이버','flavors']};
  function rowToRecord(row){const normalized={};Object.entries(row).forEach(([k,v])=>{const nk=normalKey(k);for(const [field,list] of Object.entries(aliases))if(list.some(a=>normalKey(a)===nk))normalized[field]=v;});if(!normalized.month||!normalized.name||!normalized.roaster)return null;let m=normalized.month instanceof Date?`${normalized.month.getFullYear()}-${String(normalized.month.getMonth()+1).padStart(2,'0')}`:String(normalized.month).trim().replace(/[./년\s]+/g,'-').replace(/월/g,'').replace(/-+$/,'');if(/^\d{4}-\d{1}$/.test(m))m=m.replace(/-(\d)$/,'-0$1');return{id:`import-${Date.now()}-${Math.random().toString(36).slice(2)}`,month:m,name:String(normalized.name),roaster:String(normalized.roaster),origin:String(normalized.origin||''),process:String(normalized.process||'기타'),brew:String(normalized.brew||'상관없음'),price:clamp(normalized.price,0,1e9),weight:clamp(normalized.weight||200,1,1e6),sales:clamp(normalized.sales,0,1e9),rating:clamp(normalized.rating,0,5),sentiment:clamp(normalized.sentiment||0,0,100),repurchase:clamp(normalized.repurchase||0,0,100),roast:clamp(normalized.roast||3,1,5),acidity:clamp(normalized.acidity||3,1,5),body:clamp(normalized.body||3,1,5),flavors:String(normalized.flavors||'')};}
  async function importFile(file){let rows=[];if(file.name.toLowerCase().endsWith('.csv')){const text=await file.text();const matrix=parseCsv(text);const headers=matrix.shift()||[];rows=matrix.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));}else{const wb=new ExcelJS.Workbook();await wb.xlsx.load(await file.arrayBuffer());const ws=wb.worksheets[0];if(!ws)throw new Error('시트가 없습니다.');const matrix=[];ws.eachRow({includeEmpty:false},row=>matrix.push(row.values.slice(1).map(v=>v&&typeof v==='object'?(v.result??v.text??''):v)));const headers=matrix.shift()||[];rows=matrix.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));}const imported=rows.map(rowToRecord).filter(Boolean);if(!imported.length)throw new Error('필수 열을 찾지 못했습니다.');data.push(...imported);selectedMonth=imported.map(r=>r.month).sort().at(-1);save();render();$('#dataDialog').close();toast(`${imported.length}건을 추가했습니다.`);}
  function parseCsv(text){const out=[],row=[];let cell='',quote=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quote&&text[i+1]==='"'){cell+='"';i++;}else quote=!quote;}else if(ch===','&&!quote){row.push(cell);cell='';}else if((ch==='\n'||ch==='\r')&&!quote){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v!==''))out.push([...row]);row.length=0;cell='';}else cell+=ch;}row.push(cell);if(row.some(v=>v!==''))out.push(row);return out;}
  function csvEscape(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}
  function downloadCsv(rows,name){const cols=['월','원두명','로스터리','원산지','가공방식','추천추출','가격','중량g','판매수량','평점','긍정반응','재구매의향','로스팅','산미','바디','향미'];const keys=['month','name','roaster','origin','process','brew','price','weight','sales','rating','sentiment','repurchase','roast','acidity','body','flavors'];const csv='\uFEFF'+[cols,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(csvEscape).join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  let toastTimer;function toast(msg){clearTimeout(toastTimer);$('#toast').textContent=msg;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2300);}

  document.querySelectorAll('[data-action="open-data"]').forEach(b=>b.addEventListener('click',()=>{$('#beanForm').reset();$('#beanForm').elements.month.value=selectedMonth;$('#dataDialog').showModal();}));
  document.querySelectorAll('[data-scroll]').forEach(b=>b.addEventListener('click',()=>{$(`#${b.dataset.scroll}`).scrollIntoView({behavior:'smooth'});}));
  $('#monthSelect').addEventListener('change',e=>{selectedMonth=e.target.value;render();});
  ['purpose','budget','roast','acidity','body'].forEach(key=>{const id=`#${key}Pref`;$(id).addEventListener('input',e=>{prefs[key]=key==='purpose'?e.target.value:Number(e.target.value);save();render();});});
  $('#flavorPrefs').addEventListener('click',e=>{const b=e.target.closest('[data-flavor]');if(!b)return;const f=b.dataset.flavor;prefs.flavors=prefs.flavors.includes(f)?prefs.flavors.filter(x=>x!==f):[...prefs.flavors,f];save();render();});
  $('#resetPrefs').addEventListener('click',()=>{prefs={...defaultPrefs,flavors:[...defaultPrefs.flavors]};save();render();});
  $('#tableSearch').addEventListener('input',renderTable);
  $('#beanTable').addEventListener('click',e=>{const id=e.target.dataset.delete;if(!id)return;if(confirm('이 기록을 삭제할까요?')){data=data.filter(r=>r.id!==id);save();render();toast('기록을 삭제했습니다.');}});
  function saveManualRecord(){const form=$('#beanForm');if(!form.reportValidity())return;const f=new FormData(form);const obj=Object.fromEntries(f.entries());const rec=rowToRecord(obj);if(!rec){toast('월·원두명·로스터리를 입력해 주세요.');return;}data.push(rec);selectedMonth=rec.month;save();render();$('#dataDialog').close();toast('기록을 저장했습니다.');}
  $('#beanForm').addEventListener('submit',e=>{e.preventDefault();saveManualRecord();});
  $('#saveBean').addEventListener('click',saveManualRecord);
  $('#importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{await importFile(file);}catch(err){console.error(err);toast(err.message||'파일을 읽지 못했습니다.');}e.target.value='';});
  $('#downloadTemplate').addEventListener('click',()=>downloadCsv([{month:selectedMonth||'2026-10',name:'예시 원두',roaster:'예시 로스터리',origin:'에티오피아',process:'워시드',brew:'핸드드립',price:18000,weight:200,sales:30,rating:4.5,sentiment:88,repurchase:75,roast:2,acidity:4,body:2,flavors:'베리, 플로럴'}],'홀빈_월별데이터_양식.csv'));
  $('#exportData').addEventListener('click',()=>downloadCsv(data,'홀빈_판매반응_전체데이터.csv'));
  $('#resetData').addEventListener('click',()=>{if(confirm('저장된 데이터를 지우고 샘플로 되돌릴까요?')){data=sampleData.map(r=>({...r}));prefs={...defaultPrefs,flavors:[...defaultPrefs.flavors]};save();render();toast('샘플 데이터로 초기화했습니다.');}});
  window.addEventListener('resize',()=>requestAnimationFrame(renderChart));
  render();
})();
