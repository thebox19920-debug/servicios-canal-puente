const agendaTZ='Europe/Madrid',agendaLead=5*60*60*1000,agendaHour=60*60*1000;
function agendaJson(data,status=200,cookie){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(cookie?{'Set-Cookie':cookie}:{})}})}
function agendaParts(t){return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:agendaTZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(t)).map(x=>[x.type,x.value]))}
function agendaDay(t){const p=agendaParts(t);return `${p.year}-${p.month}-${p.day}`}
function agendaEpoch(day,time){const wanted=Date.parse(day+'T'+time+':00Z');let result=wanted;for(let i=0;i<3;i++){const p=agendaParts(result);const represented=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);result+=wanted-represented}const p=agendaParts(result);return agendaDay(result)===day&&`${p.hour}:${p.minute}`===time?result:NaN}
function agendaHours(env){try{const h=JSON.parse(env.AGENDA_HOURS_JSON||'{}');if(!h||typeof h!=='object'||Array.isArray(h))return {};for(const [d,blocks] of Object.entries(h)){if(!/^[0-6]$/.test(d)||!Array.isArray(blocks))return {};for(const b of blocks){if(!Array.isArray(b)||b.length!==2||!b.every(t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t))||b[0]>=b[1])return {}}}return h}catch{return {}}}
function agendaValidDay(day,now){if(!/^\d{4}-\d{2}-\d{2}$/.test(day||''))return false;const d=new Date(day+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===day&&day>=agendaDay(now)&&day<=agendaDay(now+90*86400000)}
function agendaSlots(day,now,hours){if(!agendaValidDay(day,now))return [];const weekday=new Date(day+'T12:00:00Z').getUTCDay(),blocks=hours[weekday]||[],out=[];for(let h=0;h<24;h++){const time=String(h).padStart(2,'0')+':00';if(!blocks.some(([a,b])=>time>=a&&h*60+60<=Number(b.slice(0,2))*60+Number(b.slice(3))))continue;const at=agendaEpoch(day,time);if(Number.isFinite(at)&&at-now>=agendaLead)out.push({time,startsAt:at})}return out}
async function agendaHash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
function agendaOwner(request){const raw=request.headers.get('Cookie')?.match(/(?:^|;\s*)lp-agenda=([a-f0-9]{64})(?:;|$)/)?.[1];const token=raw||[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');return {token,cookie:raw?null:`lp-agenda=${token}; Path=/api/agenda; HttpOnly; Secure; SameSite=Strict; Max-Age=15552000`}}
async function agendaApi(request,env,now=Date.now()){
 const u=new URL(request.url),path=u.pathname;
 if(request.method!=='GET'&&(request.method!=='POST'||request.headers.get('Origin')!==u.origin))return agendaJson({error:'Solicitud no permitida.'},403);
 const hours=agendaHours(env),enabled=Object.values(hours).some(a=>a.length>0)&&!!env.DB;
 if(path==='/api/agenda/availability'&&request.method==='GET'){
  const day=u.searchParams.get('date')||agendaDay(now);if(!agendaValidDay(day,now))return agendaJson({error:'Elige una fecha válida dentro de los próximos 90 días.'},400);
  if(!enabled)return agendaJson({enabled:false,slots:[],today:agendaDay(now),minLeadHours:5,timeZone:agendaTZ,hours:{}});
  const owner=agendaOwner(request),hash=await agendaHash(owner.token);
  try{const taken=await env.DB.prepare('SELECT local_time FROM agenda_bookings WHERE local_day = ?').bind(day).all();const occupied=new Set(taken.results.map(r=>r.local_time));const mine=await env.DB.prepare('SELECT id, local_day AS day, local_time AS time FROM agenda_bookings WHERE owner_hash = ? AND starts_at >= ? ORDER BY starts_at LIMIT 1').bind(hash,now).first();return agendaJson({enabled:true,today:agendaDay(now),minLeadHours:5,timeZone:agendaTZ,hours,slots:agendaSlots(day,now,hours).filter(s=>!occupied.has(s.time)),mine},200,owner.cookie)}catch{return agendaJson({error:'No podemos consultar la agenda ahora. Contacta con LEXPUENTE.'},503)}
 }
 if(!enabled)return agendaJson({error:'Consulta la disponibilidad por WhatsApp o correo.'},503);
 if(request.method!=='POST')return agendaJson({error:'Método no permitido.'},405);
 if(Number(request.headers.get('Content-Length'))>1024)return agendaJson({error:'Solicitud demasiado larga.'},413);
 let body;try{const text=await request.text();if(text.length>1024)return agendaJson({error:'Solicitud demasiado larga.'},413);body=JSON.parse(text)}catch{return agendaJson({error:'Solicitud no válida.'},400)}
 const owner=agendaOwner(request),hash=await agendaHash(owner.token);
 if(path==='/api/agenda/book'){
  const {day,time}=body;const slot=agendaSlots(day,now,hours).find(s=>s.time===time);if(!slot)return agendaJson({error:'La hora debe estar dentro del horario de atención y tener al menos cinco horas de antelación.'},400);
  const id=crypto.randomUUID();try{const created=await env.DB.prepare('INSERT INTO agenda_bookings (id, starts_at, local_day, local_time, owner_hash, created_at) SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM agenda_bookings WHERE owner_hash = ? AND starts_at >= ?) ON CONFLICT(starts_at) DO NOTHING RETURNING id').bind(id,slot.startsAt,day,time,hash,now,hash,now).first();if(!created)return agendaJson({error:'Esta hora ya no está disponible o ya tienes una cita pendiente. Actualiza las horas o revisa tu reserva.'},409,owner.cookie);return agendaJson({id,day,time,startsAt:slot.startsAt,timeZone:agendaTZ},201,owner.cookie)}catch{return agendaJson({error:'No se ha podido reservar. Comprueba tu reserva antes de intentarlo otra vez.'},503,owner.cookie)}
 }
 if(path==='/api/agenda/cancel'){
  if(typeof body.id!=='string'||body.id.length>64)return agendaJson({error:'Referencia no válida.'},400);
  try{const result=await env.DB.prepare('DELETE FROM agenda_bookings WHERE id = ? AND owner_hash = ? RETURNING id').bind(body.id,hash).first();return result?agendaJson({cancelled:true},200,owner.cookie):agendaJson({error:'No se ha encontrado tu reserva en este navegador.'},404)}catch{return agendaJson({error:'No se ha podido cancelar. Contacta con LEXPUENTE.'},503)}
 }
 return agendaJson({error:'Ruta no encontrada.'},404);
}
export {agendaApi,agendaSlots,agendaEpoch,agendaHours};
