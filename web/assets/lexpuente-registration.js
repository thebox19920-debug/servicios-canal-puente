(()=>{
if(window.SCP_SUPABASE_ENABLED)return;
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),selected=params.get('tipo');
const state=$('registration-status'),choices=$('registration-choice'),authPanel=$('registration-auth'),holderFlow=$('holder-flow'),specialistFlow=$('specialist-flow'),requestService=params.get('solicitud')==='servicio';
const typeName=t=>t==='especialista'?'Usuario Especialista':'Usuario Titular';
const safeText=(node,text)=>{node.textContent=text};
function setEntryCopy(t){const heading=$('registration-heading'),intro=$('registration-intro');if(!heading||!intro)return;if(t==='titular'){heading.textContent=requestService?'Registra tu solicitud de servicio':'Registro de Usuario Titular';intro.textContent=requestService?'Completa tus datos y cuéntanos qué servicio buscas. SCP revisará el alta y te indicará los siguientes pasos.':'Solicita el alta. Tu cuenta solo se activa cuando SCP aprueba la solicitud.'}else if(t==='especialista'){heading.textContent='Registro de Usuario Especialista';intro.textContent='Solicita el alta profesional. Tu cuenta solo se activa cuando SCP revisa y aprueba la solicitud.'}else{heading.textContent='Elige cómo registrarte';intro.textContent='Crea tu perfil de Usuario Titular para contratar servicios o presenta tu actividad para colaborar con SCP.'}}
function showChoice(){setEntryCopy('');choices.hidden=false;authPanel.hidden=true;holderFlow.hidden=true;specialistFlow.hidden=true;state.textContent='';}
function showFlow(t){choices.hidden=true;authPanel.hidden=true;holderFlow.hidden=t!=='titular';specialistFlow.hidden=t!=='especialista';}
function signInUrl(){return '/signin-with-chatgpt?return_to='+encodeURIComponent(location.pathname+location.search)}
function setResult(target,title,body,linkText,href){target.replaceChildren();const h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=body;target.append(h,p);if(linkText&&href){const a=document.createElement('a');a.href=href;a.textContent=linkText;target.append(a)}target.hidden=false}
async function request(path,body,options={}){const headers={...(options.headers||{})};if(body&&!(body instanceof File)){headers['Content-Type']='application/json'}const response=await fetch('/api/portal/'+path,{method:options.method|| (body?'POST':'GET'),credentials:'same-origin',cache:'no-store',headers,body:body instanceof File?body:body?JSON.stringify(body):undefined});let data={};try{data=await response.json()}catch{}if(!response.ok)throw new Error(data.error||'No se ha podido guardar la solicitud.');return data}
function formValues(form){const data={};for(const [key,value] of new FormData(form).entries())if(typeof value==='string')data[key]=value.trim();return data}
function fill(form,data){if(!data)return;for(const [key,value]of Object.entries(data)){const el=form.elements[key];if(el&&el.type!=='file'&&el.type!=='checkbox')el.value=String(value??'');if(el?.type==='checkbox')el.checked=!!value}}
function statusMessage(text){state.textContent=text}
async function begin(t){
 if(!['titular','especialista'].includes(t)){showChoice();return}
 setEntryCopy(t);showFlow(t);const serviceFields=$('holder-service-request');if(serviceFields){serviceFields.hidden=!(t==='titular'&&requestService);for(const name of ['interestArea','requestSummary'])holderFlow.querySelector('[name="'+name+'"]').required=t==='titular'&&requestService} $('registration-assurance').hidden=true;$('registration-security-note').hidden=true;const signin=$('registration-signin');signin.href=signInUrl();
 try{
  const me=await request('me');
  if(me.admin){setResult(t==='titular'?$('holder-result'):$('specialist-result'),'Sesión de administración activa','Esta cuenta está reservada a la administración de SCP.','Ir a mi administración','/acceso-scp.html');return}
  const profile=me.profile;
  if(profile&&profile.role!==(t==='titular'?'client':'collaborator')){authPanel.hidden=false;holderFlow.hidden=true;specialistFlow.hidden=true;signin.hidden=true;setResult($('registration-auth'),'Esta cuenta ya tiene otro perfil','Para mantener cada expediente separado, esta cuenta no puede cambiar de perfil desde este formulario. Contacta con SCP si necesitas solicitar un segundo perfil.','Volver a elegir','/registro.html');return}
  authPanel.hidden=true;
  const form=t==='titular'?$('holder-application'):$('specialist-application');form.hidden=false;
  const emailTarget=t==='titular'?'holder-account-email':'specialist-account-email';safeText($(emailTarget),'Cuenta identificada: '+me.identity.email);
  if(me.application?.profileType===t)fill(form,me.application.fields);
  if(profile?.status==='active'){
   form.hidden=true;setResult(t==='titular'?$('holder-result'):$('specialist-result'),'Tu perfil ya está activo','Ya puedes acceder a las funciones disponibles para tu cuenta.','Ir a Mi cuenta SCP','/mi-cuenta.html?perfil='+t);
  }else if(profile?.status==='pending'){
   statusMessage('Tu solicitud ya aparece como pendiente de revisión. Puedes completar o actualizar los datos y documentos antes de que se revise.');
  }else statusMessage('Completa los datos para enviar tu solicitud.');
 }catch(error){
  if(/Inicia sesión|acceder/i.test(error.message)||error.message.includes('no disponible')){authPanel.hidden=false;holderFlow.hidden=true;specialistFlow.hidden=true;signin.hidden=false;statusMessage('Identifícate con ChatGPT y volverás aquí para completar tu perfil SCP.');}
  else{statusMessage(error.message);}
 }
}
async function submitHolder(event){event.preventDefault();const form=event.currentTarget;const button=form.querySelector('button[type="submit"]');button.disabled=true;statusMessage('Enviando tu solicitud…');try{const fields=formValues(form);const result=await request('register',{profileType:'titular',privacyRead:form.elements.privacyRead.checked,requestService,fields});form.hidden=true;const message=requestService?`Referencia ${result.applicationId}. Guardamos tu solicitud inicial de servicio y tu perfil de Usuario Titular. SCP revisará el alta y la petición; el envío no confirma una contratación ni genera un pago. Consulta el estado desde tu cuenta SCP.`:`Referencia ${result.applicationId}. Tu perfil está pendiente de revisión manual. El plazo objetivo es de hasta 48 horas laborables. Recibirás el resultado al volver a entrar en esta cuenta. El envío no compra ni cobra ningún servicio.`;setResult($('holder-result'),requestService?'Solicitud de servicio recibida':'Solicitud de cuenta recibida',message,'Entrar en Mi cuenta SCP','/mi-cuenta.html?perfil=titular');statusMessage(requestService?'Solicitud de servicio y de Usuario Titular enviada.':'Solicitud de Usuario Titular enviada.');}catch(error){statusMessage(error.message)}finally{button.disabled=false}}
async function submitSpecialist(event){event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]');button.disabled=true;statusMessage('Guardando la solicitud y los documentos…');try{
 const fields=formValues(form);fields.registrationRequired=form.elements.registrationRequired.checked;fields.requiresLicense=form.elements.requiresLicense.checked;
 const files=[['qualificationFile','qualification'],['authorizationFile','authorization'],['insuranceFile','insurance'],['licenseFile','license'],['identityFile','identity'],['businessFile','business']];
 const uploadList=[];for(const [name,kind]of files){const file=form.elements[name].files[0];if(!file){if(['qualification','authorization','insurance'].includes(kind))throw new Error('Adjunta el título o acreditación, la autorización o justificante y el seguro profesional.');if(kind==='license'&&fields.requiresLicense)throw new Error('Adjunta la licencia o inscripción que exige la actividad.');continue}if(file.type!=='application/pdf'||file.size>8*1024*1024)throw new Error('Cada documento debe ser un PDF de hasta 8 MB.');uploadList.push([file,kind]);}
 const result=await request('register',{profileType:'especialista',privacyRead:form.elements.privacyRead.checked,fields});
 for(const [file,kind]of uploadList)await request('application-documents?kind='+encodeURIComponent(kind),file,{method:'POST',headers:{'Content-Type':'application/pdf'}});
 form.hidden=true;setResult($('specialist-result'),'Solicitud de colaboración recibida',`Referencia ${result.applicationId}. Tu expediente queda pendiente de revisión. SCP comprobará los datos, la habilitación profesional, el negocio y el seguro antes de activar el perfil. El plazo objetivo es de hasta 48 horas laborables. El contrato y el alta definitiva se completan después de la revisión.`,'Consultar el estado de mi cuenta','/mi-cuenta.html?perfil=especialista');statusMessage('Solicitud de Usuario Especialista enviada.');
 }catch(error){statusMessage(error.message+' Si la solicitud ya se guardó, vuelve a intentarlo para completar los documentos pendientes.')}finally{button.disabled=false}}
$('holder-application').addEventListener('submit',submitHolder);$('specialist-application').addEventListener('submit',submitSpecialist);
if(selected)begin(selected);else location.replace('/registrarme.html');
})();
