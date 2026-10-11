/* DailyGlow Plus: server-verified access to expanded insights. */
(()=>{'use strict';
const root=document.getElementById('plusFeatures');if(!root)return;
const api='https://qiblcmoqjxgolakdrgpx.supabase.co/rest/v1/dailyglow_subscriptions';
const key='sb_publishable_2KFMcImwhM4W3Y8symtolg_uKFxjJAE';
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function insights(){
 const now=new Date(),weeks=[];
 for(let w=7;w>=0;w--){let total=0,days=0,moods={};for(let i=0;i<7;i++){const d=new Date(now);d.setHours(12,0,0,0);d.setDate(d.getDate()-w*7-i);const k=iso(d),n=(data.done[k]||[]).length;total+=n;if(n)days++;const m=data.moods[k]?.mood;if(m)moods[m]=(moods[m]||0)+1}weeks.push({total,days,moods})}
 const totals=weeks.map(w=>w.total),max=Math.max(1,...totals);
 root.innerHTML='<h3>✨ Your Plus insights</h3><p>Eight weeks of habit activity</p><div style="display:flex;align-items:end;gap:6px;height:125px;margin:18px 0" role="img" aria-label="Eight weeks of completed habits">'+totals.map((n,i)=>'<div style="flex:1;text-align:center"><div style="height:'+Math.max(4,Math.round(95*n/max))+'px;background:#9670cc;border-radius:7px 7px 0 0"></div><small>W'+(i+1)+'</small></div>').join('')+'</div><p><strong>'+totals.reduce((a,b)=>a+b,0)+'</strong> completed habits across 8 weeks · <strong>'+weeks.reduce((a,w)=>a+w.days,0)+'</strong> active days</p><p>Most recent week: <strong>'+weeks[7].total+'</strong> completions. Previous week: <strong>'+weeks[6].total+'</strong>.</p><p>Keep showing up for yourself, one day at a time ♡</p>';
}
async function check(){
 let session;try{session=JSON.parse(localStorage.getItem('dailyglow-auth-v3')||'null')}catch{}
 if(!session?.access_token||!session?.user?.id){root.textContent='Log in to see your Plus membership and extended insights.';return}
 root.textContent='Checking Plus membership…';
 try{const url=api+'?select=status&user_id=eq.'+encodeURIComponent(session.user.id);
 const res=await fetch(url,{headers:{apikey:key,Authorization:'Bearer '+session.access_token}});
 if(!res.ok)throw Error('Unable to verify membership');
 const rows=await res.json();if(!rows.some(x=>['active','trialing'].includes(x.status))){root.textContent='Plus insights unlock after an active subscription is verified.';return}
 insights();
 }catch{root.textContent='Could not verify Plus membership. Log in again and retry.'}
}
document.querySelector('[data-tab="plus"]')?.addEventListener('click',()=>setTimeout(check,100));
document.getElementById('signIn')?.addEventListener('click',()=>setTimeout(check,1200));
document.getElementById('signOut')?.addEventListener('click',()=>setTimeout(check,100));
if(new URLSearchParams(location.search).get('checkout')==='success')setTimeout(check,1200);
check();
})();