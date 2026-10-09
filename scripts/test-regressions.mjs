import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {performance} from 'node:perf_hooks';
const root=new URL('../',import.meta.url);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fixture={
  id:'fixture',slug:'test',status:'published',title:'Quiz de teste',category:'Teste',
  design:{primaryColor:'#882244',secondaryColor:'#224488',backgroundColor:'#fefefe',fontFamily:'Arial',buttonBackground:'#882244',buttonText:'#fff',cardRadius:23,cardPadding:27},
  settings:{showWelcome:true,showProgress:true,showQuestionNumber:true,allowBack:true,autoSave:true,maxAttempts:0},
  legal:{consentRequired:true,consentText:'Concordo',privacyUrl:'https://example.com/privacy'},
  integrations:{},messages:{},resultSettings:{showPercentage:true},
  questions:[
    {id:'choice',type:'radio',label:'Escolha',required:true,options:[{id:'yes',label:'Sim',value:'yes',weight:40},{id:'no',label:'Não',value:'no',weight:0}]},
    {id:'conditional',type:'input',label:'Complemento',required:true,condition:{fieldId:'choice',operator:'=',value:'yes',effect:'show'}},
    {id:'image',type:'image-options',label:'Imagem',required:true,options:[{id:'a',label:'Imagem A',value:'A',weight:60,image:'data:image/png;base64,a'}]}
  ],
  results:[{minScore:0,maxScore:100,title:'Resultado final',message:'Obrigado',action:{}}],
  submissions:[],statistics:{}
};
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
async function environment(page,{trackingDelay=0,restFailure=false,base=root,auth=true}={}){
  const html=await readFile(new URL(page,base),'utf8');
  const {window,document}=parseHTML(html);
  const saved=[],events=[],remote=new Map();
  window.Element.prototype.getClientRects=()=>[{}];
  const styleDescriptor=Object.getOwnPropertyDescriptor(window.Element.prototype,'style');
  Object.defineProperty(window.Element.prototype,'style',{...styleDescriptor,set(value){this.setAttribute('style',value);}});
  const local=storage(),session=storage();
  const location=new URL(`https://fixture.invalid/${page.replace('index.html','')}?slug=test`);
  const cssEscape=s=>String(s).replace(/[^\w-]/g,'\\$&');
  // DOM-only harness, not a browser: layout/focus are intentionally excluded.
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value||this.querySelector('option')?.value||'';},set(v){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.value===String(v));}});
  const firebase={db:{},collection:(_db,...path)=>path.join('/'),doc:(_db,...path)=>path.join('/'),where:()=>{},limit:()=>{},query:path=>path,
    getDocs:async path=>({docs:path==='quizzes'?[{id:fixture.id,data:()=>structuredClone(remote.get(fixture.id)||fixture)}]:[]}),
    setDoc:async(path,data)=>remote.set(path.split('/').at(-1),structuredClone(data)),
    getDoc:async path=>({exists:()=>remote.has(path.split('/').at(-1)),data:()=>remote.get(path.split('/').at(-1))}),deleteDoc:async()=>{}};
  const sandbox={document,window:null,location,localStorage:local,sessionStorage:session,URL,URLSearchParams,Blob,AbortController,AbortSignal,TextEncoder,performance,
    console:{log(){},info(){},warn(){},error(){}},setTimeout,clearTimeout,setInterval,clearInterval,
    requestAnimationFrame:fn=>setTimeout(fn,0),navigator:{userAgent:'DOM regression harness'},CSS:{escape:cssEscape},
    Event:window.Event,MutationObserver:window.MutationObserver,confirm:()=>true,
    matchMedia:()=>({matches:false,addEventListener(){}}),
    fetch:async(url,options={})=>{
      if(restFailure)throw new Error('Network unavailable');
      if(String(url).includes(':runQuery'))return {ok:true,json:async()=>[{document:{name:'projects/p/databases/(default)/documents/quizzes/fixture',fields:encodeFields(fixture)}}]};
      if(options.method==='POST'){saved.push(JSON.parse(options.body));return {ok:true,json:async()=>({})};}
      throw new Error('Unexpected fetch '+url);
    }};
  sandbox.window=sandbox;sandbox.addEventListener=()=>{};sandbox.open=()=>{};
  const context=vm.createContext(sandbox),cache=new Map();
  function synthetic(name,values){const mod=new vm.SyntheticModule(Object.keys(values),function(){for(const [key,value]of Object.entries(values))this.setExport(key,value);},{context,identifier:name});return mod;}
  async function load(url){
    const key=String(url);if(cache.has(key))return cache.get(key);
    let mod;
    if(key.endsWith('/firebase.js'))mod=synthetic(key,{firebaseEnabled:()=>true,getFirebase:async()=>{if(restFailure)throw new Error('SDK unavailable');return firebase;}});
    else if(key.endsWith('/auth.js'))mod=synthetic(key,{ADMIN_EMAIL:'test@example.com',waitForAuth:async()=>auth?{email:'test@example.com'}:null,currentUser:async()=>null,loginEmail:async()=>{},loginGoogle:async()=>{},logout:async()=>{}});
    else if(key.endsWith('/tracking.js')){
      await sleep(trackingDelay);mod=synthetic(key,{initTracking:()=>events.push(['init']),track:(...args)=>events.push(args)});
    }else{
      let source=await readFile(url,'utf8');
      if(key.endsWith('/admin-bundle.js'))source+='\nexport {navigate};';
      if(key.endsWith('/quiz.js'))source+='\nexport {validateCurrent,advance,getFlow};';
      // Templates are real local files, and their cache-busting queries are irrelevant to the filesystem.
      mod=new vm.SourceTextModule(source,{context,identifier:key,initializeImportMeta:meta=>meta.url=key,
        importModuleDynamically:async(specifier,ref)=>{const target=await load(resolve(specifier,ref.identifier));if(target.status==='unlinked')await target.link(linker);if(target.status==='linked')await target.evaluate();return target;}});
    }
    cache.set(key,mod);return mod;
  }
  function resolve(specifier,parent){
    if(String(specifier).startsWith('https://fixture.invalid/assets/js/'))return new URL(String(specifier).split('/assets/js/')[1].split('?')[0],new URL('assets/js/',base));
    const result=new URL(specifier,parent);result.search='';return result;
  }
  const linker=(specifier,ref)=>load(resolve(specifier,ref.identifier));
  async function run(path){const mod=await load(new URL(path,base));if(mod.status==='unlinked')await mod.link(linker);await mod.evaluate();return mod;}
  function evaluate(code){return vm.runInContext(code,context);}
  return {document,local,session,saved,events,remote,run,evaluate};
}
function encodeValue(v){if(v===null)return {nullValue:null};if(Array.isArray(v))return {arrayValue:{values:v.map(encodeValue)}};if(typeof v==='object')return {mapValue:{fields:encodeFields(v)}};if(typeof v==='boolean')return {booleanValue:v};if(typeof v==='number')return {doubleValue:v};return {stringValue:String(v)};}
function encodeFields(v){return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encodeValue(x)]));}

