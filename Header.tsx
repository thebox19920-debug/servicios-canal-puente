import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Menu, X, MessageCircle, ShieldCheck, UserCheck, Briefcase, LayoutDashboard } from 'lucide-react';
import { ScpLogo } from './ScpLogo';
import type { LanguageCode, SectorId, UserProfile } from '../types/scp';

export type PageRoute =
  | 'inicio'
  | 'servicios'
  | 'conoce'
  | 'comunica'
  | 'tienda'
  | 'asociacion'
  | 'proteccion-animal'
  | 'agenda'
  | 'contacto'
  | 'membresias'
  | 'espacio';

interface HeaderProps {
  currentPage: PageRoute;
  lang: LanguageCode;
  user: UserProfile | null;
  onNavigate: (page: PageRoute, options?: { sector?: SectorId | 'all'; anchor?: string; verifiedOnly?: boolean }) => void;
  onToggleLang: (lang: LanguageCode) => void;
  onOpenAuth: (mode: 'login' | 'reserved' | 'titular-form' | 'especialista-form') => void;
  onOpenAdminPanel: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  lang,
  user,
  onNavigate,
  onToggleLang,
  onOpenAuth,
  onOpenAdminPanel,
  onLogout,
}) => {
  const [openMenu, setOpenMenu] = useState<'servicios' | 'conoce' | 'asociacion' | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLink = (
    page: PageRoute,
    options?: { sector?: SectorId | 'all'; anchor?: string; verifiedOnly?: boolean }
  ) => {
    setOpenMenu(null);
    setMobileOpen(false);
    onNavigate(page, options);
  };

  return (
    <header
      ref={navRef}
      className="fixed top-0 inset-x-0 z-40 bg-white border-b border-[#E5DFD5]"
    >
      {/* Fila 1: Marca, Menú Principal, ES | AR, WhatsApp */}
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4 bg-white">
        {/* Logotipo SERVICIOS CANAL PUENTE · SCP */}
        <button
          type="button"
          onClick={() => handleLink('inicio')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B3B] rounded"
        >
          <ScpLogo size={34} />
          <span className="font-editorial text-[15px] sm:text-[16px] font-bold tracking-wide text-[#14284B]">
            SERVICIOS CANAL PUENTE · SCP
          </span>
        </button>

        {/* Menú de navegación escritorio */}
        <nav className="hidden xl:flex items-center gap-3.5 text-[11.5px] font-semibold tracking-wide text-[#14284B]/85">
          <button
            type="button"
            onClick={() => handleLink('inicio')}
            className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
              currentPage === 'inicio'
                ? 'border-[#C59B3B] text-[#14284B]'
                : 'border-transparent hover:text-[#14284B] hover:border-[#C59B3B]/45'
            }`}
          >
            INICIO
          </button>

          {/* SERVICIOS */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'servicios' ? null : 'servicios')}
              aria-expanded={openMenu === 'servicios'}
              className={`py-1 inline-flex items-center gap-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                currentPage === 'servicios'
                  ? 'border-[#C59B3B] text-[#14284B]'
                  : 'border-transparent hover:text-[#14284B]'
              }`}
            >
              <span>SERVICIOS</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
            {openMenu === 'servicios' && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-[#E5DFD5] shadow-lg rounded-lg py-2 z-50">
                <button
                  type="button"
                  onClick={() => handleLink('servicios', { sector: 'all' })}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-[#14284B] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Ver todos los servicios
                </button>
                <button
                  type="button"
                  onClick={() => handleLink('servicios', { sector: 'all', verifiedOnly: true })}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-[#2E5A44] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Ofertas verificadas (hasta 25 % dto.)
                </button>
                <div className="my-1 border-t border-[#E5DFD5]" />
                {[
                  { label: '01. Trámites y documentación administrativa', sector: 'tramites' as SectorId },
                  { label: '02. Salud y odontología', sector: 'salud' as SectorId },
                  { label: '03. Vivienda e inmobiliaria', sector: 'inmobiliaria' as SectorId },
                  { label: '04. Academia y formación (ES/CAT/AR/Darija/FP)', sector: 'academia' as SectorId },
                  { label: '05. Bienestar integral y acompañamiento', sector: 'bienestar' as SectorId },
                  { label: '06. Protección animal', sector: 'proteccion_animal' as SectorId },
                  { label: '07. Comunicación digital (SCP Comunica)', sector: 'comunicacion' as SectorId },
                  { label: '08. Asociación SCP y apoyo comunitario', sector: 'asociacion' as SectorId },
                ].map((item) => (
                  <button
                    key={item.sector}
                    type="button"
                    onClick={() => handleLink('servicios', { sector: item.sector })}
                    className="w-full text-left px-4 py-2 text-xs text-[#14284B]/85 hover:bg-[#FAF8F5] hover:text-[#14284B] cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CONOCE SCP */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'conoce' ? null : 'conoce')}
              aria-expanded={openMenu === 'conoce'}
              className={`py-1 inline-flex items-center gap-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                currentPage === 'conoce'
                  ? 'border-[#C59B3B] text-[#14284B]'
                  : 'border-transparent hover:text-[#14284B]'
              }`}
            >
              <span>CONOCE SCP</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
            {openMenu === 'conoce' && (
              <div className="absolute left-0 top-full mt-2 w-52 bg-white border border-[#E5DFD5] shadow-lg rounded-lg py-2 z-50">
                {[
                  { label: 'Introducción', anchor: 'introduccion' },
                  { label: 'Presentación', anchor: 'presentacion' },
                  { label: 'Quiénes somos', anchor: 'quienes-somos' },
                  { label: 'Nuestro valor', anchor: 'nuestro-valor' },
                ].map((item) => (
                  <button
                    key={item.anchor}
                    type="button"
                    onClick={() => handleLink('conoce', { anchor: item.anchor })}
                    className="w-full text-left px-4 py-2 text-xs text-[#14284B]/85 hover:bg-[#FAF8F5] hover:text-[#14284B] cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleLink('comunica')}
            className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
              currentPage === 'comunica'
                ? 'border-[#C59B3B] text-[#14284B]'
                : 'border-transparent hover:text-[#14284B]'
            }`}
          >
            SCP COMUNICA
          </button>

          <button
            type="button"
            onClick={() => handleLink('tienda')}
            className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
              currentPage === 'tienda'
                ? 'border-[#C59B3B] text-[#14284B]'
                : 'border-transparent hover:text-[#14284B]'
            }`}
          >
            TIENDA
          </button>

          {/* ASOCIACIÓN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'asociacion' ? null : 'asociacion')}
              aria-expanded={openMenu === 'asociacion'}
              className={`py-1 inline-flex items-center gap-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                currentPage === 'asociacion' || currentPage === 'proteccion-animal'
                  ? 'border-[#C59B3B] text-[#14284B]'
                  : 'border-transparent hover:text-[#14284B]'
              }`}
            >
              <span>ASOCIACIÓN</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
            {openMenu === 'asociacion' && (
              <div className="absolute left-0 top-full mt-2 w-52 bg-white border border-[#E5DFD5] shadow-lg rounded-lg py-2 z-50">
                <button
                  type="button"
                  onClick={() => handleLink('asociacion')}
                  className="w-full text-left px-4 py-2 text-xs text-[#14284B]/85 hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Asociación SCP
                </button>
                <button
                  type="button"
                  onClick={() => handleLink('proteccion-animal')}
                  className="w-full text-left px-4 py-2 text-xs text-[#2E5A44] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Protección animal
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleLink('agenda')}
            className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
              currentPage === 'agenda'
                ? 'border-[#C59B3B] text-[#14284B]'
                : 'border-transparent hover:text-[#14284B]'
            }`}
          >
            AGENDA
          </button>

          <button
            type="button"
            onClick={() => handleLink('contacto')}
            className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
              currentPage === 'contacto'
                ? 'border-[#C59B3B] text-[#14284B]'
                : 'border-transparent hover:text-[#14284B]'
            }`}
          >
            CONTACTO
          </button>
        </nav>

        {/* Idioma + WhatsApp + Membresías */}
        <div className="hidden lg:flex items-center gap-3 text-xs whitespace-nowrap shrink-0">
          <button
            type="button"
            onClick={() => handleLink('membresias')}
            className="font-medium text-[#14284B]/80 hover:text-[#14284B] transition-colors cursor-pointer"
          >
            Membresías
          </button>

          <a
            href="https://wa.me/34673735059"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2E5A44]/10 text-[#2E5A44] font-semibold hover:bg-[#2E5A44]/15 transition-colors tabular-nums"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>+34 673 735 059</span>
          </a>

          <div className="inline-flex items-center gap-1" role="group" aria-label="Selector de idioma">
            <button
              type="button"
              onClick={() => onToggleLang('es')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                lang === 'es'
                  ? 'bg-[#14284B] text-white font-semibold'
                  : 'text-[#14284B]/70 hover:text-[#14284B]'
              }`}
            >
              ES
            </button>
            <span className="text-[#E5DFD5]">|</span>
            <button
              type="button"
              onClick={() => onToggleLang('ar')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                lang === 'ar'
                  ? 'bg-[#14284B] text-white font-semibold'
                  : 'text-[#14284B]/70 hover:text-[#14284B]'
              }`}
            >
              AR
            </button>
          </div>
        </div>

        {/* Botón móvil */}
        <div className="flex xl:hidden items-center gap-2">
          {user && (
            <button
              type="button"
              onClick={() => handleLink('espacio')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded bg-[#14284B] text-white whitespace-nowrap"
            >
              Mi Espacio
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="p-2 rounded-md border border-[#E5DFD5] text-[#14284B] hover:bg-[#FAF8F5] cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Fila 2 fija (escritorio): Los 4 botones de acción principales siempre visibles */}
      <div className="hidden lg:block bg-[#FAF8F5] border-t border-[#E5DFD5]">
        <div className="max-w-[1380px] mx-auto px-6 h-11 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onOpenAuth('titular-form')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#14284B] text-white hover:bg-[#1C3764] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#C59B3B]" />
              <span>Registra tu servicio (Usuario Titular)</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth('especialista-form')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md border-[1.5px] border-[#C59B3B] bg-white text-[#14284B] hover:bg-[#FAF8F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#C59B3B]" />
              <span>Ofrece tus servicios (Usuario Especialista)</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => {
                if (user && user.role !== 'admin') {
                  handleLink('espacio');
                } else {
                  onOpenAuth('login');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md border border-[#14284B]/20 bg-white text-[#14284B] hover:border-[#14284B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#2E5A44]" />
              <span>
                {user && user.role !== 'admin'
                  ? `Mi Espacio · ${user.fullName.split(' ')[0]}`
                  : 'Mi Espacio (Acceso Usuarios)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpenMenu(null);
                onOpenAdminPanel();
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                user?.role === 'admin' && currentPage === 'espacio'
                  ? 'bg-[#C59B3B] text-[#14284B]'
                  : 'bg-[#2E5A44] text-white hover:bg-[#244736]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administración SCP</span>
            </button>

            {user && (
              <button
                type="button"
                onClick={onLogout}
                className="text-xs font-medium text-[#14284B]/65 hover:text-[#14284B] px-1.5 cursor-pointer"
              >
                Salir
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cajón móvil */}
      {mobileOpen && (
        <div className="xl:hidden bg-white border-t border-[#E5DFD5] max-h-[82vh] overflow-y-auto px-5 py-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5DFD5] text-xs">
            <a
              href="https://wa.me/34673735059"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#2E5A44] font-semibold"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp +34 673 735 059</span>
            </a>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onToggleLang('es')}
                className={`px-2 py-1 rounded ${lang === 'es' ? 'bg-[#14284B] text-white' : 'bg-[#FAF8F5]'}`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => onToggleLang('ar')}
                className={`px-2 py-1 rounded ${lang === 'ar' ? 'bg-[#14284B] text-white' : 'bg-[#FAF8F5]'}`}
              >
                AR
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm font-medium text-[#14284B]">
            <button type="button" onClick={() => handleLink('inicio')} className="text-left py-2">
              Inicio
            </button>
            <button type="button" onClick={() => handleLink('servicios', { sector: 'all' })} className="text-left py-2">
              Servicios
            </button>
            <button type="button" onClick={() => handleLink('conoce')} className="text-left py-2">
              Conoce SCP
            </button>
            <button type="button" onClick={() => handleLink('comunica')} className="text-left py-2">
              SCP Comunica
            </button>
            <button type="button" onClick={() => handleLink('tienda')} className="text-left py-2">
              Tienda
            </button>
            <button type="button" onClick={() => handleLink('asociacion')} className="text-left py-2">
              Asociación SCP
            </button>
            <button type="button" onClick={() => handleLink('proteccion-animal')} className="text-left py-2">
              Protección animal
            </button>
            <button type="button" onClick={() => handleLink('agenda')} className="text-left py-2">
              Agenda
            </button>
            <button type="button" onClick={() => handleLink('membresias')} className="text-left py-2">
              Membresías
            </button>
            <button type="button" onClick={() => handleLink('contacto')} className="text-left py-2">
              Contacto
            </button>
          </div>

          <div className="pt-3 border-t border-[#E5DFD5] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenAuth('titular-form');
              }}
              className="w-full py-2.5 px-4 rounded-md bg-[#14284B] text-white text-xs font-semibold"
            >
              Registra tu servicio (Usuario Titular)
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenAuth('especialista-form');
              }}
              className="w-full py-2.5 px-4 rounded-md border-[1.5px] border-[#C59B3B] bg-white text-[#14284B] text-xs font-semibold"
            >
              Ofrece tus servicios (Usuario Especialista)
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                if (user && user.role !== 'admin') handleLink('espacio');
                else onOpenAuth('login');
              }}
              className="w-full py-2.5 px-4 rounded-md border border-[#E5DFD5] bg-[#FAF8F5] text-[#14284B] text-xs font-semibold"
            >
              Mi Espacio (Acceso Usuarios)
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenAdminPanel();
              }}
              className="w-full py-2.5 px-4 rounded-md bg-[#2E5A44] text-white text-xs font-semibold"
            >
              Administración SCP
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
