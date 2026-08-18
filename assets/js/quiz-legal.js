import { getLegal } from './platform-safe-settings.js';

const root=document.getElementById('quizRoot');
const legal=getLegal();
let consentChecked=false;

function footerHtml(){
  const links=[];
  if(legal.privacyUrl)links.push(`<a href="${legal.privacyUrl}" target="_blank" rel="noopener">Política de Privacidade</a>`);
  if(legal.termsUrl)links.push(`<a href="${legal.termsUrl}" target="_blank" rel="noopener">Termos de Uso</a>`);
  if(!links.length)return '';
  return `<div class="qp-legal-footer" style="text-align:center;font-size:11px;color:var(--muted);padding:14px 18px 4px">${links.join(' · ')}</div>`;
}
function consentHtml(){
  const policy=legal.privacyUrl?`<a href="${legal.privacyUrl}" target="_blank" rel="noopener">Política de Privacidade</a>`:'Política de Privacidade';
  const terms=legal.termsUrl?`<a href="${legal.termsUrl}" target="_blank" rel="noopener">Termos de Uso</a>`:'Termos de Uso';
  return `<label id="qpLegalConsent" style="display:flex;align-items:flex-start;gap:10px;margin:18px 0 2px;padding:12px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,.7);font-size:12px;line-height:1.5"><input id="qpLegalConsentInput" type="checkbox" ${consentChecked?'checked':''} style="margin-top:3px"><span>${legal.consentText||`Li e concordo com a ${policy} e os ${terms}.`}</span></label>`;
}
function enhance(){
  if(!root)return;
  const card=root.querySelector('.quiz-card-public .quiz-inner');
  if(card&&!card.querySelector('.qp-legal-footer')&&footerHtml())card.insertAdjacentHTML('beforeend',footerHtml());
  const next=document.getElementById('nextBtn');
  if(legal.consentRequired&&next&&/resultado|concluir|enviar/i.test(next.textContent||'')&&!document.getElementById('qpLegalConsent')){
    const actions=next.closest('.quiz-actions-public');
    actions?.insertAdjacentHTML('beforebegin',consentHtml());
    document.getElementById('qpLegalConsentInput')?.addEventListener('change',e=>consentChecked=e.target.checked);
  }
}
const observer=new MutationObserver(()=>queueMicrotask(enhance));
observer.observe(root,{childList:true,subtree:true});
root.addEventListener('click',e=>{
  const next=e.target.closest('#nextBtn');
  if(!next||!legal.consentRequired||!/resultado|concluir|enviar/i.test(next.textContent||''))return;
  if(consentChecked)return;
  e.preventDefault();e.stopImmediatePropagation();
  let msg=document.getElementById('qpLegalError');
  if(!msg){msg=document.createElement('div');msg.id='qpLegalError';msg.style='margin-top:8px;color:var(--danger);font-size:12px;font-weight:600';document.getElementById('qpLegalConsent')?.appendChild(msg);}
  msg.textContent='Você precisa concordar com a Política de Privacidade e os Termos de Uso antes de concluir.';
},true);
enhance();
