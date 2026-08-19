function cssUrl(value){
  return `url(${JSON.stringify(String(value||''))})`;
}

export function applyQuizPageDesign(quiz,{platformName='QUIZ ADV',preview=false}={}){
  const d=quiz?.design||{};
  const rootStyle=document.documentElement.style;
  const background=d.backgroundColor||'#F3F4F6';

  rootStyle.setProperty('--primary',d.primaryColor||'#1E3A8A');
  rootStyle.setProperty('--secondary',d.secondaryColor||'#3B82F6');
  rootStyle.setProperty('--background',background);
  rootStyle.setProperty('--text',d.textColor||'#1F2937');
  rootStyle.setProperty('--accent',d.accentColor||'#F59E0B');
  rootStyle.setProperty('--success',d.successColor||'#10B981');
  rootStyle.setProperty('--danger',d.errorColor||'#EF4444');

  document.body.style.fontFamily=`${d.fontFamily||'Poppins'},sans-serif`;
  document.body.style.backgroundColor=background;
  document.body.style.backgroundImage=d.backgroundImage?cssUrl(d.backgroundImage):'none';
  document.body.style.backgroundSize='cover';
  document.body.style.backgroundPosition='center center';
  document.body.style.backgroundRepeat='no-repeat';

  const theme=document.querySelector('meta[name="theme-color"]');
  if(theme)theme.setAttribute('content',d.primaryColor||'#1E3A8A');

  let favicon=document.querySelector('link[data-quiz-favicon]');
  if(d.favicon){
    if(!favicon){
      favicon=document.createElement('link');
      favicon.rel='icon';
      favicon.dataset.quizFavicon='1';
      document.head.appendChild(favicon);
    }
    favicon.href=d.favicon;
  }else if(favicon){
    favicon.remove();
  }

  document.title=preview
    ?`Pré-visualização · ${quiz?.title||'Quiz'}`
    :(quiz?.title||platformName);
}

export function quizTopMediaHtml(design={},escapeHtml=value=>String(value||'')){
  const profile=design.profileImage
    ?`<img class="quiz-profile-image" src="${escapeHtml(design.profileImage)}" alt="Foto de perfil">`
    :'';
  const logo=design.logo
    ?`<img class="quiz-logo" src="${escapeHtml(design.logo)}" alt="Logo">`
    :'';
  if(!profile&&!logo)return '';
  return `<div class="quiz-top-media">${profile}${logo}</div>`;
}
