// Bannière d'installation (PWA) : Android/Chrome = bouton natif, iPhone/iPad = instructions, navigateurs intégrés = conseil.
(()=>{
 const banner=document.getElementById('ccInstall');
 if(!banner)return;
 const KEY='ccInstallDismissedUntil',DAY=864e5,DELAY=2500;
 const text=banner.querySelector('[data-install-text]');
 const action=banner.querySelector('[data-install-action]');
 const close=banner.querySelector('[data-install-close]');
 const ua=navigator.userAgent||'';
 const mobile=/android|iphone|ipad|ipod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const ios=/iphone|ipad|ipod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const inApp=/FBAN|FBAV|Instagram|Snapchat|TikTok|Line\/|; wv\)/i.test(ua);
 const store={
  get(){try{return localStorage.getItem(KEY)}catch(e){return null}},
  set(v){try{localStorage.setItem(KEY,String(v))}catch(e){}}
 };
 const standalone=()=>(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true;
 const dismissed=()=>{
  const until=Number(store.get());
  if(until-Date.now()>4*DAY){store.set(0);return false} // anciennes valeurs (14 jours / 1 an) : ignorées
  return until>Date.now();
 };
 const SHARE='<svg class="cc-install-share" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3m0 0L8 7m4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>';
 let deferred=null,visible=false,timer=null;

 function show(mode){
  if(visible||standalone()||dismissed())return;
  if(mode==='native'){text.textContent='Ajoutez la carte à votre écran d’accueil.';action.hidden=false}
  else if(mode==='ios'){text.innerHTML='Touchez '+SHARE+' Partager, puis « Sur l’écran d’accueil ».';action.hidden=true}
  else{text.textContent='Ouvrez ce lien dans Safari ou Chrome pour installer l’application.';action.hidden=true}
  visible=true;
  banner.hidden=false;
  document.body.classList.add('cc-install-on');
  requestAnimationFrame(()=>requestAnimationFrame(()=>banner.classList.add('is-in')));
 }
 function hide(){
  if(!visible)return;
  visible=false;
  banner.classList.remove('is-in');
  document.body.classList.remove('cc-install-on');
  banner.hidden=true;
 }
 function later(mode){clearTimeout(timer);timer=setTimeout(()=>show(mode),DELAY)}

 window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  deferred=e;
  later('native');
 });
 window.addEventListener('appinstalled',()=>{
  deferred=null;
  clearTimeout(timer);
  hide();
 });
 action.addEventListener('click',async()=>{
  if(!deferred)return;
  const ev=deferred;deferred=null;
  hide();
  try{
   ev.prompt();
   const choice=await ev.userChoice;
   if(!choice||choice.outcome!=='accepted')store.set(Date.now()+DAY*3);
  }catch(e){}
 });
 close.addEventListener('click',()=>{
  store.set(Date.now()+2*DAY);
  clearTimeout(timer);
  hide();
 });

 if(mobile&&!standalone()&&!dismissed()){
  if(inApp)later('inapp');
  else if(ios)later('ios');
 }
})();
