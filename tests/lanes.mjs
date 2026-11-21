import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../dist/server/index.js';
import {catalog} from '../worker/catalog.mjs';
const config=JSON.parse(fs.readFileSync('config/carriles.json','utf8'));
const get=(path)=>worker.fetch(new Request('https://lex.test'+path),{});
assert.equal(config.offers.length,102);assert.equal(config.offers.filter(o=>o.lane==='LP-01').length,28);assert.equal(config.offers.filter(o=>o.lane==='LP-02').length,74);
for(const id of Object.keys(catalog)){assert.equal(config.payments[id],'LP-01',id);const response=await get('/api/checkout/resolve?servicio='+id);assert.equal(response.status,200);const body=await response.json();assert.deepEqual(body,{action:'checkout',url:'/pagar?servicio='+id});}
for(const offer of config.offers.filter(o=>o.lane==='LP-02')){const r=await get('/api/checkout/resolve?servicio='+offer.id);assert.equal(r.status,200,offer.id);const b=await r.json();assert.equal(b.action,'quote');assert(!JSON.stringify(b).includes('LP-02'));assert(b.contact.startsWith('https://wa.me/34673735059'));assert.equal(b.upcoming,offer.status==='proximamente');}
for(const id of ['constructor','__proto__','not-a-service']){assert((await get('/api/checkout/resolve?servicio='+id)).status>=400);}
let providerCalls=0;globalThis.fetch=async()=>{providerCalls++;throw Error('No provider may be called')};const env={PAYPAL_CLIENT_SECRET:'test',BUCKET:{put:async()=>{}}};for(const id of ['sanidad-ortodoncia','producto-hilo-dental-encerado','constructor']){const r=await worker.fetch(new Request('https://lex.test/api/paypal/orders',{method:'POST',headers:{Origin:'https://lex.test','Content-Type':'application/json'},body:JSON.stringify({itemId:id,amount:'1.00',lane:'LP-01'})}),env);assert.equal(r.status,400,id)}assert.equal(providerCalls,0);
for(const area of ['tramites','sanidad','vivienda','bienestar','comunica','academia']){const html=await(await get('/areas/'+area+'.html')).text();assert(!html.includes('Pagos y planes'));assert(!html.includes('Código interno'));assert(html.includes('lp-service-code'));assert(html.includes('lp-v1')||html.includes('lp-v2'));assert(html.includes('lexpuente-cards.css'));}
const css=await(await get('/assets/lexpuente-cards.css')).text();assert(css.includes('#1c4a37'));assert(css.includes('#63172a'));
for(const path of ['/config/carriles.json','/docs/CARRILES.md','/worker/lanes.mjs'])assert.equal((await get(path)).status,404,path);
for(const path of ['/pagos-y-planes.html','/pago-protegido.html']){const text=await(await get(path)).text();assert(!/Stripe|Escudo Triple|custodia|PayPal/.test(text));assert(text.includes('/servicios.html'));}
const mobile=fs.readFileSync('web/assets/lexpuente-mobile.js','utf8');assert(!mobile.includes('Servicios propios · PayPal'));assert(!mobile.includes('Pago protegido · Próximamente'));
console.log('OK: clasificación, códigos visibles sin leyenda, cobros propios y consultas externas separados. Sin dinero real.');
