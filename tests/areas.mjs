import assert from 'node:assert/strict';
import fs from 'node:fs';
import {catalog} from '../worker/catalog.mjs';
import worker from '../dist/server/index.js';
const offers=JSON.parse(fs.readFileSync('config/carriles.json')).offers;
const design=JSON.parse(fs.readFileSync('design/areas-services.json'));
for(const [area,label] of Object.entries(design.labels)){
 for(const path of [`web/areas/${area}.html`,`web/areas/${area}/index.html`]){
  const h=fs.readFileSync(path,'utf8');assert(h.includes(`<h1>${label}</h1>`));assert(h.includes(`<title>${label}</title>`));
  if(!design.cards[area])continue;
  assert.equal((h.match(/class="health-card(?: [^"]*)?"/g)||[]).length,design.cards[area],area);
  for(const m of h.matchAll(/src="(\/assets\/areas\/[^"?]+)/g))assert(fs.existsSync('web'+m[1]),m[1]);
  for(const m of h.matchAll(/\/contratar\?servicio=([a-z-]+)/g)){if(catalog[m[1]])assert.equal(catalog[m[1]].area,area);else assert(offers.some(o=>o.id===m[1]&&o.area===area),m[1]);}
  for(const t of ['pendiente de definir','tarifas pendientes','precios son simulados','Catálogo orientativo','Preparación de gestiones'])assert(!h.includes(t),t);
 }
 for(const path of [`/areas/${area}`,`/areas/${area}.html`,`/areas/${area}/index.html`]){
  const r=await worker.fetch(new Request('https://lex.test'+path),{});assert.equal(r.status,200);assert((await r.text()).includes(`<h1>${label}</h1>`));
 }
}
let wanted;
globalThis.fetch=async(url,opt)=>url.endsWith('oauth2/token')?Response.json({access_token:'test-areas',expires_in:3600}):(()=>{assert.equal(JSON.parse(opt.body).purchase_units[0].amount.value,wanted);return Response.json({id:'AREASTEST12345',status:'CREATED'});})();
const env={PAYPAL_CLIENT_ID:'test',PAYPAL_CLIENT_SECRET:'test',PAYPAL_ENVIRONMENT:'sandbox',BUCKET:{async put(){}}};
for(const [id,item] of Object.entries(design.new_payments)){
 wanted=item.amount;assert.equal(catalog[id].amount,wanted);
 const r=await worker.fetch(new Request('https://lex.test/api/paypal/orders',{method:'POST',headers:{Origin:'https://lex.test','Content-Type':'application/json'},body:JSON.stringify({itemId:id,amount:'0.01'})}),env);assert.equal(r.status,200,id);
}
const c=fs.readFileSync('web/areas/comunica.html','utf8');assert(c.includes('NUEVO PROGRAMA · PRÓXIMAMENTE'));assert(!c.match(/id="programa"[\s\S]*?\/pagar(?=[\s\S]*?<article)/));
console.log('OK: seis títulos y rutas, 17 tarjetas e imágenes, 12 precios protegidos y programa sin cobro. Sin pagos reales.');
