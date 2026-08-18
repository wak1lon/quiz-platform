const modalRoot=document.getElementById('modalRoot');

function getSlugFromPublishModal(){
  const modal=modalRoot?.querySelector('.modal');
  if(!modal)return '';
  const input=[...modal.querySelectorAll('input[readonly]')].find(el=>/slug=/i.test(el.value||''));
  if(!input)return '';
  try{return new URL(input.value,location.href).searchParams.get('slug')||'';}catch{return '';}
}

function canonicalQuizUrl(slug){
  return new URL(`../quiz/?slug=${encodeURIComponent(slug)}`,location.href).href;
}

function enhancePublishModal(){
  const modal=modalRoot?.querySelector('.modal');
  if(!modal||modal.dataset.publishViewReady==='1')return;
  const title=modal.querySelector('.modal-head strong')?.textContent?.trim()||'';
  if(!/publicar quiz/i.test(title))return;

  const slug=getSlugFromPublishModal();
  if(!slug)return;
  const url=canonicalQuizUrl(slug);
  modal.dataset.publishViewReady='1';

  const urlInput=[...modal.querySelectorAll('input[readonly]')].find(el=>/slug=/i.test(el.value||''));
  if(urlInput)urlInput.value=url;

  const viewLink=[...modal.querySelectorAll('a')].find(a=>/visualizar quiz/i.test(a.textContent||''));
  if(viewLink)viewLink.href=url;

  const codeBox=modal.querySelector('.code-box');
  if(codeBox){
    const embed=`<iframe src="${url}" width="100%" height="700" style="border:0;width:100%;" loading="lazy"></iframe>`;
    codeBox.textContent=embed;
  }

  const qr=modal.querySelector('.qr-preview img');
  if(qr)qr.src=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  const body=modal.querySelector('.modal-body');
  if(!body)return;

  const preview=document.createElement('section');
  preview.style='grid-column:1/-1;margin-top:14px;border-top:1px solid var(--border);padding-top:14px';
  preview.innerHTML=`<div class="section-head"><div><strong>Visualização da página publicada</strong><p class="muted" style="margin:4px 0 0;font-size:12px">Você pode testar e preencher o quiz aqui mesmo.</p></div><a class="btn btn-secondary btn-sm" href="${url}" target="_blank" rel="noopener">Abrir em nova aba</a></div><iframe src="${url}" title="Quiz publicado" style="width:100%;height:720px;border:1px solid var(--border);border-radius:14px;background:#fff"></iframe>`;
  body.appendChild(preview);
}

if(modalRoot){
  const observer=new MutationObserver(()=>queueMicrotask(enhancePublishModal));
  observer.observe(modalRoot,{childList:true,subtree:true});
  enhancePublishModal();
}
