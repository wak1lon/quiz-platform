import { FIREBASE_CONFIG } from './firebase-config.js';

const config=FIREBASE_CONFIG?.config||{};
const projectId=String(config.projectId||'').trim();
const apiKey=String(config.apiKey||'').trim();

export function publicFirestoreEnabled(){
  return Boolean(FIREBASE_CONFIG?.enabled&&projectId&&apiKey&&!projectId.includes('SEU-PROJETO'));
}

function apiUrl(path){
  const base=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
  const separator=path.includes('?')?'&':'?';
  return `${base}${path}${separator}key=${encodeURIComponent(apiKey)}`;
}

function encodeValue(value){
  if(value===null||value===undefined)return {nullValue:null};
  if(typeof value==='string')return {stringValue:value};
  if(typeof value==='boolean')return {booleanValue:value};
  if(typeof value==='number'){
    if(!Number.isFinite(value))return {nullValue:null};
    return Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value};
  }
  if(Array.isArray(value))return {arrayValue:{values:value.map(encodeValue)}};
  if(typeof value==='object')return {mapValue:{fields:encodeFields(value)}};
  return {stringValue:String(value)};
}

function encodeFields(object){
  const fields={};
  for(const [key,value] of Object.entries(object||{})){
    if(value!==undefined)fields[key]=encodeValue(value);
  }
  return fields;
}

function decodeValue(value={}){
  if('nullValue' in value)return null;
  if('stringValue' in value)return value.stringValue;
  if('booleanValue' in value)return value.booleanValue;
  if('integerValue' in value)return Number(value.integerValue);
  if('doubleValue' in value)return Number(value.doubleValue);
  if('timestampValue' in value)return value.timestampValue;
  if('bytesValue' in value)return value.bytesValue;
  if('referenceValue' in value)return value.referenceValue;
  if('geoPointValue' in value)return value.geoPointValue;
  if('arrayValue' in value)return (value.arrayValue?.values||[]).map(decodeValue);
  if('mapValue' in value)return decodeFields(value.mapValue?.fields||{});
  return null;
}

function decodeFields(fields={}){
  const object={};
  for(const [key,value] of Object.entries(fields))object[key]=decodeValue(value);
  return object;
}

async function jsonRequest(url,options){
  const response=await fetch(url,{credentials:'omit',...options});
  const data=await response.json().catch(()=>null);
  if(!response.ok){
    const detail=data?.error?.message||`HTTP ${response.status}`;
    const error=new Error(`Firestore REST: ${detail}`);
    error.status=response.status;
    throw error;
  }
  return data;
}

export async function getPublishedQuizBySlug(slug,{signal}={}){
  if(!publicFirestoreEnabled())return null;
  const value=String(slug||'').trim();
  if(!value)return null;

  const data=await jsonRequest(apiUrl(':runQuery'),{
    method:'POST',
    cache:'no-store',
    signal,
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      structuredQuery:{
        from:[{collectionId:'quizzes'}],
        where:{
          compositeFilter:{
            op:'AND',
            filters:[
              {fieldFilter:{field:{fieldPath:'status'},op:'EQUAL',value:{stringValue:'published'}}},
              {fieldFilter:{field:{fieldPath:'slug'},op:'EQUAL',value:{stringValue:value}}}
            ]
          }
        },
        limit:1
      }
    })
  });

  const document=Array.isArray(data)?data.find(item=>item?.document)?.document:null;
  if(!document)return null;
  const id=decodeURIComponent(String(document.name||'').split('/').pop()||'');
  return {id,...decodeFields(document.fields||{}),submissions:[]};
}

export async function createPublicSubmission(quizId,documentId,submission,{signal}={}){
  if(!publicFirestoreEnabled())throw new Error('Firestore público não está configurado.');
  const collectionPath=`/quizzes/${encodeURIComponent(quizId)}/submissions?documentId=${encodeURIComponent(documentId)}&fields=name`;
  await jsonRequest(apiUrl(collectionPath),{
    method:'POST',
    cache:'no-store',
    signal,
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({fields:encodeFields(submission)})
  });
  return submission;
}
