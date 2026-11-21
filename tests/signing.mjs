import templates from '../config/contract-templates.json' with {type:'json'};
import assert from 'node:assert/strict';
import {createContractDraft} from '../worker/contract-templates.mjs';
import {signingApi,signingDocument,identityFormat} from '../worker/signing.mjs';
const store=new Map(),env={BUCKET:{async get(k){const s=store.get(k);return s?{async json(){return JSON.parse(s)}}:null},async put(k,v,opts){if(opts?.onlyIf&&store.has(k))return null;store.set(k,v);return {}},async list({prefix}){return {objects:[...store.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key})),truncated:false}}},DB:{prepare(){return {bind(){return {async first(){return {email:'specialist@example.test',name:'Persona de Prueba'}}}}}}}};
const d={sector:'sanidad',email:'specialist@example.test',name:'Persona de Prueba',identityType:'DNI',identityNumber:'12345678Z',profession:'Responsable',businessName:'Negocio Prueba',businessLegalName:'Empresa Prueba',businessTaxId:'NIF-PRUEBA',businessAddress:'Domicilio de pruebas',founderName:'Fundadora Prueba',founderIdentity:'IDENTIDAD-PRUEBA',founderEmail:'owner@example.test',catalogueTerms:'Servicio de prueba: 20 EUR IVA incluido. Comisión 10%. Vigencia 1 año. Plazo 48 horas. Cancelación antes del servicio. SOLO PRUEBA.',college:'Colegio de pruebas',collegeNumber:'000',registrationNumber:'TEST'};
store.set('portal/details/'+encodeURIComponent(d.email)+'.json',JSON.stringify(d));
const owner={id:'owner',email:'owner@example.test'},specialist={id:'specialist',email:d.email};
const call=(path,input,who=owner,admin=true)=>signingApi(new Request('https://test/api/portal/'+path,{method:input?'POST':'GET',...(input?{body:JSON.stringify(input)}:{})}),env,path,who,admin);
for(const sector of ['sanidad','administrativo','bienestar','academia']){const doc=signingDocument({...d,sector});for(const text of [d.name,d.businessName,d.identityNumber,d.founderName])assert(JSON.stringify(doc).includes(text));assert(!doc.contract.includes('[Nombre'));assert(doc.contract.includes('[Especificar servicio]'));assert(!doc.catalogue.includes(d.catalogueTerms));assert(!doc.contract.includes('{{'));}
const word=new TextDecoder().decode(createContractDraft(d).bytes);assert(word.includes(d.founderName));assert(word.includes('[Especificar servicio]'));assert(word.includes('6B1D2F'));
assert.equal(signingDocument({...d,sector:'inmobiliario'}),null);assert(identityFormat('DNI','12345678Z'));assert(!identityFormat('DNI','12345678A'));assert(!identityFormat('Otro documento oficial','PRUEBA-NO-VALIDO'));
assert.equal((await call('admin/signing/create',d)).status,409);
// Test the signature mechanics with a fixed, approved test tariff injected only in this process.
const original=templates.sanidad.text;templates.sanidad.text=original.replaceAll('[Especificar servicio]','Servicio fijo de prueba').replaceAll('[0,00 €]','20,00 €').replaceAll('[__ %]','10 %').replaceAll('[Ej. 7 días / Fin tratamiento]','48 horas');
let r=await call('admin/signing/create',d);assert.equal(r.status,201);const {id}=await r.json();const record=JSON.parse(store.get('portal/signing/'+id+'/request.json'));
assert.equal((await call('signing/'+id,null,{id:'intruder',email:'other@example.test'},false)).status,403);
const strokes=[Array.from({length:10},(_,i)=>[i*10,50+i])],payload={name:d.name,accepted:true,documentHash:record.documentHash,strokes};
assert.equal((await call('signing/'+id+'/sign',{...payload,documentHash:'stale'},specialist,false)).status,400);
assert.equal((await call('signing/'+id+'/sign',{...payload,accepted:false},specialist,false)).status,400);
assert.equal((await call('signing/'+id+'/sign',payload,specialist,false)).status,201);
assert.equal((await call('signing/'+id+'/sign',payload,specialist,false)).status,409);
assert.equal((await call('signing/'+id+'/sign',{...payload,name:d.founderName})).status,201);
assert.equal((await (await call('signing/'+id,null,specialist,false)).json()).state,'signed');
store.set('portal/details/'+encodeURIComponent(d.email)+'.json',JSON.stringify({...d,businessTaxId:'CHANGED'}));
assert.equal((await (await call('signing/list',null,specialist,false)).json()).items[0].currentProfile,false);
assert.equal((await call('signing/'+id+'/sign',payload,specialist,false)).status,409);
templates.sanidad.text=original;
console.log('OK: autofill four sectors, founder and catalogue, identity format, private recipients, document binding, explicit consent, two signatures, no overwrite, stale profiles invalidated. No real contracts signed.');
