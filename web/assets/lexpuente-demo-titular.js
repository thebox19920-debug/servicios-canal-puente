(()=>{'use strict';
const form=document.getElementById('holder-test-form'),status=document.getElementById('holder-test-status'),result=document.getElementById('holder-test-result');
if(!form)return;
form.addEventListener('submit',async event=>{
 event.preventDefault();const button=form.querySelector('button[type="submit"]');button.disabled=true;status.textContent='Guardando el Usuario Titular ficticio…';result.hidden=true;
 try{
  const data=Object.fromEntries(new FormData(form).entries());
  const auth=await window.SCP_SUPABASE?.auth.getSession(),token=auth?.data?.session?.access_token;if(!token)throw Error('Vuelve a entrar por /butaina para autorizar esta prueba.');const response=await fetch('/api/portal/admin/test-accounts',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({profileType:'titular',data})});
  const payload=await response.json();if(!response.ok)throw Error(payload.error||'No se pudo guardar la prueba.');
  form.hidden=true;status.textContent='';result.replaceChildren();
  const heading=document.createElement('h3');heading.textContent='Usuario Titular de prueba registrado';
  const text=document.createElement('p');text.textContent='Guarda estas claves para entrar. Esta cuenta solo contiene datos ficticios y está separada de las cuentas reales.';
  const username=document.createElement('p');username.textContent='Usuario: '+payload.username;
  const password=document.createElement('p');password.textContent='Contraseña: '+payload.password;
  const panel=document.createElement('a');panel.className='lp-entry-button';panel.href=payload.panel;panel.textContent='Entrar al panel de este Usuario Titular';
  const another=document.createElement('a');another.className='lp-back-link';another.href='/prueba-alta-titular.html';another.textContent='Crear otra prueba';
  result.append(heading,text,username,password,panel,another);result.hidden=false;result.scrollIntoView({behavior:'smooth',block:'center'});
 }catch(error){status.textContent=error.message}finally{button.disabled=false}
});
})();
