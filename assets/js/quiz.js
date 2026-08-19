import { getQuizBySlug, saveSubmission, incrementView, getLocalState } from './repository.js';
import { RESPONSE_TYPES, OPTION_TYPES, uid } from './defaults.js';
import { escapeHtml, safeJson, toast } from './utils.js';
import { getLegal } from './platform-safe-settings.js';
import { getPlatformMemory } from './platform-memory.js';
import { applyQuizPageDesign, quizTopMediaHtml } from './quiz-published-design.js';

const root=document.getElementById('quizRoot');
const slug=new URLSearchParams(location.search).get('slug')||'previdenciario';
const legal=getLegal();
const platformMemory=getPlatformMemory();
const platformName=platformMemory?.platformName||'QUIZ ADV';

const DISPLAY_TYPES=new Set(['title','text','image','separator','progress','container','grid','percentage','chart','results-list','badge','message']);
const ACTION_TYPES=new Set(['button','action','next','back','submit','retry']);
const PHONE_COUNTRIES=[
  {code:'55',iso:'BR',flag:'🇧🇷',name:'Brasil',min:10,max:11},
  {code:'1',iso:'US',flag:'🇺🇸',name:'EUA / Canadá',min:10,max:10},
  {code:'351',iso:'PT',flag:'🇵🇹',name:'Portugal',min:9,max:9},
  {code:'34',iso:'ES',flag:'🇪🇸',name:'Espanha',min:9,max:9},
  {code:'44',iso:'GB',flag:'🇬🇧',name:'Reino Unido',min:9,max:10},
  {code:'54',iso:'AR',flag:'🇦🇷',name:'Argentina',min:10,max:11},
  {code:'56',iso:'CL',flag:'🇨🇱',name:'Chile',min:9,max:9},
  {code:'57',iso:'CO',flag:'🇨🇴',name:'Colômbia',min:10,max:10},
  {code:'52',iso:'MX',flag:'🇲🇽',name:'México',min:10,max:10}
];

let tracker={initTracking:()=>{},track:()=>{}};
try{tracker=await import('./tracking.js');}catch(error){console.warn('Tracking indisponível; quiz continuará funcionando.',error);}

let quiz=null;
let answers={};
let currentId=null;
let history=[];
let startedAt=Date.now();
let timer=null;
let finished=false;
let busy=false;
let consentChecked=false;
let attemptId=null;
let attemptCreatedAt=null;
let attemptSavePromise=null;

try{quiz=await getQuizBySlug(slug);}catch(error){console.error('Falha ao carregar quiz.',error);}
if(!quiz){
  root.innerHTML='<section class="error-card"><h1>Quiz não encontrado</h1><p>Confira o link ou publique novamente o quiz no painel administrativo.</p></section>';
  throw new Error('Quiz não encontrado');
}

applyDesign();
try{tracker.initTracking({...getLocalState().settings,...quiz.integrations});}catch(error){console.warn('Tracking não iniciado.',error);}
try{await incrementView(quiz);}catch(error){console.warn('Visualização não registrada.',error);}
trackSafe('quiz_view',{quiz_id:quiz.id,quiz_slug:quiz.slug});

const attemptsKey=`qp_attempts_${quiz.id}`;
restoreProgress();
if(maxAttemptsReached())renderAttemptLimit();
else{
  void beginAttempt();
  if(quiz.settings?.showWelcome===false)startQuiz();
  else renderWelcome();
}

function trackSafe(event,params={}){
  try{tracker.track(event,params);}catch(error){console.warn('Evento de tracking ignorado.',error);}
}

function applyDesign(){
  applyQuizPageDesign(quiz,{platformName});
}

function legalFooter(){
  const links=[];
  if(legal.privacyUrl)links.push(`<a href="${escapeHtml(legal.privacyUrl)}" target="_blank" rel="noopener">Política de Privacidade</a>`);
  if(legal.termsUrl)links.push(`<a href="${escapeHtml(legal.termsUrl)}" target="_blank" rel="noopener">Termos de Uso</a>`);
  return links.length?`<div class="qp-legal-footer" style="text-align:center;font-size:11px;color:var(--muted);padding:14px 18px 0">${links.join(' · ')}</div>`:'';
}

function wrap(inner){
  const d=quiz.design||{};
  return `<section class="quiz-card-public" style="border-radius:${d.cardRadius||18}px;background:${d.cardBackground||'#fff'};${d.cardShadow===false?'box-shadow:none;':''}"><div class="quiz-banner"></div><div class="quiz-inner" style="padding:${d.cardPadding||32}px">${quizTopMediaHtml(d,escapeHtml)}${inner}<div class="powered">${escapeHtml(platformName)}</div>${legalFooter()}</div></section>`;
}

