import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {catalog} from '../worker/catalog.mjs';
import worker from '../dist/server/index.js';
const offers=JSON.parse(readFileSync('config/carriles.json','utf8')).offers;
const page=readFileSync('web/areas/sanidad.html','utf8');
assert.equal((page.match(/class="health-card(?: [^"]*)?"/g)||[]).length,18);
assert.equal((page.match(/class="health-poster"/g)||[]).length,18);
for(const old of ['pendiente de definir','Tarifas ilustrativas','importes son simulados','campañas está activa'])assert(!page.includes(old));
assert(!page.split('<section id="pacientes"')[1].includes('Venta y explicación de presupuestos'));
for(const match of page.matchAll(/src="(\/assets\/sanidad\/[^\"]+)"/g))assert(existsSync('web'+match[1].split('?')[0]),match[1]);
for(const m of page.matchAll(/\/contratar\?servicio=([a-z-]+)/g))assert(catalog[m[1]]||offers.some(o=>o.id===m[1]&&o.area==='sanidad'),m[1]);
const expected={'salud-acompanamiento':'49.00','salud-interpretacion':'65.00','salud-orientacion':'35.00','salud-cita':'39.00','salud-documentos':'49.00','salud-segunda-opinion':'65.00','salud-seguimiento':'79.00','salud-campana':'200.00','clinic-esencial':'149.00','clinic-plus':'349.00','clinic-premium':'699.00'};
let wanted;
globalThis.fetch=async(url,opt={})=>url.endsWith('oauth2/token')?Response.json({access_token:'health-test',expires_in:3600}):(()=>{const order=JSON.parse(opt.body);assert.equal(order.purchase_units[0].amount.value,wanted);return Response.json({id:'HEALTHTEST12345',status:'CREATED'})})();
const env={PAYPAL_CLIENT_ID:'test',PAYPAL_CLIENT_SECRET:'test',PAYPAL_ENVIRONMENT:'sandbox',BUCKET:{async put(){},async get(){return null}}};
for(const [id,amount] of Object.entries(expected)){
 assert.equal(catalog[id].amount,amount);wanted=amount;
 const r=await worker.fetch(new Request('https://lex.test/api/paypal/orders',{method:'POST',headers:{Origin:'https://lex.test','Content-Type':'application/json'},body:JSON.stringify({itemId:id,amount:'0.01'})}),env);assert.equal(r.status,200,id);
}
for(const path of ['/areas/sanidad','/areas/sanidad.html','/areas/sanidad/index.html']){const r=await worker.fetch(new Request('https://lex.test'+path),env);assert.equal(r.status,200);assert((await r.text()).includes('health-card'));}
console.log('OK: 18 imágenes y tarjetas, rutas, catálogo sanitario y precios de pago protegidos frente a importes manipulados. Sin cobros reales.');
