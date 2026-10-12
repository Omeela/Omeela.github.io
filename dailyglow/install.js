/* DailyGlow install experience: no app-store listing required. */
(()=> {
 let pending=null;
 const btn=document.getElementById('installDailyGlow');
 const note=document.getElementById('installDailyGlowHelp');
 if(!btn||!note)return;
 const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
 function render(){
  if(standalone()){btn.hidden=true;note.textContent='DailyGlow is installed on this device.';return}
  btn.hidden=false;
  if(ios){btn.textContent='Install on iPhone / iPad';note.textContent='In Safari, tap Share, then Add to Home Screen, then Add.'}
  else if(pending){btn.textContent='Install DailyGlow';note.textContent='Install DailyGlow to launch it from your phone Home Screen.'}
  else {btn.textContent='Install DailyGlow';note.textContent='Android: open this page in Chrome, tap the browser menu (⋮), then Install app or Add to Home screen. On iPhone, use Safari → Share → Add to Home Screen.'}
 }
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pending=event;render()});
 window.addEventListener('appinstalled',()=>{pending=null;render()});
 btn.addEventListener('click',async()=>{
  if(standalone())return;
  if(pending){const prompt=pending;pending=null;await prompt.prompt();await prompt.userChoice;render();return}
  note.textContent=ios?'In Safari: tap Share (square with arrow), choose Add to Home Screen, then Add.': 'In Chrome: tap the three-dot menu (⋮), choose Install app or Add to Home screen. If you are using an in-app browser, open this page in Chrome or Safari.';
 });
 render();
})();
