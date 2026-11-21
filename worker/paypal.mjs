import {laneForPayment} from './lanes.mjs';
import {catalog} from './catalog.mjs';
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
let token;
async function api(env,path,method='GET',body,id){const base=env.PAYPAL_ENVIRONMENT==='sandbox'?'https://api-m.sandbox.paypal.com':'https://api-m.paypal.com';
 if(!token||token.until<Date.now()||token.client!==env.PAYPAL_CLIENT_ID){const r=await fetch(base+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+btoa(env.PAYPAL_CLIENT_ID+':'+env.PAYPAL_CLIENT_SECRET),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'});if(!r.ok)throw Error('authentication');const d=await r.json();token={value:d.access_token,until:Date.now()+(d.expires_in-60)*1000,client:env.PAYPAL_CLIENT_ID}}
 const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+token.value,'Content-Type':'application/json',Prefer:'return=representation',...(id?{'PayPal-Request-Id':id}:{})},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();if(!r.ok){const e=Error('paypal');e.issue=d.details?.[0]?.issue;throw e}return d}
const cookie=r=>r.headers.get('Cookie')?.match(/(?:^|;\s*)lp_checkout=([a-f0-9-]{36})/)?.[1];
const key=id=>'paypal/orders/'+id+'.json';
export async function paymentApi(request,env){const u=new URL(request.url),p=u.pathname;
if(p==='/api/paypal/config'&&request.method==='GET')return json({enabled:!!(env.BUCKET&&env.PAYPAL_CLIENT_ID&&env.PAYPAL_CLIENT_SECRET),clientId:env.PAYPAL_CLIENT_ID,currency:'EUR',items:catalog});
if(request.method!=='POST')return json({error:'Método no permitido'},405);
if(request.headers.get('Origin')!==u.origin)return json({error:'Origen no permitido'},403);
if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Formato no válido'},415);
if(Number(request.headers.get('Content-Length')||0)>4096)return json({error:'Solicitud demasiado grande'},413);
let b;try{const t=await request.text();if(t.length>4096)return json({error:'Solicitud demasiado grande'},413);b=JSON.parse(t)}catch{return json({error:'Solicitud no válida'},400)}
if(!env.BUCKET||!env.PAYPAL_CLIENT_SECRET)return json({error:'Pago no disponible. Contacta con LEXPUENTE.'},503);
try{
if(p==='/api/paypal/orders'){
 const item=Object.hasOwn(catalog,b.itemId)?catalog[b.itemId]:null;if(!item||laneForPayment(b.itemId)!=='LP-01')return json({error:'Servicio no válido'},400);
 const s=cookie(request)||crypto.randomUUID(),reference=crypto.randomUUID();
 const d=await api(env,'/v2/checkout/orders','POST',{intent:'CAPTURE',purchase_units:[{reference_id:reference,custom_id:b.itemId,description:item.name,amount:{currency_code:'EUR',value:item.amount}}],payment_source:{paypal:{experience_context:{brand_name:'LEXPUENTE',shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW'}}}},reference);
 await env.BUCKET.put(key(d.id),JSON.stringify({id:d.id,session:s,reference,itemId:b.itemId,amount:item.amount,status:'CREATED',createdAt:new Date().toISOString()}));
 return json({id:d.id},200,{'Set-Cookie':`lp_checkout=${s}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`});
}
if(p==='/api/paypal/capture'||p==='/api/paypal/status'){
 const id=String(b.orderId||'');if(!/^[A-Z0-9]{10,32}$/.test(id))return json({error:'Pedido no válido'},400);
 const obj=await env.BUCKET.get(key(id));const rec=obj?await obj.json():null;if(!rec||rec.session!==cookie(request))return json({error:'Pedido no encontrado en esta sesión'},404);
 const receipt=()=>({status:rec.status,id:rec.id,amount:rec.amount,item:catalog[rec.itemId].name,captureId:rec.captureId});if(rec.status==='COMPLETED')return json(receipt());
 let d;if(p.endsWith('/status'))d=await api(env,'/v2/checkout/orders/'+id);else try{d=await api(env,'/v2/checkout/orders/'+id+'/capture','POST',{},'capture-'+rec.reference)}catch(e){if(e.issue==='ORDER_ALREADY_CAPTURED')d=await api(env,'/v2/checkout/orders/'+id);else throw e}
 if(p.endsWith('/capture'))d=await api(env,'/v2/checkout/orders/'+id);
 const unit=d.purchase_units?.[0],c=unit?.payments?.captures?.[0];
 if(c?.status==='COMPLETED'){
 if(c.amount?.currency_code!=='EUR'||c.amount.value!==rec.amount||unit.custom_id!==rec.itemId)throw Error('mismatch');
 rec.status='COMPLETED';rec.captureId=c.id;rec.completedAt=new Date().toISOString();await env.BUCKET.put(key(id),JSON.stringify(rec));return json(receipt())}
 return json({status:d.status==='COMPLETED'?'PENDING':d.status,id,amount:rec.amount});
}
return json({error:'Ruta no disponible'},404)
}catch(e){return json({error:e.issue==='INSTRUMENT_DECLINED'?'El medio de pago fue rechazado. Elige otro.':'No se ha podido confirmar el pago. Comprueba la actividad de PayPal antes de repetirlo.',code:e.issue==='INSTRUMENT_DECLINED'?'INSTRUMENT_DECLINED':'PAYMENT_ERROR'},502)}
}
