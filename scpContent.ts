import type { LanguageCode, SectorId } from '../types/scp';

export interface SectorMeta {
  id: SectorId;
  number: string;
  name: { es: string; ar: string };
  shortName: { es: string; ar: string };
  tagline: { es: string; ar: string };
  discountLabel: string;
  image: string;
  highlights: { es: string[]; ar: string[] };
}

export const SECTORS: SectorMeta[] = [
  {
    id: 'tramites',
    number: '01',
    name: { es: 'Trámites y documentación administrativa', ar: 'الإجراءات والوثائق الإدارية' },
    shortName: { es: 'Trámites', ar: 'الإجراءات' },
    tagline: {
      es: 'Extranjería, homologaciones, traducción jurada ES/AR/Darija y gestión notarial.',
      ar: 'شؤون الإقامة، معادلة الشهادات، والترجمة المحلفة عربي-إسباني-دارجة.',
    },
    discountLabel: 'Hasta 20 % dto.',
    image: '/src/assets/images/area_tramites_documentacion_1795247772644.jpg',
    highlights: {
      es: ['Abogados y gestores colegiados', 'Revisión documental previa', 'Seguimiento en plataforma Mercurio'],
      ar: ['محامون ومستشارون معتمدون', 'مراجعة مسبقة للملف والوثائق', 'متابعة دقيقة لجميع المراحل'],
    },
  },
  {
    id: 'salud',
    number: '02',
    name: { es: 'Salud y odontología', ar: 'الصحة وطب الأسنان' },
    shortName: { es: 'Sanidad', ar: 'الصحة' },
    tagline: {
      es: 'Odontología, medicina general, psicología clínica y diagnósticos con presupuesto cerrado.',
      ar: 'طب الأسنان والطب العام وعلم النفس السريري بميزانية محددة مسبقاً.',
    },
    discountLabel: 'Hasta 25 % dto.',
    image: '/src/assets/images/area_salud_odontologia_1795247773246.jpg',
    highlights: {
      es: ['Colegiación médica verificada', 'Consentimiento y presupuesto previo', 'Primera valoración prioritaria'],
      ar: ['تسجيل مهني معتمد', 'ميزانية واضحة ومعتمدة مسبقاً', 'أولوية في الموعد التشخيصي'],
    },
  },
  {
    id: 'inmobiliaria',
    number: '03',
    name: { es: 'Vivienda e inmobiliaria', ar: 'السكن والعقارات' },
    shortName: { es: 'Inmobiliaria', ar: 'العقارات' },
    tagline: {
      es: 'Revisión de contratos de arras, alquiler seguro, notas simples y asesoría técnica.',
      ar: 'مراجعة عقود البيع والإيجار، التحقق العقاري، والاستشارات الهندسية.',
    },
    discountLabel: 'Hasta 22 % dto.',
    image: '/src/assets/images/area_vivienda_inmobiliaria_1795247772481.jpg',
    highlights: {
      es: ['Auditoría registral completa', 'Cláusulas de protección al titular', 'Acompañamiento ante notaría'],
      ar: ['تدقيق السجل العقاري كاملاً', 'بنود واضحة لحماية العميل', 'مرافقة قانونية أمام الموثق'],
    },
  },
  {
    id: 'academia',
    number: '04',
    name: { es: 'Academia y formación (Castellano, Catalán, Árabe, Darija, FP)', ar: 'الأكاديمية والتكوين (الإسبانية، الكتالانية، العربية، الدارجة، والتكوين المهني)' },
    shortName: { es: 'Academia', ar: 'الأكاديمية' },
    tagline: {
      es: 'Castellano, Catalán, Árabe, Darija, preparación oficial y acceso a Formación Profesional (FP).',
      ar: 'دروس الإسبانية والكتالانية والعربية والدارجة، والتحضير للتكوين المهني.',
    },
    discountLabel: 'Hasta 25 % dto.',
    image: '/src/assets/images/area_academia_formacion_1795247772866.jpg',
    highlights: {
      es: ['Docentes titulados acreditados', 'Itinerarios Castellano, Catalán, Árabe y Darija', 'Preparación específica para FP'],
      ar: ['أساتذة مؤهلون ومعتمدون', 'مسارات متعددة اللغات', 'تحضير مخصص للتكوين المهني'],
    },
  },
  {
    id: 'bienestar',
    number: '05',
    name: { es: 'Bienestar integral y acompañamiento', ar: 'الرفاهية الشاملة والمرافقة' },
    shortName: { es: 'Bienestar', ar: 'الرفاهية' },
    tagline: {
      es: 'Fisioterapia, nutrición clínica, terapia ocupacional y acompañamiento familiar cercano.',
      ar: 'العلاج الطبيعي، التغذية العلاجية، والمرافقة الأسرية المتكاملة.',
    },
    discountLabel: 'Hasta 25 % dto.',
    image: '/src/assets/images/area_bienestar_integral_1795247772495.jpg',
    highlights: {
      es: ['Valoración inicial personalizada', 'Bonos con custodia de saldo', 'Reprogramación flexible 24h'],
      ar: ['تقييم أولي مخصص للحالة', 'باقات محمية عبر صندوق الضمان', 'مرونة في تعديل المواعيد'],
    },
  },
  {
    id: 'proteccion_animal',
    number: '06',
    name: { es: 'Protección animal', ar: 'حماية الحيوان' },
    shortName: { es: 'Protección Animal', ar: 'حماية الحيوان' },
    tagline: {
      es: 'Atención veterinaria preventiva, vacunación, esterilización responsable y asesoría de adopción.',
      ar: 'رعاية بيطرية وقائية، تلقيح، وإرشاد مسؤول للتبني.',
    },
    discountLabel: 'Tarifa social SCP',
    image: '/src/assets/images/area_proteccion_animal_1795249549332.jpg',
    highlights: {
      es: ['Clínicas veterinarias adheridas', 'Descuentos en medicina preventiva', 'Apoyo directo a protectoras locales'],
      ar: ['عيادات بيطرية معتمدة', 'خصومات في الطب الوقائي', 'دعم مباشر لجمعيات الرفق بالحيوان'],
    },
  },
  {
    id: 'comunicacion',
    number: '07',
    name: { es: 'Comunicación y visibilidad digital (SCP Comunica)', ar: 'التواصل والظهور الرقمي (SCP Comunica)' },
    shortName: { es: 'SCP Comunica', ar: 'التواصل الرقمي' },
    tagline: {
      es: 'Posicionamiento institucional, identidad digital, redacción bilingüe y difusión profesional.',
      ar: 'الحضور الرقمي المؤسسي، الهوية البصرية، والتحرير ثنائي اللغة.',
    },
    discountLabel: 'Hasta 20 % dto.',
    image: '/src/assets/images/area_scp_comunica_1795249548343.jpg',
    highlights: {
      es: ['Estrategia digital para especialistas', 'Contenido institucional ES | AR', 'Entregables cerrados y auditados'],
      ar: ['استراتيجية رقمية للمختصين', 'محتوى مؤسسي عربي وإسباني', 'نتائج واضحة ومحددة مسبقاً'],
    },
  },
  {
    id: 'asociacion',
    number: '08',
    name: { es: 'Asociación SCP y apoyo comunitario', ar: 'جمعية SCP والدعم المجتمعي' },
    shortName: { es: 'Asociación SCP', ar: 'الجمعية' },
    tagline: {
      es: 'Mediación vecinal, orientación social a familias, inserción y redes de apoyo mutuo.',
      ar: 'الوساطة المجتمعية، التوجيه الاجتماعي للأسر، وشبكات الدعم التضامني.',
    },
    discountLabel: 'Tarifa solidaria',
    image: '/src/assets/images/area_asociacion_comunitaria_1795249549700.jpg',
    highlights: {
      es: ['Acompañamiento intercultural ES | AR', 'Derivación a recursos sociales', 'Programas sin ánimo de lucro'],
      ar: ['مرافقة ثقافية عربي-إسباني', 'توجيه نحو الموارد الاجتماعية', 'برامج دعم مجتمعي غير ربحية'],
    },
  },
];

