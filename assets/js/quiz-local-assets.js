const PREFIX='qp_local_assets_';
function empty(){return {logoData:'',faviconData:'',backgroundData:'',fields:{},options:{},updatedAt:null};}
export function getQuizAssets(quizId){try{return {...empty(),...JSON.parse(localStorage.getItem(PREFIX+quizId)||'{}')};}catch{return empty();}}
export function saveQuizAssets(quizId,patch={}){if(!quizId)throw new Error('Quiz inválido.');const current=getQuizAssets(quizId);const next={...current,...patch,fields:{...current.fields,...(patch.fields||{})},options:{...current.options,...(patch.options||{})},updatedAt:new Date().toISOString()};localStorage.setItem(PREFIX+quizId,JSON.stringify(next));return next;}
export function setFieldImage(quizId,fieldId,dataUrl){const a=getQuizAssets(quizId);a.fields[fieldId]=dataUrl||'';return saveQuizAssets(quizId,{fields:a.fields});}
export function setOptionImage(quizId,fieldId,optionId,dataUrl){const a=getQuizAssets(quizId);a.options[`${fieldId}:${optionId}`]=dataUrl||'';return saveQuizAssets(quizId,{options:a.options});}
export function applyAssetsToPreview(quiz){const copy=JSON.parse(JSON.stringify(quiz));const a=getQuizAssets(copy.id);copy.design=copy.design||{};if(a.logoData)copy.design.logo=a.logoData;if(a.faviconData)copy.design.favicon=a.faviconData;if(a.backgroundData)copy.design.backgroundImage=a.backgroundData;for(const q of copy.questions||[]){if(a.fields[q.id])q.imageUrl=a.fields[q.id];for(const o of q.options||[]){const key=`${q.id}:${o.id}`;if(a.options[key])o.image=a.options[key];}}return copy;}
export function clearQuizAssets(quizId){localStorage.removeItem(PREFIX+quizId);}
