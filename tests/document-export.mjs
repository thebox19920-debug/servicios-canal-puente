import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
let clicked=false,blob;
const context=vm.createContext({window:{},TextEncoder,Uint8Array,DataView,Blob,URL:{createObjectURL(b){blob=b;return 'blob:test'},revokeObjectURL(){}},document:{createElement(tag){assert.equal(tag,'a');return {click(){clicked=true}}}},setTimeout(fn){fn()}});
vm.runInContext(fs.readFileSync('web/assets/lexpuente-document-export.js','utf8'),context);
context.window.lexpuenteDocumentExport.download({contract:'NOMBRE PERSONALIZADO <&>\nDIRECCIÓN DE CONTACTO 123',catalogue:'NEGOCIO Y PRECIOS 456'},'contrato.docx');assert(clicked);assert(blob);const b=new Uint8Array(await blob.arrayBuffer()),raw=new TextDecoder().decode(b);assert(raw.includes('NOMBRE PERSONALIZADO &lt;&amp;&gt;'));assert(raw.includes('DIRECCIÓN DE CONTACTO 123'));assert(raw.includes('NEGOCIO Y PRECIOS 456'));assert.equal(new DataView(b.buffer).getUint32(0,true),0x04034b50);
console.log('OK: descarga DOCX ejecutada con el documento personalizado, contenido y escape XML conservados.');