function renderWelcome(){
  finished=false;
  busy=false;
  root.innerHTML=wrap(`<div class="quiz-question quiz-welcome"><span class="eyebrow quiz-welcome-kicker">${escapeHtml(quiz.category||'QUIZ')}</span><div class="quiz-welcome-copy"><h1 style="font-size:${quiz.design?.titleSize||32}px;font-weight:${quiz.design?.titleWeight||700}">${escapeHtml(quiz.title)}</h1><p>${escapeHtml(quiz.messages?.welcome||quiz.description||'Clique para iniciar.')}</p></div><button type="button" id="startQuiz" class="btn btn-primary quiz-start-button" style="background:${quiz.design?.buttonBackground||'var(--primary)'};color:${quiz.design?.buttonText||'#fff'};border-radius:${quiz.design?.buttonRadius||10}px"><span>Iniciar Quiz</span><span aria-hidden="true">→</span></button></div>`);
  const start=document.getElementById('startQuiz');
  if(start)start.onclick=startQuiz;
}

function beginAttempt(){
  if(!attemptId)attemptId=uid('attempt');
  if(!attemptCreatedAt)attemptCreatedAt=new Date().toISOString();
  const submission={
    id:`${attemptId}_start`,
    attemptId,
    attemptStatus:'started',
    trackingVersion:2,
    answers:{},
    score:0,
    // Compatibilidade com as regras públicas atuais do Firestore.
    // O painel usa attemptStatus para distinguir início de conclusão.
    completed:true,
    startedAt:new Date(startedAt).toISOString(),
    createdAt:attemptCreatedAt,
    updatedAt:new Date().toISOString(),
    durationSeconds:0,
    userAgent:navigator.userAgent
  };
  attemptSavePromise=saveSubmission(quiz,submission).catch(error=>{
    console.warn('Início da tentativa não pôde ser sincronizado.',error);
    return null;
  });
  autoSave();
  return attemptSavePromise;
}

function startQuiz(){
  if(busy)return;
  startedAt=Date.now();
  finished=false;
  const flow=getFlow();
  if(!currentId||!flow.some(q=>q.id===currentId)){
    currentId=flow[0]?.id||null;
    history=[];
  }
  trackSafe('quiz_start',{quiz_id:quiz.id});
  startTimer();
  if(currentId)renderCurrent();
  else void finish({requireConsent:false});
}

function isRenderable(q){
  return Boolean(q)&&(RESPONSE_TYPES.has(q.type)||DISPLAY_TYPES.has(q.type)||ACTION_TYPES.has(q.type));
}

function getFlow(){
  return (quiz.questions||[]).filter(q=>q&&q.visible!==false&&shouldDisplay(q)&&isRenderable(q));
}

function shouldDisplay(q){
  if(!q.condition?.fieldId)return true;
  const actual=answers[q.condition.fieldId];
  const expected=q.condition.value;
  let match=false;
  switch(q.condition.operator){
    case '!=':match=String(actual)!=String(expected);break;
    case '>':match=Number(actual)>Number(expected);break;
    case '<':match=Number(actual)<Number(expected);break;
    case 'contains':match=Array.isArray(actual)?actual.map(String).includes(String(expected)):String(actual??'').includes(String(expected));break;
    default:match=String(actual)==String(expected);
  }
  return q.condition.effect==='hide'?!match:match;
}

function actionKind(q){
  if(q.type==='next')return 'next';
  if(q.type==='back')return 'back';
  if(q.type==='submit')return 'submit';
  if(q.type==='retry')return 'retry';
  return q.actionType||'next';
}

function currentWillFinish(q,index,flow){
  if(ACTION_TYPES.has(q.type))return ['submit','result'].includes(actionKind(q));
  return index===flow.length-1;
}

function consentHtml(){
  if(!legal.consentRequired)return '';
  const text=escapeHtml(legal.consentText||'Li e concordo com a Política de Privacidade e os Termos de Uso.');
  return `<label id="qpLegalConsent" style="display:flex;align-items:flex-start;gap:10px;margin:18px 0 2px;padding:12px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,.7);font-size:12px;line-height:1.5"><input id="qpLegalConsentInput" type="checkbox" ${consentChecked?'checked':''} style="margin-top:3px"><span>${text}</span></label><div id="qpLegalError" style="display:none;margin-top:8px;color:var(--danger);font-size:12px;font-weight:600"></div>`;
}

