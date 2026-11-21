import {adminUnlocked} from './admin-access.mjs';
const statsHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const statsJSON=(body,status=200)=>Response.json(body,{status,headers:statsHeaders});
function statsOwner(request,env){return !!env.STATISTICS_OWNER_EMAIL && !!request.headers.get('oai-authenticated-user-id') && request.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.STATISTICS_OWNER_EMAIL.toLowerCase()}
function statsDay(now=Date.now()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now))}
function statsOffsetDay(day,n){return new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10)}
function statsCountable(request,env,path){return request.method==='GET' && !statsOwner(request,env) && !/(?:^|;\s*)lp_exclude_visits=1(?:;|$)/.test(request.headers.get('Cookie')||'') && !/^\/(?:acceso-lexpuente|estadisticas|mi-cuenta|administracion|registro|iniciar-sesion|pagar|suscribirme|contratar)(?:[/.]|$)/.test(path) && !/bot|crawler|spider|headless|preview|facebookexternalhit|slurp/i.test(request.headers.get('User-Agent')||'') && !/prefetch|prerender/i.test((request.headers.get('Purpose')||'')+' '+(request.headers.get('Sec-Purpose')||''))}
async function recordStatsView(request,env,path){if(!env.DB||!env.ADMIN_SESSION_SECRET||!statsCountable(request,env,path))return;const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)lp_visitor=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return;try{const day=statsDay(),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.ADMIN_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']),hash=[...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('visitor:'+day.slice(0,4)+':'+token)))].map(b=>b.toString(16).padStart(2,'0')).join('');await env.DB.prepare('INSERT INTO site_pageviews (local_day,page_path,views) VALUES (?,?,1) ON CONFLICT(local_day,page_path) DO NOTHING').bind(day,'visitor:'+hash).run()}catch{}}
async function visitorConsent(request,env){
 const url=new URL(request.url);if(request.method!=='POST'||request.headers.get('Origin')!==url.origin||request.headers.get('Content-Type')!=='application/json')return statsJSON({error:'Solicitud no permitida.'},403);
 let input;try{const text=await request.text();if(text.length>512)throw Error();input=JSON.parse(text)}catch{return statsJSON({error:'Solicitud no válida.'},400)}
 if(input.consent!==true)return new Response(null,{status:204,headers:{...statsHeaders,'Set-Cookie':'lp_visitor=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax'}});
 if(statsOwner(request,env)||/(?:^|;\s*)lp_exclude_visits=1(?:;|$)/.test(request.headers.get('Cookie')||''))return new Response(null,{status:204,headers:statsHeaders});
 const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)lp_visitor=([a-f0-9]{64})(?:;|$)/)?.[1]||[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');
 const h=new Headers(request.headers);h.set('Cookie',(h.get('Cookie')||'')+'; lp_visitor='+token);await recordStatsView(new Request(request.url,{method:'GET',headers:h}),env,'/index.html');
 return new Response(null,{status:204,headers:{...statsHeaders,'Set-Cookie':'lp_visitor='+token+'; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax'}});
}
async function statisticsApi(request,env,now=Date.now()){
 if(request.method!=='GET')return statsJSON({error:'Método no permitido'},405);
 if(!request.headers.get('oai-authenticated-user-id'))return statsJSON({error:'Inicia sesión para ver tus estadísticas.',signIn:'/signin-with-chatgpt?return_to=%2Festadisticas.html'},401);
 if(!statsOwner(request,env))return statsJSON({error:'Este panel está reservado a la propietaria de LEXPUENTE.'},403);
 if(!await adminUnlocked(request,env))return statsJSON({error:'Primero introduce tu código en Acceso LEXPUENTE.',codeRequired:true,url:'/acceso-scp.html'},423);
 if(!env.DB)return statsJSON({error:'Las estadísticas todavía no están disponibles.'},503);
 try{const today=statsDay(now),date=new Date(today+'T12:00:00Z'),weekday=(date.getUTCDay()+6)%7,week=statsOffsetDay(today,-weekday),month=today.slice(0,7)+'-01',year=today.slice(0,4)+'-01-01';
 const results=await env.DB.batch([today,week,month,year].map(first=>env.DB.prepare("SELECT COUNT(DISTINCT page_path) AS total FROM site_pageviews WHERE page_path LIKE 'visitor:%' AND local_day >= ? AND local_day <= ?").bind(first,today)));
 const result=statsJSON({metric:'unique_visitors',timeZone:'Europe/Madrid',today:Number(results[0].results[0].total),week:Number(results[1].results[0].total),month:Number(results[2].results[0].total),year:Number(results[3].results[0].total)});result.headers.append('Set-Cookie','lp_exclude_visits=1; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax');return result;
 }catch{return statsJSON({error:'No se pueden consultar las estadísticas ahora. Vuelve a intentarlo.'},503)}
}
export {visitorConsent,statisticsApi,recordStatsView,statsOwner,statsCountable,statsDay};
