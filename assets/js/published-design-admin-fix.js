import { validateImageFile, imageHint } from './image-tools.js';

const APP_SELECTOR='#appContent';
const PATCHED='data-qp-published-design-patched';
let scheduled=false;

const PUBLISH_LIMITS={
  profile:{maxSide:640,targetChars:90000,hardChars:120000,quality:.82},
  favicon:{maxSide:256,targetChars:25000,hardChars:40000,quality:.86},
  quizLogo:{maxSide:1000,targetChars:120000,hardChars:160000,quality:.84},
  background:{maxSide:1920,targetChars:360000,hardChars:430000,quality:.80}
};

function loadImage(dataUrl){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('A imagem não pôde ser otimizada.'));
    image.src=dataUrl;
  });
}

async function optimizeImageFile(file,type){
  const source=await validateImageFile(file,type);
  const rule=PUBLISH_LIMITS[type]||PUBLISH_LIMITS.background;
  const image=await loadImage(source.dataUrl);
  const scale=Math.min(1,rule.maxSide/Math.max(image.naturalWidth||1,image.naturalHeight||1));
  let width=Math.max(1,Math.round((image.naturalWidth||1)*scale));
  let height=Math.max(1,Math.round((image.naturalHeight||1)*scale));

  const render=(w,h,quality)=>{
    const canvas=document.createElement('canvas');
    canvas.width=w;
    canvas.height=h;
    const context=canvas.getContext('2d',{alpha:true});
    if(!context)throw new Error('Seu navegador não conseguiu processar a imagem.');
    context.drawImage(image,0,0,w,h);
    return canvas.toDataURL('image/webp',quality);
  };

  let quality=rule.quality;
  let dataUrl=render(width,height,quality);
  while(dataUrl.length>rule.targetChars&&quality>.42){
    quality-=.07;
    dataUrl=render(width,height,quality);
  }
  if(dataUrl.length>rule.hardChars){
    const shrink=Math.min(.9,Math.sqrt(rule.targetChars/dataUrl.length));
    width=Math.max(1,Math.round(width*shrink));
    height=Math.max(1,Math.round(height*shrink));
    dataUrl=render(width,height,Math.max(.48,quality));
  }
  if(dataUrl.length>rule.hardChars){
    throw new Error('A imagem continua pesada demais. Escolha uma imagem mais simples ou menor.');
  }
  return {...source,dataUrl,width,height,optimized:true};
}

function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    patchDesignEditor();
  });
}

function designInput(path){
  return document.querySelector(`[data-path="design.${path}"]`);
}

function designValue(path){
  return String(designInput(path)?.value||'');
}

function setDesignValue(path,value){
  const input=designInput(path);
  if(!input)throw new Error(`O campo de design ${path} não foi encontrado.`);
  input.value=value||'';
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
}

function status(field,message,error=false){
  let node=field.querySelector('[data-published-design-status]');
  if(!node){
    node=document.createElement('small');
    node.dataset.publishedDesignStatus='1';
    node.style.display='block';
    node.style.marginTop='7px';
    node.style.fontWeight='600';
    field.appendChild(node);
  }
  node.textContent=message;
  node.style.color=error?'var(--danger, #ef4444)':'var(--success, #10b981)';
}

function preview(field,src,kind){
  let image=field.querySelector('[data-published-design-preview]');
  if(!src){image?.remove();return;}
  if(!image){
    image=document.createElement('img');
    image.dataset.publishedDesignPreview='1';
    image.style.display='block';
    image.style.marginTop='9px';
    image.style.objectFit=kind==='background'?'cover':'contain';
    image.style.borderRadius=kind==='profile'?'50%':'10px';
    image.style.border='1px solid var(--border)';
    field.appendChild(image);
  }
  image.src=src;
  image.alt='Prévia atual';
  if(kind==='profile')image.style.cssText+=';width:92px;height:92px;object-fit:cover';
  else if(kind==='favicon')image.style.cssText+=';width:52px;height:52px';
  else if(kind==='background')image.style.cssText+=';width:240px;height:120px';
  else image.style.cssText+=';max-width:180px;max-height:90px';
}

function removeButton(field,input,path,label){
  if(field.querySelector('[data-remove-published-design]'))return;
  const button=document.createElement('button');
  button.type='button';
  button.className='btn btn-sm btn-ghost';
  button.dataset.removePublishedDesign=path;
  button.textContent=`Remover ${label.toLowerCase()}`;
  button.style.marginTop='8px';
  button.onclick=()=>{
    setDesignValue(path,'');
    input.value='';
    preview(field,'',path);
    status(field,`${label} removido. Salve ou publique para confirmar.`);
  };
  field.appendChild(button);
}