function renderCurrent(){
  if(finished||busy)return;
  const flow=getFlow();
  if(!flow.length){void finish({requireConsent:false});return;}

  let index=flow.findIndex(q=>q.id===currentId);
  if(index<0){index=0;currentId=flow[0].id;}
  const q=flow[index];
  const progress=Math.round(((index+1)/Math.max(1,flow.length))*100);
  const isAction=ACTION_TYPES.has(q.type);
  const willFinish=currentWillFinish(q,index,flow);
  const navigation=isAction?'':`<div class="quiz-actions-public">${quiz.settings?.allowBack&&history.length?'<button type="button" id="backBtn" class="btn btn-secondary">← Voltar</button>':'<span></span>'}<button type="button" id="nextBtn" class="btn btn-primary">${willFinish?'Ver resultado':'Avançar'}</button></div>`;

  root.innerHTML=wrap(`${quiz.settings?.showProgress?`<div class="quiz-progress-wrap"><div class="quiz-progress-meta"><span>${quiz.settings?.showQuestionNumber?`Etapa ${index+1} de ${flow.length}`:''}</span><span>${progress}%</span></div><div class="bar"><span style="width:${progress}%"></span></div></div>`:''}<div class="quiz-question">${renderField(q,progress)}</div>${willFinish?consentHtml():''}${navigation}`);

  bindField(q);
  bindConsent();

  const back=document.getElementById('backBtn');
  const next=document.getElementById('nextBtn');
  const fieldAction=document.getElementById('fieldAction');
  if(back)back.onclick=goBack;
  if(next)next.onclick=()=>void advance(q);
  if(fieldAction)fieldAction.onclick=()=>void handleFlowAction(q);

  requestAnimationFrame(()=>syncCurrentField(q,{persist:false}));
  setTimeout(()=>{
    if(!finished&&!busy&&currentId===q.id)syncCurrentField(q,{persist:false});
  },350);
}

function bindConsent(){
  const checkbox=document.getElementById('qpLegalConsentInput');
  if(!checkbox)return;
  checkbox.onchange=()=>{
    consentChecked=checkbox.checked;
    autoSave();
    const err=document.getElementById('qpLegalError');
    if(err&&consentChecked){err.style.display='none';err.textContent='';}
  };
}

function requireLegalConsent(){
  const checkbox=document.getElementById('qpLegalConsentInput');
  if(checkbox)consentChecked=checkbox.checked;
  if(!legal.consentRequired||consentChecked)return true;
  const err=document.getElementById('qpLegalError');
  if(err){
    err.textContent='Você precisa concordar com a Política de Privacidade e os Termos de Uso antes de concluir.';
    err.style.display='block';
  }
  toast('Aceite os termos para concluir.','error');
  checkbox?.focus();
  return false;
}

function optionInputs(q){
  return [...root.querySelectorAll('input[type="radio"],input[type="checkbox"]')].filter(input=>input.dataset.fieldId===q.id);
}

function phoneParts(value){
  const raw=String(value||'').trim();
  const digits=raw.replace(/\D/g,'');
  const explicitCountry=raw.startsWith('+')||digits.length>11;
  const country=explicitCountry
    ?[...PHONE_COUNTRIES].sort((a,b)=>b.code.length-a.code.length).find(item=>digits.startsWith(item.code))||PHONE_COUNTRIES[0]
    :PHONE_COUNTRIES[0];
  const national=explicitCountry&&digits.startsWith(country.code)?digits.slice(country.code.length):digits;
  return {country,national:national.slice(0,country.max)};
}

