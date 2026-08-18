import { FIREBASE_CONFIG } from './firebase-config.js';
import { firebaseEnabled } from './firebase.js';
export const ADMIN_EMAIL='wakilongestor@gmail.com';
let authCtx=null;
export async function getAuthContext(){if(!firebaseEnabled())return null;if(authCtx)return authCtx;const appMod=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');const authMod=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');const app=appMod.getApps()[0]||appMod.initializeApp(FIREBASE_CONFIG.config);const auth=authMod.getAuth(app);await authMod.setPersistence(auth,authMod.browserLocalPersistence);authCtx={auth,...authMod};return authCtx;}
export function isAllowedAdmin(user){return String(user?.email||'').toLowerCase()===ADMIN_EMAIL;}
async function guard(user){if(!user)return null;if(isAllowedAdmin(user))return user;const ctx=await getAuthContext();if(ctx)await ctx.signOut(ctx.auth);throw new Error('Acesso não autorizado.');}
export async function currentUser(){const ctx=await getAuthContext();const user=ctx?.auth?.currentUser||null;return user?guard(user):null;}
export async function waitForAuth(){const ctx=await getAuthContext();if(!ctx)return null;return await new Promise(resolve=>{const off=ctx.onAuthStateChanged(ctx.auth,async user=>{off();if(!user){resolve(null);return;}try{resolve(await guard(user));}catch{resolve(null);}});});}
export async function loginEmail(email,password){const ctx=await getAuthContext();if(!ctx)throw new Error('Firebase não está ativo.');if(String(email||'').toLowerCase()!==ADMIN_EMAIL)throw new Error('E-mail não autorizado.');return guard((await ctx.signInWithEmailAndPassword(ctx.auth,ADMIN_EMAIL,password)).user);}
export async function loginGoogle(){const ctx=await getAuthContext();if(!ctx)throw new Error('Firebase não está ativo.');const provider=new ctx.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account',login_hint:ADMIN_EMAIL});return guard((await ctx.signInWithPopup(ctx.auth,provider)).user);}
export async function logout(){const ctx=await getAuthContext();if(ctx)await ctx.signOut(ctx.auth);}
