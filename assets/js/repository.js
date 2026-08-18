import * as local from './storage.js';
import { getFirebase, firebaseEnabled } from './firebase.js';
import { deepClone } from './utils.js';
export async function storageMode(){return firebaseEnabled()?'Firebase':'Local';}
function cloudQuizPayload(quiz){const copy=deepClone(quiz);delete copy.submissions;return copy;}
export async function listQuizzes({admin=false,includeSubmissions=false}={}){
  if(!firebaseEnabled()) return local.getQuizzes();
  try{
    const f=await getFirebase();
    const col=f.collection(f.db,'quizzes');
    const snap=admin ? await f.getDocs(col) : await f.getDocs(f.query(col,f.where('status','==','published')));
    if(snap.empty) return admin?local.getQuizzes():local.getQuizzes().filter(q=>q.status==='published');
    const quizzes=snap.docs.map(d=>({id:d.id,...d.data(),submissions:[]}));
    if(admin&&includeSubmissions){
      await Promise.all(quizzes.map(async q=>{const subSnap=await f.getDocs(f.collection(f.db,'quizzes',q.id,'submissions'));q.submissions=subSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));q.statistics=q.statistics||{};q.statistics.totalResponses=q.submissions.length;if(q.submissions.length)q.statistics.averageScore=Math.round(q.submissions.reduce((a,s)=>a+(Number(s.score)||0),0)/q.submissions.length);}));
    }
    return quizzes;
  }catch(e){console.warn('Firebase indisponível, usando localStorage.',e);return admin?local.getQuizzes():local.getQuizzes().filter(q=>q.status==='published');}
}
export async function getQuizById(id){const all=await listQuizzes({admin:true,includeSubmissions:true});return all.find(q=>q.id===id)||null;}
export async function getQuizBySlug(slug){const all=await listQuizzes({admin:false});return all.find(q=>q.slug===slug)||null;}
export async function saveQuiz(quiz){local.upsertQuiz(quiz);if(firebaseEnabled()){try{const f=await getFirebase();await f.setDoc(f.doc(f.db,'quizzes',quiz.id),cloudQuizPayload(quiz),{merge:true});}catch(e){console.warn('Falha ao sincronizar quiz.',e);}}return quiz;}
export async function deleteQuiz(id){local.removeQuiz(id);if(firebaseEnabled()){try{const f=await getFirebase();await f.deleteDoc(f.doc(f.db,'quizzes',id));}catch(e){console.warn('Falha ao excluir no Firebase.',e);}}}
export async function saveSubmission(quiz,submission){local.addSubmission(quiz.id,submission);if(firebaseEnabled()){try{const f=await getFirebase();await f.setDoc(f.doc(f.db,'quizzes',quiz.id,'submissions',submission.id),deepClone(submission));}catch(e){console.warn('Falha ao sincronizar resposta.',e);}}return submission;}
export async function incrementView(quiz){local.incrementView(quiz.id);}
export const resetDemo=()=>local.resetState();
export const getLocalState=()=>local.getState();
export const saveGlobalSettings=settings=>local.saveGlobalSettings(settings);
