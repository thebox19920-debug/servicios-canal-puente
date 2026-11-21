const adminHex=bytes=>[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
async function adminHash(value){return adminHex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))))}
function adminSame(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
async function adminMac(value,secret){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return adminHex(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value))))}
async function adminUnlocked(req,env,now=Date.now()){
 if(!env.ADMIN_CODE_HASH||!env.ADMIN_SESSION_SECRET)return false;
 const raw=req.headers.get('Cookie')?.match(/(?:^|;\s*)lp_admin_unlock=([A-Za-z0-9_-]+\.[a-f0-9]{64})(?:;|$)/)?.[1];if(!raw)return false;
 try{const [encoded,signature]=raw.split('.');if(!adminSame(signature,await adminMac(encoded,env.ADMIN_SESSION_SECRET)))return false;const data=JSON.parse(atob(encoded.replace(/-/g,'+').replace(/_/g,'/')));return data.id===req.headers.get('oai-authenticated-user-id')&&Number.isSafeInteger(data.exp)&&data.exp>now&&data.exp<=now+1800000}catch{return false}
}
async function adminUnlock(req,env,now=Date.now()){
 if(!env.ADMIN_CODE_HASH||!env.ADMIN_SESSION_SECRET||!env.DB)return Response.json({error:'El acceso con código no está configurado.'},{status:503,headers:{'Cache-Control':'no-store'}});
 let input;try{const raw=await req.text();if(raw.length>512)throw Error();input=JSON.parse(raw)}catch{return Response.json({error:'Solicitud no válida.'},{status:400})}
 const who=req.headers.get('oai-authenticated-user-id'),window=Math.floor(now/900000),count=await env.DB.prepare('INSERT INTO portal_admin_attempts(actor_id,window_id,attempts) VALUES (?,?,1) ON CONFLICT(actor_id) DO UPDATE SET attempts=CASE WHEN window_id=excluded.window_id THEN attempts+1 ELSE 1 END,window_id=excluded.window_id RETURNING attempts').bind(who,window).first();
 if(count.attempts>5)return Response.json({error:'Demasiados intentos. Espera 15 minutos antes de volver a probar.'},{status:429,headers:{'Cache-Control':'no-store','Retry-After':'900'}});
 const code=typeof input.code==='string'?input.code.replace(/\s/g,''):'';if(!/^\d{8}$/.test(code)||!adminSame(await adminHash(code),env.ADMIN_CODE_HASH))return Response.json({error:'Código incorrecto.'},{status:403,headers:{'Cache-Control':'no-store'}});
 const data=btoa(JSON.stringify({id:who,exp:now+1800000,nonce:crypto.randomUUID()})).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');const token=data+'.'+await adminMac(data,env.ADMIN_SESSION_SECRET);
 return Response.json({unlocked:true,url:'/administracion.html'},{headers:{'Cache-Control':'no-store','Set-Cookie':'lp_admin_unlock='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=1800'}});
}
export {adminUnlocked,adminUnlock};
