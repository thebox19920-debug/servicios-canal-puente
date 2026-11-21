(() => {
  'use strict';
  const form = document.getElementById('lp-service-search');
  const results = document.getElementById('lp-search-results');
  if (!form || !results) return;

  const areas = [
    {
      category: 'tramites',
      title: 'Trámites y documentación', href: '/areas/tramites.html',
      description: 'Orientación y apoyo para gestiones, documentos y expedientes.',
      terms: ['tramite','papeles','documento','documentacion','administracion','nie','nacionalidad','residencia','extranjer','empadronamiento','cita previa','formulario','solicitud','expediente','escrito','traduccion','interprete','abogado','legal','juridic','notificacion','asilo','arraigo']
    },
    {
      category: 'salud',
      title: 'Salud, odontología y bienestar', href: '/areas/sanidad.html',
      description: 'Servicios de salud y odontología, y orientación hacia bienestar integral.',
      terms: ['salud','dental','dentista','diente','dientes','boca','odont','higiene','limpieza','implante','ortodon','clinica','curetaje','corona','endodon','medico','medica','tratamiento','psic','terapia','bienestar','emocional','ansiedad','psiquiatr','psicolog']
    },
    {
      category: 'vivienda',
      title: 'Vivienda e inmobiliaria', href: '/areas/vivienda.html',
      description: 'Ayuda para explorar opciones de vivienda y conectar con profesionales del sector.',
      terms: ['vivienda','alquiler','alquilar','comprar','compra','venta','vender','piso','habitacion','inmueble','inmobiliaria','traspaso','agencia','hipoteca','mudanza','estancia']
    },
    {
      category: 'academia',
      title: 'Academia y formación', href: '/areas/academia.html',
      description: 'Opciones de formación, aprendizaje y apoyo académico.',
      terms: ['academia','curso','clase','estudio','formacion','aprender','idioma','profesor','matricula','pau','examen','educacion','taller','refuerzo','universidad']
    },
    {
      category: 'comunica',
      title: 'Comunicación y visibilidad', href: '/comunica.html',
      description: 'Recursos de comunicación, contenidos y difusión.',
      terms: ['publicidad','redes','marketing','marca','comunicacion','contenido','campana','difusion','visibilidad','instagram','tiktok','promocion','anuncio']
    },
    {
      category: 'tienda',
      title: 'Tienda y recursos', href: '/tienda.html',
      description: 'Productos y recursos para facilitar la actividad profesional.',
      terms: ['tienda','comprar','producto','material','instrumental','herramienta','equipo','suministro']
    },
    {
      category: 'animales',
      title: 'Protección animal · Próximamente', href: '/areas/animales.html',
      description: 'Esta iniciativa está en preparación y todavía no se puede contratar.',
      terms: ['animal','animales','gato','gatos','perro','mascota','rescate animal'], upcoming: true
    },
    {
      category: 'otros',
      title: 'Otros ámbitos', href: '/areas-de-actividad.html',
      description: 'Explora las áreas de actividad y encuentra otras opciones disponibles.',
      terms: ['otro','otros','general','no lo se','duda']
    }
  ];

  const normalize = value => String(value || '').toLocaleLowerCase('es')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = normalize(document.getElementById('lp-service-need').value);
    const location = document.getElementById('lp-service-location').value.trim();
    const selectedSector = document.getElementById('lp-home-sector')?.value || '';
    const ranked = areas.map(area => ({
      ...area,
      score: area.terms.reduce((sum, term) => sum + (query.includes(normalize(term)) ? 1 : 0), 0)
    })).filter(area => area.score > 0 && (!selectedSector || area.category === selectedSector)).sort((a, b) => b.score - a.score).slice(0, 3);
    if (!ranked.length && selectedSector) {
      ranked.push(...areas.filter(area => area.category === selectedSector).slice(0, 3));
    }

    results.replaceChildren();
    results.hidden = false;
    const heading = node('h2', 'lp-search-results-title', ranked.length ? (selectedSector ? 'Opciones del sector que has elegido' : 'Estas áreas pueden encajar con lo que buscas') : 'No encuentro una coincidencia clara todavía');
    results.append(heading);

    const context = location
      ? `Zona indicada: ${location}. La herramienta orienta por tipo de servicio; la disponibilidad de un Usuario Especialista en esa zona se confirma antes de avanzar.`
      : 'Si nos indicas una zona, el equipo podrá confirmar después la disponibilidad de un Usuario Especialista allí.';
    results.append(node('p', 'lp-search-results-context', context));

    if (!ranked.length) {
      const help = node('p', 'lp-search-empty', 'Prueba con palabras sencillas como “dentista”, “trámite”, “alquiler” o “formación”, o revisa todas las áreas.');
      results.append(help);
    } else {
      const grid = node('div', 'lp-search-result-grid');
      for (const area of ranked) {
        const card = node('article', 'lp-search-result-card');
        card.append(node('h3', '', area.title));
        card.append(node('p', '', area.description));
        const link = node('a', '', area.upcoming ? 'Ver el proyecto' : 'Ver esta área');
        link.href = area.href;
        card.append(link);
        grid.append(card);
      }
      results.append(grid);
    }

    const note = node('p', 'lp-search-results-note', 'Este buscador no asigna profesionales automáticamente ni guarda tu consulta. No introduzcas datos personales ni detalles clínicos.');
    results.append(note);
    results.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
})();
