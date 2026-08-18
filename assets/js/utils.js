export const deepClone = value => JSON.parse(JSON.stringify(value));
export const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
export const formatDate = iso => { try { return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso)); } catch { return iso || ''; } };
export const slugify = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
export function toast(message,type='default') { const root=document.getElementById('toastRoot'); if(!root) return; const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=message; root.appendChild(el); setTimeout(()=>el.remove(),2800); }
export function download(filename, text, mime='text/plain;charset=utf-8') { const blob=new Blob([text],{type:mime}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},0); }
export async function copyText(text){ try{await navigator.clipboard.writeText(text);return true;}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok;} }
export function csvEscape(v){ const s=typeof v==='object'?JSON.stringify(v):String(v??''); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }
export function safeJson(value,fallback={}){ try{return JSON.parse(value);}catch{return fallback;} }
