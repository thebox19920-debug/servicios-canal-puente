(()=>{
  'use strict';
  if(document.querySelector('.lp-mobile-tabs'))return;

  const icons={
    home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
    services:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    shop:'<path d="M3 4h2l3 12h11l2-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
    agenda:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5m10-5v5M3 11h18m-13 5h2m4 0h2"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>'
  };
  const svg=name=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
  const path=location.pathname;
  const home=path==='/'||path==='/index.html';

  const head=document.createElement('header');
  head.className='lp-mobile-head';
  head.innerHTML='<div class="lp-mobile-topline">'+
    '<button type="button" class="scp-categories-trigger" aria-haspopup="dialog"><span aria-hidden="true">☰</span><span>Todas las categorías</span></button>'+
    '<a class="lp-mobile-brand" href="/index.html" aria-label="Servicios Canal Puente SCP"><img class="lp-mobile-emblem" src="/assets/scp-logo-profesor-final.png?v=20261122-logo-completo" alt="Logotipo de Servicios Canal Puente SCP con su puente dorado y sus iniciales SCP" decoding="async" fetchpriority="high"></a>'+
    '<nav class="lp-mobile-quicklinks" aria-label="Accesos rápidos"><a href="/agenda.html">Agenda</a><a href="/contacto.html">Contacto</a><span class="lp-mobile-language-slot"></span></nav></div>';
  document.body.prepend(head);
  const mobileLanguage=document.querySelector('.lex-language-menu');
  if(mobileLanguage)head.querySelector('.lp-mobile-language-slot').append(mobileLanguage.cloneNode(true));
  let search=document.querySelector('#lp-service-search');
  if(search&&window.matchMedia('(max-width:760px)').matches)head.append(search);

  const account=document.createElement('nav');
  account.className='lp-mobile-account';
  account.setAttribute('aria-label','Acceso a tu cuenta');
  const categoriesTrigger=head.querySelector('.scp-categories-trigger');
  account.innerHTML='<a class="lex-account-signin" href="/iniciar-sesion.html">Iniciar sesión</a>'+
    '<a class="lex-account-membership" href="/planes.html">Suscripciones</a>'+
    '<a class="lex-service-registration" href="/registro.html?tipo=titular&solicitud=servicio"><span aria-hidden="true">+</span> Publica el servicio que buscas</a>'+
    '<a class="lex-service-offer" href="/registro.html?tipo=especialista"><span aria-hidden="true">+</span> Publica los servicios que ofreces</a>'+

  if(categoriesTrigger)account.prepend(categoriesTrigger);
  head.append(account);

  const contact=document.createElement('div');
  contact.className='lp-mobile-contact';
  contact.setAttribute('aria-label','Contacto SCP');
  contact.innerHTML='<a class="lp-mobile-phone" aria-label="Llamar a SCP: +34 673 735 059" href="tel:+34673735059">+34 673 735 059</a>'+
    '<a class="lp-mobile-whatsapp" aria-label="Escribir por WhatsApp a SCP: +34 673 735 059" href="https://wa.me/34673735059" target="_blank" rel="noopener noreferrer"><span class="lex-whatsapp-icon-shell" aria-hidden="true"><svg class="lex-whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.4 3.6A11.6 11.6 0 0 0 2.2 17.2L.8 23.2l6.2-1.4a11.6 11.6 0 0 0 13.4-18.2Z"/><path d="M8.2 6.9c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.8.1-1.1.5-.4.4-1.4 1.4-1.4 3.3s1.4 3.8 1.6 4.1c.2.3 2.7 4.3 6.6 5.8 3.2 1.3 3.9 1 4.6.9.7-.1 2.3-.9 2.6-1.8.3-.9.3-1.7.2-1.8-.1-.2-.4-.3-.8-.5s-2.3-1.1-2.6-1.2c-.4-.1-.6-.2-.9.2-.3.4-1 1.2-1.2 1.5-.2.3-.4.3-.8.1-.4-.2-1.6-.6-3.1-1.9-1.1-1-1.8-2.2-2-2.6-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.6.1-.3 0-.5 0-.7-.1-.2-.9-2.2-1.2-3Z"/></svg></span><span>WhatsApp · +34 673 735 059</span></a>';
  head.append(contact);

  const placeSearch=()=>{
    search=document.querySelector('#lp-service-search');
    if(!search)return;
    if(window.matchMedia('(max-width:760px)').matches){
      if(search.parentElement!==head)head.insertBefore(search,account);
    }else{
      const desktop=document.querySelector('.scp-header-main');
      const utilities=desktop?.querySelector('.scp-header-utilities');
      if(desktop&&search.parentElement!==desktop)desktop.insertBefore(search,utilities||null);
    }
  };
  window.matchMedia('(max-width:760px)').addEventListener?.('change',placeSearch);

  head.querySelector('.lp-mobile-back')?.addEventListener('click',()=>{
    if(path.includes('/servicios/')||path==='/pagar'||path==='/pagar.html'){
      const id=new URLSearchParams(location.search).get('servicio')||'';
      location.href='/areas/'+(/^(salud-|clinic-)/.test(id)?'sanidad':id.startsWith('inmo-')?'vivienda':id.startsWith('bienestar-')?'bienestar':id.startsWith('comunica-')?'comunica':id.startsWith('academia-')?'academia':'tramites')+'.html';
    }else if(path.includes('/areas/'))location.href='/areas-de-actividad.html';
    else location.href='/index.html';
  });

  const groups=[
    ['TU CUENTA',[
      ['Iniciar sesión','/iniciar-sesion.html'],
      ['+ Publica el servicio que buscas','/registro.html?tipo=titular&solicitud=servicio'],
      ['+ Publica los servicios que ofreces','/registro.html?tipo=especialista'],
      ['Acceso reservado SCP','/acceso-scp.html'],
      ['Inicio','/index.html']
    ]],
    ['CONOCE SCP',[
      ['Introducción','/introduccion.html'],['Presentación','/presentacion.html'],
      ['Quiénes somos','/quienes-somos.html'],['Nuestro valor','/nuestro-valor.html']
    ]],
    ['SERVICIOS',[
      ['Trámites y documentación','/areas/tramites.html'],['Sanidad','/areas/sanidad.html'],
      ['Inmobiliaria','/areas/vivienda.html'],['Academia','/areas/academia.html'],['Bienestar integral','/areas/bienestar.html'],['Todos los servicios','/areas-de-actividad.html']
    ]],
    ['SCP COMUNICA',[['SCP Comunica','/comunica.html']]],
    ['ASOCIACIÓN',[
      ['Asociación SCP','/asociacion.html'],['Protección Animal','/areas/animales.html']
    ]],
    ['MÁS OPCIONES',[
      ['Tienda','/tienda.html'],['Agenda','/agenda.html'],['Servicios','/servicios.html'],
      ['Contacto','/contacto.html'],['Instalar SCP','/instalar']
    ]]
  ];
  const menu=document.createElement('dialog');
  menu.className='lp-mobile-menu';
  menu.setAttribute('aria-label','Menú de SCP');
  menu.innerHTML='<button type="button" aria-label="Cerrar menú">×</button><h2>Todas las categorías</h2>'+groups.map(([title,links])=>
    '<small>'+title+'</small>'+links.map(([label,url])=>'<a href="'+url+'">'+label+'</a>').join('')
  ).join('')+
    '<small>CONTACTO INTERNACIONAL</small><a class="lp-mobile-menu-contact" href="tel:+34673735059">Llamar · +34 673 735 059</a><a class="lp-mobile-menu-contact" href="https://wa.me/34673735059" target="_blank" rel="noopener noreferrer">WhatsApp · +34 673 735 059</a>'+
    '<small>IDIOMAS</small><p>Español · Más idiomas próximamente</p>';
  menu.querySelector('button').onclick=()=>menu.close();
  categoriesTrigger?.addEventListener('click',()=>menu.showModal());
  menu.addEventListener('click',event=>{if(event.target===menu&&event.clientX<menu.getBoundingClientRect().left)menu.close()});
  document.body.append(menu);

  const nav=document.createElement('nav');
  nav.className='lp-mobile-tabs';
  nav.setAttribute('aria-label','Navegación principal');
  const tabs=[
    ['home','Inicio','/index.html'],['services','Servicios','/areas-de-actividad.html'],
    ['shop','Tienda','/tienda.html'],['agenda','Agenda','/agenda.html']
  ];
  nav.innerHTML=tabs.map(([icon,label,url])=>{
    const active=icon==='home'?home:icon==='services'?/\/areas|\/servicios|\/pagar/.test(path):path.startsWith(url.replace('.html',''));
    return '<a href="'+url+'"'+(active?' aria-current="page"':'')+'>'+svg(icon)+'<span>'+label+'</span></a>';
  }).join('');
  document.body.append(nav);
})();
