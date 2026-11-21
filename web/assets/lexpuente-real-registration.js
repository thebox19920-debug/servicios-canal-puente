(()=>{'use strict';const $=id=>document.getElementById(id),form=$('portal-invite'),pad=$('portal-real-pad');if(!form||!pad)return;const ctx=pad.getContext('2d');let lines=[],line=null,accepted=false;ctx.strokeStyle='#123b2d';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';
function notify(text){$('portal-real-sign-feedback').textContent=text;$('portal-invite-status').textContent=text}
function invalidate(){accepted=false;lines=[];ctx.clearRect(0,0,900,220);$('portal-real-drawing-status').textContent='Pendiente de dibujo.';$('portal-real-consent').checked=false}
function point(e){const r=pad.getBoundingClientRect();return [Math.round(Math.max(0,Math.min(900,(e.clientX-r.left)*900/r.width))),Math.round(Math.max(0,Math.min(220,(e.clientY-r.top)*220/r.height)))]}
pad.addEventListener('pointerdown',e=>{if(e.button!==0||lines.length>=100)return;e.preventDefault();try{pad.setPointerCapture(e.pointerId)}catch{}line=[point(e)];lines.push(line);ctx.beginPath();ctx.moveTo(...line[0]);accepted=false});pad.addEventListener('pointermove',e=>{if(!line)return;e.preventDefault();if(lines.reduce((n,l)=>n+l.length,0)>=4000)return;const p=point(e);line.push(p);ctx.lineTo(...p);ctx.stroke()});for(const name of ['pointerup','pointercancel'])pad.addEventListener(name,()=>{line=null;$('portal-real-drawing-status').textContent='Dibujo recibido. Pulsa «Activar y guardar mi firma» para enviarlo.'});
$('portal-real-clear').onclick=()=>{invalidate();notify('Firma borrada. Puedes dibujarla otra vez.')};
$('portal-prepare-signing').onclick=()=>{$('portal-real-signature').hidden=false;$('portal-real-signer').value=form.elements.founderName.value;const data={};for(const e of form.elements)if(e.name&&e.type!=='file')data[e.name]=e.type==='checkbox'?e.checked:e.value;const doc=window.lexpuenteDocuments?.signingDocument(data);notify(doc&&!doc.pricesConfigured?'FALTA COMPLETAR EL CATÁLOGO UNIFORME DE PRECIOS DE ESTA ÁREA. Puedes dibujar, pero el contrato no podrá firmarse hasta completar ese anexo. La ficha sí puede registrarse pendiente de aprobación.':'Dibuja en el recuadro dorado y pulsa «Activar y guardar mi firma».');$('portal-real-signature').scrollIntoView({block:'start',behavior:'auto'})};
form.addEventListener('input',e=>{if(e.target.name&&!$('portal-test-mode')?.checked){const had=accepted||lines.length;invalidate();if(had)notify('Los datos del contrato han cambiado. Firma de nuevo esta versión.')}});
$('portal-real-sign-submit').onclick=async()=>{const b=$('portal-real-sign-submit');if(b.disabled)return;if(!lines.length){notify('Falta el dibujo de tu firma. Dibuja dentro del recuadro dorado.');return}if(!$('portal-real-consent').checked){notify('Marca que has leído y aceptas el contrato antes de activar tu firma.');return}if(!form.reportValidity()){notify('Completa los datos obligatorios señalados en la ficha. Tu firma todavía no está guardada.');return}b.disabled=true;notify('Guardando y comprobando tu firma…');try{const flow=window.lexpuenteRealRegistration,input=await flow.saveSpecialist(),d=await flow.api('admin/signing/create',input),doc=await flow.api('signing/'+d.id);await flow.api('signing/'+d.id+'/sign',{name:$('portal-real-signer').value.trim(),accepted:true,documentHash:doc.documentHash,strokes:lines});accepted=true;notify('✓ Tu firma SCP se ha guardado correctamente. Falta la firma del especialista desde su cuenta.');const box=$('portal-signing-result');box.replaceChildren();const label=document.createElement('label'),url=document.createElement('input');label.textContent='Enlace privado para que firme este especialista';url.readOnly=true;url.value=new URL(d.url,location.origin).href;label.append(url);box.append(label)}catch(e){notify('NO SE HA GUARDADO LA FIRMA: '+e.message)}finally{b.disabled=false;$('portal-real-sign-feedback').scrollIntoView({block:'center',behavior:'auto'})}};
window.lexpuenteRegistrationSaved=input=>{
 const box=$('portal-real-registration-result');
 box.replaceChildren();
 const heading=document.createElement('h2');heading.textContent='Usuario Especialista registrado correctamente';
 const name=document.createElement('p');name.textContent=(input.name||'')+' · '+(input.email||'');
 const state=document.createElement('p');state.textContent='DADO DE ALTA · ACCESO HABILITADO. El alta realizada por ti ya está aprobada.';
 const signature=document.createElement('p');signature.textContent='Contrato firmado y acreditaciones comprobados para completar el alta.';
 const credentials=document.createElement('section');credentials.className='portal-item';
 const credentialsHeading=document.createElement('h3');credentialsHeading.textContent='Datos de acceso';
 const username=document.createElement('p');username.textContent='Usuario: '+(input.email||'');
 const password=document.createElement('p');password.textContent='Contraseña: no hay una contraseña local de SCP. El especialista inicia sesión con ChatGPT usando este mismo correo.';
 const loginUrl=new URL('/iniciar-sesion.html',location.origin).href;
 const login=document.createElement('p');login.textContent='Enlace para iniciar sesión: '+loginUrl;
 credentials.append(credentialsHeading,username,password,login);
 const note=document.createElement('p');note.setAttribute('role','status');note.textContent='El envío automático de correos aún no está conectado. Puedes preparar el mensaje desde aquí; se abrirá la aplicación de correo para que lo envíes.';
 const actions=document.createElement('div');actions.className='portal-actions';
 const openProfile=document.createElement('button');openProfile.type='button';openProfile.textContent='Abrir ficha y gestión de este Usuario Especialista';
 openProfile.onclick=()=>{
  const target=$('portal-active-specialists');if(!target)return;
  const card=[...target.querySelectorAll('[data-specialist-email]')].find(el=>el.dataset.specialistEmail===input.email);
  const section=target.closest('details');if(section)section.open=true;
  if(card){
   const profilePanel=card.querySelector('details');if(profilePanel)profilePanel.open=true;
   card.classList.add('portal-item-highlight');card.tabIndex=-1;card.focus({preventScroll:true});
   card.scrollIntoView({block:'center',behavior:'smooth'});
   setTimeout(()=>card.classList.remove('portal-item-highlight'),3000);
  }else target.scrollIntoView({block:'start',behavior:'smooth'});
 };
 const copyLogin=document.createElement('button');copyLogin.type='button';copyLogin.textContent='Copiar enlace de acceso';
 copyLogin.onclick=async()=>{try{await navigator.clipboard.writeText(loginUrl);copyLogin.textContent='Enlace copiado'}catch{window.prompt('Copia este enlace de acceso:',loginUrl)}};
 const prepareEmail=document.createElement('a');prepareEmail.className='button';prepareEmail.textContent='Preparar correo de acceso';
 prepareEmail.href='mailto:'+encodeURIComponent(input.email||'')+'?subject='+encodeURIComponent('Acceso a SCP')+'&body='+encodeURIComponent('Hola '+(input.name||'')+',\n\nTu cuenta de Usuario Especialista de SCP ya está dada de alta. Para entrar, inicia sesión con ChatGPT usando este correo: '+(input.email||'')+'.\n\nEnlace de acceso: '+loginUrl+'\n\nSSP');
 actions.append(openProfile,copyLogin,prepareEmail);box.append(heading,name,state,signature,credentials,note,actions);
 form.hidden=true;box.hidden=false;box.tabIndex=-1;box.focus({preventScroll:true});box.scrollIntoView({block:'start',behavior:'smooth'});
};
})();
