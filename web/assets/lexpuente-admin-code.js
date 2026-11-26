(()=>{'use strict';
const $=id=>document.getElementById(id),status=$('code-status'),codeForm=$('code-form'),signin=$('code-signin'),main=document.querySelector('main');
if(!status||!codeForm)return;
const db=window.SCP_SUPABASE;
if(signin)signin.hidden=true;
function message(text){status.textContent=text}
function sessionToken(){return db?.auth.getSession().then(({data})=>data?.session?.access_token||'')||Promise.resolve('')}
async function verifyAccount(){
 const token=await sessionToken();
 if(!token){showLogin();return}
 const response=await fetch('/api/portal/me',{headers:{Authorization:'Bearer '+token},cache:'no-store',credentials:'same-origin'});
 const data=await response.json();
 if(response.status===401){showLogin();message('Inicia sesión con tu cuenta SCP para continuar.');return}
 if(!response.ok)throw Error(data.error||'No se pudo comprobar la cuenta.');
 if(!data.admin){codeForm.hidden=true;message('Esta cuenta no tiene permisos de Administración SCP.');return}
 codeForm.hidden=false;message('Cuenta autorizada. Introduce tu código de acceso SCP.');
}
function showLogin(){
 codeForm.hidden=true;
 if(!main||main.querySelector('#scp-admin-login'))return;
 const box=document.createElement('form');box.id='scp-admin-login';box.className='notice';
 const emailLabel=document.createElement('label');emailLabel.textContent='Correo electrónico';
 const email=document.createElement('input');email.type='email';email.name='email';email.autocomplete='username';email.required=true;emailLabel.append(email);
 const passLabel=document.createElement('label');passLabel.textContent='Contraseña';
 const pass=document.createElement('input');pass.type='password';pass.name='password';pass.autocomplete='current-password';pass.required=true;passLabel.append(pass);
 const button=document.createElement('button');button.type='submit';button.textContent='Iniciar sesión';
 box.append(emailLabel,passLabel,button);main.insertBefore(box,codeForm);
 box.addEventListener('submit',async event=>{event.preventDefault();button.disabled=true;message('Verificando tu cuenta SCP…');try{if(!db)throw Error('No se pudo cargar la conexión con Supabase.');const {error}=await db.auth.signInWithPassword({email:email.value.trim().toLowerCase(),password:pass.value});if(error)throw error;box.remove();await verifyAccount()}catch(error){message(error.message||'No se pudo iniciar sesión.')}finally{button.disabled=false}});
}
verifyAccount().catch(error=>message(error.message||'No se pudo comprobar la cuenta.'));
codeForm.addEventListener('submit',async event=>{event.preventDefault();const button=codeForm.querySelector('button');button.disabled=true;try{const token=await sessionToken();if(!token)throw Error('La sesión ha caducado. Inicia sesión de nuevo.');const response=await fetch('/api/portal/admin/unlock',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({code:codeForm.elements.code.value})});codeForm.elements.code.value='';const data=await response.json();if(!response.ok)throw Error(data.error||'No se pudo verificar el código.');location.replace('/administracion.html')}catch(error){message(error.message||'No se pudo verificar el código.')}finally{button.disabled=false}});
})();