export const UI_COPY: Record<
  LanguageCode,
  {
    brand: string;
    motto: string;
    heroKicker: string;
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    allSectors: string;
    searchButton: string;
    ctaTitular: string;
    ctaEspecialista: string;
    ctaMySpace: string;
    ctaAdmin: string;
    bridgeTitle: string;
    bridgeSubtitle: string;
    areasTitle: string;
    areasSubtitle: string;
    flowsTitle: string;
    flowsSubtitle: string;
    shieldTitle: string;
    shieldSubtitle: string;
    trustTitle: string;
    trustSubtitle: string;
  }
> = {
  es: {
    brand: 'SERVICIOS CANAL PUENTE · SCP',
    motto: 'Encuentra el servicio que necesitas con el especialista adecuado.',
    heroKicker: 'DESCUENTOS ESPECIALES · HASTA 25 % EN SERVICIOS VERIFICADOS',
    heroTitle: 'Encuentra el servicio que necesitas con el especialista adecuado.',
    heroSubtitle:
      'Hasta un 25 % de descuento en todos los servicios y sectores. Recibe orientación cercana, compara opciones y conoce el alcance y el precio antes de contratar.',
    searchPlaceholder: 'Filtrar las 8 áreas en tiempo real (ej. dental, extranjería, darija, arras, veterinaria)...',
    allSectors: 'Todas las áreas (8)',
    searchButton: 'Ver todos los servicios',
    ctaTitular: 'Registra tu servicio (Usuario Titular)',
    ctaEspecialista: 'Ofrece tus servicios (Usuario Especialista)',
    ctaMySpace: 'Mi Espacio (Acceso Usuarios)',
    ctaAdmin: 'Administración SCP',
    bridgeTitle: 'Cómo funciona el Puente SCP',
    bridgeSubtitle: 'Un circuito ordenado de intermediación institucional con garantías verificables en ambos extremos.',
    areasTitle: 'Las 8 Áreas de Actividad de SCP',
    areasSubtitle: 'Buscador y catálogo en tiempo real. Selecciona cualquier área para ver ofertas verificadas, contratos modelo o iniciar un expediente.',
    flowsTitle: 'Flujo paso a paso en cinco estados trazables',
    flowsSubtitle: 'Transparencia operativa desde la primera solicitud hasta el cierre y valoración con Pago Protegido (Escrow SCP).',
    shieldTitle: 'Escudo Dual SCP',
    shieldSubtitle: 'Circuito de doble garantía: protección económica y documental para el Titular + derivación cualificada y cobro asegurado para el Especialista.',
    trustTitle: 'Por qué confiar en SCP',
    trustSubtitle: 'Criterios objetivos de admisión, formación continua y atención bilingüe cercana.',
  },
  ar: {
    brand: 'خدمات قناة الجسر SCP',
    motto: 'اعثر على الخدمة التي تحتاجها مع المختص المناسب',
    heroKicker: 'خصومات خاصة · خصم يصل إلى 25٪ في جميع الخدمات المعتمدة',
    heroTitle: 'اعثر على الخدمة التي تحتاجها مع المختص المناسب',
    heroSubtitle:
      'خصم يصل إلى 25٪ في جميع المجالات. احصل على توجيه قريب، قارن الخيارات، واعرف النطاق والسعر قبل التعاقد.',
    searchPlaceholder: 'ابحث في المجالات الثمانية (طب الأسنان، الإجراءات، الدارجة، العقارات، البيطرة)...',
    allSectors: 'جميع المجالات (8)',
    searchButton: 'عرض جميع الخدمات',
    ctaTitular: 'سجّل خدمتك (مستخدم طالب خدمة)',
    ctaEspecialista: 'قدّم خدماتك (مختص معتمد)',
    ctaMySpace: 'مساحتي (دخول المستخدمين)',
    ctaAdmin: 'إدارة منصة SCP',
    bridgeTitle: 'كيف يعمل جسر الخدمات SCP',
    bridgeSubtitle: 'منظومة وساطة مؤسسية واضحة تضمن الحقوق للطرفين في جميع المراحل.',
    areasTitle: 'مجالات النشاط الثمانية في SCP',
    areasSubtitle: 'تصفية فورية للمجالات والخدمات المعتمدة ونماذج العقود.',
    flowsTitle: 'مسار العمل في خمس مراحل موثقة',
    flowsSubtitle: 'شفافية كاملة من تقديم الطلب حتى الإغلاق والتقييم عبر الدفع المحمي SCP.',
    shieldTitle: 'الدرع المزدوج SCP',
    shieldSubtitle: 'حماية مالية ووثائقية لطالب الخدمة + إحالة مؤهلة وتحصيل مضمون للمختص.',
    trustTitle: 'لماذا تثق في منصة SCP',
    trustSubtitle: 'معايير قبول مهنية، تدقيق للتسجيل النقابي والتأمين، وخدمة ثنائية اللغة.',
  },
};

