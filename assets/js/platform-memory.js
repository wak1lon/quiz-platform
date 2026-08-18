const MEMORY_KEY='quizplatform_visual_memory_v1';
const HISTORY_KEY='quizplatform_visual_history_v1';
const MAX_HISTORY=10;

export const DEFAULT_PLATFORM_MEMORY={
  version:1,
  platformName:'QUIZ ADV',
  primaryColor:'#1E3A8A',
  secondaryColor:'#3B82F6',
  backgroundColor:'#F3F4F6',
  surfaceColor:'#FFFFFF',
  textColor:'#1F2937',
  mutedColor:'#64748B',
  borderColor:'#E2E8F0',
  accentColor:'#F59E0B',
  successColor:'#10B981',
  errorColor:'#EF4444',
  fontFamily:'Poppins',
  logoData:'',
  faviconData:'',
  radius:14,
  shadowStrength:8,
  updatedAt:null
};

const SAFE_KEYS=new Set(Object.keys(DEFAULT_PLATFORM_MEMORY));
function clean(input={}){
  const out={...DEFAULT_PLATFORM_MEMORY};
  for(const key of SAFE_KEYS){if(Object.prototype.hasOwnProperty.call(input,key))out[key]=input[key];}
  if(!out.platformName||out.platformName==='QuizPlatform'||out.platformName==='QUIZPLATFORM')out.platformName='QUIZ ADV';
  out.version=1;out.radius=Math.max(0,Math.min(40,Number(out.radius)||14));out.shadowStrength=Math.max(0,Math.min(30,Number(out.shadowStrength)||8));out.updatedAt=input.updatedAt||null;return out;
}
export function getPlatformMemory(){try{const raw=localStorage.getItem(MEMORY_KEY);const next=raw?clean(JSON.parse(raw)):clean();if(raw&&JSON.parse(raw).platformName!==next.platformName)localStorage.setItem(MEMORY_KEY,JSON.stringify(next));return next;}catch{return clean();}}
export function getPlatformHistory(){try{const raw=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(raw)?raw.map(clean).slice(0,MAX_HISTORY):[];}catch{return [];}}
function writeHistory(snapshot){const history=getPlatformHistory();history.unshift(clean(snapshot));localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,MAX_HISTORY)));}
export function savePlatformMemory(patch={}, {keepHistory=true}={}){const current=getPlatformMemory();if(keepHistory)writeHistory(current);const next=clean({...current,...patch,updatedAt:new Date().toISOString()});localStorage.setItem(MEMORY_KEY,JSON.stringify(next));applyPlatformMemory(next);return next;}
export function restorePlatformMemory(index=0){const history=getPlatformHistory();const snapshot=history[index];if(!snapshot)return null;const current=getPlatformMemory();const remaining=history.filter((_,i)=>i!==index);remaining.unshift(current);localStorage.setItem(HISTORY_KEY,JSON.stringify(remaining.slice(0,MAX_HISTORY)));const restored=clean({...snapshot,updatedAt:new Date().toISOString()});localStorage.setItem(MEMORY_KEY,JSON.stringify(restored));applyPlatformMemory(restored);return restored;}
export function resetPlatformMemory(){writeHistory(getPlatformMemory());const next=clean({...DEFAULT_PLATFORM_MEMORY,updatedAt:new Date().toISOString()});localStorage.setItem(MEMORY_KEY,JSON.stringify(next));applyPlatformMemory(next);return next;}
export function exportPlatformMemory(){return JSON.stringify({type:'quizplatform-visual-memory',version:1,data:getPlatformMemory()},null,2);}
export function importPlatformMemory(text){const parsed=JSON.parse(text);if(parsed?.type!=='quizplatform-visual-memory'||!parsed?.data)throw new Error('Backup visual inválido.');return savePlatformMemory(parsed.data);}
export function fileToDataUrl(file,maxBytes=1200000){return new Promise((resolve,reject)=>{if(!file){resolve('');return;}if(file.size>maxBytes){reject(new Error('Arquivo muito grande. Use até 1,2 MB.'));return;}const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('Falha ao ler arquivo.'));reader.readAsDataURL(file);});}
export function applyPlatformMemory(memory=getPlatformMemory()){
  const m=clean(memory),root=document.documentElement;root.style.setProperty('--primary',m.primaryColor);root.style.setProperty('--secondary',m.secondaryColor);root.style.setProperty('--background',m.backgroundColor);root.style.setProperty('--surface',m.surfaceColor);root.style.setProperty('--text',m.textColor);root.style.setProperty('--muted',m.mutedColor);root.style.setProperty('--border',m.borderColor);root.style.setProperty('--accent',m.accentColor);root.style.setProperty('--success',m.successColor);root.style.setProperty('--danger',m.errorColor);root.style.setProperty('--radius',`${m.radius}px`);root.style.setProperty('--font',`'${String(m.fontFamily).replace(/'/g,'')}',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`);root.style.setProperty('--shadow',`0 14px 38px rgba(15,23,42,${Math.min(.30,Math.max(0,Number(m.shadowStrength)||0)/100)})`);document.title=document.title.replace(/^.*?(?= \| )/,m.platformName||'QUIZ ADV');document.querySelectorAll('[data-platform-name]').forEach(el=>el.textContent=m.platformName||'QUIZ ADV');document.querySelectorAll('[data-platform-logo]').forEach(el=>{if(m.logoData){el.src=m.logoData;el.hidden=false;}else{el.hidden=true;}});if(m.faviconData){let link=document.querySelector('link[rel="icon"]');if(!link){link=document.createElement('link');link.rel='icon';document.head.appendChild(link);}link.href=m.faviconData;}return m;
}
