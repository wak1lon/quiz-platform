import { createPublicSubmission, getPublishedQuizBySlug, publicFirestoreEnabled } from './firestore-public-rest.js';

const STATE_KEY='quizplatform_state_v1';
const FIREBASE_TIMEOUT_MS=9000;
const SUBMISSION_TIMEOUT_MS=8000;

function withTimeout(task,label,ms){
  const controller=new AbortController();
  let timer;
  const timeout=new Promise((_,reject)=>{
    timer=setTimeout(()=>{
      controller.abort();
      reject(new Error(`${label} excedeu ${Math.round(ms/1000)}s.`));
    },ms);
  });
  const work=Promise.resolve().then(()=>task(controller.signal));
  return Promise.race([work,timeout]).finally(()=>clearTimeout(timer));
}

function readLocalState(){
  try{return JSON.parse(localStorage.getItem(STATE_KEY)||'null');}
  catch{return null;}
}

function writeLocalState(state){
  if(!state)return;
  try{localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch{}
}

async function localQuizBySlug(slug){
  const state=readLocalState();
  const localQuiz=(state?.quizzes||[]).find(item=>item?.status==='published'&&String(item.slug||'').trim()===slug);
  if(localQuiz)return localQuiz;
  try{
    const { DEMO_QUIZ }=await import('./defaults.js');
    return DEMO_QUIZ.status==='published'&&DEMO_QUIZ.slug===slug?DEMO_QUIZ:null;
  }catch{return null;}
}

function saveLocalSubmission(quizId,submission){
  const state=readLocalState();
  const quiz=(state?.quizzes||[]).find(item=>item?.id===quizId);
  if(!quiz)return;
  quiz.submissions=Array.isArray(quiz.submissions)?quiz.submissions:[];
  const index=quiz.submissions.findIndex(item=>item?.id===submission.id);
  if(index>=0)quiz.submissions[index]=submission;
  else quiz.submissions.unshift(submission);
  writeLocalState(state);
}

async function firebaseContext(){
  const { getFirebase }=await import('./firebase.js');
  const firebase=await getFirebase();
  if(!firebase)throw new Error('Firebase não está disponível.');
  return firebase;
}

async function getQuizWithSdk(slug){
  const firebase=await firebaseContext();
  try{
    const exact=firebase.query(
      firebase.collection(firebase.db,'quizzes'),
      firebase.where('status','==','published'),
      firebase.where('slug','==',slug),
      firebase.limit(1)
    );
    const snapshot=await firebase.getDocs(exact);
    const document=snapshot.docs[0];
    return document?{id:document.id,...document.data(),submissions:[]}:null;
  }catch(exactError){
    console.warn('Consulta exata indisponível; usando consulta de compatibilidade.',exactError);
    const published=firebase.query(firebase.collection(firebase.db,'quizzes'),firebase.where('status','==','published'));
    const snapshot=await firebase.getDocs(published);
    const document=snapshot.docs.find(item=>String(item.data()?.slug||'').trim()===slug);
    return document?{id:document.id,...document.data(),submissions:[]}:null;
  }
}

export async function getQuizBySlug(slug){
  const wanted=String(slug||'').trim();
  if(!wanted)return null;

  if(publicFirestoreEnabled()){
    try{
      return await withTimeout(signal=>getPublishedQuizBySlug(wanted,{signal}),'Carregamento do quiz público',FIREBASE_TIMEOUT_MS);
    }catch(restError){
      console.warn('Consulta leve indisponível; ativando compatibilidade com o Firebase.',restError);
      try{
        return await withTimeout(()=>getQuizWithSdk(wanted),'Carregamento alternativo do quiz',FIREBASE_TIMEOUT_MS);
      }catch(sdkError){
        console.warn('Firebase indisponível; tentando cópia local publicada.',sdkError);
      }
    }
  }

  return localQuizBySlug(wanted);
}

async function saveWithSdk(quizId,documentId,submission){
  const firebase=await firebaseContext();
  await firebase.setDoc(firebase.doc(firebase.db,'quizzes',quizId,'submissions',documentId),{...submission,id:documentId});
}

export async function saveSubmission(quiz,submission){
  saveLocalSubmission(quiz.id,submission);
  if(!publicFirestoreEnabled())return submission;

  const attempts=submission?.attemptStatus==='completed'?2:1;
  let lastError=null;
  for(let index=0;index<attempts;index+=1){
    const documentId=index===0?submission.id:`${submission.id}_retry_${index}`;
    const payload={...submission,id:documentId};
    try{
      await withTimeout(signal=>createPublicSubmission(quiz.id,documentId,payload,{signal}),index===0?'Envio da resposta':'Nova tentativa de envio da resposta',SUBMISSION_TIMEOUT_MS);
      return submission;
    }catch(restError){
      lastError=restError;
      console.warn(`Envio leve ${index+1} falhou; ativando compatibilidade com o Firebase.`,restError);
      try{
        await withTimeout(()=>saveWithSdk(quiz.id,documentId,payload),'Envio alternativo da resposta',SUBMISSION_TIMEOUT_MS);
        return submission;
      }catch(sdkError){
        lastError=sdkError;
        console.warn(`Tentativa ${index+1} de sincronização da resposta falhou.`,sdkError);
      }
    }
  }
  throw new Error(`A resposta não chegou ao painel. Verifique a internet e tente novamente. ${lastError?.message||''}`.trim());
}

export function incrementView(quiz){
  const state=readLocalState();
  const localQuiz=(state?.quizzes||[]).find(item=>item?.id===quiz.id);
  if(!localQuiz)return;
  localQuiz.statistics=localQuiz.statistics||{};
  localQuiz.statistics.totalViews=(Number(localQuiz.statistics.totalViews)||0)+1;
  localQuiz.statistics.updatedAt=new Date().toISOString();
  writeLocalState(state);
}

export function getLocalState(){
  return readLocalState()||{settings:{},quizzes:[]};
}
