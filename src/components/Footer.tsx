import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { ScpLogo } from './ScpLogo';
import type { PageRoute } from './Header';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
  onOpenLegal: (docKey: 'aviso' | 'privacidad' | 'cookies' | 'condiciones') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenLegal }) => {
  return (
    <footer className="bg-[#14284B] text-[#FAF8F5] border-t border-[#C59B3B]/30">
      <div className="max-w-[1240px] mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Identidad */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ScpLogo size={42} />
            <div>
              <p className="font-editorial text-xl font-semibold text-white">Servicios Canal Puente</p>
              <p className="text-xs text-[#D7B45F]">Intermediación verificada SCP</p>
            </div>
          </div>
          <p className="text-sm text-[#FAF8F5]/75 leading-relaxed">
            Encuentra el servicio que necesitas con el especialista adecuado. Descuentos verificados, acompañamiento ES | AR y custodia económica en Caja Fuerte SCP.
          </p>
        </div>

        {/* Navegación institucional */}
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-wider text-[#D7B45F]">Plataforma SCP</p>
          <ul className="space-y-2 text-sm text-[#FAF8F5]/80">
            <li>
              <button type="button" onClick={() => onNavigate('servicios')} className="hover:text-white cursor-pointer">
                Catálogo y ofertas verificadas
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('conoce')} className="hover:text-white cursor-pointer">
                Conoce SCP · Quiénes somos
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('membresias')} className="hover:text-white cursor-pointer">
                Membresías y ventajas
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('asociacion')} className="hover:text-white cursor-pointer">
                Asociación SCP y Protección animal
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('agenda')} className="hover:text-white cursor-pointer">
                Agenda de consultas
              </button>
            </li>
          </ul>
        </div>

        {/* Marco legal */}
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-wider text-[#D7B45F]">Garantía y marco legal</p>
          <ul className="space-y-2 text-sm text-[#FAF8F5]/80">
            <li>
              <button type="button" onClick={() => onOpenLegal('aviso')} className="hover:text-white cursor-pointer">
                Aviso Legal
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onOpenLegal('privacidad')} className="hover:text-white cursor-pointer">
                Política de Privacidad (RGPD)
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onOpenLegal('cookies')} className="hover:text-white cursor-pointer">
                Política de Cookies
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onOpenLegal('condiciones')} className="hover:text-white cursor-pointer">
                Condiciones Generales y Escudo Dual
              </button>
            </li>
          </ul>
        </div>

        {/* Contacto directo */}
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-wider text-[#D7B45F]">Atención directa ES | AR</p>
          <div className="space-y-2.5 text-sm text-[#FAF8F5]/85">
            <a
              href="https://wa.me/34673735059"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[#D7B45F] tabular-nums"
            >
              <Phone className="w-4 h-4 text-[#C59B3B]" />
              <span>+34 673 735 059 (Tel. y WhatsApp)</span>
            </a>
            <button
              type="button"
              onClick={() => onNavigate('contacto')}
              className="flex items-center gap-2 hover:text-[#D7B45F] cursor-pointer"
            >
              <Mail className="w-4 h-4 text-[#C59B3B]" />
              <span>atencion@canalpuente.es</span>
            </button>
            <p className="flex items-start gap-2 text-[#FAF8F5]/70 text-xs pt-1">
              <MapPin className="w-4 h-4 text-[#C59B3B] shrink-0 mt-0.5" />
              <span>Paseo de la Castellana 95, Madrid · Cobertura presencial y online en toda España</span>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#FAF8F5]/10">
        <div className="max-w-[1240px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#FAF8F5]/60">
          <p>© 2026 Servicios Canal Puente (SCP). Todos los derechos reservados.</p>
          <p>Validación colegial, Seguro de Responsabilidad Civil y Custodia Económica SCP.</p>
        </div>
      </div>
    </footer>
  );
};
