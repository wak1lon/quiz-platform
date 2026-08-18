import { DEFAULT_GLOBAL_SETTINGS, DEMO_QUIZ, VERSION } from './defaults.js';
import { deepClone } from './utils.js';
const KEY='quizplatform_state_v1';
function initialState(){return {version:VERSION,settings:deepClone(DEFAULT_GLOBAL_SETTINGS),quizzes:[deepClone(DEMO_QUIZ)]};}
export function getState(){try{const raw=localStorage.getItem(KEY);if(!raw){const s=initialState();localStorage.setItem(KEY,JSON.stringify(s));return s;}const parsed=JSON.parse(raw);return {...initialState(),...parsed,settings:{...DEFAULT_GLOBAL_SETTINGS,...parsed.settings},quizzes:Array.isArray(parsed.quizzes)?parsed.quizzes:[deepClone(DEMO_QUIZ)]};}catch{return initialState();}}
export function saveState(state){localStorage.setItem(KEY,JSON.stringify(state));return state;}
export function resetState(){const s=initialState();saveState(s);return s;}
export function getQuizzes(){return getState().quizzes;}
export function getQuizById(id){return getQuizzes().find(q=>q.id===id)||null;}
export function getQuizBySlug(slug){return getQuizzes().find(q=>q.slug===slug)||null;}
export function upsertQuiz(quiz){const state=getState();const i=state.quizzes.findIndex(q=>q.id===quiz.id);const next=deepClone(quiz);next.statistics=next.statistics||{};next.statistics.updatedAt=new Date().toISOString();if(i>=0)state.quizzes[i]=next;else state.quizzes.unshift(next);saveState(state);return next;}
export function removeQuiz(id){const state=getState();state.quizzes=state.quizzes.filter(q=>q.id!==id);saveState(state);}
export function addSubmission(quizId,submission){const state=getState();const q=state.quizzes.find(x=>x.id===quizId);if(!q)return null;q.submissions=q.submissions||[];q.submissions.unshift(deepClone(submission));q.statistics=q.statistics||{};q.statistics.totalResponses=q.submissions.filter(s=>s.completed).length;const completed=q.submissions.filter(s=>s.completed);q.statistics.averageScore=completed.length?Math.round(completed.reduce((a,s)=>a+(Number(s.score)||0),0)/completed.length):0;q.statistics.updatedAt=new Date().toISOString();saveState(state);return submission;}
export function incrementView(quizId){const state=getState();const q=state.quizzes.find(x=>x.id===quizId);if(!q)return;q.statistics=q.statistics||{};q.statistics.totalViews=(Number(q.statistics.totalViews)||0)+1;q.statistics.updatedAt=new Date().toISOString();saveState(state);}
export function saveGlobalSettings(settings){const state=getState();state.settings={...state.settings,...settings};saveState(state);return state.settings;}
