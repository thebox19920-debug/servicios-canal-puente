import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Phone,
  HeartHandshake,
  PawPrint,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import {
  SECTORS,
  CONOCE_SCP_SECTIONS,
  COMUNICA_ARTICLES,
  STORE_ITEMS,
} from '../data/scpContent';
import type {
  LanguageCode,
  SectorId,
  ServiceOffer,
  SpecialistProfile,
  ContractDocument,
} from '../types/scp';

interface PublicViewsProps {
  page:
    | 'servicios'
    | 'conoce'
    | 'comunica'
    | 'tienda'
    | 'asociacion'
    | 'proteccion-animal'
    | 'agenda'
    | 'contacto'
    | 'membresias';
  lang: LanguageCode;
  offers: ServiceOffer[];
  specialists: Partial<SpecialistProfile>[];
  documents: ContractDocument[];
  initialSector: SectorId | 'all';
  initialQuery: string;
  initialVerifiedOnly?: boolean;
  onRequestServiceFromOffer: (sector: SectorId, prefillTitle: string, budget: number) => void;
  onOpenAuth: (mode: 'login' | 'reserved' | 'titular-form' | 'especialista-form') => void;
}

export const PublicViews: React.FC<PublicViewsProps> = ({
  page,
  lang,
  offers,
  specialists,
  documents,
  initialSector,
  initialQuery,
  initialVerifiedOnly = false,
  onRequestServiceFromOffer,
  onOpenAuth,
}) => {
  const [sectorFilter, setSectorFilter] = useState<SectorId | 'all'>(initialSector);
  const [query, setQuery] = useState(initialQuery);
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerifiedOnly);

  // Store checkout state
  const [buyingItem, setBuyingItem] = useState<(typeof STORE_ITEMS)[number] | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);

  React.useEffect(() => {
    setSectorFilter(initialSector);
  }, [initialSector]);

  React.useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  React.useEffect(() => {
    setVerifiedOnly(initialVerifiedOnly);
  }, [initialVerifiedOnly]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyingItem) return;
    setOrderSubmitting(true);
    setOrderMessage('');
    try {
      const res = await fetch('/api/store/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemTitle: buyingItem.title,
          buyerName,
          buyerEmail,
          amount: buyingItem.price,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar pedido.');
      setOrderMessage(`Pedido ${data.order.id} confirmado. Te enviaremos la documentación a ${buyerEmail}.`);
      setBuyerName('');
      setBuyerEmail('');
    } catch (err) {
      setOrderMessage(err instanceof Error ? err.message : 'No se pudo completar el pedido.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  if (page === 'servicios') {
    const filteredOffers = offers.filter((o) => {
      if (sectorFilter !== 'all' && o.sector !== sectorFilter) return false;
      if (verifiedOnly && !o.verified) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          o.title.toLowerCase().includes(q) ||
          o.summary.toLowerCase().includes(q) ||
          o.specialistName.toLowerCase().includes(q) ||
          o.city.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const filteredSpecs = specialists.filter((s) => sectorFilter === 'all' || s.sector === sectorFilter);

    return (
      <div className="pt-28 lg:pt-36 pb-20 bg-[#FAF8F5] min-h-screen">
        <div className="max-w-[1240px] mx-auto px-6 space-y-10">
          <div className="space-y-3 max-w-3xl">
            <p className="text-xs font-semibold tracking-wide text-[#C59B3B]">
              Catálogo SCP · Descuentos verificados de hasta el 25 %
            </p>
            <h1 className="font-editorial text-4xl font-semibold text-[#14284B]">
              Servicios y ofertas verificadas
            </h1>
            <p className="text-sm sm:text-base text-[#14284B]/75">
              Filtra por área de actividad o necesidad concreta. Cada oferta cuenta con tarifa cerrada, contrato modelo y especialista colegiado.
            </p>
          </div>

          {/* Barra de filtros */}
          <div className="bg-white border border-[#14284B]/12 rounded-xl p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSectorFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  sectorFilter === 'all' ? 'bg-[#14284B] text-white' : 'bg-[#FAF8F5] text-[#14284B] hover:bg-[#E5DFD5]'
                }`}
              >
                Todos
              </button>
              {SECTORS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSectorFilter(s.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    sectorFilter === s.id ? 'bg-[#14284B] text-white' : 'bg-[#FAF8F5] text-[#14284B] hover:bg-[#E5DFD5]'
                  }`}
                >
                  {s.shortName[lang]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 border border-[#14284B]/15 rounded-md px-3 py-2 bg-[#FAF8F5] min-w-[260px]">
              <Search className="w-4 h-4 text-[#C59B3B]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar por servicio o ciudad..."
                className="w-full text-xs text-[#14284B] bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Grid de ofertas */}
          {filteredOffers.length === 0 ? (
            <div className="bg-white border border-[#14284B]/12 rounded-xl p-10 text-center space-y-3">
              <p className="font-editorial text-2xl font-semibold text-[#14284B]">
                No encontramos ofertas exactas para «{query}»
              </p>
              <p className="text-sm text-[#14284B]/70">
                Puedes registrar una solicitud personalizada para que el equipo SCP busque al especialista adecuado.
              </p>
              <button
                type="button"
                onClick={() => onRequestServiceFromOffer(sectorFilter === 'all' ? 'tramites' : sectorFilter, query, 220)}
                className="px-5 py-2.5 rounded-md bg-[#14284B] text-white text-sm font-semibold cursor-pointer"
              >
                Registrar solicitud personalizada
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.map((offer) => {
                const sectorObj = SECTORS.find((s) => s.id === offer.sector);
                return (
                  <div
                    key={offer.id}
                    className="bg-white border border-[#14284B]/12 rounded-xl p-6 flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-[#C59B3B]">
                        {sectorObj?.shortName[lang]} · {offer.city} · {offer.modality}
                      </p>
                      <h3 className="font-editorial text-2xl font-semibold text-[#14284B] leading-snug">
                        {offer.title}
                      </h3>
                      <p className="text-sm text-[#14284B]/75 leading-relaxed">{offer.summary}</p>
                      <div className="pt-2 text-xs text-[#14284B]/70 space-y-1">
                        <p className="font-semibold text-[#14284B]">{offer.specialistName}</p>
                        <p className="font-mono text-[11px]">Acreditación: {offer.specialistLicense}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#14284B]/10 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-xs text-[#14284B]/50 line-through tabular-nums mr-2">
                            {offer.basePrice} €
                          </span>
                          <span className="font-mono text-xl font-semibold text-[#14284B] tabular-nums">
                            {offer.finalPrice} €
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#2E5A44] tabular-nums">
                          -{offer.discountPercent} % SCP
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRequestServiceFromOffer(offer.sector, offer.title, offer.basePrice)}
                        className="w-full py-2.5 px-4 rounded-md bg-[#14284B] hover:bg-[#1C3764] text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Solicitar con descuento SCP
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Especialistas validados del sector */}
          <div className="pt-6 space-y-4">
            <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">
              Especialistas validados en este ámbito ({filteredSpecs.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {filteredSpecs.map((sp) => (
                <div key={sp.id} className="bg-white border border-[#14284B]/12 rounded-lg p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#2E5A44] font-semibold">
                    <span>Validado SCP</span>
                    <span className="font-mono tabular-nums">-{sp.discountPercent} %</span>
                  </div>
                  <p className="font-editorial text-xl font-semibold text-[#14284B]">{sp.fullName}</p>
                  <p className="text-xs text-[#14284B]/75">{sp.specialty}</p>
                  <p className="font-mono text-[11px] text-[#14284B]/60">
                    Col.: {sp.licenseNumber} · {sp.city}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contratos modelo aplicables */}
          <div className="pt-6 space-y-4">
            <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">
              Contratos modelo y garantías aplicables
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-[#FAF8F5]/70 border border-[#14284B]/10 rounded-lg p-5 space-y-2">
                  <p className="text-xs font-semibold text-[#C59B3B]">
                    {doc.category} · {doc.code}
                  </p>
                  <p className="text-sm font-semibold text-[#14284B]">{doc.title}</p>
                  <p className="text-xs text-[#14284B]/70 leading-relaxed">{doc.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'conoce') {
    return (
      <div className="pt-28 lg:pt-36 pb-20 bg-[#FAF8F5] min-h-screen">
        <div className="max-w-[1040px] mx-auto px-6 space-y-12">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#C59B3B]">Conoce Servicios Canal Puente</p>
            <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#14284B]">
              Rigor institucional, mediación humana y transparencia económica
            </h1>
          </div>

          <div className="space-y-6">
            {CONOCE_SCP_SECTIONS.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                className="bg-white border border-[#14284B]/12 rounded-xl p-7 sm:p-9 space-y-3"
              >
                <p className="text-xs font-semibold tracking-wider text-[#C59B3B]">{sec.kicker}</p>
                <h2 className="font-editorial text-3xl font-semibold text-[#14284B]">{sec.title}</h2>
                <p className="text-base text-[#14284B]/80 leading-relaxed">{sec.body}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'comunica') {
    return (
      <div className="pt-28 lg:pt-36 pb-20 bg-[#FAF8F5] min-h-screen">
        <div className="max-w-[1140px] mx-auto px-6 space-y-10">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs font-semibold text-[#C59B3B]">SCP Comunica</p>
            <h1 className="font-editorial text-4xl font-semibold text-[#14284B]">
              Actualidad, guías prácticas y comunicados institucionales
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COMUNICA_ARTICLES.map((art) => (
              <article key={art.id} className="bg-white border border-[#14284B]/12 rounded-xl p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <p className="text-xs text-[#14284B]/60">
                    {art.category} · {art.date} · {art.readTime}
                  </p>
                  <h2 className="font-editorial text-2xl font-semibold text-[#14284B] leading-snug">{art.title}</h2>
                  <p className="text-sm text-[#14284B]/75 leading-relaxed">{art.excerpt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAuth('titular-form')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14284B] hover:text-[#C59B3B] cursor-pointer"
                >
                  <span>Consultar con un especialista SCP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'tienda') {
    return (
      <div className="pt-28 lg:pt-36 pb-20 bg-[#FAF8F5] min-h-screen">
        <div className="max-w-[1140px] mx-auto px-6 space-y-10">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs font-semibold text-[#C59B3B]">Tienda SCP</p>
            <h1 className="font-editorial text-4xl font-semibold text-[#14284B]">
              Packs documentales, bonos de diagnóstico y pases SCP Plus
            </h1>
            <p className="text-sm text-[#14284B]/75">
              Adquisición directa con tarifa cerrada SCP y confirmación inmediata en nuestra base de pedidos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STORE_ITEMS.map((item) => (
              <div key={item.id} className="bg-white border border-[#14284B]/12 rounded-xl p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-[#2E5A44]">{item.category}</p>
                  <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">{item.title}</h2>
                  <p className="text-sm text-[#14284B]/75 leading-relaxed">{item.description}</p>
                </div>
                <div className="pt-4 border-t border-[#14284B]/10 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs line-through text-[#14284B]/45 tabular-nums mr-2">
                        {item.regularPrice} €
                      </span>
                      <span className="font-mono text-2xl font-semibold text-[#14284B] tabular-nums">
                        {item.price} €
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#C59B3B]">Tarifa SCP</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyingItem(item);
                      setOrderMessage('');
                    }}
                    className="w-full py-2.5 px-4 rounded-md bg-[#14284B] hover:bg-[#1C3764] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#D7B45F]" />
                    <span>Solicitar pack</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {buyingItem && (
            <form onSubmit={handlePlaceOrder} className="bg-white border border-[#C59B3B] rounded-xl p-6 max-w-xl space-y-4">
              <h3 className="font-editorial text-2xl font-semibold text-[#14284B]">
                Confirmar solicitud: {buyingItem.title} ({buyingItem.price} €)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Nombre y apellidos"
                  className="px-3 py-2 text-sm border border-[#14284B]/20 rounded-md"
                />
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className="px-3 py-2 text-sm border border-[#14284B]/20 rounded-md"
                />
              </div>
              {orderMessage && <p className="text-xs font-medium text-[#2E5A44]">{orderMessage}</p>}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="px-5 py-2.5 rounded-md bg-[#14284B] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {orderSubmitting ? 'Registrando...' : 'Confirmar pedido SCP'}
                </button>
                <button
                  type="button"
                  onClick={() => setBuyingItem(null)}
                  className="px-4 py-2 text-xs text-[#14284B]/70 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (page === 'asociacion' || page === 'proteccion-animal') {
    return (
      <div className="pt-28 lg:pt-36 pb-20 bg-[#FAF8F5] min-h-screen">
        <div className="max-w-[1040px] mx-auto px-6 space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#2E5A44]">Compromiso social e institucional</p>
            <h1 className="font-editorial text-4xl font-semibold text-[#14284B]">
              {page === 'asociacion' ? 'Asociación Servicios Canal Puente' : 'Programa SCP de Protección Animal'}
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#14284B]/12 rounded-xl p-7 space-y-3">
              <HeartHandshake className="w-7 h-7 text-[#C59B3B]" />
              <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">Asociación SCP</h2>
              <p className="text-sm text-[#14284B]/75 leading-relaxed">
                Destinamos un porcentaje de cada expediente cerrado en la red a programas de orientación jurídica gratuita, alfabetización administrativa y mediación comunitaria para familias vulnerables.
              </p>
            </div>

            <div className="bg-white border border-[#2E5A44]/30 rounded-xl p-7 space-y-3">
              <PawPrint className="w-7 h-7 text-[#2E5A44]" />
              <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">Protección animal</h2>
              <p className="text-sm text-[#14284B]/75 leading-relaxed">
                Colaboramos con clínicas veterinarias adheridas y protectoras locales ofreciendo tarifas sociales en vacunación, esterilización responsable y asesoramiento de adopción.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'membresias') {
    return (
      <div className="pt-28 lg:pt-36 pb-20 bg-[#FAF8F5] min-h-screen">
        <div className="max-w-[1140px] mx-auto px-6 space-y-10">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs font-semibold text-[#C59B3B]">Membresías SCP</p>
            <h1 className="font-editorial text-4xl font-semibold text-[#14284B]">
              Planes de acceso para particulares, familias y especialistas
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Titular Estándar',
                audience: 'Para solicitudes puntuales',
                price: 'Gratuita',
                features: [
                  'Acceso a ofertas verificadas hasta 20 % dto.',
                  'Seguimiento completo en Mi Espacio',
                  'Custodia económica Caja Fuerte SCP',
                ],
                cta: 'Registrarme gratis',
                action: () => onOpenAuth('titular-form'),
              },
              {
                name: 'SCP Plus Familiar',
                audience: 'Para familias y uso frecuente',
                price: '95 €/año',
                features: [
                  'Descuento máximo de hasta el 25 % en todos los sectores',
                  'Prioridad en Agenda ES | AR y 2 revisiones documentales',
                  'Cobertura extensible a 4 miembros del hogar',
                ],
                cta: 'Activar con solicitud',
                action: () => onOpenAuth('titular-form'),
              },
              {
                name: 'Especialista Adherido',
                audience: 'Para profesionales colegiados',
                price: 'Según encargo',
                features: [
                  'Derivación de expedientes ya filtrados por SCP',
                  'Contratos modelo y gestión de agenda integrada',
                  'Cobro asegurado sin morosidad vía Caja Fuerte',
                ],
                cta: 'Ofrecer mis servicios',
                action: () => onOpenAuth('especialista-form'),
              },
            ].map((plan) => (
              <div key={plan.name} className="bg-white border border-[#14284B]/15 rounded-xl p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#C59B3B]">{plan.audience}</p>
                  <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">{plan.name}</h2>
                  <p className="font-mono text-2xl font-semibold text-[#14284B] tabular-nums">{plan.price}</p>
                  <ul className="space-y-2 pt-3 border-t border-[#14284B]/10 text-sm text-[#14284B]/80">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2E5A44] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={plan.action}
                  className="w-full py-2.5 px-4 rounded-md bg-[#14284B] hover:bg-[#1C3764] text-white text-xs font-semibold cursor-pointer"
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'agenda') {
    return (
      <div className="pt-28 lg:pt-36 pb-20 bg-[#FAF8F5] min-h-screen">
        <div className="max-w-[1040px] mx-auto px-6 space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#C59B3B]">Agenda SCP</p>
            <h1 className="font-editorial text-4xl font-semibold text-[#14284B]">
              Reserva de citas presenciales y videoconsultas bilingües
            </h1>
            <p className="text-sm text-[#14284B]/75">
              Para gestionar tus citas reales vinculadas a un expediente o reservar una nueva franja horaria con especialistas validados, accede a Mi Espacio.
            </p>
          </div>

          <div className="bg-white border border-[#14284B]/12 rounded-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2E5A44]">
                <Calendar className="w-4 h-4" />
                <span>Disponibilidad coordinada de lunes a viernes (09:00 – 20:00)</span>
              </div>
              <p className="font-editorial text-2xl font-semibold text-[#14284B]">
                Agenda privada en Mi Espacio o atención telefónica directa
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-5 py-2.5 rounded-md bg-[#14284B] text-white text-xs font-semibold cursor-pointer"
              >
                Abrir Agenda en Mi Espacio
              </button>
              <a
                href="https://wa.me/34673735059"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-md border border-[#C59B3B] bg-[#F8F1DF] text-[#14284B] text-xs font-semibold"
              >
                WhatsApp +34 673 735 059
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CONTACTO
  return (
    <div className="pt-28 lg:pt-36 pb-20 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-[1040px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-5">
          <p className="text-xs font-semibold text-[#C59B3B]">Atención directa ES | AR</p>
          <h1 className="font-editorial text-4xl font-semibold text-[#14284B]">Contacto institucional</h1>
          <p className="text-sm text-[#14284B]/75 leading-relaxed">
            Nuestro equipo de coordinación atiende consultas de titulares y solicitudes de adhesión de especialistas en español y árabe.
          </p>
          <div className="bg-white border border-[#14284B]/12 rounded-xl p-6 space-y-4 text-sm">
            <a
              href="https://wa.me/34673735059"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 font-semibold text-[#14284B] hover:text-[#C59B3B] tabular-nums"
            >
              <Phone className="w-4 h-4 text-[#C59B3B]" />
              <span>+34 673 735 059 (Teléfono y WhatsApp)</span>
            </a>
            <p className="flex items-center gap-2.5 text-[#14284B]/80">
              <ShieldCheck className="w-4 h-4 text-[#2E5A44]" />
              <span>atencion@canalpuente.es</span>
            </p>
            <p className="flex items-center gap-2.5 text-[#14284B]/80">
              <Sparkles className="w-4 h-4 text-[#C59B3B]" />
              <span>Paseo de la Castellana 95, Madrid · Atención online nacional</span>
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#14284B]/12 rounded-xl p-7">
          {contactSent ? (
            <div className="py-10 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#2E5A44] mx-auto" />
              <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">Consulta recibida</h2>
              <p className="text-sm text-[#14284B]/75">
                Un asesor de Servicios Canal Puente se pondrá en contacto contigo en menos de 24 horas hábiles.
              </p>
              <button
                type="button"
                onClick={() => setContactSent(false)}
                className="px-4 py-2 rounded-md border border-[#14284B]/20 text-xs font-semibold cursor-pointer"
              >
                Enviar otra consulta
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setContactSent(true);
                setContactName('');
                setContactPhone('');
                setContactMsg('');
              }}
              className="space-y-4"
            >
              <h2 className="font-editorial text-2xl font-semibold text-[#14284B]">Envíanos tu consulta</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14284B] mb-1">Nombre completo</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#14284B]/20 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14284B] mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#14284B]/20 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#14284B] mb-1">Mensaje o servicio requerido</label>
                <textarea
                  rows={4}
                  required
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#14284B]/20 rounded-md"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-md bg-[#14284B] hover:bg-[#1C3764] text-white text-sm font-semibold cursor-pointer"
              >
                Enviar mensaje
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