export const TITULAR_STEPS = [
  {
    step: '01',
    title: 'Solicitud recibida',
    desc: 'Eliges el área de actividad, describes tu necesidad, ciudad y preferencia presencial u online.',
  },
  {
    step: '02',
    title: 'Estudio y opciones',
    desc: 'SCP revisa el expediente y coordina propuestas con presupuesto cerrado y descuento de hasta 25 %.',
  },
  {
    step: '03',
    title: 'Presupuesto y ejecución',
    desc: 'Aceptas la opción, depositas en Pago Protegido (Escrow SCP) y el especialista ejecuta el encargo.',
  },
  {
    step: '04',
    title: 'Cierre y valoración',
    desc: 'Confirmas tu conformidad, valoras la atención y se libera el pago con contrato y factura oficial.',
  },
];

export const ESPECIALISTA_STEPS = [
  {
    step: '01',
    title: 'Adhesión profesional',
    desc: 'Indicas empresa/nombre, especialidad, nº de colegiado o acreditación, tarifa orientativa y compromiso SCP.',
  },
  {
    step: '02',
    title: 'Revisión por SCP',
    desc: 'El equipo SCP verifica tu acreditación y seguro RC antes de activar el distintivo Validado.',
  },
  {
    step: '03',
    title: 'Encargos y agenda',
    desc: 'Recibes expedientes asignados desde Administración SCP y gestionas tus citas de Agenda.',
  },
  {
    step: '04',
    title: 'Liquidación segura',
    desc: 'Completado el servicio, el Pago Protegido se libera puntualmente a tu historial de liquidaciones.',
  },
];

