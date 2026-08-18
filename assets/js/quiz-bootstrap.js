const root=document.getElementById('quizRoot');

function renderFatal(message){
  if(!root)return;
  root.innerHTML=`<section class="error-card"><h1>Não foi possível abrir o quiz</h1><p>${String(message||'Ocorreu uma falha ao carregar a página. Tente novamente em instantes.')}</p></section>`;
}

if(root&&!root.innerHTML.trim()){
  root.innerHTML='<section class="quiz-card-public"><div class="quiz-inner"><p>Carregando quiz...</p></div></section>';
}

try{
  await import('./quiz.js');
}catch(error){
  console.error('Falha ao iniciar o quiz público.',error);
  renderFatal('A página do quiz não conseguiu iniciar. Atualize a página e tente novamente.');
}

Promise.allSettled([
  import('./quiz-legal.js'),
  import('./quiz-brand.js')
]).then(results=>{
  for(const result of results){
    if(result.status==='rejected')console.warn('Módulo complementar do quiz não carregou.',result.reason);
  }
});
