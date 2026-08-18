const loaded=new Set();
function addScript(id,src,code=''){if(loaded.has(id)||document.getElementById(id))return;const s=document.createElement('script');s.id=id;if(src){s.async=true;s.src=src;}else{s.textContent=code;}document.head.appendChild(s);loaded.add(id);}
export function initTracking(integrations={}){
  if(integrations.gtmEnabled && /^GTM-[A-Z0-9]+$/i.test(integrations.gtmId||'')){
    window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});addScript('qp-gtm',`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(integrations.gtmId)}`);
  }
  if(integrations.fbPixelEnabled && /^\d+$/.test(integrations.fbPixelId||'')){
    if(!window.fbq){window.fbq=function(){window.fbq.callMethod?window.fbq.callMethod.apply(window.fbq,arguments):window.fbq.queue.push(arguments)};window.fbq.queue=[];window.fbq.loaded=true;window.fbq.version='2.0';addScript('qp-fbp','https://connect.facebook.net/en_US/fbevents.js');}
    window.fbq('init',integrations.fbPixelId);window.fbq('track','PageView');
  }
  if(integrations.gaEnabled && /^G-[A-Z0-9]+$/i.test(integrations.gaId||'')){
    addScript('qp-ga',`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(integrations.gaId)}`);window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',integrations.gaId);
  }
}
export function track(event,params={}){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event,...params});if(typeof window.fbq==='function')window.fbq('trackCustom',event,params);if(typeof window.gtag==='function')window.gtag('event',event,params);}
