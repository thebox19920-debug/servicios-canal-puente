import React, { useState, useRef } from 'react';
import {
  Search,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Headphones,
  FileCheck2,
  UserCheck,
  Briefcase,
  Lock,
  Calendar,
  FileText,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import {
  SECTORS,
  UI_COPY,
  TITULAR_STEPS,
  ESPECIALISTA_STEPS,
  ESCUDO_TITULAR,
  ESCUDO_ESPECIALISTA,
} from '../data/scpContent';
import type { LanguageCode, SectorId, UserRole } from '../types/scp';

interface HomeSectionsProps {
  lang: LanguageCode;
  onSearchServices: (query: string, sector: SectorId | 'all') => void;
  onSelectSector: (sector: SectorId) => void;
  onOpenAuth: (mode: 'login' | 'reserved' | 'titular-form' | 'especialista-form') => void;
  onDemoLogin: (role: UserRole) => void;
}

export const HomeSections: React.FC<HomeSectionsProps> = ({
  lang,
  onSearchServices,
  onSelectSector,
  onOpenAuth,
  onDemoLogin,
}) => {
  const copy = UI_COPY[lang];
  const isRtl = lang === 'ar';
  const [liveFilter, setLiveFilter] = useState('');
  const [selectedSector, setSelectedSector] = useState<SectorId | 'all'>('all');
  const [previewRole, setPreviewRole] = useState<'titular' | 'especialista'>('titular');
  const areasSectionRef = useRef<HTMLElement>(null);

  const normalizedQuery = liveFilter.trim().toLowerCase();
  const filteredAreas = SECTORS.filter((s) => {
    if (selectedSector !== 'all' && s.id !== selectedSector) return false;
    if (!normalizedQuery) return true;
    return (
      s.name[lang].toLowerCase().includes(normalizedQuery) ||
      s.tagline[lang].toLowerCase().includes(normalizedQuery) ||
      s.highlights[lang].some((h) => h.toLowerCase().includes(normalizedQuery))
    );
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    areasSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. HERO PRINCIPAL EN DOS COLUMNAS + 4 BOTONES PRINCIPALES */}
      <section className="pt-24 lg:pt-32 pb-16 lg:pb-20 bg-[#FAF8F5] border-b border-[#E5DFD5]">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Columna izquierda: Propuesta de valor + 4 botones principales */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#C59B3B]">
                {copy.heroKicker}
              </p>

              <h1
                className="font-editorial font-semibold text-[#14284B] leading-[1.08] tracking-tight"
                style={{ fontSize: 'clamp(2.25rem, 3.8vw, 3.55rem)', textWrap: 'balance' }}
              >
                {copy.heroTitle}
              </h1>

              <p className="text-base sm:text-[17px] text-[#14284B]/80 leading-relaxed max-w-xl">
                {copy.heroSubtitle}
              </p>

              {/* Los 4 botones principales de acción visibles en portada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenAuth('titular-form')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#14284B] hover:bg-[#1C3764] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-[#C59B3B] shrink-0" />
                  <span>{copy.ctaTitular}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuth('especialista-form')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md border-[1.5px] border-[#C59B3B] bg-white hover:bg-[#FAF8F5] text-[#14284B] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 text-[#C59B3B] shrink-0" />
                  <span>{copy.ctaEspecialista}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[#E5DFD5] bg-white hover:border-[#14284B] text-[#14284B] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#2E5A44] shrink-0" />
                  <span>{copy.ctaMySpace}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDemoLogin('admin')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#2E5A44] hover:bg-[#244736] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#D7B45F] shrink-0" />
                  <span>{copy.ctaAdmin}</span>
                </button>
              </div>
            </div>

            {/* Columna derecha: Tarjeta elegante de despacho profesional + buscador en tiempo real */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="flex-1 bg-white border border-[#E5DFD5] rounded-2xl overflow-hidden flex flex-col">
                <div className="relative h-56 sm:h-64 bg-[#14284B] overflow-hidden">
                  <img
                    src="/src/assets/images/hero_bridge_institutional_1795247772991.jpg"
                    alt="Despacho profesional Servicios Canal Puente"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14284B]/85 via-[#14284B]/20 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                    <p className="text-[11px] font-semibold tracking-wider text-[#D7B45F]">
                      {lang === 'ar' ? 'استشارة موثوقة · إسباني / عربي' : 'Despacho coordinador SCP · Atención ES | AR'}
                    </p>
                    <p className="font-editorial text-xl sm:text-2xl font-semibold leading-snug mt-0.5">
                      {lang === 'ar'
                        ? 'مقارنة عروض معتمدة بميزانية واضحة'
                        : 'Orientación cercana y presupuesto cerrado antes de contratar'}
                    </p>
                  </div>
                </div>

                {/* Buscador funcional en tiempo real que filtra las 8 Áreas */}
                <form onSubmit={handleSearchSubmit} className="p-6 space-y-4 bg-white flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#14284B]">
                        {lang === 'ar'
                          ? 'تصفية فورية للمجالات الثمانية'
                          : 'Buscador en tiempo real · Filtra las 8 Áreas de Actividad'}
                      </p>
                      <span className="font-mono text-[11px] text-[#2E5A44] font-semibold tabular-nums">
                        {filteredAreas.length} de 8 áreas
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] focus-within:border-[#C59B3B]">
                      <Search className="w-4 h-4 text-[#C59B3B] shrink-0" />
                      <input
                        type="text"
                        value={liveFilter}
                        onChange={(e) => setLiveFilter(e.target.value)}
                        placeholder={copy.searchPlaceholder}
                        aria-label="Filtrar áreas de actividad SCP en tiempo real"
                        className="w-full text-sm text-[#14284B] placeholder:text-[#14284B]/45 bg-transparent focus:outline-none"
                      />
                    </div>

                    <select
                      value={selectedSector}
                      onChange={(e) => setSelectedSector(e.target.value as SectorId | 'all')}
                      aria-label="Seleccionar área de actividad"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] text-sm font-medium text-[#14284B] focus:outline-none focus:border-[#C59B3B] cursor-pointer"
                    >
                      <option value="all">{copy.allSectors}</option>
                      {SECTORS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.number}. {s.name[lang]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => onSearchServices(liveFilter.trim(), selectedSector)}
                      className="text-xs font-semibold text-[#14284B] hover:text-[#C59B3B] underline underline-offset-4 cursor-pointer"
                    >
                      {copy.searchButton}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-md bg-[#14284B] hover:bg-[#1C3764] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Ver áreas filtradas ({filteredAreas.length})
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Franja de indicadores verificables */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 border border-[#E5DFD5] rounded-xl bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E5DFD5]">
            <div className="p-5">
              <p className="font-mono text-xl font-semibold text-[#14284B] tabular-nums">Hasta 25 %</p>
              <p className="text-xs text-[#14284B]/70 mt-1">Descuento directo pactado en tarifas cerradas</p>
            </div>
            <div className="p-5">
              <p className="font-mono text-xl font-semibold text-[#14284B] tabular-nums">8 Áreas SCP</p>
              <p className="text-xs text-[#14284B]/70 mt-1">Especialistas colegiados y Seguro RC auditado</p>
            </div>
            <div className="p-5">
              <p className="font-mono text-xl font-semibold text-[#2E5A44] tabular-nums">Escrow SCP</p>
              <p className="text-xs text-[#14284B]/70 mt-1">Pago Protegido liberado solo tras tu conformidad</p>
            </div>
            <div className="p-5">
              <p className="font-mono text-xl font-semibold text-[#14284B] tabular-nums">+34 673 735 059</p>
              <p className="text-xs text-[#14284B]/70 mt-1">Atención humana ES · CAT · AR · Darija</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LAS 8 ÁREAS DE ACTIVIDAD DE SCP (FILTRABLES EN TIEMPO REAL) */}
      <section ref={areasSectionRef} className="py-16 lg:py-20 bg-white border-b border-[#E5DFD5]">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wide text-[#C59B3B] mb-2">
                Sectores especializados y cobertura integral
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#14284B]" style={{ textWrap: 'balance' }}>
                {copy.areasTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#14284B]/75 mt-2">{copy.areasSubtitle}</p>
            </div>

            {(liveFilter || selectedSector !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setLiveFilter('');
                  setSelectedSector('all');
                }}
                className="px-4 py-2 rounded-md border border-[#E5DFD5] text-xs font-semibold text-[#14284B] hover:bg-[#FAF8F5] cursor-pointer whitespace-nowrap"
              >
                Limpiar filtro (ver las 8 áreas)
              </button>
            )}
          </div>

          {filteredAreas.length === 0 ? (
            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-xl p-10 text-center space-y-3">
              <p className="font-editorial text-2xl font-semibold text-[#14284B]">
                No hay áreas que coincidan con «{liveFilter}»
              </p>
              <p className="text-sm text-[#14284B]/70">
                Puedes limpiar el filtro o registrar directamente tu necesidad para que Administración SCP te oriente.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLiveFilter('');
                    setSelectedSector('all');
                  }}
                  className="px-4 py-2 rounded-md border border-[#E5DFD5] bg-white text-xs font-semibold text-[#14284B] cursor-pointer"
                >
                  Mostrar las 8 áreas
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('titular-form')}
                  className="px-4 py-2 rounded-md bg-[#14284B] text-white text-xs font-semibold cursor-pointer"
                >
                  Registra tu servicio (Usuario Titular)
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAreas.map((sector) => (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => onSelectSector(sector.id)}
                  className="group text-left bg-[#FAF8F5] border border-[#E5DFD5] rounded-xl overflow-hidden hover:border-[#C59B3B] transition-all flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B3B]"
                >
                  <div className="aspect-[4/3] w-full bg-[#14284B] overflow-hidden relative">
                    <img
                      src={sector.image}
                      alt={sector.name[lang]}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>

                  <div className="p-5 bg-white flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#C59B3B]">
                        {sector.number}. {sector.shortName[lang]} · {sector.discountLabel}
                      </p>
                      <h3 className="font-editorial text-xl font-semibold text-[#14284B] group-hover:text-[#27487E] leading-snug">
                        {sector.name[lang]}
                      </h3>
                      <p className="text-xs text-[#14284B]/75 leading-relaxed">{sector.tagline[lang]}</p>
                    </div>

                    <div className="pt-3 border-t border-[#E5DFD5] flex items-center justify-between text-xs font-semibold text-[#14284B]">
                      <span>Ver ofertas y especialistas</span>
                      <ArrowRight className="w-4 h-4 text-[#C59B3B] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. ESQUEMA VISUAL DEL PUENTE + ESCUDO DUAL SCP */}
      <section className="py-16 lg:py-20 bg-[#FAF8F5] border-b border-[#E5DFD5]">
        <div className="max-w-[1240px] mx-auto px-6 space-y-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#C59B3B] mb-2">Doble garantía institucional</p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#14284B]" style={{ textWrap: 'balance' }}>
              {copy.shieldTitle}
            </h2>
            <p className="text-sm sm:text-base text-[#14284B]/75 mt-2">{copy.shieldSubtitle}</p>
          </div>

          {/* Circuito visual del Puente SCP */}
          <div className="bg-white border border-[#E5DFD5] rounded-xl p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <div className="md:col-span-1 text-center md:text-left p-4 rounded-lg bg-[#FAF8F5] border border-[#E5DFD5]">
                <p className="text-[11px] font-semibold tracking-wider text-[#C59B3B]">QUIEN BUSCA</p>
                <p className="font-editorial text-xl font-semibold text-[#14284B] mt-1">Usuario Titular</p>
                <p className="text-xs text-[#14284B]/70 mt-1">Solicita servicio con tarifa protegida</p>
              </div>

              <div className="hidden md:flex justify-center text-[#C59B3B]">
                <ChevronRight className="w-7 h-7" />
              </div>

              <div className="md:col-span-1 text-center p-4 rounded-lg bg-[#14284B] text-white">
                <p className="text-[11px] font-semibold tracking-wider text-[#C59B3B]">EL PUENTE</p>
                <p className="font-editorial text-xl font-semibold mt-1">Escudo Dual SCP</p>
                <p className="text-xs text-white/75 mt-1">Validación + Contratos + Escrow</p>
              </div>

              <div className="hidden md:flex justify-center text-[#C59B3B]">
                <ChevronRight className="w-7 h-7" />
              </div>

              <div className="md:col-span-1 text-center md:text-right p-4 rounded-lg bg-[#2E5A44]/10 border border-[#2E5A44]/25">
                <p className="text-[11px] font-semibold tracking-wider text-[#2E5A44]">QUIEN RESUELVE</p>
                <p className="font-editorial text-xl font-semibold text-[#14284B] mt-1">Usuario Especialista</p>
                <p className="text-xs text-[#14284B]/70 mt-1">Acreditado, colegiado y asegurado</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-[#E5DFD5] rounded-xl p-7 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD5]">
                <div>
                  <p className="text-xs font-semibold text-[#C59B3B]">Protección económica y documental</p>
                  <h3 className="font-editorial text-2xl font-semibold text-[#14284B]">Para el Usuario Titular</h3>
                </div>
                <ShieldCheck className="w-7 h-7 text-[#C59B3B]" />
              </div>
              <div className="space-y-4">
                {ESCUDO_TITULAR.map((item) => (
                  <div key={item.title} className="space-y-1">
                    <p className="text-sm font-semibold text-[#14284B]">{item.title}</p>
                    <p className="text-sm text-[#14284B]/75 leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onOpenAuth('titular-form')}
                className="px-4 py-2.5 rounded-md bg-[#14284B] hover:bg-[#1C3764] text-white text-xs font-semibold cursor-pointer"
              >
                Registra tu servicio (Usuario Titular)
              </button>
            </div>

            <div className="bg-white border border-[#E5DFD5] rounded-xl p-7 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD5]">
                <div>
                  <p className="text-xs font-semibold text-[#2E5A44]">Derivación cualificada y cobro asegurado</p>
                  <h3 className="font-editorial text-2xl font-semibold text-[#14284B]">Para el Usuario Especialista</h3>
                </div>
                <Sparkles className="w-7 h-7 text-[#2E5A44]" />
              </div>
              <div className="space-y-4">
                {ESCUDO_ESPECIALISTA.map((item) => (
                  <div key={item.title} className="space-y-1">
                    <p className="text-sm font-semibold text-[#14284B]">{item.title}</p>
                    <p className="text-sm text-[#14284B]/75 leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onOpenAuth('especialista-form')}
                className="px-4 py-2.5 rounded-md border-[1.5px] border-[#C59B3B] bg-white hover:bg-[#FAF8F5] text-[#14284B] text-xs font-semibold cursor-pointer"
              >
                Ofrece tus servicios (Usuario Especialista)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FLUJO EN 5 ESTADOS + PREVIEW INTERACTIVA DE MI ESPACIO Y ADMIN SCP */}
      <section className="py-16 lg:py-20 bg-white border-b border-[#E5DFD5]">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold tracking-wide text-[#C59B3B] mb-2">Operativa trazable</p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#14284B]" style={{ textWrap: 'balance' }}>
              {copy.flowsTitle}
            </h2>
            <p className="text-sm sm:text-base text-[#14284B]/75 mt-2">{copy.flowsSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-xl p-6 sm:p-8 space-y-6">
              <div>
                <p className="text-xs font-semibold tracking-wider text-[#C59B3B]">01. USUARIO TITULAR · EXPEDIENTES</p>
                <h3 className="font-editorial text-2xl font-semibold text-[#14284B] mt-1">
                  Seguimiento paso a paso y Pago Protegido (Escrow SCP)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TITULAR_STEPS.map((st) => (
                  <div key={st.step} className="bg-white border border-[#E5DFD5] rounded-lg p-4 space-y-1.5">
                    <p className="font-mono text-xs font-semibold text-[#C59B3B]">Fase {st.step}</p>
                    <p className="text-sm font-semibold text-[#14284B]">{st.title}</p>
                    <p className="text-xs text-[#14284B]/70 leading-relaxed">{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-xl p-6 sm:p-8 space-y-6">
              <div>
                <p className="text-xs font-semibold tracking-wider text-[#2E5A44]">02. USUARIO ESPECIALISTA · ACREDITACIÓN</p>
                <h3 className="font-editorial text-2xl font-semibold text-[#14284B] mt-1">
                  Validación colegial, agenda y liquidaciones
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ESPECIALISTA_STEPS.map((st) => (
                  <div key={st.step} className="bg-white border border-[#E5DFD5] rounded-lg p-4 space-y-1.5">
                    <p className="font-mono text-xs font-semibold text-[#2E5A44]">Fase {st.step}</p>
                    <p className="text-sm font-semibold text-[#14284B]">{st.title}</p>
                    <p className="text-xs text-[#14284B]/70 leading-relaxed">{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vista previa interactiva de Mi Espacio */}
          <div className="bg-[#14284B] text-white rounded-xl p-6 sm:p-8 border border-[#C59B3B]/40">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/15">
              <div>
                <p className="text-xs font-semibold text-[#D7B45F]">Acceso inmediato de presentación · Mi Espacio SCP</p>
                <h3 className="font-editorial text-2xl sm:text-3xl font-semibold mt-1">
                  Prueba los tres roles reales en un solo clic
                </h3>
              </div>

              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-white/10 self-start">
                <button
                  type="button"
                  onClick={() => setPreviewRole('titular')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    previewRole === 'titular' ? 'bg-[#C59B3B] text-[#14284B]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Vista Titular
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRole('especialista')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    previewRole === 'especialista' ? 'bg-[#C59B3B] text-[#14284B]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Vista Especialista
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
              {previewRole === 'titular' ? (
                <>
                  <div className="bg-white/5 border border-white/15 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#D7B45F] font-semibold">
                      <FileText className="w-4 h-4" />
                      <span>Expedientes trazables</span>
                    </div>
                    <p className="text-sm font-medium">EXP-2026-001 · Revisión dental 3D</p>
                    <p className="text-xs text-white/70">Estado: 4. En ejecución · Ahorro 120 € (25 %)</p>
                  </div>
                  <div className="bg-white/5 border border-white/15 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#D7B45F] font-semibold">
                      <Calendar className="w-4 h-4" />
                      <span>Agenda y contratos oficiales</span>
                    </div>
                    <p className="text-sm font-medium">Contrato modelo descargable por área</p>
                    <p className="text-xs text-white/70">Trámites, Sanidad, Academia y Bienestar</p>
                  </div>
                  <div className="bg-white/5 border border-white/15 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#D7B45F] font-semibold">
                      <Lock className="w-4 h-4" />
                      <span>Pago Protegido (Escrow SCP)</span>
                    </div>
                    <p className="text-sm font-medium tabular-nums">360,00 € en custodia segura</p>
                    <p className="text-xs text-white/70">Liberación tras cierre y valoración</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white/5 border border-white/15 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#D7B45F] font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Acreditación profesional</span>
                    </div>
                    <p className="text-sm font-medium">Colegiado COEM-28009412 · Validado</p>
                    <p className="text-xs text-white/70">Compromiso de calidad SCP y Seguro RC</p>
                  </div>
                  <div className="bg-white/5 border border-white/15 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#D7B45F] font-semibold">
                      <FileText className="w-4 h-4" />
                      <span>Encargos asignados</span>
                    </div>
                    <p className="text-sm font-medium">Derivación directa desde Administración SCP</p>
                    <p className="text-xs text-white/70">Agenda de citas confirmadas en Mi Espacio</p>
                  </div>
                  <div className="bg-white/5 border border-white/15 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#D7B45F] font-semibold">
                      <Lock className="w-4 h-4" />
                      <span>Historial de liquidaciones</span>
                    </div>
                    <p className="text-sm font-medium tabular-nums">540,00 € gestionados en Escrow SCP</p>
                    <p className="text-xs text-white/70">Cobro asegurado al completar el servicio</p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-white/75">
                Entra en la demostración interactiva completa con un clic:
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onDemoLogin('titular')}
                  className="px-4 py-2 rounded-md bg-white text-[#14284B] hover:bg-[#FAF8F5] text-xs font-semibold cursor-pointer"
                >
                  Mi Espacio - Titular
                </button>
                <button
                  type="button"
                  onClick={() => onDemoLogin('especialista')}
                  className="px-4 py-2 rounded-md bg-[#C59B3B] text-[#14284B] hover:bg-[#D7B45F] text-xs font-semibold cursor-pointer"
                >
                  Mi Espacio - Especialista
                </button>
                <button
                  type="button"
                  onClick={() => onDemoLogin('admin')}
                  className="px-4 py-2 rounded-md bg-[#2E5A44] text-white hover:bg-[#244736] text-xs font-semibold cursor-pointer"
                >
                  Administración SCP
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. POR QUÉ CONFIAR EN SCP */}
      <section className="py-16 lg:py-20 bg-[#FAF8F5]">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold tracking-wide text-[#C59B3B] mb-2">Estándares verificables</p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#14284B]" style={{ textWrap: 'balance' }}>
              {copy.trustTitle}
            </h2>
            <p className="text-sm sm:text-base text-[#14284B]/75 mt-2">{copy.trustSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[#E5DFD5] rounded-xl p-7 space-y-3">
              <GraduationCap className="w-6 h-6 text-[#C59B3B]" />
              <h3 className="font-editorial text-2xl font-semibold text-[#14284B]">Formación y crecimiento</h3>
              <p className="text-sm text-[#14284B]/75 leading-relaxed">
                Itinerarios reales de Castellano, Catalán, Árabe, Darija y preparación de FP junto con mejora continua de protocolos profesionales.
              </p>
            </div>

            <div className="bg-white border border-[#E5DFD5] rounded-xl p-7 space-y-3">
              <Headphones className="w-6 h-6 text-[#C59B3B]" />
              <h3 className="font-editorial text-2xl font-semibold text-[#14284B]">Atención accesible ES | AR</h3>
              <p className="text-sm text-[#14284B]/75 leading-relaxed">
                Orientación telefónica y por WhatsApp en el +34 673 735 059 con atención humana directa y mediación cercana en cada expediente.
              </p>
            </div>

            <div className="bg-white border border-[#E5DFD5] rounded-xl p-7 space-y-3">
              <FileCheck2 className="w-6 h-6 text-[#2E5A44]" />
              <h3 className="font-editorial text-2xl font-semibold text-[#14284B]">Criterios de colaboración</h3>
              <p className="text-sm text-[#14284B]/75 leading-relaxed">
                Validación obligatoria de colegiación o acreditación oficial, seguro de responsabilidad civil (RC) y firma del Compromiso de Calidad SCP.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
