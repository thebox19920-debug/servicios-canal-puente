import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../dist/server/index.js';
const direct=async(p,method='GET')=>worker.fetch(new Request('https://lex.test'+p,{method}),{});
const get=async p=>{const r=await direct(p);return r.status===302?direct(r.headers.get('Location')):r};
for(const query of ['', '?origen=app', '?utm_source=whatsapp']){const r=await direct('/'+query);assert.equal(r.status,302);assert.equal(r.headers.get('Location'),'/index.html'+query);assert(r.headers.get('Cache-Control').includes('no-store'));}
assert.equal((await direct('/','HEAD')).status,302);
const r=await get('/'),i=await get('/index.html');assert.equal(r.status,200);assert.equal(i.status,200);
const a=new Uint8Array(await r.arrayBuffer()),b=new Uint8Array(await i.arrayBuffer());assert.deepEqual(a,b);
const text=new TextDecoder().decode(a);assert(text.includes('CONOCE LEXPUENTE'));assert(text.includes('VER LAS ÁREAS DE ACTIVIDAD LEXPUENTE'));assert(!text.includes('Ver las siete áreas'));assert(!text.includes('Sobre LEXPUENTE'));
assert.equal(fs.readdirSync('web').filter(p=>p==='index.html').length,1);
const files=[];function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const f=p+'/'+e.name;if(e.isDirectory())walk(f);else if(f.endsWith('.html'))files.push(f)}}walk('web');
let menus=0;for(const path of files){const s=fs.readFileSync(path,'utf8');for(const nav of s.matchAll(/<nav\b[\s\S]*?<\/nav>/g)){assert(!nav[0].includes('Sobre LEXPUENTE'),path);assert(!nav[0].includes('Ver las siete áreas'),path);if(/CONOCE LEXPUENTE/.test(nav[0]))menus++}}
const areas=await (await get('/areas-de-actividad.html')).text();assert(areas.includes('VER LAS ÁREAS DE ACTIVIDAD LEXPUENTE'));assert(areas.includes('CONOCE LEXPUENTE'));
for(const path of ['/','/index.html','/areas-de-actividad.html','/assets/lexpuente-mobile.js','/assets/lexpuente-area-titles.css','/manifest.webmanifest']){
 const x=await get(path);assert.equal(x.status,200,path);assert(x.headers.get('Cache-Control').includes('no-store'),path);assert.equal(x.headers.get('CDN-Cache-Control'),'no-store');
}
assert.equal((await worker.fetch(new Request('https://lex.test/',{method:'HEAD'}),{})).status,302);
console.log(`OK: portada idéntica byte por byte (${a.length} bytes), un único index raíz, ${menus} menús comprobados y respuestas actualizables sin almacenamiento de HTML/JS/CSS/manifest.`);
