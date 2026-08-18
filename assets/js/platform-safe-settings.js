const KEY='quizplatform_safe_settings_v1';

const DEFAULTS={
  legal:{
    privacyUrl:'',
    termsUrl:'',
    consentRequired:true,
    consentText:'Li e concordo com a Política de Privacidade e os Termos de Uso.'
  },
  quizDomains:{},
  profiles:[{
    id:'owner',
    name:'Wakilon Gestor',
    email:'wakilongestor@gmail.com',
    role:'Administrador',
    photoData:'',
    panelLogoData:''
  }],
  activeProfileId:'owner'
};

function clone(v){return JSON.parse(JSON.stringify(v));}
function safeUrl(value){
  const v=String(value||'').trim();
  if(!v)return '';
  try{const u=new URL(v);if(!['http:','https:'].includes(u.protocol))throw new Error();return u.href;}
  catch{throw new Error(`URL inválida: ${v}. Use um endereço começando com https://`);}
}
function cleanProfile(p={}){
  return {
    id:String(p.id||`profile_${Date.now().toString(36)}`).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,60),
    name:String(p.name||'Usuário').trim().slice(0,80),
    email:String(p.email||'').trim().toLowerCase().slice(0,120),
    role:String(p.role||'Editor').trim().slice(0,40),
    photoData:String(p.photoData||'').startsWith('data:image/')?String(p.photoData):'',
    panelLogoData:String(p.panelLogoData||'').startsWith('data:image/')?String(p.panelLogoData):''
  };
}
function clean(input={}){
  const out=clone(DEFAULTS);
  const legal=input.legal||{};
  out.legal={
    privacyUrl:legal.privacyUrl?safeUrl(legal.privacyUrl):'',
    termsUrl:legal.termsUrl?safeUrl(legal.termsUrl):'',
    consentRequired:legal.consentRequired!==false,
    consentText:String(legal.consentText||DEFAULTS.legal.consentText).trim().slice(0,280)
  };
  out.quizDomains={};
  for(const [quizId,domain] of Object.entries(input.quizDomains||{})){
    if(!quizId)continue;
    try{out.quizDomains[quizId]=domain?safeUrl(domain):'';}catch{}
  }
  const profiles=Array.isArray(input.profiles)?input.profiles.map(cleanProfile).slice(0,25):[];
  out.profiles=profiles.length?profiles:clone(DEFAULTS.profiles);
  out.activeProfileId=out.profiles.some(p=>p.id===input.activeProfileId)?input.activeProfileId:out.profiles[0].id;
  return out;
}
export function getSafeSettings(){
  try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'));}
  catch{return clone(DEFAULTS);}
}
function write(next){const cleaned=clean(next);localStorage.setItem(KEY,JSON.stringify(cleaned));return cleaned;}
export function saveLegal(patch={}){const s=getSafeSettings();s.legal={...s.legal,...patch};return write(s).legal;}
export function getLegal(){return getSafeSettings().legal;}
export function getQuizDomain(quizId){return getSafeSettings().quizDomains?.[quizId]||'';}
export function setQuizDomain(quizId,domain){const s=getSafeSettings();if(!quizId)throw new Error('Salve o quiz antes de definir um domínio.');s.quizDomains[quizId]=domain?safeUrl(domain):'';write(s);return s.quizDomains[quizId];}
export function listProfiles(){return getSafeSettings().profiles;}
export function getActiveProfile(){const s=getSafeSettings();return s.profiles.find(p=>p.id===s.activeProfileId)||s.profiles[0];}
export function saveProfile(profile){const s=getSafeSettings();const next=cleanProfile(profile);const i=s.profiles.findIndex(p=>p.id===next.id);if(i>=0)s.profiles[i]=next;else s.profiles.push(next);write(s);return next;}
export function removeProfile(id){if(id==='owner')throw new Error('O perfil administrador principal não pode ser removido.');const s=getSafeSettings();s.profiles=s.profiles.filter(p=>p.id!==id);if(s.activeProfileId===id)s.activeProfileId='owner';return write(s);}
export function setActiveProfile(id){const s=getSafeSettings();if(!s.profiles.some(p=>p.id===id))throw new Error('Perfil não encontrado.');s.activeProfileId=id;return write(s);}
export function exportSafeSettings(){return JSON.stringify({type:'quizplatform-safe-settings',version:1,data:getSafeSettings()},null,2);}
export function importSafeSettings(text){const parsed=JSON.parse(text);if(parsed?.type!=='quizplatform-safe-settings'||!parsed?.data)throw new Error('Arquivo de configurações inválido.');return write(parsed.data);}