function formatNationalPhone(value,countryCode='55'){
  const country=PHONE_COUNTRIES.find(item=>item.code===countryCode)||PHONE_COUNTRIES[0];
  const digits=String(value||'').replace(/\D/g,'').slice(0,country.max);
  if(country.code==='55'){
    if(digits.length<=2)return digits;
    const ddd=digits.slice(0,2);
    const number=digits.slice(2);
    if(number.length<=4)return `(${ddd}) ${number}`;
    const first=number.length>8?number.slice(0,5):number.slice(0,4);
    const last=number.slice(first.length);
    return `(${ddd}) ${first}${last?`-${last}`:''}`;
  }
  if(country.code==='1'){
    if(digits.length<=3)return digits;
    if(digits.length<=6)return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  return digits.replace(/(\d{3})(?=\d)/g,'$1 ').trim();
}

function validPhoneInput(countryCode,value){
  const country=PHONE_COUNTRIES.find(item=>item.code===countryCode)||PHONE_COUNTRIES[0];
  const digits=String(value||'').replace(/\D/g,'');
  if(digits.length<country.min||digits.length>country.max)return false;
  if(country.code==='55'){
    if(!/^[1-9]\d/.test(digits))return false;
    if(digits.length===11&&digits[2]!=='9')return false;
  }
  return true;
}

function syncCurrentField(q,{persist=true}={}){
  if(!q||!RESPONSE_TYPES.has(q.type))return;

  if(['radio','checkbox','image-options'].includes(q.type)){
    const inputs=optionInputs(q);
    if(q.type==='checkbox')answers[q.id]=inputs.filter(input=>input.checked).map(input=>input.value);
    else{
      const checked=inputs.find(input=>input.checked);
      if(checked)answers[q.id]=checked.value;
      else if(!Object.prototype.hasOwnProperty.call(answers,q.id))answers[q.id]='';
    }
  }else if(q.type==='rating'){
    // Rating já atualiza answers no clique.
  }else{
    const input=document.getElementById('fieldInput');
    if(input){
      if(q.type==='file')answers[q.id]=input.files?.[0]?.name||answers[q.id]||'';
      else if(input.dataset.phoneInput==='true'){
        const country=document.getElementById('phoneCountry')?.value||'55';
        const national=input.value.replace(/\D/g,'');
        answers[q.id]=national?`+${country}${national}`:'';
      }
      else answers[q.id]=input.value;
    }
  }

  if(persist)autoSave();
}

function clearFieldError(){
  const err=document.getElementById('fieldRequiredError');
  if(err)err.remove();
  const input=document.getElementById('fieldInput');
  if(input)input.removeAttribute('aria-invalid');
}

function showFieldError(message){
  clearFieldError();
  const question=root.querySelector('.quiz-question');
  if(question){
    const el=document.createElement('div');
    el.id='fieldRequiredError';
    el.style='margin-top:10px;color:var(--danger);font-size:12px;font-weight:600';
    el.textContent=message;
    question.appendChild(el);
  }
  const input=document.getElementById('fieldInput');
  if(input){input.setAttribute('aria-invalid','true');input.focus();}
  else optionInputs({id:currentId})[0]?.focus();
}

function hasAnswer(q){
  const value=answers[q.id];
  return Array.isArray(value)?value.length>0:value!==undefined&&value!==null&&String(value).trim()!=='';
}

function validateCurrent(q){
  syncCurrentField(q,{persist:true});
  if(RESPONSE_TYPES.has(q.type)&&q.required&&!hasAnswer(q)){
    const message=quiz.messages?.requiredError||'Preencha este campo para continuar.';
    showFieldError(message);
    toast(message,'error');
    return false;
  }
  const input=document.getElementById('fieldInput');
  if(input?.type==='email'&&input.value&&!input.validity.valid){
    const message='Informe um e-mail válido para continuar.';
    showFieldError(message);
    toast(message,'error');
    return false;
  }
  if(input?.dataset.phoneInput==='true'){
    const country=document.getElementById('phoneCountry')?.value||'55';
    if(!validPhoneInput(country,input.value)){
      const selected=PHONE_COUNTRIES.find(item=>item.code===country)||PHONE_COUNTRIES[0];
      const message=`Informe um telefone válido de ${selected.name}, com DDD quando necessário.`;
      showFieldError(message);
      toast(message,'error');
      return false;
    }
  }
  clearFieldError();
  return true;
}

function nextQuestionAfter(q){
  const flow=getFlow();
  const index=flow.findIndex(item=>item.id===q.id);
  if(index>=0)return flow[index+1]||null;

  const all=quiz.questions||[];
  const originalIndex=all.findIndex(item=>item.id===q.id);
  for(let i=originalIndex+1;i<all.length;i++){
    const candidate=all[i];
    if(candidate?.visible!==false&&shouldDisplay(candidate)&&isRenderable(candidate))return candidate;
  }
  return null;
}

async function advance(q){
  if(busy||finished)return;
  if(!validateCurrent(q))return;
  if(RESPONSE_TYPES.has(q.type))trackSafe('quiz_answer',{quiz_id:quiz.id,field_id:q.id});

  const next=nextQuestionAfter(q);
  if(!next){
    if(!requireLegalConsent())return;
    await finish({requireConsent:false});
    return;
  }

  if(history[history.length-1]!==q.id)history.push(q.id);
  currentId=next.id;
  autoSave();
  renderCurrent();
}

function goBack(){
  if(busy||finished)return;
  const current=getFlow().find(q=>q.id===currentId);
  if(current&&RESPONSE_TYPES.has(current.type))syncCurrentField(current,{persist:true});

  const flow=getFlow();
  const flowIds=new Set(flow.map(q=>q.id));
  let target=null;

  while(history.length&&!target){
    const id=history.pop();
    if(flowIds.has(id))target=id;
  }

  if(!target){
    const index=flow.findIndex(q=>q.id===currentId);
    if(index>0)target=flow[index-1].id;
  }

  if(target){
    currentId=target;
    autoSave();
    renderCurrent();
  }else{
    toast('Não há uma etapa anterior disponível.','error');
  }
}

async function handleFlowAction(q){
  if(busy||finished)return;
  const type=actionKind(q);

  if(type==='back'){goBack();return;}
  if(type==='retry'){retryQuiz();return;}
  if(type==='submit'||type==='result'){
    if(!requireLegalConsent())return;
    await finish({requireConsent:false});
    return;
  }
  if(type==='url'&&q.actionValue){window.open(q.actionValue,'_blank','noopener');return;}
  if(type==='whatsapp'){
    const number=String(q.actionValue||quiz.integrations?.whatsappNumber||'').replace(/\D/g,'');
    if(number)window.open(`https://wa.me/${number}`,'_blank','noopener');
    else toast('Número de WhatsApp não configurado.','error');
    return;
  }
  if(type==='email'){
    const email=String(q.actionValue||quiz.integrations?.emailTo||'').trim();
    if(email)location.href=`mailto:${email}`;
    else toast('E-mail não configurado.','error');
    return;
  }
  if(type==='copy'){
    const value=String(q.actionValue||'');
    if(!value){toast('Nenhum conteúdo configurado para copiar.','error');return;}
    try{await navigator.clipboard.writeText(value);toast('Conteúdo copiado.','success');}
    catch{toast('Não foi possível copiar.','error');}
    return;
  }

  await advance(q);
}

function renderField(q,progress){
  const desc=q.description?`<p>${escapeHtml(q.description)}</p>`:'';
  if(q.type==='title')return `<h2>${escapeHtml(q.label)}</h2>${desc}`;
  if(q.type==='text')return `<h2>${escapeHtml(q.label)}</h2>${desc}`;
  if(q.type==='image')return `<h2>${escapeHtml(q.label)}</h2>${q.imageUrl?`<img class="quiz-content-image" src="${escapeHtml(q.imageUrl)}" alt="${escapeHtml(q.alt||'Imagem')}" loading="lazy" decoding="async">`:desc}`;
  if(q.type==='separator')return '<hr style="border:0;border-top:1px solid var(--border);margin:22px 0">';
  if(q.type==='progress')return `<div class="quiz-progress-wrap"><div class="bar"><span style="width:${progress}%"></span></div></div>`;
  if(q.type==='percentage')return `<div class="result-score">${progress}%</div>`;
  if(q.type==='badge')return `<div class="result-badge">${escapeHtml(q.label||'🏆')}</div>${desc}`;
  if(q.type==='message')return `<p>${escapeHtml(q.label||q.description||'')}</p>`;
  if(q.type==='chart')return '<div class="code-box">Gráfico disponível na área de resultados do painel.</div>';
  if(q.type==='results-list')return '<div class="code-box">Lista de resultados disponível após a conclusão.</div>';
  if(q.type==='container'||q.type==='grid')return `<div>${escapeHtml(q.label||'')}</div>${desc}`;
  if(ACTION_TYPES.has(q.type))return `<button type="button" id="fieldAction" class="btn btn-primary">${escapeHtml(q.label||actionLabel(q))}</button>`;

  const title=`<h2>${escapeHtml(q.label)}${q.required?' *':''}</h2>${desc}`;

  if(q.type==='image-options'){
    return `${title}<div class="option-list image-option-grid">${(q.options||[]).map(o=>`<label class="option image-option-card ${selectedOption(q,o.value)?'selected':''}" data-image-choice="true"><input class="image-option-input" data-field-id="${escapeHtml(q.id)}" type="radio" name="${escapeHtml(q.id)}" value="${escapeHtml(o.value)}" aria-label="${escapeHtml(o.label||'Opção')}" ${selectedOption(q,o.value)?'checked':''}><span class="image-option-media">${o.image?`<img class="image-option-image" src="${escapeHtml(o.image)}" alt="${escapeHtml(o.label||'Opção')}" loading="lazy" decoding="async">`:(o.icon?`<span class="image-option-placeholder">${escapeHtml(o.icon)}</span>`:'<span class="image-option-placeholder">Sem imagem</span>')}</span><small class="image-option-title">${escapeHtml(o.label||'Opção')}</small></label>`).join('')}</div>`;
  }

  if(['radio','checkbox'].includes(q.type)){
    return `${title}<div class="option-list">${(q.options||[]).map(o=>`<label class="option ${selectedOption(q,o.value)?'selected':''}">${o.image?`<img class="option-inline-image" src="${escapeHtml(o.image)}" alt="" loading="lazy" decoding="async">`:''}${o.icon?`<span class="option-icon">${escapeHtml(o.icon)}</span>`:''}<input data-field-id="${escapeHtml(q.id)}" type="${q.type==='checkbox'?'checkbox':'radio'}" name="${escapeHtml(q.id)}" value="${escapeHtml(o.value)}" ${selectedOption(q,o.value)?'checked':''}><span>${escapeHtml(o.label)}</span></label>`).join('')}</div>`;
  }

  if(q.type==='select')return `${title}<div class="quiz-field"><select id="fieldInput"><option value="">Selecione</option>${(q.options||[]).map(o=>`<option value="${escapeHtml(o.value)}" ${answers[q.id]===o.value?'selected':''}>${escapeHtml(o.label)}</option>`).join('')}</select></div>`;
  if(q.type==='textarea')return `${title}<div class="quiz-field"><textarea id="fieldInput" placeholder="${escapeHtml(q.placeholder||'')}">${escapeHtml(answers[q.id]||'')}</textarea></div>`;

  if(['number','date','input','file'].includes(q.type)){
    const isLeadName=q.id==='lead_name'||/nome|name/i.test(String(q.label||''));
    const isPhone=q.id==='lead_whatsapp'||/whatsapp|telefone|celular/i.test(String(q.label||''));
    const isEmail=/e[- ]?mail|email/i.test(`${q.id||''} ${q.label||''} ${q.placeholder||''}`);
    const type=q.type==='input'?(isPhone?'tel':isEmail?'email':'text'):q.type;
    const autocomplete=isLeadName?'name':isPhone?'tel':isEmail?'email':'off';
    const inputmode=isPhone?' inputmode="tel"':'';
    const savedValue=answers[q.id]??q.defaultValue??'';
    if(isPhone){
      const parts=phoneParts(savedValue);
      const options=PHONE_COUNTRIES.map(country=>`<option value="${country.code}" ${country.code===parts.country.code?'selected':''}>${country.flag} +${country.code} · ${country.name}</option>`).join('');
      return `${title}<div class="quiz-field quiz-phone-field"><select id="phoneCountry" class="phone-country" aria-label="País do telefone">${options}</select><input id="fieldInput" data-phone-input="true" name="tel" type="tel" autocomplete="tel-national" inputmode="tel" maxlength="20" value="${escapeHtml(formatNationalPhone(parts.national,parts.country.code))}" placeholder="${escapeHtml(q.placeholder||'Telefone com DDD')}"></div><small class="phone-field-hint">Selecione o país e informe um número válido.</small>`;
    }
    const value=q.type==='file'?'':` value="${escapeHtml(savedValue)}"`;
    const name=isEmail?'email':isLeadName?'name':'response';
    return `${title}<div class="quiz-field"><input id="fieldInput" name="${name}" type="${type}" autocomplete="${autocomplete}"${inputmode}${isEmail?' inputmode="email" autocapitalize="none" spellcheck="false"':''}${q.type==='file'?' accept="*/*"':''}${value} placeholder="${escapeHtml(q.placeholder||'')}"></div>`;
  }

  if(q.type==='rating')return `${title}<div class="rating">${Array.from({length:(q.max||5)},(_,i)=>i+1).map(n=>`<button type="button" data-rating="${n}" class="${Number(answers[q.id])>=n?'active':''}">★</button>`).join('')}</div>`;
  if(q.type==='slider')return `${title}<div class="range-value" id="rangeValue">${answers[q.id]??q.defaultValue??q.min??0}</div><input id="fieldInput" type="range" min="${q.min??0}" max="${q.max??100}" step="${q.step??1}" value="${answers[q.id]??q.defaultValue??q.min??0}" style="width:100%">`;

  return title;
}

function actionLabel(q){
  const type=actionKind(q);
  if(type==='back')return 'Voltar';
  if(type==='submit'||type==='result')return 'Ver resultado';
  if(type==='retry')return 'Refazer';
  return 'Continuar';
}

function selectedOption(q,value){
  const answer=answers[q.id];
  return Array.isArray(answer)?answer.includes(value):answer===value;
}

function markSelectedOptions(){
  root.querySelectorAll('.option').forEach(label=>label.classList.toggle('selected',Boolean(label.querySelector('input')?.checked)));
}

function bindField(q){
  if(q.type==='image-options'){
    root.querySelectorAll('[data-image-choice]').forEach(card=>{
      card.onclick=event=>{
        event.preventDefault();
        if(busy||finished)return;
        const input=card.querySelector('input');
        if(!input)return;
        optionInputs(q).forEach(other=>{other.checked=false;});
        input.checked=true;
        syncCurrentField(q,{persist:true});
        markSelectedOptions();
        clearFieldError();
        if(q.autoAdvance===true)void advance(q);
      };
    });
    return;
  }

  if(['radio','checkbox'].includes(q.type)){
    optionInputs(q).forEach(input=>{
      input.onchange=()=>{
        syncCurrentField(q,{persist:true});
        markSelectedOptions();
        clearFieldError();
      };
    });
    return;
  }

  const input=document.getElementById('fieldInput');
  if(input){
    const sync=()=>{
      if(input.dataset.phoneInput==='true'){
        const country=document.getElementById('phoneCountry')?.value||'55';
        input.value=formatNationalPhone(input.value,country);
      }
      syncCurrentField(q,{persist:true});
      const valueLabel=document.getElementById('rangeValue');
      if(valueLabel)valueLabel.textContent=input.value;
      clearFieldError();
    };
    input.oninput=sync;
    input.onchange=sync;
    input.onblur=sync;
    input.onkeydown=event=>{
      if(event.key==='Enter'&&q.type!=='textarea'&&q.type!=='file'){
        event.preventDefault();
        void advance(q);
      }
    };
    const country=document.getElementById('phoneCountry');
    if(country)country.onchange=()=>{
      input.value=formatNationalPhone(input.value,country.value);
      sync();
      input.focus();
    };
  }

  root.querySelectorAll('[data-rating]').forEach(button=>{
    button.onclick=()=>{
      answers[q.id]=Number(button.dataset.rating);
      root.querySelectorAll('[data-rating]').forEach(item=>item.classList.toggle('active',Number(item.dataset.rating)<=answers[q.id]));
      clearFieldError();
      autoSave();
    };
  });
}

function autoSave(){
  if(!quiz.settings?.autoSave)return;
  try{
    localStorage.setItem(`qp_progress_${quiz.id}`,JSON.stringify({answers,currentId,history,consentChecked,attemptId,attemptCreatedAt,startedAt:new Date(startedAt).toISOString(),updatedAt:new Date().toISOString()}));
  }catch(error){console.warn('Progresso local não pôde ser salvo.',error);}
}

function restoreProgress(){
  if(!quiz.settings?.autoSave)return;
  try{
    const saved=JSON.parse(localStorage.getItem(`qp_progress_${quiz.id}`)||'null');
    if(saved?.answers&&typeof saved.answers==='object')answers=saved.answers;
    if(saved?.currentId)currentId=saved.currentId;
    if(Array.isArray(saved?.history))history=saved.history;
    consentChecked=saved?.consentChecked===true;
    if(saved?.attemptId)attemptId=saved.attemptId;
    if(saved?.attemptCreatedAt)attemptCreatedAt=saved.attemptCreatedAt;
    if(saved?.startedAt&&!Number.isNaN(new Date(saved.startedAt).getTime()))startedAt=new Date(saved.startedAt).getTime();
  }catch{}
}

function clearProgress(){
  try{localStorage.removeItem(`qp_progress_${quiz.id}`);}catch{}
}

function startTimer(){
  if(timer)clearInterval(timer);
  const mins=Number(quiz.settings?.timeLimit)||0;
  if(!mins)return;
  const end=Date.now()+mins*60*1000;
  timer=setInterval(()=>{
    if(Date.now()>=end){
      clearInterval(timer);
      timer=null;
      busy=false;
      finished=true;
      root.innerHTML=wrap(`<div class="quiz-question"><h1>Tempo esgotado</h1><p>${escapeHtml(quiz.messages?.timeout||'O tempo terminou.')}</p></div>`);
    }
  },1000);
}

function scoreQuiz(){
  let score=0;
  for(const q of quiz.questions||[]){
    if(!OPTION_TYPES.has(q.type))continue;
    const value=answers[q.id];
    const selected=Array.isArray(value)?value:[value];
    for(const item of selected){
      const option=(q.options||[]).find(o=>o.value===item);
      score+=Number(option?.weight)||0;
    }
  }
  return Math.max(0,Math.min(100,score));
}

function setProcessing(active,label='Enviando...'){
  busy=active;
  const buttons=[...root.querySelectorAll('button')];
  buttons.forEach(button=>{
    if(active){
      if(!button.dataset.originalText)button.dataset.originalText=button.textContent||'';
      button.disabled=true;
    }else{
      button.disabled=false;
      if(button.dataset.originalText){button.textContent=button.dataset.originalText;delete button.dataset.originalText;}
    }
  });
  if(active){
    const primary=document.getElementById('nextBtn')||document.getElementById('fieldAction');
    if(primary)primary.textContent=label;
  }
}

async function finish({requireConsent=true}={}){
  if(finished||busy)return;

  const flow=getFlow();
  const current=flow.find(q=>q.id===currentId);
  if(current&&RESPONSE_TYPES.has(current.type)&&!validateCurrent(current))return;
  if(requireConsent&&!requireLegalConsent())return;

  setProcessing(true,'Salvando...');
  if(timer){clearInterval(timer);timer=null;}

  const score=scoreQuiz();
  if(!attemptId)await beginAttempt();
  else if(attemptSavePromise)await attemptSavePromise;
  const completedAt=new Date().toISOString();
  const submission={
    id:`${attemptId}_${uid('complete')}`,
    attemptId,
    attemptStatus:'completed',
    trackingVersion:2,
    answers:{...answers},
    score,
    completed:true,
    startedAt:new Date(startedAt).toISOString(),
    createdAt:attemptCreatedAt||completedAt,
    completedAt,
    updatedAt:completedAt,
    durationSeconds:Math.max(0,Math.round((Date.now()-startedAt)/1000)),
    userAgent:navigator.userAgent
  };

  let saved=false;
  try{
    await saveSubmission(quiz,submission);
    saved=true;
  }catch(error){
    console.error('Falha ao salvar resposta.',error);
    toast('O resultado foi calculado, mas a resposta não pôde ser salva.','error');
  }

  finished=true;
  setProcessing(false);

  if(saved){
    try{localStorage.setItem(attemptsKey,String(Number(localStorage.getItem(attemptsKey)||0)+1));}catch{}
  }
  clearProgress();
  trackSafe('quiz_complete',{quiz_id:quiz.id,score});
  void sendWebhook(submission);
  renderResult(score);
}

async function sendWebhook(submission){
  const integrations=quiz.integrations||{};
  if(!integrations.webhookUrl)return;
  try{
    await fetch(integrations.webhookUrl,{
      method:integrations.webhookMethod||'POST',
      headers:{'Content-Type':'application/json',...safeJson(typeof integrations.webhookHeaders==='string'?integrations.webhookHeaders:JSON.stringify(integrations.webhookHeaders||{}),{})},
      body:JSON.stringify({quiz:{id:quiz.id,title:quiz.title,slug:quiz.slug},submission})
    });
  }catch(error){console.warn('Webhook não enviado.',error);}
}

function renderResult(score){
  const result=(quiz.results||[]).find(item=>score>=Number(item.minScore||0)&&score<=Number(item.maxScore??100))||quiz.results?.[0]||{title:'Resultado',message:quiz.messages?.completion||'Concluído',badge:'🏆',action:{}};
  const percentage=quiz.resultSettings?.showPercentage!==false?`<div class="result-score">${score}%</div>`:'';
  const canRetry=!maxAttemptsReached();

  root.innerHTML=wrap(`<div class="result-hero"><div class="result-badge">${escapeHtml(result.badge||'🏆')}</div><span class="eyebrow">RESULTADO</span><h1>${escapeHtml(result.title||'Resultado')}</h1>${percentage}<p>${escapeHtml(result.message||quiz.messages?.completion||'Quiz concluído.')}</p><div class="result-actions">${actionButton(result.action)}${canRetry?'<button type="button" class="btn btn-secondary" id="retryBtn">Refazer</button>':''}</div></div>`);

  const retry=document.getElementById('retryBtn');
  const resultAction=document.getElementById('resultAction');
  if(retry)retry.onclick=retryQuiz;
  if(resultAction)resultAction.onclick=()=>handleResultAction(result.action,score);

  if(quiz.resultSettings?.redirectUrl)setTimeout(()=>{location.href=quiz.resultSettings.redirectUrl;},3000);
}

function actionButton(action={}){
  if(!action?.label)return '';
  return `<button type="button" class="btn btn-primary" id="resultAction">${escapeHtml(action.label)}</button>`;
}

function handleResultAction(action,score){
  const fallbackNumber=quiz.integrations?.whatsappNumber||'';
  const fallbackMessage=quiz.integrations?.whatsappMessage||`Olá! Concluí o quiz ${quiz.title} com score ${score}%.`;

  if(action.type==='whatsapp'){
    const number=String(action.value||fallbackNumber).replace(/\D/g,'');
    if(number)window.open(`https://wa.me/${number}?text=${encodeURIComponent(fallbackMessage)}`,'_blank','noopener');
    else toast('Número de WhatsApp não configurado.','error');
  }else if(action.type==='email'){
    const email=action.value||quiz.integrations?.emailTo||'';
    if(email)location.href=`mailto:${email}?subject=${encodeURIComponent(quiz.integrations?.emailSubject||'Resultado do quiz')}`;
    else toast('E-mail não configurado.','error');
  }else if(action.type==='link'&&action.value){
    window.open(action.value,'_blank','noopener');
  }
}

function retryQuiz(){
  if(busy)return;
  if(maxAttemptsReached()){renderAttemptLimit();return;}
  answers={};
  currentId=null;
  history=[];
  consentChecked=false;
  finished=false;
  busy=false;
  startedAt=Date.now();
  attemptId=null;
  attemptCreatedAt=null;
  attemptSavePromise=null;
  clearProgress();
  void beginAttempt();
  if(quiz.settings?.showWelcome===false)startQuiz();
  else renderWelcome();
}

function maxAttemptsReached(){
  const max=Number(quiz.settings?.maxAttempts)||0;
  if(!max)return false;
  return Number(localStorage.getItem(attemptsKey)||0)>=max;
}

function renderAttemptLimit(){
  if(timer){clearInterval(timer);timer=null;}
  busy=false;
  finished=true;
  root.innerHTML=wrap(`<div class="quiz-question"><h1>Limite atingido</h1><p>${escapeHtml(quiz.messages?.attemptLimit||'Você atingiu o limite de tentativas.')}</p></div>`);
}
