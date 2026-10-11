/* DailyGlow 3.0 — browser-only Supabase Auth and per-user cloud storage.
   Publishable key is public; private data is protected by server-side RLS policies.
   Run supabase-setup.sql before using cloud storage. */
(()=>{
'use strict';
const URL='https://qiblcmoqjxgolakdrgpx.supabase.co';
const KEY='sb_publishable_2KFMcImwhM4W3Y8symtolg_uKFxjJAE';
const AUTH_KEY='dailyglow-auth-v3';
const $=id=>document.getElementById(id);
let session=null, user=null, pending=false, timer=null, ready=false;
const message=t=>{$('authMessage').textContent=t};
const token=()=>session?.access_token||'';
async function api(path,{method='GET',body,authenticated=false,prefer}={}){
 const headers={'apikey':KEY,'Content-Type':'application/json'};
 if(authenticated){if(!token())throw Error('Please log in again.');headers.Authorization='Bearer '+token()}
 if(prefer)headers.Prefer=prefer;
 const res=await fetch(URL+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const txt=await res.text();let json;try{json=txt?JSON.parse(txt):null}catch{json=null}
 if(!res.ok)throw Error(json?.msg||json?.error_description||json?.message||json?.error||'Request failed ('+res.status+')');
 return json;
}
const auth=(path,body)=>api('/auth/v1/'+path,{method:'POST',body});
function validPayload(p){return p&&Array.isArray(p.habits)&&p.habits.every(h=>typeof h.id==='string'&&typeof h.name==='string')&&p.done&&typeof p.done==='object'&&!Array.isArray(p.done)&&p.moods&&typeof p.moods==='object'&&!Array.isArray(p.moods)}
function currentPayload(){return JSON.parse(JSON.stringify(data))}
function display(){
 const logged=!!user;
 $('authLoggedOut').hidden=logged;$('authLoggedIn').hidden=!logged;
 $('authIdentity').textContent=logged?'Signed in as '+user.email:'';
 $('accountState').textContent=logged?'Cloud account · '+(ready?'Changes sync automatically':'Checking cloud storage…'):'Guest mode · progress is saved on this device';
}
async function refresh(){
 if(!session?.refresh_token)return false;
 try{const s=await auth('token?grant_type=refresh_token',{refresh_token:session.refresh_token});if(!s?.access_token)throw Error('Session expired');session=s;localStorage.setItem(AUTH_KEY,JSON.stringify(s));user=s.user;return true}catch{session=null;user=null;localStorage.removeItem(AUTH_KEY);return false}
}
async function ensureSession(){
 if(!session)return false;
 if(session.expires_at&&Date.now()/1000>session.expires_at-60)return refresh();
 return true;
}
async function readCloud(){
 await ensureSession();if(!user)throw Error('Please log in again');
 const rows=await api('/rest/v1/dailyglow_profiles?select=payload&user_id=eq.'+encodeURIComponent(user.id),{authenticated:true});
 return rows?.[0]?.payload||null;
}
async function writeCloud(){
 if(!user||!ready)return;
 if(!await ensureSession())throw Error('Session expired. Please log in again.');
 await api('/rest/v1/dailyglow_profiles?on_conflict=user_id',{method:'POST',authenticated:true,prefer:'resolution=merge-duplicates,return=minimal',body:{user_id:user.id,payload:currentPayload(),updated_at:new Date().toISOString()}});
}
async function sync(){if(!user||!ready||pending)return;pending=true;try{await writeCloud();message('✓ Your progress is saved in the cloud.')}catch(e){message('Cloud save failed: '+e.message+'. Your changes may not sync; export a backup before leaving.')}finally{pending=false}}
window.dailyglowCloudSave=undefined;
function scheduleSave(){if(!user||!ready)return;clearTimeout(timer);timer=setTimeout(sync,900)}
async function loadAccount(){
 ready=false;display();$('uploadGuest').hidden=true;
 try{
  const cloud=await readCloud();
  if(cloud&&validPayload(cloud)){data=cloud;render();ready=true;window.dailyglowCloudSave=scheduleSave;message('✓ Your cloud progress is loaded.')}
  else if(cloud){throw Error('Cloud data format is not recognized. Nothing was overwritten.')}
  else {message('Your account is ready. Choose “Copy device progress to cloud” to save your existing habits.');$('uploadGuest').hidden=false}
 }catch(e){message('Cloud setup not ready: '+e.message+'. Run the database setup SQL in Supabase.');}
 display();
}
async function enter(s){
 if(!s?.access_token||!s.user){message('Check your email for a confirmation link, then log in.');return}
 session=s;user=s.user;localStorage.setItem(AUTH_KEY,JSON.stringify(s));await loadAccount();
}
async function credentials(kind){
 const email=$('authEmail').value.trim(),password=$('authPassword').value;
 if(!email||!password){message('Enter your email and password.');return}
 if(password.length<6){message('Use a password with at least 6 characters.');return}
 message('Connecting securely…');
 try{const s=await auth(kind==='signup'?'signup':'token?grant_type=password',{email,password});await enter(s)}catch(e){message(e.message)}
}
$('signUp').addEventListener('click',()=>credentials('signup'));
$('signIn').addEventListener('click',()=>credentials('login'));
$('resetPassword').addEventListener('click',async()=>{
 const email=$('authEmail').value.trim();if(!email){message('Enter your email address first.');return}
 try{await auth('recover',{email});message('If this email has an account, a password-reset email will be sent.')}catch(e){message(e.message)}
});
$('uploadGuest').addEventListener('click',async()=>{
 if(!user||ready)return;
 if(!confirm('Copy your current device habits and moods to your cloud account?'))return;
 ready=true;window.dailyglowCloudSave=scheduleSave;
 try{await writeCloud();$('uploadGuest').hidden=true;message('✓ Your device progress is now backed up to your account.')}catch(e){ready=false;window.dailyglowCloudSave=undefined;message('Cloud setup is not ready: '+e.message)}
 display();
});
$('signOut').addEventListener('click',async()=>{
 if(!confirm('Log out? Your account data will remain in the cloud if it was synced.'))return;
 if(timer){clearTimeout(timer);timer=null}
 if(ready){try{await writeCloud()}catch(e){message('Could not save cloud changes. Please try again before logging out.');return}}
 const old=token();session=null;user=null;ready=false;window.dailyglowCloudSave=undefined;localStorage.removeItem(AUTH_KEY);
 try{if(old)await fetch(URL+'/auth/v1/logout',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+old}})}catch{}
 try{const guest=JSON.parse(localStorage.getItem('dailyglow-data-v1'));data=validPayload(guest)?guest:defaults()}catch{data=defaults()}
 render();display();message('Logged out. Your guest progress is available on this device.');
});
try{const stored=JSON.parse(localStorage.getItem(AUTH_KEY));if(stored?.access_token){session=stored;user=stored.user}}catch{}
display();if(session)loadAccount();
})();
