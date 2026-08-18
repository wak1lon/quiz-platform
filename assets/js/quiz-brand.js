import { getPlatformMemory } from './platform-memory.js';
const root=document.getElementById('quizRoot');
function applyQuizBrand(){const name=getPlatformMemory().platformName||'QUIZ ADV';document.querySelectorAll('.powered').forEach(el=>el.textContent=name);}
const observer=new MutationObserver(()=>queueMicrotask(applyQuizBrand));if(root)observer.observe(root,{childList:true,subtree:true});applyQuizBrand();
