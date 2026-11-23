(() => {
'use strict';
const form=document.getElementById('lp-service-search'),serviceInput=document.getElementById('lp-service-need'),locationInput=document.getElementById('lp-service-location');
const demandsRoot=document.getElementById('scp-demo-demands'),offersRoot=document.getElementById('scp-demo-offers'),market=document.getElementById('scp-demo-marketplace');
if(!form||!serviceInput||!locationInput||!demandsRoot||!offersRoot||!market)return;
const demands=[
{code:'SCP-TIT-88401',title:'Atención integral a mayores',sector:'Salud y bienestar',city:'Barcelona, Gràcia',budget:'15–20 €/h',description:'Acompañamiento cotidiano y apoyo en tareas personales. Preferencia por atención cercana y horario acordado.',terms:'mayores cuidadora sad salud bienestar atención acompañamiento'},
{code:'SCP-TIT-88402',title:'Limpieza dental y revisión preventiva',sector:'Salud y odontología',city:'Madrid, Centro',budget:'80–130 €',description:'Busca una primera valoración y conocer por escrito el alcance y el precio antes de reservar.',terms:'odontología dentista dental higiene limpieza revisión'},
{code:'SCP-TIT-88403',title:'Renovación de autorización de residencia',sector:'Trámites y documentación',city:'Valencia, Extramurs',budget:'120–180 €',description:'Necesita revisar documentación, plazos y pasos para presentar una renovación correctamente.',terms:'trámites extranjería residencia documentación renovación inmigración'},
{code:'SCP-TIT-88404',title:'Búsqueda de vivienda de alquiler',sector:'Vivienda e inmobiliaria',city:'Sevilla, Triana',budget:'180–260 €',description:'Solicita apoyo para localizar opciones adecuadas y ordenar la documentación del alquiler.',terms:'vivienda alquiler inmobiliaria piso búsqueda'},
{code:'SCP-TIT-88405',title:'Clases de matemáticas para la PAU',sector:'Academia y formación',city:'Zaragoza, Universidad',budget:'20–30 €/h',description:'Refuerzo individual con planificación semanal y ejercicios adaptados al temario de acceso.',terms:'clases particulares academia formación matemáticas pau'},
{code:'SCP-TIT-88406',title:'Fisioterapia para recuperar movilidad',sector:'Bienestar y salud',city:'Bilbao, Abando',budget:'40–55 €/sesión',description:'Busca una valoración inicial y un plan progresivo de sesiones, con horarios por acordar.',terms:'fisioterapia bienestar salud movilidad rehabilitación'},
{code:'SCP-TIT-88407',title:'Homologación y organización documental',sector:'Trámites y documentación',city:'Online / Internacional',budget:'180–240 €',description:'Necesita organizar títulos y justificantes para recibir orientación sobre el proceso de homologación.',terms:'gestión documental documentación homologación estudios extranjería trámites online internacional'},
{code:'SCP-TIT-88408',title:'Página web para pequeño negocio',sector:'Comunicación y visibilidad',city:'Bogotá, Colombia · Online',budget:'400–700 €',description:'Solicita una web clara para presentar servicios, con estructura sencilla y diseño adaptable a móvil.',terms:'diseño web página internet comunicación digital online'},
{code:'SCP-TIT-88409',title:'Traducción para una cita administrativa',sector:'Trámites y documentación',city:'París, Francia · Online',budget:'80–110 €',description:'Busca apoyo lingüístico para preparar una cita y comprender la documentación asociada.',terms:'traducción interpretación trámites acompañamiento Francia París'},
{code:'SCP-TIT-88410',title:'Asesoramiento para compra de vivienda',sector:'Vivienda e inmobiliaria',city:'Lisboa, Portugal · Online',budget:'100–180 €',description:'Quiere ordenar dudas y revisar los pasos iniciales antes de avanzar con una posible compra.',terms:'asesoría inmobiliaria vivienda compra piso valoración Lisboa'}
];
const specialists=[
{name:'Red Cuida Cercana',sector:'Atención a mayores · SAD',city:'Barcelona, Gràcia',price:'20 €/h (orientativo)',response:'Plazo por confirmar',rating:'Valoraciones no disponibles',terms:'cuidadora cuidador sad mayores salud bienestar acompañamiento'},
{name:'Clínica Dental Riu',sector:'Odontología preventiva',city:'Madrid, Centro',price:'115 € (orientativo)',response:'Plazo por confirmar',rating:'Valoraciones no disponibles',terms:'odontología dentista dental higiene limpieza revisión'},
{name:'Marina Soler · Gestiones',sector:'Extranjería y documentación',city:'Valencia, Extramurs',price:'160 € (orientativo)',response:'Plazo por confirmar',rating:'Valoraciones no disponibles',terms:'trámites extranjería residencia documentación asesoría legal'},
{name:'Puerta Abierta Vivienda',sector:'Alquiler residencial',city:'Sevilla, Triana',price:'230 € (orientativo)',response:'Plazo por confirmar',rating:'Valoraciones no disponibles',terms:'vivienda alquiler inmobiliaria piso asesoría'},
{name:'Aula Norte',sector:'Refuerzo de matemáticas',city:'Zaragoza, Universidad',price:'25 €/h (orientativo)',response:'Plazo por confirmar',rating:'Valoraciones no disponibles',terms:'clases particulares academia formación matemáticas pau'},
{name:'Centro Brújula',sector:'Fisioterapia y movilidad',city:'Bilbao, Abando',price:'48 €/sesión (orientativo)',response:'Plazo por confirmar',rating:'Valoraciones no disponibles',terms:'fisioterapia bienestar salud movilidad rehabilitación'},
{name:'Carpeta Clara',sector:'Homologación documental',city:'Online / Internacional',price:'210 € (orientativo)',response:'Plazo por confirmar',rating:'Valoraciones no disponibles',terms:'gestión documental documentación homologación estudios trámites online internacional'},
{name:'Estudio Lumen',sector:'Diseño web',city:'Bogotá, Colombia · Online',price:'580 € (orientativo)',response:'Plazo por confirmar',rating:'Valoraciones no disponibles',terms:'diseño web página internet comunicación digital online'},
{name:'Ponte Lingua',sector:'Traducción e interpretación',city:'París, Francia · Online',price:'95 € (orientativo)',response:'Plazo por confirmar',rating:'Valoraciones no disponibles',terms:'traducción interpretación trámites documentación París Francia'},
{name:'Casa Serena',sector:'Orientación inmobiliaria',city:'Lisboa, Portugal · Online',price:'145 € (orientativo)',response:'Plazo por confirmar',rating:'Valoraciones no disponibles',terms:'asesoría inmobiliaria vivienda compra piso valoración Lisboa'}
];
const normalize=value=>String(value||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\/-]/g,' ').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
const status=document.getElementById('scp-demo-search-status'),demandCount=document.getElementById('scp-demo-demand-count'),offerCount=document.getElementById('scp-demo-offer-count'),empty=document.getElementById('scp-demo-empty'),quickArea=document.getElementById('scp-demo-quick-area'),quickAreaLink=document.getElementById('scp-demo-quick-area-link');
const dialog=document.getElementById('scp-demo-dialog'),dialogTitle=document.getElementById('scp-demo-dialog-title'),dialogCopy=document.getElementById('scp-demo-dialog-copy'),dialogCta=document.getElementById('scp-demo-dialog-cta');
const areaLinks=[
{label:'Salud y Odontología',href:'/areas/sanidad.html',terms:['odontologia','dental','dentista','limpieza','salud','fisioterapia']},
{label:'Trámites y documentación',href:'/areas/tramites.html',terms:['tramites','extranjeria','documental','documentacion','residencia','homologacion','traduccion']},
{label:'Vivienda e inmobiliaria',href:'/areas/vivienda.html',terms:['vivienda','inmobiliaria','alquiler','piso','inmueble']},
{label:'Academia y formación',href:'/areas/academia.html',terms:['academia','clases','formacion','matematicas','pau']},
{label:'Bienestar integral',href:'/areas/bienestar.html',terms:['bienestar','emocional','movilidad','rehabilitacion']},
{label:'Comunicación y visibilidad',href:'/comunica.html',terms:['comunicacion','redes sociales','diseno web','web','digital']}
];
const getArea=query=>areaLinks.find(area=>area.terms.some(term=>query.includes(normalize(term))))||null;
const match=(item,service,location)=>{
const searchable=normalize([item.title,item.sector,item.name||'',item.terms].join(' ')),place=normalize(item.city),words=service.split(' ').filter(word=>word.length>2);
const serviceMatch=!words.length||words.every(word=>searchable.includes(word));
const locationMatch=!location||place.includes(location)||(location==='online'&&searchable.includes('online'))||(location==='internacional'&&/internacional|online|francia|colombia|portugal/.test(place))||(location==='mexico'&&place.includes('mexico'));
return serviceMatch&&locationMatch;
};
function createCard(item,type){
const card=document.createElement('article');card.className='scp-demo-card scp-demo-card--'+type;
const top=document.createElement('div');top.className='scp-demo-card__top';
const code=document.createElement('span');code.className='scp-demo-card__code';code.textContent=type==='demand'?'ID · '+item.code:'Perfil ilustrativo';
const sample=document.createElement('span');sample.className='scp-demo-card__demo';sample.textContent='EJEMPLO';top.append(code,sample);
const title=document.createElement('h4');title.className='scp-demo-card__title';title.textContent=type==='offer'?item.name:item.title;
const specialty=document.createElement('p');specialty.className='scp-demo-card__specialty';specialty.textContent=type==='offer'?item.sector+' · '+item.response:item.sector;
const place=document.createElement('p');place.className='scp-demo-card__location';place.textContent=item.city;
const price=document.createElement('p');price.className='scp-demo-card__price';price.textContent=type==='offer'?'Precio orientativo de ejemplo: '+item.price:'Presupuesto estimado de ejemplo: '+item.budget;
const meta=document.createElement('p');meta.className='scp-demo-card__rating';meta.textContent=type==='offer'?item.rating:'Estado: ejemplo de solicitud, sin publicación real.';
if(type==='demand'){const description=document.createElement('p');description.className='scp-demo-card__description';description.textContent=item.description;card.append(top,title,specialty,place,price,description)}else card.append(top,title,specialty,place,price,meta);
const disclosure=document.createElement('p');disclosure.className='scp-demo-card__verification';disclosure.textContent=type==='offer'?'Perfil de muestra · no verificado por SCP':'Solicitud de muestra · sin trazabilidad real';
const button=document.createElement('button');button.className='scp-demo-card__button';button.type='button';button.textContent=type==='offer'?'Ver ficha de ejemplo':'Ver trazabilidad (demo)';button.addEventListener('click',()=>openDetails(item,type));
card.append(disclosure,button);return card;
}
function openDetails(item,type){
dialogTitle.textContent=type==='offer'?item.name:item.title;
dialogCopy.textContent=type==='offer'?item.sector+' · '+item.city+' · '+item.price+'. Este perfil es un ejemplo ilustrativo, no ha sido verificado por SCP y no representa una oferta disponible.':item.sector+' · '+item.city+' · '+item.description+' Presupuesto de ejemplo: '+item.budget+'. Esta solicitud no pertenece a una persona real y no tiene trazabilidad activa.';
dialogCta.textContent=type==='offer'?'Solicitar información a SCP':'Registrar solicitud';dialogCta.href=type==='offer'?'/registro.html?tipo=especialista':'/registro.html?tipo=titular&solicitud=servicio';
if(typeof dialog.showModal==='function')dialog.showModal();
}
function render(){
const service=normalize(serviceInput.value),location=normalize(locationInput.value),filteredDemands=demands.filter(item=>match(item,service,location)),filteredSpecialists=specialists.filter(item=>match(item,service,location));
demandsRoot.replaceChildren(...filteredDemands.map(item=>createCard(item,'demand')));offersRoot.replaceChildren(...filteredSpecialists.map(item=>createCard(item,'offer')));
if(demandCount)demandCount.textContent='('+filteredDemands.length+')';if(offerCount)offerCount.textContent='('+filteredSpecialists.length+')';
const total=filteredDemands.length+filteredSpecialists.length;
if(status)status.textContent='Mostrando '+total+' ejemplos ilustrativos ('+filteredDemands.length+' solicitudes y '+filteredSpecialists.length+' perfiles).';if(empty)empty.hidden=total>0;
const area=getArea(service);if(area&&quickArea&&quickAreaLink){quickArea.hidden=false;quickAreaLink.href=area.href;quickAreaLink.textContent='Explorar también el área completa de '+area.label+' →'}else if(quickArea&&quickAreaLink){quickArea.hidden=true;quickAreaLink.removeAttribute('href');quickAreaLink.textContent=''}
}
let scrollTimer;const scrollToMarket=()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>market.scrollIntoView({behavior:'smooth',block:'start'}),180)};
form.addEventListener('submit',event=>{event.preventDefault();render();market.scrollIntoView({behavior:'smooth',block:'start'})});
const onInput=()=>{render();if(serviceInput.value.trim()||locationInput.value.trim())scrollToMarket()};serviceInput.addEventListener('input',onInput);locationInput.addEventListener('input',onInput);
document.querySelector('.scp-demo-dialog__close')?.addEventListener('click',()=>dialog.close());dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});render();
})();