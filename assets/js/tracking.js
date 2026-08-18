import { getMetaTrackingSettings, shouldSendMetaEvent } from './meta-tracking-settings.js';

const loaded=new Set();
function addScript(id,src,code=''){if(loaded.has(id)||document.getElementById(id))return;const s=document.createElement('script');s.id=id;if(src){s.async=true;s.src=src;}else{s.textContent=code;}document.head.appendChild(s);loaded.add(id);}
function eventId(){return `qp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;}

export function initTracking(integrations={}){
  if(integrations.gtmEnabled && /^GTM-[A-Z0-9]+$/i.test(integrations.gtmId||'')){
    window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});addScript('qp-gtm',`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(integrations.gtmId)}`);
  }
  const meta=getMetaTrackingSettings();
  const pixelId=(meta.enabled&&meta.pixelId)||integrations.fbPixelId||'';
  const pixelEnabled=(meta.enabled&&!!meta.pixelId)||integrations.fbPixelEnabled;
  if(pixelEnabled && /^\d+$/.test(pixelId)){
    if(!window.fbq){window.fbq=function(){window.fbq.callMethod?window.fbq.callMethod.apply(window.fbq,arguments):window.fbq.queue.push(arguments)};window.fbq.queue=[];window.fbq.loaded=true;window.fbq.version='2.0';addScript('qp-fbp','https://connect.facebook.net/en_US/fbevents.js');}
    window.fbq('init',pixelId);window.fbq('track','PageView');
  }
  if(integrations.gaEnabled && /^G-[A-Z0-9]+$/i.test(integrations.gaId||'')){
    addScript('qp-ga',`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(integrations.gaId)}`);window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',integrations.gaId);
  }
}

function sendMetaServerEvent(event,params,event_id){
  if(!shouldSendMetaEvent(event))return;
  const s=getMetaTrackingSettings();
  const payload={
    provider:'meta',
    pixel_id:s.pixelId,
    test_event_code:s.testEventCode||undefined,
    event_name:event,
    event_id,
    event_time:Math.floor(Date.now()/1000),
    event_source_url:location.href,
    action_source:'website',
    custom_data:params
  };
  fetch(s.capiEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(err=>console.warn('Meta CAPI endpoint indisponível.',err));
}

export function track(event,params={}){
  const id=eventId();
  const enriched={...params,event_id:id};
  window.dataLayer=window.dataLayer||[];window.dataLayer.push({event,...enriched});
  if(typeof window.fbq==='function')window.fbq('trackCustom',event,enriched,{eventID:id});
  if(typeof window.gtag==='function')window.gtag('event',event,enriched);
  sendMetaServerEvent(event,params,id);
}
