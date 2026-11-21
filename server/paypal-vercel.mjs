import {createHmac, randomUUID, timingSafeEqual} from 'node:crypto';
import {catalog} from '../worker/catalog.mjs';
import {laneForPayment} from '../worker/lanes.mjs';

const COOKIE_NAME='scp_paypal_order';
const CURRENCY='EUR';
const TOKEN_SKEW_MS=60_000;
let oauthToken=null;

const allowedItems=()=>Object.fromEntries(Object.entries(catalog).filter(([id])=>laneForPayment(id)==='LP-01'));
const checkoutEnabled=env=>env.PAYPAL_CHECKOUT_ENABLED==='true'&&Boolean(env.PAYPAL_CLIENT_ID&&env.PAYPAL_CLIENT_SECRET)&&['sandbox','live'].includes(String(env.PAYPAL_ENVIRONMENT||'').toLowerCase());
const apiBase=env=>String(env.PAYPAL_ENVIRONMENT).toLowerCase()==='sandbox'?'https://api-m.sandbox.paypal.com':'https://api-m.paypal.com';

function send(res,status,body,headers={}){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  for(const [name,value] of Object.entries(headers))res.setHeader(name,value);
  res.end(JSON.stringify(body));
}

function originAllowed(req){
  const origin=req.headers.origin;
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
  const protocol=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  return Boolean(origin&&host&&origin===`${protocol}://${host}`);
}

function readJsonBody(req){
  const contentType=String(req.headers['content-type']||'');
  if(!contentType.toLowerCase().startsWith('application/json'))return {error:'Formato no válido'};
  const length=Number(req.headers['content-length']||0);
  if(length>4096)return {error:'Solicitud demasiado grande'};
  let value=req.body;
  if(typeof value==='string'){
    if(Buffer.byteLength(value,'utf8')>4096)return {error:'Solicitud demasiado grande'};
    try{value=JSON.parse(value)}catch{return {error:'Solicitud no válida'}}
  }else if(value&&typeof value==='object'){
    if(Buffer.byteLength(JSON.stringify(value),'utf8')>4096)return {error:'Solicitud demasiado grande'};
  }else return {error:'Solicitud no válida'};
  return {value};
}

