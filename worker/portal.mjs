import {testAdminApi} from './test-accounts.mjs';
import {signingApi,signingList} from './signing.mjs';
import {createContractDraft,saveContractDraft} from './contract-templates.mjs';
import {adminUnlocked,adminUnlock} from './admin-access.mjs';
import {oppServiceRules} from './opp.mjs';
import {syncScpUserProfile} from './module-a-schema.mjs';
const portalHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow'};
const portalJSON=(d,s=200)=>Response.json(d,{status:s,headers:portalHeaders});
function portalIdentity(req){const id=req.headers.get('oai-authenticated-user-id'),email=req.headers.get('oai-authenticated-user-email')?.toLowerCase();return id&&email&&id.length<=200&&email.length<=254?{id,email}:null}
function portalIsAdmin(req,env){const who=portalIdentity(req);return !!who&&!!env.STATISTICS_OWNER_EMAIL&&who.email===env.STATISTICS_OWNER_EMAIL.toLowerCase()}
async function portalBody(req,max=10000){const raw=await req.text();if(raw.length>max)throw Error('body');return JSON.parse(raw)}
const portalSafeName=value=>typeof value==='string'?value.trim().slice(0,120):'';
async function portalSubscriptions(env){if(!env.BUCKET?.list)return {items:[],complete:true};const listed=await env.BUCKET.list({prefix:'memberships/paypal/subscriptions/',limit:100}),items=[];for(const object of listed.objects){try{const record=await(await env.BUCKET.get(object.key)).json();items.push({id:record.id,userId:record.ownerUserId||null,plan:record.name,amount:record.amount,currency:record.currency,status:record.status,paidThrough:record.paidThrough||null,checkedAt:record.checkedAt||null,paid:!!record.paidThrough&&Date.parse(record.paidThrough)>Date.now()&&['ACTIVE','CANCELLED'].includes(record.status)})}catch{}}return {items,complete:!listed.truncated}}
// Access decisions are private and checked on every request, including signing routes.
async function portalDecision(env,email){const o=await env.BUCKET?.get('portal/access/'+encodeURIComponent(email)+'.json');return o?o.json():null}
const portalEffectiveStatus=(profile,decision)=>decision?.status||profile?.status||'pending';
const portalPhases=['Presupuesto cerrado y contratación','Selección del Usuario Especialista','Conexión y cita asignada','Servicio en curso · acompañamiento','Fin del servicio · plazo de revisión','Conformidad y resolución económica'];
function portalProgress(record,events=[],now=Date.now()){
 const e=events.filter(e=>e.case_id===record.id).sort((a,b)=>a.created_at.localeCompare(b.created_at)),last=kind=>e.filter(x=>x.kind===kind).at(-1),finished=last('service_finished'),review=last('review_checked'),confirmed=last('holder_confirmed'),rule=oppServiceRules[record.service_key];
 let phase=1;if(last('specialist_selected'))phase=2;if(last('appointment_set'))phase=3;if(last('service_started'))phase=4;if(finished)phase=5;
 const deadline=finished&&rule?new Date(Date.parse(finished.created_at)+rule.waitHours*3600000).toISOString():null;
 const eligible=!!finished&&!!review&&!!confirmed&&!record.incident_open&&!!deadline&&now>=Date.parse(deadline);
 const resolution=last('resolution_recorded');if(eligible||resolution)phase=6;
 return {phase,phases:portalPhases,finishedAt:finished?.created_at||null,reviewDeadline:deadline,reviewChecked:!!review,holderConfirmed:!!confirmed,incidentOpen:!!record.incident_open,readyForPaymentReview:eligible,paymentExecuted:false,resolution:resolution?.note||null,appointment:last('appointment_set')?.note||null};
}
async function portalCaseEvents(env,id){return (await env.DB.prepare('SELECT case_id,kind,note,created_at FROM portal_events WHERE case_id=? ORDER BY created_at ASC').bind(id).all()).results}

