import {createContractDraft} from './contract-templates.mjs';
import {signingDocument} from './signing.mjs';
const testHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow'};
const testJSON=(data,status=200,extra={})=>Response.json(data,{status,headers:{...testHeaders,...extra}});
const testHex=bytes=>[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
const testRandom=n=>testHex(crypto.getRandomValues(new Uint8Array(n)));
async function testPasswordHash(password,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return testHex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:100000,salt:new TextEncoder().encode(salt)},key,256)))}
async function testMAC(env,text){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.ADMIN_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);return testHex(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(text))))}
function testEqual(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0}
async function testBody(req,max=60000){const text=await req.text();if(text.length>max)throw Error('size');return JSON.parse(text)}
function testForm(input,profileType='especialista'){const data={};if(profileType==='titular'){for(const key of ['firstName','lastName','phone','contactPreference'])data[key]=String(input[key]||'').trim().slice(0,300);return data}for(const key of ['name','identityType','identityNumber','address','phone','email','profession','college','collegeNumber','businessName','businessLegalName','businessTaxId','businessAddress','businessActivity','registrationNumber','sector'])data[key]=String(input[key]||'').trim().slice(0,300);data.sector=['sanidad','administrativo','inmobiliario','academia','bienestar'].includes(data.sector)?data.sector:'sanidad';return data}
function testStrokes(lines){if(!Array.isArray(lines)||lines.length>100)return [];let count=0;return lines.filter(line=>Array.isArray(line)&&line.length>0&&line.length<=4000&&line.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<=900&&p[1]>=0&&p[1]<=220)).filter(line=>(count+=line.length)<=4000)}
async function testAdminApi(req,env,path,who){
 if(!env.BUCKET)return testJSON({error:'Archivo privado no disponible.'},503);
 if(path==='admin/test-accounts'&&req.method==='POST'){
 const input=await testBody(req),profileType=input.profileType==='titular'?'titular':'especialista',data=testForm(input.data||{},profileType),id=crypto.randomUUID(),username=('LPTEST-'+testRandom(6)).toUpperCase(),password=testRandom(12),salt=testRandom(16),passwordHash=await testPasswordHash(password,salt),createdAt=new Date().toISOString();
 const isHolder=profileType==='titular',fullName=isHolder?[data.firstName,data.lastName].filter(Boolean).join(' ').trim():data.name;
 if(!fullName||!data.phone) return testJSON({error:'Escribe un nombre y un teléfono ficticios para continuar.'},400);
 let document=null;if(!isHolder){const contractInput={...data,founderName:'FUNDADORA DE PRUEBA',founderIdentity:'IDENTIFICACIÓN DE PRUEBA',founderEmail:'CORREO DE PRUEBA'};document=signingDocument(contractInput);const draft=createContractDraft(contractInput);if(draft)await env.BUCKET.put('portal/test-documents/'+id+'.docx',draft.bytes)}
 const record={id,username,document,ownerId:who.id,createdAt,data,test:true,profileType,role:isHolder?'holder-test':'specialist-test',status:'registered',identityVerified:false,files:(Array.isArray(input.files)?input.files:[]).slice(0,6).map(f=>({kind:String(f.kind||'').slice(0,40),name:String(f.name||'').slice(0,160),size:Number(f.size)||0,uploaded:false})),signatures:isHolder?{holder:[],founder:[]}:{specialist:testStrokes(input.signatures?.specialist),founder:testStrokes(input.signatures?.founder)},signatureKind:isHolder?'none':'test-drawing',documentVersion:isHolder?null:'original-v2',salt,passwordHash};
 await env.BUCKET.put('portal/test-accounts/'+id+'.json',JSON.stringify(record));try{await env.BUCKET.put('portal/test-usernames/'+username+'.json',JSON.stringify({id}))}catch(e){await env.BUCKET.delete('portal/test-accounts/'+id+'.json');throw e}
 const exp=String(Date.now()+3600000),session=id+'.'+exp+'.'+await testMAC(env,id+'.'+exp);
 return testJSON({registered:true,id,username,password,login:'/iniciar-sesion-prueba.html',panel:'/cuenta-prueba.html',message:'Alta de prueba registrada. Guarda el usuario y la contraseña para iniciar sesión. Esta cuenta solo accede a sus propios datos de prueba.'},201,{'Set-Cookie':'lp_test_session='+session+'; Max-Age=3600; Path=/; HttpOnly; Secure; SameSite=Strict'});
 }
 if(path==='admin/test-accounts'&&req.method==='GET'){
 const listed=await env.BUCKET.list({prefix:'portal/test-accounts/',limit:1000}),items=[];for(const item of listed.objects){const r=await(await env.BUCKET.get(item.key)).json();if(r.ownerId===who.id)items.push({id:r.id,username:r.username,name:r.role==='holder-test'?[r.data.firstName,r.data.lastName].filter(Boolean).join(' '):r.data.name||'Usuario de prueba',sector:r.data.sector,profileType:r.profileType||'especialista',createdAt:r.createdAt,status:r.status})}return testJSON({items,complete:!listed.truncated});
 }
 const id=path.slice('admin/test-accounts/'.length);if(req.method==='GET'&&/^[a-f0-9-]{36}$/.test(id)){const obj=await env.BUCKET.get('portal/test-accounts/'+id+'.json');if(!obj)return testJSON({error:'Alta de prueba no encontrada.'},404);const r=await obj.json();if(r.ownerId!==who.id)return testJSON({error:'Acceso no permitido.'},403);const {salt,passwordHash,...safe}=r;return testJSON(safe)}
 return testJSON({error:'Solicitud no permitida.'},405);
}
async function testSession(req,env){const value=req.headers.get('Cookie')?.match(/(?:^|;\s*)lp_test_session=([a-f0-9-]+\.\d+\.[a-f0-9]+)(?:;|$)/)?.[1];if(!value)return null;const [id,exp,mac]=value.split('.');if(!/^[a-f0-9-]{36}$/.test(id)||Number(exp)<Date.now()||!testEqual(mac,await testMAC(env,id+'.'+exp)))return null;const o=await env.BUCKET.get('portal/test-accounts/'+id+'.json');return o?o.json():null}
async function testAccountsApi(req,env){
 if(!env.BUCKET||!env.ADMIN_SESSION_SECRET||!env.DB)return testJSON({error:'El acceso de prueba no está disponible ahora.'},503);
 const path=new URL(req.url).pathname;if(!['GET','POST'].includes(req.method))return testJSON({error:'Método no permitido.'},405);
 if(req.method==='POST'&&(req.headers.get('Origin')!==new URL(req.url).origin||req.headers.get('Content-Type')!=='application/json'))return testJSON({error:'Solicitud no permitida.'},403);
 try{
 if(path==='/api/test-accounts/login'&&req.method==='POST'){
 const input=await testBody(req,2048),username=String(input.username||'').trim().toUpperCase(),password=String(input.password||'');
 const actor='test-login:'+await testMAC(env,req.headers.get('CF-Connecting-IP')||'unknown'),windowId=Math.floor(Date.now()/900000);
 await env.DB.prepare('INSERT INTO portal_admin_attempts(actor_id,window_id,attempts) VALUES (?,?,1) ON CONFLICT(actor_id) DO UPDATE SET attempts=CASE WHEN window_id=excluded.window_id THEN attempts+1 ELSE 1 END,window_id=excluded.window_id').bind(actor,windowId).run();
 const attempts=await env.DB.prepare('SELECT attempts FROM portal_admin_attempts WHERE actor_id=?').bind(actor).first();if(attempts?.attempts>10)return testJSON({error:'Demasiados intentos. Espera 15 minutos.'},429);
 const ref=/^LPTEST-[A-F0-9]{12}$/i.test(username)?await env.BUCKET.get('portal/test-usernames/'+username+'.json'):null;let record=null;if(ref){const {id}=await ref.json();const o=await env.BUCKET.get('portal/test-accounts/'+id+'.json');if(o)record=await o.json()}
 const hash=await testPasswordHash(password,record?.salt||'invalid-account-salt');if(!record||!testEqual(hash,record.passwordHash))return testJSON({error:'Usuario o contraseña de prueba incorrectos.'},401);
 const exp=String(Date.now()+3600000),cookie=record.id+'.'+exp+'.'+await testMAC(env,record.id+'.'+exp);return testJSON({authenticated:true,panel:'/cuenta-prueba.html'},200,{'Set-Cookie':'lp_test_session='+cookie+'; Max-Age=3600; Path=/; HttpOnly; Secure; SameSite=Strict'});
 }
 if(path==='/api/test-accounts/logout'&&req.method==='POST')return testJSON({signedOut:true},200,{'Set-Cookie':'lp_test_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict'});
 if(path==='/api/test-accounts/contract'&&req.method==='GET'){const record=await testSession(req,env);if(!record)return testJSON({error:'Inicia sesión con tu usuario de prueba.'},401);const file=await env.BUCKET.get('portal/test-documents/'+record.id+'.docx');if(!file)return testJSON({error:'La plantilla de esta área está pendiente.'},404);return new Response(file.body,{headers:{...testHeaders,'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':'attachment; filename="LEXPUENTE_Contrato_original_prueba.docx"'}})}
 if(path==='/api/test-accounts/me'&&req.method==='GET'){const record=await testSession(req,env);if(!record)return testJSON({error:'Inicia sesión con tu usuario y contraseña de prueba.'},401);const {salt,passwordHash,ownerId,...safe}=record;return testJSON({account:safe,access:'test-only',realPaymentsEnabled:false,realClientsAccessible:false})}
 return testJSON({error:'No encontrado.'},404);
 }catch{return testJSON({error:'No se pudo completar el acceso de prueba.'},400)}
}
export {testAdminApi,testAccountsApi,testPasswordHash};
