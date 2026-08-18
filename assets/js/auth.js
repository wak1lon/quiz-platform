import { FIREBASE_CONFIG } from './firebase-config.js';
import { firebaseEnabled } from './firebase.js';
let authCtx=null;
export async function getAuthContext(){
  if(!firebaseEnabled()) return null;
  if(authCtx) return authCtx;
  const appMod=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
  const authMod=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
  const apps=appMod.getApps();
  const app=apps[0] || appMod.initializeApp(FIREBASE_CONFIG.config);
  const auth=authMod.getAuth(app);
  authCtx={auth,...authMod}; return authCtx;
}
export async function currentUser(){const ctx=await getAuthContext();return ctx?.auth?.currentUser||null;}
export async function waitForAuth(){const ctx=await getAuthContext();if(!ctx)return null;return await new Promise(resolve=>{const off=ctx.onAuthStateChanged(ctx.auth,user=>{off();resolve(user||null);});});}
export async function loginEmail(email,password){const ctx=await getAuthContext();if(!ctx)throw new Error('Firebase não está ativo.');return (await ctx.signInWithEmailAndPassword(ctx.auth,email,password)).user;}
export async function logout(){const ctx=await getAuthContext();if(ctx)await ctx.signOut(ctx.auth);}