async function paypalRequest(env,path,{method='GET',body,requestId}={}){
  const now=Date.now();
  if(!oauthToken||oauthToken.until<now+TOKEN_SKEW_MS||oauthToken.clientId!==env.PAYPAL_CLIENT_ID||oauthToken.environment!==env.PAYPAL_ENVIRONMENT){
    const credentials=Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`,'utf8').toString('base64');
    const tokenResponse=await fetch(`${apiBase(env)}/v1/oauth2/token`,{
      method:'POST',
      headers:{Authorization:`Basic ${credentials}`,'Content-Type':'application/x-www-form-urlencoded'},
      body:'grant_type=client_credentials',
      signal:AbortSignal.timeout(8000)
    });
    const tokenBody=await tokenResponse.json().catch(()=>({}));
    if(!tokenResponse.ok||!tokenBody.access_token)throw Object.assign(new Error('paypal_auth'),{issue:'AUTHENTICATION_FAILURE'});
    oauthToken={value:tokenBody.access_token,until:now+(Number(tokenBody.expires_in||300)-60)*1000,clientId:env.PAYPAL_CLIENT_ID,environment:env.PAYPAL_ENVIRONMENT};
  }
  const response=await fetch(`${apiBase(env)}${path}`,{
    method,
    headers:{Authorization:`Bearer ${oauthToken.value}`,'Content-Type':'application/json',Prefer:'return=representation',...(requestId?{'PayPal-Request-Id':requestId}:{})},
    ...(body!==undefined?{body:JSON.stringify(body)}:{}),
    signal:AbortSignal.timeout(8000)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error('paypal_api'),{issue:data.details?.[0]?.issue||data.name||'PAYPAL_ERROR'});
  return data;
}

function signature(payload,secret){return createHmac('sha256',secret).update(payload).digest('hex')}
function cookieValue(req){
  const cookies=String(req.headers.cookie||'').split(';');
  for(const part of cookies){const i=part.indexOf('=');if(i<0)continue;if(part.slice(0,i).trim()===COOKIE_NAME)return decodeURIComponent(part.slice(i+1).trim())}
  return '';
}
function makeOrderCookie(orderId,secret,secure){
  const expires=Math.floor(Date.now()/1000)+24*60*60;
  const payload=`${orderId}.${expires}`;
  const value=`${payload}.${signature(payload,secret)}`;
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax${secure?'; Secure':''}`;
}
function cookieAuthorizes(req,orderId,secret){
  const parts=cookieValue(req).split('.');
  if(parts.length!==3||parts[0]!==orderId||!/^[0-9]{10}$/.test(parts[1])||!/^[a-f0-9]{64}$/.test(parts[2]))return false;
  const expires=Number(parts[1]);
  if(expires<Math.floor(Date.now()/1000)||expires>Math.floor(Date.now()/1000)+25*60*60)return false;
  const expected=Buffer.from(signature(`${parts[0]}.${parts[1]}`,secret),'hex');
  const actual=Buffer.from(parts[2],'hex');
  return expected.length===actual.length&&timingSafeEqual(expected,actual);
}

function validatedPurchase(order,orderId){
  if(order?.id!==orderId||order.intent!=='CAPTURE'||!Array.isArray(order.purchase_units)||order.purchase_units.length!==1)return null;
  const unit=order.purchase_units[0];
  const itemId=String(unit.custom_id||'');
  const item=allowedItems()[itemId];
  if(!item||unit.amount?.currency_code!==CURRENCY||unit.amount?.value!==item.amount)return null;
  return {unit,item,itemId};
}

function receipt(order,orderId,purchase){
  const capture=purchase.unit.payments?.captures?.find(x=>x.status==='COMPLETED');
  if(order.status!=='COMPLETED'||!capture||capture.amount?.currency_code!==CURRENCY||capture.amount?.value!==purchase.item.amount) return null;
  return {status:'COMPLETED',id:orderId,amount:purchase.item.amount,item:purchase.item.name,captureId:capture.id};
}

async function config(req,res,env){
  if(req.method!=='GET')return send(res,405,{error:'Método no permitido'});
  const enabled=checkoutEnabled(env);
  return send(res,200,{enabled,clientId:enabled?env.PAYPAL_CLIENT_ID:null,currency:CURRENCY,items:allowedItems(),environment:enabled?String(env.PAYPAL_ENVIRONMENT).toLowerCase():null});
}

async function orders(req,res,env){
  if(req.method!=='POST')return send(res,405,{error:'Método no permitido'});
  if(!originAllowed(req))return send(res,403,{error:'Origen no permitido'});
  const parsed=readJsonBody(req);if(parsed.error)return send(res,parsed.error==='Formato no válido'?415:parsed.error==='Solicitud demasiado grande'?413:400,{error:parsed.error});
  if(!checkoutEnabled(env))return send(res,503,{error:'El pago en línea aún no está activado. Contacta con SCP.'});
  const itemId=String(parsed.value.itemId||'');
  const item=allowedItems()[itemId];
  if(!item)return send(res,400,{error:'Servicio no disponible para pago en línea'});
  try{
    const requestId=randomUUID();
    const order=await paypalRequest(env,'/v2/checkout/orders',{method:'POST',requestId,body:{
      intent:'CAPTURE',
      purchase_units:[{reference_id:requestId,custom_id:itemId,description:item.name,amount:{currency_code:CURRENCY,value:item.amount}}],
      payment_source:{paypal:{experience_context:{brand_name:'Servicios Canal Puente SCP',shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW'}}}
    }});
    if(!/^[A-Z0-9-]{10,64}$/.test(String(order.id||'')))throw new Error('invalid_order');
    const forwardedProto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
    return send(res,200,{id:order.id},{'Set-Cookie':makeOrderCookie(order.id,env.PAYPAL_CLIENT_SECRET,forwardedProto==='https')});
  }catch(error){
    return send(res,502,{error:'PayPal no ha podido preparar el pedido. No se ha confirmado ningún cobro.',code:'PAYMENT_SETUP_ERROR'});
  }
}

async function loadOwnedOrder(req,orderId,env){
  if(!/^[A-Z0-9-]{10,64}$/.test(orderId)||!cookieAuthorizes(req,orderId,env.PAYPAL_CLIENT_SECRET))return {error:'Pedido no encontrado en esta sesión',status:404};
  const order=await paypalRequest(env,`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
  const purchase=validatedPurchase(order,orderId);
  if(!purchase)return {error:'No se pudo validar el pedido en PayPal',status:409};
  return {order,purchase};
}

async function status(req,res,env){
  if(req.method!=='POST')return send(res,405,{error:'Método no permitido'});
  if(!originAllowed(req))return send(res,403,{error:'Origen no permitido'});
  const parsed=readJsonBody(req);if(parsed.error)return send(res,parsed.error==='Formato no válido'?415:parsed.error==='Solicitud demasiado grande'?413:400,{error:parsed.error});
  if(!checkoutEnabled(env))return send(res,503,{error:'Pago no disponible'});
  const orderId=String(parsed.value.orderId||'');
  try{
    const state=await loadOwnedOrder(req,orderId,env);if(state.error)return send(res,state.status,{error:state.error});
    const paid=receipt(state.order,orderId,state.purchase);
    if(paid)return send(res,200,paid);
    return send(res,200,{status:state.order.status||'UNKNOWN',id:orderId,amount:state.purchase.item.amount,item:state.purchase.item.name});
  }catch(error){return send(res,502,{error:'No se pudo consultar PayPal. Comprueba el estado antes de repetir el pago.',code:'PAYMENT_STATUS_ERROR'});}
}

async function capture(req,res,env){
  if(req.method!=='POST')return send(res,405,{error:'Método no permitido'});
  if(!originAllowed(req))return send(res,403,{error:'Origen no permitido'});
  const parsed=readJsonBody(req);if(parsed.error)return send(res,parsed.error==='Formato no válido'?415:parsed.error==='Solicitud demasiado grande'?413:400,{error:parsed.error});
  if(!checkoutEnabled(env))return send(res,503,{error:'Pago no disponible'});
  const orderId=String(parsed.value.orderId||'');
  try{
    const state=await loadOwnedOrder(req,orderId,env);if(state.error)return send(res,state.status,{error:state.error});
    const alreadyPaid=receipt(state.order,orderId,state.purchase);
    if(alreadyPaid)return send(res,200,alreadyPaid);
    if(state.order.status!=='APPROVED')return send(res,200,{status:state.order.status||'UNKNOWN',id:orderId,amount:state.purchase.item.amount,item:state.purchase.item.name});
    try{
      await paypalRequest(env,`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,{method:'POST',requestId:`SCP-C-${orderId.slice(0,32)}`,body:{}});
    }catch(error){if(error.issue!=='ORDER_ALREADY_CAPTURED')throw error}
    const finalOrder=await paypalRequest(env,`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
    const finalPurchase=validatedPurchase(finalOrder,orderId);
    const finalReceipt=finalPurchase&&receipt(finalOrder,orderId,finalPurchase);
    if(finalReceipt)return send(res,200,finalReceipt);
    return send(res,200,{status:finalOrder.status||'UNKNOWN',id:orderId,amount:state.purchase.item.amount,item:state.purchase.item.name});
  }catch(error){
    return send(res,502,{error:error.issue==='INSTRUMENT_DECLINED'?'PayPal ha rechazado el medio de pago. Puedes elegir otro.':'No se pudo confirmar el pago. Comprueba la actividad de PayPal antes de repetirlo.',code:error.issue==='INSTRUMENT_DECLINED'?'INSTRUMENT_DECLINED':'PAYMENT_CAPTURE_ERROR'});
  }
}

export async function paypalVercelHandler(req,res,route,env=process.env){
  if(route==='config')return config(req,res,env);
  if(!checkoutEnabled(env))return send(res,503,{error:'Pago no disponible'});
  if(route==='orders')return orders(req,res,env);
  if(route==='status')return status(req,res,env);
  if(route==='capture')return capture(req,res,env);
  return send(res,404,{error:'Ruta no disponible'});
}
