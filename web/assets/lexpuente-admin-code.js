(()=>{'use strict';
const $=id=>document.getElementById(id),status=$('code-status'),codeForm=$('code-form'),signin=$('code-signin'),main=document.querySelector('main');
if(!status||!codeForm)return;
const db=window.SCP_SUPABASE;
const loginFormId='scp-admin-login';
function message(text){status.textContent=text}
function sessionToken(){
 if(!db?.auth?.getSession)return Promise.resolve('');
 return db.auth.getSession().then(({data})=>data?.session?.access_token||'');
}
function showLogin(text=''){
 codeForm.hidden=true;
 if(signin)signin.hidden=false;
 const existing=main?.querySelector('#'+loginFormId);
 if(existing){if(text)message(text);return}
 if(!main||!db?.auth?.signInWithPassword){
  message(text||'No se ha podido cargar el formulario automático. Usa «Iniciar sesión en SCP» para continuar.');
  return;
 }
 const box=document.createElement('form');box.id=loginFormId;box.className='notice';
 const emailLabel=document.createElement('label');emailLabel.textContent='Correo electrónico';
 const email=document.createElement('input');email.type='email';email.name='email';email.autocomplete='username';email.required=true;emailLabel.append(email);
 const passLabel=document.createElement('label');passLabel.textContent='Contraseña';
 const pass=document.createElement('input');pass.type='password';pass.name='password';pass.autocomplete='current-password';pass.required=true;passLabel.append(pass);
 const button=document.createElement('button');button.type='submit';button.textContent='Iniciar sesión';
 box.append(emailLabel,passLabel,button);main.insertBefore(box,codeForm);
 if(signin)signin.hidden=true;
 box.addEventListener('submit',async event=>{
  event.preventDefault();button.disabled=true;message('Verificando tu cuenta SCP…');
  try{
   const {error}=await db.auth.signInWithPassword({email:email.value.trim().toLowerCase(),password:pass.value});
   if(error)throw error;
   box.remove();await verifyAccount();
  }catch(error){message(error.message||'No se pudo iniciar sesión.')}
  finally{button.disabled=false}
 });
 if(text)message(text);else message('Inicia sesión con tu cuenta SCP para continuar.');
}
async function verifyAccount(){
 const token=await sessionToken();
 if(!token){showLogin();return}
 const response=await fetch('/api/portal/me?flow=reserved',{headers:{Authorization:'Bearer '+token},cache:'no-store',credentials:'same-origin'});
 const data=await response.json().catch(()=>({}));
 if(response.status===401){showLogin(data.error||'Inicia sesión con tu cuenta SCP para continuar.');return}
 if(!response.ok)throw Error(data.error||'No se pudo comprobar la cuenta. Inténtalo de nuevo.');
 if(!data.admin){codeForm.hidden=true;if(signin)signin.hidden=true;message(data.adminIssue||'Esta cuenta no tiene permisos de Administración SCP.');return}
 const login=main?.querySelector('#'+loginFormId);if(login)login.remove();
 if(signin)signin.hidden=true;
 codeForm.hidden=false;message('Cuenta autorizada. Introduce tu código de acceso SCP.');
}
verifyAccount().catch(error=>message(error.message||'No se pudo comprobar la cuenta. El enlace de inicio de sesión sigue disponible.'));
codeForm.addEventListener('submit',async event=>{
 event.preventDefault();const button=codeForm.querySelector('button');button.disabled=true;
 try{
  const token=await sessionToken();if(!token){showLogin('La sesión ha caducado. Inicia sesión de nuevo.');return}
  const response=await fetch('/api/portal/admin/unlock',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({code:codeForm.elements.code.value})});
  codeForm.elements.code.value='';const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||'No se pudo verificar el código.');
  location.replace(new URLSearchParams(location.search).get('continuar')==='prueba-alta'?'/prueba-alta.html':'/administracion.html');
 }catch(error){message(error.message||'No se pudo verificar el código.')}
 finally{button.disabled=false}
});
})();