function bindUpload(input,{type,path,label}){
  if(!input||input.hasAttribute(PATCHED))return;
  input.setAttribute(PATCHED,'1');
  const field=input.closest('.field');
  if(!field)return;

  let current=designValue(path);
  const legacyPreview=[...field.querySelectorAll('img')].find(image=>!image.hasAttribute('data-published-design-preview'));
  if(!current&&legacyPreview?.src?.startsWith('data:image/')){
    current=legacyPreview.src;
    setDesignValue(path,current);
    status(field,`${label} anterior incorporado ao quiz. Salve ou publique para confirmar.`);
  }
  legacyPreview?.remove();
  preview(field,current,type);
  removeButton(field,input,path,label);

  input.onchange=async()=>{
    const file=input.files?.[0];
    if(!file)return;
    input.disabled=true;
    status(field,'Otimizando a imagem para publicação...');
    try{
      const result=await optimizeImageFile(file,type);
      setDesignValue(path,result.dataUrl);
      preview(field,result.dataUrl,type);
      status(field,`${label} incorporado ao quiz. Agora clique em Salvar ou Publicar.`);
    }catch(error){
      console.error('[QUIZ ADV] Falha no upload de design:',error);
      input.value='';
      status(field,error?.message||'Não foi possível processar a imagem.',true);
    }finally{
      input.disabled=false;
    }
  };
}

function makeProfileField(){
  const field=document.createElement('div');
  field.className='field';
  field.dataset.quizProfileField='1';
  field.innerHTML=`<label>Foto de perfil no topo <span class="muted">(opcional)</span></label><input id="quizProfileUpload" type="file" accept="image/jpeg,image/png,image/webp"><small class="muted">${imageHint('profile')}</small>`;
  return field;
}

function makeBackgroundColorField(){
  const field=document.createElement('div');
  field.className='field';
  field.dataset.quizBackgroundColorField='1';
  const value=designValue('backgroundColor')||'#F3F4F6';
  field.innerHTML=`<label>Cor do fundo do quiz</label><div class="color-field"><input id="quizBackgroundColorTop" type="color" value="${value}"><input id="quizBackgroundHexTop" value="${value}" maxlength="7"></div><small class="muted">Usada quando não houver imagem e atrás da imagem durante o carregamento.</small>`;
  const color=field.querySelector('#quizBackgroundColorTop');
  const hex=field.querySelector('#quizBackgroundHexTop');
  color.oninput=()=>{hex.value=color.value;setDesignValue('backgroundColor',color.value);};
  hex.onchange=()=>{
    const next=hex.value.trim();
    if(!/^#[0-9a-f]{6}$/i.test(next)){hex.value=color.value;return;}
    color.value=next;
    setDesignValue('backgroundColor',next);
  };
  return field;
}

function patchDesignEditor(){
  const background=document.getElementById('localQuizBackground');
  const logo=document.getElementById('localQuizLogo');
  const favicon=document.getElementById('localQuizFavicon');
  if(!background||!logo||!favicon)return;

  const section=background.closest('section');
  const grid=section?.parentElement;
  const fields=section?.querySelector('.form-grid');
  if(!section||!grid||!fields)return;

  const legacySection=[...grid.querySelectorAll('section')].find(item=>item!==section&&item.querySelector('h3')?.textContent.trim()==='Fundo e logo');
  if(legacySection)legacySection.style.display='none';

  if(!section.dataset.publishedDesignSection){
    section.dataset.publishedDesignSection='1';
    section.querySelector('h3').textContent='Topo e fundo do quiz';
    const description=section.querySelector('h3 + p');
    if(description)description.textContent='As imagens são otimizadas e incorporadas ao quiz para funcionar também no link publicado.';
    const note=section.querySelector('.code-box');
    if(note)note.textContent='Depois de alterar, clique em Salvar ou Publicar. O favicon aparecerá na aba do navegador e a foto de perfil ficará no topo do quiz.';

    const profile=makeProfileField();
    const color=makeBackgroundColorField();
    const faviconField=favicon.closest('.field');
    const logoField=logo.closest('.field');
    const backgroundField=background.closest('.field');
    fields.replaceChildren(profile,faviconField,logoField,color,backgroundField);
    grid.insertBefore(section,grid.firstChild);
  }

  bindUpload(document.getElementById('quizProfileUpload'),{type:'profile',path:'profileImage',label:'Foto de perfil'});
  bindUpload(favicon,{type:'favicon',path:'favicon',label:'Favicon'});
  bindUpload(logo,{type:'quizLogo',path:'logo',label:'Logo'});
  bindUpload(background,{type:'background',path:'backgroundImage',label:'Imagem de fundo'});
}

if(typeof document!=='undefined'){
  const app=document.querySelector(APP_SELECTOR)||document.body;
  new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  schedule();
}