const uiEnv=await environment('admin/index.html');
await uiEnv.run('assets/js/admin-ui.js');
await sleep(20);
assert.equal(uiEnv.document.querySelectorAll('#sideNav svg').length,7,'Local navigation icons');
assert.equal(uiEnv.document.querySelector('#sideNav .active').getAttribute('aria-current'),'page');
uiEnv.document.getElementById('appContent').innerHTML='<div class="field"><label>Nome</label><input></div><div class="field-row"><span>Ativo</span><label class="toggle"><input type="checkbox"></label></div>';
await sleep(20);
assert.equal(uiEnv.document.querySelector('.field input').getAttribute('aria-label'),'Nome');
assert.equal(uiEnv.document.querySelector('.toggle input').getAttribute('aria-label'),'Ativo');
uiEnv.document.getElementById('modalRoot').innerHTML='<div class="modal"><div class="modal-head"><strong>Teste</strong><button data-close>Fechar</button></div></div>';
await sleep(20);
assert.equal(uiEnv.document.querySelector('.modal').getAttribute('aria-modal'),'true');
assert.equal(uiEnv.document.querySelector('.app-shell').inert,true);
uiEnv.document.getElementById('modalRoot').innerHTML='';
await sleep(20);
assert(!uiEnv.document.querySelector('.app-shell').inert);

const publicEnv=await environment('quiz/index.html',{trackingDelay:600});
const start=performance.now();const runtime=await publicEnv.run('assets/js/quiz.js');
const firstScreen=performance.now()-start;
assert(publicEnv.document.getElementById('startQuiz'),'Welcome renders before delayed tracking');
assert(firstScreen<550,'Tracking must not gate the welcome screen');
assert.equal(publicEnv.document.documentElement.style.getPropertyValue('--primary'),fixture.design.primaryColor);
assert(publicEnv.document.querySelector('.quiz-card-public').getAttribute('style').includes('23px'));
publicEnv.document.getElementById('startQuiz').onclick();
await publicEnv.document.getElementById('nextBtn').onclick();

