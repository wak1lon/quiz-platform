import { FIREBASE_CONFIG } from './firebase-config.js';
let ctx=null;
export const firebaseEnabled=()=>Boolean(FIREBASE_CONFIG?.enabled && FIREBASE_CONFIG?.config?.projectId && !FIREBASE_CONFIG.config.projectId.includes('SEU-PROJETO'));
export async function getFirebase(){
  if(!firebaseEnabled()) return null;
  if(ctx) return ctx;
  const appMod=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
  const fsMod=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
  const apps=appMod.getApps();
  const app=apps[0] || appMod.initializeApp(FIREBASE_CONFIG.config);
  const db=fsMod.getFirestore(app);
  ctx={app,db,...fsMod}; return ctx;
}
