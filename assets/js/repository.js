import * as local from './storage.js';
import { getFirebase, firebaseEnabled } from './firebase.js';
import { deepClone } from './utils.js';

const FIREBASE_TIMEOUT_MS=12000;

export async function storageMode(){return firebaseEnabled()?'Firebase':'Local';}

function cloudQuizPayload(quiz){
  const copy=deepClone(quiz);
  delete copy.submissions;
  return copy;
}

function withTimeout(promise,label,ms=FIREBASE_TIMEOUT_MS){
  let timer;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label} excedeu ${Math.round(ms/1000)}s.`)),ms);});
  return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));
}

function firebaseMessage(error){
  const code=error?.code?` (${error.code})`:'';
  return `${String(error?.message||'Falha de comunicação com o Firebase.')}${code}`;
}

function mergeById(cloudItems=[],localItems=[]){
  const map=new Map();
  for(const q of localItems||[]){if(q?.id)map.set(q.id,q);}
  for(const q of cloudItems||[]){
    if(!q?.id)continue;
    const previous=map.get(q.id)||{};
    map.set(q.id,{...previous,...q,submissions:Array.isArray(previous.submissions)?previous.submissions:(q.submissions||[])});
  }
  return [...map.values()];
}

async function loadFirebase(){
  const firebase=await withTimeout(getFirebase(),'Inicialização do Firebase');
  if(!firebase)throw new Error('Firebase não está disponível.');
  return firebase;
}

export async function listQuizzes({admin=false,includeSubmissions=false}={}){
  const localItems=admin?local.getQuizzes():local.getQuizzes().filter(q=>q.status==='published');
  if(!firebaseEnabled())return localItems;
  try{
    const f=await loadFirebase();
    const collectionRef=f.collection(f.db,'quizzes');
    const queryRef=admin?collectionRef:f.query(collectionRef,f.where('status','==','published'));
    const snapshot=await withTimeout(f.getDocs(queryRef),'Consulta de quizzes');
    const cloudItems=snapshot.docs.map(doc=>({id:doc.id,...doc.data(),submissions:[]}));
    const quizzes=mergeById(cloudItems,localItems);

    if(admin&&includeSubmissions){
      await Promise.allSettled(quizzes.map(async quiz=>{
        try{
          const submissionsRef=f.collection(f.db,'quizzes',quiz.id,'submissions');
          const submissionsSnapshot=await withTimeout(f.getDocs(submissionsRef),`Respostas de ${quiz.title||quiz.id}`,10000);
          quiz.submissions=submissionsSnapshot.docs.map(doc=>({id:doc.id,...doc.data()})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
          quiz.statistics=quiz.statistics||{};
          quiz.statistics.totalResponses=quiz.submissions.filter(s=>s.completed).length;
          const completed=quiz.submissions.filter(s=>s.completed);
          quiz.statistics.averageScore=completed.length?Math.round(completed.reduce((sum,item)=>sum+(Number(item.score)||0),0)/completed.length):0;
        }catch(error){
          quiz.submissions=Array.isArray(quiz.submissions)?quiz.submissions:[];
          console.warn(`Não foi possível carregar respostas do quiz ${quiz.id}.`,error);
        }
      }));
    }
    return quizzes;
  }catch(error){
    console.warn('Firebase indisponível; usando dados locais nesta tela.',error);
    return localItems;
  }
}

export async function getQuizById(id){const all=await listQuizzes({admin:true,includeSubmissions:true});return all.find(q=>q.id===id)||null;}

export async function getQuizBySlug(slug){
  const wanted=String(slug||'').trim();
  if(!wanted)return null;
  if(!firebaseEnabled())return local.getQuizzes().find(q=>q.status==='published'&&String(q.slug||'').trim()===wanted)||null;
  try{
    const f=await loadFirebase();
    const publishedQuery=f.query(f.collection(f.db,'quizzes'),f.where('status','==','published'));
    const snapshot=await withTimeout(f.getDocs(publishedQuery),'Carregamento do quiz público');
    const match=snapshot.docs.find(doc=>String(doc.data()?.slug||'').trim()===wanted);
    return match?{id:match.id,...match.data(),submissions:[]}:null;
  }catch(error){
    console.warn('Consulta pública ao Firebase falhou; tentando cópia local publicada.',error);
    return local.getQuizzes().find(q=>q.status==='published'&&String(q.slug||'').trim()===wanted)||null;
  }
}

export async function saveQuiz(quiz,{requireCloud=false}={}){
  const payload=cloudQuizPayload(quiz);
  if(requireCloud){
    if(!firebaseEnabled())throw new Error('O Firebase não está ativo. O quiz não pode ser publicado para outros dispositivos.');
    try{
      const f=await loadFirebase();
      const ref=f.doc(f.db,'quizzes',quiz.id);
      await withTimeout(f.setDoc(ref,payload,{merge:true}),'Publicação no Firebase');
      const confirmation=await withTimeout(f.getDoc(ref),'Confirmação da publicação');
      const saved=confirmation.exists()?confirmation.data():null;
      if(!saved)throw new Error('O Firebase não confirmou a existência do quiz após a publicação.');
      if(saved.status!=='published')throw new Error('O Firebase recebeu o quiz, mas o status publicado não foi confirmado.');
      if(String(saved.slug||'').trim()!==String(quiz.slug||'').trim())throw new Error('O Firebase confirmou um slug diferente do endereço do quiz.');
      local.upsertQuiz(quiz);
      return quiz;
    }catch(error){
      console.error('Falha real de publicação no Firebase.',error);
      throw new Error(`Não foi possível publicar o quiz. ${firebaseMessage(error)}`);
    }
  }

  local.upsertQuiz(quiz);
  if(firebaseEnabled()){
    try{const f=await loadFirebase();await withTimeout(f.setDoc(f.doc(f.db,'quizzes',quiz.id),payload,{merge:true}),'Sincronização do quiz');}
    catch(error){console.warn('Alterações salvas localmente, mas ainda não sincronizadas com o Firebase.',error);}
  }
  return quiz;
}

export async function deleteQuiz(id){
  local.removeQuiz(id);
  if(firebaseEnabled()){
    try{const f=await loadFirebase();await withTimeout(f.deleteDoc(f.doc(f.db,'quizzes',id)),'Exclusão no Firebase');}
    catch(error){console.warn('Falha ao excluir no Firebase.',error);}
  }
}

export async function saveSubmission(quiz,submission){
  local.addSubmission(quiz.id,submission);
  if(firebaseEnabled()){
    try{const f=await loadFirebase();await withTimeout(f.setDoc(f.doc(f.db,'quizzes',quiz.id,'submissions',submission.id),deepClone(submission)),'Envio da resposta');}
    catch(error){console.warn('Resposta salva localmente, mas não sincronizada.',error);}
  }
  return submission;
}

export async function deleteSubmission(quizId,submissionId){
  local.removeSubmission(quizId,submissionId);
  if(firebaseEnabled()){
    const f=await loadFirebase();
    await withTimeout(f.deleteDoc(f.doc(f.db,'quizzes',quizId,'submissions',submissionId)),'Exclusão da resposta');
  }
  return true;
}

export async function clearSubmissions(quizId){
  const localQuiz=local.getQuizzes().find(q=>q.id===quizId);
  local.clearSubmissions(quizId);
  if(firebaseEnabled()){
    const f=await loadFirebase();
    const col=f.collection(f.db,'quizzes',quizId,'submissions');
    const snapshot=await withTimeout(f.getDocs(col),'Consulta para limpar respostas');
    await Promise.all(snapshot.docs.map(doc=>withTimeout(f.deleteDoc(doc.ref),'Exclusão de resposta',10000)));
  }
  return localQuiz||true;
}

export async function incrementView(quiz){local.incrementView(quiz.id);}
export const resetDemo=()=>local.resetState();
export const getLocalState=()=>local.getState();
export const saveGlobalSettings=settings=>local.saveGlobalSettings(settings);