assert(publicEnv.document.getElementById('fieldRequiredError'),'Required selection validation retained');
const yes=publicEnv.document.querySelector('input[value=yes]');yes.checked=true;yes.onchange();
await publicEnv.document.getElementById('nextBtn').onclick();
assert(publicEnv.document.getElementById('fieldInput'),'Conditional question is visible');
const input=publicEnv.document.getElementById('fieldInput');input.value='Detalhe';input.oninput();
await publicEnv.document.getElementById('nextBtn').onclick();
assert(publicEnv.document.querySelector('[data-image-choice]'));
publicEnv.document.querySelector('[data-image-choice]').onclick({preventDefault(){}});
publicEnv.document.getElementById('backBtn').onclick();
assert.equal(publicEnv.document.getElementById('fieldInput').value,'Detalhe','Back navigation preserves answer');
await publicEnv.document.getElementById('nextBtn').onclick();
await publicEnv.document.getElementById('nextBtn').onclick();
assert(publicEnv.document.getElementById('qpLegalError'),'Consent required');
const consent=publicEnv.document.getElementById('qpLegalConsentInput');consent.checked=true;consent.onchange();
await publicEnv.document.getElementById('nextBtn').onclick();
await sleep(700);
assert(publicEnv.document.body.textContent.includes('Resultado final'));
assert(publicEnv.document.body.textContent.includes('100%'),'Score remains 100');
assert.equal(publicEnv.saved.length,2,'Start and completion still submitted');
assert.deepEqual(publicEnv.events.filter(e=>e[0]!=='init').map(e=>e[0]),['quiz_view','quiz_start','quiz_answer','quiz_answer','quiz_answer','quiz_answer','quiz_answer','quiz_complete']);

const failure=await environment('quiz/index.html',{restFailure:true});
failure.local.setItem('quizplatform_state_v1',JSON.stringify({settings:{},quizzes:[fixture]}));
const publicRepo=await failure.run('assets/js/public-repository.js');
await assert.rejects(publicRepo.namespace.getQuizBySlug('test'),/confirmar a versão/,'No stale local quiz on network failure');

const admin=await environment('admin/index.html');
const adminModule=await admin.run('assets/js/admin-bundle.js');
assert(admin.document.querySelector('[data-metric-period]'),'Period filters on first dashboard render');
assert.equal(admin.document.querySelectorAll('.stat-card').length,5);
const clickView=async view=>{await adminModule.namespace.navigate(view);await sleep(20);};
await clickView('quizzes');
assert(admin.document.querySelector('[data-edit=fixture]'));
await clickView('templates');assert(admin.document.querySelector('[data-template]'));
admin.document.querySelector('[data-template]').onclick();await sleep(20);
assert(admin.document.querySelector('.canvas-drop'));
const count=admin.document.querySelectorAll('.question-block').length;
admin.document.querySelector('[data-palette-type=input]').dispatchEvent(new admin.document.defaultView.Event('click'));
assert.equal(admin.document.querySelectorAll('.question-block').length,count+1,'Palette click adds field');
// Reorder through the original drag/drop handler.
const blocks=[...admin.document.querySelectorAll('.question-block')];
const moving=blocks.at(-1).dataset.fieldId,target=blocks[0].dataset.fieldId;
const drop=new admin.document.defaultView.Event('drop',{bubbles:true,cancelable:true});
drop.dataTransfer={getData:type=>type==='application/x-field'?moving:''};blocks[0].dispatchEvent(drop);
assert.equal(admin.document.querySelector('.question-block').dataset.fieldId,moving,'Drag reorder retained');
await admin.document.getElementById('saveDraft').onclick();
assert(admin.remote.size>0,'Save uses existing repository payload');
await admin.document.getElementById('publishQuiz').onclick();
assert(admin.document.querySelector('.publish-row'),'Publication confirmation opens link dialog');
admin.document.querySelector('[data-close]').onclick();
for(const tab of ['config','design','integrations','results','questions']){
  admin.document.querySelector(`[data-editor-tab=${tab}]`).onclick();
  assert(admin.document.getElementById('editorBody').children.length,`${tab} tab renders`);
}
admin.document.getElementById('previewDraft').onclick();
assert(admin.document.querySelector('iframe'),'Draft preview opens');
assert(admin.session.getItem('qp_preview_draft'));
admin.document.querySelector('[data-close-preview]').onclick();
for(const view of ['results','settings','integrations']){await clickView(view);assert(admin.document.getElementById('appContent').children.length);}

// Structural baseline comparison: same DOM harness, delayed tracking, original source.
const baselineUrl=process.env.QUIZ_BASELINE?new URL(process.env.QUIZ_BASELINE):null;
let before=null;
if(baselineUrl){const old=await environment('quiz/index.html',{trackingDelay:600,base:baselineUrl});const t=performance.now();await old.run('assets/js/quiz.js');before=Math.round(performance.now()-t);}
console.log(JSON.stringify({passed:true,publicFirstScreenMs:Math.round(firstScreen),baselineFirstScreenMs:before,simulatedTrackingDelayMs:600,tests:'DOM regressions: first render, required fields, conditions, back, image choice, consent, score, start/completion REST, tracking order, stale-data rejection, dashboard periods, templates, editor tabs, palette, drag reorder, save, publish confirmation, preview, settings, integrations. Real browser and Firebase Authentication not covered.'},null,2));
