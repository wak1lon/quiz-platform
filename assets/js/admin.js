const content=document.getElementById('appContent');
try{
  await import('./admin-bundle.js');
}catch(error){
  console.error('Falha ao iniciar o painel administrativo.',error);
  if(content){
    content.replaceChildren();
    const card=document.createElement('section');
    card.className='card card-pad';
    const title=document.createElement('h2');
    title.textContent='Não foi possível iniciar o painel';
    const message=document.createElement('p');
    message.textContent='Atualize a página. Se o problema continuar, verifique o deploy mais recente.';
    card.append(title,message);
    content.append(card);
  }
}
