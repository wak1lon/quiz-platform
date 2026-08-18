const KEY='quizadv_meta_tracking_v1';

const DEFAULTS={
  enabled:false,
  pixelId:'',
  capiEndpoint:'',
  testEventCode:'',
  trackQuizView:true,
  trackQuizStart:true,
  trackQuizAnswer:false,
  trackQuizComplete:true
};

function safeEndpoint(value){
  const v=String(value||'').trim();
  if(!v)return '';
  try{const u=new URL(v);if(u.protocol!=='https:')throw new Error();return u.href;}
  catch{throw new Error('Endpoint inválido. Use uma URL HTTPS do seu servidor/proxy seguro para a Meta Conversions API.');}
}
function clean(input={}){
  return {
    enabled:input.enabled===true,
    pixelId:/^\d+$/.test(String(input.pixelId||'').trim())?String(input.pixelId).trim():'',
    capiEndpoint:input.capiEndpoint?safeEndpoint(input.capiEndpoint):'',
    testEventCode:String(input.testEventCode||'').trim().slice(0,120),
    trackQuizView:input.trackQuizView!==false,
    trackQuizStart:input.trackQuizStart!==false,
    trackQuizAnswer:input.trackQuizAnswer===true,
    trackQuizComplete:input.trackQuizComplete!==false
  };
}
export function getMetaTrackingSettings(){
  try{return clean({...DEFAULTS,...JSON.parse(localStorage.getItem(KEY)||'{}')});}
  catch{return {...DEFAULTS};}
}
export function saveMetaTrackingSettings(patch={}){
  const next=clean({...getMetaTrackingSettings(),...patch});
  localStorage.setItem(KEY,JSON.stringify(next));
  return next;
}
export function shouldSendMetaEvent(event){
  const s=getMetaTrackingSettings();
  if(!s.enabled||!s.capiEndpoint)return false;
  const map={quiz_view:s.trackQuizView,quiz_start:s.trackQuizStart,quiz_answer:s.trackQuizAnswer,quiz_complete:s.trackQuizComplete};
  return map[event]===true;
}
export async function testMetaConnection(){
  const s=getMetaTrackingSettings();
  if(!s.pixelId)throw new Error('Informe o Pixel ID da Meta.');
  if(!s.capiEndpoint)throw new Error('Informe o endpoint HTTPS seguro da Conversions API.');
  const res=await fetch(s.capiEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'meta',mode:'connection_test',pixel_id:s.pixelId,test_event_code:s.testEventCode||undefined,event_time:Math.floor(Date.now()/1000),event_source_url:location.href,action_source:'website'})});
  if(!res.ok)throw new Error(`O endpoint respondeu HTTP ${res.status}. Confira a URL, CORS e a configuração server-side da Meta.`);
  return true;
}
