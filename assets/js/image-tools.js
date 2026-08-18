export const IMAGE_LIMITS={
  profile:{maxBytes:500000,maxWidth:1200,maxHeight:1200,label:'Foto de perfil',hint:'JPG, PNG ou WEBP · até 500 KB · recomendado 600×600 px'},
  panelLogo:{maxBytes:700000,maxWidth:1600,maxHeight:800,label:'Logo do painel',hint:'PNG, JPG ou WEBP · até 700 KB · recomendado 800×300 px'},
  quizLogo:{maxBytes:800000,maxWidth:1800,maxHeight:1000,label:'Logo do quiz',hint:'PNG, JPG ou WEBP · até 800 KB · recomendado 1000×500 px'},
  favicon:{maxBytes:300000,maxWidth:512,maxHeight:512,label:'Favicon',hint:'PNG ou WEBP · até 300 KB · recomendado 512×512 px'},
  background:{maxBytes:1800000,maxWidth:3000,maxHeight:3000,label:'Imagem de fundo',hint:'JPG, PNG ou WEBP · até 1,8 MB · recomendado 1920×1080 px'},
  option:{maxBytes:600000,maxWidth:1400,maxHeight:1400,label:'Imagem da opção',hint:'JPG, PNG ou WEBP · até 600 KB · recomendado 800×800 px'},
  content:{maxBytes:1200000,maxWidth:2400,maxHeight:2400,label:'Imagem de conteúdo',hint:'JPG, PNG ou WEBP · até 1,2 MB · recomendado até 1600 px'}
};

function readDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(new Error('Não foi possível ler a imagem selecionada.'));r.readAsDataURL(file);});}
function dimensions(dataUrl){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});img.onerror=()=>reject(new Error('O arquivo selecionado não pôde ser identificado como uma imagem válida.'));img.src=dataUrl;});}
export async function validateImageFile(file,type='content'){
  const rule=IMAGE_LIMITS[type]||IMAGE_LIMITS.content;
  if(!file)throw new Error(`Selecione uma imagem para ${rule.label.toLowerCase()}.`);
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error(`${rule.label}: formato ${file.type||'desconhecido'} não permitido. Use JPG, PNG ou WEBP.`);
  if(file.size>rule.maxBytes)throw new Error(`${rule.label}: arquivo com ${(file.size/1024/1024).toFixed(2)} MB excede o limite de ${(rule.maxBytes/1024/1024).toFixed(2)} MB.`);
  const dataUrl=await readDataUrl(file);const d=await dimensions(dataUrl);
  if(d.width>rule.maxWidth||d.height>rule.maxHeight)throw new Error(`${rule.label}: imagem de ${d.width}×${d.height}px excede o limite de ${rule.maxWidth}×${rule.maxHeight}px.`);
  return {dataUrl,width:d.width,height:d.height,size:file.size,type:file.type};
}
export function imageHint(type){return (IMAGE_LIMITS[type]||IMAGE_LIMITS.content).hint;}
