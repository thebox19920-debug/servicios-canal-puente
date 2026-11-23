(() => {
'use strict';
const form=document.getElementById('lp-service-search'),serviceInput=document.getElementById('lp-service-need'),locationInput=document.getElementById('lp-service-location'),market=document.getElementById('scp-demo-marketplace');
const demandsRoot=document.getElementById('scp-demo-demands'),offersRoot=document.getElementById('scp-demo-offers'),areaRoot=document.getElementById('scp-area-options'),serviceRoot=document.getElementById('scp-service-options');
if(!form||!serviceInput||!locationInput||!market||!demandsRoot||!offersRoot||!areaRoot||!serviceRoot)return;
const areas=[
{id:'tramites',label:'Trámites y documentación',href:'/areas/tramites.html',aliases:['tramites','extranjeria','homologacion','nacionalidad','residencia','documentacion','abogado']},
{id:'salud',label:'Salud y odontología',href:'/areas/sanidad.html',aliases:['salud','odontologia','dental','dentista','ortodoncia','fisioterapia','cuidados a domicilio']},
{id:'vivienda',label:'Vivienda e inmobiliaria',href:'/areas/vivienda.html',aliases:['vivienda','inmobiliaria','alquiler','tasacion','contratos','reformas','mantenimiento']},
{id:'academia',label:'Academia y formación',href:'/areas/academia.html',aliases:['academia','formacion','clases','idiomas','refuerzo escolar','examenes']},
{id:'bienestar',label:'Bienestar integral',href:'/areas/bienestar.html',aliases:['bienestar','psicologia','psicologica','nutricion','acompanamiento personal']},
{id:'otros',label:'Otros servicios',href:'/areas-de-actividad.html',aliases:['otros servicios','asesoria general','diseno web','comunicacion','servicios a medida']}
];
const services=[
{id:'abogado',area:'tramites',label:'Abogado',aliases:['abogado','abogada','asesoria juridica','asesoria legal']},
{id:'extranjeria',area:'tramites',label:'Trámite de extranjería',aliases:['tramite de extranjeria','tramites de extranjeria','extranjeria','permiso de residencia']},
{id:'nacionalidad',area:'tramites',label:'Nacionalidad y residencia',aliases:['nacionalidad','residencia','nacionalidad y residencia']},
{id:'homologacion',area:'tramites',label:'Homologación de títulos',aliases:['homologacion','homologacion de titulos']},
{id:'gestion-documental',area:'tramites',label:'Gestión documental',aliases:['gestion documental','documentacion','documental']},
{id:'limpieza-dental',area:'salud',label:'Limpieza dental',aliases:['limpieza dental','limpieza','higiene dental']},
{id:'odontologia',area:'salud',label:'Odontología general',aliases:['odontologia general','odontologia','dentista','dental']},
{id:'ortodoncia',area:'salud',label:'Ortodoncia',aliases:['ortodoncia','brackets']},
{id:'fisioterapia',area:'salud',label:'Fisioterapia',aliases:['fisioterapia','rehabilitacion']},
{id:'cuidados',area:'salud',label:'Cuidados a domicilio',aliases:['cuidados a domicilio','cuidados','cuidadora','cuidador','sad','atencion a mayores']},
{id:'alquiler',area:'vivienda',label:'Alquiler de vivienda',aliases:['alquiler de vivienda','alquiler','vivienda de alquiler']},
{id:'contratos',area:'vivienda',label:'Revisión de contratos',aliases:['revision de contratos','contratos','contrato de alquiler']},
{id:'tasacion',area:'vivienda',label:'Tasación',aliases:['tasacion','valoracion inmobiliaria']},
{id:'reformas',area:'vivienda',label:'Reformas y mantenimiento',aliases:['reformas','mantenimiento']},
{id:'idiomas',area:'academia',label:'Clases de idiomas',aliases:['clases de idiomas','idiomas','ingles','frances']},
{id:'refuerzo',area:'academia',label:'Refuerzo escolar',aliases:['refuerzo escolar','refuerzo','clases particulares']},
{id:'examenes',area:'academia',label:'Preparación de exámenes',aliases:['preparacion de examenes','examenes','pau']},
{id:'digital',area:'academia',label:'Formación digital',aliases:['formacion digital','competencias digitales']},
{id:'psicologia',area:'bienestar',label:'Atención psicológica',aliases:['atencion psicologica','psicologia','psicologo','psicologa']},
{id:'nutricion',area:'bienestar',label:'Nutrición',aliases:['nutricion','nutricionista']},
{id:'acompanamiento',area:'bienestar',label:'Acompañamiento personal',aliases:['acompanamiento personal','acompanamiento emocional']},
{id:'asesoria-general',area:'otros',label:'Asesoría general',aliases:['asesoria general','asesoria']},
{id:'web-comunicacion',area:'otros',label:'Diseño web y comunicación',aliases:['diseno web y comunicacion','diseno web','comunicacion','redes sociales']},
{id:'a-medida',area:'otros',label:'Servicios a medida',aliases:['servicios a medida','servicio a medida']}
];
const demands=[
{code:'SCP-T-41001',title:'Consulta inicial con abogado de extranjería',areaId:'tramites',serviceId:'abogado',ubicacion:'Barcelona, Gràcia',importe:'80–130 €',description:'Orientación inicial para revisar una consulta de extranjería y ordenar la documentación disponible.',keywords:'abogada legal abogado inmigracion'},
{code:'SCP-T-41002',title:'Trámite de renovación de residencia',areaId:'tramites',serviceId:'extranjeria',ubicacion:'Madrid, Centro',importe:'120–180 €',description:'Apoyo para comprobar los documentos y pasos de una renovación antes de presentar la solicitud.',keywords:'permiso residencia tramite extranjeria renovacion'},
{code:'SCP-T-41003',title:'Limpieza dental y revisión preventiva',areaId:'salud',serviceId:'limpieza-dental',ubicacion:'Valencia, Extramurs',importe:'80–130 €',description:'Busca una valoración inicial y conocer por escrito el alcance antes de reservar.',keywords:'dentista higiene dental boca'},
{code:'SCP-T-41004',title:'Cuidados de apoyo a domicilio',areaId:'salud',serviceId:'cuidados',ubicacion:'Barcelona, Sant Andreu',importe:'15–20 €/h',description:'Acompañamiento cotidiano y apoyo personal con horarios que se acordarán previamente.',keywords:'mayores cuidado cuidadora cuidador sad'},
{code:'SCP-T-41005',title:'Búsqueda de vivienda de alquiler',areaId:'vivienda',serviceId:'alquiler',ubicacion:'Sevilla, Triana',importe:'180–260 €',description:'Apoyo para localizar opciones adecuadas y organizar los documentos del alquiler.',keywords:'piso inmobiliaria alquiler casa'},
{code:'SCP-T-41006',title:'Clases de idiomas para conversación',areaId:'academia',serviceId:'idiomas',ubicacion:'Online / Internacional',importe:'18–28 €/h',description:'Busca clases prácticas con objetivos personalizados y disponibilidad por acordar.',keywords:'idiomas inglés francés formación'},
{code:'SCP-T-41007',title:'Primera consulta de atención psicológica',areaId:'bienestar',serviceId:'psicologia',ubicacion:'Madrid, Retiro · Online',importe:'45–65 €/sesión',description:'Busca conocer opciones de atención y las condiciones del acompañamiento profesional.',keywords:'salud mental psicologo psicologa terapia'},
{code:'SCP-T-41008',title:'Orientación nutricional personalizada',areaId:'bienestar',serviceId:'nutricion',ubicacion:'París, Francia · Online',importe:'40–70 €/consulta',description:'Consulta orientativa sobre hábitos y planificación alimentaria individual.',keywords:'nutricionista alimentación dieta'},
{code:'SCP-T-41009',title:'Diseño web para pequeño negocio',areaId:'otros',serviceId:'web-comunicacion',ubicacion:'Bogotá, Colombia · Online',importe:'400–700 €',description:'Página sencilla para presentar la actividad, servicios y vías de contacto.',keywords:'diseño digital internet comunicación'},
{code:'SCP-T-41010',title:'Asesoría general para una gestión personal',areaId:'otros',serviceId:'asesoria-general',ubicacion:'Lisboa, Portugal · Online',importe:'60–100 €',description:'Orientación inicial para identificar opciones y ordenar los siguientes pasos.',keywords:'asesoría orientación servicios a medida'}
];
const specialists=[
{name:'Gabinete Puente Legal',areaId:'tramites',serviceId:'abogado',ubicacion:'Barcelona, Gràcia',tarifa:'110 € (orientativa)',keywords:'abogada abogado extranjeria residencia inmigracion'},
{name:'Gestiones Clara',areaId:'tramites',serviceId:'extranjeria',ubicacion:'Madrid, Centro',tarifa:'155 € (orientativa)',keywords:'tramites extranjeria permiso residencia renovación'},
{name:'Clínica Sonrisa Valencia',areaId:'salud',serviceId:'limpieza-dental',ubicacion:'Valencia, Extramurs',tarifa:'105 € (orientativa)',keywords:'limpieza dental odontologia dentista'},
{name:'Red Cuidados Cercanos',areaId:'salud',serviceId:'cuidados',ubicacion:'Barcelona, Sant Andreu',tarifa:'19 €/h (orientativa)',keywords:'cuidadora cuidados domicilio sad mayores'},
{name:'Puerta Abierta Vivienda',areaId:'vivienda',serviceId:'alquiler',ubicacion:'Sevilla, Triana',tarifa:'220 € (orientativa)',keywords:'vivienda alquiler inmobiliaria piso'},
{name:'Aula Norte Idiomas',areaId:'academia',serviceId:'idiomas',ubicacion:'Online / Internacional',tarifa:'24 €/h (orientativa)',keywords:'clases idiomas inglés francés formación'},
{name:'Centro Serena',areaId:'bienestar',serviceId:'psicologia',ubicacion:'Madrid, Retiro · Online',tarifa:'55 €/sesión (orientativa)',keywords:'psicologia psicologo atencion salud emocional'},
{name:'Nutrición Horizonte',areaId:'bienestar',serviceId:'nutricion',ubicacion:'París, Francia · Online',tarifa:'58 €/consulta (orientativa)',keywords:'nutrición nutricionista alimentación bienestar'},
{name:'Estudio Lumen Digital',areaId:'otros',serviceId:'web-comunicacion',ubicacion:'Bogotá, Colombia · Online',tarifa:'560 € (orientativa)',keywords:'diseño web comunicación digital internet'},
{name:'Orientación Cercana SCP',areaId:'otros',serviceId:'asesoria-general',ubicacion:'Lisboa, Portugal · Online',tarifa:'85 € (orientativa)',keywords:'asesoría general orientación acompañamiento'}
];
const normalize=value=>String(value||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\/-]/g,' ').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
const areaById=id=>areas.find(area=>area.id===id),serviceById=id=>services.find(service=>service.id===id);
const status=document.getElementById('scp-demo-search-status'),demandCount=document.getElementById('scp-demo-demand-count'),offerCount=document.getElementById('scp-demo-offer-count'),empty=document.getElementById('scp-demo-empty'),clearButton=document.getElementById('scp-clear-filters'),serviceTitle=document.getElementById('scp-service-list-title'),areaPageLink=document.getElementById('scp-area-page-link');
const dialog=document.getElementById('scp-demo-dialog'),dialogTitle=document.getElementById('scp-demo-dialog-title'),dialogCopy=document.getElementById('scp-demo-dialog-copy'),dialogCta=document.getElementById('scp-demo-dialog-cta');
let manualArea=null,manualService=null;
function resolveArea(query){return areas.find(area=>area.aliases.some(alias=>query===normalize(alias)||query.includes(normalize(alias))))||null}
function resolveService(query,areaId){
const candidates=services.filter(service=>!areaId||service.area===areaId).sort((a,b)=>Math.max(...b.aliases.map(x=>x.length))-Math.max(...a.aliases.map(x=>x.length)));
return candidates.find(service=>[service.label,...service.aliases].some(term=>{const n=normalize(term);return query===n||query.includes(n)}))||null
}
function queryState(){
const query=normalize(serviceInput.value);
if(query){const area=resolveArea(query),service=resolveService(query,area?.id||null);return {areaId:service?.area||area?.id||null,serviceId:service?.id||null,freeQuery:service||area?'':query}}
return {areaId:manualService?serviceById(manualService)?.area:manualArea,serviceId:manualService,freeQuery:''}
}
function cardMatches(item,state,location){
if(state.areaId&&item.areaId!==state.areaId)return false;if(state.serviceId&&item.serviceId!==state.serviceId)return false;
if(state.freeQuery){const searchable=normalize([item.title||'',item.name||'',item.areaId,item.serviceId,item.keywords||'',serviceById(item.serviceId)?.label||'',areaById(item.areaId)?.label||''].join(' '));const words=state.freeQuery.split(' ').filter(word=>word.length>2);if(words.length&&!words.every(word=>searchable.includes(word)))return false}
const place=normalize(item.ubicacion);if(location&&!place.includes(location)&&!(location==='internacional'&&/online|francia|colombia|portugal/.test(place)))return false;return true
}
function renderAreaOptions(state){
areaRoot.replaceChildren();
areas.forEach(area=>{const button=document.createElement('button');button.type='button';button.className='scp-architecture__area-button';button.textContent=area.label;button.setAttribute('aria-pressed',String(state.areaId===area.id));button.addEventListener('click',()=>{manualArea=area.id;manualService=null;serviceInput.value='';render();market.scrollIntoView({behavior:'smooth',block:'start'})});areaRoot.append(button)});
const all=document.createElement('button');all.type='button';all.className='scp-architecture__area-button scp-architecture__area-button--all';all.textContent='Ver todas';all.setAttribute('aria-pressed',String(!state.areaId));all.addEventListener('click',()=>{manualArea=null;manualService=null;serviceInput.value='';render()});areaRoot.append(all)
}
function renderServiceOptions(state){
serviceRoot.replaceChildren();const visible=services.filter(service=>!state.areaId||service.area===state.areaId);
serviceTitle.textContent=state.areaId?areaById(state.areaId).label+' · Servicios':'Servicios del catálogo · '+visible.length;
visible.forEach(service=>{const button=document.createElement('button');button.type='button';button.className='scp-architecture__service-button';button.textContent=state.areaId?service.label:service.label+' · '+areaById(service.area).label;button.setAttribute('aria-pressed',String(state.serviceId===service.id));button.addEventListener('click',()=>{manualArea=service.area;manualService=service.id;serviceInput.value=service.label;render();market.scrollIntoView({behavior:'smooth',block:'start'})});serviceRoot.append(button)});
if(state.areaId){areaPageLink.hidden=false;areaPageLink.href=areaById(state.areaId).href;areaPageLink.textContent='Abrir página completa de '+areaById(state.areaId).label}else{areaPageLink.hidden=true;areaPageLink.removeAttribute('href')}
}
function createCard(item,type){
const card=document.createElement('article');card.className='scp-demo-card scp-demo-card--'+type;
const top=document.createElement('div');top.className='scp-demo-card__top';const identity=document.createElement('span');identity.className='scp-demo-card__code';identity.textContent=type==='demand'?'Solicitud · '+item.code:item.name;const sample=document.createElement('span');sample.className='scp-demo-card__demo';sample.textContent='MUESTRA';top.append(identity,sample);
const area=areaById(item.areaId),service=serviceById(item.serviceId),title=document.createElement('h4');title.className='scp-demo-card__title';title.textContent=type==='demand'?item.title:item.name;
const specialty=document.createElement('p');specialty.className='scp-demo-card__specialty';specialty.textContent=area.label+' · '+service.label;
const location=document.createElement('p');location.className='scp-demo-card__location';location.textContent=item.ubicacion;
const price=document.createElement('p');price.className='scp-demo-card__price';price.textContent=type==='demand'?'Presupuesto orientativo: '+item.importe:'Tarifa orientativa: '+item.tarifa;
const summary=document.createElement('p');summary.className=type==='demand'?'scp-demo-card__description':'scp-demo-card__rating';summary.textContent=type==='demand'?item.description:'Especialidad de referencia · Disponibilidad por confirmar';
const button=document.createElement('button');button.type='button';button.className='scp-demo-card__button';button.textContent=type==='demand'?'Ver ficha':'Consultar servicio';button.addEventListener('click',()=>openDetails(item,type));
card.append(top,title,specialty,location,price,summary,button);return card
}
function openDetails(item,type){
const area=areaById(item.areaId),service=serviceById(item.serviceId);dialogTitle.textContent=type==='demand'?item.title:item.name;dialogCopy.textContent=area.label+' · '+service.label+' · '+item.ubicacion+'. '+(type==='demand'?item.description:'Tarifa orientativa: '+item.tarifa+'. La disponibilidad se confirma con el especialista.');
dialogCta.textContent=type==='demand'?'Registrar solicitud':'Presentar servicio';dialogCta.href=type==='demand'?'/registro.html?tipo=titular&solicitud=servicio':'/registro.html?tipo=especialista';if(typeof dialog.showModal==='function')dialog.showModal()
}
function render(){
const state=queryState(),location=normalize(locationInput.value);renderAreaOptions(state);renderServiceOptions(state);
const ds=demands.filter(item=>cardMatches(item,state,location)),ss=specialists.filter(item=>cardMatches(item,state,location));
demandsRoot.replaceChildren(...ds.map(item=>createCard(item,'demand')));offersRoot.replaceChildren(...ss.map(item=>createCard(item,'offer')));
demandCount.textContent='('+ds.length+')';offerCount.textContent='('+ss.length+')';const total=ds.length+ss.length;
status.textContent='Mostrando '+total+' solicitudes y servicios de referencia SCP.';empty.hidden=total>0
}
let scrollTimer;const scrollToMarket=()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>market.scrollIntoView({behavior:'smooth',block:'start'}),180)};
form.addEventListener('submit',event=>{event.preventDefault();render();market.scrollIntoView({behavior:'smooth',block:'start'})});
serviceInput.addEventListener('input',()=>{manualArea=null;manualService=null;render();if(serviceInput.value.trim()||locationInput.value.trim())scrollToMarket()});
locationInput.addEventListener('input',()=>{render();if(serviceInput.value.trim()||locationInput.value.trim())scrollToMarket()});
clearButton.addEventListener('click',()=>{serviceInput.value='';locationInput.value='';manualArea=null;manualService=null;render();market.scrollIntoView({behavior:'smooth',block:'start'})});
document.querySelector('.scp-demo-dialog__close')?.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});render()
})();