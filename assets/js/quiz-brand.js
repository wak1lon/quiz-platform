import { getPlatformMemory } from './platform-memory.js';

const root=document.getElementById('quizRoot');
const name=getPlatformMemory().platformName||'QUIZ ADV';

function applyQuizBrand(){
  if(!root)return;
  root.querySelectorAll('.powered').forEach(el=>{
    if(el.textContent!==name)el.textContent=name;
  });
}

applyQuizBrand();
