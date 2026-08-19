const parts=[
  'admin-parts/part01.txt','admin-parts/part02.txt','admin-parts/part03.txt','admin-parts/part04.txt',
  'admin-parts/part05.txt','admin-parts/part06.txt','admin-parts/part07.txt','admin-parts/part08.txt',
  'admin-parts/part09.txt','admin-parts/part10.txt','admin-parts/part11.txt','admin-parts/part12.txt',
  'admin-parts/part13.txt','admin-parts/part14.txt'
];

const content=document.getElementById('appContent');

function showFatal(error){
  console.error('Falha ao iniciar o painel administrativo.',error);
  if(!content)return;
  const message=String(error?.message||'Erro desconhecido ao carregar o painel.');
  content.innerHTML=`<section class="card card-pad"><h2>Não foi possível iniciar o painel</h2><p class="muted">${message}</p><p class="muted">Atualize a página. Se o problema continuar, verifique o deploy mais recente.</p></section>`;
}

async function loadPart(path){
  const response=await fetch(new URL(path,import.meta.url),{cache:'no-cache'});
  if(!response.ok)throw new Error(`Falha ao carregar ${path} (HTTP ${response.status}).`);
  const text=await response.text();
  if(!text.trim())throw new Error(`O módulo ${path} está vazio.`);
  return text;
}

try{
  const sources=await Promise.all(parts.map(loadPart));
  const source=sources.join('\n');
  const moduleUrl=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
  try{
    await import(moduleUrl);
  }finally{
    URL.revokeObjectURL(moduleUrl);
  }
}catch(error){
  showFatal(error);
}
