// Small native enhancements; existing IDs, handlers and data objects stay intact.
const sidebar=document.getElementById('sidebar');
const toggle=document.getElementById('menuToggle');
const nav=document.getElementById('sideNav');
const app=document.getElementById('appContent');
const modalRoot=document.getElementById('modalRoot');
const mobile=matchMedia('(max-width:760px)');
const icons={
  dashboard:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  quizzes:'M8 3h12v16H8z M4 7v14h12 M11 7h6 M11 11h6 M11 15h3',
  editor:'M12 5v14 M5 12h14',
  templates:'M3 4h18v16H3z M3 9h18 M9 9v11',
  results:'M4 20h16 M7 16V9 M12 16V4 M17 16v-5',
  settings:'M4 7h16 M4 17h16 M9 4v6 M15 14v6',
  integrations:'M9 8l7 7 M7 11l-2 2a4 4 0 005 5l3-3 M11 7l2-2a4 4 0 015 5l-3 3'
};
for(const button of nav.querySelectorAll('[data-view]')){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(svg.namespaceURI,'path');
  path.setAttribute('d',icons[button.dataset.view]);svg.append(path);button.prepend(svg);
}
const backdrop=document.createElement('button');
backdrop.className='sidebar-backdrop';backdrop.type='button';
backdrop.setAttribute('aria-label','Fechar menu');backdrop.hidden=true;
sidebar.after(backdrop);
let wasOpen=false;
function syncSidebar(){
  const open=mobile.matches&&sidebar.classList.contains('open');
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
  backdrop.hidden=!open;
  sidebar.inert=mobile.matches&&!open;
  document.body.classList.toggle('sidebar-visible',open);
  if(open&&!wasOpen)nav.querySelector('.active')?.focus();
  wasOpen=open;
  for(const button of nav.querySelectorAll('[data-view]')){
    if(button.classList.contains('active'))button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  }
}
function closeSidebar(){sidebar.classList.remove('open');syncSidebar();toggle.focus();}
toggle.onclick=()=>{sidebar.classList.toggle('open');syncSidebar();};
backdrop.onclick=closeSidebar;
mobile.addEventListener('change',syncSidebar);
new MutationObserver(syncSidebar).observe(sidebar,{attributes:true,subtree:true,attributeFilter:['class']});
syncSidebar();

let controlId=0;
function enhance(scope){
  for(const field of scope.querySelectorAll('.field')){
    const label=field.querySelector('label');
    const control=field.querySelector('input:not([type=hidden]),textarea,select');
    if(!label||!control||label.contains(control))continue;
    if(!control.id)control.id=`qp-control-${++controlId}`;
    if(!label.htmlFor)label.htmlFor=control.id;
    if(!control.getAttribute('aria-label')&&!control.getAttribute('aria-labelledby'))control.setAttribute('aria-label',label.textContent.trim());
  }
  for(const row of scope.querySelectorAll('.field-row')){
    const input=row.querySelector('.toggle input');
    if(input&&!input.hasAttribute('aria-label'))input.setAttribute('aria-label',row.firstElementChild.textContent.trim());
  }
  for(const button of scope.querySelectorAll('[data-editor-tab],[data-metric-period]'))button.setAttribute('aria-pressed',String(button.classList.contains('active')));
  for(const question of scope.querySelectorAll('.question-block')){
    question.tabIndex=0;
    question.setAttribute('role','button');
    question.setAttribute('aria-pressed',String(question.classList.contains('selected')));
  }
  for(const button of scope.querySelectorAll('.modal-head .icon-button'))if(!button.hasAttribute('aria-label'))button.setAttribute('aria-label','Fechar');
}
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance(app);enhance(modalRoot);syncDialog();});}
new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
new MutationObserver(schedule).observe(modalRoot,{childList:true,subtree:true});
app.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target.matches('.question-block')){event.preventDefault();event.target.click();}});
let dialog=null,returnFocus=null;
const inertBefore=new Map();
const focusable=scope=>[...scope.querySelectorAll('button,a[href],input,textarea,select,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
function syncDialog(){
  const next=modalRoot.querySelector('.modal');
  if(next===dialog)return;
  if(!dialog&&next){
    returnFocus=document.activeElement;
    for(const el of document.querySelectorAll('.app-shell')){inertBefore.set(el,el.inert);el.inert=true;}
  }
  dialog=next;
  if(dialog){
    dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
    const heading=dialog.querySelector('.modal-head strong');
    if(heading){if(!heading.id)heading.id=`qp-dialog-${++controlId}`;dialog.setAttribute('aria-labelledby',heading.id);}
    dialog.tabIndex=-1;
    (focusable(dialog)[0]||dialog).focus();
  }else{
    for(const [el,value] of inertBefore)el.inert=value;
    inertBefore.clear();
    if(returnFocus?.isConnected)returnFocus.focus();
    returnFocus=null;
  }
}
document.addEventListener('keydown',event=>{
  const scope=dialog||(mobile.matches&&wasOpen?sidebar:null);
  if(event.key==='Escape'){
    if(dialog){
      // Login has no close control and must remain protected.
      const close=dialog.querySelector('[data-close],[data-close-preview],[data-close-template],[data-close-profile],[data-close-contact]');
      close?.click();
    }else if(wasOpen)closeSidebar();
    document.getElementById('qpAccountMenu')?.remove();
    return;
  }
  if(event.key!=='Tab'||!scope)return;
  const items=focusable(scope),first=items[0],last=items.at(-1);
  if(!first){event.preventDefault();scope.focus();return;}
  if(event.shiftKey&&(document.activeElement===first||!scope.contains(document.activeElement))){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&(document.activeElement===last||!scope.contains(document.activeElement))){event.preventDefault();first.focus();}
});
schedule();