export const ESCUDO_TITULAR = [
  {
    title: 'Protección económica en Escrow SCP',
    detail: 'Tu pago permanece resguardado en Pago Protegido hasta que confirmas la correcta ejecución del servicio.',
  },
  {
    title: 'Contratos modelo oficiales y presupuesto cerrado',
    detail: 'Conoces el alcance exacto, los plazos y el precio final con descuento SCP antes de contratar.',
  },
  {
    title: 'Acompañamiento cercano ES | AR',
    detail: 'Mediación humana directa en español, catalán, árabe y darija por teléfono, WhatsApp o videoconsulta.',
  },
];

export const ESCUDO_ESPECIALISTA = [
  {
    title: 'Derivación cualificada sin ruido',
    detail: 'Recibes expedientes reales y filtrados que encajan con tu especialidad, tarifa orientativa y modalidad.',
  },
  {
    title: 'Cobro asegurado y cero morosidad',
    detail: 'Los encargos cuentan con provisión previa en Pago Protegido SCP y liquidación transparente.',
  },
  {
    title: 'Soporte documental y agenda integrada',
    detail: 'Hojas de encargo, consentimientos informados y control de citas centralizados en Mi Espacio.',
  },
];

export const CONOCE_SCP_SECTIONS = [
  {
    id: 'introduccion',
    kicker: 'Introducción',
    title: 'Un puente institucional entre necesidades reales y rigor profesional',
    body: 'Servicios Canal Puente (SCP) nace para eliminar la incertidumbre al contratar servicios esenciales de trámites, salud, vivienda, formación, bienestar, protección animal, comunicación y apoyo comunitario.',
  },
  {
    id: 'presentacion',
    kicker: 'Presentación',
    title: 'Intermediación estructurada con verificación previa',
    body: 'En SCP ningún profesional recibe encargos sin acreditar colegiación o titulación habilitante, póliza de responsabilidad civil y aceptación expresa del Compromiso de Calidad SCP.',
  },
  {
    id: 'quienes-somos',
    kicker: 'Quiénes somos',
    title: 'Equipo multidisciplinar con vocación de servicio multilingüe',
    body: 'Integramos coordinadores jurídicos, gestores de atención al titular y auditores de calidad que acompañan en Castellano, Catalán, Árabe y Darija.',
  },
  {
    id: 'nuestro-valor',
    kicker: 'Nuestro valor',
    title: 'Ahorro real de hasta el 25 % y Escudo Dual SCP',
    body: 'Negociamos convenios colectivos de tarifa reducida con especialistas adheridos, manteniendo íntegros los estándares de calidad clínica, jurídica y docente.',
  },
];

