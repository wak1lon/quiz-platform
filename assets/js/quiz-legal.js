import { getLegal } from './platform-safe-settings.js';

const root=document.getElementById('quizRoot');
const legal=getLegal();

function footerHtml(){
  const links=[];
  if(legal.privacyUrl)links.push(`<a href="${legal.privacyUrl}" target="_blank" rel="noopener">Política de Privacidade</a>`);
  if(legal.termsUrl)links.push(`<a href="${legal.termsUrl}" target="_blank" rel="noopener">Termos de Uso</a>`);
  return links.length?`<div class="qp-legal-footer" style="text-align:center;font-size:11px;color:var(--muted);padding:14px 18px 4px">${links.join(' · ')}</div>`:'';
}

if(root){
  const card=root.querySelector('.quiz-card-public .quiz-inner');
  if(card&&!card.querySelector('.qp-legal-footer')){
    const footer=footerHtml();
    if(footer)card.insertAdjacentHTML('beforeend',footer);
  }
}
