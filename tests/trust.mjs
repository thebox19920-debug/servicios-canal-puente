import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../dist/server/index.js';
const pages=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=dir+'/'+e.name;if(e.isDirectory())walk(f);else if(f.endsWith('.html'))pages.push(f)}}walk('web');
for(const file of pages){const s=fs.readFileSync(file,'utf8');if(/http-equiv="refresh"/i.test(s))continue;assert(s.includes('href="tel:+34673735059"'),file);assert(!s.includes('about:invalid'),file);assert.equal((s.match(/class="lp-legal-footer"/g)||[]).length,1,file);for(const path of ['aviso-legal','privacidad','cookies','condiciones'])assert(s.includes('href="/'+path+'.html"'),file)}
const home=fs.readFileSync('web/index.html','utf8');assert(home.indexOf('Escudo Triple LEXPUENTE')<home.indexOf('lp-home-hero'));assert(home.includes('Por qué confiar en LEXPUENTE'));assert(home.includes('pendiente de aprobación y activación'));assert(home.includes('foto-original-lexpuente.png'));assert(home.includes('Fundación Prevent y ESADE'));assert(home.includes('exigiremos comprobar'));
for(const slug of ['aviso-legal','privacidad','cookies','condiciones']){const r=await worker.fetch(new Request('https://lex.test/'+slug+'.html'),{});assert.equal(r.status,200);const text=await r.text();assert(text.includes('Versión provisional'));assert(text.includes('lp-legal-footer'))}
console.log('OK: teléfono, tres iconos en portada, autoridad sin avales inventados y cuatro páginas legales enlazadas en todas las páginas.');