export const COMUNICA_ARTICLES = [
  {
    id: 'art-1',
    category: 'Guía Práctica · Trámites',
    date: '18 Nov 2026',
    title: 'Qué revisar antes de firmar un contrato de arras penitenciales en 2026',
    excerpt: 'Cláusulas de financiación, vigencia de nota simple registral y plazo de elevación a público para proteger tu señal.',
    readTime: '4 min lectura',
  },
  {
    id: 'art-2',
    category: 'Convenio Salud · SCP',
    date: '12 Nov 2026',
    title: 'Protocolo de presupuesto dental cerrado: cómo evitar sobrecostes clínicos',
    excerpt: 'Exigimos desglose por fases, garantía escrita en implantología y revisión diagnóstica previa sin compromiso.',
    readTime: '3 min lectura',
  },
  {
    id: 'art-3',
    category: 'Academia SCP',
    date: '04 Nov 2026',
    title: 'Nuevos itinerarios de Castellano, Catalán, Árabe, Darija y preparación de FP',
    excerpt: 'Docentes acreditados se incorporan a la red con seguimiento personalizado en Mi Espacio.',
    readTime: '3 min lectura',
  },
];

export const STORE_ITEMS = [
  {
    id: 'st-1',
    category: 'Pack Documental',
    title: 'Dossier Integral de Compraventa y Revisión de Arras',
    description: 'Incluye revisión jurídica de contrato, verificación de nota simple y checklist notarial completo.',
    price: 79,
    regularPrice: 105,
  },
  {
    id: 'st-2',
    category: 'Asesoría Express',
    title: 'Bono Diagnóstico Extranjería y Homologación (60 min)',
    description: 'Sesión individual con abogada colegiada y hoja de ruta documental personalizada ES/AR.',
    price: 49,
    regularPrice: 65,
  },
  {
    id: 'st-3',
    category: 'Membresía Anual',
    title: 'Pase Anual SCP Plus Familiar (Hasta 25 % dto.)',
    description: 'Prioridad en agenda, custodia sin comisiones en Pago Protegido SCP y 2 revisiones documentales anuales.',
    price: 95,
    regularPrice: 128,
  },
];

export const LEGAL_DOCS: Record<string, { title: string; updated: string; paragraphs: string[] }> = {
  aviso: {
    title: 'Aviso Legal',
    updated: 'Actualizado a noviembre de 2026',
    paragraphs: [
      'Servicios Canal Puente (SCP) opera como plataforma de intermediación, verificación profesional y gestión documental de expedientes entre Usuarios Titulares y Usuarios Especialistas independientes.',
      'Domicilio institucional de referencia: Paseo de la Castellana 95, 28046 Madrid, España. Teléfono de atención y WhatsApp verificado: +34 673 735 059. Correo electrónico: atencion@canalpuente.es.',
      'Todos los especialistas visibles en la red pública han aportado documentación acreditativa de colegiación o habilitación profesional y póliza de seguro de responsabilidad civil vigente en el momento de su validación.',
    ],
  },
  privacidad: {
    title: 'Política de Privacidad y Protección de Datos (RGPD)',
    updated: 'Conforme al Reglamento (UE) 2016/679 y LOPDGDD 3/2018',
    paragraphs: [
      'Los datos personales recabados en los formularios de registro, solicitud de servicio y acreditación profesional se tratan exclusivamente para gestionar los expedientes asignados en Mi Espacio, coordinar citas de Agenda y emitir documentación contractual.',
      'No cedemos datos personales a terceros ajenos al expediente sin consentimiento expreso del Titular. Los datos sanitarios o jurídicos sensibles se custodian bajo acceso restringido por rol.',
      'Puede ejercer sus derechos de acceso, rectificación, supresión, limitación y portabilidad escribiendo a privacidad@canalpuente.es.',
    ],
  },
  cookies: {
    title: 'Política de Cookies',
    updated: 'Actualizado a noviembre de 2026',
    paragraphs: [
      'Esta plataforma utiliza únicamente almacenamiento técnico estrictamente necesario para mantener la continuidad de sesión, preferencias de idioma (ES | AR) y seguridad de las operaciones.',
      'No utilizamos cookies publicitarias ni perfilado comercial de terceros.',
    ],
  },
  condiciones: {
    title: 'Condiciones Generales de Uso y Escudo Dual SCP',
    updated: 'Edición 2026.2',
    paragraphs: [
      'El Usuario Titular recibe propuestas con presupuesto cerrado y descuento aplicado (hasta el 25 % según área). El depósito en Pago Protegido (Escrow SCP) permanece bloqueado hasta la confirmación de conformidad o resolución de mediación.',
      'El Usuario Especialista asume la prestación directa conforme a su lex artis profesional, manteniendo en vigor su colegiación y seguro de responsabilidad civil durante toda la vigencia de su alta en SCP.',
    ],
  },
};
