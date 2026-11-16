(function(){var b=document.body,api=b.dataset.api,slug=b.dataset.slug,q=new URLSearchParams(location.search),v=(q.get('v')||'').toUpperCase().slice(0,1),src=(q.get('e')||'').toUpperCase().slice(0,2);
function beacon(e){try{var d=JSON.stringify({s:slug,e:e,v:v,src:src});if(navigator.sendBeacon){navigator.sendBeacon(api+'/event',new Blob([d],{type:'text/plain'}))}else{fetch(api+'/event',{method:'POST',body:d,keepalive:true,headers:{'content-type':'application/json'}})}}catch(x){}}
if(!/bot|crawl|spider|headless/i.test(navigator.userAgent))beacon('view');
document.querySelectorAll('[data-cta]').forEach(function(a){a.addEventListener('click',function(){beacon('cta')})});
var f=document.getElementById('leadform'),m=f.querySelector('.msg');f.v.value=v;
f.addEventListener('submit',function(ev){ev.preventDefault();m.className='msg';
if(!f.name.value.trim()||!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(f.email.value)||!f.consent.checked){m.textContent='Bitte Name, gültige E-Mail und Einverständnis angeben.';m.className='msg err';return}
var btn=f.querySelector('button');btn.disabled=true;m.textContent='Wird gesendet …';
fetch(api+'/lead',{method:'POST',body:new FormData(f)}).then(function(r){return r.json().then(function(j){return{r:r,j:j}})}).then(function(x){
if(x.r.ok&&x.j.ok){f.querySelectorAll('input,button').forEach(function(i){i.disabled=true});m.textContent='Danke! Die Unterlagen sind unterwegs. Bitte prüfen Sie Ihr Postfach (auch den Spam-Ordner).';m.className='msg ok'}
else{btn.disabled=false;m.textContent='Das hat nicht geklappt. Bitte prüfen Sie Ihre Angaben oder schreiben Sie an gregor@swiss.ai.';m.className='msg err'}})
.catch(function(){btn.disabled=false;m.textContent='Keine Verbindung. Bitte später erneut versuchen oder an gregor@swiss.ai schreiben.';m.className='msg err'})})})();
