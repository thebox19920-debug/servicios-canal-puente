(() => {
  'use strict';
  const form = document.getElementById('lp-service-search');
  const serviceInput = document.getElementById('lp-service-need');
  const locationInput = document.getElementById('lp-service-location');
  const demandsRoot = document.getElementById('scp-demo-demands');
  const offersRoot = document.getElementById('scp-demo-offers');
  if (!form || !serviceInput || !locationInput || !demandsRoot || !offersRoot) return;

  const demands = [
    {title:'Limpieza dental y revisión preventiva',sector:'Salud y odontología',city:'Barcelona, España',timing:'En las próximas 2 semanas · Presupuesto aprox. 120 €',terms:'odontología dentista dental higiene limpieza revisión boca'},
    {title:'Orientación para renovar una autorización de residencia',sector:'Trámites y documentación',city:'Madrid, España',timing:'Este mes · Presupuesto aprox. 180 €',terms:'trámites extranjería residencia documentación renovación inmigración'},
    {title:'Asesoramiento para encontrar vivienda de alquiler',sector:'Vivienda e inmobiliaria',city:'Valencia, España',timing:'Búsqueda inmediata · Presupuesto orientativo 250 €',terms:'vivienda alquiler inmobiliaria piso asesoramiento'},
    {title:'Clases particulares de matemáticas para acceso universitario',sector:'Academia y formación',city:'Sevilla, España',timing:'Inicio este mes · Presupuesto aprox. 25 €/hora',terms:'clases particulares academia formación matemáticas pau'},
    {title:'Sesiones de fisioterapia para mejorar la movilidad',sector:'Bienestar y salud',city:'Zaragoza, España',timing:'Disponibilidad esta semana · Presupuesto aprox. 45 €/sesión',terms:'fisioterapia bienestar salud movilidad rehabilitación'},
    {title:'Preparación de documentación para homologar estudios',sector:'Trámites y documentación',city:'Online / Internacional',timing:'Plazo orientativo de 3 semanas · Presupuesto aprox. 220 €',terms:'gestión documental documentación homologación estudios extranjería trámites online internacional'},
    {title:'Diseño de una web sencilla para un pequeño negocio',sector:'Comunicación y visibilidad',city:'Ciudad de México, México · Online',timing:'Entrega orientativa en 4 semanas · Presupuesto aprox. 700 €',terms:'diseño web página internet comunicación digital'},
    {title:'Valoración inmobiliaria para comprar un piso',sector:'Vivienda e inmobiliaria',city:'Málaga, España',timing:'Primera consulta esta semana · Presupuesto aprox. 150 €',terms:'asesoría inmobiliaria vivienda compra piso valoración'},
    {title:'Traducción y acompañamiento para una cita administrativa',sector:'Trámites y documentación',city:'París, Francia',timing:'Cita prevista en 10 días · Presupuesto aprox. 95 €',terms:'traducción interpretación trámites acompañamiento Francia París'},
    {title:'Acompañamiento de bienestar emocional no clínico',sector:'Bienestar integral',city:'Buenos Aires, Argentina · Online',timing:'Sesiones flexibles · Presupuesto aprox. 40 €/sesión',terms:'bienestar emocional hábitos salud acompañamiento online internacional Buenos Aires'}
  ];
  const offers = [
    {title:'Limpieza dental y valoración inicial',sector:'Salud y odontología',name:'Clínica Dental Riu',city:'Valencia, España',price:'Precio cerrado orientativo: 110 €',terms:'odontología dentista dental higiene limpieza revisión clínica'},
    {title:'Asesoría de extranjería y renovación de residencia',sector:'Trámites y documentación',name:'Dra. Elena Marín · profesional ficticia',city:'Madrid, España',price:'Precio cerrado orientativo: 165 €',terms:'trámites extranjería residencia documentación asesoría legal'},
    {title:'Búsqueda y gestión de alquiler residencial',sector:'Vivienda e inmobiliaria',name:'Puerta Abierta Inmobiliaria · centro ficticio',city:'Barcelona, España',price:'Precio cerrado orientativo: 290 €',terms:'vivienda alquiler inmobiliaria piso asesoría'},
    {title:'Refuerzo de matemáticas para PAU',sector:'Academia y formación',name:'Aula Giralda · centro ficticio',city:'Sevilla, España',price:'Precio cerrado orientativo: 24 €/hora',terms:'clases particulares academia formación matemáticas pau'},
    {title:'Fisioterapia y plan de movilidad',sector:'Bienestar y salud',name:'Centro Brújula · centro ficticio',city:'Bilbao, España',price:'Precio cerrado orientativo: 48 €/sesión',terms:'fisioterapia bienestar salud movilidad rehabilitación'},
    {title:'Organización de expediente de homologación',sector:'Trámites y documentación',name:'Carpeta Clara · profesional ficticio',city:'Online / Internacional',price:'Precio cerrado orientativo: 210 €',terms:'gestión documental documentación homologación estudios trámites online internacional'},
    {title:'Diseño web de presentación para negocio local',sector:'Comunicación y visibilidad',name:'Estudio Lumen · estudio ficticio',city:'Londres, Reino Unido · Online',price:'Precio cerrado orientativo: 680 €',terms:'diseño web página internet comunicación digital Londres'},
    {title:'Consulta de compra y valoración de vivienda',sector:'Vivienda e inmobiliaria',name:'Casa Serena · asesoría ficticia',city:'Lisboa, Portugal · Online',price:'Precio cerrado orientativo: 145 €',terms:'asesoría inmobiliaria vivienda compra piso valoración Lisboa'},
    {title:'Traducción e interpretación para gestiones',sector:'Trámites y documentación',name:'Ponte Lingua · profesional ficticia',city:'París, Francia · Online',price:'Precio cerrado orientativo: 90 €',terms:'traducción interpretación trámites documentación París Francia'},
    {title:'Acompañamiento de bienestar emocional no clínico',sector:'Bienestar integral',name:'Brújula Serena · centro ficticio',city:'Bogotá, Colombia · Online',price:'Precio cerrado orientativo: 42 €/sesión',terms:'bienestar emocional hábitos salud acompañamiento online internacional Bogotá'}
  ];
  const normalize = value => String(value || '').toLocaleLowerCase('es')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/-]/g, ' ').replace(/\s+/g, ' ').trim();
  const status = document.getElementById('scp-demo-search-status');
  const demandCount = document.getElementById('scp-demo-demand-count');
  const offerCount = document.getElementById('scp-demo-offer-count');
  const empty = document.getElementById('scp-demo-empty');
  const dialog = document.getElementById('scp-demo-dialog');
  const dialogTitle = document.getElementById('scp-demo-dialog-title');
  const dialogCopy = document.getElementById('scp-demo-dialog-copy');
  const dialogCta = document.getElementById('scp-demo-dialog-cta');
  const quickArea = document.getElementById('scp-demo-quick-area');
  const quickAreaLink = document.getElementById('scp-demo-quick-area-link');
  const searchStatus = document.getElementById('scp-demo-search-status');
  const areaLinks = [
    {label:'Salud y Odontología',href:'/areas/sanidad.html',terms:['odontologia','dental','dentista','limpieza dental','salud','fisioterapia']},
    {label:'Trámites y documentación',href:'/areas/tramites.html',terms:['tramites','extranjeria','documental','documentacion','residencia','homologacion','traduccion']},
    {label:'Vivienda e inmobiliaria',href:'/areas/vivienda.html',terms:['vivienda','inmobiliaria','alquiler','piso','inmueble']},
    {label:'Academia y formación',href:'/areas/academia.html',terms:['academia','clases','formacion','matematicas','pau']},
    {label:'Bienestar integral',href:'/areas/bienestar.html',terms:['bienestar','emocional','movilidad','rehabilitacion']},
    {label:'Comunicación y visibilidad',href:'/comunica.html',terms:['comunicacion','redes sociales','diseno web','web','digital']}
  ];
  const getArea = query => areaLinks.find(area=>area.terms.some(term=>query.includes(normalize(term))))||null;
  let scrollTimer;
  const scrollToMarket = () => {
    clearTimeout(scrollTimer);
    scrollTimer=setTimeout(()=>document.getElementById('scp-demo-marketplace').scrollIntoView({behavior:'smooth',block:'start'}),180);
  };
  const termsMatch = (item, service, location) => {
    const serviceText = normalize([item.title,item.sector,item.name||'',item.terms].join(' '));
    const locationText = normalize(item.city);
    const queryMatches = !service || service.split(' ').filter(word => word.length > 2).every(word => serviceText.includes(word));
    const locationMatches = !location || locationText.includes(location) ||
      (location === 'online' && serviceText.includes('online')) ||
      (location === 'internacional' && /internacional|online|francia|colombia|reino unido|portugal|argentina/.test(locationText)) ||
      (location === 'mexico' && locationText.includes('mexico'));
    return queryMatches && locationMatches;
  };
  function makeCard(item, kind) {
    const card = document.createElement('article');
    card.className = 'scp-demo-card' + (kind === 'offer' ? ' scp-demo-card--offer' : '');
    const top = document.createElement('div'); top.className = 'scp-demo-card__top';
    const sector = document.createElement('span'); sector.className = 'scp-demo-card__sector'; sector.textContent = item.sector;
    const demo = document.createElement('span'); demo.className = 'scp-demo-card__demo'; demo.textContent = 'Ejemplo ilustrativo';
    top.append(sector,demo);
    const title = document.createElement('h4'); title.textContent = item.title;
    const meta = document.createElement('p'); meta.className = 'scp-demo-card__meta';
    if (kind === 'offer') {
      meta.innerHTML = '<strong>Profesional / centro:</strong> ';
      meta.append(document.createTextNode(item.name + ' · ' + item.city));
      const price = document.createElement('p'); price.className='scp-demo-card__meta'; price.textContent=item.price;
      card.append(top,title,meta,price);
    } else {
      meta.textContent = item.city + ' · ' + item.timing;
      card.append(top,title,meta);
    }
    const badge=document.createElement('span');badge.className='scp-demo-card__badge';
    badge.textContent=kind==='offer'?'Perfil de ejemplo · sin comisión contratada':'Escudo Dual SCP · ejemplo';
    const button=document.createElement('button');button.className='scp-demo-card__button';button.type='button';
    button.textContent=kind==='offer'?'Consultar alcance':'Ver solicitud';
    button.addEventListener('click',()=>openDetails(item,kind));
    card.append(badge,button);
    return card;
  }
  function openDetails(item,kind) {
    dialogTitle.textContent=item.title;
    dialogCopy.textContent=kind==='offer'
      ? item.name + ' · ' + item.city + '. ' + item.price + '. Ejemplo ilustrativo: no representa una oferta disponible ni un perfil revisado por SCP.'
      : item.city + '. ' + item.timing + '. Ejemplo ilustrativo: no corresponde a una solicitud real de una persona usuaria.';
    dialogCta.hidden=kind==='offer';
    if(typeof dialog.showModal==='function') dialog.showModal();
  }
  function render() {
    const service=normalize(serviceInput.value);
    const location=normalize(locationInput.value);
    const filteredDemands=demands.filter(item=>termsMatch(item,service,location));
    const filteredOffers=offers.filter(item=>termsMatch(item,service,location));
    demandsRoot.replaceChildren(...filteredDemands.map(item=>makeCard(item,'demand')));
    offersRoot.replaceChildren(...filteredOffers.map(item=>makeCard(item,'offer')));
    demandCount.textContent='('+filteredDemands.length+')';
    offerCount.textContent='('+filteredOffers.length+')';
    const total=filteredDemands.length+filteredOffers.length;
    empty.hidden=total>0;
    searchStatus.textContent='Mostrando '+total+' ejemplos ilustrativos de solicitudes y servicios.';
    const area=getArea(service);
    if(area){
      quickArea.hidden=false;
      quickAreaLink.href=area.href;
      quickAreaLink.textContent='Ver también toda el área de '+area.label+' →';
    }else{
      quickArea.hidden=true;
      quickAreaLink.removeAttribute('href');
      quickAreaLink.textContent='';
    }
  }
  form.addEventListener('submit',event=>{event.preventDefault();render();document.getElementById('scp-demo-marketplace').scrollIntoView({behavior:'smooth',block:'start'})});
  const onSearchInput=()=>{render();if(serviceInput.value.trim()||locationInput.value.trim())scrollToMarket()};
  serviceInput.addEventListener('input',onSearchInput);
  locationInput.addEventListener('input',onSearchInput);
  document.querySelector('.scp-demo-dialog__close')?.addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  render();
})();