async function portalApi(req,env){
 const url=new URL(req.url),path=url.pathname.slice('/api/portal/'.length),who=portalIdentity(req),admin=portalIsAdmin(req,env);
 if(!who)return portalJSON({error:'Inicia sesión con ChatGPT para acceder.',signIn:'/signin-with-chatgpt?return_to=%2Fmi-cuenta.html'},401);
 if(!env.DB)return portalJSON({error:'El área privada no está disponible ahora.'},503);
 if(!['GET','POST'].includes(req.method))return portalJSON({error:'Método no permitido.'},405);
 if(req.method==='POST'&&(req.headers.get('Origin')!==url.origin||!/^application\/(json|pdf)(?:;|$)|^image\/(jpeg|png)(?:;|$)/i.test(req.headers.get('Content-Type')||'')))return portalJSON({error:'Solicitud no permitida.'},403);
 if(req.method==='POST'&&Number(req.headers.get('Content-Length'))>8388608)return portalJSON({error:'Archivo demasiado grande. Máximo 8 MB.'},413);
 if(path.startsWith('admin/')&&!admin)return portalJSON({error:'Solo la administradora puede realizar esta acción.'},403);
 try{
 if(path==='admin/unlock'&&req.method==='POST')return adminUnlock(req,env);
 if((path.startsWith('admin/')||(path.startsWith('contracts/')&&admin))&&!await adminUnlocked(req,env))return portalJSON({error:'Introduce tu código de acceso LEXPUENTE.',codeRequired:true,url:'/acceso-scp.html'},423);
 if(path==='admin/test-accounts'||path.startsWith('admin/test-accounts/'))return testAdminApi(req,env,path,who);
 const accessDecision=await portalDecision(env,who.email);if(!admin&&['blocked','denied'].includes(accessDecision?.status))return portalJSON({error:accessDecision.status==='blocked'?'Acceso bloqueado por LEXPUENTE. Contacta con la administración.':'Solicitud de registro denegada.',status:accessDecision.status},403);
 if(path.startsWith('signing/')||path==='admin/signing/create'){if(admin&&!await adminUnlocked(req,env))return portalJSON({error:'Introduce tu código de acceso.',codeRequired:true},423);return signingApi(req,env,path,who,admin)}
 let profile=await env.DB.prepare('SELECT id,email,name,role,status,created_at FROM portal_users WHERE id=?').bind(who.id).first();
 if(profile)profile.status=portalEffectiveStatus(profile,accessDecision);
 const scpProfile=await syncScpUserProfile(env,who,profile,admin,profile?.status||null);
 if(path==='me'&&req.method==='GET'){const appObject=await env.BUCKET?.get('portal/applications/'+encodeURIComponent(who.email)+'.json');const application=appObject?await appObject.json():null;return portalJSON({identity:who,admin,adminUnlocked:admin?await adminUnlocked(req,env):false,profile:profile||null,scpProfile,application,authentication:'chatgpt',paymentsEnabled:false,clinicalUploadsEnabled:false});}
 if(path==='register'&&req.method==='POST'){
  const input=await portalBody(req,20000),profileType=input.profileType,fields=input.fields||{};
  if(input.privacyRead!==true||!['titular','especialista'].includes(profileType))return portalJSON({error:'Confirma la lectura de privacidad y elige un tipo de perfil.'},400);
  const role=profileType==='especialista'?'collaborator':'client',existing=await env.DB.prepare('SELECT id,email,name,role,status,created_at FROM portal_users WHERE id=?').bind(who.id).first(),existingEmail=await env.DB.prepare('SELECT id FROM portal_users WHERE email=?').bind(who.email).first();
  if(existingEmail&&existingEmail.id!==who.id)return portalJSON({error:'Este correo ya está asociado a otro perfil LEXPUENTE. Contacta con la administración.'},409);
  if(existing&&existing.role!==role)return portalJSON({error:'Esta cuenta ya tiene otro perfil. Contacta con LEXPUENTE para solicitar un perfil adicional.'},409);
  if(existing&&existing.status==='active')return portalJSON({error:'Este perfil ya está activo.'},409);
  if(!env.BUCKET)return portalJSON({error:'El espacio privado de solicitudes no está disponible.'},503);
  const fullName=portalSafeName(profileType==='titular'?[fields.firstName,fields.lastName].filter(Boolean).join(' '):fields.name);
  const phone=portalSafeName(fields.phone),now=new Date().toISOString(),applicationId=crypto.randomUUID();
  if(!fullName||!phone)return portalJSON({error:'Completa nombre y teléfono.'},400);if(profileType==='titular'&&(!portalSafeName(fields.firstName)||!portalSafeName(fields.lastName)))return portalJSON({error:'Escribe nombre y apellidos.'},400);
  let recordFields={};
  if(profileType==='titular'){
   const contactPreference=String(fields.contactPreference||'');
   if(!['whatsapp','phone','email'].includes(contactPreference))return portalJSON({error:'Elige cómo prefieres que LEXPUENTE se ponga en contacto contigo.'},400);
   const requestService=input.requestService===true,interestArea=portalSafeName(fields.interestArea),serviceLocation=portalSafeName(fields.serviceLocation),requestSummary=String(fields.requestSummary||'').trim().slice(0,1000),allowedAreas=['tramites','salud','vivienda','academia','bienestar','comunica','tienda','otros'];
   if(requestService&&(!allowedAreas.includes(interestArea)||!requestSummary))return portalJSON({error:'Indica el sector y describe brevemente el servicio que necesitas.'},400);
   recordFields={firstName:portalSafeName(fields.firstName),lastName:portalSafeName(fields.lastName),phone,contactPreference,...(requestService?{requestService:true,interestArea,serviceLocation,requestSummary}:{})};
  }else{
   const sector=portalSafeName(fields.sector),identityType=portalSafeName(fields.identityType),identityNumber=portalSafeName(fields.identityNumber),profession=portalSafeName(fields.profession),college=portalSafeName(fields.college),collegeNumber=portalSafeName(fields.collegeNumber);
   const businessName=portalSafeName(fields.businessName),businessLegalName=portalSafeName(fields.businessLegalName),businessTaxId=portalSafeName(fields.businessTaxId),businessAddress=String(fields.businessAddress||'').trim().slice(0,300),businessActivity=portalSafeName(fields.businessActivity),address=String(fields.address||'').trim().slice(0,300),registrationNumber=portalSafeName(fields.registrationNumber);
   const allowedSectors=['sanidad','administrativo','academia','inmobiliario','bienestar','comunica'];
   if(!identityType||!identityNumber||!profession||!address||!businessName||!businessLegalName||!businessTaxId||!businessAddress||!businessActivity||!allowedSectors.includes(sector))return portalJSON({error:'Completa los datos personales, del negocio y el área de actividad.'},400);
   if(fields.registrationRequired===true&&(!college||!collegeNumber))return portalJSON({error:'Indica el colegio y el número de colegiación exigidos para esta actividad.'},400);
   const registrationRequired=fields.registrationRequired===true,requiresLicense=fields.requiresLicense===true;
   recordFields={name:fullName,phone,address,identityType,identityNumber,profession,college,collegeNumber,registrationRequired,businessName,businessLegalName,businessTaxId,businessAddress,businessActivity,sector,registrationNumber,requiresLicense};
   await env.BUCKET.put('portal/details/'+encodeURIComponent(who.email)+'.json',JSON.stringify({...recordFields,publicApplication:true,updatedAt:now}));
   await env.DB.prepare('INSERT INTO portal_collaborators(email,name,status,created_at) VALUES (?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,status=excluded.status,approved_at=NULL,approved_by=NULL').bind(who.email,fullName,'pending',now).run();
  }
  await env.DB.prepare('INSERT INTO portal_users (id,email,name,role,status,created_at,privacy_version) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,role=excluded.role,status=excluded.status,privacy_version=excluded.privacy_version').bind(who.id,who.email,fullName,role,'pending',existing?.created_at||now,'2026-11-18').run();
  const application={id:applicationId,email:who.email,profileType,role,name:fullName,status:'pending',submittedAt:now,updatedAt:now,fields:recordFields};
  await env.BUCKET.put('portal/applications/'+encodeURIComponent(who.email)+'.json',JSON.stringify(application));
  await env.BUCKET.put('portal/access/'+encodeURIComponent(who.email)+'.json',JSON.stringify({status:'pending',applicationId,createdAt:now}));
  return portalJSON({registered:true,status:'pending',applicationId,message:'Solicitud guardada. Queda pendiente de revisión manual.'},201);
 }
 if(path==='application-documents'&&req.method==='POST'){
  const kind=url.searchParams.get('kind'),allowed=['identity','qualification','authorization','license','insurance','business'];
  if(!profile||profile.role!=='collaborator'||profile.status!=='pending'||!allowed.includes(kind)||!env.BUCKET||req.headers.get('Content-Type')!=='application/pdf')return portalJSON({error:'La carga privada no está disponible para esta solicitud.'},403);
  const appKey='portal/applications/'+encodeURIComponent(who.email)+'.json',appObject=await env.BUCKET.get(appKey);if(!appObject)return portalJSON({error:'Primero guarda tu solicitud de colaboración.'},404);
  const app=await appObject.json(),bytes=new Uint8Array(await req.arrayBuffer());if(bytes.length<5||bytes.length>8388608||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return portalJSON({error:'El archivo debe ser un PDF válido de hasta 8 MB.'},400);
  const id=crypto.randomUUID(),sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join(''),objectKey='portal/credentials/'+id;
  await env.BUCKET.put(objectKey+'.pdf',bytes,{httpMetadata:{contentType:'application/pdf'}});
  const document={id,email:who.email,kind,sha256,createdAt:new Date().toISOString(),source:'public-application',applicationId:app.id};
  try{await env.BUCKET.put(objectKey+'.json',JSON.stringify(document));app.documents=[...(app.documents||[]).filter(d=>d.kind!==kind),{id,kind,sha256,createdAt:document.createdAt}];app.updatedAt=document.createdAt;await env.BUCKET.put(appKey,JSON.stringify(app))}catch(e){await env.BUCKET.delete(objectKey+'.pdf');await env.BUCKET.delete(objectKey+'.json');throw e}
  return portalJSON({saved:true,kind,message:'Documento recibido en el archivo privado de revisión.'},201);
 }
 if(path==='admin/dashboard'&&req.method==='GET'){
  const [users,collaborators,contracts,cases,events]=await env.DB.batch([env.DB.prepare('SELECT id,email,name,role,status,created_at FROM portal_users ORDER BY created_at DESC LIMIT 501'),env.DB.prepare('SELECT email,name,status,created_at FROM portal_collaborators ORDER BY created_at DESC LIMIT 501'),env.DB.prepare('SELECT id,collaborator_email,title,sha256,created_at FROM portal_contracts ORDER BY created_at DESC LIMIT 501'),env.DB.prepare('SELECT * FROM portal_cases ORDER BY created_at DESC LIMIT 501'),env.DB.prepare('SELECT case_id,kind,note,created_at FROM portal_events ORDER BY created_at DESC LIMIT 500')]);
  const decisions={};for(const u of [...users.results,...collaborators.results]){if(!Object.hasOwn(decisions,u.email))decisions[u.email]=await portalDecision(env,u.email);u.status=portalEffectiveStatus(u,decisions[u.email])}
  const details={};for(const c of collaborators.results.slice(0,500)){const o=await env.BUCKET?.get('portal/details/'+encodeURIComponent(c.email)+'.json');if(o){const d=await o.json();details[c.email]={...d,identityNumber:d.identityNumber?'••••'+d.identityNumber.slice(-4):''}}}
  const documents=[];if(env.BUCKET?.list){const list=await env.BUCKET.list({prefix:'portal/credentials/',limit:500});for(const o of list.objects){if(o.key.endsWith('.json')){const d=await(await env.BUCKET.get(o.key)).json();documents.push(d)}}}
  const drafts=[];if(env.BUCKET?.list){const listed=await env.BUCKET.list({prefix:'portal/contract-drafts/',limit:500});for(const object of listed.objects){if(object.key.endsWith('.json'))drafts.push(await(await env.BUCKET.get(object.key)).json())}}
  const rates=[];if(env.BUCKET?.list){const list=await env.BUCKET.list({prefix:'portal/rates/',limit:500});for(const o of list.objects){rates.push(await(await env.BUCKET.get(o.key)).json())}}
  const caseViews=[];for(const c of cases.results.slice(0,500)){const history=await portalCaseEvents(env,c.id);caseViews.push({...c,progress:portalProgress(c,history),events:history})}
  const applications=[];if(env.BUCKET?.list){const rows=await env.BUCKET.list({prefix:'portal/applications/',limit:500});for(const obj of rows.objects){if(obj.key.endsWith('.json')){try{applications.push(await(await env.BUCKET.get(obj.key)).json())}catch{}}}}const subscriptions=await portalSubscriptions(env);return portalJSON({drafts,details,documents,rates,applications,users:users.results.slice(0,500),collaborators:collaborators.results.slice(0,500),contracts:contracts.results.slice(0,500),cases:caseViews,subscriptions:subscriptions.items,complete:subscriptions.complete&&[users,collaborators,contracts,cases].every(r=>r.results.length<=500),paymentsEnabled:false,clinicalUploadsEnabled:false});
 }
 if(path==='admin/access'&&req.method==='POST'){
  const input=await portalBody(req),email=String(input.email||'').trim().toLowerCase(),action=input.action;
  if(!['approve','deny','block'].includes(action)||!env.BUCKET||email===who.email)return portalJSON({error:'Acción o cuenta no permitida.'},400);
  const target=await env.DB.prepare('SELECT id,email,role,status FROM portal_users WHERE email=?').bind(email).first(),specialist=await env.DB.prepare('SELECT email FROM portal_collaborators WHERE email=?').bind(email).first();
  if(!target&&!specialist)return portalJSON({error:'Cuenta no encontrada.'},404);
  if(action==='approve'&&(specialist||target?.role==='collaborator'))return portalJSON({error:'Aprueba al especialista desde su ficha, después de revisar contrato, acreditaciones y seguro.'},409);
  const note=String(input.note||'').trim().slice(0,2000);if(action!=='approve'&&!note)return portalJSON({error:'Indica el motivo de la decisión para dejar constancia.'},400);
  const decision={status:action==='approve'?'active':action==='deny'?'denied':'blocked',actorId:who.id,note,createdAt:new Date().toISOString()};
  // Append a separate audit object before replacing the current decision.
  await env.BUCKET.put('portal/access-audit/'+crypto.randomUUID()+'.json',JSON.stringify({...decision,email}));
  if(action==='approve')await env.DB.prepare("UPDATE portal_users SET status='active' WHERE email=? AND role='client'").bind(email).run();
  await env.BUCKET.put('portal/access/'+encodeURIComponent(email)+'.json',JSON.stringify(decision));const applicationObject=await env.BUCKET.get('portal/applications/'+encodeURIComponent(email)+'.json');if(applicationObject){const application=await applicationObject.json();application.status=decision.status;application.reviewedAt=decision.createdAt;application.reviewNote=note;await env.BUCKET.put('portal/applications/'+encodeURIComponent(email)+'.json',JSON.stringify(application))}
  if(action!=='approve')await env.DB.batch([env.DB.prepare("UPDATE portal_users SET status='pending' WHERE email=?").bind(email),env.DB.prepare("UPDATE portal_collaborators SET status='pending' WHERE email=?").bind(email)]);
  return portalJSON({status:decision.status,message:'Decisión guardada. Se aplica al siguiente acceso y a cada operación privada.'});
 }
 if(path==='admin/collaborators'&&req.method==='POST'){
  const input=await portalBody(req,30000),email=typeof input.email==='string'?input.email.trim().toLowerCase():'';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!portalSafeName(input.name)||email===who.email)return portalJSON({error:'Indica nombre y correo válidos del colaborador.'},400);
  if(!env.BUCKET)return portalJSON({error:'El archivo privado no está disponible.'},503);
  const phone=portalSafeName(input.phone),identityNumber=portalSafeName(input.identityNumber),profession=portalSafeName(input.profession),collegeNumber=portalSafeName(input.collegeNumber),college=portalSafeName(input.college);
  if(!portalSafeName(input.businessName)||!portalSafeName(input.businessLegalName)||!portalSafeName(input.businessTaxId)||!String(input.businessAddress||'').trim()||!portalSafeName(input.businessActivity)||!phone||!identityNumber||!profession||!String(input.address||'').trim()||!['sanidad','administrativo','academia','inmobiliario','bienestar','comunica'].includes(input.sector)||(input.registrationRequired!==false&&(!collegeNumber||!college)))return portalJSON({error:'Completa teléfono, DNI/NIE o identificación, profesión y colegio/número cuando sean obligatorios.'},400);
  await env.BUCKET.put('portal/details/'+encodeURIComponent(email)+'.json',JSON.stringify({phone,identityNumber,profession,collegeNumber,college,registrationRequired:input.registrationRequired!==false,identityType:portalSafeName(input.identityType),address:String(input.address||'').trim().slice(0,300),businessName:String(input.businessName||'').trim().slice(0,160),sector:portalSafeName(input.sector),requiresLicense:input.requiresLicense===true,registrationNumber:portalSafeName(input.registrationNumber),businessLegalName:String(input.businessLegalName||'').trim().slice(0,160),businessTaxId:portalSafeName(input.businessTaxId),businessAddress:String(input.businessAddress||'').trim().slice(0,300),businessActivity:String(input.businessActivity||'').trim().slice(0,160),updatedAt:new Date().toISOString()}));
  await env.DB.prepare('INSERT INTO portal_collaborators(email,name,status,created_at) VALUES (?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,status=excluded.status,approved_at=NULL,approved_by=NULL').bind(email,portalSafeName(input.name),'pending',new Date().toISOString()).run();
  await env.DB.prepare("UPDATE portal_users SET role='collaborator',status='pending' WHERE email=?").bind(email).run();
  await env.BUCKET.put('portal/access/'+encodeURIComponent(email)+'.json',JSON.stringify({status:'pending',actorId:who.id,createdAt:new Date().toISOString()}));
  const draft=await saveContractDraft(env,input);
  return portalJSON({saved:true,draft,message:'Usuario Especialista preparado. Para activarlo, archiva el contrato firmado y confirma sus acreditaciones. No se ha enviado ningún correo.'},201);
 }


 if(path==='admin/contract-draft'&&req.method==='POST'){
  const input=await portalBody(req,30000),draft=createContractDraft(input);if(!draft)return portalJSON({error:'Falta incorporar el contrato oficial de este sector. No se ha generado un sustituto.'},409);
  return new Response(draft.bytes,{headers:{...portalHeaders,'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':'attachment; filename="LEXPUENTE_Contrato_'+draft.sector+'_rellenado.docx"','X-Contract-State':'draft'}});
 }
 if(path.startsWith('admin/contract-drafts/')&&req.method==='GET'){
  const id=path.slice('admin/contract-drafts/'.length);if(!/^[a-f0-9-]{36}$/.test(id))return portalJSON({error:'Documento no encontrado.'},404);const object=await env.BUCKET?.get('portal/contract-drafts/'+id+'.docx');if(!object)return portalJSON({error:'Documento no encontrado.'},404);return new Response(object.body,{headers:{...portalHeaders,'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':'attachment; filename="LEXPUENTE_Contrato_rellenado.docx"'}});
 }
 if(path==='admin/documents'&&req.method==='POST'){
  const email=(url.searchParams.get('collaborator')||'').toLowerCase(),kind=url.searchParams.get('kind');
  if(!['identity','qualification','authorization','license','catalogue','insurance'].includes(kind)||req.headers.get('Content-Type')!=='application/pdf'||!env.BUCKET)return portalJSON({error:'Selecciona tipo de documento y PDF.'},400);
  if(!await env.DB.prepare('SELECT email FROM portal_collaborators WHERE email=?').bind(email).first())return portalJSON({error:'Primero guarda al colaborador.'},404);
  const bytes=new Uint8Array(await req.arrayBuffer());if(bytes.length>8388608||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return portalJSON({error:'PDF no válido. Máximo 8 MB.'},400);
  const id=crypto.randomUUID(),key='portal/credentials/'+id;
  const sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  await env.BUCKET.put(key+'.pdf',bytes,{httpMetadata:{contentType:'application/pdf'}});
  try{await env.BUCKET.put(key+'.json',JSON.stringify({id,email,kind,sha256,createdAt:new Date().toISOString()}))}catch(e){await env.BUCKET.delete(key+'.pdf');throw e}
  return portalJSON({message:'Documento guardado en el archivo privado de administración.'},201);
 }
 if(path.startsWith('admin/documents/')&&req.method==='GET'){
  const id=path.slice('admin/documents/'.length);if(!/^[a-f0-9-]{36}$/.test(id))return portalJSON({error:'No encontrado.'},404);
  const object=await env.BUCKET?.get('portal/credentials/'+id+'.pdf');if(!object)return portalJSON({error:'No encontrado.'},404);
  return new Response(object.body,{headers:{...portalHeaders,'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="acreditacion-privada.pdf"','Content-Security-Policy':"sandbox; default-src 'none'"}});
 }
 if(path==='admin/rates'&&req.method==='POST'){
  const input=await portalBody(req),email=String(input.email||'').trim().toLowerCase(),amount=Number(input.amountCents);
  if(!env.BUCKET||!portalSafeName(input.title)||!Number.isSafeInteger(amount)||amount<0||amount>10000000||!await env.DB.prepare('SELECT email FROM portal_collaborators WHERE email=?').bind(email).first())return portalJSON({error:'Selecciona colaborador guardado, servicio y precio válido.'},400);
  const id=crypto.randomUUID();await env.BUCKET.put('portal/rates/'+id+'.json',JSON.stringify({id,email,title:portalSafeName(input.title),amountCents:amount,conditions:String(input.conditions||'').slice(0,2000),createdAt:new Date().toISOString()}));return portalJSON({message:'Precio y condiciones guardados. No se ha cobrado nada.'},201);
 }
 if(path==='admin/contracts'&&req.method==='POST'){
  const email=(url.searchParams.get('collaborator')||'').toLowerCase(),title=portalSafeName(url.searchParams.get('title'));
  if(req.headers.get('Content-Type')!=='application/pdf'||!title||!env.BUCKET)return portalJSON({error:'Selecciona un contrato PDF y un título.'},400);
  const invite=await env.DB.prepare('SELECT email FROM portal_collaborators WHERE email=?').bind(email).first();if(!invite)return portalJSON({error:'Primero da de alta al Usuario Especialista.'},404);
  const bytes=new Uint8Array(await req.arrayBuffer());if(bytes.length>8388608||bytes.length<5||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return portalJSON({error:'El documento debe ser un PDF de hasta 8 MB.'},400);
  const id=crypto.randomUUID(),key='portal/contracts/'+id+'.pdf',sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:'application/pdf'}});try{await env.DB.prepare('INSERT INTO portal_contracts(id,collaborator_email,title,object_key,sha256,created_at) VALUES (?,?,?,?,?,?)').bind(id,email,title,key,sha256,new Date().toISOString()).run()}catch(e){await env.BUCKET.delete(key);throw e}return portalJSON({id,sha256,message:'Contrato archivado. La firma todavía debe ser comprobada por la administradora.'},201);
 }
 if(path==='admin/activate'&&req.method==='POST'){
  const input=await portalBody(req),email=String(input.email||'').toLowerCase();if(input.contractChecked!==true||input.credentialsChecked!==true||input.insuranceChecked!==true||input.identityChecked!==true)return portalJSON({error:'Confirma la identidad, el contrato firmado, las acreditaciones y el seguro.'},400);
  const detailsObject=await env.BUCKET?.get('portal/details/'+encodeURIComponent(email)+'.json');
  if(!detailsObject)return portalJSON({error:'Completa primero la ficha de identificación del colaborador.'},409);
  const details=await detailsObject.json();if(!details.identityNumber||!details.phone||(details.registrationRequired&&(!details.college||!details.collegeNumber)))return portalJSON({error:'Faltan datos de identificación o colegiación.'},409);
  const files=await env.BUCKET.list({prefix:'portal/credentials/',limit:1000}),kinds=new Set();for(const object of files.objects){if(object.key.endsWith('.json')){const d=await(await env.BUCKET.get(object.key)).json();if(d.email===email)kinds.add(d.kind)}}
  const signed=await signingList(env,email,false);const latest=signed.items.filter(item=>item.currentProfile&&item.sector===details.sector).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];const electronic=!!latest?.specialistSigned&&!!latest?.founderSigned;if(electronic)kinds.add('catalogue');
  const required=['qualification','authorization','catalogue','insurance',...((details.requiresLicense||details.isClinic)?['license']:[])],missing=required.filter(k=>!kinds.has(k));if(!kinds.has('identity')&&!input.identityChecked)missing.unshift('identity');if(missing.length)return portalJSON({error:'Falta archivar: '+missing.map(k=>({identity:'documento de identidad',qualification:'título o acreditación',authorization:'autorización de ejercicio o justificación',catalogue:'catálogo firmado',insurance:'seguro de responsabilidad civil',license:'licencia o registro del negocio'}[k])).join(', ')+'.',missing},409);
  const contract=await env.DB.prepare('SELECT id FROM portal_contracts WHERE collaborator_email=? LIMIT 1').bind(email).first();if(!contract&&!electronic)return portalJSON({error:'Antes de activar debes archivar el contrato firmado o completar las dos firmas en pantalla.'},409);
  const invite=await env.DB.prepare('SELECT email FROM portal_collaborators WHERE email=?').bind(email).first();if(!invite)return portalJSON({error:'Usuario Especialista no encontrado.'},404);
  await env.DB.batch([env.DB.prepare("UPDATE portal_collaborators SET status='active',approved_at=?,approved_by=? WHERE email=?").bind(new Date().toISOString(),who.id,email),env.DB.prepare("UPDATE portal_users SET role='collaborator',status='active' WHERE email=?").bind(email)]);await env.BUCKET.put('portal/access/'+encodeURIComponent(email)+'.json',JSON.stringify({status:'active',actorId:who.id,createdAt:new Date().toISOString(),credentialsChecked:true,insuranceChecked:true,contractChecked:true,identityChecked:true}));const appObject=await env.BUCKET.get('portal/applications/'+encodeURIComponent(email)+'.json');if(appObject){const application=await appObject.json();application.status='active';application.reviewedAt=new Date().toISOString();await env.BUCKET.put('portal/applications/'+encodeURIComponent(email)+'.json',JSON.stringify(application))}return portalJSON({active:true});
 }
 if(path==='admin/cases'&&req.method==='POST'){
  const input=await portalBody(req),client=await env.DB.prepare("SELECT id FROM portal_users WHERE id=? AND role='client' AND status='active'").bind(input.clientId||'').first(),collaborator=await env.DB.prepare("SELECT id FROM portal_users WHERE id=? AND role='collaborator' AND status='active'").bind(input.collaboratorId||'').first();
  const rule=Object.hasOwn(oppServiceRules,input.serviceKey)?input.serviceKey:null,amount=Number(input.amountCents);
  const clientStatus=client?await env.DB.prepare('SELECT email,status FROM portal_users WHERE id=?').bind(client.id).first():null,collaboratorStatus=collaborator?await env.DB.prepare('SELECT email,status FROM portal_users WHERE id=?').bind(collaborator.id).first():null;
  if(!client||!collaborator||portalEffectiveStatus(clientStatus,await portalDecision(env,clientStatus.email))!=='active'||portalEffectiveStatus(collaboratorStatus,await portalDecision(env,collaboratorStatus.email))!=='active'||!portalSafeName(input.title)||!rule||!Number.isSafeInteger(amount)||amount<=0||amount>10000000)return portalJSON({error:'Selecciona cliente y colaborador activos, servicio y precio válidos.'},400);
  const id=crypto.randomUUID();await env.DB.prepare('INSERT INTO portal_cases(id,client_id,collaborator_id,title,service_key,amount_cents,status,payment_status,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,client.id,collaborator.id,portalSafeName(input.title),rule,amount,'pending','not_collected',new Date().toISOString()).run();return portalJSON({id,message:'Encargo registrado. No hay dinero cobrado ni retenido por OPP.'},201);
 }
 if(!profile&&!admin)return portalJSON({error:'Primero completa el registro de tu cuenta.'},409);
 if(path==='dashboard'&&req.method==='GET'){
  const cases=await env.DB.prepare('SELECT * FROM portal_cases WHERE client_id=? OR collaborator_id=? ORDER BY created_at DESC LIMIT 500').bind(who.id,who.id).all();
  const contracts=profile.role==='collaborator'&&profile.status==='active'?await env.DB.prepare('SELECT id,title,sha256,created_at FROM portal_contracts WHERE collaborator_email=? ORDER BY created_at DESC LIMIT 100').bind(who.email).all():{results:[]};
  const detailedCases=[];if(profile.status==='active')for(const c of cases.results)detailedCases.push({...c,progress:portalProgress(c,await portalCaseEvents(env,c.id))});const specialistChoices=[];if(profile.role==='client'&&profile.status==='active'){const candidates=await env.DB.prepare("SELECT id,email,name,status FROM portal_users WHERE role='collaborator' AND status='active' ORDER BY name LIMIT 500").all();for(const c of candidates.results){if(portalEffectiveStatus(c,await portalDecision(env,c.email))!=='active')continue;const object=await env.BUCKET?.get('portal/details/'+encodeURIComponent(c.email)+'.json'),detail=object?await object.json():{};specialistChoices.push({id:c.id,name:c.name,businessName:detail.businessName||'',address:detail.businessAddress||'',sector:detail.sector||''})}}let specialistDetails=null;if(profile.role==='collaborator'){const object=await env.BUCKET?.get('portal/details/'+encodeURIComponent(who.email)+'.json');if(object){const d=await object.json(),identity=String(d.identityNumber||'');specialistDetails={phone:d.phone||'',identityType:d.identityType||'',maskedIdentity:identity?String(d.identityType||'Identificación')+' terminada en '+identity.slice(-4):'',address:d.address||'',profession:d.profession||'',college:d.college||'',collegeNumber:d.collegeNumber||'',businessName:d.businessName||'',businessLegalName:d.businessLegalName||'',businessTaxId:d.businessTaxId||'',businessAddress:d.businessAddress||'',businessActivity:d.businessActivity||'',registrationNumber:d.registrationNumber||'',sector:d.sector||''}}}const subscriptions=await portalSubscriptions(env);return portalJSON({profile,specialistDetails,specialistChoices,cases:detailedCases,contracts:contracts.results,subscriptions:subscriptions.items.filter(s=>s.userId===who.id),paymentsEnabled:false,clinicalUploadsEnabled:false});
 }
 if(path.startsWith('contracts/')&&req.method==='GET'){
  const id=path.slice(10);if(!/^[a-f0-9-]{36}$/.test(id))return portalJSON({error:'Documento no encontrado.'},404);
  const document=await env.DB.prepare('SELECT collaborator_email,object_key FROM portal_contracts WHERE id=?').bind(id).first();if(!document||(!admin&&(profile.role!=='collaborator'||profile.status!=='active'||document.collaborator_email!==who.email)))return portalJSON({error:'Documento no encontrado.'},404);
  const object=await env.BUCKET?.get(document.object_key);if(!object)return portalJSON({error:'Documento no disponible.'},404);
  return new Response(object.body,{headers:{...portalHeaders,'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="contrato-lexpuente.pdf"','Content-Security-Policy':"sandbox; default-src 'none'"}});
 }
 if((path==='cases/progress'||path==='admin/cases/progress')&&req.method==='POST'){
  const input=await portalBody(req),record=await env.DB.prepare('SELECT * FROM portal_cases WHERE id=?').bind(input.caseId||'').first();
  if(!record||(!admin&&(!profile||profile.status!=='active'||![record.client_id,record.collaborator_id].includes(who.id))))return portalJSON({error:'Servicio no encontrado.'},404);
  const events=await portalCaseEvents(env,record.id),state=portalProgress(record,events),action=input.action,stamp=new Date().toISOString();
  const adminActions=['appointment_set','service_started','review_checked','resolution_recorded'],allowed=adminActions.includes(action)?admin:action==='service_finished'?(admin||who.id===record.collaborator_id):['holder_confirmed','specialist_selected'].includes(action)?who.id===record.client_id:false;
  if(!allowed)return portalJSON({error:'Acción no permitida para tu perfil.'},403);
  if(record.incident_open&&action!=='resolution_recorded')return portalJSON({error:'Hay una incidencia abierta. Debe revisarse antes de avanzar.'},409);
  if(events.some(e=>e.kind===action)&&action!=='resolution_recorded')return portalJSON({error:'Este paso ya está registrado.'},409);
  if(action==='specialist_selected'){
   const specialist=await env.DB.prepare("SELECT id,email,status FROM portal_users WHERE id=? AND role='collaborator'").bind(input.specialistId||record.collaborator_id).first();
   const specObject=specialist?await env.BUCKET?.get('portal/details/'+encodeURIComponent(specialist.email)+'.json'):null,specDetails=specObject?await specObject.json():null;
   if(!specialist||specDetails?.sector!=='sanidad'||portalEffectiveStatus(specialist,await portalDecision(env,specialist.email))!=='active')return portalJSON({error:'El especialista no está activo y verificado.'},409);
  }
  if(action==='service_finished'&&record.service_key==='implante'&&input.crownCompleted!==true)return portalJSON({error:'En implantes, confirma la finalización completa con la corona colocada antes de iniciar el plazo.'},400);
  if(action==='appointment_set'&&state.phase!==2||action==='service_started'&&state.phase!==3||action==='service_finished'&&state.phase!==4||action==='review_checked'&&state.phase<5)return portalJSON({error:'Completa primero la fase anterior.'},409);
  if(action==='holder_confirmed'&&(!state.reviewDeadline||Date.now()<Date.parse(state.reviewDeadline)||!state.reviewChecked))return portalJSON({error:'La revisión debe estar verificada y el plazo de custodia cumplido antes de confirmar.'},409);
  const note=String(input.note||'').trim().slice(0,2000);if(['appointment_set','review_checked','resolution_recorded'].includes(action)&&!note)return portalJSON({error:'Indica fecha, hora y lugar de la cita, o la referencia de la comprobación/resolución. No incluyas datos de salud.'},400);
  if(action==='resolution_recorded'&&!record.incident_open)return portalJSON({error:'No hay incidencia que resolver.'},409);
  if(action==='specialist_selected'&&input.specialistId)await env.DB.prepare('UPDATE portal_cases SET collaborator_id=? WHERE id=?').bind(input.specialistId,record.id).run();
  await env.DB.prepare('INSERT INTO portal_events(id,case_id,actor_id,kind,note,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),record.id,who.id,action,note,stamp).run();
  return portalJSON({message:action==='resolution_recorded'?'Resolución registrada. Los fondos no se han movido y la incidencia sigue bloqueada hasta ejecutar la solución.':'Fase registrada. No se ha cobrado, liberado ni devuelto dinero.',progress:portalProgress(record,[...events,{case_id:record.id,kind:action,note,created_at:stamp}])});
 }
 if(path==='cases/action'&&req.method==='POST'){
  const input=await portalBody(req),record=await env.DB.prepare('SELECT * FROM portal_cases WHERE id=? AND client_id=?').bind(input.caseId||'',who.id).first();if(!record||profile.role!=='client'||profile.status!=='active')return portalJSON({error:'Servicio no encontrado.'},404);
  if(input.action==='incident'){
   const note=typeof input.note==='string'?input.note.trim():'';if(!note||note.length>2000)return portalJSON({error:'Explica brevemente el problema, sin adjuntar datos clínicos.'},400);
   await env.DB.batch([env.DB.prepare("UPDATE portal_cases SET incident_open=1,status='incident' WHERE id=?").bind(record.id),env.DB.prepare('INSERT INTO portal_events(id,case_id,actor_id,kind,note,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),record.id,who.id,'incident',note,new Date().toISOString())]);return portalJSON({message:'Incidencia registrada. La liberación queda bloqueada. Actualmente OPP no está conectado y no hay fondos retenidos en este encargo.'});
  }
  if(input.action==='confirm')return portalJSON({error:'La confirmación para liberar pagos se habilitará cuando OPP esté conectado y las revisiones y los plazos estén verificados. No se ha liberado dinero.'},409);
  return portalJSON({error:'Acción no permitida.'},400);
 }
 if(path==='cases/observation'&&req.method==='POST'){
  const input=await portalBody(req),record=await env.DB.prepare('SELECT id,client_id,collaborator_id FROM portal_cases WHERE id=?').bind(input.caseId||'').first(),note=typeof input.note==='string'?input.note.trim():'';
  if(!record||!profile||profile.status!=='active'||![record.client_id,record.collaborator_id].includes(who.id))return portalJSON({error:'Servicio no encontrado o cuenta sin activar.'},404);
  if(!note||note.length>1200||input.noSensitiveData!==true)return portalJSON({error:'Escribe una observación breve y confirma que no contiene información médica sensible.'},400);
  await env.DB.prepare('INSERT INTO portal_events(id,case_id,actor_id,kind,note,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),record.id,who.id,'observation',note,new Date().toISOString()).run();
  return portalJSON({message:'Observación guardada en el historial del servicio. LEXPUENTE y las personas asignadas a este encargo pueden verla.'},201);
 }
 return portalJSON({error:'Ruta no disponible.'},404);
 }catch{return portalJSON({error:'No se pudo completar la operación. Revisa los datos o vuelve a intentarlo.'},503)}
}
export {portalApi,portalIdentity,portalIsAdmin};
