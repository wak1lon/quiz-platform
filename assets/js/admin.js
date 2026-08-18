const parts=['admin-parts/part01.txt','admin-parts/part02.txt','admin-parts/part03.txt','admin-parts/part04.txt','admin-parts/part05.txt','admin-parts/part06.txt','admin-parts/part07.txt','admin-parts/part08.txt'];
const src=(await Promise.all(parts.map(async p=>{const r=await fetch(new URL(p,import.meta.url));if(!r.ok)throw new Error(`Falha ao carregar ${p}`);return r.text();}))).join('');
const url=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));
try{await import(url);}finally{URL.revokeObjectURL(url);}
